export type HofenbitzerCasualShapingMeasurements = {
  FitIndex: number;
  AhD: number;
  AhDEase: number;
  BrC: number;
  BrCEase: number;
  WaC: number;
  WaCEase: number;
  HiC: number;
  HiCEase: number;
  BG: number;
  BGEase: number;
  AG: number;
  AGEase: number;
  BrG: number;
  BrGEase: number;
  ShG: number;
  ShGEase: number;
  BL: number;
  BLBal: number;
  FL: number;
  FLBal: number;
  NeG: number;
  MoL: number;
  HiD: number;
  ShA: number;
  BrD: number;
  ShoulderDifference: number;
  WaistShaping: number;
  FrontShoulderDartPosition: number;
};

export type HofenbitzerCasualShapingBaseMeasurements = HofenbitzerCasualShapingMeasurements;

export type HofenbitzerCasualShapingDerivedValues = {
  AhDPlus: number;
  BrCFinal: number;
  WaCFinal: number;
  HiCFinal: number;
  BGPlus: number;
  AGPlus: number;
  BrGPlus: number;
  fShS: number;
  bShS: number;
  BrW: number;
  WaW: number;
  HiW: number;
  BLFinal: number;
  FLFinal: number;
  individualBalance: number;
  finalBalance: number;
  frontShoulderAngle: number;
  backShoulderAngle: number;
};

export type HofenbitzerCasualShapingEffectiveMeasurements =
  HofenbitzerCasualShapingBaseMeasurements & HofenbitzerCasualShapingDerivedValues;

export type HofenbitzerCasualShapingInstanceOverrides = Partial<HofenbitzerCasualShapingBaseMeasurements>;

export type HofenbitzerCasualShapingPatternInstance = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  overrides: HofenbitzerCasualShapingInstanceOverrides;
};

export type HofenbitzerCasualShapingProjectUiState = {
  selectedInstanceId: string | null;
  showGrid: boolean;
  showLabels: boolean;
  showMarkers: boolean;
  showCleanUp: boolean;
  exportSelectedOnly: boolean;
  lineStrokeWidth: number;
};

export type HofenbitzerCasualShapingProjectState = {
  base: HofenbitzerCasualShapingBaseMeasurements;
  instances: HofenbitzerCasualShapingPatternInstance[];
  ui: HofenbitzerCasualShapingProjectUiState;
};

export type FitProfile = {
  name: string;
  ease: Pick<
    HofenbitzerCasualShapingBaseMeasurements,
    "AhDEase" | "BrCEase" | "WaCEase" | "HiCEase" | "BGEase" | "AGEase" | "BrGEase" | "ShGEase"
  >;
};
