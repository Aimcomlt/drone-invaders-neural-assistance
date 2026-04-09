import { DroneInterpretation, DronePolicyDecision, DroneWorldSignal } from '@pacman/shared';

export const generateAdvisorySignals = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
  policy: DronePolicyDecision,
): string[] => {
  const signals: string[] = [];

  if (interpretation.riskAssessment.sectorRisk > 0.6) {
    signals.push('HIGH THREAT: prioritize survival and retreat lanes.');
  }

  if (world.resources.some((resource) => resource.richness > 0.7 && !resource.contested)) {
    signals.push('RESOURCE WINDOW: rich uncontested node detected.');
  }

  if (!policy.allowInvasionEvent) {
    signals.push('POLICY HOLD: invasion escalation currently blocked.');
  }

  if (signals.length === 0) {
    signals.push('STATUS STABLE: maintain extraction and fortification balance.');
  }

  return signals;
};
