import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import userRoute from '@routes/user.route';
import clientRoute from '@routes/client.route';
import invoiceRoute from '@routes/invoice.route';
import paymentRoute from '@routes/payment.route';

import corsOptions from '@config/cors';
import { swaggerSpec } from '@config/swagger';
import responseHelper from '@utils/responseHelper';
import log from '@utils/logs';

const app = express();

app.use(cors(corsOptions));
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

app.use('/users', userRoute);
app.use('/clients', clientRoute);
app.use('/invoices', invoiceRoute);
app.use('/payments', paymentRoute);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(async (req, res) => {
  await log(req, 'ERROR', 'Route not found');
  responseHelper(res, 'error', 404, 'Route not found', null);
  return;
});

export default app;
