// add-product.js - Quick script to add a single product to the database
// Usage: node add-product.js "Product Name" "Description" "/model/filename.glb"

const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/product.model');

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log('Usage: node add-product.js "Product Name" "Description" "/model/filename.glb"');
  console.log('Example: node add-product.js "My Model" "A cool 3D model" "/model/Nissan GTR.glb"');
  process.exit(1);
}

const [name, description, modelPath] = args;

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(() => {
    console.log('MongoDB connected...');
    
    const newProduct = new Product({
      name,
      description,
      modelPath
    });

    return newProduct.save();
  })
  .then(() => {
    console.log(`✅ Successfully added product: ${name}`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error adding product:', err);
    process.exit(1);
  });

