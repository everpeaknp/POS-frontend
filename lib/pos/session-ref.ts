/** Valid POS session URL segments: numeric pk or SES-0001 style session number */
const SESSION_REF_PATTERN = /^(?:\d+|SES-\d+)$/i;

const RESERVED_SESSION_SEGMENTS = new Set(["new", "close"]);

export function isValidPosSessionRef(ref: string | undefined): ref is string {
  if (!ref || RESERVED_SESSION_SEGMENTS.has(ref)) {
    return false;
  }
  return SESSION_REF_PATTERN.test(ref);
}

export function extractPosSessionRef(pathname: string): string | undefined {
  const match = pathname.match(/\/dashboard\/pos\/sessions\/([^/]+)/);
  const segment = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  return isValidPosSessionRef(segment) ? segment : undefined;
}
