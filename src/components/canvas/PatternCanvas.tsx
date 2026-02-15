"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
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
  excludePathIds?: readonly string[];
};

type PatternCanvasProps = {
  scenes: CanvasInstanceScene[];
  selectedInstanceId: string | null;
  showGrid: boolean;
  showLabels: boolean;
  showMarkers: boolean;
  showCleanUp: boolean;
  lineStrokeWidth: number;
  editResetVersion?: number;
  onToggleGrid: (checked: boolean) => void;
  onToggleLabels: (checked: boolean) => void;
  onToggleMarkers: (checked: boolean) => void;
  onToggleCleanUp: (checked: boolean) => void;
  onLineStrokeWidthChange: (value: number) => void;
  cleanupConfig?: CanvasCleanupConfig;
  onSvgReady?: (svg: SVGSVGElement | null) => void;
};

type DraftOffset = {
  x: number;
  y: number;
};

type DragState = {
  instanceId: string;
  pointerId: number;
  startPointer: DraftOffset;
  startOffset: DraftOffset;
};

type SnapResult = {
  offset: DraftOffset;
  guideX: number | null;
  guideY: number | null;
};

const SNAP_THRESHOLD_CM = 1;

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

type EditablePathCommandType = "M" | "L" | "C" | "Z";

type EditablePathCommand = {
  type: EditablePathCommandType;
  values: number[];
};

type EditablePathHandle = {
  id: string;
  commandIndex: number;
  valueOffset: number;
  x: number;
  y: number;
  role: "anchor" | "control";
};

type EditablePathGuide = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

const EDITABLE_PATH_ARITY: Record<EditablePathCommandType, number> = {
  M: 2,
  L: 2,
  C: 6,
  Z: 0,
};

const EDITABLE_PATH_KEY_SEPARATOR = "::";

const makeEditablePathKey = (instanceId: string, pathId: string): string =>
  `${instanceId}${EDITABLE_PATH_KEY_SEPARATOR}${pathId}`;

const splitEditablePathKey = (pathKey: string): { instanceId: string; pathId: string } => {
  const separatorIndex = pathKey.indexOf(EDITABLE_PATH_KEY_SEPARATOR);
  if (separatorIndex < 0) {
    return { instanceId: pathKey, pathId: "" };
  }
  return {
    instanceId: pathKey.slice(0, separatorIndex),
    pathId: pathKey.slice(separatorIndex + EDITABLE_PATH_KEY_SEPARATOR.length),
  };
};

const parseEditablePathCommands = (d: string): EditablePathCommand[] | null => {
  const tokens = d.match(/[A-Za-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g);
  if (!tokens || tokens.length === 0) {
    return null;
  }

  const commands: EditablePathCommand[] = [];
  let index = 0;
  while (index < tokens.length) {
    const commandToken = tokens[index].toUpperCase() as EditablePathCommandType;
    if (!(commandToken in EDITABLE_PATH_ARITY)) {
      return null;
    }
    index += 1;

    const arity = EDITABLE_PATH_ARITY[commandToken];
    const values: number[] = [];
    for (let valueIndex = 0; valueIndex < arity; valueIndex += 1) {
      if (index >= tokens.length) {
        return null;
      }
      const parsed = Number(tokens[index]);
      if (!Number.isFinite(parsed)) {
        return null;
      }
      values.push(parsed);
      index += 1;
    }

    commands.push({
      type: commandToken,
      values,
    });
  }

  return commands.length > 0 ? commands : null;
};

const serializeEditablePathCommands = (commands: EditablePathCommand[]): string => {
  const formatNumber = (value: number): string => {
    const rounded = Math.round(value * 1000) / 1000;
    return String(rounded);
  };

  return commands
    .map((command) =>
      command.values.length === 0
        ? command.type
        : `${command.type} ${command.values.map(formatNumber).join(" ")}`,
    )
    .join(" ");
};

const extractEditablePathGeometry = (commands: EditablePathCommand[]): {
  handles: EditablePathHandle[];
  guides: EditablePathGuide[];
} => {
  const handles: EditablePathHandle[] = [];
  const guides: EditablePathGuide[] = [];
  let currentAnchor: { x: number; y: number } | null = null;

  for (let commandIndex = 0; commandIndex < commands.length; commandIndex += 1) {
    const command = commands[commandIndex];
    if (command.type === "M" || command.type === "L") {
      const x = command.values[0];
      const y = command.values[1];
      handles.push({
        id: `h-${commandIndex}-0`,
        commandIndex,
        valueOffset: 0,
        x,
        y,
        role: "anchor",
      });
      currentAnchor = { x, y };
      continue;
    }

    if (command.type === "C") {
      const c1x = command.values[0];
      const c1y = command.values[1];
      const c2x = command.values[2];
      const c2y = command.values[3];
      const endX = command.values[4];
      const endY = command.values[5];

      handles.push({
        id: `h-${commandIndex}-0`,
        commandIndex,
        valueOffset: 0,
        x: c1x,
        y: c1y,
        role: "control",
      });
      handles.push({
        id: `h-${commandIndex}-2`,
        commandIndex,
        valueOffset: 2,
        x: c2x,
        y: c2y,
        role: "control",
      });
      handles.push({
        id: `h-${commandIndex}-4`,
        commandIndex,
        valueOffset: 4,
        x: endX,
        y: endY,
        role: "anchor",
      });

      if (currentAnchor) {
        guides.push({
          id: `g-${commandIndex}-start`,
          x1: currentAnchor.x,
          y1: currentAnchor.y,
          x2: c1x,
          y2: c1y,
        });
      }
      guides.push({
        id: `g-${commandIndex}-end`,
        x1: endX,
        y1: endY,
        x2: c2x,
        y2: c2y,
      });
      currentAnchor = { x: endX, y: endY };
    }
  }

  return { handles, guides };
};

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
  lineStrokeWidth,
  editResetVersion = 0,
  onToggleGrid,
  onToggleLabels,
  onToggleMarkers,
  onToggleCleanUp,
  onLineStrokeWidthChange,
  cleanupConfig,
  onSvgReady,
}: PatternCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewportRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const zoomSelectionRef = useRef<ReturnType<typeof select<SVGSVGElement, unknown>> | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [transformText, setTransformText] = useState<ZoomTransform>(zoomIdentity);
  const [strokeWidthDraft, setStrokeWidthDraft] = useState(String(lineStrokeWidth));
  const [draftOffsets, setDraftOffsets] = useState<Record<string, DraftOffset>>({});
  const draftOffsetsRef = useRef<Record<string, DraftOffset>>({});
  const [snapGuides, setSnapGuides] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [pathEdits, setPathEdits] = useState<Record<string, string>>({});
  const [activePathKey, setActivePathKey] = useState<string | null>(null);
  const isEditModeRef = useRef(false);
  const previousPathLookupRef = useRef<Record<string, string>>({});
  const editDragRef = useRef<{
    pointerId: number;
    pathKey: string;
    commandIndex: number;
    valueOffset: number;
  } | null>(null);

  const targetScenes = useMemo(() => {
    const visible = scenes.filter((scene) => scene.visible);
    return visible.length > 0 ? visible : scenes;
  }, [scenes]);
  const visibleScenes = useMemo(() => scenes.filter((scene) => scene.visible), [scenes]);
  const draggableInstanceId = useMemo(() => {
    if (
      selectedInstanceId &&
      visibleScenes.some((scene) => scene.instanceId === selectedInstanceId)
    ) {
      return selectedInstanceId;
    }
    return visibleScenes[0]?.instanceId ?? null;
  }, [selectedInstanceId, visibleScenes]);

  const pathLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    for (const scene of scenes) {
      for (const path of scene.scene.paths) {
        lookup[makeEditablePathKey(scene.instanceId, path.id)] = path.d;
      }
    }
    return lookup;
  }, [scenes]);

  const activePathInstanceId = useMemo(() => {
    if (!activePathKey) {
      return null;
    }
    return splitEditablePathKey(activePathKey).instanceId;
  }, [activePathKey]);

  const activePathGeometry = useMemo(() => {
    if (!isEditMode || !activePathKey) {
      return null;
    }
    const activePathD = pathEdits[activePathKey] ?? pathLookup[activePathKey];
    if (!activePathD) {
      return null;
    }
    const commands = parseEditablePathCommands(activePathD);
    if (!commands) {
      return null;
    }
    return extractEditablePathGeometry(commands);
  }, [isEditMode, activePathKey, pathEdits, pathLookup]);

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
    setStrokeWidthDraft(String(lineStrokeWidth));
  }, [lineStrokeWidth]);

  useEffect(() => {
    draftOffsetsRef.current = draftOffsets;
  }, [draftOffsets]);

  useEffect(() => {
    isEditModeRef.current = isEditMode;
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      setActivePathKey(null);
      editDragRef.current = null;
      return;
    }
    if (showCleanUp) {
      onToggleCleanUp(false);
    }
  }, [isEditMode, onToggleCleanUp, showCleanUp]);

  useEffect(() => {
    setPathEdits((prev) => (Object.keys(prev).length > 0 ? {} : prev));
    setActivePathKey(null);
    editDragRef.current = null;
  }, [editResetVersion]);

  useEffect(() => {
    const previousPathLookup = previousPathLookupRef.current;

    setPathEdits((prevEdits) => {
      let changed = false;
      const nextEdits: Record<string, string> = {};

      for (const [pathKey, editedPathD] of Object.entries(prevEdits)) {
        const nextGeneratedPathD = pathLookup[pathKey];
        const previousGeneratedPathD = previousPathLookup[pathKey];

        if (!nextGeneratedPathD) {
          changed = true;
          continue;
        }

        if (
          typeof previousGeneratedPathD === "string" &&
          nextGeneratedPathD !== previousGeneratedPathD
        ) {
          changed = true;
          continue;
        }

        nextEdits[pathKey] = editedPathD;
      }

      return changed ? nextEdits : prevEdits;
    });

    if (!activePathKey) {
      previousPathLookupRef.current = pathLookup;
      return;
    }

    const nextActivePathD = pathLookup[activePathKey];
    const previousActivePathD = previousPathLookup[activePathKey];
    if (
      !nextActivePathD ||
      (typeof previousActivePathD === "string" && nextActivePathD !== previousActivePathD)
    ) {
      setActivePathKey(null);
      editDragRef.current = null;
    }

    previousPathLookupRef.current = pathLookup;
  }, [activePathKey, pathLookup]);

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
        if (isEditModeRef.current) {
          return false;
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

  const handleCleanUpToggle = (checked: boolean) => {
    onToggleCleanUp(checked);
    if (checked) {
      setIsEditMode(false);
      setActivePathKey(null);
      editDragRef.current = null;
      onToggleGrid(false);
      onToggleLabels(false);
      onToggleMarkers(false);
    }
  };

  const handleEditModeToggle = (checked: boolean) => {
    setIsEditMode(checked);
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

  const clampStrokeWidth = (value: number): number => {
    if (!Number.isFinite(value)) {
      return lineStrokeWidth;
    }
    return Math.min(6, Math.max(0.1, Math.round(value * 100) / 100));
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
  const cleanupExcludePathIdSet = useMemo(
    () => new Set(cleanupConfig?.excludePathIds ?? []),
    [cleanupConfig?.excludePathIds],
  );

  const sceneCenters = useMemo(() => {
    const centers: Record<string, DraftOffset> = {};
    for (const scene of scenes) {
      const { minX, minY, maxX, maxY } = scene.scene.bounds;
      centers[scene.instanceId] = {
        x: (minX + maxX) / 2,
        y: (minY + maxY) / 2,
      };
    }
    return centers;
  }, [scenes]);

  const getWorldPoint = (clientX: number, clientY: number): DraftOffset | null => {
    const svg = svgRef.current;
    const viewport = viewportRef.current;
    if (!svg || !viewport) {
      return null;
    }

    const ctm = viewport.getScreenCTM();
    if (!ctm) {
      return null;
    }

    const svgPoint = svg.createSVGPoint();
    svgPoint.x = clientX;
    svgPoint.y = clientY;
    const worldPoint = svgPoint.matrixTransform(ctm.inverse());
    return { x: worldPoint.x, y: worldPoint.y };
  };

  const applyAxisSnap = (
    offsetMap: Record<string, DraftOffset>,
    instanceId: string,
    candidate: DraftOffset,
  ): SnapResult => {
    const movingCenter = sceneCenters[instanceId];
    if (!movingCenter) {
      return {
        offset: candidate,
        guideX: null,
        guideY: null,
      };
    }

    const movedCenterX = movingCenter.x + candidate.x;
    const movedCenterY = movingCenter.y + candidate.y;
    let bestSnapDeltaX = Number.POSITIVE_INFINITY;
    let bestSnapDeltaY = Number.POSITIVE_INFINITY;
    let guideX: number | null = null;
    let guideY: number | null = null;

    for (const scene of scenes) {
      if (!scene.visible || scene.instanceId === instanceId) {
        continue;
      }

      const otherCenter = sceneCenters[scene.instanceId];
      if (!otherCenter) {
        continue;
      }

      const otherOffset = offsetMap[scene.instanceId] ?? { x: 0, y: 0 };
      const otherCenterX = otherCenter.x + otherOffset.x;
      const otherCenterY = otherCenter.y + otherOffset.y;
      const deltaX = movedCenterX - otherCenterX;
      const deltaY = movedCenterY - otherCenterY;

      if (Math.abs(deltaX) <= SNAP_THRESHOLD_CM && Math.abs(deltaX) < Math.abs(bestSnapDeltaX)) {
        bestSnapDeltaX = deltaX;
        guideX = otherCenterX;
      }
      if (Math.abs(deltaY) <= SNAP_THRESHOLD_CM && Math.abs(deltaY) < Math.abs(bestSnapDeltaY)) {
        bestSnapDeltaY = deltaY;
        guideY = otherCenterY;
      }
    }

    let x = candidate.x;
    let y = candidate.y;
    if (Number.isFinite(bestSnapDeltaX)) {
      x -= bestSnapDeltaX;
    }
    if (Number.isFinite(bestSnapDeltaY)) {
      y -= bestSnapDeltaY;
    }

    return {
      offset: {
        x: Math.round(x * 100) / 100,
        y: Math.round(y * 100) / 100,
      },
      guideX,
      guideY,
    };
  };

  const handleDraftPointerDown = (
    event: ReactPointerEvent<SVGGElement>,
    instanceId: string,
  ) => {
    if (isEditMode) {
      setActivePathKey(null);
      return;
    }

    if (draggableInstanceId !== instanceId || event.button !== 0) {
      return;
    }

    const startPointer = getWorldPoint(event.clientX, event.clientY);
    if (!startPointer) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSnapGuides({ x: null, y: null });

    dragStateRef.current = {
      instanceId,
      pointerId: event.pointerId,
      startPointer,
      startOffset: draftOffsets[instanceId] ?? { x: 0, y: 0 },
    };
  };

  const handleDraftPointerMove = (
    event: ReactPointerEvent<SVGGElement>,
    instanceId: string,
  ) => {
    const dragState = dragStateRef.current;
    if (
      !dragState ||
      dragState.instanceId !== instanceId ||
      dragState.pointerId !== event.pointerId
    ) {
      return;
    }

    const currentPointer = getWorldPoint(event.clientX, event.clientY);
    if (!currentPointer) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const candidate: DraftOffset = {
      x: dragState.startOffset.x + (currentPointer.x - dragState.startPointer.x),
      y: dragState.startOffset.y + (currentPointer.y - dragState.startPointer.y),
    };
    const snapped = applyAxisSnap(draftOffsetsRef.current, instanceId, candidate);
    setSnapGuides({ x: snapped.guideX, y: snapped.guideY });

    setDraftOffsets((prev) => {
      const existing = prev[instanceId] ?? { x: 0, y: 0 };
      if (
        Math.abs(existing.x - snapped.offset.x) < 0.001 &&
        Math.abs(existing.y - snapped.offset.y) < 0.001
      ) {
        return prev;
      }
      return {
        ...prev,
        [instanceId]: snapped.offset,
      };
    });
  };

  const handleDraftPointerUp = (
    event: ReactPointerEvent<SVGGElement>,
    instanceId: string,
  ) => {
    const dragState = dragStateRef.current;
    if (
      !dragState ||
      dragState.instanceId !== instanceId ||
      dragState.pointerId !== event.pointerId
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStateRef.current = null;
    setSnapGuides({ x: null, y: null });
  };

  const handlePathPointerDown = (
    event: ReactPointerEvent<SVGPathElement>,
    instanceId: string,
    pathId: string,
  ) => {
    if (!isEditMode || event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setActivePathKey(makeEditablePathKey(instanceId, pathId));
  };

  const handlePathHandlePointerDown = (
    event: ReactPointerEvent<SVGCircleElement>,
    pathKey: string,
    commandIndex: number,
    valueOffset: number,
  ) => {
    if (!isEditMode || event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setActivePathKey(pathKey);
    editDragRef.current = {
      pointerId: event.pointerId,
      pathKey,
      commandIndex,
      valueOffset,
    };
    if (svgRef.current) {
      svgRef.current.setPointerCapture(event.pointerId);
    }
  };

  const handleSvgPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!isEditMode) {
      return;
    }
    if (event.target === event.currentTarget) {
      setActivePathKey(null);
    }
  };

  const handleSvgPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const dragState = editDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const nextPoint = getWorldPoint(event.clientX, event.clientY);
    if (!nextPoint) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    setPathEdits((prev) => {
      const sourcePathD = prev[dragState.pathKey] ?? pathLookup[dragState.pathKey];
      if (!sourcePathD) {
        return prev;
      }

      const commands = parseEditablePathCommands(sourcePathD);
      if (!commands) {
        return prev;
      }

      const targetCommand = commands[dragState.commandIndex];
      if (!targetCommand || dragState.valueOffset + 1 >= targetCommand.values.length) {
        return prev;
      }

      const { instanceId } = splitEditablePathKey(dragState.pathKey);
      const instanceOffset = draftOffsetsRef.current[instanceId] ?? { x: 0, y: 0 };
      const localPoint = {
        x: nextPoint.x - instanceOffset.x,
        y: nextPoint.y - instanceOffset.y,
      };

      const nextX = Math.round(localPoint.x * 1000) / 1000;
      const nextY = Math.round(localPoint.y * 1000) / 1000;
      if (
        Math.abs(targetCommand.values[dragState.valueOffset] - nextX) < 0.0005 &&
        Math.abs(targetCommand.values[dragState.valueOffset + 1] - nextY) < 0.0005
      ) {
        return prev;
      }

      targetCommand.values[dragState.valueOffset] = nextX;
      targetCommand.values[dragState.valueOffset + 1] = nextY;
      const nextPathD = serializeEditablePathCommands(commands);

      return {
        ...prev,
        [dragState.pathKey]: nextPathD,
      };
    });
  };

  const handleSvgPointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const dragState = editDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId);
    }
    editDragRef.current = null;
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
      <svg
        ref={svgRef}
        viewBox={viewBoxFromBounds(paddedBounds)}
        preserveAspectRatio="xMinYMin meet"
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onPointerCancel={handleSvgPointerUp}
        className={`h-full w-full select-none touch-none ${
          isEditMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"
        }`}
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

          {snapGuides.x !== null || snapGuides.y !== null ? (
            <g
              data-snap-guide="true"
              stroke="rgba(15, 23, 42, 0.75)"
              strokeWidth={0.1}
              strokeDasharray="2.5 1.5"
              pointerEvents="none"
            >
              {snapGuides.x !== null ? (
                <line
                  x1={snapGuides.x}
                  y1={paddedBounds.minY - 20}
                  x2={snapGuides.x}
                  y2={paddedBounds.maxY + 20}
                />
              ) : null}
              {snapGuides.y !== null ? (
                <line
                  x1={paddedBounds.minX - 20}
                  y1={snapGuides.y}
                  x2={paddedBounds.maxX + 20}
                  y2={snapGuides.y}
                />
              ) : null}
            </g>
          ) : null}

          {scenes
            .filter((instance) => instance.visible)
            .map((instance) => {
              const isDraggable = draggableInstanceId === instance.instanceId;
              const instanceOffset = draftOffsets[instance.instanceId] ?? { x: 0, y: 0 };
              const cleanupTraceD = showCleanUp
                ? cleanupMode === "traceWithPathFilter"
                  ? buildCleanupTracePath(instance.scene.points)
                  : null
                : null;

              const visiblePaths = !showCleanUp
                ? instance.scene.paths.filter((path) => path.kind !== "cleanup")
                : cleanupMode === "traceWithPathFilter"
                  ? instance.scene.paths.filter((path) => cleanupPathIdSet.has(path.id))
                  : instance.scene.paths.filter(
                      (path) =>
                        path.kind !== "construction" && !cleanupExcludePathIdSet.has(path.id),
                    );

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
                  transform={
                    instanceOffset.x !== 0 || instanceOffset.y !== 0
                      ? `translate(${instanceOffset.x} ${instanceOffset.y})`
                      : undefined
                  }
                  style={{ color: instance.color }}
                  fill="none"
                  stroke={instance.color}
                  onPointerDown={(event) => handleDraftPointerDown(event, instance.instanceId)}
                  onPointerMove={(event) => handleDraftPointerMove(event, instance.instanceId)}
                  onPointerUp={(event) => handleDraftPointerUp(event, instance.instanceId)}
                  onPointerCancel={(event) => handleDraftPointerUp(event, instance.instanceId)}
                >
                  <rect
                    data-drag-hitbox="true"
                    x={instance.scene.bounds.minX}
                    y={instance.scene.bounds.minY}
                    width={Math.max(1, instance.scene.bounds.maxX - instance.scene.bounds.minX)}
                    height={Math.max(1, instance.scene.bounds.maxY - instance.scene.bounds.minY)}
                    fill="transparent"
                    stroke="none"
                    pointerEvents={isDraggable && !isEditMode ? "all" : "none"}
                    style={{ cursor: isDraggable && !isEditMode ? "grab" : "default" }}
                  />

                  {cleanupTraceD ? (
                    <path
                      d={cleanupTraceD}
                      stroke="currentColor"
                      strokeWidth={lineStrokeWidth}
                      vectorEffect="non-scaling-stroke"
                    />
                  ) : null}

                  {visiblePaths.map((path) => {
                    const pathKey = makeEditablePathKey(instance.instanceId, path.id);
                    const renderedPathD = pathEdits[pathKey] ?? path.d;
                    const isActivePath = isEditMode && activePathKey === pathKey;
                    const isEditablePath = isEditMode;
                    const renderedStroke = isEditMode
                      ? isActivePath
                        ? "#000000"
                        : "#111111"
                      : path.stroke;

                    return (
                      <path
                        key={`${instance.instanceId}-${path.id}`}
                        d={renderedPathD}
                        stroke={renderedStroke}
                        strokeWidth={isActivePath ? lineStrokeWidth + 0.16 : lineStrokeWidth}
                        strokeDasharray={path.dashed ? "16 9" : undefined}
                        vectorEffect="non-scaling-stroke"
                        onPointerDown={(event) =>
                          handlePathPointerDown(event, instance.instanceId, path.id)
                        }
                        style={isEditablePath ? { cursor: "pointer" } : undefined}
                      />
                    );
                  })}

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

                  {isEditMode &&
                  activePathKey &&
                  activePathGeometry &&
                  activePathInstanceId === instance.instanceId ? (
                    <g pointerEvents="none">
                      {activePathGeometry.guides.map((guide) => (
                        <line
                          key={`${instance.instanceId}-${guide.id}`}
                          x1={guide.x1}
                          y1={guide.y1}
                          x2={guide.x2}
                          y2={guide.y2}
                          stroke="#0f172a"
                          strokeOpacity={0.45}
                          strokeWidth={0.07}
                          strokeDasharray="1.2 1.2"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                    </g>
                  ) : null}

                  {isEditMode &&
                  activePathKey &&
                  activePathGeometry &&
                  activePathInstanceId === instance.instanceId ? (
                    <g>
                      {activePathGeometry.handles.map((handle) => (
                        <circle
                          key={`${instance.instanceId}-${handle.id}`}
                          cx={handle.x}
                          cy={handle.y}
                          r={handle.role === "anchor" ? 0.28 : 0.22}
                          fill="#000000"
                          stroke="#000000"
                          strokeWidth={0.08}
                          vectorEffect="non-scaling-stroke"
                          style={{ cursor: "grab" }}
                          onPointerDown={(event) =>
                            handlePathHandlePointerDown(
                              event,
                              activePathKey,
                              handle.commandIndex,
                              handle.valueOffset,
                            )
                          }
                        />
                      ))}
                    </g>
                  ) : null}
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
        <button
          type="button"
          onClick={() => handleEditModeToggle(!isEditMode)}
          className={`mb-1 w-full rounded-md border px-2 py-1 text-left text-xs font-medium ${
            isEditMode
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
          }`}
        >
          {isEditMode ? "Edit Mode: On" : "Edit Mode: Off"}
        </button>
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
            onChange={(event) => handleCleanUpToggle(event.target.checked)}
          />
          Clean up
        </label>

        <div className="mt-1 border-t border-slate-200 pt-2">
          <label className="mb-1 block text-[11px] font-medium text-slate-600">Line width</label>
          <input
            type="number"
            min={0.1}
            max={6}
            step={0.1}
            value={strokeWidthDraft}
            onChange={(event) => {
              const next = event.target.value;
              setStrokeWidthDraft(next);
              if (next.trim() === "") {
                return;
              }
              const parsed = Number(next);
              if (Number.isFinite(parsed)) {
                onLineStrokeWidthChange(clampStrokeWidth(parsed));
              }
            }}
            onBlur={() => {
              if (strokeWidthDraft.trim() === "") {
                setStrokeWidthDraft(String(lineStrokeWidth));
                return;
              }
              const parsed = Number(strokeWidthDraft);
              if (!Number.isFinite(parsed)) {
                setStrokeWidthDraft(String(lineStrokeWidth));
                return;
              }
              const clamped = clampStrokeWidth(parsed);
              setStrokeWidthDraft(String(clamped));
              onLineStrokeWidthChange(clamped);
            }}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 outline-none focus:border-slate-500"
          />
        </div>
      </div>
    </div>
  );
}
