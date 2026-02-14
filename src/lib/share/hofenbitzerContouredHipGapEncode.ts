import type { HofenbitzerContouredHipGapProjectState } from "@/patterns/hofenbitzerContouredBodiceHipGap/types";

export const encodeHofenbitzerContouredHipGapProjectState = (
  state: HofenbitzerContouredHipGapProjectState,
): string => {
  const payload: HofenbitzerContouredHipGapProjectState = {
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
