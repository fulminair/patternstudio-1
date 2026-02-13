"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { PatternCanvas, type CanvasInstanceScene } from "@/components/canvas/PatternCanvas";
import { InstancesPanel } from "@/components/panels/InstancesPanel";
import { MeasurementsPanel } from "@/components/panels/MeasurementsPanel";
import { buildScene } from "@/patterns/aldrichCloseFittingBodice/engine";
import { exportSvg } from "@/lib/exportSvg";
import { mergeEffectiveMeasurements, selectProjectState, usePatternStore } from "@/lib/store";
import { decodeProjectState } from "@/lib/share/decode";
import { encodeProjectState } from "@/lib/share/encode";

export default function HomePage() {
  const hasHydratedFromQuery = useRef(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  const base = usePatternStore((state) => state.base);
  const instances = usePatternStore((state) => state.instances);
  const ui = usePatternStore((state) => state.ui);
  const hydrateFromProject = usePatternStore((state) => state.hydrateFromProject);
  const setUiToggle = usePatternStore((state) => state.setUiToggle);

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
      return;
    }

    const decoded = decodeProjectState(encoded);
    if (decoded) {
      hydrateFromProject(decoded);
    }
  }, [hydrateFromProject]);

  const handleExport = () => {
    if (!svgRef.current) {
      return;
    }

    exportSvg(svgRef.current, {
      selectedOnly: ui.exportSelectedOnly,
      selectedInstanceId: ui.selectedInstanceId,
    });
  };

  const handleShare = useCallback(async () => {
    const state = selectProjectState(usePatternStore.getState());
    const encoded = encodeProjectState(state);
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
        onShare={handleShare}
        onExport={handleExport}
        isShareCopied={shareCopied}
        exportSelectedOnly={ui.exportSelectedOnly}
        onToggleExportSelectedOnly={(checked) => setUiToggle("exportSelectedOnly", checked)}
      />

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="w-full shrink-0 border-b border-slate-200 bg-slate-50 lg:w-[520px] lg:border-b-0 lg:border-r xl:w-[560px]">
          <div className="p-4 lg:p-5">
            <div className="space-y-4">
              <MeasurementsPanel />
              <InstancesPanel />
            </div>
          </div>
        </aside>

        <main className="min-h-[60vh] flex-1 p-4">
          <PatternCanvas
            scenes={scenes}
            showGrid={ui.showGrid}
            showLabels={ui.showLabels}
            showMarkers={ui.showMarkers}
            onToggleGrid={(checked) => setUiToggle("showGrid", checked)}
            onToggleLabels={(checked) => setUiToggle("showLabels", checked)}
            onToggleMarkers={(checked) => setUiToggle("showMarkers", checked)}
            onSvgReady={(element) => {
              svgRef.current = element;
            }}
          />
        </main>
      </div>
    </div>
  );
}
