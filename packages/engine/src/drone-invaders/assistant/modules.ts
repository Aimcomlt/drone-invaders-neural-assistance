import {
  DroneAssistantAdvisorySignal,
  DroneAssistantTuningConfig,
  DroneInterpretation,
  DronePolicyDecision,
  DronePlaytestFeedback,
  DroneWorldSignal,
} from '@pacman/shared';

export type AssistantModuleId =
  | 'conway-interpreter'
  | 'map-surveyor'
  | 'threat-forecaster'
  | 'resource-assessor'
  | 'recovery-advisor';

export type AssistantModuleSignal = {
  id: string;
  module: AssistantModuleId;
  priority: number;
  confidence: number;
  message: string;
};

const clampUnit = (value: number): number => Math.max(0, Math.min(1, value));

const toAdvisoryCategory = (module: AssistantModuleId): DroneAssistantAdvisorySignal['category'] => {
  switch (module) {
    case 'conway-interpreter':
      return 'conway';
    case 'map-surveyor':
      return 'survey';
    case 'threat-forecaster':
      return 'threat';
    case 'resource-assessor':
      return 'resource';
    case 'recovery-advisor':
      return 'recovery';
  }
};

const conwayInterpreterSignal = (interpretation: DroneInterpretation): AssistantModuleSignal => {
  const motifCounts = interpretation.patternFeatures.motifCounts;
  const chaoticShare = clampUnit(motifCounts['chaotic-zone'] / Math.max(1, Object.values(motifCounts).reduce((a, b) => a + b, 0)));

  if (chaoticShare >= 0.5) {
    return {
      id: 'conway-chaotic-front',
      module: 'conway-interpreter',
      priority: 85,
      confidence: clampUnit(0.65 + chaoticShare * 0.35),
      message: 'CONWAY: chaotic fronts detected; expect unstable hazard pockets.',
    };
  }

  return {
    id: 'conway-stable-zones',
    module: 'conway-interpreter',
    priority: 55,
    confidence: clampUnit(0.55 + (1 - chaoticShare) * 0.3),
    message: 'CONWAY: stable pockets present; safer routing windows likely.',
  };
};

const mapSurveyorSignal = (world: DroneWorldSignal): AssistantModuleSignal => {
  const totalCells = Math.max(1, world.sector.width * world.sector.height);
  const blockedRatio = clampUnit(world.sector.blockedCells.length / totalCells);

  if (blockedRatio >= 0.2) {
    return {
      id: 'map-constrained-lanes',
      module: 'map-surveyor',
      priority: 75,
      confidence: clampUnit(0.6 + blockedRatio * 0.4),
      message: 'SURVEY: sector lanes are constrained; avoid deep flanks without fallback.',
    };
  }

  return {
    id: 'map-open-lanes',
    module: 'map-surveyor',
    priority: 45,
    confidence: clampUnit(0.6 + (1 - blockedRatio) * 0.3),
    message: 'SURVEY: lane openness is favorable for extraction rotations.',
  };
};

const threatForecasterSignal = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
): AssistantModuleSignal => {
  const pressure = clampUnit(world.run.threatLevel * 0.4 + interpretation.riskAssessment.sectorRisk * 0.6);

  if (pressure >= 0.75) {
    return {
      id: 'threat-spike-forecast',
      module: 'threat-forecaster',
      priority: 95,
      confidence: clampUnit(0.62 + pressure * 0.38),
      message: 'FORECAST: invasion pressure trending high; bank and fortify early.',
    };
  }

  return {
    id: 'threat-manageable-forecast',
    module: 'threat-forecaster',
    priority: 50,
    confidence: clampUnit(0.55 + (1 - pressure) * 0.35),
    message: 'FORECAST: threat pressure currently manageable with disciplined rotations.',
  };
};

const resourceAssessorSignal = (world: DroneWorldSignal): AssistantModuleSignal => {
  const richestOpenNode = world.resources
    .filter((resource) => !resource.contested)
    .sort((a, b) => b.richness - a.richness)[0];

  if (richestOpenNode && richestOpenNode.richness >= 0.7) {
    return {
      id: `resource-window-${richestOpenNode.id}`,
      module: 'resource-assessor',
      priority: 80,
      confidence: clampUnit(0.6 + richestOpenNode.richness * 0.35),
      message: `RESOURCES: high-yield window at ${richestOpenNode.id}; extract while lane is open.`,
    };
  }

  return {
    id: 'resource-contested-cycle',
    module: 'resource-assessor',
    priority: 40,
    confidence: 0.56,
    message: 'RESOURCES: no clear high-yield opening; favor safe deposits and scouting.',
  };
};

const recoveryAdvisorSignal = (policy: DronePolicyDecision, world: DroneWorldSignal): AssistantModuleSignal => {
  if (!policy.hasSafePath) {
    return {
      id: 'recovery-safe-path-missing',
      module: 'recovery-advisor',
      priority: 90,
      confidence: 0.97,
      message: 'RECOVERY: secure a safe lane before committing to extraction.',
    };
  }

  if (world.run.resourcesBanked <= 20) {
    return {
      id: 'recovery-low-bank',
      module: 'recovery-advisor',
      priority: 70,
      confidence: 0.84,
      message: 'RECOVERY: resource reserves are low; prioritize survivable banking cycles.',
    };
  }

  return {
    id: 'recovery-stable',
    module: 'recovery-advisor',
    priority: 35,
    confidence: 0.62,
    message: 'RECOVERY: reserve buffer healthy; expand cautiously for growth.',
  };
};

export const createAssistantModuleSignals = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
  policy: DronePolicyDecision,
): AssistantModuleSignal[] => [
  conwayInterpreterSignal(interpretation),
  mapSurveyorSignal(world),
  threatForecasterSignal(world, interpretation),
  resourceAssessorSignal(world),
  recoveryAdvisorSignal(policy, world),
];

export const DEFAULT_ASSISTANT_TUNING: DroneAssistantTuningConfig = {
  minConfidenceToBroadcast: 0.6,
  maxSignalsPerTick: 4,
  duplicateWindowTicks: 6,
  hazardBalanceBias: 0.5,
};

const DEFAULT_SIGNAL: DroneAssistantAdvisorySignal = {
  id: 'status-stable',
  category: 'recovery',
  message: 'STATUS STABLE: maintain extraction and fortification balance.',
  priority: 1,
  confidence: 1,
};

export type TunedAssistantResult = {
  advisorySignalDetails: DroneAssistantAdvisorySignal[];
  suppressedSignalCount: number;
  tuning: DroneAssistantTuningConfig;
};

const shouldSuppressForPlaytest = (
  signal: AssistantModuleSignal,
  playtest: DronePlaytestFeedback,
  tuning: DroneAssistantTuningConfig,
): boolean => {
  if (signal.confidence < tuning.minConfidenceToBroadcast) {
    return true;
  }

  const frustrationDominant = playtest.frustrationEvents > playtest.excitingEvents;
  if (frustrationDominant && signal.module === 'map-surveyor' && signal.priority < 70) {
    return true;
  }

  return false;
};

export const tuneAssistantSignals = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
  policy: DronePolicyDecision,
  tuningOverrides: Partial<DroneAssistantTuningConfig> = {},
  playtestFeedback: DronePlaytestFeedback = {
    confusionEvents: 0,
    excitingEvents: 0,
    frustrationEvents: 0,
    ignoredAdviceEvents: 0,
  },
): TunedAssistantResult => {
  const tuning = { ...DEFAULT_ASSISTANT_TUNING, ...tuningOverrides };
  const hazardBias = clampUnit(tuning.hazardBalanceBias);
  const ranked = createAssistantModuleSignals(world, interpretation, policy)
    .map((signal) => {
      if (signal.module === 'threat-forecaster') {
        return { ...signal, priority: Math.round(signal.priority * (0.8 + hazardBias * 0.4)) };
      }

      if (signal.module === 'resource-assessor') {
        return { ...signal, priority: Math.round(signal.priority * (1.2 - hazardBias * 0.4)) };
      }

      return signal;
    })
    .sort((a, b) => b.priority - a.priority);

  const broadcast = ranked
    .filter((signal) => !shouldSuppressForPlaytest(signal, playtestFeedback, tuning))
    .slice(0, tuning.maxSignalsPerTick)
    .map((signal) => ({
      id: signal.id,
      category: toAdvisoryCategory(signal.module),
      message: signal.message,
      priority: signal.priority,
      confidence: signal.confidence,
    }));

  return {
    advisorySignalDetails: broadcast.length > 0 ? broadcast : [DEFAULT_SIGNAL],
    suppressedSignalCount: Math.max(0, ranked.length - broadcast.length),
    tuning,
  };
};

export const synthesizeAssistantSignals = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
  policy: DronePolicyDecision,
  maxSignals = 4,
): string[] =>
  tuneAssistantSignals(world, interpretation, policy, {
    maxSignalsPerTick: maxSignals,
  }).advisorySignalDetails.map((signal) => signal.message);
