/**
 * Configuration Service
 * Manages forensics configuration and settings
 */

import type { ForensicsConfig } from '../types';

export class ConfigService {
	private static instance: ConfigService;
	private config: ForensicsConfig;

	private constructor() {
		this.config = this.getDefaultConfig();
	}

	public static getInstance(): ConfigService {
		if (!ConfigService.instance) {
			ConfigService.instance = new ConfigService();
		}
		return ConfigService.instance;
	}

	/**
	 * Get default configuration
	 */
	private getDefaultConfig(): ForensicsConfig {
		return {
			solana: {
				rpcUrl: 'http://127.0.0.1:8899',
				wsUrl: 'ws://127.0.0.1:8900',
				commitment: 'confirmed'
			},
			monitoring: {
				batchSize: 100,
				maxRetries: 3,
				timeout: 30000,
				transactionCacheSize: 20,
				recentTransactionLimit: 15,
				monitoringTransactionLimit: 10,
				pollingTransactionLimit: 5,
				pollingInterval: 10000,
				connectionTimeout: 10000,
				confirmTransactionTimeout: 60000
			},
			thresholds: {
				largeTransferThreshold: 100000000000, // 100 SOL in lamports
				minimumTransferThreshold: 1000000, // 0.001 SOL in lamports
				highValueThreshold: 10000000000, // 10 SOL in lamports
				mediumValueThreshold: 1000000000, // 1 SOL in lamports
				maxAmount: 100, // SOL - UI configurable
				maxSpeed: 60 // seconds - UI configurable
			},
			alerts: {
				enabled: true,
				desktopNotifications: true,
				emailNotifications: false,
				webhookUrl: undefined
			},
			evidence: {
				retentionDays: 365,
				encryptionEnabled: true,
				backupEnabled: true
			},
			ui: {
				theme: 'dark',
				refreshInterval: 5000,
				maxDisplayItems: 100
			}
		};
	}

	/**
	 * Get current configuration
	 */
	getConfig(): ForensicsConfig {
		return { ...this.config };
	}

	/**
	 * Update configuration
	 */
	updateConfig(updates: Partial<ForensicsConfig>): void {
		this.config = { ...this.config, ...updates };
		this.saveToStorage();
	}

	/**
	 * Get Solana configuration
	 */
	getSolanaConfig() {
		return this.config.solana;
	}

	/**
	 * Update Solana configuration
	 */
	updateSolanaConfig(updates: Partial<ForensicsConfig['solana']>): void {
		this.config.solana = { ...this.config.solana, ...updates };
		this.saveToStorage();
	}

	/**
	 * Get monitoring configuration
	 */
	getMonitoringConfig() {
		return this.config.monitoring;
	}

	/**
	 * Update monitoring configuration
	 */
	updateMonitoringConfig(updates: Partial<ForensicsConfig['monitoring']>): void {
		this.config.monitoring = { ...this.config.monitoring, ...updates };
		this.saveToStorage();
	}

	/**
	 * Get thresholds configuration
	 */
	getThresholdsConfig() {
		return this.config.thresholds;
	}

	/**
	 * Update thresholds configuration
	 */
	updateThresholdsConfig(updates: Partial<ForensicsConfig['thresholds']>): void {
		this.config.thresholds = { ...this.config.thresholds, ...updates };
		this.saveToStorage();
	}

	/**
	 * Get alerts configuration
	 */
	getAlertsConfig() {
		return this.config.alerts;
	}

	/**
	 * Update alerts configuration
	 */
	updateAlertsConfig(updates: Partial<ForensicsConfig['alerts']>): void {
		this.config.alerts = { ...this.config.alerts, ...updates };
		this.saveToStorage();
	}

	/**
	 * Get evidence configuration
	 */
	getEvidenceConfig() {
		return this.config.evidence;
	}

	/**
	 * Update evidence configuration
	 */
	updateEvidenceConfig(updates: Partial<ForensicsConfig['evidence']>): void {
		this.config.evidence = { ...this.config.evidence, ...updates };
		this.saveToStorage();
	}

	/**
	 * Get UI configuration
	 */
	getUIConfig() {
		return this.config.ui;
	}

	/**
	 * Update UI configuration
	 */
	updateUIConfig(updates: Partial<ForensicsConfig['ui']>): void {
		this.config.ui = { ...this.config.ui, ...updates };
		this.saveToStorage();
	}

	/**
	 * Save configuration to localStorage
	 */
	private saveToStorage(): void {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem('forensics-config', JSON.stringify(this.config));
			} catch (error) {
				// Failed to save configuration
			}
		}
	}

	/**
	 * Load configuration from localStorage
	 */
	loadFromStorage(): void {
		if (typeof window !== 'undefined') {
			try {
				const stored = localStorage.getItem('forensics-config');
				if (stored) {
					const parsedConfig = JSON.parse(stored);
					this.config = { ...this.getDefaultConfig(), ...parsedConfig };
				}
			} catch (error) {
				// Failed to load configuration
			}
		}
	}

	/**
	 * Reset configuration to defaults
	 */
	resetToDefaults(): void {
		this.config = this.getDefaultConfig();
		this.saveToStorage();
	}

	/**
	 * Export configuration
	 */
	exportConfig(): string {
		return JSON.stringify(this.config, null, 2);
	}

	/**
	 * Import configuration
	 */
	importConfig(configJson: string): boolean {
		try {
			const importedConfig = JSON.parse(configJson);
			this.config = { ...this.getDefaultConfig(), ...importedConfig };
			this.saveToStorage();
			return true;
		} catch (error) {
			return false;
		}
	}
}
