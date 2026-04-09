import { DroneTickInput, DroneTickOutput } from '@pacman/shared';
import { interpretWorld, RiskModelAdapter } from './features/interpretation';
import { evaluatePolicy, PolicyThresholds } from './policy/evaluatePolicy';
import { createExecutionPlan } from './execution/plan';
import { createTickWorld } from './world/snapshot';

export type DroneTickDependencies = {
  riskModel?: RiskModelAdapter;
  policyThresholds?: PolicyThresholds;
};

export const tickDroneInvaders = (
  input: DroneTickInput,
  dependencies: DroneTickDependencies = {},
): DroneTickOutput => {
  const world = createTickWorld(input);
  const interpretation = interpretWorld(world, dependencies.riskModel);
  const policy = evaluatePolicy(world, interpretation, dependencies.policyThresholds);
  const execution = createExecutionPlan(world, interpretation, policy);

  return {
    interpretation,
    policy,
    execution,
  };
};

export * from './assistant/advisory';
export * from './conway/step';
export * from './execution/plan';
export * from './features/extractors';
export * from './features/interpretation';
export * from './generation/sectorSeed';
export * from './policy/evaluatePolicy';
export * from './policy/safePath';
export * from './world/snapshot';
