import {
  DroneAssistantAdvisorySignal,
  DroneAssistantTuningConfig,
  DroneInterpretation,
  DronePolicyDecision,
  DronePlaytestFeedback,
  DroneWorldSignal,
} from '@pacman/shared';
import { tuneAssistantSignals } from './modules';

export type AdvisoryGenerationOutput = {
  advisorySignals: string[];
  advisorySignalDetails: DroneAssistantAdvisorySignal[];
  suppressedSignalCount: number;
  tuning: DroneAssistantTuningConfig;
};

export const generateAdvisorySignals = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
  policy: DronePolicyDecision,
  tuningOverrides: Partial<DroneAssistantTuningConfig> = {},
  playtestFeedback?: DronePlaytestFeedback,
): AdvisoryGenerationOutput => {
  const tuned = tuneAssistantSignals(world, interpretation, policy, tuningOverrides, playtestFeedback);

  return {
    advisorySignals: tuned.advisorySignalDetails.map((signal) => signal.message),
    advisorySignalDetails: tuned.advisorySignalDetails,
    suppressedSignalCount: tuned.suppressedSignalCount,
    tuning: tuned.tuning,
  };
};
