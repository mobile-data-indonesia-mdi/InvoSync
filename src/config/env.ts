const env = {
  APP_PORT: process.env.APP_PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/mydb',
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET_ACCESS: process.env.JWT_SECRET_ACCESS || 'mysecretaccess',
  JWT_SECRET_REFRESH: process.env.JWT_SECRET_REFRESH || 'mysecretrefresh',
  JWT_SECRET_ACCESS_LIFETIME: process.env.JWT_SECRET_ACCESS_LIFETIME || '1h',
  JWT_SECRET_REFRESH_LIFETIME: process.env.JWT_SECRET_REFRESH_LIFETIME || '7d',
};

export default env;
