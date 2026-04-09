import { DroneConwayState } from '@pacman/shared';

export const stepConway = (state: DroneConwayState): DroneConwayState => ({
  ...state,
  step: state.step + 1,
  // Placeholder until Conway simulation rules are integrated.
  aliveCells: [...state.aliveCells],
});
