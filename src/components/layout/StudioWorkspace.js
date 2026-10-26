'use client';
import { usePathname } from 'next/navigation';
import AppShell from './AppShell';

// Shared layout owns the studios so route navigation does not discard their state.
export default function StudioWorkspace({ children }) {
  const pathname = usePathname();
  const inStudio = pathname === '/imagestudio' || pathname === '/videostudio';
  return <>
    <div className="studio-workspace" hidden={!inStudio}>
      {['image', 'video'].map(type => {
        const active = pathname === `/${type}studio`;
        return <div key={type} className="studio-session" hidden={!active}>
          <AppShell type={type} active={active}/>
        </div>;
      })}
    </div>
    {children}
  </>;
}
