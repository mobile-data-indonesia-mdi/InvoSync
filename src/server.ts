import express from 'express';
import cookieParser from 'cookie-parser';

import userRoute from '@routes/user.route';

const app = express();
const port = 8080;

app.use(cookieParser());
app.use(express.json());

app.use('/user', userRoute);

app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
