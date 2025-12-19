import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument } from './reservation.schema';
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

  async upsert(
    reservationId: string,
    data: Partial<Reservation>,
  ): Promise<void> {
    await this.reservationModel.updateOne({ reservationId }, data, {
      upsert: true,
    });
  }
}
