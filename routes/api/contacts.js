const express = require('express');
const router = express.Router();
const contactsModel = require('../../models/contacts');
const { v4: uuidv4 } = require('uuid');

// Ruta GET pentru a obține toate contactele
router.get('/', (req, res) => {
  const contacts = contactsModel.listContacts();
  res.status(200).json(contacts);
});

// Ruta GET pentru a obține un contact după ID
router.get('/:id', (req, res) => {
  const contact = contactsModel.getById(req.params.id);
  if (contact) {
    res.status(200).json(contact);
  } else {
    res.status(404).json({ message: "Not found" });
  }
});

// Ruta POST pentru a adăuga un nou contact
router.post('/', (req, res) => {
  const { name, email, phone } = req.body;

  // Validare: Verifică dacă toate câmpurile sunt prezente
  if (!name || !email || !phone) {
    return res.status(400).json({ message: "missing required name field" });
  }

  // Creează noul contact cu un ID unic
  const newContact = {
    id: uuidv4(),
    name,
    email,
    phone
  };

  // Apelează funcția pentru a adăuga contactul și salvează-l în fișierul JSON
  const addedContact = contactsModel.addContact(newContact);

  // Returnează noul contact și status code 201
  return res.status(201).json(addedContact);
});

// Ruta DELETE pentru a șterge un contact după ID
router.delete('/:id', (req, res) => {
  const isDeleted = contactsModel.removeContact(req.params.id);
  if (isDeleted) {
    res.status(200).json({ message: "contact deleted" });
  } else {
    res.status(404).json({ message: "Not found" });
  }
});

// Ruta PUT pentru a actualiza un contact după ID
router.put('/:id', (req, res) => {
  const { name, email, phone } = req.body;

  // Validare: Verifică dacă există date de actualizat
  if (!name && !email && !phone) {
    return res.status(400).json({ message: "missing fields" });
  }

  // Apelează funcția pentru a actualiza contactul
  const updatedContact = contactsModel.updateContact(req.params.id, req.body);
  if (updatedContact) {
    res.status(200).json(updatedContact);
  } else {
    res.status(404).json({ message: "Not found" });
  }
});

module.exports = router;
