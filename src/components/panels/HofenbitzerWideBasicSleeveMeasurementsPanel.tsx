"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeDerived,
  computeDraftMetrics,
} from "@/patterns/hofenbitzerWideBasicSleeve/engine";
import type {
  HofenbitzerWideBasicSleeveBaseMeasurements,
  HofenbitzerWideBasicSleeveEffectiveMeasurements,
} from "@/patterns/hofenbitzerWideBasicSleeve/types";
import { useHofenbitzerWideBasicSleeveStore } from "@/lib/hofenbitzerWideBasicSleeveStore";

type EditableKey =
  | "AhH"
  | "AhHEase"
  | "fAh"
  | "fAhEase"
  | "bAh"
  | "bAhEase"
  | "AL"
  | "ALEase"
  | "upAC"
  | "upACEase"
  | "WrC"
  | "WrCEase"
  | "CapEasePct"
  | "CapLineEase"
  | "fAP"
  | "bAP";

type FieldConfig = {
  min: number;
  max: number;
  step: number;
};

const fieldConfig: Record<EditableKey, FieldConfig> = {
  AhH: { min: 8, max: 40, step: 0.1 },
  AhHEase: { min: -5, max: 12, step: 0.1 },
  fAh: { min: 8, max: 40, step: 0.1 },
  fAhEase: { min: -5, max: 12, step: 0.1 },
  bAh: { min: 8, max: 50, step: 0.1 },
  bAhEase: { min: -5, max: 12, step: 0.1 },
  AL: { min: 30, max: 90, step: 0.1 },
  ALEase: { min: -12, max: 16, step: 0.1 },
  upAC: { min: 10, max: 80, step: 0.1 },
  upACEase: { min: -15, max: 20, step: 0.1 },
  WrC: { min: 8, max: 50, step: 0.1 },
  WrCEase: { min: -8, max: 18, step: 0.1 },
  CapEasePct: { min: -20, max: 40, step: 0.1 },
  CapLineEase: { min: -20, max: 20, step: 0.1 },
  fAP: { min: 0, max: 30, step: 0.1 },
  bAP: { min: 0, max: 30, step: 0.1 },
};

const formatNumber = (value: number): string => (Math.round(value * 100) / 100).toFixed(2);

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

    return () => {
      window.clearTimeout(timeout);
    };
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

type ReadOnlyFieldProps = {
  label: string;
  value: string;
  muted?: boolean;
};

function ReadOnlyField({ label, value, muted }: ReadOnlyFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-slate-700">{label}</label>
      <input
        type="text"
        value={value}
        readOnly
        className={`w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm ${
          muted ? "bg-slate-100 text-slate-500" : "bg-slate-200 font-semibold text-slate-900"
        }`}
      />
    </div>
  );
}

export function HofenbitzerWideBasicSleeveMeasurementsPanel() {
  const base = useHofenbitzerWideBasicSleeveStore((state) => state.base);
  const instances = useHofenbitzerWideBasicSleeveStore((state) => state.instances);
  const selectedInstanceId = useHofenbitzerWideBasicSleeveStore((state) => state.ui.selectedInstanceId);
  const setOverride = useHofenbitzerWideBasicSleeveStore((state) => state.setOverride);
  const resetOverrides = useHofenbitzerWideBasicSleeveStore((state) => state.resetOverrides);

  const selectedDraft =
    instances.find((instance) => instance.id === selectedInstanceId) ?? instances[0] ?? null;

  const selectedMeasurements = useMemo<HofenbitzerWideBasicSleeveBaseMeasurements>(() => {
    if (!selectedDraft) {
      return base;
    }

    return {
      ...base,
      ...selectedDraft.overrides,
    };
  }, [base, selectedDraft]);

  const derived = useMemo(() => computeDerived(selectedMeasurements), [selectedMeasurements]);

  const metrics = useMemo(() => {
    const effective: HofenbitzerWideBasicSleeveEffectiveMeasurements = {
      ...selectedMeasurements,
      ...derived,
    };
    return computeDraftMetrics(effective);
  }, [selectedMeasurements, derived]);

  const commitMeasurement = (key: EditableKey, value: number) => {
    if (!selectedDraft) {
      return;
    }
    setOverride(selectedDraft.id, key, value);
  };

  return (
    <section className="space-y-3">
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-600">
        <p className="font-semibold text-slate-700">Hofenbitzer&apos;s Wide Basic Sleeve</p>
        <p>
          All measurements are in centimetres. Defaults reference the size 38 sleeve block from
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

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <h3 className="text-sm font-semibold text-slate-800">Measurements</h3>

        <div className="mt-2 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <EditableNumberField
              value={selectedMeasurements.AhH}
              label="AhH"
              {...fieldConfig.AhH}
              onCommit={(next) => commitMeasurement("AhH", next)}
            />
            <EditableNumberField
              value={selectedMeasurements.AhHEase}
              label="Ease"
              {...fieldConfig.AhHEase}
              onCommit={(next) => commitMeasurement("AhHEase", next)}
            />
            <ReadOnlyField label="AhH" value={formatNumber(derived.AhHConstruction)} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <EditableNumberField
              value={selectedMeasurements.fAh}
              label="fAh"
              {...fieldConfig.fAh}
              onCommit={(next) => commitMeasurement("fAh", next)}
            />
            <EditableNumberField
              value={selectedMeasurements.fAhEase}
              label="Ease"
              {...fieldConfig.fAhEase}
              onCommit={(next) => commitMeasurement("fAhEase", next)}
            />
            <ReadOnlyField label="fAh" value={formatNumber(derived.fAhConstruction)} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <EditableNumberField
              value={selectedMeasurements.bAh}
              label="bAh"
              {...fieldConfig.bAh}
              onCommit={(next) => commitMeasurement("bAh", next)}
            />
            <EditableNumberField
              value={selectedMeasurements.bAhEase}
              label="Ease"
              {...fieldConfig.bAhEase}
              onCommit={(next) => commitMeasurement("bAhEase", next)}
            />
            <ReadOnlyField label="bAh" value={formatNumber(derived.bAhConstruction)} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <ReadOnlyField label="AhC" value="--" muted />
            <ReadOnlyField label="Ease" value="--" muted />
            <ReadOnlyField label="AhC" value={formatNumber(derived.AhCConstruction)} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <EditableNumberField
              value={selectedMeasurements.AL}
              label="AL"
              {...fieldConfig.AL}
              onCommit={(next) => commitMeasurement("AL", next)}
            />
            <EditableNumberField
              value={selectedMeasurements.ALEase}
              label="Ease"
              {...fieldConfig.ALEase}
              onCommit={(next) => commitMeasurement("ALEase", next)}
            />
            <ReadOnlyField label="AL" value={formatNumber(derived.SlL)} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <EditableNumberField
              value={selectedMeasurements.upAC}
              label="upAC"
              {...fieldConfig.upAC}
              onCommit={(next) => commitMeasurement("upAC", next)}
            />
            <EditableNumberField
              value={selectedMeasurements.upACEase}
              label="Ease"
              {...fieldConfig.upACEase}
              onCommit={(next) => commitMeasurement("upACEase", next)}
            />
            <ReadOnlyField label="upAC" value={formatNumber(derived.SlW)} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <EditableNumberField
              value={selectedMeasurements.WrC}
              label="WrC"
              {...fieldConfig.WrC}
              onCommit={(next) => commitMeasurement("WrC", next)}
            />
            <EditableNumberField
              value={selectedMeasurements.WrCEase}
              label="Ease"
              {...fieldConfig.WrCEase}
              onCommit={(next) => commitMeasurement("WrCEase", next)}
            />
            <ReadOnlyField label="WrC" value={formatNumber(derived.HeW)} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <EditableNumberField
              value={selectedMeasurements.CapEasePct}
              label="Cap Ease (%)"
              {...fieldConfig.CapEasePct}
              onCommit={(next) => commitMeasurement("CapEasePct", next)}
            />
            <ReadOnlyField label="Ease" value="--" muted />
            <ReadOnlyField label="Cap Ease (cm)" value={formatNumber(derived.CapEaseCm)} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <ReadOnlyField label="CapC" value="--" muted />
            <ReadOnlyField label="Ease" value="--" muted />
            <ReadOnlyField label="CapC" value={formatNumber(derived.CapC)} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <EditableNumberField
              value={selectedMeasurements.CapLineEase}
              label="Cap Line Ease"
              {...fieldConfig.CapLineEase}
              onCommit={(next) => commitMeasurement("CapLineEase", next)}
            />
            <ReadOnlyField label="Ease" value="--" muted />
            <ReadOnlyField
              label="Cap Line Ease"
              value={formatNumber(selectedMeasurements.CapLineEase)}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <EditableNumberField
              value={selectedMeasurements.fAP}
              label="fAP"
              {...fieldConfig.fAP}
              onCommit={(next) => commitMeasurement("fAP", next)}
            />
            <ReadOnlyField label="Ease" value="--" muted />
            <ReadOnlyField label="fAP" value={formatNumber(selectedMeasurements.fAP)} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <EditableNumberField
              value={selectedMeasurements.bAP}
              label="bAP"
              {...fieldConfig.bAP}
              onCommit={(next) => commitMeasurement("bAP", next)}
            />
            <ReadOnlyField label="Ease" value="--" muted />
            <ReadOnlyField label="bAP" value={formatNumber(selectedMeasurements.bAP)} />
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-600">Cap Line</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatNumber(derived.CapLineCm)} cm
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Sleeve Width</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatNumber(metrics.sleeveWidth)} cm
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Elbow Width</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatNumber(metrics.elbowWidth)} cm
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-600">Sleeve Cap</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatNumber(metrics.sleeveCap)} cm
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
