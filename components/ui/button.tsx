import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center",
    "whitespace-nowrap rounded-xl border border-transparent",
    "font-semibold outline-none select-none",
    "transition-[background-color,border-color,color,box-shadow,transform]",
    "duration-150 ease-out",
    "focus-visible:ring-4 focus-visible:ring-blue-100",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-red-500 aria-invalid:ring-4 aria-invalid:ring-red-100",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "[&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-blue-600 text-white",
          "shadow-sm shadow-blue-950/10",
          "hover:-translate-y-0.5 hover:bg-blue-700",
          "hover:shadow-md hover:shadow-blue-950/15",
          "active:translate-y-0 active:bg-blue-800",
        ].join(" "),

        outline: [
          "border-slate-300 bg-white text-slate-700",
          "shadow-sm",
          "hover:-translate-y-0.5 hover:border-slate-400",
          "hover:bg-slate-50 hover:text-slate-950",
          "hover:shadow-md",
          "active:translate-y-0 active:bg-slate-100",
        ].join(" "),

        secondary: [
          "border-slate-200 bg-slate-100 text-slate-800",
          "hover:-translate-y-0.5 hover:bg-slate-200",
          "hover:text-slate-950 hover:shadow-sm",
          "active:translate-y-0 active:bg-slate-300",
        ].join(" "),

        ghost: [
          "bg-transparent text-slate-600",
          "hover:bg-slate-100 hover:text-slate-950",
          "active:bg-slate-200",
        ].join(" "),

        destructive: [
          "border-red-200 bg-red-50 text-red-700",
          "hover:-translate-y-0.5 hover:border-red-300",
          "hover:bg-red-100 hover:text-red-800",
          "hover:shadow-sm",
          "focus-visible:ring-red-100",
          "active:translate-y-0 active:bg-red-200",
        ].join(" "),

        success: [
          "border-emerald-600 bg-emerald-600 text-white",
          "shadow-sm shadow-emerald-950/10",
          "hover:-translate-y-0.5 hover:bg-emerald-700",
          "hover:shadow-md hover:shadow-emerald-950/15",
          "focus-visible:ring-emerald-100",
          "active:translate-y-0 active:bg-emerald-800",
        ].join(" "),

        warning: [
          "border-amber-500 bg-amber-500 text-white",
          "shadow-sm shadow-amber-950/10",
          "hover:-translate-y-0.5 hover:bg-amber-600",
          "hover:shadow-md hover:shadow-amber-950/15",
          "focus-visible:ring-amber-100",
          "active:translate-y-0 active:bg-amber-700",
        ].join(" "),

        link: [
          "h-auto rounded-none bg-transparent px-0 py-0",
          "text-blue-600 shadow-none",
          "underline-offset-4",
          "hover:text-blue-700 hover:underline",
          "focus-visible:ring-2 focus-visible:ring-blue-100",
        ].join(" "),
      },

      size: {
        default:
          "h-10 gap-2 px-4 text-sm",

        xs:
          "h-7 gap-1.5 rounded-lg px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",

        sm:
          "h-9 gap-1.5 rounded-lg px-3.5 text-sm [&_svg:not([class*='size-'])]:size-3.5",

        lg:
          "h-11 gap-2 rounded-xl px-5 text-sm",

        xl:
          "h-12 gap-2.5 rounded-xl px-6 text-base",

        icon:
          "size-10 rounded-xl",

        "icon-xs":
          "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",

        "icon-sm":
          "size-9 rounded-lg [&_svg:not([class*='size-'])]:size-3.5",

        "icon-lg":
          "size-11 rounded-xl [&_svg:not([class*='size-'])]:size-5",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({
          variant,
          size,
          className,
        })
      )}
      {...props}
    />
  );
}

export { Button, buttonVariants };