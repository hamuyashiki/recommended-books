'use strict';
import $ from 'jquery';
globalThis.jQuery = $;
import bootstrap from 'bootstrap';

const buttonSelfComment = $('#self-comment-button');
buttonSelfComment.click(() => {
  const recommendId = buttonSelfComment.data('recommend-id');
  const categoryId = buttonSelfComment.data('category-id');
  const bookName = buttonSelfComment.data('book-name');
  const userId = buttonSelfComment.data('user-id');
  const myComment = buttonSelfComment.data('my-comment');
  console.log(myComment);
  const comment = prompt('コメントを255文字以内で入力してください。', `${myComment}`);
  
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