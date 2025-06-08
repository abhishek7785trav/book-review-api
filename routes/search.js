const express = require('express');
const router = express.Router();

const Book = require('../models/Book');

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) return res.redirect('/books');

    const regex = new RegExp(q, 'i'); // case-insensitive

    const books = await Book.find({
      $or: [{ title: regex }, { author: regex }]
    }).limit(10).lean();

    res.render('books', { books, currentPage: 1, totalPages: 1, filters: {} });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
