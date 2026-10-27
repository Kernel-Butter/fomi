import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/base.css";
import "../styles/layout.css";
import "../styles/history.css";
import "../styles/panel.css";
import "../styles/results.css";
import "../styles/prompt-cards.css";
import "../styles/advanced.css";
import "../styles/media-preview.css";
import StudioWorkspace from "../components/layout/StudioWorkspace";
const inter = Inter({ subsets: ["latin"], display: "swap" });
export const metadata = {
  title: "Frame — Imagine something beautiful",
  description: "A quiet space to create images and videos with AI.",
};
export default function RootLayout({ children, modal }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <StudioWorkspace>
          {children}
          {modal}
        </StudioWorkspace>
      </body>
    </html>
  );
}
