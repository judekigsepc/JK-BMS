import mongoose,{Schema} from "mongoose";

interface IBusiness  {
    businessName: string
    businessType:string
    contactInfo: {
        phone:string
        email:string
        website:string
    },
    address: {
        country:string
        city: string
        region:string
    },
    imgUrl:string
    currency: string
    VATNumber: string
}

const businessSchema = new Schema<IBusiness>({
    businessName: {
        type: String,
    },
    businessType:{
        type:String,
    },
    contactInfo: {
        phone:[{
             type:String,
             required:true,
             unique:true,
        }],
        email: {
            type: String,
            required: true,
            match: /^\S+@\S+\.\S+$/, // Basic email validation
        },
        website: {
            type: String,
            trim: true, // Removes extra spaces
        },
    },
    address: {
        country: {
            type:String,
            required:true
        },
        city:{
            type:String,
            required:true
        },
        region:{
            type:String,
            required:true
        }
    },
    imgUrl: {
        type:String,
        default:'',
    },
    currency: {
        type:String,
        required:true,
        default:'UGX'
    },
    VATNumber: {
        type:String,
        required:true,
    },
},{timestamps:true});

const Business = mongoose.model<IBusiness>('Business', businessSchema)

export default Business
