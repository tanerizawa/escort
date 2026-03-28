import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private static readonly logger = new Logger('GoogleStrategy');

  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get('GOOGLE_CLIENT_ID') || 'NOT_SET';
    const clientSecret = configService.get('GOOGLE_CLIENT_SECRET') || 'NOT_SET';
    const callbackURL = configService.get('GOOGLE_CALLBACK_URL') || 'https://api.areton.id/api/auth/google/callback';

    super({ clientID, clientSecret, callbackURL, scope: ['email', 'profile'] });

    if (clientID === 'NOT_SET' || clientSecret === 'NOT_SET') {
      GoogleStrategy.logger.warn('⚠️  Google OAuth not configured — social login will not work');
    } else {
      GoogleStrategy.logger.log('✅ Google OAuth initialized');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const { id, name, emails, photos } = profile;

    const user = {
      googleId: id,
      email: emails?.[0]?.value || '',
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      profilePhoto: photos?.[0]?.value || '',
      accessToken,
    };

    done(null, user);
  }
}
