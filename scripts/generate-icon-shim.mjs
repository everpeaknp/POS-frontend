import fs from "fs";
import path from "path";

const root = process.cwd();
const icons = new Set();

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(entry.name)) {
      const text = fs.readFileSync(full, "utf8");
      for (const match of text.matchAll(/import\s+(?:type\s+)?\{([^}]+)\}\s*from\s*["']lucide-react["']/g)) {
        match[1].split(",").forEach((part) => {
          const chunk = part.trim();
          if (chunk.startsWith("type ")) return;
          const name = chunk.split(/\s+as\s+/)[0].trim();
          if (name && name !== "type") icons.add(name);
        });
      }
    }
  }
}

walk(root);

const map = {
  Activity: "HiOutlineBolt",
  AlertCircle: "HiOutlineExclamationCircle",
  AlertTriangle: "HiOutlineExclamationTriangle",
  ArrowLeft: "HiOutlineArrowLeft",
  ArrowRight: "HiOutlineArrowRight",
  ArrowUpDown: "HiOutlineArrowsUpDown",
  BarChart2: "HiOutlineChartBar",
  BarChart3: "HiOutlineChartBarSquare",
  Barcode: "HiOutlineQrCode",
  Bell: "HiOutlineBell",
  BookOpen: "HiOutlineBookOpen",
  Building2: "HiOutlineBuildingOffice2",
  Calendar: "HiOutlineCalendar",
  CalendarDays: "HiOutlineCalendarDays",
  Check: "HiOutlineCheck",
  CheckCircle: "HiOutlineCheckCircle",
  CheckCircle2: "HiOutlineCheckCircle",
  CheckIcon: "HiOutlineCheck",
  ChevronDown: "HiOutlineChevronDown",
  ChevronDownIcon: "HiOutlineChevronDown",
  ChevronLeft: "HiOutlineChevronLeft",
  ChevronRight: "HiOutlineChevronRight",
  ChevronUp: "HiOutlineChevronUp",
  ChevronUpIcon: "HiOutlineChevronUp",
  Clock: "HiOutlineClock",
  CreditCard: "HiOutlineCreditCard",
  DollarSign: "HiOutlineCurrencyDollar",
  Download: "HiOutlineArrowDownTray",
  Edit: "HiOutlinePencilSquare",
  Edit2: "HiOutlinePencilSquare",
  ExternalLink: "HiOutlineArrowTopRightOnSquare",
  Eye: "HiOutlineEye",
  EyeOff: "HiOutlineEyeSlash",
  FileDown: "HiOutlineDocumentArrowDown",
  FileText: "HiOutlineDocumentText",
  Filter: "HiOutlineFunnel",
  Fingerprint: "HiOutlineFingerPrint",
  Globe: "HiOutlineGlobeAlt",
  HardHat: "HiOutlineWrenchScrewdriver",
  Home: "HiOutlineHome",
  ImageIcon: "HiOutlinePhoto",
  Key: "HiOutlineKey",
  Laptop: "HiOutlineComputerDesktop",
  LayoutDashboard: "HiOutlineSquares2X2",
  LayoutGrid: "HiOutlineSquares2X2",
  Loader2: "HiOutlineArrowPath",
  Lock: "HiOutlineLockClosed",
  LogOut: "HiOutlineArrowRightOnRectangle",
  Mail: "HiOutlineEnvelope",
  MapPin: "HiOutlineMapPin",
  Menu: "HiOutlineBars3",
  Minus: "HiOutlineMinus",
  Monitor: "HiOutlineComputerDesktop",
  Moon: "HiOutlineMoon",
  MoreHorizontal: "HiOutlineEllipsisHorizontal",
  MoreVertical: "HiOutlineEllipsisVertical",
  Package: "HiOutlineCube",
  PackageCheck: "HiOutlineCube",
  Palette: "HiOutlineSwatch",
  Plus: "HiOutlinePlus",
  Printer: "HiOutlinePrinter",
  Receipt: "HiOutlineReceiptPercent",
  RefreshCw: "HiOutlineArrowPath",
  RotateCcw: "HiOutlineArrowPath",
  Save: "HiOutlineBookmarkSquare",
  Scale: "HiOutlineScale",
  Search: "HiOutlineMagnifyingGlass",
  Settings: "HiOutlineCog6Tooth",
  Shield: "HiOutlineShieldCheck",
  ShieldCheck: "HiOutlineShieldCheck",
  ShoppingCart: "HiOutlineShoppingCart",
  Smartphone: "HiOutlineDevicePhoneMobile",
  Sun: "HiOutlineSun",
  Trash2: "HiOutlineTrash",
  TrendingDown: "HiOutlineArrowTrendingDown",
  TrendingUp: "HiOutlineArrowTrendingUp",
  User: "HiOutlineUser",
  Users: "HiOutlineUsers",
  Wrench: "HiOutlineWrench",
  ArrowDownRight: "HiOutlineArrowDownRight",
  ArrowLeftRight: "HiOutlineArrowsRightLeft",
  ArrowUpRight: "HiOutlineArrowUpRight",
  Banknote: "HiOutlineBanknotes",
  Briefcase: "HiOutlineBriefcase",
  CalendarOff: "HiOutlineCalendarDays",
  ChevronRightIcon: "HiOutlineChevronRight",
  ChevronsUpDown: "HiOutlineChevronUpDown",
  CircleCheck: "HiOutlineCheckCircle",
  ClipboardCheck: "HiOutlineClipboardDocumentCheck",
  ClipboardList: "HiOutlineClipboardDocumentList",
  Code2: "HiOutlineCodeBracket",
  FolderTree: "HiOutlineFolder",
  History: "HiOutlineClock",
  Landmark: "HiOutlineBuildingLibrary",
  Layers: "HiOutlineSquare3Stack3D",
  MessageSquare: "HiOutlineChatBubbleLeftRight",
  PackageMinus: "HiOutlineCube",
  Pencil: "HiOutlinePencil",
  Phone: "HiOutlinePhone",
  Plug: "HiOutlineBolt",
  Ruler: "HiOutlineAdjustmentsHorizontal",
  SearchX: "HiOutlineMagnifyingGlass",
  ShoppingBag: "HiOutlineShoppingBag",
  SlidersHorizontal: "HiOutlineAdjustmentsHorizontal",
  Tags: "HiOutlineTag",
  Upload: "HiOutlineArrowUpTray",
  UserPlus: "HiOutlineUserPlus",
  Volume2: "HiOutlineSpeakerWave",
  Wallet: "HiOutlineWallet",
  Warehouse: "HiOutlineBuildingStorefront",
  X: "HiOutlineXMark",
  XCircle: "HiOutlineXCircle",
  XIcon: "HiOutlineXMark",
  Zap: "HiOutlineBolt",
};

const lines = [
  `/** Auto-generated lucide-react compatibility layer using react-icons (Heroicons v2). */`,
  `import type { IconType } from "react-icons";`,
  `import type { IconBaseProps } from "react-icons";`,
  `import * as Hi from "react-icons/hi2";`,
  `import { cn } from "@/lib/utils";`,
  ``,
  `export type LucideIcon = IconType;`,
  `export type LucideProps = IconBaseProps;`,
  ``,
];

for (const name of [...icons].sort()) {
  const hi = map[name];
  if (!hi) {
    console.warn("Missing mapping:", name);
    continue;
  }
  if (name === "Loader2") {
    lines.push(
      `export function Loader2({ className, ...props }: IconBaseProps) {`,
      `  return <Hi.${hi} className={cn("animate-spin", className)} {...props} />;`,
      `}`,
      ``
    );
    continue;
  }
  lines.push(`export const ${name}: IconType = Hi.${hi};`);
}

const out = path.join(root, "lib", "icons", "lucide-react-shim.tsx");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join("\n"));
console.log(`Wrote ${out} with ${icons.size} icons`);
