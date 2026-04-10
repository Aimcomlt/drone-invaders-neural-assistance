import {
  DroneInterpretation,
  DronePatternFeatures,
  DroneRiskAssessment,
  DroneWorldSignal,
} from '@pacman/shared';
import { analyzeConwayState, extractPatternFeatures } from './extractors';

export type RiskModelAdapter = {
  evaluateSectorRisk: (world: DroneWorldSignal, features: DronePatternFeatures) => DroneRiskAssessment;
};

export const deterministicRiskFallback: RiskModelAdapter = {
  evaluateSectorRisk: (_world, features) => {
    const sectorRisk = Math.max(0, Math.min(1, 0.5 * features.aliveDensity + 0.5 * features.frontierPressure));

    return {
      sectorRisk,
      extractionRisk: Math.max(0, Math.min(1, sectorRisk * 0.8 + 0.1)),
      confidence: 0.5,
      source: 'deterministic-fallback',
    };
  },
};

export const interpretWorld = (
  world: DroneWorldSignal,
  riskModel: RiskModelAdapter = deterministicRiskFallback,
): DroneInterpretation => {
  const conwayAnalysis = analyzeConwayState(world);
  const patternFeatures = extractPatternFeatures(world, conwayAnalysis);
  const riskAssessment = riskModel.evaluateSectorRisk(world, patternFeatures);

  return {
    patternFeatures,
    riskAssessment,
    conwayAnalysis,
  };
};
