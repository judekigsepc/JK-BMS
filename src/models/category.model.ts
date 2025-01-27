import mongoose,{Schema,Types} from "mongoose"

interface ICategory {
   name:string
   forBusiness: Types.ObjectId
}

const categorySchema = new Schema<ICategory>({
     name:{
        type: String,
        required:true
     },
     forBusiness: {
      type: Schema.Types.ObjectId,
      required:true
     }
})

const Category = mongoose.model<ICategory>('Category',categorySchema)

export default Category