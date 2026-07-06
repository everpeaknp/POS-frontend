/** Auto-generated lucide-react compatibility layer using react-icons (Heroicons v2). */
import type { IconType } from "react-icons";
import type { IconBaseProps } from "react-icons";
import * as Hi from "react-icons/hi2";
import { cn } from "@/lib/utils";
import {
  KhataSpinner,
  inferKhataSpinnerVariant,
  type KhataSpinnerSize,
} from "@/components/shared/KhataSpinner";

export type LucideIcon = IconType;
export type LucideProps = IconBaseProps;

export const Activity: IconType = Hi.HiOutlineBolt;
export const AlertCircle: IconType = Hi.HiOutlineExclamationCircle;
export const AlertTriangle: IconType = Hi.HiOutlineExclamationTriangle;
export const ArrowDownRight: IconType = Hi.HiOutlineArrowDownRight;
export const ArrowLeft: IconType = Hi.HiOutlineArrowLeft;
export const ArrowLeftRight: IconType = Hi.HiOutlineArrowsRightLeft;
export const ArrowRight: IconType = Hi.HiOutlineArrowRight;
export const ArrowUpDown: IconType = Hi.HiOutlineArrowsUpDown;
export const ArrowUpRight: IconType = Hi.HiOutlineArrowUpRight;
export const Banknote: IconType = Hi.HiOutlineBanknotes;
export const BarChart2: IconType = Hi.HiOutlineChartBar;
export const BarChart3: IconType = Hi.HiOutlineChartBarSquare;
export const Barcode: IconType = Hi.HiOutlineQrCode;
export const Bell: IconType = Hi.HiOutlineBell;
export const BookOpen: IconType = Hi.HiOutlineBookOpen;
export const Briefcase: IconType = Hi.HiOutlineBriefcase;
export const Building2: IconType = Hi.HiOutlineBuildingOffice2;
export const Calendar: IconType = Hi.HiOutlineCalendar;
export const CalendarDays: IconType = Hi.HiOutlineCalendarDays;
export const CalendarOff: IconType = Hi.HiOutlineCalendarDays;
export const Check: IconType = Hi.HiOutlineCheck;
export const CheckCircle: IconType = Hi.HiOutlineCheckCircle;
export const CheckCircle2: IconType = Hi.HiOutlineCheckCircle;
export const CheckIcon: IconType = Hi.HiOutlineCheck;
export const ChevronDown: IconType = Hi.HiOutlineChevronDown;
export const ChevronDownIcon: IconType = Hi.HiOutlineChevronDown;
export const ChevronLeft: IconType = Hi.HiOutlineChevronLeft;
export const ChevronRight: IconType = Hi.HiOutlineChevronRight;
export const ChevronRightIcon: IconType = Hi.HiOutlineChevronRight;
export const ChevronUp: IconType = Hi.HiOutlineChevronUp;
export const ChevronUpIcon: IconType = Hi.HiOutlineChevronUp;
export const ChevronsUpDown: IconType = Hi.HiOutlineChevronUpDown;
export const CircleCheck: IconType = Hi.HiOutlineCheckCircle;
export const ClipboardCheck: IconType = Hi.HiOutlineClipboardDocumentCheck;
export const ClipboardList: IconType = Hi.HiOutlineClipboardDocumentList;
export const Clock: IconType = Hi.HiOutlineClock;
export const Code2: IconType = Hi.HiOutlineCodeBracket;
export const CreditCard: IconType = Hi.HiOutlineCreditCard;
export const DollarSign: IconType = Hi.HiOutlineCurrencyDollar;
export const Download: IconType = Hi.HiOutlineArrowDownTray;
export const Edit: IconType = Hi.HiOutlinePencilSquare;
export const Edit2: IconType = Hi.HiOutlinePencilSquare;
export const ExternalLink: IconType = Hi.HiOutlineArrowTopRightOnSquare;
export const Eye: IconType = Hi.HiOutlineEye;
export const EyeOff: IconType = Hi.HiOutlineEyeSlash;
export const FileText: IconType = Hi.HiOutlineDocumentText;
export const Filter: IconType = Hi.HiOutlineFunnel;
export const Fingerprint: IconType = Hi.HiOutlineFingerPrint;
export const FolderTree: IconType = Hi.HiOutlineFolder;
export const Globe: IconType = Hi.HiOutlineGlobeAlt;
export const HardHat: IconType = Hi.HiOutlineWrenchScrewdriver;
export const History: IconType = Hi.HiOutlineClock;
export const Home: IconType = Hi.HiOutlineHome;
export const ImageIcon: IconType = Hi.HiOutlinePhoto;
export const Key: IconType = Hi.HiOutlineKey;
export const Landmark: IconType = Hi.HiOutlineBuildingLibrary;
export const Laptop: IconType = Hi.HiOutlineComputerDesktop;
export const Layers: IconType = Hi.HiOutlineSquare3Stack3D;
export const LayoutDashboard: IconType = Hi.HiOutlineSquares2X2;
export const LayoutGrid: IconType = Hi.HiOutlineSquares2X2;
function inferLoaderSize(className?: string): KhataSpinnerSize {
  if (!className) return "sm";
  if (/h-16|w-16/.test(className)) return "xl";
  if (/h-10|w-10|h-8|w-8/.test(className)) return "lg";
  if (/h-6|w-6|h-5|w-5/.test(className)) return "md";
  if (/h-4|w-4|h-3\.5|w-3\.5/.test(className)) return "xs";
  return "sm";
}

export function Loader2({ className }: IconBaseProps) {
  return (
    <KhataSpinner
      size={inferLoaderSize(className)}
      variant={inferKhataSpinnerVariant(className)}
      className={className}
    />
  );
}

export const Lock: IconType = Hi.HiOutlineLockClosed;
export const LogOut: IconType = Hi.HiOutlineArrowRightOnRectangle;
export const Mail: IconType = Hi.HiOutlineEnvelope;
export const MapPin: IconType = Hi.HiOutlineMapPin;
export const Menu: IconType = Hi.HiOutlineBars3;
export const MessageSquare: IconType = Hi.HiOutlineChatBubbleLeftRight;
export const Minus: IconType = Hi.HiOutlineMinus;
export const Monitor: IconType = Hi.HiOutlineComputerDesktop;
export const Moon: IconType = Hi.HiOutlineMoon;
export const MoreHorizontal: IconType = Hi.HiOutlineEllipsisHorizontal;
export const MoreVertical: IconType = Hi.HiOutlineEllipsisVertical;
export const Package: IconType = Hi.HiOutlineCube;
export const PackageCheck: IconType = Hi.HiOutlineCube;
export const PackageMinus: IconType = Hi.HiOutlineCube;
export const Palette: IconType = Hi.HiOutlineSwatch;
export const Pencil: IconType = Hi.HiOutlinePencil;
export const Phone: IconType = Hi.HiOutlinePhone;
export const Plug: IconType = Hi.HiOutlineBolt;
export const Plus: IconType = Hi.HiOutlinePlus;
export const Printer: IconType = Hi.HiOutlinePrinter;
export const Receipt: IconType = Hi.HiOutlineReceiptPercent;
export const RefreshCw: IconType = Hi.HiOutlineArrowPath;
export const RotateCcw: IconType = Hi.HiOutlineArrowPath;
export const Ruler: IconType = Hi.HiOutlineAdjustmentsHorizontal;
export const Save: IconType = Hi.HiOutlineBookmarkSquare;
export const Scale: IconType = Hi.HiOutlineScale;
export const Search: IconType = Hi.HiOutlineMagnifyingGlass;
export const SearchX: IconType = Hi.HiOutlineMagnifyingGlass;
export const Settings: IconType = Hi.HiOutlineCog6Tooth;
export const Shield: IconType = Hi.HiOutlineShieldCheck;
export const ShieldCheck: IconType = Hi.HiOutlineShieldCheck;
export const ShoppingBag: IconType = Hi.HiOutlineShoppingBag;
export const ShoppingCart: IconType = Hi.HiOutlineShoppingCart;
export const SlidersHorizontal: IconType = Hi.HiOutlineAdjustmentsHorizontal;
export const Smartphone: IconType = Hi.HiOutlineDevicePhoneMobile;
export const Sun: IconType = Hi.HiOutlineSun;
export const Tags: IconType = Hi.HiOutlineTag;
export const Trash2: IconType = Hi.HiOutlineTrash;
export const TrendingDown: IconType = Hi.HiOutlineArrowTrendingDown;
export const TrendingUp: IconType = Hi.HiOutlineArrowTrendingUp;
export const Upload: IconType = Hi.HiOutlineArrowUpTray;
export const User: IconType = Hi.HiOutlineUser;
export const UserPlus: IconType = Hi.HiOutlineUserPlus;
export const Users: IconType = Hi.HiOutlineUsers;
export const Volume2: IconType = Hi.HiOutlineSpeakerWave;
export const Wallet: IconType = Hi.HiOutlineWallet;
export const Warehouse: IconType = Hi.HiOutlineBuildingStorefront;
export const Wrench: IconType = Hi.HiOutlineWrench;
export const X: IconType = Hi.HiOutlineXMark;
export const XCircle: IconType = Hi.HiOutlineXCircle;
export const XIcon: IconType = Hi.HiOutlineXMark;
export const Zap: IconType = Hi.HiOutlineBolt;