import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

export const defaultAdvanced = { style: 'Natural', color: 'Original', camera: 'Auto', seed: '', negative: '', guidance: 7, steps: 28 };
const references = {
  Styles: [
    { name: 'Natural', image: 7, detail: 'True-to-life light and texture' },
    { name: 'Cinematic', image: 9, detail: 'Atmospheric depth and contrast' },
    { name: 'Analog', image: 10, detail: 'Warm grain and nostalgic tones' },
    { name: 'Editorial', image: 1, detail: 'Clean composition and detail' },
  ],
  Colors: [
    { name: 'Original', image: 5, detail: 'Keep the scene’s natural colors', colors: ['#a7c5bf','#318f8c','#497a51','#d7c8a9'] },
    { name: 'Ocean Mist', image: 6, detail: 'Cool, quiet, and softly muted', colors: ['#174a58','#52828c','#acc3c1','#dee2d7'] },
    { name: 'Golden Hour', image: 10, detail: 'Sunlit amber and warm shadows', colors: ['#bd6d43','#ecae71','#f6d6a6','#594d41'] },
    { name: 'Soft Pastel', image: 9, detail: 'Airy pinks and gentle lavender', colors: ['#b2becf','#ddc0d2','#b7a6c6','#e9e0e3'] },
  ],
  Camera: [
    { name: 'Auto', image: 12, detail: 'A balanced view of the scene' },
    { name: 'Close-up', image: 1, detail: 'Intimate framing and fine detail' },
    { name: 'Wide Angle', image: 5, detail: 'Open landscapes and a sense of scale' },
    { name: 'Low Angle', image: 7, detail: 'A bold perspective looking upward' },
  ],
};

export default function AdvancedSettingsModal({ open, active, value, onApply, onDismiss, type }) {
  const dialogRef = useRef(null);
  const [tab, setTab] = useState('Styles');
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && active) {
      setDraft({ ...value });
      setTab('Styles');
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) dialog.close();
  }, [open, active, value]);
  const field = tab === 'Styles' ? 'style' : tab === 'Colors' ? 'color' : 'camera';
  function update(key, next) { setDraft(previous => ({ ...previous, [key]: next })); }
  return <dialog ref={dialogRef} className="advanced-modal" aria-labelledby={`${type}-advanced-title`}
    onCancel={onDismiss} onClose={onDismiss}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onDismiss();
    }}>
    <div className="advanced-modal-top"><span className="advanced-badge">✦ Creative controls</span><button type="button" className="modal-close" aria-label="Close advanced settings" onClick={onDismiss}>×</button></div>
    <div className="advanced-modal-body">
      <h2 id={`${type}-advanced-title`}>Advanced settings</h2>
      <p className="advanced-intro">Set the mood. Shape the details. Make it yours.</p>
      <div className="reference-tabs" role="group" aria-label="Reference category">
        {Object.keys(references).map(name => <button type="button" key={name} aria-pressed={tab === name} onClick={() => setTab(name)}>{name === 'Styles' ? '☆' : name === 'Colors' ? '◉' : '◎'} <span>{name}</span></button>)}
      </div>
      <div className="reference-grid" role="group" aria-label={`Choose ${tab.toLowerCase()}`}>
        {references[tab].map(reference => <button type="button" key={reference.name} className={`reference-card ${draft[field] === reference.name ? 'is-selected' : ''}`} aria-pressed={draft[field] === reference.name} onClick={() => update(field, reference.name)}>
          <span className="reference-art"><Image src={`/images/sample-${reference.image}.jpg`} alt={reference.detail} fill sizes="(max-width: 639px) 40vw, 240px"/>{draft[field] === reference.name && <span className="reference-check" aria-hidden="true">✓</span>}
            {reference.colors && <span className="reference-palette">{reference.colors.map(color => <span key={color} style={{ background: color }}/>)}</span>}
          </span><strong>{reference.name}</strong><span className="reference-description">{reference.detail}</span>
        </button>)}
      </div>
      <section className="advanced-parameters" aria-label="Generation parameters">
        <label className="advanced-field" htmlFor={`${type}-seed`}>Seed<span className="advanced-hint">Leave empty for a random starting point</span><input id={`${type}-seed`} type="number" min="0" max="4294967295" step="1" placeholder="Random" value={draft.seed} onChange={event => update('seed', event.target.value)}/></label>
        <label className="advanced-field" htmlFor={`${type}-steps`}>Sampling steps<span className="advanced-hint">Refinement per generation</span><select id={`${type}-steps`} value={draft.steps} onChange={event => update('steps', Number(event.target.value))}>{[16, 24, 28, 36, 50].map(steps => <option key={steps} value={steps}>{steps} steps</option>)}</select></label>
        <label className="advanced-field advanced-guidance" htmlFor={`${type}-guidance`}>Prompt guidance <output>{draft.guidance}</output><span className="advanced-hint">Balance creative freedom and prompt detail</span><input id={`${type}-guidance`} type="range" min="1" max="20" step="0.5" value={draft.guidance} onChange={event => update('guidance', Number(event.target.value))}/><span className="range-labels"><span>More creative</span><span>More precise</span></span></label>
        <label className="advanced-field advanced-negative" htmlFor={`${type}-negative`}>Negative prompt<span className="advanced-hint">Details you would like to leave out</span><textarea id={`${type}-negative`} rows="2" maxLength={2000} placeholder="Blur, distortion, unwanted text…" value={draft.negative} onChange={event => update('negative', event.target.value)}/></label>
      </section>
    </div>
    <footer className="advanced-modal-footer"><button type="button" className="modal-reset" onClick={() => setDraft({ ...defaultAdvanced })}>Reset defaults</button><div><button type="button" className="modal-cancel" onClick={onDismiss}>Cancel</button><button type="button" className="modal-apply" onClick={() => onApply(draft)}>Apply settings</button></div></footer>
  </dialog>;
}
