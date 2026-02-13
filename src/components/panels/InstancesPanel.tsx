"use client";

import { useEffect, useRef, useState } from "react";
import type { Measurements, PatternInstance } from "@/patterns/types";
import { usePatternStore } from "@/lib/store";

type OverrideField = {
  key: keyof Measurements;
  label: string;
  min: number;
  max: number;
  step: number;
};

const overrideFields: OverrideField[] = [
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

type OverrideNumberInputProps = {
  instanceId: string;
  field: OverrideField;
  baseValue: number;
  overrideValue: number | undefined;
};

function OverrideNumberInput({
  instanceId,
  field,
  baseValue,
  overrideValue,
}: OverrideNumberInputProps) {
  const setOverride = usePatternStore((state) => state.setOverride);
  const [draft, setDraft] = useState(overrideValue === undefined ? "" : String(overrideValue));
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const commit = (nextRaw: string) => {
    if (nextRaw.trim() === "") {
      setOverride(instanceId, field.key, undefined);
      return;
    }

    const parsed = Number(nextRaw);
    if (!Number.isFinite(parsed)) {
      return;
    }

    setOverride(instanceId, field.key, parsed);
  };

  return (
    <div className="rounded-md border border-slate-200 bg-white p-2">
      <div className="mb-1 flex items-center justify-between">
        <label className="text-xs font-medium text-slate-700">{field.label}</label>
        <span className="text-[11px] text-slate-500">Base {baseValue.toFixed(2)} cm</span>
      </div>
      <input
        type="number"
        value={draft}
        placeholder="Use base"
        min={field.min}
        max={field.max}
        step={field.step}
        onChange={(event) => {
          const nextRaw = event.target.value;
          setDraft(nextRaw);

          if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
          }

          timeoutRef.current = window.setTimeout(() => {
            commit(nextRaw);
          }, 220);
        }}
        onBlur={() => {
          if (draft.trim() === "") {
            setOverride(instanceId, field.key, undefined);
            return;
          }

          const parsed = Number(draft);
          if (!Number.isFinite(parsed)) {
            setDraft(overrideValue === undefined ? "" : String(overrideValue));
            return;
          }

          const clamped = Math.min(field.max, Math.max(field.min, parsed));
          setDraft(String(clamped));
          setOverride(instanceId, field.key, clamped);
        }}
        className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm text-slate-800 outline-none transition focus:border-slate-500"
      />
    </div>
  );
}

function InstanceListItem({
  instance,
  selected,
}: {
  instance: PatternInstance;
  selected: boolean;
}) {
  const setSelectedInstance = usePatternStore((state) => state.setSelectedInstance);
  const toggleVisible = usePatternStore((state) => state.toggleVisible);
  const removeInstance = usePatternStore((state) => state.removeInstance);

  return (
    <li
      className={`rounded-md border px-3 py-2 transition ${
        selected
          ? "border-slate-800 bg-slate-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setSelectedInstance(instance.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: instance.color }}
            aria-hidden="true"
          />
          <span className="truncate text-sm font-medium text-slate-800">{instance.name}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleVisible(instance.id)}
            className={`rounded px-2 py-1 text-xs font-medium ${
              instance.visible
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {instance.visible ? "Shown" : "Hidden"}
          </button>
          <button
            type="button"
            onClick={() => removeInstance(instance.id)}
            className="rounded bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
            aria-label={`Remove ${instance.name}`}
          >
            ×
          </button>
        </div>
      </div>
    </li>
  );
}

const overrideToggleFields: Array<{
  key: "closeWaistShaping" | "reducedDarting";
  label: string;
}> = [
  { key: "closeWaistShaping", label: "Close Waist Shaping" },
  { key: "reducedDarting", label: "Reduced Darting" },
];

export function InstancesPanel() {
  const base = usePatternStore((state) => state.base);
  const instances = usePatternStore((state) => state.instances);
  const selectedInstanceId = usePatternStore((state) => state.ui.selectedInstanceId);
  const addDuplicate = usePatternStore((state) => state.addDuplicate);
  const setOverride = usePatternStore((state) => state.setOverride);
  const resetOverrides = usePatternStore((state) => state.resetOverrides);

  const selectedInstance =
    instances.find((instance) => instance.id === selectedInstanceId) ?? instances[0] ?? null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Instances</h2>
        <button
          type="button"
          onClick={addDuplicate}
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          Duplicate pattern
        </button>
      </div>

      <ul className="space-y-2">
        {instances.map((instance) => (
          <InstanceListItem
            key={instance.id}
            instance={instance}
            selected={instance.id === selectedInstance?.id}
          />
        ))}
      </ul>

      {selectedInstance ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Overrides</h3>
            <button
              type="button"
              onClick={() => resetOverrides(selectedInstance.id)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Reset overrides
            </button>
          </div>

          <div className="space-y-2">
            {overrideFields.map((field) => {
              const overrideValue = selectedInstance.overrides[field.key] as number | undefined;
              return (
                <OverrideNumberInput
                  key={`${selectedInstance.id}-${field.key}-${overrideValue ?? "base"}`}
                  instanceId={selectedInstance.id}
                  field={field}
                  baseValue={base[field.key]}
                  overrideValue={overrideValue}
                />
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2">
            {overrideToggleFields.map((field) => {
              const overrideValue = selectedInstance.overrides[field.key];
              const current =
                overrideValue === undefined ? "base" : overrideValue ? "true" : "false";

              return (
                <label
                  key={field.key}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm"
                >
                  <span className="text-slate-700">{field.label}</span>
                  <select
                    className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700"
                    value={current}
                    onChange={(event) => {
                      const choice = event.target.value;
                      if (choice === "base") {
                        setOverride(selectedInstance.id, field.key, undefined);
                        return;
                      }

                      setOverride(selectedInstance.id, field.key, choice === "true");
                    }}
                  >
                    <option value="base">Use base</option>
                    <option value="true">On</option>
                    <option value="false">Off</option>
                  </select>
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
