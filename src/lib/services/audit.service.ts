/**
 * Audit Service
 * Comprehensive logging and audit trail for forensics professionals
 * Ensures compliance with legal and regulatory requirements
 */

import { writable } from 'svelte/store';
import type { Timestamped, Auditable } from '../types/forensics.types';

export interface AuditLog extends Timestamped, Auditable {
	id: string;
	action: AuditAction;
	resource: string;
	resourceId: string;
	actor: string;
	details: AuditDetails;
	ipAddress?: string;
	userAgent?: string;
	sessionId?: string;
	hash: string; // Cryptographic hash for integrity
}

export interface AuditDetails {
	description: string;
	before?: Record<string, any>;
	after?: Record<string, any>;
	metadata?: Record<string, any>;
	riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export type AuditAction =
	| 'login'
	| 'logout'
	| 'evidence_created'
	| 'evidence_accessed'
	| 'evidence_modified'
	| 'evidence_exported'
	| 'alert_created'
	| 'alert_acknowledged'
	| 'alert_resolved'
	| 'wallet_added'
	| 'wallet_removed'
	| 'monitoring_started'
	| 'monitoring_stopped'
	| 'trace_initiated'
	| 'trace_completed'
	| 'configuration_changed'
	| 'user_created'
	| 'user_modified'
	| 'user_deleted'
	| 'permission_granted'
	| 'permission_revoked'
	| 'system_startup'
	| 'system_shutdown'
	| 'error_occurred'
	| 'security_violation';

export interface AuditFilter {
	startDate?: number;
	endDate?: number;
	actor?: string;
	action?: AuditAction;
	resource?: string;
	riskLevel?: 'low' | 'medium' | 'high' | 'critical';
	limit?: number;
	offset?: number;
}

export interface AuditReport {
	id: string;
	title: string;
	description: string;
	generatedAt: number;
	generatedBy: string;
	period: {
		start: number;
		end: number;
	};
	summary: AuditSummary;
	details: AuditLog[];
	compliance: ComplianceStatus;
	hash: string;
}

export interface AuditSummary {
	totalEvents: number;
	eventsByAction: Record<AuditAction, number>;
	eventsByActor: Record<string, number>;
	eventsByRiskLevel: Record<string, number>;
	criticalEvents: number;
	securityViolations: number;
	complianceScore: number;
}

export interface ComplianceStatus {
	gdpr: boolean;
	sox: boolean;
	hipaa: boolean;
	pci: boolean;
	iso27001: boolean;
	overall: boolean;
	issues: string[];
}

export class AuditService {
	private auditLogsStore = writable<AuditLog[]>([]);
	private auditReportsStore = writable<AuditReport[]>([]);
	private isLoggingEnabled = true;
	private retentionDays = 2555; // 7 years for legal compliance

	// ============================================================================
	// AUDIT LOGGING
	// ============================================================================

	/**
	 * Log audit event with comprehensive details
	 */
	async logEvent(
		action: AuditAction,
		resource: string,
		resourceId: string,
		actor: string,
		details: AuditDetails,
		metadata?: {
			ipAddress?: string;
			userAgent?: string;
			sessionId?: string;
		}
	): Promise<AuditLog> {
		if (!this.isLoggingEnabled) {
			return {} as AuditLog;
		}

		const timestamp = Date.now();
		const id = this.generateAuditId();

		const auditLog: AuditLog = {
			id,
			action,
			resource,
			resourceId,
			actor,
			details,
			timestamp,
			createdAt: timestamp,
			createdBy: actor,
			updatedAt: timestamp,
			updatedBy: actor,
			ipAddress: metadata?.ipAddress,
			userAgent: metadata?.userAgent,
			sessionId: metadata?.sessionId,
			hash: '' // Will be calculated
		};

		// Calculate cryptographic hash for integrity
		auditLog.hash = await this.calculateAuditHash(auditLog);

		// Store audit log
		this.auditLogsStore.update((logs) => [...logs, auditLog]);

		// Check for security violations
		await this.checkSecurityViolations(auditLog);

		// Cleanup old logs if needed
		await this.cleanupOldLogs();

		return auditLog;
	}

	/**
	 * Calculate SHA-256 hash for audit log integrity
	 */
	private async calculateAuditHash(auditLog: Omit<AuditLog, 'hash'>): Promise<string> {
		const dataString = JSON.stringify({
			id: auditLog.id,
			action: auditLog.action,
			resource: auditLog.resource,
			resourceId: auditLog.resourceId,
			actor: auditLog.actor,
			details: auditLog.details,
			timestamp: auditLog.timestamp,
			ipAddress: auditLog.ipAddress,
			userAgent: auditLog.userAgent,
			sessionId: auditLog.sessionId
		});

		// Use Web Crypto API for browser compatibility
		const encoder = new TextEncoder();
		const data = encoder.encode(dataString);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	/**
	 * Verify audit log integrity
	 */
	async verifyAuditIntegrity(auditLog: AuditLog): Promise<boolean> {
		const calculatedHash = await this.calculateAuditHash(auditLog);
		return calculatedHash === auditLog.hash;
	}

	/**
	 * Check for security violations
	 */
	private async checkSecurityViolations(auditLog: AuditLog): Promise<void> {
		const violations = [];

		// Check for suspicious patterns
		if (auditLog.action === 'security_violation') {
			violations.push('Security violation detected');
		}

		// Check for high-risk actions
		if (auditLog.details.riskLevel === 'critical') {
			violations.push('Critical risk action performed');
		}

		// Check for unusual access patterns
		if (auditLog.action === 'evidence_accessed' && auditLog.details.metadata?.unusualTime) {
			violations.push('Evidence accessed at unusual time');
		}

		// Log security violations
		if (violations.length > 0) {
			await this.logEvent('security_violation', 'audit_system', auditLog.id, 'system', {
				description: `Security violations detected: ${violations.join(', ')}`,
				riskLevel: 'critical',
				metadata: { violations, originalLog: auditLog.id }
			});
		}
	}

	// ============================================================================
	// AUDIT QUERIES AND FILTERING
	// ============================================================================

	/**
	 * Get audit logs with filtering
	 */
	async getAuditLogs(filter: AuditFilter = {}): Promise<AuditLog[]> {
		let logs: AuditLog[] = [];
		this.auditLogsStore.subscribe((auditLogs) => {
			logs = auditLogs;
		})();

		// Apply filters
		let filteredLogs = logs;

		if (filter.startDate) {
			filteredLogs = filteredLogs.filter((log) => log.timestamp >= filter.startDate!);
		}

		if (filter.endDate) {
			filteredLogs = filteredLogs.filter((log) => log.timestamp <= filter.endDate!);
		}

		if (filter.actor) {
			filteredLogs = filteredLogs.filter((log) => log.actor === filter.actor);
		}

		if (filter.action) {
			filteredLogs = filteredLogs.filter((log) => log.action === filter.action);
		}

		if (filter.resource) {
			filteredLogs = filteredLogs.filter((log) => log.resource === filter.resource);
		}

		if (filter.riskLevel) {
			filteredLogs = filteredLogs.filter((log) => log.details.riskLevel === filter.riskLevel);
		}

		// Apply pagination
		if (filter.offset) {
			filteredLogs = filteredLogs.slice(filter.offset);
		}

		if (filter.limit) {
			filteredLogs = filteredLogs.slice(0, filter.limit);
		}

		return filteredLogs;
	}

	/**
	 * Get audit logs by actor
	 */
	async getAuditLogsByActor(actor: string, limit: number = 100): Promise<AuditLog[]> {
		return this.getAuditLogs({ actor, limit });
	}

	/**
	 * Get audit logs by resource
	 */
	async getAuditLogsByResource(resource: string, resourceId: string): Promise<AuditLog[]> {
		return this.getAuditLogs({ resource, limit: 1000 });
	}

	/**
	 * Get critical events
	 */
	async getCriticalEvents(limit: number = 50): Promise<AuditLog[]> {
		return this.getAuditLogs({ riskLevel: 'critical', limit });
	}

	// ============================================================================
	// AUDIT REPORTS
	// ============================================================================

	/**
	 * Generate comprehensive audit report
	 */
	async generateAuditReport(
		title: string,
		description: string,
		generatedBy: string,
		startDate: number,
		endDate: number
	): Promise<AuditReport> {
		const generatedAt = Date.now();
		const id = this.generateReportId();

		// Get logs for the period
		const logs = await this.getAuditLogs({
			startDate,
			endDate,
			limit: 10000
		});

		// Generate summary
		const summary = this.generateAuditSummary(logs);

		// Check compliance
		const compliance = this.checkCompliance(logs);

		const report: AuditReport = {
			id,
			title,
			description,
			generatedAt,
			generatedBy,
			period: { start: startDate, end: endDate },
			summary,
			details: logs,
			compliance,
			hash: '' // Will be calculated
		};

		// Calculate report hash
		report.hash = await this.calculateReportHash(report);

		// Store report
		this.auditReportsStore.update((reports) => [...reports, report]);

		return report;
	}

	/**
	 * Generate audit summary
	 */
	private generateAuditSummary(logs: AuditLog[]): AuditSummary {
		const summary: AuditSummary = {
			totalEvents: logs.length,
			eventsByAction: {} as Record<AuditAction, number>,
			eventsByActor: {},
			eventsByRiskLevel: { low: 0, medium: 0, high: 0, critical: 0 },
			criticalEvents: 0,
			securityViolations: 0,
			complianceScore: 0
		};

		// Process logs
		for (const log of logs) {
			// Count by action
			summary.eventsByAction[log.action] = (summary.eventsByAction[log.action] || 0) + 1;

			// Count by actor
			summary.eventsByActor[log.actor] = (summary.eventsByActor[log.actor] || 0) + 1;

			// Count by risk level
			summary.eventsByRiskLevel[log.details.riskLevel]++;

			// Count critical events
			if (log.details.riskLevel === 'critical') {
				summary.criticalEvents++;
			}

			// Count security violations
			if (log.action === 'security_violation') {
				summary.securityViolations++;
			}
		}

		// Calculate compliance score
		summary.complianceScore = this.calculateComplianceScore(summary);

		return summary;
	}

	/**
	 * Check compliance status
	 */
	private checkCompliance(logs: AuditLog[]): ComplianceStatus {
		const compliance: ComplianceStatus = {
			gdpr: true,
			sox: true,
			hipaa: true,
			pci: true,
			iso27001: true,
			overall: true,
			issues: []
		};

		// Check GDPR compliance
		const dataAccessLogs = logs.filter(
			(log) => log.action === 'evidence_accessed' || log.action === 'evidence_exported'
		);
		if (dataAccessLogs.length === 0) {
			compliance.gdpr = false;
			compliance.issues.push('No data access logging found');
		}

		// Check SOX compliance
		const financialLogs = logs.filter(
			(log) => log.resource === 'transaction' || log.resource === 'wallet'
		);
		if (financialLogs.length === 0) {
			compliance.sox = false;
			compliance.issues.push('No financial transaction logging found');
		}

		// Check for security violations
		const securityViolations = logs.filter((log) => log.action === 'security_violation');
		if (securityViolations.length > 0) {
			compliance.overall = false;
			compliance.issues.push(`${securityViolations.length} security violations found`);
		}

		// Overall compliance
		compliance.overall =
			compliance.gdpr &&
			compliance.sox &&
			compliance.hipaa &&
			compliance.pci &&
			compliance.iso27001 &&
			compliance.issues.length === 0;

		return compliance;
	}

	/**
	 * Calculate compliance score
	 */
	private calculateComplianceScore(summary: AuditSummary): number {
		let score = 100;

		// Deduct points for critical events
		score -= summary.criticalEvents * 5;

		// Deduct points for security violations
		score -= summary.securityViolations * 10;

		// Deduct points for high-risk events
		score -= summary.eventsByRiskLevel.high * 2;

		return Math.max(score, 0);
	}

	/**
	 * Calculate report hash
	 */
	private async calculateReportHash(report: Omit<AuditReport, 'hash'>): Promise<string> {
		const dataString = JSON.stringify({
			id: report.id,
			title: report.title,
			generatedAt: report.generatedAt,
			generatedBy: report.generatedBy,
			period: report.period,
			summary: report.summary,
			compliance: report.compliance
		});

		// Use Web Crypto API for browser compatibility
		const encoder = new TextEncoder();
		const data = encoder.encode(dataString);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	// ============================================================================
	// UTILITY METHODS
	// ============================================================================

	/**
	 * Generate unique audit ID
	 */
	private generateAuditId(): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		return `AUDIT-${timestamp}-${random}`.toUpperCase();
	}

	/**
	 * Generate unique report ID
	 */
	private generateReportId(): string {
		const timestamp = Date.now();
		const random = Math.random().toString(36).substring(2, 15);
		return `REPORT-${timestamp}-${random}`.toUpperCase();
	}

	/**
	 * Cleanup old audit logs
	 */
	private async cleanupOldLogs(): Promise<void> {
		const cutoffDate = Date.now() - this.retentionDays * 24 * 60 * 60 * 1000;

		this.auditLogsStore.update((logs) => logs.filter((log) => log.timestamp > cutoffDate));
	}

	/**
	 * Enable/disable audit logging
	 */
	setLoggingEnabled(enabled: boolean): void {
		this.isLoggingEnabled = enabled;
	}

	/**
	 * Set retention period
	 */
	setRetentionDays(days: number): void {
		this.retentionDays = days;
	}

	// ============================================================================
	// STORE GETTERS
	// ============================================================================

	get auditLogs() {
		return this.auditLogsStore;
	}

	get auditReports() {
		return this.auditReportsStore;
	}

	// ============================================================================
	// EXPORT METHODS
	// ============================================================================

	/**
	 * Export audit logs for legal proceedings
	 */
	async exportAuditLogs(
		startDate: number,
		endDate: number,
		format: 'json' | 'csv' | 'pdf' = 'json'
	): Promise<{
		data: string;
		format: string;
		exportTimestamp: number;
		hash: string;
	}> {
		const logs = await this.getAuditLogs({ startDate, endDate, limit: 100000 });

		let data: string;
		switch (format) {
			case 'json':
				data = JSON.stringify(logs, null, 2);
				break;
			case 'csv':
				data = this.convertToCSV(logs);
				break;
			case 'pdf':
				data = await this.convertToPDF(logs);
				break;
			default:
				data = JSON.stringify(logs, null, 2);
		}

		const exportTimestamp = Date.now();
		// Use Web Crypto API for browser compatibility
		const encoder = new TextEncoder();
		const dataBytes = encoder.encode(data);
		const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

		return {
			data,
			format,
			exportTimestamp,
			hash
		};
	}

	/**
	 * Convert logs to CSV format
	 */
	private convertToCSV(logs: AuditLog[]): string {
		const headers = [
			'ID',
			'Timestamp',
			'Action',
			'Resource',
			'Resource ID',
			'Actor',
			'Description',
			'Risk Level',
			'IP Address',
			'User Agent',
			'Hash'
		];

		const rows = logs.map((log) => [
			log.id,
			new Date(log.timestamp).toISOString(),
			log.action,
			log.resource,
			log.resourceId,
			log.actor,
			log.details.description,
			log.details.riskLevel,
			log.ipAddress || '',
			log.userAgent || '',
			log.hash
		]);

		return [headers, ...rows].map((row) => row.map((field) => `"${field}"`).join(',')).join('\n');
	}

	/**
	 * Convert logs to PDF format (simplified)
	 */
	private async convertToPDF(logs: AuditLog[]): Promise<string> {
		// In a real implementation, this would use a PDF library
		// For now, return a formatted text representation
		const pdfContent = logs
			.map(
				(log) =>
					`${log.id} | ${new Date(log.timestamp).toISOString()} | ${log.action} | ${log.actor} | ${log.details.description}`
			)
			.join('\n');

		return pdfContent;
	}
}
