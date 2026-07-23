/**
 * Desktop capability policy — enforced in main before sensitive IPC.
 * Does not replace Django RBAC; adds OS-capability gates only.
 */

export type DesktopCapability =
  | "printing"
  | "export"
  | "clipboard"
  | "camera"
  | "microphone"
  | "usb"
  | "devtools"
  | "settings"
  | "screen_capture";

export type DesktopRole =
  | "super_admin"
  | "admin"
  | "manager"
  | "accountant"
  | "cashier"
  | "supervisor"
  | "viewer"
  | string;

const ALL: DesktopCapability[] = [
  "printing",
  "export",
  "clipboard",
  "camera",
  "microphone",
  "usb",
  "devtools",
  "settings",
  "screen_capture",
];

const ROLE_CAPS: Record<string, DesktopCapability[]> = {
  super_admin: ALL,
  admin: ALL.filter((c) => c !== "devtools"),
  manager: [
    "printing",
    "export",
    "clipboard",
    "camera",
    "usb",
    "settings",
    "screen_capture",
  ],
  accountant: ["printing", "export", "clipboard", "settings"],
  supervisor: ["printing", "clipboard", "camera"],
  cashier: ["printing", "clipboard", "camera", "usb"],
  viewer: ["clipboard"],
};

let currentRole: DesktopRole = "viewer";
let packaged = false;

export function setPermissionContext(opts: {
  role: DesktopRole | null | undefined;
  isPackaged: boolean;
}) {
  currentRole = (opts.role || "viewer").toLowerCase();
  packaged = opts.isPackaged;
}

export function getCurrentRole() {
  return currentRole;
}

export function listCapabilities(role = currentRole): DesktopCapability[] {
  const key = String(role || "viewer").toLowerCase();
  let caps = ROLE_CAPS[key] ? [...ROLE_CAPS[key]] : [...ROLE_CAPS.viewer];
  if (packaged) {
    caps = caps.filter((c) => c !== "devtools");
  }
  return caps;
}

export function can(capability: DesktopCapability, role = currentRole): boolean {
  if (packaged && capability === "devtools") return false;
  return listCapabilities(role).includes(capability);
}

export function assertCan(capability: DesktopCapability) {
  if (!can(capability)) {
    const err = new Error(`Permission denied: ${capability}`);
    (err as Error & { code?: string }).code = "DESKTOP_PERMISSION_DENIED";
    throw err;
  }
}
