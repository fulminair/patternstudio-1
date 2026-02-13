export type HofenbitzerWideBasicSleeveMeasurements = {
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

export type HofenbitzerWideBasicSleeveBaseMeasurements =
  HofenbitzerWideBasicSleeveMeasurements;

export type HofenbitzerWideBasicSleeveDerivedValues = {
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

export type HofenbitzerWideBasicSleeveEffectiveMeasurements =
  HofenbitzerWideBasicSleeveBaseMeasurements & HofenbitzerWideBasicSleeveDerivedValues;

export type HofenbitzerWideBasicSleeveDraftMetrics = {
  capLine: number;
  sleeveWidth: number;
  elbowWidth: number;
  sleeveCap: number;
};

export type HofenbitzerWideBasicSleeveInstanceOverrides =
  Partial<HofenbitzerWideBasicSleeveBaseMeasurements>;

export type HofenbitzerWideBasicSleevePatternInstance = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  overrides: HofenbitzerWideBasicSleeveInstanceOverrides;
};

export type HofenbitzerWideBasicSleeveProjectUiState = {
  selectedInstanceId: string | null;
  showGrid: boolean;
  showLabels: boolean;
  showMarkers: boolean;
  showCleanUp: boolean;
  exportSelectedOnly: boolean;
  lineStrokeWidth: number;
};

export type HofenbitzerWideBasicSleeveProjectState = {
  base: HofenbitzerWideBasicSleeveBaseMeasurements;
  instances: HofenbitzerWideBasicSleevePatternInstance[];
  ui: HofenbitzerWideBasicSleeveProjectUiState;
};
