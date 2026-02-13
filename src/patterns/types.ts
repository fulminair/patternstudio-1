export type Measurements = {
  bust: number;
  bustEase: number;
  waist: number;
  waistEase: number;
  hip: number;
  napeToWaist: number;
  shoulder: number;
  backWidth: number;
  waistToHip: number;
  armscyeDepth: number;
  chest: number;
  neckSize: number;
};

export type PatternToggles = {
  closeWaistShaping: boolean;
  reducedDarting: boolean;
};

export type BaseMeasurements = Measurements & PatternToggles;

export type DerivedValues = {
  frontNeckDart: number;
  bustWaistDiff: number;
  frontWaistDart: number;
  backWaistDart: number;
  frontSideWaistDart: number;
  backSideWaistDart: number;
  frontWaistDartBackOff: number;
};

export type EffectiveMeasurements = BaseMeasurements & DerivedValues;

export type InstanceOverrides = Partial<BaseMeasurements>;

export type PatternInstance = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  overrides: InstanceOverrides;
};

export type ProjectUiState = {
  selectedInstanceId: string | null;
  showGrid: boolean;
  showLabels: boolean;
  showMarkers: boolean;
  showCleanUp: boolean;
  exportSelectedOnly: boolean;
  lineStrokeWidth: number;
};

export type ProjectState = {
  base: BaseMeasurements;
  instances: PatternInstance[];
  ui: ProjectUiState;
};

export type PatternPoint = {
  x: number;
  y: number;
};

export type PatternPath = {
  id: string;
  d: string;
  stroke: string;
  strokeWidth: number;
  dashed?: boolean;
  kind?: "pattern" | "construction" | "cleanup";
};

export type PatternLabel = {
  id: string;
  text: string;
  x: number;
  y: number;
  rotation?: number;
  color?: string;
};

export type PatternMarker = {
  id: string;
  x: number;
  y: number;
  r: number;
  color: string;
  text?: string;
};

export type PatternBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type PatternScene = {
  points: Record<string, PatternPoint>;
  paths: PatternPath[];
  labels: PatternLabel[];
  markers: PatternMarker[];
  bounds: PatternBounds;
};
