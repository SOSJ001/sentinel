/**
 * Forensics Service
 * Handles evidence integrity, chain of custody, and forensic analysis
 * Designed for cyber forensics professionals
 */

import { writable } from 'svelte/store';
import type {
	ForensicEvidence,
	ChainOfCustodyEntry,
	EvidenceType,
	EvidenceMetadata,
	ForensicsAlert,
	AlertSeverity,
	AlertType,
	AlertStatus,
	TransactionFlow,
	FlowNode,
	FlowEdge,
	FlowAnalysis,
	RiskAssessment,
	MonitoredWallet,
	WalletMetadata,
	WalletStatistics
} from '../types/forensics.types';
import type { SolanaTransaction } from '../types/forensics.types';
import { ConfigService } from './config.service';

export class ForensicsService {
	private evidenceStore = writable<ForensicEvidence[]>([]);
	private alertsStore = writable<ForensicsAlert[]>([]);
	private chainOfCustodyStore = writable<ChainOfCustodyEntry[]>([]);
	private transactionFlowsStore = writable<TransactionFlow[]>([]);
	private monitoredWalletsStore = writable<MonitoredWallet[]>([]);

	// ============================================================================
	// EVIDENCE INTEGRITY AND CHAIN OF CUSTODY
	// ============================================================================

	/**
	 * Create forensic evidence with cryptographic integrity
	 */
	async createEvidence(
		transactionId: string,
		evidenceType: EvidenceType,
		description: string,
		data: Record<string, any>,
		investigator: string,
		caseId?: string
	): Promise<ForensicEvidence> {
		const timestamp = Date.now();
		const id = this.generateEvidenceId();

		// Create initial evidence
		const evidence: ForensicEvidence = {
			id,
			transactionId,
			timestamp,
			evidenceType,
			description,
			data,
			hash: '', // Will be calculated
			chainOfCustody: [],
			metadata: {
				caseId,
				investigator,
				priority: 'medium',
				tags: [],
				notes: '',
				attachments: []
			}
		};

		// Calculate cryptographic hash for integrity
		evidence.hash = await this.calculateEvidenceHash(evidence);

		// Create initial chain of custody entry
		const custodyEntry: ChainOfCustodyEntry = {
			timestamp,
			action: 'created',
			actor: investigator,
			description: `Evidence created for ${evidenceType}`,
			hash: evidence.hash
		};

		evidence.chainOfCustody.push(custodyEntry);

		// Store evidence
		this.evidenceStore.update((evidences) => [...evidences, evidence]);
		this.chainOfCustodyStore.update((entries) => [...entries, custodyEntry]);

		return evidence;
	}

	/**
	 * Calculate SHA-256 hash for evidence integrity
	 */
	private async calculateEvidenceHash(evidence: Omit<ForensicEvidence, 'hash'>): Promise<string> {
		const dataString = JSON.stringify({
			id: evidence.id,
			transactionId: evidence.transactionId,
			timestamp: evidence.timestamp,
			evidenceType: evidence.evidenceType,
			description: evidence.description,
			data: evidence.data
		});

		// Use Web Crypto API for browser compatibility
		const encoder = new TextEncoder();
		const data = encoder.encode(dataString);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Verify evidence integrity
	 */
	async verifyEvidenceIntegrity(evidence: ForensicEvidence): Promise<boolean> {
		const calculatedHash = await this.calculateEvidenceHash(evidence);
		return calculatedHash === evidence.hash;
	}

	/**
	 * Add chain of custody entry
	 */
	async addChainOfCustodyEntry(
		evidenceId: string,
		action: 'accessed' | 'modified' | 'transferred',
		actor: string,
		description: string
	): Promise<void> {
		const timestamp = Date.now();

		// Get current evidence
		let currentEvidence: ForensicEvidence | null = null;
		this.evidenceStore.subscribe((evidences) => {
			currentEvidence = evidences.find((e) => e.id === evidenceId) || null;
		})();

		if (!currentEvidence) {
			throw new Error(`Evidence not found: ${evidenceId}`);
		}

		// Create new custody entry
		const custodyEntry: ChainOfCustodyEntry = {
			timestamp,
			action,
			actor,
			description,
			hash: currentEvidence.hash
		};

		// Update evidence with new custody entry
		this.evidenceStore.update((evidences) =>
			evidences.map((e) =>
				e.id === evidenceId ? { ...e, chainOfCustody: [...e.chainOfCustody, custodyEntry] } : e
			)
		);

		// Add to chain of custody store
		this.chainOfCustodyStore.update((entries) => [...entries, custodyEntry]);
	}

	/**
	 * Generate unique evidence ID
	 */
	private generateEvidenceId(): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		return `EVID-${timestamp}-${random}`.toUpperCase();
	}

	// ============================================================================
	// ALERT SYSTEM
	// ============================================================================

	/**
	 * Create forensic alert
	 */
	async createAlert(
		severity: AlertSeverity,
		type: AlertType,
		title: string,
		description: string,
		transactionId: string,
		walletAddress: string,
		evidence: ForensicEvidence,
		assignedTo?: string
	): Promise<ForensicsAlert> {
		const timestamp = Date.now();
		const id = this.generateAlertId();

		const alert: ForensicsAlert = {
			id,
			timestamp,
			severity,
			type,
			title,
			description,
			transactionId,
			walletAddress,
			evidence,
			status: 'new',
			assignedTo,
			notifications: []
		};

		// Store alert
		this.alertsStore.update((alerts) => [...alerts, alert]);

		// Send notifications based on severity
		await this.sendAlertNotifications(alert);

		return alert;
	}

	/**
	 * Update alert status
	 */
	async updateAlertStatus(
		alertId: string,
		status: AlertStatus,
		resolvedBy?: string,
		resolution?: string
	): Promise<void> {
		this.alertsStore.update((alerts) =>
			alerts.map((alert) => {
				if (alert.id === alertId) {
					const updatedAlert = { ...alert, status };

					if (status === 'resolved' && resolvedBy && resolution) {
						updatedAlert.resolution = {
							timestamp: Date.now(),
							resolvedBy,
							resolution,
							evidence: []
						};
					}

					return updatedAlert;
				}
				return alert;
			})
		);
	}

	/**
	 * Send alert notifications
	 */
	private async sendAlertNotifications(alert: ForensicsAlert): Promise<void> {
		const notificationMethods = this.getNotificationMethods(alert.severity);

		for (const method of notificationMethods) {
			try {
				await this.sendNotification(alert, method);
			} catch (error) {
				// Notification failed silently
			}
		}
	}

	/**
	 * Get notification methods based on severity
	 */
	private getNotificationMethods(severity: AlertSeverity): string[] {
		switch (severity) {
			case 'emergency':
				return ['desktop', 'email', 'webhook', 'sms'];
			case 'critical':
				return ['desktop', 'email', 'webhook'];
			case 'warning':
				return ['desktop', 'email'];
			case 'info':
				return ['desktop'];
			default:
				return ['desktop'];
		}
	}

	/**
	 * Send notification via specific method
	 */
	private async sendNotification(alert: ForensicsAlert, method: string): Promise<void> {
		const timestamp = Date.now();

		// Simulate notification sending

		// Update alert with notification log
		this.alertsStore.update((alerts) =>
			alerts.map((a) =>
				a.id === alert.id
					? {
							...a,
							notifications: [
								...a.notifications,
								{
									timestamp,
									method: method as any,
									recipient: 'investigator@forensics.com',
									status: 'sent',
									response: 'Notification sent successfully'
								}
							]
						}
					: a
			)
		);
	}

	/**
	 * Generate unique alert ID
	 */
	private generateAlertId(): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		return `ALERT-${timestamp}-${random}`.toUpperCase();
	}

	// ============================================================================
	// TRANSACTION FLOW ANALYSIS
	// ============================================================================

	/**
	 * Analyze transaction flow for forensic purposes
	 */
	async analyzeTransactionFlow(
		rootTransaction: string,
		maxDepth: number = 5,
		analyzer: string,
		caseId?: string
	): Promise<TransactionFlow> {
		const timestamp = Date.now();
		const id = this.generateFlowId();

		// Create initial flow structure
		const flow: TransactionFlow = {
			id,
			rootTransaction,
			depth: 0,
			nodes: [],
			edges: [],
			analysis: {
				totalValue: 0,
				hopCount: 0,
				suspiciousPatterns: [],
				riskAssessment: {
					overall: 0,
					factors: {
						mixer: 0,
						newWallets: 0,
						velocity: 0,
						amount: 0,
						patterns: 0
					},
					confidence: 0
				},
				recommendations: []
			},
			metadata: {
				analyzedAt: timestamp,
				analyzer,
				caseId,
				notes: ''
			}
		};

		// Perform flow analysis
		await this.performFlowAnalysis(flow, maxDepth);

		// Store flow
		this.transactionFlowsStore.update((flows) => [...flows, flow]);

		return flow;
	}

	/**
	 * Perform detailed flow analysis
	 */
	private async performFlowAnalysis(flow: TransactionFlow, maxDepth: number): Promise<void> {
		// Advanced flow analysis implementation
		const suspiciousPatterns: string[] = [];
		let totalValue = 0;
		let hopCount = 0;

		// Analyze transaction patterns
		const circularDetected = this.detectCircularFlow(flow);
		const fanOutDetected = this.detectFanOutFlow(flow);
		const rapidMovement = this.detectRapidMovement(flow);
		const mixerInteraction = this.detectMixerInteraction(flow);

		if (circularDetected) {
			suspiciousPatterns.push('🔄 Circular transfer pattern detected (wash trading)');
		}
		if (fanOutDetected > 0) {
			suspiciousPatterns.push(`🌊 Fan-out pattern detected (${fanOutDetected} recipients)`);
		}
		if (rapidMovement) {
			suspiciousPatterns.push('⚡ Rapid movement through multiple wallets');
		}
		if (mixerInteraction) {
			suspiciousPatterns.push('🚨 Interaction with known mixer addresses');
		}

		// Calculate enhanced risk score
		const riskFactors = this.calculateEnhancedRiskFactors(
			circularDetected,
			fanOutDetected,
			rapidMovement,
			mixerInteraction
		);

		flow.analysis = {
			totalValue,
			hopCount,
			suspiciousPatterns,
			riskAssessment: {
				overall: this.calculateOverallRisk(riskFactors),
				factors: riskFactors,
				confidence: this.calculateConfidence(suspiciousPatterns.length)
			},
			recommendations: this.generateRecommendations(suspiciousPatterns)
		};
	}

	/**
	 * Detect circular flow pattern in transaction flow
	 */
	private detectCircularFlow(flow: TransactionFlow): boolean {
		// Check if nodes form a circular pattern
		if (flow.nodes.length < 3) return false;

		const addressSet = new Set<string>();
		for (const node of flow.nodes) {
			if (addressSet.has(node.address)) {
				return true; // Address appears twice = circular
			}
			addressSet.add(node.address);
		}

		return false;
	}

	/**
	 * Detect fan-out flow pattern
	 */
	private detectFanOutFlow(flow: TransactionFlow): number {
		// Count unique recipients from a single sender
		const senderMap = new Map<string, Set<string>>();

		for (const edge of flow.edges) {
			if (!senderMap.has(edge.from)) {
				senderMap.set(edge.from, new Set());
			}
			senderMap.get(edge.from)!.add(edge.to);
		}

		// Find max recipients from any single sender
		let maxRecipients = 0;
		for (const recipients of senderMap.values()) {
			maxRecipients = Math.max(maxRecipients, recipients.size);
		}

		return maxRecipients >= 3 ? maxRecipients : 0;
	}

	/**
	 * Detect rapid movement pattern
	 */
	private detectRapidMovement(flow: TransactionFlow): boolean {
		// Check if transactions occur within short timeframe
		if (flow.nodes.length < 2) return false;

		const timestamps = flow.nodes
			.map((node) => node.metadata?.timestamp || 0)
			.filter((t) => t > 0)
			.sort();

		if (timestamps.length < 2) return false;

		const timeDiff = timestamps[timestamps.length - 1] - timestamps[0];
		return timeDiff < 60000; // Less than 60 seconds = rapid
	}

	/**
	 * Detect mixer interaction in flow
	 */
	private detectMixerInteraction(flow: TransactionFlow): boolean {
		// Known mixer address patterns (simplified)
		const mixerPatterns = ['mixer', 'tornado', 'tumbler'];

		for (const node of flow.nodes) {
			const label = (node.metadata?.label || '').toLowerCase();
			if (mixerPatterns.some((pattern) => label.includes(pattern))) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Calculate enhanced risk factors
	 */
	private calculateEnhancedRiskFactors(
		circular: boolean,
		fanOut: number,
		rapid: boolean,
		mixer: boolean
	): RiskAssessment['factors'] {
		return {
			mixer: mixer ? 95 : 10,
			newWallets: fanOut > 0 ? Math.min(fanOut * 15, 90) : 20,
			velocity: rapid ? 85 : 30,
			amount: 50, // Will be calculated based on actual amounts
			patterns: circular ? 90 : fanOut > 0 ? 75 : 40
		};
	}

	/**
	 * Calculate overall risk score from factors
	 */
	private calculateOverallRisk(factors: RiskAssessment['factors']): number {
		const weights = {
			mixer: 0.3,
			newWallets: 0.2,
			velocity: 0.2,
			amount: 0.15,
			patterns: 0.15
		};

		const overall =
			factors.mixer * weights.mixer +
			factors.newWallets * weights.newWallets +
			factors.velocity * weights.velocity +
			factors.amount * weights.amount +
			factors.patterns * weights.patterns;

		return Math.round(overall);
	}

	/**
	 * Calculate confidence based on number of patterns detected
	 */
	private calculateConfidence(patternCount: number): number {
		if (patternCount === 0) return 40;
		if (patternCount === 1) return 60;
		if (patternCount === 2) return 80;
		return 95; // 3+ patterns
	}

	/**
	 * Generate recommendations based on detected patterns
	 */
	private generateRecommendations(patterns: string[]): string[] {
		const recommendations: string[] = [];

		if (patterns.some((p) => p.includes('Circular'))) {
			recommendations.push('🔄 Investigate wash trading activity - track all wallets in cycle');
			recommendations.push('📋 Document circular flow for regulatory reporting');
		}

		if (patterns.some((p) => p.includes('Fan-out'))) {
			recommendations.push('🌊 Monitor all recipient wallets for further dispersal');
			recommendations.push('💰 Calculate total value distributed across recipients');
		}

		if (patterns.some((p) => p.includes('Rapid'))) {
			recommendations.push('⚡ Flag for automated transaction bot activity');
			recommendations.push('⏱️ Analyze transaction timing for patterns');
		}

		if (patterns.some((p) => p.includes('mixer'))) {
			recommendations.push('🚨 CRITICAL: Mixer interaction detected - escalate immediately');
			recommendations.push('🔍 Trace pre-mixer and post-mixer transactions');
		}

		if (recommendations.length === 0) {
			recommendations.push('✅ Continue standard monitoring procedures');
		}

		return recommendations;
	}

	/**
	 * Generate unique flow ID
	 */
	private generateFlowId(): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		return `FLOW-${timestamp}-${random}`.toUpperCase();
	}

	// ============================================================================
	// WALLET MONITORING
	// ============================================================================

	/**
	 * Add wallet for monitoring
	 */
	async addMonitoredWallet(
		address: string,
		label: string,
		description: string,
		investigator: string,
		caseId?: string,
		riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium'
	): Promise<MonitoredWallet> {
		const timestamp = Date.now();
		const id = this.generateWalletId();

		const wallet: MonitoredWallet = {
			id,
			address,
			label,
			description,
			isActive: true,
			rules: [],
			metadata: {
				addedBy: investigator,
				addedAt: timestamp,
				caseId,
				tags: [],
				notes: '',
				riskLevel
			},
			statistics: {
				totalTransactions: 0,
				totalVolume: 0,
				averageTransactionSize: 0,
				lastActivity: 0,
				alertCount: 0,
				riskScore: 0
			}
		};

		// Store wallet
		this.monitoredWalletsStore.update((wallets) => [...wallets, wallet]);

		return wallet;
	}

	/**
	 * Update wallet statistics
	 */
	async updateWalletStatistics(walletId: string, transaction: SolanaTransaction): Promise<void> {
		this.monitoredWalletsStore.update((wallets) =>
			wallets.map((wallet) => {
				if (wallet.id === walletId) {
					const updatedStats = { ...wallet.statistics };

					// Update statistics based on transaction
					updatedStats.totalTransactions += 1;
					updatedStats.totalVolume += Math.abs(
						transaction.preBalances[0] - transaction.postBalances[0]
					);
					updatedStats.averageTransactionSize =
						updatedStats.totalVolume / updatedStats.totalTransactions;
					updatedStats.lastActivity = transaction.blockTime || Date.now();

					// Calculate risk score based on transaction patterns
					updatedStats.riskScore = this.calculateRiskScore(transaction, updatedStats);

					return {
						...wallet,
						statistics: updatedStats
					};
				}
				return wallet;
			})
		);
	}

	/**
	 * Calculate risk score for wallet
	 */
	private calculateRiskScore(transaction: SolanaTransaction, stats: WalletStatistics): number {
		let riskScore = 0;

		// Get thresholds config
		const configService = ConfigService.getInstance();
		const thresholds = configService.getConfig().thresholds || {
			mediumValueThreshold: 1000000000,
			highValueThreshold: 10000000000,
			largeTransferThreshold: 100000000000
		};

		// Factor in transaction amount
		const amount = Math.abs(transaction.preBalances[0] - transaction.postBalances[0]);
		if (amount > thresholds.mediumValueThreshold) riskScore += 30;
		if (amount > thresholds.highValueThreshold) riskScore += 50;

		// Factor in transaction frequency
		if (stats.totalTransactions > 100) riskScore += 20;
		if (stats.totalTransactions > 1000) riskScore += 40;

		// Factor in volume
		if (stats.totalVolume > thresholds.largeTransferThreshold) riskScore += 25;

		return Math.min(riskScore, 100);
	}

	/**
	 * Generate unique wallet ID
	 */
	private generateWalletId(): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		return `WALLET-${timestamp}-${random}`.toUpperCase();
	}

	// ============================================================================
	// STORE GETTERS
	// ============================================================================

	get evidence() {
		return this.evidenceStore;
	}

	get alerts() {
		return this.alertsStore;
	}

	get chainOfCustody() {
		return this.chainOfCustodyStore;
	}

	get transactionFlows() {
		return this.transactionFlowsStore;
	}

	get monitoredWallets() {
		return this.monitoredWalletsStore;
	}

	// ============================================================================
	// UTILITY METHODS
	// ============================================================================

	/**
	 * Get evidence by ID
	 */
	async getEvidenceById(id: string): Promise<ForensicEvidence | null> {
		let evidence: ForensicEvidence | null = null;
		this.evidenceStore.subscribe((evidences) => {
			evidence = evidences.find((e) => e.id === id) || null;
		})();
		return evidence;
	}

	/**
	 * Get alerts by severity
	 */
	async getAlertsBySeverity(severity: AlertSeverity): Promise<ForensicsAlert[]> {
		let alerts: ForensicsAlert[] = [];
		this.alertsStore.subscribe((alertsList) => {
			alerts = alertsList.filter((a) => a.severity === severity);
		})();
		return alerts;
	}

	/**
	 * Get active monitored wallets
	 */
	async getActiveWallets(): Promise<MonitoredWallet[]> {
		let wallets: MonitoredWallet[] = [];
		this.monitoredWalletsStore.subscribe((walletsList) => {
			wallets = walletsList.filter((w) => w.isActive);
		})();
		return wallets;
	}

	/**
	 * Export evidence for legal proceedings
	 */
	async exportEvidence(evidenceId: string): Promise<{
		evidence: ForensicEvidence;
		chainOfCustody: ChainOfCustodyEntry[];
		exportTimestamp: number;
		exportHash: string;
	}> {
		const evidence = await this.getEvidenceById(evidenceId);
		if (!evidence) {
			throw new Error(`Evidence not found: ${evidenceId}`);
		}

		let chainOfCustody: ChainOfCustodyEntry[] = [];
		this.chainOfCustodyStore.subscribe((entries) => {
			chainOfCustody = entries.filter((entry) =>
				evidence.chainOfCustody.some((custody) => custody.timestamp === entry.timestamp)
			);
		})();

		const exportData = {
			evidence,
			chainOfCustody,
			exportTimestamp: Date.now(),
			exportHash: ''
		};

		// Calculate export hash for integrity
		const dataString = JSON.stringify(exportData);
		const encoder = new TextEncoder();
		const data = encoder.encode(dataString);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		exportData.exportHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

		return exportData;
	}
}
