export default function LoadingSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--color-navy-200)] border-t-[var(--color-navy-600)] rounded-full animate-spin" />
    </div>
  );
}
