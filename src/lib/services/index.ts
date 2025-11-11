/**
 * Services Index
 * Central export point for all service classes and instances
 */

export { SolanaService } from './solana.service';
export { ConfigService } from './config.service';
export { ValidationService } from './validation.service';
export { TracingService } from './tracing.service';
export { ForensicsService } from './forensics.service';
export { AuditService } from './audit.service';
export { EvidenceService } from './evidence.service';

// Service instances - lazy initialization to avoid SSR issues
import { SolanaService } from './solana.service';
import { ConfigService } from './config.service';
import { ForensicsService } from './forensics.service';
import { ValidationService } from './validation.service';
import { AuditService } from './audit.service';
import { EvidenceService } from './evidence.service';

// Lazy service initialization - only create instances when needed
let _solanaService: SolanaService | null = null;
let _configService: ConfigService | null = null;
let _forensicsService: ForensicsService | null = null;
let _validationService: ValidationService | null = null;
let _auditService: AuditService | null = null;
let _evidenceService: EvidenceService | null = null;

// Getter functions for lazy initialization
export function getSolanaService(): SolanaService {
	if (!_solanaService) {
		const configService = ConfigService.getInstance();
		const solanaConfig = configService.getConfig().solana;
		_solanaService = new SolanaService(solanaConfig);
	}
	return _solanaService;
}

export function getConfigService(): ConfigService {
	if (!_configService) {
		_configService = ConfigService.getInstance();
	}
	return _configService;
}

export function getForensicsService(): ForensicsService {
	if (!_forensicsService) {
		_forensicsService = new ForensicsService();
	}
	return _forensicsService;
}

export function getAuditService(): AuditService {
	if (!_auditService) {
		_auditService = new AuditService();
	}
	return _auditService;
}

export function getValidationService(): ValidationService {
	if (!_validationService) {
		_validationService = new ValidationService();
	}
	return _validationService;
}

export function getEvidenceService(): EvidenceService {
	if (!_evidenceService) {
		_evidenceService = new EvidenceService();
	}
	return _evidenceService;
}
