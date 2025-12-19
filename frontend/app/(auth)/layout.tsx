// frontend/app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0e1a] via-[#0f1419] to-[#0a0e1a]">
      {children}
    </div>
  );
}