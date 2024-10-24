const express = require('express');
const router = express.Router();
const Contact = require('../../models/contact'); // Modelul Contact
const { updateStatusContact } = require('../../models/contacts'); // Funcția din models/contacts.js

// Ruta GET pentru toate contactele
router.get('/', async (req, res) => {
  try {
    const contacts = await Contact.find(); // Găsește toate contactele
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ruta GET pentru a obține un contact după ID
router.get('/:id', async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id); // Găsește contactul după ID
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.status(200).json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ruta POST pentru a adăuga un nou contact
router.post('/', async (req, res) => {
  const { name, email, phone, favorite } = req.body;

  try {
    const newContact = new Contact({ name, email, phone, favorite });
    const savedContact = await newContact.save(); // Salvează contactul în MongoDB
    res.status(201).json(savedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Ruta DELETE pentru a șterge un contact după ID
router.delete('/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id); // Șterge contactul
    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }
    res.status(200).json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ruta PUT pentru a actualiza un contact după ID
router.put('/:id', async (req, res) => {
  const { name, email, phone, favorite } = req.body;

  try {
    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, favorite },
      { new: true, runValidators: true } // Returnează contactul actualizat
    );
    
    if (!updatedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.status(200).json(updatedContact);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Ruta PATCH pentru actualizarea câmpului `favorite`
router.patch('/:contactId/favorite', async (req, res) => {
  const { contactId } = req.params;
  const { favorite } = req.body;

  if (favorite === undefined) {
    return res.status(400).json({ message: 'missing field favorite' });
  }

  try {
    const updatedContact = await updateStatusContact(contactId, favorite);

    if (!updatedContact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.status(200).json(updatedContact); // Returnează contactul actualizat
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;