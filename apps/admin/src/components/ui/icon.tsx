'use client';

import {
  AlertTriangle, Award, BarChart3, Bell, BellRing, BookOpen, Briefcase,
  Calendar, Check, CheckCircle2, CircleDot, ClipboardList, Clock,
  CreditCard, DollarSign, Eye, FileText, Gem, Globe, GraduationCap,
  Heart, Hourglass, Landmark, LayoutDashboard, Lock, Mail, Map, MapPin,
  Medal, MessageCircle, Monitor, Phone, Radio, RefreshCw, Search,
  Settings, Shield, ShieldAlert, Smartphone, Sparkles, Star, Tag,
  Ticket, Timer, Trophy, Unlock, User, Users, Wallet, X, XCircle, Zap,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  AlertTriangle, Award, BarChart3, Bell, BellRing, BookOpen, Briefcase,
  Calendar, Check, CheckCircle2, CircleDot, ClipboardList, Clock,
  CreditCard, DollarSign, Eye, FileText, Gem, Globe, GraduationCap,
  Heart, Hourglass, Landmark, LayoutDashboard, Lock, Mail, Map, MapPin,
  Medal, MessageCircle, Monitor, Phone, Radio, RefreshCw, Search,
  Settings, Shield, ShieldAlert, Smartphone, Sparkles, Star, Tag,
  Ticket, Timer, Trophy, Unlock, User, Users, Wallet, X, XCircle, Zap,
};

interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className = 'h-4 w-4' }: IconProps) {
  const IconComp = iconMap[name];
  if (!IconComp) return <span className={className}>{name}</span>;
  return <IconComp className={className} />;
}
