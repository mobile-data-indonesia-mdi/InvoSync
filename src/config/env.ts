const env = {
    APP_PORT: process.env.APP_PORT || 3000,
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_NAME: process.env.DB_NAME ||'your-database-name',
    DB_USER: process.env.DB_USER ||'your-db-user',
    DB_PASSWORD: process.env.DB_PASSWORD ||'your-db-password',
    DB_PORT: process.env.DB_PORT || 5432,
}

export default env;