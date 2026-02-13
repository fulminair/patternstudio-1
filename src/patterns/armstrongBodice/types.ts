export type ArmstrongBustCup = "A Cup" | "B Cup" | "C Cup" | "D Cup";

export type ArmstrongMeasurements = {
  fullLength: number;
  acrossShoulder: number;
  centreFrontLength: number;
  bustArc: number;
  shoulderSlope: number;
  bustDepth: number;
  shoulderLength: number;
  bustSpan: number;
  acrossChest: number;
  dartPlacement: number;
  newStrap: number;
  sideLength: number;
  waistArc: number;
  fullLengthBack: number;
  acrossShoulderBack: number;
  centreFrontLengthBack: number;
  bustArcBack: number;
  shoulderSlopeBack: number;
  shoulderLengthBack: number;
  bustSpanBack: number;
  acrossChestBack: number;
  dartPlacementBack: number;
  sideLengthBack: number;
  waistArcBack: number;
  backNeck: number;
  bustCup: ArmstrongBustCup;
};

export type ArmstrongBaseMeasurements = ArmstrongMeasurements;

export type ArmstrongDerivedValues = {
  bustCupOffset: number;
  frontWaistIntake: number;
  backWaistIntake: number;
};

export type ArmstrongEffectiveMeasurements = ArmstrongBaseMeasurements & ArmstrongDerivedValues;

export type ArmstrongInstanceOverrides = Partial<ArmstrongBaseMeasurements>;

export type ArmstrongPatternInstance = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  overrides: ArmstrongInstanceOverrides;
};

export type ArmstrongProjectUiState = {
  selectedInstanceId: string | null;
  showGrid: boolean;
  showLabels: boolean;
  showMarkers: boolean;
  showCleanUp: boolean;
  exportSelectedOnly: boolean;
};

export type ArmstrongProjectState = {
  base: ArmstrongBaseMeasurements;
  instances: ArmstrongPatternInstance[];
  ui: ArmstrongProjectUiState;
};
