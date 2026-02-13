import type { ArmstrongProjectState } from "@/patterns/armstrongBodice/types";

export const encodeArmstrongProjectState = (state: ArmstrongProjectState): string => {
  const payload: ArmstrongProjectState = {
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
