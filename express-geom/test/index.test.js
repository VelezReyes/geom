const express = require('express');
const http = require('http');
const { createConnection } = require('../low-database');

// Server Setup
let server;
const PORT = 3000;

beforeAll((done) => {
  // LowDB connection
  createConnection();

  // Express Setup
  app = express();

  // Global Middlewares
  app.use(express.json());

  // Routes
  const fileRoutes = require('../routes/file.routes');

  app.use('/api/files', fileRoutes);

  // Servers
  server = http.createServer(app);
  server.listen(PORT, done); 
});

afterAll((done) => {
  server.close(done);
});

describe('GET /api/files', () => {
  it('should return a map of files by category', (done) => {
    http.get(`http://localhost:${PORT}/api/files`, (res) => {
      expect(res.statusCode).toBe(200);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const response = JSON.parse(data);
        expect(response).toHaveProperty('success', true);
        expect(response.data).toBeInstanceOf(Object);
        done();
      });
    });
  });
});
