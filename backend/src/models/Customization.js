// backend/src/models/Customization.js
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Customization extends Model {
    static associate(models) {
      // This model might be associated from CartItem, not directly here,
      // or you could define a less direct association if needed.
    }
  }
  Customization.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    src: {
      type: DataTypes.TEXT // Can be long for base64 data URLs or paths
    },
    prompt: {
      type: DataTypes.TEXT
    },
    text: {
      type: DataTypes.STRING
    },
    font: {
      type: DataTypes.STRING
    },
    textColor: { // Changed from 'color' to avoid conflict with a potential 'color' attribute of a design itself
      type: DataTypes.STRING
    },
    designName: {
      type: DataTypes.STRING
    },
    designCategory: {
        type: DataTypes.STRING
    },
    cost: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    positionData: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('positionData');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('positionData', value ? JSON.stringify(value) : null);
      }
    },
    serverFilePath: { // For images uploaded and stored on the server
        type: DataTypes.STRING
    },
    originalFileName: {
        type: DataTypes.STRING
    },
    mimeType: {
        type: DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'Customization',
    // tableName: 'Customizations',
  });
  return Customization;
};