import { config } from 'dotenv';

config();

export const providerUrl = process.env.PROVIDER_URL;
export const contractAddress = process.env.CONTRACT_ADDRESS;
