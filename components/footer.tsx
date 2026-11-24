export default function Footer() {
  return (
    <footer className="mt-20 border-t border-black/10 py-10 text-sm text-black/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div>FLP Protocol・Solana Fair Launch Token Standard</div>
        <div className="flex gap-6">
          <span className="cursor-not-allowed text-black/30">Documentation</span>
          <span className="cursor-not-allowed text-black/30">X (Twitter)</span>
          <span className="cursor-not-allowed text-black/30">Discord</span>
        </div>
        <div className="text-xs text-black/40">⚠️ Crypto High Risk. DYOR. Not Investment Advice.</div>
      </div>
    </footer>
  );
}
