import { Sequelize, DataTypes, Model, ModelStatic, UpdateOptions } from 'sequelize';

export default class Account {
  model: ModelStatic<Model<any, any>>;

  constructor(sequelize: Sequelize) {
    this.model = sequelize.define('Account', {
      accountId: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: { msg: 'Valid email required' } } },
      imageURI: DataTypes.STRING
    });
  }

  addAccount(body: any): Promise<Model<any, any>> {
    return new Promise((resolve, reject) => {
      this.model.create(body).then(resolve).catch(reject);
    });
  }

  findAll(): Promise<Array<Model<any, any>>> {
    return new Promise((resolve, reject) => {
      this.model.findAll().then(resolve).catch(reject);
    });
  }

  updateAccount(update: any, opts: UpdateOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      this.model
        .update(update, opts)
        .then(([affected]) => resolve(affected))
        .catch(reject);
    });
  }
}
