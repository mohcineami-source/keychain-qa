export function StaticPage({
  title,
  paragraphs,
  children,
}: {
  title: string;
  paragraphs: readonly string[];
  children?: React.ReactNode;
}) {
  return (
    <div className="container-page py-12">
      <article className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-extrabold text-charcoal">{title}</h1>
        <div className="space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-base leading-8 text-muted">
              {p}
            </p>
          ))}
        </div>
        {children}
      </article>
    </div>
  );
}
