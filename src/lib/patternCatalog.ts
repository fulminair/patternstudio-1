export type PatternAuthor = "Aldrich" | "Armstrong" | "Hofenbitzer";

export type ActivePatternId =
  | "aldrich"
  | "armstrong"
  | "hofenbitzer"
  | "hofenbitzerCasual"
  | "hofenbitzerCasualShaping"
  | "hofenbitzerContouredHipGap"
  | "hofenbitzerStandardTrouser"
  | "hofenbitzerWideSleeve"
  | "hofenbitzerTightSleeve";

export type PatternUnits = "cm" | "in";

export type AvailablePatternDefinition = {
  id: ActivePatternId;
  author: PatternAuthor;
  label: string;
  href: string;
  units: PatternUnits;
};

export type UpcomingPatternDefinition = {
  id: string;
  author: PatternAuthor;
  label: string;
  status: "almostReady" | "comingSoon";
  units: PatternUnits;
};

export const AUTHOR_ORDER: PatternAuthor[] = ["Aldrich", "Armstrong", "Hofenbitzer"];

export const AVAILABLE_PATTERNS: AvailablePatternDefinition[] = [
  {
    id: "aldrich",
    author: "Aldrich",
    label: "Aldrich's Close Fitting Bodice",
    href: "/",
    units: "cm",
  },
  {
    id: "armstrong",
    author: "Armstrong",
    label: "Armstrong's Bodice",
    href: "/armstrong",
    units: "in",
  },
  {
    id: "hofenbitzer",
    author: "Hofenbitzer",
    label: "Hofenbitzer's Basic Skirt",
    href: "/hofenbitzer",
    units: "cm",
  },
  {
    id: "hofenbitzerCasual",
    author: "Hofenbitzer",
    label: "Hofenbitzer's Casual Bodice",
    href: "/hofenbitzer-casual",
    units: "cm",
  },
  {
    id: "hofenbitzerCasualShaping",
    author: "Hofenbitzer",
    label: "Hofenbitzer's Casual Bodice (Shaping)",
    href: "/hofenbitzer-casual-shaping",
    units: "cm",
  },
  {
    id: "hofenbitzerContouredHipGap",
    author: "Hofenbitzer",
    label: "Hofenbitzer's Contoured Bodice (Hip Gap)",
    href: "/hofenbitzer-contoured-hip-gap",
    units: "cm",
  },
  {
    id: "hofenbitzerStandardTrouser",
    author: "Hofenbitzer",
    label: "Hofenbitzer's Standard Trousers",
    href: "/hofenbitzer-standard-trouser",
    units: "cm",
  },
  {
    id: "hofenbitzerWideSleeve",
    author: "Hofenbitzer",
    label: "Hofenbitzer's Wide Basic Sleeve",
    href: "/hofenbitzer-sleeve",
    units: "cm",
  },
  {
    id: "hofenbitzerTightSleeve",
    author: "Hofenbitzer",
    label: "Hofenbitzer's Tight Basic Sleeve",
    href: "/hofenbitzer-tight-sleeve",
    units: "cm",
  },
];

export const UPCOMING_PATTERNS: UpcomingPatternDefinition[] = [
  {
    id: "hofenbitzer-bodice-no-hip-gap",
    author: "Hofenbitzer",
    label: "Hofenbitzer's Bodice without Hip Gap",
    status: "comingSoon",
    units: "cm",
  },
];
