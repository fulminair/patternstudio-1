export type HofenbitzerContouredHipGapMeasurements = {
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
  BackContour: number;
  BackShoulderDartIntake: number;
  FrontWaistDartAddition: number;
  FrontDartLength: number;
  MainBackDartLength: number;
  SecondBackDartLength: number;
};

export type HofenbitzerContouredHipGapBaseMeasurements = HofenbitzerContouredHipGapMeasurements;

export type HofenbitzerContouredHipGapDerivedValues = {
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
  HiGap: number;
  HiG: number;
  HiDiff: number;
  frontWaistGap: number;
  backWaistGap: number;
  waistGapTotal: number;
  waistDifference: number;
  waistSideShare: number;
  waistBackArmShare: number;
  waistBackDartShare: number;
};

export type HofenbitzerContouredHipGapEffectiveMeasurements =
  HofenbitzerContouredHipGapBaseMeasurements & HofenbitzerContouredHipGapDerivedValues;

export type HofenbitzerContouredHipGapInstanceOverrides =
  Partial<HofenbitzerContouredHipGapBaseMeasurements>;

export type HofenbitzerContouredHipGapPatternInstance = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  overrides: HofenbitzerContouredHipGapInstanceOverrides;
};

export type HofenbitzerContouredHipGapProjectUiState = {
  selectedInstanceId: string | null;
  showGrid: boolean;
  showLabels: boolean;
  showMarkers: boolean;
  showCleanUp: boolean;
  exportSelectedOnly: boolean;
  lineStrokeWidth: number;
};

export type HofenbitzerContouredHipGapProjectState = {
  base: HofenbitzerContouredHipGapBaseMeasurements;
  instances: HofenbitzerContouredHipGapPatternInstance[];
  ui: HofenbitzerContouredHipGapProjectUiState;
};

export type FitProfile = {
  name: string;
  ease: Pick<
    HofenbitzerContouredHipGapBaseMeasurements,
    "AhDEase" | "BrCEase" | "WaCEase" | "HiCEase" | "BGEase" | "AGEase" | "BrGEase" | "ShGEase"
  >;
};
