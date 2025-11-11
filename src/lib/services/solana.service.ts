/**
 * Solana Connection Service
 * Handles WebSocket and RPC connections for real-time monitoring and historical analysis
 * Designed for cyber forensics professionals
 */

import { Connection, PublicKey } from '@solana/web3.js';
import type { AccountInfo, ParsedAccountData, TransactionSignature } from '@solana/web3.js';
import { writable } from 'svelte/store';
import type {
	SolanaNetworkInfo,
	SolanaClusterInfo,
	SolanaTransactionDetails,
	SolanaAccount,
	MonitorCallbacks,
	ForensicsConfig
} from '../types';

export class SolanaService {
	private connection: Connection;
	private wsConnection: Connection;
	private isConnected: boolean = false;
	private subscriptions: Map<string, number> = new Map();
	private config: ForensicsConfig['solana'];
	private transactionCache: Map<string, SolanaTransactionDetails> = new Map(); // Cache for pattern detection
	private monitoredWalletAddress: string | null = null; // Currently monitored wallet address

	constructor(config: ForensicsConfig['solana']) {
		this.config = config;
		// Initialize connections lazily to avoid early connection attempts
		this.connection = null as any;
		this.wsConnection = null as any;
	}

	/**
	 * Initialize connection and verify network status
	 */
	async initialize(): Promise<boolean> {
		// Get monitoring config for timeouts
		const { ConfigService } = await import('./config.service');
		const configService = ConfigService.getInstance();
		const monitoringConfig = configService.getConfig().monitoring;

		// Use configured endpoints with fallbacks
		const rpcEndpoints = [
			this.config.rpcUrl, // Primary: Use configured URL (devnet)
			'https://api.devnet.solana.com', // Fallback 1: Devnet
			'https://api.mainnet-beta.solana.com' // Fallback 2: Mainnet
		];

		for (const endpoint of rpcEndpoints) {
			try {
				// Initialize connections with current endpoint
				this.connection = new Connection(endpoint, {
					commitment: this.config.commitment,
					confirmTransactionInitialTimeout: monitoringConfig.confirmTransactionTimeout
				});

				this.wsConnection = new Connection(endpoint, {
					commitment: this.config.commitment
				});

				// Test RPC connection with timeout
				await Promise.race([
					this.connection.getVersion(),
					new Promise((_, reject) =>
						setTimeout(
							() => reject(new Error('Connection timeout')),
							monitoringConfig.connectionTimeout
						)
					)
				]);

				// Test WebSocket connection with timeout
				await Promise.race([
					this.wsConnection.getSlot(),
					new Promise((_, reject) =>
						setTimeout(
							() => reject(new Error('WebSocket timeout')),
							monitoringConfig.connectionTimeout
						)
					)
				]);

				this.isConnected = true;
				return true;
			} catch (error) {
				continue;
			}
		}
		this.isConnected = false;
		return false;
	}

	/**
	 * Get network information and cluster status
	 */
	async getNetworkInfo(): Promise<SolanaNetworkInfo> {
		try {
			const version = await this.connection.getVersion();

			// Dynamically determine cluster by querying the endpoint
			const cluster = await this.determineClusterDynamic(this.config.rpcUrl);

			return {
				cluster,
				rpcUrl: this.config.rpcUrl,
				wsUrl: this.config.wsUrl,
				commitment: this.config.commitment,
				features: [],
				version: version['solana-core'] || 'unknown'
			};
		} catch (error) {
			throw new Error(`Failed to get network info: ${error}`);
		}
	}

	/**
	 * Determine cluster type based on RPC URL
	 */
	private determineCluster(rpcUrl: string): 'mainnet-beta' | 'testnet' | 'devnet' {
		// Handle local RPC endpoints first
		if (this.isLocalRpc(rpcUrl)) {
			// For local RPC, we need to determine the cluster by querying the endpoint
			// For now, we'll default to devnet for local development
			// TODO: Could be enhanced to actually query the endpoint to determine cluster
			return 'devnet';
		}

		// Handle remote endpoints
		if (rpcUrl.includes('devnet')) {
			return 'devnet';
		} else if (rpcUrl.includes('testnet')) {
			return 'testnet';
		} else if (rpcUrl.includes('mainnet') || rpcUrl.includes('api.mainnet-beta')) {
			return 'mainnet-beta';
		} else if (rpcUrl.includes('helius')) {
			// Helius URLs can be either mainnet or devnet, check the URL pattern
			return rpcUrl.includes('devnet') ? 'devnet' : 'mainnet-beta';
		} else {
			// Default fallback - try to determine from URL structure
			return 'mainnet-beta';
		}
	}

	/**
	 * Dynamically determine cluster by querying the RPC endpoint
	 */
	private async determineClusterDynamic(
		rpcUrl: string
	): Promise<'mainnet-beta' | 'testnet' | 'devnet'> {
		try {
			// Get monitoring config for timeout
			const { ConfigService } = await import('./config.service');
			const configService = ConfigService.getInstance();
			const monitoringConfig = configService.getConfig().monitoring;

			// Create a temporary connection to query the endpoint
			const tempConnection = new Connection(rpcUrl, {
				commitment: 'confirmed',
				confirmTransactionInitialTimeout: monitoringConfig.connectionTimeout
			});

			// Get genesis hash from the endpoint - this is the most reliable way
			const genesisHash = await tempConnection.getGenesisHash();

			// Map genesis hashes to cluster types
			switch (genesisHash) {
				case 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG': // Devnet
					return 'devnet';
				case '4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY': // Testnet
					return 'testnet';
				case '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d': // Mainnet-beta
					return 'mainnet-beta';
				default:
					// For unknown genesis hash, try to determine from network characteristics
					return await this.analyzeCustomNetwork(tempConnection, rpcUrl);
			}
		} catch (error) {
			// Fallback to URL-based detection
			return this.determineCluster(rpcUrl);
		}
	}

	/**
	 * Analyze custom network to determine cluster type
	 */
	private async analyzeCustomNetwork(
		connection: Connection,
		rpcUrl: string
	): Promise<'mainnet-beta' | 'testnet' | 'devnet'> {
		try {
			// Get network information to help determine cluster type
			const [version, epochInfo, supply] = await Promise.all([
				connection.getVersion(),
				connection.getEpochInfo(),
				connection.getSupply()
			]);

			// Analyze network characteristics
			const isLocalRpc = this.isLocalRpc(rpcUrl);
			const totalSupply = supply.value.total;
			const epoch = epochInfo.epoch;

			// Heuristics for custom networks:
			if (isLocalRpc) {
				// For local RPC, default to devnet unless we can determine otherwise
				return 'devnet';
			}

			// For remote custom networks, try to determine based on characteristics
			// This is a best-effort approach
			if (totalSupply > 500_000_000_000_000) {
				// Very high supply suggests mainnet-like
				return 'mainnet-beta';
			} else if (epoch > 1000) {
				// High epoch suggests mainnet-like
				return 'mainnet-beta';
			} else {
				// Default to devnet for custom networks
				return 'devnet';
			}
		} catch (error) {
			// Fallback to URL-based detection
			return this.determineCluster(rpcUrl);
		}
	}

	/**
	 * Check if the RPC URL is a local endpoint
	 */
	private isLocalRpc(rpcUrl: string): boolean {
		const localPatterns = [
			'localhost',
			'127.0.0.1',
			'192.168.',
			'10.0.',
			'172.',
			'::1', // IPv6 localhost
			'0.0.0.0'
		];

		return localPatterns.some((pattern) => rpcUrl.includes(pattern));
	}

	/**
	 * Get detailed cluster information
	 */
	async getClusterInfo(): Promise<SolanaClusterInfo> {
		try {
			const [epochInfo, supply] = await Promise.all([
				this.connection.getEpochInfo(),
				this.connection.getSupply()
			]);

			// Dynamically determine cluster by querying the endpoint
			const cluster = await this.determineClusterDynamic(this.config.rpcUrl);

			return {
				cluster,
				epochInfo: {
					epoch: epochInfo.epoch,
					slotIndex: epochInfo.slotIndex,
					slotsInEpoch: epochInfo.slotsInEpoch,
					absoluteSlot: epochInfo.absoluteSlot,
					blockHeight: epochInfo.blockHeight || 0,
					transactionCount: 0
				},
				inflation: {
					total: 0,
					validator: 0,
					foundation: 0,
					epoch: 0
				},
				stakeInfo: {
					active: 0,
					inactive: 0,
					activating: 0,
					deactivating: 0
				},
				supply: {
					total: supply.value.total,
					circulating: supply.value.circulating,
					nonCirculating: supply.value.nonCirculating,
					nonCirculatingAccounts: supply.value.nonCirculatingAccounts.map((addr) => addr.toString())
				}
			};
		} catch (error) {
			throw new Error(`Failed to get cluster info: ${error}`);
		}
	}

	/**
	 * Monitor account changes in real-time via WebSocket
	 */
	async monitorAccount(address: PublicKey, callbacks: MonitorCallbacks): Promise<string> {
		try {
			const subscriptionId = this.wsConnection.onAccountChange(
				address,
				(accountInfo: AccountInfo<any>, context) => {
					const account: SolanaAccount = {
						pubkey: address,
						account: accountInfo,
						executable: accountInfo.executable,
						lamports: accountInfo.lamports,
						owner: accountInfo.owner,
						rentEpoch: accountInfo.rentEpoch,
						space: accountInfo.data
							? typeof accountInfo.data === 'object' && 'length' in accountInfo.data
								? accountInfo.data.length
								: 0
							: 0,
						data: accountInfo.data
					};

					// Call the account change callback
					if (callbacks.onAccountChange) {
						callbacks.onAccountChange(account);
					}
				},
				this.config.commitment
			);

			// Store subscription for cleanup
			this.subscriptions.set(address.toString(), subscriptionId);

			return address.toString();
		} catch (error) {
			if (callbacks.onError) {
				callbacks.onError(error as Error);
			}
			throw new Error(`Failed to monitor account: ${error}`);
		}
	}

	/**
	 * Get transaction details by signature
	 */
	async getTransactionDetails(signature: TransactionSignature): Promise<SolanaTransactionDetails> {
		try {
			const transaction = await this.connection.getTransaction(signature, {
				commitment: this.config.commitment as any,
				maxSupportedTransactionVersion: 0
			});

			if (!transaction) {
				throw new Error('Transaction not found');
			}

			// Parse transaction details
			const details: SolanaTransactionDetails = {
				signature,
				slot: transaction.slot,
				blockTime: transaction.blockTime ?? null,
				fee: transaction.meta?.fee || 0,
				status: transaction.meta?.err ? 'failed' : 'success',
				computeUnitsConsumed: transaction.meta?.computeUnitsConsumed,
				logMessages: transaction.meta?.logMessages || [],
				accounts: [],
				instructions: [],
				tokenTransfers: [],
				balanceChanges: [],
				programLogs: []
			};

			// Process transaction accounts and balance changes
			if (
				transaction.transaction?.message &&
				transaction.meta?.preBalances &&
				transaction.meta?.postBalances
			) {
				// Handle both legacy and versioned transactions
				let accountKeys: PublicKey[] = [];

				try {
					// Try to get account keys using the proper method
					if (typeof transaction.transaction.message.getAccountKeys === 'function') {
						const messageAccountKeys = transaction.transaction.message.getAccountKeys();
						accountKeys = messageAccountKeys.keySegments().flat();
					} else if ('accountKeys' in transaction.transaction.message) {
						accountKeys = (transaction.transaction.message as any).accountKeys;
					}
				} catch (error) {
					// Failed to extract account keys, continue
				}

				if (accountKeys && accountKeys.length > 0) {
					for (let i = 0; i < accountKeys.length; i++) {
						const preBalance = transaction.meta.preBalances[i];
						const postBalance = transaction.meta.postBalances[i];

						if (preBalance !== postBalance) {
							details.balanceChanges.push({
								account: accountKeys[i].toString(),
								preBalance,
								postBalance,
								change: postBalance - preBalance
							});
						}
					}
				}
			}

			return details;
		} catch (error) {
			throw new Error(`Failed to get transaction details: ${error}`);
		}
	}

	/**
	 * Get recent transaction signatures for an account
	 */
	async getRecentTransactions(
		address: PublicKey,
		limit: number = 10
	): Promise<TransactionSignature[]> {
		try {
			const signatures = await this.connection.getConfirmedSignaturesForAddress2(address, {
				limit
			});
			return signatures.map((sig) => sig.signature);
		} catch (error) {
			throw new Error(`Failed to get recent transactions: ${error}`);
		}
	}

	/**
	 * Get account balance
	 */
	async getAccountBalance(address: PublicKey): Promise<number> {
		try {
			const balance = await this.connection.getBalance(address);
			return balance;
		} catch (error) {
			throw new Error(`Failed to get account balance: ${error}`);
		}
	}

	/**
	 * Get account info
	 */
	async getAccountInfo(address: PublicKey): Promise<AccountInfo<any> | null> {
		try {
			const accountInfo = await this.connection.getAccountInfo(address);
			return accountInfo;
		} catch (error) {
			throw new Error(`Failed to get account info: ${error}`);
		}
	}

	/**
	 * Stop monitoring an account
	 */
	async stopMonitoring(address: PublicKey): Promise<void> {
		const addressStr = address.toString();
		const subscriptionId = this.subscriptions.get(addressStr);

		if (subscriptionId) {
			await this.wsConnection.removeAccountChangeListener(subscriptionId);
			this.subscriptions.delete(addressStr);
		}
	}

	/**
	 * Stop all monitoring
	 */
	async stopAllMonitoring(): Promise<void> {
		// Clear the polling interval
		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
			this.monitoringInterval = null;
		}

		// Stop WebSocket subscriptions
		for (const [address, subscriptionId] of this.subscriptions) {
			if (subscriptionId && this.wsConnection) {
				await this.wsConnection.removeAccountChangeListener(subscriptionId);
			}
		}
		this.subscriptions.clear();
	}

	/**
	 * Check if service is connected
	 */
	isServiceConnected(): boolean {
		return this.isConnected;
	}

	/**
	 * Get current slot
	 */
	async getCurrentSlot(): Promise<number> {
		try {
			return await this.connection.getSlot();
		} catch (error) {
			throw new Error(`Failed to get current slot: ${error}`);
		}
	}

	/**
	 * Get block height
	 */
	async getBlockHeight(): Promise<number> {
		try {
			return await this.connection.getBlockHeight();
		} catch (error) {
			throw new Error(`Failed to get block height: ${error}`);
		}
	}

	/**
	 * Cleanup connections
	 */
	async cleanup(): Promise<void> {
		await this.stopAllMonitoring();
		this.isConnected = false;
		// Clear transaction cache
		this.transactionCache.clear();
	}

	// Store-based methods for UI components
	private alertsStore = writable<any[]>([]);
	private transactionsStore = writable<any[]>([]);
	private traceDataStore = writable<any>(null);

	// Getter methods for stores
	get alerts() {
		return this.alertsStore;
	}
	get transactions() {
		return this.transactionsStore;
	}
	get traceData() {
		return this.traceDataStore;
	}

	// Connect method for UI
	async connect(walletAddress?: string): Promise<boolean> {
		try {
			// Store wallet address if provided
			if (walletAddress) {
				this.monitoredWalletAddress = walletAddress;
			}

			// Just initialize the connection, don't require a valid wallet address
			const connected = await this.initialize();
			return connected;
		} catch (error) {
			console.error('Connection failed:', error);
			return false;
		}
	}

	// Start monitoring with validation rules
	async startMonitoring(rules: any): Promise<void> {
		// Initialize forensics and validation services
		const { getForensicsService } = await import('./index');
		const { getValidationService } = await import('./index');

		const forensicsService = getForensicsService();
		const validationService = getValidationService();

		// Store monitored wallet address from rules
		if (rules && rules.monitoredWallet) {
			this.monitoredWalletAddress = rules.monitoredWallet;
		} else if (rules && rules.walletAddress) {
			this.monitoredWalletAddress = rules.walletAddress;
		}

		// Start monitoring for transaction patterns
		this.startTransactionMonitoring(forensicsService, validationService, rules);

		// Initialize alerts store with empty array
		this.alertsStore.set([]);
		this.transactionsStore.set([]);
	}

	// Start real-time transaction monitoring
	private async startTransactionMonitoring(
		forensicsService: any,
		validationService: any,
		rules: any
	): Promise<void> {
		// Get the monitored wallet address from the validation rules, service, or stored value
		const monitoredWallet =
			(rules && rules.monitoredWallet) ||
			(rules && rules.walletAddress) ||
			this.monitoredWalletAddress ||
			null;

		if (!monitoredWallet) {
			throw new Error(
				'No monitored wallet address provided. Please set walletAddress in rules or call connect() with a wallet address.'
			);
		}

		try {
			// Start WebSocket monitoring for the specific wallet
			const publicKey = new PublicKey(monitoredWallet);

			// Get monitoring config for transaction limits
			const { ConfigService } = await import('./config.service');
			const configService = ConfigService.getInstance();
			const monitoringConfig = configService.getConfig().monitoring;

			const subscriptionId = await this.monitorAccount(publicKey, {
				onAccountChange: async (account: SolanaAccount) => {
					// Get recent transactions for analysis
					const recentTxs = await this.getRecentTransactions(
						publicKey,
						monitoringConfig.monitoringTransactionLimit
					);

					// Analyze each recent transaction with validation rules
					for (const txSignature of recentTxs) {
						try {
							const txDetails = await this.getTransactionDetails(txSignature);
							if (txDetails) {
								await this.analyzeTransactionWithRules(
									txDetails,
									validationService,
									forensicsService
								);
							}
						} catch (error: any) {
							// Skip transactions that don't exist instead of logging errors
							if (error?.message?.includes('Transaction not found')) {
								// Transaction may not be available yet, skip silently
								continue;
							}
							console.error('Error analyzing transaction:', error);
						}
					}
				},
				onError: (error: Error) => {
					console.error('WebSocket monitoring error:', error);
				}
			});

			// Also poll for recent transactions as backup
			await this.startPollingForTransactions(publicKey, validationService, forensicsService);
		} catch (error) {
			console.error('Failed to start WebSocket monitoring:', error);
			// Fallback to polling only
			await this.startPollingForTransactions(
				new PublicKey(monitoredWallet),
				validationService,
				forensicsService
			);
		}
	}

	// Backup polling method for transaction monitoring
	private async startPollingForTransactions(
		publicKey: PublicKey,
		validationService: any,
		forensicsService: any
	): Promise<void> {
		// Get monitoring config for polling settings
		const { ConfigService } = await import('./config.service');
		const configService = ConfigService.getInstance();
		const monitoringConfig = configService.getConfig().monitoring;

		const pollInterval = monitoringConfig.pollingInterval;

		const pollLoop = async () => {
			try {
				const recentTxs = await this.getRecentTransactions(
					publicKey,
					monitoringConfig.pollingTransactionLimit
				);

				for (const txSignature of recentTxs) {
					try {
						const txDetails = await this.getTransactionDetails(txSignature);
						if (txDetails) {
							await this.analyzeTransactionWithRules(txDetails, validationService, forensicsService);
						}
					} catch (error: any) {
						// Skip transactions that don't exist instead of logging errors
						if (error?.message?.includes('Transaction not found')) {
							// Transaction may not be available yet, skip silently
							continue;
						}
						console.error('Error in polling loop:', error);
					}
				}
			} catch (error) {
				console.error('Error in polling loop:', error);
			}
		};

		this.monitoringInterval = setInterval(pollLoop, pollInterval);
	}

	// Analyze transaction with validation rules and generate alerts
	private async analyzeTransactionWithRules(
		txDetails: SolanaTransactionDetails,
		validationService: any,
		forensicsService: any
	): Promise<void> {
		try {
			// Get monitoring config for cache and transaction limits
			const { ConfigService } = await import('./config.service');
			const configService = ConfigService.getInstance();
			const monitoringConfig = configService.getConfig().monitoring;

			// Add current transaction to cache
			this.transactionCache.set(txDetails.signature, txDetails);

			// Keep only configured number of transactions in cache (to prevent memory issues)
			if (this.transactionCache.size > monitoringConfig.transactionCacheSize) {
				const oldestKey = Array.from(this.transactionCache.keys())[0];
				if (oldestKey) {
					this.transactionCache.delete(oldestKey);
				}
			}

			// Get the sender from current transaction (for fan-out pattern detection)
			const senderAccount = txDetails.balanceChanges.find((bc) => bc.change < 0);
			const senderAddress = senderAccount?.account;

			// Get recent transactions for context using the monitored wallet
			// Use stored monitored wallet address, or fallback to sender if not set
			const monitoredWalletAddress = this.monitoredWalletAddress || senderAddress;
			if (!monitoredWalletAddress) {
				// If no monitored wallet and no sender, skip context building
				return;
			}

			const monitoredWallet = new PublicKey(monitoredWalletAddress);
			const recentTxSignatures = await this.getRecentTransactions(
				monitoredWallet,
				monitoringConfig.recentTransactionLimit
			);

			// Also get transactions from the sender's perspective (for fan-out detection)
			let senderTxSignatures: string[] = [];
			if (senderAddress) {
				try {
					const senderPubkey = new PublicKey(senderAddress);
					senderTxSignatures = await this.getRecentTransactions(
						senderPubkey,
						monitoringConfig.recentTransactionLimit
					);
				} catch (error) {
					// If sender address is invalid, skip silently
				}
			}

			// Combine and deduplicate transaction signatures
			const allTxSignatures = [...new Set([...recentTxSignatures, ...senderTxSignatures])];

			// Fetch full transaction details for recent transactions (needed for pattern detection)
			// Use cache first, then fetch if not in cache
			const recentTransactions: SolanaTransactionDetails[] = [];
			for (const txSig of allTxSignatures) {
				try {
					// Skip the current transaction to avoid duplicates
					if (txSig === txDetails.signature) continue;

					// Check cache first
					let txDetail = this.transactionCache.get(txSig);
					if (!txDetail) {
						// Fetch if not in cache
						txDetail = await this.getTransactionDetails(txSig);
						if (txDetail && txDetail.balanceChanges && txDetail.balanceChanges.length > 0) {
							// Add to cache
							this.transactionCache.set(txSig, txDetail);
						}
					}

					if (txDetail && txDetail.balanceChanges && txDetail.balanceChanges.length > 0) {
						recentTransactions.push(txDetail);
					}
				} catch (error: any) {
					// Skip if transaction fetch fails (transaction may not be available yet)
					if (!error?.message?.includes('Transaction not found')) {
						// Only log unexpected errors
						console.error(`Failed to fetch transaction details for ${txSig}:`, error);
					}
				}
			}

			// Also include cached transactions that might be relevant (for pattern detection across time)
			// Sort by slot number to get chronological order
			const cachedTransactions = Array.from(this.transactionCache.values())
				.filter((tx) => tx.signature !== txDetails.signature)
				.filter((tx) => tx.balanceChanges && tx.balanceChanges.length > 0)
				.sort((a, b) => (b.slot || 0) - (a.slot || 0))
				.slice(0, monitoringConfig.recentTransactionLimit); // Take last N from cache

			// Merge and deduplicate by signature, then sort by slot (most recent first)
			const allRecentTransactions = [...recentTransactions, ...cachedTransactions]
				.filter((tx, index, self) => index === self.findIndex((t) => t.signature === tx.signature))
				.sort((a, b) => (b.slot || 0) - (a.slot || 0))
				.slice(0, monitoringConfig.recentTransactionLimit); // Keep last N total for better pattern detection

			const context = {
				walletAddress: monitoredWalletAddress || senderAddress || 'Unknown',
				recentTransactions: allRecentTransactions, // Full transaction details with balanceChanges
				accountBalance: 0 // We don't have the account balance in this context
			};

			const violations = await validationService.validateTransaction(txDetails, context);

			// Create transaction object for the UI
			const fromAccount = txDetails.balanceChanges.find((bc) => bc.change < 0);
			const toAccount = txDetails.balanceChanges.find((bc) => bc.change > 0);

			// Calculate the actual transfer amount (excluding fees)
			const transferAmount = fromAccount ? Math.abs(fromAccount.change) : 0;

			const transaction = {
				id: `tx-${txDetails.signature}`,
				hash: txDetails.signature,
				timestamp: new Date(
					txDetails.blockTime && txDetails.blockTime > Date.now() / 1000 - 86400
						? txDetails.blockTime * 1000
						: Date.now()
				),
				type: this.determineTransactionType(txDetails),
				from: fromAccount?.account || 'Unknown',
				to: toAccount?.account || 'Unknown',
				amount: transferAmount / 1000000000, // Convert lamports to SOL
				token: 'SOL',
				status: 'confirmed' as const,
				blockHeight: txDetails.slot,
				fee: (txDetails.fee || 0) / 1000000000, // Convert lamports to SOL
				signature: txDetails.signature,
				evidence: {
					isSuspicious: violations.alerts.length > 0,
					riskScore:
						violations.alerts.length > 0 ? this.calculateRiskScore(violations.alerts[0]) : 0,
					flags: violations.alerts.map((alert: any) => {
						// Use alert title for pattern labels (contains rule name like "Fan-Out Pattern Detection")
						if (alert.title) {
							// Extract pattern name from title (e.g., "Fan-Out Pattern Detection" -> "Fan-Out Pattern")
							const title = alert.title;
							if (title.includes('Fan-Out')) return 'Fan-Out Pattern';
							if (title.includes('Circular')) return 'Circular Transfer';
							if (title.includes('Rapid')) return 'Rapid Movement';
							if (title.includes('Large Transfer') || title.includes('High-Value'))
								return 'High-Value Transfer';
							if (title.includes('Mixer')) return 'Mixer Detected';
							if (title.includes('Clustering')) return 'Wallet Clustering';
							// Fallback to first part of title
							return title.split(' - ')[0] || alert.type || 'Unknown Pattern';
						}
						// Fallback to alert type
						return alert.type || 'unknown';
					}),
					metadata: {
						balanceChanges: txDetails.balanceChanges,
						instructionCount: txDetails.instructions?.length || 0,
						blockTime: txDetails.blockTime
					}
				}
			};

			// Update transactions store
			this.transactionsStore.update((currentTransactions) => {
				// Avoid duplicates
				const existingIds = new Set(currentTransactions.map((tx: any) => tx.id));
				if (!existingIds.has(transaction.id)) {
					return [...currentTransactions, transaction];
				}
				return currentTransactions;
			});

			if (violations.alerts.length > 0) {
				// Use the alerts directly from the validation service
				const alerts = violations.alerts.map((alert: any) => {
					const riskScore = this.calculateRiskScore(alert);

					// Get the actual wallet addresses and amount from the transaction
					const fromAccount = txDetails.balanceChanges.find((bc) => bc.change < 0);
					const toAccount = txDetails.balanceChanges.find((bc) => bc.change > 0);
					const transferAmount = fromAccount ? Math.abs(fromAccount.change) : 0;

					return {
						...alert,
						id: `real-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
						timestamp: new Date(
							txDetails.blockTime && txDetails.blockTime > Date.now() / 1000 - 86400
								? txDetails.blockTime * 1000
								: Date.now()
						),
						wallet: fromAccount?.account || context.walletAddress || 'Unknown',
						amount: transferAmount / 1000000000, // Convert lamports to SOL
						riskScore,
						status: 'active',
						transactionSignature: txDetails.signature,
						fromAddress: fromAccount?.account || 'Unknown',
						toAddress: toAccount?.account || 'Unknown'
					};
				});

				// Update alerts store with real detections
				this.alertsStore.update((currentAlerts) => {
					// Avoid duplicates
					const existingIds = new Set(currentAlerts.map((a: any) => a.id));
					const newAlerts = alerts.filter((a: any) => !existingIds.has(a.id));
					return [...currentAlerts, ...newAlerts];
				});
			}
		} catch (error) {
			console.error('Error analyzing transaction with rules:', error);
		}
	}

	private calculateRiskScore(alert: any): number {
		const severityScores: { [key: string]: number } = {
			low: 25,
			warning: 40,
			medium: 60,
			high: 80,
			critical: 95,
			emergency: 100
		};
		// Alert has severity directly on it from validation service
		return severityScores[alert.severity] || 50;
	}

	private determineTransactionType(
		txDetails: SolanaTransactionDetails
	): 'transfer' | 'swap' | 'stake' | 'unstake' | 'unknown' {
		// Analyze balance changes to determine transaction type
		const balanceChangeCount = txDetails.balanceChanges.length;
		const instructionCount = txDetails.instructions?.length || 0;

		// Check for simple SOL transfer (2 accounts with opposite balance changes)
		if (balanceChangeCount === 2) {
			const changes = txDetails.balanceChanges.map((bc) => bc.change);
			const hasNegative = changes.some((change) => change < 0);
			const hasPositive = changes.some((change) => change > 0);

			if (hasNegative && hasPositive) {
				return 'transfer';
			}
		}

		// Check for complex transactions with multiple balance changes
		if (balanceChangeCount > 2) {
			// If it has many balance changes, might be a swap or complex transfer
			if (balanceChangeCount > 4) {
				return 'swap';
			}

			// If it has multiple instructions, might be staking
			if (instructionCount > 2) {
				return 'stake';
			}

			// Default to transfer for multi-account transactions
			return 'transfer';
		}

		// Single balance change might be staking/unstaking
		if (balanceChangeCount === 1 && instructionCount > 1) {
			return 'stake';
		}

		return 'unknown';
	}

	private monitoringInterval: NodeJS.Timeout | null = null;

	// Disconnect method
	disconnect(): void {
		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
			this.monitoringInterval = null;
		}
		this.cleanup();
	}

	// Start trace method
	async startTrace(
		transactionHash: string,
		mode: 'auto' | 'chain' | 'multihop' = 'auto'
	): Promise<void> {
		if (!this.isConnected) {
			throw new Error('Not connected to Solana network');
		}

		try {
			// Get transaction details
			const transactionDetails = await this.getTransactionDetails(transactionHash);
			if (!transactionDetails) {
				throw new Error('Transaction not found');
			}

			// Initialize tracing service
			const { TracingService } = await import('./tracing.service');
			const tracingService = new TracingService();

			// Start flow analysis based on selected mode
			let flow;
			if (mode === 'chain') {
				flow = await tracingService.traceChainFlow(
					transactionDetails,
					3, // max depth
					{
						solanaService: this,
						monitoredWallets: [] // TODO: Get from monitoring service
					}
				);
			} else if (mode === 'multihop') {
				flow = await tracingService.traceMultiHopFlow(transactionDetails, {
					solanaService: this,
					monitoredWallets: [] // TODO: Get from monitoring service
				});
			} else {
				// Auto mode - let the service decide
				flow = await tracingService.traceTransactionFlow(
					transactionDetails,
					3, // max depth
					{
						solanaService: this,
						monitoredWallets: [] // TODO: Get from monitoring service
					}
				);
			}

			// Transform flow data to trace path format
			const tracePath = [];

			// Create trace path from edges (actual flow) rather than just nodes
			if (flow.edges.length > 0) {
				// Sort edges by timestamp to get chronological order
				const sortedEdges = flow.edges.sort((a, b) => a.timestamp - b.timestamp);

				// Create trace path entries for each edge (representing the flow)
				for (let i = 0; i < sortedEdges.length; i++) {
					const edge = sortedEdges[i];

					// Create entry for the sender (from node)
					const fromNode = flow.nodes.find((n) => n.address === edge.from);
					tracePath.push({
						id: `${edge.from}_${i}`,
						address: edge.from,
						type: fromNode?.type || 'wallet',
						amount: edge.amount / 1000000000, // Convert lamports to SOL
						timestamp: new Date(
							edge.timestamp > Date.now() / 1000 - 86400 ? edge.timestamp * 1000 : Date.now()
						),
						transactionHash: edge.transactionId,
						riskScore: fromNode?.riskScore || 50,
						direction: 'send',
						metadata: fromNode?.metadata || {
							isKnown: false,
							isExchange: false,
							isMixer: false,
							firstSeen: new Date(edge.timestamp * 1000).toISOString(),
							lastSeen: new Date(edge.timestamp * 1000).toISOString(),
							labels: ['solana-address']
						}
					});

					// Create entry for the receiver (to node)
					const toNode = flow.nodes.find((n) => n.address === edge.to);
					tracePath.push({
						id: `${edge.to}_${i}`,
						address: edge.to,
						type: toNode?.type || 'wallet',
						amount: edge.amount / 1000000000, // Convert lamports to SOL
						timestamp: new Date(
							edge.timestamp > Date.now() / 1000 - 86400
								? edge.timestamp * 1000 + 1000
								: Date.now() + 1000
						), // Slightly later to show flow
						transactionHash: edge.transactionId,
						riskScore: toNode?.riskScore || 50,
						direction: 'receive',
						metadata: toNode?.metadata || {
							isKnown: false,
							isExchange: false,
							isMixer: false,
							firstSeen: new Date(edge.timestamp * 1000).toISOString(),
							lastSeen: new Date(edge.timestamp * 1000).toISOString(),
							labels: ['solana-address']
						}
					});
				}
			} else {
				// Fallback: use nodes if no edges
				tracePath.push(
					...flow.nodes.map((node, index) => {
						// Determine direction based on balance changes
						const balanceChange = transactionDetails.balanceChanges.find(
							(bc) => bc.account === node.address
						);
						const direction = balanceChange && balanceChange.change < 0 ? 'send' : 'receive';

						return {
							id: node.id,
							address: node.address,
							type: node.type as 'wallet' | 'exchange' | 'mixer' | 'unknown',
							amount:
								(Math.max(
									...flow.edges
										.filter((e) => e.from === node.address || e.to === node.address)
										.map((e) => e.amount)
								) || 0) / 1000000000, // Convert to SOL
							timestamp: new Date(
								transactionDetails.blockTime ? transactionDetails.blockTime * 1000 : Date.now()
							),
							transactionHash: transactionDetails.signature,
							riskScore: node.riskScore,
							direction: direction,
							metadata: node.metadata
						};
					})
				);
			}

			// Update trace data store
			this.traceData.set({
				id: flow.id,
				startTransaction: transactionDetails.signature,
				endTransaction: tracePath[tracePath.length - 1]?.address || transactionDetails.signature,
				totalAmount: flow.analysis.totalValue, // Already converted to SOL
				totalTransactions: flow.analysis.hopCount,
				duration: flow.analysis.hopCount * 30, // Estimate duration based on hop count (seconds)
				path: tracePath,
				riskAssessment: {
					overallRisk: flow.analysis.riskAssessment.overall,
					mixerInvolved: flow.analysis.riskAssessment.factors.mixer > 50,
					suspiciousPatterns: flow.analysis.suspiciousPatterns,
					evidence: flow.analysis.recommendations
				},
				createdAt: new Date().toISOString()
			});
		} catch (error) {
			console.error('Failed to start trace:', error);
			throw error;
		}
	}
}
