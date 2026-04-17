'use client';

import { PortalLogin } from '@/components/auth/portal-login';
import { useI18n } from '@/i18n';

/**
 * Client portal login (default).
 *
 * The big "Login" button in the marketing navbar points here. Partners
 * (escorts) sign in via /login/escort.
 */
export default function ClientLoginPage() {
  const { t } = useI18n();

  return (
    <PortalLogin
      role="CLIENT"
      title={t('auth.clientLoginTitle')}
      subtitle={t('auth.clientLoginSubtitle')}
      swapPrompt={t('auth.loginAsEscortPrompt')}
      swapCTA={t('auth.loginAsEscortCTA')}
      swapHref="/login/escort"
      wrongPortalMessage={t('auth.wrongPortalClient')}
    />
  );
}
