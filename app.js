var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var helmet = require('helmet');
var session = require('express-session');
var passport = require('passport');

// モデルの読み込み
var User = require('./models/user');
var Recommendation = require('./models/recommendation');
var Category = require('./models/category');
var Comment = require('./models/comment');
/*
User.sync().then(() => {
  Comment.belongsTo(User, {foreignKey: 'userId'});
  Comment.sync();
  Category.belongsTo(User, {foreignKey: 'createdBy'});
  Recommendation.belongsTo(User, {foreignKey: 'createdBy'});
  Category.sync().then(() => {
    Recommendation.belongsTo(Category, {foreignKey: 'categoryId'});
    Recommendation.sync();  
  });
});
*/

User.sync().then(() => {
  Comment.belongsTo(User, {foreignKey: 'postedBy'});
  Comment.sync().then(() => {
    Recommendation.belongsTo(Comment, {foreignKey: 'recommendId'});
  });
  Category.belongsTo(User, {foreignKey: 'createdBy'});
  Recommendation.belongsTo(User, {foreignKey: 'createdBy'});
  Category.sync().then(() => {
    Recommendation.belongsTo(Category, {foreignKey: 'categoryId'});
    Recommendation.sync();  
  });
});

var GitHubStrategy = require('passport-github2').Strategy;
var GITHUB_CLIENT_ID = 'dbecf3b1055d81f3ce8a';
var GITHUB_CLIENT_SECRET = 'fc6e6b36ae6f0eec1bec2c2eb901f6664fe4373c';

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: 'http://localhost:8000/auth/github/callback'
},
  function (accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      User.upsert({
        userId: profile.id,
        username: profile.username
      }).then(() => {
        done(null, profile);
      });
    });
  }
));


var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');
var logoutRouter = require('./routes/logout');
var recommendationsRouter = require('./routes/recommendations');
var commentsRouter = require('./routes/comments');
var bookeditRouter = require('./routes/bookedit');

var app = express();
app.use(helmet());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: 'f004efebf9ad7d55', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/recommendations', recommendationsRouter);
//app.use('/recommendations/categoryId/book', recommendationsRouter); // 多分不要
//app.use('/recommendations/categoryId/bookshelf', recommendationsRouter); // 多分不要
//app.use('/recommendations/categoryId/recommendId/comment', recommendationsRouter); // 多分不要
app.use('/recommendations', commentsRouter);
app.use('/recommendations', bookeditRouter);

app.get('/auth/github',
  passport.authenticate('github', { scope: ['user:email'] }),
  function (req, res) {
});

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    res.redirect('/');
});
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
