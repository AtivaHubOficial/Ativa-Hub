export const LOGZZ_MASS_IMPORT_THRESHOLD = 20;

export function toggleVisibleSelection(
  selected: ReadonlySet<string>,
  visibleIds: string[],
): Set<string> {
  const next = new Set(selected);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => next.has(id));
  visibleIds.forEach((id) =>
    allVisibleSelected ? next.delete(id) : next.add(id),
  );
  return next;
}

export const requiresLogzzImportConfirmation = (selectedCount: number) =>
  selectedCount > LOGZZ_MASS_IMPORT_THRESHOLD;
