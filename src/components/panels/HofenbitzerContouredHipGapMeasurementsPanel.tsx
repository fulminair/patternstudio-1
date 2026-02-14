"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  computeDerived,
  getFitProfiles,
} from "@/patterns/hofenbitzerContouredBodiceHipGap/engine";
import type {
  HofenbitzerContouredHipGapBaseMeasurements,
  HofenbitzerContouredHipGapDerivedValues,
} from "@/patterns/hofenbitzerContouredBodiceHipGap/types";
import { useHofenbitzerContouredHipGapStore } from "@/lib/hofenbitzerContouredHipGapStore";

type EditableKey = Exclude<keyof HofenbitzerContouredHipGapBaseMeasurements, "FitIndex">;

type FieldConfig = {
  label: string;
  min: number;
  max: number;
  step: number;
};

type TripletRow = {
  main: EditableKey;
  ease: EditableKey;
  derivedLabel: string;
  derivedValue: (derived: HofenbitzerContouredHipGapDerivedValues) => number;
};

const fitProfiles = getFitProfiles();

const fieldConfig: Record<EditableKey, FieldConfig> = {
  AhD: { label: "AhD", min: 10, max: 40, step: 0.1 },
  AhDEase: { label: "Ease", min: 0, max: 8, step: 0.1 },
  BrC: { label: "BrC", min: 60, max: 160, step: 0.1 },
  BrCEase: { label: "Ease", min: 0, max: 20, step: 0.1 },
  WaC: { label: "WaC", min: 50, max: 140, step: 0.1 },
  WaCEase: { label: "Ease", min: 0, max: 20, step: 0.1 },
  HiC: { label: "HiC", min: 70, max: 170, step: 0.1 },
  HiCEase: { label: "Ease", min: 0, max: 20, step: 0.1 },
  BG: { label: "BG", min: 6, max: 30, step: 0.1 },
  BGEase: { label: "Ease", min: 0, max: 6, step: 0.1 },
  AG: { label: "AG", min: 4, max: 20, step: 0.1 },
  AGEase: { label: "Ease", min: 0, max: 6, step: 0.1 },
  BrG: { label: "BrG", min: 8, max: 32, step: 0.1 },
  BrGEase: { label: "Ease", min: 0, max: 8, step: 0.1 },
  ShG: { label: "ShG", min: 6, max: 24, step: 0.1 },
  ShGEase: { label: "Ease", min: 0, max: 6, step: 0.1 },
  BL: { label: "BL", min: 20, max: 70, step: 0.1 },
  BLBal: { label: "Ease", min: -10, max: 10, step: 0.1 },
  FL: { label: "FL", min: 20, max: 80, step: 0.1 },
  FLBal: { label: "Ease", min: -10, max: 10, step: 0.1 },
  NeG: { label: "NeG", min: 3, max: 20, step: 0.1 },
  MoL: { label: "MoL", min: 30, max: 140, step: 0.1 },
  HiD: { label: "HiD", min: 8, max: 40, step: 0.1 },
  ShA: { label: "ShA (deg)", min: 0, max: 45, step: 0.1 },
  BrD: { label: "BrD", min: 8, max: 45, step: 0.1 },
  ShoulderDifference: { label: "Shoulder Diff. (deg)", min: 0, max: 12, step: 0.1 },
  BackContour: { label: "Back Contour", min: 1, max: 4, step: 0.1 },
  BackShoulderDartIntake: { label: "Back Shoulder Dart", min: 0, max: 4, step: 0.1 },
  FrontWaistDartAddition: { label: "Front Waist Dart Add.", min: 0, max: 1, step: 0.1 },
  FrontDartLength: { label: "Front Dart Length", min: 0, max: 25, step: 0.1 },
  MainBackDartLength: { label: "Main Back Dart Length", min: 14, max: 16, step: 0.1 },
  SecondBackDartLength: { label: "2nd Back Dart Length", min: 12, max: 14, step: 0.1 },
};

const tripletRows: TripletRow[] = [
  { main: "BrC", ease: "BrCEase", derivedLabel: "BrC+", derivedValue: (d) => d.BrCFinal },
  { main: "WaC", ease: "WaCEase", derivedLabel: "WaW", derivedValue: (d) => d.WaCFinal },
  { main: "HiC", ease: "HiCEase", derivedLabel: "HiW", derivedValue: (d) => d.HiCFinal },
  { main: "AhD", ease: "AhDEase", derivedLabel: "AhD+", derivedValue: (d) => d.AhDPlus },
  { main: "BG", ease: "BGEase", derivedLabel: "BG+", derivedValue: (d) => d.BGPlus },
  { main: "AG", ease: "AGEase", derivedLabel: "AG+", derivedValue: (d) => d.AGPlus },
  { main: "BrG", ease: "BrGEase", derivedLabel: "BrG+", derivedValue: (d) => d.BrGPlus },
  { main: "ShG", ease: "ShGEase", derivedLabel: "fShS", derivedValue: (d) => d.fShS },
  { main: "BL", ease: "BLBal", derivedLabel: "BL", derivedValue: (d) => d.BLFinal },
  { main: "FL", ease: "FLBal", derivedLabel: "FL", derivedValue: (d) => d.FLFinal },
];

const formatNumber = (value: number): string =>
  (Math.round(value * 100) / 100).toFixed(2);

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

export function HofenbitzerContouredHipGapMeasurementsPanel() {
  const base = useHofenbitzerContouredHipGapStore((state) => state.base);
  const instances = useHofenbitzerContouredHipGapStore((state) => state.instances);
  const selectedInstanceId = useHofenbitzerContouredHipGapStore((state) => state.ui.selectedInstanceId);
  const setOverride = useHofenbitzerContouredHipGapStore((state) => state.setOverride);
  const applyFitProfileToDraft = useHofenbitzerContouredHipGapStore((state) => state.applyFitProfileToDraft);
  const resetOverrides = useHofenbitzerContouredHipGapStore((state) => state.resetOverrides);

  const selectedDraft =
    instances.find((instance) => instance.id === selectedInstanceId) ?? instances[0] ?? null;

  const selectedMeasurements = useMemo<HofenbitzerContouredHipGapBaseMeasurements>(() => {
    if (!selectedDraft) {
      return base;
    }

    return {
      ...base,
      ...selectedDraft.overrides,
    };
  }, [base, selectedDraft]);

  const derived = useMemo(() => computeDerived(selectedMeasurements), [selectedMeasurements]);

  const commitMeasurement = (key: keyof HofenbitzerContouredHipGapBaseMeasurements, value: number) => {
    if (!selectedDraft) {
      return;
    }

    setOverride(selectedDraft.id, key, value);
  };

  const handleFitChange = (index: number) => {
    if (!selectedDraft) {
      return;
    }

    applyFitProfileToDraft(selectedDraft.id, index);
  };

  return (
    <section className="space-y-3">
      <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-600">
        <p className="font-semibold text-slate-700">
          Hofenbitzer&apos;s Contoured Bodice (Hip Gap)
        </p>
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

      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Measurements</h3>
        </div>

        <div className="mt-2">
          <div className="mb-2 grid grid-cols-3 gap-2">
            <div className="col-span-3 rounded-md border border-slate-200 bg-white px-2 py-2">
              <label className="mb-1 block text-[11px] font-semibold text-slate-700">Fit Category</label>
              <select
                value={Math.round(selectedMeasurements.FitIndex)}
                onChange={(event) => handleFitChange(Number(event.target.value))}
                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              >
                {fitProfiles.map((profile, index) => (
                  <option key={profile.name} value={index}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {tripletRows.map((row) => {
              const mainConfig = fieldConfig[row.main];
              const easeConfig = fieldConfig[row.ease];
              return (
                <div key={`${row.main}-${row.ease}`} className="grid grid-cols-3 gap-2">
                  <EditableNumberField
                    value={selectedMeasurements[row.main]}
                    label={mainConfig.label}
                    min={mainConfig.min}
                    max={mainConfig.max}
                    step={mainConfig.step}
                    onCommit={(next) => commitMeasurement(row.main, next)}
                  />
                  <EditableNumberField
                    value={selectedMeasurements[row.ease]}
                    label={easeConfig.label}
                    min={easeConfig.min}
                    max={easeConfig.max}
                    step={easeConfig.step}
                    onCommit={(next) => commitMeasurement(row.ease, next)}
                  />
                  <DerivedReadOnlyField
                    label={row.derivedLabel}
                    value={row.derivedValue(derived)}
                  />
                </div>
              );
            })}

            <div className="grid grid-cols-3 gap-2">
              <EditableNumberField
                value={selectedMeasurements.NeG}
                label={fieldConfig.NeG.label}
                min={fieldConfig.NeG.min}
                max={fieldConfig.NeG.max}
                step={fieldConfig.NeG.step}
                onCommit={(next) => commitMeasurement("NeG", next)}
              />
              <EditableNumberField
                value={selectedMeasurements.MoL}
                label={fieldConfig.MoL.label}
                min={fieldConfig.MoL.min}
                max={fieldConfig.MoL.max}
                step={fieldConfig.MoL.step}
                onCommit={(next) => commitMeasurement("MoL", next)}
              />
              <EditableNumberField
                value={selectedMeasurements.HiD}
                label={fieldConfig.HiD.label}
                min={fieldConfig.HiD.min}
                max={fieldConfig.HiD.max}
                step={fieldConfig.HiD.step}
                onCommit={(next) => commitMeasurement("HiD", next)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <EditableNumberField
                value={selectedMeasurements.ShA}
                label={fieldConfig.ShA.label}
                min={fieldConfig.ShA.min}
                max={fieldConfig.ShA.max}
                step={fieldConfig.ShA.step}
                onCommit={(next) => commitMeasurement("ShA", next)}
              />
              <EditableNumberField
                value={selectedMeasurements.BrD}
                label={fieldConfig.BrD.label}
                min={fieldConfig.BrD.min}
                max={fieldConfig.BrD.max}
                step={fieldConfig.BrD.step}
                onCommit={(next) => commitMeasurement("BrD", next)}
              />
              <EditableNumberField
                value={selectedMeasurements.ShoulderDifference}
                label={fieldConfig.ShoulderDifference.label}
                min={fieldConfig.ShoulderDifference.min}
                max={fieldConfig.ShoulderDifference.max}
                step={fieldConfig.ShoulderDifference.step}
                onCommit={(next) => commitMeasurement("ShoulderDifference", next)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <EditableNumberField
                value={selectedMeasurements.BackContour}
                label={fieldConfig.BackContour.label}
                min={fieldConfig.BackContour.min}
                max={fieldConfig.BackContour.max}
                step={fieldConfig.BackContour.step}
                onCommit={(next) => commitMeasurement("BackContour", next)}
              />
              <EditableNumberField
                value={selectedMeasurements.BackShoulderDartIntake}
                label={fieldConfig.BackShoulderDartIntake.label}
                min={fieldConfig.BackShoulderDartIntake.min}
                max={fieldConfig.BackShoulderDartIntake.max}
                step={fieldConfig.BackShoulderDartIntake.step}
                onCommit={(next) => commitMeasurement("BackShoulderDartIntake", next)}
              />
              <EditableNumberField
                value={selectedMeasurements.FrontWaistDartAddition}
                label={fieldConfig.FrontWaistDartAddition.label}
                min={fieldConfig.FrontWaistDartAddition.min}
                max={fieldConfig.FrontWaistDartAddition.max}
                step={fieldConfig.FrontWaistDartAddition.step}
                onCommit={(next) => commitMeasurement("FrontWaistDartAddition", next)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <EditableNumberField
                value={selectedMeasurements.FrontDartLength}
                label={fieldConfig.FrontDartLength.label}
                min={fieldConfig.FrontDartLength.min}
                max={fieldConfig.FrontDartLength.max}
                step={fieldConfig.FrontDartLength.step}
                onCommit={(next) => commitMeasurement("FrontDartLength", next)}
              />
              <EditableNumberField
                value={selectedMeasurements.MainBackDartLength}
                label={fieldConfig.MainBackDartLength.label}
                min={fieldConfig.MainBackDartLength.min}
                max={fieldConfig.MainBackDartLength.max}
                step={fieldConfig.MainBackDartLength.step}
                onCommit={(next) => commitMeasurement("MainBackDartLength", next)}
              />
              <EditableNumberField
                value={selectedMeasurements.SecondBackDartLength}
                label={fieldConfig.SecondBackDartLength.label}
                min={fieldConfig.SecondBackDartLength.min}
                max={fieldConfig.SecondBackDartLength.max}
                step={fieldConfig.SecondBackDartLength.step}
                onCommit={(next) => commitMeasurement("SecondBackDartLength", next)}
              />
            </div>

            <div className="mt-3 border-t border-slate-200 pt-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Hip Gap and Waist Distribution
              </h4>

              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <DerivedReadOnlyField label="HiGap" value={derived.HiGap} />
                  <DerivedReadOnlyField label="HiG" value={derived.HiG} />
                  <DerivedReadOnlyField label="HiDiff" value={derived.HiDiff} />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <DerivedReadOnlyField label="Front Waist Gap" value={derived.frontWaistGap} />
                  <DerivedReadOnlyField label="Back Waist Gap" value={derived.backWaistGap} />
                  <DerivedReadOnlyField label="Waist Gap Total" value={derived.waistGapTotal} />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <DerivedReadOnlyField label="Waist Difference" value={derived.waistDifference} />
                  <DerivedReadOnlyField label="Waist Side Share" value={derived.waistSideShare} />
                  <DerivedReadOnlyField
                    label="Waist Back Arm Share"
                    value={derived.waistBackArmShare}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <DerivedReadOnlyField
                    label="Waist Back Dart Share"
                    value={derived.waistBackDartShare}
                  />
                  <DerivedReadOnlyField label="BL Final" value={derived.BLFinal} />
                  <DerivedReadOnlyField label="FL Final" value={derived.FLFinal} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
