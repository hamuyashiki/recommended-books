'use strict';
const {sequelize, DataTypes} = require('./sequelize-loader');

const Comment = sequelize.define(
  'comments',
  {
    recommendId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    postedBy: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false
    }    
  },
  {
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        fields: ['recommendId']
      }
    ]
  }
);

module.exports = Comment;