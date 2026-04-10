import { DroneRiskAssessment } from '@pacman/shared';
import { RiskModelAdapter } from '../features/interpretation';
import { DroneRiskModelInput } from '@pacman/shared';

const clampUnit = (value: number): number => Math.max(0, Math.min(1, value));

const sigmoid = (value: number): number => 1 / (1 + Math.exp(-value));

const evaluateLinearScore = (input: DroneRiskModelInput): number =>
  1.3 * input.aliveDensity +
  1.2 * input.frontierPressure +
  0.9 * input.hazardRegionDensity -
  0.6 * input.resourceRegionDensity +
  0.7 * input.oscillatorRatio -
  0.4 * input.stableClusterRatio -
  1.1;

export const createConwayInterpreterModel = (): RiskModelAdapter => ({
  evaluateSectorRisk: (_world, _features, normalizedInput): DroneRiskAssessment => {
    const sectorRisk = clampUnit(sigmoid(evaluateLinearScore(normalizedInput)));

    return {
      sectorRisk,
      extractionRisk: clampUnit(sectorRisk * 0.75 + 0.15 * normalizedInput.frontierPressure),
      confidence: clampUnit(0.55 + 0.35 * normalizedInput.frontierPressure),
      source: 'assistant-model',
    };
  },
});
