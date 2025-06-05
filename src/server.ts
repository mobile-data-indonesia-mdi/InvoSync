import app from '@app';
import env from '@config/env';

app.listen(env.APP_PORT, () => {
  console.log(`Listening on port ${env.APP_PORT}...`);
});
