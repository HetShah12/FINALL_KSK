// backend/src/models/ProductVariant.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => { // This function is what `require(...)()` calls
  class ProductVariant extends Model {
    static associate(models) {
      // Define associations here
      // For example, if a CartItem belongs to a ProductVariant:
      // ProductVariant.hasMany(models.CartItem, { foreignKey: 'productVariantId', as: 'cartItems' });
    }
  }
  ProductVariant.init({
    // id is automatically created by Sequelize as primaryKey if not specified like this
    // but explicitly defining it is also fine.
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    productType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'T-Shirt'
    },
    size: {
      type: DataTypes.STRING,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false
    },
    thickness: { // GSM value
      type: DataTypes.INTEGER,
      allowNull: false
    },
    thicknessName: {
      type: DataTypes.STRING
    },
    basePrice: {
      type: DataTypes.FLOAT,
      allowNull: false
    }
    // createdAt and updatedAt are added by default by Sequelize if timestamps are not false
  }, {
    sequelize,
    modelName: 'ProductVariant',
    // tableName: 'ProductVariants', // Optional: explicitly define table name
    // timestamps: true, // Default is true
  });
  return ProductVariant; // Crucially, return the defined model
};