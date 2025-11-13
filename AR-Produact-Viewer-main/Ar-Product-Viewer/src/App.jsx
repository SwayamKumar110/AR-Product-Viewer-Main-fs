// src/App.jsx

import React, { Suspense, useEffect, useState, useRef, forwardRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations, Center } from '@react-three/drei';
import { ARButton, XR, useXR, useHitTest, Interactive } from '@react-three/xr';
import axios from 'axios';
import './App.css';

// 1. Model component with scale support
function Model({ modelPath, scale = 1, onLoad, ...props }) {
  const { scene, animations } = useGLTF(modelPath);
  const { actions } = useAnimations(animations, scene);
  
  useEffect(() => {
    Object.values(actions).forEach(action => {
      action.play();
      action.paused = true;
    });
  }, [actions]);
  
  useEffect(() => {
    if (onLoad) onLoad();
  }, [scene, onLoad]);
  
  return <primitive object={scene} scale={scale} {...props} />;
}

// 2. Reticle component (unchanged)
const Reticle = forwardRef((props, ref) => {
  return (
    <mesh ref={ref}>
      <ringGeometry args={[0.15, 0.2, 32]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
});
Reticle.displayName = 'Reticle';

// 3. Scene component with scale support
function Scene({ modelPath, placedPosition, setPlacedPosition, scale = 1, onModelLoad }) {
  const { isPresenting } = useXR();
  const reticleRef = useRef();

  useHitTest((hitMatrix) => {
    if (!placedPosition && reticleRef.current) {
      hitMatrix.decompose(
        reticleRef.current.position,
        reticleRef.current.quaternion,
        reticleRef.current.scale
      );
    }
  });

  const onSelect = () => {
    if (!placedPosition && reticleRef.current) {
      const position = reticleRef.current.position.clone();
      setPlacedPosition(position);
    }
  };

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} />
      <Suspense fallback={null}>
        {!isPresenting && (
          <>
            <Model 
              modelPath={modelPath} 
              position={[0, -0.5, 0]} 
              scale={scale}
              onLoad={onModelLoad}
            />
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={10}
            />
          </>
        )}
        {isPresenting && (
          <>
            {placedPosition ? (
              <group position={placedPosition}>
                <Model modelPath={modelPath} scale={scale} />
              </group>
            ) : (
              <Interactive onSelect={onSelect}>
                <Reticle ref={reticleRef} />
              </Interactive>
            )}
          </>
        )}
      </Suspense>
    </>
  );
}

// Loading Spinner Component
function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Loading 3D Model...</p>
    </div>
  );
}

// Product Info Panel Component
function ProductInfoPanel({ product, isVisible, onClose }) {
  if (!isVisible || !product) return null;
  
  return (
    <div className="product-info-panel">
      <button className="close-info-btn" onClick={onClose}>×</button>
      <h3>{product.name}</h3>
      <p className="product-description">{product.description}</p>
      <div className="product-meta">
        <div className="meta-item">
          <span className="meta-label">Model Type:</span>
          <span className="meta-value">{product.modelPath.split('.').pop().toUpperCase()}</span>
        </div>
        {product.createdAt && (
          <div className="meta-item">
            <span className="meta-label">Added:</span>
            <span className="meta-value">{new Date(product.createdAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Search Bar Component
function SearchBar({ onSearch, productCount }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };
  
  return (
    <div className="search-container">
      <input
        type="text"
        placeholder={`🔍 Search ${productCount} products...`}
        value={searchTerm}
        onChange={handleSearch}
        className="search-input"
      />
      {searchTerm && (
        <button className="clear-search" onClick={() => { setSearchTerm(''); onSearch(''); }}>
          ×
        </button>
      )}
    </div>
  );
}

// Model Controls Component
function ModelControls({ scale, onScaleChange, onReset, onFullscreen }) {
  return (
    <div className="model-controls">
      <div className="control-group">
        <label>Scale: {scale.toFixed(1)}x</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={scale}
          onChange={(e) => onScaleChange(parseFloat(e.target.value))}
          className="scale-slider"
        />
      </div>
      <div className="control-buttons">
        <button className="control-btn" onClick={onReset} title="Reset View">
          🔄 Reset
        </button>
        <button className="control-btn" onClick={onFullscreen} title="Toggle Fullscreen">
          ⛶ Fullscreen
        </button>
      </div>
    </div>
  );
}

// AR Scale Controls Component
function ARScaleControls({ scale, onScaleChange, isVisible }) {
  if (!isVisible) return null;
  
  return (
    <div className="ar-scale-controls">
      <button 
        className="scale-btn minus" 
        onClick={() => onScaleChange(Math.max(0.5, scale - 0.1))}
      >
        −
      </button>
      <span className="scale-display">{scale.toFixed(1)}x</span>
      <button 
        className="scale-btn plus" 
        onClick={() => onScaleChange(Math.min(2, scale + 0.1))}
      >
        +
      </button>
    </div>
  );
}

// 4. App component (This is where all the changes are)
function App() {
  const [placedPosition, setPlacedPosition] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [error, setError] = useState(null);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [modelScale, setModelScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const canvasRef = useRef(null);

  // Fetch products
  useEffect(() => {
    setIsLoading(true);
    axios.get('http://localhost:5001/api/products')
      .then(response => {
        console.log('Products fetched:', response.data);
        if (response.data.length === 0) {
          setError('No products found in database.');
        } else {
          setProducts(response.data);
          setFilteredProducts(response.data);
          setCurrentProduct(response.data[0]);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching products:', error);
        setError('Failed to fetch products. Check backend.');
        setIsLoading(false);
      });
  }, []);

  // Handle search
  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
    if (filtered.length > 0 && !filtered.find(p => p._id === currentProduct?._id)) {
      setCurrentProduct(filtered[0]);
    }
  };

  // Handle model load
  const handleModelLoad = () => {
    setIsLoading(false);
  };

  // Reset loading when product changes
  useEffect(() => {
    if (currentProduct) {
      setIsLoading(true);
    }
  }, [currentProduct?.modelPath]);

  // Handle scale change
  const handleScaleChange = (newScale) => {
    setModelScale(newScale);
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasRef.current?.requestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        setShowInfoPanel(false);
        if (document.fullscreenElement) {
          document.exitFullscreen();
        }
      }
      if (e.key === 'i' || e.key === 'I') {
        if (currentProduct) setShowInfoPanel(!showInfoPanel);
      }
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentProduct, showInfoPanel]);

  if (error) {
    return (
      <div className="center-message">
        <h1>Error: {error}</h1>
      </div>
    );
  }

  if (!currentProduct && !isLoading) {
    return (
      <div className="center-message">
        <h1>No products available</h1>
      </div>
    );
  }

  // Note: isPresenting will be handled inside Scene component

  return (
    <>
      {/* App Header */}
      <div className="app-header">
        <span>🎨 AR Product Viewer</span>
        <span className="product-count">{filteredProducts.length} products</span>
      </div>

      {/* Search Bar */}
      <SearchBar onSearch={handleSearch} productCount={products.length} />

      {/* Product Info Panel */}
      <ProductInfoPanel 
        product={currentProduct} 
        isVisible={showInfoPanel}
        onClose={() => setShowInfoPanel(false)}
      />

      {/* Info Button */}
      {currentProduct && (
        <button 
          className="info-button"
          onClick={() => setShowInfoPanel(!showInfoPanel)}
          title="Product Info (Press I)"
        >
          ℹ️
        </button>
      )}

      {/* AR Button */}
      <ARButton sessionInit={{ requiredFeatures: ['hit-test'] }} />
      
      {/* Reset Button */}
      <button 
        className="reset-button"
        onClick={() => setPlacedPosition(null)}
        title="Reset AR Placement"
      >
        🔄 Reset
      </button>

      {/* Model Controls - Hidden when in AR mode with placed model */}
      {!placedPosition && (
        <ModelControls
          scale={modelScale}
          onScaleChange={handleScaleChange}
          onReset={() => {
            setModelScale(1);
            setPlacedPosition(null);
          }}
          onFullscreen={toggleFullscreen}
        />
      )}

      {/* AR Scale Controls - Shown when in AR mode with placed model */}
      {placedPosition && (
        <ARScaleControls
          scale={modelScale}
          onScaleChange={handleScaleChange}
          isVisible={true}
        />
      )}

      {/* Product Selector - Vibrant UI */}
      <div className="product-selector">
        {filteredProducts.length === 0 ? (
          <div className="no-results">No products found</div>
        ) : (
          filteredProducts.map((product) => (
            <button
              key={product._id}
              className={`product-button ${currentProduct?._id === product._id ? 'active' : ''}`}
              onClick={() => {
                setCurrentProduct(product);
                setPlacedPosition(null);
                setIsLoading(true);
                setModelScale(1);
              }}
            >
              {product.name}
            </button>
          ))
        )}
      </div>

      {/* Loading Spinner */}
      {isLoading && <LoadingSpinner />}

      {/* 3D Canvas Container */}
      {currentProduct?.modelPath && (
        <div id="canvas-container" ref={canvasRef}>
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <XR>
              <Scene 
                modelPath={currentProduct.modelPath} 
                placedPosition={placedPosition} 
                setPlacedPosition={setPlacedPosition}
                scale={modelScale}
                onModelLoad={handleModelLoad}
              />
            </XR>
          </Canvas>
        </div>
      )}
    </>
  );
}

export default App;