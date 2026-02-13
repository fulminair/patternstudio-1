import type { HofenbitzerProjectState } from "@/patterns/hofenbitzerBasicSkirt/types";

export const encodeHofenbitzerProjectState = (
  state: HofenbitzerProjectState,
): string => {
  const payload: HofenbitzerProjectState = {
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
