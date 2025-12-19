import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Readable } from 'stream';
import { XlsxService } from '../common/xlsx.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsRepository } from './reservations.repository';
import { Reservation } from './reservation.schema';
import { ReservationStatus } from './reservation-status.enum';

type OnRowFailure = (rowIndex: number, errorMessage: string) => Promise<void>;

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

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

  private serializeValidationErrors(errors: ValidationError[]): string {
    const messages = errors.map((error) => {
      const constraints = error.constraints
        ? Object.values(error.constraints).join('; ')
        : 'Unknown validation error';
      return `${error.property}: ${constraints}`;
    });
    return messages.join(' | ');
  }

  private async mapRowToDto(
    row: Record<string, unknown>,
    rowIndex: number,
    onFailure: OnRowFailure,
  ): Promise<CreateReservationDto | null> {
    try {
      const mappedRow = {
        reservationId: row.reservation_id ?? row.reservationId,
        guestName: row.guest_name ?? row.guestName,
        status: row.status,
        checkInDate: row.check_in_date ?? row.checkInDate,
        checkOutDate: row.check_out_date ?? row.checkOutDate,
      };

      return plainToInstance(CreateReservationDto, mappedRow, {
        enableImplicitConversion: true,
        excludeExtraneousValues: false,
        exposeDefaultValues: true,
      });
    } catch (error) {
      const errorMessage = `Failed to map row to DTO: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(`Row ${rowIndex}: ${errorMessage}`);
      await onFailure(rowIndex, errorMessage);
      return null;
    }
  }

  private async validateDto(
    dto: CreateReservationDto,
    rowIndex: number,
    onFailure: OnRowFailure,
  ): Promise<boolean> {
    const errors = await validate(dto);
    if (errors.length > 0) {
      const errorMessage = `Validation failed: ${this.serializeValidationErrors(errors)}`;
      this.logger.error(`Row ${rowIndex}: ${errorMessage}`);
      await onFailure(rowIndex, errorMessage);
      return false;
    }
    return true;
  }

  private async processRowData(
    dto: CreateReservationDto,
    rowIndex: number,
    onFailure: OnRowFailure,
  ): Promise<void> {
    try {
      await this.processReservation(dto);
      this.logger.log(`Row ${rowIndex} processed`);
    } catch (error) {
      const errorMessage = `Processing failed: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(`Row ${rowIndex}: ${errorMessage}`);
      await onFailure(rowIndex, errorMessage);
    }
  }

  async processReservations(
    fileStream: Readable,
    onFailure: OnRowFailure,
  ): Promise<void> {
    this.logger.log('Starting reservation file processing');
    let processedRows = 0;
    let skippedRows = 0;

    const onRow = async (
      row: Record<string, unknown>,
      rowIndex: number,
    ): Promise<void> => {
      const dto = await this.mapRowToDto(row, rowIndex, onFailure);
      if (!dto) {
        skippedRows++;
        return;
      }

      const isValid = await this.validateDto(dto, rowIndex, onFailure);
      if (!isValid) {
        skippedRows++;
        return;
      }

      await this.processRowData(dto, rowIndex, onFailure);
      processedRows++;
    };

    try {
      await this.xlsxService.parseXlsxStream(fileStream, onRow);
      this.logger.log(
        `File processing completed. Processed: ${processedRows}, Skipped: ${skippedRows}`,
      );
    } catch (error) {
      this.logger.error(
        `Error during file processing: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
