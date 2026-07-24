export function toggleProductSelection(selected: ReadonlySet<string>, id: string) {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}

export function selectVisibleProducts(selected: ReadonlySet<string>, visibleIds: string[]) {
  return new Set([...selected, ...visibleIds]);
}

export function deselectVisibleProducts(selected: ReadonlySet<string>, visibleIds: string[]) {
  const next = new Set(selected);
  visibleIds.forEach((id) => next.delete(id));
  return next;
}
