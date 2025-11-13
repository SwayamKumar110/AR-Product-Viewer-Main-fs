// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection ---
const uri = process.env.MONGO_URI;
mongoose.connect(uri)
  .then(() => {
    console.log('MongoDB connection established successfully! 🚀');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
// ----------------------------

// --- API ROUTES ---
const productRouter = require('./routes/products');
app.use('/api/products', productRouter);

app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from the backend! 👋' });
});
// ------------------

// --- Start the server using HTTP (simpler for local development) ---
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
