export type HipProfile = "Flat" | "Normal" | "Curvy";

export type HofenbitzerMeasurements = {
  hiC: number;
  waC: number;
  hiD: number;
  moL: number;
  hipEase: number;
  waistEase: number;
  frontDartLength: number;
  backDartLength1: number;
  backDartLength2: number;
  dartsAuto: boolean;
  sideDart: number;
  frontDart: number;
  backDart1: number;
  backDart2: number;
  hipProfile: HipProfile;
};

export type HofenbitzerBaseMeasurements = HofenbitzerMeasurements;

export type HofenbitzerDerivedValues = {
  hiW: number;
  waW: number;
  waistDiffTarget: number;
  sideDart: number;
  frontDart: number;
  backDart1: number;
  backDart2: number;
  dartSum: number;
  waDif: number;
  waistShaping: number;
};

export type HofenbitzerEffectiveMeasurements =
  HofenbitzerBaseMeasurements & HofenbitzerDerivedValues;

export type HofenbitzerInstanceOverrides = Partial<HofenbitzerBaseMeasurements>;

export type HofenbitzerPatternInstance = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  overrides: HofenbitzerInstanceOverrides;
};

export type HofenbitzerProjectUiState = {
  selectedInstanceId: string | null;
  showGrid: boolean;
  showLabels: boolean;
  showMarkers: boolean;
  showCleanUp: boolean;
  exportSelectedOnly: boolean;
  lineStrokeWidth: number;
};

export type HofenbitzerProjectState = {
  base: HofenbitzerBaseMeasurements;
  instances: HofenbitzerPatternInstance[];
  ui: HofenbitzerProjectUiState;
};
