import mongoose,{Schema} from "mongoose"

interface Config {
          currency:string
          globalStockAlert:boolean
          globalStockAlertLimit:number
          debugMode: boolean
          emailText:string
          invoiceMessage:string
}


const configSchema = new Schema<Config>({
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
})

const Config = mongoose.model('Config', configSchema)

export default Config
