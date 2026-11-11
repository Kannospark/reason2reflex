# SimpleVLA-RL 基线核实与一体化慢—快 RL 设计

## 结论给主代理

用户现在要的是**无需额外人工采集示范，仿真在线 RL 中慢引导与快策略共同成熟**，不能继续写成“先采集教师数据、再离线 BC”的必经流程。

但用户给出的 [SimpleVLA-RL](https://arxiv.org/abs/2509.09674) 本身**不是无示范冷启动的证据**。它是任务相关 SFT 初始化之后的在线 RL。应温和而明确区分：

1. 无需额外采集人工示范：与该 RL 阶段完全相符。
2. 不使用真实机器人数据：其 sim-to-real 实验符合，但使用了仿真示范 SFT。
3. 不使用任何任务示范：该论文未证明，用户的 slow 引导可以作为要研究的冷启动机制。
4. 从随机权重、不使用任何机器人预训练数据：更强命题，不能混写。

## 原始材料

- 论文：https://arxiv.org/html/2509.09674v1 （§3–5）
- 官方仓库：https://github.com/PRIME-RL/SimpleVLA-RL
- 本次读取代码版本：`7c51662df27b586f9e8a1ab35fcf849f2b8852f9`
- 本地只读研究副本：`/data/SimpleVLA-RL-research`
- 代码中的 RL dataset 是 task、init-state/seed 的索引，不是示范动作数据集：
  https://github.com/PRIME-RL/SimpleVLA-RL/blob/7c51662df27b586f9e8a1ab35fcf849f2b8852f9/verl/utils/dataset/rob_dataset.py

## 基线精确机制（论文与代码已交叉检查）

### 初始化及数据

官方 README 明确要求 SFT VLA 模型；提供 LIBERO 每任务 1 条/全量、RoboTwin2 每任务 1000 条的 SFT 检查点。https://github.com/PRIME-RL/SimpleVLA-RL#-getting-started

论文主实验：LIBERO 每套 10 任务，共 500 条示范，RoboTwin1.0 每任务 50 条，RoboTwin2.0 每任务 1000 条；完成 SFT 后再在线 RL。One-Trajectory 设置依然是每任务 1 条 SFT。§5.2 明确指出原模型 LIBERO 为 0%，因而先以 One-Trajectory SFT 获得非零成功率。不能把文中 “SFT from scratch” 解读为模型全随机初始化；它指改造后架构需要重新做任务 SFT，背后仍然是 OpenVLA 的预训练视觉/语言/机器人权重。

### 为什么它适合 GRPO

官方 OpenVLA-OFT 使用连续动作回归头；SimpleVLA-RL 改为 LLaMA 输出头上的离散动作 token，保留并行解码与 action chunking。LIBERO chunk 长度 8、动作维 7，因此一次前向 56 个动作 token；RoboTwin chunk 25，动作维应服从任务/平台，不能一律 7。

每个 scalar action 从 256 个 bin 选一个；代码对动作 logits 做温度缩放再 categorical sampling。训练温度 1.6；评估 greedy。不是把 deterministic continuous action 人为当有概率的 action 来求 ratio。

代码：
https://github.com/PRIME-RL/SimpleVLA-RL/blob/7c51662df27b586f9e8a1ab35fcf849f2b8852f9/verl/utils/vla_utils/openvla_oft/modeling_prismatic.py#L1600

### 采样、奖励与优化

同一个任务和初态采样 G=8 条环境交互轨迹；环境在动作 chunk 之间返回新观察。环境成功判定产生轨迹级 0/1 结果；终止有效长度之后的 token 被 mask。代码把 verifier reward 放在最后一个有效 token，GRPO 再把组归一化的终局优势广播给所有有效 action token。这与“每个 timestep 真发一个 +1 环境奖励”不同。

出处：
https://github.com/PRIME-RL/SimpleVLA-RL/blob/7c51662df27b586f9e8a1ab35fcf849f2b8852f9/verl/trainer/main_ppo.py#L30
https://github.com/PRIME-RL/SimpleVLA-RL/blob/7c51662df27b586f9e8a1ab35fcf849f2b8852f9/verl/trainer/ppo/core_algos.py#L173

GRPO 采用 (R_i-组均值)/(组标准差+epsilon)，优化 token-wise clipped surrogate，非对整条长轨迹求单一 product ratio。去掉 reference KL；clip lower=0.2、upper=0.28；温度=1.6。动态采样过滤组内全成功或全失败的组；示例脚本 group accuracy 范围 [0.1,0.9]，G=8 时等价于只保留混合结果。每任务每次采样保持一致的初态分组。old logprob 使用 rollout 时同温度、同动作 logits 子词表重新计算。

来源代码：
https://github.com/PRIME-RL/SimpleVLA-RL/blob/7c51662df27b586f9e8a1ab35fcf849f2b8852f9/examples/run_openvla_oft_rl_libero.sh
https://github.com/PRIME-RL/SimpleVLA-RL/blob/7c51662df27b586f9e8a1ab35fcf849f2b8852f9/verl/workers/actor/dp_rob.py#L105
https://github.com/PRIME-RL/SimpleVLA-RL/blob/7c51662df27b586f9e8a1ab35fcf849f2b8852f9/verl/workers/fsdp_workers.py#L515
https://github.com/PRIME-RL/SimpleVLA-RL/blob/7c51662df27b586f9e8a1ab35fcf849f2b8852f9/verl/trainer/ppo/ray_trainer.py#L755

论文参考配置为 8×A800 80GB，全参数训练，学习率 5e-6，初态 batch=64、每组8条、minibatch128。不能把这些规模称用户方案的最优配置。

### 对用户方案的关键影响

稀疏奖励 GRPO 需要组内回报差异。若某初态成功率为 p，G 次独立采样获得混合结果的概率为 1-p^G-(1-p)^G；p=0 时为0。动态采样不能凭空制造第一次成功。慢 VLM 的研究角色因而可以非常清楚：**让原本冷启动全失败的分布产生成功与可学梯度，而不是只替已有策略做事后解释**。

但反面也存在：慢系统永远把快系统救回来、所有轨迹全成功时，纯0/1 GRPO又没有梯度，且会掩盖快策略弱点。需要逐渐增长的 fast-only 分支试验/时延成本、恢复预算；必须报告 fast-only、hybrid、slow 调用率。动态采样按任务成功过滤对“全成功但成本不同”的组不再合适；若目标含成本，需按总回报方差保留组，或把成本作为独立约束。不能盲搬 filter_accuracy。

## 一体化数学：两种正确路线与一个错误路线

### 路线 A：显式 option 路由，最容易在基线上实现

在 chunk 边界决策，历史/信念为 h_k：

\[
m_k\sim g_\phi(m\mid h_k),\quad m_k\in\{F,S\},\qquad A_k\sim\pi^{m_k}_{\theta_{m_k}}(A\mid h_k).
\]

两分支共用同一机器人动作接口。选 slow 可以先生成离散语义子目标 z，再通过固定 interpreter 解成 action；若 slow 冻结、interpreter 固定，它们对其分支的 PPO ratio 为1，但 gate ratio 仍然存在。

当所有随机控制变量有可计算 likelihood 时，联合策略为

\[
p_\Theta(m,A\mid h)=g_\phi(m\mid h)\pi^m_{\theta_m}(A\mid h),
\quad \rho_k=\frac{g_\phi(m_k\mid h_k)}{g_{old}(m_k\mid h_k)}\frac{\pi^m_{\theta_m}(A_k\mid h_k)}{\pi^m_{old}(A_k\mid h_k)}.
\]

有 slow reasoning token z 且训练 slow 时，还需包含 q(z|h) 的 ratio；不能只保留最后物理动作概率。若 frozen slow，q 的比值抵消。

策略梯度：
\[
\nabla J=\mathbb E[\hat A_k\{\nabla\log g_\phi(m_k\mid h_k)+\mathbf1_{m_k=F}\nabla\log\pi_F(A_k\mid h_k)+\mathbf1_{m_k=S}\nabla\log\pi_S(A_k\mid h_k)\}].
\]

**关键：FAST 头在 SLOW 执行的数据上没有该 on-policy actor 梯度。** 一个共享视觉 trunk 可以通过被选分支的 loss 受训练，但这不等于快动作头自动学会所有慢动作。想要真正快速成熟，必须确保快分支有足量有意义的自主交互，或采用路线 B/critic，或明确加入在线蒸馏辅助项。在线蒸馏只使用仿真自生成数据，不要求人工采集，但它不是“纯RL梯度”，需诚实标注为可选。

GRPO 实现可以保留终局 group advantage，将 gate decision 作为每个 chunk 只出现一次的 token/action，action 仍逐token求 surrogate；不要把 gate logprob 再重复到56或350个动作 token，避免 gate 的学习率隐式依赖 chunk 宽度。若采用整个 option/chunk 的 joint ratio，应承认这是相对原 token-wise SimpleVLA-RL 的修改，并调试高维 product-ratio 方差；不能把 factor-wise clipped surrogate 说成 exact joint clipping。

不同时长 option 使用 SMDP：
\[
R_k=\sum_{j=0}^{n_k-1}\gamma^jr_{t_k+j},\quad
\delta_k=R_k+\gamma^{n_k}V(h_{k+1})-V(h_k).
\]

等待 slow 计算的时间应进入 n_k 或实际时间成本。可将 gate 改为 actor-critic，而保留 fast token GRPO；这比终局同优势更有局部 credit，但已是研究设计，不是原论文现成结论。

### 路线 B：可求密度的动作分布混合，纯RL下更直接的技能融合

**严格适用条件：**以下将 mode 边缘化的 policy gradient，要求给定物理动作 A 后，mode 不再直接影响 reward 或 transition。若 slow 调用成本、等待时间或不同控制周期直接依赖 m，那么必须保留 joint(m,A) 的 likelihood，或对任务动作部分边缘化、对 mode 成本单独使用正确的 joint score。直接把含mode成本的回报乘 ∇log p(A) 会丢失mode的信息，可能有偏；所以现实慢快控制**不宜把此路线当无条件主推荐**。下述动作responsibility主要是一个可用于同时间格、等转移技能融合的结构启发。

若两专家在相同离散动作空间上都可计算 likelihood，边缘混合分布为

\[
p_\Theta(A\mid h)=g_F(h)\pi_F(A\mid h)+g_S(h)\pi_S(A\mid h),
\quad \rho=\frac{p_\Theta(A\mid h)}{p_{old}(A\mid h)}.
\]

可先采样专家、再采样动作，但优化时使用 marginal likelihood 而非 sampled-expert joint likelihood。这是对 latent expert 的边缘化，不能与路线A混写。

\[
\nabla_{\theta_F}\log p(A\mid h)
=w_F(A,h)\nabla_{\theta_F}\log\pi_F(A\mid h),\quad
w_F=\frac{g_F\pi_F(A\mid h)}{g_F\pi_F(A\mid h)+g_S\pi_S(A\mid h)}.
\]

因此即使 A 是通过 slow 采样产生，fast 仍能按 posterior responsibility 得到纯 reward-weighted RL 更新。成功动作并非离线BC真值；其被强化与否取决于 advantage。

局限：若 fast 对 slow 动作概率极低，w_F≈0，转移仍然很慢，尤其整段高维 chunk。可用短chunk、技能级离散候选、支持集重叠的动作分布、共享低层动作编码器缓解；这些都需实验验证。也可以采用 critic 从所有真实环境转移学习 Q，再让 fast 优化 Q；这时改成 off-policy actor-critic/SAC/PPO-hybrid 方案，不能假称原始GRPO完全不变。

slow 是任意自然语言输出→确定性 waypoint interpreter 时，通常不能算出物理 action 的边缘概率：同一动作可以对应多个文本前像。不要直接写 π_S(A) 并假设它已知。一个可实现设计是让 VLM 输出局部 waypoint 和置信/尺度，再通过预先规定、归一化可计算的 discrete categorical/Gaussian primitive distribution 采样物理动作。若 stochastic text z 影响该分布，应把z纳入条件/likelihood，或者在训练期用确定性 frozen VLM作为该状态的可重现函数。

该路线训练期可额外运行两分支计算密度；部署时 gate 先采样专家，只计算被选分支仍产生同一 mixture 行为分布。但 gate 本身必须只依赖廉价可用状态；若它依赖本次 slow 输出，就已经支付了 slow 计算费用。若省略未选专家密度，无法计算上面的 marginal loss。

### 错误路线

从 slow 采样 A，直接用 fast logprob 填 old_logprob 并运行原 on-policy GRPO，是错误的行为策略归属。若行为是 μ=g_Fπ_F+g_Sπ_S，却用 π_F,new/π_F,old 当其重要性比率，则分母不匹配。为避免误解：这并不是说任何 off-policy 利用都禁止，而是必须改为已定义的边缘mixture目标、正确的off-policy算法或显式辅助loss。

### 路线 C：Guided product-of-experts，strict纯RL的更直接内化候选

慢模型不直接替学生执行，而是根据画面输出 waypoint/动作prior。**物理动作始终从受引导的快策略采样**。在SimpleVLA-RL现有256-bin categorical实现中可精确归一化：

\[
q_{\theta,j}(a\mid h,z,m)=\operatorname{softmax}_a\left[\ell^F_{\theta,j}(a\mid h)/T+\alpha_m\log p^S_j(a\mid h,z)\right],\quad \alpha_F=0,\ \alpha_S>0.
\]

z可以是冻结VLM确定性产生的局部目标；固定adapter把目标转成每个scalar动作的离散prior。设置支持集下限，例如 pS=(1-epsilon)·prior+epsilon/256，避免teacher认定不可行的动作被永久封死。原始快logits不能被当作行为概率；旧、新logprob必须来自完整q，包括256候选的归一化项。

gate调用后可用联合分布
\[
p(m,A\mid h)=g_\phi(m\mid h)\prod_jq_{\theta,j}(a_j\mid h,z,m)
\]
计算正确ratio。若slow z随机且可训练，还需q(z|h)；冻结但随机生成时记录z作为相应条件、固定生成机制，不能在recompute时换一个z。

与独立slow替代actor不同，两个模式下q都依赖fast参数，故fast可在guided与unguided每个交互位置得到reward-weighted policy gradient，**不需要CE/BC**。它借slow prior引导探索，随后α=0和fast-only分支增长，检验是否形成独立行为。

限制：prior极强时分布近确定，探索和有效梯度都可能变弱；撤去prior会产生分布变化；VLM waypoint错误仍可能带偏。因此控制α上限、保持熵/支持集并持续fast-only评估。这个方案是研究提案，不是SimpleVLA-RL原文结论，也不能保证它一定比在线优势过滤蒸馏更快。

若用户允许“无需人工数据，但允许在线辅助学习”，在同一rollout buffer加入优势过滤的teacher→fast KL/CE，是更直接的参数内化：只取环境验证有用/更优的指导，不需要另立离线阶段。必须准确称RL+在线蒸馏，不声称全部梯度为RL。

## 奖励和训练循环建议（本研究提案，不是原论文结果）

共同目标可写
\[
J=\mathbb E[\mathbf1_{success}-\lambda_T T-\lambda_S N_{slow}-\lambda_{sw}N_{switch}],
\]
或成功率为约束、计算成本为目标。N_slow 的单位/缩放应对应真实延迟/成本。给 slow 调用 +0.1 会鼓励调用；若想快策略成熟，方向应是计入慢计算成本，但也不能过强惩罚而让系统学会鲁莽 fast。

一个训练循环内完成：

1. 冻结当前 gate/fast/slow 行为版本，按相同初态组并行 rollout。
2. 逐chunk gate决策、选专家、记录 mode、原始采样token、old logprob、实际动作、持续时间与成功状态。
3. 仿真真实反馈算回报；可以不使用世界模型、不人工标注。
4. 用路线A或B的正确概率对象做联合RL更新；重新冻结行为版本进入下一轮。
5. 仿真可从访问到的状态 fork fast/slow，作为门控value监督与评估；这属于在线环境交互，不是人工示范。
6. 逐渐扩大 fast-only 分支试验，评估快策略是否在脱离 slow 救援时真的成熟，而不是通过人为固定gate退火制造假象。

若用户坚持“完全不做任何模仿/蒸馏辅助”，路线B或off-policy critic比“只加联合gate到原GRPO”更贴近其快速内化目标。路线A纯RL也成立，但传递慢经验到快动作头主要靠改变快策略访问状态分布，而非直接模仿慢动作；这一局限必须说清楚。

## 实验建议

- 独立变量：同样sim步数下，fast-only RL、slow-only、固定概率mix、learned joint gate、marginal mixture、可选在线蒸馏；固定基础预训练与初始化。
- 冷启动设置至少分层报告：task-SFT warm start；有通用VLA但零任务示范；只有VLM、随机快head。
- 同时报告完整成功率、fast-only成功率、slow调用次数与时延、首个成功所需sim步数、达到95/99%成功的交互量及GPU wall time。
- hybrid成功率上升并不等于fast成熟；成熟的证据是固定评估初态下fast-only学习曲线和slow依赖下降。
- 无人工demo不等于无数据：仿真交互本身就是训练数据，奖励/初态脚本也提供任务监督。
- 首版不必上WAM；先确认gate与技能转移能比原SimpleVLA-RL更快拿到成功，否则大世界模型会使贡献来源无法区分。

