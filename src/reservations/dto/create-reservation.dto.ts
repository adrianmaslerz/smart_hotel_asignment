import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ReservationStatus } from '../reservation-status.enum';

const trimValue = (value: unknown): string =>
  JSON.stringify(value ?? '')
    .replace(/"/g, '')
    .trim();

const transformDate = (value: unknown): string => {
  if (typeof value === 'number') {
    return new Date(value).toISOString().split('T')[0];
  }
  return trimValue(value);
};

export class CreateReservationDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => trimValue(value))
  reservationId: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => trimValue(value))
  guestName: string;

  @IsNotEmpty()
  @IsEnum(ReservationStatus)
  status: ReservationStatus;

  @IsNotEmpty()
  @IsDateString()
  @Transform(({ value }) => transformDate(value))
  checkInDate: string;

  @IsNotEmpty()
  @IsDateString()
  @Transform(({ value }) => transformDate(value))
  checkOutDate: string;
}
