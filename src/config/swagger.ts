import swaggerJSDoc from 'swagger-jsdoc';
import env from '@config/env';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'InvoSync REST API',
      version: '1.0.0',
      description: 'Invoicing Backend',
    },
    servers: [
      {
        url: `http://localhost:${env.APP_PORT}`, // ganti sesuai environment
      },
    ],
  },
  apis: ['./src/**/*.ts'], // lokasi file yang mau discan JSDoc-nya
};

export const swaggerSpec = swaggerJSDoc(options);
