export default function ExplorePage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-3xl font-bold text-black">代币广场</h1>
      <p className="mt-4 text-black/60">通过 FLP 协议发射的代币将在这里统一展示。</p>
      <p className="mx-auto mt-6 max-w-xl text-sm leading-6 text-black/40">
        每个代币会展示合约地址、税率结构、销毁进度与分红数据，全部来自链上读取。
      </p>
    </section>
  );
}
