import { Sequelize, DataTypes, Model, ModelStatic } from 'sequelize';

export default class NFT {
  model: ModelStatic<Model<any, any>>;

  constructor(sequelize: Sequelize) {
    this.model = sequelize.define('NFT', {
      tokenId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      tokenURI: {
        type: DataTypes.STRING,
        allowNull: false
      },
      collectionId: {
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
}
