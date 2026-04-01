/**
 * Keys that end the current formula range-reference segment (same UX as typing "," between
 * function args): clear the blue range overlay and return sheet selection to the anchor cell.
 */
const FORMULA_SEGMENT_BOUNDARY_KEYS = new Set<string>([
  ",",
  "+",
  "-",
  "*",
  "/",
  "%",
  "^",
  "&",
]);

export function isFormulaSegmentBoundaryKey(key: string): boolean {
  return FORMULA_SEGMENT_BOUNDARY_KEYS.has(key);
}
