import { Socket } from 'socket.io';
import { paymentFunc, confirmPaymentFunc } from './paymentActions';
import { printInvoice, emailInvoice } from './invoiceActions';
import { clearCart } from './cartInventoryManager';
import { holdSale, resumeHeldSale } from './saleHoldActions';
import { addToCart, updateInCart, deleteInCart, discountCart } from './cartActions';
import { calculateCollection } from './collectionActions';
import { successMessageHandler } from '../utils/util';
import { Cart, AddToCartData, PaymentData } from '../types';


interface PayDetails {
  expenditure: number;
  payed: number;
  change: number;
}

const cartSocketListeners = async (socket: Socket) => {
  const cart: Cart = {
    cartProducts: [],
    cartTotal: 0,
    cartGeneralDiscount: 0,
  };

  const payDetails: PayDetails = {
    expenditure: Number(cart.cartTotal),
    payed: 0,
    change: 0,
  };

  socket.on('get_full_cart', () => {
    socket.emit('full_cart_result', cart);
    successMessageHandler(socket, 'Loaded full cart');
  });

  socket.on('add_to_cart', async (data: AddToCartData) => {
    await addToCart(socket, cart, data);
    paymentFunc(socket, cart, payDetails, payDetails.payed);
  });

  socket.on('update_qty', async (data: { prodIndex: number; qty: number }) => {
    await updateInCart(socket, cart, data);
    paymentFunc(socket, cart, payDetails, payDetails.payed);
  });

  socket.on('delete_from_cart', (prodIndex: number) => {
    deleteInCart(socket, cart, prodIndex);
    paymentFunc(socket, cart, payDetails, payDetails.payed);
  });

  socket.on('discount_cart', (data: { discount: number, type:string }) => {
    discountCart(socket, cart, data);
    paymentFunc(socket, cart, payDetails, payDetails.payed);
  });

  socket.on('payment', (amount: number) => {
    paymentFunc(socket, cart, payDetails, amount);
  });

  socket.on('confirm_payment', (data:PaymentData) => {
    confirmPaymentFunc(socket, cart, payDetails, data);
  });

  socket.on('print-invoice', (invoiceName: string) => {
    printInvoice(socket, invoiceName);
  });

  socket.on('email-invoice', (invoiceName: string, reEmail: string) => {
    emailInvoice(socket, {invoiceName, reEmail});
  });

  socket.on('cart-cleanup', () => {
    clearCart(socket, cart, payDetails);
  });

  socket.on('hold-sale', (data) => {
    holdSale(socket, cart, data);
  });

  socket.on('resume-sale', (saleId: string) => {
    resumeHeldSale(socket, cart, saleId);
  });

  socket.on('calculate-collection', (data: any) => {
    calculateCollection(socket, data);
  });
};

export default cartSocketListeners;
