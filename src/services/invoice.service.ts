import { prisma } from '@config/db';

import { invoiceWithDetailsRequestSchema } from '@models/invoice.model';

export const getAllInvoiceService = async () => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
      },
    });

    return invoices;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

export const getInvoiceByIdService = async (invoice_id: string) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        invoice_id,
      },
      include: {
        client: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice tidak ditemukan');
    }

    return invoice;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

export const createInvoiceService = async (invoiceData: invoiceWithDetailsRequestSchema) => {
  try {
    //kalkulasi amount dulu
    const invoiceDetailsWithAmount = invoiceData.invoice_details.map(detail => {
      const amount = detail.delivery_count * detail.price_per_delivery;
      return {
        ...detail,
        amount: amount,
      };
    });

    //menghitung sub total, tax amount, and total
    const subTotal = invoiceDetailsWithAmount.reduce((acc, detail) => {
      return acc + detail.amount;
    }, 0);

    //menghitung pajak harga
    const taxAmount = subTotal * invoiceData.tax_rate;

    //harga akhir stelah pajak
    const total = subTotal + taxAmount;

    //set default pembayaran
    const amountPaid = 0;

    //set default status
    const paymentStatus = 'unpaid';

    const createdInvoice = await prisma.$transaction(async tx => {
      const invoice = await prisma.invoice.create({
        data: {
          invoice_number: invoiceData.invoice_number,
          issue_date: invoiceData.issue_date,
          due_date: invoiceData.due_date,
          sub_total: subTotal,
          tax_rate: invoiceData.tax_rate,
          tax_amount: taxAmount,
          total: total,
          tax_invoice_number: invoiceData.tax_invoice_number,
          amount_paid: amountPaid,
          voidedAt: invoiceData.voidedAt,
          payment_status: paymentStatus,
          client_id: invoiceData.client_id,
        },
      });

      await tx.invoiceDetail.createMany({
        data: invoiceDetailsWithAmount.map(detail => ({
          ...detail,
          invoice_id: invoice.invoice_id,
        })),
      });
      console.log(invoice);
    });
    return createdInvoice;
  } catch (error) {
    console.error('Error creating invoice:', error);
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
    throw new Error(errorMessage);
  }
};

// export const updateInvoiceByIdService = async (invoice_id: string, invoiceData: InvoiceRequest) => {
//   try {
//     const invoice = await prisma.invoice.findUnique({
//       where: {
//         invoice_id,
//       },
//     });

//     if (!invoice) {
//       throw new Error('Invoice tidak ditemukan');
//     }

//     const updatedInvoice = await prisma.invoice.update({
//       where: {
//         invoice_id,
//       },
//       data: invoiceData,
//     });

//     return updatedInvoice;
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
//     throw new Error(errorMessage);
//   }
// };

// export const deleteInvoiceByIdService = async (invoice_id: string) => {
//   try {
//     const invoice = await prisma.invoice.findUnique({
//       where: {
//         invoice_id,
//       },
//     });

//     if (!invoice) {
//       throw new Error('Invoice tidak ditemukan');
//     }

//     const deletedInvoice = await prisma.invoice.delete({
//       where: {
//         invoice_id,
//       },
//     });

//     return deletedInvoice;
//   } catch (error) {
//     const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan server';
//     throw new Error(errorMessage);
//   }
// };
