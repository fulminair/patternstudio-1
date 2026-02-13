"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeDerived } from "@/patterns/aldrichCloseFittingBodice/engine";
import type { BaseMeasurements, Measurements } from "@/patterns/types";
import { usePatternStore } from "@/lib/store";

type MeasurementField = {
  key: keyof Measurements;
  label: string;
  min: number;
  max: number;
  step: number;
};

const measurementFields: MeasurementField[] = [
  { key: "bust", label: "Bust", min: 70, max: 150, step: 0.1 },
  { key: "bustEase", label: "Bust Ease", min: 0, max: 15, step: 0.1 },
  { key: "waist", label: "Waist", min: 50, max: 140, step: 0.1 },
  { key: "waistEase", label: "Waist Ease", min: 0, max: 12, step: 0.1 },
  { key: "hip", label: "Hip", min: 70, max: 160, step: 0.1 },
  { key: "napeToWaist", label: "Nape to Waist", min: 25, max: 60, step: 0.1 },
  { key: "shoulder", label: "Shoulder", min: 7, max: 20, step: 0.05 },
  { key: "backWidth", label: "Back Width", min: 24, max: 50, step: 0.1 },
  { key: "waistToHip", label: "Waist to Hip", min: 10, max: 35, step: 0.1 },
  { key: "armscyeDepth", label: "Armscye Depth", min: 14, max: 35, step: 0.1 },
  { key: "chest", label: "Chest", min: 22, max: 60, step: 0.1 },
  { key: "neckSize", label: "Neck Size", min: 28, max: 55, step: 0.1 },
];

const derivedFieldLabels: Array<{ key: keyof ReturnType<typeof computeDerived>; label: string }> = [
  { key: "frontNeckDart", label: "Front Neck Dart" },
  { key: "bustWaistDiff", label: "Bust-Waist Diff" },
  { key: "frontWaistDart", label: "Front Waist Dart" },
  { key: "backWaistDart", label: "Back Waist Dart" },
  { key: "frontSideWaistDart", label: "Front Side Waist Dart" },
  { key: "backSideWaistDart", label: "Back Side Waist Dart" },
  { key: "frontWaistDartBackOff", label: "Dart Apex Offset" },
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

function DebouncedNumberField({ value, label, min, max, step, onCommit }: DebouncedNumberFieldProps) {
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

const toggleFields: Array<{ key: "closeWaistShaping" | "reducedDarting"; label: string }> = [
  { key: "closeWaistShaping", label: "Close Waist Shaping" },
  { key: "reducedDarting", label: "Reduced Darting (75%)" },
];

export function MeasurementsPanel() {
  const base = usePatternStore((state) => state.base);
  const setBaseMeasurement = usePatternStore((state) => state.setBaseMeasurement);

  const derived = useMemo(() => computeDerived(base), [base]);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Measurements</h2>
        <p className="mt-0.5 text-xs text-slate-500">All values in centimeters.</p>
      </div>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
        {measurementFields.map((field) => (
          <DebouncedNumberField
            key={field.key}
            label={field.label}
            value={base[field.key]}
            min={field.min}
            max={field.max}
            step={field.step}
            onCommit={(next) => setBaseMeasurement(field.key as keyof BaseMeasurements, next)}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-white p-2">
        {toggleFields.map((field) => (
          <label
            key={field.key}
            className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-700"
          >
            <span>{field.label}</span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-slate-900"
              checked={base[field.key]}
              onChange={(event) => setBaseMeasurement(field.key, event.target.checked)}
            />
          </label>
        ))}
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Measurement Summary</h3>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 xl:grid-cols-3">
          {derivedFieldLabels.map((field) => (
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
