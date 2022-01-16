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
  const buttonFlag1 = 1; // bootstrap navbar にボタンを表示させる条件だけに使う
  res.render('new', {
    user: req.user,
    buttonFlag1: buttonFlag1 
  });
});

router.get('/:categoryId/:cName/:recommendId/:bookName/edit', authenticationEnsurer, (req, res, next) => {
  Recommendation.findOne({
    where: {
      recommendId: req.params.recommendId,
      createdBy: req.user.id
    }
  }).then((r) => {
    const introduction = r.introduction;
    const buttonFlag1 = 1; // bootstrap navbar にボタンを表示させる条件だけに使う
    const buttonFlag2 = 1; // bootstrap navbar にボタンを表示させる条件だけに使う

    res.render('bookedit', {
      user: req.user,
      categoryId: req.params.categoryId,
      categoryName: req.params.cName,
      recommendId: req.params.recommendId,
      bookName: req.params.bookName,
      introduction: introduction,
      buttonFlag1: buttonFlag1,
      buttonFlag2: buttonFlag2
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
  // 既存カテゴリに本を登録する場合と新規カテゴリで本を登録する場合の切り分け
  if (req.body.categoryName == null) {    // categoryNameをpostしていない場合は　既存カテゴリ
    // 既存カテゴリに本を登録する場合と登録後の変更の場合の切り分け(変更時は主キーのrecommendId をpostしている)
    if (req.body.recommendId == null) {

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

    } else {
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
          const buttonFlag1 = 1;

          res.render('bookshelf', {
            user: req.user,
            categoryId: cId,
            cName: cName,
            cCreatedBy: cCreatedBy,
            bookNamesMap: bookNamesMap,
            buttonFlag1: buttonFlag1
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
      const buttonFlag1 = 1; // bootstrap navbar にボタンを表示させる条件だけに使う
      const buttonFlag2 = 1; // bootstrap navbar にボタンを表示させる条件だけに使う
      
      res.render('book', {
        user: req.user,
        categoryId: req.params.categoryId,
        cName: cName,
        buttonFlag1: buttonFlag1,
        buttonFlag2: buttonFlag2
      });
    });
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

              if (rc === null) {
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
            const userId = parseInt(req.user.id); // 文字列を数値に変換
            let myComment = bookCommentsMap.get(userId);
            if (myComment == null) {
              myComment = "";
            }
            const buttonFlag1 = 1; // bootstrap navbar にボタンを表示させる条件だけに使う
            const buttonFlag2 = 1; // bootstrap navbar にボタンを表示させる条件だけに使う

            res.render('recommendation', {          // recommendation.pugに対し
              user: req.user,
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
              myComment: myComment,　　// promptの初期値に表示するログインユーザーのコメント
              buttonFlag1: buttonFlag1,
              buttonFlag2: buttonFlag2
            });

          } else {
            const err = new Error('指定したカテゴリにおすすめの本は見つかりません');
            err.status = 404;
            next(err);
          }
        })
    });

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