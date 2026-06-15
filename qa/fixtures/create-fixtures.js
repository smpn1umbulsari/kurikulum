// Generate test fixture files for Playwright tests
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const fixturesDir = path.join(__dirname);

// Create fixtures directory if not exists
if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
}

// 1. Valid siswa test data
const validSiswaData = [
    { NIS: '00001', NISN: '0012345678', Nama: 'Ahmad Fauzi', 'Tempat Lahir': 'Jakarta', 'Tanggal Lahir': '2012-01-15', NIK: '3171234567890001', 'Jenis Kelamin': 'L', Agama: 'Islam', Alamat: 'Jl. Merdeka No.1', 'Nama Orang Tua': 'Budi Santoso' },
    { NIS: '00002', NISN: '0012345679', Nama: 'Siti Aminah', 'Tempat Lahir': 'Bandung', 'Tanggal Lahir': '2012-02-20', NIK: '3171234567890002', 'Jenis Kelamin': 'P', Agama: 'Islam', Alamat: 'Jl. Sudirman No.2', 'Nama Orang Tua': 'Hasan Wijaya' },
    { NIS: '00003', NISN: '0012345680', Nama: 'Budi Santoso', 'Tempat Lahir': 'Surabaya', 'Tanggal Lahir': '2012-03-10', NIK: '3171234567890003', 'Jenis Kelamin': 'L', Agama: 'Islam', Alamat: 'Jl. Thamrin No.3', 'Nama Orang Tua': 'Ahmad Dahlan' }
];

// 2. Invalid NIS empty
const invalidNisEmptyData = [
    { NIS: '', NISN: '0012345678', Nama: 'Test Siswa', 'Tempat Lahir': 'Jakarta', 'Tanggal Lahir': '2012-01-15', NIK: '3171234567890001', 'Jenis Kelamin': 'L', Agama: 'Islam', Alamat: 'Jl. Test', 'Nama Orang Tua': 'Orang Tua' }
];

// 3. Invalid JK
const invalidJkData = [
    { NIS: '00010', NISN: '0012345690', Nama: 'Invalid JK', 'Tempat Lahir': 'Jakarta', 'Tanggal Lahir': '2012-01-15', NIK: '3171234567890010', 'Jenis Kelamin': 'X', Agama: 'Islam', Alamat: 'Jl. Test', 'Nama Orang Tua': 'Orang Tua' }
];

// 4. Duplicate NIS (existing)
const duplicateNisData = [
    { NIS: '00001', NISN: '0012345678', Nama: 'Update Siswa', 'Tempat Lahir': 'Jakarta', 'Tanggal Lahir': '2012-01-15', NIK: '3171234567890001', 'Jenis Kelamin': 'L', Agama: 'Islam', Alamat: 'Jl. Update', 'Nama Orang Tua': 'Updated Ortu' }
];

function saveWorkbook(data, filename) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, path.join(fixturesDir, filename));
    console.log('Created: ' + filename);
}

// Create Excel files
saveWorkbook(validSiswaData, 'valid_siswa_test.xlsx');
saveWorkbook(invalidNisEmptyData, 'invalid_nis_empty.xlsx');
saveWorkbook(invalidJkData, 'invalid_jk.xlsx');
saveWorkbook(duplicateNisData, 'duplicate_nis.xlsx');

// Create text file (non-Excel)
fs.writeFileSync(path.join(fixturesDir, 'test.txt'), 'This is not an Excel file');
console.log('Created: test.txt');

// Create PNG placeholder (1x1 transparent PNG)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(pngBase64, 'base64');
fs.writeFileSync(path.join(fixturesDir, 'ttd_sample.png'), pngBuffer);
console.log('Created: ttd_sample.png');

// Create JPG placeholder (minimal valid JPEG header)
const jpgBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAAKAAoBAREA/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAHxAAAgICAgMBAAAAAAAAAAAAAQIDBAARBRIGITFB/9oADAMBAAIRAxEAPwC3xeFyF5b/AFAu9z//2Q==';
const jpgBuffer = Buffer.from(jpgBase64, 'base64');
fs.writeFileSync(path.join(fixturesDir, 'ttd_sample.jpg'), jpgBuffer);
console.log('Created: ttd_sample.jpg');

console.log('All fixtures created successfully!');
