"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-width error-page">
      <p className="eyebrow">THE ARCHIVES</p>
      <h1>The archive couldn’t open.</h1>
      <p>Please try loading this page again.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
