import Link from "next/link";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline";
};

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
};

export default function EmptyState({
  icon = "📦",
  title,
  description,
  primaryAction,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center md:p-12 ${className}`}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-slate-200">
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-semibold text-slate-950">
        {title}
      </h3>

      {description && (
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 md:text-base">
          {description}
        </p>
      )}

      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {secondaryAction && (
            <EmptyStateButton action={secondaryAction} />
          )}

          {primaryAction && (
            <EmptyStateButton action={primaryAction} />
          )}
        </div>
      )}
    </div>
  );
}

type EmptyStateButtonProps = {
  action: EmptyStateAction;
};

function EmptyStateButton({
  action,
}: EmptyStateButtonProps) {
  const button = (
    <Button
      type="button"
      variant={action.variant ?? "default"}
      onClick={action.href ? undefined : action.onClick}
    >
      {action.label}
    </Button>
  );

  if (action.href) {
    return <Link href={action.href}>{button}</Link>;
  }

  return button;
}