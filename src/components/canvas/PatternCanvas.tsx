"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import type { PatternBounds, PatternScene } from "@/patterns/types";

export type CanvasInstanceScene = {
  instanceId: string;
  name: string;
  color: string;
  visible: boolean;
  scene: PatternScene;
};

export type CanvasCleanupConfig = {
  mode: "traceWithPathFilter" | "patternOnly";
  tracePointOrder?: readonly string[];
  keepPathIds?: readonly string[];
};

type PatternCanvasProps = {
  scenes: CanvasInstanceScene[];
  selectedInstanceId: string | null;
  showGrid: boolean;
  showLabels: boolean;
  showMarkers: boolean;
  showCleanUp: boolean;
  onToggleGrid: (checked: boolean) => void;
  onToggleLabels: (checked: boolean) => void;
  onToggleMarkers: (checked: boolean) => void;
  onToggleCleanUp: (checked: boolean) => void;
  cleanupConfig?: CanvasCleanupConfig;
  onSvgReady?: (svg: SVGSVGElement | null) => void;
};

const combineBounds = (boundsList: PatternBounds[]): PatternBounds => {
  if (boundsList.length === 0) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100 };
  }

  let minX = boundsList[0].minX;
  let minY = boundsList[0].minY;
  let maxX = boundsList[0].maxX;
  let maxY = boundsList[0].maxY;

  for (const bounds of boundsList) {
    minX = Math.min(minX, bounds.minX);
    minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX);
    maxY = Math.max(maxY, bounds.maxY);
  }

  return { minX, minY, maxX, maxY };
};

const padBounds = (bounds: PatternBounds, padding: number): PatternBounds => ({
  minX: bounds.minX - padding,
  minY: bounds.minY - padding,
  maxX: bounds.maxX + padding,
  maxY: bounds.maxY + padding,
});

const viewBoxFromBounds = (bounds: PatternBounds): string =>
  `${bounds.minX} ${bounds.minY} ${Math.max(1, bounds.maxX - bounds.minX)} ${Math.max(1, bounds.maxY - bounds.minY)}`;

const boundsKey = (bounds: PatternBounds): string =>
  `${bounds.minX}:${bounds.minY}:${bounds.maxX}:${bounds.maxY}`;

const DEFAULT_TRACE_CLEANUP_POINT_ORDER = [
  "1",
  "5",
  "d",
  "f",
  "e",
  "c",
  "21",
  "20",
  "26",
  "27",
  "30",
  "31",
  "b",
  "32",
  "a",
  "16",
  "11",
  "13",
  "9",
  "1",
] as const;

const DEFAULT_TRACE_CLEANUP_PATH_IDS = [
  "back-neck-curve",
  "front-neck-curve",
  "back-armhole-curve",
  "front-armhole-curve",
  "front-neck-dart-left-20-26",
  "front-neck-dart-right-27-26",
  "back-shoulder-dart",
  "back-shoulder-right-connect",
  "back-shoulder-line-9-11",
  "front-shoulder-line-27-30",
  "front-waist-dart-left",
  "front-waist-dart-right",
  "back-waist-dart-left",
  "back-waist-dart-right",
  "back-side-waist-dart",
  "front-side-waist-dart",
  "waist-seam-5-to-back-dart-left",
  "waist-seam-5-to-back-dart-right",
  "waist-seam-5-to-side-left",
  "waist-seam-back-dart-right-to-side-left",
  "waist-seam-back-dart-right-to-side-right",
  "waist-seam-side-right-to-front-dart-left",
  "waist-seam-side-left-to-front-dart-left",
  "waist-seam-front-dart-right-to-c",
  "waist-seam-front-dart-left-to-c",
  "waist-seam-side-right-to-c",
  "waist-seam-side-left-to-c",
];

const DEFAULT_TRACE_PATH_SEGMENTS = [
  ["1", "5"],
  ["c", "21"],
  ["20", "26", "27", "30"],
] as const;

const buildCleanupTracePath = (points: PatternScene["points"]): string | null => {
  // In cleanup mode we trace the requested key points and rely on dedicated curve paths for neck/armhole arcs.
  for (const segment of DEFAULT_TRACE_PATH_SEGMENTS) {
    if (segment.length < 2) {
      continue;
    }
    for (const key of segment) {
      if (!points[key]) {
        return null;
      }
    }
  }

  const toCommand = (keys: readonly string[]): string => {
    const [first, ...rest] = keys;
    const start = points[first];
    if (!start) {
      return "";
    }
    const commands = [`M ${start.x} ${start.y}`];
    for (const key of rest) {
      const p = points[key];
      if (!p) {
        return "";
      }
      commands.push(`L ${p.x} ${p.y}`);
    }
    return commands.join(" ");
  };

  return DEFAULT_TRACE_PATH_SEGMENTS.map((segment) => toCommand(segment)).join(" ");
};

export function PatternCanvas({
  scenes,
  selectedInstanceId,
  showGrid,
  showLabels,
  showMarkers,
  showCleanUp,
  onToggleGrid,
  onToggleLabels,
  onToggleMarkers,
  onToggleCleanUp,
  cleanupConfig,
  onSvgReady,
}: PatternCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewportRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const zoomSelectionRef = useRef<ReturnType<typeof select<SVGSVGElement, unknown>> | null>(null);
  const [transformText, setTransformText] = useState<ZoomTransform>(zoomIdentity);

  const targetScenes = useMemo(() => {
    const visible = scenes.filter((scene) => scene.visible);
    return visible.length > 0 ? visible : scenes;
  }, [scenes]);

  const labelTargetId = useMemo(() => {
    if (
      selectedInstanceId &&
      scenes.some((scene) => scene.visible && scene.instanceId === selectedInstanceId)
    ) {
      return selectedInstanceId;
    }

    return scenes.find((scene) => scene.visible)?.instanceId ?? null;
  }, [scenes, selectedInstanceId]);

  const paddedBounds = useMemo(() => {
    const combined = combineBounds(targetScenes.map((scene) => scene.scene.bounds));
    return padBounds(combined, 6);
  }, [targetScenes]);
  const paddedBoundsSignature = useMemo(() => boundsKey(paddedBounds), [paddedBounds]);

  const gridLines = useMemo(() => {
    const lines: Array<{ id: string; x1: number; y1: number; x2: number; y2: number }> = [];

    const minX = Math.floor(paddedBounds.minX);
    const maxX = Math.ceil(paddedBounds.maxX);
    const minY = Math.floor(paddedBounds.minY);
    const maxY = Math.ceil(paddedBounds.maxY);

    for (let x = minX; x <= maxX; x += 1) {
      lines.push({ id: `gx-${x}`, x1: x, y1: minY, x2: x, y2: maxY });
    }

    for (let y = minY; y <= maxY; y += 1) {
      lines.push({ id: `gy-${y}`, x1: minX, y1: y, x2: maxX, y2: y });
    }

    return lines;
  }, [paddedBounds]);

  useEffect(() => {
    onSvgReady?.(svgRef.current);
    return () => onSvgReady?.(null);
  }, [onSvgReady]);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement || !viewportRef.current) {
      return;
    }

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 24])
      .filter((event) => {
        if (event.type === "wheel") {
          return true;
        }
        if (event.type === "mousedown") {
          return event.button === 0;
        }
        return true;
      })
      .on("zoom", (event) => {
        setTransformText(event.transform);
        select(viewportRef.current).attr("transform", event.transform.toString());
      });

    const selection = select(svgElement);
    selection.call(zoomBehavior);
    selection.on("dblclick.zoom", null);

    zoomRef.current = zoomBehavior;
    zoomSelectionRef.current = selection;

    return () => {
      selection.on(".zoom", null);
    };
  }, []);

  useEffect(() => {
    if (!zoomRef.current || !zoomSelectionRef.current) {
      return;
    }

    zoomSelectionRef.current.call(zoomRef.current.transform, zoomIdentity);
  }, [paddedBoundsSignature]);

  const zoomIn = () => {
    if (!zoomRef.current || !zoomSelectionRef.current) {
      return;
    }
    zoomSelectionRef.current.call(zoomRef.current.scaleBy, 1.2);
  };

  const zoomOut = () => {
    if (!zoomRef.current || !zoomSelectionRef.current) {
      return;
    }
    zoomSelectionRef.current.call(zoomRef.current.scaleBy, 0.82);
  };

  const resetZoom = () => {
    if (!zoomRef.current || !zoomSelectionRef.current) {
      return;
    }
    zoomSelectionRef.current.call(zoomRef.current.transform, zoomIdentity);
  };

  const markerTextSize = (text: string): number => {
    if (text.length <= 1) {
      return 0.32;
    }
    if (text.length === 2) {
      return 0.3;
    }
    return 0.26;
  };

  const cleanupMode = cleanupConfig?.mode ?? "traceWithPathFilter";
  const cleanupPointOrder = cleanupConfig?.tracePointOrder ?? DEFAULT_TRACE_CLEANUP_POINT_ORDER;
  const cleanupPointSet = useMemo(
    () => new Set(cleanupPointOrder),
    [cleanupPointOrder],
  );
  const cleanupPathIdSet = useMemo(
    () => new Set(cleanupConfig?.keepPathIds ?? DEFAULT_TRACE_CLEANUP_PATH_IDS),
    [cleanupConfig?.keepPathIds],
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
      <svg
        ref={svgRef}
        viewBox={viewBoxFromBounds(paddedBounds)}
        preserveAspectRatio="xMinYMin meet"
        className="h-full w-full cursor-grab select-none touch-none active:cursor-grabbing"
      >
        <g ref={viewportRef}>
          {showGrid ? (
            <g stroke="rgba(100, 116, 139, 0.25)" strokeWidth={0.05}>
              {gridLines.map((line) => (
                <line
                  key={line.id}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                />
              ))}
            </g>
          ) : null}

          {scenes
            .filter((instance) => instance.visible)
            .map((instance) => {
              const cleanupTraceD = showCleanUp
                ? cleanupMode === "traceWithPathFilter"
                  ? buildCleanupTracePath(instance.scene.points)
                  : null
                : null;

              const visiblePaths = !showCleanUp
                ? instance.scene.paths
                : cleanupMode === "traceWithPathFilter"
                  ? instance.scene.paths.filter((path) => cleanupPathIdSet.has(path.id))
                  : instance.scene.paths.filter((path) => path.kind !== "construction");

              const visibleMarkers = !showCleanUp
                ? instance.scene.markers
                : cleanupMode === "traceWithPathFilter"
                  ? instance.scene.markers.filter((marker) =>
                      cleanupPointSet.has(marker.id.replace(/^marker-/, "")),
                    )
                  : instance.scene.markers;

              return (
                <g
                  key={instance.instanceId}
                  data-instance-id={instance.instanceId}
                  data-instance-name={instance.name}
                  style={{ color: instance.color }}
                  fill="none"
                  stroke={instance.color}
                >
                  {cleanupTraceD ? (
                    <path
                      d={cleanupTraceD}
                      stroke="currentColor"
                      strokeWidth={0.62}
                      vectorEffect="non-scaling-stroke"
                    />
                  ) : null}

                  {visiblePaths.map((path) => (
                    <path
                      key={`${instance.instanceId}-${path.id}`}
                      d={path.d}
                      stroke={path.stroke}
                      strokeWidth={Math.max(path.strokeWidth * 1.75, 0.58)}
                      strokeDasharray={showCleanUp ? undefined : path.dashed ? "0.9 0.6" : undefined}
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}

                  {showMarkers
                    ? visibleMarkers.map((marker) => {
                        const markerText = marker.text ?? marker.id.replace(/^marker-/, "");
                        return (
                          <g key={`${instance.instanceId}-${marker.id}`}>
                            <circle
                              cx={marker.x}
                              cy={marker.y}
                              r={marker.r}
                              fill={marker.color}
                              stroke="white"
                              strokeWidth={0.02}
                              vectorEffect="non-scaling-stroke"
                            />
                            <text
                              x={marker.x}
                              y={marker.y}
                              dy="0.02em"
                              fill="white"
                              stroke="none"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              alignmentBaseline="middle"
                              pointerEvents="none"
                              fontSize={markerTextSize(markerText)}
                              fontWeight={400}
                              fontFamily="Arial, Helvetica, sans-serif"
                            >
                              {markerText}
                            </text>
                          </g>
                        );
                      })
                    : null}

                  {showLabels && labelTargetId === instance.instanceId
                    ? instance.scene.labels.map((label) => (
                        <text
                          key={`${instance.instanceId}-${label.id}`}
                          x={label.x}
                          y={label.y}
                          fill={label.color ?? "currentColor"}
                          stroke="none"
                          fontSize={0.5}
                          fontWeight={400}
                          opacity={1}
                          fontFamily="Arial, Helvetica, sans-serif"
                          letterSpacing="0"
                          transform={
                            label.rotation
                              ? `rotate(${label.rotation} ${label.x} ${label.y})`
                              : undefined
                          }
                        >
                          {label.text}
                        </text>
                      ))
                    : null}
                </g>
              );
            })}
        </g>
      </svg>

      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
        <div className="pointer-events-auto rounded-md border border-slate-300 bg-white/90 p-1 shadow-sm backdrop-blur-sm">
          <button
            type="button"
            onClick={zoomIn}
            className="rounded px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
            title="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={zoomOut}
            className="rounded px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100"
            title="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="rounded px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
            title="Reset view"
          >
            Reset
          </button>
        </div>
        <p className="rounded-md bg-white/80 px-2 py-1 text-[11px] text-slate-600 shadow-sm backdrop-blur-sm">
          Zoom: {(transformText.k * 100).toFixed(0)}%
        </p>
      </div>

      <div className="absolute right-3 top-3 space-y-1 rounded-md border border-slate-300 bg-white/90 p-2 text-xs text-slate-700 shadow-sm backdrop-blur-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-slate-900"
            checked={showGrid}
            onChange={(event) => onToggleGrid(event.target.checked)}
          />
          Grid
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-slate-900"
            checked={showLabels}
            onChange={(event) => onToggleLabels(event.target.checked)}
          />
          Labels
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-slate-900"
            checked={showMarkers}
            onChange={(event) => onToggleMarkers(event.target.checked)}
          />
          Markers
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-slate-900"
            checked={showCleanUp}
            onChange={(event) => onToggleCleanUp(event.target.checked)}
          />
          Clean up
        </label>
      </div>
    </div>
  );
}
