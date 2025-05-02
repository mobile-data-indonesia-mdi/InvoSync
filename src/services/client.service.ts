import { prisma } from '@config/db';
import { type ClientRequest } from '@models/client.model';
import HttpError from '@utils/httpError';

export const createClientService = async (clientData: ClientRequest) => {
  try {
    const existingClient = await prisma.client.findUnique({
      where: {
        client_name: clientData.client_name,
      },
    });

    if (existingClient) {
      throw new HttpError('Client already exists', 409);
    }

    const client = await prisma.client.create({
      data: clientData,
    });

    return client;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

export const getAllClientService = async () => {
  try {
    const clients = await prisma.client.findMany();

    return clients;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

export const getClientByIdService = async (client_id: string) => {
  try {
    const client = await prisma.client.findUnique({
      where: {
        client_id,
      },
    });

    if (!client) {
      throw new HttpError('Client not found', 404);
    }

    return client;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

export const editClientByIdService = async (client_id: string, clientData: ClientRequest) => {
  try {
    const client = await prisma.client.findUnique({
      where: {
        client_id,
      },
    });

    if (!client) {
      throw new HttpError('Client not found', 404);
    }

    const updatedClient = await prisma.client.update({
      where: {
        client_id,
      },
      data: clientData,
    });

    return updatedClient;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Internal Server Error', 500);
  }
};

// export const deleteClientByIdService = async (client_id: string) => {
//   try {
//     const client = await prisma.client.findUnique({
//       where: {
//         client_id,
//       },
//     });

//     if (!client) {
//       throw new Error('Data not found');
//     }

//     await prisma.client.delete({
//       where: {
//         client_id,
//       },
//     });

//     return { message: 'Client deleted successfully' };
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : 'Internal server error';
//     throw new Error(errorMessage);
//   }
// };
