/**
 * Transaction Validation Service
 * Configurable rule engine for detecting suspicious Solana transactions
 * Designed for cyber forensics professionals
 */

import type {
	ValidationRule,
	ValidationCondition,
	AlertSeverity,
	SolanaTransactionDetails,
	ForensicsAlert,
	ForensicEvidence,
	EvidenceType,
	ChainOfCustodyEntry,
	EvidenceMetadata
} from '../types';
import { ConfigService } from './config.service';
// Removed Node.js crypto import - using Web Crypto API instead

export class ValidationService {
	private rules: Map<string, ValidationRule> = new Map();
	private evidenceCounter: number = 0;

	constructor() {
		this.initializeDefaultRules();
	}

	/**
	 * Initialize default validation rules for forensics
	 */
	private initializeDefaultRules(): void {
		// Get thresholds config
		const configService = ConfigService.getInstance();
		const thresholds = configService.getConfig().thresholds || {
			largeTransferThreshold: 100000000000,
			minimumTransferThreshold: 1000000,
			highValueThreshold: 10000000000,
			mediumValueThreshold: 1000000000
		};

		// Large transfer rule
		this.addRule({
			id: 'large_transfer',
			name: 'Large Transfer Detection',
			description: `Detects transfers exceeding ${thresholds.largeTransferThreshold / 1000000000} SOL`,
			enabled: true,
			severity: 'critical',
			conditions: [
				{
					field: 'balanceChange',
					operator: 'gt',
					value: thresholds.largeTransferThreshold,
					description: `Transfer amount exceeds ${thresholds.largeTransferThreshold / 1000000000} SOL`
				}
			],
			actions: [
				{
					type: 'alert',
					parameters: { priority: 'high' }
				},
				{
					type: 'trace',
					parameters: { depth: 3 }
				}
			],
			metadata: {
				createdBy: 'system',
				createdAt: Date.now(),
				updatedAt: Date.now(),
				version: 1,
				tags: ['amount', 'suspicious']
			}
		});

		// Circular transfer detection rule (wash trading)
		this.addRule({
			id: 'circular_transfer',
			name: 'Circular Transfer Detection',
			description: 'Detects circular transaction patterns indicating wash trading',
			enabled: true,
			severity: 'emergency',
			conditions: [
				{
					field: 'circularPattern',
					operator: 'eq',
					value: true,
					description: 'Funds return to original sender through intermediaries'
				}
			],
			actions: [
				{
					type: 'alert',
					parameters: { priority: 'critical' }
				},
				{
					type: 'trace',
					parameters: { depth: 10 }
				}
			],
			metadata: {
				createdBy: 'system',
				createdAt: Date.now(),
				updatedAt: Date.now(),
				version: 1,
				tags: ['wash-trading', 'circular', 'suspicious', 'money-laundering']
			}
		});

		// Fan-out pattern detection rule (one-to-many transfers)
		this.addRule({
			id: 'fan_out_pattern',
			name: 'Fan-Out Pattern Detection',
			description: 'Detects one-to-many simultaneous transfers (money laundering technique)',
			enabled: true,
			severity: 'critical',
			conditions: [
				{
					field: 'fanOutRecipients',
					operator: 'gte',
					value: 3,
					description: 'Single sender to 3+ recipients within short timeframe'
				}
			],
			actions: [
				{
					type: 'alert',
					parameters: { priority: 'high' }
				},
				{
					type: 'trace',
					parameters: { depth: 5 }
				}
			],
			metadata: {
				createdBy: 'system',
				createdAt: Date.now(),
				updatedAt: Date.now(),
				version: 1,
				tags: ['fan-out', 'money-laundering', 'suspicious']
			}
		});

		// Clustering detection rule (frequently transacting wallets)
		this.addRule({
			id: 'wallet_clustering',
			name: 'Wallet Clustering Detection',
			description: 'Detects wallets that frequently transact together',
			enabled: true,
			severity: 'warning',
			conditions: [
				{
					field: 'clusterActivity',
					operator: 'gte',
					value: 5,
					description: 'Wallet cluster with 5+ interactions'
				}
			],
			actions: [
				{
					type: 'alert',
					parameters: { priority: 'medium' }
				},
				{
					type: 'log',
					parameters: { level: 'info' }
				}
			],
			metadata: {
				createdBy: 'system',
				createdAt: Date.now(),
				updatedAt: Date.now(),
				version: 1,
				tags: ['clustering', 'network', 'relationship']
			}
		});

		// Rapid movement rule
		this.addRule({
			id: 'rapid_movement',
			name: 'Rapid Movement Detection',
			description: 'Detects multiple transactions within 60 seconds',
			enabled: true,
			severity: 'warning',
			conditions: [
				{
					field: 'transactionCount',
					operator: 'gt',
					value: 5,
					description: 'More than 5 transactions in 60 seconds'
				}
			],
			actions: [
				{
					type: 'alert',
					parameters: { priority: 'medium' }
				}
			],
			metadata: {
				createdBy: 'system',
				createdAt: Date.now(),
				updatedAt: Date.now(),
				version: 1,
				tags: ['velocity', 'suspicious']
			}
		});

		// Failed transaction rule
		this.addRule({
			id: 'failed_transaction',
			name: 'Failed Transaction Detection',
			description: 'Detects failed transactions which may indicate attack attempts',
			enabled: true,
			severity: 'warning',
			conditions: [
				{
					field: 'status',
					operator: 'eq',
					value: 'failed',
					description: 'Transaction failed'
				}
			],
			actions: [
				{
					type: 'log',
					parameters: { level: 'warning' }
				}
			],
			metadata: {
				createdBy: 'system',
				createdAt: Date.now(),
				updatedAt: Date.now(),
				version: 1,
				tags: ['failure', 'attack']
			}
		});

		// High fee rule
		this.addRule({
			id: 'high_fee',
			name: 'High Transaction Fee Detection',
			description: 'Detects unusually high transaction fees',
			enabled: true,
			severity: 'info',
			conditions: [
				{
					field: 'fee',
					operator: 'gt',
					value: thresholds.minimumTransferThreshold,
					description: 'Transaction fee exceeds 0.001 SOL'
				}
			],
			actions: [
				{
					type: 'log',
					parameters: { level: 'info' }
				}
			],
			metadata: {
				createdBy: 'system',
				createdAt: Date.now(),
				updatedAt: Date.now(),
				version: 1,
				tags: ['fee', 'unusual']
			}
		});
	}

	/**
	 * Add a new validation rule
	 */
	addRule(rule: ValidationRule): void {
		this.rules.set(rule.id, rule);
	}

	/**
	 * Remove a validation rule
	 */
	removeRule(ruleId: string): boolean {
		return this.rules.delete(ruleId);
	}

	/**
	 * Update an existing rule
	 */
	updateRule(ruleId: string, updates: Partial<ValidationRule>): boolean {
		const rule = this.rules.get(ruleId);
		if (!rule) return false;

		const updatedRule = {
			...rule,
			...updates,
			metadata: { ...rule.metadata, updatedAt: Date.now() }
		};
		this.rules.set(ruleId, updatedRule);
		return true;
	}

	/**
	 * Get all validation rules
	 */
	getRules(): ValidationRule[] {
		return Array.from(this.rules.values());
	}

	/**
	 * Get a specific rule by ID
	 */
	getRule(ruleId: string): ValidationRule | undefined {
		return this.rules.get(ruleId);
	}

	/**
	 * Enable/disable a rule
	 */
	toggleRule(ruleId: string, enabled: boolean): boolean {
		return this.updateRule(ruleId, { enabled });
	}

	/**
	 * Validate a transaction against all enabled rules
	 */
	async validateTransaction(
		transaction: SolanaTransactionDetails,
		context: {
			walletAddress: string;
			recentTransactions: SolanaTransactionDetails[];
			accountBalance: number;
		}
	): Promise<{
		isValid: boolean;
		alerts: ForensicsAlert[];
		evidence: ForensicEvidence[];
	}> {
		const alerts: ForensicsAlert[] = [];
		const evidence: ForensicEvidence[] = [];

		// Process each enabled rule
		for (const rule of this.rules.values()) {
			if (!rule.enabled) continue;

			const ruleResult = await this.evaluateRule(rule, transaction, context);

			if (ruleResult.triggered) {
				// Create forensic evidence
				const evidenceItem = await this.createEvidence(rule, transaction, ruleResult);
				evidence.push(evidenceItem);

				// Create alert if rule has alert action
				const alertAction = rule.actions.find((action) => action.type === 'alert');
				if (alertAction) {
					const alert = this.createAlert(rule, transaction, evidenceItem, alertAction.parameters);
					alerts.push(alert);
				}
			}
		}

		return {
			isValid: alerts.length === 0,
			alerts,
			evidence
		};
	}

	/**
	 * Evaluate a single rule against a transaction
	 */
	private async evaluateRule(
		rule: ValidationRule,
		transaction: SolanaTransactionDetails,
		context: any
	): Promise<{
		triggered: boolean;
		matchedConditions: string[];
		details: Record<string, any>;
	}> {
		const matchedConditions: string[] = [];
		const details: Record<string, any> = {};

		// Check each condition
		for (const condition of rule.conditions) {
			const fieldValue = this.extractFieldValue(transaction, context, condition.field);
			const isMatched = this.evaluateCondition(condition, fieldValue);

			if (isMatched) {
				matchedConditions.push(condition.description);
				details[condition.field] = fieldValue;
			}
		}

		// Rule is triggered if all conditions match
		const triggered = matchedConditions.length === rule.conditions.length;

		return {
			triggered,
			matchedConditions,
			details
		};
	}

	/**
	 * Extract field value from transaction or context
	 */
	private extractFieldValue(
		transaction: SolanaTransactionDetails,
		context: any,
		field: string
	): any {
		switch (field) {
			case 'balanceChange':
				const maxChange = Math.max(...transaction.balanceChanges.map((bc) => Math.abs(bc.change)));
				return maxChange;
			case 'fee':
				return transaction.fee;
			case 'status':
				return transaction.status;
			case 'transactionCount':
				return context.recentTransactions.length;
			case 'accountBalance':
				return context.accountBalance;
			case 'slot':
				return transaction.slot;
			case 'blockTime':
				return transaction.blockTime;
			case 'circularPattern':
				return this.detectCircularPattern(transaction, context);
			case 'fanOutRecipients':
				return this.detectFanOutPattern(transaction, context);
			case 'clusterActivity':
				return this.detectClusterActivity(transaction, context);
			default:
				return null;
		}
	}

	/**
	 * Detect circular transfer pattern (wash trading)
	 * Analyzes if funds flow through multiple wallets and return to original sender
	 */
	private detectCircularPattern(transaction: SolanaTransactionDetails, context: any): boolean {
		if (!context.recentTransactions || context.recentTransactions.length < 2) {
			return false;
		}

		// Build transaction flow chain from recent transactions
		const flowChain: Array<{ from: string; to: string; tx: SolanaTransactionDetails }> = [];
		const recentTxs = [...context.recentTransactions, transaction];

		// Build flow chain from recent transactions (tracking actual flow direction)
		for (const tx of recentTxs) {
			if (tx.balanceChanges && tx.balanceChanges.length > 0) {
				// Get sender and receiver addresses
				const sender = tx.balanceChanges.find((bc: any) => bc.change < 0)?.account;
				const receiver = tx.balanceChanges.find((bc: any) => bc.change > 0)?.account;

				if (sender && receiver) {
					flowChain.push({ from: sender, to: receiver, tx });
				}
			}
		}

		// Check for circular pattern: funds return to original sender through intermediaries
		if (flowChain.length >= 3) {
			// Check if any address appears as both sender and receiver in the chain
			const addressSet = new Set<string>();
			for (const flow of flowChain) {
				addressSet.add(flow.from);
				addressSet.add(flow.to);
			}

			// Check if the first sender appears again later in the chain
			const firstSender = flowChain[0].from;
			const lastReceiver = flowChain[flowChain.length - 1].to;
			
			// Check if funds circle back to original sender or a connected address
			// Look for the first sender appearing in later transactions
			for (let i = 1; i < flowChain.length; i++) {
				if (flowChain[i].to === firstSender || flowChain[i].from === firstSender) {
					// If we have at least 3 hops and the first sender appears again, it's circular
					if (i >= 2) {
						return true;
					}
				}
			}
			
			// Also check if last receiver equals first sender (complete circle)
			if (lastReceiver === firstSender && flowChain.length >= 3) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Detect fan-out pattern (one-to-many transfers)
	 * Identifies when a single wallet sends to multiple recipients in short timeframe
	 */
	private detectFanOutPattern(transaction: SolanaTransactionDetails, context: any): number {
		if (!context.recentTransactions || context.recentTransactions.length === 0) {
			return 0;
		}

		// Get the sender from current transaction
		const currentSender = transaction.balanceChanges.find((bc: any) => bc.change < 0)?.account;
		if (!currentSender) return 0;

		// Track unique recipients from the same sender in recent transactions
		const recipients = new Set<string>();
		const timeWindow = 60000; // 60 seconds

			// Check recent transactions for same sender to different recipients
		// Include current transaction in the list
		const recentTxs = [...context.recentTransactions, transaction].filter((tx) => {
			// Handle blockTime comparison - blockTime is in seconds (Unix timestamp)
			if (!transaction.blockTime || !tx.blockTime) {
				// If blockTime is missing, include it anyway (might be recent)
				return true;
			}
			// Calculate time difference in milliseconds
			const timeDiff = Math.abs((transaction.blockTime - tx.blockTime) * 1000);
			return timeDiff <= timeWindow;
		});

		for (const tx of recentTxs) {
			const sender = tx.balanceChanges.find((bc: any) => bc.change < 0)?.account;
			const receiver = tx.balanceChanges.find((bc: any) => bc.change > 0)?.account;

			if (sender === currentSender && receiver) {
				recipients.add(receiver);
			}
		}

		const recipientCount = recipients.size;
		return recipientCount;
	}

	/**
	 * Detect wallet clustering (wallets that frequently interact)
	 * Identifies networks of wallets that repeatedly transact with each other
	 */
	private detectClusterActivity(transaction: SolanaTransactionDetails, context: any): number {
		if (!context.recentTransactions || context.recentTransactions.length === 0) {
			return 0;
		}

		// Get addresses from current transaction
		const currentAddresses = new Set<string>();
		transaction.balanceChanges.forEach((bc: any) => {
			if (bc.account) currentAddresses.add(bc.account);
		});

		// Count interactions between addresses in the current transaction set
		let interactionCount = 0;
		const timeWindow = 300000; // 5 minutes

		// Check recent transactions for repeated interactions
		const recentTxs = [...context.recentTransactions].filter((tx) => {
			const timeDiff = Math.abs((transaction.blockTime || 0) - (tx.blockTime || 0)) * 1000;
			return timeDiff <= timeWindow;
		});

		for (const tx of recentTxs) {
			const txAddresses = tx.balanceChanges.map((bc: any) => bc.account);

			// Check if any address from current transaction appears in this transaction
			const hasCommonAddress = txAddresses.some((addr: string) => currentAddresses.has(addr));
			if (hasCommonAddress) {
				interactionCount++;
			}
		}

		return interactionCount;
	}

	/**
	 * Evaluate a single condition
	 */
	private evaluateCondition(condition: ValidationCondition, value: any): boolean {
		if (value === null || value === undefined) return false;

		switch (condition.operator) {
			case 'gt':
				return value > condition.value;
			case 'lt':
				return value < condition.value;
			case 'eq':
				return value === condition.value;
			case 'gte':
				return value >= condition.value;
			case 'lte':
				return value <= condition.value;
			case 'ne':
				return value !== condition.value;
			case 'contains':
				return String(value).includes(String(condition.value));
			case 'regex':
				return new RegExp(condition.value).test(String(value));
			default:
				return false;
		}
	}

	/**
	 * Create forensic evidence from rule evaluation
	 */
	private async createEvidence(
		rule: ValidationRule,
		transaction: SolanaTransactionDetails,
		ruleResult: any
	): Promise<ForensicEvidence> {
		const evidenceId = `evidence_${++this.evidenceCounter}_${Date.now()}`;
		const evidenceData = {
			ruleId: rule.id,
			ruleName: rule.name,
			transactionSignature: transaction.signature,
			matchedConditions: ruleResult.matchedConditions,
			details: ruleResult.details,
			timestamp: Date.now()
		};

		const evidenceHash = await this.calculateHash(JSON.stringify(evidenceData));

		const chainOfCustody: ChainOfCustodyEntry[] = [
			{
				timestamp: Date.now(),
				action: 'created',
				actor: 'validation-service',
				description: `Evidence created by rule: ${rule.name}`,
				hash: evidenceHash
			}
		];

		const metadata: EvidenceMetadata = {
			investigator: 'system',
			priority:
				rule.severity === 'critical' ? 'critical' : rule.severity === 'warning' ? 'high' : 'medium',
			tags: rule.metadata.tags,
			notes: `Auto-generated evidence from ${rule.name}`,
			attachments: []
		};

		return {
			id: evidenceId,
			transactionId: transaction.signature,
			timestamp: Date.now(),
			evidenceType: this.mapRuleToEvidenceType(rule.id),
			description: rule.description,
			data: evidenceData,
			hash: evidenceHash,
			chainOfCustody,
			metadata
		};
	}

	/**
	 * Create alert from rule evaluation
	 */
	private createAlert(
		rule: ValidationRule,
		transaction: SolanaTransactionDetails,
		evidence: ForensicEvidence,
		parameters: Record<string, any>
	): ForensicsAlert {
		const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		// Get the primary wallet address from balance changes
		const fromAccount = transaction.balanceChanges.find((bc) => bc.change < 0);
		const walletAddress = fromAccount?.account || 'Unknown';

		return {
			id: alertId,
			timestamp: Date.now(),
			severity: rule.severity,
			type: this.mapRuleToAlertType(rule.id),
			title: `${rule.name} - ${transaction.signature.slice(0, 8)}...`,
			description: `${rule.description}. Transaction: ${transaction.signature}`,
			transactionId: transaction.signature,
			walletAddress,
			evidence,
			status: 'new',
			notifications: []
		};
	}

	/**
	 * Map rule ID to evidence type
	 */
	private mapRuleToEvidenceType(ruleId: string): EvidenceType {
		switch (ruleId) {
			case 'large_transfer':
				return 'large_transfer';
			case 'rapid_movement':
				return 'rapid_movement';
			case 'circular_transfer':
				return 'suspicious_transaction'; // Wash trading
			case 'fan_out_pattern':
				return 'suspicious_transaction'; // Money laundering
			case 'wallet_clustering':
				return 'unusual_pattern'; // Network analysis
			case 'failed_transaction':
				return 'suspicious_transaction';
			case 'high_fee':
				return 'unusual_pattern';
			default:
				return 'suspicious_transaction';
		}
	}

	/**
	 * Map rule ID to alert type
	 */
	private mapRuleToAlertType(ruleId: string): any {
		switch (ruleId) {
			case 'large_transfer':
				return 'large_transfer';
			case 'rapid_movement':
				return 'rapid_movement';
			case 'circular_transfer':
				return 'circular_transfer'; // Circular transfer pattern
			case 'fan_out_pattern':
				return 'fan_out_pattern'; // Fan-out pattern
			case 'wallet_clustering':
				return 'unusual_pattern'; // Clustering alert
			case 'failed_transaction':
				return 'suspicious_activity';
			case 'high_fee':
				return 'unusual_pattern';
			default:
				return 'suspicious_activity';
		}
	}

	/**
	 * Calculate hash for evidence integrity
	 */
	private async calculateHash(data: string): Promise<string> {
		// Use Web Crypto API for browser compatibility
		const encoder = new TextEncoder();
		const dataBytes = encoder.encode(data);
		const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Get rule statistics
	 */
	getRuleStatistics(): {
		totalRules: number;
		enabledRules: number;
		disabledRules: number;
		rulesBySeverity: Record<AlertSeverity, number>;
	} {
		const rules = Array.from(this.rules.values());

		return {
			totalRules: rules.length,
			enabledRules: rules.filter((r) => r.enabled).length,
			disabledRules: rules.filter((r) => !r.enabled).length,
			rulesBySeverity: {
				info: rules.filter((r) => r.severity === 'info').length,
				warning: rules.filter((r) => r.severity === 'warning').length,
				critical: rules.filter((r) => r.severity === 'critical').length,
				emergency: rules.filter((r) => r.severity === 'emergency').length
			}
		};
	}

	/**
	 * Export rules configuration
	 */
	exportRules(): string {
		return JSON.stringify(Array.from(this.rules.values()), null, 2);
	}

	/**
	 * Import rules configuration
	 */
	importRules(rulesJson: string): boolean {
		try {
			const rules: ValidationRule[] = JSON.parse(rulesJson);
			this.rules.clear();

			for (const rule of rules) {
				this.rules.set(rule.id, rule);
			}

			return true;
		} catch (error) {
			return false;
		}
	}
}
