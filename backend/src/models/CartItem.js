// backend/src/models/CartItem.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CartItem extends Model {
    static associate(models) {
      CartItem.belongsTo(models.ProductVariant, {
        foreignKey: {
          name: 'productVariantId', // Explicitly naming the FK column
          allowNull: false
        },
        as: 'variant'
      });
      CartItem.belongsTo(models.Customization, {
        foreignKey: {
          name: 'frontCustomizationId',
          allowNull: true // Customizations are optional
        },
        as: 'frontDesign'
      });
      CartItem.belongsTo(models.Customization, {
        foreignKey: {
          name: 'backCustomizationId',
          allowNull: true // Customizations are optional
        },
        as: 'backDesign'
      });
    }
  }
  CartItem.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    cartSessionId: { // For identifying guest carts or user carts
      type: DataTypes.STRING,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    calculatedUnitPrice: { // Price for one unit of this configured item
      type: DataTypes.FLOAT,
      allowNull: false
    },
    priceBreakdown: { // Storing how the price was calculated
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('priceBreakdown');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('priceBreakdown', value ? JSON.stringify(value) : null);
      }
    }
    // productVariantId, frontCustomizationId, backCustomizationId FKs are added by associations
  }, {
    sequelize,
    modelName: 'CartItem',
    // tableName: 'CartItems',
  });
  return CartItem;
};