import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-eyebrow">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-muted">
        That route was not generated for this static build.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex font-mono text-sm text-accent hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}
