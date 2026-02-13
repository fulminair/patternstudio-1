export type HofenbitzerCasualMeasurements = {
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
};

export type HofenbitzerCasualBaseMeasurements = HofenbitzerCasualMeasurements;

export type HofenbitzerCasualDerivedValues = {
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

export type HofenbitzerCasualEffectiveMeasurements =
  HofenbitzerCasualBaseMeasurements & HofenbitzerCasualDerivedValues;

export type HofenbitzerCasualInstanceOverrides = Partial<HofenbitzerCasualBaseMeasurements>;

export type HofenbitzerCasualPatternInstance = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  overrides: HofenbitzerCasualInstanceOverrides;
};

export type HofenbitzerCasualProjectUiState = {
  selectedInstanceId: string | null;
  showGrid: boolean;
  showLabels: boolean;
  showMarkers: boolean;
  showCleanUp: boolean;
  exportSelectedOnly: boolean;
  lineStrokeWidth: number;
};

export type HofenbitzerCasualProjectState = {
  base: HofenbitzerCasualBaseMeasurements;
  instances: HofenbitzerCasualPatternInstance[];
  ui: HofenbitzerCasualProjectUiState;
};

export type FitProfile = {
  name: string;
  ease: Pick<
    HofenbitzerCasualBaseMeasurements,
    "AhDEase" | "BrCEase" | "WaCEase" | "HiCEase" | "BGEase" | "AGEase" | "BrGEase" | "ShGEase"
  >;
};
