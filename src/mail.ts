import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { userEmail, clientId, clientSecret, refreshToken } from './env';

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

oauth2Client.setCredentials({
  refresh_token: refreshToken
});

export default async () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      type: 'OAuth2',
      user: userEmail,
      clientId,
      clientSecret,
      refreshToken,
      accessToken: (await oauth2Client.getAccessToken()).token
    }
  } as any);
