"use client";

import { create } from "zustand";
import {
  buildScene,
  computeDerived,
  getDefaultBaseMeasurements,
} from "@/patterns/aldrichCloseFittingBodice/engine";
import type {
  BaseMeasurements,
  EffectiveMeasurements,
  PatternInstance,
  PatternScene,
  ProjectState,
  ProjectUiState,
} from "@/patterns/types";

const INSTANCE_COLORS = [
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

const createInstance = (
  index: number,
  overrides: PatternInstance["overrides"] = {},
): PatternInstance => ({
  id: createId(),
  name: `Draft ${index + 1}`,
  color: INSTANCE_COLORS[index % INSTANCE_COLORS.length],
  visible: true,
  overrides,
});

const defaultBase = getDefaultBaseMeasurements();
const initialInstance = createInstance(0);

const defaultUi: ProjectUiState = {
  selectedInstanceId: initialInstance.id,
  showGrid: true,
  showLabels: true,
  showMarkers: true,
  exportSelectedOnly: false,
};

const toEffectiveMeasurements = (
  base: BaseMeasurements,
  instance: PatternInstance,
): EffectiveMeasurements => {
  const merged = {
    ...base,
    ...instance.overrides,
  };

  return {
    ...merged,
    ...computeDerived(merged),
  };
};

const sanitizeNumber = (value: number, fallback: number): number =>
  Number.isFinite(value) ? value : fallback;

const normalizedToggleState = (closeWaistShaping: boolean, reducedDarting: boolean) => {
  if (reducedDarting) {
    return { closeWaistShaping: false, reducedDarting: true };
  }
  return { closeWaistShaping: true, reducedDarting: false };
};

export type PatternStudioStore = ProjectState & {
  setBaseMeasurement: (key: keyof BaseMeasurements, value: number | boolean) => void;
  setSelectedInstance: (id: string) => void;
  addDuplicate: () => void;
  removeInstance: (id: string) => void;
  toggleVisible: (id: string) => void;
  setOverride: (
    id: string,
    key: keyof BaseMeasurements,
    value: number | boolean | undefined,
  ) => void;
  resetOverrides: (id: string) => void;
  setUiToggle: (key: Exclude<keyof ProjectUiState, "selectedInstanceId">, value: boolean) => void;
  hydrateFromProject: (next: ProjectState) => void;
  getEffectiveMeasurements: (id: string) => EffectiveMeasurements | null;
  getSceneForInstance: (id: string) => PatternScene | null;
};

export const usePatternStore = create<PatternStudioStore>((set, get) => ({
  base: defaultBase,
  instances: [initialInstance],
  ui: defaultUi,

  setBaseMeasurement: (key, value) => {
    set((state) => {
      const current = state.base[key];
      if (typeof current === "boolean") {
        if (key === "closeWaistShaping" || key === "reducedDarting") {
          const toggles =
            key === "closeWaistShaping"
              ? normalizedToggleState(Boolean(value), !Boolean(value))
              : normalizedToggleState(!Boolean(value), Boolean(value));
          return {
            base: {
              ...state.base,
              ...toggles,
            },
          };
        }

        return {
          base: {
            ...state.base,
            [key]: Boolean(value),
          },
        };
      }

      return {
        base: {
          ...state.base,
          [key]: sanitizeNumber(Number(value), current),
        },
      };
    });
  },

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
      const selected = state.instances.find((instance) => instance.id === state.ui.selectedInstanceId);
      const nextInstance = createInstance(
        state.instances.length,
        selected ? { ...selected.overrides } : {},
      );

      return {
        instances: [...state.instances, nextInstance],
        ui: {
          ...state.ui,
          selectedInstanceId: nextInstance.id,
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
          return { ...instance, overrides: nextOverrides };
        }

        const baseValue = state.base[key];
        const normalizedValue =
          typeof baseValue === "boolean"
            ? Boolean(value)
            : sanitizeNumber(Number(value), Number(baseValue));

        if (key === "closeWaistShaping" || key === "reducedDarting") {
          const toggles =
            key === "closeWaistShaping"
              ? normalizedToggleState(Boolean(normalizedValue), !Boolean(normalizedValue))
              : normalizedToggleState(!Boolean(normalizedValue), Boolean(normalizedValue));

          return {
            ...instance,
            overrides: {
              ...instance.overrides,
              closeWaistShaping: toggles.closeWaistShaping,
              reducedDarting: toggles.reducedDarting,
            },
          };
        }

        return {
          ...instance,
          overrides: {
            ...instance.overrides,
            [key]: normalizedValue,
          },
        };
      }),
    }));
  },

  resetOverrides: (id) => {
    set((state) => ({
      instances: state.instances.map((instance) =>
        instance.id === id ? { ...instance, overrides: {} } : instance,
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
      const baseToggles = normalizedToggleState(
        Boolean(next.base.closeWaistShaping),
        Boolean(next.base.reducedDarting),
      );
      const instances = next.instances.length > 0 ? next.instances : [createInstance(0)];
      const normalizedInstances = instances.map((instance) => {
        const hasCloseOverride = typeof instance.overrides.closeWaistShaping === "boolean";
        const hasReducedOverride = typeof instance.overrides.reducedDarting === "boolean";

        if (!hasCloseOverride && !hasReducedOverride) {
          return instance;
        }

        const sourceClose = hasCloseOverride
          ? Boolean(instance.overrides.closeWaistShaping)
          : !Boolean(instance.overrides.reducedDarting);
        const sourceReduced = hasReducedOverride
          ? Boolean(instance.overrides.reducedDarting)
          : !Boolean(instance.overrides.closeWaistShaping);
        const normalized = normalizedToggleState(sourceClose, sourceReduced);

        return {
          ...instance,
          overrides: {
            ...instance.overrides,
            closeWaistShaping: normalized.closeWaistShaping,
            reducedDarting: normalized.reducedDarting,
          },
        };
      });
      const selectedExists = instances.some((instance) => instance.id === next.ui.selectedInstanceId);

      return {
        base: {
          ...defaultBase,
          ...next.base,
          ...baseToggles,
        },
        instances: normalizedInstances,
        ui: {
          ...defaultUi,
          ...next.ui,
          selectedInstanceId: selectedExists ? next.ui.selectedInstanceId : normalizedInstances[0].id,
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
    return toEffectiveMeasurements(state.base, instance);
  },

  getSceneForInstance: (id) => {
    const effective = get().getEffectiveMeasurements(id);
    if (!effective) {
      return null;
    }
    return buildScene(effective);
  },
}));

export const selectProjectState = (state: PatternStudioStore): ProjectState => ({
  base: state.base,
  instances: state.instances,
  ui: state.ui,
});

export const mergeEffectiveMeasurements = (
  base: BaseMeasurements,
  instance: PatternInstance,
): EffectiveMeasurements => toEffectiveMeasurements(base, instance);
