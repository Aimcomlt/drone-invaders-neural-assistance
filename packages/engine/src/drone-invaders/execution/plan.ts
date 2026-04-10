import {
  DroneAssistantTuningConfig,
  DroneExecutionPlan,
  DroneInterpretation,
  DronePolicyDecision,
  DronePlaytestFeedback,
  DronePlaytestReview,
  DroneTelemetrySnapshot,
  DroneWorldSignal,
} from '@pacman/shared';
import { generateAdvisorySignals } from '../assistant/advisory';
import { createAssistantUiScaffold } from '../assistant/ui';

const MAX_HAZARD_SPAWNS_PER_TICK = 5;

const summarizePlaytestReview = (feedback: DronePlaytestFeedback): DronePlaytestReview => {
  const totalSignals = Math.max(
    1,
    feedback.confusionEvents + feedback.excitingEvents + feedback.frustrationEvents + feedback.ignoredAdviceEvents,
  );

  const recommendations: string[] = [];
  if (feedback.confusionEvents >= feedback.excitingEvents) {
    recommendations.push('Increase advisory confidence threshold and simplify wording for next playtest batch.');
  }
  if (feedback.frustrationEvents > feedback.excitingEvents) {
    recommendations.push('Reduce hazard pressure bias and preserve wider recovery windows.');
  }
  if (feedback.ignoredAdviceEvents > 0) {
    recommendations.push('Lower advisory frequency and elevate only top-priority, high-confidence notices.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Current pacing is stable; continue gathering higher-volume sessions for tuning confidence.');
  }

  return {
    confusionRate: feedback.confusionEvents / totalSignals,
    excitementRate: feedback.excitingEvents / totalSignals,
    frustrationRate: feedback.frustrationEvents / totalSignals,
    ignoredAdviceRate: feedback.ignoredAdviceEvents / totalSignals,
    recommendations,
  };
};

export type ExecutionPhaseInputs = {
  assistantTuning?: Partial<DroneAssistantTuningConfig>;
  playtestFeedback?: DronePlaytestFeedback;
};

export type ExecutionPhaseResult = {
  execution: DroneExecutionPlan;
  telemetry: DroneTelemetrySnapshot;
  playtestReview: DronePlaytestReview;
};

export const createExecutionArtifacts = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
  policy: DronePolicyDecision,
  options: ExecutionPhaseInputs = {},
): ExecutionPhaseResult => {
  const hazardCandidateCells = interpretation.conwayAnalysis.candidates.hazardRegions.flatMap((region) => region.cells);
  const hazardPlacements = policy.allowHazardSpawn
    ? (hazardCandidateCells.length > 0 ? hazardCandidateCells : world.conway.aliveCells).slice(0, MAX_HAZARD_SPAWNS_PER_TICK)
    : [];

  const invasionWaveSize = policy.allowInvasionEvent ? policy.clampedInvasionWaveSize : 0;
  const advisory = generateAdvisorySignals(
    world,
    interpretation,
    policy,
    options.assistantTuning,
    options.playtestFeedback,
  );

  const execution: DroneExecutionPlan = {
    hazardPlacements,
    invasionWaveSize,
    advisorySignals: advisory.advisorySignals,
    advisorySignalDetails: advisory.advisorySignalDetails,
    assistantUi: createAssistantUiScaffold(world, interpretation, policy),
  };

  const totalCells = Math.max(1, world.sector.width * world.sector.height);
  const telemetry: DroneTelemetrySnapshot = {
    timestampMs: world.run.timestampMs,
    clampedRisk: policy.clampedRisk,
    hazardPlacementCount: hazardPlacements.length,
    invasionWaveSize,
    advisorySignalsEmitted: advisory.advisorySignals.length,
    advisorySignalsSuppressed: advisory.suppressedSignalCount,
    hazardCoverage: hazardPlacements.length / totalCells,
    policyReasons: policy.reasonCodes,
  };

  const playtestReview = summarizePlaytestReview(
    options.playtestFeedback ?? {
      confusionEvents: 0,
      excitingEvents: 0,
      frustrationEvents: 0,
      ignoredAdviceEvents: 0,
    },
  );

  return {
    execution,
    telemetry,
    playtestReview,
  };
};

export const createExecutionPlan = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
  policy: DronePolicyDecision,
): DroneExecutionPlan => createExecutionArtifacts(world, interpretation, policy).execution;
