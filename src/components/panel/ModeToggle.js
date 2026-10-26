import Link from 'next/link';

export default function ModeToggle({ type }) {
  return <nav className="mode-toggle" aria-label="Generation type">
    {['image', 'video'].map(mode => <Link key={mode}
      href={mode === 'image' ? '/imagestudio' : '/videostudio'}
      aria-current={type === mode ? 'page' : undefined}
      className={type === mode ? 'selected' : ''}
    >{mode === 'image' ? 'Image' : 'Video'}</Link>)}
  </nav>;
}
