import type {
  BaseMeasurements,
  DerivedValues,
  EffectiveMeasurements,
  PatternBounds,
  PatternPoint,
  PatternScene,
} from "@/patterns/types";

const HANDLE_RATIO_CAP = 1.6;

const DEFAULT_BASE_MEASUREMENTS: BaseMeasurements = {
  bust: 88,
  waist: 68,
  hip: 94,
  bustEase: 5,
  waistEase: 3,
  napeToWaist: 41,
  shoulder: 12.25,
  backWidth: 34.4,
  waistToHip: 20.6,
  armscyeDepth: 21,
  chest: 32.4,
  neckSize: 37,
  closeWaistShaping: true,
  reducedDarting: false,
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

const fmt = (value: number): string => {
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded);
};

const point = (x: number, y: number): PatternPoint => ({ x: round2(x), y: round2(y) });

const linePath = (...pts: PatternPoint[]): string => {
  if (pts.length < 2) {
    return "";
  }
  const [first, ...rest] = pts;
  return [
    `M ${fmt(first.x)} ${fmt(first.y)}`,
    ...rest.map((p) => `L ${fmt(p.x)} ${fmt(p.y)}`),
  ].join(" ");
};

const cubicPath = (
  start: PatternPoint,
  c1: PatternPoint,
  c2: PatternPoint,
  end: PatternPoint,
): string =>
  `M ${fmt(start.x)} ${fmt(start.y)} C ${fmt(c1.x)} ${fmt(c1.y)} ${fmt(c2.x)} ${fmt(c2.y)} ${fmt(end.x)} ${fmt(end.y)}`;

const midpoint = (a: PatternPoint, b: PatternPoint): PatternPoint =>
  point((a.x + b.x) / 2, (a.y + b.y) / 2);

const distanceBetween = (a: PatternPoint, b: PatternPoint): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const isFiniteNumber = (val: unknown): val is number => typeof val === "number" && Number.isFinite(val);

const clampHandleToChordArt = (
  baseXcmArt: number,
  baseYcmArt: number,
  chordCm: number,
  ratio: number,
): { x: number; y: number } => {
  const baseLen = Math.sqrt(baseXcmArt * baseXcmArt + baseYcmArt * baseYcmArt);
  if (!isFiniteNumber(chordCm) || chordCm <= 0) {
    return { x: 0, y: 0 };
  }
  if (!isFiniteNumber(baseLen) || baseLen < 0.0001) {
    return { x: baseXcmArt, y: baseYcmArt };
  }

  const maxLen = chordCm * ratio;
  if (maxLen >= baseLen) {
    return { x: baseXcmArt, y: baseYcmArt };
  }

  const scale = maxLen / baseLen;
  return {
    x: baseXcmArt * scale,
    y: baseYcmArt * scale,
  };
};

const controlPointFromArtDelta = (
  anchor: PatternPoint,
  artDelta: { x: number; y: number },
): PatternPoint => {
  // Illustrator art coordinates are y-up; scene coordinates here are y-down.
  return point(anchor.x + artDelta.x, anchor.y - artDelta.y);
};

const intersectLineWithVertical = (
  lineStart: PatternPoint,
  lineEnd: PatternPoint,
  xConst: number,
): PatternPoint | null => {
  const dx = lineEnd.x - lineStart.x;
  if (Math.abs(dx) < 0.000001) {
    return null;
  }

  const t = (xConst - lineStart.x) / dx;
  if (t < -0.0001 || t > 1.0001) {
    return null;
  }

  const y = lineStart.y + t * (lineEnd.y - lineStart.y);
  return point(xConst, y);
};

const valueBetween = (val: number, a: number, b: number, tolerance = 0.0001): boolean => {
  const minVal = Math.min(a, b) - tolerance;
  const maxVal = Math.max(a, b) + tolerance;
  return val >= minVal && val <= maxVal;
};

export const computeFrontNeckDart = (bust: number): number => {
  if (!isFinite(bust)) {
    return 7;
  }

  const baseBustLow = 88;
  const baseBustHigh = 110;
  const baseLowValue = 7;
  const baseHighValue = 10;

  if (bust < baseBustLow) {
    const diffLow = ((baseBustLow - bust) / 4) * 0.6;
    return round2(baseLowValue - diffLow);
  }

  if (bust <= 104) {
    const diffMidLow = ((bust - baseBustLow) / 4) * 0.6;
    return round2(baseLowValue + diffMidLow);
  }

  if (bust <= baseBustHigh) {
    const diffMidHigh = ((baseBustHigh - bust) / 6) * 0.6;
    return round2(baseHighValue - diffMidHigh);
  }

  const diffHigh = ((bust - baseBustHigh) / 6) * 0.6;
  return round2(baseHighValue + diffHigh);
};

export const computeWaistDiff = (
  bust: number,
  waist: number,
  bustEase: number,
  waistEase: number,
): number => {
  if (!isFiniteNumber(bust) || !isFiniteNumber(waist)) {
    return Number.NaN;
  }

  let bustComponent = bust / 2;
  let waistComponent = waist / 2;

  if (isFiniteNumber(bustEase)) {
    bustComponent += bustEase;
  }

  if (isFiniteNumber(waistEase)) {
    waistComponent += waistEase;
  }

  return round2(bustComponent - waistComponent);
};

export const computeWaistDartsFromDiff = (
  diff: number,
  options?: { reduced?: boolean },
): Pick<
  DerivedValues,
  "frontWaistDart" | "backWaistDart" | "frontSideWaistDart" | "backSideWaistDart"
> => {
  if (!isFinite(diff)) {
    return {
      frontWaistDart: 0,
      backWaistDart: 0,
      frontSideWaistDart: 0,
      backSideWaistDart: 0,
    };
  }

  const reduced = Boolean(options?.reduced);
  let waistDifference = Math.abs(diff);

  if (reduced) {
    waistDifference *= 0.75;
  }

  const subtractBase = reduced ? 5 : 6;
  let x = (waistDifference - subtractBase) / 4;
  if (!isFinite(x) || x < 0) {
    x = 0;
  }

  if (reduced) {
    return {
      backSideWaistDart: round2(x),
      frontSideWaistDart: round2(x + 1),
      backWaistDart: round2(x + 1.5),
      frontWaistDart: round2(x + 2.5),
    };
  }

  return {
    backSideWaistDart: round2(x),
    frontSideWaistDart: round2(x + 1),
    backWaistDart: round2(x + 2),
    frontWaistDart: round2(x + 3),
  };
};

export const computePointADistance = (bust: number): number => {
  if (!isFinite(bust)) {
    return 2.5;
  }
  if (bust <= 80) {
    return 2.25;
  }
  if (bust >= 96 && bust <= 106) {
    return 3;
  }
  if (bust > 106 && bust <= 128) {
    return 3.5;
  }
  if (bust > 80 && bust <= 99) {
    return 2.5;
  }
  return 3.5;
};

export const computePointBDistance = (bust: number): number => {
  if (!isFinite(bust)) {
    return 2;
  }
  if (bust <= 80) {
    return 1.75;
  }
  if (bust >= 96 && bust <= 106) {
    return 2.5;
  }
  if (bust > 106 && bust <= 128) {
    return 3;
  }
  if (bust > 80 && bust <= 99) {
    return 2;
  }
  return 3;
};

export const getDefaultBaseMeasurements = (): BaseMeasurements => ({
  ...DEFAULT_BASE_MEASUREMENTS,
});

export const computeDerived = (measurements: BaseMeasurements): DerivedValues => {
  const frontNeckDart = computeFrontNeckDart(measurements.bust);
  const waistDiff = computeWaistDiff(
    measurements.bust,
    measurements.waist,
    measurements.bustEase,
    measurements.waistEase,
  );

  const useReduced = measurements.reducedDarting || !measurements.closeWaistShaping;
  const darts = computeWaistDartsFromDiff(waistDiff, { reduced: useReduced });

  return {
    frontNeckDart: round2(frontNeckDart),
    bustWaistDiff: round2(Math.abs(waistDiff)),
    frontWaistDart: darts.frontWaistDart,
    backWaistDart: darts.backWaistDart,
    frontSideWaistDart: darts.frontSideWaistDart,
    backSideWaistDart: darts.backSideWaistDart,
    frontWaistDartBackOff: 2.5,
  };
};

const getBounds = (tracked: PatternPoint[]): PatternBounds => {
  if (!tracked.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = tracked[0].x;
  let minY = tracked[0].y;
  let maxX = tracked[0].x;
  let maxY = tracked[0].y;

  for (const p of tracked) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return {
    minX: round2(minX),
    minY: round2(minY),
    maxX: round2(maxX),
    maxY: round2(maxY),
  };
};

export const buildScene = (measurements: EffectiveMeasurements): PatternScene => {
  const paths: PatternScene["paths"] = [];
  const labels: PatternScene["labels"] = [];
  const markers: PatternScene["markers"] = [];
  const points: Record<string, PatternPoint> = {};
  const tracked: PatternPoint[] = [];

  const track = (...pts: PatternPoint[]) => {
    for (const p of pts) {
      tracked.push(p);
    }
  };

  const registerPoint = (id: string, coords: PatternPoint): PatternPoint => {
    const p = point(coords.x, coords.y);
    points[id] = p;
    track(p);
    return p;
  };

  const registerLetterPoint = (id: string, coords: PatternPoint): PatternPoint => {
    const p = point(coords.x, coords.y);
    points[id] = p;
    track(p);
    return p;
  };

  const addLine = (
    id: string,
    a: PatternPoint,
    b: PatternPoint,
    options?: { dashed?: boolean; strokeWidth?: number },
  ) => {
    track(a, b);
    paths.push({
      id,
      d: linePath(a, b),
      stroke: "currentColor",
      strokeWidth: options?.strokeWidth ?? 0.24,
      dashed: options?.dashed,
    });
  };

  const addPolyline = (
    id: string,
    pts: PatternPoint[],
    options?: { dashed?: boolean; strokeWidth?: number },
  ) => {
    if (pts.length < 2) {
      return;
    }
    track(...pts);
    paths.push({
      id,
      d: linePath(...pts),
      stroke: "currentColor",
      strokeWidth: options?.strokeWidth ?? 0.24,
      dashed: options?.dashed,
    });
  };

  const addCubic = (
    id: string,
    start: PatternPoint,
    c1: PatternPoint,
    c2: PatternPoint,
    end: PatternPoint,
  ) => {
    track(start, c1, c2, end);
    paths.push({
      id,
      d: cubicPath(start, c1, c2, end),
      stroke: "currentColor",
      strokeWidth: 0.24,
    });
  };

  const depth01 = 1.5;
  const depth12 = measurements.armscyeDepth + 0.5;
  const vertical02 = depth01 + depth12;
  const halfBust = measurements.bust / 2;
  const width23 = halfBust + measurements.bustEase;

  const p0 = registerPoint("0", point(0, 0));
  const p1 = registerPoint("1", point(0, depth01));
  const p2 = registerPoint("2", point(0, vertical02));
  const p3 = registerPoint("3", point(width23, p2.y));
  const p4 = registerPoint("4", point(width23, p0.y));
  const p5 = registerPoint("5", point(0, p1.y + measurements.napeToWaist));
  const p6 = registerPoint("6", point(width23, p5.y));
  const pc = registerLetterPoint("c", point(p6.x, p6.y + 1));

  const p9 = registerPoint("9", point(measurements.neckSize / 5 - 0.2, p0.y));
  const p10 = registerPoint(
    "10",
    point(p1.x, p1.y + measurements.armscyeDepth / 5 - 0.7),
  );
  const p20 = registerPoint("20", point(p4.x - (measurements.neckSize / 5 - 0.7), p4.y));
  const p21 = registerPoint("21", point(p4.x, p4.y + (measurements.neckSize / 5 - 0.2)));
  const p22 = registerPoint(
    "22",
    point(p3.x - measurements.chest / 2 - measurements.frontNeckDart / 2, p3.y),
  );

  const distance22toB = computePointBDistance(measurements.bust);
  let pb: PatternPoint | null = null;
  if (distance22toB > 0) {
    const diagComponentB = distance22toB / Math.SQRT2;
    pb = registerLetterPoint("b", point(p22.x - diagComponentB, p22.y - diagComponentB));
  }

  const p23 = registerPoint("23", midpoint(p3, p22));
  const waistLineY = p5.y;
  registerPoint("24", point(p23.x, waistLineY));
  const p26 = registerPoint("26", point(p23.x, p23.y + 2.5));
  const p27 = registerPoint("27", point(p20.x - measurements.frontNeckDart, p20.y));

  const thirdOf3To21 = (p21.y - p3.y) / 3;
  const p31 = registerPoint("31", point(p22.x, p22.y + thirdOf3To21));

  const shoulderPlusOne = measurements.shoulder + 1;
  const shoulderDeltaY = Math.abs(p10.y - p9.y);
  let shoulderHorizontal = 0;
  if (shoulderPlusOne > shoulderDeltaY) {
    shoulderHorizontal = Math.sqrt(
      Math.max(0, shoulderPlusOne * shoulderPlusOne - shoulderDeltaY * shoulderDeltaY),
    );
  }

  const p11 = registerPoint("11", point(p9.x + shoulderHorizontal, p10.y));
  const p12 = registerPoint("12", midpoint(p9, p11));
  const guide12Down = point(p12.x, p12.y + 5);
  const p13 = registerPoint("13", point(guide12Down.x - 1, guide12Down.y));

  const p28 = registerPoint("28", point(p11.x, p11.y + 1.5));
  const p29 = registerPoint("29", point(p28.x + 10, p28.y));

  const frontShoulderDeltaY = Math.abs(p28.y - p27.y);
  const frontShoulderHorizontalSq =
    measurements.shoulder * measurements.shoulder - frontShoulderDeltaY * frontShoulderDeltaY;
  const frontShoulderHorizontal =
    frontShoulderHorizontalSq > 0 ? Math.sqrt(frontShoulderHorizontalSq) : 0;

  let candidateX30 = p27.x - frontShoulderHorizontal;
  const minFrontX = Math.min(p28.x, p29.x);
  const maxFrontX = Math.max(p28.x, p29.x);
  if (candidateX30 < minFrontX) candidateX30 = minFrontX;
  if (candidateX30 > maxFrontX) candidateX30 = maxFrontX;
  const p30 = registerPoint("30", point(candidateX30, p28.y));

  const p14 = registerPoint("14", point(p2.x + measurements.backWidth / 2 + 0.5, p2.y));
  const distance14toA = computePointADistance(measurements.bust);

  let pa: PatternPoint | null = null;
  if (distance14toA > 0) {
    const diagonalComponent = distance14toA / Math.SQRT2;
    pa = registerLetterPoint("a", point(p14.x + diagonalComponent, p14.y - diagonalComponent));
  }

  const p15 = registerPoint("15", point(p14.x, p10.y));
  registerPoint("16", midpoint(p14, p15));
  const p17 = registerPoint("17", midpoint(p2, p14));
  const p32 = registerPoint("32", midpoint(p14, p22));
  registerPoint("33", point(p32.x, waistLineY));
  registerPoint("18", point(p17.x, p5.y));

  let pd: PatternPoint | null = null;
  let pe: PatternPoint | null = null;

  const line5 = p5;
  const pointC = pc;

  const intersectionSpecs = [
    { id: "d", x: p17.x, top: p17 },
    { id: "e", x: p23.x, top: p23 },
    { id: "f", x: p32.x, top: p32 },
  ];

  for (const spec of intersectionSpecs) {
    const intersectionPoint = intersectLineWithVertical(line5, pointC, spec.x);
    if (!intersectionPoint) {
      continue;
    }

    if (!valueBetween(intersectionPoint.y, spec.top.y, pointC.y, 0.001)) {
      continue;
    }

    const p = registerLetterPoint(spec.id, intersectionPoint);
    if (spec.id === "d") pd = p;
    if (spec.id === "e") pe = p;
  }

  const waistLinePointAtX = (x: number): PatternPoint => {
    const deltaX = pointC.x - line5.x;
    if (Math.abs(deltaX) < 0.0001) {
      return point(x, line5.y);
    }

    const slope = (pointC.y - line5.y) / deltaX;
    const y = line5.y + slope * (x - line5.x);
    return point(x, y);
  };

  const waistAxisPointRaw = intersectLineWithVertical(line5, pointC, p32.x);
  const waistAxisPoint = waistAxisPointRaw ?? waistLinePointAtX(p32.x);

  if (pb) {
    addLine("front-armhole-guideline-22-b", p22, pb, { dashed: true, strokeWidth: 0.18 });
  }

  addLine("front-neck-dart-left-20-26", p20, p26);
  addLine("front-neck-dart-right-27-26", p27, p26);
  addLine("chest-line-22-31", p22, p31, { dashed: true, strokeWidth: 0.18 });

  addLine("bust-line-2-3", p2, p3, { dashed: true, strokeWidth: 0.18 });
  addLine("cf-line-21-c", p21, pc, { strokeWidth: 0.26 });
  addLine("foundation-top-4-0", p4, p0, { strokeWidth: 0.2 });
  addLine("foundation-cb-0-5", p0, p5, { strokeWidth: 0.2 });
  addLine("waistline-5-6", p5, p6, { dashed: true, strokeWidth: 0.18 });
  addLine("front-edge-4-c", p4, pc, { strokeWidth: 0.2 });
  addLine("centre-back-1-5", p1, p5, { strokeWidth: 0.26 });

  let shoulderLineEnd = p11;
  const shoulderDartHalfWidth = 0.5;
  const shoulderSegmentLength = distanceBetween(p9, p11);

  if (shoulderSegmentLength > 0.0001) {
    const shoulderUnitX = (p11.x - p9.x) / shoulderSegmentLength;
    const shoulderUnitY = (p11.y - p9.y) / shoulderSegmentLength;

    const shoulderDartLeft = point(
      p12.x - shoulderUnitX * shoulderDartHalfWidth,
      p12.y - shoulderUnitY * shoulderDartHalfWidth,
    );
    const shoulderDartRight = point(
      p12.x + shoulderUnitX * shoulderDartHalfWidth,
      p12.y + shoulderUnitY * shoulderDartHalfWidth,
    );

    const leftLegLength = distanceBetween(shoulderDartLeft, p13);
    const rightVector = {
      x: shoulderDartRight.x - p13.x,
      y: shoulderDartRight.y - p13.y,
    };
    const rightVectorLength = Math.sqrt(
      rightVector.x * rightVector.x + rightVector.y * rightVector.y,
    );

    let shoulderDartRightAdjusted = shoulderDartRight;
    if (rightVectorLength > 0.0001 && leftLegLength > 0.0001) {
      const scale = leftLegLength / rightVectorLength;
      shoulderDartRightAdjusted = point(
        p13.x + rightVector.x * scale,
        p13.y + rightVector.y * scale,
      );
    }

    shoulderLineEnd = shoulderDartLeft;

    addPolyline("back-shoulder-dart-guide", [p12, guide12Down, p13], {
      dashed: true,
      strokeWidth: 0.18,
    });
    addPolyline("back-shoulder-dart", [shoulderDartLeft, p13, shoulderDartRightAdjusted], {
      strokeWidth: 0.26,
    });
    addLine("back-shoulder-right-connect", shoulderDartRightAdjusted, p11, {
      strokeWidth: 0.24,
    });
  } else {
    addPolyline("back-shoulder-dart-guide", [p12, guide12Down, p13], {
      dashed: true,
      strokeWidth: 0.18,
    });
  }

  addLine("back-shoulder-line-9-11", p9, shoulderLineEnd, { strokeWidth: 0.26 });

  const neckChord = distanceBetween(p1, p9);
  const neckHandle1Art = clampHandleToChordArt(4.3, 0, neckChord, HANDLE_RATIO_CAP);
  const neckHandle9Art = clampHandleToChordArt(-1, -1, neckChord, HANDLE_RATIO_CAP);
  addCubic(
    "back-neck-curve",
    p1,
    controlPointFromArtDelta(p1, neckHandle1Art),
    controlPointFromArtDelta(p9, neckHandle9Art),
    p9,
  );

  const frontNeckChord = distanceBetween(p20, p21);
  const frontHandle20Art = clampHandleToChordArt(0, -4, frontNeckChord, HANDLE_RATIO_CAP);
  const frontHandle21Art = clampHandleToChordArt(-4, 0, frontNeckChord, HANDLE_RATIO_CAP);
  addCubic(
    "front-neck-curve",
    p20,
    controlPointFromArtDelta(p20, frontHandle20Art),
    controlPointFromArtDelta(p21, frontHandle21Art),
    p21,
  );

  addLine("back-shoulder-drop-11-28", p11, p28, { dashed: true, strokeWidth: 0.18 });
  addLine("shoulder-balance-line-28-29", p28, p29, { dashed: true, strokeWidth: 0.18 });
  addLine("front-shoulder-line-27-30", p27, p30, { strokeWidth: 0.26 });

  if (pa) {
    addLine("back-armhole-guideline-14-a", p14, pa, { dashed: true, strokeWidth: 0.18 });
  }

  addLine("back-width-line-14-15", p14, p15, { dashed: true, strokeWidth: 0.18 });

  const backArmholeChord = distanceBetween(p11, p32);
  const backHandle11 = clampHandleToChordArt(3.2, 9.79, backArmholeChord, HANDLE_RATIO_CAP);
  const backHandle32 = clampHandleToChordArt(6.15, 0, backArmholeChord, HANDLE_RATIO_CAP);

  addCubic(
    "back-armhole-curve",
    p11,
    controlPointFromArtDelta(p11, { x: -backHandle11.x, y: -backHandle11.y }),
    controlPointFromArtDelta(p32, { x: -backHandle32.x, y: -backHandle32.y }),
    p32,
  );

  const frontArmholeChord = distanceBetween(p30, p32);
  const frontHandle30 = clampHandleToChordArt(7, 11.25, frontArmholeChord, HANDLE_RATIO_CAP);
  const frontHandle32 = clampHandleToChordArt(6.47, 0, frontArmholeChord, HANDLE_RATIO_CAP);

  addCubic(
    "front-armhole-curve",
    p30,
    controlPointFromArtDelta(p30, { x: frontHandle30.x, y: -frontHandle30.y }),
    controlPointFromArtDelta(p32, { x: frontHandle32.x, y: -frontHandle32.y }),
    p32,
  );

  if (pd) {
    addLine("back-waist-dart-bisector", p17, pd, { dashed: true, strokeWidth: 0.18 });
  }

  let frontDartBaseLeft: PatternPoint | null = null;
  let frontDartBaseRight: PatternPoint | null = null;
  if (pe && measurements.frontWaistDart > 0.0001) {
    const frontDartHalf = measurements.frontWaistDart / 2;
    frontDartBaseLeft = point(pe.x - frontDartHalf, pe.y);
    frontDartBaseRight = point(pe.x + frontDartHalf, pe.y);
    const frontBackOff = isFiniteNumber(measurements.frontWaistDartBackOff)
      ? measurements.frontWaistDartBackOff
      : 2.5;
    const frontDartApex = point(pe.x, p26.y + frontBackOff);

    addLine("front-waist-dart-left", frontDartBaseLeft, frontDartApex);
    addLine("front-waist-dart-right", frontDartBaseRight, frontDartApex);
    addLine("front-waist-dart-bisector", frontDartApex, pe, {
      dashed: true,
      strokeWidth: 0.18,
    });
  }

  addLine("side-princess-guide", p32, waistAxisPoint, { dashed: true, strokeWidth: 0.18 });

  const hasFrontSideDart = isFiniteNumber(measurements.frontSideWaistDart) && measurements.frontSideWaistDart > 0.0001;
  const hasBackSideDart = isFiniteNumber(measurements.backSideWaistDart) && measurements.backSideWaistDart > 0.0001;

  let sideLeftBase: PatternPoint | null = null;
  let sideRightBase: PatternPoint | null = null;

  if (hasBackSideDart) {
    sideLeftBase = waistLinePointAtX(waistAxisPoint.x - measurements.backSideWaistDart);
    addLine("back-side-waist-dart", sideLeftBase, p32);
  }

  if (hasFrontSideDart) {
    sideRightBase = waistLinePointAtX(waistAxisPoint.x + measurements.frontSideWaistDart);
    addLine("front-side-waist-dart", sideRightBase, p32);
  }

  let backDartBaseLeft: PatternPoint | null = null;
  let backDartBaseRight: PatternPoint | null = null;
  if (pd && measurements.backWaistDart > 0.0001) {
    const backHalf = measurements.backWaistDart / 2;
    backDartBaseLeft = point(pd.x - backHalf, pd.y);
    backDartBaseRight = point(pd.x + backHalf, pd.y);
    addLine("back-waist-dart-left", backDartBaseLeft, p17);
    addLine("back-waist-dart-right", backDartBaseRight, p17);
  }

  // Waist seam redraw:
  // Remove direct 5-c and stitch through dart legs and side-dart bases.
  if (backDartBaseLeft) {
    addLine("waist-seam-5-to-back-dart-left", p5, backDartBaseLeft);
  } else if (backDartBaseRight) {
    addLine("waist-seam-5-to-back-dart-right", p5, backDartBaseRight);
  } else if (sideLeftBase) {
    addLine("waist-seam-5-to-side-left", p5, sideLeftBase);
  }

  if (backDartBaseRight && sideLeftBase) {
    addLine("waist-seam-back-dart-right-to-side-left", backDartBaseRight, sideLeftBase);
  } else if (backDartBaseRight && sideRightBase) {
    addLine("waist-seam-back-dart-right-to-side-right", backDartBaseRight, sideRightBase);
  }

  if (sideRightBase && frontDartBaseLeft) {
    addLine("waist-seam-side-right-to-front-dart-left", sideRightBase, frontDartBaseLeft);
  } else if (sideLeftBase && frontDartBaseLeft) {
    addLine("waist-seam-side-left-to-front-dart-left", sideLeftBase, frontDartBaseLeft);
  }

  if (frontDartBaseRight) {
    addLine("waist-seam-front-dart-right-to-c", frontDartBaseRight, pc);
  } else if (frontDartBaseLeft) {
    addLine("waist-seam-front-dart-left-to-c", frontDartBaseLeft, pc);
  } else if (sideRightBase) {
    addLine("waist-seam-side-right-to-c", sideRightBase, pc);
  } else if (sideLeftBase) {
    addLine("waist-seam-side-left-to-c", sideLeftBase, pc);
  } else {
    addLine("waist-seam-5-to-c", p5, pc);
  }

  addLine("back-blade-line-10-1", p10, p1);
  const backSquareEnd = point(p10.x + width23 / 2, p10.y);
  addLine("back-blade-guide", p10, backSquareEnd, { dashed: true, strokeWidth: 0.18 });

  labels.push(
    {
      id: "label-cf",
      text: `CF ${fmt(distanceBetween(p21, pc))} cm`,
      x: round2((p21.x + pc.x) / 2 - 0.9),
      y: round2((p21.y + pc.y) / 2),
      color: "currentColor",
    },
    {
      id: "label-cb",
      text: `CB ${fmt(distanceBetween(p1, p5))} cm`,
      x: round2((p1.x + p5.x) / 2 + 0.9),
      y: round2((p1.y + p5.y) / 2),
      color: "currentColor",
    },
    {
      id: "label-bust-line",
      text: `Bust ${fmt(distanceBetween(p2, p3))} cm`,
      x: round2((p2.x + p3.x) / 2),
      y: round2(p2.y - 1),
      color: "currentColor",
    },
    {
      id: "label-front-neck-dart",
      text: `Front Neck Dart ${fmt(measurements.frontNeckDart)} cm`,
      x: p27.x + 0.6,
      y: p27.y - 0.7,
      color: "currentColor",
    },
    {
      id: "label-front-waist-dart",
      text: `Front Waist Dart ${fmt(measurements.frontWaistDart)} cm`,
      x: (pe ?? p23).x + 0.7,
      y: (pe ?? p23).y + 2,
      color: "currentColor",
    },
    {
      id: "label-back-waist-dart",
      text: `Back Waist Dart ${fmt(measurements.backWaistDart)} cm`,
      x: (pd ?? p17).x - 4.4,
      y: (pd ?? p17).y + 2,
      color: "currentColor",
    },
  );

  for (const [id, p] of Object.entries(points)) {
    markers.push({
      id: `marker-${id}`,
      x: p.x,
      y: p.y,
      r: 0.45,
      color: "currentColor",
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
