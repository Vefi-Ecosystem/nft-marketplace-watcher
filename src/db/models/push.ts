import { Sequelize, DataTypes, Model, ModelStatic, UpdateOptions, DestroyOptions } from 'sequelize';

export default class PushSubscription {
  model: ModelStatic<Model<any, any>>;

  constructor(sequelize: Sequelize) {
    this.model = sequelize.define('PushSubscription', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      endpoint: { type: DataTypes.STRING, allowNull: false },
      keys: { type: DataTypes.JSON, allowNull: false },
      accountId: { type: DataTypes.STRING, allowNull: false }
    });
  }

  addPushSubscription(body: any): Promise<Model<any, any>> {
    return new Promise((resolve, reject) => {
      this.model.create(body).then(resolve).catch(reject);
    });
  }

  findAllPushSubscriptions(): Promise<Array<Model<any, any>>> {
    return new Promise((resolve, reject) => {
      this.model.findAll().then(resolve).catch(reject);
    });
  }

  updatePushSubscription(update: any, opts: UpdateOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      this.model
        .update(update, opts)
        .then(([affected]) => resolve(affected))
        .catch(reject);
    });
  }

  deletePushSubscription(opts?: DestroyOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      this.model.destroy(opts).then(resolve).catch(reject);
    });
  }
}
