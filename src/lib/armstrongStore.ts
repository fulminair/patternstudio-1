"use client";

import { create } from "zustand";
import {
  buildScene,
  computeDerived,
  getDefaultBaseMeasurements,
} from "@/patterns/armstrongBodice/engine";
import type {
  ArmstrongBaseMeasurements,
  ArmstrongEffectiveMeasurements,
  ArmstrongPatternInstance,
  ArmstrongProjectState,
  ArmstrongProjectUiState,
} from "@/patterns/armstrongBodice/types";
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
  overrides: ArmstrongPatternInstance["overrides"] = {},
): ArmstrongPatternInstance => ({
  id: createId(),
  name: `Draft ${index + 1}`,
  color: DRAFT_COLORS[index % DRAFT_COLORS.length],
  visible: true,
  overrides,
});

const initialInstance = createInstance(0);

const defaultUi: ArmstrongProjectUiState = {
  selectedInstanceId: initialInstance.id,
  showGrid: true,
  showLabels: true,
  showMarkers: true,
  showCleanUp: false,
  exportSelectedOnly: false,
};

const numericKeys: Array<keyof ArmstrongBaseMeasurements> = [
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

const sanitizeNumber = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;

export const mergeEffectiveMeasurements = (
  base: ArmstrongBaseMeasurements,
  instance: ArmstrongPatternInstance,
): ArmstrongEffectiveMeasurements => {
  const merged: ArmstrongBaseMeasurements = {
    ...base,
    ...instance.overrides,
  };

  return {
    ...merged,
    ...computeDerived(merged),
  };
};

export type ArmstrongStoreState = ArmstrongProjectState & {
  setSelectedInstance: (id: string) => void;
  addDuplicate: () => void;
  removeInstance: (id: string) => void;
  toggleVisible: (id: string) => void;
  setOverride: (
    id: string,
    key: keyof ArmstrongBaseMeasurements,
    value: number | string | undefined,
  ) => void;
  resetOverrides: (id: string) => void;
  setUiToggle: (
    key: Exclude<keyof ArmstrongProjectUiState, "selectedInstanceId">,
    value: boolean,
  ) => void;
  hydrateFromProject: (next: ArmstrongProjectState) => void;
  getEffectiveMeasurements: (id: string) => ArmstrongEffectiveMeasurements | null;
  getSceneForInstance: (id: string) => PatternScene | null;
};

export const useArmstrongStore = create<ArmstrongStoreState>((set, get) => ({
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

        if (key === "bustCup") {
          return {
            ...instance,
            overrides: {
              ...instance.overrides,
              bustCup: String(value) as ArmstrongBaseMeasurements["bustCup"],
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

  hydrateFromProject: (next) => {
    set(() => {
      const instances = next.instances.length > 0 ? next.instances : [createInstance(0)];
      const selectedExists = instances.some((instance) => instance.id === next.ui.selectedInstanceId);

      const normalizedBase: ArmstrongBaseMeasurements = {
        ...defaultBase,
      };
      for (const key of numericKeys) {
        if (key === "bustCup") {
          const cup = next.base.bustCup;
          normalizedBase.bustCup = cup ?? defaultBase.bustCup;
          continue;
        }

        const nextValue = Number(next.base[key]);
        normalizedBase[key] = sanitizeNumber(nextValue, defaultBase[key] as number);
      }

      return {
        base: normalizedBase,
        instances,
        ui: {
          ...defaultUi,
          ...next.ui,
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
  state: ArmstrongStoreState,
): ArmstrongProjectState => ({
  base: state.base,
  instances: state.instances,
  ui: state.ui,
});
