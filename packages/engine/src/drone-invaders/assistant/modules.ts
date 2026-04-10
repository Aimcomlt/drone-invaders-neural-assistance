import { DroneInterpretation, DronePolicyDecision, DroneWorldSignal } from '@pacman/shared';

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
  message: string;
};

const clampUnit = (value: number): number => Math.max(0, Math.min(1, value));

const conwayInterpreterSignal = (interpretation: DroneInterpretation): AssistantModuleSignal => {
  const motifCounts = interpretation.patternFeatures.motifCounts;
  const chaoticShare = clampUnit(motifCounts['chaotic-zone'] / Math.max(1, Object.values(motifCounts).reduce((a, b) => a + b, 0)));

  if (chaoticShare >= 0.5) {
    return {
      id: 'conway-chaotic-front',
      module: 'conway-interpreter',
      priority: 85,
      message: 'CONWAY: chaotic fronts detected; expect unstable hazard pockets.',
    };
  }

  return {
    id: 'conway-stable-zones',
    module: 'conway-interpreter',
    priority: 55,
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
      message: 'SURVEY: sector lanes are constrained; avoid deep flanks without fallback.',
    };
  }

  return {
    id: 'map-open-lanes',
    module: 'map-surveyor',
    priority: 45,
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
      message: 'FORECAST: invasion pressure trending high; bank and fortify early.',
    };
  }

  return {
    id: 'threat-manageable-forecast',
    module: 'threat-forecaster',
    priority: 50,
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
      message: `RESOURCES: high-yield window at ${richestOpenNode.id}; extract while lane is open.`,
    };
  }

  return {
    id: 'resource-contested-cycle',
    module: 'resource-assessor',
    priority: 40,
    message: 'RESOURCES: no clear high-yield opening; favor safe deposits and scouting.',
  };
};

const recoveryAdvisorSignal = (policy: DronePolicyDecision, world: DroneWorldSignal): AssistantModuleSignal => {
  if (!policy.hasSafePath) {
    return {
      id: 'recovery-safe-path-missing',
      module: 'recovery-advisor',
      priority: 90,
      message: 'RECOVERY: secure a safe lane before committing to extraction.',
    };
  }

  if (world.run.resourcesBanked <= 20) {
    return {
      id: 'recovery-low-bank',
      module: 'recovery-advisor',
      priority: 70,
      message: 'RECOVERY: resource reserves are low; prioritize survivable banking cycles.',
    };
  }

  return {
    id: 'recovery-stable',
    module: 'recovery-advisor',
    priority: 35,
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

const DEFAULT_SIGNAL = 'STATUS STABLE: maintain extraction and fortification balance.';

export const synthesizeAssistantSignals = (
  world: DroneWorldSignal,
  interpretation: DroneInterpretation,
  policy: DronePolicyDecision,
  maxSignals = 4,
): string[] => {
  const ranked = createAssistantModuleSignals(world, interpretation, policy)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, maxSignals)
    .map((signal) => signal.message);

  return ranked.length > 0 ? ranked : [DEFAULT_SIGNAL];
};
