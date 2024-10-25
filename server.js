const mongoose = require('mongoose');
const app = require('./app');

const DB_HOST = 'mongodb+srv://Catalin:curs2024@cluster0.lcpfz.mongodb.net/'; // Adaugă adresa ta MongoDB

mongoose.connect(DB_HOST)
  .then(() => {
    console.log('Database connection successful');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Database connection error:', error.message);
    process.exit(1);
  });