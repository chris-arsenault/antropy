import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, extname, relative, resolve } from "node:path";

const root = resolve(process.cwd(), process.argv[2] ?? ".");
const docsIndexPath = resolve(root, "docs/README.md");
const principlesPath = resolve(root, "docs/ant-sim-principles.md");
const appendices = ["a", "b", "c", "d", "e"].map((letter) =>
  resolve(root, `docs/ant-sim-appendix-${letter}.md`)
);
const required = [
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  "CHANGELOG.md",
  "docs/README.md",
  "docs/design-spec.md",
  "docs/architecture.md",
  "docs/development.md",
  "docs/backlog.md",
  "docs/calibration.md",
  "docs/certifications.md",
  "docs/seed-spec.md",
  relative(root, principlesPath),
  "docs/adr/README.md",
  ...appendices.map((path) => relative(root, path)),
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
  if (!docsIndex.includes(`(${basename(document)}#${anchor})`)) {
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

const errors: string[] = [];
checkRequired(errors);
const files = [
  ...readdirSync(root)
    .filter((name) => extname(name) === ".md")
    .map((name) => resolve(root, name)),
  ...markdownFiles(resolve(root, "docs")),
];
checkLinks(files, errors);
const appendixHeadings = checkIndexedDocuments(appendices, errors);
const principleHeadings = checkIndexedDocuments([principlesPath], errors);

if (errors.length > 0) {
  for (const error of errors) {
    console.error(error);
  }
  process.exitCode = 1;
} else {
  console.log(
    `documentation checks passed: ${files.length} files, ${appendixHeadings} appendix headings ` +
      `and ${principleHeadings} principles headings indexed`
  );
}
