"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeDerived } from "@/patterns/hofenbitzerStandardTrouser/engine";
import type {
  HofenbitzerStandardTrouserBaseMeasurements,
  HofenbitzerStandardTrouserDerivedValues,
} from "@/patterns/hofenbitzerStandardTrouser/types";
import { useHofenbitzerStandardTrouserStore } from "@/lib/hofenbitzerStandardTrouserStore";

type NumericKey = Exclude<
  keyof HofenbitzerStandardTrouserBaseMeasurements,
  "TummyProfileIndex" | "HipProfileIndex" | "HipBoneCurveIndex" | "ThighProfileIndex" | "ButtocksProfileIndex"
>;

type FieldConfig = {
  label: string;
  min: number;
  max: number;
  step: number;
};

const fieldConfig: Record<NumericKey, FieldConfig> = {
  HiC: { label: "HiC", min: 70, max: 170, step: 0.1 },
  WaC: { label: "WaC", min: 50, max: 140, step: 0.1 },
  sWaH: { label: "sWaH", min: 60, max: 140, step: 0.1 },
  CrH: { label: "CrH", min: 10, max: 45, step: 0.1 },
  CrL: { label: "CrL (0 = auto)", min: 0, max: 120, step: 0.1 },
  KnH: { label: "KnH (0 = auto)", min: 0, max: 80, step: 0.1 },
  ThC: { label: "ThC", min: 30, max: 90, step: 0.1 },
  HEM: { label: "HEM", min: 30, max: 70, step: 0.1 },
  BuA: { label: "BuA", min: 60, max: 100, step: 0.1 },
  CrHReduction: { label: "CrH reduction", min: 0, max: 1, step: 0.1 },
  HemShorten: { label: "Hem shorten", min: 0, max: 4, step: 0.1 },
  CrotchExtAdjust: { label: "Front crotch adjust", min: -2, max: 4, step: 0.1 },
  Point11Shift: { label: "Point 11 shift", min: -3, max: 3, step: 0.1 },
  SquareUpLen: { label: "Square up", min: 0, max: 12, step: 0.1 },
  FrontWaistReduction: { label: "Front waist reduction (0 = auto)", min: 0, max: 1, step: 0.1 },
  WaistEase: { label: "Waist ease", min: 0, max: 10, step: 0.1 },
  FrontSideDartOverride: { label: "Front side dart", min: 0, max: 8, step: 0.1 },
  BackSideDartOverride: { label: "Back side dart", min: 0, max: 8, step: 0.1 },
  FrontDartOverride: { label: "Front dart", min: 0, max: 8, step: 0.1 },
  BackDart1Override: { label: "Back dart 1", min: 0, max: 8, step: 0.1 },
  BackDart2Override: { label: "Back dart 2", min: 0, max: 8, step: 0.1 },
  FrontDartLen: { label: "Front dart length", min: 0, max: 20, step: 0.1 },
  BackDart1Len: { label: "Back dart 1 length", min: 0, max: 20, step: 0.1 },
  BackDart2Len: { label: "Back dart 2 length", min: 0, max: 20, step: 0.1 },
  LegSeamShape: { label: "Leg seam shaping", min: 0, max: 2, step: 0.1 },
  BackHipAdjustment: { label: "Back hip adjust", min: -1.5, max: 2, step: 0.1 },
  BackInseamReduction: { label: "Back inseam reduction", min: 0.5, max: 1.5, step: 0.1 },
};

const CORE_FIELDS: NumericKey[] = [
  "HiC",
  "WaC",
  "sWaH",
  "CrH",
  "HEM",
  "BuA",
  "CrL",
  "KnH",
  "ThC",
  "WaistEase",
];

const ADJUSTMENT_FIELDS: NumericKey[] = [
  "CrHReduction",
  "HemShorten",
  "CrotchExtAdjust",
  "Point11Shift",
  "SquareUpLen",
  "FrontWaistReduction",
  "LegSeamShape",
  "BackHipAdjustment",
  "BackInseamReduction",
];

const DART_OVERRIDE_FIELDS: NumericKey[] = [
  "FrontSideDartOverride",
  "BackSideDartOverride",
  "FrontDartOverride",
  "BackDart1Override",
  "BackDart2Override",
];

const DART_LENGTH_FIELDS: NumericKey[] = ["FrontDartLen", "BackDart1Len", "BackDart2Len"];

const TUMMY_OPTIONS = ["Flat", "Normal", "Fuller"] as const;
const HIP_OPTIONS = ["Flat", "Normal", "Curvy"] as const;
const HIP_BONE_OPTIONS = ["Less curvy", "Normal", "More curvy"] as const;
const THIGH_OPTIONS = ["Thin", "Normal", "Full"] as const;
const BUTTOCK_OPTIONS = ["Flat", "Normal", "Full"] as const;

const formatNumber = (value: number): string => (Math.round(value * 100) / 100).toFixed(2);

const clampIndex = (value: number, length: number): number => {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(length - 1, Math.max(0, Math.round(value)));
};

type EditableNumberFieldProps = {
  value: number;
  label: string;
  min: number;
  max: number;
  step: number;
  onCommit: (next: number) => void;
};

function EditableNumberField({
  value,
  label,
  min,
  max,
  step,
  onCommit,
}: EditableNumberFieldProps) {
  const [draft, setDraft] = useState(formatNumber(value));
  const commitRef = useRef(onCommit);

  useEffect(() => {
    commitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    setDraft(formatNumber(value));
  }, [value]);

  useEffect(() => {
    if (draft.trim() === "") {
      return;
    }

    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      commitRef.current(parsed);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [draft]);

  const onBlur = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(formatNumber(value));
      return;
    }

    const clamped = Math.min(max, Math.max(min, parsed));
    setDraft(formatNumber(clamped));
    commitRef.current(clamped);
  };

  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-slate-700">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={onBlur}
        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
      />
    </div>
  );
}

type DerivedReadOnlyFieldProps = {
  value: number;
  label: string;
};

function DerivedReadOnlyField({ value, label }: DerivedReadOnlyFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-slate-700">{label}</label>
      <input
        type="text"
        readOnly
        value={formatNumber(value)}
        className="w-full rounded-md border border-slate-300 bg-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-900"
      />
    </div>
  );
}

type ProfileSelectProps = {
  label: string;
  value: number;
  options: readonly string[];
  onChange: (index: number) => void;
};

function ProfileSelect({ label, value, options, onChange }: ProfileSelectProps) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-slate-700">{label}</label>
      <select
        value={clampIndex(value, options.length)}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
      >
        {options.map((option, index) => (
          <option key={option} value={index}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberFieldGrid({
  fields,
  values,
  onCommit,
}: {
  fields: NumericKey[];
  values: HofenbitzerStandardTrouserBaseMeasurements;
  onCommit: (key: NumericKey, value: number) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      {fields.map((key) => {
        const config = fieldConfig[key];
        return (
          <EditableNumberField
            key={key}
            value={values[key]}
            label={config.label}
            min={config.min}
            max={config.max}
            step={config.step}
            onCommit={(next) => onCommit(key, next)}
          />
        );
      })}
    </div>
  );
}

export function HofenbitzerStandardTrouserMeasurementsPanel() {
  const base = useHofenbitzerStandardTrouserStore((state) => state.base);
  const instances = useHofenbitzerStandardTrouserStore((state) => state.instances);
  const selectedInstanceId = useHofenbitzerStandardTrouserStore((state) => state.ui.selectedInstanceId);
  const setOverride = useHofenbitzerStandardTrouserStore((state) => state.setOverride);
  const resetOverrides = useHofenbitzerStandardTrouserStore((state) => state.resetOverrides);

  const selectedDraft =
    instances.find((instance) => instance.id === selectedInstanceId) ?? instances[0] ?? null;

  const selectedMeasurements = useMemo<HofenbitzerStandardTrouserBaseMeasurements>(() => {
    if (!selectedDraft) {
      return base;
    }

    return {
      ...base,
      ...selectedDraft.overrides,
    };
  }, [base, selectedDraft]);

  const derived = useMemo<HofenbitzerStandardTrouserDerivedValues>(
    () => computeDerived(selectedMeasurements),
    [selectedMeasurements],
  );

  const commitMeasurement = (key: keyof HofenbitzerStandardTrouserBaseMeasurements, value: number) => {
    if (!selectedDraft) {
      return;
    }

    setOverride(selectedDraft.id, key, value);
  };

  return (
    <section className="space-y-3">
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-600">
        <p className="font-semibold text-slate-700">Hofenbitzer&apos;s Standard Trousers</p>
        <p>
          All measurements are in centimetres. This follows the Hofenbitzer drafting flow and includes
          both the full construction and a pattern-only cleanup view.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Draft Measurements
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Editing: <span className="font-semibold text-slate-700">{selectedDraft?.name ?? "None"}</span>
          </p>
        </div>
        {selectedDraft ? (
          <button
            type="button"
            onClick={() => resetOverrides(selectedDraft.id)}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Reset Draft
          </button>
        ) : null}
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-sm font-semibold text-slate-800">Core</h3>
        <div className="mt-2 space-y-2">
          <NumberFieldGrid fields={CORE_FIELDS} values={selectedMeasurements} onCommit={commitMeasurement} />
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <DerivedReadOnlyField value={derived.CrLResolved} label="Resolved CrL" />
            <DerivedReadOnlyField value={derived.KnHResolved} label="Resolved KnH" />
            <DerivedReadOnlyField value={derived.WaistDifferenceGuide} label="Waist Difference" />
            <DerivedReadOnlyField value={derived.FrontTrouserWidth} label="Front Width" />
            <DerivedReadOnlyField value={derived.BackTrouserWidth} label="Back Width" />
            <DerivedReadOnlyField value={derived.BackCrotchExtension} label="Back Crotch Ext." />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-sm font-semibold text-slate-800">Adjustments</h3>
        <div className="mt-2">
          <NumberFieldGrid
            fields={ADJUSTMENT_FIELDS}
            values={selectedMeasurements}
            onCommit={commitMeasurement}
          />
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-sm font-semibold text-slate-800">Dart Overrides</h3>
        <p className="mt-0.5 text-xs text-slate-500">Set to 0 to keep automatic dart planning.</p>
        <div className="mt-2 space-y-2">
          <NumberFieldGrid
            fields={DART_OVERRIDE_FIELDS}
            values={selectedMeasurements}
            onCommit={commitMeasurement}
          />
          <NumberFieldGrid
            fields={DART_LENGTH_FIELDS}
            values={selectedMeasurements}
            onCommit={commitMeasurement}
          />
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-sm font-semibold text-slate-800">Profiles</h3>
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
          <ProfileSelect
            label="Tummy profile"
            value={selectedMeasurements.TummyProfileIndex}
            options={TUMMY_OPTIONS}
            onChange={(index) => commitMeasurement("TummyProfileIndex", index)}
          />
          <ProfileSelect
            label="Hip profile"
            value={selectedMeasurements.HipProfileIndex}
            options={HIP_OPTIONS}
            onChange={(index) => commitMeasurement("HipProfileIndex", index)}
          />
          <ProfileSelect
            label="Hip bone curve"
            value={selectedMeasurements.HipBoneCurveIndex}
            options={HIP_BONE_OPTIONS}
            onChange={(index) => commitMeasurement("HipBoneCurveIndex", index)}
          />
          <ProfileSelect
            label="Thigh profile"
            value={selectedMeasurements.ThighProfileIndex}
            options={THIGH_OPTIONS}
            onChange={(index) => commitMeasurement("ThighProfileIndex", index)}
          />
          <ProfileSelect
            label="Buttocks profile"
            value={selectedMeasurements.ButtocksProfileIndex}
            options={BUTTOCK_OPTIONS}
            onChange={(index) => commitMeasurement("ButtocksProfileIndex", index)}
          />
        </div>
      </div>
    </section>
  );
}
