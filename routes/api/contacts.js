const express = require('express');
const router = express.Router();
const Contact = require('../../models/contacts');
const authMiddleware = require('../../middlewares/auth');

// Aplică middleware-ul de autentificare
router.use(authMiddleware);

// Obține contactele cu paginare și filtrare după favorite
router.get('/', async (req, res) => {
  const { page = 1, limit = 20, favorite } = req.query;
  const filter = { owner: req.user._id };

  if (favorite !== undefined) {
    filter.favorite = favorite === 'true';
  }

  const options = {
    skip: (Number(page) - 1) * Number(limit),
    limit: Number(limit),
  };

  try {
    const contacts = await Contact.find(filter).skip(options.skip).limit(options.limit);
    res.status(200).json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Creează un contact nou
router.post('/', async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name || !email || !phone) {
    return res.status(400).json({ message: 'missing required fields' });
  }

  try {
    const newContact = new Contact({
      name,
      email,
      phone,
      owner: req.user._id,
    });
    await newContact.save();
    res.status(201).json(newContact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
