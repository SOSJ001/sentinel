/**
 * Transaction Tracing Service
 * Analyzes transaction flows and identifies suspicious patterns
 * Designed for cyber forensics professionals
 */

import type {
	TransactionFlow,
	FlowNode,
	FlowEdge,
	FlowAnalysis,
	RiskAssessment,
	SolanaTransactionDetails,
	MonitoredWallet
} from '../types';
import { ConfigService } from './config.service';

export class TracingService {
	private flowCache: Map<string, TransactionFlow> = new Map();
	private nodeRegistry: Map<string, FlowNode> = new Map();
	private knownExchanges: Set<string> = new Set();
	private knownMixers: Set<string> = new Set();

	constructor() {
		this.initializeKnownEntities();
	}

	/**
	 * Initialize known exchanges and mixers for risk assessment
	 */
	private initializeKnownEntities(): void {
		// Known Solana exchanges (simplified list)
		this.knownExchanges.add('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'); // FTX (historical)
		this.knownExchanges.add('So11111111111111111111111111111111111111112'); // Wrapped SOL

		// Known mixers (example addresses - would need real data)
		this.knownMixers.add('MixerAddress1'); // Placeholder
		this.knownMixers.add('MixerAddress2'); // Placeholder
	}

	/**
	 * Trace transaction flow from a root transaction (Legacy method - now routes to appropriate tracer)
	 */
	async traceTransactionFlow(
		rootTransaction: SolanaTransactionDetails,
		maxDepth: number = 3,
		context: {
			solanaService: any; // SolanaService instance
			monitoredWallets: MonitoredWallet[];
		}
	): Promise<TransactionFlow> {
		// Auto-detect tracing type based on transaction complexity
		const isComplexTransaction = this.detectComplexTransaction(rootTransaction);

		if (isComplexTransaction) {
			return this.traceMultiHopFlow(rootTransaction, context);
		} else {
			return this.traceChainFlow(rootTransaction, maxDepth, context);
		}
	}

	/**
	 * Chain-of-Transactions Tracing
	 * Follows separate transactions over time (for money laundering scenarios)
	 */
	async traceChainFlow(
		rootTransaction: SolanaTransactionDetails,
		maxDepth: number = 3,
		context: {
			solanaService: any;
			monitoredWallets: MonitoredWallet[];
		}
	): Promise<TransactionFlow> {
		const flowId = `chain_${rootTransaction.signature}_${Date.now()}`;
		const nodes: FlowNode[] = [];
		const edges: FlowEdge[] = [];
		const visited = new Set<string>();

		// Start with root transaction
		await this.buildChainFlow(rootTransaction, nodes, edges, visited, 0, maxDepth, context);

		// Analyze the flow
		const analysis = this.analyzeFlow(nodes, edges, rootTransaction);

		const flow: TransactionFlow = {
			id: flowId,
			rootTransaction: rootTransaction.signature,
			depth: maxDepth,
			nodes,
			edges,
			analysis,
			metadata: {
				analyzedAt: new Date().toISOString(),
				analyzer: 'chain-tracing-service',
				notes: `Chain tracing for transaction ${rootTransaction.signature}`
			}
		};

		// Cache the flow
		this.flowCache.set(flowId, flow);

		return flow;
	}

	/**
	 * Multi-hop Tracing
	 * Analyzes complex transactions with multiple hops within a single transaction
	 */
	async traceMultiHopFlow(
		rootTransaction: SolanaTransactionDetails,
		context: {
			solanaService: any;
			monitoredWallets: MonitoredWallet[];
		}
	): Promise<TransactionFlow> {
		const flowId = `multihop_${rootTransaction.signature}_${Date.now()}`;
		const nodes: FlowNode[] = [];
		const edges: FlowEdge[] = [];

		// Analyze the single transaction for complex flows
		await this.buildMultiHopFlow(rootTransaction, nodes, edges, context);

		// Analyze the flow
		const analysis = this.analyzeFlow(nodes, edges, rootTransaction);

		const flow: TransactionFlow = {
			id: flowId,
			rootTransaction: rootTransaction.signature,
			depth: 1, // Single transaction
			nodes,
			edges,
			analysis,
			metadata: {
				analyzedAt: new Date().toISOString(),
				analyzer: 'multihop-tracing-service',
				notes: `Multi-hop analysis for transaction ${rootTransaction.signature}`
			}
		};

		// Cache the flow
		this.flowCache.set(flowId, flow);

		return flow;
	}

	/**
	 * Detect if transaction is complex (multi-hop) or simple (chain)
	 */
	private detectComplexTransaction(transaction: SolanaTransactionDetails): boolean {
		// Complex transaction indicators:
		// 1. Multiple instructions
		// 2. Many accounts involved
		// 3. Program interactions beyond simple transfers

		const hasMultipleInstructions = transaction.instructions.length > 2;
		const hasManyAccounts = transaction.accounts.length > 10;
		const hasProgramInteractions = transaction.instructions.some(
			(ix) => ix.programId !== '11111111111111111111111111111111' // Not just system program
		);

		return hasMultipleInstructions || hasManyAccounts || hasProgramInteractions;
	}

	/**
	 * Build chain flow (follows separate transactions over time)
	 */
	private async buildChainFlow(
		transaction: SolanaTransactionDetails,
		nodes: FlowNode[],
		edges: FlowEdge[],
		visited: Set<string>,
		currentDepth: number,
		maxDepth: number,
		context: any
	): Promise<void> {
		if (currentDepth >= maxDepth || visited.has(transaction.signature)) {
			return;
		}

		visited.add(transaction.signature);

		// Process balance changes to create nodes and edges
		const positiveChanges = transaction.balanceChanges.filter((bc) => bc.change > 0);
		const negativeChanges = transaction.balanceChanges.filter((bc) => bc.change < 0);

		// Create nodes for all addresses involved
		for (const balanceChange of transaction.balanceChanges) {
			const node = this.getOrCreateNode(balanceChange.account, context);
			if (!nodes.find((n) => n.address === node.address)) {
				nodes.push(node);
			}
		}

		// Create edges representing actual transfers between addresses
		for (const negativeChange of negativeChanges) {
			for (const positiveChange of positiveChanges) {
				if (Math.abs(negativeChange.change) > 1000000) {
					// > 0.001 SOL
					const edge: FlowEdge = {
						from: negativeChange.account,
						to: positiveChange.account,
						amount: Math.abs(negativeChange.change),
						token: 'SOL',
						transactionId: transaction.signature,
						timestamp: transaction.blockTime || Date.now() / 1000,
						riskScore: this.calculateEdgeRiskScore(negativeChange, transaction)
					};

					edges.push(edge);
					break; // One transfer per negative change
				}
			}
		}

		// Get related transactions for deeper chain tracing
		if (currentDepth < maxDepth - 1) {
			try {
				const relatedTransactions = await this.getRelatedTransactions(
					transaction,
					context.solanaService
				);

				// Process each related transaction to build the full chain
				for (const relatedTx of relatedTransactions) {
					await this.buildChainFlow(
						relatedTx,
						nodes,
						edges,
						visited,
						currentDepth + 1,
						maxDepth,
						context
					);
				}
			} catch (error) {
				// Continue with current depth if related transactions fail
			}
		}
	}

	/**
	 * Build multi-hop flow (analyzes complex transactions)
	 */
	private async buildMultiHopFlow(
		transaction: SolanaTransactionDetails,
		nodes: FlowNode[],
		edges: FlowEdge[],
		context: any
	): Promise<void> {
		// Create nodes for all accounts involved
		for (const account of transaction.accounts) {
			const node = this.getOrCreateNode(account, context);
			if (!nodes.find((n) => n.address === node.address)) {
				nodes.push(node);
			}
		}

		// Analyze each instruction for hops
		for (let i = 0; i < transaction.instructions.length; i++) {
			const instruction = transaction.instructions[i];

			// Create edges based on instruction type and account interactions
			if (instruction.accounts.length >= 2) {
				const fromAccount = instruction.accounts[0]; // Typically the sender
				const toAccount = instruction.accounts[1]; // Typically the receiver

				// Calculate amount from balance changes
				const fromBalanceChange = transaction.balanceChanges.find(
					(bc) => bc.account === fromAccount
				);
				const toBalanceChange = transaction.balanceChanges.find((bc) => bc.account === toAccount);

				if (
					fromBalanceChange &&
					toBalanceChange &&
					fromBalanceChange.change < 0 &&
					toBalanceChange.change > 0
				) {
					const edge: FlowEdge = {
						from: fromAccount,
						to: toAccount,
						amount: Math.abs(fromBalanceChange.change),
						token: 'SOL',
						transactionId: transaction.signature,
						timestamp: transaction.blockTime || Date.now() / 1000,
						riskScore: this.calculateEdgeRiskScore(fromBalanceChange, transaction)
					};

					edges.push(edge);
				}
			}
		}
	}

	/**
	 * Recursively build transaction flow (Legacy method - now calls buildChainFlow)
	 */
	private async buildFlowRecursive(
		transaction: SolanaTransactionDetails,
		nodes: FlowNode[],
		edges: FlowEdge[],
		visited: Set<string>,
		currentDepth: number,
		maxDepth: number,
		context: any
	): Promise<void> {
		// Delegate to the new chain flow method
		await this.buildChainFlow(transaction, nodes, edges, visited, currentDepth, maxDepth, context);
	}

	/**
	 * Get related transactions for deeper tracing
	 */
	private async getRelatedTransactions(
		transaction: SolanaTransactionDetails,
		solanaService: any
	): Promise<SolanaTransactionDetails[]> {
		const relatedTransactions: SolanaTransactionDetails[] = [];

		// Get thresholds config
		const configService = ConfigService.getInstance();
		const thresholds = configService.getConfig().thresholds || {
			minimumTransferThreshold: 1000000
		};

		// Get transactions that happened AFTER this one for accounts that received funds
		const receivingAccounts = transaction.balanceChanges.filter((bc) => bc.change > thresholds.minimumTransferThreshold);

		for (const balanceChange of receivingAccounts) {
			try {
				// Convert string address to PublicKey
				const publicKey = new (await import('@solana/web3.js')).PublicKey(balanceChange.account);

				// Get transaction signatures for this account
				const recentTxSignatures = await solanaService.getRecentTransactions(publicKey, 15);

				// Get full transaction details for each signature
				for (const txSignature of recentTxSignatures) {
					try {
						const txDetails = await solanaService.getTransactionDetails(txSignature);
						if (txDetails && txDetails.signature !== transaction.signature) {
							// Check if this transaction happened after our current one
							// Use slot number as a more reliable ordering mechanism
							const isAfterCurrent = txDetails.slot > transaction.slot;

							if (isAfterCurrent) {
								relatedTransactions.push(txDetails);
							}
						}
					} catch (error) {
						// Skip if individual transaction fetch fails
					}
				}
			} catch (error) {
				// Continue if individual account lookup fails
			}
		}

		// Remove duplicates and sort by slot number
		const uniqueTxs = relatedTransactions
			.filter((tx, index, self) => index === self.findIndex((t) => t.signature === tx.signature))
			.sort((a, b) => a.slot - b.slot)
			.slice(0, 3); // Limit to 3 related transactions

		return uniqueTxs;
	}

	/**
	 * Get or create a flow node
	 */
	private getOrCreateNode(address: string, context: any): FlowNode {
		if (this.nodeRegistry.has(address)) {
			return this.nodeRegistry.get(address)!;
		}

		const node: FlowNode = {
			id: address,
			address,
			type: this.determineNodeType(address),
			balance: 0, // Would need to fetch actual balance
			transactionCount: 1,
			riskScore: this.calculateNodeRiskScore(address),
			metadata: {
				isKnown: this.knownExchanges.has(address) || this.knownMixers.has(address),
				isExchange: this.knownExchanges.has(address),
				isMixer: this.knownMixers.has(address),
				firstSeen: new Date().toISOString(),
				lastSeen: new Date().toISOString(),
				labels: this.generateNodeLabels(address)
			}
		};

		this.nodeRegistry.set(address, node);
		return node;
	}

	/**
	 * Determine node type based on address characteristics
	 */
	private determineNodeType(address: string): 'wallet' | 'program' | 'token' | 'unknown' {
		// Simplified logic - in reality would need more sophisticated analysis
		if (this.knownExchanges.has(address)) return 'wallet';
		if (this.knownMixers.has(address)) return 'wallet';
		return 'wallet';
	}

	/**
	 * Calculate risk score for a node
	 */
	private calculateNodeRiskScore(address: string): number {
		let score = 0;

		// Known exchanges are lower risk
		if (this.knownExchanges.has(address)) {
			score += 10;
		}
		// Known mixers are higher risk
		else if (this.knownMixers.has(address)) {
			score += 80;
		}
		// Unknown addresses are medium risk
		else {
			score += 50;
		}

		return Math.min(score, 100);
	}

	/**
	 * Calculate risk score for an edge
	 */
	private calculateEdgeRiskScore(
		balanceChange: any,
		transaction: SolanaTransactionDetails
	): number {
		let score = 0;

		// Get thresholds config
		const configService = ConfigService.getInstance();
		const thresholds = configService.getConfig().thresholds || {
			largeTransferThreshold: 100000000000
		};

		// Large amounts are higher risk
		if (Math.abs(balanceChange.change) > thresholds.largeTransferThreshold) {
			score += 40;
		}

		// Failed transactions are higher risk
		if (transaction.status === 'failed') {
			score += 30;
		}

		// High fees are suspicious
		if (transaction.fee > 1000000) {
			// > 0.001 SOL
			score += 20;
		}

		return Math.min(score, 100);
	}

	/**
	 * Generate labels for a node
	 */
	private generateNodeLabels(address: string): string[] {
		const labels: string[] = [];

		if (this.knownExchanges.has(address)) {
			labels.push('exchange');
		}
		if (this.knownMixers.has(address)) {
			labels.push('mixer');
		}
		if (address.length === 44) {
			// Standard Solana address length
			labels.push('solana-address');
		}

		return labels;
	}

	/**
	 * Analyze transaction flow for suspicious patterns
	 */
	private analyzeFlow(
		nodes: FlowNode[],
		edges: FlowEdge[],
		rootTransaction: SolanaTransactionDetails
	): FlowAnalysis {
		// Convert total value from lamports to SOL
		const totalValueLamports = edges.reduce((sum, edge) => sum + edge.amount, 0);
		const totalValue = totalValueLamports / 1000000000; // Convert to SOL

		const hopCount = this.calculateHopCount(nodes, edges);
		const suspiciousPatterns = this.detectSuspiciousPatterns(nodes, edges);
		const riskAssessment = this.assessOverallRisk(nodes, edges, suspiciousPatterns);
		const recommendations = this.generateRecommendations(riskAssessment, suspiciousPatterns);

		return {
			totalValue,
			hopCount,
			suspiciousPatterns,
			riskAssessment,
			recommendations
		};
	}

	/**
	 * Calculate number of hops in the flow
	 */
	private calculateHopCount(nodes: FlowNode[], edges: FlowEdge[]): number {
		// Simplified hop count calculation
		return Math.max(1, edges.length);
	}

	/**
	 * Detect suspicious patterns in the flow
	 */
	private detectSuspiciousPatterns(nodes: FlowNode[], edges: FlowEdge[]): string[] {
		const patterns: string[] = [];

		// Check for mixer usage
		const mixerNodes = nodes.filter((node) => node.metadata.isMixer);
		if (mixerNodes.length > 0) {
			patterns.push('mixer_usage');
		}

		// Check for rapid movement
		const timestamps = edges.map((edge) => edge.timestamp).sort();
		const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
		if (timeSpan < 300 && edges.length > 3) {
			// 5 minutes, 3+ transactions
			patterns.push('rapid_movement');
		}

		// Check for high-risk nodes
		const highRiskNodes = nodes.filter((node) => node.riskScore > 70);
		if (highRiskNodes.length > 0) {
			patterns.push('high_risk_nodes');
		}

		// Get thresholds config
		const configService = ConfigService.getInstance();
		const thresholds = configService.getConfig().thresholds || {
			largeTransferThreshold: 100000000000
		};

		// Check for large amounts
		const largeTransfers = edges.filter((edge) => edge.amount > thresholds.largeTransferThreshold);
		if (largeTransfers.length > 0) {
			patterns.push('large_transfers');
		}

		return patterns;
	}

	/**
	 * Assess overall risk of the flow
	 */
	private assessOverallRisk(
		nodes: FlowNode[],
		edges: FlowEdge[],
		patterns: string[]
	): RiskAssessment {
		const mixerRisk = patterns.includes('mixer_usage') ? 90 : 0;
		const velocityRisk = patterns.includes('rapid_movement') ? 70 : 0;
		const amountRisk = patterns.includes('large_transfers') ? 60 : 0;
		const nodeRisk = Math.max(...nodes.map((node) => node.riskScore));
		const patternRisk = patterns.length * 20;

		const overall = Math.min(
			100,
			Math.max(mixerRisk, velocityRisk, amountRisk, nodeRisk, patternRisk)
		);
		const confidence = patterns.length > 0 ? 85 : 50;

		return {
			overall,
			factors: {
				mixer: mixerRisk,
				newWallets: 0, // Would need to track wallet age
				velocity: velocityRisk,
				amount: amountRisk,
				patterns: patternRisk
			},
			confidence
		};
	}

	/**
	 * Generate recommendations based on analysis
	 */
	private generateRecommendations(riskAssessment: RiskAssessment, patterns: string[]): string[] {
		const recommendations: string[] = [];

		if (riskAssessment.overall > 80) {
			recommendations.push(
				'IMMEDIATE INVESTIGATION REQUIRED - High risk transaction flow detected'
			);
		}

		if (patterns.includes('mixer_usage')) {
			recommendations.push('Monitor for potential money laundering - mixer usage detected');
		}

		if (patterns.includes('rapid_movement')) {
			recommendations.push('Investigate rapid movement pattern - possible automated attack');
		}

		if (patterns.includes('large_transfers')) {
			recommendations.push('Verify legitimacy of large transfers');
		}

		if (riskAssessment.overall < 30) {
			recommendations.push('Low risk - routine monitoring sufficient');
		}

		return recommendations;
	}

	/**
	 * Get cached flow by ID
	 */
	getFlow(flowId: string): TransactionFlow | undefined {
		return this.flowCache.get(flowId);
	}

	/**
	 * Get all cached flows
	 */
	getAllFlows(): TransactionFlow[] {
		return Array.from(this.flowCache.values());
	}

	/**
	 * Clear flow cache
	 */
	clearCache(): void {
		this.flowCache.clear();
		this.nodeRegistry.clear();
	}

	/**
	 * Add known exchange address
	 */
	addKnownExchange(address: string): void {
		this.knownExchanges.add(address);
	}

	/**
	 * Add known mixer address
	 */
	addKnownMixer(address: string): void {
		this.knownMixers.add(address);
	}

	/**
	 * Get tracing statistics
	 */
	getTracingStatistics(): {
		totalFlows: number;
		totalNodes: number;
		knownExchanges: number;
		knownMixers: number;
	} {
		return {
			totalFlows: this.flowCache.size,
			totalNodes: this.nodeRegistry.size,
			knownExchanges: this.knownExchanges.size,
			knownMixers: this.knownMixers.size
		};
	}
}
