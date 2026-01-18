export default function Card({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      {title && (
        <h2 className="text-base font-semibold tracking-tight text-zinc-900">
          {title}
        </h2>
      )}
      <div className={title ? "mt-3" : ""}>{children}</div>
    </section>
  );
}
