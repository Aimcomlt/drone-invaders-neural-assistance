import { DroneAssistantTuningConfig, DroneConwayConfig, DronePlaytestFeedback, DroneTickInput, DroneTickOutput } from '@pacman/shared';
import { interpretWorld, RiskModelAdapter } from './features/interpretation';
import { evaluatePolicy, PolicyThresholds } from './policy/evaluatePolicy';
import { createExecutionArtifacts } from './execution/plan';
import { createTickWorld } from './world/snapshot';
import { stepConway } from './conway/step';

export type DroneTickDependencies = {
  riskModel?: RiskModelAdapter;
  policyThresholds?: PolicyThresholds;
  conwayConfig?: Partial<DroneConwayConfig>;
  assistantTuning?: Partial<DroneAssistantTuningConfig>;
  playtestFeedback?: DronePlaytestFeedback;
};

export const tickDroneInvaders = (
  input: DroneTickInput,
  dependencies: DroneTickDependencies = {},
): DroneTickOutput => {
  const world = createTickWorld(input);
  world.conway = stepConway(world.conway, {
    width: world.sector.width,
    height: world.sector.height,
    ...dependencies.conwayConfig,
  });

  const interpretation = interpretWorld(world, dependencies.riskModel);
  const policy = evaluatePolicy(world, interpretation, dependencies.policyThresholds);
  const executionPhase = createExecutionArtifacts(world, interpretation, policy, {
    assistantTuning: dependencies.assistantTuning,
    playtestFeedback: dependencies.playtestFeedback,
  });

  return {
    interpretation,
    policy,
    execution: executionPhase.execution,
    telemetry: executionPhase.telemetry,
    playtestReview: executionPhase.playtestReview,
  };
};

export * from './assistant/advisory';
export * from './assistant/ui';
export * from './assistant/modules';
export * from './conway/step';
export * from './execution/plan';
export * from './features/extractors';
export * from './features/motifs';
export * from './features/interpretation';
export * from './generation/sectorSeed';
export * from './generation/candidates';
export * from './policy/evaluatePolicy';
export * from './policy/safePath';
export * from './world/snapshot';
export * from './features/riskModel';
export * from './models/conwayInterpreter';
export * from './models/loggedRiskModel';
