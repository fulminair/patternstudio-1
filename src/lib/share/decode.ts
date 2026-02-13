import { getDefaultBaseMeasurements } from "@/patterns/aldrichCloseFittingBodice/engine";
import type { BaseMeasurements, PatternInstance, ProjectState, ProjectUiState } from "@/patterns/types";

const MEASUREMENT_KEYS: Array<keyof BaseMeasurements> = [
  "bust",
  "bustEase",
  "waist",
  "waistEase",
  "hip",
  "napeToWaist",
  "shoulder",
  "backWidth",
  "waistToHip",
  "armscyeDepth",
  "chest",
  "neckSize",
  "closeWaistShaping",
  "reducedDarting",
];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const sanitizeLineStrokeWidth = (value: unknown, fallback: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(6, Math.max(0.1, Math.round(value * 100) / 100));
};

const parseBase = (input: unknown, defaults: BaseMeasurements): BaseMeasurements => {
  if (!isObject(input)) {
    return defaults;
  }

  const next = { ...defaults };

  for (const key of MEASUREMENT_KEYS) {
    const candidate = input[key];
    if (typeof defaults[key] === "boolean") {
      if (typeof candidate === "boolean") {
        (next[key] as boolean) = candidate;
      }
      continue;
    }

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      (next[key] as number) = candidate;
    }
  }

  return next;
};

const parseInstances = (input: unknown): PatternInstance[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((value): value is Record<string, unknown> => isObject(value))
    .map((value, index) => {
      const overrides = isObject(value.overrides) ? value.overrides : {};
      const parsedOverrides: PatternInstance["overrides"] = {};

      for (const key of MEASUREMENT_KEYS) {
        const candidate = overrides[key];
        if (candidate === undefined) {
          continue;
        }

        if (
          (key === "closeWaistShaping" || key === "reducedDarting") &&
          typeof candidate === "boolean"
        ) {
          parsedOverrides[key] = candidate;
        }

        if (
          key !== "closeWaistShaping" &&
          key !== "reducedDarting" &&
          typeof candidate === "number" &&
          Number.isFinite(candidate)
        ) {
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

const parseUi = (input: unknown, instances: PatternInstance[]): ProjectUiState => {
  const fallback: ProjectUiState = {
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

export const decodeProjectState = (encoded: string): ProjectState | null => {
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
