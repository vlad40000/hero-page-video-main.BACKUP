import {
    AlertTriangle,
    CalendarClock as CalendarClockIcon,
    Check,
    Copy,
    Download,
    ExternalLink,
    Info,
    Search,
    ShoppingBag as ShoppingBagIcon,
    TrendingUp,
    Upload,
    Wrench,
    type LucideIcon,
    type LucideProps,
} from 'lucide-react';

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
export const DownloadIcon = withDefaultSize(Download, 18);
export const WrenchIcon = withDefaultSize(Wrench, 16);
export const TrendingUpIcon = withDefaultSize(TrendingUp, 16);
export const AlertTriangleIcon = withDefaultSize(AlertTriangle, 16);
export const ShoppingBag = withDefaultSize(ShoppingBagIcon, 24);
export const CalendarClock = withDefaultSize(CalendarClockIcon, 24);
