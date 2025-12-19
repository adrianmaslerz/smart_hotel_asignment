const ExcelJS = require('exceljs');
const path = require('path');

const firstNames = [
  'John',
  'Mary',
  'Peter',
  'Anna',
  'Thomas',
  'Catherine',
  'Mark',
  'Joan',
  'Robert',
  'Eva',
  'Luke',
  'Agnes',
  'Paul',
  'Dorothy',
  'Christopher',
];

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
];

const statuses = ['PENDING', 'COMPLETED', 'CANCELLED'];

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(start, end) {
  const date = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
  return date.toISOString().split('T')[0];
}

function generateReservations(count) {
  const reservations = [];
  for (let i = 0; i < count; i++) {
    const checkInDate = getRandomDate(
      new Date('2024-01-01'),
      new Date('2025-12-31'),
    );
    const checkOutDate = getRandomDate(
      new Date(checkInDate),
      new Date(
        new Date(checkInDate).getTime() + 30 * 24 * 60 * 60 * 1000,
      ),
    );

    reservations.push({
      reservation_id: String(12345 + i),
      guest_name: `${getRandomElement(firstNames)} ${getRandomElement(lastNames)}`,
      status: getRandomElement(statuses),
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
    });
  }
  return reservations;
}

async function generateExcel() {
  const recordCount = parseInt(process.argv[2]) || 10;

  if (recordCount < 1 || recordCount > 10000) {
    console.error('❌ Record count must be between 1 and 10000');
    process.exit(1);
  }

  const reservations = generateReservations(recordCount);
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reservations');

  worksheet.columns = [
    { header: 'reservation_id', key: 'reservation_id', width: 15 },
    { header: 'guest_name', key: 'guest_name', width: 20 },
    { header: 'status', key: 'status', width: 15 },
    { header: 'check_in_date', key: 'check_in_date', width: 15 },
    { header: 'check_out_date', key: 'check_out_date', width: 15 },
  ];

  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF366092' },
  };

  reservations.forEach((reservation) => {
    worksheet.addRow(reservation);
  });

  const filePath = path.join(__dirname, 'reservations.xlsx');
  await workbook.xlsx.writeFile(filePath);

  console.log(`✅ XLSX file generated: ${filePath}`);
  console.log(`📊 Number of records: ${reservations.length}`);
}

generateExcel().catch((err) => {
  console.error('❌ Error generating file:', err);
  process.exit(1);
});

