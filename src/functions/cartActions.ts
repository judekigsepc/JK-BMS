import { Socket } from 'socket.io';
import  Product  from '../models/product.model';
import Collection from '../models/collection.model';

import { errorHandler, successMessageHandler } from '../utils/util';
import { validateIfNumber, validateIfString, validateMultipleNumbers } from '../utils/validationUtils';
import { Cart, CartProduct,AddToCartData } from '../types';


const totalCalculator = (products: CartProduct[]): number => {
  return products.reduce((total, product) => total + product.subTotal, 0);
};

const addToCart = async (socket: Socket, cart: Cart, data: AddToCartData): Promise<void> => {
  console.log('From cart we received something');

  if (!socket || !data || !cart) {
    return console.error(socket, 'Internal server error');
  }

  if (!data.prodId) {
    return errorHandler(socket, 'No product id');
  }

  if (!data.qty) {
    data.qty = 1;
  }

  const wantedProduct = await Product.findById(data.prodId);
  if (!wantedProduct) {
    const wantedCollection = await Collection.findById(data.prodId);
    if (!wantedCollection) {
      return errorHandler(socket, 'Product or Collection not found in database');
    } else {
      return collectionHandler(socket, cart, wantedCollection);
    }
  }

  const { name, sellingPrice, tax, discount, discountType, units, sku, _id, inStock } = wantedProduct;

  if (inStock <= 0) {
    return errorHandler(socket, `${name} is OUT OF STOCK - If you think this is wrong please contact system admin`);
  }

  let goneDiscount;
  if (discountType === 'percent') {
    goneDiscount = (discount / 100) * sellingPrice;
  } else if (discountType === 'flat') {
    goneDiscount = discount;
  } else {
    errorHandler(socket, 'Invalid discount type detected on product. Not accounted for');
    goneDiscount = 0;
  }

  const productSubTotal = (Number(data.qty) * Number(sellingPrice) + tax) - goneDiscount;
  const product: CartProduct = {
    id: _id,
    name: name,
    price: sellingPrice,
    subTotal: productSubTotal,
    sku: sku,
    tax: tax,
    discount: discount,
    discountType: discountType,
    qty: data.qty,
    units: units,
    type: 'product'
  };

  const existingProductIndex = cart.cartProducts.findIndex(prod => prod.name === product.name);

  if (existingProductIndex !== -1) {
    const updatedData = { prodIndex: existingProductIndex, qty: cart.cartProducts[existingProductIndex].qty + 1 };
    return await updateInCart(socket, cart, updatedData);
  }

  cart.cartProducts.push(product);
  cart.cartTotal = totalCalculator(cart.cartProducts);

  const { cartTotal } = cart;
  socket.emit('cart-add-result', { product, cartTotal });
  successMessageHandler(socket, `${product.name} Added to cart`);
};

const updateInCart = async (socket: Socket, cart: Cart, data: { prodIndex: number, qty: number }): Promise<void> => {
  try {
    let { prodIndex, qty } = data;

    try {
      validateMultipleNumbers([prodIndex, qty], 'Product index or quantity may not be present or is Invalid(Should be string)');
    } catch (err: Error | unknown) {
      if(err instanceof Error) {
        return errorHandler(socket, `Product Update Error: ${err.message}`);
      }
      return errorHandler(socket, `Product Update Error: Unknown error occured`);

    }

    if (qty < 1) {
      qty = 1;
    }
    if (cart.cartProducts.length === 0) {
      return errorHandler(socket, 'Your cart is empty. There is nothing to update.');
    }

    const productToUpdate = cart.cartProducts[prodIndex];
    if (!productToUpdate) {
      return errorHandler(socket, 'Product not in array');
    }

    const validateAgainstProductStock = async (productToUpdate: CartProduct): Promise<void> => {
      try {

        const product = await Product.findById(productToUpdate.id);

        if(!product) {
          return errorHandler(socket,'Product not found')
        }

        const {inStock} = product

        if (qty > inStock) {
          const difference = qty - inStock;
          throw new Error(`Quantity more than available in stock by ${difference}`);
        } else {
          successMessageHandler(socket, '');
        }
      } catch (err: Error| unknown) {
        if(err instanceof Error) {
          return errorHandler(socket, err.message);
        } 
        return errorHandler(socket, 'Unknown error occured');

      }
    };

    await validateAgainstProductStock(productToUpdate);

    let subTotal:number = 0;
    const { discount, discountType } = productToUpdate;
    if (discountType === 'percent') {
      const discountValue = (Number(discount) / 100) * Number(qty * productToUpdate.price);
      subTotal = Number(qty * productToUpdate.price) - discountValue;
    } else if (discountType === 'flat') {
      subTotal = Number(qty * productToUpdate.price) - discount;
    } else {
      errorHandler(socket, 'FATAL ERROR. PLEASE CONTACT THE SYSTEM ADMIN');
    }

    productToUpdate.qty = qty;
    productToUpdate.subTotal = subTotal;

    cart.cartProducts[prodIndex] = productToUpdate;
    cart.cartTotal = totalCalculator(cart.cartProducts);

    const { cartTotal } = cart;
    socket.emit('upt_result', { prodIndex, productToUpdate, cartTotal });
  } catch (err: Error | unknown) {
    if(err instanceof Error) {
      return errorHandler(socket, err.message);
    }
    return errorHandler(socket, 'Unexpected error occured')
  }
};

const deleteInCart = (socket: Socket, cart: Cart, prodIndex: number): void => {
  try {
    validateIfNumber(prodIndex, 'Deletion Error: product index is not present or is Invalid(Should be number)');
  } catch (err) {
    if(err instanceof Error) {
      return errorHandler(socket, err.message);
    }
    return errorHandler(socket, 'Unexpected error occured');
  }

  const productToDelete = cart.cartProducts[prodIndex];
  if (!productToDelete) {
    return errorHandler(socket, 'Product to delete is not in cart');
  }

  cart.cartProducts.splice(prodIndex, 1);
  cart.cartTotal = totalCalculator(cart.cartProducts);

  const { cartTotal } = cart;
  socket.emit('delete_command', { prodIndex, cartTotal });
  successMessageHandler(socket, `${productToDelete.name} removed from cart`);
};

const discountCart = (socket: Socket, cart: Cart, data: { discount: number, type: string }): void => {
  const { discount, type } = data;

  try {
    if (cart.cartProducts.length < 1) {
      return errorHandler(socket, 'Discounting Error: Cart is empty');
    }
    validateIfNumber(discount, 'Discounting Error: Discount VALUE is not present or is Invalid');
    validateIfString(type, 'Discounting Error: Discount TYPE is not present or is Invalid');
  } catch (err) {
    if(err instanceof Error) {
      return errorHandler(socket, err.message);
    }
    return errorHandler(socket, 'Unexpected error occured')
  }

  const resultEmmiter = () => {
    const { cartGeneralDiscount, cartTotal } = cart;
    socket.emit('discount_result', { cartGeneralDiscount, cartTotal });
  };

  if (type.toUpperCase() === 'FLAT') {
    cart.cartTotal = cart.cartTotal - discount;
    // cart.cartGeneralDiscount = `${discount} (flat)`;

    resultEmmiter();
  } else if (type.toUpperCase() === 'PERCENT') {
    cart.cartTotal = cart.cartTotal - (Number(discount) / 100) * cart.cartTotal;
    // cart.cartGeneralDiscount = `${discount}%`;

    resultEmmiter();
  } else {
    errorHandler(socket, 'Discount error: Please check your values(Discount type parameter should be FLAT OR PERCENT)');
  }
};

const collectionHandler = async (socket: Socket, cart: Cart, collection: any): Promise<void> => {
  const collectionData: CartProduct = {
    id: collection._id,
    name: collection.name,
    price: collection.priceValue,
    subTotal: collection.priceValue,
    sku: collection.collectionCode,
    tax: 0,
    discount: collection.discount,
    discountType: collection.discountType,
    qty: 1,
    units: 'null',
    type: 'collection'
  };

  console.log(collectionData, 'collectionData');

  cart.cartProducts.push(collectionData);
  cart.cartTotal = totalCalculator(cart.cartProducts);

  const { cartTotal } = cart;
  console.log(cartTotal, 'cartTotal');

  socket.emit('cart-add-result', { product: collectionData, cartTotal });
};

export {
  addToCart,
  updateInCart,
  deleteInCart,
  discountCart
};
