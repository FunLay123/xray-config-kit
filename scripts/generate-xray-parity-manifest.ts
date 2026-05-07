import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(import.meta.dir, "..");
if (!process.env.XRAY_CORE_DIR) {
  throw new Error("XRAY_CORE_DIR environment variable is required. See .env.example.");
}
const xrayRoot = process.env.XRAY_CORE_DIR;
const selectedTags = ["v25.10.15", "v26.4.25", "v26.5.3"] as const;
const outputPath = resolve(repoRoot, "src/xray-json/parity-manifest.ts");

type LoaderEntry = {
  readonly protocol: string;
  readonly config: string;
};

type StructField = {
  readonly json: string;
  readonly go: string;
  readonly type: string;
};

type ReleaseManifest = {
  readonly tag: string;
  readonly version: string;
  readonly commit: string;
  readonly topLevelKeys: string[];
  readonly inboundProtocols: LoaderEntry[];
  readonly outboundProtocols: LoaderEntry[];
  readonly streamFields: StructField[];
  readonly transportAliases: Record<string, string>;
  readonly securityTypes: string[];
  readonly jsonLoaders: Record<string, LoaderEntry[]>;
  readonly structs: Record<string, StructField[]>;
};

function git(args: string[]): string {
  return execFileSync("git", ["-C", xrayRoot, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
}

function show(tag: string, path: string): string {
  return git(["show", `${tag}:${path}`]);
}

function listInfraConf(tag: string): string[] {
  return git(["ls-tree", "-r", "--name-only", tag, "infra/conf"])
    .split(/\r?\n/)
    .filter((path) => path.endsWith(".go"));
}

function extractBlock(source: string, startPattern: RegExp): string {
  const match = startPattern.exec(source);
  if (!match || match.index === undefined) return "";
  const start = source.indexOf("{", match.index);
  if (start < 0) return "";
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    const char = source[i];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return source.slice(start + 1, i);
  }
  return "";
}

function extractLoader(source: string, name: string): LoaderEntry[] {
  const block = extractBlock(source, new RegExp(`${name}\\s*=\\s*NewJSONConfigLoader\\(ConfigCreatorCache\\s*\\{`));
  return parseLoaderEntries(block);
}

function parseLoaderEntries(block: string): LoaderEntry[] {
  const entries: LoaderEntry[] = [];
  const entryRegex = /"([^"]+)"\s*:\s*func\(\)\s*interface\{\}\s*\{\s*return\s+(?:new\((\w+)\)|&(\w+)(?:\{[^}]*\})?)/g;
  for (const match of block.matchAll(entryRegex)) {
    const protocol = match[1];
    const config = match[2] ?? match[3];
    if (protocol && config) entries.push({ protocol, config });
  }
  return entries.sort((a, b) => a.protocol.localeCompare(b.protocol));
}

function parseAllJsonLoaders(files: Record<string, string>): Record<string, LoaderEntry[]> {
  const loaders: Record<string, LoaderEntry[]> = {};
  for (const [path, source] of Object.entries(files)) {
    const loaderRegex = /(\w+)\s*=\s*NewJSONConfigLoader\(ConfigCreatorCache\s*\{/g;
    for (const match of source.matchAll(loaderRegex)) {
      const loaderName = match[1];
      if (!loaderName) continue;
      const block = extractBlock(source.slice(match.index), /NewJSONConfigLoader\(ConfigCreatorCache\s*\{/);
      const entries = parseLoaderEntries(block);
      if (entries.length > 0) loaders[`${path}:${loaderName}`] = entries;
    }
  }
  return Object.fromEntries(Object.entries(loaders).sort(([a], [b]) => a.localeCompare(b)));
}

function parseStructs(files: Record<string, string>): Record<string, StructField[]> {
  const structs: Record<string, StructField[]> = {};
  const structRegex = /type\s+(\w+)\s+struct\s*\{([\s\S]*?)\n\}/g;
  const emptyStructRegex = /type\s+(\w+)\s+struct\s*\{\s*\}/g;
  const fieldRegex = /^\s*(\w+)\s+(.+?)\s+`json:"([^"]*)"/;
  for (const source of Object.values(files)) {
    for (const structMatch of source.matchAll(structRegex)) {
      const name = structMatch[1];
      const body = structMatch[2] ?? "";
      if (!name) continue;
      const fields: StructField[] = [];
      for (const line of body.split(/\r?\n/)) {
        const fieldMatch = fieldRegex.exec(line);
        if (!fieldMatch) continue;
        const jsonTag = fieldMatch[3]?.split(",")[0] ?? "";
        if (!jsonTag || jsonTag === "-") continue;
        fields.push({
          go: fieldMatch[1]!,
          type: fieldMatch[2]!.trim(),
          json: jsonTag
        });
      }
      if (fields.length > 0) structs[name] = fields;
    }
    for (const structMatch of source.matchAll(emptyStructRegex)) {
      const name = structMatch[1];
      if (name && structs[name] === undefined) structs[name] = [];
    }
  }
  return Object.fromEntries(Object.entries(structs).sort(([a], [b]) => a.localeCompare(b)));
}

function parseTransportAliases(source: string): Record<string, string> {
  const block = extractBlock(source, /func\s+\(p\s+TransportProtocol\)\s+Build\(\)\s+\(string,\s+error\)\s*\{/);
  const aliases: Record<string, string> = {};
  const caseRegex = /case\s+([^:]+):([\s\S]*?)(?=\n\s*case\s+|\n\s*default\s*:|\n\s*\})/g;
  for (const match of block.matchAll(caseRegex)) {
    const cases = match[1]?.match(/"([^"]+)"/g)?.map((item) => item.slice(1, -1)) ?? [];
    const returned = /return\s+"([^"]*)"/.exec(match[2] ?? "")?.[1];
    if (!returned) continue;
    for (const item of cases) aliases[item] = returned;
  }
  return Object.fromEntries(Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b)));
}

function parseSecurityTypes(source: string): string[] {
  const block = extractBlock(source, /switch\s+strings\.ToLower\(c\.Security\)\s*\{/);
  const types = new Set<string>();
  const caseRegex = /case\s+([^:]+):/g;
  for (const match of block.matchAll(caseRegex)) {
    const values = match[1]?.match(/"([^"]*)"/g)?.map((item) => item.slice(1, -1)) ?? [];
    for (const value of values) types.add(value === "" ? "none" : value);
  }
  return [...types].sort();
}

function releaseManifest(tag: string): ReleaseManifest {
  const paths = listInfraConf(tag);
  const files = Object.fromEntries(paths.map((path) => [path, show(tag, path)]));
  const xray = files["infra/conf/xray.go"] ?? "";
  const transport = files["infra/conf/transport_internet.go"] ?? "";
  const structs = parseStructs(files);
  return {
    tag,
    version: tag.replace(/^v/, ""),
    commit: git(["rev-list", "-n", "1", tag]),
    topLevelKeys: (structs.Config ?? []).map((field) => field.json).sort(),
    inboundProtocols: extractLoader(xray, "inboundConfigLoader"),
    outboundProtocols: extractLoader(xray, "outboundConfigLoader"),
    streamFields: structs.StreamConfig ?? [],
    transportAliases: parseTransportAliases(transport),
    securityTypes: parseSecurityTypes(transport),
    jsonLoaders: parseAllJsonLoaders(files),
    structs
  };
}

function latestTag(): string {
  const tags = git(["tag", "--list", "v*", "--sort=-v:refname"]).split(/\r?\n/).filter(Boolean);
  return tags[0] ?? selectedTags[selectedTags.length - 1];
}

if (!existsSync(xrayRoot)) {
  throw new Error(`Xray-core checkout not found: ${xrayRoot}`);
}

const latest = latestTag();
const tags = [...new Set([...selectedTags, latest])].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
const manifest = {
  source: {
    repo: "XTLS/Xray-core",
    sourcePathEnv: "XRAY_CORE_DIR",
    selectedTags,
    tags
  },
  releases: tags.map(releaseManifest)
};

const content = `// Generated by scripts/generate-xray-parity-manifest.ts from xray-core infra/conf.\n// Do not edit this file by hand; update the generator or source release list instead.\n\nexport const xrayParityManifest = ${JSON.stringify(manifest, null, 2)} as const;\n\nexport type XrayParityManifest = typeof xrayParityManifest;\nexport type XrayParityRelease = XrayParityManifest["releases"][number];\n`;

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, content, "utf8");
