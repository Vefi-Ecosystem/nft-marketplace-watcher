import { Sequelize } from 'sequelize';
import { buildModels } from './models';
import { databaseName, databasePassword, databasePort, databaseUsername, databaseHost } from '../env';

export const sequelize = new Sequelize({
  database: databaseName,
  host: databaseHost,
  password: databasePassword,
  username: databaseUsername,
  port: parseInt(databasePort || '5432'),
  dialect: 'postgres',
  define: {
    underscored: true
  },
  sync: {
    force: false
  }
});

export const models = buildModels(sequelize);
