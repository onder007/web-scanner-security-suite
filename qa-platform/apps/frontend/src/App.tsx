import { useState } from 'react';
import { Activity, ShieldCheck, Search, CheckCircle, AlertTriangle, Play, RefreshCw, XCircle, Globe, Zap } from 'lucide-react';
import './App.css';
import type { TestReport, Status } from '@qa/shared';

// Pre-defined checklist items
interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  pluginName?: string; // If this can be auto-checked
  status: Status;
  autoCheckResult?: TestReport;
  isChecking: boolean;
}

const initialChecklist: ChecklistItem[] = [
  { id: 'seo-title', category: 'SEO', title: 'Sayfa Başlığı Kontrolü', description: 'Sayfada uygun bir <title> etiketi var mı?', pluginName: 'SEO Analyzer', status: 'PENDING', isChecking: false },
  { id: 'seo-alt', category: 'SEO', title: 'Görsel Alt Etiketleri', description: 'Tüm görsellerde açıklayıcı alt etiketler kullanılmış mı?', pluginName: 'SEO Analyzer', status: 'PENDING', isChecking: false },
  { id: 'link-404', category: 'RELIABILITY', title: 'Kırık Bağlantı Taraması', description: 'Sayfadaki internal ve external linklerde 404 hatası var mı?', pluginName: 'Broken Link Scanner', status: 'PENDING', isChecking: false },
  { id: 'security-hsts', category: 'SECURITY', title: 'HSTS Header', description: 'Sunucuda Strict-Transport-Security aktif mi?', status: 'PENDING', isChecking: false },
  { id: 'perf-lcp', category: 'PERFORMANCE', title: 'LCP (Largest Contentful Paint)', description: 'Sayfanın en büyük içeriği 2.5 sn altında yükleniyor mu?', status: 'PENDING', isChecking: false },
];

function App() {
  const [url, setUrl] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('TÜMÜ');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);

  const categories = ['TÜMÜ', ...Array.from(new Set(initialChecklist.map(i => i.category)))];

  const filteredChecklist = activeCategory === 'TÜMÜ' 
    ? checklist 
    : checklist.filter(item => item.category === activeCategory);

  const updateStatus = (id: string, status: Status) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, status } : item));
  };

  const calculateScore = () => {
    const total = checklist.length;
    if (total === 0) return 0;
    
    let score = 100;
    const penaltyPerFail = 100 / total;
    
    checklist.forEach(item => {
      if (item.status === 'FAIL') score -= penaltyPerFail;
      else if (item.status === 'NEEDS_IMPROVEMENT') score -= (penaltyPerFail / 2);
      else if (item.status === 'PENDING') score -= (penaltyPerFail / 4); // Small penalty for unchecked items
    });
    
    return Math.max(0, Math.round(score));
  };

  const handleAutoCheck = async (item: ChecklistItem) => {
    if (!url) {
      alert("Lütfen önce bir URL girin!");
      return;
    }
    if (!item.pluginName) return;

    setChecklist(prev => prev.map(i => i.id === item.id ? { ...i, isChecking: true } : i));

    try {
      const response = await fetch('http://localhost:3001/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, pluginName: item.pluginName })
      });
      
      const data = await response.json();
      
      if (data.success && data.reports) {
        // Try to match report to this checklist item (simplified logic)
        // In a real app, reports would have an ID mapping to the checklist
        let foundReport = data.reports.find((r: TestReport) => r.testName.toLowerCase().includes(item.title.toLowerCase().split(' ')[0]));
        if (!foundReport && data.reports.length > 0) {
           // Fallback for demo
           foundReport = data.reports[0]; 
        }

        if (foundReport) {
          setChecklist(prev => prev.map(i => i.id === item.id ? { 
            ...i, 
            status: foundReport.status,
            autoCheckResult: foundReport,
            isChecking: false 
          } : i));
        } else {
          // If no issue reported, it passed
          setChecklist(prev => prev.map(i => i.id === item.id ? { ...i, status: 'PASS', isChecking: false } : i));
        }
      }
    } catch (err) {
      console.error(err);
      setChecklist(prev => prev.map(i => i.id === item.id ? { ...i, isChecking: false } : i));
    }
  };

  const score = calculateScore();

  return (
    <div className="app-container">
      <nav className="navbar glass">
        <div className="brand">
          <ShieldCheck size={28} className="brand-icon" />
          <h1>Nexus <span>QA</span> Manual</h1>
        </div>
        <div className="url-bar">
          <Globe size={18} />
          <input 
            type="url" 
            placeholder="Analiz edilecek adresi girin (örn: https://example.com)" 
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>
        <div className="score-display">
          <span>Kalite Skoru</span>
          <div className={`score-value ${score >= 80 ? 'good' : score >= 50 ? 'medium' : 'bad'}`}>
            {score}
          </div>
        </div>
      </nav>

      <main className="dashboard-layout">
        <aside className="sidebar glass">
          <h3>Kategoriler</h3>
          <ul>
            {categories.map(cat => (
              <li 
                key={cat} 
                className={activeCategory === cat ? 'active' : ''}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
                <span className="count">
                  {cat === 'TÜMÜ' ? checklist.length : checklist.filter(i => i.category === cat).length}
                </span>
              </li>
            ))}
          </ul>
        </aside>

        <section className="checklist-container">
          <div className="checklist-header glass">
            <h2>{activeCategory === 'TÜMÜ' ? 'Tüm Kontroller' : `${activeCategory} Kontrolleri`}</h2>
            <p>Testleri manuel olarak değerlendirin veya asistanın desteklediği testler için "Auto-Check" kullanın.</p>
          </div>

          <div className="checklist-items">
            {filteredChecklist.map(item => (
              <div key={item.id} className={`checklist-card glass ${item.status.toLowerCase()}`}>
                <div className="card-header">
                  <div>
                    <span className="category-tag">{item.category}</span>
                    <h3>{item.title}</h3>
                  </div>
                  {item.pluginName && (
                    <button 
                      className="auto-check-btn" 
                      onClick={() => handleAutoCheck(item)}
                      disabled={item.isChecking}
                    >
                      {item.isChecking ? <RefreshCw className="spin" size={16}/> : <Play size={16} />}
                      Asistana Sor
                    </button>
                  )}
                </div>
                
                <p className="item-description">{item.description}</p>
                
                {item.autoCheckResult && (
                  <div className="auto-result">
                    <Zap size={16} className="text-accent" />
                    <span>Asistan Yanıtı: <strong>{item.autoCheckResult.foundIssue || 'Sorun bulunamadı'}</strong></span>
                  </div>
                )}

                <div className="status-controls">
                  <button 
                    className={`status-btn pass ${item.status === 'PASS' ? 'active' : ''}`}
                    onClick={() => updateStatus(item.id, 'PASS')}
                  >
                    <CheckCircle size={18} /> Başarılı
                  </button>
                  <button 
                    className={`status-btn needs-improvement ${item.status === 'NEEDS_IMPROVEMENT' ? 'active' : ''}`}
                    onClick={() => updateStatus(item.id, 'NEEDS_IMPROVEMENT')}
                  >
                    <Activity size={18} /> Geliştirilebilir
                  </button>
                  <button 
                    className={`status-btn fail ${item.status === 'FAIL' ? 'active' : ''}`}
                    onClick={() => updateStatus(item.id, 'FAIL')}
                  >
                    <XCircle size={18} /> Başarısız
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
