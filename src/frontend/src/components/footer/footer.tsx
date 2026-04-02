export default function Footer({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="text-center mt-4 pt-6 border-t border-[var(--border-subtle)]">
        {children}
      </div>
    </>
  );
}
