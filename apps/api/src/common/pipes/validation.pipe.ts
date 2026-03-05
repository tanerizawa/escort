import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseUUIDPipe implements PipeTransform {
  transform(value: string): string {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new BadRequestException(`"${value}" bukan UUID yang valid`);
    }
    return value;
  }
}

@Injectable()
export class ParseIntPipe implements PipeTransform {
  transform(value: string): number {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new BadRequestException(`"${value}" bukan angka yang valid`);
    }
    return parsed;
  }
}
