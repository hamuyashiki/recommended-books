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

router.post('/', authenticationEnsurer, (req, res, next) => {

  const updatedAt = new Date();
  // const categoryId = uuid.v4();
  if (req.body.categoryName == null) { // 既存カテゴリに本を登録する場合categoryNameをPOSTしない

    // 既存カテゴリに本を登録する処理
    if (req.body.comment == null) {
      Recommendation.create({
        bookName: req.body.bookName,
        categoryId: req.body.categoryId,
        createdBy: req.user.id,
        updatedAt: updatedAt,
        introduction: req.body.introduction,
        commentNum: 0
      })
        .then((r) => {
          /*
          Comment.create({
            recommendId: r.recommendId,
            createdBy: req.user.id,
            comment: req.body.comment,
            updatedAt: updatedAt
          })
          */
          res.redirect('/recommendations/' + r.categoryId);
        })
    } else {
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

          /*
          Comment.upsert({
            recommendId: recommendId,
            postedBy: req.user.id,
            comment: req.body.comment,
            updatedAt: updatedAt
          */
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
              //  Recommendation.update({
              //    commentNum: commentNum + 1
              //  },
              //    {
              //      where: { recommendId: recommendId }
              //    }
              //  )

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
                /*
                Comment.create({
                  recommendId: r.recommendId,
                  createdBy: req.user.id,
                  comment: req.body.comment,
                  updatedAt: updatedAt
                })
                */
                res.redirect('/recommendations/' + r.categoryId);
              })
          });
      };
    })
  }
});

router.get('/:categoryId', authenticationEnsurer, (req, res, next) => {
  // TO DO 選択されたカテゴリの本の一覧を表示する
  Category.findOne({
    where: { categoryId: req.params.categoryId }
  })
    .then((category) => {
      // TO DO userNameを表示させるならば　User.findOne する
      const cName = category.categoryName; // recommendation.pugに渡す"カテゴリ名"
      const cId = category.categoryId;
      const cCreatedBy = category.createdBy; // カテゴリを作った人の名前    
      console.log(cName);  // ここまでok 

      Recommendation.findAll({
        where: {
          categoryId: req.params.categoryId // 押したカテゴリに対応するcategoryIdで検索
        },
        order: [['updatedAt', 'DESC']]
      })
        // TO DO 選択されたカテゴリの本の一覧の配列を作成する
        .then((recommendations) => {
          console.log(recommendations);
          let recommendationArray = Object.values(recommendations);
          console.log(recommendationArray);

          let bookNamesMap = new Map();
          // let bookNames = [];    // もし、本の登録日も表示させるならばここをmapにする
          recommendationArray.forEach((r) => {
            // bookNames.push(r.bookName);
            console.log(r.bookName);
            bookNamesMap.set(r.bookName, r.commentNum)
        //    bookNamesMap.set(r.bookName, r.updatedAt)
          });
    //      console.log(bookNames);
    //      console.log(bookNames.length);
            console.log(bookNamesMap);
            console.log(bookNamesMap.size);
        
      
      res.render('bookshelf', {          // recommendation.pugに対し
      //  bookNames: bookNames,
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

// それぞれの書籍についての表示
router.get('/:categoryId/:key', authenticationEnsurer, (req, res, next) => {

  Category.findOne({
    where: { categoryId: req.params.categoryId }
  })
    .then((category) => {
      // TO DO userNameを表示させるならば　User.findOne する
      const cName = category.categoryName;　　// recommendation.pugに渡す"カテゴリ名"
      const cId = category.categoryId;
      console.log(cName);  // ここまでok     

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
            console.log(recommendations);


            let recommendationArray = Object.values(recommendations); // オブジェクトを配列にする
            // このあたりで配列の順番を日付の昇順にしたい
            console.log(recommendationArray);
            //        let bookComment = [];
            let bookCommentsMap = new Map();　　　　// key: postedBy , value: comment
            recommendationArray.forEach((r) => {　　// 配列の繰り返し処理
              //       bookComment.push(r.comment);
              const rc = r.comment;
              console.log(rc);
              
     //         if (Object.keys(rc).length === null) {
              if ( rc === null) {  
              }
              else {
                console.log(rc.postedBy);
                console.log(rc.comment)

                bookCommentsMap.set(rc.postedBy, rc.comment); // Mapオブジェクトに値を入れる
                console.log(bookCommentsMap);  
              }              
            });
            if (bookCommentsMap.size > 0) {
              var isComment = true;
              console.log(isComment);
            }
            else {
              isComment = false;
              console.log(isComment);
            }
            
            let rec = recommendationArray[0];  // ここがダメ　配列にしないとArrayの長さ分
            // 表示側はappendchildみたいな　each in でやる
            // どういう構造のデータを作りたいか考えてから実装する
            console.log(rec);
            let bName = rec.bookName;
            let rId = rec.recommendId;
            let intro = rec.introduction;
            console.log(bName);
            let comments = rec.comment;
            //    let comments = bookComment; // ここダメ
            console.log(comments);
            //     var isComment = true;
            //     if (comments === null) {
            //         isComment = false;
            //     }
            console.log(isComment);
            console.log(req.user.id);
            const userId = parseInt(req.user.id); // 文字列を数値に変換
            let myComment = bookCommentsMap.get(userId);
            if (myComment == null) {
              myComment = "";
            }            

            res.render('recommendation', {          // recommendation.pugに対し
              bookName: bName,
              recommendId: rId,
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
});


module.exports = router;