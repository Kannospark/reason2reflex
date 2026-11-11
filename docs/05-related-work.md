# 相关研究、证据边界与可借鉴机制

记录日期：2026-11-11。本文汇总本项目两轮讨论所涉及的原始论文、作者项目与官方代码，服务于研究设计，不是穷尽式系统综述。本文没有实施机器人训练，也没有产生新的成功率实验结果。完整引用索引见仓库根目录的 [references.bib](../references.bib)。

## 1. 当前问题与文献组织原则

当前研究主线是：在同一个仿真在线强化学习循环中，慢 VLM 加具身解释器提供场景理解、局部目标与探索方向，快速策略通过环境奖励逐渐形成无需慢指导也可执行的技能，并研究 sim-to-real。用户举例的任务包括 pick-and-place 和 RoboDojo 风格的长程任务，尚未确定具体任务及实施先后；从简单任务起步再扩展长程只是助手的实验建议。人工事先录制演示并非预设必经阶段。

需要区分三个训练条件：

1. **无需人工任务演示采集**：允许仿真自动生成交互、教师建议和辅助学习信号。
2. **零任务 SFT**：不使用当前任务演示来初始化，但可以使用已经预训练的 VLM/VLA。
3. **严格仅有 RL 目标**：连在线 BC、教师交叉熵、KL 蒸馏等辅助监督目标也不使用。

这三个条件分别约束数据来源、任务初始化和优化目标，不构成线性的强弱或蕴含关系，必须分别声明。例如，无人工演示仍可使用仿真自动生成的任务 SFT 数据；零任务 SFT 仍可使用在线教师辅助损失；当前阶段仅用 RL 目标也不说明其初始化未经过任务 SFT。RL 本身仍然生成和使用大量转移数据；“不采人工演示”不等于“无数据”。通用 VLA 的历史机器人预训练也不能称为从零学习。

全文采用以下证据规则：

- **论文事实**：只指原论文的方法、实验设置及其自行报告结果，并保留适用条件。
- **本项目推断**：说明某机制可能适合本项目，尚不构成本项目有效性的证据。
- **研究提案**：把不同论文的机制重新组合，必须通过消融和实物验证；不能归为某篇论文已有结论。

## 2. 最应优先精读的工作

| 优先级 | 原始来源 | 论文中的核心机制 | 对本项目的意义与边界 |
|---|---|---|---|
| P0 | [SimpleVLA-RL，2025](https://arxiv.org/abs/2509.09674)；[官方代码](https://github.com/PRIME-RL/SimpleVLA-RL) | 将 VLA 动作离散化，通过并行仿真、稀疏终局奖励、GRPO 与动态采样训练。 | 直接提供训练框架；论文先做任务 SFT，包含每任务一条示范的低数据设置，不能据此声称已证明零任务示范冷启动。 |
| P0 | [Expert Iteration / Thinking Fast and Slow，2017](https://arxiv.org/abs/1705.08439) | 慢搜索改善动作选择，快网络学习搜索分布；网络再指导下一轮搜索。 | 是“思考逐渐形成直觉”的直接算法祖先；不需人类演示，但包含监督学习，主要是棋类证据。 |
| P0 | [Kickstarting Deep RL，2018](https://arxiv.org/abs/1803.03835) | 学生在线 RL，同时在访问状态学习教师动作分布，逐渐放松教师约束。 | 最直接的在线“指导—内化”机制；教师无需一直接管。它支持无预采人工演示的训练方式，不满足严格仅 RL 损失条件。 |
| P0 | [Bayesian Controller Fusion，arXiv 2021 / IJRR 2023](https://arxiv.org/abs/2107.09822) | 将传统控制先验与 RL 策略的动作分布按不确定性融合，并研究实物迁移。 | 与“初期更多依赖先验，熟练后更多依赖 RL”相近。其可靠控制先验并非 VLM；VLM 替代是新假设，复杂接触也不是已解决部分。 |
| P0 | [Refined Policy Distillation / RPD，arXiv 2025](https://arxiv.org/abs/2503.05833) | VLA 指导学生探索，在线 PPO 同时加入对教师动作的匹配，形成专用 RL expert。 | 机器人领域最直接的近邻之一；学生可超过教师，但教师已有任务相关训练。此处只记录 arXiv 2025，不沿用早期备忘中存在冲突的 IROS 年份。 |
| P0 | [SAGE，2026](https://aclanthology.org/2026.findings-emnlp.1000/)；[arXiv](https://arxiv.org/abs/2609.01567) | 学生策略高熵时查询冻结 VLM，学生动作做 PPO，教师动作做在线 BC，最终仅部署学生。 | 非常接近“选择性慢指导—快自主”。验证主要是离散视觉推理、导航与文本交互任务，不是连续接触机械臂；熵阈值也不是已校准风险。 |
| P1 | [Distral，2017](https://arxiv.org/abs/1707.04175) | 任务策略与共享蒸馏策略通过联合 RL/正则目标交换知识。 | 支持知识在 RL 期间持续传输；原问题是多任务共享，并非慢 VLM 调用预算。 |
| P1 | [MCP，2019](https://arxiv.org/abs/1905.09808) | 多个 motor primitives 通过带权分布乘积同时组合，gate 学权重。 | 提供技能融合的明确概率结构。技能预训练与迁移设置不是零示范慢快共同成长证据；Gaussian 乘积仍可能产生危险折中。 |
| P1 | [Option-Critic，2017](https://arxiv.org/abs/1609.05140) | 统一学习 option 内部策略、选择与终止。 | 将调用慢系统、快技能和恢复正式写成 RL 决策；它解决控制权与持续时间，不自动把慢技能传进快动作头。 |
| P1 | [Guided Policy Search，2013](https://proceedings.mlr.press/v28/levine13.html)；[轨迹优化扩展，2014](https://proceedings.mlr.press/v32/levine14.html) | 昂贵轨迹优化产生指导，快速反应神经策略学习并与指导分布匹配。 | 是规划摊销成快速控制的机器人先例；指导可由仿真优化器产生，但通常具有监督拟合目标与模型前提。 |

### 2.1 SimpleVLA-RL 具体可复用的部分

先前已交叉读取论文与官方代码，代码研究版本为 `7c51662df27b586f9e8a1ab35fcf849f2b8852f9`。以下是该版本记录，不承诺上游当前主分支完全相同。

- OpenVLA-OFT 的连续动作回归被改为离散动作 token；每个标量动作从 256 个 bins 采样，保留并行输出与 chunking。LIBERO 的 chunk 长度 8、动作维 7，一次产生 56 个动作 token；其他平台维度必须以其接口为准。
- 同任务、同初始状态生成一组轨迹，采用环境终局成功判定；终局结果形成组内归一化优势，广播给有效动作 token，而非把每个物理步都看作独立成功奖励。
- 原优化采用逐 token clipped surrogate，并非整条高维轨迹的单一 product ratio；旧概率应与实际 rollout 的动作子词表、温度和 mask 一致。
- 动态采样过滤全成功或全失败的组。稀疏成功概率为零时，该操作不能产生第一次成功；这正是慢指导可能提供价值的位置。
- 若加入时间与调用成本，即便同组全部完成任务，总回报也可能不同，不能不加修改地继续按纯成功率过滤全成功组。

原始代码入口：[动作模型](https://github.com/PRIME-RL/SimpleVLA-RL/blob/7c51662df27b586f9e8a1ab35fcf849f2b8852f9/verl/utils/vla_utils/openvla_oft/modeling_prismatic.py)、[GRPO 核心](https://github.com/PRIME-RL/SimpleVLA-RL/blob/7c51662df27b586f9e8a1ab35fcf849f2b8852f9/verl/trainer/ppo/core_algos.py)、[LIBERO 配置](https://github.com/PRIME-RL/SimpleVLA-RL/blob/7c51662df27b586f9e8a1ab35fcf849f2b8852f9/examples/run_openvla_oft_rl_libero.sh)。

## 3. 两个控制器如何融合，与知识怎样转移

### 3.1 不同融合机制解决不同问题

| 机制 | 相关原始研究 | 能提供的工具 | 不能自动推出的结论 |
|---|---|---|---|
| 控制权/option 选择 | [Options，1999](https://doi.org/10.1016/S0004-3702(99)00052-1)、[Option-Critic](https://arxiv.org/abs/1609.05140)、[Deliberation Cost](https://arxiv.org/abs/1709.04571) | 选择一个闭环过程，学习何时结束，将等待和切换计入回报。 | 只学会选择教师，不代表快策略吸收教师能力。 |
| 动作分布乘积 | [BCF](https://arxiv.org/abs/2107.09822)、[MCP](https://arxiv.org/abs/1905.09808) | 在共同动作空间融合先验与可训练分布。 | 不保证冲突技能物理可行，不保证先验置信正确。 |
| 最大熵策略/Q 组合 | [Composable Deep RL](https://arxiv.org/abs/1803.06773)、[Divergence Correction](https://proceedings.mlr.press/v97/hunt19a.html) | 对兼容奖励组合策略；用未来分歧修正简单 Q 组合的乐观偏差。 | 不同任务中各自成功的策略并非一定可组合；理论条件不能直接套到任意 VLM。 |
| 残差控制 | [Residual RL](https://arxiv.org/abs/1812.03201) | 基础控制器解决可建模部分，RL 补偿接触和误差。 | 残差策略通常仍依赖基础控制器，不能自动脱离慢系统。 |
| 在线辅助知识转移 | [Kickstarting](https://arxiv.org/abs/1803.03835)、[Distral](https://arxiv.org/abs/1707.04175)、[RPD](https://arxiv.org/abs/2503.05833)、[SAGE](https://aclanthology.org/2026.findings-emnlp.1000/) | 教师建议直接进入学生损失，配合环境奖励改进。 | 无人工演示不等于只有 RL 梯度；教师错误与过强约束仍会限制学生。 |

硬选择联合策略若为 `Π(m,a|h)=g(m|h)π_m(a|h)`，则独立快动作头的直接策略梯度包含 `1[m=FAST]`。慢分支执行时，快动作头没有该 on-policy score 梯度。共享感知 trunk 或 critic 可以间接受益，不能将其等同于动作技能已完成转移。

本项目后续提出的 `softmax(fast_logits/T + α log slow_prior)` 是由分布融合文献启发的**研究提案**：动作始终从依赖快参数的分布采样，使引导模式也能产生快参数的奖励梯度。它不是 SimpleVLA-RL、BCF 或 MCP 已经验证的完整 VLM—VLA 算法。撤去先验后仍需独立 fast-only 评测。

### 3.2 其他有用的原始先例

| 原始工作 | 已有机制 | 可借鉴点与限制 |
|---|---|---|
| [Progress & Compress，2018](https://proceedings.mlr.press/v80/schwarz18a.html) | 活跃学习模块与持久知识库交替进行 progress/compress，配合蒸馏和参数保护。 | 将探索与长期记忆区分；不是所有模块每步同时端到端更新的证据。 |
| [PEX，2023](https://arxiv.org/abs/2302.00935) | 保留离线旧策略并增加新策略，用价值比较候选，进行在线扩展。 | 保护原技能并探索新技能；原方法有离线初始化，选择候选不等于技能内化。 |
| [PLATO，2016 preprint](https://arxiv.org/abs/1603.00622) | 自适应 MPC 在学生可能访问的状态产生监督。 | 自动规划可以替代人工示范来源，但其训练仍包含监督策略学习。 |
| [Thinker，2023](https://arxiv.org/abs/2307.14993) | 将模型交互与真实动作纳入扩展 RL 问题，学习如何使用规划。 | 支持“要不要思考”由 RL 决策；游戏实证不是机械臂证据。 |
| [POLO，2018 preprint / ICLR 2019](https://arxiv.org/abs/1811.01848) | 局部模型规划与全局价值学习互相改善，并用于协调探索。 | 固化的对象可以是 value，不必只做动作克隆；标题的 offline 不是固定人类演示数据集的意思。 |
| [MAMBA，2020](https://proceedings.neurips.cc/paper/2020/hash/3c56fe2f24038c4d22b9eb0aca78f590-Abstract.html) | 多个可能次优且冲突的 oracle，以状态价值上界基准指导策略改进。 | 可将 VLM、脚本和快策略都视为局部有用的候选；依赖值估计和 oracle 访问，不是完全无教师监督。 |
| [System 1.x，2025](https://proceedings.iclr.cc/paper_files/paper/2025/hash/605e59e78284907aa4fce5280838def3-Abstract-Conference.html) | 控制器将规划子问题分配给直接生成与显式搜索，训练使用搜索轨迹。 | 计算预算与难度应显式建模；它不是连续机器人控制系统，也不是纯在线 RL。 |

## 4. 机器人快慢系统与能力固化的近邻

| 原始来源 | 论文机制 | 与本项目的关系及证据边界 |
|---|---|---|
| [Show-Harness，2026](https://arxiv.org/abs/2609.10522)；[官方代码](https://github.com/showlab/Show-Harness) | VLM 选择视角相关语义原语，经具身 interpreter 变成受限运动。 | 适合作为慢路径动作接口；不是持续学习的快慢 gate。粗位移原语不直接解决精密接触。 |
| [Scaling Up and Distilling Down，2023](https://proceedings.mlr.press/v229/ha23a.html) | LLM 引导规划与自动验证重试，生成经验并蒸馏为语言条件 diffusion policy。 | 已覆盖慢探索、快策略、重试与 sim-to-real 的大部分骨架；不是在线 actor-critic 共同训练。 |
| [RAX，2026](https://arxiv.org/abs/2610.22496) | Coding agent 在线探索，将成功闭环行为编译为持久程序与技能。 | 极接近“先想、后熟练”；固化介质为程序和记忆，不能称神经 RL 或 VLA 蒸馏。具体实验的演示、reset 和干预需逐设置区分。 |
| [RLDG，2024](https://arxiv.org/abs/2412.09858) | 专用实物 RL experts 产生高质量行为，再微调 generalist。 | 转移方向是专用专家到通用模型，和 VLA 到小 expert 相反；支持研究高质量 RL 经验的价值，但并非纯仿真迁移。 |
| [RFST，2024](https://arxiv.org/abs/2401.04181) | 根据 instruction 类型选择快策略或慢推理，慢 VLM 与控制策略对齐。 | 双系统路由已有先例；其分类对象不是当前状态胜任度，不能直接当成熟度 gate。 |
| [SimEX，2026](https://arxiv.org/abs/2609.38982) | 仿真 probe-and-optimize 生成工具箱，实物试验联合修正 simulator 与程序。 | 无人工演示探索与现实校正的强参照；主要固化为程序工具，不是联合训练神经 actor 与 WAM。 |

“online exploration”不必然是“online reinforcement learning”；“world model”也可能只是几何场景表示，而非动作条件动力学。上述工作不应仅依据摘要术语被归入同一算法类别。

## 5. 世界模型与 WAM：必须按信息流分类

### 5.1 从小型动作条件预测开始的证据

| 原始来源 | 论文机制 | 本项目可借鉴点与限制 |
|---|---|---|
| [PETS，2018](https://arxiv.org/abs/1805.12114) | 概率动力学 ensemble 与 trajectory sampling，用预测分布做规划。 | 单场景可以先用小型任务状态动力学；模型分歧是实用指标，不是已经校准的失败概率。 |
| [MBPO，2019](https://arxiv.org/abs/1906.08253) | 从环境实测 replay 状态启动短模型 rollout，减少累计偏差。 | 区分任务 horizon 与想象 horizon，避免无限使用自生成转移；相关理论不是像素机械臂的零失败保证。 |
| [SuperMimic，2026](https://arxiv.org/abs/2610.28480)；[官方项目](https://supermimic.github.io/) | 交替采仿真数据、拟合可微动力学、通过想象 rollout 的 BPTT 优化策略。 | 可借鉴训练组织方式。研究主体是人形运动跟踪；官方训练动作库“零失败”评估采用确定性、无噪声条件，不能转述为实物操纵 100%。 |

训练世界模型时可固定目标编码器或使用 EMA；训练 actor 时固定动力学参数，但保留对状态与动作的 Jacobian。“固定参数”与“detach 模型输出”不同。后者会切断动作影响未来奖励的梯度。本项目将其用于视觉接触操纵仍是提案，需要先验证模型的动作排序和梯度方向。

### 5.2 WAM 不是唯一架构

| 原始来源 | 关键的信息流事实 | 对本项目的 insight 与边界 |
|---|---|---|
| [DreamZero，2026](https://arxiv.org/abs/2602.15922) | 大型视频 backbone 联合预测视频与动作，配合系统优化实现闭环控制。 | 视频先验可能提供物理表征；联合生成不自动等于可输入任意候选动作的 forward simulator。 |
| [Fast-WAM，2026](https://arxiv.org/abs/2603.16666) | 保留训练期视频建模，部署跳过未来视频去噪，在其受控设置中保持性能。 | 训练辅助与部署规划收益应分别消融；不能推出所有任务都无需在线预测。 |
| [SelfWAM，2026](https://arxiv.org/abs/2608.00725) | future visual queries 接收 clean demonstrated action，另预测 robot self-mask；快动作路径防止标签泄漏。 | 直接回应“预测候选动作后果”；仅预测常见任务进度不能代替反事实预测。动作敏感不代表候选回报排序必然正确。 |
| [AHA-WAM，2026](https://arxiv.org/abs/2606.09811) | 慢 video DiT 缓存长期 context，快 action DiT 用最新观测读取；offset training 适应陈旧上下文。 | 慢计算可以异步，不必让物理世界暂停；缓存年龄必须显式训练。其 planner 不是 LLM 的同义词。 |
| [HiLo-WAM，2026](https://arxiv.org/abs/2611.05023) | 稀疏长期任务演化与稠密局部动力学分流，在统一架构内引导动作。 | 适合长程任务历史与局部接触分工；其视觉流不接受任意候选 action，不能直接当 MPC 动力学；RoboDojo progress score 不等于整任务成功率。 |
| [Faster-WAM，Ma 等，2026](https://arxiv.org/abs/2608.02365) | 单层 action expert，通过 DoT 与 Lite KV-Fusion 读取世界模型多层表征。 | 动作模块可以很浅，但不能据此保证当前任务一层足够。 |
| [Faster-WAM，Zhao 等，2026](https://arxiv.org/abs/2608.04404) | SparseMoT 与 Interval KV-Fusion 复用未来表征，研究分布偏移下 inference-time future conditioning。 | 与上一行是不同论文；提示 Fast-WAM 的发现有条件，必须做本项目自己的训练/部署预测四格消融。 |

候选后果模型应做主动干预测试：同一起点的停留、反向动作、不同幅度、错误夹爪时机是否产生不同且合理的后果。主指标应含物体位姿、接触事件、失败预测与候选回报排序，而不只是视觉生成质量。

## 6. 快速动作网络与动作语义

| 原始来源 | 论文事实 | 对本项目的含义 |
|---|---|---|
| [ACT / ALOHA，2023](https://arxiv.org/abs/2304.13705) | Transformer action chunks、conditional VAE 与 temporal ensembling，用示范训练专用操作策略。 | 专用快策略与“不追求跨任务泛化”相符；它本身是模仿学习方法，应作为动作架构或对照，不能冒充无示范 RL 证据。 |
| [Diffusion Policy，2023](https://arxiv.org/abs/2303.04137) | 建模多模态连续动作分布，receding horizon 执行。 | 预测长度与执行长度分开；互斥绕障路径不要直接平均。物理约束与多模态建模是不同问题。 |
| [π₀，2024 preprint](https://arxiv.org/abs/2410.24164) | VLM 与 flow action expert 通过注意力交互，输出连续动作 chunk。 | action expert 是网络实现，末端位移是动作语义，二者可以同时存在；复用预训练必须保留原动作约定或训练适配器。 |
| [GR00T N1，2025](https://arxiv.org/abs/2503.14734) | VLM 与 DiT action head 组成不同时间尺度的视觉运动架构。 | 支持语义/运动模块分工；dual-system 命名不等于熟悉度 gate，也不等于两专家二选一。 |
| [SmolVLA，2025](https://arxiv.org/abs/2506.01844) | 小型 VLM 与 action expert，研究异步执行。 | 必须比较小模型；参数量不能直接推出具体机器人的延迟或成功率。 |

原讨论中的约 7B 慢 VLM、约 20–30M 专用快策略及若干 MLP/GRU 规模只是工程初值。当前主线为了清楚检验融合，优先保留 SimpleVLA-RL 的既有快 VLA，再比较专用小网络；没有论文已经证明这些模块尺寸对本项目最优。

## 7. 可靠性、sim-to-real 与长期记忆

| 原始来源 | 可借鉴机制 | 边界与使用方式 |
|---|---|---|
| [SimOpt，2018 preprint](https://arxiv.org/abs/1810.05687) | 用少量现实 rollout 调整仿真随机化分布。 | 精确几何扫描仍需动力学、摩擦、延迟与执行器辨识；任意扩大随机化不等于更可靠。 |
| [Dynamics Randomization，2017 preprint](https://arxiv.org/abs/1710.06537) | 动力学随机化与历史依赖策略做实物迁移。 | 单场景仍需覆盖局部物理扰动，属于场景内稳健性。 |
| [Rubik's Cube / ADR，2019](https://arxiv.org/abs/1910.07113) | 自动扩展随机化分布，使用记忆策略处理隐藏动力学。 | LSTM 适合在线辨识隐变量，不是跨窗口持久存技能的唯一机制。 |
| [HIL-SERL，2024 preprint](https://arxiv.org/abs/2410.21845) | 示范、人工纠正与实物 RL，在多个固定操作任务报告高成功率。 | 支持固定任务高可靠性有实证可能；它不是无人工数据或纯仿真方法。100/100 是观察成功率，不是概率等于 1。 |
| [SayCan，2022](https://arxiv.org/abs/2204.01691) | 语言模型估计任务相关性，技能价值估计当前可执行性。 | 语义合理与物理可做应分别判断；价值估计也需要验证。 |
| [KnowNo，2023](https://arxiv.org/abs/2307.01928) | 用 conformal prediction 校准规划选择，必要时求助。 | 可借鉴校准与拒绝机制；其保证依赖数据条件与帮助机制，不是机械臂动力学安全保证。 |
| [DAgger，2011](https://proceedings.mlr.press/v15/ross11a.html)；[SafeDAgger，2016](https://arxiv.org/abs/1605.06450) | 在学生访问状态聚合专家建议，减少分布偏移；另学习查询预测器。 | 最有价值的指导常在失败前沿与恢复状态；接近专家动作不等于已证明物理安全。属于可选辅助学习路线。 |
| [Policy Distillation，2015](https://arxiv.org/abs/1511.06295) | 将专家策略压缩为小学生。 | 明确的知识固化机制，但原实证为 Atari，且含监督目标。 |
| [EWC，2016 preprint](https://arxiv.org/abs/1612.00796) | 保护对旧任务重要的参数。 | 可作持续学习辅助；历史 replay 与旧状态回归集仍需保留。 |
| [Deep Ensembles，2016 preprint](https://arxiv.org/abs/1612.01474) | 多个模型估计预测分布。 | 模型分歧不是自动校准的物理失败概率，集成也可能共同犯错。 |
| [Potential-based Shaping，1999](https://people.eecs.berkeley.edu/~russell/papers/icml99-shaping.pdf) | 在相应条件下，以势差塑形保持最优策略。 | 优先表达真实任务进度；“用了 VLA 就 +0.1”改变目标，不能由该理论辩护。 |
| [Safe RL via Shielding，2017 preprint](https://arxiv.org/abs/1708.08611) | 独立 shield 屏蔽不符合规格的动作。 | 应位于所有控制路径汇合之后；保证依赖抽象和规格有效。 |
| [CBF-QP，2016 preprint](https://arxiv.org/abs/1609.06408) | 通过 barrier constraints 保持安全集合前向不变。 | 安全保持不等于按时完成；饱和、离散周期、估计误差与接触变化必须进入假设。 |
| [HJ Reachability，2017](https://arxiv.org/abs/1709.07523) | 有界扰动下到达与规避分析。 | 适合低维局部任务模型，高维像素到动作系统存在维数与建模障碍。 |
| [RoboDojo，2026](https://arxiv.org/abs/2607.04434) | 统一仿真/实物操纵评测，含记忆、精度和长程维度。 | 可选取单个长程场景；长期训练同一任务后不能称跨任务泛化，progress 与完整成功应分开报告。 |

零失败统计参考 [NIST 精确二项界说明](https://itl.nist.gov/div898/software/dataplot/refman2/auxillar/exacbino.htm)。在冻结策略、声明分布下进行独立且固定数量的试验，若全部成功，单侧 95% 下界为 `0.05^(1/n)`。100/100 对应约 97.05%，不是已证明真实成功概率为 1。相关重复、测试集调参和择时停止不能无解释套用固定样本公式。

认知动机可参考 [Daw 等，2005](https://doi.org/10.1038/nn1560) 与 [Lee 等，2014](https://pmc.ncbi.nlm.nih.gov/articles/PMC3968946/)。它们支持研究不同控制机制及仲裁的动机，不能证明某个 VLM 就是生物学 model-based 系统，也不能代替机器人算法论证。

## 8. 从文献可以提出、但还不能声称已成立的命题

### 已有充分先例的部分

- 慢搜索或规划改善动作，再将经验摊销到快策略。
- 在线 RL 同步使用教师辅助监督，形成超过教师的专用策略。
- 将多技能作为 options 选择，或在概率分布层组合。
- 通过短动作条件模型 rollout 改善控制与学习。
- 仿真训练后通过随机化与现实反馈降低迁移差距。

因此，不宜使用“首次将大模型慢思考与快控制结合”“首次让探索变成快技能”等宽泛新颖性陈述。

### 本项目应检验的具体命题

> 在固定场景的仿真在线 RL 中，冻结慢 VLM 给出的结构化动作先验，能否在无需人工任务示范的条件下提高早期成功探索，并在相同交互与算力预算下，更快形成撤去指导后仍可靠的快策略？

进一步研究动作条件预测、计算预算 gate 与 sim-to-real 时，需要分别证明增益，而非一次添加所有模块后解释不清来源。

建议最小对照：原始 fast-only RL、慢/快硬路由联合 RL、动作 prior 融合 RL、在线 RL 加教师辅助损失。初始化分层报告任务 SFT、通用预训练但零任务演示、随机快动作头；主指标包含 fast-only 成功率、混合成功率、达到阈值所需环境步数、VLM 查询、wall-clock 与 GPU-hours。只有混合成功而 fast-only 不增长，应判为路由有效、能力内化尚未证明。

## 9. 引用维护说明

- 文献链接优先指向 arXiv、正式会议页面、作者项目或官方代码；不在仓库镜像论文全文。
- BibTeX 采用公开原始链接；为避免伪造，未完整核对的作者或出版字段留空，使用 `@misc`。省略作者不表示论文没有作者。
- 年份默认首个 arXiv 版本年份；正式会议年份只有在明确核对时另注。RPD 固定记为 arXiv 2025，避免早期讨论中的会议信息冲突。
- WAM 中两篇 Faster-WAM 通过 arXiv ID 与第一作者区分。
- 本次归档补核了 WAM、RLDG、RFST、SimEX、RAX、RoboDojo、SimOpt、POLO 等原始页面标题。其他技术细节继承两轮原始阅读记录；未来用于投稿前应按目标版本逐项重新核对。
