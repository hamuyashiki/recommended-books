'use strict';
const { sequelize, DataTypes } = require('./sequelize-loader');

const Recommendation = sequelize.define(
    'recommendations',
    {
        recommendId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        bookName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false
        },
        introduction: {
            type: DataTypes.STRING,
            allowNull: false
        }
    },
    {
        freezeTableName: true,
        timestamps: false,
        indexes: [
            {
              fields: ['categoryId']
            }
          ]
    }
);

module.exports = Recommendation;