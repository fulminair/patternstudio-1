import type {
  PatternBounds,
  PatternPath,
  PatternPoint,
  PatternScene,
} from "@/patterns/types";
import type {
  FitProfile,
  HofenbitzerCasualShapingBaseMeasurements,
  HofenbitzerCasualShapingDerivedValues,
  HofenbitzerCasualShapingEffectiveMeasurements,
} from "./types";

type DraftPoint = {
  x: number;
  y: number;
};

type CubicControls = {
  c1: DraftPoint;
  c2: DraftPoint;
};

const RIGHT_BOUNDARY_CM = 70;
const TOP_BOUNDARY_CM = -30;
const HIP_LEFT_OFFSET_CM = 2;
const MIN_HANDLE_LENGTH_CM = 0.5;
const BACK_SHOULDER_EASE_CM = 0.7;
const BACK_SHOULDER_DART_INTAKE_CM = 1.5;
const FRONT_ARMHOLE_START_HANDLE_CM = 1.71;

const FIT_PROFILES: readonly FitProfile[] = [
  {
    name: "Fit 0",
    ease: {
      AhDEase: 0.25,
      BrCEase: 0,
      WaCEase: 0,
      HiCEase: 0,
      BGEase: 0,
      AGEase: 0,
      BrGEase: 0,
      ShGEase: 0,
    },
  },
  {
    name: "Fit 1",
    ease: {
      AhDEase: 0.45,
      BrCEase: 2,
      WaCEase: 1,
      HiCEase: 1,
      BGEase: 0.1,
      AGEase: 0.3,
      BrGEase: 0.6,
      ShGEase: 0.1,
    },
  },
  {
    name: "Fit 2",
    ease: {
      AhDEase: 0.75,
      BrCEase: 4,
      WaCEase: 3,
      HiCEase: 3,
      BGEase: 0.3,
      AGEase: 0.9,
      BrGEase: 0.8,
      ShGEase: 0.2,
    },
  },
  {
    name: "Fit 3",
    ease: {
      AhDEase: 1.3,
      BrCEase: 6,
      WaCEase: 5,
      HiCEase: 5,
      BGEase: 0.5,
      AGEase: 1.5,
      BrGEase: 1,
      ShGEase: 0.3,
    },
  },
  {
    name: "Fit 4",
    ease: {
      AhDEase: 1.7,
      BrCEase: 8,
      WaCEase: 6,
      HiCEase: 6,
      BGEase: 0.8,
      AGEase: 2,
      BrGEase: 1.2,
      ShGEase: 0.4,
    },
  },
  {
    name: "Fit 5",
    ease: {
      AhDEase: 2.1,
      BrCEase: 10,
      WaCEase: 10,
      HiCEase: 7,
      BGEase: 1.1,
      AGEase: 2.5,
      BrGEase: 1.4,
      ShGEase: 0.5,
    },
  },
  {
    name: "Fit 6",
    ease: {
      AhDEase: 2.5,
      BrCEase: 12,
      WaCEase: 12,
      HiCEase: 8,
      BGEase: 1.4,
      AGEase: 3,
      BrGEase: 1.6,
      ShGEase: 0.6,
    },
  },
] as const;

const DEFAULT_BASE_MEASUREMENTS: HofenbitzerCasualShapingBaseMeasurements = {
  FitIndex: 3,
  AhD: 20.1,
  AhDEase: FIT_PROFILES[3].ease.AhDEase,
  BrC: 88,
  BrCEase: FIT_PROFILES[3].ease.BrCEase,
  WaC: 68,
  WaCEase: FIT_PROFILES[3].ease.WaCEase,
  HiC: 97,
  HiCEase: FIT_PROFILES[3].ease.HiCEase,
  BG: 16.5,
  BGEase: FIT_PROFILES[3].ease.BGEase,
  AG: 9.3,
  AGEase: FIT_PROFILES[3].ease.AGEase,
  BrG: 18.2,
  BrGEase: FIT_PROFILES[3].ease.BrGEase,
  ShG: 12.2,
  ShGEase: FIT_PROFILES[3].ease.ShGEase,
  BL: 41.6,
  BLBal: 0,
  FL: 45.3,
  FLBal: 0,
  NeG: 6.5,
  MoL: 75,
  HiD: 20,
  ShA: 20,
  BrD: 28.1,
  ShoulderDifference: 2,
  WaistShaping: 1,
  FrontShoulderDartPosition: 0.5,
};

const round2 = (value: number): number => Math.round(value * 100) / 100;
const round4 = (value: number): number => Math.round(value * 10000) / 10000;
const fmt = (value: number): string => String(Math.round(value * 1000) / 1000);

const p = (x: number, y: number): DraftPoint => ({ x: round4(x), y: round4(y) });
const out = (point: DraftPoint): PatternPoint => ({ x: round2(point.x), y: round2(point.y) });

const linePath = (...points: DraftPoint[]): string => {
  if (points.length < 2) {
    return "";
  }

  const [first, ...rest] = points;
  const f = out(first);
  const commands = [`M ${fmt(f.x)} ${fmt(f.y)}`];

  for (const point of rest) {
    const next = out(point);
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
  const s = out(start);
  const cp1 = out(c1);
  const cp2 = out(c2);
  const e = out(end);

  return `M ${fmt(s.x)} ${fmt(s.y)} C ${fmt(cp1.x)} ${fmt(cp1.y)} ${fmt(cp2.x)} ${fmt(cp2.y)} ${fmt(e.x)} ${fmt(e.y)}`;
};

const distanceBetween = (a: DraftPoint, b: DraftPoint): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const extendLineToY = (a: DraftPoint, b: DraftPoint, targetY: number): DraftPoint => {
  const dy = b.y - a.y;
  const dx = b.x - a.x;
  if (Math.abs(dy) < 0.0001) {
    return p(b.x, targetY);
  }

  const t = (targetY - a.y) / dy;
  return p(a.x + dx * t, targetY);
};

const pointOnSegment = (
  candidate: DraftPoint,
  a: DraftPoint,
  b: DraftPoint,
  tolerance = 0.01,
): boolean => {
  const minX = Math.min(a.x, b.x) - tolerance;
  const maxX = Math.max(a.x, b.x) + tolerance;
  const minY = Math.min(a.y, b.y) - tolerance;
  const maxY = Math.max(a.y, b.y) + tolerance;

  if (
    candidate.x < minX ||
    candidate.x > maxX ||
    candidate.y < minY ||
    candidate.y > maxY
  ) {
    return false;
  }

  const cross = Math.abs((b.x - a.x) * (candidate.y - a.y) - (b.y - a.y) * (candidate.x - a.x));
  const segmentLength = distanceBetween(a, b);
  if (segmentLength < 1e-6) {
    return false;
  }

  return cross / segmentLength <= tolerance;
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
  const candidate = p(x, y);

  if (!pointOnSegment(candidate, p1, p2) || !pointOnSegment(candidate, p3, p4)) {
    return null;
  }

  return candidate;
};

const clamp = (value: number, min: number, max: number): number => {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
};

const normalizeFrontShoulderDartPosition = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0.5;
  }

  const normalized = value > 1 ? value / 100 : value;
  return clamp(normalized, 0, 1);
};

const rotatePoint = (
  point: DraftPoint,
  pivot: DraftPoint,
  angleRadians: number,
): DraftPoint => {
  const cosA = Math.cos(angleRadians);
  const sinA = Math.sin(angleRadians);
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  return p(
    pivot.x + (dx * cosA) - (dy * sinA),
    pivot.y + (dx * sinA) + (dy * cosA),
  );
};

const intersectParallelWithSegment = (
  origin: DraftPoint,
  direction: DraftPoint,
  segmentStart: DraftPoint,
  segmentEnd: DraftPoint,
): DraftPoint | null => {
  const segDirection = {
    x: segmentEnd.x - segmentStart.x,
    y: segmentEnd.y - segmentStart.y,
  };

  const denom = direction.x * segDirection.y - direction.y * segDirection.x;
  if (Math.abs(denom) < 1e-6) {
    return null;
  }

  const diff = {
    x: segmentStart.x - origin.x,
    y: segmentStart.y - origin.y,
  };

  const t = (diff.x * segDirection.y - diff.y * segDirection.x) / denom;
  const u = (diff.x * direction.y - diff.y * direction.x) / denom;
  if (u < -0.01 || u > 1.01) {
    return null;
  }

  return p(origin.x + direction.x * t, origin.y + direction.y * t);
};

const intersectSegmentAtY = (
  a: DraftPoint,
  b: DraftPoint,
  targetY: number,
): DraftPoint | null => {
  const dy = b.y - a.y;
  if (Math.abs(dy) < 1e-6) {
    return null;
  }

  const t = (targetY - a.y) / dy;
  if (t < 0 || t > 1) {
    return null;
  }

  return p(a.x + (b.x - a.x) * t, targetY);
};

const normalizeFitIndex = (value: number): number => {
  if (!Number.isFinite(value)) {
    return DEFAULT_BASE_MEASUREMENTS.FitIndex;
  }

  const rounded = Math.round(value);
  if (rounded < 0) {
    return 0;
  }
  if (rounded >= FIT_PROFILES.length) {
    return FIT_PROFILES.length - 1;
  }
  return rounded;
};

const bezierPoint = (
  t: number,
  p0: DraftPoint,
  p1: DraftPoint,
  p2: DraftPoint,
  p3: DraftPoint,
): DraftPoint => {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const a = mt2 * mt;
  const b = 3 * mt2 * t;
  const c = 3 * mt * t2;
  const d = t * t2;

  return p(
    a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  );
};

const bezierDerivative = (
  t: number,
  p0: DraftPoint,
  p1: DraftPoint,
  p2: DraftPoint,
  p3: DraftPoint,
): DraftPoint => {
  const mt = 1 - t;
  return p(
    3 * mt * mt * (p1.x - p0.x) + 6 * mt * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    3 * mt * mt * (p1.y - p0.y) + 6 * mt * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  );
};

const buildBulgedCubicControls = (
  start: DraftPoint,
  end: DraftPoint,
  bulgeCm: number,
): CubicControls => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  let nx = 0;
  let ny = 0;
  if (length > 0) {
    // Match Illustrator's handle orientation from drawCurveBetween(), which is computed
    // in artboard coordinates (y-up). In our scene coordinates (y-down), this normal is flipped.
    nx = dy / length;
    ny = -dx / length;
  }

  return {
    c1: p(start.x + dx / 3 + nx * bulgeCm, start.y + dy / 3 + ny * bulgeCm),
    c2: p(end.x - dx / 3 + nx * bulgeCm, end.y - dy / 3 + ny * bulgeCm),
  };
};

const buildFrontArmholeControls = (
  shoulderTip: DraftPoint,
  bustPoint: DraftPoint,
  guidePoint: DraftPoint,
  shoulderBase: DraftPoint,
  point14: DraftPoint,
): CubicControls | null => {
  const dir1214 = {
    x: point14.x - bustPoint.x,
    y: point14.y - bustPoint.y,
  };
  const dir1214Length = Math.sqrt(dir1214.x * dir1214.x + dir1214.y * dir1214.y);
  if (dir1214Length < 1e-6) {
    return null;
  }

  const dir1214Norm = {
    x: dir1214.x / dir1214Length,
    y: dir1214.y / dir1214Length,
  };

  const shoulderVector = {
    x: shoulderTip.x - shoulderBase.x,
    y: shoulderTip.y - shoulderBase.y,
  };
  const bustVector = {
    x: bustPoint.x - shoulderTip.x,
    y: bustPoint.y - shoulderTip.y,
  };

  let perp = {
    x: -shoulderVector.y,
    y: shoulderVector.x,
  };

  if (Math.sqrt(perp.x * perp.x + perp.y * perp.y) < 1e-6) {
    perp = {
      x: -bustVector.y,
      y: bustVector.x,
    };
  }

  if ((perp.x * (guidePoint.x - shoulderTip.x)) + (perp.y * (guidePoint.y - shoulderTip.y)) < 0) {
    perp.x *= -1;
    perp.y *= -1;
  }

  const perpLength = Math.sqrt(perp.x * perp.x + perp.y * perp.y) || 1;
  perp.x /= perpLength;
  perp.y /= perpLength;

  const shoulderHandleLength = Math.max(Math.sqrt(bustVector.x * bustVector.x + bustVector.y * bustVector.y) * 0.45, 1.2);
  const shoulderHandle = {
    x: perp.x * shoulderHandleLength,
    y: perp.y * shoulderHandleLength,
  };

  let handleLength = Math.max(dir1214Length * 0.5, 0.5);
  let tSolve = 0.5;

  const p0 = shoulderTip;
  const p1 = p(shoulderTip.x + shoulderHandle.x, shoulderTip.y + shoulderHandle.y);
  const p3 = bustPoint;

  for (let iteration = 0; iteration < 25; iteration += 1) {
    const p2 = p(p3.x + dir1214Norm.x * handleLength, p3.y + dir1214Norm.y * handleLength);
    const current = bezierPoint(tSolve, p0, p1, p2, p3);
    const diff = {
      x: current.x - guidePoint.x,
      y: current.y - guidePoint.y,
    };

    if (Math.abs(diff.x) < 0.0005 && Math.abs(diff.y) < 0.0005) {
      break;
    }

    const dBdt = bezierDerivative(tSolve, p0, p1, p2, p3);
    const coeff = 3 * (1 - tSolve) * tSolve * tSolve;
    const dBdL = {
      x: dir1214Norm.x * coeff,
      y: dir1214Norm.y * coeff,
    };

    const determinant = dBdt.x * dBdL.y - dBdt.y * dBdL.x;
    if (Math.abs(determinant) < 1e-6) {
      break;
    }

    const deltaT = (-diff.x * dBdL.y + dBdL.x * diff.y) / determinant;
    const deltaL = (-dBdt.x * diff.y + dBdt.y * diff.x) / determinant;

    tSolve += deltaT;
    handleLength += deltaL;

    if (tSolve < 0.05) tSolve = 0.05;
    if (tSolve > 0.95) tSolve = 0.95;
    if (handleLength < 0.05) handleLength = 0.05;
  }

  return {
    c1: p1,
    c2: p(p3.x + dir1214Norm.x * handleLength, p3.y + dir1214Norm.y * handleLength),
  };
};

type BackArmholeCurve = {
  startHandle: DraftPoint;
  midIncoming: DraftPoint;
  midOutgoing: DraftPoint;
  endIncoming: DraftPoint;
};

const buildBackArmholeHandles = (
  startAnchor: DraftPoint,
  midAnchor: DraftPoint,
  guidePoint: DraftPoint,
  endAnchor: DraftPoint,
  guideLinePoint: DraftPoint,
): BackArmholeCurve | null => {
  const makeVector = (a: DraftPoint, b: DraftPoint) => ({
    x: b.x - a.x,
    y: b.y - a.y,
  });

  const normalize = (vector: { x: number; y: number }) => {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length < 1e-6) {
      return { x: 0, y: 0 };
    }
    return { x: vector.x / length, y: vector.y / length };
  };

  const startToMid = makeVector(startAnchor, midAnchor);
  const startLength = Math.sqrt(startToMid.x * startToMid.x + startToMid.y * startToMid.y);
  if (startLength < 1e-6) {
    return null;
  }

  const startDirection = normalize(startToMid);
  let startHandleLength = Math.min(startLength * 0.35, 5);
  if (startHandleLength < 0.5) {
    startHandleLength = 0.5;
  }

  const startHandle = p(
    startAnchor.x + startDirection.x * startHandleLength,
    startAnchor.y + startDirection.y * startHandleLength,
  );

  let verticalDrop = Math.abs(guidePoint.y - midAnchor.y);
  if (verticalDrop < 0.5) {
    verticalDrop = 0.5;
  }

  const midDown = p(midAnchor.x, midAnchor.y + verticalDrop);
  const midOutgoing = p(guidePoint.x + 1, midDown.y);
  const midIncoming = p(
    midAnchor.x - (midOutgoing.x - midAnchor.x),
    midAnchor.y - (midOutgoing.y - midAnchor.y),
  );

  let lineDirection = makeVector(endAnchor, guideLinePoint);
  const lineDirectionLength = Math.sqrt(
    lineDirection.x * lineDirection.x + lineDirection.y * lineDirection.y,
  );
  if (lineDirectionLength < 1e-6) {
    lineDirection = makeVector(endAnchor, midAnchor);
  }

  lineDirection = normalize(lineDirection);

  let handleLengthEnd = Math.sqrt(
    (guidePoint.x - endAnchor.x) * (guidePoint.x - endAnchor.x) +
      (guidePoint.y - endAnchor.y) * (guidePoint.y - endAnchor.y),
  );
  if (handleLengthEnd < 0.5) {
    handleLengthEnd = 0.5;
  }

  let tSolve = 0.5;
  const p0 = midAnchor;
  const p1 = midOutgoing;
  const p3 = endAnchor;

  for (let iteration = 0; iteration < 30; iteration += 1) {
    const p2 = p(p3.x + lineDirection.x * handleLengthEnd, p3.y + lineDirection.y * handleLengthEnd);
    const current = bezierPoint(tSolve, p0, p1, p2, p3);
    const diff = {
      x: current.x - guidePoint.x,
      y: current.y - guidePoint.y,
    };

    if (Math.abs(diff.x) < 0.0003 && Math.abs(diff.y) < 0.0003) {
      break;
    }

    const dBdt = bezierDerivative(tSolve, p0, p1, p2, p3);
    const coeff = 3 * (1 - tSolve) * tSolve * tSolve;
    const dBdL = {
      x: lineDirection.x * coeff,
      y: lineDirection.y * coeff,
    };

    const determinant = dBdt.x * dBdL.y - dBdt.y * dBdL.x;
    if (Math.abs(determinant) < 1e-8) {
      break;
    }

    const deltaT = (-diff.x * dBdL.y + dBdL.x * diff.y) / determinant;
    const deltaL = (-dBdt.x * diff.y + dBdt.y * diff.x) / determinant;

    tSolve += deltaT;
    handleLengthEnd += deltaL;

    if (tSolve < 0.05) tSolve = 0.05;
    if (tSolve > 0.95) tSolve = 0.95;
    if (handleLengthEnd < 0.05) handleLengthEnd = 0.05;
  }

  const endIncoming = p(
    endAnchor.x + lineDirection.x * handleLengthEnd,
    endAnchor.y + lineDirection.y * handleLengthEnd,
  );

  return {
    startHandle,
    midIncoming,
    midOutgoing,
    endIncoming,
  };
};

const getBounds = (tracked: DraftPoint[]): PatternBounds => {
  if (!tracked.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = tracked[0].x;
  let minY = tracked[0].y;
  let maxX = tracked[0].x;
  let maxY = tracked[0].y;

  for (const point of tracked) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  return {
    minX: round2(minX),
    minY: round2(minY),
    maxX: round2(maxX),
    maxY: round2(maxY),
  };
};

export const getFitProfiles = (): readonly FitProfile[] => FIT_PROFILES;

export const getDefaultBaseMeasurements = (): HofenbitzerCasualShapingBaseMeasurements => ({
  ...DEFAULT_BASE_MEASUREMENTS,
});

export const applyFitProfile = (
  base: HofenbitzerCasualShapingBaseMeasurements,
  fitIndex: number,
): HofenbitzerCasualShapingBaseMeasurements => {
  const normalized = normalizeFitIndex(fitIndex);
  const fit = FIT_PROFILES[normalized];

  return {
    ...base,
    FitIndex: normalized,
    AhDEase: fit.ease.AhDEase,
    BrCEase: fit.ease.BrCEase,
    WaCEase: fit.ease.WaCEase,
    HiCEase: fit.ease.HiCEase,
    BGEase: fit.ease.BGEase,
    AGEase: fit.ease.AGEase,
    BrGEase: fit.ease.BrGEase,
    ShGEase: fit.ease.ShGEase,
  };
};

export const computeDerived = (
  measurements: HofenbitzerCasualShapingBaseMeasurements,
): HofenbitzerCasualShapingDerivedValues => {
  const AhDPlus = measurements.AhD + measurements.AhDEase;
  const BrCFinal = measurements.BrC + measurements.BrCEase;
  const WaCFinal = measurements.WaC + measurements.WaCEase;
  const HiCFinal = measurements.HiC + measurements.HiCEase;

  const BGPlus = measurements.BG + measurements.BGEase;
  const AGPlus = measurements.AG + measurements.AGEase;
  const BrGPlus = measurements.BrG + measurements.BrGEase;
  const fShS = measurements.ShG + measurements.ShGEase;
  const bShS = fShS + BACK_SHOULDER_EASE_CM;

  const BrW = BrCFinal / 2;
  const WaW = WaCFinal / 2;
  const HiW = HiCFinal / 2;

  const BLFinal = measurements.BL + measurements.BLBal;
  const FLFinal = measurements.FL + measurements.FLBal;
  const individualBalance = measurements.FL - measurements.BL;
  const finalBalance = FLFinal - BLFinal;

  return {
    AhDPlus: round2(AhDPlus),
    BrCFinal: round2(BrCFinal),
    WaCFinal: round2(WaCFinal),
    HiCFinal: round2(HiCFinal),
    BGPlus: round2(BGPlus),
    AGPlus: round2(AGPlus),
    BrGPlus: round2(BrGPlus),
    fShS: round2(fShS),
    bShS: round2(bShS),
    BrW: round2(BrW),
    WaW: round2(WaW),
    HiW: round2(HiW),
    BLFinal: round2(BLFinal),
    FLFinal: round2(FLFinal),
    individualBalance: round2(individualBalance),
    finalBalance: round2(finalBalance),
    frontShoulderAngle: round2(measurements.ShA - measurements.ShoulderDifference),
    backShoulderAngle: round2(measurements.ShA + measurements.ShoulderDifference),
  };
};

export const buildScene = (
  measurements: HofenbitzerCasualShapingEffectiveMeasurements,
): PatternScene => {
  const points: PatternScene["points"] = {};
  const markers: PatternScene["markers"] = [];
  const labels: PatternScene["labels"] = [];
  const paths: PatternScene["paths"] = [];
  const tracked: DraftPoint[] = [];

  const track = (...items: DraftPoint[]) => {
    for (const item of items) {
      tracked.push(item);
    }
  };

  const registerPoint = (id: string, point: DraftPoint): DraftPoint => {
    const next = p(point.x, point.y);
    points[id] = out(next);
    markers.push({
      id: `marker-${id}`,
      x: round2(next.x),
      y: round2(next.y),
      r: 0.45,
      color: "currentColor",
      text: id,
    });
    track(next);
    return next;
  };

  const pushPath = (
    id: string,
    d: string,
    options?: {
      dashed?: boolean;
      kind?: PatternPath["kind"];
      strokeWidth?: number;
    },
  ) => {
    if (!d) {
      return;
    }

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
      dashed?: boolean;
      kind?: PatternPath["kind"];
      strokeWidth?: number;
    },
  ) => {
    track(start, end);
    pushPath(id, linePath(start, end), options);
  };

  const addPolyline = (
    id: string,
    pointsList: DraftPoint[],
    options?: {
      dashed?: boolean;
      kind?: PatternPath["kind"];
      strokeWidth?: number;
    },
  ) => {
    if (pointsList.length < 2) {
      return;
    }
    track(...pointsList);
    pushPath(id, linePath(...pointsList), options);
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
    pushPath(id, cubicPath(start, c1, c2, end), options);
  };

  const addBulgedCurve = (
    id: string,
    start: DraftPoint,
    end: DraftPoint,
    bulgeCm: number,
    options?: {
      flattenStart?: boolean;
      flattenEnd?: boolean;
      kind?: PatternPath["kind"];
      strokeWidth?: number;
    },
  ) => {
    const controls = buildBulgedCubicControls(start, end, bulgeCm);
    if (options?.flattenStart) {
      controls.c1 = p(start.x, start.y);
    }
    if (options?.flattenEnd) {
      controls.c2 = p(end.x, end.y);
    }

    addCubic(id, start, controls.c1, controls.c2, end, {
      kind: options?.kind,
      strokeWidth: options?.strokeWidth,
    });
  };

  const waistShaping = clamp(
    Number.isFinite(measurements.WaistShaping)
      ? measurements.WaistShaping
      : DEFAULT_BASE_MEASUREMENTS.WaistShaping,
    0.5,
    1.5,
  );
  const frontShoulderDartPosition = normalizeFrontShoulderDartPosition(
    measurements.FrontShoulderDartPosition,
  );

  const point1 = registerPoint("1", p(RIGHT_BOUNDARY_CM - 10, TOP_BOUNDARY_CM + 10));

  const point1aOffset = measurements.NeG + 0.5;
  const point1a = registerPoint("1a", p(point1.x - point1aOffset, point1.y));
  const point1aExtension = p(point1a.x - 10, point1a.y);

  addLine("line-1-1a", point1, point1a, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("line-1a-extension", point1a, point1aExtension, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const point2 = registerPoint("2", p(point1.x, point1.y + measurements.NeG / 3 + 1));

  const backNeckBulge = -Math.max(0.5, (measurements.NeG + 0.5) / 3);
  const backNeckControls = buildBulgedCubicControls(point1a, point2, backNeckBulge);
  const backHandleLength = Math.max(MIN_HANDLE_LENGTH_CM, measurements.NeG / 2);
  backNeckControls.c2 = p(point2.x - backHandleLength, point2.y);
  addCubic("back-neck-curve", point1a, backNeckControls.c1, backNeckControls.c2, point2, {
    kind: "pattern",
    strokeWidth: 0.26,
  });

  const point3 = registerPoint("3", p(point2.x, point2.y + measurements.MoL));
  const point4 = registerPoint("4", p(point2.x, point2.y + measurements.AhDPlus));
  const point5 = registerPoint("5", p(point2.x, point2.y + measurements.BLFinal));
  const point6 = registerPoint("6", p(point5.x, point5.y + measurements.HiD));
  const point6a = registerPoint("6a", p(point6.x - HIP_LEFT_OFFSET_CM, point6.y));

  const point9 = registerPoint("9", extendLineToY(point2, point6a, point4.y));
  const point7 = registerPoint("7", extendLineToY(point2, point6a, point5.y));
  const point8Base = extendLineToY(point2, point6a, point3.y);

  const point10 = registerPoint("10", p(point9.x - measurements.BGPlus, point4.y));
  const point11 = registerPoint("11", p(point10.x - (measurements.AGPlus * 2) / 3, point10.y));
  const point12 = registerPoint("12", p(point11.x - 10, point11.y));
  const point13 = registerPoint("13", p(point12.x - measurements.AGPlus / 3, point12.y));
  const point13a = registerPoint("13a", p(point13.x, point13.y - measurements.AGPlus / 4));
  const point14 = registerPoint("14", p(point13.x - measurements.BrGPlus, point13.y));

  let backShoulderEndOriginal: DraftPoint | null = null;
  let backShoulderEndForDart: DraftPoint | null = null;
  let point16Original: DraftPoint | null = null;
  let point16ForDart: DraftPoint | null = null;
  let point17: DraftPoint | null = null;
  let point17Guide: DraftPoint | null = null;
  let point17a: DraftPoint | null = null;
  let point17b: DraftPoint | null = null;
  let point17c: DraftPoint | null = null;
  let point18: DraftPoint | null = null;
  let point32: DraftPoint | null = null;
  let point34: DraftPoint | null = null;
  let point35Original: DraftPoint | null = null;
  let point35ForDart: DraftPoint | null = null;

  if (measurements.bShS > 0) {
    const frontShoulderRadians = (measurements.frontShoulderAngle * Math.PI) / 180;
    const frontShoulderEnd = p(
      point1a.x - Math.cos(frontShoulderRadians) * measurements.bShS,
      point1a.y + Math.sin(frontShoulderRadians) * measurements.bShS,
    );

    const backShoulderRadians = (measurements.backShoulderAngle * Math.PI) / 180;
    const dirX = -Math.cos(backShoulderRadians);
    const dirY = Math.sin(backShoulderRadians);

    let effectiveLength = measurements.bShS;
    let tIntersect: number | null = null;

    if (Math.abs(dirX) > 0.0001) {
      const candidateT = (point10.x - point1a.x) / dirX;
      if (candidateT >= 0) {
        tIntersect = candidateT;
      }
    } else if (Math.abs(point10.x - point1a.x) < 0.0001) {
      tIntersect = 0;
    }

    if (tIntersect !== null && tIntersect > effectiveLength) {
      effectiveLength = tIntersect;
    }

    backShoulderEndOriginal = p(
      point1a.x + dirX * effectiveLength,
      point1a.y + dirY * effectiveLength,
    );
    backShoulderEndForDart = backShoulderEndOriginal;
    addLine("back-shoulder-line", point1a, backShoulderEndOriginal, {
      kind: "construction",
      strokeWidth: 0.26,
    });

    if (tIntersect !== null) {
      point16Original = registerPoint("16", p(point10.x, point1a.y + dirY * tIntersect));
      point16ForDart = point16Original;
    }

    if (point16Original) {
      point17 = registerPoint(
        "17",
        p((point16Original.x + point10.x) / 2 - 1, (point16Original.y + point10.y) / 2),
      );
      const shoulderBladeEnd = p(point2.x, point17.y);
      addLine("shoulder-blade-line", point17, p(point2.x, point17.y), {
        dashed: true,
        kind: "construction",
        strokeWidth: 0.18,
      });

      const point17GuideRaw = p(
        (point17.x + point10.x) / 2 - 1.5,
        (point17.y + point10.y) / 2,
      );
      point17Guide = point17GuideRaw;

      const halfBackShoulderDart = BACK_SHOULDER_DART_INTAKE_CM / 2;
      point17a = registerPoint("17a", p(point17.x, point17.y - halfBackShoulderDart));
      point17c = registerPoint("17c", p(point17.x, point17.y + halfBackShoulderDart));

      addLine("armhole-dart-cap", point17a, point17c, {
        dashed: true,
        kind: "construction",
        strokeWidth: 0.18,
      });

      point34 = registerPoint(
        "34",
        p((point17.x + shoulderBladeEnd.x) / 2, (point17.y + shoulderBladeEnd.y) / 2),
      );

      addLine("armhole-dart-leg-17a-34", point17a, point34, {
        kind: "construction",
        strokeWidth: 0.24,
      });
      addLine("armhole-dart-leg-17c-34", point17c, point34, {
        kind: "construction",
        strokeWidth: 0.24,
      });

      if (backShoulderEndOriginal && point34) {
        let dir28 = {
          x: point8Base.x - point2.x,
          y: point8Base.y - point2.y,
        };
        const dir28Length = Math.sqrt(dir28.x * dir28.x + dir28.y * dir28.y);
        if (dir28Length > 1e-6) {
          dir28 = {
            x: dir28.x / dir28Length,
            y: dir28.y / dir28Length,
          };
          const point35Hit =
            intersectParallelWithSegment(point34, p(dir28.x, dir28.y), point1a, backShoulderEndOriginal) ??
            intersectParallelWithSegment(point34, p(-dir28.x, -dir28.y), point1a, backShoulderEndOriginal);
          if (point35Hit) {
            point35Original = registerPoint("35", point35Hit);
            addLine("back-shoulder-dart-leg", point34, point35Original, {
              kind: "construction",
              strokeWidth: 0.24,
            });
          }
        }
      }

      if (point34) {
        let backShoulderDartRotation = 0;
        const angleStart = Math.atan2(point17a.y - point34.y, point17a.x - point34.x);
        const angleEnd = Math.atan2(point17c.y - point34.y, point17c.x - point34.x);
        if (Number.isFinite(angleStart) && Number.isFinite(angleEnd)) {
          backShoulderDartRotation = angleEnd - angleStart;
          while (backShoulderDartRotation > Math.PI) backShoulderDartRotation -= Math.PI * 2;
          while (backShoulderDartRotation < -Math.PI) backShoulderDartRotation += Math.PI * 2;
        }

        point17b = registerPoint(
          "17b",
          rotatePoint(point17a, point34, backShoulderDartRotation),
        );
        point17Guide = rotatePoint(point17GuideRaw, point34, backShoulderDartRotation);

        if (point35Original) {
          point35ForDart = rotatePoint(point35Original, point34, backShoulderDartRotation);
        }
        if (point16Original) {
          point16ForDart = rotatePoint(point16Original, point34, backShoulderDartRotation);
        }
        if (backShoulderEndOriginal) {
          backShoulderEndForDart = rotatePoint(
            backShoulderEndOriginal,
            point34,
            backShoulderDartRotation,
          );
        }
      }

      if (
        point17b &&
        point34 &&
        point35ForDart &&
        point16ForDart &&
        backShoulderEndForDart
      ) {
        addPolyline(
          "back-shoulder-dart",
          [point17b, point34, point35ForDart, point16ForDart, backShoulderEndForDart, point17b],
          {
            kind: "construction",
            strokeWidth: 0.24,
          },
        );
      }

      const point18BaseY = point17Guide ? point17Guide.y : point17.y;
      point18 = registerPoint("18", p(point13.x, point18BaseY));
      addLine("line-17-guide-18", point17Guide ?? point17, point18, {
        dashed: true,
        kind: "construction",
        strokeWidth: 0.18,
      });

      const point32Offset = measurements.BrCFinal / 20 + 1;
      if (Number.isFinite(point32Offset)) {
        point32 = registerPoint("32", p(point18.x + point32Offset, point18.y));
        addLine("shoulder-dart-guide-line", point32, p(point32.x, point32.y - 10), {
          dashed: true,
          kind: "construction",
          strokeWidth: 0.18,
        });
      }
      track(frontShoulderEnd);
    }
  }

  const topLineY = point1.y;
  const bustLineY = point4.y;
  const waistLineY = point5.y;
  const hipLineY = point6.y;
  const hemLineY = point3.y;

  let backDiagVec: DraftPoint | null = {
    x: point6a.x - point2.x,
    y: point6a.y - point2.y,
  };

  let point25: DraftPoint | null = null;
  if (Math.abs(backDiagVec.x) > 0.0001 || Math.abs(backDiagVec.y) > 0.0001) {
    point25 = registerPoint(
      "25",
      extendLineToY(
        point11,
        p(point11.x + backDiagVec.x, point11.y + backDiagVec.y),
        hemLineY,
      ),
    );
    addLine("provisional-back-side-line", point11, point25, {
      dashed: true,
      kind: "construction",
      strokeWidth: 0.18,
    });
  } else {
    backDiagVec = null;
  }

  const point26 = registerPoint("26", p(point11.x, hipLineY));
  const point27 = registerPoint("27", p(point12.x, hipLineY));
  const point19a = registerPoint("19a", p(point14.x, hipLineY));
  const point19 = registerPoint("19", p(point14.x, waistLineY));

  let point28: DraftPoint;
  if (backDiagVec) {
    point28 = extendLineToY(
      point11,
      p(point11.x + backDiagVec.x, point11.y + backDiagVec.y),
      hipLineY,
    );
  } else {
    point28 = p(point11.x, hipLineY);
  }
  point28 = registerPoint("28", point28);

  const hipSpanBack = distanceBetween(point6a, point26);
  const hipSpanFront = distanceBetween(point19a, point27);
  const hiG = hipSpanBack + hipSpanFront;
  const hipShortage = hiG - measurements.HiW;
  const halfHipShortageMagnitude = Math.abs(hipShortage / 2);

  const point29 = registerPoint("29", p(point27.x + halfHipShortageMagnitude, hipLineY));
  const point30 = registerPoint("30", p(point28.x - halfHipShortageMagnitude, hipLineY));

  const point29Waist = extendLineToY(point12, point29, waistLineY);
  const point30Waist = extendLineToY(point11, point30, waistLineY);
  const point30Hem = extendLineToY(point11, point30, hemLineY);

  addLine("new-back-side-line", point11, point30Hem, {
    kind: "construction",
    strokeWidth: 0.26,
  });

  const perpendicularFootOnBackDiagonal = (source: DraftPoint): DraftPoint | null => {
    const diagX = point6a.x - point2.x;
    const diagY = point6a.y - point2.y;
    const diagLengthSq = diagX * diagX + diagY * diagY;
    if (diagLengthSq < 1e-6) {
      return null;
    }

    const t = ((source.x - point2.x) * diagX + (source.y - point2.y) * diagY) / diagLengthSq;
    return p(point2.x + diagX * t, point2.y + diagY * t);
  };

  let hipLinePoint6a = perpendicularFootOnBackDiagonal(point30);
  if (!hipLinePoint6a) {
    hipLinePoint6a = p(point6a.x, hipLineY);
  }

  addLine("new-back-hip-line", point30, hipLinePoint6a, {
    kind: "construction",
    strokeWidth: 0.26,
  });

  const hemConnectorEnd = perpendicularFootOnBackDiagonal(point30Hem);
  let point8 = point8Base;
  if (hemConnectorEnd) {
    point8 = p(hemConnectorEnd.x, hemConnectorEnd.y);
    addLine("new-back-hem-line", point30Hem, hemConnectorEnd, {
      kind: "pattern",
      strokeWidth: 0.26,
    });
  }

  const waistConnectorEnd = perpendicularFootOnBackDiagonal(point30Waist);
  if (waistConnectorEnd) {
    addLine("new-back-waist-line", point30Waist, waistConnectorEnd, {
      kind: "construction",
      strokeWidth: 0.26,
    });
  }

  point8 = registerPoint("8", point8);

  addLine("new-centre-back-cb", point2, point8, {
    kind: "pattern",
    strokeWidth: 0.26,
  });

  const point29Hem = extendLineToY(point12, point29, hemLineY);
  addLine("new-front-side-line", point12, point29Hem, {
    kind: "construction",
    strokeWidth: 0.26,
  });

  let point36: DraftPoint | null = null;
  let point37: DraftPoint | null = null;
  let point38: DraftPoint | null = null;
  let point39: DraftPoint | null = null;
  let point38CurveEnd: DraftPoint | null = null;
  let point39CurveEnd: DraftPoint | null = null;

  if (point30Waist) {
    point36 = registerPoint("36", p(point30Waist.x, point30Waist.y - 1));
    point38 = registerPoint("38", p(point36.x + waistShaping, point36.y));
    point38CurveEnd = p(
      point30Waist.x + (point30.x - point30Waist.x) * (2 / 3),
      point30Waist.y + (point30.y - point30Waist.y) * (2 / 3),
    );

    const bulgeBase38 = Math.max(0.2, Math.abs(waistShaping) * 0.45);
    const outwardSign38 = point38.x - point30Waist.x >= 0 ? 1 : -1;
    addBulgedCurve(
      "lower-back-side-curve",
      point38,
      point38CurveEnd,
      -bulgeBase38 * outwardSign38,
      {
        flattenEnd: true,
        kind: "pattern",
        strokeWidth: 0.26,
      },
    );

    addLine("upper-back-side-line", point11, point38, {
      kind: "pattern",
      strokeWidth: 0.26,
    });
  }

  if (point29Waist) {
    point37 = registerPoint("37", p(point29Waist.x, point29Waist.y - 1));
    point39 = registerPoint("39", p(point37.x - waistShaping, point37.y));
    point39CurveEnd = p(
      point29Waist.x + (point29.x - point29Waist.x) * (2 / 3),
      point29Waist.y + (point29.y - point29Waist.y) * (2 / 3),
    );

    const bulgeBase39 = Math.max(0.2, Math.abs(waistShaping) * 0.45);
    const outwardSign39 = point39.x - point29Waist.x >= 0 ? 1 : -1;
    addBulgedCurve(
      "lower-front-side-curve",
      point39,
      point39CurveEnd,
      -bulgeBase39 * outwardSign39,
      {
        flattenEnd: true,
        kind: "pattern",
        strokeWidth: 0.26,
      },
    );

    addLine("upper-front-side-line", point12, point39, {
      kind: "pattern",
      strokeWidth: 0.26,
    });
  }

  const point20Offset = Math.max(0, measurements.FLFinal - 1);
  const point20 = registerPoint("20", p(point19.x, point19.y - point20Offset));
  const point20a = registerPoint("20a", p(point20.x + measurements.NeG, point20.y));
  const point23Offset = Math.max(0, measurements.NeG + 0.5);
  const point23 = registerPoint("23", p(point20.x, point20.y + point23Offset));

  const point20Guide = p(point20.x + 20, point20.y);
  addLine("line-20-guide", point20, point20Guide, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const frontNeckBulge = Math.max(MIN_HANDLE_LENGTH_CM, measurements.NeG / 2);
  const frontNeckControls = buildBulgedCubicControls(point20a, point23, frontNeckBulge);
  const frontHandleLength = Math.max(MIN_HANDLE_LENGTH_CM, measurements.NeG / 2);
  frontNeckControls.c2 = p(point23.x + frontHandleLength, point23.y);
  addCubic("front-neck-curve", point20a, frontNeckControls.c1, frontNeckControls.c2, point23, {
    kind: "pattern",
    strokeWidth: 0.26,
  });

  let point24: DraftPoint | null = null;
  if (measurements.fShS > 0) {
    const frontShoulderRadians = (measurements.frontShoulderAngle * Math.PI) / 180;
    point24 = registerPoint(
      "24",
      p(
        point20a.x + Math.cos(frontShoulderRadians) * measurements.fShS,
        point20a.y + Math.sin(frontShoulderRadians) * measurements.fShS,
      ),
    );
  }

  const point21Offset = Math.max(0, measurements.BrD - 1);
  const point21 = registerPoint("21", p(point20.x, point20.y + point21Offset));
  const dartOffset = Math.max(0, measurements.BrGPlus / 2 - 0.3);
  const point22 = registerPoint("22", p(point21.x + dartOffset, point21.y));

  addLine("bust-distance", point21, point22, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  let frontDartTopY = point20.y;
  if (point24) {
    const shoulderDX = point24.x - point20a.x;
    if (Math.abs(shoulderDX) > 0.0001) {
      const t = (point22.x - point20a.x) / shoulderDX;
      if (t >= 0 && t <= 1) {
        frontDartTopY = point20a.y + (point24.y - point20a.y) * t;
      }
    }
  }

  const point31 = registerPoint("31", p(point22.x, frontDartTopY));
  addLine("front-shoulder-line", point20a, point31, {
    kind: "pattern",
    strokeWidth: 0.26,
  });

  let trianglePoint31 = point31;
  let point33: DraftPoint | null = point24;
  if (point22 && point24 && point31 && point32) {
    const targetX = point13.x + (point32.x - point13.x) * frontShoulderDartPosition;
    const relX = point24.x - point22.x;
    const relY = point24.y - point22.y;
    const radius = Math.sqrt(relX * relX + relY * relY);

    if (radius > 1e-6) {
      let desiredCos = (targetX - point22.x) / radius;
      desiredCos = clamp(desiredCos, -1, 1);
      const baseAngle = Math.atan2(relY, relX);
      const acosValue = Math.acos(desiredCos);

      if (Number.isFinite(acosValue)) {
        const candidateAngles = [acosValue, -acosValue];
        let bestRotation: number | null = null;
        let bestDiff = Number.POSITIVE_INFINITY;
        let bestShoulder: DraftPoint | null = null;

        for (const targetAngle of candidateAngles) {
          const rotationCandidate = targetAngle - baseAngle;
          const rotatedCandidate = rotatePoint(point24, point22, rotationCandidate);
          const diffX = Math.abs(rotatedCandidate.x - targetX);

          if (
            bestRotation === null ||
            diffX < bestDiff - 1e-6 ||
            (Math.abs(diffX - bestDiff) <= 1e-6 && Math.abs(rotationCandidate) < Math.abs(bestRotation))
          ) {
            bestRotation = rotationCandidate;
            bestDiff = diffX;
            bestShoulder = rotatedCandidate;
          }
        }

        if (bestRotation !== null && bestShoulder) {
          point33 = bestShoulder;
          trianglePoint31 = rotatePoint(point31, point22, bestRotation);
        }
      }
    }
  }

  if (point33) {
    point33 = registerPoint("33", point33);
    addPolyline("front-shoulder-dart-triangle", [trianglePoint31, point22, point33, trianglePoint31], {
      kind: "construction",
      strokeWidth: 0.24,
    });
  }

  if (point33 && point18) {
    const vec12to13 = {
      x: point13.x - point12.x,
      y: point13.y - point12.y,
    };
    const len12to13 = Math.sqrt(vec12to13.x * vec12to13.x + vec12to13.y * vec12to13.y);
    if (len12to13 > 1e-6) {
      const unit12to13 = {
        x: vec12to13.x / len12to13,
        y: vec12to13.y / len12to13,
      };

      const handleFrom12 = p(
        point13.x + unit12to13.x * FRONT_ARMHOLE_START_HANDLE_CM,
        point13.y + unit12to13.y * FRONT_ARMHOLE_START_HANDLE_CM,
      );
      const endHandle = p(point18.x - 0.3, point18.y + 0.3);
      addCubic("front-armhole-curve", point12, handleFrom12, endHandle, point33, {
        kind: "pattern",
        strokeWidth: 0.26,
      });
    }
  } else if (point24) {
    const controls = buildFrontArmholeControls(point24, point12, point13a, point20a, point14);
    if (controls) {
      addCubic("front-armhole-curve", point24, controls.c1, controls.c2, point12, {
        kind: "pattern",
        strokeWidth: 0.26,
      });
    }
  }

  if ((point17b ?? point17) && (backShoulderEndForDart ?? backShoulderEndOriginal) && point17Guide) {
    const backMidAnchor = point17b ?? point17;
    const backStartAnchor = backShoulderEndForDart ?? backShoulderEndOriginal;
    if (backMidAnchor && backStartAnchor) {
      const backCurveHandles = buildBackArmholeHandles(
        backStartAnchor,
        backMidAnchor,
        point17Guide,
        point11,
        point4,
      );
      if (backCurveHandles) {
        addCubic(
          "back-armhole-curve",
          backMidAnchor,
          backCurveHandles.midOutgoing,
          backCurveHandles.endIncoming,
          point11,
          {
            kind: "pattern",
            strokeWidth: 0.26,
          },
        );
      }
    }
  }

  const frontDartBottom = p(point22.x, hemLineY);

  addLine(
    "centre-back-base",
    p(point2.x, topLineY),
    p(point2.x, hemLineY),
    {
      dashed: true,
      kind: "construction",
      strokeWidth: 0.18,
    },
  );
  addLine(
    "back-arm-line",
    p(point10.x, (point16ForDart ?? point2).y),
    p(point10.x, hipLineY),
    {
      dashed: true,
      kind: "construction",
      strokeWidth: 0.18,
    },
  );
  addLine("back-side-line", p(point11.x, point10.y), p(point11.x, hemLineY), {
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("front-side-line", p(point12.x, point12.y), p(point12.x, hemLineY), {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const frontArmLineTopY = Math.min(waistLineY, topLineY + 8);
  addLine("front-arm-line", p(point13.x, frontArmLineTopY), p(point13.x, waistLineY), {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  addLine("front-dart-line", point31, frontDartBottom, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  addLine("centre-front-cf-main", p(point14.x, point20.y), p(point14.x, hemLineY), {
    kind: "construction",
    strokeWidth: 0.26,
  });

  addLine("hem-line-base", p(point3.x, hemLineY), p(point14.x, hemLineY), {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("front-hem-line", point29Hem, p(point14.x, hemLineY), {
    kind: "pattern",
    strokeWidth: 0.26,
  });

  addLine("bust-line-base", p(point4.x, bustLineY), p(point14.x, bustLineY), {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  addLine("waist-line-base", p(point5.x, waistLineY), p(point14.x, waistLineY), {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  addLine("hip-line-base", p(point6.x, hipLineY), p(point14.x, hipLineY), {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  if (point33) {
    addLine("cleanup-front-shoulder-dart-left", trianglePoint31, point22, {
      kind: "cleanup",
      strokeWidth: 0.24,
    });
    addLine("cleanup-front-shoulder-dart-top", trianglePoint31, point33, {
      kind: "cleanup",
      strokeWidth: 0.24,
    });
  }

  addLine("cleanup-centre-front-cf", point23, p(point14.x, hemLineY), {
    kind: "cleanup",
    strokeWidth: 0.26,
  });

  if (point39CurveEnd && distanceBetween(point39CurveEnd, point29Hem) > 0.01) {
    addLine("cleanup-front-side-hem-connector", point29Hem, point39CurveEnd, {
      kind: "cleanup",
      strokeWidth: 0.26,
    });
  }

  if (point39 && point39CurveEnd) {
    const frontWaistTrim = intersectSegmentAtY(point39, point39CurveEnd, point7.y);
    if (frontWaistTrim) {
      addLine("cleanup-front-waist-line", p(point14.x, waistLineY), frontWaistTrim, {
        dashed: true,
        kind: "cleanup",
        strokeWidth: 0.18,
      });
    }
  }

  addLine("cleanup-front-hip-line", point19a, point29, {
    dashed: true,
    kind: "cleanup",
    strokeWidth: 0.18,
  });
  addLine("cleanup-front-9-11", point9, point11, {
    dashed: true,
    kind: "cleanup",
    strokeWidth: 0.18,
  });
  addLine("cleanup-front-14-12", point14, point12, {
    dashed: true,
    kind: "cleanup",
    strokeWidth: 0.18,
  });
  addLine("cleanup-bust-distance", point21, point22, {
    dashed: true,
    kind: "cleanup",
    strokeWidth: 0.18,
  });
  addLine("cleanup-front-dart-line", point22, frontDartBottom, {
    dashed: true,
    kind: "cleanup",
    strokeWidth: 0.18,
  });
  addLine("cleanup-front-dart-line-upper", point31, point22, {
    kind: "cleanup",
    strokeWidth: 0.24,
  });

  addLine("cleanup-back-hip-line", point30, hipLinePoint6a, {
    dashed: true,
    kind: "cleanup",
    strokeWidth: 0.18,
  });

  if (point38 && point38CurveEnd && waistConnectorEnd) {
    const backWaistTrim = intersectSegmentAtY(point38, point38CurveEnd, point7.y);
    if (backWaistTrim) {
      addLine("cleanup-back-waist-line", backWaistTrim, waistConnectorEnd, {
        dashed: true,
        kind: "cleanup",
        strokeWidth: 0.18,
      });
    }
  }

  if (point38CurveEnd && distanceBetween(point38CurveEnd, point30Hem) > 0.01) {
    addLine("cleanup-back-side-hem-connector", point38CurveEnd, point30Hem, {
      kind: "cleanup",
      strokeWidth: 0.26,
    });
  }

  if (point1a && backShoulderEndOriginal && point34 && point35Original) {
    const shoulderCut = lineIntersection(point1a, backShoulderEndOriginal, point34, point35Original);
    if (shoulderCut) {
      addLine("cleanup-back-shoulder-line-cut", shoulderCut, point1a, {
        kind: "cleanup",
        strokeWidth: 0.26,
      });
      addLine("cleanup-back-shoulder-dart-leg", point34, shoulderCut, {
        kind: "cleanup",
        strokeWidth: 0.24,
      });
    }
  }

  if (point34 && point35ForDart && point16ForDart && backShoulderEndForDart && point17b) {
    addPolyline(
      "cleanup-back-shoulder-dart-open",
      [point34, point35ForDart, point16ForDart, backShoulderEndForDart, point17b],
      {
        kind: "cleanup",
        strokeWidth: 0.24,
      },
    );
  }

  if (point17) {
    const cbIntersection =
      lineIntersection(point17, p(point2.x, point17.y), point2, point8) ??
      p(point2.x, point17.y);

    let bladeStart = point17;
    if (point34 && point35ForDart) {
      const bladeStartOnDart = intersectSegmentAtY(point34, point35ForDart, point17.y);
      if (bladeStartOnDart && bladeStartOnDart.x <= point17.x + 0.001) {
        bladeStart = bladeStartOnDart;
      }
    }

    addLine("cleanup-shoulder-blade-line", bladeStart, cbIntersection, {
      dashed: true,
      kind: "cleanup",
      strokeWidth: 0.18,
    });
  }

  labels.push(
    {
      id: "label-cb",
      text: `CB (2-8) ${fmt(distanceBetween(point2, point8))} cm`,
      x: round2(point2.x + 0.7),
      y: round2((point2.y + point8.y) / 2),
      color: "currentColor",
    },
    {
      id: "label-cf",
      text: `CF (23-hem) ${fmt(Math.abs(hemLineY - point23.y))} cm`,
      x: round2(point14.x + 0.7),
      y: round2((point23.y + hemLineY) / 2),
      color: "currentColor",
    },
    {
      id: "label-fit",
      text: `${FIT_PROFILES[normalizeFitIndex(measurements.FitIndex)].name}`,
      x: round2((point2.x + point14.x) / 2),
      y: round2(point1.y - 1),
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
