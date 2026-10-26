'use client';
import { useRef, useState } from 'react';

import HistoryStrip from '../history/HistoryStrip';
import ControlPanel from '../panel/ControlPanel';
import ResultsFeed from '../results/ResultsFeed';
import useGenerations from '../../hooks/useGenerations';
export default function AppShell({ type = 'image' }) { const [prompt,setPrompt] = useState(''); const historyRef = useRef(null); const { groups, loading, announcement, error, create, loadHistory } = useGenerations(); return <div className="app-shell"><HistoryStrip type={type} onSelect={loadHistory} stripRef={historyRef}/><div className="workspace"><ControlPanel type={type} prompt={prompt} setPrompt={setPrompt} loading={loading} onGenerate={create}/><main id="results"><ResultsFeed groups={groups} onSample={setPrompt} error={error}/></main></div><div className="sr-only" role="status" aria-live="polite">{announcement}</div></div>; }
