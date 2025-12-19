import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { Workbook, Worksheet } from 'exceljs';
import { XlsxService } from './xlsx.service';

describe('XlsxService', () => {
  let service: XlsxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XlsxService],
    }).compile();

    service = module.get<XlsxService>(XlsxService);
  });

  describe('parseHeaderValue', () => {
    it('should return empty string for null value', () => {
      const result = (service as any).parseHeaderValue(null);
      expect(result).toBe('');
    });

    it('should return empty string for undefined value', () => {
      const result = (service as any).parseHeaderValue(undefined);
      expect(result).toBe('');
    });

    it('should return the string value as is', () => {
      const result = (service as any).parseHeaderValue('Header Name');
      expect(result).toBe('Header Name');
    });

    it('should convert number to string', () => {
      const result = (service as any).parseHeaderValue(123);
      expect(result).toBe('123');
    });

    it('should convert decimal number to string', () => {
      const result = (service as any).parseHeaderValue(45.67);
      expect(result).toBe('45.67');
    });

    it('should handle boolean value', () => {
      const result = (service as any).parseHeaderValue(true);
      expect(result).toBe('1');
    });

    it('should handle object value', () => {
      const result = (service as any).parseHeaderValue({});
      expect(result).toBe('NaN');
    });
  });

  describe('extractHeaders', () => {
    it('should extract headers from first row of worksheet', () => {
      const mockRow = {
        values: [null, 'Header1', 'Header2', 'Header3'],
      };

      const mockWorksheet = {
        eachRow: jest.fn((callback) => {
          callback(mockRow, 1);
        }),
      } as unknown as Worksheet;

      const result = (service as any).extractHeaders(mockWorksheet);

      expect(result).toEqual(['', 'Header1', 'Header2', 'Header3']);
      expect(mockWorksheet.eachRow).toHaveBeenCalledTimes(1);
      expect(mockWorksheet.eachRow).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle empty worksheet', () => {
      const mockWorksheet = {
        eachRow: jest.fn(),
      } as unknown as Worksheet;

      const result = (service as any).extractHeaders(mockWorksheet);

      expect(result).toEqual([]);
    });

    it('should convert numeric headers to strings', () => {
      const mockRow = {
        values: [null, 123, 45.67, 'Name'],
      };

      const mockWorksheet = {
        eachRow: jest.fn((callback) => {
          callback(mockRow, 1);
        }),
      } as unknown as Worksheet;

      const result = (service as any).extractHeaders(mockWorksheet);

      expect(result).toEqual(['', '123', '45.67', 'Name']);
    });

    it('should skip null and undefined values in header', () => {
      const mockRow = {
        values: [null, 'Header1', null, 'Header2', undefined],
      };

      const mockWorksheet = {
        eachRow: jest.fn((callback) => {
          callback(mockRow, 1);
        }),
      } as unknown as Worksheet;

      const result = (service as any).extractHeaders(mockWorksheet);

      expect(result).toEqual(['', 'Header1', '', 'Header2', '']);
    });

    it('should handle row without values array', () => {
      const mockRow = {};

      const mockWorksheet = {
        eachRow: jest.fn((callback) => {
          callback(mockRow, 1);
        }),
      } as unknown as Worksheet;

      const result = (service as any).extractHeaders(mockWorksheet);

      expect(result).toEqual([]);
    });
  });

  describe('getDataRows', () => {
    it('should extract data rows excluding first row', () => {
      const mockRow1 = { values: ['Header1', 'Header2'] };
      const mockRow2 = { values: ['Value1', 'Value2'] };
      const mockRow3 = { values: ['Value3', 'Value4'] };

      const mockWorksheet = {
        eachRow: jest.fn((callback) => {
          callback(mockRow1, 1);
          callback(mockRow2, 2);
          callback(mockRow3, 3);
        }),
      } as unknown as Worksheet;

      const result = (service as any).getDataRows(mockWorksheet);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ rowIndex: 2, values: ['Value1', 'Value2'] });
      expect(result[1]).toEqual({ rowIndex: 3, values: ['Value3', 'Value4'] });
    });

    it('should handle worksheet with only header row', () => {
      const mockRow = { values: ['Header1', 'Header2'] };

      const mockWorksheet = {
        eachRow: jest.fn((callback) => {
          callback(mockRow, 1);
        }),
      } as unknown as Worksheet;

      const result = (service as any).getDataRows(mockWorksheet);

      expect(result).toHaveLength(0);
    });

    it('should handle rows without values property', () => {
      const mockRow1 = { values: ['Header1'] };
      const mockRow2 = {};
      const mockRow3 = { values: ['Value1'] };

      const mockWorksheet = {
        eachRow: jest.fn((callback) => {
          callback(mockRow1, 1);
          callback(mockRow2, 2);
          callback(mockRow3, 3);
        }),
      } as unknown as Worksheet;

      const result = (service as any).getDataRows(mockWorksheet);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ rowIndex: 2, values: [] });
      expect(result[1]).toEqual({ rowIndex: 3, values: ['Value1'] });
    });

    it('should return empty array for empty worksheet', () => {
      const mockWorksheet = {
        eachRow: jest.fn(),
      } as unknown as Worksheet;

      const result = (service as any).getDataRows(mockWorksheet);

      expect(result).toHaveLength(0);
    });
  });

  describe('mapRowData', () => {
    it('should map row values to object with headers as keys', () => {
      const headers = ['Name', 'Age', 'Email'];
      const values = [null, 'John', 30, 'john@example.com'];

      const result = (service as any).mapRowData(values, headers);

      expect(result).toEqual({
        Name: 'John',
        Age: 30,
        Email: 'john@example.com',
      });
    });

    it('should skip first value in array (Excel row index)', () => {
      const headers = ['Col1', 'Col2'];
      const values = [null, 'Value1', 'Value2'];

      const result = (service as any).mapRowData(values, headers);

      expect(result).toEqual({
        Col1: 'Value1',
        Col2: 'Value2',
      });
    });

    it('should handle values array shorter than headers', () => {
      const headers = ['Col1', 'Col2', 'Col3'];
      const values = [null, 'Value1'];

      const result = (service as any).mapRowData(values, headers);

      expect(result).toEqual({
        Col1: 'Value1',
      });
    });

    it('should handle empty headers array', () => {
      const headers: string[] = [];
      const values = [null, 'Value1', 'Value2'];

      const result = (service as any).mapRowData(values, headers);

      expect(result).toEqual({
        undefined: 'Value2',
      });
    });

    it('should handle null and undefined values', () => {
      const headers = ['Col1', 'Col2', 'Col3'];
      const values = [null, null, undefined, 'Value3'];

      const result = (service as any).mapRowData(values, headers);

      expect(result).toEqual({
        Col1: null,
        Col2: undefined,
        Col3: 'Value3',
      });
    });

    it('should handle mixed data types', () => {
      const headers = ['String', 'Number', 'Boolean', 'Date'];
      const values = [null, 'text', 123, true, new Date('2024-01-01')];

      const result = (service as any).mapRowData(values, headers);

      expect(result).toEqual({
        String: 'text',
        Number: 123,
        Boolean: true,
        Date: new Date('2024-01-01'),
      });
    });
  });

  describe('processRows', () => {
    it('should call onRow callback for each row with correct parameters', async () => {
      const mockOnRow = jest.fn();
      const rows = [
        { rowIndex: 2, values: [null, 'Val1', 'Val2'] },
        { rowIndex: 3, values: [null, 'Val3', 'Val4'] },
      ];
      const headers = ['Header1', 'Header2'];

      await (service as any).processRows(rows, headers, mockOnRow);

      expect(mockOnRow).toHaveBeenCalledTimes(2);
      expect(mockOnRow).toHaveBeenNthCalledWith(
        1,
        { Header1: 'Val1', Header2: 'Val2' },
        2,
      );
      expect(mockOnRow).toHaveBeenNthCalledWith(
        2,
        { Header1: 'Val3', Header2: 'Val4' },
        3,
      );
    });

    it('should skip rows without values property', async () => {
      const mockOnRow = jest.fn();
      const rows = [
        { rowIndex: 2, values: [null, 'Val1', 'Val2'] },
        { rowIndex: 3, values: null as any },
        { rowIndex: 4, values: [null, 'Val3', 'Val4'] },
      ];
      const headers = ['Header1', 'Header2'];

      await (service as any).processRows(rows, headers, mockOnRow);

      expect(mockOnRow).toHaveBeenCalledTimes(2);
      expect(mockOnRow).toHaveBeenNthCalledWith(
        1,
        { Header1: 'Val1', Header2: 'Val2' },
        2,
      );
      expect(mockOnRow).toHaveBeenNthCalledWith(
        2,
        { Header1: 'Val3', Header2: 'Val4' },
        4,
      );
    });

    it('should handle empty rows array', async () => {
      const mockOnRow = jest.fn();
      const rows: any[] = [];
      const headers = ['Header1', 'Header2'];

      await (service as any).processRows(rows, headers, mockOnRow);

      expect(mockOnRow).not.toHaveBeenCalled();
    });

    it('should handle async onRow callback', async () => {
      const mockOnRow = jest.fn().mockResolvedValue(undefined);
      const rows = [{ rowIndex: 2, values: [null, 'Val1', 'Val2'] }];
      const headers = ['Header1'];

      await (service as any).processRows(rows, headers, mockOnRow);

      expect(mockOnRow).toHaveBeenCalledTimes(1);
    });

    it('should handle synchronous onRow callback', async () => {
      const mockOnRow = jest.fn();
      const rows = [{ rowIndex: 2, values: [null, 'Val1', 'Val2'] }];
      const headers = ['Header1'];

      await (service as any).processRows(rows, headers, mockOnRow);

      expect(mockOnRow).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from onRow callback', async () => {
      const error = new Error('Processing error');
      const mockOnRow = jest.fn().mockRejectedValue(error);
      const rows = [{ rowIndex: 2, values: [null, 'Val1', 'Val2'] }];
      const headers = ['Header1'];

      await expect(
        (service as any).processRows(rows, headers, mockOnRow),
      ).rejects.toThrow('Processing error');
    });

    it('should execute rows sequentially', async () => {
      const callOrder: number[] = [];
      const mockOnRow = jest.fn().mockImplementation((row, rowIndex) => {
        callOrder.push(rowIndex);
        return Promise.resolve();
      });

      const rows = [
        { rowIndex: 2, values: ['Val1'] },
        { rowIndex: 3, values: ['Val2'] },
        { rowIndex: 4, values: ['Val3'] },
      ];
      const headers = ['Header1'];

      await (service as any).processRows(rows, headers, mockOnRow);

      expect(callOrder).toEqual([2, 3, 4]);
    });
  });

  describe('parseXlsxStream', () => {
    it('should parse XLSX stream and call onRow for each data row', async () => {
      const mockOnRow = jest.fn() as (
        row: unknown,
        rowIndex: number,
      ) => Promise<void> | void;
      const mockWorksheet = {
        eachRow: jest.fn((callback) => {
          callback({ values: [null, 'Name', 'Age'] }, 1);
          callback({ values: [null, 'John', 30] }, 2);
          callback({ values: [null, 'Jane', 25] }, 3);
        }),
      } as unknown as Worksheet;

      jest.spyOn(require('exceljs'), 'Workbook').mockImplementation(() => ({
        worksheets: [mockWorksheet],
        xlsx: {
          read: jest.fn().mockResolvedValue(undefined),
        },
      }));

      const mockStreamFile = new Readable();
      mockStreamFile.push(null);

      await service.parseXlsxStream(mockStreamFile, mockOnRow);

      expect(mockOnRow).toHaveBeenCalledTimes(2);
    });

    it('should reject when no worksheet found', async () => {
      const mockOnRow = jest.fn() as (
        row: unknown,
        rowIndex: number,
      ) => Promise<void> | void;
      const mockStream = new Readable();
      mockStream.push(null);

      jest.spyOn(require('exceljs'), 'Workbook').mockImplementation(() => ({
        worksheets: [],
        xlsx: {
          read: jest.fn().mockResolvedValue(undefined),
        },
      }));

      await expect(
        service.parseXlsxStream(mockStream, mockOnRow),
      ).rejects.toThrow('No worksheet found in XLSX file');
    });

    it('should reject on workbook.xlsx.read error', async () => {
      const mockOnRow = jest.fn() as (
        row: unknown,
        rowIndex: number,
      ) => Promise<void> | void;
      const mockStream = new Readable();
      mockStream.push(null);

      const readError = new Error('Stream read error');

      jest.spyOn(require('exceljs'), 'Workbook').mockImplementation(() => ({
        worksheets: [],
        xlsx: {
          read: jest.fn().mockRejectedValue(readError),
        },
      }));

      await expect(
        service.parseXlsxStream(mockStream, mockOnRow),
      ).rejects.toThrow('Stream read error');
    });

    it('should reject when processing rows fails', async () => {
      const processingError = new Error('Row processing error');
      const mockOnRow = jest.fn().mockRejectedValue(processingError) as (
        row: unknown,
        rowIndex: number,
      ) => Promise<void> | void;
      const mockStream = new Readable();
      mockStream.push(null);

      const mockWorksheet = {
        eachRow: jest.fn((callback) => {
          callback({ values: [null, 'Name'] }, 1);
          callback({ values: [null, 'John'] }, 2);
        }),
      } as unknown as Worksheet;

      jest.spyOn(require('exceljs'), 'Workbook').mockImplementation(() => ({
        worksheets: [mockWorksheet],
        xlsx: {
          read: jest.fn().mockResolvedValue(undefined),
        },
      }));

      await expect(
        service.parseXlsxStream(mockStream, mockOnRow),
      ).rejects.toThrow('Row processing error');
    });

    it('should handle unknown error during processing', async () => {
      const mockOnRow = jest.fn() as (
        row: unknown,
        rowIndex: number,
      ) => Promise<void> | void;
      const mockStream = new Readable();
      mockStream.push(null);

      const mockWorksheet = {
        eachRow: jest.fn(),
      } as unknown as Worksheet;

      jest.spyOn(require('exceljs'), 'Workbook').mockImplementation(() => ({
        worksheets: [mockWorksheet],
        xlsx: {
          read: jest.fn().mockImplementation(async () => {
            throw 'Not an error object';
          }),
        },
      }));

      await expect(
        service.parseXlsxStream(mockStream, mockOnRow),
      ).rejects.toThrow('Error parsing XLSX:');
    });
  });
});
