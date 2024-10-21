const fs = require('fs');
const path = require('path');
const contactsPath = path.join(__dirname, 'contacts.json');

// Funcție pentru a lista toate contactele
const listContacts = () => {
  try {
    const data = fs.readFileSync(contactsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Eroare la citirea fișierului contacts.json:", error);
    return [];
  }
};

// Funcție pentru a găsi un contact după ID
const getById = (id) => {
  const contacts = listContacts();
  return contacts.find(contact => contact.id === id);
};

// Funcție pentru a adăuga un contact nou
const addContact = (newContact) => {
  const contacts = listContacts();
  contacts.push(newContact);
  fs.writeFileSync(contactsPath, JSON.stringify(contacts, null, 2)); // Salvează în fișier
  return newContact;
};

// Funcție pentru a șterge un contact după ID
const removeContact = (id) => {
  const contacts = listContacts();
  const filteredContacts = contacts.filter(contact => contact.id !== id);
  if (contacts.length === filteredContacts.length) {
    return false; // Nu s-a găsit contactul pentru a fi șters
  }
  fs.writeFileSync(contactsPath, JSON.stringify(filteredContacts, null, 2)); // Salvează modificările
  return true;
};

// Funcție pentru a actualiza un contact după ID
const updateContact = (id, updatedData) => {
  const contacts = listContacts();
  const index = contacts.findIndex(contact => contact.id === id);
  if (index === -1) {
    return null; // Contactul nu a fost găsit
  }
  contacts[index] = { ...contacts[index], ...updatedData }; // Actualizează datele
  fs.writeFileSync(contactsPath, JSON.stringify(contacts, null, 2)); // Salvează modificările
  return contacts[index];
};

module.exports = {
  listContacts,
  getById,
  addContact,
  removeContact,
  updateContact,
};
