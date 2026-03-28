import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token to exchange for new access token' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LogoutDto {
  @ApiProperty({ description: 'Refresh token to invalidate' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class Verify2FASetupDto {
  @ApiProperty({ description: '6-digit 2FA code from authenticator app' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class Verify2FALoginDto {
  @ApiProperty({ description: 'Temporary token from login response' })
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @ApiProperty({ description: '6-digit 2FA code from authenticator app' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class Disable2FADto {
  @ApiProperty({ description: '6-digit 2FA code to confirm disable' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
