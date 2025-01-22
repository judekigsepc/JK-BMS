import mongoose,{Schema} from "mongoose"

interface ICategory {
   name:string
}

const categorySchema = new Schema<ICategory>({
     name:{
        type: String,
        required:true
     }
})

const Category = mongoose.model<ICategory>('Category',categorySchema)

export default Category