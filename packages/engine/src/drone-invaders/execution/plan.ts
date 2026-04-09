import { DroneExecutionPlan, DroneInterpretation, DronePolicyDecision, DroneWorldSignal } from '@pacman/shared';
import { generateAdvisorySignals } from '../assistant/advisory';

const MAX_HAZARD_SPAWNS_PER_TICK = 5;

export const createExecutionPlan = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
  policy: DronePolicyDecision,
): DroneExecutionPlan => {
  const hazardPlacements = policy.allowHazardSpawn
    ? world.conway.aliveCells.slice(0, MAX_HAZARD_SPAWNS_PER_TICK)
    : [];

  const invasionWaveSize = policy.allowInvasionEvent
    ? Math.max(1, Math.round(interpretation.riskAssessment.sectorRisk * 10))
    : 0;

  return {
    hazardPlacements,
    invasionWaveSize,
    advisorySignals: generateAdvisorySignals(world, interpretation, policy),
  };
};
