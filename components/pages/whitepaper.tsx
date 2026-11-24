import type { Lang } from '@/lib/i18n';

export default function WhitepaperPage({ lang }: { lang: Lang }) {
  return lang === 'en' ? <EnBody /> : <ZhBody />;
}

function ZhBody() {
  const alloc = [
    { k: '销毁池 Burn Pool', v: '40%', d: '按周期批量打入官方销毁地址，总量持续通缩' },
    { k: '持币者分红池 Holders Dividend', v: '30%', d: '每 7 天快照，按持仓占比以 SOL 自动分发' },
    { k: '流动性回购与加深 Liquidity', v: '20%', d: '回购代币注入交易池，提升深度、降低滑点' },
    { k: '运营与开发 Operations', v: '10%', d: '合约维护、前端托管、审计与后续开发' },
  ];

  const rows = [
    ['代币名称', 'Fair Token'],
    ['代币符号', 'FAIR'],
    ['总供应量', '1,000,000,000 FAIR（恒定，无增发）'],
    ['买入税 / 卖出税', '各 1%（FLP 母币与发射的新币一致）'],
    ['FLP 母币税收分配', '销毁 40% / 分红 30% / 流动性 20% / 运营 10%'],
    ['发射新币税收分配', '创作者 90% / 回购并销毁 FLP 10%'],
    ['分红周期', '每 7 天结算一次'],
    ['发行方式', '无预售、无私募、无团队预留，全部注入流动性'],
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-semibold tracking-widest text-purple-700">WHITEPAPER · v0.1</p>
      <h1 className="mt-3 text-3xl font-bold text-black sm:text-4xl">FairLaunch Protocol 白皮书</h1>
      <p className="mt-4 text-sm text-black/50">
        Solana 上的公平发射协议 · 设计说明草案，主网发射前持续修订
      </p>
      <div className="mt-6 print:hidden">
        <a
          href="/whitepaper.pdf"
          download="FLP-Whitepaper-zh-v0.1.pdf"
          className="inline-flex items-center gap-2 rounded border border-purple-300 bg-white/70 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-white"
        >
          ↓ 下载 PDF 版本
        </a>
      </div>

      <div className="mt-8 rounded-xl border border-black/10 bg-white/60 p-6 text-sm leading-7 text-black/70">
        <span className="font-semibold text-black">摘要　</span>
        FLP 是部署在 Solana 上的发币协议。它要做的事只有一件：把"公平发射"从营销词变成由合约强制执行的规则集合。任何人用同一套模板发币，税收到销毁到分红的路径全部写死在链上，发币方在发射后无法修改税率、无法增发、无法抽走流动性。任何人拿到合约地址，都能自己核对规则，无需相信官网的说法。
      </div>

      <h2 className="mt-12 text-xl font-bold text-black">一、这个协议解决什么</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-black/70">
        <p>Solana 上每天产生大量新代币，绝大多数死在三个地方。</p>
        <p><span className="font-semibold text-black">开盘被抢跑。</span>流动性刚注入，MEV 机器人用更高的小费把买单插到前面，普通人成交在最高点。</p>
        <p><span className="font-semibold text-black">发币方留后门。</span>mint 权限没放弃，随时能增发砸盘；update 权限没放弃，随时能把税率改到 99%。</p>
        <p><span className="font-semibold text-black">热度过去就没人负责。</span>税一直收，却收进团队口袋，持币者一分钱拿不到。</p>
        <p>对应的三个解法就是 FLP 的三根支柱：Bundle 打包发射、权限在发射时即放弃、税收自动回流给持币者。</p>
      </div>

      <h2 className="mt-12 text-xl font-bold text-black">二、协议机制</h2>

      <h3 className="mt-8 font-semibold text-black">2.1 一键部署</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        在 Launch 页面填写名称、符号、总量、税率与税收流向，协议生成一个标准代币合约。所有 FLP 代币共享同一套合约逻辑，只有参数不同，且参数在创建时写死，之后不可修改。
      </p>

      <h3 className="mt-8 font-semibold text-black">2.2 税率结构（分两套，别混）</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        买入税与卖出税各 1%，由 Token-2022 的转账费在协议层自动扣除，没有管理员修改入口。<span className="font-semibold text-black">FLP 母币</span>的税按 40 / 30 / 20 / 10 四档分配至销毁池、持币者分红池、流动性回购与运营开发；<span className="font-semibold text-black">通过协议发射的新币</span>，税归发币者本人，平台不从新币的税里抽成，只有 10% 用于回购并销毁 FLP，详见 3.2。
      </p>

      <h3 className="mt-8 font-semibold text-black">2.3 自动销毁</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        进入销毁池的代币由金库账户直接调用 Burn 指令销毁（Token-2022 原生支持），链上总供应量立即减少。任何人都可以比对当前总供应量与初始 10 亿枚的差值，核对实际销毁量，不存在"团队声称已销毁"这种说法。
      </p>

      <h3 className="mt-8 font-semibold text-black">2.4 持币分红</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        每 7 天对持币地址做一次快照，把分红池中的 SOL 按持仓占比直接转入各钱包，不需要手动领取、不需要质押、不需要任何额外操作。
      </p>
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        分红金额完全取决于该周期的交易量与税收，没有保底，可能为零。不存在"持有即稳定收益"。
      </div>

      <h3 className="mt-8 font-semibold text-black">2.5 防 MEV 发射</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        流动性注入与首批买单通过 Jito Bundle 打包提交，在同一区块内完成，避免开盘瞬间被夹。这降低抢跑概率，但不能消除 MEV——公开流动性池始终存在被机器人套利的可能。
      </p>

      <h3 className="mt-8 font-semibold text-black">2.6 权限模型</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">发射时执行以下动作，全部可在链上验证：</p>
      <ul className="mt-2 space-y-1.5 pl-5 text-sm leading-7 text-black/70">
        <li className="list-disc">mint authority 置空——此后任何人无法增发，总量恒定</li>
        <li className="list-disc">freeze authority 置空——无法冻结任何钱包</li>
        <li className="list-disc">税率与分配参数写入合约后不可变更，无管理员修改入口</li>
        <li className="list-disc">流动性凭证锁仓或直接打入黑洞地址</li>
      </ul>

      <h3 className="mt-8 font-semibold text-black">2.7 税金如何真正到手</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        1% 的税在每一笔代币转账时由协议扣下，但不会自动进任何人的钱包，而是先记录在收款方账户的 withheld 余额里（包括交易池的金库账户）。协议定期执行 harvest，把这些挂着的税一次性搬进税金金库，再按分配比例处理。整个过程由多签地址执行，每一步在浏览器上都能查到指令与金额。
      </p>
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        税是代币，分红是 SOL，中间必须卖出。FLP 母币的税中约 50% 需要卖成 SOL（分红 30% + 运营 10% + 流动性配对 10%）。为避免形成可预测的砸盘时间点，卖出会拆成 8–12 笔在数小时内完成（TWAP），harvest 时间在 6–9 天窗口内随机，而不是死守第 7 天。
      </div>

      <h2 className="mt-12 text-xl font-bold text-black">三、代币经济</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-black/10 bg-white/60">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b border-black/5 last:border-0">
                <td className="w-40 px-4 py-3 align-top text-black/50">{k}</td>
                <td className="px-4 py-3 font-semibold text-black">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-8 font-semibold text-black">3.1 税收分配细则</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {alloc.map((a) => (
          <div key={a.k} className="rounded-lg border border-black/10 bg-white/60 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-black">{a.k}</span>
              <span className="text-lg font-bold text-purple-700">{a.v}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-black/50">{a.d}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-8 font-semibold text-black">3.2 通过协议发射的新币：90 / 10</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        任何人在协议上一键发币，该代币的 1% 买卖税归发币者本人，90% 直接结算给创作者，平台不从中抽成。剩下 10% 用于在市场上买入 FLP 并立即销毁。
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-black">创作者 Creator</span>
            <span className="text-lg font-bold text-purple-700">90%</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-black/50">按周期结算给发币者，这是发币者的主要收入来源</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-black">回购并销毁 FLP</span>
            <span className="text-lg font-bold text-purple-700">10%</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-black/50">买入 FLP 后立即 Burn，母币供应持续减少，价值由生态里的新币支撑</p>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-black/10 bg-white/60 px-4 py-3 text-xs leading-6 text-black/60">
        这个设计的意思是：生态里每多一个活跃的新币，FLP 就多一份回购销毁的买盘。反过来说，如果没有新币在跑，FLP 就失去支撑——母币的价值与生态活跃度直接绑定，不靠平台从新币抽血维持。
      </div>

      <h3 className="mt-8 font-semibold text-black">3.3 发行原则</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        公平发射意味着没有预售轮、没有私募折扣、没有团队预留。全部供应量在发射时一次性注入流动性池，团队与普通买家同价进场、同一时间可交易。协议自身不抽取代币作为费用，运营成本从交易税中的运营部分支出。
      </p>

      <h2 className="mt-12 text-xl font-bold text-black">四、可验证性与审计</h2>
      <ul className="mt-4 space-y-1.5 pl-5 text-sm leading-7 text-black/70">
        <li className="list-disc">合约源码开源，使用 Solana 可验证构建，构建结果与链上字节一致</li>
        <li className="list-disc">审计尚未进行；完成后公开机构名称、报告全文与发现的问题（含未修复项），不选择性披露</li>
        <li className="list-disc">所有权限放弃动作在发射交易中完成，任何人可在浏览器回溯该笔交易</li>
      </ul>

      <h2 className="mt-12 text-xl font-bold text-black">五、路线图</h2>
      <ol className="mt-4 space-y-2 text-sm leading-7 text-black/70">
        <li>阶段一　合约开发与内部测试，白皮书定稿</li>
        <li>阶段二　第三方审计、devnet 全流程演练</li>
        <li>阶段三　主网发射、代币广场上线、首轮分红结算</li>
        <li>阶段四　多代币仪表盘、税收参数模板库</li>
      </ol>
      <p className="mt-3 text-xs text-black/40">不写具体日期，以阶段推进——写死时间点而延期，比不写更伤信任。</p>

      <h2 className="mt-12 text-xl font-bold text-black">六、风险披露</h2>
      <div className="mt-4 space-y-2 text-sm leading-7 text-black/70">
        <p><span className="font-semibold text-black">税收即滑点。</span>每笔交易都会被扣 1% 的买入税或卖出税，高频交易者的实际损耗显著高于名义税率。</p>
        <p><span className="font-semibold text-black">分红不确定。</span>分红来自交易税，交易冷淡时分红趋近于零。</p>
        <p><span className="font-semibold text-black">税收卖出压力。</span>母币税中约 50% 需卖出换成 SOL 才能分红，这会持续形成卖出压力；已用 TWAP 拆单与随机窗口削弱影响，但无法消除。</p>
        <p><span className="font-semibold text-black">MEV 无法根除。</span>Bundle 只能降低概率，不能消除。</p>
        <p><span className="font-semibold text-black">合约风险。</span>未经审计的合约存在未知漏洞，可能造成资金损失。</p>
        <p><span className="font-semibold text-black">流动性风险。</span>早期流动性薄弱，大额卖出会严重砸价。</p>
        <p><span className="font-semibold text-black">监管风险。</span>各司法辖区对代币发行与分红的定性不同，可能影响可用性。</p>
      </div>

      <h2 className="mt-12 text-xl font-bold text-black">七、免责声明</h2>
      <p className="mt-4 text-sm leading-7 text-black/70">
        本文档为技术与机制说明，不构成投资建议、要约或任何形式的收益承诺。FAIR 为高风险资产，价格可能归零。参与前请自行研究并自行承担全部后果。
      </p>

      <p className="mt-12 border-t border-black/10 pt-6 text-xs text-black/40 print:hidden">
        最后更新：2026 年 11 月 · 本文档随协议开发进度修订，以本页最新版本为准
      </p>
    </main>
  );
}

function EnBody() {
  const alloc = [
    { k: 'Burn Pool', v: '40%', d: 'Burned to the official incinerator address in timed batches, shrinking supply continuously' },
    { k: 'Holders Dividend', v: '30%', d: 'Snapshot every 7 days and paid out in SOL by holding ratio' },
    { k: 'Liquidity Buyback', v: '20%', d: 'Buys tokens back into the pool to deepen liquidity and cut slippage' },
    { k: 'Operations', v: '10%', d: 'Contract maintenance, frontend hosting, audit and further development' },
  ];

  const rows = [
    ['Token Name', 'Fair Token'],
    ['Symbol', 'FAIR'],
    ['Total Supply', '1,000,000,000 FAIR (fixed, no minting)'],
    ['Buy / Sell Tax', '1% each (same for FLP and launched tokens)'],
    ['FLP Fee Allocation', 'Burn 40% / Dividends 30% / Liquidity 20% / Operations 10%'],
    ['Launched Token Fees', 'Creator 90% / FLP buyback-and-burn 10%'],
    ['Dividend Cycle', 'Settled every 7 days'],
    ['Distribution', 'No presale, no private round, no team allocation — all supply goes into liquidity'],
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-semibold tracking-widest text-purple-700">WHITEPAPER · v0.1</p>
      <h1 className="mt-3 text-3xl font-bold text-black sm:text-4xl">FairLaunch Protocol Whitepaper</h1>
      <p className="mt-4 text-sm text-black/50">
        A fair launch protocol on Solana · design draft, revised continuously until mainnet launch
      </p>
      <div className="mt-6 print:hidden">
        <a
          href="/whitepaper-en.pdf"
          download="FLP-Whitepaper-en-v0.1.pdf"
          className="inline-flex items-center gap-2 rounded border border-purple-300 bg-white/70 px-4 py-2 text-sm font-semibold text-purple-700 transition hover:bg-white"
        >
          ↓ Download PDF
        </a>
      </div>

      <div className="mt-8 rounded-xl border border-black/10 bg-white/60 p-6 text-sm leading-7 text-black/70">
        <span className="font-semibold text-black">Abstract　</span>
        FLP is a token launch protocol deployed on Solana. It does one thing: turn "fair launch" from a marketing phrase into a set of rules enforced by smart contracts. Anyone can launch a token with the same template. The path from trading fees to burns to dividends is written into the contract, and issuers cannot change tax rates, mint new supply or pull liquidity after launch. Anyone who has the contract address can verify the rules themselves instead of trusting the website.
      </div>

      <h2 className="mt-12 text-xl font-bold text-black">1. What This Protocol Solves</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-black/70">
        <p>Thousands of tokens are created on Solana every day, and most of them fail in one of three places.</p>
        <p><span className="font-semibold text-black">Front-running at open.</span> The moment liquidity lands, MEV bots bid higher priority fees to jump ahead of buy orders, so retail fills at the top.</p>
        <p><span className="font-semibold text-black">Backdoors left by the issuer.</span> Mint authority not revoked means supply can be inflated at will; update authority not revoked means tax can be set to 99% overnight.</p>
        <p><span className="font-semibold text-black">No one is accountable afterwards.</span> Fees keep being collected, they land in the team wallet, and holders get nothing.</p>
        <p>FLP answers each of these with one pillar: bundle-based launch, authorities revoked at launch, and fees flowing back to holders automatically.</p>
      </div>

      <h2 className="mt-12 text-xl font-bold text-black">2. Protocol Mechanics</h2>

      <h3 className="mt-8 font-semibold text-black">2.1 One-Click Deployment</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        On the Launch page you enter name, symbol, supply, tax rates and fee destination, and the protocol produces a standard token contract. All FLP tokens share the same contract logic; only the parameters differ, and those are fixed at creation and cannot be changed later.
      </p>

      <h3 className="mt-8 font-semibold text-black">2.2 Tax Structure (Two Separate Sets)</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        Buy and sell tax are 1% each, charged at protocol level by the Token-2022 transfer fee, with no admin override. On <span className="font-semibold text-black">the FLP token</span>, fees are split 40 / 30 / 20 / 10 across the burn pool, holder dividend pool, liquidity buyback and operations. On <span className="font-semibold text-black">tokens launched through the protocol</span>, fees belong to the issuer: the platform takes no cut, and only 10% is used to buy back and burn FLP — see 3.2.
      </p>

      <h3 className="mt-8 font-semibold text-black">2.3 Auto Burn</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        Tokens routed to the burn pool are destroyed by a Burn instruction signed by the treasury account (natively supported by Token-2022), so total supply drops immediately. Anyone can compare current supply against the initial 1,000,000,000 to verify how much has actually been burned — no need to take the team&apos;s word for it.
      </p>

      <h3 className="mt-8 font-semibold text-black">2.4 Holder Dividends</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        Every 7 days the protocol snapshots holder addresses and sends SOL from the dividend pool to each wallet by holding ratio. No manual claim, no staking, no extra action required.
      </p>
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        The payout depends entirely on trading volume and fees in that cycle. There is no floor and it can be zero. Holding is not a guaranteed yield.
      </div>

      <h3 className="mt-8 font-semibold text-black">2.5 Anti-MEV Launch</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        Liquidity injection and the first buys are submitted together as a Jito Bundle in the same block, which makes opening-snipe sandwiches much harder. It lowers the probability of being front-run; it does not eliminate MEV, because any public liquidity pool can still be arbitraged by bots.
      </p>

      <h3 className="mt-8 font-semibold text-black">2.6 Permission Model</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">These actions execute at launch and are verifiable on chain:</p>
      <ul className="mt-2 space-y-1.5 pl-5 text-sm leading-7 text-black/70">
        <li className="list-disc">Mint authority revoked — supply can never be increased</li>
        <li className="list-disc">Freeze authority revoked — no wallet can be frozen</li>
        <li className="list-disc">Tax and allocation parameters locked at deployment, no admin entry point</li>
        <li className="list-disc">Liquidity credentials locked or sent to a burn address</li>
      </ul>

      <h3 className="mt-8 font-semibold text-black">2.7 How the Tax Actually Reaches the Treasury</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        The 1% is deducted by the protocol on every token transfer, but it does not land in anyone&apos;s wallet automatically: it is recorded as a withheld balance on the receiving token account, including the pool&apos;s vault accounts. The protocol periodically runs a harvest that sweeps all withheld amounts into the fee treasury, then splits them by the allocation. Every step is signed by a multisig and every instruction and amount is verifiable in a block explorer.
      </p>
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        Tax arrives as tokens, dividends are paid in SOL, so a sale in between is unavoidable: roughly 50% of the FLP tax must be sold for SOL (dividends 30% + operations 10% + liquidity pairing 10%). To avoid handing the market a predictable dump schedule, the sale is split into 8–12 orders over several hours (TWAP) and the harvest window is randomized across 6–9 days rather than fixed on day 7.
      </div>

      <h2 className="mt-12 text-xl font-bold text-black">3. Token Economics</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-black/10 bg-white/60">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k} className="border-b border-black/5 last:border-0">
                <td className="w-44 px-4 py-3 align-top text-black/50">{k}</td>
                <td className="px-4 py-3 font-semibold text-black">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-8 font-semibold text-black">3.1 Fee Allocation</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {alloc.map((a) => (
          <div key={a.k} className="rounded-lg border border-black/10 bg-white/60 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-black">{a.k}</span>
              <span className="text-lg font-bold text-purple-700">{a.v}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-black/50">{a.d}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-8 font-semibold text-black">3.2 Tokens Launched Through the Protocol: 90 / 10</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        Anyone can launch a token here. The 1% buy/sell tax on that token belongs to the issuer: 90% is settled to the creator and the platform takes no cut. The remaining 10% buys FLP on the market and burns it immediately.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-black">Creator</span>
            <span className="text-lg font-bold text-purple-700">90%</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-black/50">Settled to the issuer each cycle — the issuer&apos;s main revenue source</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-black">FLP Buyback &amp; Burn</span>
            <span className="text-lg font-bold text-purple-700">10%</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-black/50">Buys FLP and burns it immediately, so supply keeps shrinking as the ecosystem grows</p>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-black/10 bg-white/60 px-4 py-3 text-xs leading-6 text-black/60">
        The logic: every additional active token in the ecosystem adds a buy-and-burn bid for FLP. Conversely, without tokens running on the protocol FLP has no support — the mother token&apos;s value is tied to ecosystem activity rather than funded by taxing new launches.
      </div>

      <h3 className="mt-8 font-semibold text-black">3.3 Distribution Principle</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        A fair launch means no presale, no private-round discount and no team allocation. The entire supply is injected into the liquidity pool at launch, so the team enters at the same price as everyone else and is tradeable at the same moment. The protocol does not skim tokens as a fee; operating costs are paid from the operations share of trading tax.
      </p>

      <h2 className="mt-12 text-xl font-bold text-black">4. Verifiability and Audit</h2>
      <ul className="mt-4 space-y-1.5 pl-5 text-sm leading-7 text-black/70">
        <li className="list-disc">Contract source is open, built with Solana&apos;s verifiable build so the artifact matches the on-chain bytes</li>
        <li className="list-disc">No audit has been performed yet; once done, the auditor, the full report and every finding (including unresolved ones) will be published with no selective disclosure</li>
        <li className="list-disc">All authority revocations happen inside the launch transaction and can be traced by anyone in a block explorer</li>
      </ul>

      <h2 className="mt-12 text-xl font-bold text-black">5. Roadmap</h2>
      <ol className="mt-4 space-y-2 text-sm leading-7 text-black/70">
        <li>Phase 1　Contract development and internal testing, whitepaper finalized</li>
        <li>Phase 2　Third-party audit, full end-to-end rehearsal on devnet</li>
        <li>Phase 3　Mainnet launch, token explorer live, first dividend settlement</li>
        <li>Phase 4　Multi-token dashboard, tax parameter template library</li>
      </ol>
      <p className="mt-3 text-xs text-black/40">No hard dates. Progress is tracked by phase — promising a date and missing it damages trust more than promising nothing.</p>

      <h2 className="mt-12 text-xl font-bold text-black">6. Risk Disclosure</h2>
      <div className="mt-4 space-y-2 text-sm leading-7 text-black/70">
        <p><span className="font-semibold text-black">Tax is slippage.</span> Every trade pays 1% on the way in or out; high-frequency traders lose far more than the headline rate suggests.</p>
        <p><span className="font-semibold text-black">Dividends are variable.</span> Payouts come from trading fees, so they approach zero when volume is thin.</p>
        <p><span className="font-semibold text-black">Fee-driven sell pressure.</span> About 50% of the FLP tax must be sold for SOL to fund dividends, which creates continuous sell pressure. TWAP splitting and a randomized window reduce the impact; they cannot remove it.</p>
        <p><span className="font-semibold text-black">MEV is not removable.</span> Bundles reduce the odds, they do not eliminate it.</p>
        <p><span className="font-semibold text-black">Contract risk.</span> An unaudited contract may hold unknown vulnerabilities that cause loss of funds.</p>
        <p><span className="font-semibold text-black">Liquidity risk.</span> Early liquidity is thin; large sells will move price hard.</p>
        <p><span className="font-semibold text-black">Regulatory risk.</span> Jurisdictions treat token issuance and dividends differently, which may limit availability.</p>
      </div>

      <h2 className="mt-12 text-xl font-bold text-black">7. Disclaimer</h2>
      <p className="mt-4 text-sm leading-7 text-black/70">
        This document describes technology and mechanics. It is not investment advice, an offer, or a promise of any return. FAIR is a high-risk asset and its price can go to zero. Do your own research and bear the full consequences.
      </p>

      <p className="mt-12 border-t border-black/10 pt-6 text-xs text-black/40 print:hidden">
        Last updated: November 2026 · This document is revised as the protocol develops; the current version on this page prevails
      </p>
    </main>
  );
}
