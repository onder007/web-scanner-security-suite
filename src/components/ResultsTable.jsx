import React, { useState, useMemo } from 'react';

const ResultsTable = ({ results }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      if (filter === '404' && r.statusCode !== 404) return false;
      if (filter === '500' && r.statusCode < 500) return false;
      if (filter === 'redirect' && (r.statusCode < 300 || r.statusCode >= 400)) return false;
      if (filter === 'success' && r.statusCode !== 200) return false;
      if (filter === 'error' && r.statusCode < 400) return false;

      if (search && !r.url.toLowerCase().includes(search.toLowerCase())) return false;

      return true;
    });
  }, [results, filter, search]);

  const exportCSV = () => {
    if (results.length === 0) return;
    const headers = ['URL', 'Status Code', 'Status Text', 'Response Time (ms)', 'Content Type', 'Referer', 'Redirect Dest'];
    const rows = filteredResults.map(r => [
      r.url, 
      r.statusCode, 
      r.statusText, 
      r.responseTime, 
      r.contentType, 
      r.referer || '', 
      r.redirectDestination || ''
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "scan_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (results.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredResults, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "scan_results.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <div className="results-header">
        <h2>Scan Results ({filteredResults.length})</h2>
        <div className="filters">
          <input 
            type="text" 
            placeholder="Search URL..." 
            className="input-field" 
            style={{ width: '200px', padding: '8px 12px' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select 
            className="input-field" 
            style={{ width: 'auto', padding: '8px 12px' }}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="success">Only Success (200)</option>
            <option value="error">Only Errors (4xx, 5xx)</option>
            <option value="404">Only 404</option>
            <option value="500">Only 5xx</option>
            <option value="redirect">Only Redirects (3xx)</option>
          </select>
          <button className="btn btn-outline" onClick={exportCSV}>Export CSV</button>
          <button className="btn btn-outline" onClick={exportJSON}>Export JSON</button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>URL</th>
              <th>Status</th>
              <th>Time (ms)</th>
              <th>Content Type</th>
              <th>Found At (Referer)</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No results found matching criteria.
                </td>
              </tr>
            ) : (
              filteredResults.map((r, i) => (
                <tr key={i}>
                  <td style={{ maxWidth: '300px', wordBreak: 'break-all' }} title={r.url}>{r.url}</td>
                  <td>
                    <span className={`status-badge status-${r.statusCode >= 500 ? '500' : r.statusCode === 404 ? '404' : r.statusCode >= 400 ? '404' : r.statusCode >= 300 ? '301' : '200'}`}>
                      {r.statusCode} {r.statusText}
                    </span>
                  </td>
                  <td>{r.responseTime}</td>
                  <td style={{ fontSize: '0.8rem' }}>{r.contentType.split(';')[0]}</td>
                  <td style={{ maxWidth: '200px', wordBreak: 'break-all', fontSize: '0.8rem', color: 'var(--text-muted)' }} title={r.referer}>
                    {r.referer && r.referer !== 'User Input' ? (
                      (() => {
                        try { return new URL(r.referer).pathname; }
                        catch { return r.referer; }
                      })()
                    ) : 'Direct Input'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;
