import type { HofenbitzerCasualShapingProjectState } from "@/patterns/hofenbitzerCasualShapingBodice/types";

export const encodeHofenbitzerCasualShapingProjectState = (
  state: HofenbitzerCasualShapingProjectState,
): string => {
  const payload: HofenbitzerCasualShapingProjectState = {
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
