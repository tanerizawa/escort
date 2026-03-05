import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123-reset-token' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewStrongP@ss123' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
