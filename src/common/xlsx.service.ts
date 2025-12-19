import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { Workbook, Worksheet } from 'exceljs';

interface XlsxRow {
  rowIndex: number;
  values: unknown[];
}

@Injectable()
export class XlsxService {
  private extractHeaders(worksheet: Worksheet): string[] {
    const headers: string[] = [];
    let firstRow = true;

    worksheet.eachRow((row) => {
      if (firstRow) {
        const values = Array.isArray(row.values) ? row.values : [];
        values.forEach((value: unknown) => {
          headers.push(JSON.stringify(value ?? ''));
        });
        firstRow = false;
      }
    });

    return headers;
  }

  private getDataRows(worksheet: Worksheet): Array<{ rowIndex: number; values: unknown[] }> {
    const rows: Array<{ rowIndex: number; values: unknown[] }> = [];
    let rowIndex = 0;

    worksheet.eachRow((row) => {
      rowIndex++;
      if (rowIndex > 1) {
        const values = Array.isArray(row.values) ? row.values : [];
        rows.push({ rowIndex, values });
      }
    });

    return rows;
  }

  private mapRowData(
    values: unknown[],
    headers: string[],
  ): Record<string, unknown> {
    const rowData: Record<string, unknown> = {};
    values.forEach((value: unknown, index: number) => {
      if (index > 0) {
        rowData[headers[index - 1]] = value;
      }
    });
    return rowData;
  }

  private async processRows<T>(
    rows: XlsxRow[],
    headers: string[],
    onRow: (row: T, rowIndex: number) => Promise<void> | void,
  ): Promise<void> {
    for (const { rowIndex, values } of rows) {
      if (!values) {
        continue;
      }
      const rowData = this.mapRowData(values, headers);
      await Promise.resolve(onRow(rowData as T, rowIndex));
    }
  }

  async parseXlsxStream<T>(
    fileStream: Readable,
    onRow: (row: T, rowIndex: number) => Promise<void> | void,
  ): Promise<void> {
    const workbook = new Workbook();

    return new Promise((resolve, reject) => {
      workbook.xlsx
        .read(fileStream)
        .then(async () => {
          const worksheet = workbook.worksheets[0];
          if (!worksheet) {
            reject(new Error('No worksheet found in XLSX file'));
            return;
          }

          try {
            const headers = this.extractHeaders(worksheet);
            const rows = this.getDataRows(worksheet);

            await this.processRows(rows, headers, onRow);
            resolve();
          } catch (error) {
            reject(
              error instanceof Error
                ? error
                : new Error(String(error ?? 'Unknown error')),
            );
          }
        })
        .catch((error) => {
          reject(new Error(`Error parsing XLSX: ${error}`));
        });
    });
  }
}

