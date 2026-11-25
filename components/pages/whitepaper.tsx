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
    ['代币名称', 'FAIR'],
    ['代币符号', 'FAIR'],
    ['总供应量', '1,000,000,000 FAIR（总量上限，权限锁死、不可增发，随销毁逐步通缩）'],
    ['买入税 / 卖出税', '各 1%（FAIR 母币与发射的新币一致）'],
    ['FAIR 母币税收分配', '销毁 40% / 分红 30% / 流动性 20% / 运营 10%'],
    ['发射新币税收分配', '创作者 85% / 回购并销毁 FAIR 10% / 加池金库 5%'],
    ['交易池手续费', '0.25%（与 1% 转账税叠加，一次往返合计约 2.5%）'],
    ['曲线手续费', '1%（协议固定抽 20%，其余 80% 归创作者）'],
    ['分红周期', '每 7 天结算一次'],
    ['发行方式', '链上曲线首发：曲线卖出 36.7%、迁移进池 18.3%、45% 作为深度储备；无预售、无私募、无团队预留'],
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-semibold tracking-widest text-purple-700">WHITEPAPER · v0.2</p>
      <h1 className="mt-3 text-3xl font-bold text-black sm:text-4xl">FairLaunch Protocol 白皮书</h1>
      <p className="mt-4 text-sm text-black/50">
        Solana 上的公平发射协议 · 设计说明草案，主网发射前持续修订
      </p>
      <div className="mt-6 print:hidden">
        <a
          href="/whitepaper.pdf"
          download="FLP-Whitepaper-zh-v0.2.pdf"
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
        在 Launch 页面填写名称、符号、总量、税率与税收流向，协议生成一个标准代币合约。所有通过协议发射的代币共享同一套合约逻辑，只有参数不同，且参数在创建时写死，之后不可修改。
      </p>

      <h3 className="mt-8 font-semibold text-black">2.2 税率结构（分两套，别混）</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        买入税与卖出税各 1%，由 Token-2022 的转账费在协议层自动扣除，没有管理员修改入口。<span className="font-semibold text-black">FAIR 母币</span>的税按 40 / 30 / 20 / 10 四档分配至销毁池、持币者分红池、流动性回购与运营开发；<span className="font-semibold text-black">通过协议发射的新币</span>，税归发币者、平台不抽成，按 85 / 10 / 5 分配：85% 结算给创作者、10% 买入 FAIR 并立即销毁、5% 进入该币自己的加池金库（只能用于加深该池），详见 3.2。
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        曲线阶段另有一笔 1% 的 swap 手续费，由曲线程序在成交时扣除：协议固定抽走 20%，其余 80% 归代币创作者。它与 1% 转账税叠加，所以曲线阶段每笔买入的实际成本约 2%。
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        交易池本身另收 0.25% 手续费，由做市程序在 swap 里直接扣，计入池内供 LP 提取。这笔钱和 1% 转账税是两套独立机制，会叠加：一次买入再卖出，用户实际损耗约 1% + 1% + 0.25% + 0.25% ≈ 2.5%，另加滑点。手续费之所以压在 0.25%，是因为税已经收了 1%，再往上加会直接压掉交易量，而交易量是税收的唯一来源。
      </p>

      <h3 className="mt-8 font-semibold text-black">2.3 自动销毁</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        进入销毁池的代币由金库账户直接调用 Burn 指令销毁（Token-2022 原生支持），链上总供应量立即减少。总供应上限为 10 亿枚，且 mint 权限在发射时即置空（硬编码、无管理员入口），任何人都无法增发，因此总供应只会因销毁而单向减少。任何人都可以比对当前总供应量与 10 亿上限的差值，核对实际销毁量，不存在"团队声称已销毁"这种说法。
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
        曲线首发阶段，开盘第一笔定价由合约决定，不存在"抢先进池"这个动作；迁移建池与首批买单通过 Jito Bundle 打包提交，在同一区块内完成，避免迁移瞬间被夹。这降低抢跑概率，但不能消除 MEV——公开交易池始终存在被机器人套利的可能。
      </p>

      <h3 className="mt-8 font-semibold text-black">2.6 权限模型</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">发射时执行以下动作，全部可在链上验证：</p>
      <ul className="mt-2 space-y-1.5 pl-5 text-sm leading-7 text-black/70">
        <li className="list-disc">mint authority 置空——此后任何人无法增发，10 亿是不可突破的上限，总量只随销毁单向减少</li>
        <li className="list-disc">freeze authority 置空——无法冻结任何钱包</li>
        <li className="list-disc">税率与分配参数写入合约后不可变更，无管理员修改入口</li>
        <li className="list-disc">流动性凭证锁仓或直接打入黑洞地址</li>
      </ul>

      <h3 className="mt-8 font-semibold text-black">2.7 税金如何真正到手</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        1% 的税在每一笔代币转账时由协议扣下，但不会自动进任何人的钱包，而是先记录在收款方账户的 withheld 余额里（包括交易池的金库账户）。协议定期执行 harvest，把这些挂着的税一次性搬进税金金库，再按分配比例处理。整个过程由多签地址执行，每一步在浏览器上都能查到指令与金额。
      </p>
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        税是代币，分红是 SOL，中间必须卖出。发射新币的税中约 15% 需要卖成 SOL（10% 回购 FAIR、5% 加池配对）；FAIR 母币的税中约 50% 同样需要卖出。为避免形成可预测的砸盘时间点，卖出会拆成 8–12 笔在数小时内完成（TWAP），harvest 时间在 6–9 天窗口内随机，而不是死守第 7 天。
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

      <h3 className="mt-8 font-semibold text-black">3.2 通过协议发射的新币：85 / 10 / 5</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        任何人在协议上一键发币，该代币收到的 1% 买卖税归发币者，平台不抽成：<span className="font-semibold text-black">85% 结算给创作者</span>，<span className="font-semibold text-black">10% 在市场上买入 FAIR 并立即销毁</span>，<span className="font-semibold text-black">5% 进入该币自己的加池金库</span>（只能用于加深这一个池子，加完立即销毁 LP）。
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
          <p className="mt-1 text-xs leading-5 text-black/50">卖成 SOL 后买入 FAIR 并立即销毁，生态越活跃 FAIR 总量越少</p>
        </div>
        <div className="rounded-lg border border-black/10 bg-white/60 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-black">加池金库</span>
            <span className="text-lg font-bold text-purple-700">5%</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-black/50">换 SOL 后与该币的储备代币配对加池，加完立即销毁 LP，池子只增不减</p>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-black/10 bg-white/60 px-4 py-3 text-xs leading-6 text-black/60">
        这个逻辑的含义：每多一个在协议上跑起来的币，就给 FAIR 增加一份买盘并带走一份供应，同时新币自己的 5% 加池额度让它的池子随交易变厚、滑点下降、能吃下的成交量更大。反过来，没有币在协议上跑，FAIR 就没有支撑——母币的价值绑在生态活跃度上，而不是靠向新发币抽税。
      </div>

      <div className="mt-3 rounded-lg border border-black/10 bg-white/60 px-4 py-3 text-xs leading-6 text-black/60">
        加池金库里的 SOL 有两路来源：一是 FAIR 卖出换回的 10%，二是平台发射的新币 5% 加池份额卖出换回的 SOL。两路进的是同一个加池金库，累计超过 20 SOL 就自动触发一次加池并立即销毁该批 LP——低于 20 SOL 时加池对盘口的改善没有意义，所以不触发。
      </div>

      <h3 className="mt-8 font-semibold text-black">3.3 发行原则</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        公平发射意味着没有预售轮、没有私募折扣、没有团队预留。首发不设白名单、不设额度、不设内部价：任何人在同一时刻、以同一个起点价格买入，价格由链上曲线按买入量自动抬升，规则写死在合约里，发币方无法在过程中改价或插队。
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        协议自身不抽取代币作为费用，运营成本从交易税中的运营部分支出。团队不预留份额，也不参与曲线首发的前排购买。
      </p>

      <h3 className="mt-8 font-semibold text-black">3.4 首发机制与流动性安排</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        首发走链上曲线（bonding curve），而不是自建公募、也不是一次性把全部供应砸进池子。原因是流动性深度只取决于池子里的 SOL 一侧：供应全倒进池子只会把单价压到极低，一个大额买单就能吃掉几个百分点。曲线把定价过程公开化，也让筹措到的 SOL 直接成为池子的深度。
      </p>
      <div className="mt-3 overflow-x-auto rounded-xl border border-black/10 bg-white/60">
        <table className="w-full text-sm">
          <tbody>
            {[
              ['曲线发售数量', '约 367,000,000 枚（36.7%）'],
              ['起始 FDV', '约 220 SOL（按 SOL = $68 计约 $15,000，开盘单价 $0.000015）'],
              ['迁移 FDV', '约 880 SOL（起始的 4 倍，单价 $0.00006）'],
              ['曲线总募资', '约 161.8 SOL（由曲线数学决定，非人为设定）'],
              ['主池注入', '约 183,000,000 枚 + 全部 161.8 SOL'],
              ['主池开盘价', '恰为起始价的 4 倍，与曲线迁移价完全连续'],
              ['曲线手续费', '1%（协议固定抽 20%，其余 80% 归创作者）'],
              ['深度储备', '450,000,000 枚（45%），按里程碑加池并销毁 LP'],
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
        曲线卖满后自动迁移成交易池，流动性就是曲线筹到的 SOL，发币方不需要先垫付建池资金。曲线卖出多少、进池多少不是拍脑袋定的，而是由起始/迁移市值按曲线数学自动推出：起始约 220 SOL、迁移约 880 SOL（4 倍），对应约 36.7% 在曲线卖出、18.3% 进入主池。剩下的 45% 不进销毁池、也不一次性灌进池子（因为配对所需的 SOL 不存在），而是作为深度储备：每攒够一批 SOL，就按当期市价配对加池，加完立即把该批 LP 凭证销毁，池子永久不可撤。
      </p>
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        两个必须知道的细节。第一，1% 转账税在往池子转账时同样会扣，所以"注入 1.83 亿枚"实际到账约 1.81 亿（约 1.2% 损耗），对池价的影响可以忽略，但账要对得上。第二，池子金库账户自己也在被收税（买入时进金库扣一次、卖出时出金库再扣一次），这部分同样记在金库的 withheld 余额里，必须纳入 harvest 扫描名单，否则池子的实际余额与做市程序的记账会对不上。
      </div>

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
        <p><span className="font-semibold text-black">税收即滑点。</span>每笔交易都会被扣 1% 的买入税或卖出税，高频交易者的实际损耗显著高于名义税率。加上 0.25% 池子手续费，一次往返的综合损耗约 2.5%，另加滑点。</p>
        <p><span className="font-semibold text-black">分红不确定。</span>分红来自交易税，交易冷淡时分红趋近于零。</p>
        <p><span className="font-semibold text-black">税收卖出压力。</span>发射新币的税中约 15%、母币税中约 50% 需卖出换成 SOL 才能回购加池与分红，这会持续形成卖出压力；已用 TWAP 拆单与随机窗口削弱影响，但无法消除。</p>
        <p><span className="font-semibold text-black">销毁即通缩。</span>新币税中的 10% 用于买入并销毁 FAIR，母币总量会逐轮减少；通缩不等于上涨，价格仍由买卖决定。</p>
        <p><span className="font-semibold text-black">曲线手续费抽成。</span>曲线阶段 1% 的 swap 手续费中，协议固定抽 20%，创作者拿 80%，这部分成本与 1% 转账税叠加。</p>
        <p><span className="font-semibold text-black">MEV 无法根除。</span>Bundle 只能降低概率，不能消除。</p>
        <p><span className="font-semibold text-black">合约风险。</span>未经审计的合约存在未知漏洞，可能造成资金损失。</p>
        <p><span className="font-semibold text-black">流动性风险。</span>曲线阶段池子尚不存在，价格由曲线决定；迁移初期深度有限，大额卖出仍会严重砸价。深度储备靠加池逐步增厚，需要时间。</p>
        <p><span className="font-semibold text-black">首发阶段的税。</span>曲线买入同样扣 1% 税，买家实际到手为成交量的 99%，这部分税金在发射日就开始累积，需要同步启动 harvest。</p>
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
    ['Token Name', 'FAIR'],
    ['Symbol', 'FAIR'],
    ['Total Supply', '1,000,000,000 FAIR (hard cap; authorities locked, no minting, supply shrinks only through burns)'],
    ['Buy / Sell Tax', '1% each (same for FAIR and launched tokens)'],
    ['FAIR Fee Allocation', 'Burn 40% / Dividends 30% / Liquidity 20% / Operations 10%'],
    ['Launched Token Fees', 'Creator 85% / FAIR buyback-and-burn 10% / Liquidity vault 5%'],
    ['Pool Swap Fee', '0.25% (stacks on the 1% transfer tax — round trip is about 2.5%)'],
    ['Curve Swap Fee', '1% (protocol takes a fixed 20%, the other 80% goes to the creator)'],
    ['Dividend Cycle', 'Settled every 7 days'],
    ['Distribution', 'On-chain bonding curve launch: 36.7% sold on the curve, 18.3% migrated into the pool, 45% kept as depth reserve. No presale, no private round, no team allocation'],
  ];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-xs font-semibold tracking-widest text-purple-700">WHITEPAPER · v0.2</p>
      <h1 className="mt-3 text-3xl font-bold text-black sm:text-4xl">FairLaunch Protocol Whitepaper</h1>
      <p className="mt-4 text-sm text-black/50">
        A fair launch protocol on Solana · design draft, revised continuously until mainnet launch
      </p>
      <div className="mt-6 print:hidden">
        <a
          href="/whitepaper-en.pdf"
          download="FLP-Whitepaper-en-v0.2.pdf"
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
        On the Launch page you enter name, symbol, supply, tax rates and fee destination, and the protocol produces a standard token contract. All tokens launched through the protocol share the same contract logic; only the parameters differ, and those are fixed at creation and cannot be changed later.
      </p>

      <h3 className="mt-8 font-semibold text-black">2.2 Tax Structure (Two Separate Sets)</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        Buy and sell tax are 1% each, charged at protocol level by the Token-2022 transfer fee, with no admin override. On <span className="font-semibold text-black">the FAIR token</span>, fees are split 40 / 30 / 20 / 10 across the burn pool, holder dividend pool, liquidity buyback and operations. On <span className="font-semibold text-black">tokens launched through the protocol</span>, fees belong to the issuer and the platform takes no cut, split 85 / 10 / 5: 85% settles to the creator, 10% buys FAIR on the market and burns it immediately, and 5% goes into that token&apos;s own liquidity vault, which can only be used to deepen its pool — see 3.2.
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        The curve also charges a 1% swap fee on every fill: the protocol takes a fixed 20% of it and the remaining 80% goes to the token creator. That stacks on top of the 1% transfer tax, so a buy on the curve costs roughly 2%.
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        The trading pool charges an additional 0.25% swap fee, deducted by the AMM inside the swap and retained in the pool for LPs. These are two independent mechanisms and they stack: a buy followed by a sell costs roughly 1% + 1% + 0.25% + 0.25% ≈ 2.5%, plus slippage. The swap fee is held at 0.25% precisely because the tax already takes 1%; pushing it higher would suppress volume, and volume is the only source of fee revenue.
      </p>

      <h3 className="mt-8 font-semibold text-black">2.3 Auto Burn</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        Tokens routed to the burn pool are destroyed by a Burn instruction signed by the treasury account (natively supported by Token-2022), so total supply drops immediately. Supply is hard-capped at 1,000,000,000 and the mint authority is revoked at launch with no admin entry point, so nobody can ever mint more: supply only moves down through burns. Anyone can compare current supply against the 1,000,000,000 cap to verify how much has actually been burned — no need to take the team&apos;s word for it.
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
        On the curve, the opening price is set by the contract, so there is no "be first into the pool" race; the migration pool creation and first buys are submitted as a Jito Bundle in the same block, which makes sandwiching the migration much harder. It lowers the probability of being front-run; it does not eliminate MEV, because any public liquidity pool can still be arbitraged by bots.
      </p>

      <h3 className="mt-8 font-semibold text-black">2.6 Permission Model</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">These actions execute at launch and are verifiable on chain:</p>
      <ul className="mt-2 space-y-1.5 pl-5 text-sm leading-7 text-black/70">
        <li className="list-disc">Mint authority revoked — 1,000,000,000 is a hard cap that can never be raised; supply only moves down through burns</li>
        <li className="list-disc">Freeze authority revoked — no wallet can be frozen</li>
        <li className="list-disc">Tax and allocation parameters locked at deployment, no admin entry point</li>
        <li className="list-disc">Liquidity credentials locked or sent to a burn address</li>
      </ul>

      <h3 className="mt-8 font-semibold text-black">2.7 How the Tax Actually Reaches the Treasury</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        The 1% is deducted by the protocol on every token transfer, but it does not land in anyone&apos;s wallet automatically: it is recorded as a withheld balance on the receiving token account, including the pool&apos;s vault accounts. The protocol periodically runs a harvest that sweeps all withheld amounts into the fee treasury, then splits them by the allocation. Every step is signed by a multisig and every instruction and amount is verifiable in a block explorer.
      </p>
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        Tax arrives as tokens, dividends are paid in SOL, so a sale in between is unavoidable: about 15% of a launched token&apos;s tax and roughly 50% of the FAIR tax must be sold for SOL (10% FAIR buyback, 5% liquidity pairing). To avoid handing the market a predictable dump schedule, the sale is split into 8–12 orders over several hours (TWAP) and the harvest window is randomized across 6–9 days rather than fixed on day 7.
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

      <h3 className="mt-8 font-semibold text-black">3.2 Tokens Launched Through the Protocol: 85 / 10 / 5</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        Anyone can launch a token here. The 1% tax it collects belongs to the issuer and the platform takes no cut: <span className="font-semibold text-black">85% settles to the creator</span>, <span className="font-semibold text-black">10% buys FAIR on the market and burns it immediately</span>, and <span className="font-semibold text-black">5% goes into that token&apos;s own liquidity vault</span>, which can only be used to deepen that one pool — the LP is burned as soon as liquidity is added.
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
          <p className="mt-1 text-xs leading-5 text-black/50">Swapped to SOL and paired with the token&apos;s reserves to add liquidity; the LP is burned immediately, so the pool only grows</p>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-black/10 bg-white/60 px-4 py-3 text-xs leading-6 text-black/60">
        The logic: every additional token running on the protocol adds a buy-and-burn bid for FAIR and removes some of its supply, while the new token gets thicker on its own — 5% of its fee is earmarked for liquidity, so depth grows, slippage falls and the volume it can absorb rises. Conversely, without tokens running on the protocol FAIR has no support — the mother token&apos;s value is tied to ecosystem activity rather than funded by taxing new launches.
      </div>

      <div className="mt-3 rounded-lg border border-black/10 bg-white/60 px-4 py-3 text-xs leading-6 text-black/60">
        The liquidity vault draws SOL from two sources: the 10% of FAIR sold for SOL, and the 5% liquidity share of every launched token sold for SOL. Both flow into the same vault, and once the balance passes 20 SOL a top-up is triggered automatically with that batch of LP burned immediately — below 20 SOL a top-up would not meaningfully change the order book, so nothing is triggered.
      </div>

      <h3 className="mt-8 font-semibold text-black">3.3 Distribution Principle</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        A fair launch means no presale round, no private discount and no team allocation. There is no allowlist, no cap and no insider price: everyone buys at the same starting price at the same moment, and the price rises with purchases along an on-chain curve whose rules are fixed in the contract, so the issuer cannot reprice mid-way or jump the queue.
      </p>
      <p className="mt-3 text-sm leading-7 text-black/70">
        The protocol does not skim tokens as a fee; operating costs are paid from the operations share of trading tax. The team reserves no allocation and does not take a position at the front of the curve.
      </p>

      <h3 className="mt-8 font-semibold text-black">3.4 Launch Mechanics and Liquidity Plan</h3>
      <p className="mt-2 text-sm leading-7 text-black/70">
        The launch runs through an on-chain bonding curve — not a self-hosted public sale, and not dumping all supply into a pool at once. The reason is that pool depth depends only on the SOL side: pouring in all the supply just pushes the unit price to a very low level, where a single large buy takes several percent of supply. A curve makes pricing public and turns the SOL it raises directly into pool depth.
      </p>
      <div className="mt-3 overflow-x-auto rounded-xl border border-black/10 bg-white/60">
        <table className="w-full text-sm">
          <tbody>
            {[
              ['Supply sold on curve', '≈ 367,000,000 (36.7%)'],
              ['Starting FDV', '≈ 220 SOL (≈ $15,000 at SOL = $68, opening price $0.000015)'],
              ['Migration FDV', '≈ 880 SOL (4× the start, unit price $0.00006)'],
              ['Total raised on curve', '≈ 161.8 SOL (determined by curve math, not set by hand)'],
              ['Main pool injection', '≈ 183,000,000 tokens + the full 161.8 SOL'],
              ['Main pool opening price', 'Exactly 4× the start price, fully continuous with the migration price'],
              ['Curve swap fee', '1% (protocol takes a fixed 20%, the other 80% goes to the creator)'],
              ['Depth reserve', '450,000,000 (45%), added to the pool in milestones with LP burned each time'],
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
        When the curve sells out it migrates into a trading pool automatically, and that liquidity is the SOL the curve raised — the issuer never has to fund the pool upfront. How much is sold on the curve versus migrated into the pool is not a hand-picked number: with a start FDV of about 220 SOL and a migration FDV of about 880 SOL (4x), the curve math yields roughly 36.7% sold on the curve and 18.3% entering the main pool. The remaining 45% is neither burned nor dumped into the pool (the SOL to pair it does not exist); it is a depth reserve: each time enough SOL accrues, a batch is paired into the pool at the prevailing price and its LP is burned immediately, making the pool permanently unwithdrawable.
      </p>
      <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs leading-6 text-amber-800">
        Two details worth knowing. First, the 1% transfer tax is also charged when tokens move into the pool, so &quot;injecting 183M&quot; arrives as about 181M (roughly 1.2%) — negligible for the price, but the accounting has to match. Second, the pool vault itself pays the tax (charged on the way in and again on the way out), and that amount sits in the vault&apos;s withheld balance too; the vault must be included in the harvest scan, otherwise the AMM accounting no longer matches the real balance.
      </div>

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
        <p><span className="font-semibold text-black">Tax is slippage.</span> Every trade pays 1% on the way in or out; high-frequency traders lose far more than the headline rate suggests. With the 0.25% swap fee, a full round trip costs about 2.5% plus slippage.</p>
        <p><span className="font-semibold text-black">Dividends are variable.</span> Payouts come from trading fees, so they approach zero when volume is thin.</p>
        <p><span className="font-semibold text-black">Fee-driven sell pressure.</span> About 15% of a launched token&apos;s tax and roughly 50% of the FAIR tax must be sold for SOL to fund buybacks, liquidity and dividends, which creates continuous sell pressure. TWAP splitting and a randomized window reduce the impact; they cannot remove it.</p>
        <p><span className="font-semibold text-black">Burns mean deflation, not gains.</span> The 10% buyback-and-burn shrinks FLP&apos;s supply round after round; a shrinking supply is not a rising price, which is still set by buyers and sellers.</p>
        <p><span className="font-semibold text-black">Curve fee cut.</span> On the curve, the protocol takes a fixed 20% of the 1% swap fee and the creator keeps 80%; that cost stacks on top of the 1% transfer tax.</p>
        <p><span className="font-semibold text-black">MEV is not removable.</span> Bundles reduce the odds, they do not eliminate it.</p>
        <p><span className="font-semibold text-black">Contract risk.</span> An unaudited contract may hold unknown vulnerabilities that cause loss of funds.</p>
        <p><span className="font-semibold text-black">Liquidity risk.</span> During the curve there is no pool at all and the price is set by the curve; early after migration depth is still thin and large sells will move price hard. Depth grows only as the reserve is added over time.</p>
        <p><span className="font-semibold text-black">Tax during launch.</span> Curve buys also pay the 1% tax, so buyers receive 99% of their fill. That tax starts accruing on launch day and harvesting must start at the same time.</p>
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
