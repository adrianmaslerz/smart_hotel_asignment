import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ReservationStatus } from './reservation-status.enum';

export type ReservationDocument = HydratedDocument<Reservation>;

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ unique: true })
  reservationId: string;

  @Prop()
  guestName: string;

  @Prop({ enum: ReservationStatus, default: ReservationStatus.PENDING })
  status: ReservationStatus;

  @Prop()
  checkInDate: Date;

  @Prop()
  checkOutDate: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
