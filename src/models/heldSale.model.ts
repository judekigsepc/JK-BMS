
import mongoose,{Schema, Types} from "mongoose"

interface IProduct {
    prodId:Types.ObjectId
    qty:number
}
interface IHeldSale {
          identifier: string
          products : IProduct []
          collections: Types.ObjectId []
          executor: Types.ObjectId
          reason: string
}


const prodSubSchema = new Schema<IProduct>({
    prodId: {
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product',
        required:true
    },
    qty: {
        type:Number,
        required:true
    }
})

const saleHoldSchema = new Schema<IHeldSale>({
    identifier:{
        type: String,
        required: true
    },
    products:[prodSubSchema],

    collections: {
        type:[mongoose.Schema.Types.ObjectId],
        ref:'Collection',
        required: true
    },
    executor : {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    reason : {
        type:String,
        default:'No reason specified'
    }
},{timestamps:true})


const HeldSale = mongoose.model<IHeldSale>('heldSale',saleHoldSchema)

export default HeldSale

