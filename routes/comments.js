// ajax対応
'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Comment = require('../models/comment');

const Recommendation = require('../models/recommendation');


const updatedAt = new Date();

router.post('/:categoryId/:bookName/comments', authenticationEnsurer,
  (req, res, next) => {

    Recommendation.findOne({
      where: { recommendId: req.body.recommendId }
    })
      // TO DO 同一の親文書に対し同一人が複数のコメントを登録できなくする
      // UPSERTを使う(登録または更新)
      .then((r) => {

        const rId = r.recommendId;
        const categoryId = r.categoryId;
        const bookName = req.body.bookName;

        let commentNum = r.commentNum

        console.log(commentNum);

        Comment.findOne({
          where: { recommendId: rId, postedBy: req.user.id, }
        })
          .then((c) => {
            console.log(c);
            // 当該本に対してのコメントが初めてのユーザーのときはコメント数をインクリメントする
            if (c === null) {
              console.log(commentNum + 1);
              Recommendation.update({
                commentNum: commentNum + 1
              },
                {
                  where: { recommendId: rId }
                }
              )
            }
            // 当該本に対してのコメントが２度目以上のユーザーのときはコメント数を変えない
            else {
            }

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
          });
      });
  }
);
module.exports = router;