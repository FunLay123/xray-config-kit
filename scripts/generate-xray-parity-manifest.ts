import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export type XrayParityGeneratorConfig = {
  readonly source?: {
    readonly repo?: string;
    readonly directory?: string;
    readonly pathEnv?: string;
  };
  readonly releases: readonly string[];
  readonly outputs: {
    readonly manifest: string;
    readonly types?: string;
  };
};

type NormalizedConfig = {
  readonly configPath: string;
  readonly sourceRepo: string;
  readonly sourcePathEnv: string;
  readonly xrayRoot: string;
  readonly releases: readonly string[];
  readonly manifestOutput: string;
  readonly typesOutput?: string;
};

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

const repoRoot = resolve(import.meta.dir, "..");
let xrayRoot = "";

function configPathFromArgs(args: readonly string[]): string {
  const flagIndex = args.findIndex((arg) => arg === "--config" || arg === "-c");
  if (flagIndex >= 0) {
    const value = args[flagIndex + 1];
    if (!value) throw new Error("--config requires a file path.");
    return value;
  }
  const inline = args.find((arg) => arg.startsWith("--config=") || arg.startsWith("-c="));
  if (inline) return inline.slice(inline.indexOf("=") + 1);
  return "xray-parity.config.ts";
}

function normalizeTag(tag: string): string {
  if (tag === "latest") return tag;
  return tag.startsWith("v") ? tag : `v${tag}`;
}

function asRelativePath(path: string): string {
  return relative(repoRoot, path).replace(/\\/g, "/") || ".";
}

async function loadConfig(): Promise<NormalizedConfig> {
  const configPath = resolve(repoRoot, configPathFromArgs(process.argv.slice(2)));
  if (!existsSync(configPath)) {
    throw new Error(`Xray parity config not found: ${asRelativePath(configPath)}`);
  }

  const configModule = await import(`${pathToFileURL(configPath).href}?mtime=${Date.now()}`) as {
    readonly default?: XrayParityGeneratorConfig;
  };
  const config = configModule.default;
  if (!config) throw new Error(`Xray parity config must export a default object: ${asRelativePath(configPath)}`);
  if (!Array.isArray(config.releases) || config.releases.length === 0) {
    throw new Error("Xray parity config must define at least one release.");
  }
  if (!config.outputs?.manifest) {
    throw new Error("Xray parity config must define outputs.manifest.");
  }

  const sourcePathEnv = config.source?.pathEnv ?? "XRAY_CORE_DIR";
  const configuredRoot = config.source?.directory ?? process.env[sourcePathEnv];
  if (!configuredRoot) {
    throw new Error(`${sourcePathEnv} environment variable is required. See .env.example.`);
  }

  return {
    configPath,
    sourceRepo: config.source?.repo ?? "XTLS/Xray-core",
    sourcePathEnv,
    xrayRoot: resolve(configuredRoot),
    releases: config.releases.map(normalizeTag),
    manifestOutput: resolve(repoRoot, config.outputs.manifest),
    typesOutput: config.outputs.types ? resolve(repoRoot, config.outputs.types) : undefined
  };
}

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

function latestTag(fallbackTags: readonly string[]): string {
  const tags = git(["tag", "--list", "v*", "--sort=-v:refname"]).split(/\r?\n/).filter(Boolean);
  return tags[0] ?? fallbackTags[fallbackTags.length - 1] ?? "v0.0.0";
}

function resolveReleaseTags(inputs: readonly string[]): { readonly selectedTags: string[]; readonly tags: string[] } {
  const selectedTags = inputs.filter((tag) => tag !== "latest");
  const latest = inputs.includes("latest") ? latestTag(selectedTags) : undefined;
  const tags = [...new Set([...selectedTags, ...(latest ? [latest] : [])])]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return { selectedTags, tags };
}

function generatedManifestContent(manifest: unknown, config: NormalizedConfig): string {
  return `// Generated by scripts/generate-xray-parity-manifest.ts from xray-core infra/conf.\n`
    + `// Config: ${asRelativePath(config.configPath)}\n`
    + `// Do not edit this file by hand; update the generator, config, or source release list instead.\n\n`
    + `export const xrayParityManifest = ${JSON.stringify(manifest, null, 2)} as const;\n\n`
    + `export type XrayParityManifest = typeof xrayParityManifest;\n`
    + `export type XrayParityRelease = XrayParityManifest["releases"][number];\n`;
}

function importSpecifier(fromFile: string, toFile: string): string {
  const raw = relative(dirname(fromFile), toFile).replace(/\\/g, "/").replace(/\.ts$/, ".js");
  return raw.startsWith(".") ? raw : `./${raw}`;
}

function generatedTypesContent(config: NormalizedConfig): string {
  const manifestImport = importSpecifier(config.typesOutput!, config.manifestOutput);
  return `// Generated by scripts/generate-xray-parity-manifest.ts.\n`
    + `// Config: ${asRelativePath(config.configPath)}\n`
    + `// Do not edit this file by hand.\n\n`
    + `import type { xrayParityManifest } from "${manifestImport}";\n\n`
    + `export type XrayParityGeneratedManifest = typeof xrayParityManifest;\n`
    + `export type XrayParityGeneratedRelease = XrayParityGeneratedManifest["releases"][number];\n`
    + `export type XrayParityReleaseTag = XrayParityGeneratedRelease["tag"];\n`
    + `export type XrayParityReleaseByTag<Tag extends XrayParityReleaseTag> = Extract<XrayParityGeneratedRelease, { readonly tag: Tag }>;\n`
    + `export type XrayParityTopLevelKey<Tag extends XrayParityReleaseTag = XrayParityReleaseTag> = XrayParityReleaseByTag<Tag>["topLevelKeys"][number];\n`
    + `export type XrayParityInboundProtocol<Tag extends XrayParityReleaseTag = XrayParityReleaseTag> = XrayParityReleaseByTag<Tag>["inboundProtocols"][number]["protocol"];\n`
    + `export type XrayParityOutboundProtocol<Tag extends XrayParityReleaseTag = XrayParityReleaseTag> = XrayParityReleaseByTag<Tag>["outboundProtocols"][number]["protocol"];\n`
    + `export type XrayParityStreamField<Tag extends XrayParityReleaseTag = XrayParityReleaseTag> = XrayParityReleaseByTag<Tag>["streamFields"][number];\n`
    + `export type XrayParitySecurityType<Tag extends XrayParityReleaseTag = XrayParityReleaseTag> = XrayParityReleaseByTag<Tag>["securityTypes"][number];\n`;
}

function writeGeneratedFile(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content, "utf8");
}

const config = await loadConfig();
xrayRoot = config.xrayRoot;

if (!existsSync(xrayRoot)) {
  throw new Error(`Xray-core checkout not found: ${xrayRoot}`);
}

const { selectedTags, tags } = resolveReleaseTags(config.releases);
const manifest = {
  source: {
    repo: config.sourceRepo,
    sourcePathEnv: config.sourcePathEnv,
    config: asRelativePath(config.configPath),
    releaseInputs: config.releases,
    selectedTags,
    tags
  },
  releases: tags.map(releaseManifest)
};

writeGeneratedFile(config.manifestOutput, generatedManifestContent(manifest, config));
if (config.typesOutput) writeGeneratedFile(config.typesOutput, generatedTypesContent(config));
