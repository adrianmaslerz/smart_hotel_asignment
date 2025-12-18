import { Readable } from 'stream';
import { Workbook, Worksheet } from 'exceljs';

function extractHeaders(worksheet: Worksheet): string[] {
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

function getDataRows(worksheet: Worksheet): (unknown[] | undefined)[] {
  const rows: (unknown[] | undefined)[] = [];
  let rowIndex = 0;

  worksheet.eachRow((row) => {
    rowIndex++;
    if (rowIndex > 1) {
      const values = Array.isArray(row.values) ? row.values : [];
      rows.push(values);
    }
  });

  return rows;
}

function mapRowData(
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

async function processRows<T>(
  rows: (unknown[] | undefined)[],
  headers: string[],
  onRow: (row: T) => Promise<void> | void,
): Promise<void> {
  for (const values of rows) {
    if (!values) {
      continue;
    }
    const rowData = mapRowData(values, headers);
    await Promise.resolve(onRow(rowData as T));
  }
}

export async function parseXlsxStream<T>(
  fileStream: Readable,
  onRow: (row: T) => Promise<void> | void,
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
          const headers = extractHeaders(worksheet);
          const rows = getDataRows(worksheet);

          await processRows(rows, headers, onRow);
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

