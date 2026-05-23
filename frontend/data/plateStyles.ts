export type PlateStyleId =
  | "new_2026"
  | "private"
  | "classic"
  | "motorcycle"
  | "qatar_side_flag"
  | "custom_choice";

export type PlateLetter = "Q" | "T" | "R";

export interface PlateStyle {
  id: PlateStyleId;
  titleAr: string;
  image: string;
  requiresPlateNumber: boolean;
  supportsLetter: boolean;
  defaultLetter?: PlateLetter;
  letters?: PlateLetter[];
}

export const plateStyles: PlateStyle[] = [
  {
    id: "new_2026",
    titleAr: "اللوحة الجديدة 2026",
    image: "/placeholders/plate-styles/plate-new-2026.png",
    requiresPlateNumber: true,
    supportsLetter: true,
    defaultLetter: "Q",
    letters: ["Q", "T", "R"],
  },
  {
    id: "private",
    titleAr: "اللوحة الخاصة",
    image: "/placeholders/plate-styles/plate-private.png",
    requiresPlateNumber: true,
    supportsLetter: false,
  },
  {
    id: "classic",
    titleAr: "اللوحة الكلاسيكية",
    image: "/placeholders/plate-styles/plate-classic.png",
    requiresPlateNumber: true,
    supportsLetter: false,
  },
  {
    id: "motorcycle",
    titleAr: "لوحة الدراجة النارية",
    image: "/placeholders/plate-styles/plate-motorcycle.png",
    requiresPlateNumber: true,
    supportsLetter: false,
  },
  {
    id: "qatar_side_flag",
    titleAr: "لوحة قطر الجانبية",
    image: "/placeholders/plate-styles/plate-side-flag.png",
    requiresPlateNumber: true,
    supportsLetter: false,
  },
  {
    id: "custom_choice",
    titleAr: "اختيار مخصص",
    image: "/placeholders/plate-styles/plate-custom.png",
    requiresPlateNumber: false,
    supportsLetter: false,
  },
];

export function getPlateStyle(id: PlateStyleId): PlateStyle {
  const style = plateStyles.find((s) => s.id === id);
  if (!style) {
    throw new Error(`Unknown plate style: ${id}`);
  }
  return style;
}

export function getPlateStyleLabel(id: PlateStyleId): string {
  return getPlateStyle(id).titleAr;
}
