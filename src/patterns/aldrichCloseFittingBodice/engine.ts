import type {
  BaseMeasurements,
  DerivedValues,
  EffectiveMeasurements,
  PatternBounds,
  PatternPoint,
  PatternScene,
} from "@/patterns/types";

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

const fmt = (value: number): string => {
  const rounded = Math.round(value * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

const round2 = (value: number): number => Math.round(value * 100) / 100;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

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

const closePath = (commands: string[]): string => `${commands.join(" ")} Z`;

const computeBackNeckWidth = (neckSize: number): number => round2(clamp(neckSize / 5 - 0.4, 5.5, 8.5));

const computeBackNeckDepth = (neckSize: number): number => round2(clamp(neckSize / 20 + 0.3, 1.4, 3.1));

const computeFrontNeckWidth = (neckSize: number): number => round2(clamp(neckSize / 5 + 0.5, 6.5, 9.5));

const computeFrontNeckDepth = (neckSize: number): number => round2(clamp(neckSize / 5 + 1.1, 6.8, 10.5));

export const computeFrontNeckDart = (neckSize: number, reducedDarting: boolean): number => {
  const base = neckSize * 0.04 + 0.8;
  const adjusted = reducedDarting ? base * 0.75 : base;
  return round2(clamp(adjusted, 0.8, 4));
};

export const computeWaistDiff = (
  bust: number,
  bustEase: number,
  waist: number,
  waistEase: number,
): number => round2(Math.max(0, bust + bustEase - (waist + waistEase)));

export const computeWaistDartsFromDiff = (
  bustWaistDiff: number,
  closeWaistShaping: boolean,
  reducedDarting: boolean,
): Pick<
  DerivedValues,
  "frontWaistDart" | "backWaistDart" | "frontSideWaistDart" | "backSideWaistDart" | "frontWaistDartBackOff"
> => {
  const shapingFactor = closeWaistShaping ? 1 : 0.68;
  const dartFactor = reducedDarting ? 0.78 : 1;
  const activeDiff = Math.max(0, bustWaistDiff * shapingFactor * dartFactor);

  const frontWaistDart = activeDiff * 0.26;
  const backWaistDart = activeDiff * 0.24;
  const frontSideWaistDart = activeDiff * 0.27;
  const backSideWaistDart = Math.max(
    0,
    activeDiff - frontWaistDart - backWaistDart - frontSideWaistDart,
  );

  return {
    frontWaistDart: round2(frontWaistDart),
    backWaistDart: round2(backWaistDart),
    frontSideWaistDart: round2(frontSideWaistDart),
    backSideWaistDart: round2(backSideWaistDart),
    frontWaistDartBackOff: round2(frontWaistDart * 0.35),
  };
};

export const computePointADistance = (measurements: BaseMeasurements): number =>
  round2(measurements.backWidth / 2 + 1.5);

export const computePointBDistance = (measurements: BaseMeasurements): number =>
  round2(measurements.chest / 2 + 2.4);

const computeBackShoulderDrop = (shoulder: number): number => round2(clamp(shoulder * 0.16, 1.5, 3));

const computeFrontShoulderDrop = (shoulder: number): number => round2(clamp(shoulder * 0.24, 2.2, 4.2));

export const getDefaultBaseMeasurements = (): BaseMeasurements => ({
  ...DEFAULT_BASE_MEASUREMENTS,
});

export const computeDerived = (measurements: BaseMeasurements): DerivedValues => {
  const frontNeckDart = computeFrontNeckDart(measurements.neckSize, measurements.reducedDarting);
  const bustWaistDiff = computeWaistDiff(
    measurements.bust,
    measurements.bustEase,
    measurements.waist,
    measurements.waistEase,
  );

  return {
    frontNeckDart,
    bustWaistDiff,
    ...computeWaistDartsFromDiff(
      bustWaistDiff,
      measurements.closeWaistShaping,
      measurements.reducedDarting,
    ),
  };
};

const getBounds = (points: Record<string, PatternPoint>): PatternBounds => {
  const pointValues = Object.values(points);
  if (!pointValues.length) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = pointValues[0].x;
  let minY = pointValues[0].y;
  let maxX = pointValues[0].x;
  let maxY = pointValues[0].y;

  for (const p of pointValues) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }

  return { minX, minY, maxX, maxY };
};

export const buildScene = (effective: EffectiveMeasurements): PatternScene => {
  const backWidth = computePointADistance(effective);
  const frontWidth = computePointBDistance(effective);

  const waistY = effective.napeToWaist;
  const hipY = effective.napeToWaist + effective.waistToHip;
  const armscyeYBack = effective.armscyeDepth;
  const armscyeYFront = effective.armscyeDepth + 0.8;

  const backNeckWidth = computeBackNeckWidth(effective.neckSize);
  const backNeckDepth = computeBackNeckDepth(effective.neckSize);
  const frontNeckWidth = computeFrontNeckWidth(effective.neckSize);
  const frontNeckDepth = computeFrontNeckDepth(effective.neckSize);

  const backShoulderDrop = computeBackShoulderDrop(effective.shoulder);
  const frontShoulderDrop = computeFrontShoulderDrop(effective.shoulder);

  const gap = 10;
  const frontOriginX = backWidth + gap;

  const points: Record<string, PatternPoint> = {
    B0: point(0, 0),
    B1: point(0, waistY),
    B2: point(0, hipY),
    B3: point(backWidth, 0),
    B4: point(backWidth, armscyeYBack),
    B5: point(backWidth, waistY),
    B6: point(backWidth, hipY),
    B7: point(backNeckWidth, 0),
    B8: point(0, backNeckDepth),
    B9: point(backNeckWidth + effective.shoulder * 0.88, backShoulderDrop),
    B10: point(backWidth - Math.max(0.4, effective.backSideWaistDart / 2), waistY),
    B11: point(backWidth - Math.max(0.2, effective.backSideWaistDart * 0.18), armscyeYBack + 0.3),
    B12: point(backWidth * 0.5 - effective.backWaistDart / 2, waistY),
    B13: point(backWidth * 0.5 + effective.backWaistDart / 2, waistY),
    B14: point(backWidth * 0.5, waistY - armscyeYBack * 0.62),

    F0: point(frontOriginX, 0),
    F1: point(frontOriginX, waistY),
    F2: point(frontOriginX, hipY),
    F3: point(frontOriginX + frontWidth, 0),
    F4: point(frontOriginX + frontWidth, armscyeYFront),
    F5: point(frontOriginX + frontWidth, waistY),
    F6: point(frontOriginX + frontWidth, hipY),
    F7: point(frontOriginX + frontNeckWidth, 0),
    F8: point(frontOriginX, frontNeckDepth),
    F9: point(frontOriginX + frontNeckWidth + effective.shoulder * 0.84, frontShoulderDrop),
    F10: point(frontOriginX + frontWidth - Math.max(0.4, effective.frontSideWaistDart / 2), waistY),
    F11: point(frontOriginX + frontWidth - Math.max(0.2, effective.frontSideWaistDart * 0.12), armscyeYFront + 0.4),
    F12: point(
      frontOriginX + frontWidth * 0.42 + effective.frontWaistDartBackOff - effective.frontWaistDart / 2,
      waistY,
    ),
    F13: point(
      frontOriginX + frontWidth * 0.42 + effective.frontWaistDartBackOff + effective.frontWaistDart / 2,
      waistY,
    ),
    F14: point(frontOriginX + frontWidth * 0.42 + effective.frontWaistDartBackOff, waistY - armscyeYFront * 0.56),
    F15: point(frontOriginX + frontNeckWidth * 0.56 - effective.frontNeckDart / 2, 0),
    F16: point(frontOriginX + frontNeckWidth * 0.56 + effective.frontNeckDart / 2, 0),
    F17: point(frontOriginX + frontNeckWidth * 0.56, frontNeckDepth * 0.55),
  };

  const backOutline = closePath([
    `M ${fmt(points.B1.x)} ${fmt(points.B1.y)}`,
    `L ${fmt(points.B0.x)} ${fmt(points.B0.y)}`,
    `C ${fmt(backNeckWidth * 0.1)} ${fmt(backNeckDepth * 0.2)} ${fmt(backNeckWidth * 0.45)} ${fmt(
      backNeckDepth,
    )} ${fmt(points.B7.x)} ${fmt(points.B7.y)}`,
    `L ${fmt(points.B9.x)} ${fmt(points.B9.y)}`,
    `C ${fmt(points.B9.x + 1.2)} ${fmt(points.B9.y + 0.2)} ${fmt(points.B11.x - 0.8)} ${fmt(
      points.B11.y - 1.1,
    )} ${fmt(points.B11.x)} ${fmt(points.B11.y)}`,
    `L ${fmt(points.B10.x)} ${fmt(points.B10.y)}`,
  ]);

  const frontOutline = closePath([
    `M ${fmt(points.F1.x)} ${fmt(points.F1.y)}`,
    `L ${fmt(points.F0.x)} ${fmt(points.F0.y)}`,
    `C ${fmt(points.F0.x + frontNeckWidth * 0.08)} ${fmt(frontNeckDepth * 0.6)} ${fmt(
      points.F7.x - frontNeckWidth * 0.15,
    )} ${fmt(frontNeckDepth * 0.18)} ${fmt(points.F7.x)} ${fmt(points.F7.y)}`,
    `L ${fmt(points.F15.x)} ${fmt(points.F15.y)}`,
    `L ${fmt(points.F17.x)} ${fmt(points.F17.y)}`,
    `L ${fmt(points.F16.x)} ${fmt(points.F16.y)}`,
    `L ${fmt(points.F9.x)} ${fmt(points.F9.y)}`,
    `C ${fmt(points.F9.x + 1.1)} ${fmt(points.F9.y + 0.3)} ${fmt(points.F11.x - 1.4)} ${fmt(
      points.F11.y - 1.2,
    )} ${fmt(points.F11.x)} ${fmt(points.F11.y)}`,
    `L ${fmt(points.F10.x)} ${fmt(points.F10.y)}`,
  ]);

  const paths = [
    {
      id: "construction-waist",
      d: linePath(point(-2, waistY), point(frontOriginX + frontWidth + 2, waistY)),
      stroke: "currentColor",
      strokeWidth: 0.15,
      dashed: true,
    },
    {
      id: "construction-hip",
      d: linePath(point(-2, hipY), point(frontOriginX + frontWidth + 2, hipY)),
      stroke: "currentColor",
      strokeWidth: 0.15,
      dashed: true,
    },
    {
      id: "construction-back-armscye",
      d: linePath(point(-2, armscyeYBack), point(backWidth + 2, armscyeYBack)),
      stroke: "currentColor",
      strokeWidth: 0.15,
      dashed: true,
    },
    {
      id: "construction-front-armscye",
      d: linePath(point(frontOriginX - 2, armscyeYFront), point(frontOriginX + frontWidth + 2, armscyeYFront)),
      stroke: "currentColor",
      strokeWidth: 0.15,
      dashed: true,
    },
    {
      id: "back-outline",
      d: backOutline,
      stroke: "currentColor",
      strokeWidth: 0.35,
    },
    {
      id: "front-outline",
      d: frontOutline,
      stroke: "currentColor",
      strokeWidth: 0.35,
    },
    {
      id: "back-waist-dart",
      d: linePath(points.B12, points.B14, points.B13),
      stroke: "currentColor",
      strokeWidth: 0.25,
    },
    {
      id: "front-waist-dart",
      d: linePath(points.F12, points.F14, points.F13),
      stroke: "currentColor",
      strokeWidth: 0.25,
    },
    {
      id: "center-back-line",
      d: linePath(points.B0, points.B2),
      stroke: "currentColor",
      strokeWidth: 0.2,
      dashed: true,
    },
    {
      id: "center-front-line",
      d: linePath(points.F0, points.F2),
      stroke: "currentColor",
      strokeWidth: 0.2,
      dashed: true,
    },
    {
      id: "back-neck-curve",
      d: cubicPath(
        points.B8,
        point(backNeckWidth * 0.15, backNeckDepth * 0.9),
        point(backNeckWidth * 0.65, backNeckDepth * 0.35),
        points.B7,
      ),
      stroke: "currentColor",
      strokeWidth: 0.2,
      dashed: true,
    },
    {
      id: "front-neck-curve",
      d: cubicPath(
        points.F8,
        point(points.F0.x + frontNeckWidth * 0.05, frontNeckDepth * 0.62),
        point(points.F7.x - frontNeckWidth * 0.25, frontNeckDepth * 0.2),
        points.F7,
      ),
      stroke: "currentColor",
      strokeWidth: 0.2,
      dashed: true,
    },
  ];

  const labels = [
    { id: "label-back", text: "Back Bodice", x: backWidth * 0.33, y: -2, color: "currentColor" },
    {
      id: "label-front",
      text: "Front Bodice",
      x: frontOriginX + frontWidth * 0.25,
      y: -2,
      color: "currentColor",
    },
    {
      id: "label-waist",
      text: `Waist ${fmt(waistY)} cm`,
      x: frontOriginX + frontWidth + 3,
      y: waistY,
      color: "currentColor",
    },
    {
      id: "label-back-dart",
      text: `Back Dart ${fmt(effective.backWaistDart)} cm`,
      x: points.B14.x + 0.6,
      y: points.B14.y,
      rotation: -12,
      color: "currentColor",
    },
    {
      id: "label-front-dart",
      text: `Front Dart ${fmt(effective.frontWaistDart)} cm`,
      x: points.F14.x + 0.8,
      y: points.F14.y,
      rotation: -12,
      color: "currentColor",
    },
    {
      id: "label-front-neck-dart",
      text: `Neck Dart ${fmt(effective.frontNeckDart)} cm`,
      x: points.F17.x + 1,
      y: points.F17.y - 0.6,
      color: "currentColor",
    },
  ];

  const markers = Object.entries(points).map(([id, p]) => ({
    id: `marker-${id}`,
    x: p.x,
    y: p.y,
    r: 0.25,
    color: "currentColor",
  }));

  return {
    points,
    paths,
    labels,
    markers,
    bounds: getBounds(points),
  };
};
