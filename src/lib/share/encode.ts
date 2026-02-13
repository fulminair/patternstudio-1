import type { ProjectState } from "@/patterns/types";

export const encodeProjectState = (state: ProjectState): string => {
  const payload: ProjectState = {
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
