const XLSX = require('xlsx');

const COLUMN_MAP = {
  'Mã SP':                      'code',
  'Tên SP':                     'name',
  'Danh mục':                   'category',
  'Đơn vị':                     'unit',
  'Giá bán (đ)':                'price',
  'Giá vốn (đ)':                'cost',
  'Tồn kho':                    'stock',
  'Ngưỡng tồn thấp':            'lowStockThreshold',
  'Ngày hết hạn (dd/mm/yyyy)':  'expiryDate'
};

function parseExpiryDate(val) {
  if (!val && val !== 0) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  const str = String(val).trim();
  if (!str) return null;

  // dd/mm/yyyy
  const parts = str.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const date = new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    if (!isNaN(date.getTime())) return date;
  }

  // Excel numeric serial date
  if (/^\d+(\.\d+)?$/.test(str)) {
    const serial = parseFloat(str);
    // Excel epoch: Jan 1, 1900 = serial 1 (with off-by-one leap year bug)
    const msPerDay = 86400000;
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + serial * msPerDay);
    if (!isNaN(date.getTime()) && date.getFullYear() > 2000) return date;
  }

  return null;
}

function parseImportBuffer(buffer) {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  } catch (e) {
    return { data: [], errors: [{ row: 0, message: 'File không đúng định dạng CSV hoặc Excel' }] };
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (rows.length === 0) {
    return { data: [], errors: [{ row: 0, message: 'File không có dữ liệu hoặc thiếu dòng tiêu đề' }] };
  }

  const results = [];
  const errors = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    const mapped = {};

    for (const [viCol, enKey] of Object.entries(COLUMN_MAP)) {
      const val = row[viCol] !== undefined ? row[viCol] : (row[enKey] !== undefined ? row[enKey] : '');
      mapped[enKey] = val;
    }

    const name = String(mapped.name || '').trim();
    if (!name) {
      errors.push({ row: rowNum, message: 'Thiếu tên sản phẩm' });
      return;
    }

    const price = parseFloat(mapped.price);
    if (isNaN(price) || price < 0) {
      errors.push({ row: rowNum, message: `Giá bán không hợp lệ: "${mapped.price}"` });
      return;
    }

    const cost = parseFloat(mapped.cost);
    const stock = parseInt(mapped.stock);
    const threshold = parseInt(mapped.lowStockThreshold);

    results.push({
      code: String(mapped.code || '').trim() || null,
      name,
      category: String(mapped.category || '').trim() || null,
      unit: String(mapped.unit || 'cái').trim() || 'cái',
      price,
      cost: isNaN(cost) ? 0 : cost,
      stock: isNaN(stock) ? 0 : stock,
      lowStockThreshold: isNaN(threshold) ? 10 : threshold,
      expiryDate: parseExpiryDate(mapped.expiryDate)
    });
  });

  return { data: results, errors };
}

module.exports = { parseImportBuffer };
