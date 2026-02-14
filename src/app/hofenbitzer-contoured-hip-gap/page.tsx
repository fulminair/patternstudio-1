"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { PatternCanvas, type CanvasInstanceScene } from "@/components/canvas/PatternCanvas";
import { HofenbitzerContouredHipGapDraftsPanel } from "@/components/panels/HofenbitzerContouredHipGapDraftsPanel";
import { HofenbitzerContouredHipGapMeasurementsPanel } from "@/components/panels/HofenbitzerContouredHipGapMeasurementsPanel";
import { buildScene } from "@/patterns/hofenbitzerContouredBodiceHipGap/engine";
import { exportSvg } from "@/lib/exportSvg";
import {
  mergeEffectiveMeasurements,
  selectProjectState,
  useHofenbitzerContouredHipGapStore,
} from "@/lib/hofenbitzerContouredHipGapStore";
import { decodeHofenbitzerContouredHipGapProjectState } from "@/lib/share/hofenbitzerContouredHipGapDecode";
import { encodeHofenbitzerContouredHipGapProjectState } from "@/lib/share/hofenbitzerContouredHipGapEncode";

export default function HofenbitzerContouredHipGapPage() {
  const hasHydratedFromQuery = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const base = useHofenbitzerContouredHipGapStore((state) => state.base);
  const instances = useHofenbitzerContouredHipGapStore((state) => state.instances);
  const ui = useHofenbitzerContouredHipGapStore((state) => state.ui);
  const hydrateFromProject = useHofenbitzerContouredHipGapStore((state) => state.hydrateFromProject);
  const setUiToggle = useHofenbitzerContouredHipGapStore((state) => state.setUiToggle);
  const setLineStrokeWidth = useHofenbitzerContouredHipGapStore((state) => state.setLineStrokeWidth);

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

    const decoded = decodeHofenbitzerContouredHipGapProjectState(encoded);
    if (decoded) {
      hydrateFromProject(decoded);
    }
  }, [hydrateFromProject, setUiToggle]);

  const handleExport = () => {
    if (!svgRef.current) {
      return;
    }

    exportSvg(svgRef.current, {
      filename: "patternstudio-hofenbitzer-contoured-bodice-hip-gap.svg",
      selectedOnly: ui.exportSelectedOnly,
      selectedInstanceId: ui.selectedInstanceId,
    });
  };

  const handleShare = useCallback(async () => {
    const state = selectProjectState(useHofenbitzerContouredHipGapStore.getState());
    const encoded = encodeHofenbitzerContouredHipGapProjectState(state);
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
        activePattern="hofenbitzerContouredHipGap"
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
              <HofenbitzerContouredHipGapMeasurementsPanel />
              <HofenbitzerContouredHipGapDraftsPanel />
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
            cleanupConfig={{
              mode: "patternOnly",
              excludePathIds: ["front-shoulder-line"],
            }}
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
