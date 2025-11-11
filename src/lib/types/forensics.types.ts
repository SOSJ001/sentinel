/**
 * Solana Forensics MVP - Core TypeScript Interfaces
 * Designed for cyber forensics professionals with evidence integrity and chain of custody
 */

import { PublicKey } from '@solana/web3.js';
import type { TransactionSignature } from '@solana/web3.js';

// ============================================================================
// CORE TRANSACTION TYPES
// ============================================================================

export interface SolanaTransaction {
	signature: TransactionSignature;
	slot: number;
	blockTime: number | null;
	fee: number;
	status: 'success' | 'failed';
	accounts: string[];
	instructions: TransactionInstruction[];
	preBalances: number[];
	postBalances: number[];
	hash: string;
	evidenceHash: string; // SHA-256 hash for evidence integrity
}

export interface TransactionInstruction {
	programId: string;
	accounts: string[];
	data: string;
	innerInstructions?: TransactionInstruction[];
}

// ============================================================================
// FORENSICS EVIDENCE TYPES
// ============================================================================

export interface ForensicEvidence {
	id: string;
	transactionId: string;
	timestamp: number;
	evidenceType: EvidenceType;
	description: string;
	data: Record<string, any>;
	hash: string; // Cryptographic hash for integrity
	chainOfCustody: ChainOfCustodyEntry[];
	metadata: EvidenceMetadata;
}

export type EvidenceType =
	| 'suspicious_transaction'
	| 'large_transfer'
	| 'rapid_movement'
	| 'mixer_interaction'
	| 'new_wallet_creation'
	| 'unusual_pattern'
	| 'potential_hack';

export interface ChainOfCustodyEntry {
	timestamp: number;
	action: 'created' | 'accessed' | 'modified' | 'transferred';
	actor: string; // User/system that performed the action
	description: string;
	hash: string; // Hash of the evidence at this point
}

export interface EvidenceMetadata {
	caseId?: string;
	investigator: string;
	priority: 'low' | 'medium' | 'high' | 'critical';
	tags: string[];
	notes: string;
	attachments: string[]; // File paths or URLs
}

// ============================================================================
// ALERT SYSTEM TYPES
// ============================================================================

export interface ForensicsAlert {
	id: string;
	timestamp: number;
	severity: AlertSeverity;
	type: AlertType;
	title: string;
	description: string;
	transactionId: string;
	walletAddress: string;
	evidence: ForensicEvidence;
	status: AlertStatus;
	assignedTo?: string;
	resolution?: AlertResolution;
	notifications: NotificationLog[];
}

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'emergency';
export type AlertType =
	| 'suspicious_activity'
	| 'large_transfer'
	| 'rapid_movement'
	| 'mixer_detected'
	| 'potential_hack'
	| 'unusual_pattern';

export type AlertStatus = 'new' | 'acknowledged' | 'investigating' | 'resolved' | 'dismissed';

export interface AlertResolution {
	timestamp: number;
	resolvedBy: string;
	resolution: string;
	evidence: string[];
}

export interface NotificationLog {
	timestamp: number;
	method: 'desktop' | 'email' | 'webhook' | 'sms';
	recipient: string;
	status: 'sent' | 'delivered' | 'failed';
	response?: string;
}

// ============================================================================
// VALIDATION RULES TYPES
// ============================================================================

export interface ValidationRule {
	id: string;
	name: string;
	description: string;
	enabled: boolean;
	severity: AlertSeverity;
	conditions: ValidationCondition[];
	actions: ValidationAction[];
	metadata: RuleMetadata;
}

export interface ValidationCondition {
	field: string;
	operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'ne' | 'contains' | 'regex';
	value: any;
	description: string;
}

export interface ValidationAction {
	type: 'alert' | 'log' | 'notify' | 'trace' | 'block';
	parameters: Record<string, any>;
}

export interface RuleMetadata {
	createdBy: string;
	createdAt: number;
	updatedAt: number;
	version: number;
	tags: string[];
}

// ============================================================================
// TRACING AND FLOW ANALYSIS TYPES
// ============================================================================

export interface TransactionFlow {
	id: string;
	rootTransaction: string;
	depth: number;
	nodes: FlowNode[];
	edges: FlowEdge[];
	analysis: FlowAnalysis;
	metadata: FlowMetadata;
}

export interface FlowNode {
	id: string;
	address: string;
	type: 'wallet' | 'program' | 'token' | 'unknown';
	balance: number;
	transactionCount: number;
	riskScore: number;
	metadata: NodeMetadata;
}

export interface FlowEdge {
	from: string;
	to: string;
	amount: number;
	token: string;
	transactionId: string;
	timestamp: number;
	riskScore: number;
}

export interface FlowAnalysis {
	totalValue: number;
	hopCount: number;
	suspiciousPatterns: string[];
	riskAssessment: RiskAssessment;
	recommendations: string[];
}

export interface RiskAssessment {
	overall: number; // 0-100
	factors: {
		mixer: number;
		newWallets: number;
		velocity: number;
		amount: number;
		patterns: number;
	};
	confidence: number; // 0-100
}

export interface FlowMetadata {
	analyzedAt: number;
	analyzer: string;
	caseId?: string;
	notes: string;
}

export interface NodeMetadata {
	isKnown: boolean;
	isExchange: boolean;
	isMixer: boolean;
	firstSeen: number;
	lastSeen: number;
	labels: string[];
}

// ============================================================================
// WALLET MONITORING TYPES
// ============================================================================

export interface MonitoredWallet {
	id: string;
	address: string;
	label: string;
	description: string;
	isActive: boolean;
	rules: string[]; // Validation rule IDs
	metadata: WalletMetadata;
	statistics: WalletStatistics;
}

export interface WalletMetadata {
	addedBy: string;
	addedAt: number;
	caseId?: string;
	tags: string[];
	notes: string;
	riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface WalletStatistics {
	totalTransactions: number;
	totalVolume: number;
	averageTransactionSize: number;
	lastActivity: number;
	alertCount: number;
	riskScore: number;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface ForensicsConfig {
	solana: {
		rpcUrl: string;
		wsUrl: string;
		commitment: 'processed' | 'confirmed' | 'finalized';
	};
	monitoring: {
		batchSize: number;
		maxRetries: number;
		timeout: number;
		transactionCacheSize: number;
		recentTransactionLimit: number;
		monitoringTransactionLimit: number;
		pollingTransactionLimit: number;
		pollingInterval: number;
		connectionTimeout: number;
		confirmTransactionTimeout: number;
	};
	thresholds: {
		largeTransferThreshold: number; // in lamports (default: 100 SOL)
		minimumTransferThreshold: number; // in lamports (default: 0.001 SOL)
		highValueThreshold: number; // in lamports (default: 10 SOL)
		mediumValueThreshold: number; // in lamports (default: 1 SOL)
		maxAmount: number; // in SOL (default: 100 SOL) - UI configurable
		maxSpeed: number; // in seconds (default: 60) - UI configurable
	};
	alerts: {
		enabled: boolean;
		desktopNotifications: boolean;
		emailNotifications: boolean;
		webhookUrl?: string;
	};
	evidence: {
		retentionDays: number;
		encryptionEnabled: boolean;
		backupEnabled: boolean;
	};
	ui: {
		theme: 'light' | 'dark';
		refreshInterval: number;
		maxDisplayItems: number;
	};
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	timestamp: number;
	requestId: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface Timestamped {
	timestamp: number;
}

export interface Hashable {
	hash: string;
}

export interface Identifiable {
	id: string;
}

export interface Auditable {
	createdAt: number;
	createdBy: string;
	updatedAt: number;
	updatedBy: string;
}

// ============================================================================
// EVIDENCE COLLECTION TYPES
// ============================================================================

export interface EvidenceCollection {
	id: string;
	caseId: string;
	title: string;
	description: string;
	createdAt: number;
	createdBy: string;
	evidenceIds: string[];
	status: 'active' | 'archived' | 'sealed';
	metadata: CollectionMetadata;
}

export interface CollectionMetadata {
	tags: string[];
	priority: 'low' | 'medium' | 'high' | 'critical';
	classification: 'public' | 'internal' | 'confidential' | 'top_secret';
	jurisdiction: string;
	retentionPeriod: number; // days
	encryptionKey?: string;
}

// ============================================================================
// EVIDENCE ANALYSIS TYPES
// ============================================================================

export interface EvidenceAnalysis {
	evidenceId: string;
	analysisType: 'transaction_flow' | 'wallet_behavior' | 'suspicious_patterns' | 'risk_assessment';
	results: AnalysisResults;
	confidence: number;
	recommendations: string[];
	analyzedAt: number;
	analyzedBy: string;
}

export interface AnalysisResults {
	summary: string;
	keyFindings: string[];
	riskScore: number;
	patterns: string[];
	connections: string[];
	metadata: Record<string, any>;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
	// Re-export commonly used types for convenience
	PublicKey,
	TransactionSignature
};
