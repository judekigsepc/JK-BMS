import dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';
import { print } from 'pdf-to-printer';
import { messageHandler, successMessageHandler, errorHandler } from '../utils/util';
import { validateIfEmail, validateIfString } from '../utils/validationUtils';

dotenv.config();

interface EmailInvoiceData {
  invoiceName: string;
  reEmail: string;
}

const printInvoice = async (socket: any, invoiceName: string): Promise<void> => {
  try {
    validateIfString(invoiceName, 'Print Error: Invoice name not present or Invalid (Should be string)');
  } catch (err) {
    if(err instanceof Error) {
      return errorHandler(socket, err.message);
    }
  }

  try {
    const pdfPath = path.join(__dirname, `../public/documents/${invoiceName}.pdf`);
    messageHandler(socket, 'task', 'Printing pdf');
    await print(pdfPath);
    successMessageHandler(socket, 'Invoice printed successfully');
  } catch (err) {
    if(err instanceof Error) {
      return errorHandler(socket, err.message);
    }
  }
};

const emailInvoice = async (socket: any, { invoiceName, reEmail }: EmailInvoiceData): Promise<void> => {
  try {
    validateIfEmail(reEmail, 'Email Error: Email Address Invalid or missing');
    validateIfString(invoiceName, 'Email error: Invoice name not present or Invalid (Should be string)');
  } catch (err) {
    if(err instanceof Error) {
      return errorHandler(socket, err.message);
    }
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'kiggundujude120@gmail.com',
      pass: process.env.GOOGLE_PASSKEY || '',
    },
  });

  const mailOptions = {
    from: 'kiggundujude120@gmail.com',
    to: reEmail,
    subject: 'INVOICE',
    text: 'JK TECH SOLUTIONS PURCHASE INVOICE',
    attachments: [
      {
        filename: `${invoiceName}.pdf`,
        path: path.join(__dirname, `../public/documents/${invoiceName}.pdf`),
      },
    ],
  };

  try {
    messageHandler(socket, 'task', `sending email to ${reEmail}`);
    const info = await transporter.sendMail(mailOptions);
    successMessageHandler(socket, `Email sent: ${info.response}`);
  } catch (err) {
    errorHandler(socket, `Email error: ${err}`);
  }
};

export { printInvoice, emailInvoice };
