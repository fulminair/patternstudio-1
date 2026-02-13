# PatternStudio

PatternStudio is a Next.js web app that ports an Aldrich close-fitting bodice drafting workflow from Illustrator-style scripting into a live interactive SVG workspace.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build and lint

```bash
npm run lint
npm run build
```

## Architecture notes

- `src/patterns/aldrichCloseFittingBodice/engine.ts`: Pure drafting engine (defaults, derived math, scene construction).
- `src/patterns/types.ts`: Shared project, measurement, and scene types.
- `src/lib/store.ts`: Zustand state for base measurements, instances, overrides, selection, and UI flags.
- `src/components/panels/*`: Left-side controls (measurements, toggles, derived summary, instance overrides).
- `src/components/canvas/PatternCanvas.tsx`: Live SVG rendering, pan/zoom via `d3-zoom`, grid/labels/markers controls.
- `src/lib/exportSvg.ts`: SVG export using `XMLSerializer`.
- `src/lib/share/*`: Share URL encoding/decoding for project state hydration.
- `scripts/aldrich_close_fitting_bodice_v1.jsx`: Stored Illustrator-style source reference.
