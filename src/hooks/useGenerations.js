'use client';
import { useEffect, useRef, useState } from 'react';
import { generate } from '../lib/api';

export default function useGenerations() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [error, setError] = useState('');
  const [scrollRequest, setScrollRequest] = useState(null);
  const pending = useRef(false);
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function create(options) {
    if (pending.current || !options.prompt.trim()) return;
    pending.current = true;
    setLoading(true);
    setError('');
    setAnnouncement('Generation started.');
    const id = crypto.randomUUID();
    controller.current = new AbortController();
    setGroups(previous => [...previous, { id, ...options, loading: true, items: [] }]);
    setScrollRequest({ id, mode: 'bottom' });
    try {
      const items = await generate(options, controller.current.signal);
      setGroups(previous => previous.map(group => group.id === id ? { ...group, loading: false, items } : group));
      setAnnouncement(`${items.length} ${options.type === 'video' ? 'videos' : 'images'} ready.`);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setGroups(previous => previous.filter(group => group.id !== id));
        setError(err.message);
        setAnnouncement('Generation failed. Please try again.');
      }
    } finally {
      pending.current = false;
      setLoading(false);
    }
  }

  function loadHistory(item) {
    const existing = groups.find(group => group.items.some(result => result.id === item.id));
    const id = existing?.id || crypto.randomUUID();
    if (!existing) {
      setGroups(previous => [...previous, { id, prompt: item.prompt, model: item.model, type: item.type, items: [item], loading: false }]);
    }
    setScrollRequest({ id, mode: 'conversation' });
  }

  return { groups, loading, announcement, error, scrollRequest, create, loadHistory };
}
