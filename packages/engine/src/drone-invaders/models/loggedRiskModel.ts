import { DronePatternFeatures, DroneRiskAssessment, DroneWorldSignal } from '@pacman/shared';
import { normalizeRiskModelInput } from '../features/riskModel';
import { RiskModelAdapter } from '../features/interpretation';

export type RiskModelLogEntry = {
  timestampMs: number;
  input: ReturnType<typeof normalizeRiskModelInput>;
  output: DroneRiskAssessment;
};

export const createLoggedRiskModelAdapter = (base: RiskModelAdapter) => {
  const entries: RiskModelLogEntry[] = [];

  const loggedAdapter: RiskModelAdapter = {
    evaluateSectorRisk: (world: DroneWorldSignal, features: DronePatternFeatures, normalizedInput) => {
      const output = base.evaluateSectorRisk(world, features, normalizedInput);
      entries.push({
        timestampMs: world.run.timestampMs,
        input: normalizedInput,
        output,
      });
      return output;
    },
  };

  return {
    adapter: loggedAdapter,
    getEntries: (): RiskModelLogEntry[] => [...entries],
    clear: (): void => {
      entries.length = 0;
    },
  };
};
