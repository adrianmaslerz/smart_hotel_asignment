import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { Readable } from 'stream';
import { ReservationsService } from './reservations.service';
import { XlsxService } from '../common/xlsx.service';
import { ReservationsRepository } from './reservations.repository';
import { ReservationStatus } from './reservation-status.enum';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let mockXlsxService: jest.Mocked<XlsxService>;
  let mockReservationsRepository: jest.Mocked<ReservationsRepository>;

  beforeEach(async () => {
    mockXlsxService = {
      parseXlsxStream: jest.fn(),
    } as unknown as jest.Mocked<XlsxService>;

    mockReservationsRepository = {
      updateStatus: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<ReservationsRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        {
          provide: XlsxService,
          useValue: mockXlsxService,
        },
        {
          provide: ReservationsRepository,
          useValue: mockReservationsRepository,
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  describe('processReservations', () => {
    it('should call parseXlsxStream with file stream and callback', async () => {
      const mockStream = new Readable();
      const mockOnFailure = jest.fn();

      mockXlsxService.parseXlsxStream.mockResolvedValue(undefined);

      await service.processReservations(mockStream, mockOnFailure);

      expect(mockXlsxService.parseXlsxStream).toHaveBeenCalledWith(
        mockStream,
        expect.any(Function),
      );
    });

    it('should call updateStatus for CANCELLED reservation', async () => {
      const mockStream = new Readable();
      const mockOnFailure = jest.fn();

      const cancelledRow = {
        reservation_id: 'RES002',
        guest_name: 'Jane Doe',
        status: ReservationStatus.CANCELLED,
        check_in_date: '2024-12-20T00:00:00Z',
        check_out_date: '2024-12-25T00:00:00Z',
      };

      mockXlsxService.parseXlsxStream.mockImplementation(
        async (stream, callback) => {
          await callback(cancelledRow, 2);
        },
      );

      mockReservationsRepository.updateStatus.mockResolvedValue(undefined);

      await service.processReservations(mockStream, mockOnFailure);

      expect(mockReservationsRepository.updateStatus).toHaveBeenCalledWith(
        'RES002',
        ReservationStatus.CANCELLED,
      );
    });

    it('should call updateStatus for COMPLETED reservation', async () => {
      const mockStream = new Readable();
      const mockOnFailure = jest.fn();

      const completedRow = {
        reservation_id: 'RES003',
        guest_name: 'Bob Smith',
        status: ReservationStatus.COMPLETED,
        check_in_date: '2024-12-20T00:00:00Z',
        check_out_date: '2024-12-25T00:00:00Z',
      };

      mockXlsxService.parseXlsxStream.mockImplementation(
        async (stream, callback) => {
          await callback(completedRow, 2);
        },
      );

      mockReservationsRepository.updateStatus.mockResolvedValue(undefined);

      await service.processReservations(mockStream, mockOnFailure);

      expect(mockReservationsRepository.updateStatus).toHaveBeenCalledWith(
        'RES003',
        ReservationStatus.COMPLETED,
      );
    });

    it('should propagate xlsx service errors', async () => {
      const mockStream = new Readable();
      const mockOnFailure = jest.fn();
      const parseError = new Error('Parse failed');

      mockXlsxService.parseXlsxStream.mockRejectedValue(parseError);

      await expect(
        service.processReservations(mockStream, mockOnFailure),
      ).rejects.toThrow('Parse failed');
    });

    it('should call onFailure when row processing fails', async () => {
      const mockStream = new Readable();
      const mockOnFailure = jest.fn();

      const invalidRow = {
        reservation_id: null as any,
        guest_name: 'Invalid',
        status: 'invalid' as any,
        check_in_date: 'bad-date',
        check_out_date: '2024-12-25T00:00:00Z',
      };

      mockXlsxService.parseXlsxStream.mockImplementation(
        async (stream, callback) => {
          await callback(invalidRow, 2);
        },
      );

      await service.processReservations(mockStream, mockOnFailure);

      expect(mockOnFailure).toHaveBeenCalled();
    });

    it('should handle repository errors with onFailure', async () => {
      const mockStream = new Readable();
      const mockOnFailure = jest.fn();

      const validRow = {
        reservation_id: 'RES010',
        guest_name: 'User',
        status: ReservationStatus.PENDING,
        check_in_date: '2024-12-20T00:00:00Z',
        check_out_date: '2024-12-25T00:00:00Z',
      };

      mockXlsxService.parseXlsxStream.mockImplementation(
        async (stream, callback) => {
          await callback(validRow, 2);
        },
      );

      mockReservationsRepository.upsert.mockRejectedValue(
        new Error('Database error'),
      );

      await service.processReservations(mockStream, mockOnFailure);

      expect(mockOnFailure).toHaveBeenCalledWith(2, expect.any(String));
    });
  });

  describe('constructor', () => {
    it('should initialize with all dependencies', () => {
      expect(service).toBeDefined();
      expect((service as any).xlsxService).toBe(mockXlsxService);
      expect((service as any).reservationsRepository).toBe(
        mockReservationsRepository,
      );
    });
  });
});
