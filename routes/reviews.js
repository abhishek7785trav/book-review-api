const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const Review = require('../models/Review');

// Submit review for a book
router.post('/books/:id/reviews', auth, async (req, res) => {
  try {
    const bookId = req.params.id;
    const { rating, comment } = req.body;

    // Check if user already reviewed this book
    const existingReview = await Review.findOne({ book: bookId, user: req.user.id });
    if (existingReview) {
      return res.status(400).send('You have already reviewed this book.');
    }

    const review = new Review({
      book: bookId,
      user: req.user.id,
      rating,
      comment,
    });
    await review.save();

    res.redirect(`/books/${bookId}`);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Update own review
router.get('/:id/edit', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).lean();
    if (!review) return res.status(404).send('Review not found');
    if (review.user.toString() !== req.user.id) return res.status(403).send('Not authorized');

    res.render('edit-review', { review });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.post('/:id', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).send('Review not found');
    if (review.user.toString() !== req.user.id) return res.status(403).send('Not authorized');

    review.rating = rating;
    review.comment = comment;
    await review.save();

    res.redirect(`/books/${review.book}`);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Delete own review
router.post('/:id/delete', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).send('Review not found');
    if (review.user.toString() !== req.user.id) return res.status(403).send('Not authorized');

    await review.deleteOne();

    res.redirect(`/books/${review.book}`);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
