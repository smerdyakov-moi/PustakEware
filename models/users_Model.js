const mongoose = require ('mongoose')


const userSchema = mongoose.Schema({
    fullname: String,
    email: String,
    password: String,
    books:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'book'
    }],
    image: {
        type: Buffer,
    
    }
})

module.exports = mongoose.model("user",userSchema)