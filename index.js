const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')

/* =========================
* Server Running Port
 =========================*/
const port = process.env.PORT || 5000

/* =========================
* Middleware
 =========================*/
app.use(express.json())
app.use(cors())


/* =========================
* MongoDB URL and MongoClient
 =========================*/
const uri = `mongodb+srv://${ process.env.BD_USER }:${ process.env.DB_PASS }@cluster0.1ipuukw.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

/* =========================
* Verify JWT Token after User Login Middleware
 =========================*/
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if(!authHeader) {
        return res.status(401).send('Unauthorized Access!')
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
        if(err) {
            return res.status(403).send({
                message: 'Forbidden Access!'
            })
        }
        req.decoded = decoded
        next()
    })
}

/* =========================
* MongoDb Database Connection
 =========================*/
async function dbConnect() {
    try {
        await client.connect()
        console.log('Database Connected')
    } catch (error) {
        console.log(error.name, error.message)
    }
}dbConnect().catch(error => console.log(error.message))

/* =========================
* All Database Collection
 =========================*/
const Users = client.db('timeWatch').collection('users')
const Products = client.db('timeWatch').collection('products')
const Categories = client.db('timeWatch').collection('categories')
const Orders = client.db('timeWatch').collection('orders')
const Payments = client.db('timeWatch').collection('payments')
const ReportProducts = client.db('timeWatch').collection('reportProducts')

/* =========================
* Verify Admin, Seller and Buyer Middleware
 =========================*/
async function verifyAdmin(req, res, next) {
    const requester = req.decoded?.email;
    const requesterInfo = await Users.findOne({ email: requester })
    const requesterRole = requesterInfo?.role
    // console.log(`requesterRole `, requesterRole)
    if (!requesterInfo?.role === 'admin') {
        return res.status(401).send({
            message: `You are not admin`,
            status: 401
        })
    }
    next();
}
async function verifySeller(req, res, next) {
    const requester = req.decoded?.email;
    const requesterInfo = await Users.findOne({ email: requester })
    const requesterRole = requesterInfo?.role
    // console.log(`requesterRole `, requesterRole)
    if (!requesterInfo?.role === 'seller') {
        return res.status(401).send({
            message: `You are not seller`,
            status: 401
        })
    }
    next();
}
async function verifyBuyer(req, res, next) {
    const requester = req.decoded?.email;
    const requesterInfo = await Users.findOne({ email: requester })
    const requesterRole = requesterInfo?.role
    // console.log(`requesterRole `, requesterRole)
    if (!requesterInfo?.role === 'buyer') {
        return res.status(401).send({
            message: `You are not Buyer`,
            status: 401
        })
    }
    next();
}

/* =========================
* JWT Token Api Endpoint
 =========================*/
app.get('/api/v1/time-watch/jwt', async (req, res) => {
    const email = req.query.email
    const user = await Users.findOne({ email: email })
    if(user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' })
        return res.send({ accessToken: token })
    }
    res.status(403).send({ accessToken: '' })
})

/* =========================
* Check Admin and Seller Api Endpoint
 =========================*/
// Check Admin
app.get('/api/v1/time-watch/users/admin/:email', async (req, res) => {
    try {
        const userEmail = req.params.email
        const user = await Users.findOne({ email: userEmail })
        res.send({
            success: true,
            message: 'Successfully get the Admin',
            isAdmin: user?.role === 'admin'
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
            message: 'Successfully get the Seller',
            isSeller: user?.role === 'seller'
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
            message: 'Successfully get the Buyer',
            isBuyer: user?.role === 'buyer'
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

/* =========================
* User Create and Verify Status Update Api Endpoint
 =========================*/
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
// User verified status update
app.put('/api/v1/time-watch/users/status-update/:email', verifyJWT, verifyAdmin, async (req, res) => {
    try {
        const email = req.params.email
        const userFilter = { userEmail: email }
        const userFilter2 = { email: email }
        const option = { upsert: true }
        const updateDoc = {
            $set: {
                verify: true
            }
        }
        const productHae = await Products.find(userFilter).toArray()
        if(productHae.length){
            const setVerify = await Products.updateMany(userFilter, updateDoc, option)
        }
        const users = await Users.updateOne(userFilter2, updateDoc, option)
        res.send({
            success: true,
            message: 'Successfully change the user role',
            data: users
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

/* =========================
* All Product Api Endpoint
 =========================*/
// Post
app.post('/api/v1/time-watch/products', verifyJWT, verifySeller, async (req, res) => {
    try {
        const addProduct = req.body
    
        const categoryFilter = await Categories.findOne({_id: ObjectId(addProduct.categoryId)})
        const filteredCatName = categoryFilter.name
        addProduct.categoryName = filteredCatName

        const userQuery = {
            email: addProduct.userEmail
        }
        console.log(userQuery)
        const user = await Users.findOne(userQuery)
        const verify = user.verify

        if(verify === true) {
            addProduct.verify = true
        }
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
// All Product get api with email in 
app.get('/api/v1/time-watch/products', verifyJWT, verifyBuyer, async (req, res) => {
    try {
        const email = req.query.email
        const products = await Products.find({ userEmail: email }, {}).toArray()
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
// All product show in Product Page
app.get('/api/v1/time-watch/all-products', verifyJWT, verifyBuyer, async (req, res) => {
    try {
        const products = await Products.find({}).toArray()
        const soldProduct = products.filter(product => product.status === 'sold')
        const filterProduct = products.filter(product => !soldProduct.includes(product))
        res.send({
            success: true,
            message: 'Successfully add a new product',
            data: filterProduct
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// All Product get api 
app.get('/api/v1/time-watch/products/:categoryId', verifyJWT, verifyBuyer, async (req, res) => {
    try {
        const catId = req.params.categoryId
        const products = await Products.find({ categoryId: catId }).toArray()
        const soldProduct = products.filter(product => product.status === 'sold')
        const filterProduct = products.filter(product => !soldProduct.includes(product))
        res.send({
            success: true,
            message: 'Successfully add a new product',
            data: filterProduct
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// Product Delete Api
app.delete('/api/v1/time-watch/products/:productId', verifyJWT, verifySeller, async (req, res) => {
    try {
        const productId = req.params.productId
        const products = await Products.deleteOne({ _id: ObjectId(productId) })
        res.send({
            success: true,
            message: 'Product deleted successfully',
            data: products
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

/* =========================
* All Reported Product Api Endpoint
 =========================*/
// Reported Product Api
app.post('/api/v1/time-watch/reports', verifyJWT, verifyBuyer, async (req, res) => {
    try {
        const reportsProduct = req.body
        const reportsProducts = await ReportProducts.insertOne(reportsProduct)
        
        const productId = reportsProduct.productId
        const filterProduct = { _id: ObjectId(productId) }
        const productUpdatedDoc = {
            $set: {
                reported: true
            }
        }
        const updateReportedStatus = await Products.updateOne(filterProduct, productUpdatedDoc)
        res.send({
            success: true,
            message: `Successfully report this product!`,
            data: reportsProducts
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// Reported product get
app.get('/api/v1/time-watch/reports', verifyJWT, verifyAdmin, async (req, res) => {
    try {
        const reportedProducts = await ReportProducts.find({}).toArray()
        res.send({
            success: true,
            message: 'Successfully all reported product loaded!',
            data: reportedProducts
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// Reported product deleted
app.delete('/api/v1/time-watch/reports/:reportId', verifyJWT, verifyAdmin, async (req, res) => {
    try {
        const reportId = req.params.reportId
        const reportedProduct = await ReportProducts.findOne({ _id: ObjectId(reportId) })

        const productId = reportedProduct.productId
        const findProduct = await Products.findOne({ _id: ObjectId(productId) })

        const reportedProductDelete = await ReportProducts.deleteOne(reportedProduct)
        const productDelete = await Products.deleteOne(findProduct)
        res.send({
            success: true,
            message: 'Reported Product deleted successfully',
            data: reportedProductDelete
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

/* =========================
* All Category Api Endpoint
 =========================*/
// Add Category Api
app.post('/api/v1/time-watch/category', verifyJWT, verifySeller, async (req, res) => {
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
app.get('/api/v1/time-watch/category',  async (req, res) => {
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
app.delete('/api/v1/time-watch/category/:categoryId', verifyJWT, verifySeller, async (req, res) => {
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

/* =========================
* All Order Api Endpoint
 =========================*/
// Order Api
app.post('/api/v1/time-watch/orders', verifyJWT, verifyBuyer, async (req, res) => {
    try {
        const ordersData = req.body
        const orders = await Orders.insertOne(ordersData)
        res.send({
            success: true,
            message: 'Successfully Booked!',
            data: orders
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// get api 
app.get('/api/v1/time-watch/orders', verifyJWT, verifyBuyer, async (req, res) => {
    try {
        const email = req.query.email
        const orders = await Orders.find({ email: email }).toArray()
        res.send({
            success: true,
            message: 'Successfully get all ordered product',
            data: orders
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// order Delete
app.delete('/api/v1/time-watch/orders/:orderId', verifyJWT, verifyBuyer, async (req, res) => {
    try {
        const orderId = req.params.orderId
        const orders = await Orders.deleteOne({ _id: ObjectId(orderId) })
        res.send({
            success: true,
            message: 'Order deleted successfully',
            data: orders
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// Single Order data Loaded
app.get('/api/v1/time-watch/orders/:orderId', verifyJWT, verifyBuyer, async (req, res) => {
    try {
        const orderId = req.params.orderId
        const singleOrder = await Orders.findOne({ _id: ObjectId(orderId) })
        res.send({
            success: true,
            message: 'Successfully Get the single booking data',
            data: singleOrder
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

/* =========================
* Buyer and Seller in Admin Dashboard Api Endpoint
 =========================*/
// All Buyers Loaded
app.get('/api/v1/time-watch/buyers', verifyJWT, verifyAdmin, async (req, res) => {
    try {
        const buyers = await Users.find({ role: 'buyer' }).toArray()
        res.send({
            success: true,
            message: 'Successfully all buyers loaded!',
            data: buyers
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// Buyer Delete
app.delete('/api/v1/time-watch/buyers/:buyerId', verifyJWT, async (req, res) => {
    try {
        const buyerId = req.params.buyerId
        const users = await Users.deleteOne({ _id: ObjectId(buyerId) })
        res.send({
            success: true,
            message: 'User deleted successfully',
            data: users
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// All Sellers Loaded
app.get('/api/v1/time-watch/sellers', verifyJWT, verifyAdmin, async (req, res) => {
    try {
        const sellers = await Users.find({ role: 'seller' }).toArray()
        res.send({
            success: true,
            message: 'Successfully all sellers loaded!',
            data: sellers
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// Seller Delete
app.delete('/api/v1/time-watch/sellers/:sellerId', verifyJWT, verifyBuyer, async (req, res) => {
    try {
        const sellerId = req.params.sellerId
        const users = await Users.deleteOne({ _id: ObjectId(sellerId) })
        res.send({
            success: true,
            message: 'User deleted successfully',
            data: users
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

/* =========================
* Stripe Payment Api Endpoint
 =========================*/
// Stripe payment Implement
app.post('/api/v1/time-watch/create-payment-intent', verifyJWT, verifyBuyer, async (req, res) => {
    try {
        const order = req.body
        const price = order.price
        const amount = price * 100
        const paymentIntent = await stripe.paymentIntents.create({
            currency: 'usd',
            amount: amount,
            "payment_method_types": [
                "card"
            ]
        })
        res.send({
            success: true,
            message: 'Successfully stripe payment created',
            clientSecret: paymentIntent.client_secret
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// Save payments data in database
app.post('/api/v1/time-watch/payments', verifyJWT, verifyBuyer, async (req, res) => {
    try {
        const paymentData = req.body
        const payments = await Payments.insertOne(paymentData)
        const id = paymentData.orderId
        const productId = paymentData.productId

        const filterOrder = { _id: ObjectId(id) }
        const filterProduct = { _id: ObjectId(productId) }
        const orderUpdatedDoc = {
            $set: {
                paid: true,
                transactionId: paymentData.transactionId
            }
        }
        const productUpdatedDoc = {
            $set: {
                status: 'sold'
            }
        }
        const updatePayments = await Orders.updateOne(filterOrder, orderUpdatedDoc)
        const updateProductsStatus = await Products.updateOne(filterProduct, productUpdatedDoc)
        res.send({
            success: true,
            message: 'Successfully Add a Payment',
            data: payments
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})

/* =========================
* All Advertisement Api Endpoint
 =========================*/
app.put('/api/v1/time-watch/makeAdvertise/:productId', verifyJWT, verifyBuyer, async(req, res)=>{
    try {
        const productId = req.params.productId;
        const filter = {
            _id: ObjectId(productId)
        }
        const options = {upsert: true};
        const updateDoc = {
            $set: {
                isAdvertise: true
            }
        };
        const products = await Products.updateOne(filter,updateDoc,options)
        res.send({
            success: true,
            message: 'Advertisement Done successfully',
            data: products
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})
// Make Advertisement get 
app.get('/api/v1/time-watch/makeAdvertise', async(req,res)=>{
    try {
        const products = await Products.find({ isAdvertise: true }).toArray()
        const soldProduct = products.filter(product => product.status === 'sold')
        const filterProduct = products.filter(product => !soldProduct.includes(product))
        res.send({
            success: true,
            message: 'Advertisement get data successfully',
            data: filterProduct
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})



/* =========================
* Root and 404 Api Endpoint
 =========================*/
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

/* =========================
* Time Watch listening port
 =========================*/
app.listen(port, () => {
    console.log(`Time Watch listening on port ${port}!`)
})