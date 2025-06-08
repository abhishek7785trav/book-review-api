const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const Book = require('../models/Book');
const Review = require('../models/Review');

// Add new book - Auth required
router.get('/add', auth, (req, res) => {
  res.render('add-book');
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, author, genre, description } = req.body;
    const book = new Book({
      title,
      author,
      genre,
      description,
      createdBy: req.user.id,
    });
    await book.save();
    res.redirect('/books');
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get all books with pagination & filters
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 5, author, genre } = req.query;

    const filter = {};
    if (author) filter.author = new RegExp(author, 'i');
    if (genre) filter.genre = new RegExp(genre, 'i');

    const books = await Book.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .exec();

    const count = await Book.countDocuments(filter);

    res.render('books', {
      books,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      filters: { author: author || '', genre: genre || '' },
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Get book details + average rating + reviews paginated
router.get('/:id',auth, async (req, res) => {
  try {
    const bookId = req.params.id;
    const { page = 1, limit = 3 } = req.query;

    const book = await Book.findById(bookId).lean();
    if (!book) return res.status(404).send('Book not found');

    const reviews = await Review.find({ book: bookId })
      .populate('user', 'username')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .lean();

    const count = await Review.countDocuments({ book: bookId });

    // Average rating calculation
    const agg = await Review.aggregate([
      { $match: { book: book._id } },
      { $group: { _id: '$book', avgRating: { $avg: '$rating' } } }
    ]);

    const avgRating = agg.length ? agg[0].avgRating.toFixed(2) : 'No ratings yet';
    res.render('book-detail', {
      book,
      reviews,
      avgRating,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      userId: req.user?.id || null,
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
