'use client';

import { ActiveBookingPartner } from '@/stores/active-booking.store';
import { Check, MessageCircle, Star } from 'lucide-react';

interface TransactionPartnerInfoProps {
  partner: ActiveBookingPartner;
  role: 'CLIENT' | 'ESCORT';  // role of the partner (not current user)
  onChat?: () => void;
}

export function TransactionPartnerInfo({ partner, role, onChat }: TransactionPartnerInfoProps) {
  const fullName = `${partner.firstName} ${partner.lastName}`;
  const initials = `${partner.firstName?.[0] || ''}${partner.lastName?.[0] || ''}`.toUpperCase();
  const isEscort = role === 'ESCORT';

  return (
    <div className="rounded-2xl border border-dark-700/50 bg-dark-800/60 p-4">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          {partner.profilePhoto ? (
            <img
              src={partner.profilePhoto}
              alt={fullName}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-dark-600"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dark-700 ring-2 ring-dark-600">
              <span className="text-lg font-medium text-dark-300">{initials}</span>
            </div>
          )}
          {/* Online dot */}
          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-dark-800 bg-green-500" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-white truncate">{fullName}</h3>
            {partner.isVerified && (
              <span className="shrink-0 text-blue-400" title="Terverifikasi"><Check className="h-4 w-4" /></span>
            )}
          </div>
          <p className="text-xs text-dark-400">
            {isEscort ? 'Escort Partner' : 'Client'}
          </p>
          {isEscort && partner.escortProfile && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-yellow-400">
                <Star className="h-4 w-4 inline-block" /> {partner.escortProfile.ratingAvg?.toFixed(1) || '–'}
              </span>
              {partner.escortProfile.totalReviews > 0 && (
                <span className="text-[10px] text-dark-500">
                  ({partner.escortProfile.totalReviews.toLocaleString('id-ID')} reviews)
                </span>
              )}
              {partner.escortProfile.tier && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {partner.escortProfile.tier}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-1.5">
          {onChat && (
            <button
              onClick={onChat}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 transition-colors hover:bg-brand-500/20"
              title="Chat"
            >
              <MessageCircle className="h-4 w-4 inline-block" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
