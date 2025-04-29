import { prisma } from '@config/db';
import { type ClientRequest } from '@models/client.model';

export const getAllClientService = async () => {
  try {
    const clients = await prisma.client.findMany();

    return clients;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    throw new Error(errorMessage);
  }
};

export const createClientService = async (clientData: ClientRequest) => {
  try {
    const client = await prisma.client.create({
      data: clientData,
    });

    return client;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    throw new Error(errorMessage);
  }
};

export const getClientByIdService = async (client_id: string) => {
  try {
    const client = await prisma.client.findUnique({
      where: {
        client_id,
      },
    });

    return client;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    throw new Error(errorMessage);
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
      // throw new AppError('Data not found', 404);
    }

    const updatedClient = await prisma.client.update({
      where: {
        client_id,
      },
      data: clientData,
    });

    return updatedClient;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    throw new Error(errorMessage);
  }
};

export const deleteClientByIdService = async (client_id: string) => {
  try {
    const client = await prisma.client.findUnique({
      where: {
        client_id,
      },
    });

    if (!client) {
      throw new Error('Data not found');
    }

    await prisma.client.delete({
      where: {
        client_id,
      },
    });

    return { message: 'Client deleted successfully' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    throw new Error(errorMessage);
  }
};
