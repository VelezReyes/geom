const fs = require('fs');
const path = require('path');
const countryMapping = require('../countries.const.js');
const descriptivesDir = path.join(__dirname, '..', 'pdfs', 'descriptives');
const normalizedDir = path.join(__dirname, '..', 'pdfs', 'normalized');

if (!fs.existsSync(normalizedDir)) {
  fs.mkdirSync(normalizedDir, { recursive: true });
}

function cleanFileName(file) {
  return file
    .replace(/Template_/g, '')
    .replace('Descriptives-', '')
    .replace(/Descriptives_/g, '')
    .replace(/-/g, '_')
    .replace(/\s+/g, '_')
    .replace(/\.pdf\.pdf$/, '.pdf')
    .trim();
}

function normalizePdfNames() {
  const files = fs.readdirSync(descriptivesDir);

  files.forEach((file) => {
    const originalFilePath = path.join(descriptivesDir, file);
    const cleanedFileName = cleanFileName(file);

    const match = cleanedFileName.match(/([A-Za-z_]+)_(\d{4})\.pdf$/);

    if (match) {
      let countryName = match[1].replace(/_/g, ' ').toLowerCase();
      const year = match[2];

      if (countryName === 'timor leste') {
        countryName = 'timor-leste';
      } else if (countryName === 'guinea bissau') {
        countryName = 'guinea-bissau';
      } else if (countryName === 'ivory cost') {
        countryName = 'ivory coast';
      } else if (countryName === 'mali ') {
        countryName = 'mali';
      }

      const isoCode = Object.keys(countryMapping).find((code) =>
        countryMapping[code].toLowerCase() === countryName
      );

      if (isoCode) {
        const newFileName = `${isoCode}_${year}_all.pdf`;
        const newFilePath = path.join(normalizedDir, newFileName);

        fs.renameSync(originalFilePath, newFilePath);
        console.log(`Renamed and moved: ${file} -> ${newFileName}`);
      } else {
        console.log(`No ISO code match found for: ${file}`);
      }
    } else {
      console.log(`Invalid file name format: ${file}`);
    }
  });
}

normalizePdfNames();
