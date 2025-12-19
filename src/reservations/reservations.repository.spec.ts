import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReservationsRepository } from './reservations.repository';
import { Reservation, ReservationDocument } from './reservation.schema';
import { ReservationStatus } from './reservation-status.enum';
import { Types } from 'mongoose';

describe('ReservationsRepository', () => {
  let repository: ReservationsRepository;
  let mockReservationModel: any;

  beforeEach(async () => {
    const mockReservationInstance = {
      save: jest.fn(),
    };

    mockReservationModel = jest
      .fn()
      .mockImplementation(() => mockReservationInstance) as any;
    mockReservationModel.updateOne = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsRepository,
        {
          provide: getModelToken(Reservation.name),
          useValue: mockReservationModel,
        },
      ],
    }).compile();

    repository = module.get<ReservationsRepository>(ReservationsRepository);
  });

  describe('updateStatus', () => {
    it('should call updateOne with reservation id and status', async () => {
      const reservationId = 'RES001';
      const status = ReservationStatus.COMPLETED;

      mockReservationModel.updateOne.mockResolvedValue({} as any);

      await repository.updateStatus(reservationId, status);

      expect(mockReservationModel.updateOne).toHaveBeenCalledWith(
        { reservationId },
        { status },
      );
    });

    it('should update to CANCELLED status', async () => {
      const reservationId = 'RES002';
      const status = ReservationStatus.CANCELLED;

      mockReservationModel.updateOne.mockResolvedValue({} as any);

      await repository.updateStatus(reservationId, status);

      expect(mockReservationModel.updateOne).toHaveBeenCalledWith(
        { reservationId },
        { status: ReservationStatus.CANCELLED },
      );
    });

    it('should update to PENDING status', async () => {
      const reservationId = 'RES003';

      mockReservationModel.updateOne.mockResolvedValue({} as any);

      await repository.updateStatus(reservationId, ReservationStatus.PENDING);

      expect(mockReservationModel.updateOne).toHaveBeenCalledWith(
        { reservationId },
        { status: ReservationStatus.PENDING },
      );
    });

    it('should propagate update errors', async () => {
      const reservationId = 'RES004';
      const updateError = new Error('Update failed');

      mockReservationModel.updateOne.mockRejectedValue(updateError);

      await expect(
        repository.updateStatus(reservationId, ReservationStatus.COMPLETED),
      ).rejects.toThrow('Update failed');
    });

    it('should handle non-existent reservation id', async () => {
      const reservationId = 'NON_EXISTENT';

      mockReservationModel.updateOne.mockResolvedValue({} as any);

      await repository.updateStatus(reservationId, ReservationStatus.COMPLETED);

      expect(mockReservationModel.updateOne).toHaveBeenCalled();
    });
  });

  describe('upsert', () => {
    it('should call updateOne with upsert option', async () => {
      const reservationId = 'RES005';
      const data = {
        guestName: 'John Doe',
        checkInDate: new Date('2024-12-20'),
        checkOutDate: new Date('2024-12-25'),
      } as any;

      mockReservationModel.updateOne.mockResolvedValue({} as any);

      await repository.upsert(reservationId, data);

      expect(mockReservationModel.updateOne).toHaveBeenCalledWith(
        { reservationId },
        data,
        { upsert: true },
      );
    });

    it('should insert new reservation when not exists', async () => {
      const reservationId = 'RES006';
      const data = {
        guestName: 'Jane Doe',
        status: ReservationStatus.PENDING,
        checkInDate: new Date('2024-12-21'),
        checkOutDate: new Date('2024-12-26'),
      } as any;

      mockReservationModel.updateOne.mockResolvedValue({} as any);

      await repository.upsert(reservationId, data);

      expect(mockReservationModel.updateOne).toHaveBeenCalledWith(
        { reservationId },
        data,
        { upsert: true },
      );
    });

    it('should update existing reservation', async () => {
      const reservationId = 'RES007';
      const data = {
        guestName: 'Updated Name',
        status: ReservationStatus.PENDING,
      } as any;

      mockReservationModel.updateOne.mockResolvedValue({} as any);

      await repository.upsert(reservationId, data);

      expect(mockReservationModel.updateOne).toHaveBeenCalledWith(
        { reservationId },
        data,
        { upsert: true },
      );
    });

    it('should propagate upsert errors', async () => {
      const reservationId = 'RES008';
      const data = { guestName: 'Test' } as any;
      const upsertError = new Error('Upsert failed');

      mockReservationModel.updateOne.mockRejectedValue(upsertError);

      await expect(repository.upsert(reservationId, data)).rejects.toThrow(
        'Upsert failed',
      );
    });

    it('should handle partial data update', async () => {
      const reservationId = 'RES009';
      const data = { status: ReservationStatus.COMPLETED } as any;

      mockReservationModel.updateOne.mockResolvedValue({} as any);

      await repository.upsert(reservationId, data);

      expect(mockReservationModel.updateOne).toHaveBeenCalledWith(
        { reservationId },
        data,
        { upsert: true },
      );
    });

    it('should handle empty data', async () => {
      const reservationId = 'RES010';
      const data = {} as any;

      mockReservationModel.updateOne.mockResolvedValue({} as any);

      await repository.upsert(reservationId, data);

      expect(mockReservationModel.updateOne).toHaveBeenCalledWith(
        { reservationId },
        data,
        { upsert: true },
      );
    });
  });

  describe('constructor', () => {
    it('should initialize with reservation model', () => {
      expect(repository).toBeDefined();
      expect((repository as any).reservationModel).toBe(mockReservationModel);
    });
  });
});
