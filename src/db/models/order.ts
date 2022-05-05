import { Sequelize, DataTypes, Model, ModelStatic } from 'sequelize';

export default class Order {
  model: ModelStatic<Model<any, any>>;

  constructor(sequelize: Sequelize) {
    this.model = sequelize.define('Order', {
      orderId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
      },
      to: {
        type: DataTypes.STRING,
        allowNull: false
      },
      tokenId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      bidCurrency: {
        type: DataTypes.STRING,
        allowNull: false
      },
      amount: {
        type: DataTypes.STRING,
        allowNull: false
      },
      collection: {
        type: DataTypes.STRING,
        allowNull: false
      },
      creator: {
        type: DataTypes.STRING,
        allowNull: false
      }
    });
  }
}
