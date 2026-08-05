import {
    AlertTriangle,
    ArrowRight,
    Building2,
    Calendar,
    Camera,
    Check,
    ChevronDown,
    ChevronRight,
    Copy,
    Download,
    ExternalLink,
    FileText,
    Home,
    Info,
    Menu,
    Printer,
    Search,
    ShoppingCart,
    TrendingUp,
    Truck,
    Upload,
    User,
    Wrench,
    X,
    type LucideIcon,
    type LucideProps,
} from 'lucide-react';
import { LoadingLogo } from './LoadingLogo';

type IconProps = LucideProps;

function withDefaultSize(Icon: LucideIcon, defaultSize: number) {
    return function IconWrapper({ size = defaultSize, strokeWidth = 2, ...props }: IconProps) {
        return <Icon size={size} strokeWidth={strokeWidth} {...props} />;
    };
}

export const SearchIcon = withDefaultSize(Search, 20);
export const CheckIcon = withDefaultSize(Check, 16);
export const ExternalLinkIcon = withDefaultSize(ExternalLink, 14);
export const CopyIcon = withDefaultSize(Copy, 16);
export const InfoIcon = withDefaultSize(Info, 18);
export const UploadIcon = withDefaultSize(Upload, 20);
export const DownloadIcon = withDefaultSize(Download, 16);
export const WrenchIcon = withDefaultSize(Wrench, 16);
export const TrendingUpIcon = withDefaultSize(TrendingUp, 16);
export const AlertTriangleIcon = withDefaultSize(AlertTriangle, 16);
export const ShoppingCartIcon = withDefaultSize(ShoppingCart, 16);
export const CalendarIcon = withDefaultSize(Calendar, 16);
export const CameraIcon = withDefaultSize(Camera, 16);
export function LoaderIcon({ size = 16, className }: IconProps) {
    return <LoadingLogo size={Number(size) || 16} className={className} />;
}
export const ChevronDownIcon = withDefaultSize(ChevronDown, 16);
export const ArrowRightIcon = withDefaultSize(ArrowRight, 16);
export const UserIcon = withDefaultSize(User, 16);
export const FileTextIcon = withDefaultSize(FileText, 16);
export const MenuIcon = withDefaultSize(Menu, 16);
export const XIcon = withDefaultSize(X, 16);
export const ChevronRightIcon = withDefaultSize(ChevronRight, 16);
export const TruckIcon = withDefaultSize(Truck, 16);
export const BuildingIcon = withDefaultSize(Building2, 16);
export const HomeIcon = withDefaultSize(Home, 16);
export const PrinterIcon = withDefaultSize(Printer, 16);
