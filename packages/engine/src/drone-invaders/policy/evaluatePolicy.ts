import { DroneInterpretation, DronePolicyDecision, DronePolicyReasonCode, DroneWorldSignal } from '@pacman/shared';
import { countReachableResources, hasAnySafeResourcePath } from './safePath';

export type PolicyThresholds = {
  maxHazardCoverage: number;
  maxRiskBeforeInvasionClamp: number;
  minRiskForInvasion: number;
  minResourcesForInvasion: number;
  minReachableResourceRatio: number;
  maxInvasionWaveSize: number;
};

const defaultThresholds: PolicyThresholds = {
  maxHazardCoverage: 0.2,
  maxRiskBeforeInvasionClamp: 0.75,
  minRiskForInvasion: 0.35,
  minResourcesForInvasion: 20,
  minReachableResourceRatio: 0.5,
  maxInvasionWaveSize: 8,
};

const clampUnit = (value: number): number => Math.max(0, Math.min(1, value));
const REASON_MESSAGES: Record<DronePolicyReasonCode, string> = {
  hazard_coverage_exceeded: 'hazard coverage exceeded max threshold',
  no_safe_path: 'no safe path available',
  resource_accessibility_below_min: 'resource accessibility below minimum threshold',
  risk_below_min: 'invasion gated: risk below minimum threshold',
  resources_below_min: 'invasion gated: resources below minimum threshold',
};

export const evaluatePolicy = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
  thresholds: PolicyThresholds = defaultThresholds,
): DronePolicyDecision => {
  const reasonCodes: DronePolicyReasonCode[] = [];
  const addReason = (code: DronePolicyReasonCode): void => {
    if (!reasonCodes.includes(code)) {
      reasonCodes.push(code);
    }
  };

  const totalCells = Math.max(1, world.sector.width * world.sector.height);
  const hazardCoverage = interpretation.patternFeatures.hazardCandidateCells / totalCells;

  const allowHazardSpawn = hazardCoverage <= thresholds.maxHazardCoverage;
  if (!allowHazardSpawn) {
    addReason('hazard_coverage_exceeded');
  }

  const hasSafePath = hasAnySafeResourcePath(world);
  const totalResourceCount = world.resources.length;
  const reachableResourceCount = countReachableResources(world);
  const reachableResourceRatio = totalResourceCount === 0 ? 1 : reachableResourceCount / totalResourceCount;
  if (!hasSafePath) {
    addReason('no_safe_path');
  }
  if (reachableResourceRatio < thresholds.minReachableResourceRatio) {
    addReason('resource_accessibility_below_min');
  }

  const clampedRisk = clampUnit(
    Math.min(interpretation.riskAssessment.sectorRisk, thresholds.maxRiskBeforeInvasionClamp),
  );
  const isRiskHighEnough = clampedRisk >= thresholds.minRiskForInvasion;
  const hasEnoughResources = world.run.resourcesBanked >= thresholds.minResourcesForInvasion;

  if (!isRiskHighEnough) {
    addReason('risk_below_min');
  }
  if (!hasEnoughResources) {
    addReason('resources_below_min');
  }

  const allowInvasionEvent =
    hasSafePath && reachableResourceRatio >= thresholds.minReachableResourceRatio && isRiskHighEnough && hasEnoughResources;
  const clampedInvasionWaveSize = allowInvasionEvent
    ? Math.max(1, Math.min(thresholds.maxInvasionWaveSize, Math.round(clampedRisk * 10)))
    : 0;
  const reasons = reasonCodes.map((code) => REASON_MESSAGES[code]);

  return {
    allowHazardSpawn,
    allowInvasionEvent,
    hasSafePath,
    clampedRisk,
    clampedInvasionWaveSize,
    reasons,
    reasonCodes,
    policyLog: {
      candidateInput: {
        hazardCoverage,
        clampedRisk,
        resourcesBanked: world.run.resourcesBanked,
        hasSafePath,
        reachableResourceCount,
        totalResourceCount,
        reachableResourceRatio,
      },
      thresholds: {
        maxHazardCoverage: thresholds.maxHazardCoverage,
        maxRiskBeforeInvasionClamp: thresholds.maxRiskBeforeInvasionClamp,
        minRiskForInvasion: thresholds.minRiskForInvasion,
        minResourcesForInvasion: thresholds.minResourcesForInvasion,
        minReachableResourceRatio: thresholds.minReachableResourceRatio,
        maxInvasionWaveSize: thresholds.maxInvasionWaveSize,
      },
      decision: {
        allowHazardSpawn,
        allowInvasionEvent,
        clampedInvasionWaveSize,
      },
      reasons: reasonCodes.map((code) => ({
        code,
        message: REASON_MESSAGES[code],
      })),
    },
  };
};
