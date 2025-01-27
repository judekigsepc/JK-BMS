import mongoose,{Schema, Types} from "mongoose"

export interface IProduct {
    name:string
    prodCode:string
    buyingPrice: number
    sellingPrice:number
    inStock:number
    stockAlert:boolean
    stockAlertLimit:number
    units: string
    sku:string
    category:Types.ObjectId
    discount:number
    discountType: 'percent' | 'flat'
    tax:number
    imgUrl:string
    forBusiness: Types.ObjectId
}

const productSchema = new Schema<IProduct>({
    name :{
        type:String,
        required:true,
        unique:true,
    },
    prodCode: {
        type:String,
        required:true,
        unique:true,
    },
    buyingPrice : {
        type:Number,
        required:true,
    },
    sellingPrice: {
        type:Number,
        required:true
    },
    inStock: {
        type:Number,
        required:true,
    },
    stockAlert: {
        type:Boolean,
        default:true,
    },
    stockAlertLimit: {
         type:Number,
         default:10,
    },
    units: {
        type:String,
        default:'item',
    },
    sku: {
        type:String,
        required:true,
        unique:true,
    },
    category: {
        type:Schema.Types.ObjectId,
        ref:'Category',
        required:true,
    },
    discount: {
        type:Number,
        default: 0,
    },
    discountType: {
        type:String,
        enum:['flat','percent'],
        default:'percent'
    },
    tax: {
        type:Number,
        default:0,
    },
    imgUrl: {
        type:String,
        default:""
    },
    forBusiness: {
        type:Schema.Types.ObjectId,
        required:true
    }
},{timestamps:true})

const Product = mongoose.model<IProduct>('Product',productSchema)

export default Product
