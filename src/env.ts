import { config } from 'dotenv';

config();

// DB
export const databaseName = process.env.DB_NAME;
export const databaseUsername = process.env.DB_USER;
export const databasePort = process.env.DB_PORT;
export const databasePassword = process.env.DB_PASS;
export const databaseHost = process.env.DB_HOST;

// Provider urls
// export const bscProviderUrl = process.env.BSC_PROVIDER_URL;
// export const polygonProviderUrl = process.env.POLYGON_PROVIDER_URL;
// export const ethereumProviderUrl = process.env.ETHEREUM_PROVIDER_URL;
// export const bitgertProviderUrl = process.env.BITGERT_PROVIDER_URL;

// Contract addresses
// export const bscContractAddress = process.env.BSC_CONTRACT_ADDRESS;
// export const polygonContractAddress = process.env.POLYGON_CONTRACT_ADDRESS;
// export const ethereumContractAddress = process.env.ETHEREUM_CONTRACT_ADDRESS;
// export const bitgertContractAddress = process.env.BITGERT_CONTRACT_ADDRESS;

// Push notifications
export const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
export const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// JWT
export const jwtSecret = process.env.JWT_SECRET;

// Verifer address
export const verifierAddress = process.env.VERIFIER_ADDRESS;

// Email credentials
export const userEmail = process.env.USER_EMAIL;
export const clientId = process.env.CLIENT_ID;
export const clientSecret = process.env.CLIENT_SECRET;
export const refreshToken = process.env.REFRESH_TOKEN;
