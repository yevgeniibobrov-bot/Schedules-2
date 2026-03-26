/**
 * Shared sub-unit color assignment.
 * Guarantees each unique unit name gets a distinct color (up to palette size).
 * Uses a global registry — first-seen order determines color index.
 */

// 12 visually distinct solid colors for dots/bars
const SOLID_PALETTE = [
  "var(--chart-1)",                   // blue
  "var(--chart-2)",                   // green
  "var(--chart-3)",                   // amber
  "var(--chart-5)",                   // purple
  "var(--chart-4)",                   // red
  "rgba(0, 166, 153, 1)",            // teal
  "rgba(219, 68, 149, 1)",           // pink
  "rgba(100, 100, 100, 1)",          // gray
  "rgba(230, 145, 56, 1)",           // orange
  "rgba(0, 128, 200, 1)",            // sky blue
  "rgba(140, 180, 50, 1)",           // lime
  "rgba(160, 90, 50, 1)",            // brown
];

// Matching alpha-20 fills for segment backgrounds
const ALPHA_PALETTE = [
  "var(--chart-1-alpha-20)",          // blue
  "var(--chart-2-alpha-20)",          // green
  "var(--chart-3-alpha-20)",          // amber
  "var(--chart-5-alpha-20)",          // purple
  "var(--chart-4-alpha-20)",          // red
  "rgba(0, 166, 153, 0.20)",         // teal
  "rgba(219, 68, 149, 0.20)",        // pink
  "rgba(100, 100, 100, 0.20)",       // gray
  "rgba(230, 145, 56, 0.20)",        // orange
  "rgba(0, 128, 200, 0.20)",         // sky blue
  "rgba(140, 180, 50, 0.20)",        // lime
  "rgba(160, 90, 50, 0.20)",         // brown
];

// Global registry: unit name → assigned index
const registry = new Map<string, number>();
let nextIndex = 0;

function getIndex(unitName: string): number {
  const key = unitName.trim().toLowerCase();
  let idx = registry.get(key);
  if (idx === undefined) {
    idx = nextIndex;
    registry.set(key, idx);
    nextIndex++;
  }
  return idx % SOLID_PALETTE.length;
}

/** Solid color for dots, timeline bars, tooltip indicators */
export function getSubUnitColor(unitName: string): string {
  return SOLID_PALETTE[getIndex(unitName)];
}

/** Light alpha fill for day-view card segments */
export function getSubUnitAlphaColor(unitName: string): string {
  return ALPHA_PALETTE[getIndex(unitName)];
}

/** Pre-register a list of unit names to lock their color assignments */
export function registerUnits(names: string[]): void {
  for (const n of names) getIndex(n);
}
