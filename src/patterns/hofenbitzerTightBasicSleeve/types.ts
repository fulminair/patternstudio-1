export type HofenbitzerTightBasicSleeveMeasurements = {
  AhH: number;
  AhHEase: number;
  fAh: number;
  bAh: number;
  AhC: number | null;
  AhCEase: number;
  fAhEase: number;
  bAhEase: number;
  AL: number;
  ALEase: number;
  upAC: number;
  upACEase: number;
  WrC: number;
  WrCEase: number;
  CapEasePct: number;
  CapEasePctEase: number;
  CapCEase: number;
  CapLineEase: number;
  fAP: number;
  bAP: number;
};

export type HofenbitzerTightBasicSleeveBaseMeasurements =
  HofenbitzerTightBasicSleeveMeasurements;

export type HofenbitzerTightBasicSleeveDerivedValues = {
  AhHConstruction: number;
  fAhConstruction: number;
  bAhConstruction: number;
  AhCConstruction: number;
  SlL: number;
  SlW: number;
  HeW: number;
  CapEasePctConstruction: number;
  CapEaseCm: number;
  CapC: number;
  CapLineCm: number;
};

export type HofenbitzerTightBasicSleeveEffectiveMeasurements =
  HofenbitzerTightBasicSleeveBaseMeasurements & HofenbitzerTightBasicSleeveDerivedValues;

export type HofenbitzerTightBasicSleeveDraftMetrics = {
  capLine: number;
  sleeveWidth: number;
  elbowWidth: number;
  sleeveCap: number;
};

export type HofenbitzerTightBasicSleeveInstanceOverrides =
  Partial<HofenbitzerTightBasicSleeveBaseMeasurements>;

export type HofenbitzerTightBasicSleevePatternInstance = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  overrides: HofenbitzerTightBasicSleeveInstanceOverrides;
};

export type HofenbitzerTightBasicSleeveProjectUiState = {
  selectedInstanceId: string | null;
  showGrid: boolean;
  showLabels: boolean;
  showMarkers: boolean;
  showCleanUp: boolean;
  exportSelectedOnly: boolean;
  lineStrokeWidth: number;
};

export type HofenbitzerTightBasicSleeveProjectState = {
  base: HofenbitzerTightBasicSleeveBaseMeasurements;
  instances: HofenbitzerTightBasicSleevePatternInstance[];
  ui: HofenbitzerTightBasicSleeveProjectUiState;
};
