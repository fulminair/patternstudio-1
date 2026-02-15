const NS = "http://www.w3.org/2000/svg";
const INKSCAPE_NS = "http://www.inkscape.org/namespaces/inkscape";
const MM_PER_IN = 25.4;
const PAGE_WIDTH_MM = 600;
const PAGE_HEIGHT_MM = 600;
const PAGE_MARGIN_MM = 25;
const PADDING_MM = 60;
const TOP_PADDING_MM = 10;
const MARKER_RADIUS_MM = 2.6;
const LABEL_FONT_SIZE_MM = 4;
const BACK_GAP_CM = 10;
const BACK_OFFSET_IN = BACK_GAP_CM / 2.54;
const SHARE_URL = "https://studio.morethanpatterns.com/";
const BUST_CUP_OFFSETS = {
  A: 0.875,
  B: 1.25,
  C: 1.5,
  D: 1.75,
};
const CM_TO_MM = 10;
const ALDRICH_HANDLE_RATIO_CAP = 1.6;
const ALDRICH_COLORS = Object.freeze({
  primary: "#111111",
  guide: "#000000",
});

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    try {
      const existing = document.getElementById("patternhubErrorBanner");
      const message = event?.message || "Unexpected error";
      if (existing) {
        existing.textContent = `PatternHub Error: ${message}`;
        existing.hidden = false;
      } else {
        const banner = document.createElement("div");
        banner.id = "patternhubErrorBanner";
        banner.textContent = `PatternHub Error: ${message}`;
        banner.style.position = "fixed";
        banner.style.top = "0";
        banner.style.left = "0";
        banner.style.right = "0";
        banner.style.zIndex = "9999";
        banner.style.padding = "12px";
        banner.style.background = "#fee2e2";
        banner.style.color = "#991b1b";
        banner.style.fontFamily =
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
        banner.style.fontSize = "14px";
        banner.style.borderBottom = "1px solid #fecaca";
        document.body?.prepend(banner);
      }
      console.error("PatternHub runtime error", event?.error || message);
    } catch (overlayErr) {
      console.error("PatternHub error overlay failed", overlayErr);
    }
  });
}

const baseAldrichDefaults = {
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
  frontWaistDartBackOff: 2.5,
  frontSideWaistDart: 0,
  backSideWaistDart: 0,
};
const ALDRICH_DEFAULT_FRONT_NECK_DART = computeAldrichFrontNeckDart(
  baseAldrichDefaults.bust
);
const ALDRICH_DEFAULT_DARTS = computeAldrichWaistDarts(
  baseAldrichDefaults.bust,
  baseAldrichDefaults.waist,
  baseAldrichDefaults.bustEase,
  baseAldrichDefaults.waistEase
);
const ALDRICH_DEFAULTS = Object.freeze({
  ...baseAldrichDefaults,
  frontNeckDart: ALDRICH_DEFAULT_FRONT_NECK_DART,
  frontWaistDart: ALDRICH_DEFAULT_DARTS.front,
  backWaistDart: ALDRICH_DEFAULT_DARTS.back,
  frontSideWaistDart: ALDRICH_DEFAULT_DARTS.frontSide,
  backSideWaistDart: ALDRICH_DEFAULT_DARTS.backSide,
  bustWaistDiff: Math.abs(
    computeAldrichWaistDiff(
      baseAldrichDefaults.bust,
      baseAldrichDefaults.waist,
      baseAldrichDefaults.bustEase,
      baseAldrichDefaults.waistEase
    )
  ),
});

const HOFENBITZER_DEFAULT_FIT_INDEX = 3;
const HOFENBITZER_DEFAULTS = Object.freeze({
  AhD: 20.1,
  BrC: 88,
  WaC: 68,
  HiC: 97,
  BG: 16.5,
  AG: 9.3,
  BrG: 18.2,
  ShG: 12.2,
  BL: 41.6,
  BLBal: 0,
  MoL: 75,
  HiD: 20,
  NeG: 6.5,
  ShA: 20,
  BrD: 28.1,
  FL: 45.3,
  FLBalance: 0,
  BrCFinal: 88,
  WaCFinal: 68,
  HiCFinal: 97,
  BackShoulderEase: 0.7,
  ShoulderDifference: 2,
});

const HOFENBITZER_FIT_PROFILES = Object.freeze([
  {
    name: "Fit 0",
    ease: { AhD: 0.25, BrC: 0, WaC: 0, HiC: 0, BG: 0, AG: 0, BrG: 0, ShG: 0 },
  },
  {
    name: "Fit 1",
    ease: {
      AhD: 0.45,
      BrC: 2,
      WaC: 1,
      HiC: 1,
      BG: 0.1,
      AG: 0.3,
      BrG: 0.6,
      ShG: 0.1,
    },
  },
  {
    name: "Fit 2",
    ease: {
      AhD: 0.75,
      BrC: 4,
      WaC: 3,
      HiC: 3,
      BG: 0.3,
      AG: 0.9,
      BrG: 0.8,
      ShG: 0.2,
    },
  },
  {
    name: "Fit 3",
    ease: {
      AhD: 1.3,
      BrC: 6,
      WaC: 5,
      HiC: 5,
      BG: 0.5,
      AG: 1.5,
      BrG: 1.0,
      ShG: 0.3,
    },
  },
  {
    name: "Fit 4",
    ease: {
      AhD: 1.7,
      BrC: 8,
      WaC: 6,
      HiC: 6,
      BG: 0.8,
      AG: 2.0,
      BrG: 1.2,
      ShG: 0.4,
    },
  },
  {
    name: "Fit 5",
    ease: {
      AhD: 2.1,
      BrC: 10,
      WaC: 10,
      HiC: 7,
      BG: 1.1,
      AG: 2.5,
      BrG: 1.4,
      ShG: 0.5,
    },
  },
  {
    name: "Fit 6",
    ease: {
      AhD: 2.5,
      BrC: 12,
      WaC: 12,
      HiC: 8,
      BG: 1.4,
      AG: 3.0,
      BrG: 1.6,
      ShG: 0.6,
    },
  },
]);

const HOFENBITZER_PRIMARY_MEASUREMENTS = (() => {
  const profile = HOFENBITZER_FIT_PROFILES[HOFENBITZER_DEFAULT_FIT_INDEX] || {
    ease: {},
  };
  return [
    {
      id: "BrC",
      label: "BrC",
      measurementDefault: HOFENBITZER_DEFAULTS.BrC,
      easeDefault: profile.ease.BrC || 0,
      fitKey: "BrC",
    },
    {
      id: "WaC",
      label: "WaC",
      measurementDefault: HOFENBITZER_DEFAULTS.WaC,
      easeDefault: profile.ease.WaC || 0,
      fitKey: "WaC",
    },
    {
      id: "HiC",
      label: "HiC",
      measurementDefault: HOFENBITZER_DEFAULTS.HiC,
      easeDefault: profile.ease.HiC || 0,
      fitKey: "HiC",
    },
    {
      id: "AhD",
      label: "AhD",
      measurementDefault: HOFENBITZER_DEFAULTS.AhD,
      easeDefault: profile.ease.AhD || 0,
      fitKey: "AhD",
    },
    {
      id: "BG",
      label: "BG",
      measurementDefault: HOFENBITZER_DEFAULTS.BG,
      easeDefault: profile.ease.BG || 0,
      fitKey: "BG",
    },
    {
      id: "AG",
      label: "AG",
      measurementDefault: HOFENBITZER_DEFAULTS.AG,
      easeDefault: profile.ease.AG || 0,
      fitKey: "AG",
    },
    {
      id: "BrG",
      label: "BrG",
      measurementDefault: HOFENBITZER_DEFAULTS.BrG,
      easeDefault: profile.ease.BrG || 0,
      fitKey: "BrG",
    },
    {
      id: "ShG",
      label: "ShG",
      measurementDefault: HOFENBITZER_DEFAULTS.ShG,
      easeDefault: profile.ease.ShG || 0,
      fitKey: "ShG",
    },
    {
      id: "BL",
      label: "BL",
      measurementDefault: HOFENBITZER_DEFAULTS.BL,
      easeDefault: HOFENBITZER_DEFAULTS.BLBal,
      easeLabel: "BL Balance",
    },
    {
      id: "FL",
      label: "FL",
      measurementDefault: HOFENBITZER_DEFAULTS.FL,
      easeDefault: HOFENBITZER_DEFAULTS.FLBalance,
      easeLabel: "FL Balance",
    },
  ];
})();

const HOFENBITZER_MEASUREMENT_LOOKUP = HOFENBITZER_PRIMARY_MEASUREMENTS.reduce(
  (acc, def) => {
    acc[def.id] = def;
    return acc;
  },
  {}
);

const HOFENBITZER_SECONDARY_MEASUREMENTS = [
  { id: "NeG", label: "NeG", defaultValue: HOFENBITZER_DEFAULTS.NeG },
  { id: "MoL", label: "MoL", defaultValue: HOFENBITZER_DEFAULTS.MoL },
  { id: "HiD", label: "HiD", defaultValue: HOFENBITZER_DEFAULTS.HiD },
  {
    id: "ShA",
    label: "ShA (deg)",
    defaultValue: HOFENBITZER_DEFAULTS.ShA,
    step: 0.1,
  },
  { id: "BrD", label: "BrD", defaultValue: HOFENBITZER_DEFAULTS.BrD },
  {
    id: "ShoulderDifference",
    label: "Shoulder Diff. (deg)",
    defaultValue: HOFENBITZER_DEFAULTS.ShoulderDifference,
    step: 0.1,
  },
];

const HOFENBITZER_SLEEVE_DEFAULTS = Object.freeze({
  AhH: 20,
  AhHEase: 0,
  fAh: 19.6,
  bAh: 23.9,
  AhC: null,
  fAhEase: 0,
  bAhEase: 0,
  AL: 60,
  ALEase: 0,
  upAC: 28,
  upACEase: 9,
  WrC: 16,
  WrCEase: 6,
  CapEasePct: 3,
  CapEasePctEase: 0,
  CapLineEase: 0,
  fAP: 4.5,
  bAP: 8.6,
});

const HOFENBITZER_SLEEVE_MEASUREMENTS = [
  {
    id: "AhH",
    label: "AhH",
    easeKey: "AhHEase",
    derivedKey: "AhHConstruction",
    defaultValue: HOFENBITZER_SLEEVE_DEFAULTS.AhH,
  },
  {
    id: "fAh",
    label: "fAh",
    easeKey: "fAhEase",
    derivedKey: "fAhConstruction",
    defaultValue: HOFENBITZER_SLEEVE_DEFAULTS.fAh,
  },
  {
    id: "bAh",
    label: "bAh",
    easeKey: "bAhEase",
    derivedKey: "bAhConstruction",
    defaultValue: HOFENBITZER_SLEEVE_DEFAULTS.bAh,
  },
  { id: "AhC", label: "AhC", derivedKey: "AhCConstruction", readOnly: true },
  {
    id: "AL",
    label: "AL",
    easeKey: "ALEase",
    derivedKey: "SlL",
    defaultValue: HOFENBITZER_SLEEVE_DEFAULTS.AL,
  },
  {
    id: "upAC",
    label: "upAC",
    easeKey: "upACEase",
    derivedKey: "SlW",
    defaultValue: HOFENBITZER_SLEEVE_DEFAULTS.upAC,
  },
  {
    id: "WrC",
    label: "WrC",
    easeKey: "WrCEase",
    derivedKey: "HeW",
    defaultValue: HOFENBITZER_SLEEVE_DEFAULTS.WrC,
  },
  {
    id: "CapEasePct",
    label: "Cap Ease (%)",
    derivedKey: "CapEaseCm",
    derivedLabel: "Cap Ease (cm)",
    defaultValue: HOFENBITZER_SLEEVE_DEFAULTS.CapEasePct,
    hasEase: false,
  },
  {
    id: "CapC",
    label: "CapC",
    derivedKey: "CapC",
    readOnly: true,
    hasEase: false,
  },
  {
    id: "CapLineEase",
    label: "Cap Line Ease",
    derivedKey: "CapLineEase",
    defaultValue: HOFENBITZER_SLEEVE_DEFAULTS.CapLineEase,
  },
  {
    id: "fAP",
    label: "fAP",
    derivedKey: "fAPFinal",
    defaultValue: HOFENBITZER_SLEEVE_DEFAULTS.fAP,
    hasEase: false,
  },
  {
    id: "bAP",
    label: "bAP",
    derivedKey: "bAPFinal",
    defaultValue: HOFENBITZER_SLEEVE_DEFAULTS.bAP,
    hasEase: false,
  },
];

const HOFENBITZER_SKIRT_DEFAULTS = Object.freeze({
  HiC: 97,
  WaC: 72,
  HiD: 21,
  MoL: 50,
  HipEase: 3,
  WaistEase: 2,
  FrontDartLength: 10,
  BackDartLength1: 14.5,
  BackDartLength2: 13,
  HipProfile: "Normal",
});

const HOFENBITZER_SKIRT_MANUAL_KEYS = [
  "SideDart",
  "FrontDart",
  "BackDart1",
  "BackDart2",
];

const HOFENBITZER_MARKER_RADIUS_CM = 0.25;
const HOFENBITZER_MIN_HANDLE_LENGTH_CM = 0.5;
const HOFENBITZER_HIP_LEFT_OFFSET_CM = 2;
const HOFENBITZER_DASH_PATTERN = "12 6";
const HOFENBITZER_FRAME_COLOR = "#111111";
const HOFENBITZER_GUIDE_COLOR = HOFENBITZER_FRAME_COLOR;
const hofenbitzerUi = {
  initialized: false,
  measurementRows: {},
  secondaryRows: {},
  fitSelect: null,
  derivedOutputs: null,
};
const hofSleeveUi = {
  initialized: false,
  initializing: false,
  rows: {},
  lastMeasured: {},
};
const hofSkirtUi = {
  initialized: false,
  manualOverrides: {
    SideDart: false,
    FrontDart: false,
    BackDart1: false,
    BackDart2: false,
  },
  derivedOutputs: null,
  cachedInputs: null,
  cachedDerived: null,
};

function hofSkirtOverrideId(key) {
  return `hofSkirt${key}Override`;
}

function hydrateHofSkirtManualOverridesFromDom() {
  HOFENBITZER_SKIRT_MANUAL_KEYS.forEach((key) => {
    const overrideInput = document.getElementById(hofSkirtOverrideId(key));
    hofSkirtUi.manualOverrides[key] = overrideInput
      ? overrideInput.value === "true"
      : false;
  });
}

function setHofSkirtManualOverride(key, enabled) {
  hofSkirtUi.manualOverrides[key] = Boolean(enabled);
  const overrideInput = document.getElementById(hofSkirtOverrideId(key));
  if (overrideInput) {
    overrideInput.value = enabled ? "true" : "false";
  }
}

function formatHofenbitzerValue(value) {
  return Number.isFinite(value)
    ? (Math.round(value * 100) / 100).toFixed(2)
    : "--";
}

function createHofenbitzerField(labelText, content, options = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = `form-field${options.final ? " form-field--final" : ""}`;
  if (labelText != null) {
    const label = document.createElement("label");
    label.className = "form-label";
    label.textContent = labelText;
    wrapper.appendChild(label);
  }
  content.classList.add("form-input");
  if (options.final) {
    content.classList.add("final");
  }
  wrapper.appendChild(content);
  return wrapper;
}

function createHofenbitzerFinalField(labelText, valueText) {
  const input = document.createElement("input");
  input.type = "number";
  input.readOnly = true;
  input.value = valueText;
  const field = createHofenbitzerField(labelText, input, { final: true });
  return { field, output: input };
}

function updateHofenbitzerMeasurementRow(rowId) {
  const ref = hofenbitzerUi.measurementRows[rowId];
  if (!ref) return;
  const { def, measurementInput, easeInput, finalOutput } = ref;
  const measurementValue = Number.parseFloat(measurementInput.value);
  const resolvedMeasurement = Number.isFinite(measurementValue)
    ? measurementValue
    : def.measurementDefault;
  let resolvedEase = 0;
  if (easeInput) {
    const easeValue = Number.parseFloat(easeInput.value);
    resolvedEase = Number.isFinite(easeValue)
      ? easeValue
      : def.easeDefault || 0;
  }
  if (finalOutput) {
    finalOutput.value = formatHofenbitzerValue(
      resolvedMeasurement + resolvedEase
    );
  }
}

function updateHofenbitzerSecondaryRow(rowId) {
  const ref = hofenbitzerUi.secondaryRows[rowId];
  if (!ref) return;
  // Secondary values read directly during regeneration.
}

function updateHofenbitzerDerivedOutputs(values = {}) {
  const outputs = hofenbitzerUi.derivedOutputs;
  if (!outputs) return;
  const { hiG, hipShortage, hipSpanBack, hipSpanFront } = outputs;
  const formatDisplay = (val) =>
    Number.isFinite(val) ? formatHofenbitzerValue(val) : "--";
  if (hiG) hiG.textContent = formatDisplay(values.hiG);
  if (hipShortage) hipShortage.textContent = formatDisplay(values.hipShortage);
  if (hipSpanBack) hipSpanBack.textContent = formatDisplay(values.hipSpanBack);
  if (hipSpanFront)
    hipSpanFront.textContent = formatDisplay(values.hipSpanFront);
}

function normalizeHofSkirtProfile(profile = "Normal") {
  const value = String(profile || "Normal")
    .trim()
    .toLowerCase();
  if (value.includes("flat")) return "Flat";
  if (value.includes("curvy")) return "Curvy";
  return "Normal";
}

function determineHofSkirtWaistShaping(profile = "Normal") {
  return normalizeHofSkirtProfile(profile) === "Curvy" ? 1.5 : 1;
}

function determineHofSkirtSideDartBase(profile = "Normal", waistDiff = 0) {
  const normalized = normalizeHofSkirtProfile(profile);
  const base = Math.max(0, waistDiff / 2);
  if (normalized === "Curvy") return Math.max(0, waistDiff / 2 + 1);
  if (normalized === "Flat") return Math.max(0, waistDiff / 2 - 1);
  return base;
}

function computeHofSkirtDerived(params = {}) {
  const hipWidth =
    ((Number(params.HiC) || 0) + (Number(params.HipEase) || 0)) / 2;
  const waistWidth =
    ((Number(params.WaC) || 0) + (Number(params.WaistEase) || 0)) / 2;
  const waistDiffTarget = Math.max(0, hipWidth - waistWidth);
  const result = {
    HiW: hipWidth,
    WaW: waistWidth,
    WaistDiffTarget: waistDiffTarget,
  };

  const sideBase = determineHofSkirtSideDartBase(
    params.HipProfile,
    waistDiffTarget
  );
  const manualSide = Number(params.SideDart);
  const sideOverride = params.SideDartOverride && Number.isFinite(manualSide);
  const sideVal = sideOverride
    ? Math.max(0, manualSide)
    : Math.max(0, sideBase);
  result.SideDart = sideVal;

  const frontAuto = Math.min(waistDiffTarget * 0.2, 2.5);
  const manualFront = Number(params.FrontDart);
  const frontOverride =
    params.FrontDartOverride && Number.isFinite(manualFront);
  const frontVal = frontOverride
    ? Math.max(0, manualFront)
    : Math.max(0, frontAuto);
  result.FrontDart = frontVal;

  const FIRST_BACK_DART_MAX = 4.5;
  const MIN_SECOND_BACK_DART_CM_TARGET = 1;
  const manualBack1 = Number(params.BackDart1);
  const back1Override =
    params.BackDart1Override && Number.isFinite(manualBack1);
  let back1Val = back1Override
    ? Math.max(0, manualBack1)
    : Math.min(waistDiffTarget * 0.3, FIRST_BACK_DART_MAX);

  let remainder = Math.max(0, waistDiffTarget - sideVal - frontVal - back1Val);
  const manualBack2 = Number(params.BackDart2);
  const back2Override =
    params.BackDart2Override && Number.isFinite(manualBack2);
  let back2Val = back2Override
    ? Math.max(0, manualBack2)
    : Math.max(0, remainder);

  if (
    !back1Override &&
    !back2Override &&
    back2Val > 0 &&
    back2Val < MIN_SECOND_BACK_DART_CM_TARGET &&
    back1Val < FIRST_BACK_DART_MAX
  ) {
    const transferable = Math.min(back2Val, FIRST_BACK_DART_MAX - back1Val);
    if (transferable > 0) {
      back1Val += transferable;
      remainder = Math.max(0, remainder - transferable);
      back2Val = Math.max(0, remainder);
    }
  }

  result.BackDart1 = back1Val;
  result.BackDart2 = back2Val;
  result.DartSum = Math.max(0, sideVal + frontVal + back1Val + back2Val);
  result.ManualDartSum = HOFENBITZER_SKIRT_MANUAL_KEYS.reduce((sum, key) => {
    if (params[`${key}Override`]) {
      const val = Number(params[key]);
      return sum + (Number.isFinite(val) ? Math.max(0, val) : 0);
    }
    return sum;
  }, 0);
  result.WaistShaping = determineHofSkirtWaistShaping(params.HipProfile);
  result.HiDCons = Number(params.HiD) || 0;
  result.MoLCons = Number(params.MoL) || 0;
  result.WaDif = waistDiffTarget - result.ManualDartSum;
  return result;
}

function applyHofenbitzerFitProfile(index, options = {}) {
  const profile =
    HOFENBITZER_FIT_PROFILES[index] ||
    HOFENBITZER_FIT_PROFILES[HOFENBITZER_DEFAULT_FIT_INDEX];
  if (!profile) return;
  if (hofenbitzerUi.fitSelect) {
    hofenbitzerUi.fitSelect.value = String(index);
  }
  HOFENBITZER_PRIMARY_MEASUREMENTS.forEach((def) => {
    const ref = hofenbitzerUi.measurementRows[def.id];
    if (!ref || !ref.easeInput || !def.fitKey) return;
    if (!Object.prototype.hasOwnProperty.call(profile.ease, def.fitKey)) return;
    ref.easeInput.value = formatHofenbitzerValue(profile.ease[def.fitKey]);
    updateHofenbitzerMeasurementRow(def.id);
  });
  if (!options.silent) {
    scheduleRegen();
  }
}

function initHofenbitzerControls() {
  if (hofenbitzerUi.initialized) return;
  const primaryHost = document.getElementById("hofenbitzerPrimaryMeasurements");
  const secondaryHost = document.getElementById(
    "hofenbitzerSecondaryMeasurements"
  );
  if (!primaryHost || !secondaryHost) return;

  hofenbitzerUi.measurementRows = {};
  primaryHost.innerHTML = "";

  HOFENBITZER_PRIMARY_MEASUREMENTS.forEach((def) => {
    const rowEl = document.createElement("section");
    rowEl.className = "measure-block";
    const inputsWrapper = document.createElement("div");
    inputsWrapper.className = "measure-row";
    rowEl.appendChild(inputsWrapper);

    const measurementInput = document.createElement("input");
    measurementInput.type = "number";
    measurementInput.step = def.step || 0.1;
    measurementInput.value = formatHofenbitzerValue(def.measurementDefault);
    measurementInput.inputMode = "decimal";
    inputsWrapper.appendChild(
      createHofenbitzerField(def.label, measurementInput)
    );

    let easeInput = null;
    if (def.hasEase !== false) {
      easeInput = document.createElement("input");
      easeInput.type = "number";
      easeInput.step = def.easeStep || 0.1;
      easeInput.value = formatHofenbitzerValue(def.easeDefault || 0);
      easeInput.inputMode = "decimal";
      inputsWrapper.appendChild(createHofenbitzerField("Ease", easeInput));
    } else {
      const emptyInput = document.createElement("input");
      emptyInput.type = "text";
      emptyInput.readOnly = true;
      emptyInput.value = "--";
      emptyInput.tabIndex = -1;
      inputsWrapper.appendChild(
        createHofenbitzerField("Ease", emptyInput, { empty: true })
      );
    }

    const initialFinal =
      def.measurementDefault +
      (def.hasEase !== false ? def.easeDefault || 0 : 0);
    const finalLabelMap = {
      AhD: "AhD+",
      BrC: "BrC+",
      WaC: "WaW",
      HiC: "HiW",
      BG: "BG+",
      AG: "AG+",
      BrG: "BrG+",
      ShG: "fShS",
      BL: "BL",
      FL: "FL",
    };
    const finalField = createHofenbitzerFinalField(
      finalLabelMap[def.id] || "Final",
      formatHofenbitzerValue(initialFinal)
    );
    inputsWrapper.appendChild(finalField.field);

    primaryHost.appendChild(rowEl);

    hofenbitzerUi.measurementRows[def.id] = {
      def,
      measurementInput,
      easeInput,
      finalOutput: finalField.output,
    };

    const inputHandler = () => {
      updateHofenbitzerMeasurementRow(def.id);
      scheduleRegen();
    };
    measurementInput.addEventListener("input", inputHandler);
    if (easeInput) easeInput.addEventListener("input", inputHandler);
  });

  hofenbitzerUi.secondaryRows = {};
  secondaryHost.innerHTML = "";

  const secondaryRows = [];
  for (let i = 0; i < HOFENBITZER_SECONDARY_MEASUREMENTS.length; i += 3) {
    secondaryRows.push(HOFENBITZER_SECONDARY_MEASUREMENTS.slice(i, i + 3));
  }

  secondaryRows.forEach((group) => {
    const rowEl = document.createElement("section");
    rowEl.className = "measure-block";
    const inputsWrapper = document.createElement("div");
    inputsWrapper.className = "measure-row";
    rowEl.appendChild(inputsWrapper);

    group.forEach((def) => {
      const input = document.createElement("input");
      input.type = "number";
      input.step = def.step || 0.1;
      input.value = formatHofenbitzerValue(def.defaultValue);
      input.inputMode = "decimal";
      inputsWrapper.appendChild(createHofenbitzerField(def.label, input));

      hofenbitzerUi.secondaryRows[def.id] = {
        def,
        input,
      };

      input.addEventListener("input", () => {
        updateHofenbitzerSecondaryRow(def.id);
        scheduleRegen();
      });
    });

    secondaryHost.appendChild(rowEl);
  });

  const fitSelect = document.getElementById("hofenbitzerFitProfile");
  if (fitSelect) {
    hofenbitzerUi.fitSelect = fitSelect;
    const initialFit = Number.parseInt(fitSelect.value, 10);
    fitSelect.addEventListener("change", () => {
      const idx = Number.parseInt(fitSelect.value, 10);
      applyHofenbitzerFitProfile(
        Number.isNaN(idx) ? HOFENBITZER_DEFAULT_FIT_INDEX : idx
      );
    });
    applyHofenbitzerFitProfile(
      Number.isNaN(initialFit) ? HOFENBITZER_DEFAULT_FIT_INDEX : initialFit,
      {
        silent: true,
      }
    );
  }

  const derivedContainer = document.getElementById("hofenbitzerDerivedMetrics");
  hofenbitzerUi.derivedOutputs = {
    hiG: derivedContainer?.querySelector("#hofDerivedHiG") || null,
    hipShortage:
      derivedContainer?.querySelector("#hofDerivedHipShortage") || null,
    hipSpanBack:
      derivedContainer?.querySelector("#hofDerivedHipSpanBack") || null,
    hipSpanFront:
      derivedContainer?.querySelector("#hofDerivedHipSpanFront") || null,
  };
  updateHofenbitzerDerivedOutputs();

  hofenbitzerUi.initialized = true;
}

function captureHofSkirtInputs() {
  hydrateHofSkirtManualOverridesFromDom();
  const manual = hofSkirtUi.manualOverrides || {};
  return {
    HiC: getNumber("hofSkirtHiC", HOFENBITZER_SKIRT_DEFAULTS.HiC),
    WaC: getNumber("hofSkirtWaC", HOFENBITZER_SKIRT_DEFAULTS.WaC),
    HiD: getNumber("hofSkirtHiD", HOFENBITZER_SKIRT_DEFAULTS.HiD),
    MoL: getNumber("hofSkirtMoL", HOFENBITZER_SKIRT_DEFAULTS.MoL),
    HipEase: getNumber("hofSkirtHipEase", HOFENBITZER_SKIRT_DEFAULTS.HipEase),
    WaistEase: getNumber(
      "hofSkirtWaistEase",
      HOFENBITZER_SKIRT_DEFAULTS.WaistEase
    ),
    FrontDartLength: getNumber(
      "hofSkirtFrontDartLength",
      HOFENBITZER_SKIRT_DEFAULTS.FrontDartLength
    ),
    BackDartLength1: getNumber(
      "hofSkirtBackDartLength1",
      HOFENBITZER_SKIRT_DEFAULTS.BackDartLength1
    ),
    BackDartLength2: getNumber(
      "hofSkirtBackDartLength2",
      HOFENBITZER_SKIRT_DEFAULTS.BackDartLength2
    ),
    HipProfile: getText(
      "hofSkirtHipProfile",
      HOFENBITZER_SKIRT_DEFAULTS.HipProfile
    ),
    SideDart: getNumber("hofSkirtSideDart", 0),
    FrontDart: getNumber("hofSkirtFrontDart", 0),
    BackDart1: getNumber("hofSkirtBackDart1", 0),
    BackDart2: getNumber("hofSkirtBackDart2", 0),
    SideDartOverride: Boolean(manual.SideDart),
    FrontDartOverride: Boolean(manual.FrontDart),
    BackDart1Override: Boolean(manual.BackDart1),
    BackDart2Override: Boolean(manual.BackDart2),
    showGuides: getCheckbox("hofSkirtShowGuides", true),
    showMarkers: getCheckbox("hofSkirtShowMarkers", true),
  };
}

function updateHofSkirtDerivedFields() {
  if (!hofSkirtUi.initialized) return;
  const snapshot = captureHofSkirtInputs();
  const derived = computeHofSkirtDerived(snapshot);

  hofSkirtUi.cachedInputs = snapshot;
  hofSkirtUi.cachedDerived = derived;

  const manual = hofSkirtUi.manualOverrides;
  const setInputIfAuto = (key, value) => {
    if (manual[key]) return;
    const input = document.getElementById(`hofSkirt${key}`);
    if (!input) return;
    if (Number.isFinite(value)) {
      input.value = formatHofenbitzerValue(value);
    } else {
      input.value = "";
    }
  };

  setInputIfAuto("SideDart", derived.SideDart);
  setInputIfAuto("FrontDart", derived.FrontDart);
  setInputIfAuto("BackDart1", derived.BackDart1);
  setInputIfAuto("BackDart2", derived.BackDart2);

  const outputs = hofSkirtUi.derivedOutputs || {};
  const formatDisplay = (val) =>
    Number.isFinite(val) ? `${formatHofenbitzerValue(val)} cm` : "--";
  if (outputs.hiW) outputs.hiW.textContent = formatDisplay(derived.HiW);
  if (outputs.waW) outputs.waW.textContent = formatDisplay(derived.WaW);
  if (outputs.waistDiff)
    outputs.waistDiff.textContent = formatDisplay(derived.WaistDiffTarget);
  if (outputs.dartSum)
    outputs.dartSum.textContent = formatDisplay(derived.DartSum);
}

function initHofSkirtControls() {
  if (hofSkirtUi.initialized) return;
  const derivedPanel = document.getElementById("hofSkirtDerivedPanel");
  hofSkirtUi.derivedOutputs = {
    hiW: derivedPanel?.querySelector("#hofSkirtDerivedHiW") || null,
    waW: derivedPanel?.querySelector("#hofSkirtDerivedWaW") || null,
    waistDiff: derivedPanel?.querySelector("#hofSkirtDerivedWaistDiff") || null,
    dartSum: derivedPanel?.querySelector("#hofSkirtDerivedDartSum") || null,
  };
  hydrateHofSkirtManualOverridesFromDom();

  const manualInputs = {
    SideDart: document.getElementById("hofSkirtSideDart"),
    FrontDart: document.getElementById("hofSkirtFrontDart"),
    BackDart1: document.getElementById("hofSkirtBackDart1"),
    BackDart2: document.getElementById("hofSkirtBackDart2"),
  };

  Object.entries(manualInputs).forEach(([key, input]) => {
    if (!input) return;
    input.addEventListener("input", () => {
      setHofSkirtManualOverride(key, true);
      updateHofSkirtDerivedFields();
    });
  });

  const measurementIds = [
    "hofSkirtHiC",
    "hofSkirtWaC",
    "hofSkirtHiD",
    "hofSkirtMoL",
    "hofSkirtHipEase",
    "hofSkirtWaistEase",
    "hofSkirtFrontDartLength",
    "hofSkirtBackDartLength1",
    "hofSkirtBackDartLength2",
    "hofSkirtHipProfile",
  ];

  measurementIds.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const eventName = el.tagName === "SELECT" ? "change" : "input";
    el.addEventListener(eventName, () => updateHofSkirtDerivedFields());
  });

  const resetBtn = document.getElementById("hofSkirtResetDarts");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      HOFENBITZER_SKIRT_MANUAL_KEYS.forEach((key) => {
        setHofSkirtManualOverride(key, false);
      });
      updateHofSkirtDerivedFields();
      scheduleRegen();
    });
  }

  updateHofSkirtDerivedFields();
  hofSkirtUi.initialized = true;
}

function computeHofenbitzerSleeveDerived(data = {}) {
  const toNumber = (value) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const derived = {};
  const ahh = toNumber(data.AhH);
  derived.AhHConstruction = ahh + toNumber(data.AhHEase);

  const fAh = toNumber(data.fAh);
  const bAh = toNumber(data.bAh);
  derived.fAhConstruction = fAh + toNumber(data.fAhEase);
  derived.bAhConstruction = bAh + toNumber(data.bAhEase);
  const manualAhC =
    data.AhC !== null && data.AhC !== undefined && data.AhC !== ""
      ? toNumber(data.AhC)
      : fAh + bAh;
  derived.AhC = manualAhC;
  derived.AhCConstruction = manualAhC + toNumber(data.AhCEase);

  const al = toNumber(data.AL);
  derived.SlL = al + toNumber(data.ALEase);
  const upper = toNumber(data.upAC);
  derived.SlW = upper + toNumber(data.upACEase);
  const wrist = toNumber(data.WrC);
  derived.HeW = wrist + toNumber(data.WrCEase);
  derived.CapLineEase = toNumber(data.CapLineEase);
  if (Number.isFinite(data.CapCurveLengthCm)) {
    derived.CapCurveLengthCm = data.CapCurveLengthCm;
  }

  derived.CapEasePct = toNumber(data.CapEasePct);
  derived.CapEasePctConstruction = derived.CapEasePct;
  derived.CapEaseCm =
    (derived.AhCConstruction * derived.CapEasePctConstruction) / 100;
  derived.CapC = derived.AhCConstruction + derived.CapEaseCm;
  derived.fAP = toNumber(data.fAP);
  derived.bAP = toNumber(data.bAP);
  derived.fAPFinal = derived.fAP;
  derived.bAPFinal = derived.bAP;
  return derived;
}

function initHofSleeveControls() {
  if (hofSleeveUi.initialized || hofSleeveUi.initializing) return;
  hofSleeveUi.initializing = true;
  const host = document.getElementById("hofSleeveMeasurements");
  if (!host) {
    hofSleeveUi.initializing = false;
    return;
  }
  hofSleeveUi.rows = {};
  host.innerHTML = "";

  HOFENBITZER_SLEEVE_MEASUREMENTS.forEach((def) => {
    const row = document.createElement("section");
    row.className = "measure-block";
    const rowContent = document.createElement("div");
    rowContent.className = "measure-row";
    row.appendChild(rowContent);

    let measurementInput = null;
    if (def.readOnly) {
      const emptyMeasurement = document.createElement("input");
      emptyMeasurement.type = "text";
      emptyMeasurement.readOnly = true;
      emptyMeasurement.value = "--";
      emptyMeasurement.tabIndex = -1;
      rowContent.appendChild(
        createHofenbitzerField(def.label, emptyMeasurement, { empty: true })
      );
    } else {
      measurementInput = document.createElement("input");
      measurementInput.type = "number";
      measurementInput.step = def.step || 0.1;
      if (Number.isFinite(def.defaultValue)) {
        measurementInput.value = formatHofenbitzerValue(def.defaultValue);
      }
      measurementInput.inputMode = "decimal";
      rowContent.appendChild(
        createHofenbitzerField(def.label, measurementInput)
      );
    }

    let easeInput = null;
    if (def.easeKey) {
      easeInput = document.createElement("input");
      easeInput.type = "number";
      easeInput.step = def.easeStep || 0.1;
      const easeDefault =
        def.easeDefault != null
          ? def.easeDefault
          : HOFENBITZER_SLEEVE_DEFAULTS[def.easeKey];
      if (Number.isFinite(easeDefault)) {
        easeInput.value = formatHofenbitzerValue(easeDefault);
      }
      easeInput.inputMode = "decimal";
      rowContent.appendChild(createHofenbitzerField("Ease", easeInput));
    } else {
      const emptyEase = document.createElement("input");
      emptyEase.type = "text";
      emptyEase.readOnly = true;
      emptyEase.value = "--";
      emptyEase.tabIndex = -1;
      rowContent.appendChild(
        createHofenbitzerField("Ease", emptyEase, { empty: true })
      );
    }

    let finalOutput = null;
    if (def.derivedKey) {
      const finalField = createHofenbitzerFinalField(
        def.derivedLabel || def.label || "Final",
        "--"
      );
      rowContent.appendChild(finalField.field);
      finalOutput = finalField.output;
    } else {
      const emptyFinal = document.createElement("input");
      emptyFinal.type = "text";
      emptyFinal.readOnly = true;
      emptyFinal.value = "--";
      emptyFinal.tabIndex = -1;
      rowContent.appendChild(
        createHofenbitzerField("Final", emptyFinal, { empty: true })
      );
    }

    const ref = {
      def,
      measurementInput,
      easeInput,
      finalOutput,
    };
    hofSleeveUi.rows[def.id] = ref;

    const onChange = () => {
      updateHofSleeveDerivedFields();
      scheduleRegen();
    };
    if (measurementInput) measurementInput.addEventListener("input", onChange);
    if (easeInput) easeInput.addEventListener("input", onChange);
    host.appendChild(row);
  });

  hofSleeveUi.initialized = true;
  hofSleeveUi.initializing = false;
  hofSleeveUi.derivedOutputs = {
    capLineEl: document.getElementById("hofSleeveDerivedCapLine"),
    widthEl: document.getElementById("hofSleeveDerivedWidth"),
    elbowEl: document.getElementById("hofSleeveDerivedElbow"),
    capEl: document.getElementById("hofSleeveDerivedCap"),
  };
  hofSleeveUi.lastMeasured = {};
  updateHofSleeveDerivedFields();
}

function collectHofSleeveParams(skipInit = false) {
  if (!skipInit) initHofSleeveControls();
  else if (!hofSleeveUi.initialized && !hofSleeveUi.initializing)
    initHofSleeveControls();
  const params = {};
  HOFENBITZER_SLEEVE_MEASUREMENTS.forEach((def) => {
    const ref = hofSleeveUi.rows[def.id];
    if (ref?.measurementInput) {
      const measurementValue = Number.parseFloat(ref.measurementInput.value);
      params[def.id] = Number.isFinite(measurementValue)
        ? measurementValue
        : HOFENBITZER_SLEEVE_DEFAULTS[def.id];
    } else if (
      Object.prototype.hasOwnProperty.call(HOFENBITZER_SLEEVE_DEFAULTS, def.id)
    ) {
      params[def.id] = HOFENBITZER_SLEEVE_DEFAULTS[def.id];
    }
    if (def.easeKey && ref?.easeInput) {
      const easeValue = Number.parseFloat(ref.easeInput.value);
      params[def.easeKey] = Number.isFinite(easeValue)
        ? easeValue
        : HOFENBITZER_SLEEVE_DEFAULTS[def.easeKey];
    }
  });
  params.showGuides = getCheckbox("hofSleeveShowGuides", true);
  params.showMarkers = getCheckbox("hofSleeveShowMarkers", true);
  if (
    hofSleeveUi.lastMeasured &&
    Number.isFinite(hofSleeveUi.lastMeasured.CapCurveLengthCm)
  ) {
    params.CapCurveLengthCm = hofSleeveUi.lastMeasured.CapCurveLengthCm;
  }
  return params;
}

function updateHofSleeveDerivedFields() {
  const snapshot = collectHofSleeveParams(true);
  const derived = computeHofenbitzerSleeveDerived(snapshot);
  hofSleeveUi.derivedOutputs = hofSleeveUi.derivedOutputs || {};
  const { widthEl, elbowEl, capEl, capLineEl } = hofSleeveUi.derivedOutputs;
  HOFENBITZER_SLEEVE_MEASUREMENTS.forEach((def) => {
    if (!def.derivedKey) return;
    const ref = hofSleeveUi.rows[def.id];
    if (!ref || !ref.finalOutput) return;
    const value = derived[def.derivedKey];
    ref.finalOutput.value = formatHofenbitzerValue(value);
  });
  const measured = hofSleeveUi.lastMeasured || {};
  const capLineVal =
    measured.CapLineCm != null && Number.isFinite(measured.CapLineCm)
      ? measured.CapLineCm
      : (derived.SlW || 0) + (derived.CapLineEase || 0);
  const widthVal =
    measured.SleeveWidthMeasured != null &&
    Number.isFinite(measured.SleeveWidthMeasured)
      ? measured.SleeveWidthMeasured
      : derived.SlW;
  const elbowVal =
    measured.ElbowWidthMeasured != null &&
    Number.isFinite(measured.ElbowWidthMeasured)
      ? measured.ElbowWidthMeasured
      : derived.HeW;
  const capVal = Number.isFinite(measured.CapCurveLengthCm)
    ? measured.CapCurveLengthCm
    : Number.isFinite(derived.CapCurveLengthCm)
    ? derived.CapCurveLengthCm
    : Number.isFinite(hofSleeveUi.lastMeasured?.CapCurveLengthCm)
    ? hofSleeveUi.lastMeasured.CapCurveLengthCm
    : null;
  if (capLineEl)
    capLineEl.textContent = Number.isFinite(capLineVal)
      ? `${formatHofenbitzerValue(capLineVal)} cm`
      : "-- cm";
  if (widthEl)
    widthEl.textContent = Number.isFinite(widthVal)
      ? `${formatHofenbitzerValue(widthVal)} cm`
      : "-- cm";
  if (elbowEl)
    elbowEl.textContent = Number.isFinite(elbowVal)
      ? `${formatHofenbitzerValue(elbowVal)} cm`
      : "-- cm";
  if (capEl)
    capEl.textContent = Number.isFinite(capVal)
      ? `${formatHofenbitzerValue(capVal)} cm`
      : "-- cm";
}

function createSvgRoot(w = PAGE_WIDTH_MM, h = PAGE_HEIGHT_MM) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("xmlns", NS);
  svg.setAttribute("xmlns:inkscape", INKSCAPE_NS);
  svg.setAttribute("version", "1.1");
  svg.setAttribute("width", w + "mm");
  svg.setAttribute("height", h + "mm");
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  return svg;
}

function layer(parent, name, opts = {}) {
  const g = document.createElementNS(NS, "g");
  const id = opts.id || slugifyId(name, opts.prefix);
  if (id) g.setAttribute("id", id);
  g.setAttribute("data-layer", name);
  if (opts.asLayer) {
    g.setAttributeNS(INKSCAPE_NS, "inkscape:groupmode", "layer");
    g.setAttributeNS(INKSCAPE_NS, "inkscape:label", name);
  }
  parent.appendChild(g);
  return g;
}

function path(d, attrs = {}) {
  const p = document.createElementNS(NS, "path");
  p.setAttribute("d", d);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v != null) p.setAttribute(k, v);
  });
  return p;
}

function textNode(x, y, str, attrs = {}) {
  const t = document.createElementNS(NS, "text");
  t.setAttribute("x", x);
  t.setAttribute("y", y);
  t.setAttribute("font-size", attrs["font-size"] || LABEL_FONT_SIZE_MM);
  if (!Object.prototype.hasOwnProperty.call(attrs, "fill")) {
    t.setAttribute("fill", "#111");
  }
  t.textContent = str;
  Object.entries(attrs).forEach(([k, v]) => {
    if (k !== "font-size") t.setAttribute(k, v);
  });
  return t;
}

function createBounds() {
  return {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
    include(x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      if (x < this.minX) this.minX = x;
      if (y < this.minY) this.minY = y;
      if (x > this.maxX) this.maxX = x;
      if (y > this.maxY) this.maxY = y;
    },
  };
}

function fitSvgToBounds(svg, bounds) {
  if (!svg || bounds.minX === Infinity) return;
  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const viewMinX = bounds.minX - PADDING_MM;
  const viewMinY = bounds.minY - TOP_PADDING_MM;
  const viewWidth = width + PADDING_MM * 2;
  const viewHeight = height + TOP_PADDING_MM + PADDING_MM;
  svg.setAttribute(
    "viewBox",
    `${viewMinX} ${viewMinY} ${viewWidth} ${viewHeight}`
  );
  svg.setAttribute("width", viewWidth + "mm");
  svg.setAttribute("height", viewHeight + "mm");
}

function generateArmstrong(params) {
  const svg = createSvgRoot();
  svg.appendChild(
    Object.assign(document.createElementNS(NS, "metadata"), {
      textContent: JSON.stringify({
        tool: "ArmstrongBodiceWeb",
        units: "mm",
        source: "Armstrong/Bodice/armstrong_bodice_draft_v1.jsx",
      }),
    })
  );

  const layers = createArmstrongLayerStack(svg);
  const bounds = createBounds();
  const origin = {
    x: PAGE_WIDTH_MM - PAGE_MARGIN_MM,
    y: PAGE_MARGIN_MM,
  };

  const points = {};
  const defaultMarkerStyle = {
    radius: 2,
    fontSize: 3,
    offsetY: 0,
  };

  function toSvgCoords(pt) {
    const mapped = {
      x: origin.x - pt.x * MM_PER_IN,
      y: origin.y + pt.y * MM_PER_IN,
    };
    bounds.include(mapped.x, mapped.y);
    return mapped;
  }

  // replace references to use wrapper

  function pickLayer(targetLayer, opts = {}) {
    const stroke = (opts.color || "").toString().toLowerCase();
    const isBlack =
      !stroke ||
      stroke === "black" ||
      stroke === "#000" ||
      stroke === "#000000" ||
      stroke === "#111" ||
      stroke === "#111111";
    if (isBlack) {
      if (targetLayer === layers.front && layers.foundationFront)
        return layers.foundationFront;
      if (targetLayer === layers.back && layers.foundationBack)
        return layers.foundationBack;
    }
    return targetLayer;
  }

  function drawLine(targetLayer, start, end, style = "solid", opts = {}) {
    const s = toSvgCoords(start);
    const e = toSvgCoords(end);
    const actualLayer = pickLayer(targetLayer, opts);
    const attrs = {
      fill: "none",
      stroke: opts.color || "#111",
      "stroke-width": opts.width || 0.45,
      "stroke-linecap": "butt",
    };
    if (style === "dashed") {
      attrs["stroke-dasharray"] = opts.dash || "6 4";
    }
    if (opts.name) {
      attrs["data-name"] = opts.name;
    }
    const line = path(`M ${s.x} ${s.y} L ${e.x} ${e.y}`, attrs);
    actualLayer.appendChild(line);
    return line;
  }

  function drawCurve(targetLayer, start, control1, control2, end, opts = {}) {
    const s = toSvgCoords(start);
    const c1 = toSvgCoords(control1);
    const c2 = toSvgCoords(control2);
    const e = toSvgCoords(end);
    const actualLayer = pickLayer(targetLayer, opts);
    const attrs = {
      fill: "none",
      stroke: opts.color || "#2563eb",
      "stroke-width": opts.width || 0.45,
    };
    if (opts.dashed) {
      attrs["stroke-dasharray"] = opts.dash || "6 4";
    }
    if (opts.name) {
      attrs["data-name"] = opts.name;
    }
    const curve = path(
      `M ${s.x} ${s.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${e.x} ${e.y}`,
      attrs
    );
    actualLayer.appendChild(curve);
    return curve;
  }

  function drawBezierArcSegment(
    targetLayer,
    startPoint,
    controlPoint,
    endPoint,
    opts = {}
  ) {
    const start = { x: startPoint.x, y: startPoint.y };
    const control = controlPoint
      ? { x: controlPoint.x, y: controlPoint.y }
      : null;
    const end = { x: endPoint.x, y: endPoint.y };
    const dxChord = end.x - start.x;
    const dyChord = end.y - start.y;
    const chordLength = Math.hypot(dxChord, dyChord);
    const tangentUnit = chordLength
      ? { x: dxChord / chordLength, y: dyChord / chordLength }
      : { x: 1, y: 0 };
    const normalUnit = { x: -tangentUnit.y, y: tangentUnit.x };

    const applyRatio = (base, ratio) => {
      const tangentComp =
        ratio && Number.isFinite(ratio.tangent) ? ratio.tangent : 0;
      const normalComp =
        ratio && Number.isFinite(ratio.normal) ? ratio.normal : 0;
      return {
        x:
          base.x +
          (tangentUnit.x * tangentComp + normalUnit.x * normalComp) *
            chordLength,
        y:
          base.y +
          (tangentUnit.y * tangentComp + normalUnit.y * normalComp) *
            chordLength,
      };
    };

    const buildControl = (base, fallback, ratio, offset, absolute) => {
      if (absolute) return { x: absolute.x, y: absolute.y };
      if (ratio && chordLength) return applyRatio(base, ratio);
      if (fallback) return { x: fallback.x, y: fallback.y };
      if (offset) return movePoint(base, offset.x || 0, offset.y || 0);
      return { x: base.x, y: base.y };
    };

    let ctrl1Fallback = null;
    let ctrl2Fallback = null;
    if (control) {
      ctrl1Fallback = {
        x: start.x + (control.x - start.x) * (2 / 3),
        y: start.y + (control.y - start.y) * (2 / 3),
      };
      ctrl2Fallback = {
        x: end.x + (control.x - end.x) * (2 / 3),
        y: end.y + (control.y - end.y) * (2 / 3),
      };
    }

    let ctrl1 = buildControl(
      start,
      ctrl1Fallback,
      opts.controlStartRatio,
      opts.controlStartOffset,
      opts.controlStartAbsolute
    );
    if (opts.controlStartOffset) {
      ctrl1 = movePoint(
        ctrl1,
        opts.controlStartOffset.x || 0,
        opts.controlStartOffset.y || 0
      );
    }
    let ctrl2 = buildControl(
      end,
      ctrl2Fallback,
      opts.controlEndRatio,
      opts.controlEndOffset,
      opts.controlEndAbsolute
    );
    if (opts.controlEndOffset) {
      ctrl2 = movePoint(
        ctrl2,
        opts.controlEndOffset.x || 0,
        opts.controlEndOffset.y || 0
      );
    }

    const s = toSvgCoords(start);
    const c1 = toSvgCoords(ctrl1);
    const c2 = toSvgCoords(ctrl2);
    const e = toSvgCoords(end);
    const actualLayer = pickLayer(targetLayer, opts);
    const attrs = {
      fill: "none",
      stroke: opts.color || "#2563eb",
      "stroke-width": opts.width || 0.45,
    };
    if (opts.dashed) {
      attrs["stroke-dasharray"] = opts.dash || "6 4";
    }
    if (opts.name) {
      attrs["data-name"] = opts.name;
    }
    const curve = path(
      `M ${s.x} ${s.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${e.x} ${e.y}`,
      attrs
    );
    actualLayer.appendChild(curve);
    return curve;
  }

  function drawInwardArc(
    targetLayer,
    startPoint,
    endPoint,
    depth = 0.5,
    options = {}
  ) {
    const start = { x: startPoint.x, y: startPoint.y };
    const end = { x: endPoint.x, y: endPoint.y };
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy);
    if (!length) return null;
    const mid = {
      x: (start.x + end.x) * 0.5,
      y: (start.y + end.y) * 0.5,
    };
    const nx = -dy / length;
    const ny = dx / length;
    const offset = Number.isFinite(depth) && depth !== 0 ? depth : 0.5;
    const inward = {
      x: mid.x + nx * offset,
      y: mid.y + ny * offset,
    };
    const outward = {
      x: mid.x - nx * offset,
      y: mid.y - ny * offset,
    };
    const controlPoint = options.forceOutward ? outward : inward;
    return drawBezierArcSegment(targetLayer, start, controlPoint, end, options);
  }

  function markPoint(pointName, coords, label = pointName) {
    points[pointName] = coords;
    const svgCoords = toSvgCoords(coords);
    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("cx", svgCoords.x);
    circle.setAttribute("cy", svgCoords.y);
    circle.setAttribute("r", MARKER_RADIUS_MM);
    circle.setAttribute("fill", "#000");
    circle.setAttribute("stroke", "#000");
    circle.setAttribute("stroke-width", 0.2);
    layers.markers.appendChild(circle);
    bounds.include(
      svgCoords.x - MARKER_RADIUS_MM,
      svgCoords.y - MARKER_RADIUS_MM
    );
    bounds.include(
      svgCoords.x + MARKER_RADIUS_MM,
      svgCoords.y + MARKER_RADIUS_MM
    );

    const labelNode = textNode(svgCoords.x, svgCoords.y + 0.4, label, {
      fill: "#fff",
      "font-size": 2.6,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      "font-weight": "600",
    });
    layers.numbers.appendChild(labelNode);
    bounds.include(svgCoords.x, svgCoords.y);
    return coords;
  }

  // --- Draft steps mirrored from ExtendScript ---
  const pointA = markPoint("A", { x: 0, y: 0 });

  const fullLengthPlusEighth = params.fullLength + 0.125;
  const pointB = markPoint("B", { x: 0, y: fullLengthPlusEighth });
  drawLine(layers.front, pointA, pointB, "solid", { name: "Full Length" });

  const pointC = markPoint("C", {
    x: pointA.x + (params.acrossShoulder - 0.125),
    y: pointA.y,
  });
  drawLine(layers.front, pointA, pointC, "solid", {
    name: "Front Across Shoulder",
  });

  const pointD = markPoint("D", {
    x: pointB.x,
    y: pointB.y - params.centreFrontLength,
  });
  drawLine(layers.front, pointB, pointD, "solid", {
    name: "B-D",
    color: "#2563eb",
  });

  const dLeftPoint = { x: pointD.x + 4, y: pointD.y };
  drawLine(layers.foundationFront, pointD, dLeftPoint, "dashed", {
    name: "Front Neck Guide 1",
  });

  const pointE = markPoint("E", {
    x: pointB.x + params.bustArc + 0.25,
    y: pointB.y,
  });
  drawLine(layers.front, pointB, pointE, "solid", { name: "Bust Arc" });

  const eUpPoint = { x: pointE.x, y: pointE.y - 11 };
  drawLine(layers.front, pointE, eUpPoint, "solid", {
    name: "Side Guide Line",
  });

  const cGuidePoint = { x: pointC.x, y: pointC.y + 4 };
  drawLine(layers.front, pointC, cGuidePoint, "dashed", {
    name: "Shoulder Slope Guide",
    color: "#111",
  });

  const horizontalSeparation = Math.abs(pointC.x - pointB.x);
  const shoulderSlopeLength = params.shoulderSlope;
  const verticalSpanSquared =
    shoulderSlopeLength * shoulderSlopeLength -
    horizontalSeparation * horizontalSeparation;
  const verticalSpan =
    verticalSpanSquared > 0 ? Math.sqrt(verticalSpanSquared) : 0;
  let gY = pointB.y - verticalSpan;
  if (gY < pointC.y) gY = pointC.y;
  if (gY > cGuidePoint.y) gY = cGuidePoint.y;
  const pointG = markPoint("G", { x: pointC.x, y: gY });
  drawLine(layers.foundationFront, pointB, pointG, "solid", {
    name: "Shoulder Slope",
  });

  // Point H along shoulder slope (bust depth)
  const gbVectorX = pointB.x - pointG.x;
  const gbVectorY = pointB.y - pointG.y;
  const gbLength = Math.hypot(gbVectorX, gbVectorY) || 1;
  const pointH = markPoint("H", {
    x: pointG.x + (gbVectorX / gbLength) * params.bustDepth,
    y: pointG.y + (gbVectorY / gbLength) * params.bustDepth,
  });

  // Point I on AC line with shoulder length
  const acVectorX = pointC.x - pointA.x;
  const acVectorY = pointC.y - pointA.y;
  const wX = pointA.x - pointG.x;
  const wY = pointA.y - pointG.y;
  const aQuad = acVectorX * acVectorX + acVectorY * acVectorY;
  const bQuad = 2 * (wX * acVectorX + wY * acVectorY);
  const cQuad =
    wX * wX + wY * wY - params.shoulderLength * params.shoulderLength;
  let discriminant = bQuad * bQuad - 4 * aQuad * cQuad;
  if (discriminant < 0) discriminant = 0;
  let t = 0;
  if (aQuad !== 0) {
    const sqrtDisc = Math.sqrt(discriminant);
    const t1 = (-bQuad + sqrtDisc) / (2 * aQuad);
    const t2 = (-bQuad - sqrtDisc) / (2 * aQuad);
    const clamp01 = (val) => val >= 0 && val <= 1;
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
  const pointI = markPoint("I", {
    x: pointA.x + acVectorX * t,
    y: pointA.y + acVectorY * t,
  });
  drawLine(layers.front, pointG, pointI, "solid", {
    name: "Shoulder Length",
    color: "#2563eb",
  });

  const diStartControl = movePoint(pointD, 1.8, 0);
  const diEndControl = movePoint(pointI, 0, 1.8);
  drawCurve(layers.front, pointD, diStartControl, diEndControl, pointI, {
    name: "D-I Arc",
    color: "#2563eb",
  });

  const giVecX = pointI.x - pointG.x;
  const giVecY = pointI.y - pointG.y;
  const giLength = Math.hypot(giVecX, giVecY) || 1;
  const perpX = -giVecY / giLength;
  const perpY = giVecX / giLength;
  const tDrop = perpY !== 0 ? (pointD.y - pointI.y) / perpY : 0;
  const iDropPoint = {
    x: pointI.x + perpX * tDrop,
    y: pointI.y + perpY * tDrop,
  };
  drawLine(layers.foundationFront, pointI, iDropPoint, "dashed", {
    name: "Front Neck Guide 2",
  });

  const pointJ = markPoint("J", { x: pointB.x, y: pointH.y });
  const pointL = markPoint("L", {
    x: pointB.x,
    y: pointD.y + (pointJ.y - pointD.y) * 0.5,
  });

  const pointK = markPoint("K", {
    x: pointJ.x + (params.bustSpan + 0.25),
    y: pointJ.y,
  });
  const kDropPoint = { x: pointK.x, y: pointK.y + 0.625 };
  drawLine(layers.foundationFront, pointK, kDropPoint, "dashed", {
    name: "Dart Reduction",
  });
  drawLine(layers.foundationFront, pointJ, pointK, "solid", {
    name: "Bust Span",
  });

  const pointM = markPoint("M", {
    x: pointL.x + (params.acrossChest + 0.25),
    y: pointL.y,
  });
  drawLine(layers.foundationFront, pointL, pointM, "solid", {
    name: "Across Chest",
  });
  drawLine(
    layers.foundationFront,
    { x: pointM.x, y: pointM.y - 2 },
    { x: pointM.x, y: pointM.y + 1 },
    "dashed",
    { name: "Front Armhole Guide Line" }
  );

  const pointFTop = { x: pointB.x + params.dartPlacement, y: pointB.y };
  const pointF = markPoint("F", { x: pointFTop.x, y: pointFTop.y + 0.1875 });
  drawLine(layers.foundationFront, pointFTop, pointF, "solid", {
    name: "Dart Placement Guide",
  });
  drawLine(layers.front, pointB, pointF, "solid", {
    name: "Front Waist Line 2",
    color: "#2563eb",
  });
  drawLine(layers.front, kDropPoint, pointF, "solid", {
    name: "K-F",
    color: "#2563eb",
  });

  const newStrapPlusEighth = params.newStrap + 0.125;
  const dxSide = pointE.x - pointI.x;
  let dySquared = newStrapPlusEighth * newStrapPlusEighth - dxSide * dxSide;
  if (dySquared < 0) dySquared = 0;
  const dySide = Math.sqrt(dySquared);
  const candidateNY1 = pointI.y + dySide;
  const candidateNY2 = pointI.y - dySide;
  const sideUpperY = pointE.y;
  const sideLowerY = pointE.y - 11;
  const clampToSide = (y) =>
    y >= Math.min(sideLowerY, sideUpperY) &&
    y <= Math.max(sideLowerY, sideUpperY);
  let selectedNY = clampToSide(candidateNY1) ? candidateNY1 : candidateNY2;
  if (clampToSide(candidateNY1) && clampToSide(candidateNY2)) {
    selectedNY =
      Math.abs(candidateNY1 - sideUpperY) < Math.abs(candidateNY2 - sideUpperY)
        ? candidateNY1
        : candidateNY2;
  } else if (!clampToSide(selectedNY)) {
    selectedNY = Math.max(Math.min(selectedNY, sideUpperY), sideLowerY);
  }
  const pointN = markPoint("N", { x: pointE.x, y: selectedNY });
  drawLine(layers.foundationFront, pointI, pointN, "solid", {
    name: "New Strap",
  });

  const pointO = markPoint("O", {
    x: pointE.x,
    y: pointN.y - params.sideLength,
  });
  drawLine(layers.foundationFront, pointN, pointO, "solid", {
    name: "Provisional Side Length",
  });
  drawInwardArc(layers.front, pointG, pointO, 0, {
    name: "G-O Arc",
    color: "#2563eb",
    controlStartRatio: { tangent: 0.5295, normal: 0.494 },
    controlStartOffset: { x: -0.15, y: 0 },
    controlEndRatio: { tangent: -0.1495, normal: 0.3325 },
  });

  const bustCupOffset = resolveBustCupOffset(params.bustCup);
  const pointPBase = { x: pointN.x + bustCupOffset, y: pointN.y };
  let pointPPosition = null;
  const onVecX = pointN.x - pointO.x;
  const onVecY = pointN.y - pointO.y;
  const onDistance = Math.hypot(onVecX, onVecY);
  if (params.sideLength > 0 && onDistance > 0) {
    const r0 = params.sideLength;
    const r1 = bustCupOffset;
    if (onDistance <= r0 + r1 && onDistance >= Math.abs(r0 - r1)) {
      const aInt =
        (r0 * r0 - r1 * r1 + onDistance * onDistance) / (2 * onDistance);
      const hSq = Math.max(0, r0 * r0 - aInt * aInt);
      const hInt = Math.sqrt(hSq);
      const baseX = pointO.x + (aInt * (pointN.x - pointO.x)) / onDistance;
      const baseY = pointO.y + (aInt * (pointN.y - pointO.y)) / onDistance;
      const offsetX = (-(pointN.y - pointO.y) * hInt) / onDistance;
      const offsetY = ((pointN.x - pointO.x) * hInt) / onDistance;
      const candidate1 = { x: baseX + offsetX, y: baseY + offsetY };
      const candidate2 = { x: baseX - offsetX, y: baseY - offsetY };
      const dist1 =
        (candidate1.x - pointPBase.x) ** 2 + (candidate1.y - pointPBase.y) ** 2;
      const dist2 =
        (candidate2.x - pointPBase.x) ** 2 + (candidate2.y - pointPBase.y) ** 2;
      pointPPosition = dist1 <= dist2 ? candidate1 : candidate2;
    }
  }
  if (!pointPPosition) {
    const opVecX = pointPBase.x - pointO.x;
    const opVecY = pointPBase.y - pointO.y;
    const opLength = Math.hypot(opVecX, opVecY);
    if (opLength > 0 && params.sideLength > 0) {
      const scale = params.sideLength / opLength;
      pointPPosition = {
        x: pointO.x + opVecX * scale,
        y: pointO.y + opVecY * scale,
      };
    } else {
      pointPPosition = { x: pointPBase.x, y: pointPBase.y };
    }
  }
  drawLine(layers.front, pointO, pointPPosition, "solid", {
    name: "Side Length OP",
    color: "#2563eb",
  });
  const pointP = markPoint("P", pointPPosition);

  const waistArcPlusQuarter = params.waistArc + 0.25;
  const bToFValue = Math.abs(pointFTop.x - pointB.x);
  const qDistance = waistArcPlusQuarter - bToFValue;
  const pfVecX = pointF.x - pointP.x;
  const pfVecY = pointF.y - pointP.y;
  const pfLength = Math.hypot(pfVecX, pfVecY);
  let pointQPosition = { x: pointP.x, y: pointP.y };
  if (pfLength > 0) {
    const scaleToQ = qDistance / pfLength;
    pointQPosition = {
      x: pointP.x + pfVecX * scaleToQ,
      y: pointP.y + pfVecY * scaleToQ,
    };
  }
  let pointQTarget = { x: pointQPosition.x, y: pointQPosition.y };
  const kfVecX = pointF.x - kDropPoint.x;
  const kfVecY = pointF.y - kDropPoint.y;
  const kfLength = Math.hypot(kfVecX, kfVecY);
  const kqVecX = pointQTarget.x - kDropPoint.x;
  const kqVecY = pointQTarget.y - kDropPoint.y;
  const kqLength = Math.hypot(kqVecX, kqVecY);
  if (kfLength > 0 && kqLength > 0) {
    const kqScale = kfLength / kqLength;
    pointQTarget = {
      x: kDropPoint.x + kqVecX * kqScale,
      y: kDropPoint.y + kqVecY * kqScale,
    };
  }
  drawLine(layers.front, kDropPoint, pointQTarget, "solid", {
    name: "KQ Equivalent",
    color: "#2563eb",
  });
  const pointQ = markPoint("Q", pointQTarget);
  drawLine(layers.front, pointP, pointQ, "solid", {
    name: "Front Waist Line 1",
    color: "#2563eb",
  });

  // --- Back Draft ---
  const backFullLength = firstNumber(params.fullLengthBack, params.fullLength);
  const backDartPlacement = firstNumber(
    params.dartPlacementBack,
    params.dartPlacement,
    0
  );
  const backWaistArcValue = firstNumber(
    params.waistArcBack,
    params.waistArc,
    0
  );
  const dartIntake = 1.5;
  const backJOffset = backWaistArcValue + 1.5 + 0.25;
  const centreBackLength = firstNumber(
    params.centreFrontLengthBack,
    params.centreFrontLength,
    backFullLength
  );
  const backAcrossShoulder = firstNumber(
    params.acrossShoulderBack,
    params.acrossShoulder
  );
  const backBustArc = firstNumber(params.bustArcBack, params.bustArc);
  const backShoulderSlope =
    firstNumber(params.shoulderSlopeBack, params.shoulderSlope) + 0.125;
  const shoulderLengthPlusHalf =
    firstNumber(params.shoulderLengthBack, params.shoulderLength, 0) + 0.5;
  const backSideLength = firstNumber(
    params.sideLengthBack,
    params.sideLength,
    0
  );
  const backAcrossChest = firstNumber(
    params.acrossChestBack,
    params.acrossChest
  );
  const backNeckPlusEighth = firstNumber(params.backNeck, 0) + 0.125;

  const backOrigin = {
    x: pointA.x - BACK_OFFSET_IN,
    y: pointA.y,
  };
  const backCoord = (dx, dy) => ({
    x: backOrigin.x + dx,
    y: backOrigin.y + dy,
  });

  const backPointA = markPoint("BA", backCoord(0, 0), "A");
  const backPointB = markPoint("BB", backCoord(0, backFullLength), "B");
  drawLine(layers.foundationBack, backPointA, backPointB, "solid", {
    name: "Back Full Length",
  });

  const backPointJ = markPoint(
    "BJ",
    backCoord(-backJOffset, backFullLength),
    "J"
  );
  const backPointL = markPoint(
    "BL",
    backCoord(-(backDartPlacement + dartIntake / 2), backFullLength),
    "L"
  );
  const backPointM = markPoint(
    "BM",
    backCoord(-backJOffset, backFullLength + 0.1875),
    "M"
  );
  const backPointD = markPoint(
    "BD",
    backCoord(0, backFullLength - centreBackLength),
    "D"
  );
  drawLine(layers.back, backPointD, backPointB, "solid", {
    name: "Centre Back",
    color: "#2563eb",
  });

  const backPointC = markPoint("BC", backCoord(-backAcrossShoulder, 0), "C");
  drawLine(layers.foundationBack, backPointA, backPointC, "solid", {
    name: "Back Across Shoulder",
  });
  drawLine(
    layers.foundationBack,
    backPointD,
    { x: backPointD.x - 4, y: backPointD.y },
    "dashed",
    { name: "Back Neck Guide" }
  );
  drawLine(
    layers.foundationBack,
    backPointC,
    { x: backPointC.x, y: backPointC.y + 6 },
    "dashed",
    { name: "Back Shoulder Slope Guide" }
  );

  const backPointE = markPoint(
    "BE",
    backCoord(-(backBustArc + 0.75), backFullLength),
    "E"
  );
  drawLine(layers.foundationBack, backPointB, backPointE, "solid", {
    name: "Back Arc",
  });
  const backEUp = backCoord(-(backBustArc + 0.75), backFullLength - 10);
  drawLine(layers.foundationBack, backPointE, backEUp, "solid", {
    name: "Back Side Guide Line",
  });

  const backPointF = markPoint("BF", backCoord(-backNeckPlusEighth, 0), "F");
  drawBezierArcSegment(layers.back, backPointD, backPointD, backPointF, {
    name: "Back Neck Curve",
    color: "#2563eb",
    controlStartRatio: { tangent: 0.5164137931, normal: -0.1390344828 },
    controlEndRatio: { tangent: -0.1807448276, normal: -0.191337931 },
  });

  const dxSlope = backPointC.x - backPointB.x;
  const baseDy = backPointC.y - backPointB.y;
  const aSlope = 1;
  const bSlope = 2 * baseDy;
  const cSlope =
    baseDy * baseDy + dxSlope * dxSlope - backShoulderSlope * backShoulderSlope;
  const discriminantSlope = bSlope * bSlope - 4 * aSlope * cSlope;
  let tSlope = 0;
  if (discriminantSlope >= 0) {
    const sqrtDisc = Math.sqrt(discriminantSlope);
    const t1 = (-bSlope + sqrtDisc) / (2 * aSlope);
    const t2 = (-bSlope - sqrtDisc) / (2 * aSlope);
    const withinGuide = (val) => val >= 0 && val <= 6;
    if (withinGuide(t1) && withinGuide(t2)) {
      tSlope = Math.max(t1, t2);
    } else if (withinGuide(t1)) {
      tSlope = t1;
    } else if (withinGuide(t2)) {
      tSlope = t2;
    } else {
      tSlope = Math.max(0, Math.min(6, t1));
    }
  }
  const backPointG = markPoint(
    "BG",
    backCoord(-backAcrossShoulder, tSlope),
    "G"
  );
  drawLine(layers.foundationBack, backPointB, backPointG, "solid", {
    name: "Back Shoulder Slope",
  });

  const backFGVecX = backPointG.x - backPointF.x;
  const backFGVecY = backPointG.y - backPointF.y;
  const backFGLen = Math.hypot(backFGVecX, backFGVecY) || 1;
  const backPointH = markPoint(
    "BH",
    {
      x: backPointF.x + (backFGVecX / backFGLen) * shoulderLengthPlusHalf,
      y: backPointF.y + (backFGVecY / backFGLen) * shoulderLengthPlusHalf,
    },
    "H"
  );
  drawLine(layers.foundationBack, backPointF, backPointH, "solid", {
    name: "Back Shoulder Length",
  });

  const backPointP = markPoint(
    "BP",
    {
      x: (backPointF.x + backPointH.x) / 2,
      y: (backPointF.y + backPointH.y) / 2,
    },
    "P"
  );
  const fhVecX = backPointH.x - backPointF.x;
  const fhVecY = backPointH.y - backPointF.y;
  const fhLength = Math.hypot(fhVecX, fhVecY) || 1;
  const fhUnitX = fhVecX / fhLength;
  const fhUnitY = fhVecY / fhLength;
  const backPointRBase = {
    x: backPointP.x - fhUnitX * 0.25,
    y: backPointP.y - fhUnitY * 0.25,
  };
  const backPointABase = {
    x: backPointP.x + fhUnitX * 0.25,
    y: backPointP.y + fhUnitY * 0.25,
  };

  const backPointMtoE = backPointE.x - backPointM.x;
  let backPointN = {
    x: backPointE.x,
    y:
      backPointM.y -
      Math.sqrt(
        Math.max(
          0,
          backSideLength * backSideLength - backPointMtoE * backPointMtoE
        )
      ),
  };
  if (backPointN.y < backEUp.y) backPointN.y = backEUp.y;
  backPointN = markPoint("BN", backPointN, "N");
  drawLine(layers.back, backPointM, backPointN, "solid", {
    name: "Back Side Length",
    color: "#2563eb",
  });
  const backMNLength = Math.hypot(
    backPointN.x - backPointM.x,
    backPointN.y - backPointM.y
  );
  const backPointO = markPoint(
    "BO",
    {
      x: backPointL.x,
      y: backPointL.y - Math.max(0, backMNLength - 1),
    },
    "O"
  );
  drawLine(layers.foundationBack, backPointL, backPointO, "dashed", {
    name: "Back Dart Leg Guide",
  });

  const backDLength = Math.hypot(
    backPointB.x - backPointD.x,
    backPointB.y - backPointD.y
  );
  const backPointS = markPoint(
    "BS",
    backCoord(0, backFullLength - centreBackLength + backDLength / 4),
    "S"
  );
  const backPointT = markPoint(
    "BT",
    backCoord(-(backAcrossChest + 0.25), backPointS.y),
    "T"
  );
  drawLine(layers.foundationBack, backPointS, backPointT, "solid", {
    name: "Across Back",
  });
  drawLine(
    layers.foundationBack,
    backCoord(-(backAcrossChest + 0.25), backPointT.y - 1),
    backCoord(-(backAcrossChest + 0.25), backPointT.y + 4),
    "dashed",
    { name: "Back Armhole Guideline" }
  );

  const backArmholeStartHandle = movePoint(backPointH, 6.25 / 2.54, 9.2 / 2.54);
  const backArmholeEndHandle = movePoint(backPointN, 3.7 / 2.54, -0.5 / 2.54);
  drawBezierArcSegment(layers.back, backPointH, backPointH, backPointN, {
    name: "Back Armhole Curve",
    color: "#2563eb",
    controlStartAbsolute: backArmholeStartHandle,
    controlEndAbsolute: backArmholeEndHandle,
  });

  const backPointIBase = backCoord(-backDartPlacement, backFullLength);
  const backPointKBase = backCoord(
    -(backDartPlacement + dartIntake),
    backFullLength
  );
  const extensionLength = 0.125;
  const backPointI = markPoint(
    "BI",
    extendPoint(backPointO, backPointIBase, extensionLength),
    "I"
  );
  const backPointK = markPoint(
    "BK",
    extendPoint(backPointO, backPointKBase, extensionLength),
    "K"
  );

  drawLine(layers.back, backPointB, backPointI, "solid", {
    name: "Back Waist Line 1",
    color: "#2563eb",
  });
  drawLine(layers.back, backPointK, backPointM, "solid", {
    name: "Back Waist Line 2",
    color: "#2563eb",
  });
  drawLine(layers.foundationBack, backPointP, backPointO, "dashed", {
    name: "Back Dart Center Guide",
  });

  drawLine(layers.back, backPointO, backPointI, "solid", {
    name: "Back Waist Dart Left Leg",
    color: "#2563eb",
  });
  drawLine(layers.back, backPointO, backPointK, "solid", {
    name: "Back Waist Dart Right Leg",
    color: "#2563eb",
  });

  const backPOVecX = backPointO.x - backPointP.x;
  const backPOVecY = backPointO.y - backPointP.y;
  const backPOLen = Math.hypot(backPOVecX, backPOVecY) || 1;
  const backPointQ = markPoint(
    "BQ",
    {
      x: backPointP.x + (backPOVecX / backPOLen) * 3,
      y: backPointP.y + (backPOVecY / backPOLen) * 3,
    },
    "Q"
  );

  const dartExtension = 0.125;
  const backPointR = markPoint(
    "BR",
    extendPoint(backPointQ, backPointRBase, dartExtension),
    "R"
  );
  const backPointa = markPoint(
    "Ba",
    extendPoint(backPointQ, backPointABase, dartExtension),
    "a"
  );
  drawLine(layers.back, backPointQ, backPointR, "solid", {
    name: "Back Shoulder Dart Left Leg",
    color: "#2563eb",
  });
  drawLine(layers.back, backPointQ, backPointa, "solid", {
    name: "Back Shoulder Dart Right Leg",
    color: "#2563eb",
  });

  drawLine(layers.back, backPointa, backPointH, "solid", {
    name: "Back Shoulder Line 2",
    color: "#2563eb",
  });
  drawLine(layers.back, backPointF, backPointR, "solid", {
    name: "Back Shoulder Line 1",
    color: "#2563eb",
  });
  // ------------------------------------------------

  applyLayerVisibility(layers, params);
  fitSvgToBounds(svg, bounds);

  return svg;
}

function generateAldrich(params) {
  const svg = createSvgRoot();
  svg.appendChild(
    Object.assign(document.createElementNS(NS, "metadata"), {
      textContent: JSON.stringify({
        tool: "AldrichCloseFittingBodiceWeb",
        units: "mm",
        source:
          "Aldrich/Bodice/aldrich_close_fitting_bodice_with_waist_shaping_v1.jsx",
      }),
    })
  );

  const layers = createAldrichLayerStack(svg);
  const bounds = createBounds();
  const origin = {
    x: PAGE_MARGIN_MM,
    y: PAGE_MARGIN_MM,
  };

  const points = {};

  function toSvgCoords(pt) {
    const mapped = {
      x: origin.x + pt.x * CM_TO_MM,
      y: origin.y + pt.y * CM_TO_MM,
    };
    bounds.include(mapped.x, mapped.y);
    return mapped;
  }

  function applyArtHandle(point, handle, signX = 1, signY = 1) {
    const artY = -point.y;
    const nextArtY = artY + signY * handle.y;
    return {
      x: point.x + signX * handle.x,
      y: -nextArtY,
    };
  }

  function drawSegment(layerNode, start, end, opts = {}) {
    if (!layerNode || !start || !end) return null;
    const s = toSvgCoords(start);
    const e = toSvgCoords(end);
    const attrs = {
      fill: "none",
      stroke: opts.color || "#111",
      "stroke-width": opts.width || 0.45,
      "stroke-linecap": "butt",
    };
    if (opts.dashed) {
      attrs["stroke-dasharray"] = opts.dash || "6 4";
    }
    const pathEl = path(`M ${s.x} ${s.y} L ${e.x} ${e.y}`, attrs);
    if (opts.name) pathEl.setAttribute("data-name", opts.name);
    layerNode.appendChild(pathEl);
    return pathEl;
  }

  const defaultMarkerStyle = {
    radius: MARKER_RADIUS_MM * 1.05,
    fontSize: LABEL_FONT_SIZE_MM * 0.8,
    offsetY: 0,
  };

  function drawCurveSegment(
    layerNode,
    start,
    control1,
    control2,
    end,
    opts = {}
  ) {
    if (!layerNode || !start || !end || !control1 || !control2) return null;
    const s = toSvgCoords(start);
    const c1 = toSvgCoords(control1);
    const c2 = toSvgCoords(control2);
    const e = toSvgCoords(end);
    const attrs = {
      fill: "none",
      stroke: opts.color || ALDRICH_COLORS.primary,
      "stroke-width": opts.width || 0.45,
    };
    if (opts.dashed) {
      attrs["stroke-dasharray"] = opts.dash || "6 4";
    }
    const pathEl = path(
      `M ${s.x} ${s.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${e.x} ${e.y}`,
      attrs
    );
    if (opts.name) pathEl.setAttribute("data-name", opts.name);
    layerNode.appendChild(pathEl);
    return pathEl;
  }

  function drawPolylineSegment(layerNode, coordList = [], opts = {}) {
    if (!layerNode || !coordList.length) return null;
    const pointsList = coordList.map((coord) => toSvgCoords(coord));
    const d = pointsList
      .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
      .join(" ");
    const attrs = {
      fill: "none",
      stroke: opts.color || "#111",
      "stroke-width": opts.width || 0.45,
    };
    if (opts.dashed) {
      attrs["stroke-dasharray"] = opts.dash || "6 4";
    }
    if (opts.name) {
      attrs["data-name"] = opts.name;
    }
    const pathEl = path(d, attrs);
    layerNode.appendChild(pathEl);
    return pathEl;
  }

  function addMarker(id, coords, style = {}) {
    if (!layers.markers || !layers.numbers || !coords) return;
    const anchor = toSvgCoords(coords);
    const radius =
      typeof style.radius === "number" && Number.isFinite(style.radius)
        ? style.radius
        : MARKER_RADIUS_MM;
    const fontSize =
      typeof style.fontSize === "number" && Number.isFinite(style.fontSize)
        ? style.fontSize
        : LABEL_FONT_SIZE_MM;
    const offsetY =
      typeof style.offsetY === "number" && Number.isFinite(style.offsetY)
        ? style.offsetY
        : LABEL_FONT_SIZE_MM * 0.35;
    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("cx", anchor.x);
    circle.setAttribute("cy", anchor.y);
    circle.setAttribute("r", radius);
    circle.setAttribute("fill", "#000");
    circle.setAttribute("stroke", "#000");
    circle.setAttribute("stroke-width", 0.25);
    layers.markers.appendChild(circle);

    const label = textNode(anchor.x, anchor.y + offsetY, String(id), {
      "font-size": fontSize,
      fill: "#fff",
      "text-anchor": "middle",
      "dominant-baseline": "middle",
    });
    layers.numbers.appendChild(label);
  }

  function registerPoint(id, coords, opts = {}) {
    points[id] = coords;
    if (!opts.skipMarker) {
      addMarker(id, coords, opts.markerStyle || defaultMarkerStyle);
    }
    return coords;
  }

  function registerLetterPoint(id, coords, label) {
    points[id] = coords;
    if (layers.letters && coords) {
      const anchor = toSvgCoords(coords);
      const letterNode = textNode(anchor.x, anchor.y, String(label || id), {
        "font-size": LABEL_FONT_SIZE_MM,
        fill: "#111",
        "text-anchor": "middle",
      });
      layers.letters.appendChild(letterNode);
    }
    return coords;
  }

  const depth01 = 1.5;
  const depth12 = params.armscyeDepth + 0.5;
  const vertical02 = depth01 + depth12;
  const halfBust = params.bust / 2;
  const width23 = halfBust + params.bustEase;
  const napeToWaist = params.napeToWaist;

  registerPoint("0", { x: 0, y: 0 });
  registerPoint("1", { x: 0, y: depth01 });
  registerPoint("2", { x: 0, y: vertical02 });
  registerPoint("3", { x: width23, y: vertical02 });
  registerPoint("4", { x: width23, y: 0 });
  registerPoint("5", { x: 0, y: depth01 + napeToWaist });
  registerPoint("6", { x: width23, y: depth01 + napeToWaist });
  const pointC = registerLetterPoint(
    "c",
    { x: points["6"].x, y: points["6"].y + 1 },
    "c"
  );

  registerPoint("9", { x: params.neckSize / 5 - 0.2, y: points["0"].y });
  registerPoint("10", {
    x: points["1"].x,
    y: points["1"].y + params.armscyeDepth / 5 - 0.7,
  });
  registerPoint("20", {
    x: points["4"].x - (params.neckSize / 5 - 0.7),
    y: points["4"].y,
  });
  registerPoint("21", {
    x: points["4"].x,
    y: points["4"].y + (params.neckSize / 5 - 0.2),
  });
  registerPoint("22", {
    x: points["3"].x - params.chest / 2 - params.frontNeckDart / 2,
    y: points["3"].y,
  });

  const distanceB = computeAldrichPointBDistance(params.bust);
  if (distanceB > 0) {
    const diag = distanceB / Math.SQRT2;
    const pointB = registerLetterPoint(
      "b",
      {
        x: points["22"].x - diag,
        y: points["22"].y - diag,
      },
      "b"
    );
    drawSegment(layers.foundation, points["22"], pointB, {
      dashed: true,
      color: ALDRICH_COLORS.guide,
      name: "Front Armhole Guideline",
    });
  }

  registerPoint("23", midpoint(points["3"], points["22"]));
  registerPoint(
    "24",
    { x: points["23"].x, y: points["5"].y },
    { skipMarker: true }
  );
  registerPoint("26", { x: points["23"].x, y: points["23"].y + 2.5 });
  registerPoint("27", {
    x: points["20"].x - params.frontNeckDart,
    y: points["20"].y,
  });

  registerPoint("31", {
    x: points["22"].x,
    y: points["22"].y + (points["21"].y - points["3"].y) / 3,
  });
  drawSegment(layers.foundation, points["5"], pointC, {
    color: ALDRICH_COLORS.primary,
    name: "Waist Drop Guide",
  });
  drawSegment(layers.foundation, points["2"], points["3"], {
    dashed: true,
    color: ALDRICH_COLORS.guide,
    name: "Bust Line",
  });
  drawSegment(layers.foundation, points["5"], points["6"], {
    dashed: true,
    color: ALDRICH_COLORS.guide,
    name: "Waistline",
  });
  drawSegment(layers.back, points["1"], points["5"], {
    color: ALDRICH_COLORS.primary,
    name: "Centre Back (CB)",
  });
  drawSegment(layers.foundation, points["4"], pointC, {
    color: ALDRICH_COLORS.primary,
    name: "CF Line",
  });
  drawSegment(layers.front, points["21"], pointC, {
    color: ALDRICH_COLORS.primary,
    name: "Centre Front (CF)",
  });
  drawSegment(layers.foundation, points["0"], points["4"], {
    color: ALDRICH_COLORS.primary,
    name: "0 - 4",
  });
  drawSegment(layers.foundation, points["0"], points["5"], {
    color: ALDRICH_COLORS.primary,
    name: "Foundation Centre Back",
  });

  const shoulderDeltaY = Math.abs(points["10"].y - points["9"].y);
  const shoulderPlusOne = params.shoulder + 1;
  let shoulderHorizontal = 0;
  if (shoulderPlusOne > shoulderDeltaY) {
    const squared = Math.pow(shoulderPlusOne, 2) - Math.pow(shoulderDeltaY, 2);
    shoulderHorizontal = Math.sqrt(Math.max(squared, 0));
  }
  registerPoint("11", {
    x: points["9"].x + shoulderHorizontal,
    y: points["10"].y,
  });
  registerPoint("12", midpoint(points["9"], points["11"]));
  const guide12Down = { x: points["12"].x, y: points["12"].y + 5 };
  drawSegment(layers.foundation, points["12"], guide12Down, {
    dashed: true,
    color: ALDRICH_COLORS.guide,
    name: "Back Shoulder Guide",
  });
  registerPoint("13", { x: guide12Down.x - 1, y: guide12Down.y });
  drawSegment(layers.foundation, guide12Down, points["13"], {
    dashed: true,
    color: ALDRICH_COLORS.guide,
  });
  const shoulderSegmentLength = distanceBetween(points["9"], points["11"]);
  const shoulderDartHalfWidth = 0.5;
  if (shoulderSegmentLength > 0.0001) {
    const shoulderUnitX =
      (points["11"].x - points["9"].x) / shoulderSegmentLength;
    const shoulderUnitY =
      (points["11"].y - points["9"].y) / shoulderSegmentLength;
    const shoulderDartLeft = {
      x: points["12"].x - shoulderUnitX * shoulderDartHalfWidth,
      y: points["12"].y - shoulderUnitY * shoulderDartHalfWidth,
    };
    const shoulderDartRight = {
      x: points["12"].x + shoulderUnitX * shoulderDartHalfWidth,
      y: points["12"].y + shoulderUnitY * shoulderDartHalfWidth,
    };
    const leftLegLength = distanceBetween(shoulderDartLeft, points["13"]);
    const rightVector = {
      x: shoulderDartRight.x - points["13"].x,
      y: shoulderDartRight.y - points["13"].y,
    };
    const rightVectorLength = Math.hypot(rightVector.x, rightVector.y);
    let shoulderDartRightAdjusted = shoulderDartRight;
    if (rightVectorLength > 0.0001 && leftLegLength > 0.0001) {
      const scale = leftLegLength / rightVectorLength;
      shoulderDartRightAdjusted = {
        x: points["13"].x + rightVector.x * scale,
        y: points["13"].y + rightVector.y * scale,
      };
    }
    drawPolylineSegment(
      layers.back,
      [shoulderDartLeft, points["13"], shoulderDartRightAdjusted],
      {
        color: ALDRICH_COLORS.primary,
        name: "Back Shoulder Dart",
      }
    );
    drawSegment(layers.back, points["9"], shoulderDartLeft, {
      color: ALDRICH_COLORS.primary,
      name: "Back Shoulder Line",
    });
    drawSegment(layers.back, shoulderDartRightAdjusted, points["11"], {
      color: ALDRICH_COLORS.primary,
      name: "Back Shoulder Dart Right to 11",
    });
  } else {
    drawSegment(layers.back, points["9"], points["11"], {
      color: ALDRICH_COLORS.primary,
      name: "Back Shoulder Line",
    });
  }

  const backNeckChord = distanceBetween(points["1"], points["9"]);
  const handle1 = clampHandleToChordCm(4.3, 0, backNeckChord);
  const handle9 = clampHandleToChordCm(-1, -1, backNeckChord);
  const backNeckControl1 = applyArtHandle(points["1"], handle1, 1, 1);
  const backNeckControl2 = applyArtHandle(points["9"], handle9, 1, 1);
  drawCurveSegment(
    layers.back,
    points["1"],
    backNeckControl1,
    backNeckControl2,
    points["9"],
    { name: "Back Neck Curve", color: ALDRICH_COLORS.primary }
  );

  const frontNeckChord = distanceBetween(points["20"], points["21"]);
  const handle20 = clampHandleToChordCm(0, -4, frontNeckChord);
  const handle21 = clampHandleToChordCm(-4, 0, frontNeckChord);
  const frontNeckControl1 = applyArtHandle(points["20"], handle20, 1, 1);
  const frontNeckControl2 = applyArtHandle(points["21"], handle21, 1, 1);
  drawCurveSegment(
    layers.front,
    points["20"],
    frontNeckControl1,
    frontNeckControl2,
    points["21"],
    { name: "Front Neck Curve", color: ALDRICH_COLORS.primary }
  );

  drawSegment(layers.front, points["20"], points["26"], {
    color: ALDRICH_COLORS.primary,
    name: "Front Neck Dart Left Leg",
  });
  drawSegment(layers.front, points["27"], points["26"], {
    color: ALDRICH_COLORS.primary,
    name: "Front Neck Dart Right Leg",
  });

  registerPoint("28", { x: points["11"].x, y: points["11"].y + 1.5 });
  registerPoint("29", { x: points["28"].x + 10, y: points["28"].y });
  drawSegment(layers.foundation, points["11"], points["28"], {
    dashed: true,
    color: ALDRICH_COLORS.guide,
    name: "Back Shoulder Drop",
  });
  drawSegment(layers.foundation, points["28"], points["29"], {
    dashed: true,
    color: ALDRICH_COLORS.guide,
    name: "Shoulder Balance Line",
  });
  const frontShoulderDeltaY = Math.abs(points["28"].y - points["27"].y);
  const frontShoulderHorizontalSq =
    Math.pow(params.shoulder, 2) - Math.pow(frontShoulderDeltaY, 2);
  let frontShoulderHorizontal = 0;
  if (frontShoulderHorizontalSq > 0) {
    frontShoulderHorizontal = Math.sqrt(frontShoulderHorizontalSq);
  }
  let candidateX30 = points["27"].x - frontShoulderHorizontal;
  const minFrontX = Math.min(points["28"].x, points["29"].x);
  const maxFrontX = Math.max(points["28"].x, points["29"].x);
  if (candidateX30 < minFrontX) candidateX30 = minFrontX;
  if (candidateX30 > maxFrontX) candidateX30 = maxFrontX;
  registerPoint("30", { x: candidateX30, y: points["28"].y });
  drawSegment(layers.front, points["27"], points["30"], {
    color: ALDRICH_COLORS.primary,
    name: "Front Shoulder Line",
  });

  registerPoint("14", {
    x: points["2"].x + params.backWidth / 2 + 0.5,
    y: points["2"].y,
  });
  const pointADistance = computeAldrichPointADistance(params.bust);
  if (pointADistance > 0) {
    const diagComponent = pointADistance / Math.SQRT2;
    const pointA = registerLetterPoint(
      "a",
      {
        x: points["14"].x + diagComponent,
        y: points["14"].y - diagComponent,
      },
      "a"
    );
    drawSegment(layers.foundation, points["14"], pointA, {
      dashed: true,
      color: ALDRICH_COLORS.guide,
      name: "Back Armhole Guideline",
    });
  }
  registerPoint("15", { x: points["14"].x, y: points["10"].y });
  registerPoint("16", midpoint(points["14"], points["15"]));
  registerPoint("17", midpoint(points["2"], points["14"]));
  registerPoint("32", midpoint(points["14"], points["22"]));
  drawSegment(layers.foundation, points["14"], points["15"], {
    dashed: true,
    color: ALDRICH_COLORS.guide,
    name: "Back Width Line",
  });

  const backArmholeChord = distanceBetween(points["11"], points["32"]);
  const backHandle11 = clampHandleToChordCm(3.2, 9.79, backArmholeChord);
  const backHandle32 = clampHandleToChordCm(6.15, 0, backArmholeChord);
  const backArmControl1 = applyArtHandle(points["11"], backHandle11, -1, -1);
  const backArmControl2 = applyArtHandle(points["32"], backHandle32, -1, -1);
  drawCurveSegment(
    layers.back,
    points["11"],
    backArmControl1,
    backArmControl2,
    points["32"],
    { name: "Back Armhole Curve", color: ALDRICH_COLORS.primary }
  );

  const frontArmholeChord = distanceBetween(points["30"], points["32"]);
  const frontHandle30 = clampHandleToChordCm(7, 11.25, frontArmholeChord);
  const frontHandle32 = clampHandleToChordCm(6.47, 0, frontArmholeChord);
  const frontArmControl1 = applyArtHandle(points["30"], frontHandle30, 1, -1);
  const frontArmControl2 = applyArtHandle(points["32"], frontHandle32, 1, -1);
  drawCurveSegment(
    layers.front,
    points["30"],
    frontArmControl1,
    frontArmControl2,
    points["32"],
    { name: "Front Armhole Curve", color: ALDRICH_COLORS.primary }
  );

  drawSegment(layers.foundation, points["22"], points["31"], {
    dashed: true,
    color: ALDRICH_COLORS.guide,
    name: "Chest Line",
  });

  const waistLineY = points["5"].y;
  registerPoint("33", { x: points["23"].x, y: waistLineY });

  const line5 = points["5"];
  if (line5 && pointC) {
    const intersectionSpecs = [
      {
        id: "d",
        x: points["17"] ? points["17"].x : null,
        top: points["17"],
        bottom: points["17"] ? { x: points["17"].x, y: pointC.y } : null,
      },
      {
        id: "e",
        x: points["23"] ? points["23"].x : null,
        top: points["23"],
        bottom: points["23"] ? { x: points["23"].x, y: pointC.y } : null,
      },
      {
        id: "f",
        x: points["32"] ? points["32"].x : null,
        top: points["32"],
        bottom: points["32"] ? { x: points["32"].x, y: pointC.y } : null,
      },
    ];
    intersectionSpecs.forEach((spec) => {
      if (!spec.top || !spec.bottom || !isFiniteNumber(spec.x)) return;
      const intersectionPoint = intersectLineWithVertical(
        line5,
        pointC,
        spec.x
      );
      if (!intersectionPoint) return;
      if (!valueBetween(intersectionPoint.y, spec.top.y, spec.bottom.y, 0.001))
        return;
      registerLetterPoint(spec.id, intersectionPoint, spec.id);
    });
  }

  const frontWaistDartWidth = params.frontWaistDart;
  if (
    points["e"] &&
    Number.isFinite(frontWaistDartWidth) &&
    frontWaistDartWidth > 0
  ) {
    const half = frontWaistDartWidth / 2;
    const dartBaseLeft = { x: points["e"].x - half, y: points["e"].y };
    const dartBaseRight = { x: points["e"].x + half, y: points["e"].y };
    const dartBackOff = Number.isFinite(params.frontWaistDartBackOff)
      ? params.frontWaistDartBackOff
      : 2.5;
    const dartApex = { x: points["e"].x, y: points["26"].y + dartBackOff };
    drawSegment(layers.front, dartBaseLeft, dartApex, {
      color: ALDRICH_COLORS.primary,
      name: "Front Waist Dart Left Leg",
    });
    drawSegment(layers.front, dartBaseRight, dartApex, {
      color: ALDRICH_COLORS.primary,
      name: "Front Waist Dart Right Leg",
    });
    drawSegment(layers.foundation, dartApex, points["e"], {
      dashed: true,
      color: ALDRICH_COLORS.guide,
      name: "Front Waist Dart Bisector",
    });
  }

  const backWaistDartWidth = params.backWaistDart;
  if (
    points["d"] &&
    points["17"] &&
    Number.isFinite(backWaistDartWidth) &&
    backWaistDartWidth > 0
  ) {
    const half = backWaistDartWidth / 2;
    const backLeftBase = { x: points["d"].x - half, y: points["d"].y };
    const backRightBase = { x: points["d"].x + half, y: points["d"].y };
    const backApex = { x: points["17"].x, y: points["17"].y };
    drawSegment(layers.back, backLeftBase, backApex, {
      color: ALDRICH_COLORS.primary,
      name: "Back Waist Dart Left Leg",
    });
    drawSegment(layers.back, backRightBase, backApex, {
      color: ALDRICH_COLORS.primary,
      name: "Back Waist Dart Right Leg",
    });
    drawSegment(layers.foundation, points["17"], points["d"], {
      dashed: true,
      color: ALDRICH_COLORS.guide,
      name: "Back Waist Dart Bisector",
    });
  }

  const waistLineStart = points["5"];
  const waistLineEnd = pointC;
  const waistLineMinX =
    waistLineStart && waistLineEnd
      ? Math.min(waistLineStart.x, waistLineEnd.x)
      : null;
  const waistLineMaxX =
    waistLineStart && waistLineEnd
      ? Math.max(waistLineStart.x, waistLineEnd.x)
      : null;

  const clampWaistX = (x) => {
    if (waistLineMinX == null || waistLineMaxX == null || !Number.isFinite(x))
      return x;
    const minX = Math.min(waistLineMinX, waistLineMaxX);
    const maxX = Math.max(waistLineMinX, waistLineMaxX);
    if (x < minX) return minX;
    if (x > maxX) return maxX;
    return x;
  };

  const waistLinePointAtX = (x) => {
    if (!waistLineStart || !waistLineEnd) return null;
    const deltaX = waistLineEnd.x - waistLineStart.x;
    if (Math.abs(deltaX) < 0.0001) {
      return { x, y: waistLineStart.y };
    }
    const slope = (waistLineEnd.y - waistLineStart.y) / deltaX;
    return {
      x,
      y: waistLineStart.y + slope * (x - waistLineStart.x),
    };
  };

  const waistAxisPoint =
    points["f"] ||
    (points["32"] && Number.isFinite(points["32"].x)
      ? waistLinePointAtX(clampWaistX(points["32"].x))
      : waistLineStart && waistLineEnd
      ? waistLinePointAtX(waistLineStart.x)
      : null);

  if (waistAxisPoint && points["32"]) {
    drawSegment(layers.foundation, points["32"], waistAxisPoint, {
      dashed: true,
      color: ALDRICH_COLORS.guide,
      name: "Side",
    });
    const sideApex = { x: points["32"].x, y: points["32"].y };

    const backSideWidth = params.backSideWaistDart;
    if (Number.isFinite(backSideWidth) && backSideWidth > 0) {
      const baseX = clampWaistX(waistAxisPoint.x - backSideWidth);
      const sideLeftBase = waistLinePointAtX(baseX) || {
        x: baseX,
        y: waistAxisPoint.y,
      };
      drawSegment(layers.back, sideLeftBase, sideApex, {
        color: ALDRICH_COLORS.primary,
        name: "Back Side Waist Dart",
      });
      if (points["5"]) {
        drawSegment(layers.back, points["5"], sideLeftBase, {
          color: ALDRICH_COLORS.primary,
          name: "Back Waist Line",
        });
      }
    }

    const frontSideWidth = params.frontSideWaistDart;
    if (Number.isFinite(frontSideWidth) && frontSideWidth > 0) {
      const baseX = clampWaistX(waistAxisPoint.x + frontSideWidth);
      const sideRightBase = waistLinePointAtX(baseX) || {
        x: baseX,
        y: waistAxisPoint.y,
      };
      drawSegment(layers.front, sideRightBase, sideApex, {
        color: ALDRICH_COLORS.primary,
        name: "Front Side Waist Dart",
      });
      if (pointC) {
        drawSegment(layers.front, pointC, sideRightBase, {
          color: ALDRICH_COLORS.primary,
          name: "Front Waist Line",
        });
      }
    }
  }

  drawSegment(layers.foundation, points["10"], points["1"], {
    color: ALDRICH_COLORS.primary,
    name: "Back Blade",
  });
  const backSquareEnd = { x: points["10"].x + width23 / 2, y: points["10"].y };
  drawSegment(layers.foundation, points["10"], backSquareEnd, {
    dashed: true,
    color: ALDRICH_COLORS.guide,
    name: "Back Blade Guide",
  });

  applyLayerVisibility(layers, params);
  fitSvgToBounds(svg, bounds);
  return svg;
}

function movePoint(pt, dx = 0, dy = 0) {
  return { x: pt.x + dx, y: pt.y + dy };
}

function extendPoint(origin, target, extra = 0) {
  const vecX = target.x - origin.x;
  const vecY = target.y - origin.y;
  const length = Math.hypot(vecX, vecY);
  if (!length) return { x: target.x, y: target.y };
  const scale = (length + extra) / length;
  return {
    x: origin.x + vecX * scale,
    y: origin.y + vecY * scale,
  };
}

function createArmstrongLayerStack(svg) {
  const foundation = layer(svg, "Foundation", { asLayer: true });
  const foundationFront = layer(foundation, "Front Guides", {
    asLayer: true,
    prefix: "foundation",
  });
  const foundationBack = layer(foundation, "Back Guides", {
    asLayer: true,
    prefix: "foundation",
  });

  const front = layer(svg, "Front Bodice", { asLayer: true });
  const back = layer(svg, "Back Bodice", { asLayer: true });
  const labelsParent = layer(svg, "Labels & Markers", { asLayer: true });
  const labels = layer(labelsParent, "Labels", {
    asLayer: true,
    prefix: "labels",
  });
  const markers = layer(labelsParent, "Markers", {
    asLayer: true,
    prefix: "labels",
  });
  const numbers = layer(labelsParent, "Numbers", {
    asLayer: true,
    prefix: "labels",
  });

  return {
    foundation,
    foundationFront,
    foundationBack,
    front,
    back,
    labelsParent,
    labels,
    markers,
    numbers,
  };
}

function createAldrichLayerStack(svg) {
  const foundation = layer(svg, "Aldrich Guides", {
    asLayer: true,
    prefix: "aldrich",
  });
  const front = layer(svg, "Aldrich Front Bodice", {
    asLayer: true,
    prefix: "aldrich",
  });
  const back = layer(svg, "Aldrich Back Bodice", {
    asLayer: true,
    prefix: "aldrich",
  });
  const darts = layer(svg, "Aldrich Darts", {
    asLayer: true,
    prefix: "aldrich",
  });
  const labelsParent = layer(svg, "Aldrich Labels & Markers", {
    asLayer: true,
    prefix: "aldrich",
  });
  const markers = layer(labelsParent, "Markers", {
    asLayer: true,
    prefix: "aldrich",
  });
  const numbers = layer(labelsParent, "Numbers", {
    asLayer: true,
    prefix: "aldrich",
  });
  const letters = layer(labelsParent, "Letters", {
    asLayer: true,
    prefix: "aldrich",
  });
  return {
    foundation,
    front,
    back,
    darts,
    labelsParent,
    markers,
    numbers,
    letters,
  };
}

function createHofenbitzerLayerStack(svg) {
  const foundation = layer(svg, "Basic Frame", {
    asLayer: true,
    prefix: "hofenbitzer",
  });
  const foundationFront = layer(foundation, "Front Guides", {
    asLayer: true,
    prefix: "hofenbitzer",
  });
  const foundationBack = layer(foundation, "Back Guides", {
    asLayer: true,
    prefix: "hofenbitzer",
  });
  const pattern = layer(svg, "Casual Bodice Lines", {
    asLayer: true,
    prefix: "hofenbitzer",
  });
  const front = layer(svg, "Front Bodice", {
    asLayer: true,
    prefix: "hofenbitzer",
  });
  const back = layer(svg, "Back Bodice", {
    asLayer: true,
    prefix: "hofenbitzer",
  });
  const labelsParent = layer(svg, "Hofenbitzer Labels & Markers", {
    asLayer: true,
    prefix: "hofenbitzer",
  });
  const labels = layer(labelsParent, "Labels", {
    asLayer: true,
    prefix: "hofenbitzer",
  });
  const markers = layer(labelsParent, "Markers", {
    asLayer: true,
    prefix: "hofenbitzer",
  });
  const numbers = layer(labelsParent, "Numbers", {
    asLayer: true,
    prefix: "hofenbitzer",
  });
  return {
    foundation,
    foundationFront,
    foundationBack,
    pattern,
    front,
    back,
    labelsParent,
    labels,
    markers,
    numbers,
  };
}

function createHofSkirtLayerStack(svg) {
  const foundation = layer(svg, "Basic Frame", {
    asLayer: true,
    prefix: "hofskirt",
  });
  const pattern = layer(svg, "Skirt Pattern", {
    asLayer: true,
    prefix: "hofskirt",
  });
  const dartsParent = layer(svg, "Darts & Shaping", {
    asLayer: true,
    prefix: "hofskirt",
  });
  const dartsLayer = layer(dartsParent, "Darts", { prefix: "hofskirt" });
  const shapingLayer = layer(dartsParent, "Shaping", { prefix: "hofskirt" });
  const labelsParent = layer(svg, "Labels, Markers & Numbers", {
    asLayer: true,
    prefix: "hofskirt",
  });
  const labels = layer(labelsParent, "Labels", {
    asLayer: true,
    prefix: "hofskirt",
  });
  const markers = layer(labelsParent, "Markers", {
    asLayer: true,
    prefix: "hofskirt",
  });
  const numbers = layer(labelsParent, "Numbers", {
    asLayer: true,
    prefix: "hofskirt",
  });
  return {
    foundation,
    pattern,
    front: pattern,
    dartsParent,
    dartsLayer,
    shapingLayer,
    labelsParent,
    labels,
    markers,
    numbers,
  };
}

function createHofSleeveLayerStack(svg) {
  const foundation = layer(svg, "Basic Frame", {
    asLayer: true,
    prefix: "hofsleeve",
  });
  const capShaping = layer(svg, "Cap Shaping", {
    asLayer: true,
    prefix: "hofsleeve",
  });
  const sleeveBlock = layer(svg, "Sleeve Block", {
    asLayer: true,
    prefix: "hofsleeve",
  });
  const labelsParent = layer(svg, "Numbers, Markers & Labels", {
    asLayer: true,
    prefix: "hofsleeve",
  });
  const labels = layer(labelsParent, "Labels", {
    asLayer: true,
    prefix: "hofsleeve",
  });
  const markers = layer(labelsParent, "Markers", {
    asLayer: true,
    prefix: "hofsleeve",
  });
  const numbers = layer(labelsParent, "Numbers", {
    asLayer: true,
    prefix: "hofsleeve",
  });
  return {
    foundation,
    capShaping,
    sleeveBlock,
    labelsParent,
    labels,
    markers,
    numbers,
    front: sleeveBlock,
    back: sleeveBlock,
  };
}

const HOF_SLEEVE_DASH = "8.8 4.2";
const HOF_SLEEVE_ARC_TARGET_CM = 20;
const HOF_SLEEVE_ARC_MAX_CM = 22;
const HOF_SLEEVE_ARC_MIN_SWEEP = 0.01;
const HOF_SLEEVE_ARC_MIN_START = -Math.PI / 2;
const HOF_SLEEVE_ARC_END = Math.PI / 2;
const HOF_SLEEVE_ARC_UP_RATIO = 3;
const HOF_SLEEVE_ARC_DOWN_RATIO = 2;
const HOF_SLEEVE_LABEL_OFFSET_CM = 0.5;

function generateHofenbitzerCasualBodice(params) {
  const svg = createSvgRoot();
  svg.appendChild(
    Object.assign(document.createElementNS(NS, "metadata"), {
      textContent: JSON.stringify({
        tool: "HofenbitzerCasualBodiceWeb",
        units: "cm",
        source: "Hofenbitzer/Bodice/hofenbitzer_casual_bodice_v1.jsx",
      }),
    })
  );

  const layers = createHofenbitzerLayerStack(svg);
  const bounds = createBounds();
  const origin = {
    x: PAGE_MARGIN_MM * 3,
    y: PAGE_MARGIN_MM * 2,
  };

  const patternLayer = layers.pattern || layers.front;
  const frontLayer = layers.front || patternLayer;
  const backLayer = layers.back || patternLayer;
  const frontBodiceLayer = frontLayer;
  const backBodiceLayer = backLayer;
  const guideLayer = layers.foundation;
  const guideFrontLayer = layers.foundationFront || guideLayer;
  const guideBackLayer = layers.foundationBack || guideLayer;
  const markersLayer = layers.markers;
  const numbersLayer = layers.numbers;
  const hofPoints = {};
  let backNeckPath = null;
  let frontNeckPath = null;

  const cmToMm = (value) => value * CM_TO_MM;

  function toSvgCoords(pt) {
    const mapped = {
      x: origin.x + pt.x * CM_TO_MM,
      y: origin.y + pt.y * CM_TO_MM,
    };
    bounds.include(mapped.x, mapped.y);
    return mapped;
  }

  function drawSegment(target, start, end, options = {}) {
    const layer = target || guideLayer;
    if (!layer) return null;
    const startPt = Array.isArray(start) ? { x: start[0], y: start[1] } : start;
    const endPt = Array.isArray(end) ? { x: end[0], y: end[1] } : end;
    const segment = path("", {
      fill: "none",
      stroke: options.color || HOFENBITZER_FRAME_COLOR,
      "stroke-width": options.width || 0.6,
    });
    if (options.dashed) {
      segment.setAttribute(
        "stroke-dasharray",
        options.dash || HOFENBITZER_DASH_PATTERN
      );
    }
    if (options.name) {
      segment.setAttribute("data-name", options.name);
    }
    updateSegmentGeometry(segment, startPt, endPt);
    layer.appendChild(segment);
    return segment;
  }

  function updateSegmentGeometry(pathEl, startPt, endPt) {
    if (!pathEl || !startPt || !endPt) return;
    pathEl.setAttribute("data-start-x", String(startPt.x));
    pathEl.setAttribute("data-start-y", String(startPt.y));
    pathEl.setAttribute("data-end-x", String(endPt.x));
    pathEl.setAttribute("data-end-y", String(endPt.y));
    const s = toSvgCoords(startPt);
    const e = toSvgCoords(endPt);
    pathEl.setAttribute("d", `M ${s.x} ${s.y} L ${e.x} ${e.y}`);
  }

  function getSegmentPoints(pathEl) {
    if (!pathEl) return null;
    const startX = parseFloat(pathEl.getAttribute("data-start-x"));
    const startY = parseFloat(pathEl.getAttribute("data-start-y"));
    const endX = parseFloat(pathEl.getAttribute("data-end-x"));
    const endY = parseFloat(pathEl.getAttribute("data-end-y"));
    if ([startX, startY, endX, endY].some((val) => Number.isNaN(val)))
      return null;
    return {
      start: { x: startX, y: startY },
      end: { x: endX, y: endY },
    };
  }

  function trimHorizontalSegmentRightOf(pathEl, cutPoint, tolerance = 0.05) {
    if (!pathEl || !cutPoint) return;
    const pts = getSegmentPoints(pathEl);
    if (!pts) return;
    const { start, end } = pts;
    if (Math.abs(start.y - end.y) > tolerance) return;
    const left = start.x <= end.x ? start : end;
    const right = start.x > end.x ? start : end;
    if (cutPoint.x <= left.x + tolerance) {
      pathEl.remove();
      return;
    }
    let newRight = right;
    if (cutPoint.x < right.x - tolerance) {
      newRight = { x: cutPoint.x, y: right.y };
    }
    const ordered = left === start;
    const newStart = ordered ? left : newRight;
    const newEnd = ordered ? newRight : left;
    updateSegmentGeometry(pathEl, newStart, newEnd);
  }

  function setSegmentBetween(pathEl, startPt, endPt) {
    updateSegmentGeometry(pathEl, startPt, endPt);
  }

  function drawCubic(target, start, ctrl1, ctrl2, end, options = {}) {
    const layer = target || patternLayer;
    if (!layer) return null;
    const startPt = Array.isArray(start) ? { x: start[0], y: start[1] } : start;
    const ctrlPt1 = Array.isArray(ctrl1) ? { x: ctrl1[0], y: ctrl1[1] } : ctrl1;
    const ctrlPt2 = Array.isArray(ctrl2) ? { x: ctrl2[0], y: ctrl2[1] } : ctrl2;
    const endPt = Array.isArray(end) ? { x: end[0], y: end[1] } : end;
    const s = toSvgCoords(startPt);
    const c1 = toSvgCoords(ctrlPt1);
    const c2 = toSvgCoords(ctrlPt2);
    const e = toSvgCoords(endPt);
    const attrs = {
      fill: "none",
      stroke: options.color || HOFENBITZER_FRAME_COLOR,
      "stroke-width": options.width || 0.6,
    };
    if (options.dashed) {
      attrs["stroke-dasharray"] = options.dash || HOFENBITZER_DASH_PATTERN;
    }
    if (options.name) {
      attrs["data-name"] = options.name;
    }
    const curve = path(
      `M ${s.x} ${s.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${e.x} ${e.y}`,
      attrs
    );
    layer.appendChild(curve);
    return curve;
  }

  function computeBulgeHandles(start, end, bulgeCm = 0) {
    const startPt = Array.isArray(start) ? { x: start[0], y: start[1] } : start;
    const endPt = Array.isArray(end) ? { x: end[0], y: end[1] } : end;
    const dx = endPt.x - startPt.x;
    const dy = endPt.y - startPt.y;
    const length = Math.hypot(dx, dy);
    const bulge = Number.isFinite(bulgeCm) ? bulgeCm : 0;
    if (length < 1e-6) {
      return {
        ctrl1: { x: startPt.x, y: startPt.y },
        ctrl2: { x: endPt.x, y: endPt.y },
      };
    }
    const nx = -dy / length;
    const ny = dx / length;
    return {
      ctrl1: {
        x: startPt.x + dx / 3 + nx * bulge,
        y: startPt.y + dy / 3 + ny * bulge,
      },
      ctrl2: {
        x: endPt.x - dx / 3 + nx * bulge,
        y: endPt.y - dy / 3 + ny * bulge,
      },
    };
  }

  function drawBulgedCurve(target, start, end, options = {}) {
    const startPt = Array.isArray(start) ? { x: start[0], y: start[1] } : start;
    const endPt = Array.isArray(end) ? { x: end[0], y: end[1] } : end;
    const dx = endPt.x - startPt.x;
    const dy = endPt.y - startPt.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = dy / length;
    const ny = -(dx / length);
    const bulge = Number.isFinite(options.bulgeCm) ? options.bulgeCm : 1;
    const defaultCtrl1 = {
      x: startPt.x + dx / 3 + nx * bulge,
      y: startPt.y + dy / 3 + ny * bulge,
    };
    const defaultCtrl2 = {
      x: endPt.x - dx / 3 + nx * bulge,
      y: endPt.y - dy / 3 + ny * bulge,
    };
    const ctrl1 = options.startHandle || defaultCtrl1;
    const ctrl2 = options.endHandle || defaultCtrl2;
    return drawCubic(target, startPt, ctrl1, ctrl2, endPt, options);
  }

  function drawNeckCurve(start, end, opts = {}) {
    const startPt = Array.isArray(start) ? { x: start[0], y: start[1] } : start;
    const endPt = Array.isArray(end) ? { x: end[0], y: end[1] } : end;
    const dx = endPt.x - startPt.x;
    const dy = endPt.y - startPt.y;
    const length = Math.hypot(dx, dy);
    let nx = 0;
    let ny = 0;
    if (length > 1e-6) {
      nx = -dy / length;
      ny = dx / length;
    }
    const bulge = Number.isFinite(opts.bulgeCm) ? opts.bulgeCm : 0;
    const targetLayer = opts.layer || patternLayer;
    let ctrl1 = {
      x: startPt.x + dx / 3 + nx * bulge,
      y: startPt.y + dy / 3 + ny * bulge,
    };
    let ctrl2 = {
      x: endPt.x - dx / 3 + nx * bulge,
      y: endPt.y - dy / 3 + ny * bulge,
    };
    if (opts.startHandleOverride) {
      ctrl1 = { ...opts.startHandleOverride };
    } else if (Number.isFinite(opts.handleLengthCm)) {
      const dir = opts.handleDirection ?? 1;
      if (opts.handleSide === "start") {
        ctrl1 = {
          x: startPt.x + dir * opts.handleLengthCm,
          y: startPt.y,
        };
      } else {
        ctrl2 = {
          x: endPt.x + dir * opts.handleLengthCm,
          y: endPt.y,
        };
      }
    }
    if (opts.endHandleOverride) {
      ctrl2 = { ...opts.endHandleOverride };
    }
    if (Number.isFinite(opts.startHandleShiftCm)) {
      ctrl1 = {
        x: ctrl1.x - opts.startHandleShiftCm,
        y: ctrl1.y,
      };
    }
    return drawCubic(targetLayer, startPt, ctrl1, ctrl2, endPt, opts);
  }

  function drawGuide(start, end, opts = {}) {
    return drawSegment(
      opts.back ? guideBackLayer : guideFrontLayer,
      start,
      end,
      {
        color: opts.color || HOFENBITZER_GUIDE_COLOR,
        dashed: opts.dashed,
        name: opts.name,
      }
    );
  }

  function drawBackLine(start, end, opts = {}) {
    return drawSegment(backLayer, start, end, opts);
  }

  function drawCasualLine(start, end, opts = {}) {
    return drawSegment(patternLayer, start, end, opts);
  }

  function drawFrontLine(start, end, opts = {}) {
    return drawSegment(frontLayer, start, end, opts);
  }

  function registerPoint(id, coords, label = id) {
    const point = Array.isArray(coords)
      ? { x: coords[0], y: coords[1] }
      : coords;
    hofPoints[id] = point;
    const svgCoords = toSvgCoords(point);
    if (markersLayer) {
      const circle = document.createElementNS(NS, "circle");
      circle.setAttribute("cx", svgCoords.x);
      circle.setAttribute("cy", svgCoords.y);
      circle.setAttribute("r", cmToMm(HOFENBITZER_MARKER_RADIUS_CM));
      circle.setAttribute("fill", "#0f172a");
      circle.setAttribute("stroke", "#0f172a");
      circle.setAttribute("stroke-width", 0.2);
      markersLayer.appendChild(circle);
    }
    if (numbersLayer && label) {
      const text = textNode(svgCoords.x, svgCoords.y + 1.2, label, {
        "font-size": 3,
        fill: "#ffffff",
        "text-anchor": "middle",
        "font-weight": "600",
      });
      numbersLayer.appendChild(text);
    }
    return point;
  }

  function extendLineToY(start, end, targetY) {
    const dy = end.y - start.y;
    if (Math.abs(dy) < 1e-6) return null;
    const dx = end.x - start.x;
    const t = (targetY - start.y) / dy;
    return {
      x: start.x + dx * t,
      y: targetY,
    };
  }

  function makeVector(a, b) {
    return { x: b.x - a.x, y: b.y - a.y };
  }

  function magnitude(vec) {
    return Math.hypot(vec.x, vec.y);
  }

  function normalizeVec(vec) {
    const len = magnitude(vec);
    if (len < 1e-6) return { x: 0, y: 0 };
    return { x: vec.x / len, y: vec.y / len };
  }

  function addVec(pt, vec) {
    return { x: pt.x + vec.x, y: pt.y + vec.y };
  }

  function scaleVec(vec, scalar) {
    return { x: vec.x * scalar, y: vec.y * scalar };
  }

  function segmentIntersection(p1, p2, p3, p4) {
    if (!p1 || !p2 || !p3 || !p4) return null;
    const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
    if (Math.abs(denom) < 1e-8) return null;
    const det1 = p1.x * p2.y - p1.y * p2.x;
    const det2 = p3.x * p4.y - p3.y * p4.x;
    const x = (det1 * (p3.x - p4.x) - (p1.x - p2.x) * det2) / denom;
    const y = (det1 * (p3.y - p4.y) - (p1.y - p2.y) * det2) / denom;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { x, y };
  }

  const measurementEntries = params?.measurements || {};
  const secondaryEntries = params?.secondary || {};
  let hiGValue = null;
  let hipShortageValue = null;
  let hipSpanBackValue = null;
  let hipSpanFrontValue = null;

  const resolveMeasurementFinal = (id) => {
    const entry = measurementEntries[id];
    if (entry && Number.isFinite(entry.final)) return entry.final;
    const def = HOFENBITZER_MEASUREMENT_LOOKUP[id];
    if (!def) return 0;
    return def.measurementDefault + (def.easeDefault || 0);
  };

  const resolveSecondary = (id, fallback) => {
    const value = secondaryEntries[id];
    return Number.isFinite(value) ? value : fallback;
  };

  const NeG = resolveSecondary("NeG", HOFENBITZER_DEFAULTS.NeG);
  const MoL = resolveSecondary("MoL", HOFENBITZER_DEFAULTS.MoL);
  const HiD = resolveSecondary("HiD", HOFENBITZER_DEFAULTS.HiD);
  const ShA = resolveSecondary("ShA", HOFENBITZER_DEFAULTS.ShA);
  const BrDValue = resolveSecondary("BrD", HOFENBITZER_DEFAULTS.BrD);

  const BLFinal = resolveMeasurementFinal("BL");
  const FLFinal = resolveMeasurementFinal("FL");
  const AhDPlus = resolveMeasurementFinal("AhD");
  const AGPlus = resolveMeasurementFinal("AG");
  const BGPlus = resolveMeasurementFinal("BG");
  const BrGPlus = resolveMeasurementFinal("BrG");
  const ShGFinal = resolveMeasurementFinal("ShG");

  const shoulderDifference = Number.isFinite(params.shoulderDifference)
    ? params.shoulderDifference
    : HOFENBITZER_DEFAULTS.ShoulderDifference;
  const backShoulderEase = Number.isFinite(params.backShoulderEase)
    ? params.backShoulderEase
    : HOFENBITZER_DEFAULTS.BackShoulderEase;
  const frontShoulderAngle = ShA + shoulderDifference;
  const backShoulderAngle = ShA - shoulderDifference;
  const bShS = ShGFinal + backShoulderEase;

  function buildHofenbitzerDraft() {
    const safeValue = (value, fallback = 0) =>
      Number.isFinite(value) ? value : fallback;
    const neckMeasure = safeValue(NeG, HOFENBITZER_DEFAULTS.NeG);

    const point1 = registerPoint("1", { x: 0, y: 0 }, "1");
    const point1aOffset = safeValue(NeG + 0.5, NeG);
    const point1a = registerPoint(
      "1a",
      { x: point1.x - safeValue(point1aOffset, NeG), y: point1.y },
      "1a"
    );
    const point1aExtension = { x: point1a.x - 10, y: point1a.y };
    drawGuide(point1, point1a, { back: true, dashed: true, name: "1-1a" });
    drawGuide(point1a, point1aExtension, {
      back: true,
      dashed: true,
      name: "1a Extension",
    });

    const dist12 = safeValue(NeG / 3 + 1, 0);
    const point2 = registerPoint(
      "2",
      { x: point1.x, y: point1.y + dist12 },
      "2"
    );
    if (point1a && point2) {
      if (backNeckPath && backNeckPath.remove) backNeckPath.remove();
      const backBulge = -Math.max(0.5, (neckMeasure + 0.5) / 3);
      const handleLength = Math.max(
        HOFENBITZER_MIN_HANDLE_LENGTH_CM,
        neckMeasure / 2
      );
      backNeckPath = drawNeckCurve(point1a, point2, {
        layer: backLayer,
        name: "Back Neck Curve",
        bulgeCm: backBulge,
        startHandleOverride: {
          x: point1a.x + 0.6,
          y: point1a.y + handleLength,
        },
        endHandleOverride: { x: point2.x - handleLength, y: point2.y },
      });
    }

    const point3 = registerPoint("3", { x: point2.x, y: point2.y + MoL }, "3");
    const point4 = registerPoint(
      "4",
      { x: point2.x, y: point2.y + AhDPlus },
      "4"
    );
    const point5 = registerPoint(
      "5",
      { x: point2.x, y: point2.y + BLFinal },
      "5"
    );
    const point6 = registerPoint("6", { x: point5.x, y: point5.y + HiD }, "6");
    const point6a = registerPoint(
      "6a",
      { x: point6.x - HOFENBITZER_HIP_LEFT_OFFSET_CM, y: point6.y },
      "6a"
    );

    const hemLineStart = { x: point3.x, y: point3.y };
    const bustLineStart = { x: point4.x, y: point4.y };
    const waistLineStart = { x: point5.x, y: point5.y };
    const hipLineStart = { x: point6.x, y: point6.y };

    if (point6 && point3) {
      drawGuide(point6, point3, { back: true, dashed: true, name: "6-3" });
    }

    const point9 = point4 ? extendLineToY(point2, point6a, point4.y) : null;
    let point7 = point5 ? extendLineToY(point2, point6a, point5.y) : null;
    let point8 = point3 ? extendLineToY(point2, point6a, point3.y) : null;
    const backArmBase = point9 ? registerPoint("9", point9, "9") : null;

    const point10 = backArmBase
      ? registerPoint(
          "10",
          { x: backArmBase.x - safeValue(BGPlus, 0), y: bustLineStart.y },
          "10"
        )
      : null;
    const point11 = point10
      ? registerPoint(
          "11",
          { x: point10.x - safeValue((AGPlus * 2) / 3, 0), y: point10.y },
          "11"
        )
      : null;
    const point12 = point11
      ? registerPoint("12", { x: point11.x - 15, y: point11.y }, "12")
      : null;
    const point13 = point12
      ? registerPoint(
          "13",
          { x: point12.x - safeValue(AGPlus / 3, 0), y: point12.y },
          "13"
        )
      : null;
    const point13a = point13
      ? registerPoint(
          "13a",
          { x: point13.x, y: point13.y - safeValue(AGPlus / 4, 0) },
          "13a"
        )
      : null;
    const point14 = point13
      ? registerPoint(
          "14",
          { x: point13.x - safeValue(BrGPlus, 0), y: point13.y },
          "14"
        )
      : null;

    const drawBasicLine = (start, end, name) => {
      if (start && end) {
        drawGuide(start, end, { name, dashed: false });
      }
    };
    if (point1 && point3) {
      drawGuide(point1, point3, { name: "1-3", dashed: true, back: true });
    }
    drawBasicLine(point3, point4, "3-4");
    drawBasicLine(point4, point5, "4-5");
    drawBasicLine(point5, point6, "5-6");
    drawBasicLine(point6, point6a, "6-6a");
    drawBasicLine(point1, point1a, "1-1a");

    if (point4 && point14 && point2) {
      drawGuide(
        { x: point2.x, y: point4.y },
        { x: point14.x, y: point4.y },
        { name: "Bust Line", dashed: true }
      );
    }
    if (point5 && point14 && point2) {
      drawGuide(
        { x: point2.x, y: point5.y },
        { x: point14.x, y: point5.y },
        { name: "Waist Line", dashed: true }
      );
    }

    let frontShoulderEnd = null;
    let backShoulderEnd = null;
    let point16 = null;
    if (bShS > 0 && point1a) {
      const frontShoulderRadians = (frontShoulderAngle * Math.PI) / 180;
      frontShoulderEnd = {
        x: point1a.x - Math.cos(frontShoulderRadians) * bShS,
        y: point1a.y + Math.sin(frontShoulderRadians) * bShS,
      };
      const backShoulderRadians = (backShoulderAngle * Math.PI) / 180;
      const dirX = -Math.cos(backShoulderRadians);
      const dirY = Math.sin(backShoulderRadians);
      let tIntersect = null;
      if (Math.abs(dirX) > 0.0001 && point10) {
        const candidateT = (point10.x - point1a.x) / dirX;
        if (candidateT >= 0) tIntersect = candidateT;
      } else if (point10 && Math.abs(point10.x - point1a.x) < 0.0001) {
        tIntersect = 0;
      }
      let effectiveLength = bShS;
      if (tIntersect !== null && tIntersect > effectiveLength)
        effectiveLength = tIntersect;
      backShoulderEnd = {
        x: point1a.x + dirX * effectiveLength,
        y: point1a.y + dirY * effectiveLength,
      };
      if (tIntersect !== null && point10) {
        point16 = registerPoint(
          "16",
          { x: point10.x, y: point1a.y + dirY * tIntersect },
          "16"
        );
      }
      drawBackLine(point1a, backShoulderEnd, { name: "Back Shoulder Line" });
    }

    let point17 = null;
    let point17a = null;
    let point18 = null;
    if (point16 && point10) {
      const midpoint1610 = {
        x: (point16.x + point10.x) / 2,
        y: (point16.y + point10.y) / 2,
      };
      point17 = registerPoint(
        "17",
        { x: midpoint1610.x - 1, y: midpoint1610.y },
        "17"
      );
      const shoulderBladeEnd = { x: point2.x, y: point17.y };
      drawGuide(point17, shoulderBladeEnd, {
        back: true,
        dashed: true,
        name: "Shoulder Blade Line",
      });

      const midpoint1710 = {
        x: (point17.x + point10.x) / 2,
        y: (point17.y + point10.y) / 2,
      };
      point17a = registerPoint(
        "17a",
        { x: midpoint1710.x - 1.5, y: midpoint1710.y },
        "17a"
      );
      point18 = registerPoint(
        "18",
        { x: point13 ? point13.x : midpoint1710.x, y: point17a.y },
        "18"
      );
      drawGuide(point17a, point18, {
        back: true,
        dashed: true,
        name: "17a-18",
      });
    }

    let point25 = null;
    let backDiagVec = null;
    if (point11 && point6a && point2) {
      backDiagVec = {
        x: point6a.x - point2.x,
        y: point6a.y - point2.y,
      };
      if (
        Math.abs(backDiagVec.x) > 0.0001 ||
        Math.abs(backDiagVec.y) > 0.0001
      ) {
        const refPoint25 = {
          x: point11.x + backDiagVec.x,
          y: point11.y + backDiagVec.y,
        };
        point25 = extendLineToY(point11, refPoint25, hemLineStart.y);
      }
    }
    if (point25) {
      registerPoint("25", point25, "25");
      drawGuide(point11, point25, {
        dashed: true,
        name: "Back Side Straightening",
        back: true,
      });
    }

    const point26 = point11
      ? registerPoint("26", { x: point11.x, y: hipLineStart.y }, "26")
      : null;
    const point27 = point12
      ? registerPoint("27", { x: point12.x, y: hipLineStart.y }, "27")
      : null;
    let point28 = null;
    if (backDiagVec && point11) {
      const refPoint28 = {
        x: point11.x + backDiagVec.x,
        y: point11.y + backDiagVec.y,
      };
      point28 = extendLineToY(point11, refPoint28, hipLineStart.y);
    } else if (point11) {
      point28 = { x: point11.x, y: hipLineStart.y };
    }
    if (point28) registerPoint("28", point28, "28");

    const point19a = point14
      ? registerPoint("19a", { x: point14.x, y: hipLineStart.y }, "19a")
      : null;
    const point19 = point14
      ? registerPoint("19", { x: point14.x, y: waistLineStart.y }, "19")
      : null;

    const hipSpanBack =
      point6a && point26 ? distanceBetween(point6a, point26) : null;
    const hipSpanFront =
      point19a && point27 ? distanceBetween(point19a, point27) : null;
    hipSpanBackValue = hipSpanBack;
    hipSpanFrontValue = hipSpanFront;
    const halfHiW = resolveMeasurementFinal("HiC") / 2;
    const hiG =
      Number.isFinite(hipSpanBack) && Number.isFinite(hipSpanFront)
        ? hipSpanBack + hipSpanFront
        : null;
    let halfHipShortage = null;
    let halfHipShortageMagnitude = null;
    if (Number.isFinite(hiG) && Number.isFinite(halfHiW)) {
      const hipShortage = hiG - halfHiW;
      halfHipShortage = hipShortage / 2;
      halfHipShortageMagnitude = Math.abs(halfHipShortage);
      hiGValue = hiG;
      hipShortageValue = hipShortage;
      updateHofenbitzerDerivedOutputs({
        hiG,
        hipShortage,
        hipSpanBack,
        hipSpanFront,
      });
    } else {
      hiGValue = null;
      hipShortageValue = null;
      updateHofenbitzerDerivedOutputs({
        hiG: null,
        hipShortage: null,
        hipSpanBack,
        hipSpanFront,
      });
    }
    if (!Number.isFinite(halfHipShortageMagnitude)) {
      halfHipShortageMagnitude = 0;
    }
    const shortageMagnitude = Number.isFinite(halfHipShortage)
      ? Math.abs(halfHipShortage)
      : halfHipShortageMagnitude || 0;
    const frontReference = point14 ?? point27;
    const backReference = point11 ?? point28;
    const frontDirection = frontReference
      ? Math.sign((point27?.x ?? 0) - frontReference.x) || -1
      : -1;
    const backDirection = backReference
      ? Math.sign((point28?.x ?? 0) - backReference.x) || 1
      : 1;
    const frontShift = frontDirection * shortageMagnitude;
    const backShift = backDirection * shortageMagnitude;

    const point29 = point27
      ? registerPoint(
          "29",
          { x: point27.x + frontShift, y: hipLineStart.y },
          "29"
        )
      : null;
    const point30 = point28
      ? registerPoint(
          "30",
          { x: point28.x + backShift, y: hipLineStart.y },
          "30"
        )
      : null;

    const topLineY = point1.y;
    const bustLineY = bustLineStart.y;
    const waistLineY = waistLineStart.y;
    const hipLineY = hipLineStart.y;
    const hemLineY = hemLineStart.y;
    const hemEnd = point14
      ? { x: point14.x, y: hemLineY }
      : { x: point6.x, y: hemLineY };
    const bustEnd = point14 ? { x: point14.x, y: bustLineY } : null;
    const waistEnd = point14 ? { x: point14.x, y: waistLineY } : null;
    const hipEnd = point14 ? { x: point14.x, y: hipLineY } : null;

    const perpendicularFootOnBackDiagonal = (sourcePoint) => {
      if (!sourcePoint || !point2 || !point6a) return null;
      const diagX = point6a.x - point2.x;
      const diagY = point6a.y - point2.y;
      const diagLenSq = diagX * diagX + diagY * diagY;
      if (diagLenSq < 1e-6) return null;
      const tDiag =
        ((sourcePoint.x - point2.x) * diagX +
          (sourcePoint.y - point2.y) * diagY) /
        diagLenSq;
      return {
        x: point2.x + diagX * tDiag,
        y: point2.y + diagY * tDiag,
      };
    };

    let hipLinePoint6a = null;
    let hemConnectorEnd = null;
    let waistConnectorEnd = null;
    if (point30 && point11) {
      const point30Hem = extendLineToY(point11, point30, hemLineY);
      if (point30Hem) {
        drawBackLine(point11, point30Hem, { name: "Back Side Line 1" });
      }
      const point30Waist = Number.isFinite(waistLineY)
        ? extendLineToY(point11, point30, waistLineY)
        : null;
      hipLinePoint6a = perpendicularFootOnBackDiagonal(point30);
      if (!hipLinePoint6a && point6a) {
        hipLinePoint6a = { x: point6a.x, y: hipLineY };
      } else if (!hipLinePoint6a) {
        hipLinePoint6a = { x: point30.x, y: hipLineY };
      }
      if (hipLinePoint6a) {
        drawFrontLine(point30, hipLinePoint6a, {
          name: "Back Hip Line",
          dashed: true,
        });
      }
      if (point30Hem) {
        hemConnectorEnd = perpendicularFootOnBackDiagonal(point30Hem);
        if (hemConnectorEnd) {
          drawBackLine(point30Hem, hemConnectorEnd, { name: "Back Hem Line" });
        }
      }
      if (point30Waist) {
        waistConnectorEnd = perpendicularFootOnBackDiagonal(point30Waist);
        if (waistConnectorEnd) {
          drawFrontLine(point30Waist, waistConnectorEnd, {
            name: "Back Waist Line",
            dashed: true,
          });
        }
      }
    }
    if (hemConnectorEnd) {
      point8 = hemConnectorEnd;
    }

    if (point7) registerPoint("7", point7, "7");
    if (point8) registerPoint("8", point8, "8");

    const point20Offset = safeValue(FLFinal - 1, 0);
    const point20 = point19
      ? registerPoint(
          "20",
          { x: point19.x, y: point19.y - point20Offset },
          "20"
        )
      : null;
    const point20a = point20
      ? registerPoint(
          "20a",
          { x: point20.x + safeValue(NeG, 0), y: point20.y },
          "20a"
        )
      : null;
    const point23 = point20
      ? registerPoint(
          "23",
          { x: point20.x, y: point20.y + safeValue(NeG + 0.5, NeG) },
          "23"
        )
      : null;
    if (point20a && point23) {
      if (frontNeckPath && frontNeckPath.remove) frontNeckPath.remove();
      const frontBulge = -Math.max(
        HOFENBITZER_MIN_HANDLE_LENGTH_CM,
        neckMeasure / 2
      );
      const handleLength = Math.max(
        HOFENBITZER_MIN_HANDLE_LENGTH_CM,
        neckMeasure / 2
      );
      frontNeckPath = drawNeckCurve(point20a, point23, {
        layer: frontLayer,
        name: "Front Neck Curve",
        bulgeCm: frontBulge,
        handleSide: "end",
        handleDirection: 1,
        handleLengthCm: handleLength,
        startHandleShiftCm: 0.4,
      });
      if (point20) {
        drawSegment(guideLayer, point20, point23, {
          dashed: true,
          name: "20-23 Guide",
          color: HOFENBITZER_GUIDE_COLOR,
        });
      }
    }

    const point24 = point20a
      ? registerPoint(
          "24",
          {
            x:
              point20a.x +
              Math.cos((frontShoulderAngle * Math.PI) / 180) *
                safeValue(ShGFinal, 0),
            y:
              point20a.y +
              Math.sin((frontShoulderAngle * Math.PI) / 180) *
                safeValue(ShGFinal, 0),
          },
          "24"
        )
      : null;
    if (point20a && point24) {
      drawFrontLine(point20a, point24, { name: "Front Shoulder Line" });
    }

    const point21 = point20
      ? registerPoint(
          "21",
          { x: point20.x, y: point20.y + safeValue(BrDValue - 1, 0) },
          "21"
        )
      : null;
    const dartOffset = safeValue(BrGPlus / 2 - 0.3, 0);
    const point22 = point21
      ? registerPoint("22", { x: point21.x + dartOffset, y: point21.y }, "22")
      : null;
    if (point2 && point6) {
      drawGuide(point2, point6, { back: true, name: "Centre Back" });
    }
    if (point14 && hipLineStart) {
      drawFrontLine(
        point14,
        { x: point14.x, y: hipLineStart.y },
        { name: "Centre Front" }
      );
    }

    if (hemLineStart && point14) {
      drawSegment(
        guideLayer,
        { x: point6a ? point6a.x : point6.x, y: hipLineStart.y },
        point19a || point14,
        {
          dashed: true,
          name: "Hem Line",
          color: HOFENBITZER_GUIDE_COLOR,
        }
      );
    }

    const drawFrontArmholeCurve = () => {
      if (!point24 || !point12 || !point13a || !point14) return;
      const shoulderTip = point24;
      const bustPoint = point12;
      const guidePoint = point13a;
      const shoulderBase = point20a || shoulderTip;
      const dir1214 = vectorBetween(bustPoint, point14);
      const dir1214Len = vectorMagnitude(dir1214);
      if (dir1214Len < 1e-6) return;
      const dir1214Norm = normalizeVector(dir1214);
      const shoulderVector = vectorBetween(shoulderBase, shoulderTip);
      const bustVector = vectorBetween(shoulderTip, bustPoint);
      let perp = { x: -shoulderVector.y, y: shoulderVector.x };
      if (vectorMagnitude(perp) < 1e-6) {
        perp = { x: -bustVector.y, y: bustVector.x };
      }
      const toGuide = vectorBetween(shoulderTip, guidePoint || shoulderTip);
      if (perp.x * toGuide.x + perp.y * toGuide.y < 0) {
        perp = scaleVector(perp, -1);
      }
      perp = normalizeVector(perp);
      const shoulderHandleLen = Math.max(
        vectorMagnitude(bustVector) * 0.45,
        1.2
      );
      const shoulderHandle = scaleVector(perp, shoulderHandleLen);
      let handleLen = Math.max(dir1214Len * 0.5, 0.5);
      let tSolve = 0.5;
      const p0 = shoulderTip;
      const p3 = bustPoint;
      const ctrlStart = addVector(p0, shoulderHandle);
      const guide = guidePoint || bustPoint;
      for (let iter = 0; iter < 25; iter += 1) {
        const ctrlEndCandidate = addVector(
          p3,
          scaleVector(dir1214Norm, handleLen)
        );
        const current = bezierPointCoords(
          p0,
          ctrlStart,
          ctrlEndCandidate,
          p3,
          tSolve
        );
        const diff = { x: current.x - guide.x, y: current.y - guide.y };
        if (Math.abs(diff.x) < 0.0005 && Math.abs(diff.y) < 0.0005) break;
        const dBdt = bezierDerivativeVector(
          p0,
          ctrlStart,
          ctrlEndCandidate,
          p3,
          tSolve
        );
        const coeff = 3 * (1 - tSolve) * tSolve * tSolve;
        const dBdL = scaleVector(dir1214Norm, coeff);
        const det = dBdt.x * dBdL.y - dBdt.y * dBdL.x;
        if (Math.abs(det) < 1e-6) break;
        const deltaT = (-diff.x * dBdL.y + dBdL.x * diff.y) / det;
        const deltaL = (-dBdt.x * diff.y + dBdt.y * diff.x) / det;
        tSolve = Math.min(Math.max(tSolve + deltaT, 0.05), 0.95);
        handleLen = Math.max(handleLen + deltaL, 0.05);
      }
      const ctrlEnd = addVector(p3, scaleVector(dir1214Norm, handleLen));
      drawCubic(frontLayer, p0, ctrlStart, ctrlEnd, p3, {
        name: "Front Armhole Curve",
      });
    };

    const drawBackArmholeCurve = () => {
      if (!backShoulderEnd || !point17 || !point17a || !point11 || !point4)
        return;
      const startAnchor = backShoulderEnd;
      const midAnchor = point17;
      const guidePoint = point17a;
      const endAnchor = point11;
      const guideLinePoint = point4;
      const startToMid = vectorBetween(startAnchor, midAnchor);
      const startLen = vectorMagnitude(startToMid);
      if (startLen < 1e-6) return;
      const startDir = normalizeVector(startToMid);
      let startHandleLen = Math.min(startLen * 0.35, 5);
      if (startHandleLen < 0.5) startHandleLen = 0.5;
      const startHandle = addVector(
        startAnchor,
        scaleVector(startDir, startHandleLen)
      );
      let verticalDrop = guidePoint ? Math.abs(guidePoint.y - midAnchor.y) : 5;
      if (verticalDrop < 0.5) verticalDrop = 0.5;
      const midDown = { x: midAnchor.x, y: midAnchor.y + verticalDrop };
      const midOutgoingHandle = guidePoint
        ? { x: guidePoint.x + 1, y: guidePoint.y }
        : midDown;
      const midIncomingHandle = {
        x: midAnchor.x - (midOutgoingHandle.x - midAnchor.x),
        y: midAnchor.y - (midOutgoingHandle.y - midAnchor.y),
      };
      let lineDir = vectorBetween(endAnchor, guideLinePoint);
      if (vectorMagnitude(lineDir) < 1e-6) {
        lineDir = vectorBetween(endAnchor, midAnchor);
      }
      lineDir = normalizeVector(lineDir);
      let handleLenEnd = vectorMagnitude(
        vectorBetween(endAnchor, guidePoint || endAnchor)
      );
      if (handleLenEnd < 0.5) handleLenEnd = 0.5;
      let tSolve = 0.5;
      const p0 = midAnchor;
      const p1 = midOutgoingHandle;
      const p3 = endAnchor;
      for (let iter = 0; iter < 30; iter += 1) {
        const p2 = addVector(p3, scaleVector(lineDir, handleLenEnd));
        const target = guidePoint || midAnchor;
        const current = bezierPointCoords(p0, p1, p2, p3, tSolve);
        const diff = { x: current.x - target.x, y: current.y - target.y };
        if (Math.abs(diff.x) < 0.0003 && Math.abs(diff.y) < 0.0003) break;
        const dBdt = bezierDerivativeVector(p0, p1, p2, p3, tSolve);
        const coeff = 3 * (1 - tSolve) * tSolve * tSolve;
        const dBdL = scaleVector(lineDir, coeff);
        const det = dBdt.x * dBdL.y - dBdt.y * dBdL.x;
        if (Math.abs(det) < 1e-8) break;
        const deltaT = (-diff.x * dBdL.y + dBdL.x * diff.y) / det;
        const deltaL = (-dBdt.x * diff.y + dBdt.y * diff.x) / det;
        tSolve = Math.min(Math.max(tSolve + deltaT, 0.05), 0.95);
        handleLenEnd = Math.max(handleLenEnd + deltaL, 0.05);
      }
      const endLeftHandle = addVector(
        endAnchor,
        scaleVector(lineDir, handleLenEnd)
      );
      const startSvg = toSvgCoords(startAnchor);
      const midSvg = toSvgCoords(midAnchor);
      const endSvg = toSvgCoords(endAnchor);
      const startHandleSvg = toSvgCoords(startHandle);
      const midIncomingSvg = toSvgCoords(midIncomingHandle);
      const midOutgoingSvg = toSvgCoords(midOutgoingHandle);
      const endHandleSvg = toSvgCoords(endLeftHandle);
      const d = [
        `M ${startSvg.x} ${startSvg.y}`,
        `C ${startHandleSvg.x} ${startHandleSvg.y} ${midIncomingSvg.x} ${midIncomingSvg.y} ${midSvg.x} ${midSvg.y}`,
        `C ${midOutgoingSvg.x} ${midOutgoingSvg.y} ${endHandleSvg.x} ${endHandleSvg.y} ${endSvg.x} ${endSvg.y}`,
      ].join(" ");
      const attrs = {
        fill: "none",
        stroke: HOFENBITZER_FRAME_COLOR,
        "stroke-width": 0.6,
      };
      const curvePath = path(d, attrs);
      curvePath.setAttribute("data-name", "Back Armhole Curve");
      backLayer.appendChild(curvePath);
    };

    drawFrontArmholeCurve();
    drawBackArmholeCurve();

    if (point11 && point26) {
      drawGuide(point11, point26, { name: "Back Side Seam", back: true });
    }

    const point29Hem =
      point29 && point12 ? extendLineToY(point12, point29, hemLineY) : null;
    if (point29Hem && point12) {
      drawFrontLine(point12, point29Hem, { name: "New Front Side Line" });
    }

    if (point20) {
      const point20GuideLength = 20;
      const point20Guide = { x: point20.x + point20GuideLength, y: point20.y };
      drawGuide(point20, point20Guide, { dashed: true, name: "20 Guideline" });
    }

    if (point21 && point22) {
      drawGuide(point21, point22, { dashed: true, name: "Bust Distance" });
    }

    let frontDartTop = null;
    let frontDartBottom = null;
    let frontDartPath = null;
    if (point22) {
      let frontDartTopY = point20 ? point20.y : point22.y;
      if (point24 && point20a) {
        const shoulderDX = point24.x - point20a.x;
        if (Math.abs(shoulderDX) > 0.0001) {
          const tIntersectDart = (point22.x - point20a.x) / shoulderDX;
          if (tIntersectDart >= 0 && tIntersectDart <= 1) {
            frontDartTopY =
              point20a.y + (point24.y - point20a.y) * tIntersectDart;
          }
        } else if (Math.abs(point22.x - point20a.x) < 0.0001) {
          const minShoulderY = Math.min(point20a.y, point24.y);
          const maxShoulderY = Math.max(point20a.y, point24.y);
          if (frontDartTopY < minShoulderY) frontDartTopY = minShoulderY;
          if (frontDartTopY > maxShoulderY) frontDartTopY = maxShoulderY;
        }
      }
      frontDartTop = { x: point22.x, y: frontDartTopY };
      frontDartBottom = { x: point22.x, y: hemLineY };
      frontDartPath = drawGuide(frontDartTop, frontDartBottom, {
        name: "Front Dart Line",
        dashed: true,
      });
    }

    const centreBackStart = { x: point2.x, y: point2.y };
    const centreBackMid = point7 ? { x: point7.x, y: point7.y } : null;
    const centreBackEnd = point8
      ? { x: point8.x, y: point8.y }
      : { x: point2.x, y: hemLineY };
    if (centreBackMid) {
      drawBackLine(centreBackStart, centreBackMid, {
        name: "Centre Back (CB)",
      });
      drawBackLine(centreBackMid, centreBackEnd, { name: "Centre Back (CB)" });
    } else {
      drawBackLine(centreBackStart, centreBackEnd, {
        name: "Centre Back (CB)",
      });
    }
    if (point17 && point2) {
      const cbStart = { x: point2.x, y: point2.y };
      const cbEnd = point8
        ? { x: point8.x, y: point8.y }
        : point7
        ? { x: point7.x, y: point7.y }
        : { x: point2.x, y: hemLineY };
      const shoulderRayEnd = { x: point2.x, y: point17.y };
      const cbIntersection =
        segmentIntersection(point17, shoulderRayEnd, cbStart, cbEnd) ||
        shoulderRayEnd;
      drawGuide(point17, cbIntersection, {
        name: "17-Centre Back",
        dashed: true,
        back: true,
      });
    }

    if (point10) {
      const backArmLineTopY = point16 ? point16.y : topLineY;
      const backArmLineStart = { x: point10.x, y: backArmLineTopY };
      const backArmLineEnd = { x: point10.x, y: hipLineY };
      drawGuide(backArmLineStart, backArmLineEnd, {
        name: "Back Arm Line",
        dashed: true,
        back: true,
      });
    }
    if (point11) {
      drawGuide(
        { x: point11.x, y: point10 ? point10.y : bustLineY },
        { x: point11.x, y: hemLineY },
        { name: "Back Side Line 2", back: true }
      );
    }
    let frontSideLinePath = null;
    if (point12) {
      frontSideLinePath = drawGuide(
        { x: point12.x, y: point12.y },
        { x: point12.x, y: hemLineY },
        {
          name: "Front Side Line",
          dashed: true,
        }
      );
    }

    if (point13) {
      const frontArmLineTopY = Math.min(topLineY + 8, waistLineY);
      drawGuide(
        { x: point13.x, y: frontArmLineTopY },
        { x: point13.x, y: waistLineY },
        {
          name: "Front Arm Line",
          dashed: true,
        }
      );
    }

    let centreFrontPath = null;
    if (point14) {
      centreFrontPath = drawFrontLine(
        { x: point14.x, y: point20 ? point20.y : topLineY },
        { x: point14.x, y: hemLineY },
        {
          name: "Centre Front (CF)",
        }
      );
    }

    const frontSideBottom = point29Hem
      ? { x: point29Hem.x, y: point29Hem.y }
      : point12
      ? { x: point12.x, y: hemLineY }
      : point14
      ? { x: point14.x, y: hemLineY }
      : null;
    if (point14 && frontSideBottom) {
      const cfBottom = { x: point14.x, y: hemLineY };
      drawFrontLine(cfBottom, frontSideBottom, { name: "Front Hem Line" });
    }
    if (point14 && point12) {
      drawFrontLine(point14, point12, { name: "14-12", dashed: true });
    }
    drawSegment(guideLayer, hemLineStart, hemEnd, {
      name: "Hem Line",
      dashed: true,
      color: HOFENBITZER_GUIDE_COLOR,
    });

    const frontBustEnd = point12 ? { x: point12.x, y: bustLineY } : bustEnd;
    const frontBustLinePath = frontBustEnd
      ? drawGuide(bustLineStart, frontBustEnd, {
          name: "Front Bust Line",
          dashed: true,
        })
      : null;

    const frontWaistLineStart = point19
      ? { x: point19.x, y: waistLineY }
      : waistLineStart;
    const frontWaistEndPoint = point12
      ? extendLineToY(point12, point29 ? point29 : point12, waistLineY)
      : frontWaistLineStart;
    const frontWaistLinePath =
      frontWaistLineStart && frontWaistEndPoint
        ? drawGuide(frontWaistLineStart, frontWaistEndPoint, {
            name: "Front Waist Line",
            dashed: true,
          })
        : null;
    if (point19 && frontWaistEndPoint) {
      drawFrontLine(point19, frontWaistEndPoint, {
        name: "19-Front Side Waist",
        dashed: true,
      });
    }

    const frontHipEnd = point29 ? { x: point29.x, y: hipLineY } : hipEnd;
    const frontHipLinePath = frontHipEnd
      ? drawGuide(hipLineStart, frontHipEnd, {
          name: "Front Hip Line",
          dashed: true,
        })
      : null;
    if (point19a && point29) {
      drawFrontLine(point19a, point29, {
        name: "19a-29 Hip Span",
        dashed: true,
      });
    }

    const backBustStart =
      point11 && point30 ? extendLineToY(point11, point30, bustLineY) : null;
    const backBustLinePath =
      backBustStart && point9
        ? drawGuide(
            backBustStart,
            { x: point9.x, y: point9.y },
            { name: "Back Bust Line", dashed: true, back: true }
          )
        : null;
    if (point11 && point9) {
      drawBackLine(
        point11,
        { x: point9.x, y: point9.y },
        { name: "11-9", dashed: true }
      );
    }

    if (frontBustLinePath && point12) {
      trimHorizontalSegmentRightOf(frontBustLinePath, {
        x: point12.x,
        y: bustLineY,
      });
    }
    if (frontHipLinePath && point29) {
      trimHorizontalSegmentRightOf(frontHipLinePath, {
        x: point29.x,
        y: hipLineY,
      });
    }
    if (centreFrontPath && point23) {
      setSegmentBetween(centreFrontPath, point23, {
        x: point14.x,
        y: hemLineY,
      });
    }
    if (backBustLinePath && point9) {
      setSegmentBetween(backBustLinePath, backBustStart, {
        x: point9.x,
        y: point9.y,
      });
    }
  }

  buildHofenbitzerDraft();

  const measurementSummary = Object.keys(measurementEntries).reduce(
    (acc, key) => {
      const entry = measurementEntries[key];
      acc[key] = {
        measurement: entry?.measurement ?? null,
        ease: entry?.ease ?? null,
        final: entry?.final ?? null,
      };
      return acc;
    },
    {}
  );

  const secondarySummary = { ...secondaryEntries };

  const hofenbitzerShared = {
    points: { ...hofPoints },
    measurements: measurementSummary,
    secondary: secondarySummary,
    derived: {
      hiG: hiGValue,
      hipShortage: hipShortageValue,
      hipSpanBack: hipSpanBackValue,
      hipSpanFront: hipSpanFrontValue,
      halfHiW: resolveMeasurementFinal("HiC") / 2,
    },
    params,
  };

  if (typeof window !== "undefined") {
    window.hofenbitzerCasualDraft = hofenbitzerShared;
  }

  applyLayerVisibility(layers, params);
  fitSvgToBounds(svg, bounds);
  return svg;
}

function generateHofenbitzerWideBasicSleeve(params = {}) {
  const svg = createSvgRoot();
  svg.appendChild(
    Object.assign(document.createElementNS(NS, "metadata"), {
      textContent: JSON.stringify({
        tool: "HofenbitzerWideBasicSleeveWeb",
        units: "cm",
        source: "Hofenbitzer/Sleeve/wide_basic_sleeve.jsx",
      }),
    })
  );

  const layers = createHofSleeveLayerStack(svg);
  const bounds = createBounds();
  const origin = { x: PAGE_MARGIN_MM * 2.5, y: PAGE_MARGIN_MM * 2.5 };
  const cmToMm = (value) => value * CM_TO_MM;
  const dashValue = HOF_SLEEVE_DASH;
  const derived = computeHofenbitzerSleeveDerived(params);
  const baselineLengthCm = Math.max(
    (derived.SlW || 0) + (derived.CapLineEase || 0),
    0
  );
  derived.CapLineCm = baselineLengthCm;
  if (!hofSleeveUi.lastMeasured) hofSleeveUi.lastMeasured = {};
  hofSleeveUi.lastMeasured.CapLineCm = baselineLengthCm;

  function toSvgCoords(pt) {
    const mapped = {
      x: origin.x + (pt[0] || 0) * CM_TO_MM,
      y: origin.y - (pt[1] || 0) * CM_TO_MM,
    };
    bounds.include(mapped.x, mapped.y);
    return mapped;
  }

  function drawLineCm(target, start, end, opts = {}) {
    if (!target || !start || !end) return null;
    const s = toSvgCoords(start);
    const e = toSvgCoords(end);
    const attrs = {
      fill: "none",
      stroke: opts.color || "#111111",
      "stroke-width": opts.width || 0.6,
      "stroke-linecap": "butt",
    };
    if (opts.dashed) {
      attrs["stroke-dasharray"] = opts.dash || dashValue;
    }
    if (opts.name) {
      attrs["data-name"] = opts.name;
    }
    const lineEl = path(`M ${s.x} ${s.y} L ${e.x} ${e.y}`, attrs);
    target.appendChild(lineEl);
    if (opts.labelLayer && opts.labelText) {
      addLineLabel(
        opts.labelLayer,
        start,
        end,
        opts.labelText,
        opts.labelOffsetCm,
        opts.labelSide
      );
    }
    return lineEl;
  }

  function drawCurveCm(target, start, startHandle, endHandle, end, opts = {}) {
    if (!target || !start || !end) return null;
    const s = toSvgCoords(start);
    const c1 = toSvgCoords(startHandle || start);
    const c2 = toSvgCoords(endHandle || end);
    const e = toSvgCoords(end);
    const attrs = {
      fill: "none",
      stroke: opts.color || "#111111",
      "stroke-width": opts.width || 0.6,
      "stroke-linecap": "butt",
    };
    if (opts.dashed) {
      attrs["stroke-dasharray"] = opts.dash || dashValue;
    }
    if (opts.name) {
      attrs["data-name"] = opts.name;
    }
    const curveEl = path(
      `M ${s.x} ${s.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${e.x} ${e.y}`,
      attrs
    );
    target.appendChild(curveEl);
    if (opts.labelLayer && opts.labelText) {
      addLineLabel(
        opts.labelLayer,
        start,
        end,
        opts.labelText,
        opts.labelOffsetCm,
        opts.labelSide
      );
    }
    return curveEl;
  }

  function addLineLabel(
    targetLayer,
    start,
    end,
    text,
    offsetCm = HOF_SLEEVE_LABEL_OFFSET_CM,
    side = 1
  ) {
    if (!targetLayer || !start || !end || !text) return;
    const startSvg = toSvgCoords(start);
    const endSvg = toSvgCoords(end);
    const dx = endSvg.x - startSvg.x;
    const dy = endSvg.y - startSvg.y;
    const length = Math.hypot(dx, dy) || 1;
    const mid = {
      x: (startSvg.x + endSvg.x) / 2,
      y: (startSvg.y + endSvg.y) / 2,
    };
    const normal = {
      x: (-dy / length) * offsetCm * CM_TO_MM * side,
      y: (dx / length) * offsetCm * CM_TO_MM * side,
    };
    const labelPoint = { x: mid.x + normal.x, y: mid.y + normal.y };
    const textEl = textNode(labelPoint.x, labelPoint.y, text, {
      "font-size": 3.2,
      fill: "#0f172a",
      "font-weight": "600",
      "text-anchor": "middle",
    });
    let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angleDeg < -90) {
      angleDeg += 180;
    } else if (angleDeg > 90) {
      angleDeg -= 180;
    }
    textEl.setAttribute(
      "transform",
      `rotate(${angleDeg}, ${labelPoint.x}, ${labelPoint.y})`
    );
    targetLayer.appendChild(textEl);
    bounds.include(labelPoint.x, labelPoint.y);
  }

  function placeMarker(point, label) {
    if (!layers.markers || !point) return;
    const svgPoint = toSvgCoords(point);
    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("cx", svgPoint.x);
    circle.setAttribute("cy", svgPoint.y);
    circle.setAttribute("r", cmToMm(HOFENBITZER_MARKER_RADIUS_CM));
    circle.setAttribute("fill", "#000");
    circle.setAttribute("stroke", "#000");
    layers.markers.appendChild(circle);
    if (layers.numbers && (label || label === 0)) {
      const numberNode = textNode(svgPoint.x, svgPoint.y + 1, String(label), {
        "font-size": 3,
        fill: "#ffffff",
        "text-anchor": "middle",
        "font-weight": "600",
      });
      layers.numbers.appendChild(numberNode);
    }
  }

  function drawDashedLine(target, start, end, opts = {}) {
    return drawLineCm(target, start, end, { ...opts, dashed: true });
  }

  function drawSolidLine(target, start, end, opts = {}) {
    return drawLineCm(target, start, end, { ...opts, dashed: false });
  }

  function drawArcPath(targetLayer, arcInfo) {
    if (!targetLayer || !arcInfo || !arcInfo.startPoint || !arcInfo.endPoint)
      return null;
    return drawCurveCm(
      targetLayer,
      arcInfo.startPoint,
      arcInfo.startHandle || arcInfo.startPoint,
      arcInfo.endHandle || arcInfo.endPoint,
      arcInfo.endPoint,
      { name: "Arc" }
    );
  }

  function drawBezierSegment(
    targetLayer,
    start,
    end,
    startHandle,
    endHandle,
    name
  ) {
    return drawCurveCm(targetLayer, start, startHandle, endHandle, end, {
      name,
      dashed: false,
    });
  }

  function drawBezierChain(targetLayer, nodes, name) {
    if (!targetLayer || !nodes || nodes.length < 2) return null;
    const commands = [];
    const first = nodes[0] || {};
    const start = first.anchor || first;
    const startSvg = toSvgCoords(start);
    commands.push(`M ${startSvg.x} ${startSvg.y}`);
    for (let i = 1; i < nodes.length; i += 1) {
      const prev = nodes[i - 1] || {};
      const curr = nodes[i] || {};
      const p0 = prev.anchor || prev;
      const c1 = prev.right || p0;
      const c2 = curr.left || curr.anchor || curr;
      const p3 = curr.anchor || curr;
      const c1Svg = toSvgCoords(c1);
      const c2Svg = toSvgCoords(c2);
      const endSvg = toSvgCoords(p3);
      commands.push(
        `C ${c1Svg.x} ${c1Svg.y} ${c2Svg.x} ${c2Svg.y} ${endSvg.x} ${endSvg.y}`
      );
    }
    const pathEl = path(commands.join(" "), {
      fill: "none",
      stroke: "#111111",
      "stroke-width": 0.6,
      "stroke-linecap": "butt",
    });
    if (name) pathEl.setAttribute("data-name", name);
    targetLayer.appendChild(pathEl);
    return pathEl;
  }

  function pointDistanceCm(ptA, ptB) {
    if (!ptA || !ptB) return null;
    const dx = ptA[0] - ptB[0];
    const dy = ptA[1] - ptB[1];
    const dist = Math.sqrt(dx * dx + dy * dy);
    return Number.isFinite(dist) ? dist : null;
  }

  function midpoint(a, b) {
    if (!a || !b) return null;
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }

  function normalizeVector(vec) {
    if (!vec) return [1, 0];
    const len = Math.hypot(vec[0], vec[1]);
    if (!Number.isFinite(len) || len === 0) return [1, 0];
    return [vec[0] / len, vec[1] / len];
  }

  function ensureRightFacing(vec) {
    if (!vec) return [1, 0];
    if (vec[0] < 0 || (Math.abs(vec[0]) < 0.00001 && vec[1] < 0)) {
      return [-vec[0], -vec[1]];
    }
    return vec;
  }

  function buildLineLabelOptions(name, lengthCm, labelsLayer) {
    if (!labelsLayer) return { name };
    const value =
      Number.isFinite(lengthCm) && lengthCm > 0
        ? formatHofenbitzerValue(lengthCm)
        : "-";
    return {
      name,
      labelLayer: labelsLayer,
      labelText: `${name} (${value} cm)`,
      labelOffsetCm: HOF_SLEEVE_LABEL_OFFSET_CM,
    };
  }

  function addNotchOnPath(
    startPt,
    endPt,
    startHandle,
    endHandle,
    distanceCm,
    targetLayer,
    notchName,
    offsetNormalCm
  ) {
    if (!startPt || !endPt || !targetLayer) return null;
    const distance = distanceCm || 0;
    if (!Number.isFinite(distance) || distance <= 0) return null;
    const totalLen = approximateBezierLength(
      startPt,
      startHandle || startPt,
      endHandle || endPt,
      endPt
    );
    if (!Number.isFinite(totalLen) || totalLen <= 0) return null;
    const clampedDist = Math.min(distance, totalLen);
    const t = findParameterForLength(
      startPt,
      startHandle || startPt,
      endHandle || endPt,
      endPt,
      clampedDist,
      totalLen
    );
    if (!Number.isFinite(t)) return null;
    const point = evaluateBezierPoint(
      startPt,
      startHandle || startPt,
      endHandle || endPt,
      endPt,
      t
    );
    const tangent = evaluateBezierTangent(
      startPt,
      startHandle || startPt,
      endHandle || endPt,
      endPt,
      t
    );
    const norm = normalizeVector([-tangent[1], tangent[0]]);
    const offset = offsetNormalCm || 0;
    const basePoint = [
      point[0] + norm[0] * offset,
      point[1] + norm[1] * offset,
    ];
    drawNotchAtPoint(targetLayer, basePoint, norm, notchName);
    return { point: basePoint, normal: norm };
  }

  function drawNotchAtPoint(layer, center, normal, notchName) {
    if (!layer || !center || !normal) return;
    const notchHalf = 0.25;
    const notchStart = [
      center[0] - normal[0] * notchHalf,
      center[1] - normal[1] * notchHalf,
    ];
    const notchEnd = [
      center[0] + normal[0] * notchHalf,
      center[1] + normal[1] * notchHalf,
    ];
    drawDashedLine(layer, notchStart, notchEnd, { name: notchName || "" });
  }

  function evaluateBezierPoint(p0, p1, p2, p3, t) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    const f0 = uuu;
    const f1 = 3 * uu * t;
    const f2 = 3 * u * tt;
    const f3 = ttt;
    return [
      f0 * p0[0] + f1 * p1[0] + f2 * p2[0] + f3 * p3[0],
      f0 * p0[1] + f1 * p1[1] + f2 * p2[1] + f3 * p3[1],
    ];
  }

  function evaluateBezierTangent(p0, p1, p2, p3, t) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const d0 = -3 * uu;
    const d1 = 3 * uu - 6 * u * t;
    const d2 = 6 * u * t - 3 * tt;
    const d3 = 3 * tt;
    return [
      d0 * p0[0] + d1 * p1[0] + d2 * p2[0] + d3 * p3[0],
      d0 * p0[1] + d1 * p1[1] + d2 * p2[1] + d3 * p3[1],
    ];
  }

  function approximateBezierLength(p0, p1, p2, p3, uptoT = 1) {
    let length = 0;
    let prev = p0;
    const span = uptoT;
    const steps = Math.max(5, Math.round(40 * span));
    for (let i = 1; i <= steps; i += 1) {
      const t = span * (i / steps);
      const pt = evaluateBezierPoint(p0, p1, p2, p3, t);
      const dx = pt[0] - prev[0];
      const dy = pt[1] - prev[1];
      length += Math.sqrt(dx * dx + dy * dy);
      prev = pt;
    }
    return length;
  }

  function findParameterForLength(p0, p1, p2, p3, targetLen, totalLen) {
    if (targetLen <= 0) return 0;
    if (targetLen >= totalLen) return 1;
    let low = 0;
    let high = 1;
    for (let iter = 0; iter < 20; iter += 1) {
      const mid = (low + high) / 2;
      const len = approximateBezierLength(p0, p1, p2, p3, mid);
      if (len < targetLen) {
        low = mid;
      } else {
        high = mid;
      }
    }
    return (low + high) / 2;
  }

  function findHorizontalIntersection(a, b, targetY) {
    if (!a || !b || targetY === null || targetY === undefined) return null;
    const dy = b[1] - a[1];
    if (Math.abs(dy) < 1e-6) return [a[0], targetY];
    const t = (targetY - a[1]) / dy;
    return [a[0] + (b[0] - a[0]) * t, targetY];
  }

  function projectHorizontalOntoLine(a, b, targetY) {
    if (!a || !b || targetY === null || targetY === undefined) return null;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    if (Math.abs(dy) < 1e-6) return [a[0], targetY];
    const t = (targetY - a[1]) / dy;
    const x = a[0] + dx * t;
    return [x, targetY];
  }

  function evaluateBezierPointWithHandles(
    start,
    startHandle,
    endHandle,
    end,
    t
  ) {
    const p0 = start || [0, 0];
    const p1 = startHandle || p0;
    const p2 = endHandle || end || [0, 0];
    const p3 = end || [0, 0];
    return evaluateBezierPoint(p0, p1, p2, p3, t);
  }

  function findBezierHorizontalIntersection(
    start,
    startHandle,
    endHandle,
    end,
    targetY
  ) {
    if (!start || !end || targetY === null || targetY === undefined)
      return null;
    const steps = 40;
    let prevT = 0;
    let prevPoint = evaluateBezierPointWithHandles(
      start,
      startHandle,
      endHandle,
      end,
      0
    );
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps;
      const point = evaluateBezierPointWithHandles(
        start,
        startHandle,
        endHandle,
        end,
        t
      );
      if ((prevPoint[1] - targetY) * (point[1] - targetY) <= 0) {
        const ratio = Math.abs(
          (targetY - prevPoint[1]) / (point[1] - prevPoint[1] || 1)
        );
        return [
          prevPoint[0] + (point[0] - prevPoint[0]) * ratio,
          targetY,
          prevT + (t - prevT) * ratio,
        ];
      }
      prevT = t;
      prevPoint = point;
    }
    return null;
  }

  function computePerpendicularProjection(lineStart, lineEnd, targetPoint) {
    if (!lineStart || !lineEnd || !targetPoint) return null;
    const dx = lineEnd[0] - lineStart[0];
    const dy = lineEnd[1] - lineStart[1];
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return null;
    const t =
      ((targetPoint[0] - lineStart[0]) * dx +
        (targetPoint[1] - lineStart[1]) * dy) /
      lenSq;
    const clampedT = Math.max(0, Math.min(1, t));
    const proj = [lineStart[0] + dx * clampedT, lineStart[1] + dy * clampedT];
    return { projectPoint: proj, t: clampedT };
  }

  function lineIntersection(p1, p2, p3, p4) {
    if (!p1 || !p2 || !p3 || !p4) return null;
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const [x3, y3] = p3;
    const [x4, y4] = p4;
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 1e-6) return null;
    const det1 = x1 * y2 - y1 * x2;
    const det2 = x3 * y4 - y3 * x4;
    const x = (det1 * (x3 - x4) - (x1 - x2) * det2) / denom;
    const y = (det1 * (y3 - y4) - (y1 - y2) * det2) / denom;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return [x, y];
  }

  function addPerpendicularFromLine(
    capLayer,
    markerLayer,
    numberLayer,
    lineStart,
    lineEnd,
    targetPoint,
    labelChar,
    pathName
  ) {
    if (
      !capLayer ||
      !markerLayer ||
      !numberLayer ||
      !lineStart ||
      !lineEnd ||
      !targetPoint
    )
      return;
    const projection = computePerpendicularProjection(
      lineStart,
      lineEnd,
      targetPoint
    );
    if (!projection || !projection.projectPoint) return;
    drawDashedLine(capLayer, projection.projectPoint, targetPoint, {
      name: pathName || "",
    });
    placeMarker(projection.projectPoint, labelChar || "");
  }

  function computeCapMarkerPoints(mark1, mark2, mark4Point, derivedValues) {
    if (!mark1 || !mark2 || !mark4Point || !derivedValues) return null;
    let capLenPt = derivedValues.CapLineCm || 0;
    if (!Number.isFinite(capLenPt) || capLenPt <= 0) {
      capLenPt = Math.abs((mark2[0] || 0) - (mark1[0] || 0));
    }
    if (!Number.isFinite(capLenPt) || capLenPt <= 0) return null;
    return {
      mark11: [mark4Point[0] - capLenPt / 8, mark4Point[1]],
      mark12: [mark4Point[0] + capLenPt / 5, mark4Point[1]],
      mark13: [mark2[0] - capLenPt / 14, mark2[1]],
      mark14: [mark1[0] + capLenPt / 12, mark1[1]],
    };
  }

  function addCapMarkers(
    capLayer,
    markerLayer,
    numberLayer,
    mark1,
    mark2,
    mark4Point,
    derivedValues
  ) {
    if (!capLayer || !markerLayer || !numberLayer) return;
    const points = computeCapMarkerPoints(
      mark1,
      mark2,
      mark4Point,
      derivedValues
    );
    if (!points) return;
    const segments = [
      {
        start: mark4Point,
        end: points.mark11,
        label: 11,
        drawLine: true,
        name: "4-11",
      },
      {
        start: mark4Point,
        end: points.mark12,
        label: 12,
        drawLine: true,
        name: "4-12",
      },
      { start: mark2, end: points.mark13, label: 13, drawLine: false },
      { start: mark1, end: points.mark14, label: 14, drawLine: false },
    ];

    segments.forEach((seg) => {
      if (!seg.start || !seg.end) return;
      if (seg.drawLine !== false) {
        drawDashedLine(capLayer, seg.start, seg.end, { name: seg.name || "" });
      }
      placeMarker(seg.end, seg.label);
    });

    if (points.mark11 && points.mark14) {
      drawDashedLine(capLayer, points.mark11, points.mark14, { name: "11-14" });
    }
    if (points.mark12 && points.mark13) {
      drawDashedLine(capLayer, points.mark12, points.mark13, { name: "12-13" });
    }
  }

  function addPerpendicularCapPoints(
    capLayer,
    markerLayer,
    numberLayer,
    mark1,
    mark2,
    mark4Point,
    derivedValues
  ) {
    if (!capLayer || !markerLayer || !numberLayer) return;
    const points = computeCapMarkerPoints(
      mark1,
      mark2,
      mark4Point,
      derivedValues
    );
    if (!points) return;
    addPerpendicularFromLine(
      capLayer,
      markerLayer,
      numberLayer,
      mark1,
      mark4Point,
      points.mark11,
      "a",
      "a-11"
    );
    addPerpendicularFromLine(
      capLayer,
      markerLayer,
      numberLayer,
      mark2,
      mark4Point,
      points.mark12,
      "b",
      "12-b"
    );
  }

  function addBackCapNotches(pathNodes, layer, derivedValues) {
    if (!pathNodes || pathNodes.length < 2 || !layer || !derivedValues) return;
    const baseDistance = derivedValues.bAP || 0;
    if (!Number.isFinite(baseDistance) || baseDistance <= 0) return;
    const distances = [baseDistance, baseDistance + 1];
    const names = ["Back Cap Notch", "Back Cap Notch Upper"];
    distances.forEach((distance, index) => {
      placeBackNotchOnChain(pathNodes, layer, distance, names[index]);
    });
  }

  function placeBackNotchOnChain(nodes, layer, distanceCm, notchName) {
    if (!Number.isFinite(distanceCm) || distanceCm <= 0) return;
    let remaining = distanceCm;
    for (let i = 1; i < nodes.length; i += 1) {
      const prev = nodes[i - 1] || {};
      const curr = nodes[i] || {};
      const startPt = prev.anchor;
      const endPt = curr.anchor;
      if (!startPt || !endPt) continue;
      const startHandle = prev.right || startPt;
      const endHandle = curr.left || endPt;
      const segLenCm = approximateBezierLength(
        startPt,
        startHandle,
        endHandle,
        endPt
      );
      if (!Number.isFinite(segLenCm) || segLenCm <= 0) continue;
      if (remaining <= segLenCm) {
        addNotchOnPath(
          startPt,
          endPt,
          startHandle,
          endHandle,
          remaining,
          layer,
          notchName
        );
        return;
      }
      remaining -= segLenCm;
    }
  }

  function addCapArcs(layerHandles, mark1, mark2, mark4Point, derivedValues) {
    if (!layerHandles || !mark1 || !mark2 || !mark4Point || !derivedValues)
      return;
    const capLayer = layerHandles.capShaping;
    const sleeveBlockLayer = layerHandles.sleeveBlock;
    if (!capLayer) return;
    const points = computeCapMarkerPoints(
      mark1,
      mark2,
      mark4Point,
      derivedValues
    );
    if (!points || !points.mark11 || !points.mark12 || !points.mark14) return;

    const mid1114 = midpoint(points.mark11, points.mark14);

    const baselineDir = normalizeVector([
      mark2[0] - mark1[0],
      mark2[1] - mark1[1],
    ]);
    const arc1StartHandle = [
      mark1[0] + baselineDir[0] * 3,
      mark1[1] + baselineDir[1] * 3,
    ];

    const towards14Dir = normalizeVector([
      points.mark14[0] - mid1114[0],
      points.mark14[1] - mid1114[1],
    ]);
    const arc1EndHandle = [
      mid1114[0] + towards14Dir[0] * 4,
      mid1114[1] + towards14Dir[1] * 4,
    ];

    const frontDirMidTo11 = normalizeVector([
      points.mark11[0] - mid1114[0],
      points.mark11[1] - mid1114[1],
    ]);
    const frontSecondStartHandle = [
      mid1114[0] + frontDirMidTo11[0] * 3,
      mid1114[1] + frontDirMidTo11[1] * 3,
    ];
    const dir4To12 = normalizeVector([
      mark4Point[0] - points.mark12[0],
      mark4Point[1] - points.mark12[1],
    ]);
    const frontSecondEndHandle = [
      mark4Point[0] + dir4To12[0] * 3.3,
      mark4Point[1] + dir4To12[1] * 3.3,
    ];
    const frontNodes = [
      { anchor: mark1, right: arc1StartHandle },
      { anchor: mid1114, left: arc1EndHandle, right: frontSecondStartHandle },
      { anchor: mark4Point, left: frontSecondEndHandle },
    ];
    drawBezierChain(capLayer, frontNodes, "Front Cap");
    addNotchOnPath(
      mark1,
      mid1114,
      arc1StartHandle,
      arc1EndHandle,
      derivedValues.fAP || 0,
      capLayer,
      "Front Cap Notch"
    );
    if (sleeveBlockLayer) {
      drawBezierChain(sleeveBlockLayer, frontNodes, "Front Cap");
      addNotchOnPath(
        mark1,
        mid1114,
        arc1StartHandle,
        arc1EndHandle,
        derivedValues.fAP || 0,
        sleeveBlockLayer,
        "Front Cap Notch"
      );
    }

    let mid1213 = midpoint(points.mark12, points.mark13);
    if (!mid1213) mid1213 = mid1114;
    const intersection1213_24 = lineIntersection(
      points.mark12,
      points.mark13,
      mark2,
      mark4Point
    );
    if (intersection1213_24) {
      const baselineForwardDir = normalizeVector([
        mark2[0] - mark1[0],
        mark2[1] - mark1[1],
      ]);
      let line1213Dir = normalizeVector([
        points.mark13[0] - points.mark12[0],
        points.mark13[1] - points.mark12[1],
      ]);
      if (Math.abs(line1213Dir[1]) < 1e-6) {
        line1213Dir = [0, 1];
      } else if (line1213Dir[1] < 0) {
        line1213Dir = [-line1213Dir[0], -line1213Dir[1]];
      }
      const handleMark4 = [
        mark4Point[0] + baselineForwardDir[0] * 6.6,
        mark4Point[1] + baselineForwardDir[1] * 6.6,
      ];
      const handleIntersectionUpper = [
        intersection1213_24[0] + line1213Dir[0] * 2.95,
        intersection1213_24[1] + line1213Dir[1] * 2.95,
      ];

      const handleMark2 = [
        mark2[0] - baselineForwardDir[0] * 3.5,
        mark2[1] - baselineForwardDir[1] * 3.5,
      ];
      const handleIntersectionLower = [
        intersection1213_24[0] - line1213Dir[0] * 1.5,
        intersection1213_24[1] - line1213Dir[1] * 1.5,
      ];

      const backNodesCustom = [
        { anchor: mark2, right: handleMark2 },
        {
          anchor: intersection1213_24,
          left: handleIntersectionLower,
          right: handleIntersectionUpper,
        },
        { anchor: mark4Point, left: handleMark4 },
      ];
      drawBezierChain(capLayer, backNodesCustom, "Back Cap");
      addBackCapNotches(backNodesCustom, capLayer, derivedValues);
      if (sleeveBlockLayer) {
        drawBezierChain(sleeveBlockLayer, backNodesCustom, "Back Cap");
        addBackCapNotches(backNodesCustom, sleeveBlockLayer, derivedValues);
      }
      const frontLength =
        approximateBezierLength(
          mark1,
          arc1StartHandle,
          arc1EndHandle,
          mid1114
        ) +
        approximateBezierLength(
          mid1114,
          frontSecondStartHandle,
          frontSecondEndHandle,
          mark4Point
        );
      const backLengthCustom =
        approximateBezierLength(
          mark2,
          handleMark2,
          handleIntersectionLower,
          intersection1213_24
        ) +
        approximateBezierLength(
          intersection1213_24,
          handleIntersectionUpper,
          handleMark4,
          mark4Point
        );
      derivedValues.CapCurveLengthCm = frontLength + backLengthCustom;
    } else {
      const baselineBackDir = normalizeVector([
        mark1[0] - mark2[0],
        mark1[1] - mark2[1],
      ]);
      const arc2StartHandle = [
        mark2[0] + baselineBackDir[0] * 4.3,
        mark2[1] + baselineBackDir[1] * 4.3,
      ];
      const dirTo13 = normalizeVector([
        points.mark13[0] - mid1213[0],
        points.mark13[1] - mid1213[1],
      ]);
      const arc2EndHandleFallback = [
        mid1213[0] + dirTo13[0] * 4,
        mid1213[1] + dirTo13[1] * 4,
      ];

      const projectionB = computePerpendicularProjection(
        mark4Point,
        mark2,
        points.mark12
      );
      const mid12b =
        projectionB && projectionB.projectPoint
          ? midpoint(points.mark12, projectionB.projectPoint)
          : midpoint(points.mark12, mark4Point);
      const dirTo12 = normalizeVector([
        points.mark12[0] - mid1213[0],
        points.mark12[1] - mid1213[1],
      ]);
      const dir4To12 = normalizeVector([
        points.mark12[0] - mark4Point[0],
        points.mark12[1] - mark4Point[1],
      ]);
      const arc3EndHandle = [
        mark4Point[0] + dir4To12[0] * 3.3,
        mark4Point[1] + dir4To12[1] * 3.3,
      ];
      const targetPoint = mid12b || midpoint(mid1213, mark4Point);
      const f0 = 0.125;
      const f1 = 0.375;
      const f2 = 0.375;
      const f3 = 0.125;
      const restX =
        f0 * mid1213[0] + f2 * arc3EndHandle[0] + f3 * mark4Point[0];
      const restY =
        f0 * mid1213[1] + f2 * arc3EndHandle[1] + f3 * mark4Point[1];
      const vecX = targetPoint[0] - restX - f1 * mid1213[0];
      const vecY = targetPoint[1] - restY - f1 * mid1213[1];
      let startLenPt = (vecX * dirTo12[0] + vecY * dirTo12[1]) / f1;
      if (!Number.isFinite(startLenPt) || startLenPt <= 0) startLenPt = 3;
      const arc3StartHandleFallback = [
        mid1213[0] + dirTo12[0] * startLenPt,
        mid1213[1] + dirTo12[1] * startLenPt,
      ];

      const backNodesFallback = [
        { anchor: mark2, right: arc2StartHandle },
        {
          anchor: mid1213,
          left: arc2EndHandleFallback,
          right: arc3StartHandleFallback,
        },
        { anchor: mark4Point, left: arc3EndHandle },
      ];
      drawBezierChain(capLayer, backNodesFallback, "Back Cap");
      addBackCapNotches(backNodesFallback, capLayer, derivedValues);
      if (sleeveBlockLayer) {
        drawBezierChain(sleeveBlockLayer, backNodesFallback, "Back Cap");
        addBackCapNotches(backNodesFallback, sleeveBlockLayer, derivedValues);
      }
      const frontLength =
        approximateBezierLength(
          mark1,
          arc1StartHandle,
          arc1EndHandle,
          mid1114
        ) +
        approximateBezierLength(
          mid1114,
          frontSecondStartHandle,
          frontSecondEndHandle,
          mark4Point
        );
      const backLengthFallback =
        approximateBezierLength(
          mark2,
          arc2StartHandle,
          arc2EndHandleFallback,
          mid1213
        ) +
        approximateBezierLength(
          mid1213,
          arc3StartHandleFallback,
          arc3EndHandle,
          mark4Point
        );
      derivedValues.CapCurveLengthCm = frontLength + backLengthFallback;
    }
  }

  function calculateMark3RadiusCm(derivedValues) {
    if (!derivedValues) return 0;
    const fAh =
      derivedValues.fAhConstruction != null &&
      Number.isFinite(derivedValues.fAhConstruction)
        ? derivedValues.fAhConstruction
        : derivedValues.fAh;
    const capEase =
      derivedValues.CapEaseCm != null &&
      Number.isFinite(derivedValues.CapEaseCm)
        ? derivedValues.CapEaseCm
        : 0;
    const radius = 0.97 * (fAh || 0) + 0.25 * (capEase || 0);
    return Number.isFinite(radius) && radius > 0 ? radius : 0;
  }

  function calculateMark4RadiusCm(derivedValues) {
    if (!derivedValues) return 0;
    const bAh =
      derivedValues.bAhConstruction != null &&
      Number.isFinite(derivedValues.bAhConstruction)
        ? derivedValues.bAhConstruction
        : derivedValues.bAh;
    const capEase =
      derivedValues.CapEaseCm != null &&
      Number.isFinite(derivedValues.CapEaseCm)
        ? derivedValues.CapEaseCm
        : 0;
    const radius = 0.97 * (bAh || 0) + 0.75 * (capEase || 0);
    return Number.isFinite(radius) && radius > 0 ? radius : 0;
  }

  function polarPoint(centerPt, radius, angle) {
    if (!centerPt || !Number.isFinite(radius)) return null;
    return [
      centerPt[0] + radius * Math.cos(angle),
      centerPt[1] + radius * Math.sin(angle),
    ];
  }

  function buildMark3Arc(
    centerPt,
    derivedValues,
    layoutBounds,
    targetLengthCm
  ) {
    if (!centerPt || !derivedValues) return null;
    const radiusCm =
      layoutBounds && typeof layoutBounds.arcRadiusCm === "number"
        ? layoutBounds.arcRadiusCm
        : calculateMark3RadiusCm(derivedValues);
    if (!Number.isFinite(radiusCm) || radiusCm <= 0) return null;

    const desiredLengthCm =
      Number.isFinite(targetLengthCm) && targetLengthCm > 0
        ? targetLengthCm
        : HOF_SLEEVE_ARC_TARGET_CM;
    let sweepAngle = desiredLengthCm / radiusCm;
    const maxSweep = HOF_SLEEVE_ARC_END - HOF_SLEEVE_ARC_MIN_START;
    sweepAngle = Math.min(
      Math.max(sweepAngle, HOF_SLEEVE_ARC_MIN_SWEEP),
      maxSweep
    );
    let startAngle = HOF_SLEEVE_ARC_END - sweepAngle;
    if (startAngle < HOF_SLEEVE_ARC_MIN_START) {
      startAngle = HOF_SLEEVE_ARC_MIN_START;
      sweepAngle = HOF_SLEEVE_ARC_END - startAngle;
    }
    const endAngle = HOF_SLEEVE_ARC_END;
    const startPoint = polarPoint(centerPt, radiusCm, startAngle);
    const endPoint = polarPoint(centerPt, radiusCm, endAngle);
    if (!startPoint || !endPoint) return null;

    const handleLength = (4 / 3) * radiusCm * Math.tan(sweepAngle / 4);
    const startTangent = [-Math.sin(startAngle), Math.cos(startAngle)];
    const endTangent = [-Math.sin(endAngle), Math.cos(endAngle)];
    const startHandle = [
      startPoint[0] + startTangent[0] * handleLength,
      startPoint[1] + startTangent[1] * handleLength,
    ];
    const endHandle = [
      endPoint[0] - endTangent[0] * handleLength,
      endPoint[1] - endTangent[1] * handleLength,
    ];
    const totalLengthCm = sweepAngle * radiusCm;

    return {
      startPoint,
      endPoint,
      center: centerPt,
      radiusCm,
      startAngle,
      endAngle,
      startHandle,
      endHandle,
      totalLengthCm,
      targetLengthCm: desiredLengthCm,
    };
  }

  function rebalanceArcAroundMark4(arcInfo, mark4Angle) {
    if (!arcInfo || !Number.isFinite(mark4Angle)) return;
    const radiusCm = arcInfo.radiusCm;
    if (!Number.isFinite(radiusCm) || radiusCm <= 0) return;
    const ratioUp = HOF_SLEEVE_ARC_UP_RATIO;
    const ratioDown = HOF_SLEEVE_ARC_DOWN_RATIO;
    const ratioSum = ratioUp + ratioDown;
    if (!Number.isFinite(ratioSum) || ratioSum <= 0) return;
    let desiredLengthCm =
      arcInfo.totalLengthCm ||
      arcInfo.targetLengthCm ||
      HOF_SLEEVE_ARC_TARGET_CM;
    if (!Number.isFinite(desiredLengthCm) || desiredLengthCm <= 0)
      desiredLengthCm = HOF_SLEEVE_ARC_TARGET_CM;
    let sweepAngle = desiredLengthCm / radiusCm;
    const maxSweep = HOF_SLEEVE_ARC_END - HOF_SLEEVE_ARC_MIN_START;
    sweepAngle = Math.min(
      Math.max(sweepAngle, HOF_SLEEVE_ARC_MIN_SWEEP),
      maxSweep
    );
    const upSweep = sweepAngle * (ratioUp / ratioSum);
    const downSweep = sweepAngle - upSweep;
    let startAngle = mark4Angle - downSweep;
    let endAngle = mark4Angle + upSweep;
    const minAngle = HOF_SLEEVE_ARC_MIN_START;
    const maxAngleLimit = HOF_SLEEVE_ARC_END;
    if (startAngle < minAngle) {
      const shiftUp = minAngle - startAngle;
      startAngle += shiftUp;
      endAngle += shiftUp;
    }
    if (endAngle > maxAngleLimit) {
      const shiftDown = endAngle - maxAngleLimit;
      startAngle -= shiftDown;
      endAngle -= shiftDown;
    }
    if (startAngle < minAngle) startAngle = minAngle;
    if (endAngle > maxAngleLimit) endAngle = maxAngleLimit;
    let sweep = endAngle - startAngle;
    if (sweep < HOF_SLEEVE_ARC_MIN_SWEEP) {
      const mid = (startAngle + endAngle) / 2;
      startAngle = mid - HOF_SLEEVE_ARC_MIN_SWEEP / 2;
      endAngle = mid + HOF_SLEEVE_ARC_MIN_SWEEP / 2;
    }
    updateArcGeometry(arcInfo, startAngle, endAngle);
  }

  function updateArcGeometry(arcInfo, startAngle, endAngle) {
    if (!arcInfo || !arcInfo.center || !Number.isFinite(arcInfo.radiusCm))
      return;
    arcInfo.startAngle = startAngle;
    arcInfo.endAngle = endAngle;
    const startPoint = polarPoint(arcInfo.center, arcInfo.radiusCm, startAngle);
    const endPoint = polarPoint(arcInfo.center, arcInfo.radiusCm, endAngle);
    arcInfo.startPoint = startPoint;
    arcInfo.endPoint = endPoint;
    let sweepAngle = endAngle - startAngle;
    if (sweepAngle < HOF_SLEEVE_ARC_MIN_SWEEP)
      sweepAngle = HOF_SLEEVE_ARC_MIN_SWEEP;
    const handleLength = (4 / 3) * arcInfo.radiusCm * Math.tan(sweepAngle / 4);
    const startTangent = [-Math.sin(startAngle), Math.cos(startAngle)];
    const endTangent = [-Math.sin(endAngle), Math.cos(endAngle)];
    arcInfo.startHandle = [
      startPoint[0] + startTangent[0] * handleLength,
      startPoint[1] + startTangent[1] * handleLength,
    ];
    arcInfo.endHandle = [
      endPoint[0] - endTangent[0] * handleLength,
      endPoint[1] - endTangent[1] * handleLength,
    ];
    arcInfo.totalLengthCm = sweepAngle * (arcInfo.radiusCm || 0);
  }

  function intersectCircles(centerA, radiusA, centerB, radiusB) {
    const dx = centerB[0] - centerA[0];
    const dy = centerB[1] - centerA[1];
    const d = Math.sqrt(dx * dx + dy * dy);
    if (
      !Number.isFinite(d) ||
      d > radiusA + radiusB ||
      d < Math.abs(radiusA - radiusB)
    )
      return null;
    const a = (radiusA * radiusA - radiusB * radiusB + d * d) / (2 * d);
    const hSq = radiusA * radiusA - a * a;
    if (hSq < 0) return null;
    const h = Math.sqrt(hSq);
    const midX = centerA[0] + (a * dx) / d;
    const midY = centerA[1] + (a * dy) / d;
    const rx = (-dy * h) / d;
    const ry = (dx * h) / d;
    return [
      [midX + rx, midY + ry],
      [midX - rx, midY - ry],
    ];
  }

  function selectPointOnArc(points, arcInfo) {
    if (!points || !points.length || !arcInfo) return null;
    const { center, startAngle, endAngle } = arcInfo;
    const start = Math.min(startAngle, endAngle);
    const end = Math.max(startAngle, endAngle);
    for (let i = 0; i < points.length; i += 1) {
      const pt = points[i];
      const angle = Math.atan2(pt[1] - center[1], pt[0] - center[0]);
      if (angle >= start - 1e-4 && angle <= end + 1e-4) {
        return { point: pt, angle };
      }
    }
    return null;
  }

  function selectPreferredArcPoint(points, arcInfo) {
    if (!points || !points.length || !arcInfo || !arcInfo.center) return null;
    const targetAngle = (arcInfo.startAngle + arcInfo.endAngle) / 2;
    let bestPoint = null;
    let bestDiff = Infinity;
    points.forEach((pt) => {
      if (!pt) return;
      const angle = Math.atan2(
        pt[1] - arcInfo.center[1],
        pt[0] - arcInfo.center[0]
      );
      const diff = Math.abs(angle - targetAngle);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestPoint = { point: pt, angle };
      }
    });
    return bestPoint;
  }

  function buildMark4Intersection(mark2, arcInfo, derivedValues) {
    if (!mark2 || !arcInfo || !derivedValues) return null;
    const radiusCm = calculateMark4RadiusCm(derivedValues);
    if (!Number.isFinite(radiusCm) || radiusCm <= 0) return null;
    const intersections = intersectCircles(
      arcInfo.center,
      arcInfo.radiusCm,
      mark2,
      radiusCm
    );
    if (!intersections || intersections.length === 0) return null;
    let targetPoint = selectPointOnArc(intersections, arcInfo);
    if (!targetPoint)
      targetPoint = selectPreferredArcPoint(intersections, arcInfo);
    if (!targetPoint) return null;
    return {
      point: targetPoint.point,
      radiusCm,
      angle: targetPoint.angle,
    };
  }

  function buildVerticalAndSquares(
    layerHandles,
    mark1,
    mark2,
    mark4Point,
    derivedValues
  ) {
    if (!layerHandles || !mark1 || !mark2 || !mark4Point || !derivedValues)
      return;
    const sleeveBlockLayer = layerHandles.sleeveBlock || null;
    const sleeveLengthCm = derivedValues.SlL || 0;
    if (!Number.isFinite(sleeveLengthCm) || sleeveLengthCm <= 0) return;
    const verticalEnd = [mark4Point[0], mark4Point[1] - sleeveLengthCm];
    const sleeveLengthLabel = { name: "Sleeve Length" };
    drawDashedLine(
      layerHandles.sleeveBlock || layerHandles.foundation,
      mark4Point,
      verticalEnd,
      sleeveLengthLabel
    );
    placeMarker(verticalEnd, 5);

    const mark6 = [mark4Point[0], mark4Point[1] - sleeveLengthCm * 0.6];
    placeMarker(mark6, 6);
    const mid64 = midpoint(mark6, mark4Point);
    const sleeveWidthY = mid64 ? mid64[1] : null;

    const mark5 = verticalEnd;
    const mark1Down5 = [mark1[0], mark5[1]];
    const mark2Down5 = [mark2[0], mark5[1]];
    const mark1Down6 = [mark1[0], mark6[1]];
    const mark2Down6 = [mark2[0], mark6[1]];
    const elbowLineY = mark6 ? mark6[1] : mark1Down6 ? mark1Down6[1] : null;

    drawDashedLine(layerHandles.foundation, mark1, mark1Down5, { name: "1-7" });
    drawDashedLine(layerHandles.foundation, mark2, mark2Down5, { name: "2-8" });
    drawDashedLine(layerHandles.foundation, mark1Down5, mark2Down5, {
      name: "7-8",
    });
    drawDashedLine(layerHandles.foundation, mark1Down6, mark2Down6, {
      name: "9-10",
    });

    const hemOptions = {
      name: "Hem Line",
      labelLayer: layerHandles.labels,
      labelText: "Hem Line",
      labelOffsetCm: HOF_SLEEVE_LABEL_OFFSET_CM * 2,
    };
    let hemLineStart = mark1Down5;
    let hemLineEnd = mark2Down5;
    let hemLineStartSleeve = mark1Down5;
    let hemLineEndSleeve = mark2Down5;

    const elbowLabel = buildLineLabelOptions(
      "Elbow Line",
      derivedValues.SlW,
      layerHandles.labels
    );
    let elbowLineStart = null;
    let elbowLineEnd = null;
    let sleeveWidthStart = null;
    let sleeveWidthEnd = null;
    let leftSleeveCurve = null;
    let rightSleeveCurve = null;
    let leftElbowIntersection = null;
    let rightElbowIntersection = null;

    const mark15 = midpoint(mark1Down5, mark2Down5);
    if (mark15) {
      placeMarker(mark15, 15);
      const halfHeW = (derivedValues.HeW || 0) / 2;
      if (Number.isFinite(halfHeW) && halfHeW > 0) {
        const left16 = [mark15[0] - halfHeW, mark15[1]];
        const right17 = [mark15[0] + halfHeW, mark15[1]];
        hemLineStart = left16;
        hemLineEnd = right17;
        hemLineStartSleeve = left16;
        hemLineEndSleeve = right17;
        placeMarker(left16, 16);
        placeMarker(right17, 17);
        drawDashedLine(layerHandles.foundation, left16, mark1, {
          name: "Left Sleeve Length",
        });
        drawDashedLine(layerHandles.foundation, right17, mark2, {
          name: "Right Sleeve Length",
        });
        if (elbowLineY !== null) {
          if (!leftSleeveCurve) {
            const leftStartHandle = [left16[0], left16[1] + 5];
            const dir1To16 = normalizeVector([
              left16[0] - mark1[0],
              left16[1] - mark1[1],
            ]);
            const mark1Handle = [
              mark1[0] + dir1To16[0] * 12.47,
              mark1[1] + dir1To16[1] * 12.47,
            ];
            leftSleeveCurve = {
              start: left16,
              startHandle: leftStartHandle,
              endHandle: mark1Handle,
              end: mark1,
            };
          }
          let leftIntersection = findBezierHorizontalIntersection(
            leftSleeveCurve.start,
            leftSleeveCurve.startHandle,
            leftSleeveCurve.endHandle,
            leftSleeveCurve.end,
            elbowLineY
          );
          if (!leftIntersection) {
            leftIntersection = findHorizontalIntersection(
              leftSleeveCurve.start,
              leftSleeveCurve.end,
              elbowLineY
            );
          }
          if (!leftIntersection) {
            leftIntersection = projectHorizontalOntoLine(
              leftSleeveCurve.start,
              leftSleeveCurve.end,
              elbowLineY
            );
          }
          if (leftIntersection) {
            leftElbowIntersection = leftIntersection;
          }
        }

        if (elbowLineY !== null) {
          if (!rightSleeveCurve) {
            const rightStartHandle = [right17[0], right17[1] + 5];
            const dir2To17 = normalizeVector([
              right17[0] - mark2[0],
              right17[1] - mark2[1],
            ]);
            const mark2Handle = [
              mark2[0] + dir2To17[0] * 12.47,
              mark2[1] + dir2To17[1] * 12.47,
            ];
            rightSleeveCurve = {
              start: right17,
              startHandle: rightStartHandle,
              endHandle: mark2Handle,
              end: mark2,
            };
          }
          let rightIntersection = findBezierHorizontalIntersection(
            rightSleeveCurve.start,
            rightSleeveCurve.startHandle,
            rightSleeveCurve.endHandle,
            rightSleeveCurve.end,
            elbowLineY
          );
          if (!rightIntersection) {
            rightIntersection = findHorizontalIntersection(
              rightSleeveCurve.start,
              rightSleeveCurve.end,
              elbowLineY
            );
          }
          if (!rightIntersection) {
            rightIntersection = projectHorizontalOntoLine(
              rightSleeveCurve.start,
              rightSleeveCurve.end,
              elbowLineY
            );
          }
          if (rightIntersection) {
            rightElbowIntersection = rightIntersection;
          }
        }

        if (sleeveWidthY !== null) {
          let leftWidthIntersection = findBezierHorizontalIntersection(
            leftSleeveCurve.start,
            leftSleeveCurve.startHandle,
            leftSleeveCurve.endHandle,
            leftSleeveCurve.end,
            sleeveWidthY
          );
          let rightWidthIntersection = findBezierHorizontalIntersection(
            rightSleeveCurve.start,
            rightSleeveCurve.startHandle,
            rightSleeveCurve.endHandle,
            rightSleeveCurve.end,
            sleeveWidthY
          );
          if (!leftWidthIntersection) {
            leftWidthIntersection = projectHorizontalOntoLine(
              leftSleeveCurve.start,
              leftSleeveCurve.end,
              sleeveWidthY
            );
          }
          if (!rightWidthIntersection) {
            rightWidthIntersection = projectHorizontalOntoLine(
              rightSleeveCurve.start,
              rightSleeveCurve.end,
              sleeveWidthY
            );
          }
          if (leftWidthIntersection && rightWidthIntersection) {
            sleeveWidthStart = leftWidthIntersection;
            sleeveWidthEnd = rightWidthIntersection;
          }
        }
      }
    }
    if (!leftElbowIntersection && elbowLineY != null) {
      leftElbowIntersection = findHorizontalIntersection(
        mark1Down6,
        mark1,
        elbowLineY
      );
    }
    if (!rightElbowIntersection && elbowLineY != null) {
      rightElbowIntersection = findHorizontalIntersection(
        mark2Down6,
        mark2,
        elbowLineY
      );
    }
    if (leftElbowIntersection) elbowLineStart = leftElbowIntersection;
    if (rightElbowIntersection) elbowLineEnd = rightElbowIntersection;

    placeMarker(mark1Down5, 7);
    placeMarker(mark2Down5, 8);
    placeMarker(mark1Down6, 9);
    placeMarker(mark2Down6, 10);

    drawSolidLine(
      layerHandles.sleeveBlock,
      hemLineStartSleeve,
      hemLineEndSleeve,
      hemOptions
    );

    if (sleeveBlockLayer && leftSleeveCurve) {
      const leftArc = drawBezierSegment(
        sleeveBlockLayer,
        leftSleeveCurve.start,
        leftSleeveCurve.end,
        leftSleeveCurve.startHandle,
        leftSleeveCurve.endHandle,
        "Left Sleeve Line"
      );
      if (leftArc) {
        leftArc.removeAttribute("stroke-dasharray");
      }
    }
    if (sleeveBlockLayer && rightSleeveCurve) {
      const rightArc = drawBezierSegment(
        sleeveBlockLayer,
        rightSleeveCurve.start,
        rightSleeveCurve.end,
        rightSleeveCurve.startHandle,
        rightSleeveCurve.endHandle,
        "Right Sleeve Line"
      );
      if (rightArc) {
        rightArc.removeAttribute("stroke-dasharray");
      }
    }

    if (!elbowLineStart) elbowLineStart = mark1Down6;
    if (!elbowLineEnd) elbowLineEnd = mark2Down6;
    if (sleeveBlockLayer && elbowLineStart && elbowLineEnd) {
      drawDashedLine(
        sleeveBlockLayer,
        elbowLineStart,
        elbowLineEnd,
        elbowLabel
      );
    }

    let measuredSleeveWidth = null;
    if (sleeveWidthStart && sleeveWidthEnd) {
      measuredSleeveWidth = pointDistanceCm(sleeveWidthStart, sleeveWidthEnd);
      const sleeveWidthLabel = buildLineLabelOptions(
        "Sleeve Width",
        measuredSleeveWidth,
        layerHandles.labels
      );
      drawDashedLine(
        sleeveBlockLayer,
        sleeveWidthStart,
        sleeveWidthEnd,
        sleeveWidthLabel
      );
    } else if (mark1Down5 && mark2Down5) {
      measuredSleeveWidth = pointDistanceCm(mark1Down5, mark2Down5);
    }

    let measuredElbowWidth = null;
    if (elbowLineStart && elbowLineEnd) {
      measuredElbowWidth = pointDistanceCm(elbowLineStart, elbowLineEnd);
    } else if (mark1Down6 && mark2Down6) {
      measuredElbowWidth = pointDistanceCm(mark1Down6, mark2Down6);
    }

    const prevMeasured = hofSleeveUi.lastMeasured || {};
    hofSleeveUi.lastMeasured = {
      ...prevMeasured,
      SleeveWidthMeasured: measuredSleeveWidth,
      ElbowWidthMeasured: measuredElbowWidth,
      CapCurveLengthCm: Number.isFinite(derivedValues.CapCurveLengthCm)
        ? derivedValues.CapCurveLengthCm
        : prevMeasured.CapCurveLengthCm,
    };
    updateHofSleeveDerivedFields();
  }

  const mark1 = [0, 0];
  const mark2 = [baselineLengthCm, 0];
  const arcRadiusCm = calculateMark3RadiusCm(derived);
  const layoutStub = { arcRadiusCm };
  let upwardArc = buildMark3Arc(
    mark1,
    derived,
    layoutStub,
    HOF_SLEEVE_ARC_TARGET_CM
  );
  let mark4 = upwardArc
    ? buildMark4Intersection(mark2, upwardArc, derived)
    : null;

  if (
    (!mark4 || !mark4.point || !upwardArc) &&
    HOF_SLEEVE_ARC_MAX_CM > HOF_SLEEVE_ARC_TARGET_CM
  ) {
    upwardArc = buildMark3Arc(
      mark1,
      derived,
      layoutStub,
      HOF_SLEEVE_ARC_MAX_CM
    );
    mark4 = upwardArc
      ? buildMark4Intersection(mark2, upwardArc, derived)
      : null;
  }

  const capLineLabel = `Cap Line (${formatHofenbitzerValue(
    baselineLengthCm
  )} cm)`;
  if (layers.sleeveBlock) {
    drawDashedLine(layers.sleeveBlock, mark1, mark2, {
      name: "Cap Line",
      labelLayer: layers.labels,
      labelText: capLineLabel,
      labelOffsetCm: HOF_SLEEVE_LABEL_OFFSET_CM,
    });
  }
  placeMarker(mark1, 1);
  placeMarker(mark2, 2);

  if (mark4 && upwardArc) {
    if (mark4.point) {
      rebalanceArcAroundMark4(upwardArc, mark4.angle);
      const backLineCm = pointDistanceCm(mark2, mark4.point);
      const frontLineCm = pointDistanceCm(mark1, mark4.point);
      drawDashedLine(layers.foundation, mark2, mark4.point, {
        name: "Back Line",
      });
      drawDashedLine(layers.foundation, mark1, mark4.point, {
        name: "Front Line",
      });
      placeMarker(mark4.point, 4);
      buildVerticalAndSquares(layers, mark1, mark2, mark4.point, derived);
      addCapMarkers(
        layers.capShaping,
        layers.markers,
        layers.numbers,
        mark1,
        mark2,
        mark4.point,
        derived
      );
      addPerpendicularCapPoints(
        layers.capShaping,
        layers.markers,
        layers.numbers,
        mark1,
        mark2,
        mark4.point,
        derived
      );
      addCapArcs(layers, mark1, mark2, mark4.point, derived);
      const prevMeasured = hofSleeveUi.lastMeasured || {};
      hofSleeveUi.lastMeasured = {
        ...prevMeasured,
        CapCurveLengthCm: Number.isFinite(derived.CapCurveLengthCm)
          ? derived.CapCurveLengthCm
          : prevMeasured.CapCurveLengthCm,
      };
      updateHofSleeveDerivedFields();
      if (frontLineCm) {
        addLineLabel(
          layers.labels,
          mark1,
          mark4.point,
          `Front Line (${formatHofenbitzerValue(frontLineCm)} cm)`,
          HOF_SLEEVE_LABEL_OFFSET_CM
        );
      }
      if (backLineCm) {
        addLineLabel(
          layers.labels,
          mark2,
          mark4.point,
          `Back Line (${formatHofenbitzerValue(backLineCm)} cm)`,
          HOF_SLEEVE_LABEL_OFFSET_CM,
          -1
        );
      }
    }
  }

  if (upwardArc) {
    drawArcPath(layers.foundation, upwardArc);
    placeMarker(upwardArc.endPoint, 3);
  }

  // Center the view around the midpoint of 1–2 so widening/narrowing stays anchored
  const baselineMid = midpoint(mark1, mark2);
  if (baselineMid) {
    const originalBounds = { ...bounds };
    const baselineMidSvg = {
      x: origin.x + (baselineMid[0] || 0) * CM_TO_MM,
      y: origin.y - (baselineMid[1] || 0) * CM_TO_MM,
    };
    bounds.include(baselineMidSvg.x, baselineMidSvg.y);
    const leftSpan = baselineMidSvg.x - bounds.minX;
    const rightSpan = bounds.maxX - baselineMidSvg.x;
    const maxSpan = Math.max(leftSpan, rightSpan, 0);
    if (Number.isFinite(maxSpan) && maxSpan > 0) {
      bounds.minX = baselineMidSvg.x - maxSpan;
      bounds.maxX = baselineMidSvg.x + maxSpan;
    }
    // If symmetry produced an invalid box, fall back to original bounds
    if (
      !Number.isFinite(bounds.minX) ||
      !Number.isFinite(bounds.maxX) ||
      !Number.isFinite(bounds.minY) ||
      !Number.isFinite(bounds.maxY) ||
      bounds.maxX <= bounds.minX ||
      bounds.maxY <= bounds.minY
    ) {
      Object.assign(bounds, originalBounds);
    }
  }

  applyLayerVisibility(layers, params);
  fitSvgToBounds(svg, bounds);
  return svg;
}

function generateHofenbitzerBasicSkirt(params = {}) {
  const svg = createSvgRoot();
  svg.appendChild(
    Object.assign(document.createElementNS(NS, "metadata"), {
      textContent: JSON.stringify({
        tool: "HofenbitzerBasicSkirtWeb",
        units: "cm",
        source: "Hofenbitzer/Skirt/hofenbitzer_basic_skirt.jsx",
      }),
    })
  );

  const layers = createHofSkirtLayerStack(svg);
  const bounds = createBounds();
  const origin = {
    x: PAGE_MARGIN_MM * 2,
    y: PAGE_MARGIN_MM * 2,
  };
  const cmToMmValue = (value) => value * CM_TO_MM;

  const guideLayer = layers.foundation;
  const patternLayer = layers.pattern || layers.front || guideLayer;
  const dartsLayer = layers.dartsLayer || patternLayer;
  const shapingLayer = layers.shapingLayer || patternLayer;
  const labelsLayer = layers.labels;
  const markersLayer = layers.markers;
  const numbersLayer = layers.numbers;

  function toSvgCoords(point) {
    const mapped = {
      x: origin.x + cmToMmValue(point.x),
      y: origin.y - cmToMmValue(point.y),
    };
    bounds.include(mapped.x, mapped.y);
    return mapped;
  }

  function drawLineCm(target, start, end, opts = {}) {
    if (!target || !start || !end) return null;
    const s = toSvgCoords(start);
    const e = toSvgCoords(end);
    const attrs = {
      fill: "none",
      stroke: opts.color || "#111111",
      "stroke-width": opts.width || 0.6,
    };
    if (opts.dashed) {
      attrs["stroke-dasharray"] = opts.dash || HOFENBITZER_DASH_PATTERN;
    }
    if (opts.name) {
      attrs["data-name"] = opts.name;
    }
    const lineEl = path(`M ${s.x} ${s.y} L ${e.x} ${e.y}`, attrs);
    target.appendChild(lineEl);
    return lineEl;
  }

  function drawCurveCm(target, start, startHandle, endHandle, end, opts = {}) {
    if (!target || !start || !end) return null;
    const s = toSvgCoords(start);
    const c1 = toSvgCoords(startHandle || start);
    const c2 = toSvgCoords(endHandle || end);
    const e = toSvgCoords(end);
    const attrs = {
      fill: "none",
      stroke: opts.color || "#111111",
      "stroke-width": opts.width || 0.6,
    };
    if (opts.dashed) {
      attrs["stroke-dasharray"] = opts.dash || HOFENBITZER_DASH_PATTERN;
    }
    if (opts.name) {
      attrs["data-name"] = opts.name;
    }
    const curveEl = path(
      `M ${s.x} ${s.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${e.x} ${e.y}`,
      attrs
    );
    target.appendChild(curveEl);
    return curveEl;
  }

  function addLineLabel(text, start, end, options = {}) {
    if (!labelsLayer || !text || !start || !end) return;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const side = options.side || 1;
    const offset = options.offset || 0.5;
    const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    const normal = {
      x: (-dy / length) * offset * side,
      y: (dx / length) * offset * side,
    };
    const labelPoint = { x: mid.x + normal.x, y: mid.y + normal.y };
    const svgPoint = toSvgCoords(labelPoint);
    const textEl = textNode(svgPoint.x, svgPoint.y, text, {
      "font-size": 3.2,
      fill: "#0f172a",
      "font-weight": "600",
      "text-anchor": "middle",
    });
    let angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (angleDeg < -90) {
      angleDeg += 180;
    } else if (angleDeg > 90) {
      angleDeg -= 180;
    }
    textEl.setAttribute(
      "transform",
      `rotate(${angleDeg}, ${svgPoint.x}, ${svgPoint.y})`
    );
    labelsLayer.appendChild(textEl);
    bounds.include(svgPoint.x, svgPoint.y);
  }

  function placeMarker(point, number) {
    if (!markersLayer || !point) return;
    const svgPoint = toSvgCoords(point);
    const circle = document.createElementNS(NS, "circle");
    circle.setAttribute("cx", svgPoint.x);
    circle.setAttribute("cy", svgPoint.y);
    circle.setAttribute("r", cmToMmValue(HOFENBITZER_MARKER_RADIUS_CM));
    circle.setAttribute("fill", "#000");
    circle.setAttribute("stroke", "#000");
    markersLayer.appendChild(circle);
    if (numbersLayer && Number.isFinite(number)) {
      const numberNode = textNode(svgPoint.x, svgPoint.y + 1, String(number), {
        "font-size": 3,
        fill: "#ffffff",
        "text-anchor": "middle",
        "font-weight": "600",
      });
      numbersLayer.appendChild(numberNode);
    }
  }

  function copyLineToPattern(start, end, opts = {}, overrides = {}) {
    if (!patternLayer) return;
    const patternOpts = { ...opts, ...overrides };
    if (!overrides.keepDash) {
      delete patternOpts.dashed;
    }
    if (patternOpts.patternName) {
      patternOpts.name = patternOpts.patternName;
      delete patternOpts.patternName;
    }
    drawLineCm(patternLayer, start, end, patternOpts);
  }

  function copyCurveToPattern(
    start,
    startHandle,
    endHandle,
    end,
    opts = {},
    overrides = {}
  ) {
    if (!patternLayer) return;
    const patternOpts = { ...opts, ...overrides };
    if (patternOpts.patternName) {
      patternOpts.name = patternOpts.patternName;
      delete patternOpts.patternName;
    }
    drawCurveCm(patternLayer, start, startHandle, endHandle, end, patternOpts);
  }

  function drawConstructionLine(
    layer,
    start,
    end,
    opts = {},
    patternCopy = null
  ) {
    const line = drawLineCm(layer, start, end, opts);
    if (patternCopy) {
      const overrides = patternCopy === true ? {} : patternCopy;
      copyLineToPattern(start, end, opts, overrides);
    }
    return line;
  }

  function drawConstructionCurve(
    layer,
    start,
    startHandle,
    endHandle,
    end,
    opts = {},
    patternCopy = null
  ) {
    const curve = drawCurveCm(layer, start, startHandle, endHandle, end, opts);
    if (patternCopy) {
      const overrides = patternCopy === true ? {} : patternCopy;
      copyCurveToPattern(start, startHandle, endHandle, end, opts, overrides);
    }
    return curve;
  }

  const safeNumber = (value, fallback = 0) =>
    Number.isFinite(value) ? value : fallback;
  const lerpPoint = (a, b, t) => ({
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  });
  const horizontalIntersection = (a, b, targetY) => {
    const dy = b.y - a.y;
    if (Math.abs(dy) < 1e-6) {
      return { x: a.x, y: targetY };
    }
    const t = (targetY - a.y) / dy;
    return {
      x: a.x + (b.x - a.x) * t,
      y: targetY,
    };
  };

  const derived = computeHofSkirtDerived(params);
  const profile = normalizeHofSkirtProfile(
    params.HipProfile || HOFENBITZER_SKIRT_DEFAULTS.HipProfile
  );
  const moL = safeNumber(params.MoL, HOFENBITZER_SKIRT_DEFAULTS.MoL);
  const hiD = safeNumber(params.HiD, HOFENBITZER_SKIRT_DEFAULTS.HiD);
  const hiW = safeNumber(
    derived.HiW,
    (HOFENBITZER_SKIRT_DEFAULTS.HiC + HOFENBITZER_SKIRT_DEFAULTS.HipEase) / 2
  );
  const waistCirc = safeNumber(params.WaC, HOFENBITZER_SKIRT_DEFAULTS.WaC);
  const waistShaping = Number.isFinite(derived.WaistShaping)
    ? derived.WaistShaping
    : determineHofSkirtWaistShaping(profile);

  const P1 = { x: 0, y: 0 };
  const P2 = { x: 0, y: -moL };
  const P4 = { x: hiW, y: 0 };
  const P5 = { x: hiW, y: -moL };
  const P3 = { x: 0, y: -hiD };
  const P6 = { x: hiW, y: -hiD };
  const halfWidth = hiW / 2;
  const P7 = { x: halfWidth, y: 0 };
  const P8 = { x: halfWidth, y: -moL };
  const P9 = { x: halfWidth, y: -hiD };
  const P10 = { x: halfWidth, y: P7.y + waistShaping };

  const halfSideDart = Math.max(0, derived.SideDart) / 2;
  const P11 = { x: P10.x - halfSideDart, y: P10.y };
  const P12 = { x: P10.x + halfSideDart, y: P10.y };

  const waistLineY = 0;
  const frontHipIntersection = horizontalIntersection(P11, P9, waistLineY);
  const frontDartAnchorOffset = waistCirc / 10;
  const P13 = {
    x: frontHipIntersection.x - frontDartAnchorOffset,
    y: waistLineY,
  };
  const P13dashHalf = 2.5;
  const P13dashOffset = profile === "Curvy" ? 0.7 : 0.5;
  const P13TopY = P13.y + P13dashOffset;
  const P13dashLeft = { x: P13.x - P13dashHalf, y: P13TopY };
  const P13dashRight = { x: P13.x + P13dashHalf, y: P13TopY };
  const frontDartLength = Math.max(
    10,
    safeNumber(
      params.FrontDartLength,
      HOFENBITZER_SKIRT_DEFAULTS.FrontDartLength
    )
  );
  const P13Base = { x: P13.x, y: P13.y - frontDartLength };
  const halfFrontDart = Math.max(0, derived.FrontDart) / 2;
  const P13TopLeft = { x: P13.x - halfFrontDart, y: P13TopY };
  const P13TopRight = { x: P13.x + halfFrontDart, y: P13TopY };

  const cbWaistPoint = { x: P4.x, y: waistLineY };
  const backHipWaistPoint = horizontalIntersection(P12, P9, waistLineY);
  const rawBackDart1 = Math.max(0, derived.BackDart1);
  const rawBackDart2 = Math.max(0, derived.BackDart2);
  const hasSecondBackDart = rawBackDart2 > 0.05;
  const P14 = lerpPoint(
    cbWaistPoint,
    backHipWaistPoint,
    hasSecondBackDart ? 1 / 3 : 0.5
  );
  const backDartLength1 = Math.max(
    0,
    safeNumber(
      params.BackDartLength1,
      HOFENBITZER_SKIRT_DEFAULTS.BackDartLength1
    )
  );
  const P14Base = { x: P14.x, y: P14.y - backDartLength1 };
  const halfBackDart1 = rawBackDart1 / 2;
  const P14Left = { x: P14.x - halfBackDart1, y: P14.y };
  const P14Right = { x: P14.x + halfBackDart1, y: P14.y };
  let P14UpperLeft = { x: P14Left.x, y: P14Left.y };
  let P14UpperRight = { x: P14Right.x, y: P14Right.y };
  let singleBackDashLeft = null;
  let singleBackDashRight = null;
  if (!hasSecondBackDart) {
    const singleDashHalf = 2.5;
    const singleDashOffset = profile === "Curvy" ? 0.5 : 0.3;
    const singleGuideY = P14.y + singleDashOffset;
    singleBackDashLeft = { x: P14.x - singleDashHalf, y: singleGuideY };
    singleBackDashRight = { x: P14.x + singleDashHalf, y: singleGuideY };
    P14UpperLeft = { x: P14.x - halfBackDart1, y: singleGuideY };
    P14UpperRight = { x: P14.x + halfBackDart1, y: singleGuideY };
  }

  let P15 = null;
  let P15Base = null;
  let P15Left = null;
  let P15Right = null;
  let P15dashLeft = null;
  let P15dashRight = null;
  if (hasSecondBackDart) {
    const halfBackDart2 = rawBackDart2 / 2;
    const backDartLength2 = Math.max(
      0,
      safeNumber(
        params.BackDartLength2,
        HOFENBITZER_SKIRT_DEFAULTS.BackDartLength2
      )
    );
    const hipCurveWaistPoint = { x: P12.x, y: P12.y };
    const firstBackDartLeft = P14UpperLeft || P14Left;
    const midX = (firstBackDartLeft.x + hipCurveWaistPoint.x) / 2;
    P15 = { x: midX, y: waistLineY };
    P15Base = { x: P15.x, y: P15.y - backDartLength2 };
    const secondDashHalf = 2.5;
    const P15TopOffset = profile === "Curvy" ? 0.5 : 0.3;
    const P15TopY = P15.y + P15TopOffset;
    P15dashLeft = { x: P15.x - secondDashHalf, y: P15TopY };
    P15dashRight = { x: P15.x + secondDashHalf, y: P15TopY };
    P15Left = { x: P15.x - halfBackDart2, y: P15TopY };
    P15Right = { x: P15.x + halfBackDart2, y: P15TopY };
  }

  const labelOffsetCm = 0.5;
  const drawGuideLine = (start, end, options = {}, copyToPattern = true) => {
    drawLineCm(guideLayer, start, end, options);
    if (copyToPattern && patternLayer) {
      drawLineCm(patternLayer, start, end, options);
    }
  };

  drawGuideLine(P1, P2, { name: "Centre Front Line" });
  addLineLabel("Centre Front (CF)", P1, P2, { offset: labelOffsetCm, side: 1 });
  drawGuideLine(P1, P4, { name: "Waist Line" }, false);
  addLineLabel("Waist Line", P1, P4, { offset: labelOffsetCm, side: 1 });
  drawGuideLine(P4, P5, { name: "Centre Back Line" });
  addLineLabel("Centre Back (CB)", P4, P5, { offset: labelOffsetCm, side: -1 });
  drawGuideLine(P5, P2, { name: "Hem Line" });
  addLineLabel("Hem Line", P5, P2, { offset: labelOffsetCm, side: -1 });
  drawLineCm(guideLayer, P7, P8, { name: "Side Line" });
  addLineLabel("Side Line", P7, P8, { offset: labelOffsetCm, side: 1 });

  drawLineCm(guideLayer, P3, P6, { name: "Hip Line", dashed: true });
  drawLineCm(patternLayer, P3, P6, { name: "Hip Line", dashed: true });
  drawLineCm(patternLayer, P9, P8, { name: "Side Line" });

  drawLineCm(guideLayer, P7, P10, { name: "Waist Shaping Guide" });

  if (halfSideDart > 0) {
    drawConstructionLine(
      dartsLayer,
      P10,
      P11,
      { name: "Side Dart Left" },
      false
    );
    drawConstructionLine(
      dartsLayer,
      P10,
      P12,
      { name: "Side Dart Right" },
      false
    );
    const hipHandlePoint = { x: P7.x, y: P9.y + 10.5 };
    drawConstructionCurve(
      shapingLayer,
      P11,
      { x: P11.x, y: P11.y },
      hipHandlePoint,
      P9,
      { name: "Front Hip Curve" },
      true
    );
    drawConstructionCurve(
      shapingLayer,
      P12,
      { x: P12.x, y: P12.y },
      hipHandlePoint,
      P9,
      { name: "Back Hip Curve" },
      true
    );
  }

  const waistGuideLeft = { x: P10.x - 6, y: P10.y };
  const waistGuideRight = { x: P10.x + 6, y: P10.y };
  const waistGuideOpts = { dashed: true, name: "Upper Waist Shaping Guide" };
  drawLineCm(guideLayer, waistGuideLeft, waistGuideRight, waistGuideOpts);

  drawLineCm(dartsLayer, P13dashLeft, P13dashRight, {
    dashed: true,
    name: "Front Dart Guide",
  });
  drawLineCm(dartsLayer, P13, P13Base, {
    dashed: true,
    name: "Front Dart Centre",
  });
  if (halfFrontDart > 0) {
    drawConstructionLine(
      dartsLayer,
      P13TopLeft,
      P13Base,
      { name: "Front Dart Left" },
      true
    );
    drawConstructionLine(
      dartsLayer,
      P13TopRight,
      P13Base,
      { name: "Front Dart Right" },
      true
    );
    addLineLabel("Front Dart", P13TopLeft, P13TopRight, {
      offset: labelOffsetCm,
      side: 1,
    });
  }

  if (!hasSecondBackDart && singleBackDashLeft && singleBackDashRight) {
    drawLineCm(dartsLayer, singleBackDashLeft, singleBackDashRight, {
      dashed: true,
      name: "Back Waist Raise",
    });
  }
  if (hasSecondBackDart && P15dashLeft && P15dashRight) {
    drawLineCm(dartsLayer, P15dashLeft, P15dashRight, {
      dashed: true,
      name: "Back Waist Raise",
    });
  }
  if (hasSecondBackDart && P15 && P15Base) {
    drawLineCm(dartsLayer, P15, P15Base, {
      dashed: true,
      name: "2nd Back Dart Centre",
    });
  }
  if (hasSecondBackDart && P15Left && P15Right && P15Base) {
    drawConstructionLine(
      dartsLayer,
      P15Left,
      P15Base,
      { name: "Second Back Dart Left" },
      true
    );
    drawConstructionLine(
      dartsLayer,
      P15Right,
      P15Base,
      { name: "Second Back Dart Right" },
      true
    );
    addLineLabel("2nd Back Dart", P15Left, P15Right, {
      offset: labelOffsetCm,
      side: 1,
    });
  }

  drawLineCm(dartsLayer, P14, P14Base, {
    dashed: true,
    name: "1st Back Dart Centre",
  });
  drawConstructionLine(
    dartsLayer,
    P14UpperLeft,
    P14Base,
    { name: "First Back Dart Left" },
    true
  );
  drawConstructionLine(
    dartsLayer,
    P14UpperRight,
    P14Base,
    { name: "First Back Dart Right" },
    true
  );
  addLineLabel("1st Back Dart", P14UpperLeft, P14UpperRight, {
    offset: labelOffsetCm,
    side: 1,
  });

  if (P1 && P13TopLeft) {
    const frontCurveStartHandle = { x: P1.x + 10.6, y: P1.y + 0.3 };
    const frontCurveEndHandle = { x: P13TopLeft.x - 0.54, y: P13TopLeft.y };
    drawConstructionCurve(
      shapingLayer,
      P1,
      frontCurveStartHandle,
      frontCurveEndHandle,
      P13TopLeft,
      { name: "Front Waist Curve" },
      true
    );
  }

  if (P13TopRight && P11) {
    const frontHipHandle = { x: P11.x - 0.6, y: P11.y - 0.3 };
    drawConstructionCurve(
      shapingLayer,
      P13TopRight,
      { x: P13TopRight.x, y: P13TopRight.y },
      frontHipHandle,
      P11,
      {
        name: "Front Hip Transition",
      },
      true
    );
  }

  if (!hasSecondBackDart && P12 && P14UpperLeft) {
    const backCurveStartHandle = { x: P12.x + 0.4, y: P12.y - 0.2 };
    const backCurveEndHandle = { x: P14UpperLeft.x - 2.95, y: P14UpperLeft.y };
    drawConstructionCurve(
      shapingLayer,
      P12,
      backCurveStartHandle,
      backCurveEndHandle,
      P14UpperLeft,
      { name: "Back Waist Curve" },
      true
    );
    if (P14UpperRight && P4) {
      const backRightHandle = { x: P14UpperRight.x + 0.5, y: P14UpperRight.y };
      const backCfHandle = { x: P4.x - 4.25, y: P4.y };
      drawConstructionCurve(
        shapingLayer,
        P14UpperRight,
        backRightHandle,
        backCfHandle,
        P4,
        { name: "Back Waist Transition" },
        true
      );
    }
  } else if (hasSecondBackDart) {
    if (P12 && P15Left) {
      const backCurveStartHandle2 = { x: P12.x + 0.4, y: P12.y - 0.2 };
      const backCurveEndHandle2 = { x: P15Left.x - 0.6, y: P15Left.y };
      drawConstructionCurve(
        shapingLayer,
        P12,
        backCurveStartHandle2,
        backCurveEndHandle2,
        P15Left,
        { name: "Back Waist Curve" },
        true
      );
    }
    if (P15Right && P14UpperLeft) {
      const startHandle = { x: P15Right.x + 0.6, y: P15Right.y };
      const endHandle = { x: P14UpperLeft.x - 2.4, y: P14UpperLeft.y };
      drawConstructionCurve(
        shapingLayer,
        P15Right,
        startHandle,
        endHandle,
        P14UpperLeft,
        { name: "Back Waist Transition" },
        true
      );
    }
    if (patternLayer && P4 && P14UpperRight) {
      drawLineCm(patternLayer, P4, P14UpperRight, {
        name: "Back Waist CF Segment",
      });
    }
  }

  const markers = [P1, P2, P3, P4, P5, P6, P7, P8, P9, P10];
  markers.forEach((point, index) => placeMarker(point, index + 1));
  if (halfSideDart > 0) {
    placeMarker(P11, 11);
    placeMarker(P12, 12);
  }
  placeMarker(P13, 13);
  placeMarker(P14, 14);
  if (hasSecondBackDart && P15) {
    placeMarker(P15, 15);
  }

  if (typeof window !== "undefined") {
    window.hofenbitzerSkirtDraft = {
      params,
      derived,
      points: {
        P1,
        P2,
        P3,
        P4,
        P5,
        P6,
        P7,
        P8,
        P9,
        P10,
        P11,
        P12,
        P13,
        P14,
        P15,
      },
    };
  }

  applyLayerVisibility(layers, params);
  fitSvgToBounds(svg, bounds);
  return svg;
}

function readArmstrongParams() {
  const bustSpan = getNumber("bustSpan", 4.0625);
  const dartPlacement = getNumber("dartPlacement", 3.4375);
  return {
    fullLength: getNumber("fullLength", 18),
    acrossShoulder: getNumber("acrossShoulder", 7.9375),
    centreFrontLength: getNumber("centreFrontLength", 14.875),
    bustArc: getNumber("bustArc", 10.375),
    shoulderSlope: getNumber("shoulderSlope", 18.125),
    bustDepth: getNumber("bustDepth", 9.6875),
    shoulderLength: getNumber("shoulderLength", 5.375),
    bustSpan,
    acrossChest: getNumber("acrossChest", 6.9375),
    dartPlacement,
    newStrap: getNumber("newStrap", 18.1875),
    sideLength: getNumber("sideLength", 8.5),
    waistArc: getNumber("waistArc", 7.375),
    bustCup: getText("bustCup", "B Cup"),
    fullLengthBack: getNumber("fullLengthBack", 17.875),
    acrossShoulderBack: getNumber("acrossShoulderBack", 8.1875),
    centreFrontLengthBack: getNumber("centreFrontLengthBack", 17),
    bustArcBack: getNumber("bustArcBack", 9),
    shoulderSlopeBack: getNumber("shoulderSlopeBack", 17.375),
    shoulderLengthBack: getNumber("shoulderLengthBack", 5.375),
    bustSpanBack: bustSpan,
    acrossChestBack: getNumber("acrossChestBack", 7.1875),
    dartPlacementBack: dartPlacement,
    sideLengthBack: getNumber("sideLengthBack", 8.5),
    waistArcBack: getNumber("waistArcBack", 7),
    backNeck: getNumber("backNeck", 3.125),
    showGuides: getCheckbox("showGuides", true),
    showMarkers: getCheckbox("showMarkers", true),
  };
}

function readHofenbitzerParams() {
  initHofenbitzerControls();
  const measurements = {};
  HOFENBITZER_PRIMARY_MEASUREMENTS.forEach((def) => {
    const ref = hofenbitzerUi.measurementRows[def.id];
    if (!ref) return;
    const measurementValue = Number.parseFloat(ref.measurementInput.value);
    const resolvedMeasurement = Number.isFinite(measurementValue)
      ? measurementValue
      : def.measurementDefault;
    let resolvedEase = 0;
    if (ref.easeInput) {
      const easeValue = Number.parseFloat(ref.easeInput.value);
      resolvedEase = Number.isFinite(easeValue)
        ? easeValue
        : def.easeDefault || 0;
    }
    measurements[def.id] = {
      measurement: resolvedMeasurement,
      ease: resolvedEase,
      final: resolvedMeasurement + resolvedEase,
    };
  });

  const secondary = {};
  HOFENBITZER_SECONDARY_MEASUREMENTS.forEach((def) => {
    const ref = hofenbitzerUi.secondaryRows[def.id];
    if (!ref) {
      secondary[def.id] = def.defaultValue;
      return;
    }
    const value = Number.parseFloat(ref.input.value);
    secondary[def.id] = Number.isFinite(value) ? value : def.defaultValue;
  });

  const fitIndex = hofenbitzerUi.fitSelect
    ? Number.parseInt(hofenbitzerUi.fitSelect.value, 10)
    : HOFENBITZER_DEFAULT_FIT_INDEX;

  const shoulderDifferenceValue =
    secondary["ShoulderDifference"] ?? HOFENBITZER_DEFAULTS.ShoulderDifference;

  return {
    measurements,
    secondary,
    shoulderDifference: shoulderDifferenceValue,
    backShoulderEase: getNumber(
      "hofenbitzerBackShoulderEase",
      HOFENBITZER_DEFAULTS.BackShoulderEase
    ),
    fitIndex: Number.isFinite(fitIndex)
      ? fitIndex
      : HOFENBITZER_DEFAULT_FIT_INDEX,
    showGuides: getCheckbox("hofenbitzerShowGuides", true),
    showMarkers: getCheckbox("hofenbitzerShowMarkers", true),
  };
}

function readHofSkirtParams() {
  initHofSkirtControls();
  updateHofSkirtDerivedFields();
  const snapshot = captureHofSkirtInputs();
  const derived = computeHofSkirtDerived(snapshot);
  const manual = hofSkirtUi.manualOverrides || {};
  const resolvedValue = (key) => {
    if (manual[key]) {
      const value = snapshot[key];
      return Number.isFinite(value) ? value : derived[key];
    }
    return derived[key];
  };
  return {
    ...snapshot,
    SideDart: resolvedValue("SideDart"),
    FrontDart: resolvedValue("FrontDart"),
    BackDart1: resolvedValue("BackDart1"),
    BackDart2: resolvedValue("BackDart2"),
    WaistShaping: derived.WaistShaping,
    derived,
  };
}

function readHofSleeveParams() {
  const params = collectHofSleeveParams();
  return { ...params };
}

function readAldrichParams() {
  return {
    bust: getNumber("aldrichBust", ALDRICH_DEFAULTS.bust),
    bustEase: getNumber("aldrichBustEase", ALDRICH_DEFAULTS.bustEase),
    waist: getNumber("aldrichWaist", ALDRICH_DEFAULTS.waist),
    waistEase: getNumber("aldrichWaistEase", ALDRICH_DEFAULTS.waistEase),
    hip: getNumber("aldrichHip", ALDRICH_DEFAULTS.hip),
    waistToHip: getNumber("aldrichWaistToHip", ALDRICH_DEFAULTS.waistToHip),
    napeToWaist: getNumber("aldrichNapeToWaist", ALDRICH_DEFAULTS.napeToWaist),
    shoulder: getNumber("aldrichShoulder", ALDRICH_DEFAULTS.shoulder),
    backWidth: getNumber("aldrichBackWidth", ALDRICH_DEFAULTS.backWidth),
    chest: getNumber("aldrichChest", ALDRICH_DEFAULTS.chest),
    armscyeDepth: getNumber(
      "aldrichArmscyeDepth",
      ALDRICH_DEFAULTS.armscyeDepth
    ),
    neckSize: getNumber("aldrichNeckSize", ALDRICH_DEFAULTS.neckSize),
    frontNeckDart: getNumber(
      "aldrichFrontNeckDart",
      ALDRICH_DEFAULTS.frontNeckDart
    ),
    frontWaistDart: getNumber(
      "aldrichFrontWaistDart",
      ALDRICH_DEFAULTS.frontWaistDart
    ),
    backWaistDart: getNumber(
      "aldrichBackWaistDart",
      ALDRICH_DEFAULTS.backWaistDart
    ),
    frontSideWaistDart: getNumber(
      "aldrichFrontSideWaistDart",
      ALDRICH_DEFAULTS.frontSideWaistDart
    ),
    backSideWaistDart: getNumber(
      "aldrichBackSideWaistDart",
      ALDRICH_DEFAULTS.backSideWaistDart
    ),
    frontWaistDartBackOff: getNumber(
      "aldrichFrontWaistDartBackOff",
      ALDRICH_DEFAULTS.frontWaistDartBackOff
    ),
    bustWaistDiff: getNumber(
      "aldrichBustWaistDiff",
      ALDRICH_DEFAULTS.bustWaistDiff
    ),
    closeWaistShaping: getCheckbox("aldrichCloseWaist", true),
    reducedDarting: getCheckbox("aldrichReducedDarting", false),
    showGuides: getCheckbox("aldrichShowGuides", true),
    showMarkers: getCheckbox("aldrichShowMarkers", true),
  };
}

function setInputNumber(id, value, precision = 2) {
  const input = document.getElementById(id);
  if (!input || !Number.isFinite(value)) return;
  const factor = Math.pow(10, precision);
  const rounded = Math.round(value * factor) / factor;
  input.value = rounded;
}

function getAldrichReductionFactor() {
  const reducedToggle = document.getElementById("aldrichReducedDarting");
  return reducedToggle && reducedToggle.checked ? 0.75 : 1;
}

function applyAldrichDartDistribution(diff, options = {}) {
  const reducedToggle = document.getElementById("aldrichReducedDarting");
  const useReduced = reducedToggle && reducedToggle.checked;
  const darts = computeAldrichWaistDartsFromDiff(diff, { reduced: useReduced });
  const { front = 0, back = 0, frontSide = 0, backSide = 0 } = darts;
  const force = options.force === true;
  const skipDiffField = options.skipDiffField === true;
  const resetDartFlags =
    options.resetDartFlags === true || options.resetManual === true;
  const resetDiffFlag =
    options.resetDiffFlag === true || options.resetManual === true;

  if (force || !aldrichAutoState.frontWaistDartEdited) {
    setInputNumber("aldrichFrontWaistDart", front);
  }
  if (force || !aldrichAutoState.backWaistDartEdited) {
    setInputNumber("aldrichBackWaistDart", back);
  }
  if (force || !aldrichAutoState.frontSideWaistDartEdited) {
    setInputNumber("aldrichFrontSideWaistDart", frontSide);
  }
  if (force || !aldrichAutoState.backSideWaistDartEdited) {
    setInputNumber("aldrichBackSideWaistDart", backSide);
  }
  if (
    !skipDiffField &&
    (force || !aldrichAutoState.bustWaistDiffEdited) &&
    Number.isFinite(diff)
  ) {
    setInputNumber("aldrichBustWaistDiff", Math.abs(diff));
  }

  if (resetDartFlags) {
    aldrichAutoState.frontWaistDartEdited = false;
    aldrichAutoState.backWaistDartEdited = false;
    aldrichAutoState.frontSideWaistDartEdited = false;
    aldrichAutoState.backSideWaistDartEdited = false;
  }
  if (resetDiffFlag) {
    aldrichAutoState.bustWaistDiffEdited = false;
  }
}

function updateAldrichDerivedFields(options = {}) {
  const bust = getNumber("aldrichBust", ALDRICH_DEFAULTS.bust);
  const waist = getNumber("aldrichWaist", ALDRICH_DEFAULTS.waist);
  const bustEase = getNumber("aldrichBustEase", ALDRICH_DEFAULTS.bustEase);
  const waistEase = getNumber("aldrichWaistEase", ALDRICH_DEFAULTS.waistEase);
  const force = options.force === true;
  const resetManual = options.resetManual === true;
  if (resetManual) {
    aldrichAutoState.frontNeckDartEdited = false;
    aldrichAutoState.bustWaistDiffEdited = false;
  }
  const frontNeck = computeAldrichFrontNeckDart(bust);
  if (
    Number.isFinite(frontNeck) &&
    (force || !aldrichAutoState.frontNeckDartEdited)
  ) {
    setInputNumber("aldrichFrontNeckDart", frontNeck);
  }
  const diff = computeAldrichWaistDiff(bust, waist, bustEase, waistEase);
  const manualDiffLocked = aldrichAutoState.bustWaistDiffEdited && !resetManual;
  if (Number.isFinite(diff) && !manualDiffLocked) {
    applyAldrichDartDistribution(diff, {
      force,
      resetDartFlags: resetManual,
      resetDiffFlag: resetManual,
    });
  }
}

function initAldrichAutoFields() {
  if (aldrichAutoInitialized) return;
  aldrichAutoInitialized = true;
  const baseFieldIds = [
    "aldrichBust",
    "aldrichBustEase",
    "aldrichWaist",
    "aldrichWaistEase",
    "aldrichChest",
    "aldrichBackWidth",
    "aldrichHip",
    "aldrichWaistToHip",
    "aldrichNapeToWaist",
    "aldrichShoulder",
    "aldrichArmscyeDepth",
    "aldrichNeckSize",
  ];
  baseFieldIds.forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    ["input", "change"].forEach((evt) => {
      input.addEventListener(evt, () => updateAldrichDerivedFields());
    });
  });

  const frontNeckInput = document.getElementById("aldrichFrontNeckDart");
  if (frontNeckInput) {
    frontNeckInput.addEventListener("input", () => {
      aldrichAutoState.frontNeckDartEdited = true;
    });
  }

  [
    ["aldrichFrontWaistDart", "frontWaistDartEdited"],
    ["aldrichBackWaistDart", "backWaistDartEdited"],
    ["aldrichFrontSideWaistDart", "frontSideWaistDartEdited"],
    ["aldrichBackSideWaistDart", "backSideWaistDartEdited"],
  ].forEach(([id, flag]) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener("input", () => {
      aldrichAutoState[flag] = true;
      aldrichAutoState.bustWaistDiffEdited = false;
    });
  });

  const bustWaistInput = document.getElementById("aldrichBustWaistDiff");
  if (bustWaistInput) {
    bustWaistInput.addEventListener("input", () => {
      aldrichAutoState.bustWaistDiffEdited = true;
    });
    bustWaistInput.addEventListener("change", () => {
      const diffVal = parseFloat(bustWaistInput.value);
      if (Number.isFinite(diffVal)) {
        applyAldrichDartDistribution(diffVal, {
          force: true,
          resetDartFlags: true,
          skipDiffField: true,
        });
        aldrichAutoState.bustWaistDiffEdited = true;
        scheduleRegen();
      }
    });
  }

  const closeToggle = document.getElementById("aldrichCloseWaist");
  const reducedToggle = document.getElementById("aldrichReducedDarting");
  if (closeToggle && reducedToggle) {
    closeToggle.addEventListener("change", () => {
      if (closeToggle.checked) {
        reducedToggle.checked = false;
      } else if (!reducedToggle.checked) {
        closeToggle.checked = true;
      }
      updateAldrichDerivedFields({ force: true, resetManual: true });
      scheduleRegen();
    });
    reducedToggle.addEventListener("change", () => {
      if (reducedToggle.checked) {
        closeToggle.checked = false;
      } else if (!closeToggle.checked) {
        closeToggle.checked = true;
      }
      updateAldrichDerivedFields({ force: true, resetManual: true });
      scheduleRegen();
    });
  }

  updateAldrichDerivedFields({ force: true, resetManual: true });
}

function getNumber(id, fallback) {
  const input = document.getElementById(id);
  if (!input) return fallback;
  const value = parseFloat(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function getCheckbox(id, fallback) {
  const input = document.getElementById(id);
  if (!input) return fallback;
  return input.checked;
}

function downloadSVG(svg, filename = "armstrong_bodice.svg") {
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

const layerManager = {
  overlay: null,
  list: null,
  layers: [],
  closeButton: null,
  isOpen: false,
};
const DRAFT_COLOR_PALETTE = [
  "#111111",
  "#b91c1c",
  "#0f766e",
  "#c026d3",
  "#eab308",
  "#0ea5e9",
  "#16a34a",
  "#f97316",
];
const DUPLICATE_COLOR_PALETTE = [
  "#b91c1c",
  "#0f766e",
  "#7c3aed",
  "#2563eb",
  "#b45309",
  "#0f172a",
  "#047857",
  "#c026d3",
];
const draftStores = {
  armstrong: createDraftStore(),
  aldrich: createDraftStore(),
  hofenbitzerCasual: createDraftStore(),
  hofenbitzerBasicSkirt: createDraftStore(),
  hofenbitzerWideSleeve: createDraftStore(),
};
let activePatternKey = "armstrong";
const svgSerializer = new XMLSerializer();
const svgDomParser = typeof DOMParser !== "undefined" ? new DOMParser() : null;
const previewPointers = new Map();
const patternDefaultInputs = {};
const previewZoomState = {
  scale: 1,
  translateX: 0,
  translateY: 0,
  minScale: 0.5,
  maxScale: 3,
  pinchStartDistance: 0,
  pinchStartScale: 1,
  wheelStep: 1.02, // make zoom steps small for smoother feel
  pinchStepClamp: 0.04, // cap pinch delta per move
};
// Arrow key nudge size: 1/64" feels less jumpy than 1/32"
const NUDGE_STEP_PX = 96 / 64;
const draftDragState = {
  pointerId: null,
  draftId: null,
  startX: 0,
  startY: 0,
  startOffsetX: 0,
  startOffsetY: 0,
};

function createDraftStore() {
  return {
    drafts: [],
    activeId: null,
    counter: 1,
  };
}

let preview = null;
let previewViewport = null;
let previewZoomInitialized = false;
let currentSvg = null;
let regenTimer = null;
let patternSelect = null;
let armstrongControls = null;
let patternPlaceholder = null;
let appInitialized = false;
let aldrichAutoInitialized = false;
let panOverrideActive = false; // Space-hold pans instead of dragging drafts
const aldrichAutoState = {
  frontNeckDartEdited: false,
  frontWaistDartEdited: false,
  backWaistDartEdited: false,
  frontSideWaistDartEdited: false,
  backSideWaistDartEdited: false,
  bustWaistDiffEdited: false,
};
const PATTERN_CONFIGS = {
  armstrong: {
    title: "Armstrong's Bodice",
    elementId: "armstrongControls",
    readParams: readArmstrongParams,
    generate: generateArmstrong,
    downloadId: "download",
    downloadAllId: "downloadAllArmstrong",
    shareId: "share",
    filename: "armstrong_bodice.svg",
    stackFilename: "armstrong_bodice_drafts.svg",
    duplicateId: "duplicateDraftArmstrong",
    layerButtonId: "manageLayersArmstrong",
    draftListId: "draftListArmstrong",
  },
  aldrich: {
    title: "Aldrich's Close Fitting Bodice",
    elementId: "aldrichControls",
    readParams: readAldrichParams,
    generate: generateAldrich,
    downloadId: "downloadAldrich",
    downloadAllId: "downloadAllAldrich",
    shareId: "shareAldrich",
    filename: "aldrich_close_fitting_bodice.svg",
    stackFilename: "aldrich_close_fitting_bodice_drafts.svg",
    duplicateId: "duplicateDraftAldrich",
    layerButtonId: "manageLayersAldrich",
    draftListId: "draftListAldrich",
  },
  hofenbitzerCasual: {
    title: "Hofenbitzer's Casual Bodice",
    elementId: "hofenbitzerControls",
    readParams: readHofenbitzerParams,
    generate: generateHofenbitzerCasualBodice,
    downloadId: "downloadHofenbitzer",
    downloadAllId: "downloadAllHofenbitzer",
    shareId: "shareHofenbitzer",
    filename: "hofenbitzer_casual_bodice.svg",
    stackFilename: "hofenbitzer_casual_bodice_drafts.svg",
    duplicateId: "duplicateDraftHofenbitzer",
    layerButtonId: "manageLayersHofenbitzer",
    draftListId: "draftListHofenbitzer",
  },
  hofenbitzerBasicSkirt: {
    title: "Hofenbitzer's Basic Skirt",
    elementId: "hofenbitzerSkirtControls",
    readParams: readHofSkirtParams,
    generate: generateHofenbitzerBasicSkirt,
    downloadId: "downloadHofenbitzerSkirt",
    downloadAllId: "downloadAllHofenbitzerSkirt",
    shareId: "shareHofenbitzerSkirt",
    filename: "hofenbitzer_basic_skirt.svg",
    stackFilename: "hofenbitzer_basic_skirt_drafts.svg",
    duplicateId: "duplicateDraftHofenbitzerSkirt",
    layerButtonId: "manageLayersHofenbitzerSkirt",
    draftListId: "draftListHofenbitzerSkirt",
  },
  hofenbitzerWideSleeve: {
    title: "Hofenbitzer's Wide Basic Sleeve",
    elementId: "hofenbitzerSleeveControls",
    readParams: readHofSleeveParams,
    generate: generateHofenbitzerWideBasicSleeve,
    downloadId: "downloadHofenbitzerSleeve",
    downloadAllId: "downloadAllHofenbitzerSleeve",
    shareId: "shareHofenbitzerSleeve",
    filename: "hofenbitzer_wide_basic_sleeve.svg",
    stackFilename: "hofenbitzer_wide_basic_sleeve_drafts.svg",
    duplicateId: "duplicateDraftHofenbitzerSleeve",
    layerButtonId: "manageLayersHofenbitzerSleeve",
    draftListId: "draftListHofenbitzerSleeve",
  },
};

function regen() {
  if (regenTimer) {
    clearTimeout(regenTimer);
    regenTimer = null;
  }
  if (!preview) return;
  const patternKey = getCurrentPatternKey();
  const config = PATTERN_CONFIGS[patternKey];
  if (!config) {
    const label = patternSelect
      ? patternSelect.options[patternSelect.selectedIndex]?.text || "This draft"
      : "This draft";
    showPreviewMessage(`${label} is coming soon.`);
    currentSvg = null;
    return;
  }
  ensureInitialDraft(patternKey);
  persistActiveDraftInputs(patternKey);
  if (patternKey === "aldrich") {
    updateAldrichDerivedFields();
  }
  const svg = config.generate(config.readParams());
  const activeDraft = getActiveDraft(patternKey);
  if (svg && activeDraft) {
    applyDraftColor(svg, activeDraft.color, true);
    activeDraft.svgMarkup = svgSerializer.serializeToString(svg);
  }
  renderDraftPreviews(patternKey, svg);
  renderDraftList(patternKey);
  hydrateLayerTools(currentSvg);
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem("patternhub:lastPattern", patternKey);
    } catch (errStorePattern) {
      console.warn("Unable to persist pattern selection:", errStorePattern);
    }
  }
}

function initDraftManager() {
  Object.keys(PATTERN_CONFIGS).forEach((patternKey) => {
    ensureInitialDraft(patternKey);
  });
}

function ensureInitialDraft(patternKey) {
  const store = getDraftStore(patternKey);
  if (!store || store.drafts.length) return;
  applyPatternDefaults(patternKey);
  const inputState = captureInputState(patternKey);
  const draft = createDraft(patternKey, inputState);
  store.drafts.push(draft);
  store.activeId = draft.id;
}

function createDraft(patternKey, inputState = {}) {
  const store = getDraftStore(patternKey);
  if (!store) return null;
  const draftNumber = store.counter++;
  return {
    id: `${patternKey}-draft-${draftNumber}`,
    name: `Draft ${draftNumber}`,
    pattern: patternKey,
    inputState: cloneInputState(inputState),
    svgMarkup: null,
    visible: true,
    createdAt: Date.now(),
    color: DRAFT_COLOR_PALETTE[(draftNumber - 1) % DRAFT_COLOR_PALETTE.length],
    offsetX: 0,
    offsetY: 0,
  };
}

function cloneInputState(state = {}) {
  const clone = {};
  Object.keys(state || {}).forEach((key) => {
    const value = state[key];
    clone[key] = value ? { ...value } : value;
  });
  return clone;
}

function captureDefaultInputState(patternKey) {
  const config = PATTERN_CONFIGS[patternKey];
  const section = config?.elementId
    ? document.getElementById(config.elementId)
    : null;
  const state = {};
  if (!section) return state;
  section.querySelectorAll("input, select, textarea").forEach((el) => {
    if (!el.id) return;
    if (el.type === "checkbox") {
      state[el.id] = { type: "checkbox", value: el.defaultChecked };
    } else if (el.tagName === "SELECT") {
      const defaultOption =
        Array.from(el.options).find((opt) => opt.defaultSelected) ||
        el.options[0];
      const value = defaultOption ? defaultOption.value : el.value || "";
      state[el.id] = { type: "value", value };
    } else {
      state[el.id] = {
        type: "value",
        value: el.defaultValue ?? el.value ?? "",
      };
    }
  });
  return state;
}

function recordPatternDefaults() {
  Object.keys(PATTERN_CONFIGS).forEach((patternKey) => {
    patternDefaultInputs[patternKey] =
      captureDefaultInputState(patternKey) || {};
  });
}

function applyPatternDefaults(patternKey) {
  const defaults = patternDefaultInputs[patternKey];
  if (!defaults) return;
  applyInputState(patternKey, defaults);
}

function captureInputState(patternKey) {
  const config = PATTERN_CONFIGS[patternKey];
  const section = config?.elementId
    ? document.getElementById(config.elementId)
    : null;
  const state = {};
  if (!section) return state;
  section.querySelectorAll("input, select, textarea").forEach((el) => {
    if (!el.id) return;
    if (el.type === "checkbox") {
      state[el.id] = { type: "checkbox", value: el.checked };
    } else {
      state[el.id] = { type: "value", value: el.value };
    }
  });
  return state;
}

function applyInputState(patternKey, state = {}) {
  Object.entries(state || {}).forEach(([id, entry]) => {
    const el = document.getElementById(id);
    if (!el || !entry) return;
    if (entry.type === "checkbox") {
      el.checked = Boolean(entry.value);
    } else {
      el.value = entry.value ?? "";
    }
  });
  if (patternKey === "hofenbitzerBasicSkirt") {
    initHofSkirtControls();
    hydrateHofSkirtManualOverridesFromDom();
    updateHofSkirtDerivedFields();
  }
}

function applyActiveDraftInputs(patternKey) {
  const activeDraft = getActiveDraft(patternKey);
  if (!activeDraft) return;
  applyInputState(patternKey, activeDraft.inputState);
}

function resetPatternInputs(patternKey) {
  applyPatternDefaults(patternKey);
  persistActiveDraftInputs(patternKey);
  regen();
}

function getDraftStore(patternKey) {
  return draftStores[patternKey];
}

function getActiveDraft(patternKey) {
  const store = getDraftStore(patternKey);
  if (!store) return null;
  return (
    store.drafts.find((draft) => draft.id === store.activeId) ||
    store.drafts[0] ||
    null
  );
}

function renderDraftList(patternKey) {
  const config = PATTERN_CONFIGS[patternKey];
  const containerId = config?.draftListId;
  const container = containerId ? document.getElementById(containerId) : null;
  if (!container) return;
  container.innerHTML = "";
  const store = getDraftStore(patternKey);
  if (!store || !store.drafts.length) {
    const empty = document.createElement("p");
    empty.className = "draft-panel__empty";
    empty.textContent = "Duplicate the draft to start comparing.";
    container.appendChild(empty);
    return;
  }
  store.drafts.forEach((draft) => {
    const row = document.createElement("div");
    row.className = "draft-entry";
    if (draft.id === store.activeId) {
      row.classList.add("is-active");
    }
    const swatch = document.createElement("span");
    swatch.className = "draft-entry__swatch";
    swatch.style.background = draft.color || "#94a3b8";
    row.appendChild(swatch);
    const selectBtn = document.createElement("button");
    selectBtn.type = "button";
    selectBtn.className = "draft-entry__select";
    selectBtn.textContent = draft.name;
    selectBtn.addEventListener("click", () =>
      selectDraft(patternKey, draft.id)
    );
    const visibilityLabel = document.createElement("label");
    visibilityLabel.className = "draft-entry__visibility";
    visibilityLabel.title = "Show or hide this draft in the preview";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = draft.visible !== false;
    checkbox.addEventListener("change", () => {
      toggleDraftVisibility(patternKey, draft.id, checkbox.checked);
    });
    const visText = document.createElement("span");
    visText.textContent = "Show";
    visibilityLabel.appendChild(checkbox);
    visibilityLabel.appendChild(visText);
    row.appendChild(selectBtn);
    row.appendChild(visibilityLabel);
    container.appendChild(row);
  });
}

function renderDraftPreviews(patternKey, liveSvg = null) {
  const target = getPreviewTarget();
  if (!target) return;
  target.innerHTML = "";
  resetPreviewZoom();
  currentSvg = null;
  const store = getDraftStore(patternKey);
  if (!store || !store.drafts.length) {
    showPreviewMessage("Duplicate a draft to start comparing.");
    return;
  }
  if (!store.activeId && store.drafts.length) {
    store.activeId = store.drafts[0].id;
  }
  if (store.activeId) {
    const activeDraftExists = store.drafts.some(
      (draft) => draft.id === store.activeId && draft.visible
    );
    if (!activeDraftExists) {
      const firstVisible = store.drafts.find((draft) => draft.visible);
      if (firstVisible) {
        store.activeId = firstVisible.id;
      }
    }
  }
  const activeId = store.activeId;
  let visibleCount = 0;
  store.drafts.forEach((draft) => {
    if (!draft.visible || !draft.svgMarkup) return;
    let svgNode = null;
    const isActive = draft.id === activeId;
    if (isActive && liveSvg) {
      svgNode = liveSvg;
    } else {
      svgNode = importSvgMarkup(draft.svgMarkup);
    }
    if (!svgNode) return;
    const wrapper = document.createElement("div");
    wrapper.className = "preview-draft";
    wrapper.dataset.draftId = draft.id;
    wrapper.classList.toggle("is-active", isActive);
    applyDraftOffset(wrapper, draft);
    applyDraftColor(svgNode, draft.color, isActive);
    wrapper.appendChild(svgNode);
    target.appendChild(wrapper);
    if (isActive) {
      currentSvg = svgNode;
    }
    visibleCount += 1;
  });
  if (!visibleCount) {
    showPreviewMessage("Duplicate a draft to start comparing.");
  }
}

function importSvgMarkup(markup) {
  if (!markup) return null;
  if (svgDomParser) {
    const doc = svgDomParser.parseFromString(markup, "image/svg+xml");
    const svg = doc.documentElement;
    return document.importNode ? document.importNode(svg, true) : svg;
  }
  const wrapper = document.createElement("div");
  wrapper.innerHTML = markup.trim();
  return wrapper.firstElementChild;
}

function applyDraftColor(svgNode, color, emphasize = false) {
  if (!svgNode) return;
  const accent = color || "#2563eb";
  const strokeColor = emphasize ? accent : mixColor(accent, "#ffffff", 0.2);
  const fillColor = emphasize
    ? mixColor(accent, "#ffffff", 0.1)
    : mixColor(accent, "#ffffff", 0.45);
  svgNode.style.opacity = emphasize ? 1 : 0.95;
  const strokeTargets = svgNode.querySelectorAll(
    "path,line,polyline,polygon,rect,circle,ellipse"
  );
  strokeTargets.forEach((node) => {
    const stroke = node.getAttribute("stroke");
    if (stroke && stroke.toLowerCase() !== "none") {
      node.setAttribute("stroke", strokeColor);
    }
    const fill = node.getAttribute("fill");
    if (fill && fill.toLowerCase() !== "none" && node.tagName !== "path") {
      node.setAttribute("fill", fillColor);
    }
  });
  svgNode.querySelectorAll("text").forEach((node) => {
    const isMarker = isMarkerNumberText(node);
    node.setAttribute("fill", isMarker ? "#ffffff" : strokeColor);
  });
}

function applyDraftOffset(wrapper, draft) {
  if (!wrapper || !draft) return;
  const x = Number.isFinite(draft.offsetX) ? draft.offsetX : 0;
  const y = Number.isFinite(draft.offsetY) ? draft.offsetY : 0;
  wrapper.style.transform = `translate(${x}px, ${y}px)`;
}

function isMarkerNumberText(node) {
  if (!node) return false;
  let current = node;
  while (current && current !== current.ownerSVGElement) {
    const layerName =
      current.getAttribute && current.getAttribute("data-layer");
    if (layerName && /numbers|letters/i.test(layerName)) {
      return true;
    }
    current = current.parentNode;
  }
  return false;
}

function mixColor(baseHex, mixHex, ratio = 0.5) {
  const base = hexToRgb(baseHex);
  const mix = hexToRgb(mixHex);
  if (!base || !mix) return baseHex || "#94a3b8";
  const r = Math.round(base.r * (1 - ratio) + mix.r * ratio);
  const g = Math.round(base.g * (1 - ratio) + mix.g * ratio);
  const b = Math.round(base.b * (1 - ratio) + mix.b * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
  if (!hex) return null;
  let normalized = hex.trim();
  if (normalized.startsWith("#")) normalized = normalized.slice(1);
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (normalized.length !== 6) return null;
  const num = parseInt(normalized, 16);
  if (Number.isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function recolorSvgMarkup(markup, color) {
  const svgNode = importSvgMarkup(markup);
  if (!svgNode) return markup;
  applyDraftColor(svgNode, color, false);
  return svgSerializer.serializeToString(svgNode);
}

function getCurrentPatternKey() {
  if (patternSelect && patternSelect.value) {
    return patternSelect.value;
  }
  return activePatternKey || "armstrong";
}

function persistActiveDraftInputs(patternKey) {
  const store = getDraftStore(patternKey);
  if (!store || !store.activeId) return;
  const activeDraft = getActiveDraft(patternKey);
  if (!activeDraft) return;
  activeDraft.inputState = captureInputState(patternKey);
}

function persistActiveDraftSvg() {
  const patternKey = getCurrentPatternKey();
  const activeDraft = getActiveDraft(patternKey);
  if (!activeDraft || !currentSvg) return;
  activeDraft.svgMarkup = svgSerializer.serializeToString(currentSvg);
}

function duplicateCurrentDraft(patternKey) {
  ensureInitialDraft(patternKey);
  const store = getDraftStore(patternKey);
  const activeDraft = getActiveDraft(patternKey);
  if (!store || !activeDraft) return;
  persistActiveDraftInputs(patternKey);
  const newDraft = createDraft(patternKey, activeDraft.inputState);
  if (!newDraft) return;
  newDraft.offsetX = activeDraft.offsetX || 0;
  newDraft.offsetY = activeDraft.offsetY || 0;
  newDraft.svgMarkup = recolorSvgMarkup(activeDraft.svgMarkup, newDraft.color);
  store.drafts.push(newDraft);
  store.activeId = newDraft.id;
  applyActiveDraftInputs(patternKey);
  renderDraftList(patternKey);
  renderDraftPreviews(patternKey);
  hydrateLayerTools(currentSvg);
}

function selectDraft(patternKey, draftId) {
  const store = getDraftStore(patternKey);
  if (!store || store.activeId === draftId) return;
  persistActiveDraftInputs(patternKey);
  store.activeId = draftId;
  applyActiveDraftInputs(patternKey);
  renderDraftList(patternKey);
  regen();
}

function toggleDraftVisibility(patternKey, draftId, targetVisible) {
  const store = getDraftStore(patternKey);
  if (!store) return;
  const draft = store.drafts.find((entry) => entry.id === draftId);
  if (!draft) return;
  const nextVisible =
    typeof targetVisible === "boolean" ? targetVisible : !draft.visible;
  if (nextVisible === draft.visible) return;
  if (!nextVisible && draft.id === store.activeId) {
    alert("Select another draft before hiding this one.");
    renderDraftList(patternKey);
    return;
  }
  draft.visible = nextVisible;
  renderDraftList(patternKey);
  renderDraftPreviews(patternKey);
  hydrateLayerTools(currentSvg);
}

function ensurePatternSelection(patternKey) {
  if (!patternSelect || patternSelect.value === patternKey) return;
  patternSelect.value = patternKey;
  patternSelect.dispatchEvent(new Event("change", { bubbles: true }));
}

const scheduleRegen = () => {
  clearTimeout(regenTimer);
  regenTimer = setTimeout(regen, 200);
};

function initApp() {
  if (appInitialized) return;
  appInitialized = true;

  preview = document.getElementById("preview");
  previewViewport = preview ? preview.querySelector("#previewViewport") : null;
  if (preview) {
    getPreviewTarget();
    initPreviewInteractions();
    resetPreviewZoom();
  }
  patternSelect = document.getElementById("patternSelect");
  let initialPattern = "armstrong";
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const storedPattern = window.localStorage.getItem(
        "patternhub:lastPattern"
      );
      if (storedPattern && PATTERN_CONFIGS[storedPattern]) {
        initialPattern = storedPattern;
      }
    } catch (errLoadPattern) {
      console.warn(
        "Unable to read pattern selection from storage:",
        errLoadPattern
      );
    }
  }
  if (
    patternSelect &&
    patternSelect.value !== initialPattern &&
    PATTERN_CONFIGS[initialPattern]
  ) {
    patternSelect.value = initialPattern;
  }
  activePatternKey = patternSelect
    ? patternSelect.value || initialPattern
    : initialPattern;
  armstrongControls = document.getElementById("armstrongControls");
  patternPlaceholder = document.getElementById("patternPlaceholder");
  enhancePatternSelect();
  enhanceBustCupSelect();
  enhanceFitProfileSelect();
  initAldrichAutoFields();
  initHofenbitzerControls();
  initHofSleeveControls();
  initHofSkirtControls();
  initLayerTools();
  recordPatternDefaults();
  applyPatternDefaults(activePatternKey);
  initDraftManager();
  Object.entries(PATTERN_CONFIGS).forEach(([key, config]) => {
    if (!config) return;
    const downloadButton = config.downloadId
      ? document.getElementById(config.downloadId)
      : null;
    if (downloadButton) {
      downloadButton.addEventListener("click", () => {
        ensurePatternSelection(key);
        if (!currentSvg) regen();
        if (currentSvg)
          downloadSVG(currentSvg, config.filename || `${key}.svg`);
      });
    }
    const downloadAllButton = config.downloadAllId
      ? document.getElementById(config.downloadAllId)
      : null;
    if (downloadAllButton) {
      downloadAllButton.addEventListener("click", () => {
        ensurePatternSelection(key);
        downloadAllDrafts(key);
      });
    }

    const shareButton = config.shareId
      ? document.getElementById(config.shareId)
      : null;
    if (shareButton) {
      const defaultShareLabel = shareButton.textContent;
      shareButton.addEventListener("click", async () => {
        ensurePatternSelection(key);
        const title = config.title || "Pattern Draft";
        try {
          if (navigator.share) {
            await navigator.share({
              title,
              url: SHARE_URL || window.location.href,
            });
          } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(
              SHARE_URL || window.location.href
            );
            shareButton.textContent = "Link Copied!";
            setTimeout(
              () => (shareButton.textContent = defaultShareLabel),
              1500
            );
          } else {
            window.open(SHARE_URL || window.location.href, "_blank");
          }
        } catch (err) {
          console.error("Share failed:", err);
        }
      });
    }

    const duplicateButton = config.duplicateId
      ? document.getElementById(config.duplicateId)
      : null;
    if (duplicateButton) {
      duplicateButton.addEventListener("click", () => {
        ensurePatternSelection(key);
        duplicateCurrentDraft(key);
      });
    }

    const manageButton = config.layerButtonId
      ? document.getElementById(config.layerButtonId)
      : null;
    if (manageButton) {
      manageButton.addEventListener("click", () => {
        ensurePatternSelection(key);
        resetPatternInputs(key);
      });
    }
  });

  document
    .querySelectorAll(".controls input, .controls select")
    .forEach((el) => {
      if (el.id === "download" || el.id === "patternSelect") {
        return;
      }
      const type = el.type || el.tagName;
      if (type === "checkbox" || el.tagName === "SELECT") {
        el.addEventListener("change", scheduleRegen);
      } else if (type === "number" || type === "text") {
        el.addEventListener("input", scheduleRegen);
      }
    });

  if (patternSelect) {
    patternSelect.addEventListener("change", () => {
      const nextPattern = patternSelect.value || "armstrong";
      persistActiveDraftInputs(activePatternKey);
      activePatternKey = nextPattern;
      ensureInitialDraft(activePatternKey);
      applyActiveDraftInputs(activePatternKey);
      updatePatternVisibility();
      renderDraftList(activePatternKey);
      regen();
    });
  }

  applyActiveDraftInputs(activePatternKey);
  updatePatternVisibility();
  renderDraftList(activePatternKey);
  regen();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

function enhancePatternSelect() {
  const select = document.getElementById("patternSelect");
  if (!select || select.dataset.enhanced === "true") return;
  const label = select.closest(".pattern-picker label");
  if (!label) return;

  const dropdown = document.createElement("div");
  dropdown.className = "pattern-dropdown";
  dropdown.dataset.patternDropdown = "true";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "pattern-dropdown__toggle";
  toggle.setAttribute("aria-haspopup", "listbox");
  toggle.setAttribute("aria-expanded", "false");
  dropdown.appendChild(toggle);

  const menu = document.createElement("div");
  menu.className = "pattern-dropdown__menu";
  menu.setAttribute("role", "listbox");
  dropdown.appendChild(menu);

  label.insertBefore(dropdown, select);

  const optionButtons = [];

  const createOptionButton = (option) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pattern-dropdown__option";
    btn.setAttribute("role", "option");
    btn.dataset.value = option.value;
    btn.textContent = option.textContent;
    if (option.disabled) {
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
    }
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      if (select.value !== option.value) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      closeMenu();
    });
    optionButtons.push(btn);
    return btn;
  };

  const appendOption = (container, option) => {
    container.appendChild(createOptionButton(option));
  };

  const defaultGroup = document.createElement("div");
  defaultGroup.className = "pattern-dropdown__group";

  Array.from(select.children).forEach((child) => {
    if (child.tagName === "OPTGROUP") {
      const group = document.createElement("div");
      group.className = "pattern-dropdown__group";
      if (child.label) {
        const heading = document.createElement("p");
        heading.className = "pattern-dropdown__group-title";
        heading.textContent = child.label;
        group.appendChild(heading);
      }
      Array.from(child.children).forEach((option) =>
        appendOption(group, option)
      );
      menu.appendChild(group);
    } else if (child.tagName === "OPTION") {
      appendOption(defaultGroup, child);
    }
  });

  if (defaultGroup.children.length) {
    menu.insertBefore(defaultGroup, menu.firstChild);
  }

  const syncSelection = () => {
    const selectedOption = select.options[select.selectedIndex];
    toggle.textContent = selectedOption
      ? selectedOption.textContent
      : "Select a draft";
    optionButtons.forEach((btn) => {
      const isSelected = btn.dataset.value === select.value;
      btn.classList.toggle("is-selected", isSelected);
      btn.setAttribute("aria-selected", isSelected ? "true" : "false");
    });
  };

  const closeMenu = () => {
    dropdown.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    dropdown.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
  };

  toggle.addEventListener("click", () => {
    if (dropdown.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) {
      closeMenu();
    }
  });

  dropdown.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      toggle.focus();
    }
  });

  dropdown.addEventListener("focusout", (event) => {
    if (!dropdown.contains(event.relatedTarget)) {
      closeMenu();
    }
  });

  select.addEventListener("change", syncSelection);

  syncSelection();
  select.dataset.enhanced = "true";
  select.classList.add("pattern-picker__native");
}

function enhanceMiniDropdownSelect(select, options = {}) {
  if (!select || select.dataset.miniDropdown === "true") return;
  const host = options.host || select.parentElement;
  if (!host) return;
  const placeholder = options.placeholder || "Select";

  const dropdown = document.createElement("div");
  dropdown.className = "mini-dropdown";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "mini-dropdown__toggle";
  toggle.setAttribute("aria-haspopup", "listbox");
  toggle.setAttribute("aria-expanded", "false");
  dropdown.appendChild(toggle);

  const menu = document.createElement("div");
  menu.className = "mini-dropdown__menu";
  menu.setAttribute("role", "listbox");
  dropdown.appendChild(menu);

  host.insertBefore(dropdown, select);
  select.classList.add("mini-dropdown__native");

  const buttons = [];

  const sync = () => {
    const selectedOption = select.options[select.selectedIndex];
    toggle.textContent = selectedOption
      ? selectedOption.textContent
      : placeholder;
    buttons.forEach((btn) => {
      const isSelected = btn.dataset.value === select.value;
      btn.classList.toggle("is-selected", isSelected);
      btn.setAttribute("aria-selected", isSelected ? "true" : "false");
    });
  };

  Array.from(select.options).forEach((option) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mini-dropdown__option";
    btn.dataset.value = option.value;
    btn.textContent = option.textContent;
    if (option.disabled) {
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
    }
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      if (select.value !== option.value) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      closeMenu();
    });
    buttons.push(btn);
    menu.appendChild(btn);
  });

  const closeMenu = () => {
    dropdown.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    dropdown.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
  };

  toggle.addEventListener("click", () => {
    if (dropdown.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) {
      closeMenu();
    }
  });

  dropdown.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      toggle.focus();
    }
  });

  dropdown.addEventListener("focusout", (event) => {
    if (!dropdown.contains(event.relatedTarget)) {
      closeMenu();
    }
  });

  select.addEventListener("change", sync);
  sync();

  select.dataset.miniDropdown = "true";
  select.dataset.enhanced = "true";
}

function enhanceBustCupSelect() {
  const select = document.getElementById("bustCup");
  enhanceMiniDropdownSelect(select, { placeholder: "Select" });
}

function enhanceFitProfileSelect() {
  const select = document.getElementById("hofenbitzerFitProfile");
  const host = select?.closest(".hof-fit-control__select");
  enhanceMiniDropdownSelect(select, { host, placeholder: "Select Fit" });
}

function updatePatternVisibility() {
  const selectedValue = patternSelect ? patternSelect.value : "armstrong";
  let hasVisibleSection = false;

  Object.entries(PATTERN_CONFIGS).forEach(([key, config]) => {
    const section = config.elementId
      ? document.getElementById(config.elementId)
      : null;
    if (!section) return;
    if (key === selectedValue) {
      section.hidden = false;
      hasVisibleSection = true;
    } else {
      section.hidden = true;
    }
  });

  if (!patternPlaceholder) {
    return;
  }

  if (hasVisibleSection) {
    patternPlaceholder.hidden = true;
    return;
  }

  patternPlaceholder.hidden = false;
  const label =
    patternSelect?.options[patternSelect.selectedIndex]?.text || "This draft";
  const placeholderMessage = patternPlaceholder.querySelector("p");
  if (placeholderMessage) {
    placeholderMessage.textContent = `${label} is coming soon.`;
  }
  clearPreviewContent();
  showPreviewMessage(`${label} is coming soon.`);
}

function initLayerTools() {
  if (layerManager.list || typeof document === "undefined") return;
  layerManager.overlay = document.getElementById("layerToolsModal");
  layerManager.list = document.getElementById("layerList");
  layerManager.closeButton = document.getElementById("closeLayerModal");
  const exportButton = document.getElementById("exportVisibleLayers");
  if (exportButton) {
    exportButton.addEventListener("click", exportVisibleLayers);
  }
  if (layerManager.closeButton) {
    layerManager.closeButton.addEventListener("click", closeLayerModal);
  }
  if (layerManager.overlay) {
    layerManager.overlay.addEventListener("click", (event) => {
      if (event.target === layerManager.overlay) {
        closeLayerModal();
      }
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && layerManager.isOpen) {
      closeLayerModal();
    }
  });
  hydrateLayerTools(null);
}

function openLayerModal() {
  if (!layerManager.overlay) return;
  hydrateLayerTools(currentSvg);
  layerManager.overlay.hidden = false;
  layerManager.overlay.setAttribute("aria-hidden", "false");
  layerManager.isOpen = true;
}

function closeLayerModal() {
  if (!layerManager.overlay) return;
  layerManager.overlay.hidden = true;
  layerManager.overlay.setAttribute("aria-hidden", "true");
  layerManager.isOpen = false;
}

function hydrateLayerTools(svg) {
  if (!layerManager.list) return;
  layerManager.layers = [];
  layerManager.list.innerHTML = "";
  if (!svg) {
    layerManager.list.appendChild(
      renderLayerEmptyState("Generate a draft to manage layers.")
    );
    return;
  }
  const nodes = Array.from(
    svg.querySelectorAll('g[inkscape\\:groupmode="layer"]')
  );
  if (!nodes.length) {
    layerManager.list.appendChild(
      renderLayerEmptyState("No SVG layers found for this draft.")
    );
    return;
  }
  nodes.forEach((node) => {
    const entry = buildLayerEntry(node);
    if (!entry) return;
    layerManager.layers.push(entry);
    layerManager.list.appendChild(buildLayerListItem(entry));
  });
}

function renderLayerEmptyState(message) {
  const empty = document.createElement("p");
  empty.className = "layer-list__empty";
  empty.textContent = message;
  return empty;
}

function buildLayerEntry(node) {
  if (!node) return null;
  if (!node.id) {
    const slugBase = slugifyId(node.getAttribute("data-layer") || "layer");
    let attempt = slugBase;
    let index = 1;
    const hostSvg = node.ownerSVGElement || node;
    while (layerIdExists(hostSvg, attempt)) {
      attempt = `${slugBase}-${index++}`;
    }
    node.setAttribute("id", attempt);
  }
  const id = node.id;
  const baseId = node.dataset.baseLayerId || id;
  const copyIndex = parseInt(node.dataset.copyIndex || "", 10);
  const label =
    node.getAttribute("inkscape:label") ||
    node.getAttribute("data-layer") ||
    id ||
    "Layer";
  const visible = isLayerNodeVisible(node);
  const locked =
    node.getAttribute("display") === "none" &&
    node.getAttribute("data-layer-user-hidden") !== "true";
  return {
    id,
    baseId,
    name: label,
    element: node,
    visible: locked ? false : visible,
    locked,
    isCopy:
      node.dataset.isDuplicate === "true" ||
      (Number.isFinite(copyIndex) && copyIndex > 0),
    copyIndex: Number.isFinite(copyIndex) ? copyIndex : null,
  };
}

function buildLayerListItem(entry) {
  const row = document.createElement("div");
  row.className = "layer-list__item";
  if (entry.locked) {
    row.classList.add("is-disabled");
    row.title = "Enable this layer using the pattern toggles.";
  }
  const toggleLabel = document.createElement("label");
  toggleLabel.className = "layer-list__toggle";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = !entry.locked && entry.visible;
  checkbox.disabled = entry.locked;
  checkbox.addEventListener("change", () =>
    setLayerVisibility(entry.id, checkbox.checked)
  );
  const name = document.createElement("span");
  name.textContent =
    entry.isCopy && entry.copyIndex
      ? `${entry.name} (Copy ${entry.copyIndex})`
      : entry.name;
  toggleLabel.appendChild(checkbox);
  toggleLabel.appendChild(name);
  row.appendChild(toggleLabel);

  const actions = document.createElement("div");
  actions.className = "layer-list__actions";
  const duplicateBtn = document.createElement("button");
  duplicateBtn.type = "button";
  duplicateBtn.className = "layer-list__button";
  duplicateBtn.textContent = "Duplicate";
  duplicateBtn.addEventListener("click", () => duplicateLayer(entry.id));
  actions.appendChild(duplicateBtn);
  row.appendChild(actions);
  return row;
}

function setLayerVisibility(layerId, visible) {
  const entry = layerManager.layers.find((layer) => layer.id === layerId);
  if (!entry || entry.locked) return;
  entry.visible = visible;
  setLayerUserHidden(entry.element, !visible);
  persistActiveDraftSvg();
}

function setLayerUserHidden(node, hidden) {
  if (!node) return;
  if (hidden) {
    node.setAttribute("data-layer-user-hidden", "true");
  } else {
    node.removeAttribute("data-layer-user-hidden");
  }
}

function isLayerNodeVisible(node) {
  if (!node) return false;
  if (node.getAttribute("data-layer-user-hidden") === "true") return false;
  const styleDisplay = node.style?.display;
  if (styleDisplay && styleDisplay.toLowerCase() === "none") return false;
  const attrDisplay = node.getAttribute("display");
  if (attrDisplay && attrDisplay.toLowerCase() === "none") return false;
  return true;
}

function getExistingCopyCount(baseId) {
  return layerManager.layers.filter(
    (layer) => layer.baseId === baseId && layer.isCopy
  ).length;
}

function generateCopyId(baseId, index) {
  return `${baseId}-copy${index}`;
}

function findLastLayerElement(baseId) {
  const related = layerManager.layers.filter(
    (layer) => layer.baseId === baseId
  );
  if (!related.length) return null;
  return related[related.length - 1].element;
}

function pickDuplicateColor(index) {
  if (!DUPLICATE_COLOR_PALETTE.length) return null;
  const pos = Math.max(0, (index - 1) % DUPLICATE_COLOR_PALETTE.length);
  return DUPLICATE_COLOR_PALETTE[pos];
}

function recolorLayer(group, color) {
  if (!group || !color) return;
  group
    .querySelectorAll("path,line,polyline,polygon,rect,circle,ellipse")
    .forEach((node) => {
      const stroke = node.getAttribute("stroke");
      if (stroke && stroke.toLowerCase() !== "none") {
        node.setAttribute("stroke", color);
      }
    });
  group.querySelectorAll("text").forEach((node) => {
    const fill = node.getAttribute("fill");
    if (!fill || fill.toLowerCase() !== "none") {
      node.setAttribute("fill", color);
    }
  });
}

function escapeCssId(id) {
  if (typeof CSS !== "undefined" && CSS.escape) {
    return CSS.escape(id);
  }
  return id.replace(/([ #.;?%&,\+\*\~\':"!^$[\]()=>|/@])/g, "\\$1");
}

function layerIdExists(svgRoot, id) {
  if (!svgRoot || !id) return false;
  const selector = `#${escapeCssId(id)}`;
  return Boolean(svgRoot.querySelector(selector));
}

function duplicateLayer(layerId) {
  if (!currentSvg) return;
  const entry = layerManager.layers.find((layer) => layer.id === layerId);
  if (!entry || !entry.element || !entry.element.parentNode) return;
  const baseId = entry.baseId || entry.id;
  const existingCopies = getExistingCopyCount(baseId);
  if (existingCopies >= 15) {
    alert("You can only create up to 15 copies of this layer.");
    return;
  }
  const parentNode = entry.element.parentNode;
  let copyIndex = existingCopies + 1;
  let copyId = generateCopyId(baseId, copyIndex);
  while (layerIdExists(currentSvg, copyId)) {
    copyIndex += 1;
    copyId = generateCopyId(baseId, copyIndex);
  }
  const clone = entry.element.cloneNode(true);
  clone.setAttribute("id", copyId);
  clone.dataset.baseLayerId = baseId;
  clone.dataset.copyIndex = String(copyIndex);
  clone.dataset.isDuplicate = "true";
  clone.removeAttribute("data-layer-user-hidden");
  clone.setAttribute("inkscape:label", `${entry.name} Copy ${copyIndex}`);
  const lastBase = findLastLayerElement(baseId) || entry.element;
  if (lastBase && lastBase.nextSibling) {
    parentNode.insertBefore(clone, lastBase.nextSibling);
  } else {
    parentNode.appendChild(clone);
  }
  recolorLayer(clone, pickDuplicateColor(copyIndex));
  hydrateLayerTools(currentSvg);
  persistActiveDraftSvg();
}

function downloadAllDrafts(patternKey) {
  ensurePatternSelection(patternKey);
  const store = getDraftStore(patternKey);
  if (!store || !store.drafts.length) {
    alert("Generate a draft before downloading all versions.");
    return;
  }
  persistActiveDraftSvg();
  const draftsWithMarkup = store.drafts.filter((draft) => draft.svgMarkup);
  if (!draftsWithMarkup.length) {
    alert("Generate each draft before downloading all versions.");
    return;
  }
  const templateSvg = importSvgMarkup(draftsWithMarkup[0].svgMarkup);
  if (!templateSvg) {
    alert("Unable to prepare the combined SVG.");
    return;
  }
  const combinedSvg = templateSvg.cloneNode(false);
  const combinedDefs = document.createElementNS(NS, "defs");
  let defsAdded = false;
  const appendDefsFrom = (svgNode) => {
    if (!svgNode) return;
    svgNode.querySelectorAll("defs").forEach((defsNode) => {
      Array.from(defsNode.childNodes || []).forEach((child) => {
        combinedDefs.appendChild(child.cloneNode(true));
        defsAdded = true;
      });
    });
  };
  draftsWithMarkup.forEach((draft) => {
    const svgNode = importSvgMarkup(draft.svgMarkup);
    if (!svgNode) return;
    appendDefsFrom(svgNode);
    const layerGroup = document.createElementNS(NS, "g");
    const label = draft.name || draft.id;
    layerGroup.setAttribute("data-draft-id", draft.id);
    layerGroup.setAttribute("data-draft-name", label);
    layerGroup.setAttributeNS(INKSCAPE_NS, "inkscape:groupmode", "layer");
    layerGroup.setAttributeNS(INKSCAPE_NS, "inkscape:label", label);
    if (draft.visible === false) {
      layerGroup.setAttribute("display", "none");
    }
    Array.from(svgNode.childNodes || []).forEach((child) => {
      if (child.nodeType !== 1) {
        if (child.nodeType === 3 && !(child.textContent || "").trim()) {
          return;
        }
        layerGroup.appendChild(child.cloneNode(true));
        return;
      }
      const tag = child.tagName ? child.tagName.toLowerCase() : "";
      if (tag === "defs") {
        return;
      }
      layerGroup.appendChild(child.cloneNode(true));
    });
    combinedSvg.appendChild(layerGroup);
  });
  if (defsAdded) {
    combinedSvg.insertBefore(combinedDefs, combinedSvg.firstChild);
  }
  const filename =
    PATTERN_CONFIGS[patternKey]?.stackFilename || `${patternKey}_drafts.svg`;
  downloadSVG(combinedSvg, filename);
}

function exportVisibleLayers() {
  if (!currentSvg) {
    alert("Generate a draft before exporting layers.");
    return;
  }
  const exportSvg = currentSvg.cloneNode(true);
  const exportLayers = Array.from(
    exportSvg.querySelectorAll('g[inkscape\\:groupmode="layer"]')
  );
  let kept = 0;
  exportLayers.forEach((node) => {
    if (node.getAttribute("data-layer-user-hidden") === "true") {
      node.remove();
      return;
    }
    const attrDisplay = node.getAttribute("display");
    if (attrDisplay && attrDisplay.toLowerCase() === "none") {
      node.remove();
      return;
    }
    kept += 1;
    node.removeAttribute("data-layer-user-hidden");
  });
  if (!kept) {
    alert("No visible layers to export.");
    return;
  }
  downloadSVG(exportSvg, "pattern-export.svg");
}

function resolveBustCupOffset(cup) {
  if (!cup) return BUST_CUP_OFFSETS.B;
  let normalized = String(cup).toUpperCase();
  if (normalized.includes("CUP")) normalized = normalized.replace("CUP", "");
  normalized = normalized.replace(/[^A-Z]/g, "").trim();
  const key = normalized.charAt(0);
  return BUST_CUP_OFFSETS[key] || BUST_CUP_OFFSETS.B;
}

function getText(id, fallback) {
  const input = document.getElementById(id);
  if (!input) return fallback;
  const value = input.value;
  return value !== undefined && value !== null && value !== ""
    ? value
    : fallback;
}

function slugifyId(name, prefix = "") {
  if (!name) return prefix || "layer";
  const base = name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!base) return prefix || "layer";
  return prefix ? `${prefix}-${base}` : base;
}

function firstNumber(...values) {
  for (const value of values) {
    if (Number.isFinite(value)) return value;
  }
  return 0;
}

function applyLayerVisibility(layers, params) {
  const showGuides = params.showGuides !== false;
  const showMarkers = params.showMarkers !== false;
  const guideDisplay = showGuides ? null : "none";
  [
    layers.foundation,
    layers.foundationFront,
    layers.foundationBack,
    layers.dartsParent,
    layers.dartsLayer,
    layers.shapingLayer,
    layers.capShaping,
  ].forEach((layer) => {
    if (!layer) return;
    if (guideDisplay) {
      layer.setAttribute("display", guideDisplay);
    } else {
      layer.removeAttribute("display");
    }
  });

  const markerDisplay = showMarkers ? null : "none";
  [layers.labelsParent].forEach((layer) => {
    if (!layer) return;
    if (markerDisplay) {
      layer.setAttribute("display", markerDisplay);
    } else {
      layer.removeAttribute("display");
    }
  });
}

function showPreviewMessage(text) {
  resetPreviewZoom();
  const target = getPreviewTarget();
  if (!target) return;
  target.innerHTML = "";
  const msg = document.createElement("p");
  msg.className = "preview-message";
  msg.textContent = text;
  target.appendChild(msg);
}

function getPreviewTarget() {
  if (!preview) return null;
  if (!previewViewport || previewViewport.parentElement !== preview) {
    previewViewport = preview.querySelector("#previewViewport");
    if (!previewViewport) {
      previewViewport = document.createElement("div");
      previewViewport.id = "previewViewport";
      preview.appendChild(previewViewport);
    }
  }
  return previewViewport;
}

function clearPreviewContent() {
  const target = getPreviewTarget();
  if (target) {
    target.innerHTML = "";
  }
  resetPreviewZoom();
}

function resetPreviewZoom() {
  const target = getPreviewTarget();
  if (!target || !preview) return;
  previewPointers.clear();
  const containerWidth = preview.clientWidth || 0;
  const containerHeight = preview.clientHeight || 0;
  const prevTransform = target.style.transform;
  target.style.transform = "";
  const { width: contentWidth, height: contentHeight } =
    measurePreviewContentSize(target) || {};
  target.style.transform = prevTransform;
  let fitScale = 0.5;
  if (containerWidth > 0 && containerHeight > 0) {
    const fitX = containerWidth / contentWidth;
    const fitY = containerHeight / contentHeight;
    fitScale = Math.min(fitX, fitY);
  }
  if (!Number.isFinite(fitScale) || fitScale <= 0) fitScale = 1;
  fitScale = Math.min(1, fitScale);
  const clampedScale = clamp(
    fitScale,
    previewZoomState.minScale,
    previewZoomState.maxScale
  );
  previewZoomState.scale = clampedScale;
  const scaledWidth = contentWidth * clampedScale;
  const scaledHeight = contentHeight * clampedScale;
  previewZoomState.translateX = (containerWidth - scaledWidth) / 2;
  previewZoomState.translateY = (containerHeight - scaledHeight) / 2;
  previewZoomState.pinchStartDistance = 0;
  previewZoomState.pinchStartScale = clampedScale;
  applyPreviewTransform(true);
}

function measurePreviewContentSize(target) {
  if (!target) return { width: 1, height: 1 };
  const referenceRect = target.getBoundingClientRect();
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const drafts = target.querySelectorAll(".preview-draft");
  drafts.forEach((node) => {
    const rect = node.getBoundingClientRect();
    const left = rect.left - referenceRect.left;
    const top = rect.top - referenceRect.top;
    const right = rect.right - referenceRect.left;
    const bottom = rect.bottom - referenceRect.top;
    if (rect.width > 0 && rect.height > 0) {
      if (left < minX) minX = left;
      if (top < minY) minY = top;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    }
  });
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    const fallbackWidth =
      target.scrollWidth || target.offsetWidth || target.clientWidth || 1;
    const fallbackHeight =
      target.scrollHeight || target.offsetHeight || target.clientHeight || 1;
    return { width: fallbackWidth, height: fallbackHeight };
  }
  return {
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

function clampPreviewTranslation() {
  if (!preview || !previewViewport) return;
  const containerWidth = preview.clientWidth || 0;
  const containerHeight = preview.clientHeight || 0;
  const contentWidth =
    previewViewport.scrollWidth || previewViewport.offsetWidth || containerWidth;
  const contentHeight =
    previewViewport.scrollHeight ||
    previewViewport.offsetHeight ||
    containerHeight;
  const scaledWidth = contentWidth * previewZoomState.scale;
  const scaledHeight = contentHeight * previewZoomState.scale;
  const extraWidth = Math.max(0, scaledWidth - containerWidth);
  const extraHeight = Math.max(0, scaledHeight - containerHeight);
  const margin = 40;
  const minX = -extraWidth / 2 - margin;
  const maxX = extraWidth / 2 + margin;
  const minY = -(extraHeight + margin);
  const maxY = margin;
  previewZoomState.translateX = clamp(previewZoomState.translateX, minX, maxX);
  previewZoomState.translateY = clamp(previewZoomState.translateY, minY, maxY);
}

function applyPreviewTransform(skipClamp = false) {
  const target = getPreviewTarget();
  if (!target) return;
  if (!skipClamp) {
    clampPreviewTranslation();
  }
  const { scale, translateX, translateY } = previewZoomState;
  target.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getPinchAnchor() {
  if (!previewPointers.size || !preview) return null;
  let sumX = 0;
  let sumY = 0;
  previewPointers.forEach((pointer) => {
    sumX += pointer.relX;
    sumY += pointer.relY;
  });
  const count = previewPointers.size;
  return {
    x: sumX / count,
    y: sumY / count,
  };
}

function adjustScaleAtPoint(requestedScale, anchor) {
  const target = getPreviewTarget();
  if (!target) return;
  const previousScale = previewZoomState.scale;
  const clampedScale = clamp(
    requestedScale,
    previewZoomState.minScale,
    previewZoomState.maxScale
  );
  if (!anchor) {
    anchor = {
      x: (preview?.clientWidth || 0) / 2,
      y: (preview?.clientHeight || 0) / 2,
    };
  }
  previewZoomState.scale = clampedScale;
  previewZoomState.translateX += anchor.x * (previousScale - clampedScale);
  previewZoomState.translateY += anchor.y * (previousScale - clampedScale);
  applyPreviewTransform();
}

function handlePreviewPointerDown(event) {
  if (!preview || !isPanPointer(event)) return;
  const draftId = getDraftIdFromEvent(event);
  if (draftId && !panOverrideActive) {
    if (startDraftDrag(event, draftId)) {
      return;
    }
  }
  const target = getPreviewTarget();
  if (!target) return;
  event.preventDefault();
  const position = getRelativePointerPosition(event, preview);
  previewPointers.set(event.pointerId, {
    clientX: event.clientX,
    clientY: event.clientY,
    relX: position.x,
    relY: position.y,
  });
  if (preview.setPointerCapture) {
    preview.setPointerCapture(event.pointerId);
  }
  if (previewPointers.size === 2) {
    previewZoomState.pinchStartDistance = getPointerDistance();
    previewZoomState.pinchStartScale = previewZoomState.scale;
  }
}

function handlePreviewPointerMove(event) {
  if (
    draftDragState.pointerId === event.pointerId &&
    handleDraftDragMove(event)
  ) {
    return;
  }
  if (!preview || !previewPointers.has(event.pointerId)) return;
  if (
    event.pointerType === "mouse" &&
    event.buttons !== undefined &&
    (event.buttons & 1) === 0
  ) {
    previewPointers.delete(event.pointerId);
    return;
  }
  const pointer = previewPointers.get(event.pointerId);
  if (!pointer) return;
  event.preventDefault();
  const target = getPreviewTarget();
  if (!target) return;
  const prevClientX = pointer.clientX;
  const prevClientY = pointer.clientY;
  const position = getRelativePointerPosition(event, preview);
  pointer.clientX = event.clientX;
  pointer.clientY = event.clientY;
  pointer.relX = position.x;
  pointer.relY = position.y;
  if (previewPointers.size >= 2) {
    if (!previewZoomState.pinchStartDistance) {
      previewZoomState.pinchStartDistance = getPointerDistance();
      previewZoomState.pinchStartScale = previewZoomState.scale;
    }
    const distance = getPointerDistance();
    if (distance > 0 && previewZoomState.pinchStartDistance) {
      let scaleFactor = distance / previewZoomState.pinchStartDistance;
      if (previewZoomState.pinchStepClamp) {
        const maxDelta = previewZoomState.pinchStepClamp;
        scaleFactor = clamp(scaleFactor, 1 - maxDelta, 1 + maxDelta);
      }
      const requestedScale = previewZoomState.pinchStartScale * scaleFactor;
      const anchor = getPinchAnchor();
      adjustScaleAtPoint(requestedScale, anchor);
    }
  } else {
    previewZoomState.translateX += event.clientX - prevClientX;
    previewZoomState.translateY += event.clientY - prevClientY;
    applyPreviewTransform();
  }
}

function handlePreviewPointerUp(event) {
  if (draftDragState.pointerId === event.pointerId) {
    endDraftDrag(event);
    return;
  }
  if (!preview) return;
  if (previewPointers.has(event.pointerId) && preview.releasePointerCapture) {
    try {
      preview.releasePointerCapture(event.pointerId);
    } catch (releaseErr) {
      // Ignore release errors
    }
  }
  previewPointers.delete(event.pointerId);
  if (previewPointers.size < 2) {
    previewZoomState.pinchStartDistance = 0;
    previewZoomState.pinchStartScale = previewZoomState.scale;
  }
}

function handlePreviewWheel(event) {
  if (!preview) return;
  const target = getPreviewTarget();
  if (!target) return;
  event.preventDefault();
  const step = previewZoomState.wheelStep || 1.02;
  const zoomDelta = event.deltaY < 0 ? step : 1 / step;
  const requestedScale = previewZoomState.scale * zoomDelta;
  const anchor = getRelativePointerPosition(event, preview);
  adjustScaleAtPoint(requestedScale, anchor);
}

function zoomByStep(direction = 1) {
  const step = previewZoomState.wheelStep || 1.02;
  const delta = direction > 0 ? step : 1 / step;
  const requestedScale = previewZoomState.scale * delta;
  const anchor = {
    x: (preview?.clientWidth || 0) / 2,
    y: (preview?.clientHeight || 0) / 2,
  };
  adjustScaleAtPoint(requestedScale, anchor);
}

function handlePanModifierKeyDown(event) {
  if (event.code === "Space") {
    panOverrideActive = true;
    event.preventDefault();
  }
}

function handlePanModifierKeyUp(event) {
  if (event.code === "Space") {
    panOverrideActive = false;
  }
}

function handlePreviewNudge(event) {
  const arrows = {
    ArrowUp: true,
    ArrowDown: true,
    ArrowLeft: true,
    ArrowRight: true,
  };
  if (!arrows[event.key]) return;
  const patternKey = getCurrentPatternKey();
  const draft = getActiveDraft(patternKey);
  if (!draft) return;
  event.preventDefault();
  switch (event.key) {
    case "ArrowUp":
      draft.offsetY -= NUDGE_STEP_PX;
      break;
    case "ArrowDown":
      draft.offsetY += NUDGE_STEP_PX;
      break;
    case "ArrowLeft":
      draft.offsetX -= NUDGE_STEP_PX;
      break;
    case "ArrowRight":
      draft.offsetX += NUDGE_STEP_PX;
      break;
  }
  const wrapper = getDraftWrapperElement(draft.id);
  if (wrapper) {
    applyDraftOffset(wrapper, draft);
  }
}

function startDraftDrag(event, draftId) {
  const wrapper = event.target?.closest?.(".preview-draft");
  if (!wrapper) return false;
  const store = getDraftStore(getCurrentPatternKey());
  const draft = store?.drafts.find((d) => d.id === draftId);
  draftDragState.pointerId = event.pointerId;
  draftDragState.draftId = draftId;
  draftDragState.startX = event.clientX;
  draftDragState.startY = event.clientY;
  draftDragState.startOffsetX = Number.isFinite(draft?.offsetX)
    ? draft.offsetX
    : 0;
  draftDragState.startOffsetY = Number.isFinite(draft?.offsetY)
    ? draft.offsetY
    : 0;
  try {
    wrapper.setPointerCapture(event.pointerId);
  } catch (e) {}
  wrapper.style.cursor = "grabbing";
  event.preventDefault();
  return true;
}

function handleDraftDragMove(event) {
  if (!draftDragState.draftId || draftDragState.pointerId !== event.pointerId)
    return false;
  const dx = event.clientX - draftDragState.startX;
  const dy = event.clientY - draftDragState.startY;
  const store = getDraftStore(getCurrentPatternKey());
  const draft = store?.drafts.find((d) => d.id === draftDragState.draftId);
  const wrapper = event.target?.closest?.(".preview-draft");
  const offsetX = draftDragState.startOffsetX + dx;
  const offsetY = draftDragState.startOffsetY + dy;
  if (draft) {
    draft.offsetX = offsetX;
    draft.offsetY = offsetY;
  }
  if (wrapper) {
    applyDraftOffset(wrapper, draft || { offsetX, offsetY });
  }
  return true;
}

function endDraftDrag(event) {
  const wrapper = event.target?.closest?.(".preview-draft");
  if (wrapper) {
    wrapper.style.cursor = "grab";
    try {
      wrapper.releasePointerCapture(event.pointerId);
    } catch (e) {}
  }
  draftDragState.pointerId = null;
  draftDragState.draftId = null;
}

function getDraftIdFromEvent(event) {
  const wrapper = event.target?.closest?.(".preview-draft");
  return wrapper?.dataset?.draftId || null;
}

function getDraftWrapperElement(draftId) {
  if (!draftId) return null;
  return (
    previewViewport?.querySelector?.(
      `.preview-draft[data-draft-id="${draftId}"]`
    ) || null
  );
}

function isPanPointer(event) {
  if (!event) return false;
  const type = event.pointerType || "";
  if (type === "mouse") {
    if (event.buttons !== undefined) {
      return (event.buttons & 1) === 1;
    }
    return event.button === 0;
  }
  return type === "touch" || type === "pen" || !type;
}

function getPointerDistance() {
  if (previewPointers.size < 2) return 0;
  const entries = Array.from(previewPointers.values()).slice(0, 2);
  const dx = entries[0].clientX - entries[1].clientX;
  const dy = entries[0].clientY - entries[1].clientY;
  return Math.hypot(dx, dy);
}

function getRelativePointerPosition(event, target) {
  const rect = target.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function initPreviewInteractions() {
  if (!preview || previewZoomInitialized) return;
  previewZoomInitialized = true;
  preview.style.touchAction = "none";
  preview.style.cursor = "grab";
  preview.addEventListener("pointerdown", handlePreviewPointerDown);
  preview.addEventListener("pointermove", handlePreviewPointerMove);
  ["pointerup", "pointercancel", "pointerleave"].forEach((type) => {
    preview.addEventListener(type, handlePreviewPointerUp);
  });
  preview.addEventListener("wheel", handlePreviewWheel, { passive: false });
  preview.addEventListener("dblclick", (event) => {
    event.preventDefault();
    resetPreviewZoom();
  });
  const zoomInBtn = document.getElementById("zoomIn");
  const zoomOutBtn = document.getElementById("zoomOut");
  const zoomResetBtn = document.getElementById("zoomReset");
  if (zoomInBtn) zoomInBtn.addEventListener("click", () => zoomByStep(1));
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => zoomByStep(-1));
  if (zoomResetBtn) zoomResetBtn.addEventListener("click", resetPreviewZoom);
  document.addEventListener("keydown", handlePreviewNudge);
  document.addEventListener("keydown", handlePanModifierKeyDown);
  document.addEventListener("keyup", handlePanModifierKeyUp);
  if (typeof window !== "undefined") {
    window.addEventListener("resize", applyPreviewTransform);
  }
}

function computeAldrichFrontNeckDart(bust) {
  if (!Number.isFinite(bust)) return 7;
  const baseBustLow = 88;
  const baseBustHigh = 110;
  const baseLowValue = 7;
  const baseHighValue = 10;
  if (bust < baseBustLow) {
    const diffLow = ((baseBustLow - bust) / 4) * 0.6;
    return baseLowValue - diffLow;
  }
  if (bust <= 104) {
    const diffMidLow = ((bust - baseBustLow) / 4) * 0.6;
    return baseLowValue + diffMidLow;
  }
  if (bust <= baseBustHigh) {
    const diffMidHigh = ((baseBustHigh - bust) / 6) * 0.6;
    return baseHighValue - diffMidHigh;
  }
  const diffHigh = ((bust - baseBustHigh) / 6) * 0.6;
  return baseHighValue + diffHigh;
}

function computeAldrichWaistDiff(bust, waist, bustEase, waistEase) {
  if (!Number.isFinite(bust) || !Number.isFinite(waist)) return NaN;
  let bustHalf = bust / 2;
  let waistHalf = waist / 2;
  if (Number.isFinite(bustEase)) bustHalf += bustEase;
  if (Number.isFinite(waistEase)) waistHalf += waistEase;
  return bustHalf - waistHalf;
}

function computeAldrichWaistDartsFromDiff(diff, options = {}) {
  if (!Number.isFinite(diff)) {
    return { front: 0, back: 0, frontSide: 0, backSide: 0 };
  }
  const reduced = options.reduced === true;
  let waistDifference = Math.abs(diff);
  if (reduced) {
    waistDifference *= 0.75;
  }
  const subtractBase = reduced ? 5 : 6;
  let x = (waistDifference - subtractBase) / 4;
  if (!Number.isFinite(x) || x < 0) {
    x = 0;
  }
  if (reduced) {
    return {
      backSide: x,
      frontSide: x + 1,
      back: x + 1.5,
      front: x + 2.5,
    };
  }
  return {
    backSide: x,
    frontSide: x + 1,
    back: x + 2,
    front: x + 3,
  };
}

function computeAldrichWaistDarts(
  bust,
  waist,
  bustEase,
  waistEase,
  options = {}
) {
  const diff = computeAldrichWaistDiff(bust, waist, bustEase, waistEase);
  return computeAldrichWaistDartsFromDiff(diff, options);
}

function computeAldrichPointADistance(bust) {
  if (!Number.isFinite(bust)) return 2.5;
  if (bust <= 80) return 2.25;
  if (bust >= 96 && bust <= 106) return 3;
  if (bust > 106 && bust <= 128) return 3.5;
  if (bust > 80 && bust <= 99) return 2.5;
  return 3.5;
}

function computeAldrichPointBDistance(bust) {
  if (!Number.isFinite(bust)) return 2;
  if (bust <= 80) return 1.75;
  if (bust >= 96 && bust <= 106) return 2.5;
  if (bust > 106 && bust <= 128) return 3;
  if (bust > 80 && bust <= 99) return 2.0;
  return 3;
}

function clampHandleToChordCm(
  baseXcm,
  baseYcm,
  chordCm,
  ratio = ALDRICH_HANDLE_RATIO_CAP
) {
  const baseLen = Math.hypot(baseXcm, baseYcm);
  if (!Number.isFinite(chordCm) || chordCm <= 0) {
    return { x: 0, y: 0 };
  }
  if (!Number.isFinite(baseLen) || baseLen < 0.0001) {
    return { x: baseXcm, y: baseYcm };
  }
  const maxLen = chordCm * ratio;
  if (maxLen >= baseLen) {
    return { x: baseXcm, y: baseYcm };
  }
  const scale = maxLen / baseLen;
  return {
    x: baseXcm * scale,
    y: baseYcm * scale,
  };
}

function distanceBetween(a, b) {
  if (!a || !b) return 0;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
}

function isFiniteNumber(val) {
  return typeof val === "number" && Number.isFinite(val);
}

function intersectLineWithVertical(lineStart, lineEnd, xConst) {
  if (!lineStart || !lineEnd || !isFiniteNumber(xConst)) {
    return null;
  }
  const dx = lineEnd.x - lineStart.x;
  if (Math.abs(dx) < 0.000001) {
    return null;
  }
  const t = (xConst - lineStart.x) / dx;
  if (t < -0.0001 || t > 1.0001) {
    return null;
  }
  return {
    x: xConst,
    y: lineStart.y + t * (lineEnd.y - lineStart.y),
  };
}

function valueBetween(val, a, b, tolerance = 0.0001) {
  const minVal = Math.min(a, b) - tolerance;
  const maxVal = Math.max(a, b) + tolerance;
  return val >= minVal && val <= maxVal;
}

function vectorBetween(a, b) {
  if (!a || !b) return { x: 0, y: 0 };
  return { x: b.x - a.x, y: b.y - a.y };
}

function vectorMagnitude(vec) {
  if (!vec) return 0;
  return Math.hypot(vec.x || 0, vec.y || 0);
}

function normalizeVector(vec) {
  const len = vectorMagnitude(vec);
  if (len < 1e-6) return { x: 0, y: 0 };
  return { x: (vec.x || 0) / len, y: (vec.y || 0) / len };
}

function scaleVector(vec, scalar) {
  if (!vec) return { x: 0, y: 0 };
  return { x: (vec.x || 0) * scalar, y: (vec.y || 0) * scalar };
}

function addVector(pt, vec) {
  if (!pt) return vec || { x: 0, y: 0 };
  if (!vec) return pt;
  return { x: pt.x + (vec.x || 0), y: pt.y + (vec.y || 0) };
}

function bezierPointCoords(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const a = mt2 * mt;
  const b = 3 * mt2 * t;
  const c = 3 * mt * t2;
  const d = t * t2;
  return {
    x:
      a * (p0?.x || 0) + b * (p1?.x || 0) + c * (p2?.x || 0) + d * (p3?.x || 0),
    y:
      a * (p0?.y || 0) + b * (p1?.y || 0) + c * (p2?.y || 0) + d * (p3?.y || 0),
  };
}

function bezierDerivativeVector(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return {
    x:
      3 * mt * mt * ((p1?.x || 0) - (p0?.x || 0)) +
      6 * mt * t * ((p2?.x || 0) - (p1?.x || 0)) +
      3 * t * t * ((p3?.x || 0) - (p2?.x || 0)),
    y:
      3 * mt * mt * ((p1?.y || 0) - (p0?.y || 0)) +
      6 * mt * t * ((p2?.y || 0) - (p1?.y || 0)) +
      3 * t * t * ((p3?.y || 0) - (p2?.y || 0)),
  };
}
