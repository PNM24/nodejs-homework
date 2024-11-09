const express = require('express');
const router = express.Router();
const Contact = require('../../models/contacts');
const authMiddleware = require('../../middlewares/auth');
const Joi = require('joi');

router.use(authMiddleware);

// Validare schema pentru contact
const contactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email(),
  phone: Joi.string(),
  favorite: Joi.boolean(),
});

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

    const total = await Contact.countDocuments(filter);

    res.json({
      contacts,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get contact by ID
router.get('/:contactId', async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.contactId,
      owner: req.user._id
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create contact
router.post('/', async (req, res) => {
  try {
    const { error } = contactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const contact = new Contact({
      ...req.body,
      owner: req.user._id
    });

    await contact.save();
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update contact
router.put('/:contactId', async (req, res) => {
  try {
    const { error } = contactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.contactId, owner: req.user._id },
      req.body,
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update favorite status
router.patch('/:contactId/favorite', async (req, res) => {
  try {
    const { favorite } = req.body;
    
    if (favorite === undefined) {
      return res.status(400).json({ message: 'missing field favorite' });
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.contactId, owner: req.user._id },
      { favorite },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete contact
router.delete('/:contactId', async (req, res) => {
  try {
    const contact = await Contact.findOneAndDelete({
      _id: req.params.contactId,
      owner: req.user._id
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    res.status(200).json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;