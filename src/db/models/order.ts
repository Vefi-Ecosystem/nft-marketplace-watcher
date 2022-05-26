import { Sequelize, DataTypes, Model, ModelStatic, UpdateOptions } from 'sequelize';

export default class Order {
  model: ModelStatic<Model<any, any>>;

  constructor(sequelize: Sequelize) {
    this.model = sequelize.define('Order', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      orderId: {
        type: DataTypes.STRING,
        allowNull: false
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
      },
      status: {
        type: DataTypes.ENUM('STARTED', 'ACCEPTED', 'CANCELLED', 'REJECTED'),
        allowNull: false,
        validate: {
          isIn: [['STARTED', 'ACCEPTED', 'CANCELLED', 'REJECTED']]
        }
      },
      network: {
        type: DataTypes.STRING,
        allowNull: false
      },
      timeStamp: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    });
  }

  addOrder(body: any): Promise<Model<any, any>> {
    return new Promise((resolve, reject) => {
      this.model.create(body).then(resolve).catch(reject);
    });
  }

  findAll(): Promise<Array<Model<any, any>>> {
    return new Promise((resolve, reject) => {
      this.model.findAll().then(resolve).catch(reject);
    });
  }

  updateOrderItem(update: any, opts: UpdateOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      this.model
        .update(update, opts)
        .then(([affected]) => resolve(affected))
        .catch(reject);
    });
  }
}
