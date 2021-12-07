'use strict';
const request = require('supertest');
const app = require('../app');
const passportStub = require('passport-stub');
const User = require('../models/user');
const Category = require('../models/category');
const Recommendation = require('../models/recommendation');
const Comment = require('../models/comment');

describe('/login', () => {
    beforeAll(() => {
        passportStub.install(app);
        passportStub.login({ username: 'testuser' });
    });
 
   afterAll(() => {
     passportStub.logout();
     passportStub.uninstall(app);
   });
 
  test('ログインのためのリンクが含まれる', () => {
    return request(app)
      .get('/login')
      .expect('Content-Type', 'text/html; charset=utf-8')
      .expect(/<a href="\/auth\/github"/)
      .expect(200);
  });

  test('ログイン時はユーザー名が表示される', () => {
    return request(app)
      .get('/login')
      .expect(/testuser/)
      .expect(200);
  });
});

describe('/recommendations', () => {
  beforeAll(() => {
    passportStub.install(app);
    passportStub.login({ id: 0, username: 'testuser' });
  });

  afterAll(() => {
    passportStub.logout();
    passportStub.uninstall(app);
  });

  test('カテゴリの登録ができ、表示される', done => {
    User.upsert({ userId: 0, username: 'testuser' }).then(() => {
      request(app)
        .post('/recommendations')
        .send({
          categoryName: 'テストカテゴリ1',
          bookName: 'テスト書籍名1',
          comment: 'テストコメント1\r\nテストコメント2\r\nテストコメント3'
        })
        .expect('Location', /recommendations/)
        .expect(302)
        .end((err, res) => {
          const createdRecommendationPath = res.headers.location;
          request(app)
            .get(createdRecommendationPath)
            // TODO 作成された予定と候補が表示されていることをテストする

            .expect(/テストカテゴリ1/)
            .expect(/テスト書籍名1/)
            .expect(/テストコメント1/)
            .expect(/テストコメント2/)
            .expect(/テストコメント3/)
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);
              // テストで作成したデータを削除
              const categoryId = createdRecommendationPath.split('/recommendations/')[1];
              Comment.findAll({
                where: { categoryId: categoryId }
              }).then(categories => {
                const promises = categories.map(c => {
                  return c.destroy();
                });
                Promise.all(promises).then(() => {
                  Recommendation.findAll({
                    where: { categoryId: categoryId }
                  }).then((recommendations) => {
                    const promises = recommendations.map(r => {
                      return r.destroy();
                    });
                  });
                  Promise.all(promises).then(() => {
                    Category.findByPk(categoryId).then(c => {
                      c.destroy().then(() => {
                        if (err) return done(err);
                        done();
                      });
                    });
                  });                 
                });
              });
            });
        });
    });
  });
});