import { createElement, type ComponentType } from 'react';
import {
  ArrowLeft as PArrowLeft, ArrowRight as PArrowRight, ArrowsLeftRight, ArrowSquareOut, ArrowUpRight as PArrowUpRight,
  ArrowCircleUp, ArrowClockwise, Bell as PBell, Calendar, CaretLeft, CaretRight, ChartBar, ChartLine, Check as PCheck, CheckCircle, Checks, CircleNotch, Clock, Coins as PCoins, Compass as PCompass, CreditCard as PCreditCard,
  Copy as PCopy, Download as PDownload, Envelope, Eye as PEye, Fingerprint as PFingerprint, Funnel, Gift as PGift,
  ChatCircle, DeviceMobile, House, Info as PInfo, Key, Lightning, Link as PLink, Lock as PLock, MagicWand, MagnifyingGlass, MapPin as PMapPin, Minus as PMinus, MoonStars, PaperPlaneTilt, Pause as PPause,
  PencilLine as PPencilLine, Plus as PPlus, Pulse, Radio as PRadio, Receipt, Robot, Scan, ShareNetwork,
  CalendarDots, ShieldCheck as PShieldCheck, SignOut, SlidersHorizontal as PSlidersHorizontal, Sparkle, Star as PStar, Target as PTarget,
  Ticket as PTicket, TrendDown, Trophy as PTrophy, UserCircle, Users as PUsers, Video as PVideo, Wallet as PWallet, Warning,
  WarningCircle, X as PX, XCircle as PXCircle, type IconProps,
} from 'phosphor-react-native';

type LegacyProps = Omit<IconProps, 'size'> & { size?: number; strokeWidth?: number; fill?: string; accessibilityLabel?: string };
export type LucideIcon = ComponentType<LegacyProps>;
function icon(Component: ComponentType<IconProps>): LucideIcon {
  return function ModernIcon({ strokeWidth, fill, weight, ...props }: LegacyProps) {
    const filled = fill != null && fill !== 'none' && fill !== 'transparent';
    return createElement(Component as ComponentType<Record<string, unknown>>, { ...props, fill, weight: weight ?? (filled ? 'fill' : strokeWidth && strokeWidth >= 2.4 ? 'bold' : 'regular') });
  };
}

export const ArrowLeft = icon(PArrowLeft); export const ArrowRight = icon(PArrowRight); export const ArrowRightLeft = icon(ArrowsLeftRight); export const ArrowUpRight = icon(PArrowUpRight);
export const BarChart3 = icon(ChartBar); export const Bell = icon(PBell); export const Bot = icon(Robot); export const Check = icon(PCheck);
export const ChevronLeft = icon(CaretLeft); export const ChevronRight = icon(CaretRight); export const CircleAlert = icon(WarningCircle); export const CircleCheck = icon(CheckCircle);
export const Clock3 = icon(Clock); export const Coins = icon(PCoins); export const Compass = icon(PCompass); export const Copy = icon(PCopy); export const Download = icon(PDownload);
export const ExternalLink = icon(ArrowSquareOut); export const Eye = icon(PEye); export const Filter = icon(Funnel); export const Fingerprint = icon(PFingerprint); export const Gift = icon(PGift);
export const Home = icon(House); export const Info = icon(PInfo); export const LoaderCircle = icon(CircleNotch); export const Lock = icon(PLock); export const Mail = icon(Envelope);
export const Minus = icon(PMinus); export const Pause = icon(PPause); export const PencilLine = icon(PPencilLine); export const Plus = icon(PPlus); export const Radio = icon(PRadio);
export const ReceiptText = icon(Receipt); export const ScanSearch = icon(Scan); export const Search = icon(MagnifyingGlass); export const Share2 = icon(ShareNetwork); export const ShieldCheck = icon(PShieldCheck);
export const SlidersHorizontal = icon(PSlidersHorizontal); export const Sparkles = icon(Sparkle); export const Star = icon(PStar); export const Target = icon(PTarget); export const Ticket = icon(PTicket);
export const TriangleAlert = icon(Warning); export const Trophy = icon(PTrophy); export const UserRound = icon(UserCircle); export const Users = icon(PUsers); export const Video = icon(PVideo);
export const WalletCards = icon(PWallet); export const Wallet = icon(PWallet); export const Wand2 = icon(MagicWand); export const X = icon(PX); export const XCircle = icon(PXCircle); export const Zap = icon(Lightning); export const Activity = icon(Pulse);
export const CalendarClock = icon(Calendar); export const ChartNoAxesCombined = icon(ChartLine); export const CheckCircle2 = icon(CheckCircle); export const RefreshCw = icon(ArrowClockwise);
export const ArrowUpCircle = icon(ArrowCircleUp); export const CheckCheck = icon(Checks); export const CreditCard = icon(PCreditCard); export const TrendingDown = icon(TrendDown);
export const KeyRound = icon(Key); export const Link2 = icon(PLink); export const LogOut = icon(SignOut); export const MessageCircle = icon(ChatCircle); export const MoonStar = icon(MoonStars);
export const Send = icon(PaperPlaneTilt); export const Smartphone = icon(DeviceMobile); export const AlertTriangle = icon(Warning); export const CalendarDays = icon(CalendarDots); export const MapPin = icon(PMapPin);
