/**
 * Solana-specific TypeScript interfaces
 * Extends @solana/web3.js types for forensics use cases
 */

import { PublicKey } from '@solana/web3.js';
import type { TransactionSignature, AccountInfo, ParsedAccountData } from '@solana/web3.js';

// ============================================================================
// SOLANA ACCOUNT TYPES
// ============================================================================

export interface SolanaAccount {
	pubkey: PublicKey;
	account: AccountInfo<Buffer | ParsedAccountData>;
	executable: boolean;
	lamports: number;
	owner: PublicKey;
	rentEpoch?: number;
	space: number;
	data: Buffer | ParsedAccountData;
}

export interface TokenAccount {
	mint: string;
	owner: string;
	amount: string;
	delegate?: string;
	delegatedAmount?: string;
	isInitialized: boolean;
	isFrozen: boolean;
	isNative: boolean;
	rentExemptReserve?: string;
	state: 'initialized' | 'frozen' | 'uninitialized';
}

// ============================================================================
// SOLANA PROGRAM TYPES
// ============================================================================

export interface ProgramInfo {
	programId: PublicKey;
	name: string;
	description: string;
	isKnown: boolean;
	category: ProgramCategory;
	riskLevel: 'low' | 'medium' | 'high' | 'critical';
	metadata: ProgramMetadata;
}

export type ProgramCategory =
	| 'system'
	| 'token'
	| 'dex'
	| 'nft'
	| 'defi'
	| 'gaming'
	| 'mixer'
	| 'unknown'
	| 'malicious';

export interface ProgramMetadata {
	verified: boolean;
	source?: string;
	documentation?: string;
	riskFactors: string[];
	lastUpdated: number;
}

// ============================================================================
// SOLANA TRANSACTION DETAILS
// ============================================================================

export interface SolanaTransactionDetails {
	signature: TransactionSignature;
	slot: number;
	blockTime: number | null;
	fee: number;
	status: TransactionStatus;
	computeUnitsConsumed?: number;
	logMessages: string[];
	accounts: SolanaAccount[];
	instructions: SolanaInstruction[];
	tokenTransfers: TokenTransfer[];
	balanceChanges: BalanceChange[];
	programLogs: ProgramLog[];
}

export type TransactionStatus = 'success' | 'failed' | 'timeout' | 'unknown';

export interface SolanaInstruction {
	programId: PublicKey;
	accounts: PublicKey[];
	data: Buffer;
	innerInstructions?: SolanaInstruction[];
	program: string;
	parsed?: ParsedInstruction;
}

export interface ParsedInstruction {
	type: string;
	info: Record<string, any>;
	program: string;
	programId: string;
}

export interface TokenTransfer {
	from: string;
	to: string;
	amount: string;
	mint: string;
	tokenStandard: 'fungible' | 'non-fungible';
	decimals: number;
}

export interface BalanceChange {
	account: string;
	preBalance: number;
	postBalance: number;
	change: number;
	token?: string;
}

export interface ProgramLog {
	programId: string;
	logs: string[];
	data?: string;
	innerInstructions?: SolanaInstruction[];
}

// ============================================================================
// SOLANA NETWORK TYPES
// ============================================================================

export interface SolanaNetworkInfo {
	cluster: 'mainnet-beta' | 'testnet' | 'devnet';
	rpcUrl: string;
	wsUrl: string;
	commitment: 'processed' | 'confirmed' | 'finalized';
	features: string[];
	version: string;
}

export interface SolanaClusterInfo {
	cluster: string;
	epochInfo: EpochInfo;
	inflation: InflationInfo;
	stakeInfo: StakeInfo;
	supply: SupplyInfo;
}

export interface EpochInfo {
	epoch: number;
	slotIndex: number;
	slotsInEpoch: number;
	absoluteSlot: number;
	blockHeight: number;
	transactionCount: number;
}

export interface InflationInfo {
	total: number;
	validator: number;
	foundation: number;
	epoch: number;
}

export interface StakeInfo {
	active: number;
	inactive: number;
	activating: number;
	deactivating: number;
}

export interface SupplyInfo {
	total: number;
	circulating: number;
	nonCirculating: number;
	nonCirculatingAccounts: string[];
}

// ============================================================================
// SOLANA VALIDATION TYPES
// ============================================================================

export interface SolanaValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationWarning[];
	metadata: ValidationMetadata;
}

export interface ValidationError {
	code: string;
	message: string;
	field?: string;
	severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
	code: string;
	message: string;
	field?: string;
	suggestion?: string;
}

export interface ValidationMetadata {
	validatedAt: number;
	validator: string;
	version: string;
	rules: string[];
}

// ============================================================================
// SOLANA MONITORING TYPES
// ============================================================================

export interface SolanaMonitorConfig {
	addresses: PublicKey[];
	programs: PublicKey[];
	tokens: string[];
	commitment: 'processed' | 'confirmed' | 'finalized';
	filters: MonitorFilter[];
	callbacks: MonitorCallbacks;
}

export interface MonitorFilter {
	type: 'amount' | 'program' | 'token' | 'time' | 'custom';
	operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
	value: any;
	enabled: boolean;
}

export interface MonitorCallbacks {
	onTransaction?: (transaction: SolanaTransactionDetails) => void;
	onAccountChange?: (account: SolanaAccount) => void;
	onProgramChange?: (program: ProgramInfo) => void;
	onError?: (error: Error) => void;
}

// ============================================================================
// SOLANA UTILITIES
// ============================================================================

export interface SolanaUtils {
	formatLamports: (lamports: number) => string;
	parseAddress: (address: string) => PublicKey | null;
	validateSignature: (signature: string) => boolean;
	calculateHash: (data: Buffer | string) => string;
	isSystemProgram: (programId: PublicKey) => boolean;
	isTokenProgram: (programId: PublicKey) => boolean;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
	// Re-export Solana types for convenience
	PublicKey,
	TransactionSignature,
	AccountInfo,
	ParsedAccountData
};
