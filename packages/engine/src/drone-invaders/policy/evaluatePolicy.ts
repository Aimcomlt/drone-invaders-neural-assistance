import { DroneInterpretation, DronePolicyDecision, DroneWorldSignal } from '@pacman/shared';
import { hasAnySafeResourcePath } from './safePath';

export type PolicyThresholds = {
  maxHazardCoverage: number;
  maxRiskBeforeInvasionClamp: number;
  minResourcesForInvasion: number;
};

const defaultThresholds: PolicyThresholds = {
  maxHazardCoverage: 0.2,
  maxRiskBeforeInvasionClamp: 0.75,
  minResourcesForInvasion: 20,
};

const clampUnit = (value: number): number => Math.max(0, Math.min(1, value));

export const evaluatePolicy = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
  thresholds: PolicyThresholds = defaultThresholds,
): DronePolicyDecision => {
  const reasons: string[] = [];

  const totalCells = Math.max(1, world.sector.width * world.sector.height);
  const hazardCoverage = interpretation.patternFeatures.hazardCandidateCells / totalCells;

  const allowHazardSpawn = hazardCoverage <= thresholds.maxHazardCoverage;
  if (!allowHazardSpawn) {
    reasons.push('hazard coverage exceeded max threshold');
  }

  const hasSafePath = hasAnySafeResourcePath(world);
  if (!hasSafePath) {
    reasons.push('no safe path available');
  }

  const clampedRisk = clampUnit(
    Math.min(interpretation.riskAssessment.sectorRisk, thresholds.maxRiskBeforeInvasionClamp),
  );

  const allowInvasionEvent =
    hasSafePath && clampedRisk >= 0.35 && world.run.resourcesBanked >= thresholds.minResourcesForInvasion;
  if (!allowInvasionEvent) {
    reasons.push('invasion gated by risk clamp or resources');
  }

  return {
    allowHazardSpawn,
    allowInvasionEvent,
    hasSafePath,
    clampedRisk,
    reasons,
  };
};
