// Import the Link component from Next.js for client-side navigation
import Link from "next/link";


// This is the main page (Home) component for the app
export default function Home() {
  return (
    // The main container with padding
    <main>
      {/* Page title */}
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Journal AI</h1>
      {/* Instructional text */}
      <p style={{ marginTop: 8 }}>Go to the journal page to get started.</p>
      {/* Link to the journal page */}
      <div style={{ marginTop: 16 }}>
        <Link href="/journal">Open Journal</Link>
      </div>
    </main>
  );
}
