import { Inter } from 'next/font/google';
import './globals.css';
import Header from '../components/layout/Header';
const inter = Inter({ subsets: ['latin'], display: 'swap' });
export const metadata = { title: 'Frame — Imagine something beautiful', description: 'A quiet space to create images and videos with AI.' };
export default function RootLayout({ children }) { return <html lang="en"><body className={inter.className}><div className="app-shell header-shell"><Header /></div>{children}</body></html>; }
