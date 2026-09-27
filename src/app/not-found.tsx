import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page-width error-page">
      <p className="eyebrow">404 · RECORD NOT FOUND</p>
      <h1>A page yet unwritten.</h1>
      <p>This record does not exist in this archive.</p>
      <Link className="button" href="/">
        Return to the archives
      </Link>
    </div>
  );
}
