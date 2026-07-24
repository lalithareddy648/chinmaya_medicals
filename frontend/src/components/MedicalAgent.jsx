import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCommentMedical, FaTimes, FaPaperPlane, FaUser, FaRobot } from 'react-icons/fa';

const MedicalAgent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hello! I am your Chinmaya Medicals Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
      }));

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'model', text: data.response }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble connecting to my server.' }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, an error occurred.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 50 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              width: '350px',
              height: '500px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #eee',
              marginBottom: '1rem',
              maxWidth: '90vw'
            }}
          >
            {/* Header */}
            <div style={{
              background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
              padding: '1rem',
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaRobot style={{ fontSize: '1.5rem' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>Medical Assistant</h3>
                  <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.9 }}>Chinmaya Medicals AI</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.5rem' }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '0.5rem',
                    maxWidth: '85%',
                    marginLeft: msg.role === 'user' ? 'auto' : '0',
                    marginRight: msg.role === 'user' ? '0' : 'auto',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    backgroundColor: msg.role === 'user' ? '#e0e7ff' : '#d1fae5',
                    color: msg.role === 'user' ? '#4f46e5' : 'var(--color-primary)'
                  }}>
                    {msg.role === 'user' ? <FaUser size={14} /> : <FaRobot size={14} />}
                  </div>
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '16px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    backgroundColor: msg.role === 'user' ? 'var(--color-primary)' : '#fff',
                    color: msg.role === 'user' ? '#fff' : '#333',
                    borderBottomRightRadius: msg.role === 'user' ? '0' : '16px',
                    borderBottomLeftRadius: msg.role === 'user' ? '16px' : '0',
                    border: msg.role === 'user' ? 'none' : '1px solid #eee'
                  }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5' }}>{msg.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', maxWidth: '85%', marginRight: 'auto' }}>
                   <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, backgroundColor: '#d1fae5', color: 'var(--color-primary)' }}>
                    <FaRobot size={14} />
                  </div>
                  <div style={{ padding: '1rem', borderRadius: '16px', borderBottomLeftRadius: '0', backgroundColor: '#fff', border: '1px solid #eee', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', animation: 'pulse-glow 1.5s infinite' }}></div>
                    <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', animation: 'pulse-glow 1.5s infinite 0.2s' }}></div>
                    <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', animation: 'pulse-glow 1.5s infinite 0.4s' }}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '0.75rem', backgroundColor: '#fff', borderTop: '1px solid #eee' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about medicines, symptoms..."
                  style={{
                    flex: 1, padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', borderRadius: '9999px',
                    border: 'none', outline: 'none', fontSize: '0.875rem'
                  }}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  style={{
                    backgroundColor: 'var(--color-primary)', color: '#fff', padding: '0.75rem', borderRadius: '50%',
                    border: 'none', cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: isLoading || !input.trim() ? 0.5 : 1
                  }}
                >
                  <FaPaperPlane size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: isOpen ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '56px',
          height: '56px',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          color: '#fff',
          borderRadius: '50%',
          boxShadow: '0 4px 14px rgba(21, 101, 192, 0.28)',
          border: 'none',
          cursor: 'pointer',
          marginLeft: 'auto'
        }}
      >
        <FaCommentMedical style={{ fontSize: '1.5rem' }} />
      </motion.button>
    </div>
  );
};

export default MedicalAgent;
