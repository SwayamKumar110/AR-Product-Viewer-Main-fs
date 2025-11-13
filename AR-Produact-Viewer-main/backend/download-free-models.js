// download-free-models.js - Download free 3D models from reliable sources
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DOWNLOAD_DIR = path.join(__dirname, '../Ar-Product-Viewer/public/model');

// Free 3D model URLs from reliable CDN sources
const freeModels = [
  {
    name: 'Damaged Helmet',
    description: 'Sci-fi damaged helmet 3D model',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb',
    filename: 'damaged_helmet.glb'
  },
  {
    name: 'Boom Box',
    description: 'Retro boom box 3D model',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BoomBox/glTF-Binary/BoomBox.glb',
    filename: 'boombox.glb'
  },
  {
    name: 'Cesium Man',
    description: 'Cesium man character 3D model',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
    filename: 'cesium_man.glb'
  },
  {
    name: 'Duck',
    description: 'Rubber duck 3D model',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb',
    filename: 'duck.glb'
  },
  {
    name: 'Iridescent Dish',
    description: 'Iridescent dish 3D model',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/IridescentDishWithOlives/glTF-Binary/IridescentDishWithOlives.glb',
    filename: 'iridescent_dish.glb'
  },
  {
    name: 'Metal Rough Spheres',
    description: 'Metal rough spheres 3D model',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MetalRoughSpheres/glTF-Binary/MetalRoughSpheres.glb',
    filename: 'metal_rough_spheres.glb'
  }
];

// Create download directory if it doesn't exist
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

async function downloadModel(model) {
  try {
    console.log(`Downloading ${model.name}...`);
    const response = await axios.get(model.url, { 
      responseType: 'arraybuffer',
      timeout: 60000 // 60 second timeout
    });
    
    const filePath = path.join(DOWNLOAD_DIR, model.filename);
    fs.writeFileSync(filePath, response.data);
    console.log(`✅ Downloaded: ${model.filename} (${(response.data.length / 1024 / 1024).toFixed(2)} MB)`);
    return { ...model, success: true };
  } catch (err) {
    console.error(`❌ Failed to download ${model.name}: ${err.message}`);
    return { ...model, success: false };
  }
}

async function downloadAllModels() {
  console.log('Starting download of free 3D models from glTF Sample Models...\n');
  
  const results = [];
  for (const model of freeModels) {
    const result = await downloadModel(model);
    results.push(result);
    // Small delay between downloads
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  console.log('\n--- DOWNLOAD SUMMARY ---');
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successfully downloaded: ${successful.length}`);
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}`);
  }
  
  if (successful.length > 0) {
    console.log('\n--- Products array for seed.js ---');
    const productsArray = successful.map(model => ({
      name: model.name,
      description: model.description,
      modelPath: `/model/${model.filename}`
    }));
    console.log(JSON.stringify(productsArray, null, 2));
    
    // Also include existing models
    const existingModels = [
      {
        name: 'Nissan GTR',
        description: 'High detail 3D model of Nissan GTR sports car',
        modelPath: '/model/Nissan GTR.glb'
      },
      {
        name: 'Scene Model',
        description: 'Detailed 3D scene with multiple textures and materials',
        modelPath: '/model/scene.gltf'
      }
    ];
    
    const allProducts = [...existingModels, ...productsArray];
    console.log('\n--- ALL PRODUCTS (including existing) ---');
    console.log(JSON.stringify(allProducts, null, 2));
  }
}

downloadAllModels().catch(console.error);
