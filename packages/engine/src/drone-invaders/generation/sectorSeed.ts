import { DroneSectorGrid, DroneVector2 } from '@pacman/shared';

export const createSectorSeed = (id: string, width: number, height: number): DroneSectorGrid => {
  const blockedCells: DroneVector2[] = [];

  for (let x = 0; x < width; x += 1) {
    blockedCells.push({ x, y: 0 });
    blockedCells.push({ x, y: height - 1 });
  }

  for (let y = 1; y < height - 1; y += 1) {
    blockedCells.push({ x: 0, y });
    blockedCells.push({ x: width - 1, y });
  }

  return {
    id,
    width,
    height,
    blockedCells,
  };
};
