import { Sequelize } from 'sequelize';
import { buildModels } from './models';

export const sequelize = new Sequelize();

export const models = buildModels(sequelize);
