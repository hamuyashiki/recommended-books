'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const uuid = require('uuid');
const Recommendation = require('../models/recommendation');
const Category = require('../models/category');
const Comment = require('../models/comment');
const User = require('../models/user');
const { xssFilter } = require('helmet');
const { COMMENT_KEYS } = require('@babel/types');

router.get('/new', authenticationEnsurer, (req, res, next) => {
  res.render('new', { user: req.user });
});

router.get('/:categoryId/:cName/:recommendId/:bookName/edit', authenticationEnsurer, (req, res, next) => {
  Recommendation.findOne({
    where: {
      recommendId: req.params.recommendId,
      createdBy: req.user.id
    }
  }).then((r) => {
      const introduction = r.introduction;
      let commentNum = r.commentNum;　　// 不要
          
      res.render('bookedit', {
        categoryId: req.params.categoryId,
        categoryName: req.params.cName,
        recommendId: req.params.recommendId,        
        bookName: req.params.bookName,
        introduction: introduction
      });
    })
})

router.post('/:recommendId/:bookName/delete', authenticationEnsurer, (req, res, next) => {
  Comment.findOne({
    where: {
      recommendId: req.params.recommendId,
      postedBy: req.user.id
    }
  }).then((comment) => {
      if (parseInt(req.query.delete) === 1) {
        return Promise.all(comments.map((c) => { return c.destroy(); }));
    };
  })
})

router.post('/', authenticationEnsurer, (req, res, next) => {
  const updatedAt = new Date();
  // const categoryId = uuid.v4();
  if (req.body.categoryName == null) { // 既存カテゴリに本を登録する場合categoryNameをPOSTしないのでこの条件

    // ここにはupdateを混ぜられない
    // recommendIdが自動付与だから　すでに存在する　
    // recommdendIdがあるかどうかで切り分け可能か
　　　if (req.body.recommendId == null) {
    // 既存カテゴリに本を登録する処理
  //  if (req.body.comment == null) {
      Recommendation.create({
        bookName: req.body.bookName,
        categoryId: req.body.categoryId,
        createdBy: req.user.id,
        updatedAt: updatedAt,
        introduction: req.body.introduction,
        commentNum: 0
      })
        .then((r) => {
          res.redirect('/recommendations/' + r.categoryId);
        })
  //  }
    /* else {
      // 投稿されたコメントを保存する(ajaxではない場合)　ここの塊は削除対象                          
      Recommendation.findOne({
        where: { recommendId: req.body.recommendId }
      })
        // TO DO 同一の親文書に対し同一人が複数のコメントを登録できなくする
        // UPSERTを使う(登録または更新)
        .then((r) => {          
          const recommendId = r.recommendId;
          const categoryId = r.categoryId;
          const bookName = req.body.bookName;

          let commentNum = r.commentNum

          console.log(commentNum);

          // TO DO  ここでRecommendationのコメント数をインクリメントする　　削除する

          Comment.findOne({
            where: { recommendId: recommendId, postedBy: req.user.id, }
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
              Comment.upsert({
                recommendId: recommendId,
                postedBy: req.user.id,
                comment: req.body.comment,
                updatedAt: updatedAt
              })
            })
            .then(() => {
              console.log(commentNum);
              res.redirect('/recommendations/' + categoryId + '/' + bookName);
            })
        })


    }　// ajaxを使わない場合はここまでを削除する
    */
        } else{
          const introduction = req.body.introduction.slice(0, 255);
          const recommendId = parseInt(req.body.recommendId);
          Recommendation.update({
              bookName: req.body.bookName,
              updatedAt: updatedAt,
              introduction: introduction
          },
              {
                  where: { recommendId: recommendId }
              }
          )
        res.redirect(`/recommendations/${req.body.categoryId}/${req.body.bookName}`)
      }
    
  } else {
    // カテゴリを新しく登録して本をおすすめする
    Category.findOne({
      where: { categoryName: req.body.categoryName }
    }).then((c) => {
      if (c) {         // カテゴリの重複登録を防ぐ（Category tableのcategoryNameに　req.body.categoryName がないかを確認する）
        const err = new Error('すでに登録されているカテゴリです');
        err.status = 404;
        next(err);
      }
      else {
        // カテゴリーを新しく登録する処理
        Category.create({
          categoryName: req.body.categoryName,
          createdBy: req.user.id,
          updatedAt: updatedAt
        })
          .then(Category.findOne({
            where: { categoryName: req.body.categoryName }  // Category を　categoryNameで検索する
          })
          )
          .then((c) => {
            Recommendation.create({
              bookName: req.body.bookName,
              categoryId: c.categoryId, // 今回新たに作ったカテゴリーのcategoryId
              createdBy: req.user.id,
              updatedAt: updatedAt,
              introduction: req.body.introducion,
              commentNum: 0
            })
              .then((r) => {
                res.redirect('/recommendations/' + r.categoryId);
              })
          });
      };
    })
  }
});

router.get('/:categoryId', authenticationEnsurer, (req, res, next) => {
  // 選択されたカテゴリの本の一覧を表示する
  Category.findOne({
    where: { categoryId: req.params.categoryId }
  })
    .then((category) => {
      const cName = category.categoryName; // recommendation.pugに渡す"カテゴリ名"
      const cId = category.categoryId;
      const cCreatedBy = category.createdBy; // カテゴリを作った人の名前    

      Recommendation.findAll({
        where: {
          categoryId: req.params.categoryId // 押したカテゴリに対応するcategoryIdで検索
        },
        order: [['updatedAt', 'DESC']]
      })
        // 選択されたカテゴリの本の一覧の配列を作成する
        .then((recommendations) => {
          let recommendationArray = Object.values(recommendations);
          let bookNamesMap = new Map();
          recommendationArray.forEach((r) => {
            bookNamesMap.set(r.bookName, r.commentNum)
          });      
      res.render('bookshelf', {
        categoryId: cId,
        cName: cName,
        cCreatedBy: cCreatedBy,
        bookNamesMap: bookNamesMap
      });
    })
    })
});

// 書籍を登録する画面への遷移
router.get('/:categoryId/book', authenticationEnsurer, (req, res, next) => {
  Category.findOne({
    where: { categoryId: req.params.categoryId }
  })
    .then((category) => {

      const cName = category.categoryName;
      res.render('book', {
        user: req.user,
        categoryId: req.params.categoryId,
        cName: cName
      });
    });
});

// 書籍の編集画面への遷移
router.get('/:categoryId/bookEdit', authenticationEnsurer, (req, res, next) => {

});

// それぞれの書籍についての表示
router.get('/:categoryId/:key', authenticationEnsurer, (req, res, next) => {

  Category.findOne({
    where: { categoryId: req.params.categoryId }
  })
    .then((category) => {
      const cName = category.categoryName;　　// recommendation.pugに渡す"カテゴリ名"
      const cId = category.categoryId;  

      Recommendation.findAll({
        include: [
          {
            model: Comment,
            attributes: ['comment', 'postedBy']
          }],
        where: {                            // カテゴリIdと書籍名でレコードを検索
          categoryId: req.params.categoryId,
          bookName: req.params.key
        },
        order: [['updatedAt', 'DESC']]
      })

        .then((recommendations) => {　// 選択された書籍に対するコメント違いのレコード群
          if (recommendations) {
                     
            let recommendationArray = Object.values(recommendations); // オブジェクトを配列にする

            const rcreatedBy = recommendationArray[0].createdBy;
            
            let bookCommentsMap = new Map();　　　　// key: postedBy , value: comment
            recommendationArray.forEach((r) => {　　// 配列の繰り返し処理
              const rc = r.comment;
              
              if ( rc === null) {  
              }
              else {
                bookCommentsMap.set(rc.postedBy, rc.comment); // Mapオブジェクトに値を入れる 
              }              
            });
            if (bookCommentsMap.size > 0) {
              var isComment = true;
            }
            else {
              isComment = false;
            }
            
            let rec = recommendationArray[0];
            let bName = rec.bookName;
            let rId = rec.recommendId;
            let intro = rec.introduction;
            let comments = rec.comment;
            const userId = parseInt(req.user.id); // 文字列を数値に変換
            let myComment = bookCommentsMap.get(userId);
            if (myComment == null) {
              myComment = "";
            }            

            res.render('recommendation', {          // recommendation.pugに対し
              bookName: bName,
              recommendId: rId,
              rcreatedBy: rcreatedBy,
              introduction: intro,
              recommendations: recommendationArray,
              categoryId: cId,
              cName: cName,
              isComment: isComment,
              bookCommentsMap: bookCommentsMap,
              userId: userId,
              myComment: myComment　　// promptの初期値に表示するログインユーザーのコメント
            });

          } else {
            const err = new Error('指定したカテゴリにおすすめの本は見つかりません');
            err.status = 404;
            next(err);
          }
        })
});
  
// コメント入力画面へのルーター
  router.get('/:categoryId/:recommendId/comment', authenticationEnsurer, (req, res, next) => {
    Category.findOne({
      where: { categoryId: req.params.categoryId }
    })
    .then((category) => {
      const categoryName = category.categoryName;

      Recommendation.findOne({
        where: { recommendId: req.params.recommendId }
      })
      .then((recommendation) => {
        res.render('comment', {
          categoryName: categoryName,
          recommendation: recommendation,
          categoryId: req.params.categoryId  // comment.pug でpostするために必要
          
        });
      });
    });
  });
    /*
    if (recommendation) {  // 選択したカテゴリのrecommendation が存在したら
      Comment.findAll({
        where: { recommendId: recommendation.recommendId },
        order: [['commentId', 'ASC']]
      }).then((comments) => {
         res.render('recommendation', {
           // user: req.user,
           recommendations: recommendatons,
           categories: categories,
           comments: comments
           // users: [req.user]
         });
      });
    } else {
      const err = new Error('おすすめの本は見つかりません');
      err.status = 404;
      next(err);
    }
    
  });
  */

 
  function isMine(req, comment) {
    return comment && parseInt(comment.postedBy) === parseInt(req.user.id);
  }
// コメントを削除する処理（自分のコメントがあったら削除できる。コメント数を一つ減らす。）
  router.get('/:categoryId/:recommendId/:bookName/delete', authenticationEnsurer, (req, res, next) => {
      Comment.findOne({
        where: {
          recommendId: req.params.recommendId,
          postedBy: req.user.id
        }
      })
      .then(
        (c) => {
          const isM1 = isMine(req, c);
          if (isM1) { return c.destroy(); } // 自分のコメントがあったら削除
        }
      )
    Recommendation.findAll({
      include: [
        {
          model: Comment,
          attributes: ['comment', 'postedBy']
        }],
      where: { recommendId: req.params.recommendId }
    }).then((rs) => {
      let commentsArray = Object.values(rs); // オブジェクトを配列にする
      let commentsMap = new Map();　　　　// key: postedBy , value: commentNum
      commentsArray.forEach((c) => {　　// 配列の繰り返し処理
        const cc = c.comment;
        const cn = c.commentNum;
        if (cc === null) {
        }
        else {
          commentsMap.set(cc.postedBy, cn); // Mapオブジェクトに値を入れる
        }
      });
      const id = parseInt(req.user.id);
      const isM2 = commentsMap.has(id);
      // 自分のコメントがあったらコメント数をデクリメントする
      if (isM2) {
        const cNum = commentsMap.get(id);
        
        Recommendation.update({
          commentNum: cNum - 1
        },
          {
            where: { recommendId: req.params.recommendId }
          }
        )
        res.redirect(`/recommendations/${req.params.categoryId}/${req.params.bookName}`)
      }
      else {
        const err = new Error('自分のコメントがないか、削除する権限がありません。');
        err.status = 404;
        next(err);
      }
      
    }
    )
  });
});

module.exports = router;