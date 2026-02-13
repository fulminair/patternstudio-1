# PatternStudio

PatternStudio is a Next.js web app that ports bodice drafting workflows from Illustrator-style scripts into a live interactive SVG workspace.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Pattern routes:
- Aldrich: `http://localhost:3000/`
- Armstrong: `http://localhost:3000/armstrong`

## Build and lint

```bash
npm run lint
npm run build
```

## Architecture notes

- `src/patterns/aldrichCloseFittingBodice/engine.ts`: Aldrich pure drafting engine.
- `src/patterns/armstrongBodice/engine.ts`: Armstrong pure drafting engine.
- `src/patterns/types.ts`: Shared SVG scene types.
- `src/lib/store.ts`: Zustand state for Aldrich project/drafts.
- `src/lib/armstrongStore.ts`: Zustand state for Armstrong project/drafts.
- `src/components/panels/*`: Left-side controls for both routes.
- `src/components/canvas/PatternCanvas.tsx`: Shared live SVG renderer, pan/zoom, grid/labels/markers, cleanup modes.
- `src/lib/exportSvg.ts`: SVG export using `XMLSerializer`.
- `src/lib/share/*`: Share URL encode/decode for route-specific project hydration.
- `scripts/aldrich_close_fitting_bodice_v1.jsx`: Aldrich Illustrator source reference.
- `scripts/armstrong_bodice_draft_v1.jsx`: Armstrong Illustrator source reference.
