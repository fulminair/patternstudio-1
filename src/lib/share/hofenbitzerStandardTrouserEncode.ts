import type { HofenbitzerStandardTrouserProjectState } from "@/patterns/hofenbitzerStandardTrouser/types";

export const encodeHofenbitzerStandardTrouserProjectState = (
  state: HofenbitzerStandardTrouserProjectState,
): string => {
  const payload: HofenbitzerStandardTrouserProjectState = {
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
