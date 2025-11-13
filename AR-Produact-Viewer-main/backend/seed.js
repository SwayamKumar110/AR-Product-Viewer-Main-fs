// seed.js - Script to populate the database with products
const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./models/product.model');

// Products to add to the database
// All models are different - each uses a unique 3D model file
const products = [
  {
    name: 'Nissan GTR',
    description: 'High detail 3D model of Nissan GTR sports car',
    modelPath: '/model/Nissan GTR.glb'
  },
  {
    name: 'Scene Model',
    description: 'Detailed 3D scene with multiple textures and materials',
    modelPath: '/model/scene.gltf'
  },
  {
    name: 'Damaged Helmet',
    description: 'Sci-fi damaged helmet 3D model',
    modelPath: '/model/damaged_helmet.glb'
  },
  {
    name: 'Boom Box',
    description: 'Retro boom box 3D model',
    modelPath: '/model/boombox.glb'
  },
  {
    name: 'Cesium Man',
    description: 'Cesium man character 3D model',
    modelPath: '/model/cesium_man.glb'
  },
  {
    name: 'Duck',
    description: 'Rubber duck 3D model',
    modelPath: '/model/duck.glb'
  },
  {
    name: 'Iridescent Dish',
    description: 'Iridescent dish 3D model',
    modelPath: '/model/iridescent_dish.glb'
  },
  {
    name: 'Metal Rough Spheres',
    description: 'Metal rough spheres 3D model',
    modelPath: '/model/metal_rough_spheres.glb'
  }
];

// Connect to MongoDB and seed the database
const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(() => {
    console.log('MongoDB connected for seeding...');
    
    // Clear existing products (optional - comment out if you want to keep existing data)
    return Product.deleteMany({});
  })
  .then(() => {
    console.log('Cleared existing products (if any)...');
    
    // Insert new products
    return Product.insertMany(products);
  })
  .then(() => {
    console.log('✅ Successfully seeded database with products!');
    console.log(`Added ${products.length} products:`);
    products.forEach(p => console.log(`  - ${p.name}`));
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  });

