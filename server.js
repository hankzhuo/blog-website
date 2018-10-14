const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');

const users = require('./routes/api/users');
const profile = require('./routes/api/profile');
const posts = require('./routes/api/posts');

const app = express();

// BodyParse middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

// DB config
const db = require('./config/keys').mongoURI;

// Connect to mongoDB
mongoose
  .connect(db)
  .then(() => console.log('mongoDB connected'))
  .catch((err) => console.log(err));

// Passport middleware
app.use(passport.initialize())

// Passport authentication
require('./config/passport')(passport)

// 定义 API Route
app.use('/api/users', users)
app.use('/api/profile', profile)
app.use('/api/posts', posts)

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server running on port ${port}`));
