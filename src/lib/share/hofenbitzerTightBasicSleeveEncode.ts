import type { HofenbitzerTightBasicSleeveProjectState } from "@/patterns/hofenbitzerTightBasicSleeve/types";

export const encodeHofenbitzerTightBasicSleeveProjectState = (
  state: HofenbitzerTightBasicSleeveProjectState,
): string => {
  const payload: HofenbitzerTightBasicSleeveProjectState = {
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
