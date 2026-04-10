import {
  DroneAssistantTuningConfig,
  DroneExecutionPlan,
  DronePhase7Briefing,
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
  phase7Briefing: DronePhase7Briefing;
};

const clampUnit = (value: number): number => Math.max(0, Math.min(1, value));

const createPhase7Briefing = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
  policy: DronePolicyDecision,
  telemetry: DroneTelemetrySnapshot,
  playtestReview: DronePlaytestReview,
): DronePhase7Briefing => {
  const pressure = clampUnit(world.run.threatLevel * 0.45 + telemetry.clampedRisk * 0.55);
  const recoveryPenalty = policy.hasSafePath ? 0 : 0.2;
  const frustrationPenalty = playtestReview.frustrationRate * 0.2;
  const readinessScore = clampUnit(1 - pressure - recoveryPenalty - frustrationPenalty);

  const recommendedFocus = !policy.hasSafePath
    ? 'fight'
    : readinessScore < 0.35
      ? 'fortify'
      : readinessScore < 0.65
        ? 'extract'
        : 'expand';

  const riskTrend = telemetry.clampedRisk >= 0.7 ? 'rising' : telemetry.clampedRisk <= 0.3 ? 'falling' : 'stable';

  const summary: string[] = [];
  if (!policy.hasSafePath) {
    summary.push('SAFE ROUTE ALERT: establish a viable lane before committing to growth actions.');
  }
  if (recommendedFocus === 'fortify') {
    summary.push('FOCUS: fortify current territory and preserve recovery windows.');
  } else if (recommendedFocus === 'extract') {
    summary.push('FOCUS: prioritize controlled extraction while threat pressure remains manageable.');
  } else if (recommendedFocus === 'expand') {
    summary.push('FOCUS: sector conditions support cautious expansion into adjacent space.');
  } else {
    summary.push('FOCUS: stabilize immediate combat pressure and restore tactical control.');
  }
  if (playtestReview.ignoredAdviceRate > 0.25) {
    summary.push('ADVISORY TUNING: reduce message volume and elevate only the highest-confidence calls.');
  }

  return {
    readinessScore,
    recommendedFocus,
    riskTrend,
    summary,
  };
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
  const phase7Briefing = createPhase7Briefing(world, interpretation, policy, telemetry, playtestReview);

  return {
    execution,
    telemetry,
    playtestReview,
    phase7Briefing,
  };
};

export const createExecutionPlan = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
  policy: DronePolicyDecision,
): DroneExecutionPlan => createExecutionArtifacts(world, interpretation, policy).execution;
