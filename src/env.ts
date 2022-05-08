import { config } from 'dotenv';

config();

// DB
export const databaseName = process.env.DB_NAME;
export const databaseUsername = process.env.DB_USER;
export const databasePort = process.env.DB_PORT;
export const databasePassword = process.env.DB_PASS;
export const databaseHost = process.env.DB_HOST;

// Provider urls
export const bscProviderUrl = process.env.BSC_PROVIDER_URL;

// Contract addresses
export const bscContractAddress = process.env.BSC_CONTRACT_ADDRESS;

// Push notifications
export const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
export const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// JWT
export const jwtSecret = process.env.JWT_SECRET;
