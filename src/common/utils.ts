import { Readable } from 'stream';
import { Workbook } from 'exceljs';

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
        const headers: string[] = [];
        const rows: (unknown[] | undefined)[] = [];

        worksheet.eachRow((row, rowNumber) => {
          const values = Array.isArray(row.values) ? row.values : [];
          if (rowNumber === 1) {
            values.forEach((value) => {
              headers.push(JSON.stringify(value ?? ''));
            });
          } else {
            rows.push(values);
          }
        });

        try {
          for (const values of rows) {
            if (!values) {
              continue;
            }
            const rowData: Record<string, unknown> = {};
            values.forEach((value: unknown, index: number) => {
              if (index > 0) {
                rowData[headers[index - 1]] = value;
              }
            });
            await Promise.resolve(onRow(rowData as T));
          }
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
