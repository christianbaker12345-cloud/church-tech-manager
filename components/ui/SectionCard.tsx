import { ReactNode } from "react";

type SectionCardProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
};

export default function SectionCard({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = "",
  contentClassName = "",
  noPadding = false,
}: SectionCardProps) {
  const hasHeader = Boolean(
    eyebrow || title || description || actions
  );

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {hasHeader && (
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-6 md:flex-row md:items-start md:justify-between md:px-8">
          <div className="max-w-3xl">
            {eyebrow && (
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                {eyebrow}
              </p>
            )}

            {title && (
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      )}

      <div
        className={`${
          noPadding ? "" : "p-6 md:p-8"
        } ${contentClassName}`}
      >
        {children}
      </div>
    </section>
  );
}