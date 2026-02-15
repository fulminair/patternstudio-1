import type {
  PatternBounds,
  PatternPath,
  PatternPoint,
  PatternScene,
} from "@/patterns/types";
import type {
  HofenbitzerStandardTrouserBaseMeasurements,
  HofenbitzerStandardTrouserDerivedValues,
  HofenbitzerStandardTrouserEffectiveMeasurements,
} from "./types";

type DraftPoint = {
  x: number;
  y: number;
};

type CubicSegment = {
  start: DraftPoint;
  c1: DraftPoint;
  c2: DraftPoint;
  end: DraftPoint;
};

type DartPlan = {
  WaDif: number;
  SideDart: number;
  FrontSideDart: number;
  BackSideDart: number;
  FrontDart: number;
  BackDart1: number;
  BackDart2: number;
};

const TUMMY_PROFILES = ["Flat", "Normal", "Fuller"] as const;
const HIP_PROFILES = ["Flat", "Normal", "Curvy"] as const;
const THIGH_PROFILES = ["Thin", "Normal", "Full"] as const;
const BUTTOCK_PROFILES = ["Flat", "Normal", "Full"] as const;

const DEFAULT_BASE_MEASUREMENTS: HofenbitzerStandardTrouserBaseMeasurements = {
  HiC: 97,
  WaC: 72,
  sWaH: 106,
  CrH: 26,
  CrL: 0,
  KnH: 0,
  ThC: 55.5,
  HEM: 42,
  BuA: 82,
  CrHReduction: 0,
  HemShorten: 0,
  CrotchExtAdjust: 0,
  Point11Shift: 0,
  SquareUpLen: 6,
  FrontWaistReduction: 0,
  WaistEase: 0,
  FrontSideDartOverride: 0,
  BackSideDartOverride: 0,
  FrontDartOverride: 0,
  BackDart1Override: 0,
  BackDart2Override: 0,
  FrontDartLen: 10,
  BackDart1Len: 14,
  BackDart2Len: 12,
  LegSeamShape: 1,
  BackHipAdjustment: 0,
  BackInseamReduction: 1,
  TummyProfileIndex: 1,
  HipProfileIndex: 1,
  HipBoneCurveIndex: 1,
  ThighProfileIndex: 1,
  ButtocksProfileIndex: 1,
};

const round2 = (value: number): number => Math.round(value * 100) / 100;
const round4 = (value: number): number => Math.round(value * 10000) / 10000;
const fmt = (value: number): string => String(Math.round(value * 1000) / 1000);
const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const p = (x: number, y: number): DraftPoint => ({
  x: round4(x),
  y: round4(y),
});

const out = (point: DraftPoint): PatternPoint => ({
  x: round2(point.x),
  y: round2(point.y),
});

const asLine = (start: DraftPoint, end: DraftPoint): string =>
  `M ${fmt(start.x)} ${fmt(start.y)} L ${fmt(end.x)} ${fmt(end.y)}`;

const asPolyline = (points: DraftPoint[]): string => {
  if (points.length < 2) {
    return "";
  }

  const [first, ...rest] = points;
  const commands = [`M ${fmt(first.x)} ${fmt(first.y)}`];
  for (const point of rest) {
    commands.push(`L ${fmt(point.x)} ${fmt(point.y)}`);
  }
  return commands.join(" ");
};

const asCubic = (
  start: DraftPoint,
  c1: DraftPoint,
  c2: DraftPoint,
  end: DraftPoint,
): string =>
  `M ${fmt(start.x)} ${fmt(start.y)} C ${fmt(c1.x)} ${fmt(c1.y)} ${fmt(c2.x)} ${fmt(c2.y)} ${fmt(end.x)} ${fmt(end.y)}`;

const asMultiCubic = (segments: CubicSegment[]): string => {
  if (!segments.length) {
    return "";
  }

  const commands = [`M ${fmt(segments[0].start.x)} ${fmt(segments[0].start.y)}`];
  for (const segment of segments) {
    commands.push(
      `C ${fmt(segment.c1.x)} ${fmt(segment.c1.y)} ${fmt(segment.c2.x)} ${fmt(segment.c2.y)} ${fmt(segment.end.x)} ${fmt(segment.end.y)}`,
    );
  }
  return commands.join(" ");
};

const distanceBetween = (a: DraftPoint, b: DraftPoint): number => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const normalize = (x: number, y: number): DraftPoint => {
  const len = Math.sqrt(x * x + y * y);
  if (len < 1e-8) {
    return p(0, 0);
  }
  return p(x / len, y / len);
};

const lineIntersection = (
  originA: DraftPoint,
  dirA: DraftPoint,
  originB: DraftPoint,
  dirB: DraftPoint,
): DraftPoint | null => {
  const det = dirA.x * dirB.y - dirA.y * dirB.x;
  if (Math.abs(det) < 1e-6) {
    return null;
  }

  const diffX = originB.x - originA.x;
  const diffY = originB.y - originA.y;
  const t = (diffX * dirB.y - diffY * dirB.x) / det;
  if (!Number.isFinite(t)) {
    return null;
  }

  const ix = originA.x + dirA.x * t;
  const iy = originA.y + dirA.y * t;
  if (!Number.isFinite(ix) || !Number.isFinite(iy)) {
    return null;
  }

  if (Math.abs(ix - originA.x) > 1000 || Math.abs(iy - originA.y) > 1000) {
    return null;
  }

  return p(ix, iy);
};

const intersectSegmentAtY = (
  a: DraftPoint,
  b: DraftPoint,
  y: number,
  clampToSegment = true,
): DraftPoint | null => {
  const dy = b.y - a.y;
  if (Math.abs(dy) < 1e-8) {
    return null;
  }

  const t = (y - a.y) / dy;
  if (clampToSegment && (t < 0 || t > 1)) {
    return null;
  }

  return p(a.x + (b.x - a.x) * t, y);
};

const projectPointToLine = (point: DraftPoint, linePoint: DraftPoint, lineUnit: DraftPoint): DraftPoint => {
  const dx = point.x - linePoint.x;
  const dy = point.y - linePoint.y;
  const t = dx * lineUnit.x + dy * lineUnit.y;
  return p(linePoint.x + lineUnit.x * t, linePoint.y + lineUnit.y * t);
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

const getProfileName = <T extends readonly string[]>(values: T, index: number): T[number] => {
  if (!Number.isFinite(index)) {
    return values[1] as T[number];
  }

  const clamped = clamp(Math.round(index), 0, values.length - 1);
  return values[clamped] as T[number];
};

const resolveCoreValues = (base: HofenbitzerStandardTrouserBaseMeasurements) => {
  const CrHReduction = clamp(base.CrHReduction, 0, 1);
  const HemShorten = clamp(base.HemShorten, 0, 4);
  const BackInseamReduction = clamp(base.BackInseamReduction, 0.5, 1.5);
  const LegSeamShape = Math.max(0, base.LegSeamShape);
  const SquareUpLen = Math.max(0, base.SquareUpLen);
  const HiC = Math.max(0, base.HiC);
  const WaC = Math.max(0, base.WaC);
  const sWaH = Math.max(0, base.sWaH);
  const CrH = Math.max(0, base.CrH);
  const HEM = Math.max(0, base.HEM);
  const BuA = Number.isFinite(base.BuA) ? base.BuA : 82;
  const WaistEase = Number.isFinite(base.WaistEase) ? base.WaistEase : 0;

  let CrL = Number.isFinite(base.CrL) ? base.CrL : 0;
  if (CrL <= 0) {
    CrL = Math.max(0, sWaH - CrH);
  }

  let KnH = Number.isFinite(base.KnH) ? base.KnH : 0;
  if (KnH <= 0) {
    KnH = Math.max(0, (CrL / 10) * 4);
  }

  const thighProfile = getProfileName(THIGH_PROFILES, base.ThighProfileIndex).toLowerCase();
  let CrotchExtAdjust = Number.isFinite(base.CrotchExtAdjust) ? base.CrotchExtAdjust : 0;
  if (thighProfile === "full" && CrotchExtAdjust < 1.5) {
    CrotchExtAdjust = 1.5;
  }

  return {
    CrHReduction,
    HemShorten,
    BackInseamReduction,
    LegSeamShape,
    SquareUpLen,
    HiC,
    WaC,
    sWaH,
    CrH,
    HEM,
    BuA,
    WaistEase,
    CrL,
    KnH,
    CrotchExtAdjust,
  };
};

export const getDefaultBaseMeasurements = (): HofenbitzerStandardTrouserBaseMeasurements => ({
  ...DEFAULT_BASE_MEASUREMENTS,
});

export const computeDerived = (
  base: HofenbitzerStandardTrouserBaseMeasurements,
): HofenbitzerStandardTrouserDerivedValues => {
  const core = resolveCoreValues(base);
  const tummy = getProfileName(TUMMY_PROFILES, base.TummyProfileIndex).toLowerCase();
  const hip = getProfileName(HIP_PROFILES, base.HipProfileIndex).toLowerCase();
  const buttocks = getProfileName(BUTTOCK_PROFILES, base.ButtocksProfileIndex).toLowerCase();

  const FrontTrouserWidth = Math.max(0, tummy === "fuller" ? core.WaC / 4 + 2 : core.HiC / 4 - 1);
  const BackTrouserWidth = Math.max(0, tummy === "fuller" ? core.WaC / 4 - 1.8 : core.HiC / 4 + 1);

  let autoBackAdjust = 0;
  if (buttocks === "flat" && hip === "curvy") {
    autoBackAdjust = 1;
  } else if (buttocks === "full" && hip === "flat") {
    autoBackAdjust = -1;
  }

  const backManualAdjust = Number.isFinite(base.BackHipAdjustment) ? base.BackHipAdjustment : 0;

  return {
    CrLResolved: round2(core.CrL),
    KnHResolved: round2(core.KnH),
    WaistDifferenceGuide: round2(Math.max(0, core.HiC / 2 - (core.WaC + core.WaistEase) / 2)),
    FrontTrouserWidth: round2(FrontTrouserWidth),
    BackTrouserWidth: round2(BackTrouserWidth),
    FrontCrotchExtension: round2(Math.max(0, FrontTrouserWidth / 4 + core.CrotchExtAdjust)),
    BackCrotchExtension: round2(Math.max(0, BackTrouserWidth / 4 + autoBackAdjust + backManualAdjust)),
  };
};

const buildDartPlan = (
  measurements: HofenbitzerStandardTrouserEffectiveMeasurements,
  hipProfile: string,
): DartPlan => {
  const WaDif = Math.max(0, measurements.HiC / 2 - (measurements.WaC + measurements.WaistEase) / 2);

  let sideDef = WaDif * 0.5;
  if (hipProfile === "curvy") {
    sideDef += 0.75;
  } else if (hipProfile === "flat") {
    sideDef -= 0.75;
  }
  sideDef = clamp(sideDef, 0, WaDif);

  const frontSideOverride = Math.max(0, measurements.FrontSideDartOverride);
  const backSideOverride = Math.max(0, measurements.BackSideDartOverride);

  let FrontSideDart = 0;
  let BackSideDart = 0;

  if (frontSideOverride > 0 || backSideOverride > 0) {
    const total = frontSideOverride + backSideOverride;
    if (total > WaDif && total > 0) {
      const scale = WaDif / total;
      FrontSideDart = frontSideOverride * scale;
      BackSideDart = backSideOverride * scale;
    } else {
      FrontSideDart = frontSideOverride;
      BackSideDart = backSideOverride;
    }
  } else {
    FrontSideDart = sideDef / 2;
    BackSideDart = sideDef - FrontSideDart;
  }

  const SideDart = Math.max(0, FrontSideDart + BackSideDart);

  let remainder = Math.max(0, WaDif - SideDart);

  let FrontDart = measurements.FrontDartOverride > 0
    ? Math.max(0, measurements.FrontDartOverride)
    : clamp(remainder / 3, 0, 2.5);

  if (FrontDart > remainder) {
    FrontDart = remainder;
  }

  remainder = Math.max(0, remainder - FrontDart);

  let BackDart1 = measurements.BackDart1Override > 0
    ? Math.max(0, measurements.BackDart1Override)
    : clamp(remainder, 0, 4.5);

  if (BackDart1 > remainder) {
    BackDart1 = remainder;
  }

  remainder = Math.max(0, remainder - BackDart1);

  let BackDart2 = measurements.BackDart2Override > 0
    ? Math.max(0, measurements.BackDart2Override)
    : Math.max(0, remainder);

  const totalDart = SideDart + FrontDart + BackDart1 + BackDart2;
  if (totalDart > WaDif) {
    let excess = totalDart - WaDif;

    const trim = (value: number): number => {
      const cut = Math.min(excess, Math.max(0, value));
      excess -= cut;
      return Math.max(0, value - cut);
    };

    BackDart2 = trim(BackDart2);
    if (excess > 0) FrontDart = trim(FrontDart);
    if (excess > 0) BackDart1 = trim(BackDart1);
  }

  const totalAfterTrim = SideDart + FrontDart + BackDart1 + BackDart2;
  if (totalAfterTrim < WaDif) {
    let shortage = WaDif - totalAfterTrim;
    const roomBack1 = Math.max(0, 4.5 - BackDart1);
    const addBack1 = Math.min(shortage, roomBack1);
    BackDart1 += addBack1;
    shortage -= addBack1;
    if (shortage > 0) {
      BackDart2 += shortage;
    }
  }

  return {
    WaDif: round2(WaDif),
    SideDart: round2(SideDart),
    FrontSideDart: round2(FrontSideDart),
    BackSideDart: round2(BackSideDart),
    FrontDart: round2(FrontDart),
    BackDart1: round2(BackDart1),
    BackDart2: round2(BackDart2),
  };
};

const resolveFrontWaistReduction = (
  measurements: HofenbitzerStandardTrouserEffectiveMeasurements,
): number => {
  if (measurements.FrontWaistReduction > 0) {
    return clamp(measurements.FrontWaistReduction, 0.5, 1);
  }

  const ratio = measurements.HiC > 0 ? measurements.WaC / measurements.HiC : 0;
  return ratio < 0.75 ? 1 : 0.5;
};

const buildFrontCfCrotchHandles = (
  p8a: DraftPoint,
  p17: DraftPoint,
  cPoint: DraftPoint,
  fPoint: DraftPoint,
  ePoint: DraftPoint,
): { handleA: DraftPoint; handle17: DraftPoint } => {
  const vecAE = p(ePoint.x - p8a.x, ePoint.y - p8a.y);
  const lenAE = Math.max(1e-8, distanceBetween(p8a, ePoint));
  const uAE = p(vecAE.x / lenAE, vecAE.y / lenAE);

  const vec17F = p(fPoint.x - p17.x, fPoint.y - p17.y);
  const len17F = Math.max(1e-8, distanceBetween(p17, fPoint));
  const u17F = p(vec17F.x / len17F, vec17F.y / len17F);

  let baseLenA = Math.min(6.8, lenAE);
  let baseLen17 = Math.min(1.31, len17F);

  const segmentVec = p(p17.x - p8a.x, p17.y - p8a.y);
  const segmentLenSquared = Math.max(1e-8, segmentVec.x * segmentVec.x + segmentVec.y * segmentVec.y);

  const projectT = (point: DraftPoint): number => {
    const dx = point.x - p8a.x;
    const dy = point.y - p8a.y;
    const raw = (dx * segmentVec.x + dy * segmentVec.y) / segmentLenSquared;
    return clamp(raw, 0, 1);
  };

  const bezierPoint = (t: number, hA: DraftPoint, h17: DraftPoint): DraftPoint => {
    const om = 1 - t;
    const a = om * om * om;
    const b = 3 * om * om * t;
    const c = 3 * om * t * t;
    const d = t * t * t;
    return p(
      a * p8a.x + b * hA.x + c * h17.x + d * p17.x,
      a * p8a.y + b * hA.y + c * h17.y + d * p17.y,
    );
  };

  const midCFLine = p((cPoint.x + fPoint.x) / 2, (cPoint.y + fPoint.y) / 2);
  const midF17Line = p((fPoint.x + p17.x) / 2, (fPoint.y + p17.y) / 2);

  const targets = [
    { point: midCFLine, t: projectT(midCFLine) },
    { point: midF17Line, t: projectT(midF17Line) },
  ];

  let scale = 1;
  for (let iteration = 0; iteration < 6; iteration += 1) {
    const hATry = p(p8a.x + uAE.x * baseLenA * scale, p8a.y + uAE.y * baseLenA * scale);
    const h17Try = p(p17.x + u17F.x * baseLen17 * scale, p17.y + u17F.y * baseLen17 * scale);

    const fits = targets.every((target) => {
      const candidate = bezierPoint(target.t, hATry, h17Try);
      return candidate.y <= target.point.y + 0.1;
    });

    if (fits) {
      baseLenA *= scale;
      baseLen17 *= scale;
      break;
    }

    scale *= 0.85;
  }

  return {
    handleA: p(p8a.x + uAE.x * baseLenA, p8a.y + uAE.y * baseLenA),
    handle17: p(p17.x + u17F.x * baseLen17, p17.y + u17F.y * baseLen17),
  };
};

export const buildScene = (
  measurements: HofenbitzerStandardTrouserEffectiveMeasurements,
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
      r: 0.4,
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
    pushPath(id, asLine(start, end), options);
  };

  const addPolyline = (
    id: string,
    linePoints: DraftPoint[],
    options?: {
      dashed?: boolean;
      kind?: PatternPath["kind"];
      strokeWidth?: number;
    },
  ) => {
    if (linePoints.length < 2) {
      return;
    }
    track(...linePoints);
    pushPath(id, asPolyline(linePoints), options);
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
    pushPath(id, asCubic(start, c1, c2, end), options);
  };

  const addMultiCubic = (
    id: string,
    segments: CubicSegment[],
    options?: {
      kind?: PatternPath["kind"];
      strokeWidth?: number;
    },
  ) => {
    for (const segment of segments) {
      track(segment.start, segment.c1, segment.c2, segment.end);
    }
    pushPath(id, asMultiCubic(segments), options);
  };

  const core = resolveCoreValues(measurements);

  const tummyProfile = getProfileName(TUMMY_PROFILES, measurements.TummyProfileIndex).toLowerCase();
  const hipProfile = getProfileName(HIP_PROFILES, measurements.HipProfileIndex).toLowerCase();
  const buttocksProfile = getProfileName(BUTTOCK_PROFILES, measurements.ButtocksProfileIndex).toLowerCase();

  const dartPlan = buildDartPlan(measurements, hipProfile);

  const yWaist = hipProfile === "curvy" ? 1.5 : 1;
  const hemY = Math.max(0, core.sWaH - core.HemShorten);
  const y4 = Math.max(0, core.CrH - core.CrHReduction);
  const yKnee = y4 + core.KnH;
  const yHip = Math.max(0, y4 - (core.HiC / 20 + 3));

  const p1 = registerPoint("1", p(0, 0));
  const p2 = registerPoint("2", p(0, core.sWaH));
  registerPoint("3", p(0, yWaist));
  registerPoint("6", p(0, hemY));
  registerPoint("4", p(0, y4));
  registerPoint("5", p(0, yKnee));
  const p7 = registerPoint("7", p(0, yHip));

  const frontTrouserWidth = Math.max(0, tummyProfile === "fuller" ? core.WaC / 4 + 2 : core.HiC / 4 - 1);
  const p8 = registerPoint("8", p(frontTrouserWidth, yHip));

  const p10 = registerPoint(
    "10",
    p(Math.max(0, frontTrouserWidth + frontTrouserWidth / 4 + core.CrotchExtAdjust), yHip),
  );

  const p11 = registerPoint("11", p((p7.x + p10.x) / 2 + measurements.Point11Shift, yHip));
  const p12 = registerPoint("12", p(p11.x, hemY));
  const p13 = registerPoint("13", p(p11.x, yKnee));
  const p14 = registerPoint("14", p(p11.x, yWaist));

  addLine("construction-side-waist-height", p1, p2, {
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("construction-waist-line", p(-30, yWaist), p(50, yWaist), {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("construction-hem-line", p(-30, hemY), p(50, hemY), {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("construction-increased-waist", p1, p(10, 0), {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("construction-crotch-line", p(-30, y4), p(50, y4), {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("construction-knee-line", p(-30, yKnee), p(50, yKnee), {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("construction-hip-line", p(-30, yHip), p(50, yHip), {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const p9 = registerPoint("9", p(frontTrouserWidth, yWaist));
  addLine("construction-line-8-9", p8, p9, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const p8a = registerPoint("8a", p(frontTrouserWidth, yHip));

  const hipInset = hipProfile === "curvy" ? 1 : hipProfile === "flat" ? 0.5 : 0.75;
  const p20 = registerPoint("20", p(Math.max(0, frontTrouserWidth - hipInset - 0.5), yWaist));

  addLine("construction-centre-front", p8a, p20, {
    kind: "construction",
    strokeWidth: 0.22,
  });
  addLine("construction-line-20-14", p20, p14, {
    kind: "construction",
    strokeWidth: 0.22,
  });

  const p15 = registerPoint("15", p(p12.x - Math.max(0, core.HEM / 4 - 1), hemY));
  const p16 = registerPoint("16", p(p12.x + Math.max(0, core.HEM / 4 - 1), hemY));
  const p15Off = p(p15.x - 2, p15.y);
  const p16Off = p(p16.x + 2, p16.y);

  addLine("construction-front-hem", p15, p16, {
    kind: "construction",
    strokeWidth: 0.22,
  });
  addLine("construction-back-hem", p15Off, p16Off, {
    kind: "construction",
    strokeWidth: 0.22,
  });

  const p15a = registerPoint("15a", p(p15.x, p15.y - core.SquareUpLen));
  const p16a = registerPoint("16a", p(p16.x, p16.y - core.SquareUpLen));

  addLine("construction-line-15-15a", p15, p15a, {
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("construction-line-16-16a", p16, p16a, {
    kind: "construction",
    strokeWidth: 0.18,
  });

  const p19 =
    intersectSegmentAtY(p15a, p7, yKnee, true) ??
    intersectSegmentAtY(p15a, p7, yKnee, false) ??
    p(p15a.x, yKnee);
  const p3a =
    intersectSegmentAtY(p15a, p7, y4, true) ??
    intersectSegmentAtY(p15a, p7, y4, false) ??
    p(p15a.x, y4);
  const p17 =
    intersectSegmentAtY(p16a, p10, y4, true) ??
    intersectSegmentAtY(p16a, p10, y4, false) ??
    p(p16a.x, y4);
  const p18 =
    intersectSegmentAtY(p16a, p10, yKnee, true) ??
    intersectSegmentAtY(p16a, p10, yKnee, false) ??
    p(p16a.x, yKnee);

  registerPoint("19", p19);
  registerPoint("3a", p3a);
  registerPoint("17", p17);
  registerPoint("18", p18);

  addLine("construction-line-15a-3a", p15a, p3a, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("construction-line-3a-7", p3a, p7, {
    kind: "construction",
    strokeWidth: 0.22,
  });

  addLine("construction-line-16a-17", p16a, p17, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("construction-line-17-10", p17, p10, {
    kind: "construction",
    strokeWidth: 0.22,
  });

  const p23 = registerPoint("23", p(p18.x - core.LegSeamShape, p18.y));
  const p22 = registerPoint("22", p(p19.x + core.LegSeamShape, p19.y));

  const curveTension = 0.35;

  const vec23To16 = p(p16a.x - p23.x, p16a.y - p23.y);
  const vec23To17 = p(p17.x - p23.x, p17.y - p23.y);
  const len23To16 = Math.max(1e-8, distanceBetween(p23, p16a));
  const len23To17 = Math.max(1e-8, distanceBetween(p23, p17));
  const u23To16 = p(vec23To16.x / len23To16, vec23To16.y / len23To16);
  const u23To17 = p(vec23To17.x / len23To17, vec23To17.y / len23To17);
  const handle23In = p(p23.x + u23To16.x * len23To16 * curveTension, p23.y + u23To16.y * len23To16 * curveTension);
  const handle23Out = p(p23.x + u23To17.x * len23To17 * curveTension, p23.y + u23To17.y * len23To17 * curveTension);

  addMultiCubic(
    "construction-side-seam-16a-23-17",
    [
      { start: p16a, c1: p16a, c2: handle23In, end: p23 },
      { start: p23, c1: handle23Out, c2: p17, end: p17 },
    ],
    {
      kind: "construction",
      strokeWidth: 0.22,
    },
  );

  const vec22To15 = p(p15a.x - p22.x, p15a.y - p22.y);
  const vec22To3a = p(p3a.x - p22.x, p3a.y - p22.y);
  const len22To15 = Math.max(1e-8, distanceBetween(p22, p15a));
  const len22To3a = Math.max(1e-8, distanceBetween(p22, p3a));
  const u22To15 = p(vec22To15.x / len22To15, vec22To15.y / len22To15);
  const u22To3a = p(vec22To3a.x / len22To3a, vec22To3a.y / len22To3a);
  const handle22In = p(p22.x + u22To15.x * len22To15 * curveTension, p22.y + u22To15.y * len22To15 * curveTension);
  const handle22Out = p(p22.x + u22To3a.x * len22To3a * curveTension, p22.y + u22To3a.y * len22To3a * curveTension);

  addMultiCubic(
    "construction-side-seam-15a-22-3a",
    [
      { start: p15a, c1: p15a, c2: handle22In, end: p22 },
      { start: p22, c1: handle22Out, c2: p3a, end: p3a },
    ],
    {
      kind: "construction",
      strokeWidth: 0.22,
    },
  );

  const p24 = registerPoint(
    "24",
    p(p11.x + (buttocksProfile === "full" ? 1 : 2), p11.y),
  );

  let pW = p(p24.x, yWaist);
  if (Math.abs(p24.y - p13.y) > 1e-8) {
    const t = (yWaist - p13.y) / (p24.y - p13.y);
    pW = p(p13.x + (p24.x - p13.x) * t, yWaist);
  }

  addPolyline("construction-back-centre-grain", [p13, p24, pW], {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  addLine("construction-back-centre-to-hem", p13, p12, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const backTrouserWidth = Math.max(0, tummyProfile === "fuller" ? core.WaC / 4 - 1.8 : core.HiC / 4 + 1);
  let autoBackAdjust = 0;
  if (buttocksProfile === "flat" && hipProfile === "curvy") {
    autoBackAdjust = 1;
  } else if (buttocksProfile === "full" && hipProfile === "flat") {
    autoBackAdjust = -1;
  }

  const p25 = registerPoint(
    "25",
    p(p24.x + Math.max(0, backTrouserWidth / 4 + autoBackAdjust + measurements.BackHipAdjustment), p24.y),
  );

  const phi = ((180 - core.BuA) * Math.PI) / 180;
  const rawV = normalize(Math.cos(phi), -Math.sin(phi));
  const v = p(rawV.x, rawV.y);

  let pUp: DraftPoint | null = null;
  if (Math.abs(v.y) > 1e-8) {
    const yUp = yWaist - 10;
    const tUp = (yUp - p25.y) / v.y;
    pUp = p(p25.x + v.x * tUp, p25.y + v.y * tUp);
  }

  let pDn: DraftPoint | null = null;
  if (Math.abs(v.y) > 1e-8) {
    const tDn = (y4 - p25.y) / (-v.y);
    pDn = p(p25.x + -v.x * tDn, p25.y + -v.y * tDn);
  }

  if (pUp && pDn) {
    addPolyline("construction-buttocks-angle", [pUp, p25, pDn], {
      dashed: true,
      kind: "construction",
      strokeWidth: 0.18,
    });
  } else if (pDn) {
    addLine("construction-buttocks-angle-short", p25, pDn, {
      dashed: true,
      kind: "construction",
      strokeWidth: 0.18,
    });
  }

  const n = normalize(-v.y, v.x);
  const L = backTrouserWidth;

  const solveBackHipLine = (sign: number): { p27: DraftPoint; p28: DraftPoint } | null => {
    const s = sign * L;
    if (Math.abs(v.y) < 1e-8) {
      return null;
    }

    const t = (yHip - p25.y - s * n.y) / v.y;
    const candidateP27 = p(p25.x + v.x * t, p25.y + v.y * t);
    const candidateP28 = p(candidateP27.x + n.x * s, candidateP27.y + n.y * s);

    return {
      p27: candidateP27,
      p28: candidateP28,
    };
  };

  const backHipCandidateA = solveBackHipLine(1);
  const backHipCandidateB = solveBackHipLine(-1);

  const scoreBackHipCandidate = (candidate: { p27: DraftPoint; p28: DraftPoint } | null): number => {
    if (!candidate) {
      return -1;
    }
    const leftOf = candidate.p28.x < candidate.p27.x;
    const fromAbove = candidate.p27.y < yHip;
    return (leftOf ? 2 : 0) + (fromAbove ? 1 : 0);
  };

  const backHipPick =
    scoreBackHipCandidate(backHipCandidateA) >= scoreBackHipCandidate(backHipCandidateB)
      ? backHipCandidateA
      : backHipCandidateB;

  const p27 = registerPoint("27", backHipPick?.p27 ?? p(p25.x - backTrouserWidth, yHip));
  const p28 = registerPoint("28", backHipPick?.p28 ?? p(p27.x - backTrouserWidth, yHip));
  const p29 = registerPoint("29", p(p24.x + Math.abs(p28.x - p24.x), yHip));

  addLine("construction-back-hip-line", p27, p28, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const p31 = registerPoint("31", p(p23.x + 2, p23.y));
  const p30 = registerPoint("30", p(p22.x - 2, p22.y));

  const p16aOff = p(p16a.x + 2, p16a.y);
  const p15aOff = p(p15a.x - 2, p15a.y);

  addPolyline("construction-back-guide-31-16a-hem", [p31, p16aOff, p16Off], {
    kind: "construction",
    strokeWidth: 0.22,
  });

  addPolyline("construction-back-guide-30-15a-hem", [p30, p15aOff, p15Off], {
    kind: "construction",
    strokeWidth: 0.22,
  });

  addLine("construction-line-29-31", p29, p31, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const frontInseam1723 = distanceBetween(p17, p23);
  const vec31To29 = p(p29.x - p31.x, p29.y - p31.y);
  const len31To29 = Math.max(1e-8, distanceBetween(p31, p29));
  const u31To29 = p(vec31To29.x / len31To29, vec31To29.y / len31To29);

  const targetInseam = clamp(frontInseam1723 - core.BackInseamReduction, 0, len31To29);
  const p38 = registerPoint("38", p(p31.x + u31To29.x * targetInseam, p31.y + u31To29.y * targetInseam));

  let ctrl31Inseam = p31;
  let ctrl38Inseam = p38;

  if (targetInseam > 0.1) {
    const vec31To38 = p(p38.x - p31.x, p38.y - p31.y);
    const len31To38 = Math.max(1e-8, distanceBetween(p31, p38));
    const u31To38 = p(vec31To38.x / len31To38, vec31To38.y / len31To38);

    const vecOutRef = p(p31.x - p30.x, p31.y - p30.y);
    const proj = vecOutRef.x * u31To38.x + vecOutRef.y * u31To38.y;

    let outNormal = p(vecOutRef.x - u31To38.x * proj, vecOutRef.y - u31To38.y * proj);
    if (distanceBetween(p(0, 0), outNormal) < 1e-8) {
      outNormal = p(-u31To38.y, u31To38.x);
    }

    const outNormalUnit = normalize(outNormal.x, outNormal.y);
    const vecInside = p(p29.x - p31.x, p29.y - p31.y);
    const insideDot = vecInside.x * outNormalUnit.x + vecInside.y * outNormalUnit.y;

    const finalNormal = insideDot < 0
      ? p(-outNormalUnit.x, -outNormalUnit.y)
      : p(outNormalUnit.x, outNormalUnit.y);

    const third = len31To38 / 3;
    ctrl31Inseam = p(
      p31.x + u31To38.x * third + finalNormal.x * 0.5,
      p31.y + u31To38.y * third + finalNormal.y * 0.5,
    );
    ctrl38Inseam = p(
      p38.x - u31To38.x * third + finalNormal.x * 0.5,
      p38.y - u31To38.y * third + finalNormal.y * 0.5,
    );
  }

  addCubic("construction-back-inseam-curve-31-38", p31, ctrl31Inseam, ctrl38Inseam, p38, {
    kind: "construction",
    strokeWidth: 0.22,
  });

  const ctrl27Crotch = p(
    p17.x - 4.6,
    p27.y + 15,
  );
  const ctrl38Crotch = p(p38.x - 2.8, p38.y);

  addCubic("construction-back-crotch-curve-27-38", p27, ctrl27Crotch, ctrl38Crotch, p38, {
    kind: "construction",
    strokeWidth: 0.22,
  });

  addLine("construction-line-30-28", p30, p28, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const vec30To28 = p(p28.x - p30.x, p28.y - p30.y);
  const len30To28 = Math.max(1e-8, distanceBetween(p30, p28));
  const u30To28 = p(vec30To28.x / len30To28, vec30To28.y / len30To28);

  let inward = p(p27.x - p30.x, p27.y - p30.y);
  const projIn = inward.x * u30To28.x + inward.y * u30To28.y;
  inward = p(inward.x - u30To28.x * projIn, inward.y - u30To28.y * projIn);

  if (distanceBetween(p(0, 0), inward) < 1e-8) {
    inward = p(-u30To28.y, u30To28.x);
  }

  const inwardUnit = normalize(inward.x, inward.y);
  const third30To28 = len30To28 / 3;
  const ctrl30 = p(
    p30.x + u30To28.x * third30To28 + inwardUnit.x * 0.45,
    p30.y + u30To28.y * third30To28 + inwardUnit.y * 0.45,
  );
  const ctrl28 = p(
    p28.x - u30To28.x * third30To28 + inwardUnit.x * 0.45,
    p28.y - u30To28.y * third30To28 + inwardUnit.y * 0.45,
  );

  addCubic("construction-back-side-curve-30-28", p30, ctrl30, ctrl28, p28, {
    kind: "construction",
    strokeWidth: 0.22,
  });

  let p32 = p(p30.x, yWaist);
  if (Math.abs(p28.y - p30.y) > 1e-8) {
    const t32 = (yWaist - p30.y) / (p28.y - p30.y);
    if (t32 > 1) {
      p32 = p(p30.x + (p28.x - p30.x) * t32, p30.y + (p28.y - p30.y) * t32);
    }
  }

  registerPoint("32", p32);
  addLine("construction-line-28-32", p28, p32, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const backLineUnit = normalize(v.x, v.y);
  const p33 = projectPointToLine(p32, p25, backLineUnit);
  registerPoint("33", p33);

  addLine("construction-line-32-33", p32, p33, {
    kind: "construction",
    strokeWidth: 0.22,
  });

  const p21 = registerPoint("21", p(Math.max(0, dartPlan.FrontSideDart), 0));

  addLine("construction-line-21-drop", p21, p(p21.x, p21.y + 0.2), {
    kind: "construction",
    strokeWidth: 0.18,
  });

  addLine("construction-line-21-14", p21, p14, {
    kind: "construction",
    strokeWidth: 0.22,
  });

  const handle7To21 = p(p7.x, p7.y - 11);
  addCubic("construction-front-side-curve-7-21", p7, handle7To21, p21, p21, {
    kind: "construction",
    strokeWidth: 0.22,
  });

  const hPoint = registerPoint("h", p((p21.x + p14.x) / 2, (p21.y + p14.y) / 2));
  addLine("construction-line-h-hip", hPoint, p(hPoint.x, yHip), {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  let iPoint: DraftPoint | null = null;
  let jPoint: DraftPoint | null = null;
  let kPoint: DraftPoint | null = null;

  if (dartPlan.FrontDart > 0.05) {
    const halfFrontDart = dartPlan.FrontDart / 2;
    const waistUnit = normalize(p14.x - p21.x, p14.y - p21.y);

    iPoint = registerPoint("i", p(hPoint.x - waistUnit.x * halfFrontDart, hPoint.y - waistUnit.y * halfFrontDart));
    jPoint = registerPoint("j", p(hPoint.x + waistUnit.x * halfFrontDart, hPoint.y + waistUnit.y * halfFrontDart));
    kPoint = registerPoint("k", p(hPoint.x - 0.5, hPoint.y + Math.max(0, measurements.FrontDartLen)));

    addLine("construction-front-dart-left", iPoint, kPoint, {
      kind: "construction",
      strokeWidth: 0.22,
    });
    addLine("construction-front-dart-right", jPoint, kPoint, {
      kind: "construction",
      strokeWidth: 0.22,
    });
  }

  const denCf = p8a.y - p20.y;
  let cffEnd = p8a;
  if (Math.abs(denCf) > 1e-8) {
    const t = (y4 - p20.y) / denCf;
    cffEnd = p(p20.x + (p8a.x - p20.x) * t, y4);
  }

  addLine("construction-cf-8a-to-crotch", p8a, cffEnd, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const cPoint = p(p8a.x + (cffEnd.x - p8a.x) * 0.5, p8a.y + (cffEnd.y - p8a.y) * 0.5);
  const dPoint = p(p8a.x + (cffEnd.x - p8a.x) * 0.75, p8a.y + (cffEnd.y - p8a.y) * 0.75);
  const fPoint = p((dPoint.x + p17.x) / 2, (dPoint.y + p17.y) / 2);

  registerPoint("a", p8a);
  registerPoint("c", cPoint);
  registerPoint("d", dPoint);
  registerPoint("e", cffEnd);
  registerPoint("f", fPoint);

  addLine("construction-line-d-17", dPoint, p17, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });
  addLine("construction-line-f-c", fPoint, cPoint, {
    dashed: true,
    kind: "construction",
    strokeWidth: 0.18,
  });

  const { handleA, handle17 } = buildFrontCfCrotchHandles(p8a, p17, cPoint, fPoint, cffEnd);

  addLine("construction-front-cf-seam-20-8a", p20, p8a, {
    kind: "construction",
    strokeWidth: 0.22,
  });
  addCubic("construction-front-crotch-seam-8a-17", p8a, handleA, handle17, p17, {
    kind: "construction",
    strokeWidth: 0.22,
  });

  const backSideShare = Math.max(0, dartPlan.BackSideDart > 0 ? dartPlan.BackSideDart : dartPlan.FrontSideDart);

  const vec33To32 = p(p32.x - p33.x, p32.y - p33.y);
  const len33To32 = Math.max(1e-8, distanceBetween(p33, p32));
  let waistUnitBack = p(-vec33To32.x / len33To32, -vec33To32.y / len33To32);

  const p35 = registerPoint("35", p(p32.x + waistUnitBack.x * backSideShare, p32.y + waistUnitBack.y * backSideShare));

  const waistVecBack = p(p35.x - p32.x, p35.y - p32.y);
  const waistLenBack = Math.max(1e-8, distanceBetween(p32, p35));
  waistUnitBack = p(waistVecBack.x / waistLenBack, waistVecBack.y / waistLenBack);

  let waistNormal = p(-waistUnitBack.y, waistUnitBack.x);
  if (waistNormal.y < 0) {
    waistNormal = p(-waistNormal.x, -waistNormal.y);
  }

  const frontSideVec = p(p21.x - p7.x, p21.y - p7.y);
  const frontSideLen = Math.max(1e-8, distanceBetween(p7, p21));
  const backSideVec = p(p35.x - p28.x, p35.y - p28.y);
  const backSideLen = Math.max(1e-8, distanceBetween(p28, p35));

  const frontUnit = p(frontSideVec.x / frontSideLen, frontSideVec.y / frontSideLen);
  const frontNormal = p(-frontUnit.y, frontUnit.x);
  const frontHandleVec = p(0, -11);

  const frontAlong = frontHandleVec.x * frontUnit.x + frontHandleVec.y * frontUnit.y;
  const frontNormalComp = frontHandleVec.x * frontNormal.x + frontHandleVec.y * frontNormal.y;

  const scaleSide = backSideLen / frontSideLen;
  const backUnit = p(backSideVec.x / backSideLen, backSideVec.y / backSideLen);
  const backNormal = p(-backUnit.y, backUnit.x);

  const backHandleAtHip = p(
    p28.x + backUnit.x * (frontAlong * scaleSide) + backNormal.x * (frontNormalComp * scaleSide),
    p28.y + backUnit.y * (frontAlong * scaleSide) + backNormal.y * (frontNormalComp * scaleSide),
  );

  addCubic("construction-back-side-curve-35-28", p28, backHandleAtHip, p35, p35, {
    kind: "construction",
    strokeWidth: 0.22,
  });

  addLine("construction-line-32-35", p32, p35, {
    kind: "construction",
    strokeWidth: 0.18,
  });

  const frontWaistReduction = resolveFrontWaistReduction(measurements);
  const dirTo32 = normalize(p32.x - p33.x, p32.y - p33.y);
  const p34 = registerPoint("34", p(p33.x + dirTo32.x * frontWaistReduction, p33.y + dirTo32.y * frontWaistReduction));

  addLine("construction-line-34-27", p34, p27, {
    kind: "construction",
    strokeWidth: 0.22,
  });

  const backWaistSpan = distanceBetween(p34, p35);
  const backHipVec = p(p28.x - p27.x, p28.y - p27.y);
  const backHipLen = Math.max(1e-8, distanceBetween(p27, p28));
  const backHipUnit = p(backHipVec.x / backHipLen, backHipVec.y / backHipLen);

  let backDart1 = Math.max(0, dartPlan.BackDart1);
  let backDart2 = Math.max(0, dartPlan.BackDart2);
  let pM: DraftPoint | null = null;
  let pN: DraftPoint | null = null;
  let pO: DraftPoint | null = null;
  let pQ: DraftPoint | null = null;
  let pR: DraftPoint | null = null;
  let pS: DraftPoint | null = null;

  if (backDart1 > 0.5) {
    let dFirst = backDart2 > 0.01 ? backHipLen / 3 + 1.5 : backHipLen / 2;
    dFirst = clamp(dFirst, 0, Math.max(0, backHipLen - 0.1));

    const firstBase = p(p27.x + backHipUnit.x * dFirst, p27.y + backHipUnit.y * dFirst);
    let squareDir = p(-backHipUnit.y, backHipUnit.x);

    const toWaistVec = p(p35.x - firstBase.x, p35.y - firstBase.y);
    if (toWaistVec.x * squareDir.x + toWaistVec.y * squareDir.y < 0) {
      squareDir = p(-squareDir.x, -squareDir.y);
    }

    const pL = lineIntersection(firstBase, squareDir, p34, waistUnitBack);
    if (pL) {
      registerPoint("l", pL);

      let halfD1 = backDart1 / 2;
      const maxHalfD1 = Math.max(0, backWaistSpan / 2 - 0.05);
      halfD1 = Math.min(halfD1, maxHalfD1);

      if (halfD1 > 1e-6) {
        pM = p(pL.x - waistUnitBack.x * halfD1, pL.y - waistUnitBack.y * halfD1);
        pN = p(pL.x + waistUnitBack.x * halfD1, pL.y + waistUnitBack.y * halfD1);

        if (pM.x > pN.x) {
          const swap = pM;
          pM = pN;
          pN = swap;
        }

        registerPoint("m", pM);
        registerPoint("n", pN);

        const centerDirRaw = p(firstBase.x - pL.x, firstBase.y - pL.y);
        const centerDir = distanceBetween(p(0, 0), centerDirRaw) < 1e-8
          ? waistNormal
          : normalize(centerDirRaw.x, centerDirRaw.y);

        pO = p(
          pL.x + centerDir.x * Math.max(0, measurements.BackDart1Len),
          pL.y + centerDir.y * Math.max(0, measurements.BackDart1Len),
        );

        registerPoint("o", pO);

        addLine("construction-back-dart1-left", pM, pO, {
          kind: "construction",
          strokeWidth: 0.22,
        });
        addLine("construction-back-dart1-right", pN, pO, {
          kind: "construction",
          strokeWidth: 0.22,
        });
      } else {
        backDart1 = 0;
      }
    } else {
      backDart1 = 0;
    }
  } else {
    backDart1 = 0;
  }

  if (backDart2 > 0.01) {
    let halfD2 = backDart2 / 2;
    const maxHalfD2 = Math.max(0, backWaistSpan / 2 - 0.05);
    halfD2 = Math.min(halfD2, maxHalfD2);

    if (halfD2 > 1e-6) {
      const pDart2 = pM && pN
        ? p((pM.x + p35.x) / 2, (pM.y + p35.y) / 2)
        : p((p34.x + p35.x) / 2, (p34.y + p35.y) / 2);

      registerPoint("p", pDart2);

      pQ = p(pDart2.x - waistUnitBack.x * halfD2, pDart2.y - waistUnitBack.y * halfD2);
      pR = p(pDart2.x + waistUnitBack.x * halfD2, pDart2.y + waistUnitBack.y * halfD2);

      if (pQ.x > pR.x) {
        const swap = pQ;
        pQ = pR;
        pR = swap;
      }

      registerPoint("q", pQ);
      registerPoint("r", pR);

      pS = p(
        pDart2.x + waistNormal.x * Math.max(0, measurements.BackDart2Len),
        pDart2.y + waistNormal.y * Math.max(0, measurements.BackDart2Len),
      );

      registerPoint("s", pS);

      addLine("construction-back-dart2-left", pQ, pS, {
        kind: "construction",
        strokeWidth: 0.22,
      });
      addLine("construction-back-dart2-right", pR, pS, {
        kind: "construction",
        strokeWidth: 0.22,
      });
    } else {
      backDart2 = 0;
    }
  }

  const frontOutlineD = [
    `M ${fmt(p21.x)} ${fmt(p21.y)}`,
    `L ${fmt(p14.x)} ${fmt(p14.y)}`,
    `L ${fmt(p20.x)} ${fmt(p20.y)}`,
    `L ${fmt(p8a.x)} ${fmt(p8a.y)}`,
    `C ${fmt(handleA.x)} ${fmt(handleA.y)} ${fmt(handle17.x)} ${fmt(handle17.y)} ${fmt(p17.x)} ${fmt(p17.y)}`,
    `C ${fmt(p17.x)} ${fmt(p17.y)} ${fmt(handle23Out.x)} ${fmt(handle23Out.y)} ${fmt(p23.x)} ${fmt(p23.y)}`,
    `C ${fmt(handle23In.x)} ${fmt(handle23In.y)} ${fmt(p16a.x)} ${fmt(p16a.y)} ${fmt(p16a.x)} ${fmt(p16a.y)}`,
    `L ${fmt(p16.x)} ${fmt(p16.y)}`,
    `L ${fmt(p15.x)} ${fmt(p15.y)}`,
    `L ${fmt(p15a.x)} ${fmt(p15a.y)}`,
    `C ${fmt(p15a.x)} ${fmt(p15a.y)} ${fmt(handle22In.x)} ${fmt(handle22In.y)} ${fmt(p22.x)} ${fmt(p22.y)}`,
    `C ${fmt(handle22Out.x)} ${fmt(handle22Out.y)} ${fmt(p3a.x)} ${fmt(p3a.y)} ${fmt(p3a.x)} ${fmt(p3a.y)}`,
    `L ${fmt(p7.x)} ${fmt(p7.y)}`,
    `C ${fmt(handle7To21.x)} ${fmt(handle7To21.y)} ${fmt(p21.x)} ${fmt(p21.y)} ${fmt(p21.x)} ${fmt(p21.y)}`,
    "Z",
  ].join(" ");

  pushPath("front-pattern-outline", frontOutlineD, {
    kind: "pattern",
    strokeWidth: 0.28,
  });

  const backOutlineD = [
    `M ${fmt(p34.x)} ${fmt(p34.y)}`,
    `L ${fmt(p27.x)} ${fmt(p27.y)}`,
    `C ${fmt(ctrl27Crotch.x)} ${fmt(ctrl27Crotch.y)} ${fmt(ctrl38Crotch.x)} ${fmt(ctrl38Crotch.y)} ${fmt(p38.x)} ${fmt(p38.y)}`,
    `C ${fmt(ctrl38Inseam.x)} ${fmt(ctrl38Inseam.y)} ${fmt(ctrl31Inseam.x)} ${fmt(ctrl31Inseam.y)} ${fmt(p31.x)} ${fmt(p31.y)}`,
    `L ${fmt(p16aOff.x)} ${fmt(p16aOff.y)}`,
    `L ${fmt(p16Off.x)} ${fmt(p16Off.y)}`,
    `L ${fmt(p15Off.x)} ${fmt(p15Off.y)}`,
    `L ${fmt(p15aOff.x)} ${fmt(p15aOff.y)}`,
    `L ${fmt(p30.x)} ${fmt(p30.y)}`,
    `C ${fmt(ctrl30.x)} ${fmt(ctrl30.y)} ${fmt(ctrl28.x)} ${fmt(ctrl28.y)} ${fmt(p28.x)} ${fmt(p28.y)}`,
    `C ${fmt(backHandleAtHip.x)} ${fmt(backHandleAtHip.y)} ${fmt(p35.x)} ${fmt(p35.y)} ${fmt(p35.x)} ${fmt(p35.y)}`,
    `L ${fmt(p34.x)} ${fmt(p34.y)}`,
    "Z",
  ].join(" ");

  pushPath("back-pattern-outline", backOutlineD, {
    kind: "pattern",
    strokeWidth: 0.28,
  });

  addLine("pattern-guide-front-22-23", p22, p23, {
    dashed: true,
    kind: "pattern",
    strokeWidth: 0.2,
  });
  addLine("pattern-guide-front-3a-17", p3a, p17, {
    dashed: true,
    kind: "pattern",
    strokeWidth: 0.2,
  });
  addLine("pattern-guide-front-14-12", p14, p12, {
    dashed: true,
    kind: "pattern",
    strokeWidth: 0.2,
  });
  addLine("pattern-guide-front-8a-7", p8a, p7, {
    dashed: true,
    kind: "pattern",
    strokeWidth: 0.2,
  });

  if (iPoint && kPoint) {
    addLine("pattern-dart-front-i-k", iPoint, kPoint, {
      kind: "pattern",
      strokeWidth: 0.22,
    });
  }
  if (jPoint && kPoint) {
    addLine("pattern-dart-front-j-k", jPoint, kPoint, {
      kind: "pattern",
      strokeWidth: 0.22,
    });
  }

  addLine("pattern-guide-back-30-31", p30, p31, {
    dashed: true,
    kind: "pattern",
    strokeWidth: 0.2,
  });
  addLine("pattern-guide-back-27-28", p27, p28, {
    dashed: true,
    kind: "pattern",
    strokeWidth: 0.2,
  });

  const crotchGuideLeft = intersectSegmentAtY(p30, p28, y4, true);
  const crotchGuideRight = intersectSegmentAtY(p31, p38, y4, true) ?? p(p38.x, y4);
  if (crotchGuideLeft && crotchGuideRight) {
    addLine("pattern-guide-back-crotch", crotchGuideLeft, crotchGuideRight, {
      dashed: true,
      kind: "pattern",
      strokeWidth: 0.2,
    });
  }

  addPolyline("pattern-guide-back-grain", [p13, p24, pW], {
    dashed: true,
    kind: "pattern",
    strokeWidth: 0.2,
  });
  addLine("pattern-guide-back-grain-to-hem", p13, p12, {
    dashed: true,
    kind: "pattern",
    strokeWidth: 0.2,
  });

  if (pM && pO) {
    addLine("pattern-dart-back-m-o", pM, pO, {
      kind: "pattern",
      strokeWidth: 0.22,
    });
  }
  if (pN && pO) {
    addLine("pattern-dart-back-n-o", pN, pO, {
      kind: "pattern",
      strokeWidth: 0.22,
    });
  }
  if (pQ && pS) {
    addLine("pattern-dart-back-q-s", pQ, pS, {
      kind: "pattern",
      strokeWidth: 0.22,
    });
  }
  if (pR && pS) {
    addLine("pattern-dart-back-r-s", pR, pS, {
      kind: "pattern",
      strokeWidth: 0.22,
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
