"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { PatternCanvas, type CanvasInstanceScene } from "@/components/canvas/PatternCanvas";
import { HofenbitzerWideBasicSleeveDraftsPanel } from "@/components/panels/HofenbitzerWideBasicSleeveDraftsPanel";
import { HofenbitzerWideBasicSleeveMeasurementsPanel } from "@/components/panels/HofenbitzerWideBasicSleeveMeasurementsPanel";
import { buildScene } from "@/patterns/hofenbitzerWideBasicSleeve/engine";
import { exportSvg } from "@/lib/exportSvg";
import {
  mergeEffectiveMeasurements,
  selectProjectState,
  useHofenbitzerWideBasicSleeveStore,
} from "@/lib/hofenbitzerWideBasicSleeveStore";
import { decodeHofenbitzerWideBasicSleeveProjectState } from "@/lib/share/hofenbitzerWideBasicSleeveDecode";
import { encodeHofenbitzerWideBasicSleeveProjectState } from "@/lib/share/hofenbitzerWideBasicSleeveEncode";

export default function HofenbitzerWideBasicSleevePage() {
  const hasHydratedFromQuery = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const base = useHofenbitzerWideBasicSleeveStore((state) => state.base);
  const instances = useHofenbitzerWideBasicSleeveStore((state) => state.instances);
  const ui = useHofenbitzerWideBasicSleeveStore((state) => state.ui);
  const hydrateFromProject = useHofenbitzerWideBasicSleeveStore((state) => state.hydrateFromProject);
  const setUiToggle = useHofenbitzerWideBasicSleeveStore((state) => state.setUiToggle);
  const setLineStrokeWidth = useHofenbitzerWideBasicSleeveStore((state) => state.setLineStrokeWidth);

  const scenes = useMemo<CanvasInstanceScene[]>(() => {
    return instances.map((instance) => {
      const effective = mergeEffectiveMeasurements(base, instance);
      return {
        instanceId: instance.id,
        name: instance.name,
        color: instance.color,
        visible: instance.visible,
        scene: buildScene(effective),
      };
    });
  }, [base, instances]);

  useEffect(() => {
    if (hasHydratedFromQuery.current) {
      return;
    }

    hasHydratedFromQuery.current = true;
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("s");
    if (!encoded) {
      setUiToggle("showGrid", true);
      setUiToggle("showLabels", true);
      setUiToggle("showMarkers", true);
      setUiToggle("showCleanUp", false);
      return;
    }

    const decoded = decodeHofenbitzerWideBasicSleeveProjectState(encoded);
    if (decoded) {
      hydrateFromProject(decoded);
    }
  }, [hydrateFromProject, setUiToggle]);

  const handleExport = () => {
    if (!svgRef.current) {
      return;
    }

    exportSvg(svgRef.current, {
      filename: "patternstudio-hofenbitzer-wide-basic-sleeve.svg",
      selectedOnly: ui.exportSelectedOnly,
      selectedInstanceId: ui.selectedInstanceId,
    });
  };

  const handleShare = useCallback(async () => {
    const state = selectProjectState(useHofenbitzerWideBasicSleeveStore.getState());
    const encoded = encodeHofenbitzerWideBasicSleeveProjectState(state);
    const url = `${window.location.origin}${window.location.pathname}?s=${encoded}`;

    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.history.replaceState({}, "", `?s=${encoded}`);
      window.setTimeout(() => setShareCopied(false), 1400);
    } catch {
      setShareCopied(false);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <TopBar
        activePattern="hofenbitzerWideSleeve"
        onShare={handleShare}
        onExport={handleExport}
        isShareCopied={shareCopied}
        exportSelectedOnly={ui.exportSelectedOnly}
        onToggleExportSelectedOnly={(checked) => setUiToggle("exportSelectedOnly", checked)}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <aside className="left-sidebar w-full shrink-0 border-b border-slate-200 bg-slate-50 lg:w-[520px] lg:border-b-0 lg:border-r xl:w-[560px]">
          <div className="h-full overflow-y-auto p-4 lg:p-5">
            <div className="space-y-4">
              <HofenbitzerWideBasicSleeveMeasurementsPanel />
              <HofenbitzerWideBasicSleeveDraftsPanel />
            </div>
          </div>
        </aside>

        <main className="min-h-[60vh] flex-1 overflow-hidden p-4 lg:min-h-0">
          <PatternCanvas
            scenes={scenes}
            selectedInstanceId={ui.selectedInstanceId}
            showGrid={ui.showGrid}
            showLabels={ui.showLabels}
            showMarkers={ui.showMarkers}
            showCleanUp={ui.showCleanUp}
            lineStrokeWidth={ui.lineStrokeWidth}
            cleanupConfig={{ mode: "patternOnly" }}
            onToggleGrid={(checked) => setUiToggle("showGrid", checked)}
            onToggleLabels={(checked) => setUiToggle("showLabels", checked)}
            onToggleMarkers={(checked) => setUiToggle("showMarkers", checked)}
            onToggleCleanUp={(checked) => setUiToggle("showCleanUp", checked)}
            onLineStrokeWidthChange={(value) => setLineStrokeWidth(value)}
            onSvgReady={(element) => {
              svgRef.current = element;
            }}
          />
        </main>
      </div>
    </div>
  );
}
