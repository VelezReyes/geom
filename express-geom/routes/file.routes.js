// Service Router
const express = require('express');
const router = express.Router();
const { getConnection } = require('../low-database');
const db = getConnection();
const joi = require('joi');
const path = require('path');

const categories = [
  'alluvial', 
  'descriptive',
  'ex-ante', 
  'ex-post', 
  'types'
];
const countries = require('../countries.const.js');
const countryCodes = Object.keys(countries);
const MIN_YEAR = 1970; // TODO: dinamically get the min year from the files

// GET: fetch files
router.get('/', (_, res) => {
  const files = db.get('files').value(); // query
  res.status(200).json({ success: true, data: files })
});

// POST: create file
router.post('/', (req, res) => {
  const { body } = req;
  db.get('files').push(body).write(); // mutation
  res.status(201).json({ success: true, data: body });
});

// GET: fetch pdf file (by category, country, year)
router.get('/pdf', (req, res) => {
  const { category, country, year } = req.query;

  // validate query params
  const fileSchema = joi.object({
    category: joi.string().valid(...categories).required(),
    country: joi.string().valid(...countryCodes).required(),
    year: joi. number().integer().min(MIN_YEAR).max(new Date().getFullYear()).required(),
  });
  const result = fileSchema.validate(req.query);
  const { value, error } = result;

  if (error) {
    return res.status(400).json({ success: false, message: error.details });
  }

  // if (!category || !country || !year) {
  //   return res.status(400).json({ success: false, message: 'category, country, and year are required' });
  // }
  
  // validate category
  // const categories = db.get('files').keys().value();
  if (!categories.includes(category)) {
    return res.status(400).json({ success: false, message: 'invalid category' });
  }

  // validate file exists
  /*const fileExists = db.get(`files.${category}`).find({ country, year: parseInt(year) }).value();
  if (!fileExists) {
    return res.status(404).json({ success: false, message: 'file not found' });
  }*/

  const fileName = `${country}_${year}_all.pdf`;
  const filePath = path.join(__dirname, '..', 'pdfs', category, fileName);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`Error sending file: ${err.message}`);
      res.status(err.status).json({ success: false, message: 'error serving the file' });
    }
  });
});

module.exports = router;
