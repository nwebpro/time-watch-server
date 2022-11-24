const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

// Server running port
const port = process.env.PORT || 5000

// Middleware
app.use(express.json())
app.use(cors())




// All Api Endpoint




// Root api import and endpoint
app.get('/api/v1/time-watch', (req, res) => {
    res.send({
        status: '200',
        message: `Time Watch Server!`,
        version: '1.0.0',
        author: `Ab Naeem`,
    })
})

// Jerin's Parlour 404 not found api endpoint
app.all('*', (req, res) => {
    res.send({
        status: '404',
        message: `No route found!`,
    })
})

// Jerin's parlour listening port
app.listen(port, () => {
    console.log(`Time Watch listening on port ${port}!`)
})