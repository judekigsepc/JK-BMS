import { Socket } from 'socket.io';
import Transaction from "../models/transaction.model";
import { timeSetter, errorHandler, messageHandler, successMessageHandler } from '../utils/util';
import { validateIfNumber, validateMultipleStrings, validateMultipleNumbers } from "../utils/validationUtils";
import { generateInvoice } from "./docActions";
import { clearCart, inventoryUpdate } from './cartInventoryManager';
import { refundHandler } from './refundHandler';
import { Cart,PayDetails,PaymentData } from '../types';

// Type definitions for expected data


const paymentFunc = (socket: Socket, cart: Cart, payDetails: PayDetails, payment: number): void => {
  try {
    validateIfNumber(payment, 'Payment Error: Payment value not present or Invalid (Should be number)');
  } catch (err) {
    if(err instanceof Error) {
      return errorHandler(socket, err.message);
    }
  }

  const { cartTotal } = cart;
  let change = payment - cartTotal;

  payDetails.expenditure = cartTotal;
  payDetails.payed = payment;
  payDetails.change = change;
  socket.emit('pay_result', payDetails);
};

const confirmPaymentFunc = async (socket: Socket, cart: Cart, payDetails: PayDetails, data: PaymentData): Promise<void> => {
  const { type, notes, executor } = data;
  const { expenditure, payed, change } = payDetails;

  try {
    messageHandler(socket, 'task', 'Processing transaction');

    const error = 'Transaction Error: Payment Confirmation error: Payment details or confirmation info may be missing or invalid';
    validateMultipleStrings([type, notes, executor], error);
    validateMultipleNumbers([expenditure, payed, change], error);

    // Checking if the money paid is enough to cover the expenditure
    if (change < 0) {
      return errorHandler(socket, 'Paid amount is not enough to cover expenditure');
    }
  } catch (err) {
    if(err instanceof Error) {
      return errorHandler(socket, err.message);
    }
  }

  try {
    // Handling vital info presence check
    if (!type || !notes || !executor || !expenditure || !payed) {
      return errorHandler(socket, 'Transaction Error: Payment Confirmation error: Payment details or confirmation info may be missing or invalid');
    }

    // Handling refund if the type is 'refund'
    if (type === 'refund') {
      const savedTransaction = await transactionSaver(socket, cart, payDetails, data);
      return refundHandler(socket, savedTransaction);
    }

    // Handling normal transaction saving
    await transactionSaver(socket, cart, payDetails, data, 'exec');
  } catch (err) {
    if(err instanceof Error) {
      return errorHandler(socket, err.message);
    }
  }
};

const transactionSaver = async (socket: Socket, cart: Cart, payDetails: PayDetails, data: PaymentData, exec?: string): Promise<any> => {
  const { type, notes, executor } = data;
  const { expenditure, payed, change } = payDetails;
  const { cartProducts, cartGeneralDiscount } = cart;

  const itemsArray = cartProducts.map(product => ({
    itemId: product.id,
    name: product.name,
    itemQty: product.qty,
    unitPrice: product.price,
    discount: `${product.discount}`,
    discountType: product.discountType,
    subTotal: product.subTotal
  }));

  // Constructing transaction object
  const transaction = {
    executor: executor,
    items: itemsArray,
    transDate: await timeSetter(),
    generalDiscount: cartGeneralDiscount,
    totalCostPrice: expenditure,
    payedAmount: payed,
    change: change,
    paymentMethod: 'Cash',
    paymentStatus: 'Completed',
    type: type,
    notes: notes,
  };

  // Saving transaction to the database
  const savedTransaction = await Transaction.create(transaction);
  successMessageHandler(socket, 'Transaction processed successfully. Post processing...');

  // Post processing (if execution flag is set)
  if (exec) {
    return transactionPostProcesser(socket, cart, savedTransaction, payDetails);
  }
  return savedTransaction;
};

const transactionPostProcesser = async (socket: Socket, cart: Cart, savedTransaction: any, payDetails: PayDetails): Promise<void> => {
  try {
    await Promise.all([
      inventoryUpdate(socket, savedTransaction),
      generateInvoice(socket, savedTransaction),
      clearCart(socket, cart, payDetails)
    ]);
  } catch (err) {
    if(err instanceof Error) {
      return errorHandler(socket, err.message);
    }
  }
};

export { paymentFunc, confirmPaymentFunc };
