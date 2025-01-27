import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import puppeteer from 'puppeteer';

import Business  from '../models/business.model';
import User from '../models/user.model';
import Transaction from '../models/transaction.model';

import { successMessageHandler, messageHandler, errorHandler,socketEventEmitter } from '../utils/util';

interface SavedTransaction {
  _id: string;
  items: any[];
  transDate: string;
  executor: string;
  totalCostPrice: number;
  generalDiscount: number;
  payedAmount: number;
  change: number;
  paymentMethod: string;
}

interface Item {
  _doc: any;
}

interface InvoiceData {
  businessName: string;
  transactionId: string;
  userName: string;
  transDate: string;
  items: any[];
  generalDiscount: number;
  payedAmount: number;
  grandTotal: number;
  change: number;
  curr: string;
}

// Function to generate the invoice
const generateInvoice = async (socket: any, savedTransaction: SavedTransaction): Promise<void> => {
    fillInvoiceTemplate(socket, savedTransaction);
};

Handlebars.registerHelper('eq', (arg1: any, arg2: any) => arg1 === arg2);

// Function that fills the invoice template
const fillInvoiceTemplate = async (socket: any, savedTransaction: SavedTransaction): Promise<void> => {
    try {
        const { _id, items, transDate, executor, totalCostPrice, generalDiscount, payedAmount, change} = savedTransaction;
        const business = await Business.find({});
        const user = await User.findById(executor);

        if(!user) {
            return errorHandler(socket, 'User not found during invoice generation')
        }
        const {firstName, lastName} = user

        const { businessName, currency } = business[0] 

        const itemList = items.map((item: Item) => ({ ...item._doc }));

        const data: InvoiceData = {
            businessName,
            transactionId: _id,
            userName: firstName + ' ' + lastName,
            transDate,
            items: itemList,
            generalDiscount,
            payedAmount,
            grandTotal: totalCostPrice,
            change,
            curr: currency,
        };

        const templatePath = path.join(__dirname, './docs/invoice.html');
        const templateSource = fs.readFileSync(templatePath, 'utf-8');

        const template = Handlebars.compile(templateSource);

        const renderedHTML = template(data);

        generateInvoicePDF(socket, renderedHTML, _id);
    } catch (err) {
        throw new Error(`Invoice Error: ${err}`);
    }
};

// Function that generates the PDF for the invoice
const generateInvoicePDF = async (socket: any, renderedHTML: string, transactionId: string): Promise<void> => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.setContent(renderedHTML);
        const invoiceName = invoiceNameGenerator(transactionId);

        const pdfPath = path.join(__dirname, `../public/documents/${invoiceName}.pdf`);

        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true,
        });

        await browser.close();

        attachInvoiceToTransaction(invoiceName, transactionId);
        successMessageHandler(socket, `Invoice PDF generated and saved successfully. Ready for printing or emailing.`);
        messageHandler(socket, 'invoice-name', invoiceName);
        socketEventEmitter(socket, 'invoice-ready');
    } catch (err) {
        throw new Error(`Invoice Error: ${err}`);
    }
};

// Function that saves the invoice path to the invoiceURL of the transaction
const attachInvoiceToTransaction = async (invoiceName: string, transactionId: string): Promise<void> => {
    try {
        await Transaction.findByIdAndUpdate(transactionId, { invoiceUrl: `${invoiceName}.pdf` }, { new: true });
    } catch (err) {
        throw new Error(`Invoice attachment Error: ${err}`);
    }
};

// Function that generates the invoice name string
const invoiceNameGenerator = (transactionId: string): string => {
    const date = Date.now();
    return `invoice-${transactionId}-${date}`;
};

export { generateInvoice };
