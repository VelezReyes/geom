const express = require('express');
const { createConnection, getConnection } = require('./low-database');
const cors = require('cors');
const helmet = require('helmet');

// Server Setup
const PORT = 3001;

// LowDB connection
createConnection();
const db = getConnection();

// Express Setup
const app = express();

// Global Middlewares
app.use(cors({ origin: '*' }));
app.use(helmet());
app.use(express.json());

// Routes
const fileRoutes = require('./routes/file.routes');

/** Endpoints */ 
/** Resource: Files */
app.use('/api/files', fileRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`App listening on ${PORT}`);
});
