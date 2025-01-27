import mongoose,{Schema, Types} from "mongoose"

export interface ICollection {
    name:string
    collectionCode:string
    items: Types.ObjectId []
    color:string
    description:string
    inStock:string
    forBusiness: Types.ObjectId
}

const collectionSchema = new Schema<ICollection>({
    name: {
        type:String,
        unique:true,
        required:true,
    },
    collectionCode: {
        type:String,
        required:true
    },
    items: {
        type:[mongoose.Schema.Types.ObjectId],
        ref:'Product'
    },
    color: {
        type:String,
        default:'black'
    },
    description: {
        type:String,
        default:'This is a category'
    },
    forBusiness: {
        type:Schema.Types.ObjectId,
        required:true
    }

},{timestamps: true})

const Collection = mongoose.model<ICollection>('Collection',collectionSchema)

export default Collection