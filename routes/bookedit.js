'use strict';
const express = require('express');
const router = express.Router();
const authenticationEnsurer = require('./authentication-ensurer');
const Comment = require('../models/comment');

const Recommendation = require('../models/recommendation');

const updatedAt = new Date();

router.post('/recommendations/edit', authenticationEnsurer,
    (req, res, next) => {
        Recommendation.update({
            bookName: req.body.bookName,
            updatedAt: updatedAt,
            introducion: req.body.introduction.slice(0, 255)
        },
            {
                where: { recommendId: req.body.recommendId }
            }
        )
        res.redirect(`/recommendations/${req.body.categoryId}/${req.body.bookName}`)
    }
);
module.exports = router;