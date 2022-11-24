const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb')

// Server running port
const port = process.env.PORT || 5000

// Middleware
app.use(express.json())
app.use(cors())



// All Api Endpoint

const uri = `mongodb+srv://${ process.env.BD_USER }:${ process.env.DB_PASS }@cluster0.1ipuukw.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

// Verify JWT Token
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if(!authHeader) {
        return res.status(401).send('Unauthorized Access!')
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.JWT_ACCESS_TOKEN, function(err, decoded){
        if(err) {
            return res.status(403).send({
                message: 'Forbidden Access!'
            })
        }
        req.decoded = decoded
        next()
    })
}


// Database Connect function
async function dbConnect() {
    try {
        await client.connect()
        console.log('Database Connected')
    } catch (error) {
        console.log(error.name, error.message)
    }
}dbConnect().catch(error => console.log(error.message))

// Database Collection
const Users = client.db('timeWatch').collection('users')
const Products = client.db('timeWatch').collection('products')
const Categories = client.db('timeWatch').collection('categories')

async function verifyAdmin(req, res, next) {
    const requester = req.decoded?.email;
    const requesterInfo = await Users.findOne({ email: requester })
    const requesterRole = requesterInfo?.role
    console.log(`requesterRole `, requesterRole)
    if (!requesterInfo?.role === 'admin') {
        return res.status(401).send({
            message: `You are not admin`,
            status: 401
        })
    }
    next();
}

// JWT Token Get
app.get('/api/v1/time-watch/jwt', async (req, res) => {
    const email = req.query.email
    const user = await Users.findOne({ email: email })
    if(user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })
        return res.send({ accessToken: token })
    }
    res.status(403).send({ accessToken: '' })
})

// Check Admin
app.get('/api/v1/time-watch/users/admin/:email', async (req, res) => {
    try {
        const userEmail = req.params.email
        const user = await Users.findOne({ email: userEmail })
        res.send({
            success: true,
            message: 'Successfully get the all Users',
            isAdmin: user?.role === 'admin'
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// Check Buyer
app.get('/api/v1/time-watch/users/buyer/:email', async (req, res) => {
    try {
        const userEmail = req.params.email
        const user = await Users.findOne({ email: userEmail })
        res.send({
            success: true,
            message: 'Successfully get the all Users',
            isBuyer: user?.role === 'buyer'
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// Check Seller
app.get('/api/v1/time-watch/users/seller/:email', async (req, res) => {
    try {
        const userEmail = req.params.email
        const user = await Users.findOne({ email: userEmail })
        res.send({
            success: true,
            message: 'Successfully get the all Users',
            isSeller: user?.role === 'seller'
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})


// User Create Api Endpoint
app.post('/api/v1/time-watch/users', async (req, res) => {
    try {
        const user = req.body
        const alreadyHave = await Users.findOne({ email: user.email })
        if(!alreadyHave){
            const users = await Users.insertOne(user)
            res.send({
                success: true,
                message: 'Successfully create a new users',
                data: users
            })
        }
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// Add Product Api Endpoint
app.post('/api/v1/time-watch/products', async (req, res) => {
    try {
        const addProduct = req.body
        const addProducts = await Products.insertOne(addProduct)
        res.send({
            success: true,
            message: 'Successfully add a new product',
            data: addProducts
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// All Product get api 
app.get('/api/v1/time-watch/products', async (req, res) => {
    try {
        const products = await Products.find({}).toArray()
        res.send({
            success: true,
            message: 'Successfully add a new product',
            data: products
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})


// Add Category Api
app.post('/api/v1/time-watch/category', async (req, res) => {
    try {
        const categoryData = req.body
        const categories = await Categories.insertOne(categoryData)
        res.send({
            success: true,
            message: 'Successfully add a new category',
            data: categories
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// All Product Category get api 
app.get('/api/v1/time-watch/category', async (req, res) => {
    try {
        const categories = await Categories.find({}).toArray()
        res.send({
            success: true,
            message: 'Successfully all category loaded!',
            data: categories
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// Category Delete
app.delete('/api/v1/time-watch/category/:categoryId', async (req, res) => {
    try {
        const categoryId = req.params.categoryId
        const categories = await Categories.deleteOne({ _id: ObjectId(categoryId) })
        res.send({
            success: true,
            message: 'Category deleted successfully',
            data: categories
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

// app.get('/api/v1/time-watch/category/:categoryId', async (req, res) => {
//     try {
//         const categoryId = req.params.categoryId
//         const categories = await Products.find({ categoryName: categoryId })
//         res.send({
//             success: true,
//             message: 'Category loaded successfully',
//             data: categories
//         })
//     } catch (error) {
//         res.send({
//             success: false,
//             error: error.message
//         })
//     }
// })



















// Root api import and endpoint
app.get('/api/v1/time-watch', (req, res) => {
    res.send({
        status: '200',
        message: `Time Watch Server!`,
        version: '1.0.0',
        author: `Ab Naeem`,
    })
})

// Time Watch 404 not found api endpoint
app.all('*', (req, res) => {
    res.send({
        status: '404',
        message: `No route found!`,
    })
})

// Time Watch listening port
app.listen(port, () => {
    console.log(`Time Watch listening on port ${port}!`)
})