import { DroneVector2, DroneWorldSignal } from '@pacman/shared';

const toCellKey = (cell: DroneVector2): string => `${cell.x},${cell.y}`;

const isInBounds = (world: DroneWorldSignal, cell: DroneVector2): boolean =>
  cell.x >= 0 && cell.y >= 0 && cell.x < world.sector.width && cell.y < world.sector.height;

const getNeighbors = (cell: DroneVector2): DroneVector2[] => [
  { x: cell.x + 1, y: cell.y },
  { x: cell.x - 1, y: cell.y },
  { x: cell.x, y: cell.y + 1 },
  { x: cell.x, y: cell.y - 1 },
];

const isPassable = (blocked: Set<string>, cell: DroneVector2): boolean => !blocked.has(toCellKey(cell));

const hasPath = (world: DroneWorldSignal, start: DroneVector2, target: DroneVector2, blocked: Set<string>): boolean => {
  if (!isInBounds(world, start) || !isInBounds(world, target)) {
    return false;
  }

  if (!isPassable(blocked, start) || !isPassable(blocked, target)) {
    return false;
  }

  const visited = new Set<string>();
  const queue: DroneVector2[] = [start];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const key = toCellKey(current);
    if (visited.has(key)) {
      continue;
    }

    visited.add(key);

    if (current.x === target.x && current.y === target.y) {
      return true;
    }

    for (const neighbor of getNeighbors(current)) {
      const neighborKey = toCellKey(neighbor);
      if (!isInBounds(world, neighbor) || visited.has(neighborKey) || !isPassable(blocked, neighbor)) {
        continue;
      }
      queue.push(neighbor);
    }
  }

  return false;
};

export const hasAnySafeResourcePath = (world: DroneWorldSignal): boolean => {
  const playerShip = world.entities.find((entity) => entity.kind === 'player-ship' && entity.active);

  if (!playerShip || world.resources.length === 0) {
    return true;
  }

  const blocked = new Set(world.sector.blockedCells.map(toCellKey));

  return world.resources.some((resource) => hasPath(world, playerShip.position, resource.position, blocked));
};
