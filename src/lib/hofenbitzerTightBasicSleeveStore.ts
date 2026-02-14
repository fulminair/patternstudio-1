"use client";

import { create } from "zustand";
import {
  buildScene,
  computeDerived,
  getDefaultBaseMeasurements,
} from "@/patterns/hofenbitzerTightBasicSleeve/engine";
import type {
  HofenbitzerTightBasicSleeveBaseMeasurements,
  HofenbitzerTightBasicSleeveEffectiveMeasurements,
  HofenbitzerTightBasicSleevePatternInstance,
  HofenbitzerTightBasicSleeveProjectState,
  HofenbitzerTightBasicSleeveProjectUiState,
} from "@/patterns/hofenbitzerTightBasicSleeve/types";
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
  overrides: HofenbitzerTightBasicSleevePatternInstance["overrides"] = {},
): HofenbitzerTightBasicSleevePatternInstance => ({
  id: createId(),
  name: `Draft ${index + 1}`,
  color: DRAFT_COLORS[index % DRAFT_COLORS.length],
  visible: true,
  overrides,
});

const initialInstance = createInstance(0);

const defaultUi: HofenbitzerTightBasicSleeveProjectUiState = {
  selectedInstanceId: initialInstance.id,
  showGrid: true,
  showLabels: true,
  showMarkers: true,
  showCleanUp: false,
  exportSelectedOnly: false,
  lineStrokeWidth: 1,
};

const measurementKeys: Array<keyof HofenbitzerTightBasicSleeveBaseMeasurements> = [
  "AhH",
  "AhHEase",
  "fAh",
  "bAh",
  "AhC",
  "AhCEase",
  "fAhEase",
  "bAhEase",
  "AL",
  "ALEase",
  "upAC",
  "upACEase",
  "WrC",
  "WrCEase",
  "CapEasePct",
  "CapEasePctEase",
  "CapCEase",
  "CapLineEase",
  "fAP",
  "bAP",
];

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
  base: HofenbitzerTightBasicSleeveBaseMeasurements,
  instance: HofenbitzerTightBasicSleevePatternInstance,
): HofenbitzerTightBasicSleeveEffectiveMeasurements => {
  const merged: HofenbitzerTightBasicSleeveBaseMeasurements = {
    ...base,
    ...instance.overrides,
  };

  return {
    ...merged,
    ...computeDerived(merged),
  };
};

export type HofenbitzerTightBasicSleeveStoreState = HofenbitzerTightBasicSleeveProjectState & {
  setSelectedInstance: (id: string) => void;
  addDuplicate: () => void;
  removeInstance: (id: string) => void;
  toggleVisible: (id: string) => void;
  setInstanceColor: (id: string, color: string) => void;
  setOverride: (
    id: string,
    key: keyof HofenbitzerTightBasicSleeveBaseMeasurements,
    value: number | null | undefined,
  ) => void;
  resetOverrides: (id: string) => void;
  setUiToggle: (key: UiBooleanKey, value: boolean) => void;
  setLineStrokeWidth: (value: number) => void;
  hydrateFromProject: (next: HofenbitzerTightBasicSleeveProjectState) => void;
  getEffectiveMeasurements: (
    id: string,
  ) => HofenbitzerTightBasicSleeveEffectiveMeasurements | null;
  getSceneForInstance: (id: string) => PatternScene | null;
};

export const useHofenbitzerTightBasicSleeveStore = create<HofenbitzerTightBasicSleeveStoreState>(
  (set, get) => ({
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

          if (key === "AhC" && value === null) {
            return {
              ...instance,
              overrides: {
                ...instance.overrides,
                AhC: null,
              },
            };
          }

          const fallbackRaw = state.base[key];
          const fallback =
            typeof fallbackRaw === "number" && Number.isFinite(fallbackRaw) ? fallbackRaw : 0;
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
        const selectedExists = instances.some(
          (instance) => instance.id === next.ui.selectedInstanceId,
        );

        const normalizedBase: HofenbitzerTightBasicSleeveBaseMeasurements = {
          ...defaultBase,
        };

        for (const key of measurementKeys) {
          const incoming = next.base[key];
          if (key === "AhC") {
            normalizedBase.AhC =
              incoming === null
                ? null
                : sanitizeNumber(
                    Number(incoming),
                    defaultBase.AhC === null ? 0 : Number(defaultBase.AhC),
                  );
            continue;
          }

          normalizedBase[key] = sanitizeNumber(Number(incoming), Number(defaultBase[key] ?? 0));
        }

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
  }),
);

export const selectProjectState = (
  state: HofenbitzerTightBasicSleeveStoreState,
): HofenbitzerTightBasicSleeveProjectState => ({
  base: state.base,
  instances: state.instances,
  ui: state.ui,
});
