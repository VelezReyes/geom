const fs = require('fs');
const path = require('path');

const countryCodes = require('../countries.const.js');
const pdfsDirectory = path.join(__dirname, '..', 'pdfs');
const pdfCategories = [
  'alluvial', 
  'descriptive',
  'ex-ante', 
  'ex-post', 
  'types'
];

const files = [];
const pdfCombinations = {};
pdfCategories.forEach((category) => {
  const categoryDirectory = path.join(pdfsDirectory, category);
  const fileNames = fs.readdirSync(categoryDirectory);
  // console.log(fileNames);
  fileNames.forEach((fileName) => {
    const [iso, year] = fileName.split('_');
    if (!countryCodes[iso]) {
      console.error(`Invalid country code: ${iso}`);
      return;
    }
    const file = { category, iso, country: countryCodes[iso], year: parseInt(year) };
    // TODO: improve check for file existing in all categories
    pdfCombinations[`${iso}_${year}`] = pdfCombinations[`${iso}_${year}`] ? pdfCombinations[`${iso}_${year}`].concat(category) : [category];
    console.log(file);
    files.push(file);
  });
});

console.log('Files available for:', pdfCombinations);