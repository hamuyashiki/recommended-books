'use strict';
import $ from 'jquery';

const Recommendation = require('../models/recommendation');
const Comment = require('../models/comment');

const buttonSelfComment = $('#self-comment-button');
buttonSelfComment.click(() => {
  const recommendId = buttonSelfComment.data('recommend-id');
  const categoryId = buttonSelfComment.data('category-id');
  const bookName = buttonSelfComment.data('book-name');
  // const postedBy = req.user.id;  // ダメ
  const userId = buttonSelfComment.data('user-id');
  const myComment = buttonSelfComment.data('my-comment');
  console.log(myComment);
  const comment = prompt('コメントを255文字以内で入力してください。', `${myComment}`);
  
  // ここから
  Recommendation.findOne({
    where: { recommendId: recommendId }
  })
    // TO DO 同一の親文書に対し同一人が複数のコメントを登録できなくする
    // UPSERTを使う(登録または更新)
    .then((r) => {

      const recommendId = r.recommendId;
      const categoryId = r.categoryId;
      const bookName = bookName;

      let commentNum = r.commentNum

      console.log(commentNum);
      
      // ここでRecommendationのコメント数をインクリメントする

      Comment.findOne({
        where: { recommendId: recommendId, postedBy: userId, }
      })
        .then((c) => {

          console.log(c);
          if (c === null) {
            // insertする
            console.log(commentNum + 1);
            Recommendation.update({
              commentNum: commentNum + 1
            },
              {
                where: { recommendId: recommendId }
              }
            )
          }
          else {
            console.log(commentNum + 1); // ここはcommentNum 
          }
        })
    })

    // ここまで

  if (comment) {    
    $.post(`/recommendations/${categoryId}/${bookName}/comments`,
      { comment: comment,
        recommendId: recommendId },
      (data) => {
        $('#comment-postedBy').text(userId);
        $('#self-comment').text(data.comment);
      });
  }
});