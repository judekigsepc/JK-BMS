import mongoose ,{ CallbackError, Schema,Types } from "mongoose"

const {timeSetter} = require('../utils/util.js')

interface IItem {
  itemId:Types.ObjectId
  name:string
  itemQty:number
  unitPrice:number
  discount:number
  discountType:'percent' | 'flat'
  tax: number
  subTotal: number
}

const itemSubSchema = new Schema<IItem>({
    itemId: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required: true,
    },
    name: {
      type:String,
      required:true,
    },
    itemQty:{
        type:Number,
        required:true,
        min:1
    },
    unitPrice:{
        type:Number,
        required:true,
    },
    discount:{
        type:Number,
        required:true,
        default:0
    },
    discountType: {
        type:String,
        required:true,
    },
    tax:{
        type:Number,
        required:true,
        default:0
    },
    subTotal :{
      type:Number,
      required:true,
    }
})

interface ITransaction {
  executor: Types.ObjectId
  items : IItem []
  transDate: Date
  generalDiscount: number
  generalTax: number
  totalCostPrice:number
  payedAmount:number
  change:Number
  paymentMethod: 'cash' | 'credit-card' | 'mobile-money' | 'bank-transfer'
  type: 'purchase' | 'refund'
  notes: string
  invoiceUrl: string
}

const transactionSchema = new Schema<ITransaction>({
    executor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
   },
    items: [itemSubSchema],
    transDate: {
      type: Date,
    },
    generalDiscount: {
      type: Number,
      default: 0,
    },
    generalTax: {
      type: Number,
      default: 0,
    },
    totalCostPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    payedAmount: {
      type:Number,
      required:true,
    },
    change: {
      type:Number,
      required:true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'credit-card', 'mobile-money', 'bank-transfer'],
      required: true,
    },
    type:{
      type:String,
      enum:['purchase','refund'],
      required:true,
    },
    notes: {
      type: String,
      default: '',
    },
    invoiceUrl: {
      type:String,
      default:'',
    },
  },{timestamps:true});
  
transactionSchema.pre('save', async function (next) {
    try {
        const time = await timeSetter()
        this.transDate = time
        next()
    }catch(err: CallbackError | unknown){
        next(err as CallbackError)
    }
})

const Transaction = mongoose.model<ITransaction>('Transaction',transactionSchema)

module.exports = Transaction