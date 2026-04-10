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

  const invasionWaveSize = policy.allowInvasionEvent ? policy.clampedInvasionWaveSize : 0;

  return {
    hazardPlacements,
    invasionWaveSize,
    advisorySignals: generateAdvisorySignals(world, interpretation, policy),
  };
};
