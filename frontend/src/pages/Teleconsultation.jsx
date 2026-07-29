import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../api';
import { FiVideo, FiMic, FiPhoneOff, FiMessageSquare } from 'react-icons/fi';

const Teleconsultation = () => {
  const [status, setStatus] = useState('waiting'); // waiting, connecting, active, finished
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();
  
  // Fake remote stream
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  useEffect(() => {
    // Start local camera
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      })
      .catch(err => console.log('Camera error (simulated)', err));

    // Simulate flow
    const flowTimeout1 = setTimeout(() => {
      setStatus('connecting');
    }, 3000);

    const flowTimeout2 = setTimeout(() => {
      setStatus('active');
    }, 6000);

    return () => {
      clearTimeout(flowTimeout1);
      clearTimeout(flowTimeout2);
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    let interval;
    if (status === 'active') {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      
      // Auto-end after 10 seconds for demo purposes
      setTimeout(() => {
        handleEndCall();
      }, 15000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const handleEndCall = () => {
    setStatus('finished');
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    
    toast.success("Consultation complete! The doctor's prescription has been added to your cart.", {
      duration: 5000,
      icon: '🩺'
    });

    // Add a random medicine to cart for demonstration
    setTimeout(async () => {
      try {
        const { data: medicines } = await api.get('/api/medicines');
        if (medicines && medicines.length > 0) {
          await api.post('/api/cart', { medicineId: medicines[0]._id, quantity: 1 });
          window.dispatchEvent(new Event('cart-updated'));
        }
      } catch (err) {
        console.error('Failed to add demo medicine', err);
      }
      navigate('/cart');
    }, 2000);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[80vh] bg-gray-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-gray-900/50 backdrop-blur-md flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl">
              👨‍⚕️
            </div>
            <div>
              <h2 className="text-white font-semibold">Dr. A. Sharma</h2>
              <p className="text-gray-400 text-sm">General Physician</p>
            </div>
          </div>
          {status === 'active' && (
            <div className="px-4 py-1 rounded-full bg-red-500/20 text-red-500 border border-red-500/50 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              {formatTime(timer)}
            </div>
          )}
        </div>

        {/* Video Area */}
        <div className="flex-1 relative bg-black">
          <AnimatePresence>
            {status === 'waiting' && (
              <motion.div 
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-white"
              >
                <div className="w-24 h-24 rounded-full border-4 border-gray-600 border-t-blue-500 animate-spin mb-6"></div>
                <h3 className="text-xl font-medium">Waiting for doctor...</h3>
                <p className="text-gray-400 mt-2">You are 1st in the queue.</p>
              </motion.div>
            )}

            {status === 'connecting' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-white bg-blue-900/20"
              >
                <div className="w-32 h-32 relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping"></div>
                  <div className="absolute inset-2 rounded-full bg-blue-500 flex items-center justify-center text-4xl">👨‍⚕️</div>
                </div>
                <h3 className="text-xl font-medium animate-pulse">Connecting securely...</h3>
              </motion.div>
            )}

            {status === 'active' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0"
              >
                {/* Simulated Remote Doctor Video (Placeholder) */}
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center relative">
                  <div className="text-9xl opacity-20">👨‍⚕️</div>
                  <p className="absolute bottom-10 text-white/50 bg-black/30 px-4 py-2 rounded-xl backdrop-blur-md">
                    Doctor Video Feed Active
                  </p>
                </div>
              </motion.div>
            )}
            
            {status === 'finished' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex flex-col items-center justify-center text-white bg-green-900/20"
              >
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-4xl mb-4">
                  ✓
                </div>
                <h3 className="text-2xl font-bold mb-2">Consultation Ended</h3>
                <p className="text-gray-300">Generating digital prescription...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Local Video Picture-in-Picture */}
          <div className="absolute bottom-6 right-6 w-32 md:w-48 aspect-[3/4] bg-gray-800 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl z-20">
            <video 
              ref={localVideoRef}
              autoPlay 
              muted 
              className="w-full h-full object-cover transform scale-x-[-1]" 
            />
          </div>
        </div>

        {/* Controls */}
        <div className="h-24 bg-gray-900/80 backdrop-blur-md flex items-center justify-center gap-6 px-4 z-10">
          <button className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition">
            <FiMic size={20} />
          </button>
          <button className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition">
            <FiVideo size={20} />
          </button>
          <button 
            onClick={status === 'active' ? handleEndCall : () => navigate(-1)}
            className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition shadow-[0_0_15px_rgba(220,38,38,0.5)]"
          >
            <FiPhoneOff size={24} />
          </button>
          <button className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-white hover:bg-gray-600 transition">
            <FiMessageSquare size={20} />
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default Teleconsultation;
