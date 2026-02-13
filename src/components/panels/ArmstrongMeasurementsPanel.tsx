"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { computeDerived } from "@/patterns/armstrongBodice/engine";
import type { ArmstrongBaseMeasurements } from "@/patterns/armstrongBodice/types";
import { useArmstrongStore } from "@/lib/armstrongStore";

type NumericMeasurementKey = Exclude<keyof ArmstrongBaseMeasurements, "bustCup">;

type MeasurementRow = {
  label: string;
  front?: NumericMeasurementKey;
  back?: NumericMeasurementKey;
};

const measurementRows: MeasurementRow[] = [
  { label: "1. Full Length", front: "fullLength", back: "fullLengthBack" },
  { label: "2. Across Shoulder", front: "acrossShoulder", back: "acrossShoulderBack" },
  {
    label: "3. Centre Front/Back Length",
    front: "centreFrontLength",
    back: "centreFrontLengthBack",
  },
  { label: "4. Bust/Back Arc", front: "bustArc", back: "bustArcBack" },
  { label: "5. Shoulder Slope", front: "shoulderSlope", back: "shoulderSlopeBack" },
  { label: "6. Bust Depth", front: "bustDepth" },
  { label: "7. Shoulder Length", front: "shoulderLength", back: "shoulderLengthBack" },
  { label: "8. Bust Span", front: "bustSpan", back: "bustSpanBack" },
  { label: "9. Across Chest/Back", front: "acrossChest", back: "acrossChestBack" },
  { label: "10. Dart Placement", front: "dartPlacement", back: "dartPlacementBack" },
  { label: "11. New Strap", front: "newStrap" },
  { label: "12. Side Length", front: "sideLength", back: "sideLengthBack" },
  { label: "13. Waist Arc", front: "waistArc", back: "waistArcBack" },
  { label: "14. Back Neck", back: "backNeck" },
];

const formatInches = (value: number): string => `${(Math.round(value * 100) / 100).toFixed(2)} in`;

type DebouncedNumberInputProps = {
  value: number;
  min: number;
  max: number;
  step: number;
  onCommit: (next: number) => void;
};

function DebouncedNumberInput({
  value,
  min,
  max,
  step,
  onCommit,
}: DebouncedNumberInputProps) {
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
    <input
      type="number"
      inputMode="decimal"
      min={min}
      max={max}
      step={step}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={onBlur}
      className="w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-800 outline-none transition focus:border-slate-500"
    />
  );
}

function TableInputCell({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (next: number) => void;
}) {
  return (
    <DebouncedNumberInput
      value={value}
      min={0}
      max={60}
      step={0.0625}
      onCommit={onCommit}
    />
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

  const derived = useMemo(() => computeDerived(selectedMeasurements), [selectedMeasurements]);

  const commitMeasurement = (key: keyof ArmstrongBaseMeasurements, value: number | string) => {
    if (!selectedDraft) {
      return;
    }
    setOverride(selectedDraft.id, key, value);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            Armstrong Measurements
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

      <div className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-white p-2">
        <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5">
          <label className="text-xs font-medium text-slate-700">Bust Cup</label>
          <select
            value={selectedMeasurements.bustCup}
            onChange={(event) => commitMeasurement("bustCup", event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 outline-none focus:border-slate-500"
          >
            <option value="A Cup">A Cup</option>
            <option value="B Cup">B Cup</option>
            <option value="C Cup">C Cup</option>
            <option value="D Cup">D Cup</option>
          </select>
        </div>

        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="grid grid-cols-[minmax(120px,1fr)_90px_90px] bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            <div className="px-2 py-1.5">Measurement (in)</div>
            <div className="px-2 py-1.5 text-center">Front</div>
            <div className="px-2 py-1.5 text-center">Back</div>
          </div>
          <div className="divide-y divide-slate-200">
            {measurementRows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(120px,1fr)_90px_90px] items-center bg-white"
              >
                <div className="px-2 py-1.5 text-[11px] text-slate-700">{row.label}</div>
                <div className="px-2 py-1.5">
                  {row.front ? (
                    <TableInputCell
                      value={selectedMeasurements[row.front]}
                      onCommit={(next) => commitMeasurement(row.front as keyof ArmstrongBaseMeasurements, next)}
                    />
                  ) : (
                    <div className="text-center text-xs text-slate-400">-</div>
                  )}
                </div>
                <div className="px-2 py-1.5">
                  {row.back ? (
                    <TableInputCell
                      value={selectedMeasurements[row.back]}
                      onCommit={(next) => commitMeasurement(row.back as keyof ArmstrongBaseMeasurements, next)}
                    />
                  ) : (
                    <div className="text-center text-xs text-slate-400">-</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Summary</h3>
        <dl className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded border border-slate-200 bg-white px-2 py-1">
            <dt className="text-[11px] text-slate-500">Cup Offset</dt>
            <dd className="text-xs font-semibold text-slate-900">{formatInches(derived.bustCupOffset)}</dd>
          </div>
          <div className="rounded border border-slate-200 bg-white px-2 py-1">
            <dt className="text-[11px] text-slate-500">Front Intake</dt>
            <dd className="text-xs font-semibold text-slate-900">{formatInches(derived.frontWaistIntake)}</dd>
          </div>
          <div className="rounded border border-slate-200 bg-white px-2 py-1">
            <dt className="text-[11px] text-slate-500">Back Intake</dt>
            <dd className="text-xs font-semibold text-slate-900">{formatInches(derived.backWaistIntake)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
