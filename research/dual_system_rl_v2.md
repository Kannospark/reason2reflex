# 面向 SimpleVLA-RL 的双系统在线融合：原始文献核验与方案建议

核验日期：2026-11-11。以下文献均核对论文原文或作者主页；“推荐算法”是从文献导出的设计建议，不声称是某篇论文已经验证的完整机械臂系统。

## 对用户意图的准确重述

目标不是先人工采集演示、再训练模仿策略，而是在同一仿真交互循环中，让慢 VLM/规划器提供初始语义能力与探索方向，环境奖励验证建议，快速策略不断通过 RL 成长，最终多数熟悉情形由快速路径处理。允许自动生成和缓存 rollout，不等于需要人工采集数据。必须区分：零人工任务演示、零任务 SFT、严格只有 RL 损失。这三个限制并不等价。

## 12 篇有明确机制联系的原始文献

| 论文与正式来源 | 训练类型及融合位置 | 真正转移到学生的机制 | 对本课题的启发与边界 |
|---|---|---|---|
| [SimpleVLA-RL: Scaling VLA Training via Reinforcement Learning, 2025](https://arxiv.org/pdf/2509.09674) | 交互仿真，稀疏 outcome reward，GRPO；并非双系统 | 直接更新 VLA 动作概率 | 可复用 rollout、group advantage、并行渲染框架。但 §5.1 先一条/完整轨迹 SFT；§5.3 先每任务 1000 条模拟轨迹 SFT，再仿真 RL。它是无真实演示，不是严格无任务示范启动。 |
| [Thinking Fast and Slow with Deep Learning and Tree Search / Expert Iteration, NeurIPS 2017](https://arxiv.org/abs/1705.08439) | 在线自生成搜索数据；慢搜索与快网络相互促进 | 搜索改善策略，网络拟合搜索结果，再反过来指导搜索 | 与“慢思考转为本能”结构上最准确；不需要人类示范，但含监督蒸馏。棋类结果不能直接推出机器人接触场景有效。 |
| [Kickstarting Deep Reinforcement Learning, 2018](https://arxiv.org/abs/1803.03835) | 学生在线 RL；教师在学生访问状态提供分布 | RL loss 加教师→学生交叉熵/KL，权重可自适应或退火 | 最小改动即可把语义建议同步固化为快策略。教师并不必然控制环境。需要逐渐放松教师约束，避免性能被较弱教师限制。 |
| [Distral: Robust Multitask Reinforcement Learning, NeurIPS 2017](https://arxiv.org/abs/1707.04175) | 多任务在线 RL，策略 prior 融合，joint objective | 各 worker 的 RL 与共享 distilled policy 的蒸馏相互耦合 | 给两个技能融合提供分布级方案；不是简单混动作，也不是单纯共享特征。原目标是多任务，不是昂贵 VLM 调用门控。 |
| [Progress & Compress: A scalable framework for continual learning, ICML 2018](https://proceedings.mlr.press/v80/schwarz18a.html) | 在线 active column 与持久 knowledge base；交替 progress/compress | 特征侧向连接迁移旧技能；蒸馏和在线 EWC 固化新技能 | “活动探索模块→长期熟练模块”很接近，但本身是交替阶段，不是每步共同端到端更新；单任务首版不必上 EWC。 |
| [Refined Policy Distillation: From VLA Generalists to RL Experts, IROS 2025](https://arxiv.org/html/2503.05833v2) | ManiSkill 在线 PPO + 在线 VLA 教师动作均值 MSE | 同一 RL 循环联合优化奖励与模仿，使小学生超越 VLA 教师 | 机器人场景最直接。不是“先攒新示范再离线训练”。但教师已使用模拟任务数据微调，不能当作严格零示范初始化证据；对弱教师的依赖仍在。 |
| [SAGE: Selective Agent Guidance via Entropy, 2026](https://arxiv.org/html/2609.01567v1) | 高熵时查询冻结 VLM 并执行建议，在线 PPO + advantage-weighted BC | 学生动作做 PPO；教师动作单独做加权蒸馏；critic 使用环境奖励 | 几乎精确匹配“慢指导→快自主”。验证于离散视觉推理、导航和 ALFWorld 等，不是连续接触机械臂。策略熵是代理指标，不是可靠性的校准概率。 |
| [Policy Expansion for Bridging Offline-to-Online Reinforcement Learning / PEX, ICLR 2023](https://arxiv.org/abs/2302.00935) | 先离线，再在线；保留旧策略，增加新策略，价值选择候选 | 旧技能保留，新策略用 RL 学到新行为 | 是两个策略如何协作探索的强参照。原方法依赖离线初始化；候选选择不自动等于把旧策略蒸馏进新策略，不能宣称纯在线零示范范例。 |
| [The Option-Critic Architecture, AAAI 2017](https://arxiv.org/abs/1609.05140) | 在线 RL，层级 option、内部策略、终止条件 | 同一个 return 下学习选择、执行和终止 | 最适合把“调用慢模型”变成正式可训练动作；长时间 option 用 SMDP 回报和持续时间。原方法不承担 VLM 知识蒸馏。 |
| [PLATO: Policy Learning using Adaptive Trajectory Optimization, ICRA 2017](https://arxiv.org/abs/1603.00622) | MPC 在线产生监督，策略学习；自适应让 MPC 接近学生 | 在未来学生会访问的状态生成训练指导 | 说明无需人类演示也能用规划器教快速视觉策略。优化核心有监督模仿，并非严格纯 policy gradient；模型和 MPC 成本是额外前提。 |
| [Thinker: Learning to Plan and Act, NeurIPS 2023](https://arxiv.org/abs/2307.14993) | 在线 RL，扩展 action space 允许查询世界模型和真实执行 | actor 学会如何分配模型交互与真实动作 | “要不要思考”可以直接纳入 RL 决策，适合 gate 的理论动机。游戏验证不等同于已有机械臂双系统方案。 |
| [Plan Online, Learn Offline / POLO, 2018](https://arxiv.org/abs/1811.01848) | 持续交互，局部模型规划与全局价值学习 | 规划改善采样与探索，值函数缩短规划 horizon | 与纯 imitation 不同，固化对象可以是 value，而非必须把轨迹完整克隆为 actor。原论文的 learn offline 指采样后更新，不应混同固定人类数据集的 offline RL。 |

## 容易混淆的四种“融合”

1. **特征融合**：慢特征 z 与快特征 h concat/cross-attention。它能帮助控制，却不保证撤去 z 后仍会做；而且每步都算 z 时没有节省慢推理。Progress & Compress 的侧向迁移是相关参照。需要 guidance dropout、持久 latent 预测或显式蒸馏证明能力固化。
2. **动作融合**：从两个 policy 的动作中选一个，或 mixture-of-distributions；与数值平均动作不同。两条绕障路径平均可能穿障。PEX 是候选选择参照。仅选择不会自动复制技能。
3. **policy prior / KL / 在线蒸馏**：教师指导直接进入学生 loss；Kickstarting、Distral、RPD 属于这一族。最明确地让快策略吸收慢路径能力，也允许不采集人工演示。它仍有非 RL 辅助目标，应该诚实命名。
4. **层级 options**：让 gate 选择某个闭环技能，持续若干步，学习终止。Option-Critic 最合适。它解决谁来控制与何时切换；若要求技能从慢到快转移，还需 RL 探索、在线蒸馏或其他明确信号。

## 推荐方案 A：首先实施，在线 RL + 选择性指导（无人工演示，允许辅助 loss）

保持 SimpleVLA 的并行 simulator、grouped rollout、terminal success evaluator。快策略 πθ 输出统一动作 token 或有已知密度的连续分布。冻结 VLM 加确定 grounding/interpreter 产生 aT。教师与学生必须用相同单位、坐标系、控制周期、动作 chunk 定义。

在每个决策点，以轻量不确定性/失败预测决定是否请求教师。缓存 source flag m、执行动作、执行分布版本、环境 reward、duration。

学生自己的动作：优化标准 RL loss。教师动作：不要伪装成学生自己采到的 on-policy action；使用在线辅助项：

    L = L_RL(student-origin transitions) + λ E_teacher[w(h,aT) · (-log πθ(aT|h))] + cV Lvalue - cH H(πθ)
    w = clip(exp(stopgrad(ÂT)/τ), 0, wmax)

若连续高斯学生采用固定方差，辅助项可用 RPD 式动作均值误差；多模态动作不应无条件用单均值 MSE。可以把 w 改为基于同模拟状态分叉得到的教师相对学生优势，这比早期不准的 critic 更有辨识度，但增加采样成本。

梯度：θ 得到 RL+辅助梯度；冻结教师无梯度；gate 首版规则不学习。critic 学混合行为价值时必须清楚其评估的 continuation；不能把混合策略 critic 无解释地称为纯学生 Vπ。后续可采用 joint policy objective 或独立纯学生 rollout，减轻目标混淆。

这是“一边探索一边形成技能”，不是先人工录制示范然后离线训练。要求是无人工采集时，这是推荐主线。SAGE 和 RPD 都提供实证支撑，但分别缺少连续机械臂证据、零任务 SFT 启动证据。

## 推荐方案 B：严格只有 RL 的统一层级控制（更符合纯 RL 定义，但知识转移可能慢）

令 h 为观测历史/信念；m ∈ {fast, slow}。qφ(m|h) 为门控。πθ 为快策略；πT 为冻结教师加解释器。定义扩展动作联合策略：

    Πφ,θ(m,a|h) = qφ(m|h) πm(a|h)
    r̃ = rtask - ctime Δt - cquery 1[m=slow] - cswitch 1[m≠mprev]

冻结的教师分支执行时，teacher conditional ratio 约去，不需要知道黑盒 VLM 的连续动作密度（前提：教师和解释器固定；门控保存 m；不是把 teacher samples 当快 policy samples）。

    ratio = [qφ(m|h)/qφold(m|h)] × {[πθ(a|h)/πθold(a|h)] if m=fast else 1}

对这个 ratio 进行 PPO/GRPO 式 clipped 更新，训练的是实际混合控制器。φ 获得两种分支的选择 credit；θ 的直接 score gradient 为：

    ∇θ J = E[1[m=fast] ∇θ log πθ(a|h) ÂΠ]

慢分支的结果可训练共享 critic，帮助 fast 之后探索，但没有直接行为克隆梯度。因此不能只加 gate 后宣称慢能力自动被完整吸收。必须保留足够 fast branch 探索，避免 gate 长期选慢导致学生没有练习机会。

如果一次 option 持续 n 个底层步：

    R(n)=Σj=0..n-1 γ^j r̃t+j
    target=R(n)+γ^n(1-d)V(ht+n)

思考等待必须计入 Δt/n。冻结教师可以先固定；若也训练 slow VLM，需要记录其文本/规划输出概率与实际接口，不能对黑盒文本直接跨物理 simulator 反向传播。

这条线有 Option-Critic/Thinker 的清楚理论依据，比把“用了 VLA 就 +0.1”更干净。但成本惩罚可能诱使 gate 过早拒绝指导，初期应设预算/调用下限或逐步提高计算成本，并分别报告纯快与混合策略成功率。

## 推荐方案 C：严格 RL 中把教师变成 student 的可选上下文，而不是第二个动作源

qφ 决定是否更新慢建议 z；快 policy 始终产生最终执行动作：

    zt ← VLM(ht) if query else cache(z)
    at ∼ πθ(a|ht,zt,age(z),available(z))

最终动作始终从当前学生产生，学生的 policy gradient 语义最清楚。query gate 可用计算成本后的回报训练。通过训练中设置一部分 z=∅，为无教师运行保留行为支持；分别评测 z=∅ 与提供 z 的策略。

优点：低层技能始终得到练习，不需把不同动作源拼成伪 on-policy data；可以允许 VLM 提供子目标/几何约束而非毫米级动作。缺点：无建议时能力提升不是自动保证；若要显式加速固化，可增加可预测 z 的学生 latent 或 online KL，但这又成为辅助学习方案。冻结教师并不等于“没有任何先验”。

## 为什么不建议直接把教师轨迹塞进原 GRPO

SimpleVLA 的分母是生成动作的旧 policy。加入 teacher takeover 后，真实行为分布改变。πθ(aT)/πθold(aT) 不是正确的 teacher-origin importance ratio；冻结老师如果是黑盒，更不能杜撰 log prob。使用 A 的分区辅助目标，或 B 的显式 mode joint policy。若使用边缘 mixture μ(a|h)=Σm q(m|h)πm(a|h)，必须实际能评估所有相关密度，且每个动作空间/支撑一致。

另一个 sparse GRPO 冷启动问题：同组全失败，group advantage 全零。慢指导若能让至少一些 rollout 成功就十分有用；否则需要自动 curriculum、从可达中间状态重置、任务阶段奖励/潜势函数或更强 grounding。任意取均值为零而方差加 ε，不会创造训练信号。

## 最需要的消融（为审稿人的因果疑问设计）

- 相同基础模型、相同并行环境、相同环境步数与 total GPU-hours：纯 SimpleVLA-RL、固定 schedule takeover、阈值 gate、学习 gate。
- guidance-only 无蒸馏、蒸馏-only、联合 RL+蒸馏；这个消融直接证明“慢能力是否变成快本能”。
- 纯 fast evaluation、混合 evaluation；否则 99% 可能只是一直调用教师。
- 移除/置乱教师语义、随机等成本动作指导，检验收益是否真的来自理解而不是额外探索量。
- 无任务 SFT、1 轨迹 SFT、已有 SFT 三种启动条件分开。不要把预训练 VLA 的大量历史演示叫作 tabula rasa。
- 收敛到目标成功率所需的环境交互数、VLM query 数、真实 wall-clock、GPU-hours 四轴；节省 environment steps 但慢了十倍也应披露。
- 长程任务检测混合 source 的 credit assignment、option 抖动、teacher systematic error、low entropy but wrong 等失效；gate 准确率不是最终任务可靠性。

## 可用于主回复的判断

最接近的已有研究是 SAGE（昂贵不完美 VLM 在线指导、选择性调用、快学生变自主）与 RPD（机器人在线 PPO + VLA 教师同步固化）。最准确的思想祖先是 ExIt，而不是仅有推理时快慢两头的架构。用户想要的系统合理且有连续文献谱系；创新不能只写“双系统”，应具体落到零人工任务演示启动、同一交互中持续技能转移、具有正确 likelihood 的门控 RL、在实物延迟与失败恢复下的可靠性收益。
