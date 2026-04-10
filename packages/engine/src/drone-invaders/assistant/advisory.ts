import { DroneInterpretation, DronePolicyDecision, DroneWorldSignal } from '@pacman/shared';
import { synthesizeAssistantSignals } from './modules';

export const generateAdvisorySignals = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
  policy: DronePolicyDecision,
): string[] => synthesizeAssistantSignals(world, interpretation, policy);
