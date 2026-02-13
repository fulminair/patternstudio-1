import type { HofenbitzerWideBasicSleeveProjectState } from "@/patterns/hofenbitzerWideBasicSleeve/types";

export const encodeHofenbitzerWideBasicSleeveProjectState = (
  state: HofenbitzerWideBasicSleeveProjectState,
): string => {
  const payload: HofenbitzerWideBasicSleeveProjectState = {
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
