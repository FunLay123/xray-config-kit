import type { Issue, IssueCategory, IssueSeverity } from "./types.js";

export function makeIssue(input: {
  readonly code: string;
  readonly severity: IssueSeverity;
  readonly category: IssueCategory;
  readonly path: string;
  readonly message: string;
  readonly suggestion?: string;
  readonly adapterId?: string;
}): Issue {
  return input;
}

export function hasErrors(issues: readonly Issue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}

export function pathForZod(path: readonly (string | number)[]): string {
  return path.length === 0 ? "/" : `/${path.map(String).join("/")}`;
}
