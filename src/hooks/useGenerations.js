'use client';
import { useEffect, useRef, useState } from 'react';
import { generate } from '../lib/api';
export default function useGenerations() {
 const [groups,setGroups] = useState([]), [loading,setLoading] = useState(false), [announcement,setAnnouncement] = useState(''), [error,setError] = useState('');
 const pending = useRef(false), controller = useRef(null);
 useEffect(() => () => controller.current?.abort(), []);
 async function create(options) { if (pending.current || !options.prompt.trim()) return; pending.current = true; setLoading(true); setError(''); setAnnouncement('Generation started.'); const id = crypto.randomUUID(); controller.current = new AbortController(); setGroups(previous => [{ id, ...options, loading: true, items: [] }, ...previous]); try { const items = await generate(options,controller.current.signal); setGroups(previous => previous.map(group => group.id === id ? { ...group, loading: false, items } : group)); setAnnouncement(`${items.length} ${options.type === 'video' ? 'videos' : 'images'} ready.`); } catch (err) { if (err.name !== 'AbortError') { setGroups(previous => previous.filter(group => group.id !== id)); setError(err.message); setAnnouncement('Generation failed. Please try again.'); } } finally { pending.current = false; setLoading(false); } }
 function loadHistory(item) { setGroups(previous => [{ id: crypto.randomUUID(), prompt: item.prompt, model: item.model, items: [item], loading: false }, ...previous]); }
 return { groups, loading, announcement, error, create, loadHistory };
}
