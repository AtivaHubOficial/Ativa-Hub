import type { LogzzImportCandidate } from "./types.ts";

export const logzzCandidateKey = (candidate: LogzzImportCandidate) =>
  `${candidate.externalProductId}:${candidate.externalOfferId}`;

export type LogzzSyncAction = {
  candidate: LogzzImportCandidate;
  operation: "create" | "update";
};

export function planLogzzSync(
  candidates: LogzzImportCandidate[],
  existingKeys: ReadonlySet<string>,
): LogzzSyncAction[] {
  const known = new Set(existingKeys);
  return candidates.map((candidate) => {
    const key = logzzCandidateKey(candidate);
    const operation = known.has(key) ? "update" : "create";
    known.add(key);
    return { candidate, operation };
  });
}
