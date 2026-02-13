"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ArmstrongBaseMeasurements } from "@/patterns/armstrongBodice/types";
import { useArmstrongStore } from "@/lib/armstrongStore";

type NumericMeasurementKey = Exclude<keyof ArmstrongBaseMeasurements, "bustCup">;

type MeasurementField = {
  key: NumericMeasurementKey;
  label: string;
  min: number;
  max: number;
  step: number;
};

const measurementFields: MeasurementField[] = [
  { key: "fullLength", label: "Full Length (Front)", min: 8, max: 40, step: 0.0625 },
  { key: "fullLengthBack", label: "Full Length (Back)", min: 8, max: 40, step: 0.0625 },
  { key: "acrossShoulder", label: "Across Shoulder (Front)", min: 3, max: 20, step: 0.0625 },
  { key: "acrossShoulderBack", label: "Across Shoulder (Back)", min: 3, max: 20, step: 0.0625 },
  {
    key: "centreFrontLength",
    label: "Centre Front Length",
    min: 6,
    max: 30,
    step: 0.0625,
  },
  {
    key: "centreFrontLengthBack",
    label: "Centre Back Length",
    min: 6,
    max: 30,
    step: 0.0625,
  },
  { key: "bustArc", label: "Bust Arc (Front)", min: 3, max: 24, step: 0.0625 },
  { key: "bustArcBack", label: "Bust Arc (Back)", min: 3, max: 24, step: 0.0625 },
  { key: "shoulderSlope", label: "Shoulder Slope (Front)", min: 8, max: 40, step: 0.0625 },
  { key: "shoulderSlopeBack", label: "Shoulder Slope (Back)", min: 8, max: 40, step: 0.0625 },
  { key: "bustDepth", label: "Bust Depth", min: 3, max: 20, step: 0.0625 },
  { key: "shoulderLength", label: "Shoulder Length (Front)", min: 2, max: 14, step: 0.0625 },
  { key: "shoulderLengthBack", label: "Shoulder Length (Back)", min: 2, max: 14, step: 0.0625 },
  { key: "bustSpan", label: "Bust Span (Front)", min: 2, max: 14, step: 0.0625 },
  { key: "bustSpanBack", label: "Bust Span (Back)", min: 2, max: 14, step: 0.0625 },
  { key: "acrossChest", label: "Across Chest (Front)", min: 2, max: 20, step: 0.0625 },
  { key: "acrossChestBack", label: "Across Chest (Back)", min: 2, max: 20, step: 0.0625 },
  { key: "dartPlacement", label: "Dart Placement (Front)", min: 0, max: 12, step: 0.0625 },
  { key: "dartPlacementBack", label: "Dart Placement (Back)", min: 0, max: 12, step: 0.0625 },
  { key: "newStrap", label: "New Strap", min: 8, max: 40, step: 0.0625 },
  { key: "sideLength", label: "Side Length (Front)", min: 2, max: 20, step: 0.0625 },
  { key: "sideLengthBack", label: "Side Length (Back)", min: 2, max: 20, step: 0.0625 },
  { key: "waistArc", label: "Waist Arc (Front)", min: 2, max: 20, step: 0.0625 },
  { key: "waistArcBack", label: "Waist Arc (Back)", min: 2, max: 20, step: 0.0625 },
  { key: "backNeck", label: "Back Neck", min: 1, max: 12, step: 0.0625 },
];

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

export function ArmstrongMeasurementsPanel() {
  const base = useArmstrongStore((state) => state.base);
  const instances = useArmstrongStore((state) => state.instances);
  const selectedInstanceId = useArmstrongStore((state) => state.ui.selectedInstanceId);
  const setOverride = useArmstrongStore((state) => state.setOverride);
  const resetOverrides = useArmstrongStore((state) => state.resetOverrides);

  const selectedDraft =
    instances.find((instance) => instance.id === selectedInstanceId) ?? instances[0] ?? null;

  const selectedMeasurements = useMemo<ArmstrongBaseMeasurements>(() => {
    if (!selectedDraft) {
      return base;
    }

    return {
      ...base,
      ...selectedDraft.overrides,
    };
  }, [base, selectedDraft]);

  const commitMeasurement = (key: keyof ArmstrongBaseMeasurements, value: number | string) => {
    if (!selectedDraft) {
      return;
    }
    setOverride(selectedDraft.id, key, value);
  };

  return (
    <section className="space-y-3">
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-600">
        <p className="font-semibold text-slate-700">Armstrong&apos;s Bodice</p>
        <p>
          All measurements are in inches. Defaults reference the size 12 block from Armstrong&apos;s
          book - please have it handy when entering your own measurements. Convert fractional
          values (1/2, 1/8, etc.) to decimals before entering them.
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
        {measurementFields.map((field) => (
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
            Bust Cup
          </label>
          <select
            value={selectedMeasurements.bustCup}
            onChange={(event) => commitMeasurement("bustCup", event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-slate-500"
          >
            <option value="A Cup">A Cup</option>
            <option value="B Cup">B Cup</option>
            <option value="C Cup">C Cup</option>
            <option value="D Cup">D Cup</option>
          </select>
        </div>
      </div>

    </section>
  );
}
