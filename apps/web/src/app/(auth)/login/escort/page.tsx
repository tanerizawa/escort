'use client';

import { PortalLogin } from '@/components/auth/portal-login';
import { useI18n } from '@/i18n';

/**
 * Partner (escort) portal login.
 *
 * Reached only via explicit routing (marketing "Become a partner" CTA,
 * or the portal-swap link at the bottom of the client login). The
 * navbar's default "Login" button always points at /login.
 */
export default function EscortLoginPage() {
  const { t } = useI18n();

  return (
    <PortalLogin
      role="ESCORT"
      title={t('auth.escortLoginTitle')}
      subtitle={t('auth.escortLoginSubtitle')}
      swapPrompt={t('auth.loginAsClientPrompt')}
      swapCTA={t('auth.loginAsClientCTA')}
      swapHref="/login"
      wrongPortalMessage={t('auth.wrongPortalEscort')}
    />
  );
}
