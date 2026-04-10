import { DronePatternFeatures, DroneWorldSignal } from '@pacman/shared';

export type DroneRiskModelInput = {
  aliveDensity: number;
  frontierPressure: number;
  hazardRegionDensity: number;
  resourceRegionDensity: number;
  oscillatorRatio: number;
  stableClusterRatio: number;
};

const clampUnit = (value: number): number => Math.max(0, Math.min(1, value));

export const normalizeRiskModelInput = (
  world: DroneWorldSignal,
  features: DronePatternFeatures,
): DroneRiskModelInput => {
  const motifTotal = Math.max(1, Object.values(features.motifCounts).reduce((acc, count) => acc + count, 0));
  const totalCells = Math.max(1, world.sector.width * world.sector.height);

  return {
    aliveDensity: clampUnit(features.aliveDensity),
    frontierPressure: clampUnit(features.frontierPressure),
    hazardRegionDensity: clampUnit(features.hazardRegionCount / totalCells),
    resourceRegionDensity: clampUnit(features.resourceRegionCount / totalCells),
    oscillatorRatio: clampUnit(features.motifCounts.oscillator / motifTotal),
    stableClusterRatio: clampUnit(features.motifCounts['stable-cluster'] / motifTotal),
  };
};
