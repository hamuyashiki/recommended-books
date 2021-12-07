'use strict';
const {Sequelize, DataTypes} = require('sequelize');
const sequelize = new Sequelize(
  'postgres://postgres:postgres@db/recommended_books'
);

module.exports = {
  sequelize,
  DataTypes
};