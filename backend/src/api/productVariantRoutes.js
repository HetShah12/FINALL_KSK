// backend/src/api/productVariantRoutes.js
const express = require('express');
const router = express.Router(); // Make sure Router is capitalized
const { ProductVariant } = require('../models');

// GET all product variants
router.get('/', async (req, res) => {
  try {
    const variants = await ProductVariant.findAll();
    res.json(variants);
  } catch (error) {
    console.error('Error fetching product variants:', error);
    res.status(500).json({ message: 'Error fetching product variants', error: error.message });
  }
});

// GET a specific product variant by ID
router.get('/:id', async (req, res) => {
  try {
    const variant = await ProductVariant.findByPk(req.params.id);
    if (variant) {
      res.json(variant);
    } else {
      res.status(404).json({ message: 'ProductVariant not found' });
    }
  } catch (error) {
    console.error(`Error fetching product variant ${req.params.id}:`, error);
    res.status(500).json({ message: 'Error fetching product variant', error: error.message });
  }
});

module.exports = router; // CRITICAL: Ensure 'router' is exported