import express from 'express';
import morgan from 'morgan';
import { createServer } from 'http';
import { sequelize } from './db';
import { handleEvents } from './watcher';
import chains from './chains';
import router from './api/router';
import logger from './logger';
import { initializeBridgeSocket } from './bridge';

const port: number = parseInt(process.env.PORT || '6008');
const app: express.Express = express();

app.use(express.json());
app.use(morgan('combined'));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
  next();
});

app.use('/api', router);

app.get('/', (req, res) => {
  return res.status(200).json({
    status: 'HEALTHY'
  });
});

const server = createServer(app);

server.listen(port, () => {
  logger('App is running on: %d', port);

  (() => {
    sequelize.sync().then(() => {
      logger('Sequelize connected to DB');

      for (const network of chains) {
        handleEvents(<string>network.url, <string>network.contractAddress, network.name);
        logger('Now watching smart contract on: %s', network.name);
      }

      initializeBridgeSocket(server);
    });
  })();
});
