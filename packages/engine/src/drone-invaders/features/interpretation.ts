import {
  DroneInterpretation,
  DronePatternFeatures,
  DroneRiskAssessment,
  DroneRiskModelDiagnostics,
  DroneWorldSignal,
} from '@pacman/shared';
import { analyzeConwayState, extractPatternFeatures } from './extractors';
import { normalizeRiskModelInput } from './riskModel';

export type RiskModelAdapter = {
  evaluateSectorRisk: (
    world: DroneWorldSignal,
    features: DronePatternFeatures,
    normalizedInput: ReturnType<typeof normalizeRiskModelInput>,
  ) => DroneRiskAssessment;
};

const clampUnit = (value: number): number => Math.max(0, Math.min(1, value));

export const deterministicRiskFallback: RiskModelAdapter = {
  evaluateSectorRisk: (_world, _features, normalizedInput) => {
    const sectorRisk = clampUnit(0.5 * normalizedInput.aliveDensity + 0.5 * normalizedInput.frontierPressure);

    return {
      sectorRisk,
      extractionRisk: clampUnit(sectorRisk * 0.8 + 0.1),
      confidence: 0.5,
      source: 'deterministic-fallback',
    };
  },
};

export const interpretWorld = (
  world: DroneWorldSignal,
  riskModel?: RiskModelAdapter,
): DroneInterpretation => {
  const conwayAnalysis = analyzeConwayState(world);
  const patternFeatures = extractPatternFeatures(world, conwayAnalysis);
  const normalizedInput = normalizeRiskModelInput(world, patternFeatures);

  const fallbackAssessment = deterministicRiskFallback.evaluateSectorRisk(world, patternFeatures, normalizedInput);
  const modelAssessment = riskModel?.evaluateSectorRisk(world, patternFeatures, normalizedInput);
  const selectedAssessment = modelAssessment ?? fallbackAssessment;

  const riskDiagnostics: DroneRiskModelDiagnostics = {
    normalizedInput,
    fallbackAssessment,
    modelAssessment,
    selectedSource: selectedAssessment.source,
    sectorRiskDelta: modelAssessment ? modelAssessment.sectorRisk - fallbackAssessment.sectorRisk : 0,
  };

  return {
    patternFeatures,
    riskAssessment: selectedAssessment,
    conwayAnalysis,
    riskDiagnostics,
  };
};
