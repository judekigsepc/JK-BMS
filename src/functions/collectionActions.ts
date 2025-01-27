import Product, { IProduct }  from "../models/product.model";
import { errorHandler } from "../utils/util";

interface ProductData {
  _id: string;
  quantity: number;
}

interface DiscountData {
  discountType: 'percent' | 'flat';
  discount: number;
}

interface CollectionData {
  productsData: ProductData[];
  discountData: DiscountData;
}

const calculateCollection = async (socket: any, data: CollectionData): Promise<void> => {
  if (!data) {
    errorHandler(socket, 'Collection calculation data not provided');
    return;
  }

  const { productsData, discountData } = data;

  console.log(productsData);
  if (!productsData || productsData.length < 1) {
    console.log('collection is empty');
    return socket.emit('collection-calc-result', 0);
  }

  const productPromises = productsData.map(async (product) => {
    const wantedProduct = await Product.findById(product._id);
    if (!wantedProduct) {
      errorHandler(socket, 'Product Not found in database');
      return 0;
    }

    const { name, sellingPrice, tax, discount, discountType, inStock }: IProduct = wantedProduct;

    if (inStock <= 0) {
      return errorHandler(socket, `${name} is OUT OF STOCK - If you think this is wrong please contact system admin`);
    }

    let goneDiscount = 0;
    if (discountType === 'percent') {
      goneDiscount = (discount / 100) * sellingPrice;
    } else if (discountType === 'flat') {
      goneDiscount = discount;
    } else {
      errorHandler(socket, 'Invalid discount type detected on product. Not accounted for');
    }

    return (Number(sellingPrice) + tax) - goneDiscount;
  });

  const productSubTotals = await Promise.all(productPromises);

  let total:number = Number(productSubTotals.reduce((acc, subTotal) => Number(acc) + Number(subTotal), 0));

  if (discountData.discountType === 'percent') {
    total -= (discountData.discount / 100) * total;
  } else if (discountData.discountType === 'flat') {
    total -= discountData.discount;
  } else {
    errorHandler(socket, 'Invalid discount type detected on Collection. Not accounted for');
  }

  console.log(total);
  socket.emit('collection-calc-result', total);
};

export { calculateCollection };
