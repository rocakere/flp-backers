import type { Lang } from '@/lib/i18n';

export default function WhitepaperPage({ lang }: { lang: Lang }) {
  return lang === 'en' ? <EnBody /> : <ZhBody />;
}

function ZhBody() {
  const alloc = [
    { k: '销毁池 Burn Pool', v: '40%', d: '按周期批量打入官方销毁地址，总量持续通缩' },
    { k: '持币者分红池 Holders Dividend', v: '30%', d: '累计到 20 SOL 触发快照，按持仓占比以 SOL 自动分发；单次金额取决于当期税收规模' },
    { k: '流动性回购与加深 Liquidity', v: '20%', d: '回购代币注入交易池，提升深度、降低滑点' },
    { k: '运营与开发 Operations', v: '10%', d: '合约维护、前端托管、审计与后续开发' },
  ];

  const rows = [
    ['代币名称', 'FAIR'],
    ['代币符号', 'FAIR'],
    ['总供应量', '1,000,000,000 FAIR（总量固定、不可调；权限锁死、不可增发，随销毁逐步通缩）'],
    ['买入税 / 卖出税', '各 0.5%，在池子成交时以 SOL 一侧结算（FAIR 母币与发射的新币一致；钱包互转免费）'],
    ['FAIR 母币税收分配', '销毁 40% / 分红 30% / 流动性 20% / 运营 10%'],
    ['发射新币税收分配', '创作者 85% / 以 SOL 买 FAIR 并销毁 10% / 以 SOL 结算进 FAIR 加池金库 5%'],
    ['交易池手续费', '0.25%（与 0.5% 交易税叠加，一次往返合计约 1.5%）'],
    ['曲线手续费', '1%（协议固定抽 20%，其余 80% 归创作者）'],
    ['分红触发', '分红金库累计 20 SOL，到线即触发，与时间周期无关；单次金额取决于当期交易量与税收规模'],
    ['开发者预留', '仅 FAIR 母币：固定 5%（50,000,000 枚），发币时刻起 180 天 cliff，之后每 30 天释放 10%，第 480 天（约 16 个月）释放完毕，全部进入公开的硬件钱包单签地址；平台后续发射的新币无任何预留'],
    ['发行方式', '链上曲线首发：FAIR 母币 95%（9.5 亿枚）进曲线与迁移池、5% 按上述预留计划释放；平台后续新币 100% 进曲线与迁移池（曲线可售 70%、迁移 25%、开发者预留 5%）；母币与子币均无深度储备、无预售、无私募、无白名单'],
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-purple-700">WHITEPAPER · v0.3</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
        <span className="block sm:inline">FairLaunch Protocol</span>
        <span className="block sm:ml-2 sm:inline">白皮书</span>
      </h1>
      <p className="mt-4 text-sm text-gray-500">
        Solana 上的公平发射协议 · 设计说明草案，主网发射前持续修订
      </p>
      <div className="mt-6 print:hidden">
        <a
          href="/whitepaper.pdf"
          download="FLP-Whitepaper-zh-v0.3.pdf"
          className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 active:translate-y-0 active:scale-[0.98]"
        >
          ↓ 下载 PDF 版本
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wide">v0.3 最新</span>
        </a>
      </div>

      <div className="wp-card anim-fade-up mt-8 p-6 text-sm leading-7 text-gray-600">
        <span className="font-semibold text-gray-900">摘要　</span>
        FLP 是部署在 Solana 上的发币协议。它要做的事只有一件：把"公平发射"从营销词变成由合约强制执行的规则集合。任何人用同一套模板发币，税收到销毁到分红的路径全部写死在链上，发币方在发射后无法修改税率、无法增发、无法抽走流动性。任何人拿到合约地址，都能自己核对规则，无需相信官网的说法。
      </div>

      <h2 className="mt-12 text-xl font-bold text-black">一、这个协议解决什么</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-black/70">
        <p>Solana 上每天产生大量新代币，绝大多数死在四个地方。</p>
        <p><span className="font-semibold text-black">开盘被抢跑。</span>流动性刚注入，MEV 机器人用更高的小费把买单插到前面，普通人成交在最高点。</p>
        <p><span className="font-semibold text-black">发币方留后门。</span>mint 权限没放弃，随时能增发砸盘；update 权限没放弃，随时能把税率改到 99%。</p>
        <p><span className="font-semibold text-black">热度过去就没人负责。</span>税一直收，却收进团队口袋，持币者一分钱拿不到。</p>
        <p><span className="font-semibold text-black">流动性随时被抽走。</span>LP 留在团队手里，价格涨起来就撤池、改配或转走，剩下的人接一个空池。</p>
        <p>对应的四个解法就是 FLP 的四根支柱：Bundle 打包发射、权限在发射时即放弃、税收自动回流给持币者、LP 永久锁定不可撤回。</p>
      </div>

      <h2 className="mt-12 text-xl font-bold text-black">二、协议机制</h2>

      <h3 className="mt-8 font-semibold text-black">2.1 一键部署</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        在 Launch 页面只需填写名称、符号、图片与元数据、税权归属，以及可选的首次买入。总量（10 亿枚）、税率（买卖各 0.5%）与曲线参数（70 / 25 / 5、394.000000001 SOL 迁移阈值）由协议模板固定，页面上没有可改的输入框——不是"填了不许改"，是"从一开始就没有可填的地方"。所有通过协议发射的代币共享同一套合约逻辑，参数写死在模板里，之后不可修改。
      </p>

      <h3 className="mt-8 font-semibold text-black">2.2 税率结构（分两套，别混）</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        买入税与卖出税各 0.5%，在池子 swap 成交时于 SOL 一侧结算扣除，钱包之间互相转账免费，没有管理员修改入口。<span className="font-semibold text-black">FAIR 母币</span>的税按 40 / 30 / 20 / 10 四档分配至销毁池、持币者分红池、流动性回购与运营开发；<span className="font-semibold text-black">通过协议发射的新币</span>，按 85 / 10 / 5 分配：85% 结算给创作者、10% 买入 FAIR 并立即销毁、5% 以 SOL 结算直接进入 FAIR 加池金库（与母币税的 10% 合并计数，凑够 20 SOL 才加池），详见 3.2。
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        曲线阶段另有一笔 1% 的 swap 手续费，由曲线程序在成交时扣除：协议固定抽走 20%，其余 80% 归代币创作者。它与 0.5% 交易税（SOL 侧结算）叠加，所以曲线阶段每笔买入的实际成本约 1.5%。
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        交易池本身另收 0.25% 手续费，由做市程序在 swap 里直接扣，计入池内供 LP 提取。这笔钱和 0.5% 交易税是两套独立机制，会叠加：一次买入再卖出，用户实际损耗约 0.5% + 0.5% + 0.25% + 0.25% ≈ 1.5%，另加滑点。
      </p>

      <h3 className="mt-8 font-semibold text-black">2.3 自动销毁</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        进入销毁池的代币由金库账户直接调用 Burn 指令销毁（Token-2022 原生支持），链上总供应量立即减少。总供应上限为 10 亿枚，且 mint 权限在发射时即置空（硬编码、无管理员入口），任何人都无法增发，因此总供应只会因销毁而单向减少。任何人都可以比对当前总供应量与 10 亿上限的差值，核对实际销毁量，不存在"团队声称已销毁"这种说法。
      </p>

      <h3 className="mt-8 font-semibold text-black">2.4 持币分红</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        分红不按固定周期。分红金库的 SOL 累计到 20 SOL 才触发一次：当次做持币快照、按持仓占比把 SOL 直接转入各钱包，不需要手动领取、不需要质押。触发只看金库余额，与时间周期无关；一到线就做快照并分发。单地址应得不足 0.005 SOL 的份额滚入下一期，不单独发一笔粉尘转账。
      </p>
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        分红金额完全取决于该周期的交易量与税收、以及平台的发币量与成交，没有保底，可能为零。不存在"持有即稳定收益"。
      </div>

      <h3 className="mt-8 font-semibold text-black">2.5 防 MEV 发射</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        曲线首发阶段，开盘第一笔定价由合约决定，不存在"抢先进池"这个动作；迁移建池与首批买单通过 Jito Bundle 打包提交，在同一区块内完成，避免迁移瞬间被夹。这降低抢跑概率，但不能消除 MEV——公开交易池始终存在被机器人套利的可能。
      </p>

      <h3 className="mt-8 font-semibold text-black">2.6 权限模型</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">发射时执行以下动作，全部可在链上验证：</p>
      <ul className="mt-2 space-y-1.5 pl-5 text-sm leading-7 text-black/70">
        <li className="list-disc">mint authority 置空——此后任何人无法增发，10 亿是不可突破的上限，总量只随销毁单向减少</li>
        <li className="list-disc">freeze authority 置空——无法冻结任何钱包</li>
        <li className="list-disc">税率与分配参数写入合约后不可变更，无管理员修改入口</li>
        <li className="list-disc">流动性凭证永久锁定在合约 PDA 中，不可撤回、不可改配、不可转移</li>
      </ul>

      <h3 className="mt-8 font-semibold text-black">2.7 税金如何真正到手</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        0.5% 的税不在代币转账环节收取——钱包之间互相转账是免费的、一分不扣。它只在池子成交（买入或卖出）的那一刻、在 SOL 一侧结算，由交易指令一次性扣除并直接记入税金金库。税从第一秒起就是 SOL，协议从不把收到的代币卖成 SOL，因此不存在&quot;先把币卖掉、再换成 SOL&quot;这一步，也不存在可被狙击的卖出时点。keeper 定时把金库里的 SOL 按 40 / 30 / 20 / 10（母币）或 85 / 10 / 5（子币）拆分并转账，每一步在浏览器上都能查到指令与金额。
      </p>
      <h4 className="mt-6 font-semibold text-black">2.7.1 税权只有一把钥匙</h4>
      <p className="mt-2 text-sm leading-7 text-black/70">
        税金金库的提款权只有一把钥匙：<span className="font-mono text-xs">config</span> PDA（<span className="font-mono text-xs">[b&quot;config&quot;]</span> 派生）。任何外部钱包都无法签发提款；结算指令由 keeper 发起，但签名者是 config PDA 自己（<span className="font-mono text-xs">invoke_signed</span>），keeper 只能推动、不能改变任何一个 lamport 的去向。审计方只需核对一次 seeds 推导即可独立验算，无需读合约源码。
      </p>
      <h4 className="mt-6 font-semibold text-black">2.7.2 结算不产生二次扣税</h4>
      <p className="mt-2 text-sm leading-7 text-black/70">
        税款以 SOL 入账，分账是纯 SOL 转账，不存在&quot;提现时再被扣一道 0.5%&quot;的逐轮衰减。每一轮结算到账恒等于金库余额按比例切分的结果，逐 lamport 可复算，85 / 10 / 5 与 40 / 30 / 20 / 10 都不会被二次侵蚀。
      </p>
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        不卖币，也就没有砸盘时点。税从第一秒就是 SOL，协议全程不把代币卖成 SOL；唯一动用 SOL 的主动行为是注池——把加池金库里累计的 SOL 与预留的 FAIR 组成 LP，注入后立即永久锁定。因此用户看到的&quot;卖出压力&quot;只来自正常交易，不来自协议自身的换仓动作。
      </div>

      <h3 className="mt-8 font-semibold text-black">2.8 FAIR 母币的开发者预留</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        FAIR 是 FLP 的母币，总量 10 亿枚。与平台后续发行的所有新币不同，FAIR 为覆盖审计、前端托管与初期开发，预留 <span className="font-semibold text-black">5%（50,000,000 枚）</span>给开发者，其余 95%（950,000,000 枚）全部进入曲线与迁移池。
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        这 5% 不走转账，而是在发币交易发生的那一刻直接铸入链上的 <span className="font-mono text-xs">dev_vault</span> 账户（PDA：<span className="font-mono text-xs">[b&quot;dev_vault&quot;]</span>），因此进库数量是足额的 50,000,000 枚，不会在入库环节被扣税。此后它只能通过 <span className="font-mono text-xs">claim_dev_vested</span> 指令流向初始化时写死的收款地址——该地址写入合约配置后不可更改，任何人（包括开发者本人）都无法把钱改投他处，第三方也可以代为触发释放，资金去向由合约固定。
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">释放规则：</p>
      <ul className="mt-2 space-y-1.5 pl-5 text-sm leading-7 text-black/70">
        <li className="list-disc">发币时刻起 <span className="font-semibold text-black">180 天</span>为 cliff（全部锁定），期间可领取数量为 0</li>
        <li className="list-disc">cliff 结束后每 30 天释放总量的 10%，共 10 期，每期 5,000,000 枚</li>
        <li className="list-disc">第 <span className="font-semibold text-black">480 天（约 16 个月）</span>释放完毕；任一时刻可领取的累计量 = floor((已过天数 − 180) / 30) × 10%，重复领取不会超发</li>
        <li className="list-disc">每次释放是一笔普通的 Token-2022 转账，同样按 0.5% 计税，因此实际到手略低于名义数量，这部分税进入母币 40 / 30 / 20 / 10 的分账</li>
      </ul>
      <p className="mt-3 text-sm leading-7 text-black/70">
        该收款地址在主网是一个硬件钱包单签地址，链上公开可查。不设多签、不设解锁后门、不设任何二次调整或追加预留的入口；与常见的 20% 团队份额相比，这里只有 5%、有明确时间表、有可查地址。平台后续发射的子币一律零预留，创作者收入只来自 85% 的交易税分成——两套规则的完整差异见第三章对照表。
      </p>

      <h2 className="mt-12 text-xl font-bold text-black">三、代币经济</h2>
      <div className="mt-4 overflow-x-auto wp-card">
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

      <h3 className="mt-8 font-semibold text-black">母币与子币：两套规则对照</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        FAIR 是平台母币，为覆盖审计、前端托管与初期开发设有开发者预留；平台上线的每一个新币沿用零预留的公平发射标准。这不是两套标准，而是分层的设计选择——下表把差异一次写清，不留任何需要&quot;事后发现&quot;的隐含份额。
      </p>
      <div className="mt-3 overflow-x-auto wp-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="w-32 px-4 py-2 text-left text-xs font-normal text-black/40">项目</th>
              <th className="px-4 py-2 text-left text-xs font-normal text-black/40">FAIR 母币</th>
              <th className="px-4 py-2 text-left text-xs font-normal text-black/40">平台发射的新币</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['总量', '1,000,000,000 FAIR（固定）', '1,000,000,000（固定）'],
              ['开发者预留', '固定 5%（50,000,000 枚）：180 天 cliff + 10 期月度释放，第 480 天释放完毕', '0（无任何预留，项目方不持币）'],
              ['进曲线与迁移池', '95%（950,000,000 枚）', '100%（曲线 70% / 迁移 25% / 预留 5%）'],
              ['交易税（SOL 侧结算）', '0.5%', '0.5%'],
              ['税收分配', '销毁 40% / 分红 30% / 流动性 20% / 运营 10%', '创作者 85% / 回购销毁 FAIR 10% / FAIR 加池 5%'],
              ['开发者收入来源', '运营档 10% + 预留份额的月度释放', '85% 交易税分成（平台不抽成）'],
            ].map(([k, a, b]) => (
              <tr key={k} className="border-b border-black/5 last:border-0">
                <td className="w-32 px-4 py-3 align-top text-black/50">{k}</td>
                <td className="px-4 py-3 align-top font-semibold text-black">{a}</td>
                <td className="px-4 py-3 align-top font-semibold text-black">{b}</td>
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

      <h3 className="mt-8 font-semibold text-black">3.2 通过协议发射的新币：85 / 10 / 5</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        任何人在协议上一键发币，该代币收到的 0.5% 买卖税按以下方式分配：<span className="font-semibold text-black">85% 结算给创作者</span>，<span className="font-semibold text-black">10% 在市场上买入 FAIR 并立即销毁</span>，<span className="font-semibold text-black">5% 以 SOL 结算直接进 FAIR 加池金库</span>（与母币税的 10% 合并计数，凑够 20 SOL 才加池，加完立即永久锁定 LP）。
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-black">创作者</span>
            <span className="text-lg font-bold text-purple-700">85%</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-black/50">按周期结算给发币者——发币方的主要收入来源</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-black">回购并销毁 FAIR</span>
            <span className="text-lg font-bold text-purple-700">10%</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-black/50">以 SOL 结算的 10% 用于买入 FAIR 并立即销毁，生态越活跃 FAIR 总量越少</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-black">FAIR 加池金库</span>
            <span className="text-lg font-bold text-purple-700">5%</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-black/50">该币税的 5% 以 SOL 结算直接进入 FAIR 加池金库（不给该币单独建池），与母币税那 10% 合并到 20 SOL 再统一加池</p>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-black/10 bg-white/60 px-4 py-3 text-xs leading-6 text-black/60">
        这个逻辑的含义：每多一个在协议上跑起来的币，就给 FAIR 增加一份买盘并带走一份供应，同时新币税里的 5% 以 SOL 结算归入 FAIR 加池金库，让 FAIR 自己的池子随生态交易变厚、滑点下降。反过来，没有币在协议上跑，FAIR 就没有支撑——母币的价值绑在生态活跃度上，而不是靠向新发币抽税。
      </div>

      <div className="mt-3 rounded-lg border border-black/10 bg-white/60 px-4 py-3 text-xs leading-6 text-black/60">
        加池金库里的 SOL 有两路来源：一是 FAIR 母币税流动性档（20%）里的一半——即占全部税收的 10%——以 SOL 结算划入的 SOL，二是平台发射的新币税里 5% 以 SOL 结算直接划入的 SOL。两路进的是同一个加池金库，累计超过 20 SOL 就自动触发一次加池并立即永久锁定该批 LP——低于 20 SOL 时加池对盘口的改善没有意义，所以不触发。<br />加池用的 FAIR 本币侧只来自母币税流动性档里留存的那一半，不存在任何额外储备账户可动。链上对累计投入加池的 FAIR 设了硬上限（常量 <span className="font-mono text-xs">FAIR_ADD_CAP_TOKENS = 500,000,000</span>，计数在 <span className="font-mono text-xs">config.fair_added_to_pools</span>），到顶后加池指令直接被链上拒绝（<span className="font-mono text-xs">CapReached</span>），加池停止；此时流动性档里留存的 FAIR 仍按税权拆分留在对应桶里，不会自动销毁。
      </div>

      <h3 className="mt-8 font-semibold text-black">3.3 发行原则</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        公平发射意味着没有预售轮、没有私募折扣、没有白名单、没有内部价。平台发射的每一个新币都是零预留：任何人在同一时刻、以同一个起点价格买入，价格由链上曲线按买入量自动抬升，规则写死在合约里，发币方无法在过程中改价或插队。
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        协议自身不抽取代币作为费用，运营成本从交易税中的运营部分支出。唯一的例外是 FAIR 母币自身为覆盖审计与初期开发预留的 5%（见 2.8）——该份额在发币时即铸入链上金库、180 天后按月度释放、收款地址写死且公开可查；开发者不参与曲线首发的前排购买，也不在二级市场自买自卖制造成交量。
      </p>

      <h3 className="mt-8 font-semibold text-black">3.4 首发机制与流动性安排</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        首发走链上曲线（bonding curve），而不是自建公募、也不是一次性把全部供应砸进池子。原因是流动性深度只取决于池子里的 SOL 一侧：供应全倒进池子只会把单价压到极低，一个大额买单就能吃掉几个百分点。曲线把定价过程公开化，也让筹措到的 SOL 直接成为池子的深度。
      </p>
      <div className="mt-3 overflow-x-auto wp-card">
        <table className="w-full text-sm">
          <tbody>
            {[
              ['曲线发售数量', '约 700,000,000 枚（70%）'],
              ['起始 FDV', '约 241 SOL（按 SOL = $68 计约 $16,400，开盘单价 $0.0000164）'],
              ['曲线总募资', '394.000000001 SOL（等于迁移阈值，达到即毕业，非人为设定）'],
              ['迁移进池数量', '250,000,000 枚（25%）+ 全部 394.000000001 SOL'],
              ['主池实收', '约 249,500,001 枚（只扣 0.2% 协议迁移费，迁移不经过转账税）+ 约 394 SOL'],
              ['协议迁移费', '0.2%，约 500,000 枚，以独立锁仓 LP 头寸留存，不归项目方'],
              ['主池开盘价', '约 1.579e-6 SOL/枚（≈ $0.000107，FDV ≈ 1,579 SOL），为起始价的 6.55 倍，与曲线迁移价完全连续'],
              ['曲线手续费', '1%（协议固定抽 20%，其余 80% 归创作者）'],
              ['深度储备', '0 枚进池；开发者预留 5%（50,000,000 枚）单列，毕业时提起，不进池、不抛售'],
              ['交易池手续费', '0.25%'],
            ].map(([k, v]) => (
              <tr key={k} className="border-b border-black/5 last:border-0">
                <td className="w-40 px-4 py-3 align-top text-black/50">{k}</td>
                <td className="px-4 py-3 font-semibold text-black">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm leading-7 text-black/70">
        曲线卖满后自动迁移成交易池，流动性就是曲线筹到的 SOL，发币方不需要先垫付建池资金。供给怎么切由参数写死，不靠人定：<span className="font-semibold text-black">percentageSupplyOnMigration = 25</span> 的含义是&quot;迁移进 DAMM 的供给比例&quot;（250,000,000 枚），曲线可售部分为 70%（700,000,000 枚），另有 5%（50,000,000 枚）是开发者预留（leftover），三者严格相加等于总量 10 亿枚。实测（本地测试网毕业快照）：swapBaseAmount = 700,000,000 枚（70%）、migrationBaseThreshold = 250,000,000 枚（25%）、leftover = 50,000,000 枚（5%）；migrationQuoteThreshold = 394.000000001 SOL。迁移只从代币侧扣一次协议费：250,000,000 枚转入 DAMM，扣 0.2% 协议流动性迁移费 500,000 枚，主池金库实收约 249,500,001 枚——这笔 50 万枚以独立锁仓 LP 头寸留存，不在任何人可撤回的账户中。整个过程不经过任何转账税。预留的 5,000 万枚既不进池、也不从池里卖出，它留在 DBC 池里表现为&quot;未卖完&quot;，迁移完成后由 keeper 发一笔 <span className="font-mono text-xs">withdraw_leftover</span> 一次性提到团队地址（实测提出后团队余额 750,000,000 枚 = 曲线买入 700,000,000 + 预留 50,000,000）。税收由 keeper 定时结算：每 10 分钟把金库里的 SOL 按协议比例拆分到销毁、分红、流动性与运营四档，全部是纯 SOL 转账。
      </p>
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        两个必须知道的细节。第一，迁移不经过任何转账税：代币转入池子的那一刻不扣 0.5%，只扣 0.2% 协议迁移费 500,000 枚，金库实收约 249,500,001 枚，逐枚可复算。第二，预留的 5,000 万枚在 DBC 池里长期处于&quot;未卖完&quot;状态，迁移不会把它搬进 DAMM 池，也不会被抛售——它只能由 keeper 发 <span className="font-mono text-xs">withdraw_leftover</span> 提到团队地址；这笔提取与池子流动性无关，不改变价格。
      </div>

      <h4 className="mt-6 font-semibold text-black">3.4.1 迁移阶段的四条硬约束（实测）</h4>
      <p className="mt-2 text-sm leading-7 text-black/70">
        第一，迁移费档位必须是 <span className="font-mono text-xs">Customizable</span>，它对应官方常量 <span className="font-mono text-xs break-all">A8gMrEPJkacWkcb3DGwtJwTe16HktSEfvwtuDh2MCtck</span>；档位与该地址强绑定，换成 FixedBps100 会被链上直接拒绝（<span className="font-mono text-xs">InvalidMigrationFeeOption</span>）。第二，迁移后的池费模式为 <span className="font-mono text-xs">OutputToken</span>（费用以输出币结算），<span className="font-mono text-xs">compounding_fee_bps = 0</span>，与转账税机制完全解耦。第三，协议固定抽 0.2% 的流动性迁移费，从注入池子的代币侧扣除，且迁移全程不再有转账税：实测注入 250,000,000 枚，只扣 0.2% 迁移费 500,000 枚，金库实收约 249,500,001 枚，与扣减逐枚对得上，与供给分配比例无关。第四，迁移前必须给曲线池的 pool authority PDA 预充 ≥0.2 SOL 支付新建池账户的租金；付款钱包只付交易费，漏充会在建池那一步以 <span className="font-mono text-xs">insufficient lamports</span> 中断。
      </p>
      <h4 className="mt-6 font-semibold text-black">3.4.2 曲线收尾必须用 PartialFill</h4>
      <p className="mt-2 text-sm leading-7 text-black/70">
        曲线的容量严格等于迁移阈值——实测四条已毕业主网配置，容量与阈值的差值均为 0 lamports，这不是参数错误而是生产常态。因此最后一笔买入必然撞上容量边界，单笔精确输入永远跨不过去。收尾必须用 PartialFill 循环补单，直到迁移进度 ≥ 2；超出容量的部分按原额退回，买家不承担额外成本。
      </p>

      <h4 className="mt-6 font-semibold text-black">3.4.3 锁仓 LP 与池费归属</h4>
      <p className="mt-2 text-sm leading-7 text-black/70">
        迁移锁仓 LP 的 position NFT 由协议 config PDA 持有，0.25% 池费结算后进入 <span className="font-mono text-xs">sol_buffer</span>，不归项目方或任何私人钱包；LP 份额永久锁定，费用收益同步归协议所有。
      </p>

      <h2 className="mt-12 text-xl font-bold text-black">四、可验证性与审计</h2>
      <ul className="mt-4 space-y-1.5 pl-5 text-sm leading-7 text-black/70">
        <li className="list-disc">合约源码开源，使用 Solana 可验证构建，构建结果与链上字节一致</li>
        <li className="list-disc">审计尚未进行；完成后公开机构名称、报告全文与发现的问题（含未修复项），不选择性披露</li>
        <li className="list-disc">所有权限放弃动作在发射交易中完成，任何人可在浏览器回溯该笔交易</li>
        <li className="list-disc">
          不可变性清单（第 4 条）：所有比例与阈值以编译期常量写死——母币税 40 / 30 / 20 / 10，子币税 85 / 10 / 5，20 SOL 的分红与加池下限，5 亿枚的加池上限；全部 15 条指令逐条列明签名门槛；全仓不存在 <span className="font-mono text-xs">set_</span>、暂停、关闭、迁移入口。上线时升级权永久置空，链上显示 <span className="font-mono text-xs">Upgrade Authority: none</span>，此后程序与规则均不可替换。
        </li>
      </ul>
      <div className="mt-3 rounded-lg border border-black/10 bg-black/[0.02] px-4 py-3 text-xs leading-6 text-black/60">
        逐条清单与可复现的核验命令见仓库 <span className="font-mono text-[11px]">IMMUTABILITY.md</span>：<span className="font-mono text-[11px]">grep -rn &quot;pub fn set_&quot; programs/flp-treasury/src/lib.rs</span> 无任何输出；<span className="font-mono text-[11px]">close_account</span> 仅出现在 4 处临时 WSOL 账户；不存在的指令包括 set_params、pause、migrate、close、set_upgrade_authority。
      </div>

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
        <p><span className="font-semibold text-black">税收即滑点。</span>每笔链上交易都会被扣 0.5% 的买入税或卖出税（钱包互转不扣），高频交易者的实际损耗显著高于名义税率。加上 0.25% 池子手续费，一次往返的综合损耗约 1.5%，另加滑点。</p>
        <p><span className="font-semibold text-black">分红不确定。</span>分红来自交易税，交易冷淡时分红趋近于零。</p>
        <p><span className="font-semibold text-black">卖出压力（已消除）。</span>税本身就是 SOL，不需要任何卖出换仓；协议层面不存在持续卖出压力。</p>
        <p><span className="font-semibold text-black">销毁即通缩。</span>新币税中的 10% 用于买入并销毁 FAIR，母币总量会逐轮减少；通缩不等于上涨，价格仍由买卖决定。</p>
        <p><span className="font-semibold text-black">曲线手续费抽成。</span>曲线阶段 1% 的 swap 手续费中，协议固定抽 20%，创作者拿 80%，这部分成本与 0.5% 交易税（SOL 侧）叠加。</p>
        <p><span className="font-semibold text-black">MEV 无法根除。</span>Bundle 只能降低概率，不能消除。</p>
        <p><span className="font-semibold text-black">合约风险。</span>未经审计的合约存在未知漏洞，可能造成资金损失。</p>
        <p><span className="font-semibold text-black">流动性风险。</span>曲线阶段池子尚不存在，价格由曲线决定；迁移初期深度有限，大额卖出仍会严重砸价。池子深度靠加池逐步增厚，需要时间。</p>
        <p><span className="font-semibold text-black">首发阶段的税。</span>曲线买入同样扣 0.5% 的 SOL 侧税，买家实际到手为成交量的 99.5%，这部分税金在发射日就开始累积，需要同步启动 harvest。</p>
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
    { k: 'Holders Dividend', v: '30%', d: 'Snapshot triggered at 20 SOL, paid in SOL by holding ratio' },
    { k: 'Liquidity Buyback', v: '20%', d: 'Buys tokens back into the pool to deepen liquidity and cut slippage' },
    { k: 'Operations', v: '10%', d: 'Contract maintenance, frontend hosting, audit and further development' },
  ];

  const rows = [
    ['Token Name', 'FAIR'],
    ['Symbol', 'FAIR'],
    ['Total Supply', '1,000,000,000 FAIR (fixed, not adjustable; authorities locked, no minting, supply shrinks only through burns)'],
    ['Buy / Sell Tax', '0.5% each (same for FAIR and launched tokens)'],
    ['FAIR Fee Allocation', 'Burn 40% / Dividends 30% / Liquidity 20% / Operations 10%'],
    ['Launched Token Fees', 'Creator 85% / FAIR buyback-and-burn 10% / 5% sold to SOL into the FAIR liquidity vault'],
    ['Pool Swap Fee', '0.25% (stacks on the 0.5% trading tax — round trip is about 1.5%)'],
    ['Curve Swap Fee', '1% (protocol takes a fixed 20%, the other 80% goes to the creator)'],
    ['Dividend Trigger', '20 SOL in the dividend vault; payout size depends on the tax collected that period'],
    ['Developer Allocation', 'FAIR mother coin only: a fixed 5% (50,000,000 tokens). 180-day cliff from the launch transaction, then 10% of the total every 30 days, fully released on day 480 (about 16 months) into a publicly disclosed hardware-wallet address. Every token launched on the platform afterwards carries no allocation at all'],
    ['Distribution', 'On-chain bonding curve launch: the FAIR mother coin puts 95% (950,000,000 tokens) into the curve and the migration pool and releases the 5% on the schedule above; every token launched afterwards puts 100% into the curve and pool (70% sellable, 25% migrated, 5% dev reserve). Neither the mother coin nor launched tokens carry a depth reserve, presale, private round or allowlist'],
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-purple-700">WHITEPAPER · v0.3</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
        <span className="block sm:inline">FairLaunch Protocol</span>
        <span className="block sm:ml-2 sm:inline">Whitepaper</span>
      </h1>
      <p className="mt-4 text-sm text-gray-500">
        A fair launch protocol on Solana · design draft, revised continuously until mainnet launch
      </p>
      <div className="mt-6 print:hidden">
        <a
          href="/whitepaper-en.pdf"
          download="FLP-Whitepaper-en-v0.3.pdf"
          className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 active:translate-y-0 active:scale-[0.98]"
        >
          ↓ Download PDF
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wide">v0.3 latest</span>
        </a>
      </div>

      <div className="wp-card anim-fade-up mt-8 p-6 text-sm leading-7 text-gray-600">
        <span className="font-semibold text-gray-900">Abstract　</span>
        FLP is a token launch protocol deployed on Solana. It does one thing: turn "fair launch" from a marketing phrase into a set of rules enforced by smart contracts. Anyone can launch a token with the same template. The path from trading fees to burns to dividends is written into the contract, and issuers cannot change tax rates, mint new supply or pull liquidity after launch. Anyone who has the contract address can verify the rules themselves instead of trusting the website.
      </div>

      <h2 className="mt-12 text-xl font-bold text-black">1. What This Protocol Solves</h2>
      <div className="mt-4 space-y-3 text-sm leading-7 text-black/70">
        <p>Thousands of tokens are created on Solana every day, and most of them fail in one of four places.</p>
        <p><span className="font-semibold text-black">Front-running at open.</span> The moment liquidity lands, MEV bots bid higher priority fees to jump ahead of buy orders, so retail fills at the top.</p>
        <p><span className="font-semibold text-black">Backdoors left by the issuer.</span> Mint authority not revoked means supply can be inflated at will; update authority not revoked means tax can be set to 99% overnight.</p>
        <p><span className="font-semibold text-black">No one is accountable afterwards.</span> Fees keep being collected, they land in the team wallet, and holders get nothing.</p>
        <p><span className="font-semibold text-black">Liquidity pulled at will.</span> When the LP stays in the team&apos;s hands, a rally is the cue to pull the pool, reconfigure it or move it elsewhere, leaving everyone else with an empty shell.</p>
        <p>FLP answers each of these with a pillar of its own: bundle-based launch, authorities revoked at launch, fees flowing back to holders automatically, and LP permanently locked.</p>
      </div>

      <h2 className="mt-12 text-xl font-bold text-black">2. Protocol Mechanics</h2>

      <h3 className="mt-8 font-semibold text-black">2.1 One-Click Deployment</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        On the Launch page you only enter the name, symbol, image and metadata, the tax destination, and an optional first buy. Total supply (1,000,000,000), the trading fee (0.5%) and the curve parameters (70/30, 394.0 SOL migration threshold) are fixed by the protocol template, and there is no editable input for them on the page — not &quot;filled in and then locked&quot;, but &quot;there was never anything to fill in&quot;. All tokens launched through the protocol share the same contract logic, with the parameters hard-coded in the template and unchangeable afterwards.
      </p>

      <h3 className="mt-8 font-semibold text-black">2.2 Tax Structure (Two Separate Sets)</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        Buy and sell fee is 0.5%, charged at the trading layer — first by the bonding curve, then by the DAMM v2 pool after migration — and settled in SOL, with no admin override. On <span className="font-semibold text-black">the FAIR token</span>, fees are split 40 / 30 / 20 / 10 across the burn pool, holder dividend pool, liquidity buyback and operations. On <span className="font-semibold text-black">tokens launched through the protocol</span>, fees are split 85 / 10 / 5: 85% settles to the creator, 10% buys FAIR on the market and burns it immediately, and 5% is sold for SOL into the FAIR liquidity vault (counted together with the 10% of the FAIR tax, a top-up fires at 20 SOL) — see 3.2.
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        Fee take, stated plainly: the <span className="font-semibold text-black">total trading fee is 50 bps</span>. Meteora&apos;s protocol takes a fixed <span className="font-semibold text-black">20% of it (10 bps)</span>, and FAIR&apos;s protocol keeps the remaining <span className="font-semibold text-black">80% (40 bps)</span>, which is the pool that the 40 / 30 / 20 / 10 and 85 / 10 / 5 splits divide. On the bonding curve this split is measured on-chain. After migration the same split holds: the LP-side 80% (40 bps) accrues to the FAIR config PDA, which owns the pool position. If the pool runs in compounding mode, the share set by compounding_fee_bps is reinvested into the pool&apos;s reserves and only the remainder is claimable — our launch configuration sets that share to zero, so the full 40 bps is claimable. The deployed config&apos;s collect_fee_mode and compounding_fee_bps are published before launch.
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        The curve charges the same 0.5% on every fill: the protocol takes a fixed 20% of it and the remaining 80% goes to the token creator. Nothing is stacked on top — there is no transfer tax, so moving tokens between wallets, an OTC deal or a CEX deposit costs nothing.
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        The trading pool charges an additional 0.25% swap fee, deducted by the AMM inside the swap and retained in the pool for LPs. These are two independent mechanisms and they stack: a buy followed by a sell costs roughly 0.5% + 0.5% + 0.25% + 0.25% ≈ 1.5%, plus slippage.
      </p>

      <h3 className="mt-8 font-semibold text-black">2.3 Auto Burn</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        Tokens routed to the burn pool are destroyed by a Burn instruction signed by the treasury account (natively supported by Token-2022), so total supply drops immediately. Supply is hard-capped at 1,000,000,000 and the mint authority is revoked at launch with no admin entry point, so nobody can ever mint more: supply only moves down through burns. Anyone can compare current supply against the 1,000,000,000 cap to verify how much has actually been burned — no need to take the team&apos;s word for it.
      </p>

      <h3 className="mt-8 font-semibold text-black">2.4 Holder Dividends</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        Dividends are not on a fixed cycle. Once the dividend vault holds 20 SOL, the protocol snapshots holder addresses and sends SOL to each wallet by holding ratio — no manual claim, no staking. The trigger is the vault balance alone — no time cycle; once it crosses the line the snapshot and payout happen. Any share below 0.005 SOL rolls into the next round instead of sending a dust transfer.
      </p>
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        The payout depends entirely on trading volume and fees in that cycle, and on the platform's launch count and trading activity. There is no floor and it can be zero. Holding is not a guaranteed yield.
      </div>

      <h3 className="mt-8 font-semibold text-black">2.5 Anti-MEV Launch</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        On the curve, the opening price is set by the contract, so there is no "be first into the pool" race; the migration pool creation and first buys are submitted as a Jito Bundle in the same block, which makes sandwiching the migration much harder. It lowers the probability of being front-run; it does not eliminate MEV, because any public liquidity pool can still be arbitraged by bots.
      </p>

      <h3 className="mt-8 font-semibold text-black">2.6 Permission Model</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">These actions execute at launch and are verifiable on chain:</p>
      <ul className="mt-2 space-y-1.5 pl-5 text-sm leading-7 text-black/70">
        <li className="list-disc">Mint authority revoked — 1,000,000,000 is a hard cap that can never be raised; supply only moves down through burns</li>
        <li className="list-disc">Freeze authority revoked — no wallet can be frozen</li>
        <li className="list-disc">Tax and allocation parameters locked at deployment, no admin entry point</li>
        <li className="list-disc">Liquidity permanently locked in a program PDA — cannot be withdrawn, reconfigured or moved</li>
      </ul>

      <h3 className="mt-8 font-semibold text-black">2.7 How the Tax Actually Reaches the Treasury</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        The 0.5% is not charged on token transfers at all — wallet-to-wallet transfers are free and take nothing. It is charged only at the moment of a pool fill (a buy or a sell), settled on the SOL side and credited straight into the fee treasury in the same instruction. From the first second the tax is SOL: the protocol never sells the received token for SOL, so there is no &quot;sell first, convert afterwards&quot; step and no predictable dump point to front-run. A keeper splits the SOL in the treasury by 40 / 30 / 20 / 10 (mother coin) or 85 / 10 / 5 (launched tokens) and transfers it out; every instruction and amount is verifiable in a block explorer.
      </p>
      <h4 className="mt-6 font-semibold text-black">2.7.1 There Is Exactly One Key to the Tax</h4>
      <p className="mt-2 text-sm leading-7 text-black/70">
        The treasury has exactly one key for withdrawals: the config PDA (seeds <span className="font-mono text-xs">[b&quot;config&quot;]</span>). No external wallet can sign a withdrawal; the keeper initiates settlement, but the signer is the config PDA itself through <span className="font-mono text-xs">invoke_signed</span>, so a keeper can push the call and cannot redirect a single lamport. Auditors can verify this with one seeds derivation, without reading the contract.
      </p>
      <h4 className="mt-6 font-semibold text-black">2.7.2 No Second Cut at Settlement</h4>
      <p className="mt-2 text-sm leading-7 text-black/70">
        Tax arrives as SOL and the split is plain SOL transfers, so there is no compounding &quot;0.5% taken again on withdrawal&quot; decay. Each settlement pays out exactly the treasury balance cut by the fixed ratio, reproducible lamport by lamport; neither 85 / 10 / 5 nor 40 / 30 / 20 / 10 is ever taxed a second time.
      </p>
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        No sale, therefore no dump point. The tax is SOL from the first second and the protocol never converts a token into SOL; the only active use of SOL is liquidity provisioning — the SOL accumulated in the liquidity vault is paired with reserved FAIR and injected as an LP, locked permanently on arrival. Any selling pressure users see comes from ordinary trading, not from the protocol rebalancing itself.
      </div>

      <h3 className="mt-8 font-semibold text-black">2.8 The FAIR Developer Allocation</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        FAIR is the platform&apos;s mother coin, 1 billion tokens. Unlike every token the platform launches afterwards, FAIR reserves <span className="font-semibold text-black">5% (50,000,000 tokens)</span> for the developer to cover audits, frontend hosting and initial development; the other 95% (950,000,000 tokens) goes into the curve and the migration pool.
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        That 5% is not transferred but minted directly into an on-chain <span className="font-mono text-xs">dev_vault</span> account (PDA <span className="font-mono text-xs">[b&quot;dev_vault&quot;]</span>) in the launch transaction, so the vault receives the full 50,000,000 — and intake is not charged any transfer fee. From then on it can only move through the <span className="font-mono text-xs">claim_dev_vested</span> instruction, and only to the beneficiary address fixed in the config at initialisation. That address cannot be changed afterwards: nobody, the developer included, can redirect the funds, and any third party can trigger a release — the destination is enforced by the program, not by trust.
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">Release schedule:</p>
      <ul className="mt-2 space-y-1.5 pl-5 text-sm leading-7 text-black/70">
        <li className="list-disc">A <span className="font-semibold text-black">180-day</span> cliff from the launch transaction: nothing is claimable during it</li>
        <li className="list-disc">After the cliff, 10% of the total every 30 days, ten releases of 5,000,000 each</li>
        <li className="list-disc">Fully released on <span className="font-semibold text-black">day 480 (about 16 months)</span>; at any moment the cumulative claimable amount is floor((days elapsed − 180) / 30) × 10%, and repeated claims can never over-issue</li>
        <li className="list-disc">Each release is an ordinary Token-2022 transfer of a taxed mint, so it pays the 0.5% fee too; that fee joins the mother coin&apos;s 40 / 30 / 20 / 10 split</li>
      </ul>
      <p className="mt-3 text-sm leading-7 text-black/70">
        On mainnet the beneficiary is a single-signature hardware-wallet address, publicly verifiable on chain. There is no multisig, no unlock backdoor and no entry point to adjust or add to the allocation. Against the usual 20% team slice this is 5%, with a published schedule and a verifiable address. Every token launched later on the platform carries zero allocation and its creator earns only the 85% tax share — the full side-by-side is in section 3.
      </p>

      <h2 className="mt-12 text-xl font-bold text-black">3. Token Economics</h2>
      <div className="mt-4 overflow-x-auto wp-card">
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

      <h3 className="mt-8 font-semibold text-black">FAIR vs Launched Tokens: Side by Side</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        FAIR is the mother coin and carries a developer allocation to cover audits, frontend hosting and initial development. Every token the platform launches afterwards follows the zero-allocation fair-launch standard. This is one layered design, not two standards — the table below states every difference up front, so nothing has to be discovered after the fact.
      </p>
      <div className="mt-3 overflow-x-auto wp-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="w-32 px-4 py-2 text-left text-xs font-normal text-black/40">Item</th>
              <th className="px-4 py-2 text-left text-xs font-normal text-black/40">FAIR mother coin</th>
              <th className="px-4 py-2 text-left text-xs font-normal text-black/40">Tokens launched on the platform</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Total supply', '1,000,000,000 FAIR (fixed)', '1,000,000,000 (fixed)'],
              ['Developer allocation', 'Fixed 5% (50,000,000): 180-day cliff, then ten monthly releases, complete on day 480', '0 (no allocation; the issuer holds no tokens)'],
              ['Into curve and pool', '95% (950,000,000)', '100% (70% curve / 25% migrated / 5% dev reserve)'],
              ['Transfer tax', '0.5%', '0.5%'],
              ['Fee split', 'Burn 40% / Dividends 30% / Liquidity 20% / Operations 10%', 'Creator 85% / FAIR buyback-and-burn 10% / FAIR liquidity 5%'],
              ['Developer revenue', '10% operations leg + the monthly allocation releases', '85% of the trading tax (no platform cut)'],
            ].map(([k, a, b]) => (
              <tr key={k} className="border-b border-black/5 last:border-0">
                <td className="w-32 px-4 py-3 align-top text-black/50">{k}</td>
                <td className="px-4 py-3 align-top font-semibold text-black">{a}</td>
                <td className="px-4 py-3 align-top font-semibold text-black">{b}</td>
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

      <h3 className="mt-8 font-semibold text-black">3.2 Tokens Launched Through the Protocol: 85 / 10 / 5</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        Anyone can launch a token here. The 0.5% tax it collects is split as follows: <span className="font-semibold text-black">85% settles to the creator</span>, <span className="font-semibold text-black">10% buys FAIR on the market and burns it immediately</span>, and <span className="font-semibold text-black">5% goes into the FAIR liquidity vault</span> (counted together with the 10% of the FAIR tax — a top-up fires once 20 SOL accumulates, and that batch of LP is permanently locked as soon as liquidity is added).
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-black">Creator</span>
            <span className="text-lg font-bold text-purple-700">85%</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-black/50">Settled to the issuer each cycle — the issuer&apos;s main revenue source</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-black">FAIR Buyback &amp; Burn</span>
            <span className="text-lg font-bold text-purple-700">10%</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-black/50">Sold for SOL, then used to buy FAIR and burn it immediately — the more the ecosystem trades, the smaller FAIR&apos;s supply</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-black">Liquidity Vault</span>
            <span className="text-lg font-bold text-purple-700">5%</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-black/50">Swapped to SOL and paired with the token&apos;s reserves to add liquidity; the LP is permanently locked immediately, so the pool only grows</p>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-black/10 bg-white/60 px-4 py-3 text-xs leading-6 text-black/60">
        The logic: every additional token running on the protocol adds a buy-and-burn bid for FAIR and removes some of its supply, while the new token gets thicker on its own — 5% of its fee is earmarked for liquidity, so depth grows, slippage falls and the volume it can absorb rises. Conversely, without tokens running on the protocol FAIR has no support — the mother token&apos;s value is tied to ecosystem activity rather than funded by taxing new launches.
      </div>

      <div className="mt-3 rounded-lg border border-black/10 bg-white/60 px-4 py-3 text-xs leading-6 text-black/60">
        The liquidity vault draws SOL from two sources: half of the 20% liquidity slice of the FAIR tax (i.e. 10% of all tax) sold for SOL, and the 5% share of every launched token&apos;s tax, sold for SOL into the FAIR vault. Both flow into the same vault, and once the balance passes 20 SOL a top-up is triggered automatically with that batch of LP permanently locked immediately — below 20 SOL a top-up would not meaningfully change the order book, so nothing is triggered. The FAIR side of a top-up comes only from the retained half of the liquidity slice; there is no separate reserve account to draw on. Total FAIR ever added to pools is hard-capped on chain (<span className="font-mono text-xs">FAIR_ADD_CAP_TOKENS = 500,000,000</span>, counted in <span className="font-mono text-xs">config.fair_added_to_pools</span>); once that cap is reached the instruction is rejected on chain (<span className="font-mono text-xs">CapReached</span>) and top-ups stop. The FAIR left in the liquidity slice stays in its bucket under the tax split — it is not burned automatically.
      </div>

      <h3 className="mt-8 font-semibold text-black">3.3 Distribution Principle</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        A fair launch means no presale round, no private discount, no allowlist and no insider price. Every token the platform launches is zero-allocation: everyone buys at the same starting price at the same moment, and the price rises with purchases along an on-chain curve whose rules are fixed in the contract, so the issuer cannot reprice mid-way or jump the queue.
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        The protocol does not skim tokens as a fee; operating costs are paid from the operations share of trading tax. The single exception is the 5% that FAIR itself reserves to cover audits and initial development (see 2.8) — minted into an on-chain vault at launch, released monthly after a 180-day cliff, to an address fixed in the contract and publicly verifiable. The developer does not take a position at the front of the curve and does not trade against the book to manufacture volume.
      </p>

      <h3 className="mt-8 font-semibold text-black">3.4 Launch Mechanics and Liquidity Plan</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        The launch runs through an on-chain bonding curve — not a self-hosted public sale, and not dumping all supply into a pool at once. The reason is that pool depth depends only on the SOL side: pouring in all the supply just pushes the unit price to a very low level, where a single large buy takes several percent of supply. A curve makes pricing public and turns the SOL it raises directly into pool depth.
      </p>
      <div className="mt-3 overflow-x-auto wp-card">
        <table className="w-full text-sm">
          <tbody>
            {[
              ['Supply sellable on curve', '≈ 700,000,000 (70%)'],
              ['Starting FDV', '≈ 241 SOL (≈ $16,400 at SOL = $68, opening price $0.0000164)'],
              ['Total raised on curve', '394.000000001 SOL (equal to the migration threshold — reaching it graduates the token)'],
              ['Migrated into pool', '250,000,000 tokens (25%) + the full 394.000000001 SOL'],
              ['Received by the pool', '≈ 249,500,001 tokens (0.2% protocol fee only, no transfer tax on migration) + ≈ 394 SOL'],
              ['Protocol migration fee', '0.2%, ≈ 500,000 tokens, retained as a separate locked LP position — not issuer revenue'],
              ['Main pool opening price', '≈ 1.3135e-6 SOL/token (≈ $0.000089, FDV ≈ 1,314 SOL) — 5.44× the start price, fully continuous with the migration price'],
              ['Curve swap fee', '1% (protocol takes a fixed 20%, the other 80% goes to the creator)'],
              ['Depth reserve', '0 tokens (no reserve clause; the issuer holds no supply)'],
              ['Pool swap fee', '0.25%'],
            ].map(([k, v]) => (
              <tr key={k} className="border-b border-black/5 last:border-0">
                <td className="w-44 px-4 py-3 align-top text-black/50">{k}</td>
                <td className="px-4 py-3 font-semibold text-black">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm leading-7 text-black/70">
        When the curve sells out it migrates into a trading pool automatically, and that liquidity is the SOL the curve raised — the issuer never has to fund the pool upfront. The supply split is fixed by a parameter, not by hand: <span className="font-semibold text-black">percentageSupplyOnMigration = 25</span> means &quot;share of supply migrated into DAMM v2&quot; (250,000,000 tokens); the curve sells 70% (700,000,000 tokens) and a further 5% (50,000,000 tokens) is the developer reserve (leftover) — the three sum to exactly the 1B supply. Measured on a graduated local pool: swapBaseAmount = 700,000,000 (70%), migrationBaseThreshold = 250,000,000 (25%), leftover = 50,000,000 (5%), with migrationQuoteThreshold = 394.000000001 SOL. Migration deducts a single fee on the token side: 250,000,000 tokens enter DAMM, the 0.2% protocol liquidity migration fee takes 500,000 tokens, and the main vault receives about 249,500,001 tokens — that 500,000 is retained as a separate permanently locked LP position, in no one's withdrawable account. No transfer tax is applied anywhere in this path. The reserved 50,000,000 tokens neither enter the pool nor are sold from it; they sit in the DBC pool as &quot;unsold inventory&quot;, and after migration a keeper sends one <span className="font-mono text-xs">withdraw_leftover</span> that moves them to the team address in full (measured: team balance after withdrawal is 750,000,000 = 700,000,000 bought on the curve + 50,000,000 reserved). Tax is settled by a keeper: every 10 minutes the SOL in the treasury is split by protocol ratio into burn, dividend, liquidity and operations, all as plain SOL transfers.
      </p>
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        Two details worth knowing. First, migration pays no transfer tax at all: nothing is taken as the tokens enter the pool — only the 0.2% protocol fee of 500,000 tokens, leaving the vault with about 249,500,001 tokens, reproducible token-for-token. Second, the reserved 50,000,000 tokens stay &quot;unsold&quot; in the DBC pool indefinitely; migration does not sweep them into the DAMM pool and nothing sells them — they can only be moved to the team address by the keeper's <span className="font-mono text-xs">withdraw_leftover</span>, which has no effect on pool liquidity and does not move the price.
      </div>

      <h4 className="mt-6 font-semibold text-black">3.4.1 Four Hard Constraints at Migration (measured)</h4>
      <p className="mt-2 text-sm leading-7 text-black/70">
        First, the migration fee tier must be <span className="font-mono text-xs">Customizable</span>, whose official constant is <span className="font-mono text-xs break-all">A8gMrEPJkacWkcb3DGwtJwTe16HktSEfvwtuDh2MCtck</span>; the tier is bound to that address, and FixedBps100 is rejected on chain (<span className="font-mono text-xs">InvalidMigrationFeeOption</span>). Second, the post-migration pool fee mode is <span className="font-mono text-xs">OutputToken</span> with <span className="font-mono text-xs">compounding_fee_bps = 0</span>, fully decoupled from any transfer-tax mechanism. Third, the protocol charges a fixed 0.2% liquidity migration fee deducted from the token side entering the pool, and no transfer tax applies along the way: measured 250,000,000 injected, the 0.2% fee of 500,000 deducted, about 249,500,001 received — reconciling token-for-token and unrelated to the supply split. Fourth, the curve pool&apos;s authority PDA must be pre-funded with ≥0.2 SOL before migration to pay rent for the accounts created during pool initialisation; the paying wallet only covers the transaction fee, and skipping this aborts the migration with <span className="font-mono text-xs">insufficient lamports</span>.
      </p>
      <h4 className="mt-6 font-semibold text-black">3.4.2 The Curve Must Be Finished with PartialFill</h4>
      <p className="mt-2 text-sm leading-7 text-black/70">
        Curve capacity equals the migration threshold exactly — across four graduated mainnet configs the capacity/threshold difference was 0 lamports, which is normal production behaviour rather than a misconfigured parameter. The final buy therefore always hits the capacity ceiling and a single exact-in swap can never cross it. Completion requires looping PartialFill fills until migration progress ≥ 2; anything above capacity is returned in full and the buyer pays nothing extra.
      </p>

      <h4 className="mt-6 font-semibold text-black">3.4.3 Locked LP and Who Receives the Pool Fee</h4>
      <p className="mt-2 text-sm leading-7 text-black/70">
        The locked LP position NFT created at migration is held by the protocol&apos;s config PDA; the 0.25% pool fee, once settled, is paid into <span className="font-mono text-xs">sol_buffer</span> and belongs to neither the project team nor any private wallet — the LP share stays permanently locked and the fee income belongs to the protocol as well.
      </p>

      <h2 className="mt-12 text-xl font-bold text-black">4. Verifiability and Audit</h2>
      <ul className="mt-4 space-y-1.5 pl-5 text-sm leading-7 text-black/70">
        <li className="list-disc">Contract source is open, built with Solana&apos;s verifiable build so the artifact matches the on-chain bytes</li>
        <li className="list-disc">No audit has been performed yet; once done, the auditor, the full report and every finding (including unresolved ones) will be published with no selective disclosure</li>
        <li className="list-disc">All authority revocations happen inside the launch transaction and can be traced by anyone in a block explorer</li>
        <li className="list-disc">
          Immutability clause (item 4): every ratio and threshold is a compile-time constant — FAIR tax 40 / 30 / 20 / 10, launch tax 85 / 10 / 5, the 20 SOL dividend and liquidity floors, the 500M FAIR add-to-pool cap; all 15 instructions list their signer requirement explicitly; the repository contains no <span className="font-mono text-xs">set_</span> instruction and no pause, close or migrate entry point. At launch the upgrade authority is permanently dropped and the chain shows <span className="font-mono text-xs">Upgrade Authority: none</span> — the program and its rules can no longer be replaced.
        </li>
      </ul>
      <div className="mt-3 rounded-lg border border-black/10 bg-black/[0.02] px-4 py-3 text-xs leading-6 text-black/60">
        The itemized list and reproducible checks live in <span className="font-mono text-[11px]">IMMUTABILITY.md</span>: <span className="font-mono text-[11px]">grep -rn &quot;pub fn set_&quot; programs/flp-treasury/src/lib.rs</span> returns nothing; <span className="font-mono text-[11px]">close_account</span> appears only on four temporary WSOL accounts; set_params, pause, migrate, close and set_upgrade_authority do not exist.
      </div>

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
        <p><span className="font-semibold text-black">Tax is slippage.</span> Every trade pays 0.5% on the way in or out; high-frequency traders lose far more than the headline rate suggests. With the 0.25% swap fee, a full round trip costs about 1.5% plus slippage.</p>
        <p><span className="font-semibold text-black">Dividends are variable.</span> Payouts come from trading fees, so they approach zero when volume is thin.</p>
        <p><span className="font-semibold text-black">Fee-driven sell pressure.</span> About 15% of a launched token&apos;s tax and roughly 50% of the FAIR tax must be sold for SOL to fund buybacks, liquidity and dividends, which creates continuous sell pressure. TWAP splitting and a randomized window reduce the impact; they cannot remove it.</p>
        <p><span className="font-semibold text-black">Burns mean deflation, not gains.</span> The 10% buyback-and-burn shrinks FLP&apos;s supply round after round; a shrinking supply is not a rising price, which is still set by buyers and sellers.</p>
        <p><span className="font-semibold text-black">Curve fee cut.</span> On the curve, the protocol takes a fixed 20% of the 1% swap fee and the creator keeps 80%; that cost stacks on top of the 0.5% transfer tax.</p>
        <p><span className="font-semibold text-black">MEV is not removable.</span> Bundles reduce the odds, they do not eliminate it.</p>
        <p><span className="font-semibold text-black">Contract risk.</span> An unaudited contract may hold unknown vulnerabilities that cause loss of funds.</p>
        <p><span className="font-semibold text-black">Liquidity risk.</span> During the curve there is no pool at all and the price is set by the curve; early after migration depth is still thin and large sells will move price hard. Depth grows only as the reserve is added over time.</p>
        <p><span className="font-semibold text-black">Tax during launch.</span> Curve buys also pay the 0.5% tax, so buyers receive 99.5% of their fill. That tax starts accruing on launch day and harvesting must start at the same time.</p>
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
