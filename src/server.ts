import express from 'express';
import cookieParser from 'cookie-parser';

import userRoute from '@routes/user.route';
import clientRoute from '@routes/client.route';
import env from '@config/env';

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use('/user', userRoute);
app.use('/client', clientRoute);

app.use((_req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
  });
  return;
});

app.listen(env.APP_PORT, () => {
  console.log(`Listening on port ${env.APP_PORT}...`);
});
