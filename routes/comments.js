// ajax対応
'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Comment = require('../models/comment');
const updatedAt = new Date();

router.post('/:categoryId/:bookName/comments', authenticationEnsurer,
  (req, res, next) => {
      const recommendId = req.body.recommendId;  // ここがダメ
      console.log(recommendId);
    const categoryId = req.params.categoryId;
    const bookName = req.params.bookName;

    const comment = req.body.comment;

    Comment.upsert({
      recommendId: recommendId,
      postedBy: req.user.id,
  //    comment: req.body.comment,
      updatedAt: updatedAt,
      
      comment: comment.slice(0, 255)
    }).then(() => {
      res.json({ status: 'OK', comment: comment });
    });
  }
);

module.exports = router;