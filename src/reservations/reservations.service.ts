import { Injectable, BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Readable } from 'stream';
import { XlsxService } from '../common/xlsx.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsRepository } from './reservations.repository';
import { Reservation } from './reservation.schema';
import { ReservationStatus } from './reservation-status.enum';

@Injectable()
export class ReservationsService {
  constructor(
    private xlsxService: XlsxService,
    private reservationsRepository: ReservationsRepository,
  ) {}

  private async processReservation(dto: CreateReservationDto): Promise<void> {
    const { reservationId, status } = dto;

    if (
      status === ReservationStatus.CANCELLED ||
      status === ReservationStatus.COMPLETED
    ) {
      await this.reservationsRepository.updateStatus(reservationId, status);
    } else {
      const reservationData: Partial<Reservation> = {
        reservationId: dto.reservationId,
        guestName: dto.guestName,
        status: dto.status,
        checkInDate: new Date(dto.checkInDate),
        checkOutDate: new Date(dto.checkOutDate),
      };
      await this.reservationsRepository.upsert(reservationId, reservationData);
    }
  }

  async processReservations(fileStream: Readable): Promise<void> {
    const onRow = async (row: Record<string, unknown>): Promise<void> => {
      const dto = plainToInstance(CreateReservationDto, row, {
        enableImplicitConversion: true,
      });
      const errors = await validate(dto);
      if (errors.length > 0) {
        throw new BadRequestException(
          `Validation failed for row: ${JSON.stringify(errors)}`,
        );
      }

      await this.processReservation(dto);
    };

    return this.xlsxService.parseXlsxStream(fileStream, onRow);
  }
}
