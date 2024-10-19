const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const contactsRouter = require('./routes/api/contacts');

const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

// Setează rutele pentru /api/contacts
app.use('/api/contacts', contactsRouter);

// Ruta pentru cereri care nu sunt găsite
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

// Middleware pentru gestionarea erorilor
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

module.exports = app;