require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const connectDB = require('./config/db');

const app = express();

connectDB();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

// Middleware to make user info available in all templates
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.locals.user = decoded.id;
    } catch {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});

// Routes
const authRouter = require('./routes/auth');
const booksRouter = require('./routes/books');
const reviewsRouter = require('./routes/reviews');
const searchRouter = require('./routes/search');

app.use('/', authRouter);
app.use('/books', booksRouter);
app.use('/reviews', reviewsRouter);
app.use('/', searchRouter);


app.get('/', (req, res) => {
  res.redirect('/books');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
