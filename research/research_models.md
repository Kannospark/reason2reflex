# 文献核查备忘：Show-Harness、SuperMimic、WAM 与动作表示

核查日期：2026-11-11。以下只采用论文、作者项目页和官方代码。数字均是各论文自己的实验报告，不能跨硬件、任务、数据量直接排名。最后的设计建议是推论，不是已被上述论文整体证明的系统。

## 1. 名称核对与最容易发生的误读

**showharness：可以准确匹配 Show-Harness: Just a VLM Agent Can Play Robots。** 首稿 2026-09-09，arXiv:2609.10522。作者以离散、视角相关的语义单步动作（前后左右上下、绕轴转动、抓放、完成）连接 VLM 和机器人，具体控制由具身 interpreter 实现。它不是让 LLM 输出力矩，也不是一个自动持续学习的快慢切换系统。官方实现支持零样本大模型和小模型微调两条路径。[论文](https://arxiv.org/abs/2609.10522)；[官方代码](https://github.com/showlab/Show-Harness)。

**supermimic：可以准确匹配 SuperMimic: Scaling Humanoid Whole-Body Control with One Differentiable World Model。** 首稿 2026-10-20，CoRL 2026。它联合迭代收集仿真数据、拟合可微动力学、通过想象轨迹 BPTT 优化策略。它研究的是人形运动跟踪，不是视觉机械臂抓取或 VLA。学到的动力学模型接收全状态、动作、仿真上下文，actor 部署时用带噪本体感觉与目标。[论文](https://arxiv.org/abs/2610.28480)；[官方项目](https://supermimic.github.io/)。

**WAM：World Action Model 是类别，不是唯一确定架构。** DreamZero、Fast-WAM、SelfWAM、AHA-WAM 使用不同的信息流和部署形式。必须追问具体希望借鉴的是“未来视频辅助表征学习”“动作条件的 forward dynamics”“视频计划到动作 inverse dynamics”还是“联合视频动作生成”。这些能力不能互相自动推出。下面按功能区分。

尤其注意：SuperMimic 的 129,514 条动作“零失败”是训练动作库覆盖测试；官方脚注明确每条从首帧仅执行一次，确定性物理，摩擦 1.0，无随机化、无观测噪声。论文有实物 G1 展示，但这两个事实不构成实物 100% 成功率证据。[官方评估脚注](https://supermimic.github.io/)。

## 2. 最相关的原始文献与可借鉴机制

### 2.1 Show-Harness（2026-09-09）

结构：VLM 决定语义单元 a；interpreter g_E 将其变成受限的末端位姿设定值，约束工作空间和每步范围。论文默认小模型为 Qwen3.5-2B，LoRA rank 64，冻结视觉编码器与 projector；2 cm 细步或 4 cm 粗步，动作历史保留最近五步。微调只用仿真的 sim-to-real 测试官方页报告 13/20，不是满分。

启发：慢系统可输出可解释的小位移原语，再由控制器执行；同一动作语义可跨仿真与实物统一。不能推出固定 2 cm 足以接触精密装配；其精密任务也需要更小 interpreter 步长。来源：[论文](https://arxiv.org/html/2609.10522v1)，§3.2、§5.1、§5.3；[项目](https://showlab.github.io/Show-Harness/)。

### 2.2 SuperMimic（2026-10-20）

结构：动力学 MLP 隐层 (2048,2048,2048)；motion encoder (2048,1024,512,256)，32 维 tanh latent；共享 decoder (2048,1024,512,256)；critic (256,128)。模型以 k=8 步 autoregressive replay windows 训练；策略通过 H=32 步 imagined rollout 优化并接 critic 的终端价值。世界模型参数在 policy update 中固定，但保留对输入和动作的 Jacobian；整个训练循环内两者持续更新。

启发：可复制“交替更新”的训练范式；无须可微仿真器。边界：它依赖容易获取的运动状态和较结构化奖励，视觉接触操纵还需解决隐藏状态、接触不连续、模型偏差和奖励梯度可靠性。来源：[论文 §3、附录 C/D](https://arxiv.org/pdf/2610.28480)。

### 2.3 π₀（首稿 2024-10-31；核查 v4，2026-01-08；RSS 2025）

结构：预训练 PaliGemma VLM 加约 300M action expert；action expert width=1024、MLP width=4096，共 18 层；图像/语言进入 VLM 权重，机器人状态和 noisy action chunk 进入另一组权重，经 attention 交换信息。动作 horizon H=50；前缀及状态 K/V 可缓存。输出是连续 action chunk，而不是必须为文本 token 的动作。

启发：action expert 是“实现网络”，位移是“输出语义”，二者并不互斥。将 fast expert 输出定义为 ΔSE(3)+gripper 完全成立。边界：不能原封不动换掉既有预训练策略的 action semantics；关节与末端的转换必须保留运动学和时间约定。来源：[论文附录 A-B](https://arxiv.org/html/2410.24164v4)。

### 2.4 GR00T N1（2025-03-18）

结构：Eagle-2 VLM 被称为 System 2，DiT action head 被称为 System 1，联合训练。224×224 图像压至每帧 64 tokens；N1-2B 使用 VLM 第 12 层表示；动作 chunk H=16，4 步去噪；具身特定 MLP 编解码状态和动作。

启发：中间 VLM 层表示可能比最终语言输出更适合低延迟控制；两种时标可以分模块。边界：论文的 dual-system 名称并不意味着存在“见过/未见过” gate，更不意味着 actor 和 VLM 二选一。来源：[论文 §2.1](https://arxiv.org/html/2503.14734v1)。

### 2.5 SmolVLA（2025-06-02）

结构：论文主模型总计 450M，约 100M action expert；SmolVLM2 只保留前 16 层，视觉每帧 64 tokens；冻结 VLM，训练 action expert；50 步 action chunk、10 步 flow matching。论文还提出异步执行栈。

启发：单场景必须比较小型 VLA/ACT，不能先验认为“大脑越大控制越可靠”。论文消融显示预测 chunk 长度和实际执行步数是两个参数；频繁重新观测通常更稳。边界：参数量无法直接推出具体硬件延迟或该场景成功率。来源：[论文 §3、§4.3、表 12/13](https://arxiv.org/html/2506.01844v1)。

### 2.6 ACT / ALOHA（2023-04-23，RSS 2023）

机制：conditional VAE + transformer 学 action chunk，利用 temporal ensembling 组合重叠预测、减轻抖动和动作误差累计；实物精密双臂任务展示了较少示范数据可训练专用策略。

启发：用户“不要求泛化”的条件正适合专用 action-chunk policy；不必让大语言模型参与所有动作。先比较 ACT、diffusion policy、脚本状态机+闭环控制，才能证明复杂 gate/WAM 的增益。边界：示范模仿成功不代表有错误恢复能力，需加入纠错数据。来源：[原始论文](https://arxiv.org/abs/2304.13705)。

### 2.7 Diffusion Policy（2023-03-07，RSS 2023）

机制：条件扩散建模多模态连续动作分布，结合视觉条件和 receding horizon control；一次生成轨迹，只执行一部分然后重规划。

启发：不要对两个相互冲突的轨迹简单求均值；多模态分布可以代表“从左绕/从右绕”等多个有效动作方案。区分预测 horizon 与执行 horizon。边界：连续动作生成与物理可行/安全是不同命题，仍需轨迹检查与控制层。来源：[原始论文](https://arxiv.org/abs/2303.04137)。

### 2.8 DreamZero（2026-02-17）

机制：14B 预训练视频扩散 backbone，联合预测未来视频与动作；作者用 autoregressive world-action 生成、异步闭环和多级优化达到报告的 7 Hz。它主要研究泛化、跨具身和异质数据学习。

启发：视频先验可能提高新运动/新任务的表征能力；高算力、缓存、chunk 执行和反应时延本身也是架构的一部分。边界：大型联合生成不是自动可用的 MPC forward model；必须支持给定候选动作后预测其后果。7 Hz 不是伺服频率，也不应无条件复制到单卡。来源：[原始论文](https://arxiv.org/abs/2602.15922)，[§3.2 系统优化](https://arxiv.org/html/2602.15922v1)。

### 2.9 Fast-WAM（首稿 2026-03-17；核查 v2，2026-03-23）

机制：Wan2.2-5B 视频 backbone + 1B action expert（hidden 1024），总计约 6B；horizon=32，视频 9 帧。训练联合 video/action flow matching，但 action queries 看不到未来 video tokens。部署时只做当前帧的 latent world representation，跳过未来视频去噪。受控实验中去掉视频训练的影响大于去掉推理未来生成。

启发：未来预测可作为训练期辅助任务，快路径部署无需视频生成。边界：结论限定在其设置；它不证明所有任务都不需要推理预测，也不提供任意动作的反事实后果。来源：[原始论文 §3、§4.1](https://arxiv.org/html/2603.16666v2)。

### 2.10 SelfWAM（2026-08-01）

机制：指出仅按当前图像/目标预测未来可能只学会“常见任务接下来通常发生什么”。在 Fast-WAM 类结构上，给 future visual queries 增加 clean demonstrated action 条件，同时预测 RGB 和机器人 self-mask；noisy action queries 无法读取 clean action 或未来 tokens，防止标签泄漏。部署保留 fast action-only 模式，另有给动作预测后果的模式。

启发：这正是用户“预测某个候选位移奖励”必须补上的信息流。训练集中必须有多种动作后果，尤其错误、停留和碰撞边界样本；否则任意 action rollout 仍可能失准。边界：更好的视频指标不等价于奖励排序正确，也不等价于现实可靠规划。来源：[论文](https://arxiv.org/html/2608.00725v1)；[官方项目](https://selfwam.github.io/)。

### 2.11 AHA-WAM（2026-06-08）

机制：慢 video DiT 形成长期 latent context 并维护 rolling K/V memory；快 action DiT 用最新观测引导 context routing、短 chunk 执行。offset training 让 executor 适应 planner 不同的陈旧程度。

启发：慢思考不必“暂停快执行”，也不必每次规划都从零重算；可以异步缓存，但要显式训练 stale-context 的影响。边界：其 horizon-adaptive 指训练中分配不同时间尺度，论文明确并非在线自动调整 horizon；其 planner 也不是 LLM 的同义词。来源：[原始论文 §3](https://arxiv.org/html/2606.09811v1)。

### 2.12 PETS（2018-05-30，NeurIPS 2018）

机制：概率动力学 ensemble + trajectory sampling 传播认知与随机不确定性，再用采样式 planning/MPC 选动作。

启发：固定场景可以从小型结构化 state dynamics ensemble 开始；候选动作相同、不同 ensemble 预测分歧大时，就不信任 planner 的高奖励。边界：ensemble disagreement 只是实用不确定性指标，不能当作已校准失败概率或形式保证。来源：[原始论文](https://arxiv.org/abs/1805.12114)。

### 2.13 MBPO（2019-06-19，NeurIPS 2019）

机制：从真实经验 replay 状态出发做短模型 rollout，限制误差累计；模型生成数据作为额外训练样本，区分任务 horizon 和模型 horizon。

启发：用户的在线学习循环应保留真实/仿真经验锚点，别让模型用自己预测的数据无限自我强化；模型误差大时缩短 imagination horizon。边界：在论文假设下的性能界限不是复杂视觉机械臂的 100% 保证。来源：[原始论文](https://arxiv.org/abs/1906.08253)。

### 2.14 两篇不同的 Faster-WAM，勿混为一篇

**Ma 等，首稿 2026-08-03，v2 2026-10-06，arXiv:2608.02365**：single-layer action expert，DoT + Lite KV-Fusion，使浅动作模块读取多个视频层信息。启发：动作网络不必和视频网络一样深。其结果不能证明本项目一层 action head 足够。[论文](https://arxiv.org/abs/2608.02365)。

**Zhao 等，2026-08-05，arXiv:2608.04404**：SparseMoT + Interval KV-Fusion，用少量交互层和缓存未来表征降低推理成本；其分布偏移实验认为 inference-time future conditioning 有价值。启发：Fast-WAM 的结论不是普遍定理；应做当前项目的训练预测/部署预测四格消融。[论文](https://arxiv.org/abs/2608.04404)。

### 2.15 HiLo-WAM（2026-11-03，arXiv:2611.05023）

机制：共享 Wan2.2-5B Video DiT 处理两条视觉流：稀疏长期历史/未来用于任务进度，稠密短期未来用于局部交互，另有 Action DiT。attention 限制动作和局部视觉只读取长期历史与最近未来 latent，不直接读取最远未来；视觉流不读取动作 tokens。推理阶段先缓存长期流、再缓存局部流，让动作继续去噪。

启发：若任务扩展到 RoboDojo 长程序列，memory 应记“已经做过什么/还剩什么”，短期模型则管接触与几何，不能只把 LSTM hidden state 当熟悉度 gate。边界：这是统一 WAM 内的双时间尺度，不是慢 LLM/快 policy 的路由学习；视觉流不接受候选 action，不能直接当任意 action forward simulator。该论文的 RoboDojo progress score 也不是完整任务成功率。[原始论文 §3](https://arxiv.org/html/2611.05023v1)。

## 3. 对用户三个问题的直接研究判断（以下为建议）

### 3.1 “VLA action trunk 还是位移”是不同层次的概念

网络可选：ACT、LSTM、Transformer、diffusion/flow action expert。动作空间可选：末端 pose delta、末端绝对 setpoint、速度、关节角、力矩。不要让 gate 在“网络结构”和“动作语义”之间二选一。建议两个候选都转换成统一的 H×7 末端增量与夹爪序列：A=[Δp(3),Δr(3),g(1)]，明确基座/工具坐标系、米/弧度、时间步长、rotation 组合方式、夹爪绝对/增量约定。6D 指旋转最小坐标或 so(3) 增量，不是把欧拉角随意逐项相加。

慢路径：VLM→语义单元/目标位姿→bounded trajectory generator→A_slow。

快路径：视觉/状态历史→action expert→A_fast。

两者进入同一个 action-conditioned forward model、同一个 constraint filter、同一个执行控制器。gate 最终选候选/option，不平均不同模态的动作。精密接触阶段可引入阻抗/力控原语；一维夹爪指令不能代替接触状态估计。

### 3.2 “大脑多大”应该按职责消融，而非按职业选手类比决定

可验证起点：慢 VLM 2B–8B（冻结或 LoRA）负责目标、纠错、候选提议；如果语义理解确实困难，再把更强模型作为离线教师。快模型建议 10M–100M 级专用 encoder+sequence decoder 起步；比较 ACT / diffusion policy 和 450M SmolVLA。大模型调用频次、输入像素、context 长度、动作 chunk 执行步数通常比参数总数更直接地影响闭环性能。上述区间是工程初始值，没有文献能从未指定的场景推出“最优模型大小”。

### 3.3 gate 不是“图像以前见过吗”的普通分类器

真正问题是：在当前历史与不确定性下，哪个 option 的成本调整后成功价值最高？同一图像可能对应不同的接触、遮挡或先前失败历史。gate 输入至少包括 history embedding、任务阶段、fast policy disagreement/likelihood、动力学 residual、传感器异常、预计 latency。

若只能选 VLA 与 slow 两种 option，先 rollout 两条候选动作：f(s,A_fast) 与 f(s,A_slow)，再比较 predicted cumulative reward−time/collision/uncertainty cost。世界模型物理状态转移无需知道“这动作由 VLA 产生”，除非 option 引入了真实的延迟、动作持续时间或控制器行为差异。

“用 VLA +0.1”会引入人为偏好。若每个控制步给奖励，模型可能延长轨迹、重复切换或宁愿执行失败但赚偏好分；即使只给一次，也改变原任务最优解。建议将调用成本写成负的实际时间/计算成本，在满足成功和风险约束后才鼓励更快。gate 标签可来自同一起点的 paired rollouts（counterfactual branching），而不是用成功轨迹上调用哪个系统作真值标签；后者有选择偏差。

## 4. 建议的数学信息流：清楚区分三种梯度

记 history h_t=(o_{t-L:t},a_{t-L:t-1})，belief z_t=E_ψ(h_t)。候选 sequence A_j=π_j(z_t,g)，j∈{fast,slow,recovery}。学习 forward dynamics ensemble F_ω^(m)(z,a)→(z_next,r,termination,constraint)。展开每个候选，按 lower-confidence value 评分：

Vhat_j = mean_m[Σ_(k=0)^(H−1) γ^k rhat_(t+k) + γ^H V(z_(t+H))] − β·std_m(return) − λ_time·latency_j − λ_switch·1[j≠j_prev]。

gate 只有候选通过独立 hard constraint filter 时才可选它；如果全部不通过，进入 hold/recovery。预测 H 可以大于实际执行 K，执行 K 步后重新观测。模型在数据少、接触转变或 disagreement 高时应缩短 H/K。

**世界模型训练**：用环境真实转移窗口，L_WM = Σ_k w_k[||zhat_(t+k)−stopgrad(E(o_(t+k)))||² + λ_r(rhat−r)² + λ_d BCE(dhat,d)]。若使用可学习 encoder，需加合适重建/对比/方差约束，避免 latent collapse。mask/物体 pose/contact 辅助项可替代背景 RGB 误差。

**快策略训练**：先行为克隆；flow matching 可统一采用 noise→data 约定，A_τ=(1−τ)ε+τA，目标速度 A−ε，L_FM=E||v_θ(A_τ,z,τ)−(A−ε)||²，ODE dA_τ/dτ=v_θ。其后视实际需求采用环境 model-free RL 或短 model-based policy update；不要把两条算法假装为同一梯度。

**通过世界模型的策略梯度**：在 policy update 固定 ω，对 J(θ;ω) 展开 BPTT；d z_(k+1)/dθ = F_z·d z_k/dθ + F_a·(π_z·d z_k/dθ + π_θ)。ω 固定不等于 detach(F 的输出)，否则 action→future→reward 的梯度被切断。

**gate 训练**：若 gate 是离散 option，用 supervised paired-return regression 或 SMDP actor-critic；持续时间 τ_j 不同时用 γ^(τ_j) bootstrap。不能直接从离散 argmax 对世界模型端到端求普通梯度；可用 policy gradient、soft relaxation（有偏）或训练值函数后部署 hard selection。

slow VLM 若是外部/冻结模型，不接受这里的 BPTT；将其 rollout 加入 replay，再以蒸馏/BC 训练快策略。冻结 slow teacher 不妨碍持续学习，经验的持久化应由 replay、版本化 checkpoint 和任务状态 memory 实现；“换窗口遗忘”并不是 LSTM 所能独立解决的控制问题。

## 5. 建议至少保留的 12 个 insight / 消融问题

1. 先界定固定场景中的初始状态范围，单场景不等于单状态。
2. 语义动作与 metric interpreter 分离可降低 sim-real 控制接口偏差。
3. 语义步长应随阶段变化，接触精细阶段可能需要毫米级/力控。
4. action expert 与末端位移可以同时成立。
5. world modeling auxiliary loss 与部署规划收益必须分别做消融。
6. 联合视频-动作生成与 action-conditioned dynamics 是不同能力。
7. 用候选动作干预测试预测器：零动作、反向动作、不同幅度应该产生相应未来；仅看 PSNR 不够。
8. 动力学错误要按任务相关变量和候选奖励排序衡量，避免漂亮但无用的视频。
9. gate 要识别不确定/不可观测状态，不能只识别熟悉图像。
10. 异步慢规划需要 timestamp、已执行前缀和 stale-context 训练。
11. prediction horizon 和 execution horizon 分开，接触阶段更频繁闭环。
12. 持续训练保留历史 replay 和版本验证，避免新经验覆盖原技能；新策略通过相同 holdout 后再替换线上版本。

