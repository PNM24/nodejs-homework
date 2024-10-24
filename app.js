const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');

const contactsRouter = require('./routes/api/contacts');

const app = express();
const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';
const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());

// Conexiune la MongoDB
const DB_URI = 'mongodb+srv://cata:curs2024@cluster0.lcpfz.mongodb.net'; // Înlocuiește cu datele tale

mongoose.connect(DB_URI)
  .then(() => {
    console.log('Database connection successful');
  })
  .catch((error) => {
    console.error('Database connection error:', error.message);
    process.exit(1); // Oprește serverul în caz de eroare
  });

// Rutele pentru API-ul de contacte
app.use('/api/contacts', contactsRouter);

// Gestionarea erorilor 404
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});
  res.status(404).json({ message: 'Not found' });
});

// Middleware pentru erori generale
app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});
  res.status(500).json({ message: err.message });
});

module.exports = app;
module.exports = app;