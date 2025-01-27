import mongoose,{Schema,Types} from "mongoose"

interface IConfig {
          currency:string
          globalStockAlert:boolean
          globalStockAlertLimit:number
          debugMode: boolean
          emailText:string
          invoiceMessage:string
          forBusiness: Types.ObjectId
}


const configSchema = new Schema<IConfig>({
    currency: {
        type:String,
        default:'UGX',
    },
    globalStockAlert: {
        type: Boolean,
        default:true,
    },
    globalStockAlertLimit: {
        type:Number,
        default:10
    },
    debugMode: {
        type:Boolean,
        default:false
    },
    emailText: {
        type: String,
        emailText: 'Invoice email'
    },
    invoiceMessage: {
        type:String,
        default:'Thank you for shopping with uss'
    },
    forBusiness: {
        type:Schema.Types.ObjectId,
        required:true
    }
})

const Config = mongoose.model('Config', configSchema)

export default Config
