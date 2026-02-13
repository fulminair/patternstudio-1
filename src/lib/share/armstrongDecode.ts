import { getDefaultBaseMeasurements } from "@/patterns/armstrongBodice/engine";
import type {
  ArmstrongBaseMeasurements,
  ArmstrongPatternInstance,
  ArmstrongProjectState,
  ArmstrongProjectUiState,
} from "@/patterns/armstrongBodice/types";

const MEASUREMENT_KEYS: Array<keyof ArmstrongBaseMeasurements> = [
  "fullLength",
  "acrossShoulder",
  "centreFrontLength",
  "bustArc",
  "shoulderSlope",
  "bustDepth",
  "shoulderLength",
  "bustSpan",
  "acrossChest",
  "dartPlacement",
  "newStrap",
  "sideLength",
  "waistArc",
  "fullLengthBack",
  "acrossShoulderBack",
  "centreFrontLengthBack",
  "bustArcBack",
  "shoulderSlopeBack",
  "shoulderLengthBack",
  "bustSpanBack",
  "acrossChestBack",
  "dartPlacementBack",
  "sideLengthBack",
  "waistArcBack",
  "backNeck",
  "bustCup",
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const parseBase = (
  input: unknown,
  defaults: ArmstrongBaseMeasurements,
): ArmstrongBaseMeasurements => {
  if (!isObject(input)) {
    return defaults;
  }

  const next = { ...defaults };

  for (const key of MEASUREMENT_KEYS) {
    const candidate = input[key];
    if (key === "bustCup") {
      if (
        candidate === "A Cup" ||
        candidate === "B Cup" ||
        candidate === "C Cup" ||
        candidate === "D Cup"
      ) {
        next.bustCup = candidate;
      }
      continue;
    }

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      next[key] = candidate;
    }
  }

  return next;
};

const parseInstances = (input: unknown): ArmstrongPatternInstance[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((value): value is Record<string, unknown> => isObject(value))
    .map((value, index) => {
      const overrides = isObject(value.overrides) ? value.overrides : {};
      const parsedOverrides: ArmstrongPatternInstance["overrides"] = {};

      for (const key of MEASUREMENT_KEYS) {
        const candidate = overrides[key];
        if (candidate === undefined) {
          continue;
        }

        if (
          key === "bustCup" &&
          (candidate === "A Cup" ||
            candidate === "B Cup" ||
            candidate === "C Cup" ||
            candidate === "D Cup")
        ) {
          parsedOverrides.bustCup = candidate;
          continue;
        }

        if (key !== "bustCup" && typeof candidate === "number" && Number.isFinite(candidate)) {
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
  instances: ArmstrongPatternInstance[],
): ArmstrongProjectUiState => {
  const fallback: ArmstrongProjectUiState = {
    selectedInstanceId: instances[0]?.id ?? null,
    showGrid: true,
    showLabels: true,
    showMarkers: true,
    showCleanUp: false,
    exportSelectedOnly: false,
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
  };
};

export const decodeArmstrongProjectState = (
  encoded: string,
): ArmstrongProjectState | null => {
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
