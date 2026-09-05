import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";

const root = resolve(process.cwd(), process.argv[2] ?? ".");
const docsIndexPath = resolve(root, "docs/README.md");
const sourceIndexPath = resolve(root, "docs/sources/README.md");
const normalizedDocuments = [
  "docs/principles.md",
  "docs/design/README.md",
  "docs/design/controller.md",
  "docs/design/colony-biology.md",
  "docs/design/environment.md",
  "docs/design/experimentation.md",
  "docs/design/advanced.md",
  "docs/design/source-coverage.md",
  "docs/backlog.md",
].map((path) => resolve(root, path));
const sourceDocuments = [
  "docs/sources/design-spec.md",
  "docs/sources/ant-sim-principles.md",
  "docs/sources/ant-sim-appendix-a.md",
  "docs/sources/ant-sim-appendix-b.md",
  "docs/sources/ant-sim-appendix-c.md",
  "docs/sources/ant-sim-appendix-d.md",
  "docs/sources/ant-sim-appendix-e.md",
  "docs/sources/ant-sim-appendix-e2.md",
  "docs/sources/ant-sim-appendix-f.md",
  "docs/sources/ant-sim-appendix-g.md",
  "docs/sources/seed-spec.md",
  "docs/sources/R2-PLAN.md",
  "docs/sources/R3-PLAN.md",
  "docs/sources/PHASE2-PLAN.md",
  "docs/sources/paste-2026-09-02_11-17-56-033Z.txt",
  "docs/sources/paste-2026-09-03_17-00-44-361Z.png",
  "docs/sources/paste-2026-09-04_03-56-08-254Z.txt",
];
const indexedSourceDocuments = [
  "docs/sources/design-spec.md",
  "docs/sources/ant-sim-principles.md",
  "docs/sources/ant-sim-appendix-a.md",
  "docs/sources/ant-sim-appendix-b.md",
  "docs/sources/ant-sim-appendix-c.md",
  "docs/sources/ant-sim-appendix-d.md",
  "docs/sources/ant-sim-appendix-e.md",
  "docs/sources/ant-sim-appendix-e2.md",
  "docs/sources/ant-sim-appendix-f.md",
  "docs/sources/ant-sim-appendix-g.md",
  "docs/sources/seed-spec.md",
].map((path) => resolve(root, path));
const required = [
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  "CHANGELOG.md",
  "docs/README.md",
  "docs/architecture.md",
  "docs/development.md",
  "docs/calibration.md",
  "docs/certifications.md",
  "docs/sources/README.md",
  "docs/adr/README.md",
  ...normalizedDocuments.map((path) => relative(root, path)),
  ...sourceDocuments,
];

function markdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      return markdownFiles(path);
    }
    return extname(entry.name) === ".md" ? [path] : [];
  });
}

function checkRequired(errors: string[]): void {
  for (const path of required) {
    if (!existsSync(resolve(root, path))) {
      errors.push(`missing required document: ${path}`);
    }
  }
}

function localLinkTarget(rawTarget: string): string | null {
  if (rawTarget.startsWith("#") || /^[a-z][a-z+.-]*:/i.test(rawTarget)) {
    return null;
  }
  const withoutFragment = rawTarget.split("#", 1)[0].split("?", 1)[0];
  return withoutFragment.length > 0 ? decodeURIComponent(withoutFragment) : null;
}

function markdownTargets(line: string): string[] {
  const targets: string[] = [];
  let cursor = 0;
  while (cursor < line.length) {
    const start = line.indexOf("](", cursor);
    if (start < 0) {
      break;
    }
    const end = line.indexOf(")", start + 2);
    if (end < 0) {
      break;
    }
    targets.push(line.slice(start + 2, end).split(/\s/, 1)[0]);
    cursor = end + 1;
  }
  return targets;
}

function checkLinks(files: readonly string[], errors: string[]): void {
  for (const file of files) {
    for (const rawTarget of readFileSync(file, "utf8").split("\n").flatMap(markdownTargets)) {
      const target = localLinkTarget(rawTarget.replace(/^<|>$/g, ""));
      if (target !== null && !existsSync(resolve(dirname(file), target))) {
        errors.push(`${relative(root, file)}: broken local link ${rawTarget}`);
      }
    }
  }
}

function headingLines(lines: readonly string[]): number[] {
  const headings: number[] = [];
  for (const [index, line] of lines.entries()) {
    if (/^#{2,6}\s/.test(line)) {
      headings.push(index);
    }
  }
  return headings;
}

function checkHeading(
  docsIndex: string,
  document: string,
  lines: readonly string[],
  lineNumber: number,
  seen: Set<string>,
  errors: string[]
): void {
  const anchor =
    lineNumber >= 2 ? /^<a id="([^"]+)"><\/a>$/.exec(lines[lineNumber - 2])?.[1] : null;
  const location = `${relative(root, document)}:${lineNumber + 1}`;
  if (!anchor) {
    errors.push(`${location}: heading has no stable anchor`);
    return;
  }
  if (seen.has(anchor)) {
    errors.push(`${location}: duplicate anchor ${anchor}`);
  }
  seen.add(anchor);
  const indexedPath = relative(dirname(docsIndexPath), document).replaceAll("\\", "/");
  if (!docsIndex.includes(`(${indexedPath}#${anchor})`)) {
    errors.push(`${location}: anchor ${anchor} is not indexed`);
  }
}

function checkIndexedDocument(docsIndex: string, document: string, errors: string[]): number {
  const lines = readFileSync(document, "utf8").split("\n");
  const headings = headingLines(lines);
  const seen = new Set<string>();
  for (const lineNumber of headings) {
    checkHeading(docsIndex, document, lines, lineNumber, seen, errors);
  }
  return headings.length;
}

function checkIndexedDocuments(documents: readonly string[], errors: string[]): number {
  const docsIndex = readFileSync(docsIndexPath, "utf8");
  return documents.reduce(
    (count, document) => count + checkIndexedDocument(docsIndex, document, errors),
    0
  );
}

function generatedAnchor(heading: string): string {
  return heading
    .replace(/^#{2,6}\s+/, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_ -]/gu, "")
    .replaceAll(" ", "-");
}

function sourceHeadingAnchor(lines: readonly string[], lineNumber: number): string {
  const explicit =
    lineNumber >= 2 ? /^<a id="([^"]+)"><\/a>$/.exec(lines[lineNumber - 2])?.[1] : null;
  return explicit ?? generatedAnchor(lines[lineNumber]);
}

function checkSourceIndex(documents: readonly string[], errors: string[]): number {
  const sourceIndex = readFileSync(sourceIndexPath, "utf8");
  let count = 0;
  for (const document of documents) {
    const lines = readFileSync(document, "utf8").split("\n");
    const indexedPath = relative(dirname(sourceIndexPath), document).replaceAll("\\", "/");
    for (const lineNumber of headingLines(lines)) {
      const anchor = sourceHeadingAnchor(lines, lineNumber);
      if (!sourceIndex.includes(`(${indexedPath}#${anchor})`)) {
        errors.push(
          `${relative(root, document)}:${lineNumber + 1}: source heading ${anchor} is not indexed`
        );
      }
      count += 1;
    }
  }
  return count;
}

const errors: string[] = [];
checkRequired(errors);
const files = [
  ...readdirSync(root)
    .filter((name) => extname(name) === ".md")
    .map((name) => resolve(root, name)),
  ...markdownFiles(resolve(root, "docs")),
];
const linkCheckedFiles = files.filter((path) => {
  const projectPath = relative(root, path).replaceAll("\\", "/");
  return !projectPath.startsWith("docs/sources/") || projectPath === "docs/sources/README.md";
});
checkLinks(linkCheckedFiles, errors);
const normalizedHeadings = checkIndexedDocuments(normalizedDocuments, errors);
const sourceHeadings = checkSourceIndex(indexedSourceDocuments, errors);

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error);
  }
  process.exitCode = 1;
} else {
  console.log(
    `documentation checks passed: ${files.length} files and ${normalizedHeadings} normalized ` +
      `headings plus ${sourceHeadings} source headings indexed; archived source bodies preserved ` +
      `outside link enforcement`
  );
}
