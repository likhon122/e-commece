export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#B0E4CC]/10 to-[#F2E3BB]/30">
      {/* Decorative background elements */}
      <div className="absolute -left-64 -top-64 h-[500px] w-[500px] rounded-full bg-[#B0E4CC]/15 blur-3xl" />
      <div className="absolute -bottom-64 -right-64 h-[500px] w-[500px] rounded-full bg-[#408A71]/10 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F2E3BB]/25 blur-3xl" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
