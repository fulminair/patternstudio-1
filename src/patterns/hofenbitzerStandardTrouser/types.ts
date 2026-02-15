export type HofenbitzerStandardTrouserMeasurements = {
  HiC: number;
  WaC: number;
  sWaH: number;
  CrH: number;
  CrL: number;
  KnH: number;
  ThC: number;
  HEM: number;
  BuA: number;
  CrHReduction: number;
  HemShorten: number;
  CrotchExtAdjust: number;
  Point11Shift: number;
  SquareUpLen: number;
  FrontWaistReduction: number;
  WaistEase: number;
  FrontSideDartOverride: number;
  BackSideDartOverride: number;
  FrontDartOverride: number;
  BackDart1Override: number;
  BackDart2Override: number;
  FrontDartLen: number;
  BackDart1Len: number;
  BackDart2Len: number;
  LegSeamShape: number;
  BackHipAdjustment: number;
  BackInseamReduction: number;
  TummyProfileIndex: number;
  HipProfileIndex: number;
  HipBoneCurveIndex: number;
  ThighProfileIndex: number;
  ButtocksProfileIndex: number;
};

export type HofenbitzerStandardTrouserBaseMeasurements =
  HofenbitzerStandardTrouserMeasurements;

export type HofenbitzerStandardTrouserDerivedValues = {
  CrLResolved: number;
  KnHResolved: number;
  WaistDifferenceGuide: number;
  FrontTrouserWidth: number;
  BackTrouserWidth: number;
  FrontCrotchExtension: number;
  BackCrotchExtension: number;
};

export type HofenbitzerStandardTrouserEffectiveMeasurements =
  HofenbitzerStandardTrouserBaseMeasurements & HofenbitzerStandardTrouserDerivedValues;

export type HofenbitzerStandardTrouserInstanceOverrides =
  Partial<HofenbitzerStandardTrouserBaseMeasurements>;

export type HofenbitzerStandardTrouserPatternInstance = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  overrides: HofenbitzerStandardTrouserInstanceOverrides;
};

export type HofenbitzerStandardTrouserProjectUiState = {
  selectedInstanceId: string | null;
  showGrid: boolean;
  showLabels: boolean;
  showMarkers: boolean;
  showCleanUp: boolean;
  exportSelectedOnly: boolean;
  lineStrokeWidth: number;
};

export type HofenbitzerStandardTrouserProjectState = {
  base: HofenbitzerStandardTrouserBaseMeasurements;
  instances: HofenbitzerStandardTrouserPatternInstance[];
  ui: HofenbitzerStandardTrouserProjectUiState;
};
