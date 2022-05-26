import { Sequelize, DataTypes, Model, ModelStatic, DestroyOptions } from 'sequelize';

export default class Favorite {
  model: ModelStatic<Model<any, any>>;

  constructor(sequelize: Sequelize) {
    this.model = sequelize.define('Favorite', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      accountId: DataTypes.STRING,
      tokenId: DataTypes.INTEGER,
      network: DataTypes.STRING,
      collectionId: DataTypes.STRING
    });
  }

  addToFavorites(body: any): Promise<Model<any, any>> {
    return new Promise((resolve, reject) => {
      this.model.create(body).then(resolve).catch(reject);
    });
  }

  findAll(): Promise<Array<Model<any, any>>> {
    return new Promise((resolve, reject) => {
      this.model.findAll().then(resolve).catch(reject);
    });
  }

  removeFromFavorites(opts: DestroyOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      this.model.destroy(opts).then(resolve).catch(reject);
    });
  }
}
