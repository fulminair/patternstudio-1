import type {
  PatternBounds,
  PatternPath,
  PatternPoint,
  PatternScene,
} from "@/patterns/types";
import type {
  HipProfile,
  HofenbitzerBaseMeasurements,
  HofenbitzerDerivedValues,
  HofenbitzerEffectiveMeasurements,
} from "./types";

type ArtPoint = {
  x: number;
  y: number;
};

const DEFAULT_BASE_MEASUREMENTS: HofenbitzerBaseMeasurements = {
  hiC: 97,
  waC: 72,
  hiD: 21,
  moL: 50,
  hipEase: 3,
  waistEase: 2,
  frontDartLength: 10,
  backDartLength1: 14.5,
  backDartLength2: 13,
  dartsAuto: true,
  sideDart: 0,
  frontDart: 0,
  backDart1: 0,
  backDart2: 0,
  hipProfile: "Normal",
};

const MIN_SECOND_BACK_DART_CM = 0.05;

const round2 = (value: number): number => Math.round(value * 100) / 100;
const fmt = (value: number): string => String(Math.round(value * 1000) / 1000);

const p = (x: number, y: number): ArtPoint => ({ x: round2(x), y: round2(y) });

const outPoint = (point: ArtPoint): PatternPoint => ({
  x: round2(point.x),
  y: round2(-point.y),
});

const outLinePath = (...points: ArtPoint[]): string => {
  if (points.length < 2) {
    return "";
  }

  const [first, ...rest] = points;
  const s = outPoint(first);
  const segments = [`M ${fmt(s.x)} ${fmt(s.y)}`];

  for (const point of rest) {
    const o = outPoint(point);
    segments.push(`L ${fmt(o.x)} ${fmt(o.y)}`);
  }

  return segments.join(" ");
};

const outCubicPath = (
  start: ArtPoint,
  c1: ArtPoint,
  c2: ArtPoint,
  end: ArtPoint,
): string => {
  const s = outPoint(start);
  const cp1 = outPoint(c1);
  const cp2 = outPoint(c2);
  const e = outPoint(end);

  return `M ${fmt(s.x)} ${fmt(s.y)} C ${fmt(cp1.x)} ${fmt(cp1.y)} ${fmt(cp2.x)} ${fmt(cp2.y)} ${fmt(e.x)} ${fmt(e.y)}`;
};

const horizontalIntersection = (
  a: ArtPoint,
  b: ArtPoint,
  targetY: number,
): ArtPoint => {
  const dy = b.y - a.y;
  if (Math.abs(dy) < 0.0001) {
    return p(a.x, targetY);
  }

  const t = (targetY - a.y) / dy;
  return p(a.x + (b.x - a.x) * t, targetY);
};

const lerpPoint = (a: ArtPoint, b: ArtPoint, t: number): ArtPoint =>
  p(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);

const getBounds = (tracked: ArtPoint[]): PatternBounds => {
  if (tracked.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = outPoint(tracked[0]).x;
  let minY = outPoint(tracked[0]).y;
  let maxX = outPoint(tracked[0]).x;
  let maxY = outPoint(tracked[0]).y;

  for (const point of tracked) {
    const out = outPoint(point);
    minX = Math.min(minX, out.x);
    minY = Math.min(minY, out.y);
    maxX = Math.max(maxX, out.x);
    maxY = Math.max(maxY, out.y);
  }

  return {
    minX: round2(minX),
    minY: round2(minY),
    maxX: round2(maxX),
    maxY: round2(maxY),
  };
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const determineWaistShaping = (profile: HipProfile): number =>
  profile === "Curvy" ? 1.5 : 1;

const determineSideDartBase = (profile: HipProfile, waistDiff: number): number => {
  if (profile === "Curvy") {
    return Math.max(0, waistDiff / 2 + 1);
  }
  if (profile === "Flat") {
    return Math.max(0, waistDiff / 2 - 1);
  }
  return Math.max(0, waistDiff / 2);
};

type AutoDartDistribution = {
  sideDart: number;
  frontDart: number;
  backDart1: number;
  backDart2: number;
};

export const getDefaultBaseMeasurements = (): HofenbitzerBaseMeasurements => ({
  ...DEFAULT_BASE_MEASUREMENTS,
});

export const computeDerived = (
  measurements: HofenbitzerBaseMeasurements,
): HofenbitzerDerivedValues => {
  let hiW = (Number(measurements.hiC) + Number(measurements.hipEase || 0)) / 2;
  let waW = (Number(measurements.waC) + Number(measurements.waistEase || 0)) / 2;

  if (!isFiniteNumber(hiW)) hiW = 0;
  if (!isFiniteNumber(waW)) waW = 0;

  const waistDiffTarget = Math.max(0, hiW - waW);
  const dartsAuto = measurements.dartsAuto !== false;

  const computeAutoDarts = (): AutoDartDistribution => {
    const sideDart = determineSideDartBase(measurements.hipProfile, waistDiffTarget);
    const frontDart = Math.min(waistDiffTarget * 0.2, 2.5);

    const FIRST_BACK_DART_MAX = 4.5;
    const MIN_SECOND_BACK_DART_TARGET = 1;

    let backDart1 = Math.min(waistDiffTarget * 0.3, FIRST_BACK_DART_MAX);
    let remainder = waistDiffTarget - sideDart - frontDart - backDart1;
    let backDart2 = Math.max(0, remainder);

    if (
      backDart2 > 0 &&
      backDart2 < MIN_SECOND_BACK_DART_TARGET &&
      backDart1 < FIRST_BACK_DART_MAX
    ) {
      const transferable = Math.min(backDart2, FIRST_BACK_DART_MAX - backDart1);
      if (transferable > 0) {
        backDart1 += transferable;
        remainder -= transferable;
        backDart2 = Math.max(0, remainder);
      }
    }

    return {
      sideDart,
      frontDart,
      backDart1,
      backDart2,
    };
  };

  const autoDarts = computeAutoDarts();

  const sideDart = dartsAuto ? autoDarts.sideDart : Math.max(0, Number(measurements.sideDart) || 0);
  const frontDart = dartsAuto ? autoDarts.frontDart : Math.max(0, Number(measurements.frontDart) || 0);
  const backDart1 = dartsAuto ? autoDarts.backDart1 : Math.max(0, Number(measurements.backDart1) || 0);
  const backDart2 = dartsAuto ? autoDarts.backDart2 : Math.max(0, Number(measurements.backDart2) || 0);

  const dartSum = Math.max(0, sideDart + frontDart + backDart1 + backDart2);
  // WaDif is reported as the achieved waist reduction (total), not the remaining gap.
  const waDif = dartSum;

  return {
    hiW: round2(hiW),
    waW: round2(waW),
    waistDiffTarget: round2(waistDiffTarget),
    sideDart: round2(sideDart),
    frontDart: round2(frontDart),
    backDart1: round2(backDart1),
    backDart2: round2(backDart2),
    dartSum: round2(dartSum),
    waDif: round2(waDif),
    waistShaping: round2(determineWaistShaping(measurements.hipProfile)),
  };
};

const addParallelLabel = (
  labels: PatternScene["labels"],
  id: string,
  text: string,
  a: ArtPoint,
  b: ArtPoint,
  options?: { offset?: number; side?: number },
) => {
  const oa = outPoint(a);
  const ob = outPoint(b);

  const dx = ob.x - oa.x;
  const dy = ob.y - oa.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const side = options?.side ?? 1;
  const offset = options?.offset ?? 0.5;

  let rotation = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (rotation < -90 || rotation > 90) {
    rotation += 180;
  }

  labels.push({
    id,
    text,
    x: round2((oa.x + ob.x) / 2 + nx * offset * side),
    y: round2((oa.y + ob.y) / 2 + ny * offset * side),
    rotation: round2(rotation),
    color: "currentColor",
  });
};

export const buildScene = (
  measurements: HofenbitzerEffectiveMeasurements,
): PatternScene => {
  const points: PatternScene["points"] = {};
  const markers: PatternScene["markers"] = [];
  const labels: PatternScene["labels"] = [];
  const paths: PatternScene["paths"] = [];
  const tracked: ArtPoint[] = [];

  const registerPoint = (id: string, point: ArtPoint): ArtPoint => {
    const next = p(point.x, point.y);
    points[id] = outPoint(next);
    tracked.push(next);
    return next;
  };

  const addPath = (path: Omit<PatternPath, "stroke"> & { stroke?: string }) => {
    paths.push({
      stroke: "currentColor",
      ...path,
    });
  };

  const addLine = (
    id: string,
    start: ArtPoint,
    end: ArtPoint,
    options?: {
      dashed?: boolean;
      kind?: PatternPath["kind"];
      strokeWidth?: number;
    },
  ) => {
    tracked.push(start, end);
    addPath({
      id,
      d: outLinePath(start, end),
      strokeWidth: options?.strokeWidth ?? 0.24,
      dashed: options?.dashed,
      kind: options?.kind,
    });
  };

  const addCurve = (
    id: string,
    start: ArtPoint,
    end: ArtPoint,
    options?: {
      startHandle?: ArtPoint;
      endHandle?: ArtPoint;
      handlePoint?: ArtPoint;
      kind?: PatternPath["kind"];
      strokeWidth?: number;
    },
  ) => {
    const c1 = options?.startHandle ?? start;
    const c2 = options?.endHandle ?? options?.handlePoint ?? end;

    tracked.push(start, c1, c2, end);
    addPath({
      id,
      d: outCubicPath(start, c1, c2, end),
      strokeWidth: options?.strokeWidth ?? 0.24,
      kind: options?.kind,
    });
  };

  const hiW = measurements.hiW;
  const moL = measurements.moL;
  const hiD = measurements.hiD;

  const P1 = registerPoint("1", p(0, 0));
  const P2 = registerPoint("2", p(0, -moL));
  const P4 = registerPoint("4", p(hiW, 0));
  const P5 = registerPoint("5", p(hiW, -moL));
  const P3 = registerPoint("3", p(0, -hiD));
  const P6 = registerPoint("6", p(hiW, -hiD));
  const P7 = registerPoint("7", p(hiW / 2, 0));
  const P8 = registerPoint("8", p(hiW / 2, -moL));
  const P9 = registerPoint("9", p(hiW / 2, -hiD));

  const waistShaping = determineWaistShaping(measurements.hipProfile);
  const P10 = registerPoint("10", p(P7.x, P7.y + waistShaping));

  const halfSideDart = Math.max(0, measurements.sideDart / 2);
  const P11 = registerPoint("11", p(P10.x - halfSideDart, P10.y));
  const P12 = registerPoint("12", p(P10.x + halfSideDart, P10.y));

  const frontHipIntersection = horizontalIntersection(P11, P9, P1.y);
  const frontDartAnchorOffset = measurements.waC / 10;
  const P13 = registerPoint("13", p(frontHipIntersection.x - frontDartAnchorOffset, P1.y));

  const P13dashHalf = 2.5;
  const P13dashOffset = measurements.hipProfile === "Curvy" ? 0.7 : 0.5;
  const P13TopY = P13.y + P13dashOffset;
  const P13dashLeft = p(P13.x - P13dashHalf, P13TopY);
  const P13dashRight = p(P13.x + P13dashHalf, P13TopY);

  const frontDartLength = Math.max(0, measurements.frontDartLength);
  const P13Base = p(P13.x, P13.y - frontDartLength);
  const halfFrontDart = Math.max(0, measurements.frontDart / 2);
  const P13TopLeft = p(P13.x - halfFrontDart, P13TopY);
  const P13TopRight = p(P13.x + halfFrontDart, P13TopY);

  const cbWaistPoint = p(P4.x, P1.y);
  const backHipWaistPoint = horizontalIntersection(P12, P9, P1.y);

  const rawBackDart1 = Math.max(0, measurements.backDart1);
  const rawBackDart2 = Math.max(0, measurements.backDart2);
  const hasSecondBackDart = rawBackDart2 > MIN_SECOND_BACK_DART_CM;

  const P14 = registerPoint(
    "14",
    lerpPoint(cbWaistPoint, backHipWaistPoint, hasSecondBackDart ? 1 / 3 : 0.5),
  );

  const backDartLength1 = Math.max(0, measurements.backDartLength1);
  const P14Base = p(P14.x, P14.y - backDartLength1);
  const halfBackDart1 = rawBackDart1 / 2;
  const P14Left = p(P14.x - halfBackDart1, P14.y);
  const P14Right = p(P14.x + halfBackDart1, P14.y);

  let P14UpperLeft = P14Left;
  let P14UpperRight = P14Right;
  let singleBackDashLeft: ArtPoint | null = null;
  let singleBackDashRight: ArtPoint | null = null;

  if (!hasSecondBackDart) {
    const singleDashHalf = 2.5;
    const singleDashOffset = measurements.hipProfile === "Curvy" ? 0.5 : 0.3;
    const singleGuideY = P14.y + singleDashOffset;

    singleBackDashLeft = p(P14.x - singleDashHalf, singleGuideY);
    singleBackDashRight = p(P14.x + singleDashHalf, singleGuideY);
    P14UpperLeft = p(P14.x - halfBackDart1, singleGuideY);
    P14UpperRight = p(P14.x + halfBackDart1, singleGuideY);
  }

  const halfBackDart2 = rawBackDart2 / 2;
  const backDartLength2 = Math.max(0, measurements.backDartLength2);

  let P15: ArtPoint | null = null;
  let P15Base: ArtPoint | null = null;
  let P15Left: ArtPoint | null = null;
  let P15Right: ArtPoint | null = null;
  let P15dashLeft: ArtPoint | null = null;
  let P15dashRight: ArtPoint | null = null;

  if (hasSecondBackDart) {
    const midX = (P12.x + P14UpperLeft.x) / 2;
    P15 = registerPoint("15", p(midX, P1.y));
    P15Base = p(P15.x, P15.y - backDartLength2);

    const secondDashHalf = 2.5;
    const topOffset = measurements.hipProfile === "Curvy" ? 0.5 : 0.3;
    const topY = P15.y + topOffset;

    P15dashLeft = p(P15.x - secondDashHalf, topY);
    P15dashRight = p(P15.x + secondDashHalf, topY);
    P15Left = p(P15.x - halfBackDart2, topY);
    P15Right = p(P15.x + halfBackDart2, topY);
  }

  addLine("cf-line", P1, P2, { kind: "pattern", strokeWidth: 0.26 });
  addParallelLabel(labels, "label-cf", "Centre Front (CF)", P1, P2, { side: 1, offset: 0.5 });

  addLine("waist-line", P1, P4, { kind: "construction" });
  addParallelLabel(labels, "label-waist", "Waist Line", P1, P4, { side: 1, offset: 0.5 });

  addLine("cb-line", P4, P5, { kind: "pattern", strokeWidth: 0.26 });
  addParallelLabel(labels, "label-cb", "Centre Back (CB)", P4, P5, { side: -1, offset: 0.5 });

  addLine("hem-line", P5, P2, { kind: "pattern", strokeWidth: 0.26 });
  addParallelLabel(labels, "label-hem", "Hem Line", P5, P2, { side: -1, offset: 0.5 });

  addLine("side-guide", P7, P8, { kind: "construction" });
  addParallelLabel(labels, "label-side", "Side Line", P7, P8, { side: 1, offset: 0.5 });

  addLine("hip-line", P3, P6, { kind: "construction", dashed: true, strokeWidth: 0.18 });
  addParallelLabel(labels, "label-hip", "Hip Line", P3, P6, { side: 1, offset: 0.5 });

  addLine("hip-line-pattern", P3, P6, {
    kind: "pattern",
    dashed: true,
    strokeWidth: 0.2,
  });
  addLine("side-line-pattern", P9, P8, { kind: "pattern", strokeWidth: 0.26 });

  addLine("waist-shaping-guide", P7, P10, { kind: "construction" });

  if (halfSideDart > 0.0001) {
    addLine("side-dart-left", P10, P11, { kind: "construction" });
    addLine("side-dart-right", P10, P12, { kind: "construction" });

    const hipHandle = p(P7.x, P9.y + 10.5);
    addCurve("front-hip-curve", P11, P9, {
      handlePoint: hipHandle,
      kind: "pattern",
      strokeWidth: 0.26,
    });
    addCurve("back-hip-curve", P12, P9, {
      handlePoint: hipHandle,
      kind: "pattern",
      strokeWidth: 0.26,
    });
  }

  addLine("upper-waist-guide", p(P10.x - 6, P10.y), p(P10.x + 6, P10.y), {
    kind: "construction",
    dashed: true,
    strokeWidth: 0.18,
  });

  addLine("front-dart-guide", P13dashLeft, P13dashRight, {
    kind: "construction",
    dashed: true,
    strokeWidth: 0.18,
  });
  addLine("front-dart-centre", P13, P13Base, {
    kind: "construction",
    dashed: true,
    strokeWidth: 0.18,
  });

  if (halfFrontDart > 0.0001) {
    addLine("front-dart-left", P13TopLeft, P13Base, { kind: "pattern", strokeWidth: 0.26 });
    addLine("front-dart-right", P13TopRight, P13Base, { kind: "pattern", strokeWidth: 0.26 });
    addParallelLabel(labels, "label-front-dart", "Front Dart", P13TopLeft, P13TopRight, {
      side: 1,
      offset: 0.5,
    });
  }

  addCurve("front-waist-curve", P1, P13TopLeft, {
    startHandle: p(P1.x + 10.6, P1.y + 0.3),
    endHandle: p(P13TopLeft.x - 0.54, P13TopLeft.y),
    kind: "pattern",
    strokeWidth: 0.26,
  });

  addCurve("front-hip-transition", P13TopRight, P11, {
    startHandle: p(P13TopRight.x, P13TopRight.y),
    endHandle: p(P11.x - 0.6, P11.y - 0.5),
    kind: "pattern",
    strokeWidth: 0.26,
  });

  if (!hasSecondBackDart) {
    addLine("back-waist-raise", P14UpperLeft, P14UpperRight, {
      kind: "construction",
      strokeWidth: 0.2,
    });

    addCurve("back-waist-curve", P12, P14UpperLeft, {
      startHandle: p(P12.x + 0.4, P12.y - 0.4),
      endHandle: p(P14UpperLeft.x - 2.95, P14UpperLeft.y),
      kind: "pattern",
      strokeWidth: 0.26,
    });
    addCurve("back-waist-cf-curve", P14UpperRight, P4, {
      startHandle: p(P14UpperRight.x + 0.5, P14UpperRight.y),
      endHandle: p(P4.x - 4.25, P4.y),
      kind: "pattern",
      strokeWidth: 0.26,
    });
  } else if (P15 && P15Left && P15Right) {
    addLine("back-waist-raise", P15Left, P15Right, {
      kind: "construction",
      strokeWidth: 0.2,
    });

    addCurve("back-waist-curve", P12, P15Left, {
      startHandle: p(P12.x + 0.4, P12.y - 0.4),
      endHandle: p(P15Left.x - 0.6, P15Left.y),
      kind: "pattern",
      strokeWidth: 0.26,
    });

    addCurve("back-waist-transition", P15Right, P14UpperLeft, {
      startHandle: p(P15Right.x + 0.6, P15Right.y),
      endHandle: p(P14UpperLeft.x - 2.4, P14UpperLeft.y),
      kind: "pattern",
      strokeWidth: 0.26,
    });

    addLine("back-waist-cf-segment", P4, P14UpperRight, { kind: "pattern", strokeWidth: 0.26 });
  }

  if (singleBackDashLeft && singleBackDashRight) {
    addLine("back-dart-guide", singleBackDashLeft, singleBackDashRight, {
      kind: "construction",
      dashed: true,
      strokeWidth: 0.18,
    });
  }

  if (backDartLength1 > 0.0001) {
    addLine("back-dart1-centre", P14, P14Base, {
      kind: "construction",
      dashed: true,
      strokeWidth: 0.18,
    });
  }

  if (halfBackDart1 > 0.0001) {
    addLine("back-dart1-left", P14UpperLeft, P14Base, { kind: "pattern", strokeWidth: 0.26 });
    addLine("back-dart1-right", P14UpperRight, P14Base, { kind: "pattern", strokeWidth: 0.26 });
    addParallelLabel(labels, "label-back-dart1", "1st Back Dart", P14UpperLeft, P14UpperRight, {
      side: 1,
      offset: 0.5,
    });
  }

  if (hasSecondBackDart && P15dashLeft && P15dashRight) {
    addLine("back-dart2-guide", P15dashLeft, P15dashRight, {
      kind: "construction",
      dashed: true,
      strokeWidth: 0.18,
    });
  }

  if (hasSecondBackDart && P15 && P15Base) {
    addLine("back-dart2-centre", P15, P15Base, {
      kind: "construction",
      dashed: true,
      strokeWidth: 0.18,
    });
  }

  if (hasSecondBackDart && P15Left && P15Right && P15Base) {
    addLine("back-dart2-left", P15Left, P15Base, { kind: "pattern", strokeWidth: 0.26 });
    addLine("back-dart2-right", P15Right, P15Base, { kind: "pattern", strokeWidth: 0.26 });
    addParallelLabel(labels, "label-back-dart2", "2nd Back Dart", P15Left, P15Right, {
      side: 1,
      offset: 0.5,
    });
  }

  const markerMap: Array<{ id: string; point: ArtPoint; text: string }> = [
    { id: "marker-1", point: P1, text: "1" },
    { id: "marker-2", point: P2, text: "2" },
    { id: "marker-3", point: P3, text: "3" },
    { id: "marker-4", point: P4, text: "4" },
    { id: "marker-5", point: P5, text: "5" },
    { id: "marker-6", point: P6, text: "6" },
    { id: "marker-7", point: P7, text: "7" },
    { id: "marker-8", point: P8, text: "8" },
    { id: "marker-9", point: P9, text: "9" },
    { id: "marker-10", point: P10, text: "10" },
    { id: "marker-11", point: P11, text: "11" },
    { id: "marker-12", point: P12, text: "12" },
    { id: "marker-13", point: P13, text: "13" },
    { id: "marker-14", point: P14, text: "14" },
  ];

  if (hasSecondBackDart && P15) {
    markerMap.push({ id: "marker-15", point: P15, text: "15" });
  }

  for (const marker of markerMap) {
    const out = outPoint(marker.point);
    markers.push({
      id: marker.id,
      x: out.x,
      y: out.y,
      r: 0.25,
      color: "currentColor",
      text: marker.text,
    });
  }

  return {
    points,
    paths,
    labels,
    markers,
    bounds: getBounds(tracked),
  };
};
