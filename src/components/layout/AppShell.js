'use client';
import { useEffect, useRef, useState } from 'react';
import HistoryStrip from '../history/HistoryStrip';
import ControlPanel from '../panel/ControlPanel';
import ResultsFeed from '../results/ResultsFeed';
import Icon from '../Icon';
import useGenerations from '../../hooks/useGenerations';

export default function AppShell({ type = 'image' }) {
  const [prompt, setPrompt] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyRef = useRef(null);
  const trayRef = useRef(null);
  const resultsRef = useRef(null);
  const toggleRef = useRef(null);
  const scrollBaseline = useRef(0);
  const { groups, loading, announcement, error, create, loadHistory } = useGenerations();

  function expandHistory() {
    scrollBaseline.current = resultsRef.current?.scrollTop || 0;
    setHistoryOpen(true);
  }

  useEffect(() => {
    function openFromGallery() {
      scrollBaseline.current = resultsRef.current?.scrollTop || 0;
      setHistoryOpen(true);
      requestAnimationFrame(() => historyRef.current?.focus());
    }
    window.addEventListener('studio:show-history', openFromGallery);
    return () => window.removeEventListener('studio:show-history', openFromGallery);
  }, []);

  function handleScroll(event) {
    if (event.target !== event.currentTarget) return;
    const top = event.currentTarget.scrollTop;
    if (top < scrollBaseline.current) scrollBaseline.current = top;
    if (historyOpen && top - scrollBaseline.current > 80 && !trayRef.current?.contains(document.activeElement)) {
      setHistoryOpen(false);
    }
  }

  function collapseHistory() {
    setHistoryOpen(false);
    toggleRef.current?.focus();
  }

  return <div className="app-shell studio-shell">
    <div className={`history-tray ${historyOpen ? 'is-open' : ''}`}>
      <div className="history-tray-toolbar">
        <button ref={toggleRef} type="button" className="history-tray-toggle"
          aria-expanded={historyOpen} aria-controls="studio-history-tray"
          aria-label={historyOpen ? 'Collapse history' : 'Show history'}
          onClick={historyOpen ? collapseHistory : expandHistory}>
          <span>History</span><Icon name="chevron" size={15}/>
        </button>
      </div>
      <div id="studio-history-tray" ref={trayRef} className="history-tray-body" inert={!historyOpen ? true : undefined}>
        <div className="history-tray-content">
          <HistoryStrip type={type} onSelect={loadHistory} stripRef={historyRef}/>
        </div>
      </div>
    </div>
    <div className="workspace">
      <ControlPanel type={type} prompt={prompt} setPrompt={setPrompt} loading={loading} onGenerate={create}/>
      <main id="results" ref={resultsRef} onScroll={handleScroll} className="results-scroll" tabIndex={0} aria-label="Generation conversation and results">
        <ResultsFeed groups={groups} onSample={setPrompt} error={error}/>
      </main>
    </div>
    <div className="sr-only" role="status" aria-live="polite">{announcement}</div>
  </div>;
}
