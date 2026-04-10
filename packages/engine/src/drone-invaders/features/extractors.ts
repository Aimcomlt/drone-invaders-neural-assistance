import { DroneConwayAnalysis, DronePatternFeatures, DroneWorldSignal } from '@pacman/shared';
import { detectConwayMotifs } from './motifs';
import { generateConwayCandidates } from '../generation/candidates';

const clampUnit = (value: number): number => Math.max(0, Math.min(1, value));

export const analyzeConwayState = (world: DroneWorldSignal): DroneConwayAnalysis => {
  const motifReport = detectConwayMotifs(world.conway, {
    width: world.sector.width,
    height: world.sector.height,
  });

  const candidates = generateConwayCandidates(world.conway, {
    width: world.sector.width,
    height: world.sector.height,
  });

  return {
    motifReport,
    candidates,
  };
};

export const extractPatternFeatures = (
  world: DroneWorldSignal,
  conwayAnalysis: DroneConwayAnalysis = analyzeConwayState(world),
): DronePatternFeatures => {
  const totalCells = Math.max(1, world.sector.width * world.sector.height);
  const aliveDensity = clampUnit(world.conway.aliveCells.length / totalCells);

  const hostileCount = world.entities.filter((entity) => entity.faction === 'hostile' && entity.active).length;
  const frontierPressure = clampUnit(hostileCount / Math.max(1, world.entities.length));

  const hazardCandidateCells = world.conway.aliveCells.length;

  return {
    aliveDensity,
    frontierPressure,
    hazardCandidateCells,
    motifCounts: conwayAnalysis.motifReport.counts,
    hazardRegionCount: conwayAnalysis.candidates.hazardRegions.length,
    resourceRegionCount: conwayAnalysis.candidates.resourceRegions.length,
  };
};
