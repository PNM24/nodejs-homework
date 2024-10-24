const Contact = require('./contact'); // Importă modelul Contact

// Funcția pentru actualizarea câmpului `favorite`
const updateStatusContact = async (contactId, favorite) => {
  return await Contact.findByIdAndUpdate(
    contactId,
    { favorite }, // Actualizează doar câmpul `favorite`
    { new: true, runValidators: true } // Returnează contactul actualizat
  );
};

module.exports = {
  updateStatusContact,
};