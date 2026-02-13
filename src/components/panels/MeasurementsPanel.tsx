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
  slider?: boolean;
};

const measurementFields: MeasurementField[] = [
  { key: "bust", label: "Bust", min: 70, max: 150, step: 0.1, slider: true },
  { key: "bustEase", label: "Bust Ease", min: 0, max: 15, step: 0.1 },
  { key: "waist", label: "Waist", min: 50, max: 140, step: 0.1, slider: true },
  { key: "waistEase", label: "Waist Ease", min: 0, max: 12, step: 0.1 },
  { key: "hip", label: "Hip", min: 70, max: 160, step: 0.1, slider: true },
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
  { key: "frontWaistDartBackOff", label: "Front Waist Dart Back Off" },
];

const formatCm = (value: number): string => `${(Math.round(value * 100) / 100).toFixed(2)} cm`;

type DebouncedNumberFieldProps = {
  value: number;
  label: string;
  min: number;
  max: number;
  step: number;
  slider?: boolean;
  onCommit: (next: number) => void;
};

function DebouncedNumberField({
  value,
  label,
  min,
  max,
  step,
  slider,
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
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <label className="font-medium text-slate-700">{label}</label>
        <span className="text-xs text-slate-500">cm</span>
      </div>

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

      {slider ? (
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value);
            setDraft(String(next));
            commitRef.current(next);
          }}
          className="mt-2 w-full accent-slate-900"
        />
      ) : null}
    </div>
  );
}

const toggleFields: Array<{ key: "closeWaistShaping" | "reducedDarting"; label: string }> = [
  { key: "closeWaistShaping", label: "Close Waist Shaping" },
  { key: "reducedDarting", label: "Reduced Darting" },
];

export function MeasurementsPanel() {
  const base = usePatternStore((state) => state.base);
  const setBaseMeasurement = usePatternStore((state) => state.setBaseMeasurement);

  const derived = useMemo(() => computeDerived(base), [base]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Measurements</h2>
        <p className="mt-1 text-xs text-slate-500">All values are in centimeters (cm).</p>
      </div>

      <div className="space-y-2">
        {measurementFields.map((field) => (
          <DebouncedNumberField
            key={field.key}
            label={field.label}
            value={base[field.key]}
            min={field.min}
            max={field.max}
            step={field.step}
            slider={field.slider}
            onCommit={(next) => setBaseMeasurement(field.key as keyof BaseMeasurements, next)}
          />
        ))}
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Options</h3>
        <div className="mt-2 space-y-2">
          {toggleFields.map((field) => (
            <label key={field.key} className="flex items-center justify-between text-sm text-slate-700">
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
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Measurement Summary</h3>
        <dl className="mt-2 space-y-1">
          {derivedFieldLabels.map((field) => (
            <div key={field.key} className="flex items-center justify-between text-sm">
              <dt className="text-slate-600">{field.label}</dt>
              <dd className="font-medium text-slate-900">{formatCm(derived[field.key])}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
