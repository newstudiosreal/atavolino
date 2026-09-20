import clsx from "clsx";

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx("rounded-2xl border border-white/10 bg-brand-panel/80 p-6 shadow-panel backdrop-blur", className)}>
      {children}
    </div>
  );
}
