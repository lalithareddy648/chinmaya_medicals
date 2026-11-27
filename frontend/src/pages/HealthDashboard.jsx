import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api, { resolveAssetUrl } from '../api';
import { toast } from 'react-hot-toast';
import {
  FiActivity,
  FiCalendar,
  FiCheck,
  FiClock,
  FiRefreshCw,
  FiX
} from 'react-icons/fi';
import './HealthDashboard.css';

const HealthDashboard = () => {
  const [activeTab, setActiveTab] = useState('reminders');
  const [reminders, setReminders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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
  }, [activeTab]);

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, [fetchData]);

  const deleteReminder = async (id) => {
    try {
      await api.delete(`/api/health/reminders/${id}`);
      setReminders(reminders.filter(r => r.id !== id));
      toast.success('Reminder removed');
    } catch {
      toast.error('Failed to remove reminder');
    }
  };

  const toggleSubscriptionStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
      const { data } = await api.put(`/api/health/subscriptions/${id}/status`, { status: newStatus });
      setSubscriptions(subscriptions.map(s => s.id === id ? data : s));
      toast.success(`Subscription ${newStatus}`);
    } catch {
      toast.error('Failed to update subscription');
    }
  };

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === 'Active').length;
  const pausedSubscriptions = subscriptions.length - activeSubscriptions;

  return (
    <div className="health-dashboard">
      <header className="health-dashboard__header">
        <div className="health-dashboard__heading">
          <span className="health-dashboard__eyebrow">
            <FiActivity aria-hidden="true" />
            Your wellness
          </span>
          <h1>Health Dashboard</h1>
          <p>Keep your medicine routine and refills on track.</p>
        </div>
      </header>

      <nav className="health-dashboard__tabs" aria-label="Health dashboard sections">
        <button
          type="button"
          className={`health-dashboard__tab ${activeTab === 'reminders' ? 'is-active' : ''}`}
          onClick={() => {
            if (activeTab !== 'reminders') setLoading(true);
            setActiveTab('reminders');
          }}
          aria-pressed={activeTab === 'reminders'}
        >
          <FiClock aria-hidden="true" />
          Daily Reminders
          <span className="health-dashboard__tab-count">{reminders.length}</span>
        </button>
        <button
          type="button"
          className={`health-dashboard__tab ${activeTab === 'subscriptions' ? 'is-active' : ''}`}
          onClick={() => {
            if (activeTab !== 'subscriptions') setLoading(true);
            setActiveTab('subscriptions');
          }}
          aria-pressed={activeTab === 'subscriptions'}
        >
          <FiRefreshCw aria-hidden="true" />
          Auto-Refills
          <span className="health-dashboard__tab-count">{subscriptions.length}</span>
        </button>
      </nav>

      {loading ? (
        <div className="health-dashboard__loading" role="status" aria-label="Loading health information">
          <span className="health-dashboard__spinner" />
        </div>
      ) : (
        <motion.section
          key={activeTab}
          className="health-dashboard__content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          aria-live="polite"
        >
          {activeTab === 'reminders' ? (
            <>
              <div className="health-dashboard__section-heading">
                <div>
                  <h2>Today's reminders</h2>
                  <p>Your medicine schedule, all in one place.</p>
                </div>
                <span className="health-dashboard__section-count">
                  {reminders.length} {reminders.length === 1 ? 'reminder' : 'reminders'}
                </span>
              </div>
              {reminders.length === 0 ? (
                <div className="health-dashboard__empty">
                  <span className="health-dashboard__empty-icon">
                    <FiClock aria-hidden="true" />
                  </span>
                  <h3>No reminders yet</h3>
                  <p>When you set a reminder from a medicine detail page, it will appear here.</p>
                </div>
              ) : (
                <div className="health-dashboard__grid">
                  {reminders.map((reminder, i) => (
                    <motion.article
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      key={reminder.id}
                      className="health-dashboard__card"
                    >
                      <div className="health-dashboard__card-top">
                        <div className="health-dashboard__medicine-image">
                          <img src={resolveAssetUrl(reminder.medicine_image)} alt="" />
                        </div>
                        <div className="health-dashboard__medicine-info">
                          <h3>{reminder.medicine_name}</h3>
                          <span className="health-dashboard__badge">{reminder.frequency}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteReminder(reminder.id)}
                          className="health-dashboard__icon-button"
                          title="Delete reminder"
                          aria-label={`Delete reminder for ${reminder.medicine_name}`}
                        >
                          <FiX aria-hidden="true" />
                        </button>
                      </div>
                      <div className="health-dashboard__detail">
                        <span className="health-dashboard__detail-icon">
                          <FiClock aria-hidden="true" />
                        </span>
                        <div>
                          <span className="health-dashboard__detail-label">Time to take</span>
                          <strong>{reminder.reminder_time}</strong>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="health-dashboard__section-heading">
                <div>
                  <h2>Upcoming refills</h2>
                  <p>Manage your recurring medicine orders.</p>
                </div>
                <span className="health-dashboard__section-count">
                  {activeSubscriptions} {activeSubscriptions === 1 ? 'active refill' : 'active refills'}
                </span>
              </div>
              <div className="health-dashboard__summary-grid">
                <article className="health-dashboard__summary-card">
                  <span className="health-dashboard__summary-icon"><FiRefreshCw aria-hidden="true" /></span>
                  <div>
                    <span>Active auto-refills</span>
                    <strong>{activeSubscriptions}</strong>
                  </div>
                </article>
                <article className="health-dashboard__summary-card">
                  <span className="health-dashboard__summary-icon health-dashboard__summary-icon--muted"><FiCheck aria-hidden="true" /></span>
                  <div>
                    <span>Paused plans</span>
                    <strong>{pausedSubscriptions}</strong>
                  </div>
                </article>
              </div>
              {subscriptions.length === 0 ? (
                <div className="health-dashboard__empty">
                  <span className="health-dashboard__empty-icon">
                    <FiRefreshCw aria-hidden="true" />
                  </span>
                  <h3>No auto-refills yet</h3>
                  <p>When you subscribe to a medicine from your cart, your refill plan will show up here.</p>
                </div>
              ) : (
                <div className="health-dashboard__grid health-dashboard__grid--refills">
                  {subscriptions.map((sub, i) => (
                    <motion.article
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      key={sub.id}
                      className={`health-dashboard__card health-dashboard__refill-card ${sub.status !== 'Active' ? 'is-paused' : ''}`}
                    >
                      <div className="health-dashboard__refill-main">
                        <div className="health-dashboard__medicine-image health-dashboard__medicine-image--large">
                          <img src={resolveAssetUrl(sub.medicine_image)} alt="" />
                        </div>
                        <div className="health-dashboard__medicine-info">
                          <div className="health-dashboard__refill-title">
                            <h3>{sub.medicine_name}</h3>
                            <span className={`health-dashboard__status ${sub.status === 'Active' ? 'is-active' : ''}`}>
                              {sub.status}
                            </span>
                          </div>
                          <p className="health-dashboard__refill-meta">
                            Quantity {sub.quantity} <span aria-hidden="true">·</span> Every {sub.frequency_days} days
                          </p>
                        </div>
                      </div>
                      <div className="health-dashboard__refill-footer">
                        <div className="health-dashboard__next-refill">
                          <span className="health-dashboard__detail-icon">
                            <FiCalendar aria-hidden="true" />
                          </span>
                          <div>
                            <span className="health-dashboard__detail-label">Next refill</span>
                            <strong>
                              {new Date(sub.next_refill_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </strong>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSubscriptionStatus(sub.id, sub.status)}
                          className="health-dashboard__action"
                        >
                          {sub.status === 'Active' ? 'Pause refills' : 'Resume refills'}
                        </button>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.section>
      )}
    </div>
  );
};

export default HealthDashboard;
