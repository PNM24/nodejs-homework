const mongoose = require('mongoose');
const app = require('./app');
require('dotenv').config();

mongoose.set('strictQuery', false);

const { DB_HOST, PORT = 3000 } = process.env;

mongoose.connect(DB_HOST)
  .then(() => {
    console.log('Database connection successful');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Database connection error:', error.message);
    process.exit(1);
  });