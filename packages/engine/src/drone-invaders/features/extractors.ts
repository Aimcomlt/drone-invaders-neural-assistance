import { DronePatternFeatures, DroneWorldSignal } from '@pacman/shared';

const clampUnit = (value: number): number => Math.max(0, Math.min(1, value));

export const extractPatternFeatures = (world: DroneWorldSignal): DronePatternFeatures => {
  const totalCells = Math.max(1, world.sector.width * world.sector.height);
  const aliveDensity = clampUnit(world.conway.aliveCells.length / totalCells);

  const hostileCount = world.entities.filter((entity) => entity.faction === 'hostile' && entity.active).length;
  const frontierPressure = clampUnit(hostileCount / Math.max(1, world.entities.length));

  const hazardCandidateCells = world.conway.aliveCells.length;

  return {
    aliveDensity,
    frontierPressure,
    hazardCandidateCells,
  };
};
