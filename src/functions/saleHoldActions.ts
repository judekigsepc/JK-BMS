import { Socket } from 'socket.io';
import Joi from 'joi';
import { errorHandler, successMessageHandler } from "../utils/util";
import { addToCart } from "./cartActions";
import Product from "../models/product.model";
import HeldSale, { IHeldSale } from "../models/heldSale.model";
import { Cart, CartProduct,SaleData } from '../types';

const heldSaleschema = Joi.object({
  identifier: Joi.string().required(),
  executor: Joi.string().required(),
  reason: Joi.string(),
  products: Joi.array().required(),
  collections: Joi.array().required(),
});


const holdSale = async (socket: Socket, cart: Cart, data: SaleData) => {
  try {
    if (cart.cartProducts.length < 1) {
      return errorHandler(socket, 'SALE HOLD ERROR: Cart is empty');
    }

    const { identifier, executor, reason } = data;

    const saleToHold = {
      identifier,
      executor,
      reason,
      products: await handleUnStock(cart.cartProducts, 'products'),
      collections: await handleUnStock(cart.cartProducts, 'products'),
    };

    const { error } = heldSaleschema.validate(saleToHold);

    if (error) {
      return errorHandler(socket, error.details[0].message);
    }

    await HeldSale.create(saleToHold);

    successMessageHandler(socket, `Sale ${identifier} held successfully`);
    socket.emit('cart-cleanup');
  } catch (err) {
    if(err instanceof Error) {
      return errorHandler(socket, err.message);
    }
  }
};

const resumeHeldSale = async (socket: Socket, cart: Cart, saleId: string) => {
  try {
    const requestedHeldSale = await HeldSale.findById(saleId);
    if(!requestedHeldSale) {
      return errorHandler(socket, 'Requested held sale not found')
    }
    const { collections, products } = requestedHeldSale;

    products.forEach((product: any) => {
      addToCart(socket, cart, { prodId: product, qty: 9 });
    });
    collections.forEach((collection: any) => {
      addToCart(socket, cart, { prodId: collection, qty: 9 });
    });
  } catch (err: Error | unknown) {
    if(err instanceof Error) {
      errorHandler(socket, err.message);
    }
  }
};

const handleUnStock = async (products: CartProduct[], type: string) => {
  try {
    if (type === 'products') {
      const productPromises: Promise<any>[] = [];
      const productObjects: any[] = [];

      for (let i = 0; i < products.length; i++) {
        if (products[i].type === 'product') {
          productObjects.push({ prodId: products[i].id, qty: products[i].qty });

          const promise = Product.findByIdAndUpdate(products[i].id, {
            $inc: { inStock: -products[i].qty },
          }, { new: true });

          productPromises.push(promise);
        }
      }
      await Promise.all(productPromises);
      return productObjects;
    } else if (type === 'collections') {
      // Handle collections logic here
    } else {
      throw new Error('FATAL:- SALE HOLD FAILED - INVALID SALE ITEM TYPE');
    }
  } catch (err) {
    if(err instanceof Error) {
     console.log(err)
    }
  }
};

export { holdSale, resumeHeldSale };
