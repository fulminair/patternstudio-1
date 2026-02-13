import type { HofenbitzerCasualProjectState } from "@/patterns/hofenbitzerCasualBodice/types";

export const encodeHofenbitzerCasualProjectState = (
  state: HofenbitzerCasualProjectState,
): string => {
  const payload: HofenbitzerCasualProjectState = {
    base: state.base,
    instances: state.instances.map((instance) => ({
      id: instance.id,
      name: instance.name,
      color: instance.color,
      visible: instance.visible,
      overrides: instance.overrides,
    })),
    ui: state.ui,
  };

  return encodeURIComponent(JSON.stringify(payload));
};
