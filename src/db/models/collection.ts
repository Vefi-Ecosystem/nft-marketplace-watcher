import { Sequelize, DataTypes, ModelStatic, Model } from 'sequelize';

export default class Collection {
  model: ModelStatic<Model<any, any>>;

  constructor(sequelize: Sequelize) {
    this.model = sequelize.define('Collection', {
      collectionId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
      },
      timeStamp: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      collectionName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      collectionCategory: {
        type: DataTypes.STRING,
        allowNull: false
      },
      collectionSymbol: {
        type: DataTypes.STRING,
        allowNull: false
      },
      collectionOwner: {
        type: DataTypes.STRING,
        allowNull: false
      },
      collectionImage: {
        type: DataTypes.STRING
      }
    });
  }

  addCollection(body: any): Promise<Model<any, any>> {
    return new Promise((resolve, reject) => {
      this.model.create(body).then(resolve).catch(reject);
    });
  }

  findById(collectionId: string): Promise<Model<any, any> | null> {
    return new Promise((resolve, reject) => {
      this.model.findByPk(collectionId).then(resolve).catch(reject);
    });
  }

  findAll(): Promise<Array<Model<any, any>>> {
    return new Promise((resolve, reject) => {
      this.model.findAll().then(resolve).catch(reject);
    });
  }
}
