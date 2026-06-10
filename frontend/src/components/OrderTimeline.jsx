import React from 'react';

const OrderTimeline = ({ status }) => {
  const steps = ['Placed', 'Confirmed', 'Packed', 'Out For Delivery', 'Delivered'];
  const currentStepIndex = steps.indexOf(status);

  // Calculate percentage of progress width
  const progressPercent = currentStepIndex >= 0 
    ? `${(currentStepIndex / (steps.length - 1)) * 100}%` 
    : '0%';

  return (
    <div style={{ margin: '2.5rem 0 1.5rem 0' }}>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: '600' }}>
        Delivery Progress Status: <span style={{ color: 'var(--color-primary)' }}>{status}</span>
      </div>
      <div className="timeline-container">
        <div className="timeline-line-background"></div>
        <div className="timeline-line-progress" style={{ width: progressPercent }}></div>
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;

          let stepClass = 'timeline-step';
          if (isCompleted) stepClass += ' completed';
          if (isActive) stepClass += ' active';

          return (
            <div className={stepClass} key={step}>
              <div className="timeline-node">
                {isCompleted ? '✓' : idx + 1}
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
