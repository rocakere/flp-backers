export default function Audit() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="text-3xl font-bold text-black">审计报告</h1>
      <p className="mt-6 text-black/70 leading-relaxed">
        审计尚未进行，报告完成后将在此公开全文与审计机构名称。
      </p>
      <p className="mt-4 text-sm leading-6 text-black/40">
        审计范围计划包括：税率计算逻辑、分红分配合约、销毁权限、增发与暂停权限是否已放弃或移交。
      </p>
    </section>
  );
}
