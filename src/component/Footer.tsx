export default function Footer() {
  return (
    <footer className="mt-auto py-8">
      <div className="flex flex-col items-center gap-2">
        <div className="h-px w-full bg-linear-to-r from-transparent via-neutral-800 to-transparent mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600">
          Terminal Status:{" "}
          <span className="text-emerald-500/80">Encrypted & Secured</span>
        </p>
        <p className="text-[9px] font-medium uppercase tracking-widest text-neutral-700">
          NIT Srinagar · CSE Dept · 2026
        </p>
      </div>
    </footer>
  );
}
