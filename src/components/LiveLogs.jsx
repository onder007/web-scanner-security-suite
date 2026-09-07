import React, { useEffect, useRef, useState } from 'react';

const LiveLogs = ({ logs = [] }) => {
  const containerRef = useRef(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (containerRef.current && !isCollapsed) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, isCollapsed]);

  return (
    <div className="glass-panel live-logs animate-slide-up" style={{ animationDelay: '0.1s', padding: '10px 14px' }}>
      <div 
        className="logs-header" 
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', userSelect: 'none' }}
      >
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <span className="live-pulse"></span>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Live Event Stream
          </h2>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            ({logs.length} events)
          </span>
        </div>

        <button 
          className="btn btn-outline" 
          style={{ fontSize: '0.6875rem', padding: '2px 8px', height: '22px' }}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? 'Show Terminal' : 'Collapse'}
        </button>
      </div>
      
      {!isCollapsed && (
        <div className="logs-container" ref={containerRef} style={{ marginTop: '8px', maxHeight: '110px' }}>
          {logs.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '8px', fontSize: '0.75rem' }}>
              Waiting for crawler to start...
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`log-line log-${log.type || 'info'}`} style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                <span className="log-time" style={{ color: 'var(--text-muted)', marginRight: '6px' }}>
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LiveLogs;
