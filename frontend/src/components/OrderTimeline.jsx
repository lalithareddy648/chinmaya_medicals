import React from 'react';

const STATUS_CONFIG = {
  'Placed':           { icon: '📋', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.3)',  msg: 'Your order has been received and is being reviewed.' },
  'Confirmed':        { icon: '✅', color: '#00f2fe', bg: 'rgba(0,242,254,0.08)',    border: 'rgba(0,242,254,0.3)',    msg: 'Great news! Your order has been confirmed by the pharmacy.' },
  'Packed':           { icon: '📦', color: '#4facfe', bg: 'rgba(79,172,254,0.08)',   border: 'rgba(79,172,254,0.3)',   msg: 'Your medicines are being carefully packed and sealed.' },
  'Out For Delivery': { icon: '🚚', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.3)',   msg: 'Your order is out for delivery! Expect it within a few hours.' },
  'Delivered':        { icon: '🎉', color: '#10b981', bg: 'rgba(16,185,129,0.08)',   border: 'rgba(16,185,129,0.3)',   msg: 'Order delivered successfully. Thank you for choosing Chinmaya Medicals!' },
};

const STEPS = ['Placed', 'Confirmed', 'Packed', 'Out For Delivery', 'Delivered'];

const OrderTimeline = ({ status }) => {
  const currentStepIndex = STEPS.indexOf(status);
  const config = STATUS_CONFIG[status] || STATUS_CONFIG['Placed'];
  const progressPercent = currentStepIndex >= 0
    ? `${(currentStepIndex / (STEPS.length - 1)) * 100}%`
    : '0%';

  return (
    <div>
      {/* ── Status Banner ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem 1.5rem',
        borderRadius: '14px',
        background: config.bg,
        border: `1px solid ${config.border}`,
        marginBottom: '2rem',
        animation: 'fadeSlideIn 0.4s ease'
      }}>
        <span style={{ fontSize: '2rem' }}>{config.icon}</span>
        <div>
          <div style={{ fontWeight: '700', fontSize: '1.05rem', color: config.color }}>
            Status: {status}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            {config.msg}
          </div>
        </div>
      </div>

      {/* ── Step Progress Bar ── */}
      <div className="timeline-container">
        <div className="timeline-line-background" />
        <div className="timeline-line-progress" style={{ width: progressPercent }} />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isActive    = idx === currentStepIndex;
          let cls = 'timeline-step';
          if (isCompleted) cls += ' completed';
          if (isActive)    cls += ' active';

          const stepIcon = STEPS[idx] === 'Placed'           ? '📋'
                         : STEPS[idx] === 'Confirmed'        ? '✅'
                         : STEPS[idx] === 'Packed'           ? '📦'
                         : STEPS[idx] === 'Out For Delivery' ? '🚚'
                         : '🎉';

          return (
            <div className={cls} key={step}>
              <div className="timeline-node">
                {isCompleted ? '✓' : isActive ? stepIcon : idx + 1}
              </div>
              <div className="timeline-label">{step}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;
