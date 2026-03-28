'use client';

import {
  AlertTriangle, AlarmClock, Award, BarChart3, Bell, BellRing, Briefcase,
  Calendar, Camera, Check, CheckCircle2, Circle, CircleDot, Clapperboard,
  ClipboardList, Clock, CreditCard, Crown, DollarSign, FlaskConical,
  Gem, Hand, Heart, HeartPulse, Hourglass, KeyRound, Landmark, Lightbulb,
  Lock, Mail, MapPin, MessageCircle, PenLine, Phone, RefreshCw, Scale,
  Search, Send, Settings, Shield, ShieldAlert, Smartphone, Sparkles,
  Star, Ticket, Timer, Trophy, Undo2, Unlock, User, Users,
  UtensilsCrossed, Wallet, X, XCircle, Zap, type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  AlertTriangle, AlarmClock, Award, BarChart3, Bell, BellRing, Briefcase,
  Calendar, Camera, Check, CheckCircle2, Circle, CircleDot, Clapperboard,
  ClipboardList, Clock, CreditCard, Crown, DollarSign, FlaskConical,
  Gem, Hand, Heart, HeartPulse, Hourglass, KeyRound, Landmark, Lightbulb,
  Lock, Mail, MapPin, MessageCircle, PenLine, Phone, RefreshCw, Scale,
  Search, Send, Settings, Shield, ShieldAlert, Smartphone, Sparkles,
  Star, Ticket, Timer, Trophy, Undo2, Unlock, User, Users,
  UtensilsCrossed, Wallet, X, XCircle, Zap,
};

interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className = 'h-4 w-4' }: IconProps) {
  const IconComp = iconMap[name];
  if (!IconComp) return null;
  return <IconComp className={className} />;
}
