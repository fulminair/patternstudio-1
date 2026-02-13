"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeDerived } from "@/patterns/hofenbitzerBasicSkirt/engine";
import type {
  HofenbitzerBaseMeasurements,
  HofenbitzerDerivedValues,
} from "@/patterns/hofenbitzerBasicSkirt/types";
import { useHofenbitzerStore } from "@/lib/hofenbitzerStore";

type NumericMeasurementKey = Exclude<
  keyof HofenbitzerBaseMeasurements,
  "hipProfile" | "dartsAuto" | "sideDart" | "frontDart" | "backDart1" | "backDart2"
>;

type MeasurementField = {
  key: NumericMeasurementKey;
  label: string;
  min: number;
  max: number;
  step: number;
};

const baseMeasurementFields: MeasurementField[] = [
  { key: "hiC", label: "Hip Circumference (HiC)", min: 70, max: 170, step: 0.1 },
  { key: "waC", label: "Waist Circumference (WaC)", min: 50, max: 150, step: 0.1 },
  { key: "hiD", label: "Hip Depth (HiD)", min: 10, max: 40, step: 0.1 },
  { key: "moL", label: "Model Length (MoL)", min: 25, max: 120, step: 0.1 },
  { key: "hipEase", label: "Hip Ease", min: 0, max: 12, step: 0.1 },
  { key: "waistEase", label: "Waist Ease", min: 0, max: 12, step: 0.1 },
];

const derivedFields: Array<{ key: keyof HofenbitzerDerivedValues; label: string }> = [
  { key: "hiW", label: "Hip Width (HiW)" },
  { key: "waW", label: "Waist Width (WaW)" },
  { key: "waistDiffTarget", label: "Waist Diff Target" },
  { key: "waistShaping", label: "Waist Shaping" },
  { key: "dartSum", label: "Dart Sum" },
  { key: "waDif", label: "Waist Diff" },
];

const formatCm = (value: number): string => `${(Math.round(value * 100) / 100).toFixed(2)} cm`;

type DebouncedNumberFieldProps = {
  value: number;
  label: string;
  min: number;
  max: number;
  step: number;
  onCommit: (next: number) => void;
};

function DebouncedNumberField({
  value,
  label,
  min,
  max,
  step,
  onCommit,
}: DebouncedNumberFieldProps) {
  const [draft, setDraft] = useState(String(value));
  const commitRef = useRef(onCommit);

  useEffect(() => {
    commitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    setDraft(String(value));
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

    return () => {
      window.clearTimeout(timeout);
    };
  }, [draft]);

  const onBlur = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }

    const clamped = Math.min(max, Math.max(min, parsed));
    setDraft(String(clamped));
    commitRef.current(clamped);
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white px-2 py-2">
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-600">
        {label}
      </label>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={onBlur}
        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-slate-500"
      />
    </div>
  );
}

export function HofenbitzerMeasurementsPanel() {
  const base = useHofenbitzerStore((state) => state.base);
  const instances = useHofenbitzerStore((state) => state.instances);
  const selectedInstanceId = useHofenbitzerStore((state) => state.ui.selectedInstanceId);
  const setOverride = useHofenbitzerStore((state) => state.setOverride);
  const setDartValue = useHofenbitzerStore((state) => state.setDartValue);
  const resetDartsAutocalc = useHofenbitzerStore((state) => state.resetDartsAutocalc);
  const resetOverrides = useHofenbitzerStore((state) => state.resetOverrides);

  const selectedDraft =
    instances.find((instance) => instance.id === selectedInstanceId) ?? instances[0] ?? null;

  const selectedMeasurements = useMemo<HofenbitzerBaseMeasurements>(() => {
    if (!selectedDraft) {
      return base;
    }

    return {
      ...base,
      ...selectedDraft.overrides,
    };
  }, [base, selectedDraft]);

  const derived = useMemo(() => computeDerived(selectedMeasurements), [selectedMeasurements]);

  const commitMeasurement = (key: keyof HofenbitzerBaseMeasurements, value: number | string) => {
    if (!selectedDraft) {
      return;
    }
    setOverride(selectedDraft.id, key, value);
  };

  const commitDartValue = (
    key: "sideDart" | "frontDart" | "backDart1" | "backDart2",
    value: number,
  ) => {
    if (!selectedDraft) {
      return;
    }
    setDartValue(selectedDraft.id, key, value);
  };

  const resetDarts = () => {
    if (!selectedDraft) {
      return;
    }
    resetDartsAutocalc(selectedDraft.id);
  };

  const dartDisplay = {
    sideDart: selectedMeasurements.dartsAuto ? derived.sideDart : selectedMeasurements.sideDart,
    frontDart: selectedMeasurements.dartsAuto ? derived.frontDart : selectedMeasurements.frontDart,
    backDart1: selectedMeasurements.dartsAuto ? derived.backDart1 : selectedMeasurements.backDart1,
    backDart2: selectedMeasurements.dartsAuto ? derived.backDart2 : selectedMeasurements.backDart2,
  };

  return (
    <section className="space-y-3">
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-600">
        <p className="font-semibold text-slate-700">Hofenbitzer&apos;s Basic Skirt</p>
        <p>
          All measurements are in centimetres. Defaults reference the size 38 block from
          Hofenbitzer&apos;s book - please have it handy when entering your own measurements.
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

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
        {baseMeasurementFields.map((field) => (
          <DebouncedNumberField
            key={`${selectedDraft?.id ?? "none"}-${field.key}`}
            label={field.label}
            value={selectedMeasurements[field.key]}
            min={field.min}
            max={field.max}
            step={field.step}
            onCommit={(next) => commitMeasurement(field.key, next)}
          />
        ))}

        <div className="rounded-md border border-slate-200 bg-white px-2 py-2">
          <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-600">
            Hip Profile
          </label>
          <select
            value={selectedMeasurements.hipProfile}
            onChange={(event) => commitMeasurement("hipProfile", event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-slate-500"
          >
            <option value="Flat">Flat</option>
            <option value="Normal">Normal</option>
            <option value="Curvy">Curvy</option>
          </select>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Darts</h3>
          <span className="text-[11px] font-medium text-slate-500">
            {selectedMeasurements.dartsAuto ? "Auto" : "Manual"}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-slate-600">
          Dart widths auto-update from your measurements. Editing any value removes the
          autocalculation until you reset the distribution.
        </p>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <DebouncedNumberField
            label="Length of Front Dart"
            value={selectedMeasurements.frontDartLength}
            min={0}
            max={20}
            step={0.1}
            onCommit={(next) => commitMeasurement("frontDartLength", next)}
          />
          <DebouncedNumberField
            label="Length of 1st Back Dart"
            value={selectedMeasurements.backDartLength1}
            min={10}
            max={24}
            step={0.1}
            onCommit={(next) => commitMeasurement("backDartLength1", next)}
          />
          <DebouncedNumberField
            label="Length of 2nd Back Dart"
            value={selectedMeasurements.backDartLength2}
            min={10}
            max={24}
            step={0.1}
            onCommit={(next) => commitMeasurement("backDartLength2", next)}
          />
          <DebouncedNumberField
            label="Side Dart"
            value={dartDisplay.sideDart}
            min={0}
            max={12}
            step={0.01}
            onCommit={(next) => commitDartValue("sideDart", next)}
          />
          <DebouncedNumberField
            label="Front Dart"
            value={dartDisplay.frontDart}
            min={0}
            max={12}
            step={0.01}
            onCommit={(next) => commitDartValue("frontDart", next)}
          />
          <DebouncedNumberField
            label="1st Back Dart"
            value={dartDisplay.backDart1}
            min={0}
            max={12}
            step={0.01}
            onCommit={(next) => commitDartValue("backDart1", next)}
          />
          <DebouncedNumberField
            label="2nd Back Dart"
            value={dartDisplay.backDart2}
            min={0}
            max={12}
            step={0.01}
            onCommit={(next) => commitDartValue("backDart2", next)}
          />
        </div>

        <button
          type="button"
          onClick={resetDarts}
          className="mt-3 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Reset Darts to Autocalculate
        </button>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Measurement Summary</h3>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 xl:grid-cols-3">
          {derivedFields.map((field) => (
            <div key={field.key} className="rounded border border-slate-200 bg-white px-2 py-1">
              <dt className="text-[11px] text-slate-500">{field.label}</dt>
              <dd className="text-xs font-semibold text-slate-900">{formatCm(derived[field.key])}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
