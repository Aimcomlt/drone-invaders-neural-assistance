import { DroneInterpretation, DronePolicyDecision, DroneWorldSignal } from '@pacman/shared';

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

  const clampedRisk = clampUnit(
    Math.min(interpretation.riskAssessment.sectorRisk, thresholds.maxRiskBeforeInvasionClamp),
  );

  const allowInvasionEvent =
    clampedRisk >= 0.35 && world.run.resourcesBanked >= thresholds.minResourcesForInvasion;
  if (!allowInvasionEvent) {
    reasons.push('invasion gated by risk clamp or resources');
  }

  return {
    allowHazardSpawn,
    allowInvasionEvent,
    clampedRisk,
    reasons,
  };
};
