import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument } from './reservation.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationStatus } from './reservation-status.enum';

@Injectable()
export class ReservationsRepository {
  constructor(
    @InjectModel(Reservation.name)
    private reservationModel: Model<ReservationDocument>,
  ) {}

  async updateStatus(
    reservationId: string,
    status: ReservationStatus,
  ): Promise<void> {
    await this.reservationModel.updateOne({ reservationId }, { status });
  }

  async upsert(dto: CreateReservationDto): Promise<void> {
    await this.reservationModel.updateOne(
      { reservationId: dto.reservationId },
      {
        reservationId: dto.reservationId,
        guestName: dto.guestName,
        status: dto.status,
        checkInDate: dto.checkInDate,
        checkOutDate: dto.checkOutDate,
      },
      { upsert: true },
    );
  }
}

