import { DroneTickInput, DroneWorldSignal } from '@pacman/shared';

export const cloneWorldSignal = (world: DroneWorldSignal): DroneWorldSignal => ({
  sector: {
    ...world.sector,
    blockedCells: world.sector.blockedCells.map((cell) => ({ ...cell })),
  },
  entities: world.entities.map((entity) => ({
    ...entity,
    position: { ...entity.position },
    velocity: { ...entity.velocity },
  })),
  resources: world.resources.map((resource) => ({
    ...resource,
    position: { ...resource.position },
  })),
  run: {
    ...world.run,
    activeObjectives: [...world.run.activeObjectives],
  },
  conway: {
    ...world.conway,
    aliveCells: world.conway.aliveCells.map((cell) => ({ ...cell })),
  },
});

export const createTickWorld = (input: DroneTickInput): DroneWorldSignal => cloneWorldSignal(input.world);
