export type DroneVector2 = {
  x: number;
  y: number;
};

export type DroneFaction = 'player' | 'hostile' | 'neutral';

export type DroneEntityKind = 'player-ship' | 'enemy-drone' | 'extractor' | 'turret' | 'resource-node' | 'hazard';

export type DroneEntity = {
  id: string;
  kind: DroneEntityKind;
  faction: DroneFaction;
  position: DroneVector2;
  velocity: DroneVector2;
  integrity: number;
  active: boolean;
};

export type DroneSectorGrid = {
  id: string;
  width: number;
  height: number;
  blockedCells: DroneVector2[];
};

export type DroneResourceField = {
  id: string;
  position: DroneVector2;
  richness: number;
  contested: boolean;
};

export type DroneRunState = {
  timestampMs: number;
  resourcesBanked: number;
  currentSectorId: string;
  threatLevel: number;
  activeObjectives: string[];
};

export type DroneConwayState = {
  step: number;
  aliveCells: DroneVector2[];
};

export type DroneConwayConfig = {
  width: number;
  height: number;
  birthRules: number[];
  survivalRules: number[];
  wrapEdges: boolean;
  stepsPerTick: number;
};

export type DroneConwayMotifKind = 'stable-cluster' | 'oscillator' | 'glider-candidate' | 'chaotic-zone';

export type DroneConwayMotif = {
  kind: DroneConwayMotifKind;
  anchor: DroneVector2;
  cellCount: number;
  confidence: number;
};

export type DroneConwayMotifReport = {
  motifs: DroneConwayMotif[];
  counts: Record<DroneConwayMotifKind, number>;
};

export type DroneGameplayCandidateRegionKind = 'hazard' | 'resource';

export type DroneGameplayCandidateRegion = {
  id: string;
  kind: DroneGameplayCandidateRegionKind;
  cells: DroneVector2[];
  centroid: DroneVector2;
  score: number;
};

export type DroneConwayCandidates = {
  hazardRegions: DroneGameplayCandidateRegion[];
  resourceRegions: DroneGameplayCandidateRegion[];
};

export type DroneConwayAnalysis = {
  motifReport: DroneConwayMotifReport;
  candidates: DroneConwayCandidates;
};

export type DroneWorldSignal = {
  sector: DroneSectorGrid;
  entities: DroneEntity[];
  resources: DroneResourceField[];
  run: DroneRunState;
  conway: DroneConwayState;
};

export type DronePatternFeatures = {
  aliveDensity: number;
  frontierPressure: number;
  hazardCandidateCells: number;
  motifCounts: Record<DroneConwayMotifKind, number>;
  hazardRegionCount: number;
  resourceRegionCount: number;
};

export type DroneRiskAssessment = {
  sectorRisk: number;
  extractionRisk: number;
  confidence: number;
  source: 'deterministic-fallback' | 'assistant-model';
};

export type DroneInterpretation = {
  patternFeatures: DronePatternFeatures;
  riskAssessment: DroneRiskAssessment;
  conwayAnalysis: DroneConwayAnalysis;
};

export type DronePolicyDecision = {
  allowHazardSpawn: boolean;
  allowInvasionEvent: boolean;
  hasSafePath: boolean;
  clampedRisk: number;
  clampedInvasionWaveSize: number;
  reasons: string[];
  reasonCodes: DronePolicyReasonCode[];
  policyLog: DronePolicyLog;
};

export type DronePolicyReasonCode =
  | 'hazard_coverage_exceeded'
  | 'no_safe_path'
  | 'resource_accessibility_below_min'
  | 'risk_below_min'
  | 'resources_below_min';

export type DronePolicyLogReason = {
  code: DronePolicyReasonCode;
  message: string;
};

export type DronePolicyLog = {
  candidateInput: {
    hazardCoverage: number;
    clampedRisk: number;
    resourcesBanked: number;
    hasSafePath: boolean;
    reachableResourceCount: number;
    totalResourceCount: number;
    reachableResourceRatio: number;
  };
  thresholds: {
    maxHazardCoverage: number;
    maxRiskBeforeInvasionClamp: number;
    minRiskForInvasion: number;
    minResourcesForInvasion: number;
    minReachableResourceRatio: number;
    maxInvasionWaveSize: number;
  };
  decision: {
    allowHazardSpawn: boolean;
    allowInvasionEvent: boolean;
    clampedInvasionWaveSize: number;
  };
  reasons: DronePolicyLogReason[];
};

export type DroneExecutionPlan = {
  hazardPlacements: DroneVector2[];
  invasionWaveSize: number;
  advisorySignals: string[];
};

export type DroneTickInput = {
  deltaMs: number;
  world: DroneWorldSignal;
};

export type DroneTickOutput = {
  interpretation: DroneInterpretation;
  policy: DronePolicyDecision;
  execution: DroneExecutionPlan;
};
