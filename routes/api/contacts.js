const express = require('express');
const router = express.Router();
const Contact = require('../../models/contacts');
const authMiddleware = require('../../middlewares/auth');

router.use(authMiddleware);

// Get all contacts
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, favorite } = req.query;
    const skip = (page - 1) * limit;
    const filter = { owner: req.user._id };

    if (favorite !== undefined) {
      filter.favorite = favorite === 'true';
    }

    const contacts = await Contact.find(filter)
      .skip(skip)
      .limit(Number(limit));

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create contact
router.post('/', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'missing required fields' });
    }

    const contact = new Contact({
      name,
      email,
      phone,
      owner: req.user._id,
    });

    await contact.save();
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;