import { Sequelize, DataTypes, Model, ModelStatic, UpdateOptions } from 'sequelize';

export default class Sale {
  model: ModelStatic<Model<any, any>>;

  constructor(sequelize: Sequelize) {
    this.model = sequelize.define('Sale', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      marketId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      creator: {
        type: DataTypes.STRING,
        allowNull: false
      },
      collectionId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      tokenId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false
      },
      price: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      timeStamp: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('ON_GOING', 'FINALIZED', 'CANCELLED'),
        allowNull: false,
        validate: {
          is: ['ON_GOING', 'FINALIZED', 'CANCELLED']
        }
      },
      network: {
        type: DataTypes.STRING,
        allowNull: false
      }
    });
  }

  addSaleItem(body: any): Promise<Model<any, any>> {
    return new Promise((resolve, reject) => {
      this.model.create(body).then(resolve).catch(reject);
    });
  }

  findAll(): Promise<Array<Model<any, any>>> {
    return new Promise((resolve, reject) => {
      this.model.findAll().then(resolve).catch(reject);
    });
  }

  updateSaleItem(update: any, opts: UpdateOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      this.model
        .update(update, opts)
        .then(([affected]) => resolve(affected))
        .catch(reject);
    });
  }
}
