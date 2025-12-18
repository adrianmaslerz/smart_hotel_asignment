import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { parseXlsxStream } from '../common/utils';

@Injectable()
export class ReservationsService {
  async parseXlsxStream<T>(
    fileStream: Readable,
    onRow: (row: T) => Promise<void> | void,
  ): Promise<void> {
    return parseXlsxStream(fileStream, onRow);
  }
}
