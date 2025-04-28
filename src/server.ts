import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import userRoute from '@routes/user.route';
import clientRoute from '@routes/client.route';
import invoiceRoute from '@routes/invoice.route';
import paymentRoute from '@routes/payment.route';
import env from '@config/env';
import corsOptions from '@config/cors';
import { swaggerSpec } from '@config/swagger';

const app = express();

app.use(cors(corsOptions));
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

app.use('/user', userRoute);
app.use('/client', clientRoute);
app.use('/invoice', invoiceRoute);
app.use('/payment', paymentRoute);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
