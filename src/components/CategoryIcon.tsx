import {
  Utensils,
  Car,
  GraduationCap,
  Home,
  Zap,
  Sparkles,
  HeartPulse,
  ShoppingBag,
  Tv,
  Folder,
  Repeat,
  Receipt,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  'graduation-cap': GraduationCap,
  home: Home,
  zap: Zap,
  sparkles: Sparkles,
  'heart-pulse': HeartPulse,
  'shopping-bag': ShoppingBag,
  tv: Tv,
  folder: Folder,
  repeat: Repeat,
  receipt: Receipt,
  lightbulb: Lightbulb,
};

interface CategoryIconProps {
  icon: string;
  className?: string;
}

export function CategoryIcon({ icon, className }: CategoryIconProps) {
  const Icon = iconMap[icon] || Folder;
  return <Icon className={cn('w-4 h-4', className)} />;
}
