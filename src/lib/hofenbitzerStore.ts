"use client";

import { create } from "zustand";
import {
  buildScene,
  computeDerived,
  getDefaultBaseMeasurements,
} from "@/patterns/hofenbitzerBasicSkirt/engine";
import type {
  HofenbitzerBaseMeasurements,
  HofenbitzerEffectiveMeasurements,
  HofenbitzerPatternInstance,
  HofenbitzerProjectState,
  HofenbitzerProjectUiState,
} from "@/patterns/hofenbitzerBasicSkirt/types";
import type { PatternScene } from "@/patterns/types";

const DRAFT_COLORS = [
  "#111111",
  "#b45309",
  "#1d4ed8",
  "#be123c",
  "#4d7c0f",
  "#7c3aed",
  "#1f2937",
  "#e11d48",
];

const createId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
};

const defaultBase = getDefaultBaseMeasurements();

const createInstance = (
  index: number,
  overrides: HofenbitzerPatternInstance["overrides"] = {},
): HofenbitzerPatternInstance => ({
  id: createId(),
  name: `Draft ${index + 1}`,
  color: DRAFT_COLORS[index % DRAFT_COLORS.length],
  visible: true,
  overrides,
});

const initialInstance = createInstance(0);

const defaultUi: HofenbitzerProjectUiState = {
  selectedInstanceId: initialInstance.id,
  showGrid: true,
  showLabels: true,
  showMarkers: true,
  showCleanUp: false,
  exportSelectedOnly: false,
  lineStrokeWidth: 1,
};

const numericKeys: Array<Exclude<keyof HofenbitzerBaseMeasurements, "hipProfile" | "dartsAuto">> = [
  "hiC",
  "waC",
  "hiD",
  "moL",
  "hipEase",
  "waistEase",
  "frontDartLength",
  "backDartLength1",
  "backDartLength2",
  "sideDart",
  "frontDart",
  "backDart1",
  "backDart2",
];

type DartDistributionKey = "sideDart" | "frontDart" | "backDart1" | "backDart2";

const sanitizeNumber = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;

const sanitizeLineStrokeWidth = (value: number, fallback = 1): number => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(6, Math.max(0.1, Math.round(value * 100) / 100));
};

const sanitizeColor = (value: string, fallback: string): string => {
  if (typeof value !== "string") {
    return fallback;
  }

  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
};

type UiBooleanKey = "showGrid" | "showLabels" | "showMarkers" | "showCleanUp" | "exportSelectedOnly";

export const mergeEffectiveMeasurements = (
  base: HofenbitzerBaseMeasurements,
  instance: HofenbitzerPatternInstance,
): HofenbitzerEffectiveMeasurements => {
  const merged: HofenbitzerBaseMeasurements = {
    ...base,
    ...instance.overrides,
  };

  return {
    ...merged,
    ...computeDerived(merged),
  };
};

export type HofenbitzerStoreState = HofenbitzerProjectState & {
  setSelectedInstance: (id: string) => void;
  addDuplicate: () => void;
  removeInstance: (id: string) => void;
  toggleVisible: (id: string) => void;
  setInstanceColor: (id: string, color: string) => void;
  setOverride: (
    id: string,
    key: keyof HofenbitzerBaseMeasurements,
    value: number | string | boolean | undefined,
  ) => void;
  setDartValue: (id: string, key: DartDistributionKey, value: number) => void;
  resetDartsAutocalc: (id: string) => void;
  resetOverrides: (id: string) => void;
  setUiToggle: (key: UiBooleanKey, value: boolean) => void;
  setLineStrokeWidth: (value: number) => void;
  hydrateFromProject: (next: HofenbitzerProjectState) => void;
  getEffectiveMeasurements: (id: string) => HofenbitzerEffectiveMeasurements | null;
  getSceneForInstance: (id: string) => PatternScene | null;
};

export const useHofenbitzerStore = create<HofenbitzerStoreState>((set, get) => ({
  base: defaultBase,
  instances: [initialInstance],
  ui: defaultUi,

  setSelectedInstance: (id) => {
    set((state) => ({
      ui: {
        ...state.ui,
        selectedInstanceId: id,
      },
    }));
  },

  addDuplicate: () => {
    set((state) => {
      const selected =
        state.instances.find((instance) => instance.id === state.ui.selectedInstanceId) ??
        state.instances[0];
      const next = createInstance(state.instances.length, selected ? { ...selected.overrides } : {});

      return {
        instances: [...state.instances, next],
        ui: {
          ...state.ui,
          selectedInstanceId: next.id,
        },
      };
    });
  },

  removeInstance: (id) => {
    set((state) => {
      if (state.instances.length <= 1) {
        return state;
      }

      const nextInstances = state.instances.filter((instance) => instance.id !== id);
      const selectedStillExists = nextInstances.some(
        (instance) => instance.id === state.ui.selectedInstanceId,
      );

      return {
        instances: nextInstances,
        ui: {
          ...state.ui,
          selectedInstanceId: selectedStillExists
            ? state.ui.selectedInstanceId
            : (nextInstances[0]?.id ?? null),
        },
      };
    });
  },

  toggleVisible: (id) => {
    set((state) => ({
      instances: state.instances.map((instance) =>
        instance.id === id ? { ...instance, visible: !instance.visible } : instance,
      ),
    }));
  },

  setInstanceColor: (id, color) => {
    set((state) => ({
      instances: state.instances.map((instance) =>
        instance.id === id
          ? { ...instance, color: sanitizeColor(color, instance.color) }
          : instance,
      ),
    }));
  },

  setOverride: (id, key, value) => {
    set((state) => ({
      instances: state.instances.map((instance) => {
        if (instance.id !== id) {
          return instance;
        }

        if (value === undefined) {
          const nextOverrides = { ...instance.overrides };
          delete nextOverrides[key];
          return {
            ...instance,
            overrides: nextOverrides,
          };
        }

        if (key === "hipProfile") {
          const normalized = String(value);
          const hipProfile =
            normalized === "Flat" || normalized === "Normal" || normalized === "Curvy"
              ? normalized
              : "Normal";

          return {
            ...instance,
            overrides: {
              ...instance.overrides,
              hipProfile,
            },
          };
        }

        if (key === "dartsAuto") {
          return {
            ...instance,
            overrides: {
              ...instance.overrides,
              dartsAuto: Boolean(value),
            },
          };
        }

        const fallback = Number(state.base[key] ?? 0);
        const parsed = sanitizeNumber(Number(value), fallback);

        return {
          ...instance,
          overrides: {
            ...instance.overrides,
            [key]: parsed,
          },
        };
      }),
    }));
  },

  setDartValue: (id, key, value) => {
    set((state) => ({
      instances: state.instances.map((instance) => {
        if (instance.id !== id) {
          return instance;
        }

        const merged: HofenbitzerBaseMeasurements = {
          ...state.base,
          ...instance.overrides,
        };
        const fallback = Number(merged[key] ?? 0);
        const parsed = sanitizeNumber(Number(value), fallback);
        const isAuto = merged.dartsAuto !== false;

        if (isAuto) {
          const autoSeed = computeDerived({
            ...merged,
            dartsAuto: true,
          });

          return {
            ...instance,
            overrides: {
              ...instance.overrides,
              dartsAuto: false,
              sideDart: autoSeed.sideDart,
              frontDart: autoSeed.frontDart,
              backDart1: autoSeed.backDart1,
              backDart2: autoSeed.backDart2,
              [key]: parsed,
            },
          };
        }

        return {
          ...instance,
          overrides: {
            ...instance.overrides,
            dartsAuto: false,
            [key]: parsed,
          },
        };
      }),
    }));
  },

  resetDartsAutocalc: (id) => {
    set((state) => ({
      instances: state.instances.map((instance) => {
        if (instance.id !== id) {
          return instance;
        }

        const nextOverrides = { ...instance.overrides };
        delete nextOverrides.dartsAuto;
        delete nextOverrides.sideDart;
        delete nextOverrides.frontDart;
        delete nextOverrides.backDart1;
        delete nextOverrides.backDart2;

        return {
          ...instance,
          overrides: nextOverrides,
        };
      }),
    }));
  },

  resetOverrides: (id) => {
    set((state) => ({
      instances: state.instances.map((instance) =>
        instance.id === id
          ? {
              ...instance,
              overrides: {},
            }
          : instance,
      ),
    }));
  },

  setUiToggle: (key, value) => {
    set((state) => ({
      ui: {
        ...state.ui,
        [key]: value,
      },
    }));
  },

  setLineStrokeWidth: (value) => {
    set((state) => ({
      ui: {
        ...state.ui,
        lineStrokeWidth: sanitizeLineStrokeWidth(value, state.ui.lineStrokeWidth),
      },
    }));
  },

  hydrateFromProject: (next) => {
    set(() => {
      const instances = next.instances.length > 0 ? next.instances : [createInstance(0)];
      const selectedExists = instances.some((instance) => instance.id === next.ui.selectedInstanceId);

      const normalizedBase: HofenbitzerBaseMeasurements = {
        ...defaultBase,
      };

      for (const key of numericKeys) {
        const nextValue = Number(next.base[key]);
        normalizedBase[key] = sanitizeNumber(nextValue, defaultBase[key] as number);
      }
      const profile = next.base.hipProfile;
      normalizedBase.hipProfile =
        profile === "Flat" || profile === "Normal" || profile === "Curvy"
          ? profile
          : defaultBase.hipProfile;
      normalizedBase.dartsAuto =
        typeof next.base.dartsAuto === "boolean" ? next.base.dartsAuto : defaultBase.dartsAuto;

      return {
        base: normalizedBase,
        instances,
        ui: {
          ...defaultUi,
          ...next.ui,
          lineStrokeWidth: sanitizeLineStrokeWidth(
            Number(next.ui.lineStrokeWidth),
            defaultUi.lineStrokeWidth,
          ),
          selectedInstanceId: selectedExists ? next.ui.selectedInstanceId : instances[0]?.id ?? null,
        },
      };
    });
  },

  getEffectiveMeasurements: (id) => {
    const state = get();
    const instance = state.instances.find((item) => item.id === id);
    if (!instance) {
      return null;
    }

    return mergeEffectiveMeasurements(state.base, instance);
  },

  getSceneForInstance: (id) => {
    const effective = get().getEffectiveMeasurements(id);
    if (!effective) {
      return null;
    }

    return buildScene(effective);
  },
}));

export const selectProjectState = (
  state: HofenbitzerStoreState,
): HofenbitzerProjectState => ({
  base: state.base,
  instances: state.instances,
  ui: state.ui,
});
