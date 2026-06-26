import React, { useEffect, useRef } from 'react';

const LiveLogs = ({ logs }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-panel live-logs animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="logs-header">
        <h2>
          Live Terminal <span className="live-indicator"></span>
        </h2>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time event stream</span>
      </div>
      
      <div className="logs-container" ref={containerRef}>
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>Waiting for scan to start...</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`log-line log-${log.type}`}>
              <span className="log-time">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveLogs;
