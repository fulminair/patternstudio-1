import { getDefaultBaseMeasurements } from "@/patterns/hofenbitzerStandardTrouser/engine";
import type {
  HofenbitzerStandardTrouserBaseMeasurements,
  HofenbitzerStandardTrouserPatternInstance,
  HofenbitzerStandardTrouserProjectState,
  HofenbitzerStandardTrouserProjectUiState,
} from "@/patterns/hofenbitzerStandardTrouser/types";

const MEASUREMENT_KEYS: Array<keyof HofenbitzerStandardTrouserBaseMeasurements> = [
  "HiC",
  "WaC",
  "sWaH",
  "CrH",
  "CrL",
  "KnH",
  "ThC",
  "HEM",
  "BuA",
  "CrHReduction",
  "HemShorten",
  "CrotchExtAdjust",
  "Point11Shift",
  "SquareUpLen",
  "FrontWaistReduction",
  "WaistEase",
  "FrontSideDartOverride",
  "BackSideDartOverride",
  "FrontDartOverride",
  "BackDart1Override",
  "BackDart2Override",
  "FrontDartLen",
  "BackDart1Len",
  "BackDart2Len",
  "LegSeamShape",
  "BackHipAdjustment",
  "BackInseamReduction",
  "TummyProfileIndex",
  "HipProfileIndex",
  "HipBoneCurveIndex",
  "ThighProfileIndex",
  "ButtocksProfileIndex",
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeLineStrokeWidth = (value: unknown, fallback: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(6, Math.max(0.1, Math.round(value * 100) / 100));
};

const parseBase = (
  input: unknown,
  defaults: HofenbitzerStandardTrouserBaseMeasurements,
): HofenbitzerStandardTrouserBaseMeasurements => {
  if (!isObject(input)) {
    return defaults;
  }

  const next = { ...defaults };

  for (const key of MEASUREMENT_KEYS) {
    const candidate = input[key];
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      next[key] = candidate;
    }
  }

  return next;
};

const parseInstances = (input: unknown): HofenbitzerStandardTrouserPatternInstance[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((value): value is Record<string, unknown> => isObject(value))
    .map((value, index) => {
      const overrides = isObject(value.overrides) ? value.overrides : {};
      const parsedOverrides: HofenbitzerStandardTrouserPatternInstance["overrides"] = {};

      for (const key of MEASUREMENT_KEYS) {
        const candidate = overrides[key];
        if (typeof candidate === "number" && Number.isFinite(candidate)) {
          parsedOverrides[key] = candidate;
        }
      }

      return {
        id: typeof value.id === "string" ? value.id : `shared-${index + 1}`,
        name: typeof value.name === "string" ? value.name : `Draft ${index + 1}`,
        color: typeof value.color === "string" ? value.color : "#111111",
        visible: typeof value.visible === "boolean" ? value.visible : true,
        overrides: parsedOverrides,
      };
    });
};

const parseUi = (
  input: unknown,
  instances: HofenbitzerStandardTrouserPatternInstance[],
): HofenbitzerStandardTrouserProjectUiState => {
  const fallback: HofenbitzerStandardTrouserProjectUiState = {
    selectedInstanceId: instances[0]?.id ?? null,
    showGrid: true,
    showLabels: true,
    showMarkers: true,
    showCleanUp: false,
    exportSelectedOnly: false,
    lineStrokeWidth: 1,
  };

  if (!isObject(input)) {
    return fallback;
  }

  const selectedId =
    typeof input.selectedInstanceId === "string" &&
    instances.some((instance) => instance.id === input.selectedInstanceId)
      ? input.selectedInstanceId
      : fallback.selectedInstanceId;

  return {
    selectedInstanceId: selectedId,
    showGrid: typeof input.showGrid === "boolean" ? input.showGrid : fallback.showGrid,
    showLabels: typeof input.showLabels === "boolean" ? input.showLabels : fallback.showLabels,
    showMarkers: typeof input.showMarkers === "boolean" ? input.showMarkers : fallback.showMarkers,
    showCleanUp:
      typeof input.showCleanUp === "boolean" ? input.showCleanUp : fallback.showCleanUp,
    exportSelectedOnly:
      typeof input.exportSelectedOnly === "boolean"
        ? input.exportSelectedOnly
        : fallback.exportSelectedOnly,
    lineStrokeWidth: sanitizeLineStrokeWidth(input.lineStrokeWidth, fallback.lineStrokeWidth),
  };
};

export const decodeHofenbitzerStandardTrouserProjectState = (
  encoded: string,
): HofenbitzerStandardTrouserProjectState | null => {
  try {
    const decoded = decodeURIComponent(encoded);
    const parsed = JSON.parse(decoded) as unknown;

    if (!isObject(parsed)) {
      return null;
    }

    const defaults = getDefaultBaseMeasurements();
    const base = parseBase(parsed.base, defaults);
    const instances = parseInstances(parsed.instances);
    const ui = parseUi(parsed.ui, instances);

    return {
      base,
      instances,
      ui,
    };
  } catch {
    return null;
  }
};
