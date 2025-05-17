const mongoose = require ('mongoose')

const bookSchema = mongoose.Schema({
    fullname: String,
    image: Buffer,
    pdf:{
        type: Buffer,
        required: true
    }
})

module.exports = mongoose.model("book",bookSchema)