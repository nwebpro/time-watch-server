const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb')

// Server running port
const port = process.env.PORT || 5000

// Middleware
app.use(express.json())
app.use(cors())



// All Api Endpoint

const uri = `mongodb+srv://${ process.env.BD_USER }:${ process.env.DB_PASS }@cluster0.1ipuukw.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })


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
app.post('/api/v1/time-watch/add-product', async (req, res) => {
    try {
        const addProduct = req.body
        const addProducts = await Products.insertOne(addProduct)
        res.send({
            success: true,
            message: 'Successfully create a new product',
            data: addProducts
        })
    } catch (error) {
        res.send({
            success: false,
            error: error.message
        })
    }
})


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