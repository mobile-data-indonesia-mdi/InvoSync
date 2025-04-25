// import { prisma } from '@config/db';

// import { type InvoiceDetailRequest } from '@models/invoiceDetail.model';

// export const createInvoiceDetailService = async (invoiceDetailData: InvoiceDetailRequest) => {
//   try {
//     const invoiceDetail = await prisma.invoiceDetail.create({
//       data: invoiceDetailData,
//     });

//     return invoiceDetail;
//   } catch (error) {
//     console.error('Error creating invoice detail:', error);
//     const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
//     throw new Error(errorMessage);
//   }
// }
