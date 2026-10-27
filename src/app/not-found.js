import Link from "next/link";

export default function NotFound() {
  return (
    <div className="app-shell">
      <main className="not-found">
        <h1>Page not found</h1>
        <p>Would you like to go back to Image Studio?</p>
        <Link href="/imagestudio">Back to Image Studio</Link>
      </main>
    </div>
  );
}
