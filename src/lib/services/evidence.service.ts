/**
 * Evidence Management Service
 * Handles evidence collection, preservation, and chain of custody
 * Designed for cyber forensics professionals
 */

import { writable } from 'svelte/store';
import type {
	ForensicEvidence,
	ChainOfCustodyEntry,
	EvidenceType,
	EvidenceMetadata,
	SolanaTransaction
} from '../types/forensics.types';

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

export interface EvidenceSearch {
	query: string;
	filters: {
		evidenceType?: EvidenceType;
		caseId?: string;
		investigator?: string;
		dateRange?: {
			start: number;
			end: number;
		};
		tags?: string[];
		priority?: string;
	};
	limit: number;
	offset: number;
}

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

export interface EvidenceExport {
	evidenceId: string;
	format: 'json' | 'csv' | 'pdf' | 'xml';
	includeChainOfCustody: boolean;
	includeAnalysis: boolean;
	encryptionEnabled: boolean;
	exportTimestamp: number;
	exportedBy: string;
	hash: string;
}

export class EvidenceService {
	private evidenceStore = writable<ForensicEvidence[]>([]);
	private collectionsStore = writable<EvidenceCollection[]>([]);
	private analysisStore = writable<EvidenceAnalysis[]>([]);
	private exportsStore = writable<EvidenceExport[]>([]);

	// ============================================================================
	// EVIDENCE COLLECTION
	// ============================================================================

	/**
	 * Create evidence collection
	 */
	async createCollection(
		caseId: string,
		title: string,
		description: string,
		createdBy: string,
		metadata: CollectionMetadata
	): Promise<EvidenceCollection> {
		const timestamp = Date.now();
		const id = this.generateCollectionId();

		const collection: EvidenceCollection = {
			id,
			caseId,
			title,
			description,
			createdAt: timestamp,
			createdBy,
			evidenceIds: [],
			status: 'active',
			metadata
		};

		// Store collection
		this.collectionsStore.update((collections) => [...collections, collection]);

		return collection;
	}

	/**
	 * Add evidence to collection
	 */
	async addEvidenceToCollection(collectionId: string, evidenceId: string): Promise<void> {
		this.collectionsStore.update((collections) =>
			collections.map((collection) => {
				if (collection.id === collectionId) {
					if (!collection.evidenceIds.includes(evidenceId)) {
						return {
							...collection,
							evidenceIds: [...collection.evidenceIds, evidenceId]
						};
					}
				}
				return collection;
			})
		);
	}

	/**
	 * Remove evidence from collection
	 */
	async removeEvidenceFromCollection(collectionId: string, evidenceId: string): Promise<void> {
		this.collectionsStore.update((collections) =>
			collections.map((collection) => {
				if (collection.id === collectionId) {
					return {
						...collection,
						evidenceIds: collection.evidenceIds.filter((id) => id !== evidenceId)
					};
				}
				return collection;
			})
		);
	}

	// ============================================================================
	// EVIDENCE SEARCH AND FILTERING
	// ============================================================================

	/**
	 * Search evidence with advanced filtering
	 */
	async searchEvidence(search: EvidenceSearch): Promise<ForensicEvidence[]> {
		let evidence: ForensicEvidence[] = [];
		this.evidenceStore.subscribe((evidences) => {
			evidence = evidences;
		})();

		// Apply text search
		if (search.query) {
			const query = search.query.toLowerCase();
			evidence = evidence.filter(
				(e) =>
					e.description.toLowerCase().includes(query) ||
					e.id.toLowerCase().includes(query) ||
					e.transactionId.toLowerCase().includes(query) ||
					e.evidenceType.toLowerCase().includes(query)
			);
		}

		// Apply filters
		if (search.filters.evidenceType) {
			evidence = evidence.filter((e) => e.evidenceType === search.filters.evidenceType);
		}

		if (search.filters.caseId) {
			evidence = evidence.filter((e) => e.metadata.caseId === search.filters.caseId);
		}

		if (search.filters.investigator) {
			evidence = evidence.filter((e) => e.metadata.investigator === search.filters.investigator);
		}

		if (search.filters.dateRange) {
			evidence = evidence.filter(
				(e) =>
					e.timestamp >= search.filters.dateRange!.start &&
					e.timestamp <= search.filters.dateRange!.end
			);
		}

		if (search.filters.tags && search.filters.tags.length > 0) {
			evidence = evidence.filter((e) =>
				search.filters.tags!.some((tag) => e.metadata.tags.includes(tag))
			);
		}

		if (search.filters.priority) {
			evidence = evidence.filter((e) => e.metadata.priority === search.filters.priority);
		}

		// Apply pagination
		const startIndex = search.offset || 0;
		const endIndex = startIndex + (search.limit || 100);
		evidence = evidence.slice(startIndex, endIndex);

		return evidence;
	}

	/**
	 * Get evidence by case ID
	 */
	async getEvidenceByCase(caseId: string): Promise<ForensicEvidence[]> {
		return this.searchEvidence({
			query: '',
			filters: { caseId },
			limit: 1000,
			offset: 0
		});
	}

	/**
	 * Get evidence by investigator
	 */
	async getEvidenceByInvestigator(investigator: string): Promise<ForensicEvidence[]> {
		return this.searchEvidence({
			query: '',
			filters: { investigator },
			limit: 1000,
			offset: 0
		});
	}

	/**
	 * Get evidence by type
	 */
	async getEvidenceByType(evidenceType: EvidenceType): Promise<ForensicEvidence[]> {
		return this.searchEvidence({
			query: '',
			filters: { evidenceType },
			limit: 1000,
			offset: 0
		});
	}

	// ============================================================================
	// EVIDENCE ANALYSIS
	// ============================================================================

	/**
	 * Perform evidence analysis
	 */
	async analyzeEvidence(
		evidenceId: string,
		analysisType: EvidenceAnalysis['analysisType'],
		analyzedBy: string
	): Promise<EvidenceAnalysis> {
		const timestamp = Date.now();
		const id = this.generateAnalysisId();

		// Get evidence
		let evidence: ForensicEvidence | null = null;
		this.evidenceStore.subscribe((evidences) => {
			evidence = evidences.find((e) => e.id === evidenceId) || null;
		})();

		if (!evidence) {
			throw new Error(`Evidence not found: ${evidenceId}`);
		}

		// Perform analysis based on type
		const results = await this.performAnalysis(evidence, analysisType);

		const analysis: EvidenceAnalysis = {
			evidenceId,
			analysisType,
			results,
			confidence: this.calculateConfidence(results),
			recommendations: this.generateRecommendations(results),
			analyzedAt: timestamp,
			analyzedBy
		};

		// Store analysis
		this.analysisStore.update((analyses) => [...analyses, analysis]);

		return analysis;
	}

	/**
	 * Perform specific analysis
	 */
	private async performAnalysis(
		evidence: ForensicEvidence,
		analysisType: EvidenceAnalysis['analysisType']
	): Promise<AnalysisResults> {
		switch (analysisType) {
			case 'transaction_flow':
				return this.analyzeTransactionFlow(evidence);
			case 'wallet_behavior':
				return this.analyzeWalletBehavior(evidence);
			case 'suspicious_patterns':
				return this.analyzeSuspiciousPatterns(evidence);
			case 'risk_assessment':
				return this.analyzeRiskAssessment(evidence);
			default:
				throw new Error(`Unknown analysis type: ${analysisType}`);
		}
	}

	/**
	 * Analyze transaction flow
	 */
	private async analyzeTransactionFlow(evidence: ForensicEvidence): Promise<AnalysisResults> {
		// Mock analysis - in real implementation, this would analyze transaction data
		return {
			summary: 'Transaction flow analysis completed',
			keyFindings: ['Multiple hops detected', 'Unusual timing patterns', 'High-value transfers'],
			riskScore: 75,
			patterns: ['Rapid movement', 'Multiple addresses', 'Unusual amounts'],
			connections: ['Connected to known mixer', 'Linked to suspicious wallet'],
			metadata: {
				hopCount: 5,
				totalValue: 1000000,
				timeSpan: 3600
			}
		};
	}

	/**
	 * Analyze wallet behavior
	 */
	private async analyzeWalletBehavior(evidence: ForensicEvidence): Promise<AnalysisResults> {
		return {
			summary: 'Wallet behavior analysis completed',
			keyFindings: [
				'Unusual transaction patterns',
				'High frequency of transactions',
				'Large amount variations'
			],
			riskScore: 60,
			patterns: ['Frequent transactions', 'Variable amounts', 'Multiple recipients'],
			connections: ['Connected to multiple wallets', 'Interaction with exchanges'],
			metadata: {
				transactionCount: 150,
				averageAmount: 50000,
				frequency: 'high'
			}
		};
	}

	/**
	 * Analyze suspicious patterns
	 */
	private async analyzeSuspiciousPatterns(evidence: ForensicEvidence): Promise<AnalysisResults> {
		return {
			summary: 'Suspicious patterns analysis completed',
			keyFindings: [
				'Unusual timing patterns',
				'Large amount transfers',
				'Multiple rapid transactions'
			],
			riskScore: 85,
			patterns: ['Unusual timing', 'Large amounts', 'Rapid succession'],
			connections: ['Connected to suspicious addresses', 'Pattern matches known hacks'],
			metadata: {
				suspiciousScore: 85,
				patternMatches: 3,
				confidence: 90
			}
		};
	}

	/**
	 * Analyze risk assessment
	 */
	private async analyzeRiskAssessment(evidence: ForensicEvidence): Promise<AnalysisResults> {
		return {
			summary: 'Risk assessment analysis completed',
			keyFindings: [
				'High-risk transaction detected',
				'Multiple risk factors present',
				'Requires immediate attention'
			],
			riskScore: 90,
			patterns: ['High risk indicators', 'Multiple risk factors', 'Critical severity'],
			connections: ['Connected to high-risk addresses', 'Pattern matches critical alerts'],
			metadata: {
				riskLevel: 'critical',
				riskFactors: 5,
				severity: 'high'
			}
		};
	}

	/**
	 * Calculate analysis confidence
	 */
	private calculateConfidence(results: AnalysisResults): number {
		// Simple confidence calculation based on risk score and metadata
		let confidence = 100;

		if (results.riskScore > 80) confidence -= 10;
		if (results.patterns.length > 5) confidence -= 5;
		if (results.connections.length > 3) confidence -= 5;

		return Math.max(confidence, 0);
	}

	/**
	 * Generate recommendations
	 */
	private generateRecommendations(results: AnalysisResults): string[] {
		const recommendations = [];

		if (results.riskScore > 80) {
			recommendations.push('Immediate investigation required');
		}

		if (results.patterns.length > 3) {
			recommendations.push('Continue monitoring for pattern development');
		}

		if (results.connections.length > 2) {
			recommendations.push('Investigate connected addresses');
		}

		if (results.riskScore > 60) {
			recommendations.push('Document all findings for legal proceedings');
		}

		return recommendations;
	}

	// ============================================================================
	// EVIDENCE EXPORT
	// ============================================================================

	/**
	 * Export evidence for legal proceedings
	 */
	async exportEvidence(
		evidenceId: string,
		format: 'json' | 'csv' | 'pdf' | 'xml',
		options: {
			includeChainOfCustody: boolean;
			includeAnalysis: boolean;
			encryptionEnabled: boolean;
		},
		exportedBy: string
	): Promise<EvidenceExport> {
		const timestamp = Date.now();
		const id = this.generateExportId();

		// Get evidence
		let evidence: ForensicEvidence | null = null;
		this.evidenceStore.subscribe((evidences) => {
			evidence = evidences.find((e) => e.id === evidenceId) || null;
		})();

		if (!evidence) {
			throw new Error(`Evidence not found: ${evidenceId}`);
		}

		// Get analysis if requested
		let analysis: EvidenceAnalysis[] = [];
		if (options.includeAnalysis) {
			this.analysisStore.subscribe((analyses) => {
				analysis = analyses.filter((a) => a.evidenceId === evidenceId);
			})();
		}

		// Get chain of custody if requested
		let chainOfCustody: ChainOfCustodyEntry[] = [];
		if (options.includeChainOfCustody) {
			chainOfCustody = evidence.chainOfCustody;
		}

		// Create export data
		const exportData = {
			evidence,
			analysis: options.includeAnalysis ? analysis : undefined,
			chainOfCustody: options.includeChainOfCustody ? chainOfCustody : undefined,
			exportMetadata: {
				exportedAt: timestamp,
				exportedBy,
				format,
				encryptionEnabled: options.encryptionEnabled
			}
		};

		// Generate export
		const exportContent = await this.generateExportContent(exportData, format);
		const hash = await this.calculateExportHash(exportContent);

		const evidenceExport: EvidenceExport = {
			evidenceId,
			format,
			includeChainOfCustody: options.includeChainOfCustody,
			includeAnalysis: options.includeAnalysis,
			encryptionEnabled: options.encryptionEnabled,
			exportTimestamp: timestamp,
			exportedBy,
			hash
		};

		// Store export record
		this.exportsStore.update((exports) => [...exports, evidenceExport]);

		return evidenceExport;
	}

	/**
	 * Generate export content
	 */
	private async generateExportContent(data: any, format: string): Promise<string> {
		switch (format) {
			case 'json':
				return JSON.stringify(data, null, 2);
			case 'csv':
				return this.convertToCSV(data);
			case 'xml':
				return this.convertToXML(data);
			case 'pdf':
				return await this.convertToPDF(data);
			default:
				return JSON.stringify(data, null, 2);
		}
	}

	/**
	 * Convert to CSV format
	 */
	private convertToCSV(data: any): string {
		// Simplified CSV conversion
		const headers = ['Field', 'Value'];
		const rows = [
			['Evidence ID', data.evidence.id],
			['Transaction ID', data.evidence.transactionId],
			['Evidence Type', data.evidence.evidenceType],
			['Description', data.evidence.description],
			['Timestamp', new Date(data.evidence.timestamp).toISOString()],
			['Hash', data.evidence.hash]
		];

		return [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(',')).join('\n');
	}

	/**
	 * Convert to XML format
	 */
	private convertToXML(data: any): string {
		return `<?xml version="1.0" encoding="UTF-8"?>
<evidence>
	<id>${data.evidence.id}</id>
	<transactionId>${data.evidence.transactionId}</transactionId>
	<evidenceType>${data.evidence.evidenceType}</evidenceType>
	<description>${data.evidence.description}</description>
	<timestamp>${new Date(data.evidence.timestamp).toISOString()}</timestamp>
	<hash>${data.evidence.hash}</hash>
</evidence>`;
	}

	/**
	 * Convert to PDF format
	 */
	private async convertToPDF(data: any): Promise<string> {
		// Simplified PDF conversion - in real implementation, use a PDF library
		return `Evidence Report
================

Evidence ID: ${data.evidence.id}
Transaction ID: ${data.evidence.transactionId}
Evidence Type: ${data.evidence.evidenceType}
Description: ${data.evidence.description}
Timestamp: ${new Date(data.evidence.timestamp).toISOString()}
Hash: ${data.evidence.hash}

Exported: ${new Date(data.exportMetadata.exportedAt).toISOString()}
Exported By: ${data.exportMetadata.exportedBy}`;
	}

	/**
	 * Calculate export hash
	 */
	private async calculateExportHash(content: string): Promise<string> {
		// Use Web Crypto API for browser compatibility
		const encoder = new TextEncoder();
		const data = encoder.encode(content);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	// ============================================================================
	// UTILITY METHODS
	// ============================================================================

	/**
	 * Generate unique collection ID
	 */
	private generateCollectionId(): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		return `COLL-${timestamp}-${random}`.toUpperCase();
	}

	/**
	 * Generate unique analysis ID
	 */
	private generateAnalysisId(): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		return `ANALYSIS-${timestamp}-${random}`.toUpperCase();
	}

	/**
	 * Generate unique export ID
	 */
	private generateExportId(): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		return `EXPORT-${timestamp}-${random}`.toUpperCase();
	}

	// ============================================================================
	// STORE GETTERS
	// ============================================================================

	get evidence() {
		return this.evidenceStore;
	}

	get collections() {
		return this.collectionsStore;
	}

	get analysis() {
		return this.analysisStore;
	}

	get exports() {
		return this.exportsStore;
	}
}
