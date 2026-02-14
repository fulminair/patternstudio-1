"use client";

import type { HofenbitzerContouredHipGapPatternInstance } from "@/patterns/hofenbitzerContouredBodiceHipGap/types";
import { useHofenbitzerContouredHipGapStore } from "@/lib/hofenbitzerContouredHipGapStore";

function DraftListItem({
  draft,
  selected,
}: {
  draft: HofenbitzerContouredHipGapPatternInstance;
  selected: boolean;
}) {
  const setSelectedInstance = useHofenbitzerContouredHipGapStore((state) => state.setSelectedInstance);
  const toggleVisible = useHofenbitzerContouredHipGapStore((state) => state.toggleVisible);
  const removeInstance = useHofenbitzerContouredHipGapStore((state) => state.removeInstance);
  const setInstanceColor = useHofenbitzerContouredHipGapStore((state) => state.setInstanceColor);

  return (
    <li
      className={`rounded-md border px-2 py-2 transition ${
        selected
          ? "border-slate-800 bg-slate-100"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setSelectedInstance(draft.id)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: draft.color }}
            aria-hidden="true"
          />
          <span className="truncate text-sm font-medium text-slate-800">{draft.name}</span>
        </button>

        <div className="flex items-center gap-1">
          <label className="inline-flex h-6 w-6 items-center justify-center">
            <span className="sr-only">{`Set color for ${draft.name}`}</span>
            <input
              type="color"
              value={draft.color}
              onChange={(event) => setInstanceColor(draft.id, event.target.value)}
              className="h-5 w-5 cursor-pointer rounded border border-slate-300 bg-transparent p-0"
              title={`Set color for ${draft.name}`}
            />
          </label>
          <button
            type="button"
            onClick={() => toggleVisible(draft.id)}
            className={`rounded px-2 py-1 text-[11px] font-medium ${
              draft.visible ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {draft.visible ? "Shown" : "Hidden"}
          </button>
          <button
            type="button"
            onClick={() => removeInstance(draft.id)}
            className="rounded bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700"
            aria-label={`Remove ${draft.name}`}
            title="Remove draft"
          >
            ×
          </button>
        </div>
      </div>
    </li>
  );
}

export function HofenbitzerContouredHipGapDraftsPanel() {
  const drafts = useHofenbitzerContouredHipGapStore((state) => state.instances);
  const selectedDraftId = useHofenbitzerContouredHipGapStore((state) => state.ui.selectedInstanceId);
  const addDuplicate = useHofenbitzerContouredHipGapStore((state) => state.addDuplicate);

  const selectedDraft = drafts.find((draft) => draft.id === selectedDraftId) ?? drafts[0] ?? null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Drafts</h2>
        <button
          type="button"
          onClick={addDuplicate}
          className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          Duplicate draft
        </button>
      </div>

      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-1">
        {drafts.map((draft) => (
          <DraftListItem key={draft.id} draft={draft} selected={draft.id === selectedDraft?.id} />
        ))}
      </ul>
    </section>
  );
}
