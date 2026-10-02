import * as XLSX from 'xlsx';

export interface ParsedLocationRow {
  name: string;
  address: string;
  city: string;
}

export interface ImportError {
  row: number;
  message: string;
}

export interface ImportResult {
  validRows: ParsedLocationRow[];
  errors: ImportError[];
}

export class ExcelImportService {
  /**
   * Parse an Excel or CSV file buffer and extract standardized location records.
   */
  static parseLocations(buffer: ArrayBuffer): ImportResult {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { validRows: [], errors: [{ row: 0, message: 'File không chứa bảng dữ liệu nào.' }] };
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

    const validRows: ParsedLocationRow[] = [];
    const errors: ImportError[] = [];

    if (rawData.length === 0) {
      return { validRows: [], errors: [{ row: 0, message: 'Bảng tính rỗng hoặc không có dữ liệu dòng.' }] };
    }

    rawData.forEach((rowObj, index) => {
      const rowNumber = index + 2; // +2 accounting for header row and 1-based index

      // Case-insensitive & normalized header lookup
      const getVal = (...keys: string[]) => {
        for (const k of Object.keys(rowObj)) {
          const normalized = k.trim().toLowerCase();
          for (const key of keys) {
            if (normalized === key.toLowerCase()) {
              return String(rowObj[k]).trim();
            }
          }
        }
        return '';
      };

      const name = getVal('tên địa điểm', 'ten dia diem', 'name', 'tên gian hàng', 'booth name', 'địa điểm');
      const address = getVal('địa chỉ', 'dia chi', 'address', 'vị trí', 'location');
      const city = getVal('thành phố', 'thanh pho', 'city', 'tỉnh/thành phố', 'tỉnh');

      const missingFields: string[] = [];
      if (!name) missingFields.push('Tên địa điểm');
      if (!address) missingFields.push('Địa chỉ');
      if (!city) missingFields.push('Thành phố');

      if (missingFields.length > 0) {
        errors.push({
          row: rowNumber,
          message: `Thiếu thông tin bắt buộc: ${missingFields.join(', ')}`,
        });
      } else {
        validRows.push({ name, address, city });
      }
    });

    return { validRows, errors };
  }
}
