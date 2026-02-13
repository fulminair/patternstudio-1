import type {
  PatternBounds,
  PatternPath,
  PatternPoint,
  PatternScene,
} from "@/patterns/types";
import type {
  ArmstrongBaseMeasurements,
  ArmstrongBustCup,
  ArmstrongDerivedValues,
  ArmstrongEffectiveMeasurements,
} from "./types";

type InPoint = {
  x: number;
  y: number;
};

type BezierRatio = {
  tangent: number;
  normal: number;
};

const IN_TO_CM = 2.54;
const CM_TO_IN = 1 / IN_TO_CM;
const BACK_GAP_CM = 10;
const BACK_OFFSET_IN = BACK_GAP_CM * CM_TO_IN;
const DART_PLACEMENT_DROP_IN = 0.1875;
const MARKER_RADIUS_CM = 0.45;

const DEFAULT_BASE_MEASUREMENTS: ArmstrongBaseMeasurements = {
  fullLength: 18,
  acrossShoulder: 7.9375,
  centreFrontLength: 14.875,
  bustArc: 10.375,
  shoulderSlope: 18.125,
  bustDepth: 9.6875,
  shoulderLength: 5.375,
  bustSpan: 4.0625,
  acrossChest: 6.9375,
  dartPlacement: 3.4375,
  newStrap: 18.1875,
  sideLength: 8.5,
  waistArc: 7.375,
  fullLengthBack: 17.875,
  acrossShoulderBack: 8.1875,
  centreFrontLengthBack: 17,
  bustArcBack: 9,
  shoulderSlopeBack: 17.375,
  shoulderLengthBack: 5.375,
  bustSpanBack: 4.0625,
  acrossChestBack: 7.1875,
  dartPlacementBack: 3.4375,
  sideLengthBack: 8.5,
  waistArcBack: 7,
  backNeck: 3.125,
  bustCup: "B Cup",
};

const BUST_CUP_OFFSETS: Record<"A" | "B" | "C" | "D", number> = {
  A: 0.875,
  B: 1.25,
  C: 1.5,
  D: 1.75,
};

const round2 = (value: number): number => Math.round(value * 100) / 100;
const round4 = (value: number): number => Math.round(value * 10000) / 10000;
const fmt = (value: number): string => String(Math.round(value * 1000) / 1000);

const toCm = (inches: number): number => inches * IN_TO_CM;

const pointIn = (x: number, y: number): InPoint => ({
  x: round4(x),
  y: round4(y),
});

const pointCm = (point: InPoint): PatternPoint => ({
  x: round2(toCm(point.x)),
  y: round2(toCm(point.y)),
});

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const distanceIn = (a: InPoint, b: InPoint): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const linePath = (...points: InPoint[]): string => {
  if (points.length < 2) {
    return "";
  }

  const [first, ...rest] = points;
  const firstCm = pointCm(first);
  const commands = [`M ${fmt(firstCm.x)} ${fmt(firstCm.y)}`];

  for (const next of rest) {
    const nextCm = pointCm(next);
    commands.push(`L ${fmt(nextCm.x)} ${fmt(nextCm.y)}`);
  }

  return commands.join(" ");
};

const cubicPath = (
  start: InPoint,
  c1: InPoint,
  c2: InPoint,
  end: InPoint,
): string => {
  const s = pointCm(start);
  const p1 = pointCm(c1);
  const p2 = pointCm(c2);
  const e = pointCm(end);

  return `M ${fmt(s.x)} ${fmt(s.y)} C ${fmt(p1.x)} ${fmt(p1.y)} ${fmt(p2.x)} ${fmt(p2.y)} ${fmt(e.x)} ${fmt(e.y)}`;
};

const midpoint = (a: InPoint, b: InPoint): InPoint =>
  pointIn((a.x + b.x) / 2, (a.y + b.y) / 2);

const move = (base: InPoint, dx: number, dy: number): InPoint =>
  pointIn(base.x + dx, base.y + dy);

const bezierControlFromRatio = (
  anchor: InPoint,
  chordStart: InPoint,
  chordEnd: InPoint,
  ratio: BezierRatio,
): InPoint => {
  const dx = chordEnd.x - chordStart.x;
  const dy = chordEnd.y - chordStart.y;
  const chordLength = Math.sqrt(dx * dx + dy * dy);

  if (chordLength <= 0.000001) {
    return pointIn(anchor.x, anchor.y);
  }

  const tangent = { x: dx / chordLength, y: dy / chordLength };
  const normal = { x: -tangent.y, y: tangent.x };

  return pointIn(
    anchor.x + (tangent.x * ratio.tangent + normal.x * ratio.normal) * chordLength,
    anchor.y + (tangent.y * ratio.tangent + normal.y * ratio.normal) * chordLength,
  );
};

const drawInwardArcControls = (
  start: InPoint,
  end: InPoint,
  depth: number,
): { control: InPoint } | null => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length <= 0.000001) {
    return null;
  }

  const mid = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
  const nx = -dy / length;
  const ny = dx / length;
  const offset = isFiniteNumber(depth) && depth !== 0 ? depth : 0.5;

  return {
    control: pointIn(mid.x + nx * offset, mid.y + ny * offset),
  };
};

const getBounds = (tracked: InPoint[]): PatternBounds => {
  if (tracked.length === 0) {
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
    minX: round2(toCm(minX)),
    minY: round2(toCm(minY)),
    maxX: round2(toCm(maxX)),
    maxY: round2(toCm(maxY)),
  };
};

const resolveBustCupOffset = (cup: ArmstrongBustCup): number => {
  const normalized = String(cup ?? "B Cup")
    .toUpperCase()
    .replace("CUP", "")
    .replace(/[^A-Z]/g, "")
    .trim();

  const key = normalized.charAt(0) as keyof typeof BUST_CUP_OFFSETS;
  return BUST_CUP_OFFSETS[key] ?? BUST_CUP_OFFSETS.B;
};

export const getDefaultBaseMeasurements = (): ArmstrongBaseMeasurements => ({
  ...DEFAULT_BASE_MEASUREMENTS,
});

export const computeDerived = (
  measurements: ArmstrongBaseMeasurements,
): ArmstrongDerivedValues => {
  const bustCupOffset = resolveBustCupOffset(measurements.bustCup);
  const frontWaistIntake = (measurements.waistArc + 0.25) - measurements.dartPlacement;
  const backWaistIntake = 1.5;

  return {
    bustCupOffset: round4(bustCupOffset),
    frontWaistIntake: round4(frontWaistIntake),
    backWaistIntake: round4(backWaistIntake),
  };
};

export const buildScene = (
  measurements: ArmstrongEffectiveMeasurements,
): PatternScene => {
  const pointsIn: Record<string, InPoint> = {};
  const markerTexts: Record<string, string> = {};
  const tracked: InPoint[] = [];

  const paths: PatternScene["paths"] = [];
  const labels: PatternScene["labels"] = [];
  const markers: PatternScene["markers"] = [];

  const track = (...pts: InPoint[]) => {
    for (const p of pts) {
      tracked.push(p);
    }
  };

  const registerPoint = (
    id: string,
    point: InPoint,
    markerText = id,
  ): InPoint => {
    const next = pointIn(point.x, point.y);
    pointsIn[id] = next;
    markerTexts[id] = markerText;
    track(next);
    return next;
  };

  const addPath = (
    path: Omit<PatternPath, "stroke"> & { stroke?: string },
  ) => {
    paths.push({
      stroke: "currentColor",
      ...path,
    });
  };

  const addLine = (
    id: string,
    start: InPoint,
    end: InPoint,
    options?: {
      dashed?: boolean;
      kind?: PatternPath["kind"];
      strokeWidth?: number;
    },
  ) => {
    track(start, end);
    addPath({
      id,
      d: linePath(start, end),
      strokeWidth: options?.strokeWidth ?? 0.24,
      dashed: options?.dashed,
      kind: options?.kind,
    });
  };

  const addCubic = (
    id: string,
    start: InPoint,
    c1: InPoint,
    c2: InPoint,
    end: InPoint,
    options?: {
      kind?: PatternPath["kind"];
      strokeWidth?: number;
    },
  ) => {
    track(start, c1, c2, end);
    addPath({
      id,
      d: cubicPath(start, c1, c2, end),
      strokeWidth: options?.strokeWidth ?? 0.24,
      kind: options?.kind,
    });
  };

  const frontA = registerPoint("A", pointIn(0, 0), "A");
  const fullLengthPlusEighth = measurements.fullLength + 0.125;
  const frontB = registerPoint("B", pointIn(0, fullLengthPlusEighth), "B");
  addLine("front-ab", frontA, frontB, { kind: "construction" });

  const acrossShoulderMinusEighth = measurements.acrossShoulder - 0.125;
  const frontC = registerPoint("C", pointIn(frontA.x + acrossShoulderMinusEighth, frontA.y), "C");
  addLine("front-ac", frontA, frontC, { kind: "construction" });

  const frontD = registerPoint(
    "D",
    pointIn(frontB.x, frontB.y - measurements.centreFrontLength),
    "D",
  );
  addLine("front-centre-front", frontB, frontD, { kind: "pattern", strokeWidth: 0.26 });

  const dLeft = pointIn(frontD.x + 4, frontD.y);
  addLine("front-d-guide", frontD, dLeft, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const bustArcPlusQuarter = measurements.bustArc + 0.25;
  const frontE = registerPoint(
    "E",
    pointIn(frontB.x + bustArcPlusQuarter, frontB.y),
    "E",
  );
  addLine("front-be", frontB, frontE, { kind: "construction" });

  const eUp = pointIn(frontE.x, frontE.y - 11);
  addLine("front-e-side-guide", frontE, eUp, { kind: "construction" });

  const cGuide = pointIn(frontC.x, frontC.y + 4);
  addLine("front-c-shoulder-guide", frontC, cGuide, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const shoulderSlopeLength = measurements.shoulderSlope;
  const horizontalSeparation = Math.abs(frontC.x - frontB.x);
  const verticalSpanSquared =
    shoulderSlopeLength * shoulderSlopeLength - horizontalSeparation * horizontalSeparation;
  const verticalSpan = verticalSpanSquared > 0 ? Math.sqrt(verticalSpanSquared) : 0;
  let gY = frontB.y - verticalSpan;
  if (gY < frontC.y) gY = frontC.y;
  if (gY > cGuide.y) gY = cGuide.y;

  const frontG = registerPoint("G", pointIn(frontC.x, gY), "G");
  addLine("front-shoulder-slope-guide", frontB, frontG, { kind: "construction" });

  const gbVec = { x: frontB.x - frontG.x, y: frontB.y - frontG.y };
  const gbLength = Math.sqrt(gbVec.x * gbVec.x + gbVec.y * gbVec.y);
  const gbUnit = {
    x: gbLength ? gbVec.x / gbLength : 0,
    y: gbLength ? gbVec.y / gbLength : 0,
  };
  const frontH = registerPoint(
    "H",
    pointIn(
      frontG.x + gbUnit.x * measurements.bustDepth,
      frontG.y + gbUnit.y * measurements.bustDepth,
    ),
    "H",
  );

  const acVec = { x: frontC.x - frontA.x, y: frontC.y - frontA.y };
  const w = { x: frontA.x - frontG.x, y: frontA.y - frontG.y };
  const aQuad = acVec.x * acVec.x + acVec.y * acVec.y;
  const bQuad = 2 * (w.x * acVec.x + w.y * acVec.y);
  const cQuad = w.x * w.x + w.y * w.y - measurements.shoulderLength * measurements.shoulderLength;

  let t = 0;
  let discriminant = bQuad * bQuad - 4 * aQuad * cQuad;
  if (discriminant < 0) {
    discriminant = 0;
  }

  if (Math.abs(aQuad) > 0.000001) {
    const sqrtDisc = Math.sqrt(discriminant);
    const t1 = (-bQuad + sqrtDisc) / (2 * aQuad);
    const t2 = (-bQuad - sqrtDisc) / (2 * aQuad);
    const clamp01 = (value: number): boolean => value >= 0 && value <= 1;

    if (clamp01(t1) && clamp01(t2)) {
      t = Math.abs(t1 - 1) < Math.abs(t2 - 1) ? t1 : t2;
    } else if (clamp01(t1)) {
      t = t1;
    } else if (clamp01(t2)) {
      t = t2;
    } else {
      t = Math.max(0, Math.min(1, t1));
    }
  }

  const frontI = registerPoint(
    "I",
    pointIn(frontA.x + acVec.x * t, frontA.y + acVec.y * t),
    "I",
  );
  addLine("front-gi", frontG, frontI, { kind: "pattern", strokeWidth: 0.26 });

  const diStartControl = move(frontD, 1.8, 0);
  const diEndControl = move(frontI, 0, 1.8);
  addCubic("front-neck-curve-di", frontD, diStartControl, diEndControl, frontI, {
    kind: "pattern",
    strokeWidth: 0.26,
  });

  const giVec = { x: frontI.x - frontG.x, y: frontI.y - frontG.y };
  const giLength = Math.sqrt(giVec.x * giVec.x + giVec.y * giVec.y);
  const perp = {
    x: giLength ? -giVec.y / giLength : 0,
    y: giLength ? giVec.x / giLength : 1,
  };
  const tDrop = Math.abs(perp.y) > 0.000001 ? (frontD.y - frontI.y) / perp.y : 0;
  const iDrop = pointIn(frontI.x + perp.x * tDrop, frontI.y + perp.y * tDrop);
  addLine("front-i-drop", frontI, iDrop, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const frontJ = registerPoint("J", pointIn(frontB.x, frontH.y), "J");

  const dToJLength = frontJ.y - frontD.y;
  const frontL = registerPoint("L", pointIn(frontB.x, frontD.y + dToJLength * 0.5), "L");

  const bustSpanPlusQuarter = measurements.bustSpan + 0.25;
  const frontK = registerPoint(
    "K",
    pointIn(frontJ.x + bustSpanPlusQuarter, frontJ.y),
    "K",
  );
  const kDrop = pointIn(frontK.x, frontK.y + 0.625);
  addLine("front-k-drop", frontK, kDrop, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("front-jk", frontJ, frontK, { kind: "construction" });

  const acrossChestPlusQuarter = measurements.acrossChest + 0.25;
  const frontM = registerPoint(
    "M",
    pointIn(frontL.x + acrossChestPlusQuarter, frontL.y),
    "M",
  );
  addLine("front-lm", frontL, frontM, { kind: "construction" });

  const mGuideTop = pointIn(frontM.x, frontM.y - 2);
  const mGuideBottom = pointIn(frontM.x, frontM.y + 1);
  addLine("front-m-guide", mGuideTop, mGuideBottom, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const fTop = pointIn(frontB.x + measurements.dartPlacement, frontB.y);
  const frontF = registerPoint(
    "F",
    pointIn(fTop.x, fTop.y + DART_PLACEMENT_DROP_IN),
    "F",
  );
  addLine("front-f-drop", fTop, frontF, { kind: "construction" });
  addLine("front-fh", frontF, frontH, { kind: "construction" });
  addLine("front-bf", frontB, frontF, { kind: "pattern", strokeWidth: 0.26 });

  const kfStart = kDrop;
  addLine("front-kf", kfStart, frontF, { kind: "pattern", strokeWidth: 0.26 });

  const newStrapPlusEighth = measurements.newStrap + 0.125;
  const dxSide = frontE.x - frontI.x;
  let dySquared = newStrapPlusEighth * newStrapPlusEighth - dxSide * dxSide;
  if (dySquared < 0) {
    dySquared = 0;
  }

  const dySide = Math.sqrt(dySquared);
  const candidateNY1 = frontI.y + dySide;
  const candidateNY2 = frontI.y - dySide;
  const sideUpperY = frontE.y;
  const sideLowerY = frontE.y - 11;

  const isOnSideGuide = (value: number): boolean =>
    value >= Math.min(sideLowerY, sideUpperY) && value <= Math.max(sideLowerY, sideUpperY);

  let selectedNY = candidateNY1;
  if (!isOnSideGuide(selectedNY) && isOnSideGuide(candidateNY2)) {
    selectedNY = candidateNY2;
  } else if (isOnSideGuide(candidateNY1) && isOnSideGuide(candidateNY2)) {
    selectedNY =
      Math.abs(candidateNY1 - sideUpperY) < Math.abs(candidateNY2 - sideUpperY)
        ? candidateNY1
        : candidateNY2;
  } else if (!isOnSideGuide(selectedNY)) {
    selectedNY = Math.max(Math.min(selectedNY, sideUpperY), sideLowerY);
  }

  const frontN = registerPoint("N", pointIn(frontE.x, selectedNY), "N");
  addLine("front-in", frontI, frontN, { kind: "construction" });

  const frontO = registerPoint("O", pointIn(frontE.x, frontN.y - measurements.sideLength), "O");
  addLine("front-no", frontN, frontO, { kind: "construction" });

  {
    const controls = drawInwardArcControls(frontG, frontO, 0);
    if (controls) {
      const c1Base = bezierControlFromRatio(frontG, frontG, frontO, {
        tangent: 0.5295,
        normal: 0.494,
      });
      const c1 = move(c1Base, -0.15, 0);
      const c2 = bezierControlFromRatio(frontO, frontG, frontO, {
        tangent: -0.1495,
        normal: 0.3325,
      });
      const fallback = controls.control;
      addCubic("front-armhole-go", frontG, c1 ?? fallback, c2 ?? fallback, frontO, {
        kind: "pattern",
        strokeWidth: 0.26,
      });
    }
  }

  const pointPBase = pointIn(frontN.x + measurements.bustCupOffset, frontN.y);
  const sideLengthTarget = measurements.sideLength;
  const onVec = { x: frontN.x - frontO.x, y: frontN.y - frontO.y };
  const onDistance = Math.sqrt(onVec.x * onVec.x + onVec.y * onVec.y);

  let frontP = pointPBase;
  if (sideLengthTarget > 0 && onDistance > 0) {
    const r0 = sideLengthTarget;
    const r1 = measurements.bustCupOffset;

    if (onDistance <= r0 + r1 && onDistance >= Math.abs(r0 - r1)) {
      const aInt = (r0 * r0 - r1 * r1 + onDistance * onDistance) / (2 * onDistance);
      let hSq = r0 * r0 - aInt * aInt;
      if (hSq < 0) {
        hSq = 0;
      }
      const hInt = Math.sqrt(hSq);
      const baseX = frontO.x + (aInt * (frontN.x - frontO.x)) / onDistance;
      const baseY = frontO.y + (aInt * (frontN.y - frontO.y)) / onDistance;
      const offsetX = -((frontN.y - frontO.y) * (hInt / onDistance));
      const offsetY = (frontN.x - frontO.x) * (hInt / onDistance);

      const candidate1 = pointIn(baseX + offsetX, baseY + offsetY);
      const candidate2 = pointIn(baseX - offsetX, baseY - offsetY);

      const dist1 =
        (candidate1.x - pointPBase.x) * (candidate1.x - pointPBase.x) +
        (candidate1.y - pointPBase.y) * (candidate1.y - pointPBase.y);
      const dist2 =
        (candidate2.x - pointPBase.x) * (candidate2.x - pointPBase.x) +
        (candidate2.y - pointPBase.y) * (candidate2.y - pointPBase.y);

      frontP = dist1 <= dist2 ? candidate1 : candidate2;
    } else {
      const opVec = { x: pointPBase.x - frontO.x, y: pointPBase.y - frontO.y };
      const opLength = Math.sqrt(opVec.x * opVec.x + opVec.y * opVec.y);
      if (opLength > 0) {
        const scale = sideLengthTarget / opLength;
        frontP = pointIn(frontO.x + opVec.x * scale, frontO.y + opVec.y * scale);
      }
    }
  }

  addLine("front-op", frontO, frontP, { kind: "pattern", strokeWidth: 0.26 });
  frontP = registerPoint("P", frontP, "P");

  const waistArcPlusQuarter = measurements.waistArc + 0.25;
  const bToF = Math.abs(fTop.x - frontB.x);
  const qDistance = waistArcPlusQuarter - bToF;
  const pfVec = { x: frontF.x - frontP.x, y: frontF.y - frontP.y };
  const pfLength = Math.sqrt(pfVec.x * pfVec.x + pfVec.y * pfVec.y);

  let qTarget = pointIn(frontP.x, frontP.y);
  if (pfLength > 0) {
    const scaleToQ = qDistance / pfLength;
    qTarget = pointIn(frontP.x + pfVec.x * scaleToQ, frontP.y + pfVec.y * scaleToQ);
  }

  const kfVec = { x: frontF.x - kfStart.x, y: frontF.y - kfStart.y };
  const kfLength = Math.sqrt(kfVec.x * kfVec.x + kfVec.y * kfVec.y);
  const kqVec = { x: qTarget.x - kfStart.x, y: qTarget.y - kfStart.y };
  const kqLength = Math.sqrt(kqVec.x * kqVec.x + kqVec.y * kqVec.y);

  if (kfLength > 0 && kqLength > 0) {
    const kqScale = kfLength / kqLength;
    qTarget = pointIn(kfStart.x + kqVec.x * kqScale, kfStart.y + kqVec.y * kqScale);
  }

  addLine("front-kq", kfStart, qTarget, { kind: "pattern", strokeWidth: 0.26 });
  const frontQ = registerPoint("Q", qTarget, "Q");
  addLine("front-pq", frontP, frontQ, { kind: "pattern", strokeWidth: 0.26 });

  const backFullLength = measurements.fullLengthBack || measurements.fullLength;
  const backFullLengthPlusEighth = backFullLength + 0.125;
  const backVerticalOffset = frontB.y - backFullLengthPlusEighth;

  const backCoord = (x: number, y: number): InPoint =>
    pointIn(frontA.x - BACK_OFFSET_IN + x, frontA.y + backVerticalOffset + y);

  const backA = registerPoint("BA", backCoord(0, 0), "A");
  const backB = registerPoint("BB", backCoord(0, backFullLengthPlusEighth), "B");
  addLine("back-ab", backA, backB, { kind: "construction" });

  const backDartPlacement = measurements.dartPlacementBack || measurements.dartPlacement || 0;
  let backI = registerPoint(
    "BI",
    backCoord(-backDartPlacement, backFullLengthPlusEighth),
    "I",
  );

  const backWaistArcValue = measurements.waistArcBack || measurements.waistArc || 0;
  const backJOffset = backWaistArcValue + 1.5 + 0.25;
  registerPoint("BJ", backCoord(-backJOffset, backFullLengthPlusEighth), "J");

  const dartIntake = 1.5;
  let backK = registerPoint(
    "BK",
    backCoord(-(backDartPlacement + dartIntake), backFullLengthPlusEighth),
    "K",
  );
  const backL = registerPoint(
    "BL",
    backCoord(-(backDartPlacement + dartIntake / 2), backFullLengthPlusEighth),
    "L",
  );
  const backM = registerPoint("BM", backCoord(-backJOffset, backFullLengthPlusEighth + 0.1875), "M");

  const centreBackLength = measurements.centreFrontLengthBack || measurements.centreFrontLength;
  const backD = registerPoint(
    "BD",
    backCoord(0, backFullLengthPlusEighth - centreBackLength),
    "D",
  );
  addLine("back-centre-back", backD, backB, { kind: "pattern", strokeWidth: 0.26 });

  const backAcrossShoulder = measurements.acrossShoulderBack || measurements.acrossShoulder;
  const backC = registerPoint("BC", backCoord(-backAcrossShoulder, 0), "C");
  addLine("back-ac", backA, backC, { kind: "construction" });

  const backDGuideEnd = pointIn(backD.x - 4, backD.y);
  addLine("back-d-guide", backD, backDGuideEnd, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const backCGuideEnd = pointIn(backC.x, backC.y + 6);
  addLine("back-c-guide", backC, backCGuideEnd, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const backBustArc = measurements.bustArcBack || measurements.bustArc;
  const backE = registerPoint(
    "BE",
    backCoord(-(backBustArc + 0.75), backFullLengthPlusEighth),
    "E",
  );
  addLine("back-be", backB, backE, { kind: "construction" });

  const backEUp = backCoord(-(backBustArc + 0.75), backFullLengthPlusEighth - 10);
  addLine("back-e-guide", backE, backEUp, { kind: "construction" });

  const backNeckPlusEighth = (measurements.backNeck || 0) + 0.125;
  const backF = registerPoint("BF", backCoord(-backNeckPlusEighth, 0), "F");

  const backDFLength = distanceIn(backD, backF);
  if (backDFLength > 0.000001) {
    const backNeckC1 = bezierControlFromRatio(backD, backD, backF, {
      tangent: 0.5164137931,
      normal: -0.1390344828,
    });
    const backNeckC2 = bezierControlFromRatio(backF, backD, backF, {
      tangent: -0.1807448276,
      normal: -0.191337931,
    });
    addCubic("back-neck-curve", backD, backNeckC1, backNeckC2, backF, {
      kind: "pattern",
      strokeWidth: 0.26,
    });
  }

  const dxSlope = backC.x - backB.x;
  const baseDy = backC.y - backB.y;
  const shoulderSlopeBack = (measurements.shoulderSlopeBack || measurements.shoulderSlope) + 0.125;
  const aSlope = 1;
  const bSlope = 2 * baseDy;
  const cSlope = baseDy * baseDy + dxSlope * dxSlope - shoulderSlopeBack * shoulderSlopeBack;
  const discriminantSlope = bSlope * bSlope - 4 * aSlope * cSlope;

  let tSlope = 0;
  if (discriminantSlope >= 0) {
    const sqrtDisc = Math.sqrt(discriminantSlope);
    const t1 = (-bSlope + sqrtDisc) / (2 * aSlope);
    const t2 = (-bSlope - sqrtDisc) / (2 * aSlope);
    const withinBackGuide = (value: number): boolean => value >= 0 && value <= 6;

    if (withinBackGuide(t1) && withinBackGuide(t2)) {
      tSlope = Math.max(t1, t2);
    } else if (withinBackGuide(t1)) {
      tSlope = t1;
    } else if (withinBackGuide(t2)) {
      tSlope = t2;
    } else {
      tSlope = Math.max(0, Math.min(6, t1));
    }
  }

  const backG = registerPoint("BG", backCoord(-backAcrossShoulder, tSlope), "G");
  addLine("back-shoulder-slope-guide", backB, backG, { kind: "construction" });

  const backFGVec = { x: backG.x - backF.x, y: backG.y - backF.y };
  const backFGLen = Math.sqrt(backFGVec.x * backFGVec.x + backFGVec.y * backFGVec.y);
  const shoulderLengthPlusHalf =
    (measurements.shoulderLengthBack || measurements.shoulderLength || 0) + 0.5;
  const backFHScale = backFGLen ? shoulderLengthPlusHalf / backFGLen : 0;
  const backH = registerPoint(
    "BH",
    pointIn(backF.x + backFGVec.x * backFHScale, backF.y + backFGVec.y * backFHScale),
    "H",
  );
  addLine("back-fh-guide", backF, backH, { kind: "construction" });

  const backP = registerPoint("BP", midpoint(backF, backH), "P");

  const fhVec = { x: backH.x - backF.x, y: backH.y - backF.y };
  const fhLength = Math.sqrt(fhVec.x * fhVec.x + fhVec.y * fhVec.y) || 1;
  const fhUnit = { x: fhVec.x / fhLength, y: fhVec.y / fhLength };

  let backR = registerPoint(
    "BR",
    pointIn(backP.x - fhUnit.x * 0.25, backP.y - fhUnit.y * 0.25),
    "R",
  );
  let backa = registerPoint(
    "Ba",
    pointIn(backP.x + fhUnit.x * 0.25, backP.y + fhUnit.y * 0.25),
    "a",
  );

  const backSideLength = measurements.sideLengthBack || measurements.sideLength || 0;
  const dxMN = backE.x - backM.x;
  let dySquaredMN = backSideLength * backSideLength - dxMN * dxMN;
  if (dySquaredMN < 0) {
    dySquaredMN = 0;
  }

  let backN = pointIn(backE.x, backM.y - Math.sqrt(dySquaredMN));
  if (backN.y < backEUp.y) {
    backN = pointIn(backN.x, backEUp.y);
  }
  backN = registerPoint("BN", backN, "N");
  addLine("back-mn", backM, backN, { kind: "pattern", strokeWidth: 0.26 });

  const backMNLength = distanceIn(backN, backM);
  const backOOffset = Math.max(0, backMNLength - 1);
  const backO = registerPoint("BO", pointIn(backL.x, backL.y - backOOffset), "O");
  addLine("back-l-o-guide", backL, backO, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const backDLength = distanceIn(backB, backD);
  const backS = registerPoint(
    "BS",
    backCoord(0, backFullLengthPlusEighth - centreBackLength + backDLength / 4),
    "S",
  );

  const backAcrossChest = measurements.acrossChestBack || measurements.acrossChest;
  const backT = registerPoint("BT", backCoord(-(backAcrossChest + 0.25), backS.y), "T");
  addLine("back-st", backS, backT, { kind: "construction" });

  const backTUp = backCoord(-(backAcrossChest + 0.25), backT.y - 1);
  const backTDown = backCoord(-(backAcrossChest + 0.25), backT.y + 4);
  addLine("back-u-guide", backTUp, backTDown, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const hHandle = move(backH, 6 * CM_TO_IN, 10.21 * CM_TO_IN);
  const nHandle = move(backN, 4.07 * CM_TO_IN, 0);
  addCubic("back-armhole-curve", backH, hHandle, nHandle, backN, {
    kind: "pattern",
    strokeWidth: 0.26,
  });

  const extensionLength = 0.125;

  {
    const oiVec = { x: backI.x - backO.x, y: backI.y - backO.y };
    const oiLen = Math.sqrt(oiVec.x * oiVec.x + oiVec.y * oiVec.y);
    if (oiLen > 0.000001) {
      const scale = (oiLen + extensionLength) / oiLen;
      backI = pointIn(backO.x + oiVec.x * scale, backO.y + oiVec.y * scale);
      pointsIn.BI = backI;
      track(backI);
    }
    addLine("back-waist-dart-left", backO, backI, { kind: "pattern", strokeWidth: 0.26 });
  }

  {
    const okVec = { x: backK.x - backO.x, y: backK.y - backO.y };
    const okLen = Math.sqrt(okVec.x * okVec.x + okVec.y * okVec.y);
    if (okLen > 0.000001) {
      const scale = (okLen + extensionLength) / okLen;
      backK = pointIn(backO.x + okVec.x * scale, backO.y + okVec.y * scale);
      pointsIn.BK = backK;
      track(backK);
    }
    addLine("back-waist-dart-right", backO, backK, { kind: "pattern", strokeWidth: 0.26 });
  }

  const backPOVec = { x: backO.x - backP.x, y: backO.y - backP.y };
  const backPOLen = Math.sqrt(backPOVec.x * backPOVec.x + backPOVec.y * backPOVec.y);
  const backQDistance = 3;
  const backQScale = backPOLen ? backQDistance / backPOLen : 0;
  const backQ = registerPoint(
    "BQ",
    pointIn(backP.x + backPOVec.x * backQScale, backP.y + backPOVec.y * backQScale),
    "Q",
  );

  const backQRVec = { x: backR.x - backQ.x, y: backR.y - backQ.y };
  const backQRBaseLength = Math.sqrt(backQRVec.x * backQRVec.x + backQRVec.y * backQRVec.y) || 1;
  const backQRTargetLength = backQRBaseLength + 0.125;
  backR = pointIn(
    backQ.x + (backQRVec.x / backQRBaseLength) * backQRTargetLength,
    backQ.y + (backQRVec.y / backQRBaseLength) * backQRTargetLength,
  );
  pointsIn.BR = backR;
  track(backR);
  addLine("back-shoulder-dart-left", backQ, backR, { kind: "pattern", strokeWidth: 0.26 });

  const backQAVec = { x: backa.x - backQ.x, y: backa.y - backQ.y };
  const backQALength = Math.sqrt(backQAVec.x * backQAVec.x + backQAVec.y * backQAVec.y) || 1;
  backa = pointIn(
    backQ.x + (backQAVec.x / backQALength) * backQRTargetLength,
    backQ.y + (backQAVec.y / backQALength) * backQRTargetLength,
  );
  pointsIn.Ba = backa;
  track(backa);
  addLine("back-shoulder-dart-right", backQ, backa, { kind: "pattern", strokeWidth: 0.26 });

  addLine("back-shoulder-line-a-h", backa, backH, { kind: "pattern", strokeWidth: 0.26 });
  addLine("back-shoulder-line-f-r", backF, backR, { kind: "pattern", strokeWidth: 0.26 });
  addLine("back-waist-b-i", backB, backI, { kind: "pattern", strokeWidth: 0.26 });
  addLine("back-waist-k-m", backK, backM, { kind: "pattern", strokeWidth: 0.26 });
  addLine("back-dart-center", backP, backO, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  labels.push(
    {
      id: "front-cf",
      text: `CF (D-B) ${fmt(distanceIn(frontD, frontB))} in`,
      x: round2((pointCm(frontD).x + pointCm(frontB).x) / 2 + 0.8),
      y: round2((pointCm(frontD).y + pointCm(frontB).y) / 2),
      color: "currentColor",
    },
    {
      id: "front-waist-intake",
      text: `Front Intake ${fmt(measurements.frontWaistIntake)} in`,
      x: round2(pointCm(frontF).x + 1.2),
      y: round2(pointCm(frontF).y + 1.4),
      color: "currentColor",
    },
    {
      id: "back-cb",
      text: `CB (D-B) ${fmt(distanceIn(backD, backB))} in`,
      x: round2((pointCm(backD).x + pointCm(backB).x) / 2 - 1),
      y: round2((pointCm(backD).y + pointCm(backB).y) / 2),
      color: "currentColor",
    },
    {
      id: "bust-cup",
      text: `${measurements.bustCup} offset ${fmt(measurements.bustCupOffset)} in`,
      x: round2(pointCm(frontN).x + 1),
      y: round2(pointCm(frontN).y - 0.8),
      color: "currentColor",
    },
  );

  const points: PatternScene["points"] = {};
  for (const [id, inPoint] of Object.entries(pointsIn)) {
    points[id] = pointCm(inPoint);
    markers.push({
      id: `marker-${id}`,
      x: points[id].x,
      y: points[id].y,
      r: MARKER_RADIUS_CM,
      color: "currentColor",
      text: markerTexts[id],
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
