import { Types } from "mongoose";

export interface CartProduct {
  id: Types.ObjectId;
  name: string;
  price: number;
  subTotal: number;
  sku: string;
  tax: number;
  discount: number;
  discountType: string;
  qty: number;
  units: string;
  type: 'product' | 'collection';
}

export interface Cart {
  cartProducts: CartProduct[];
  cartTotal: number;
  cartGeneralDiscount: number;
}

export interface AddToCartData {
    prodId: string;
    qty?: number;
}
export interface PayDetails {
    expenditure: number;
    payed: number;
    change: number;
  }
  
export interface PaymentData {
    type: string;
    notes: string;
    executor: string;
}

export interface SaleData {
  identifier: string;
  executor: string;
  reason: string;
}
