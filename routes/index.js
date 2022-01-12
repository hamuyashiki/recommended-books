'use strict';
const express = require('express');
const router = express.Router();
const Category = require('../models/category');

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

/* GET home page. */
router.get('/', function(req, res, next) {
  const title = 'おすすめBookくん';
  if (req.user) {
    Category.findAll({
    }).then(categories => {
      categories.forEach((category) => {
        category.formattedUpdatedAt = dayjs(category.updatedAt).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm');
      });
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