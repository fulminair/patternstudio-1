"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AUTHOR_ORDER,
  AVAILABLE_PATTERNS,
  UPCOMING_PATTERNS,
  type ActivePatternId,
  type PatternAuthor,
} from "@/lib/patternCatalog";

type TopBarProps = {
  activePattern: ActivePatternId;
  onShare: () => void;
  onExport: () => void;
  isShareCopied: boolean;
  exportSelectedOnly: boolean;
  onToggleExportSelectedOnly: (checked: boolean) => void;
};

const iconClass = "h-4 w-4";

export function TopBar({
  activePattern,
  onShare,
  onExport,
  isShareCopied,
  exportSelectedOnly,
  onToggleExportSelectedOnly,
}: TopBarProps) {
  const router = useRouter();

  const activePatternEntry = useMemo(
    () => AVAILABLE_PATTERNS.find((pattern) => pattern.id === activePattern) ?? AVAILABLE_PATTERNS[0],
    [activePattern],
  );
  const [mobileAuthor, setMobileAuthor] = useState<PatternAuthor>(activePatternEntry.author);

  const handlePatternChange = (value: string) => {
    const next = AVAILABLE_PATTERNS.find((option) => option.id === value);
    if (next) {
      router.push(next.href);
    }
  };

  const statusLabel = (status: "almostReady" | "comingSoon"): string =>
    status === "almostReady" ? "Almost ready" : "Coming soon";

  const mobileAvailablePatterns = useMemo(
    () => AVAILABLE_PATTERNS.filter((pattern) => pattern.author === mobileAuthor),
    [mobileAuthor],
  );
  const mobileUpcomingPatterns = useMemo(
    () => UPCOMING_PATTERNS.filter((pattern) => pattern.author === mobileAuthor),
    [mobileAuthor],
  );
  const mobilePatternValue = activePatternEntry.author === mobileAuthor ? activePatternEntry.id : "";

  const renderPatternOptions = () => (
    <>
      {AUTHOR_ORDER.map((author) => {
        const availableForAuthor = AVAILABLE_PATTERNS.filter((pattern) => pattern.author === author);
        const upcomingForAuthor = UPCOMING_PATTERNS.filter((pattern) => pattern.author === author);

        return (
          <optgroup key={author} label={author.toUpperCase()}>
            {availableForAuthor.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>
                {`${pattern.label} (${pattern.units})`}
              </option>
            ))}
            {upcomingForAuthor.map((pattern) => (
              <option key={pattern.id} value={pattern.id} disabled>
                {`${pattern.label} (${statusLabel(pattern.status)}, ${pattern.units})`}
              </option>
            ))}
          </optgroup>
        );
      })}
    </>
  );

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-2 sm:px-6 md:h-14 md:py-0">
      <div className="flex items-center justify-between gap-2 md:h-full">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold tracking-wide text-white">
            PatternStudio
          </div>
          <div className="hidden md:block">
            <select
              aria-label="Pattern selector"
              value={activePattern}
              onChange={(event) => handlePatternChange(event.target.value)}
              className="min-w-[320px] rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-slate-500"
            >
              {renderPatternOptions()}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <label className="hidden items-center gap-2 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 md:flex">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-slate-900"
              checked={exportSelectedOnly}
              onChange={(event) => onToggleExportSelectedOnly(event.target.checked)}
            />
            Export selected only
          </label>

          <button
            type="button"
            onClick={onShare}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            {isShareCopied ? "Copied" : "Share"}
          </button>

          <button
            type="button"
            onClick={onExport}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Export SVG
          </button>

          <a
            href="https://discord.com"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-slate-300 p-2 text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
            aria-label="Discord"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden="true">
              <path d="M20.3 4.4A17 17 0 0 0 16 3a12 12 0 0 0-.6 1.2 16 16 0 0 0-6.8 0A12 12 0 0 0 8 3a17 17 0 0 0-4.3 1.4C1 8.2.3 11.9.6 15.6A17.4 17.4 0 0 0 6 18.3l1.3-2.2a11.3 11.3 0 0 1-2-.9l.5-.4c3.8 1.8 7.9 1.8 11.7 0l.5.4c-.7.4-1.4.7-2 .9l1.3 2.2a17.4 17.4 0 0 0 5.4-2.7c.4-4.3-.7-8-2.4-11.2M8.7 13.3c-1.1 0-2-1-2-2.1s.9-2.1 2-2.1c1.1 0 2 1 2 2.1s-.9 2.1-2 2.1m6.6 0c-1.1 0-2-1-2-2.1s.9-2.1 2-2.1c1.1 0 2 1 2 2.1s-.9 2.1-2 2.1" />
            </svg>
          </a>

          <a
            href="https://github.com/morethanpatterns/patternhub"
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-slate-300 p-2 text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
            aria-label="GitHub"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className={iconClass} aria-hidden="true">
              <path d="M12 1.8a10.2 10.2 0 0 0-3.2 19.9c.5.1.7-.2.7-.5v-2c-2.8.6-3.3-1.2-3.3-1.2a2.6 2.6 0 0 0-1.1-1.4c-.9-.6.1-.6.1-.6a2.1 2.1 0 0 1 1.5 1 2.2 2.2 0 0 0 3 1 2.3 2.3 0 0 1 .7-1.4c-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.7s.8-.2 2.8 1a9.7 9.7 0 0 1 5 0c2-1.2 2.8-1 2.8-1a3.6 3.6 0 0 1 .1 2.7 3.9 3.9 0 0 1 1 2.7c0 3.9-2.4 4.7-4.7 5a2.6 2.6 0 0 1 .8 2v3c0 .3.2.7.7.5A10.2 10.2 0 0 0 12 1.8" />
            </svg>
          </a>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 md:hidden">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-600">Author</label>
          <select
            aria-label="Author selector"
            value={mobileAuthor}
            onChange={(event) => setMobileAuthor(event.target.value as PatternAuthor)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-800 outline-none focus:border-slate-500"
          >
            {AUTHOR_ORDER.map((author) => (
              <option key={author} value={author}>
                {author}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-slate-600">Pattern</label>
          <select
            aria-label="Pattern selector"
            value={mobilePatternValue}
            onChange={(event) => handlePatternChange(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-800 outline-none focus:border-slate-500"
          >
            <option value="" disabled>
              Select pattern
            </option>
            {mobileAvailablePatterns.map((pattern) => (
              <option key={pattern.id} value={pattern.id}>
                {`${pattern.label} (${pattern.units})`}
              </option>
            ))}
            {mobileUpcomingPatterns.length > 0 ? (
              <optgroup label="Unavailable">
                {mobileUpcomingPatterns.map((pattern) => (
                  <option key={pattern.id} value={pattern.id} disabled>
                    {`${pattern.label} (${statusLabel(pattern.status)})`}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </div>
      </div>
    </header>
  );
}
