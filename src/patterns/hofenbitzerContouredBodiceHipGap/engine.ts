import type {
  PatternBounds,
  PatternPath,
  PatternPoint,
  PatternScene,
} from "@/patterns/types";
import type {
  FitProfile,
  HofenbitzerContouredHipGapBaseMeasurements,
  HofenbitzerContouredHipGapDerivedValues,
  HofenbitzerContouredHipGapEffectiveMeasurements,
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

const getFrontWaistDartAdditionDefault = (fitIndex: number): number => {
  const fitNumber = normalizeFitIndex(fitIndex) + 1;
  if (fitNumber >= 8) {
    return 0;
  }
  if (fitNumber >= 5) {
    return 0.5;
  }
  return 1;
};

const DEFAULT_BASE_MEASUREMENTS: HofenbitzerContouredHipGapBaseMeasurements = {
  FitIndex: 1,
  AhD: 20.1,
  AhDEase: FIT_PROFILES[1].ease.AhDEase,
  BrC: 88,
  BrCEase: FIT_PROFILES[1].ease.BrCEase,
  WaC: 68,
  WaCEase: FIT_PROFILES[1].ease.WaCEase,
  HiC: 97,
  HiCEase: FIT_PROFILES[1].ease.HiCEase,
  BG: 16.5,
  BGEase: FIT_PROFILES[1].ease.BGEase,
  AG: 9.3,
  AGEase: FIT_PROFILES[1].ease.AGEase,
  BrG: 18.2,
  BrGEase: FIT_PROFILES[1].ease.BrGEase,
  ShG: 12.2,
  ShGEase: FIT_PROFILES[1].ease.ShGEase,
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
  BackContour: 2,
  BackShoulderDartIntake: 1.5,
  FrontWaistDartAddition: 1,
  FrontDartLength: 12,
  MainBackDartLength: 15,
  SecondBackDartLength: 13,
};

const round2 = (value: number): number => Math.round(value * 100) / 100;
const round4 = (value: number): number => Math.round(value * 10000) / 10000;
const fmt = (value: number): string => String(Math.round(value * 1000) / 1000);
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

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

const multiCubicPath = (segments: Array<{
  start: DraftPoint;
  c1: DraftPoint;
  c2: DraftPoint;
  end: DraftPoint;
}>): string => {
  if (!segments.length) {
    return "";
  }

  const [first, ...rest] = segments;
  const start = out(first.start);
  const commands = [`M ${fmt(start.x)} ${fmt(start.y)}`];

  const pushCurve = (segment: {
    start: DraftPoint;
    c1: DraftPoint;
    c2: DraftPoint;
    end: DraftPoint;
  }) => {
    const c1 = out(segment.c1);
    const c2 = out(segment.c2);
    const end = out(segment.end);
    commands.push(
      `C ${fmt(c1.x)} ${fmt(c1.y)} ${fmt(c2.x)} ${fmt(c2.y)} ${fmt(end.x)} ${fmt(end.y)}`,
    );
  };

  pushCurve(first);
  for (const segment of rest) {
    pushCurve(segment);
  }

  return commands.join(" ");
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

const intersectLineSegmentWithVertical = (
  a: DraftPoint,
  b: DraftPoint,
  x: number,
): DraftPoint | null => {
  const dx = b.x - a.x;
  if (Math.abs(dx) < 0.0001) {
    return null;
  }

  const t = (x - a.x) / dx;
  if (t < 0 || t > 1) {
    return null;
  }

  return p(x, a.y + (b.y - a.y) * t);
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

export const getDefaultBaseMeasurements = (): HofenbitzerContouredHipGapBaseMeasurements => ({
  ...DEFAULT_BASE_MEASUREMENTS,
});

export const applyFitProfile = (
  base: HofenbitzerContouredHipGapBaseMeasurements,
  fitIndex: number,
): HofenbitzerContouredHipGapBaseMeasurements => {
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
    FrontWaistDartAddition: getFrontWaistDartAdditionDefault(normalized),
  };
};

export const computeDerived = (
  measurements: HofenbitzerContouredHipGapBaseMeasurements,
): HofenbitzerContouredHipGapDerivedValues => {
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

  const point7X = -measurements.BackContour;
  const point9Ratio = BLFinal > 1e-6 ? AhDPlus / BLFinal : 0;
  const point9X = point7X * point9Ratio;
  const point10X = point9X - BGPlus;
  const point11X = point10X - (AGPlus * 2) / 3;
  const point12X = point11X - 10;
  const point13X = point12X - AGPlus / 3;
  const point14X = point13X - BrGPlus;
  const point19X = point14X;

  const waistQuarter = measurements.WaC / 4;
  const point42X = Math.max(point14X, point13X - waistQuarter);
  const frontWaistDartWidth = Math.max(
    0,
    Math.abs(point19X - point42X) + measurements.FrontWaistDartAddition,
  );
  const HiGap = Math.max(frontWaistDartWidth - 2, 0);

  const frontHipSpanRaw = Math.abs(point14X - point12X);
  const frontHipSpan = Math.max(0, frontHipSpanRaw - HiGap);

  const centerBackHipX =
    measurements.MoL > 1e-6
      ? -measurements.BackContour * ((BLFinal + measurements.HiD) / measurements.MoL)
      : -measurements.BackContour;
  const backHipSpan = Math.abs(point11X - centerBackHipX);

  const HiG = frontHipSpan + backHipSpan;
  const HiDiff = HiG - HiW;

  const frontWaistGap = Math.max(0, frontHipSpanRaw - frontWaistDartWidth);
  const backWaistGap = Math.abs(point11X - point7X);
  const waistGapTotal = frontWaistGap + backWaistGap;
  const waistDifference = Math.max(0, waistGapTotal - WaW);

  let waistSideShare = 0;
  let waistBackArmShare = 0;
  let waistBackDartShare = 0;

  if (waistDifference > 0) {
    let remaining = waistDifference;

    waistSideShare = clamp(waistDifference * 0.3, 0, 2);
    waistSideShare = Math.min(waistSideShare, remaining);
    remaining -= waistSideShare;

    waistBackArmShare = clamp(waistDifference * 0.3, 0, 3);
    waistBackArmShare = Math.min(waistBackArmShare, remaining);
    remaining -= waistBackArmShare;

    waistBackDartShare = clamp(remaining, 0, 4);
    remaining -= waistBackDartShare;

    if (remaining > 0) {
      const sideRoom = 2 - waistSideShare;
      const add = Math.min(Math.max(0, sideRoom), remaining);
      waistSideShare += add;
      remaining -= add;
    }

    if (remaining > 0) {
      const backArmRoom = 3 - waistBackArmShare;
      const add = Math.min(Math.max(0, backArmRoom), remaining);
      waistBackArmShare += add;
      remaining -= add;
    }

    if (remaining > 0) {
      const backDartRoom = 4 - waistBackDartShare;
      const add = Math.min(Math.max(0, backDartRoom), remaining);
      waistBackDartShare += add;
    }
  }

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
    frontShoulderAngle: round2(measurements.ShA + measurements.ShoulderDifference),
    backShoulderAngle: round2(measurements.ShA - measurements.ShoulderDifference),
    HiGap: round2(HiGap),
    HiG: round2(HiG),
    HiDiff: round2(HiDiff),
    frontWaistGap: round2(frontWaistGap),
    backWaistGap: round2(backWaistGap),
    waistGapTotal: round2(waistGapTotal),
    waistDifference: round2(waistDifference),
    waistSideShare: round2(waistSideShare),
    waistBackArmShare: round2(waistBackArmShare),
    waistBackDartShare: round2(waistBackDartShare),
  };
};

export const buildScene = (
  measurements: HofenbitzerContouredHipGapEffectiveMeasurements,
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

  const addMultiCubic = (
    id: string,
    segments: Array<{
      start: DraftPoint;
      c1: DraftPoint;
      c2: DraftPoint;
      end: DraftPoint;
    }>,
    options?: {
      kind?: PatternPath["kind"];
      strokeWidth?: number;
    },
  ) => {
    for (const segment of segments) {
      track(segment.start, segment.c1, segment.c2, segment.end);
    }

    pushPath(id, multiCubicPath(segments), options);
  };

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

  const dist12 = measurements.NeG / 3 + 1;
  const point2 = registerPoint("2", p(point1.x, point1.y + dist12));

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

  const point7 = registerPoint("7", p(point5.x - measurements.BackContour, point5.y));
  const point8 = registerPoint("8", p(point3.x - measurements.BackContour, point3.y));
  const point9 = registerPoint("9", extendLineToY(point2, point7, point4.y));

  const point10 = registerPoint("10", p(point9.x - measurements.BGPlus, point4.y));
  const point11 = registerPoint("11", p(point10.x - (measurements.AGPlus * 2) / 3, point10.y));
  const point12 = registerPoint("12", p(point11.x - 10, point11.y));
  const point13 = registerPoint("13", p(point12.x - measurements.AGPlus / 3, point12.y));
  const point13a = registerPoint("13a", p(point13.x, point13.y - measurements.AGPlus / 4));
  const point14 = registerPoint("14", p(point13.x - measurements.BrGPlus, point13.y));

  let point16: DraftPoint | null = null;
  let point17: DraftPoint | null = null;
  let point17a: DraftPoint | null = null;
  let point18: DraftPoint | null = null;
  let point24: DraftPoint | null = null;
  let frontShoulderStart: DraftPoint | null = null;
  let backShoulderEnd: DraftPoint | null = null;

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

    backShoulderEnd = p(point1a.x + dirX * effectiveLength, point1a.y + dirY * effectiveLength);
    addLine("back-shoulder-line", point1a, backShoulderEnd, {
      kind: "pattern",
      strokeWidth: 0.26,
    });

    if (tIntersect !== null) {
      point16 = registerPoint("16", p(point10.x, point1a.y + dirY * tIntersect));
    }

    if (point16) {
      point17 = registerPoint("17", p((point16.x + point10.x) / 2 - 1, (point16.y + point10.y) / 2));
      point17a = registerPoint(
        "17a",
        p((point17.x + point10.x) / 2 - 1.5, (point17.y + point10.y) / 2),
      );
      point18 = registerPoint("18", p(point13.x, point17a.y));

      addLine("shoulder-blade-line", point17, p(point2.x, point17.y), {
        dashed: true,
        kind: "construction",
        strokeWidth: 0.18,
      });

      addLine("line-17a-18", point17a, point18, {
        dashed: true,
        kind: "construction",
        strokeWidth: 0.18,
      });

      let backArmholeStart = backShoulderEnd;
      const halfBackShoulderDart = Math.max(0, measurements.BackShoulderDartIntake) / 2;
      if (halfBackShoulderDart > 0.001) {
        const point35 = registerPoint("35", p(point16.x - halfBackShoulderDart, point16.y));
        const point36 = registerPoint("36", p(point16.x + halfBackShoulderDart, point16.y));
        addLine("back-shoulder-dart-base", point35, point36, {
          kind: "pattern",
          strokeWidth: 0.24,
        });
        addLine("back-shoulder-dart-left", point35, point17, {
          kind: "pattern",
          strokeWidth: 0.24,
        });
        addLine("back-shoulder-dart-right", point36, point17, {
          kind: "pattern",
          strokeWidth: 0.24,
        });
        backArmholeStart = point36;
      }

      const backCurveHandles = buildBackArmholeHandles(
        backArmholeStart,
        point17,
        point17a,
        point11,
        point4,
      );

      if (backCurveHandles) {
        addMultiCubic(
          "back-armhole-curve",
          [
            {
              start: backArmholeStart,
              c1: backCurveHandles.startHandle,
              c2: backCurveHandles.midIncoming,
              end: point17,
            },
            {
              start: point17,
              c1: backCurveHandles.midOutgoing,
              c2: backCurveHandles.endIncoming,
              end: point11,
            },
          ],
          {
            kind: "pattern",
            strokeWidth: 0.26,
          },
        );
      }

      track(frontShoulderEnd);
    }
  }

  const topLineY = point1.y;
  const waistLineY = point5.y;
  const hipLineY = point6.y;
  const hemLineY = point3.y;

  const point19 = registerPoint("19", p(point14.x, waistLineY));

  let backDiagVec: { x: number; y: number } | null = {
    x: point6a.x - point2.x,
    y: point6a.y - point2.y,
  };

  if (Math.abs(backDiagVec.x) > 0.0001 || Math.abs(backDiagVec.y) > 0.0001) {
    const point25 = extendLineToY(
      point11,
      p(point11.x + backDiagVec.x, point11.y + backDiagVec.y),
      hemLineY,
    );
    registerPoint("25", point25);
    addLine("back-side-straightening", point11, point25, {
      dashed: true,
      kind: "construction",
      strokeWidth: 0.18,
    });
  } else {
    backDiagVec = null;
  }

  registerPoint("26", p(point11.x, hipLineY));
  registerPoint("27", p(point12.x, hipLineY));

  if (backDiagVec) {
    registerPoint(
      "28",
      extendLineToY(
        point11,
        p(point11.x + backDiagVec.x, point11.y + backDiagVec.y),
        hipLineY,
      ),
    );
  } else {
    registerPoint("28", p(point11.x, hipLineY));
  }

  const hiDiffHalf = Math.abs(measurements.HiDiff) / 2;
  const point29 = registerPoint("29", p(point12.x + hiDiffHalf, hipLineY));
  const point30 = registerPoint("30", p(point11.x - hiDiffHalf, hipLineY));

  const perpendicularFootOnBackDiagonal = (source: DraftPoint): DraftPoint | null => {
    const diagX = point8.x - point2.x;
    const diagY = point8.y - point2.y;
    const diagLengthSq = diagX * diagX + diagY * diagY;
    if (diagLengthSq < 1e-6) {
      return null;
    }

    const t = ((source.x - point2.x) * diagX + (source.y - point2.y) * diagY) / diagLengthSq;
    return p(point2.x + diagX * t, point2.y + diagY * t);
  };

  const point30Hem = extendLineToY(point11, point30, hemLineY);
  const point30Waist = extendLineToY(point11, point30, waistLineY);

  addLine("back-side-line-1", point11, point30Hem, {
    kind: "pattern",
    strokeWidth: 0.26,
  });

  let hipLinePointBack = perpendicularFootOnBackDiagonal(point30);
  if (!hipLinePointBack) {
    hipLinePointBack = p(point8.x, hipLineY);
  }

  addLine("back-hip-line", point30, hipLinePointBack, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const hemConnectorEnd = perpendicularFootOnBackDiagonal(point30Hem);
  if (hemConnectorEnd) {
    addLine("back-hem-line", point30Hem, hemConnectorEnd, {
      kind: "pattern",
      strokeWidth: 0.26,
    });
  }

  const waistConnectorEnd = perpendicularFootOnBackDiagonal(point30Waist);
  if (waistConnectorEnd) {
    addLine("back-waist-line", point30Waist, waistConnectorEnd, {
      dashed: true,
      kind: "construction",
      strokeWidth: 0.18,
    });
  }

  addPolyline("centre-back-cb", [point2, point7, point8], {
    kind: "pattern",
    strokeWidth: 0.26,
  });

  const point29Hem = extendLineToY(point12, point29, hemLineY);
  addLine("new-front-side-line", point12, point29Hem, {
    kind: "pattern",
    strokeWidth: 0.26,
  });

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

  if (!point24 && measurements.fShS > 0) {
    const frontShoulderRadians = (measurements.frontShoulderAngle * Math.PI) / 180;
    frontShoulderStart = point20a;
    point24 = registerPoint(
      "24",
      p(
        point20a.x + Math.cos(frontShoulderRadians) * measurements.fShS,
        point20a.y + Math.sin(frontShoulderRadians) * measurements.fShS,
      ),
    );
    addLine("front-shoulder-line", point20a, point24, {
      kind: "pattern",
      strokeWidth: 0.26,
    });

    const controls = buildFrontArmholeControls(point24, point12, point13a, point20a, point14);
    if (controls) {
      addCubic("front-armhole-curve", point24, controls.c1, controls.c2, point12, {
        kind: "pattern",
        strokeWidth: 0.26,
      });
    }
  }

  if (point24 && frontShoulderStart) {
    const shoulderCut = intersectLineSegmentWithVertical(frontShoulderStart, point24, point13.x);
    if (shoulderCut) {
      addLine("front-shoulder-line-cleanup", frontShoulderStart, shoulderCut, {
        kind: "cleanup",
        strokeWidth: 0.26,
      });
    }
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

  const frontDartTop = p(point22.x, frontDartTopY);
  const frontDartBottom = p(point22.x, hemLineY);

  const shiftDown = (baseY: number, length: number): number =>
    Math.min(hemLineY, baseY + Math.max(0, length));

  const point42 = registerPoint("42", p(Math.max(point14.x, point13.x - measurements.WaC / 4), waistLineY));
  const frontDartWaistIntersection = p(point22.x, waistLineY);
  const halfFrontWaistDart = Math.max(0, Math.abs(point19.x - point42.x) + measurements.FrontWaistDartAddition) / 2;
  const frontWaistDartLeft = registerPoint(
    "FWDL",
    p(frontDartWaistIntersection.x - halfFrontWaistDart, waistLineY),
  );
  const frontWaistDartRight = registerPoint(
    "FWDR",
    p(frontDartWaistIntersection.x + halfFrontWaistDart, waistLineY),
  );
  addLine("front-waist-dart-left-leg", frontWaistDartLeft, point22, {
    kind: "pattern",
    strokeWidth: 0.24,
  });
  addLine("front-waist-dart-right-leg", frontWaistDartRight, point22, {
    kind: "pattern",
    strokeWidth: 0.24,
  });

  const frontDartLengthPoint = registerPoint(
    "43",
    p(frontDartWaistIntersection.x, shiftDown(frontDartWaistIntersection.y, measurements.FrontDartLength)),
  );
  addLine(
    "front-dart-length-line",
    p(frontDartLengthPoint.x - 3, frontDartLengthPoint.y),
    p(frontDartLengthPoint.x + 3, frontDartLengthPoint.y),
    { dashed: true, kind: "construction", strokeWidth: 0.18 },
  );

  const hiGapHalf = Math.max(0, measurements.HiGap) / 2;
  if (hiGapHalf > 0.001) {
    const hiLeftStart = p(frontDartLengthPoint.x - hiGapHalf, frontDartLengthPoint.y);
    const hiRightStart = p(frontDartLengthPoint.x + hiGapHalf, frontDartLengthPoint.y);
    registerPoint("HGL", p(hiLeftStart.x, hipLineY));
    registerPoint("HGR", p(hiRightStart.x, hipLineY));
    addLine("front-hi-gap-left", hiLeftStart, p(hiLeftStart.x, hemLineY), {
      kind: "pattern",
      strokeWidth: 0.24,
    });
    addLine("front-hi-gap-right", hiRightStart, p(hiRightStart.x, hemLineY), {
      kind: "pattern",
      strokeWidth: 0.24,
    });
    addLine("front-waist-dart-left-to-hi-gap", frontWaistDartLeft, hiLeftStart, {
      kind: "pattern",
      strokeWidth: 0.24,
    });
    addLine("front-waist-dart-right-to-hi-gap", frontWaistDartRight, hiRightStart, {
      kind: "pattern",
      strokeWidth: 0.24,
    });
  }

  const frontHipMarker = registerPoint("44", p(point12.x + hiDiffHalf, hipLineY));
  const backHipMarker = registerPoint("45", p(point11.x - hiDiffHalf, hipLineY));
  if (hiDiffHalf > 0.001) {
    addLine("front-hi-g-line", frontHipMarker, p(frontHipMarker.x, hemLineY), {
      kind: "construction",
      dashed: true,
      strokeWidth: 0.18,
    });
    addLine("back-hi-g-line", backHipMarker, p(backHipMarker.x, hemLineY), {
      kind: "construction",
      dashed: true,
      strokeWidth: 0.18,
    });
  }

  const point34 = registerPoint("34", p((point7.x + point10.x) / 2, waistLineY));
  const bustIntersectionY = point4.y;
  const sideShareEach = measurements.waistSideShare / 2;
  const backArmHalfShare = measurements.waistBackArmShare / 2;
  const backDartHalfShare = measurements.waistBackDartShare / 2;

  if (sideShareEach > 0.001) {
    addLine(
      "waist-dart-front-side-left",
      p(point12.x - sideShareEach, waistLineY),
      p(point12.x, bustIntersectionY),
      { kind: "pattern", strokeWidth: 0.24 },
    );
    addLine(
      "waist-dart-back-side-right",
      p(point11.x + sideShareEach, waistLineY),
      p(point11.x, bustIntersectionY),
      { kind: "pattern", strokeWidth: 0.24 },
    );
  }

  if (backArmHalfShare > 0.001) {
    const backArmBase = p(point10.x, waistLineY);
    const backArmApex = p(point10.x, point10.y);
    const backArmDownApex = p(point10.x, shiftDown(waistLineY, measurements.SecondBackDartLength));
    const backArmLeft = p(point10.x - backArmHalfShare, waistLineY);
    const backArmRight = p(point10.x + backArmHalfShare, waistLineY);

    addLine("waist-dart-back-arm-center", backArmBase, backArmApex, {
      dashed: true,
      kind: "construction",
      strokeWidth: 0.18,
    });
    addLine("waist-dart-back-arm-left", backArmLeft, backArmApex, {
      kind: "pattern",
      strokeWidth: 0.24,
    });
    addLine("waist-dart-back-arm-right", backArmRight, backArmApex, {
      kind: "pattern",
      strokeWidth: 0.24,
    });
    addLine("waist-dart-back-arm-down-left", backArmLeft, backArmDownApex, {
      kind: "pattern",
      strokeWidth: 0.24,
    });
    addLine("waist-dart-back-arm-down-right", backArmRight, backArmDownApex, {
      kind: "pattern",
      strokeWidth: 0.24,
    });
  }

  if (backDartHalfShare > 0.001) {
    const backMidApex = p(point34.x, bustIntersectionY);
    const backDownApex = p(point34.x, shiftDown(waistLineY, measurements.MainBackDartLength));
    const backLeft = p(point34.x - backDartHalfShare, waistLineY);
    const backRight = p(point34.x + backDartHalfShare, waistLineY);

    addLine("waist-dart-back-mid-center", point34, backMidApex, {
      dashed: true,
      kind: "construction",
      strokeWidth: 0.18,
    });
    addLine("waist-dart-back-mid-left", backLeft, backMidApex, {
      kind: "pattern",
      strokeWidth: 0.24,
    });
    addLine("waist-dart-back-mid-right", backRight, backMidApex, {
      kind: "pattern",
      strokeWidth: 0.24,
    });
    addLine("waist-dart-back-main-down-left", backLeft, backDownApex, {
      kind: "pattern",
      strokeWidth: 0.24,
    });
    addLine("waist-dart-back-main-down-right", backRight, backDownApex, {
      kind: "pattern",
      strokeWidth: 0.24,
    });
  }

  addLine("back-arm-line", p(point10.x, point16 ? point16.y : topLineY), p(point10.x, hipLineY), {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("back-side-line-2", p(point11.x, point10.y), p(point11.x, hemLineY), {
    dashed: true,
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

  addLine("front-dart-line", frontDartTop, frontDartBottom, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  addLine("centre-front-cf", p(point14.x, point20.y), p(point14.x, hemLineY), {
    kind: "pattern",
    strokeWidth: 0.26,
  });

  addLine("front-hem-line", p(point14.x, hemLineY), point29Hem, {
    kind: "pattern",
    strokeWidth: 0.26,
  });

  addLine("front-bust-line", point4, point12, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const frontWaistEnd = extendLineToY(point12, point29, waistLineY);
  addLine("front-waist-line", point19, frontWaistEnd, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  addLine("front-hip-line", point6, point29, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  if (point17 && point2 && point18) {
    const cbIntersection = lineIntersection(point17, p(point2.x, point17.y), point2, point7) ??
      p(point2.x, point17.y);
    addLine("shoulder-blade-line-trimmed", point17, cbIntersection, {
      dashed: true,
      kind: "construction",
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
