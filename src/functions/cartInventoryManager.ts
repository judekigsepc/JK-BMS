import {Socket}  from 'socket.io';
import Collection, { ICollection }  from '../models/collection.model';
import  Config  from "../models/config.model";
import  Product, { IProduct }  from "../models/product.model";
import { messageHandler, successMessageHandler} from "../utils/util";

import { Cart } from '../types';

interface PayDetails {
    expenditure: number;
    payed: number;
    change: number;
}

interface Item {
    itemId: string;
    itemQty: number;
    name:string
}

interface Transaction {
    items: Item[];
}

// Function that clears up the cart
const clearCart = async (socket: Socket, cart: Cart, payDetails: PayDetails): Promise<void> => {
    payDetails.expenditure = 0;
    payDetails.payed = 0;
    payDetails.change = 0;

    cart.cartProducts = [];
    cart.cartGeneralDiscount = 0;
    cart.cartTotal = 0;

    socket.emit('cart-cleanup');
    socket.emit('pay_cleanup', payDetails);

    successMessageHandler(socket, 'cart cleared');
};

// Function that handles update of the inventory and stock management including low stock alerts
const inventoryUpdate = async (socket: Socket, savedTransaction: Transaction): Promise<void> => {
    const { items } = savedTransaction;
    try {
        // Loop through item list
        for (const item of items) {
            const productToUpdate = await Product.findById(item.itemId);
            if (!productToUpdate) {
                const collectionToUpdate = await Collection.findById(item.itemId);
                return stockHandler(socket, collectionToUpdate, item);
            }

            // Passed to the stock handler function
            stockHandler(socket, productToUpdate, item);
        }

        successMessageHandler(socket, 'Inventory Updated successfully');
    } catch (err) {
        throw new Error(`Inventory Update Error: ${err}`);
    }
};

// Manages stock - stock alerts and the actual inventory update
const stockHandler = async (socket: Socket, productToUpdate: IProduct | ICollection | null, item: Item): Promise<void> => {
    try {
        if (!productToUpdate) {
            throw new Error('FATAL: INVALID PRODUCT DETECTED PLEASE CONTACT DEVELOPER');
        }
        const { name, inStock, stockAlert, stockAlertLimit, units } = productToUpdate as IProduct
        const config = await Config.find({});
        const { globalStockAlertLimit, globalStockAlert } = config[0];

        if (inStock < 1) {
            throw new Error(`${name} is OUT OF STOCK`);
        } else {
            const newStock = inStock - Number(item.itemQty);

            if (newStock < 0) {
                throw new Error(`Transaction failed: Verify quantity values of ${item.name} against stock`);
            }
            await Product.findByIdAndUpdate(item.itemId, { inStock: newStock }, { new: true });

            if (globalStockAlert) {
                if (stockAlert) {
                    if (newStock < stockAlertLimit || inStock < globalStockAlertLimit) {
                        messageHandler(socket, 'alert', `${name} is low in stock with ${newStock} ${units}s left`);
                    }
                }
            }
        }
    } catch (err) {
        throw new Error(`Stock handling Error: ${err}`);
    }
};

export {
    clearCart,
    inventoryUpdate
};
