import mongoose,{Schema, Types} from "mongoose"

interface IUser {
         firstName: string
         lastName:string
         sex: 'male' | 'female'
         password: string
         admin: boolean
         tels: string[]
         email:string
         role:string
         imgUrl:string
         forBusiness: Types.ObjectId
}

const userSchema = new Schema<IUser>({
    firstName:{
        type:String,
        required:true,
    },
    lastName: {
        type:String,
        required:true,
    },
    sex:{
        type:String,
        enum:['male','female'],
        required:true,
    },
    password: {
        type:String,
        required:true,
    },
    admin: {
         type:Boolean,
         default:false
    },
    email: {
        type:String,
        unique:true,
    },
    tels: {
        type:[String],
        required:true,
    },
    role:{
        type:String,
        required:true,
    },
    imgUrl: {
        type:String,
        required:false,
        default:""
    },
    forBusiness: {
        type:Schema.Types.ObjectId,
        required:true,
    }
},{timestamps:true})

userSchema.pre('validate', function(next) {
    if(this.firstName && this.lastName) {
        this.firstName = this.firstName.toUpperCase()
        this.lastName = this.lastName.toUpperCase()
    } 
    next()
}) 

const User = mongoose.model<IUser>('User',userSchema)

export default User