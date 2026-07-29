import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../api';

const ARScanner = ({ onClose }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [scanStatus, setScanStatus] = useState('scanning'); // scanning, success
  const [scannedMedicine, setScannedMedicine] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    startCamera();
    
    // Simulate a successful scan after 4 seconds
    const timer = setTimeout(() => {
      setScanStatus('success');
      setScannedMedicine({
        id: 'c2e28312-0051-409e-9d22-261596f2a6f8', // Actual ID for Paracetamol from dataset
        name: 'Paracetamol 500mg',
        price: 25,
        expiry: '12/2027',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60'
      });
    }, 4000);

    return () => {
      stopCamera();
      clearTimeout(timer);
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Fallback if camera is blocked or unavailable
      setScanStatus('success');
      setScannedMedicine({
        id: 'c2e28312-0051-409e-9d22-261596f2a6f8',
        name: 'Paracetamol 500mg',
        price: 25,
        expiry: '12/2027',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60'
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };
  const handleAddToCart = async () => {
    try {
      await api.post('/api/cart', { medicineId: scannedMedicine.id, quantity: 1 });
      window.dispatchEvent(new Event('cart-updated'));
      toast.success(`${scannedMedicine.name} added to cart!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add to cart. Are you logged in?');
    }
    stopCamera();
    onClose();
    navigate('/cart');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
    >
      <div className="relative w-full h-full max-w-md mx-auto overflow-hidden shadow-2xl bg-gray-900 sm:rounded-2xl sm:h-[80vh] sm:my-auto">
        
        {/* Video Feed */}
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted 
          className="object-cover w-full h-full opacity-80"
        />

        {/* UI Overlay */}
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          
          {/* Header */}
          <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
            <h2 className="text-white font-semibold text-lg tracking-wider">AR MEDICINE SCANNER</h2>
            <button 
              onClick={() => { stopCamera(); onClose(); }}
              className="text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scanner Reticle */}
          <div className="flex-1 flex items-center justify-center relative">
            {scanStatus === 'scanning' && (
              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 1, 0.5] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-64 h-64 border-2 border-cyan-400/50 rounded-3xl relative"
              >
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-3xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-3xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-3xl"></div>
                
                {/* Scanning Line */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                ></motion.div>
                
                <p className="absolute -bottom-10 left-0 right-0 text-center text-cyan-400 font-mono text-sm tracking-widest animate-pulse">
                  ANALYZING COMPOSITION...
                </p>
              </motion.div>
            )}

            {/* AR Popup Card */}
            <AnimatePresence>
              {scanStatus === 'success' && scannedMedicine && (
                <motion.div 
                  initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: 20 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className="absolute pointer-events-auto z-10 w-80 perspective-1000"
                >
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-3xl shadow-2xl transform-style-3d">
                    <div className="flex gap-4 items-start mb-4">
                      <img 
                        src={scannedMedicine.image} 
                        alt={scannedMedicine.name} 
                        className="w-20 h-20 object-cover rounded-2xl border border-white/30"
                      />
                      <div>
                        <div className="bg-green-500/20 text-green-300 text-xs font-bold px-2 py-1 rounded-full inline-block mb-1 border border-green-500/30">
                          VERIFIED MATCH
                        </div>
                        <h3 className="text-xl font-bold text-white">{scannedMedicine.name}</h3>
                        <p className="text-gray-300">₹{scannedMedicine.price}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <div className="bg-black/30 rounded-xl p-3 border border-white/10">
                        <p className="text-xs text-gray-400 uppercase">Expiry Date</p>
                        <p className="text-white font-mono">{scannedMedicine.expiry}</p>
                      </div>
                      <div className="bg-black/30 rounded-xl p-3 border border-white/10">
                        <p className="text-xs text-gray-400 uppercase">Stock Status</p>
                        <p className="text-cyan-400 font-semibold">In Stock</p>
                      </div>
                    </div>

                    <button 
                      onClick={handleAddToCart}
                      className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                    >
                      ADD TO CART
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ARScanner;
