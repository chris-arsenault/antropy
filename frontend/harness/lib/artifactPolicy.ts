/** Repository-relative generated data paths. Authored evidence READMEs remain durable. */
export function isLocalExperiment(path: string): boolean {
  const normalized = path.replaceAll("\\", "/");
  return (
    normalized.startsWith("frontend/harness/artifacts/") ||
    normalized.startsWith("frontend/harness/ledger.db") ||
    (normalized.startsWith("docs/evidence/") && !normalized.endsWith("/README.md"))
  );
}
