export default function Footer() {
  return (
    <footer className="border-t border-gray-800 mt-20 py-10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>FLP Protocol・Solana Fair Launch Token Standard</div>
        <div className="flex gap-6 text-gray-400">
          <a href="#" className="hover:text-flpGreen">Documentation</a>
          <a href="#" className="hover:text-flpGreen">X (Twitter)</a>
          <a href="#" className="hover:text-flpGreen">Discord</a>
          <a href="#" className="hover:text-flpGreen">Audit Report</a>
        </div>
        <div className="text-red-400 text-sm">⚠️ Crypto High Risk. DYOR. Not Investment Advice.</div>
      </div>
    </footer>
  );
}