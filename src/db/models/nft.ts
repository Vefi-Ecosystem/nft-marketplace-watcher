import { Sequelize, DataTypes, Model, ModelStatic } from 'sequelize';

export default class NFT {
  model: ModelStatic<Model<any, any>>;

  constructor(sequelize: Sequelize) {
    this.model = sequelize.define('NFT', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tokenId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      tokenURI: {
        type: DataTypes.STRING,
        allowNull: false
      },
      collectionId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      timeStamp: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      network: {
        type: DataTypes.STRING,
        allowNull: false
      },
      owner: {
        type: DataTypes.STRING,
        allowNull: false
      }
    });
  }

  saveNFT(body: any): Promise<Model<any, any>> {
    return new Promise((resolve, reject) => {
      this.model.create(body).then(resolve).catch(reject);
    });
  }

  findAll(): Promise<Array<Model<any, any>>> {
    return new Promise((resolve, reject) => {
      this.model.findAll().then(resolve).catch(reject);
    });
  }
}
