'use strict';
const express = require('express');
const router = express.Router();
const Recommendation = require('../models/recommendation'); //使ってない？
const Category = require('../models/category');

/* GET home page. */
router.get('/', function(req, res, next) {
  const title = 'おすすめbookくん';
  if (req.user) {
    Category.findAll({
    }).then(categories => {
      res.render('index', {
        title: title,
        user: req.user,
        categories: categories
      });
    });
  } else {
    res.render('index', { title: title, user: req.user });
  }
});

module.exports = router;
