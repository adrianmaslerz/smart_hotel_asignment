import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { XlsxService } from '../common/xlsx.service';

@Injectable()
export class ReservationsService {
  constructor(private xlsxService: XlsxService) {}

  async parseXlsxStream<T>(
    fileStream: Readable,
    onRow: (row: T) => Promise<void> | void,
  ): Promise<void> {
    return this.xlsxService.parseXlsxStream(fileStream, onRow);
  }
}
