import type {
  PatternBounds,
  PatternPath,
  PatternPoint,
  PatternScene,
} from "@/patterns/types";
import type {
  HofenbitzerTightBasicSleeveBaseMeasurements,
  HofenbitzerTightBasicSleeveDerivedValues,
  HofenbitzerTightBasicSleeveDraftMetrics,
  HofenbitzerTightBasicSleeveEffectiveMeasurements,
} from "./types";

type DraftPoint = {
  x: number;
  y: number;
};

type ArcInfo = {
  startPoint: DraftPoint;
  endPoint: DraftPoint;
  center: DraftPoint;
  radiusCm: number;
  startAngle: number;
  endAngle: number;
  startHandle: DraftPoint;
  endHandle: DraftPoint;
  totalLengthCm: number;
  targetLengthCm: number;
};

const ARC_TARGET_LENGTH_CM = 20;
const ARC_MAX_LENGTH_CM = 22;
const ARC_MIN_SWEEP_RAD = 0.01;
const ARC_MIN_START_ANGLE = -Math.PI / 2;
const ARC_END_ANGLE = Math.PI / 2;
const ARC_MARK4_UP_RATIO = 3;
const ARC_MARK4_DOWN_RATIO = 2;

const DEFAULT_BASE_MEASUREMENTS: HofenbitzerTightBasicSleeveBaseMeasurements = {
  AhH: 20,
  AhHEase: 0,
  fAh: 18.9,
  bAh: 22.1,
  AhC: null,
  AhCEase: 0,
  fAhEase: 0,
  bAhEase: 0,
  AL: 60,
  ALEase: 0,
  upAC: 28,
  upACEase: 1,
  WrC: 16,
  WrCEase: 2,
  CapEasePct: 1,
  CapEasePctEase: 0,
  CapCEase: 0,
  CapLineEase: 0,
  fAP: 4.1,
  bAP: 7.3,
};

const round2 = (value: number): number => Math.round(value * 100) / 100;
const round4 = (value: number): number => Math.round(value * 10000) / 10000;
const fmt = (value: number): string => String(Math.round(value * 1000) / 1000);

const p = (x: number, y: number): DraftPoint => ({ x: round4(x), y: round4(y) });
const outPoint = (point: DraftPoint): PatternPoint => ({ x: round2(point.x), y: round2(-point.y) });

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const asNumber = (value: number | null | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const linePath = (...points: DraftPoint[]): string => {
  if (points.length < 2) {
    return "";
  }

  const [first, ...rest] = points;
  const f = outPoint(first);
  const commands = [`M ${fmt(f.x)} ${fmt(f.y)}`];

  for (const point of rest) {
    const next = outPoint(point);
    commands.push(`L ${fmt(next.x)} ${fmt(next.y)}`);
  }

  return commands.join(" ");
};

const cubicPath = (
  start: DraftPoint,
  c1: DraftPoint,
  c2: DraftPoint,
  end: DraftPoint,
): string => {
  const s = outPoint(start);
  const cp1 = outPoint(c1);
  const cp2 = outPoint(c2);
  const e = outPoint(end);

  return `M ${fmt(s.x)} ${fmt(s.y)} C ${fmt(cp1.x)} ${fmt(cp1.y)} ${fmt(cp2.x)} ${fmt(cp2.y)} ${fmt(e.x)} ${fmt(e.y)}`;
};

const multiCubicPath = (
  segments: Array<{ start: DraftPoint; c1: DraftPoint; c2: DraftPoint; end: DraftPoint }>,
): string => {
  if (!segments.length) {
    return "";
  }

  const first = segments[0];
  const start = outPoint(first.start);
  const commands = [`M ${fmt(start.x)} ${fmt(start.y)}`];

  for (const segment of segments) {
    const c1 = outPoint(segment.c1);
    const c2 = outPoint(segment.c2);
    const end = outPoint(segment.end);
    commands.push(
      `C ${fmt(c1.x)} ${fmt(c1.y)} ${fmt(c2.x)} ${fmt(c2.y)} ${fmt(end.x)} ${fmt(end.y)}`,
    );
  }

  return commands.join(" ");
};

const distanceBetween = (a: DraftPoint, b: DraftPoint): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const midpoint = (a: DraftPoint, b: DraftPoint): DraftPoint =>
  p((a.x + b.x) / 2, (a.y + b.y) / 2);

const normalizeVector = (vector: { x: number; y: number }): { x: number; y: number } => {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (length < 1e-6) {
    return { x: 1, y: 0 };
  }

  return {
    x: vector.x / length,
    y: vector.y / length,
  };
};

const intersectCircles = (
  center1: DraftPoint,
  radius1: number,
  center2: DraftPoint,
  radius2: number,
): DraftPoint[] => {
  const dx = center2.x - center1.x;
  const dy = center2.y - center1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (!isFinite(distance) || distance === 0) {
    return [];
  }

  const sum = radius1 + radius2;
  if (distance > sum + 0.01) {
    return [];
  }

  const diff = Math.abs(radius1 - radius2);
  if (distance < diff - 0.01) {
    return [];
  }

  const a = (radius1 * radius1 - radius2 * radius2 + distance * distance) / (2 * distance);
  let hSq = radius1 * radius1 - a * a;
  if (hSq < 0) {
    hSq = 0;
  }

  const h = Math.sqrt(hSq);
  const xm = center1.x + (a * dx) / distance;
  const ym = center1.y + (a * dy) / distance;

  if (h < 1e-6) {
    return [p(xm, ym)];
  }

  const rx = -dy * (h / distance);
  const ry = dx * (h / distance);

  return [p(xm + rx, ym + ry), p(xm - rx, ym - ry)];
};

const isAngleOnArc = (angle: number, startAngle: number, endAngle: number): boolean => {
  const tolerance = 1e-6;
  if (startAngle > endAngle) {
    return false;
  }

  return angle + tolerance >= startAngle && angle - tolerance <= endAngle;
};

const evaluateBezierPoint = (
  p0: DraftPoint,
  p1: DraftPoint,
  p2: DraftPoint,
  p3: DraftPoint,
  t: number,
): DraftPoint => {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  const f0 = uuu;
  const f1 = 3 * uu * t;
  const f2 = 3 * u * tt;
  const f3 = ttt;

  return p(
    f0 * p0.x + f1 * p1.x + f2 * p2.x + f3 * p3.x,
    f0 * p0.y + f1 * p1.y + f2 * p2.y + f3 * p3.y,
  );
};

const approximateBezierLength = (
  p0: DraftPoint,
  p1: DraftPoint,
  p2: DraftPoint,
  p3: DraftPoint,
  uptoT = 1,
): number => {
  let length = 0;
  let prev = p0;
  const span = uptoT;
  const steps = Math.max(5, Math.round(40 * span));

  for (let i = 1; i <= steps; i += 1) {
    const t = span * (i / steps);
    const point = evaluateBezierPoint(p0, p1, p2, p3, t);
    length += distanceBetween(prev, point);
    prev = point;
  }

  return length;
};

const findBezierHorizontalIntersection = (
  p0: DraftPoint,
  p1: DraftPoint,
  p2: DraftPoint,
  p3: DraftPoint,
  targetY: number,
): DraftPoint | null => {
  let prevT = 0;
  let prevPoint = evaluateBezierPoint(p0, p1, p2, p3, prevT);
  let prevDiff = prevPoint.y - targetY;

  if (Math.abs(prevDiff) < 0.00001) {
    return prevPoint;
  }

  const steps = 60;
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const point = evaluateBezierPoint(p0, p1, p2, p3, t);
    const diff = point.y - targetY;

    if (Math.abs(diff) < 0.00001) {
      return point;
    }

    if (diff === 0 || diff * prevDiff < 0) {
      let lowT = prevT;
      let highT = t;
      let lowDiff = prevDiff;

      for (let iteration = 0; iteration < 20; iteration += 1) {
        const midT = (lowT + highT) / 2;
        const midPoint = evaluateBezierPoint(p0, p1, p2, p3, midT);
        const midDiff = midPoint.y - targetY;

        if (Math.abs(midDiff) < 0.00001) {
          return midPoint;
        }

        if (midDiff * lowDiff < 0) {
          highT = midT;
        } else {
          lowT = midT;
          lowDiff = midDiff;
        }
      }

      return evaluateBezierPoint(p0, p1, p2, p3, (lowT + highT) / 2);
    }

    prevT = t;
    prevPoint = point;
    prevDiff = diff;
  }

  return null;
};

const projectHorizontalOntoLine = (
  start: DraftPoint,
  end: DraftPoint,
  targetY: number,
): DraftPoint | null => {
  const deltaY = end.y - start.y;
  if (Math.abs(deltaY) < 0.00001) {
    return null;
  }

  const t = (targetY - start.y) / deltaY;
  return p(start.x + (end.x - start.x) * t, targetY);
};

const lineIntersection = (
  p1: DraftPoint,
  p2: DraftPoint,
  p3: DraftPoint,
  p4: DraftPoint,
): DraftPoint | null => {
  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;
  const x3 = p3.x;
  const y3 = p3.y;
  const x4 = p4.x;
  const y4 = p4.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-6) {
    return null;
  }

  const det1 = x1 * y2 - y1 * x2;
  const det2 = x3 * y4 - y3 * x4;

  const x = (det1 * (x3 - x4) - (x1 - x2) * det2) / denom;
  const y = (det1 * (y3 - y4) - (y1 - y2) * det2) / denom;

  if (!isFinite(x) || !isFinite(y)) {
    return null;
  }

  return p(x, y);
};

const calculateMark3RadiusCm = (derived: HofenbitzerTightBasicSleeveDerivedValues): number => {
  const radius = 0.95 * derived.fAhConstruction + 0.25 * derived.CapEaseCm;
  return isFinite(radius) && radius > 0 ? radius : 0;
};

const calculateMark4RadiusCm = (derived: HofenbitzerTightBasicSleeveDerivedValues): number => {
  const radius = 0.95 * derived.bAhConstruction + 0.75 * derived.CapEaseCm;
  return isFinite(radius) && radius > 0 ? radius : 0;
};

const buildMark3Arc = (
  center: DraftPoint,
  derived: HofenbitzerTightBasicSleeveDerivedValues,
  targetLengthCm: number,
): ArcInfo | null => {
  const radiusCm = calculateMark3RadiusCm(derived);
  if (!isFinite(radiusCm) || radiusCm <= 0) {
    return null;
  }

  const desiredLength = isFinite(targetLengthCm) && targetLengthCm > 0 ? targetLengthCm : ARC_TARGET_LENGTH_CM;
  let sweep = desiredLength / radiusCm;
  const maxSweep = ARC_END_ANGLE - ARC_MIN_START_ANGLE;
  sweep = Math.min(Math.max(sweep, ARC_MIN_SWEEP_RAD), maxSweep);

  let startAngle = ARC_END_ANGLE - sweep;
  if (startAngle < ARC_MIN_START_ANGLE) {
    startAngle = ARC_MIN_START_ANGLE;
    sweep = ARC_END_ANGLE - startAngle;
  }

  const endAngle = ARC_END_ANGLE;
  const startPoint = p(
    center.x + radiusCm * Math.cos(startAngle),
    center.y + radiusCm * Math.sin(startAngle),
  );
  const endPoint = p(
    center.x + radiusCm * Math.cos(endAngle),
    center.y + radiusCm * Math.sin(endAngle),
  );

  let handleLength = (4 / 3) * radiusCm * Math.tan(sweep / 4);
  if (!isFinite(handleLength)) {
    handleLength = 0;
  }

  const startTangent = { x: -Math.sin(startAngle), y: Math.cos(startAngle) };
  const endTangent = { x: -Math.sin(endAngle), y: Math.cos(endAngle) };

  const startHandle = p(
    startPoint.x + startTangent.x * handleLength,
    startPoint.y + startTangent.y * handleLength,
  );
  const endHandle = p(
    endPoint.x - endTangent.x * handleLength,
    endPoint.y - endTangent.y * handleLength,
  );

  return {
    startPoint,
    endPoint,
    center,
    radiusCm,
    startAngle,
    endAngle,
    startHandle,
    endHandle,
    totalLengthCm: sweep * radiusCm,
    targetLengthCm: desiredLength,
  };
};

const updateArcGeometry = (arcInfo: ArcInfo, startAngle: number, endAngle: number): void => {
  arcInfo.startAngle = startAngle;
  arcInfo.endAngle = endAngle;

  arcInfo.startPoint = p(
    arcInfo.center.x + arcInfo.radiusCm * Math.cos(startAngle),
    arcInfo.center.y + arcInfo.radiusCm * Math.sin(startAngle),
  );
  arcInfo.endPoint = p(
    arcInfo.center.x + arcInfo.radiusCm * Math.cos(endAngle),
    arcInfo.center.y + arcInfo.radiusCm * Math.sin(endAngle),
  );

  let sweep = endAngle - startAngle;
  if (sweep < ARC_MIN_SWEEP_RAD) {
    sweep = ARC_MIN_SWEEP_RAD;
  }

  let handleLength = (4 / 3) * arcInfo.radiusCm * Math.tan(sweep / 4);
  if (!isFinite(handleLength)) {
    handleLength = 0;
  }

  const startTangent = { x: -Math.sin(startAngle), y: Math.cos(startAngle) };
  const endTangent = { x: -Math.sin(endAngle), y: Math.cos(endAngle) };

  arcInfo.startHandle = p(
    arcInfo.startPoint.x + startTangent.x * handleLength,
    arcInfo.startPoint.y + startTangent.y * handleLength,
  );
  arcInfo.endHandle = p(
    arcInfo.endPoint.x - endTangent.x * handleLength,
    arcInfo.endPoint.y - endTangent.y * handleLength,
  );

  arcInfo.totalLengthCm = sweep * arcInfo.radiusCm;
};

const rebalanceArcAroundMark4 = (arcInfo: ArcInfo, mark4Angle: number): void => {
  const ratioSum = ARC_MARK4_UP_RATIO + ARC_MARK4_DOWN_RATIO;
  let desiredLength = arcInfo.totalLengthCm || arcInfo.targetLengthCm || ARC_TARGET_LENGTH_CM;
  if (!isFinite(desiredLength) || desiredLength <= 0) {
    desiredLength = ARC_TARGET_LENGTH_CM;
  }

  let sweep = desiredLength / arcInfo.radiusCm;
  const maxSweep = ARC_END_ANGLE - ARC_MIN_START_ANGLE;
  sweep = Math.min(Math.max(sweep, ARC_MIN_SWEEP_RAD), maxSweep);

  const upSweep = sweep * (ARC_MARK4_UP_RATIO / ratioSum);
  const downSweep = sweep - upSweep;

  let startAngle = mark4Angle - downSweep;
  let endAngle = mark4Angle + upSweep;

  if (startAngle < ARC_MIN_START_ANGLE) {
    const shift = ARC_MIN_START_ANGLE - startAngle;
    startAngle += shift;
    endAngle += shift;
  }

  if (endAngle > ARC_END_ANGLE) {
    const shift = endAngle - ARC_END_ANGLE;
    startAngle -= shift;
    endAngle -= shift;
  }

  if (startAngle < ARC_MIN_START_ANGLE) startAngle = ARC_MIN_START_ANGLE;
  if (endAngle > ARC_END_ANGLE) endAngle = ARC_END_ANGLE;

  const mid = (startAngle + endAngle) / 2;
  if (endAngle - startAngle < ARC_MIN_SWEEP_RAD) {
    startAngle = mid - ARC_MIN_SWEEP_RAD / 2;
    endAngle = mid + ARC_MIN_SWEEP_RAD / 2;
  }

  updateArcGeometry(arcInfo, startAngle, endAngle);
};

const computeCapMarkerPoints = (
  mark1: DraftPoint,
  mark2: DraftPoint,
  mark4: DraftPoint,
  derived: HofenbitzerTightBasicSleeveDerivedValues,
): {
  mark11: DraftPoint;
  mark12: DraftPoint;
  mark13: DraftPoint;
  mark14: DraftPoint;
} => {
  let capLineCm = derived.CapLineCm;
  if (!isFinite(capLineCm) || capLineCm <= 0) {
    capLineCm = Math.abs(mark2.x - mark1.x);
  }

  return {
    mark11: p(mark4.x - capLineCm / 8, mark4.y),
    mark12: p(mark4.x + capLineCm / 5, mark4.y),
    mark13: p(mark2.x - capLineCm / 9, mark2.y),
    mark14: p(mark1.x + capLineCm / 12, mark1.y),
  };
};

type Geometry = {
  points: Record<string, DraftPoint>;
  leftSleeveCurve: { start: DraftPoint; c1: DraftPoint; c2: DraftPoint; end: DraftPoint } | null;
  rightSleeveCurve: { start: DraftPoint; c1: DraftPoint; c2: DraftPoint; end: DraftPoint } | null;
  frontCapSegments: Array<{ start: DraftPoint; c1: DraftPoint; c2: DraftPoint; end: DraftPoint }>;
  backCapSegments: Array<{ start: DraftPoint; c1: DraftPoint; c2: DraftPoint; end: DraftPoint }>;
  arcInfo: ArcInfo | null;
  metrics: HofenbitzerTightBasicSleeveDraftMetrics;
};

const computeGeometry = (
  measurements: HofenbitzerTightBasicSleeveEffectiveMeasurements,
): Geometry => {
  const points: Record<string, DraftPoint> = {};

  const baselineLength = measurements.SlW + 1 + measurements.CapLineEase;
  const mark1 = p(0, 0);
  const mark2 = p(baselineLength, 0);

  let arcInfo = buildMark3Arc(mark1, measurements, ARC_TARGET_LENGTH_CM);
  let mark4: DraftPoint | null = null;
  let mark4Angle = 0;

  const findMark4OnArc = (arc: ArcInfo | null): { point: DraftPoint; angle: number } | null => {
    if (!arc) return null;

    const radius4 = calculateMark4RadiusCm(measurements);
    if (!isFinite(radius4) || radius4 <= 0) {
      return null;
    }

    const candidates = intersectCircles(arc.center, arc.radiusCm, mark2, radius4);
    if (!candidates.length) {
      return null;
    }

    let best: { point: DraftPoint; angle: number } | null = null;
    for (const candidate of candidates) {
      const angle = Math.atan2(candidate.y - arc.center.y, candidate.x - arc.center.x);
      if (isAngleOnArc(angle, arc.startAngle, arc.endAngle)) {
        if (!best || angle > best.angle) {
          best = { point: candidate, angle };
        }
      }
    }

    if (best) {
      return best;
    }

    for (const candidate of candidates) {
      const angle = Math.atan2(candidate.y - arc.center.y, candidate.x - arc.center.x);
      if (!best || angle > best.angle) {
        best = { point: candidate, angle };
      }
    }

    return best;
  };

  let foundMark4 = findMark4OnArc(arcInfo);
  if (!foundMark4) {
    const fallbackArc = buildMark3Arc(mark1, measurements, ARC_MAX_LENGTH_CM);
    const fallbackMark4 = findMark4OnArc(fallbackArc);
    if (fallbackArc && fallbackMark4) {
      arcInfo = fallbackArc;
      foundMark4 = fallbackMark4;
    }
  }

  if (arcInfo && foundMark4) {
    mark4 = foundMark4.point;
    mark4Angle = foundMark4.angle;
    rebalanceArcAroundMark4(arcInfo, mark4Angle);
  }

  if (!mark4) {
    mark4 = p(mark2.x - baselineLength * 0.3, Math.max(1, measurements.AhHConstruction));
  }

  const mark3 = arcInfo ? arcInfo.endPoint : p(mark1.x, mark1.y + Math.max(1, measurements.fAhConstruction));

  const mark5 = p(mark4.x, mark4.y - measurements.SlL);
  const mark6 = p(mark4.x, mark4.y - measurements.SlL * 0.6);
  const mark7 = p(mark1.x, mark5.y);
  const mark8 = p(mark2.x, mark5.y);
  const mark9 = p(mark1.x, mark6.y);
  const mark10 = p(mark2.x, mark6.y);

  const mark15 = midpoint(mark7, mark8);
  const halfHemWidth = measurements.HeW / 2;
  const mark16 = p(mark15.x - halfHemWidth, mark15.y);
  const mark17 = p(mark15.x + halfHemWidth, mark15.y);

  const leftHandleStart = p(mark16.x, mark16.y + 5);
  const leftDir = normalizeVector({ x: mark16.x - mark1.x, y: mark16.y - mark1.y });
  const leftHandleEnd = p(mark1.x + leftDir.x * 12.47, mark1.y + leftDir.y * 12.47);

  const rightHandleStart = p(mark17.x, mark17.y + 5);
  const rightDir = normalizeVector({ x: mark17.x - mark2.x, y: mark17.y - mark2.y });
  const rightHandleEnd = p(mark2.x + rightDir.x * 12.47, mark2.y + rightDir.y * 12.47);

  const leftSleeveCurve = {
    start: mark16,
    c1: leftHandleStart,
    c2: leftHandleEnd,
    end: mark1,
  };
  const rightSleeveCurve = {
    start: mark17,
    c1: rightHandleStart,
    c2: rightHandleEnd,
    end: mark2,
  };

  const sleeveWidthY = midpoint(mark6, mark4).y;
  const leftSleeveWidthPoint =
    findBezierHorizontalIntersection(
      leftSleeveCurve.start,
      leftSleeveCurve.c1,
      leftSleeveCurve.c2,
      leftSleeveCurve.end,
      sleeveWidthY,
    ) || projectHorizontalOntoLine(leftSleeveCurve.start, leftSleeveCurve.end, sleeveWidthY);

  const rightSleeveWidthPoint =
    findBezierHorizontalIntersection(
      rightSleeveCurve.start,
      rightSleeveCurve.c1,
      rightSleeveCurve.c2,
      rightSleeveCurve.end,
      sleeveWidthY,
    ) || projectHorizontalOntoLine(rightSleeveCurve.start, rightSleeveCurve.end, sleeveWidthY);

  const leftElbowPoint =
    findBezierHorizontalIntersection(
      leftSleeveCurve.start,
      leftSleeveCurve.c1,
      leftSleeveCurve.c2,
      leftSleeveCurve.end,
      mark6.y,
    ) || projectHorizontalOntoLine(leftSleeveCurve.start, leftSleeveCurve.end, mark6.y);

  const rightElbowPoint =
    findBezierHorizontalIntersection(
      rightSleeveCurve.start,
      rightSleeveCurve.c1,
      rightSleeveCurve.c2,
      rightSleeveCurve.end,
      mark6.y,
    ) || projectHorizontalOntoLine(rightSleeveCurve.start, rightSleeveCurve.end, mark6.y);

  const capPoints = computeCapMarkerPoints(mark1, mark2, mark4, measurements);
  const mark11 = capPoints.mark11;
  const mark12 = capPoints.mark12;
  const mark13 = capPoints.mark13;
  const mark14 = capPoints.mark14;

  const markA = (() => {
    const vx = mark4.x - mark1.x;
    const vy = mark4.y - mark1.y;
    const lenSq = vx * vx + vy * vy;
    if (lenSq < 1e-6) return mark11;
    const wx = mark11.x - mark1.x;
    const wy = mark11.y - mark1.y;
    const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / lenSq));
    return p(mark1.x + vx * t, mark1.y + vy * t);
  })();

  const markB = (() => {
    const vx = mark4.x - mark2.x;
    const vy = mark4.y - mark2.y;
    const lenSq = vx * vx + vy * vy;
    if (lenSq < 1e-6) return mark12;
    const wx = mark12.x - mark2.x;
    const wy = mark12.y - mark2.y;
    const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / lenSq));
    return p(mark2.x + vx * t, mark2.y + vy * t);
  })();

  const mid1114 = midpoint(mark11, mark14);

  const baselineDir = normalizeVector({ x: mark2.x - mark1.x, y: mark2.y - mark1.y });
  const arc1StartHandle = p(mark1.x + baselineDir.x * 3, mark1.y + baselineDir.y * 3);

  const towards14Dir = normalizeVector({ x: mark14.x - mid1114.x, y: mark14.y - mid1114.y });
  const arc1EndHandle = p(mid1114.x + towards14Dir.x * 4, mid1114.y + towards14Dir.y * 4);

  const midTo11 = normalizeVector({ x: mark11.x - mid1114.x, y: mark11.y - mid1114.y });
  const frontSecondStart = p(mid1114.x + midTo11.x * 3, mid1114.y + midTo11.y * 3);

  const dir4To12 = normalizeVector({ x: mark4.x - mark12.x, y: mark4.y - mark12.y });
  const frontSecondEnd = p(mark4.x + dir4To12.x * 3.3, mark4.y + dir4To12.y * 3.3);

  const frontCapSegments = [
    {
      start: mark1,
      c1: arc1StartHandle,
      c2: arc1EndHandle,
      end: mid1114,
    },
    {
      start: mid1114,
      c1: frontSecondStart,
      c2: frontSecondEnd,
      end: mark4,
    },
  ];

  const intersection1213_24 = lineIntersection(mark12, mark13, mark2, mark4);

  let backCapSegments: Array<{ start: DraftPoint; c1: DraftPoint; c2: DraftPoint; end: DraftPoint }> = [];

  if (intersection1213_24) {
    const baselineForward = normalizeVector({ x: mark2.x - mark1.x, y: mark2.y - mark1.y });
    let line1213 = normalizeVector({ x: mark13.x - mark12.x, y: mark13.y - mark12.y });
    if (Math.abs(line1213.y) < 1e-6) {
      line1213 = { x: 0, y: 1 };
    } else if (line1213.y < 0) {
      line1213 = { x: -line1213.x, y: -line1213.y };
    }

    const handleMark4 = p(mark4.x + baselineForward.x * 6.6, mark4.y + baselineForward.y * 6.6);
    const handleIntersectionUpper = p(
      intersection1213_24.x + line1213.x * 2.95,
      intersection1213_24.y + line1213.y * 2.95,
    );

    const handleMark2 = p(mark2.x - baselineForward.x * 3.5, mark2.y - baselineForward.y * 3.5);
    const handleIntersectionLower = p(
      intersection1213_24.x - line1213.x * 1.5,
      intersection1213_24.y - line1213.y * 1.5,
    );

    backCapSegments = [
      {
        start: mark2,
        c1: handleMark2,
        c2: handleIntersectionLower,
        end: intersection1213_24,
      },
      {
        start: intersection1213_24,
        c1: handleIntersectionUpper,
        c2: handleMark4,
        end: mark4,
      },
    ];
  } else {
    const mid1213 = midpoint(mark12, mark13);
    const baselineBack = normalizeVector({ x: mark1.x - mark2.x, y: mark1.y - mark2.y });
    const arc2StartHandle = p(mark2.x + baselineBack.x * 4.3, mark2.y + baselineBack.y * 4.3);
    const dirTo13 = normalizeVector({ x: mark13.x - mid1213.x, y: mark13.y - mid1213.y });
    const arc2End = p(mid1213.x + dirTo13.x * 4, mid1213.y + dirTo13.y * 4);

    const dirTo12 = normalizeVector({ x: mark12.x - mid1213.x, y: mark12.y - mid1213.y });
    const arc3End = p(mark4.x + (mark12.x - mark4.x) / distanceBetween(mark4, mark12) * 3.3, mark4.y + (mark12.y - mark4.y) / distanceBetween(mark4, mark12) * 3.3);

    let startLen = 3;
    if (isFinite(arc3End.x) && isFinite(arc3End.y)) {
      const target = midpoint(mid1213, mark4);
      const f0 = 0.125;
      const f1 = 0.375;
      const f2 = 0.375;
      const f3 = 0.125;
      const restX = f0 * mid1213.x + f2 * arc3End.x + f3 * mark4.x;
      const restY = f0 * mid1213.y + f2 * arc3End.y + f3 * mark4.y;
      const vecX = target.x - restX - f1 * mid1213.x;
      const vecY = target.y - restY - f1 * mid1213.y;
      const projected = vecX * dirTo12.x + vecY * dirTo12.y;
      if (isFinite(projected) && projected > 0) {
        startLen = projected / f1;
      }
    }

    const arc3Start = p(mid1213.x + dirTo12.x * startLen, mid1213.y + dirTo12.y * startLen);

    backCapSegments = [
      {
        start: mark2,
        c1: arc2StartHandle,
        c2: arc2End,
        end: mid1213,
      },
      {
        start: mid1213,
        c1: arc3Start,
        c2: arc3End,
        end: mark4,
      },
    ];
  }

  points["1"] = mark1;
  points["2"] = mark2;
  points["3"] = mark3;
  points["4"] = mark4;
  points["5"] = mark5;
  points["6"] = mark6;
  points["7"] = mark7;
  points["8"] = mark8;
  points["9"] = mark9;
  points["10"] = mark10;
  points["11"] = mark11;
  points["12"] = mark12;
  points["13"] = mark13;
  points["14"] = mark14;
  points["15"] = mark15;
  points["16"] = mark16;
  points["17"] = mark17;
  points["a"] = markA;
  points["b"] = markB;

  if (leftSleeveWidthPoint) points["swL"] = leftSleeveWidthPoint;
  if (rightSleeveWidthPoint) points["swR"] = rightSleeveWidthPoint;
  if (leftElbowPoint) points["eL"] = leftElbowPoint;
  if (rightElbowPoint) points["eR"] = rightElbowPoint;

  const capLine = baselineLength;
  const sleeveWidth =
    leftSleeveWidthPoint && rightSleeveWidthPoint
      ? distanceBetween(leftSleeveWidthPoint, rightSleeveWidthPoint)
      : baselineLength;
  const elbowWidth =
    leftElbowPoint && rightElbowPoint
      ? distanceBetween(leftElbowPoint, rightElbowPoint)
      : distanceBetween(mark9, mark10);

  const frontCapLength =
    approximateBezierLength(mark1, arc1StartHandle, arc1EndHandle, mid1114) +
    approximateBezierLength(mid1114, frontSecondStart, frontSecondEnd, mark4);

  let backCapLength = 0;
  for (const segment of backCapSegments) {
    backCapLength += approximateBezierLength(segment.start, segment.c1, segment.c2, segment.end);
  }

  const sleeveCap = frontCapLength + backCapLength;

  return {
    points,
    leftSleeveCurve,
    rightSleeveCurve,
    frontCapSegments,
    backCapSegments,
    arcInfo,
    metrics: {
      capLine: round2(capLine),
      sleeveWidth: round2(sleeveWidth),
      elbowWidth: round2(elbowWidth),
      sleeveCap: round2(sleeveCap),
    },
  };
};

export const getDefaultBaseMeasurements = (): HofenbitzerTightBasicSleeveBaseMeasurements => ({
  ...DEFAULT_BASE_MEASUREMENTS,
});

export const computeDerived = (
  data: HofenbitzerTightBasicSleeveBaseMeasurements,
): HofenbitzerTightBasicSleeveDerivedValues => {
  const AhH = asNumber(data.AhH);
  const AhHConstruction = AhH + asNumber(data.AhHEase);

  const fAh = asNumber(data.fAh);
  const bAh = asNumber(data.bAh);
  const fAhConstruction = fAh + asNumber(data.fAhEase);
  const bAhConstruction = bAh + asNumber(data.bAhEase);

  const manualAhC = isFiniteNumber(data.AhC) ? data.AhC : fAh + bAh;
  const AhCConstruction = manualAhC + asNumber(data.AhCEase);

  const SlL = asNumber(data.AL) + asNumber(data.ALEase);
  const SlW = asNumber(data.upAC) + asNumber(data.upACEase);
  const HeW = asNumber(data.WrC) + asNumber(data.WrCEase);

  const capEasePctConstruction = asNumber(data.CapEasePct) + asNumber(data.CapEasePctEase);
  const capEaseCm = AhCConstruction * capEasePctConstruction / 100;
  const capC = AhCConstruction + capEaseCm + asNumber(data.CapCEase);
  const capLineCm = SlW + 1 + asNumber(data.CapLineEase);

  return {
    AhHConstruction: round2(AhHConstruction),
    fAhConstruction: round2(fAhConstruction),
    bAhConstruction: round2(bAhConstruction),
    AhCConstruction: round2(AhCConstruction),
    SlL: round2(SlL),
    SlW: round2(SlW),
    HeW: round2(HeW),
    CapEasePctConstruction: round2(capEasePctConstruction),
    CapEaseCm: round2(capEaseCm),
    CapC: round2(capC),
    CapLineCm: round2(capLineCm),
  };
};

export const computeDraftMetrics = (
  measurements: HofenbitzerTightBasicSleeveEffectiveMeasurements,
): HofenbitzerTightBasicSleeveDraftMetrics => computeGeometry(measurements).metrics;

const getBounds = (tracked: DraftPoint[]): PatternBounds => {
  if (!tracked.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  const first = outPoint(tracked[0]);
  let minX = first.x;
  let minY = first.y;
  let maxX = first.x;
  let maxY = first.y;

  for (const point of tracked) {
    const next = outPoint(point);
    minX = Math.min(minX, next.x);
    minY = Math.min(minY, next.y);
    maxX = Math.max(maxX, next.x);
    maxY = Math.max(maxY, next.y);
  }

  return {
    minX: round2(minX),
    minY: round2(minY),
    maxX: round2(maxX),
    maxY: round2(maxY),
  };
};

export const buildScene = (
  measurements: HofenbitzerTightBasicSleeveEffectiveMeasurements,
): PatternScene => {
  const points: PatternScene["points"] = {};
  const markers: PatternScene["markers"] = [];
  const labels: PatternScene["labels"] = [];
  const paths: PatternScene["paths"] = [];
  const tracked: DraftPoint[] = [];

  const geometry = computeGeometry(measurements);

  const track = (...items: DraftPoint[]) => {
    for (const item of items) {
      tracked.push(item);
    }
  };

  const registerPoint = (id: string, point: DraftPoint) => {
    const next = p(point.x, point.y);
    points[id] = outPoint(next);
    markers.push({
      id: `marker-${id}`,
      x: points[id].x,
      y: points[id].y,
      r: 0.45,
      color: "currentColor",
      text: id,
    });
    track(next);
  };

  const addPath = (
    id: string,
    d: string,
    options?: {
      kind?: PatternPath["kind"];
      dashed?: boolean;
      strokeWidth?: number;
    },
  ) => {
    if (!d) return;
    paths.push({
      id,
      d,
      stroke: "currentColor",
      strokeWidth: options?.strokeWidth ?? 0.24,
      dashed: options?.dashed,
      kind: options?.kind,
    });
  };

  const addLine = (
    id: string,
    start: DraftPoint,
    end: DraftPoint,
    options?: {
      kind?: PatternPath["kind"];
      dashed?: boolean;
      strokeWidth?: number;
    },
  ) => {
    track(start, end);
    addPath(id, linePath(start, end), options);
  };

  const addCubic = (
    id: string,
    start: DraftPoint,
    c1: DraftPoint,
    c2: DraftPoint,
    end: DraftPoint,
    options?: {
      kind?: PatternPath["kind"];
      strokeWidth?: number;
    },
  ) => {
    track(start, c1, c2, end);
    addPath(id, cubicPath(start, c1, c2, end), options);
  };

  const addMultiCubic = (
    id: string,
    segments: Array<{ start: DraftPoint; c1: DraftPoint; c2: DraftPoint; end: DraftPoint }>,
    options?: {
      kind?: PatternPath["kind"];
      strokeWidth?: number;
    },
  ) => {
    for (const segment of segments) {
      track(segment.start, segment.c1, segment.c2, segment.end);
    }
    addPath(id, multiCubicPath(segments), options);
  };

  for (const [id, point] of Object.entries(geometry.points)) {
    registerPoint(id, point);
  }

  const g = geometry.points;

  addLine("cap-line", g["1"], g["2"], { dashed: true, kind: "construction", strokeWidth: 0.18 });
  addLine("front-line-1-4", g["1"], g["4"], { dashed: true, kind: "construction", strokeWidth: 0.18 });
  addLine("back-line-2-4", g["2"], g["4"], { dashed: true, kind: "construction", strokeWidth: 0.18 });

  if (geometry.arcInfo) {
    addCubic(
      "mark3-arc",
      geometry.arcInfo.startPoint,
      geometry.arcInfo.startHandle,
      geometry.arcInfo.endHandle,
      geometry.arcInfo.endPoint,
      { kind: "construction", strokeWidth: 0.24 },
    );
  }

  addLine("vertical-4-5", g["4"], g["5"], { dashed: true, kind: "construction", strokeWidth: 0.18 });
  addLine("line-1-7", g["1"], g["7"], { dashed: true, kind: "construction", strokeWidth: 0.18 });
  addLine("line-2-8", g["2"], g["8"], { dashed: true, kind: "construction", strokeWidth: 0.18 });
  addLine("line-7-8", g["7"], g["8"], { dashed: true, kind: "construction", strokeWidth: 0.18 });
  addLine("line-9-10", g["9"], g["10"], { dashed: true, kind: "construction", strokeWidth: 0.18 });

  addLine("hem-line", g["16"], g["17"], { kind: "pattern", strokeWidth: 0.26 });

  if (geometry.leftSleeveCurve) {
    addCubic(
      "left-sleeve-line",
      geometry.leftSleeveCurve.start,
      geometry.leftSleeveCurve.c1,
      geometry.leftSleeveCurve.c2,
      geometry.leftSleeveCurve.end,
      { kind: "pattern", strokeWidth: 0.26 },
    );
  }

  if (geometry.rightSleeveCurve) {
    addCubic(
      "right-sleeve-line",
      geometry.rightSleeveCurve.start,
      geometry.rightSleeveCurve.c1,
      geometry.rightSleeveCurve.c2,
      geometry.rightSleeveCurve.end,
      { kind: "pattern", strokeWidth: 0.26 },
    );
  }

  if (g["eL"] && g["eR"]) {
    addLine("elbow-width", g["eL"], g["eR"], { dashed: true, kind: "construction", strokeWidth: 0.18 });
  }

  if (g["swL"] && g["swR"]) {
    addLine("sleeve-width", g["swL"], g["swR"], { dashed: true, kind: "construction", strokeWidth: 0.18 });
  }

  addLine("line-4-11", g["4"], g["11"], { dashed: true, kind: "construction", strokeWidth: 0.18 });
  addLine("line-4-12", g["4"], g["12"], { dashed: true, kind: "construction", strokeWidth: 0.18 });
  addLine("line-11-14", g["11"], g["14"], { dashed: true, kind: "construction", strokeWidth: 0.18 });
  addLine("line-12-13", g["12"], g["13"], { dashed: true, kind: "construction", strokeWidth: 0.18 });

  if (g["a"]) {
    addLine("line-a-11", g["a"], g["11"], { dashed: true, kind: "construction", strokeWidth: 0.18 });
  }
  if (g["b"]) {
    addLine("line-12-b", g["12"], g["b"], { dashed: true, kind: "construction", strokeWidth: 0.18 });
  }

  addMultiCubic("front-cap", geometry.frontCapSegments, { kind: "pattern", strokeWidth: 0.26 });
  addMultiCubic("back-cap", geometry.backCapSegments, { kind: "pattern", strokeWidth: 0.26 });

  const metrics = geometry.metrics;
  labels.push(
    {
      id: "label-cap-line",
      text: `Cap Line ${fmt(metrics.capLine)} cm`,
      x: round2((points["1"].x + points["2"].x) / 2),
      y: round2(points["1"].y + 1.2),
      color: "currentColor",
    },
    {
      id: "label-sleeve-cap",
      text: `Sleeve Cap ${fmt(metrics.sleeveCap)} cm`,
      x: round2(points["4"].x + 1),
      y: round2(points["4"].y - 1.2),
      color: "currentColor",
    },
  );

  return {
    points,
    paths,
    labels,
    markers,
    bounds: getBounds(tracked),
  };
};
