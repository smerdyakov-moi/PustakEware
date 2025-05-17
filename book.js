require('dotenv').config()
const express = require ('express')
const app = express()
const bcrypt = require ('bcrypt')
const jwt = require ('jsonwebtoken')
const cookieParser = require('cookie-parser')
const db = require ('./config/mongoose-connection')

const userModel = require('./models/users_Model')
const bookModel = require ('./models/books_Model')
const { JWT_KEY } = require('./config/keys')
const multer = require('multer')

const storage = multer.memoryStorage() 
const upload = multer({ storage: storage })

app.set ('view engine','ejs')
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

app.get ('/', (req,res)=>{
    res.render('mainPage')
})

function isLoggedin(req,res,next){
    const token  = req.cookies.token
    if(!token){
        return res.redirect("/")
    }
    else{
        let data = jwt.verify( req.cookies.token,process.env.JWT_KEY)
        req.user = data
        next()
}}

app.post ('/register', upload.single('image'), async(req,res)=>{
    try
    {
    let {fullname,email,password} = req.body
    let user = await userModel.findOne({email})
    if (user) return res.status(500).send('User already registered!!')

    let hash_pw = await bcrypt.hash(password,10)

    let created_User = await userModel.create({
        password:hash_pw,fullname,email,image:req.file.buffer
    })
    let token = jwt.sign({email:email, userid: created_User._id},process.env.JWT_KEY)
    res.cookie('token',token)
    res.redirect('/userPage')
    } catch(err)
    {
            let {fullname,email,password} = req.body
    let user = await userModel.findOne({email})
    if (user) return res.status(500).send('User already registered!!')

    let hash_pw = await bcrypt.hash(password,10)

    let created_User = await userModel.create({
        password:hash_pw,fullname,email
    })
    let token = jwt.sign({email:email, userid: created_User._id},process.env.JWT_KEY)
    res.cookie('token',token)
    res.redirect('/userPage')
    }

})

app.post('/login', async (req,res)=>{
    let {email,password} = req.body
    let user = await userModel.findOne({email})
    if (!user) return res.status(500).send('No user with such email!')

    bcrypt.compare(password, user.password, (err,result)=>{
        if (result) {
            let token = jwt.sign({email:email, userid: user._id},process.env.JWT_KEY)
            res.cookie('token',token)
            res.redirect('/userPage')
        }
        else {res.redirect('/')}
    })
})
app.get ('/logout', isLoggedin, async(req,res)=>{
    res.cookie('token',"")
    res.redirect('/')
})





app.get('/userPage', isLoggedin, async (req,res)=>{
    let user = await userModel.findOne({_id:req.user.userid}).populate('books')
    res.render('userPage',{user})
})

app.get ('/editProfile', isLoggedin, async(req,res)=>{
    let user = await userModel.findOne({_id:req.user.userid})
    res.render('editProfilePage',{user})
})

app.post ('/userPage/updateprofile', upload.single('image'),isLoggedin, async(req,res)=>{
    try{const {fullname} =req.body
    let user = await userModel.findOneAndUpdate({_id:req.user.userid},{fullname,image:req.file.buffer},{new:true})
    res.redirect('/userPage')}
    catch(err)
    {
        const {fullname} =req.body
        let user = await userModel.findOneAndUpdate({_id:req.user.userid},{fullname},{new:true})
        res.redirect('/userPage')
    }
})

app.post ('/userPage/removeprofilepic', isLoggedin, async(req,res)=>{
    await userModel.findOneAndUpdate({_id:req.user.userid},{image:null})
    res.redirect('/userPage')
})

app.get('/books/:id/download', isLoggedin,async (req, res) => {
  const book = await bookModel.findById(req.params.id);
  let user = await userModel.findOne({_id:req.user.userid})
  user.books.push(book._id)
  await user.save()
  if (!book || !book.pdf) return res.status(404).send('PDF not found');

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${book.fullname}.pdf"`
  });
  res.send(book.pdf);
});

app.get ('/createBook', (req,res)=>{
    res.render('BookCreation')
})

app.post('/createBook', upload.fields([{name:'image',maxCount:1},{name:'pdf',maxCount:1}]),async(req,res)=>{
    let {fullname} = req.body
    const imageFile = req.files['image']?.[0]
    const pdfFile = req.files['pdf']?.[0]

    const bookdata ={fullname}
    if(imageFile) {bookdata.image = imageFile.buffer}
    if(pdfFile) {bookdata.pdf = pdfFile.buffer}

    await bookModel.create(bookdata)

})

app.get('/removeBook/:ID', isLoggedin, async(req,res)=>{
    let postID = req.params.ID
   
    let user = await userModel.findOne({_id:req.user.userid})
 
    user.books.splice(user.books.indexOf(postID),1)
    await user.save()
    res.redirect('/userPage')
})

app.get ('/shop', isLoggedin, async(req,res)=>{
    let books_list = await bookModel.find()
    let user = await userModel.findOne({_id:req.user.userid})
    res.render('shop',{books:books_list,user})
})

app.listen('3000',(err)=>{
    console.log('Listening!!!')
})