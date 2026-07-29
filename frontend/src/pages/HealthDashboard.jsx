import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import { toast } from 'react-hot-toast';
import { FiClock, FiCalendar, FiCheck, FiX, FiActivity, FiRefreshCw } from 'react-icons/fi';

const HealthDashboard = () => {
  const [activeTab, setActiveTab] = useState('reminders');
  const [reminders, setReminders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reminders') {
        const { data } = await api.get('/api/health/reminders');
        setReminders(data);
      } else {
        const { data } = await api.get('/api/health/subscriptions');
        setSubscriptions(data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const deleteReminder = async (id) => {
    try {
      await api.delete(`/api/health/reminders/${id}`);
      setReminders(reminders.filter(r => r.id !== id));
      toast.success('Reminder removed');
    } catch (error) {
      toast.error('Failed to remove reminder');
    }
  };

  const toggleSubscriptionStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
      const { data } = await api.put(`/api/health/subscriptions/${id}/status`, { status: newStatus });
      setSubscriptions(subscriptions.map(s => s.id === id ? data : s));
      toast.success(`Subscription ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update subscription');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      {/* Vibrant Header Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white pt-12 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center gap-5 mb-2">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/30 shadow-xl">
              <FiActivity size={36} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-1">Health Dashboard</h1>
              <p className="text-blue-100 text-lg">Manage your daily pill routines and automatic refills</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl -mt-10">
        {/* Floating Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-2 flex gap-2 mb-10 max-w-md mx-auto relative border border-gray-100">
          <button
            className={`flex-1 py-3 px-4 font-semibold text-sm rounded-xl transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'reminders' ? 'text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('reminders')}
          >
            <FiClock size={18} /> Daily Reminders
            {activeTab === 'reminders' && (
              <motion.div layoutId="tab-bg" className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl -z-10 shadow-md" />
            )}
          </button>
          <button
            className={`flex-1 py-3 px-4 font-semibold text-sm rounded-xl transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'subscriptions' ? 'text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('subscriptions')}
          >
            <FiRefreshCw size={18} /> Auto-Refills
            {activeTab === 'subscriptions' && (
              <motion.div layoutId="tab-bg" className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl -z-10 shadow-md" />
            )}
          </button>
        </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'reminders' && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reminders.length === 0 ? (
                <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiClock className="text-3xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Reminders</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">To set a reminder, go to any medicine's detail page and click the "Set Reminder" button.</p>
                </div>
              ) : (
                reminders.map((reminder, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={reminder.id} 
                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex justify-between items-start mb-6 pt-2">
                      <div className="flex gap-4 items-center w-full">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm shrink-0 bg-gray-50 p-2">
                          <img src={reminder.medicine_image} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg line-clamp-1 mb-1">{reminder.medicine_name}</h3>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                            {reminder.frequency}
                          </span>
                        </div>
                        <button 
                          onClick={() => deleteReminder(reminder.id)} 
                          className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all shrink-0"
                          title="Delete Reminder"
                        >
                          <FiX size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-4 flex items-center gap-4 border border-blue-100/50">
                      <div className="bg-white w-12 h-12 rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                        <FiClock size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-500/80 mb-0.5">Time to take</p>
                        <p className="text-2xl font-black text-blue-900">{reminder.reminder_time}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="grid gap-6 lg:grid-cols-2">
              {subscriptions.length === 0 ? (
                <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiRefreshCw className="text-3xl text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Auto-Refills</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">To start an auto-refill subscription, add items to your Cart and click the "Subscribe" button.</p>
                </div>
              ) : (
                subscriptions.map((sub, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={sub.id} 
                    className={`bg-white p-6 rounded-3xl shadow-sm border transition-all duration-300 hover:shadow-xl flex flex-col sm:flex-row gap-6 ${sub.status === 'Active' ? 'border-indigo-100' : 'border-gray-200 opacity-80 grayscale-[20%]'}`}
                  >
                    <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-sm shrink-0 bg-gray-50 p-2 flex items-center justify-center">
                      <img src={sub.medicine_image} alt="" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <div className="pr-4">
                          <h3 className="font-extrabold text-gray-900 text-xl leading-tight mb-1">{sub.medicine_name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                            <span className="bg-gray-100 px-2 py-0.5 rounded-md">Qty: {sub.quantity}</span>
                            <span>•</span>
                            <span>Every {sub.frequency_days} Days</span>
                          </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide uppercase ${sub.status === 'Active' ? 'bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-md shadow-green-500/20' : 'bg-gray-100 text-gray-500'}`}>
                          {sub.status}
                        </span>
                      </div>
                      
                      <div className="mt-auto pt-5 border-t border-gray-100/80 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${sub.status === 'Active' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'}`}>
                            <FiCalendar size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-0.5">Next Refill</p>
                            <p className={`font-bold ${sub.status === 'Active' ? 'text-gray-900' : 'text-gray-500'}`}>
                              {new Date(sub.next_refill_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleSubscriptionStatus(sub.id, sub.status)}
                          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${sub.status === 'Active' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                        >
                          {sub.status === 'Active' ? 'Pause Refills' : 'Resume'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>
      )}
      </div>
    </div>
  );
};

export default HealthDashboard;
