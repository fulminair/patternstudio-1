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
- Hofenbitzer: `http://localhost:3000/hofenbitzer`
- Hofenbitzer Casual: `http://localhost:3000/hofenbitzer-casual`
- Hofenbitzer Contoured Hip Gap: `http://localhost:3000/hofenbitzer-contoured-hip-gap`
- Hofenbitzer Wide Sleeve: `http://localhost:3000/hofenbitzer-sleeve`
- Hofenbitzer Tight Sleeve: `http://localhost:3000/hofenbitzer-tight-sleeve`

## Build and lint

```bash
npm run lint
npm run build
```

## Architecture notes

- `src/patterns/aldrichCloseFittingBodice/engine.ts`: Aldrich pure drafting engine.
- `src/patterns/armstrongBodice/engine.ts`: Armstrong pure drafting engine.
- `src/patterns/hofenbitzerBasicSkirt/engine.ts`: Hofenbitzer pure drafting engine.
- `src/patterns/hofenbitzerCasualBodice/engine.ts`: Hofenbitzer casual bodice pure drafting engine.
- `src/patterns/hofenbitzerContouredBodiceHipGap/engine.ts`: Hofenbitzer contoured bodice with hip gap pure drafting engine.
- `src/patterns/hofenbitzerWideBasicSleeve/engine.ts`: Hofenbitzer wide basic sleeve pure drafting engine.
- `src/patterns/hofenbitzerTightBasicSleeve/engine.ts`: Hofenbitzer tight basic sleeve pure drafting engine.
- `src/patterns/types.ts`: Shared SVG scene types.
- `src/lib/store.ts`: Zustand state for Aldrich project/drafts.
- `src/lib/armstrongStore.ts`: Zustand state for Armstrong project/drafts.
- `src/lib/hofenbitzerStore.ts`: Zustand state for Hofenbitzer project/drafts.
- `src/lib/hofenbitzerCasualStore.ts`: Zustand state for Hofenbitzer casual bodice project/drafts.
- `src/lib/hofenbitzerContouredHipGapStore.ts`: Zustand state for Hofenbitzer contoured hip-gap bodice project/drafts.
- `src/lib/hofenbitzerWideBasicSleeveStore.ts`: Zustand state for Hofenbitzer wide sleeve project/drafts.
- `src/lib/hofenbitzerTightBasicSleeveStore.ts`: Zustand state for Hofenbitzer tight sleeve project/drafts.
- `src/components/panels/*`: Left-side controls for both routes.
- `src/components/canvas/PatternCanvas.tsx`: Shared live SVG renderer, pan/zoom, grid/labels/markers, cleanup modes.
- `src/lib/exportSvg.ts`: SVG export using `XMLSerializer`.
- `src/lib/share/*`: Share URL encode/decode for route-specific project hydration.
- `scripts/aldrich_close_fitting_bodice_v1.jsx`: Aldrich Illustrator source reference.
- `scripts/armstrong_bodice_draft_v1.jsx`: Armstrong Illustrator source reference.
- `scripts/hofenbitzer_basic_skirt_v1.jsx`: Hofenbitzer Illustrator source reference.
- `scripts/hofenbitzer_casual_bodice_v1.jsx`: Hofenbitzer casual bodice Illustrator source reference.
- `scripts/hofenbitzer_contoured_bodice_hipgap.jsx`: Hofenbitzer contoured bodice with hip-gap Illustrator source reference.
- `scripts/hofenbitzer_wide_basic_sleeve_v1.jsx`: Hofenbitzer wide basic sleeve Illustrator source reference.
- `scripts/hofenbitzer_tight_basic_sleeve_v1.jsx`: Hofenbitzer tight basic sleeve Illustrator source reference.
