# 双控制器融合与在线成型：原始研究核查（2026-11-11）

## 最重要的结论

用户澄清的是：在仿真环境在线 RL 的同一个训练循环里，VLM + 直接控制作为可查询的初级先验，逐渐形成无需反复思考的快策略；不希望先采人类演示再 BC。这应拆成两个相关但不同的问题：**运行时融合（谁控制）**与**训练中知识转移（快策略如何真正学会）**。只有一个 gate、两个已经训练好的专家，不会自动实现后者。

最直接的机器人先例是 **Bayesian Controller Fusion (BCF)**；最直接的“思考摊销为反应”祖先是 **Guided Policy Search**；最适合一体在线 RL + 不完美教师的是 **Kickstarting**；正式学习技能选择与接管的是 **Option-Critic**。MCP 与最大熵组合给出同时融合两个技能的明确分布公式，但不应误称它们天然完成“慢变快”。

“不用采集数据”应准确表达为**不需要事前人工演示数据集，训练经验由仿真在线产生**；RL 仍然产生并使用大量转移样本。线上教师监督不等于预采集演示。

## 十篇核心原始研究

### 1. Bayesian Controller Fusion，IJRR 2023（arXiv 首版 2021）

Krishan Rana et al., *Bayesian Controller Fusion: Leveraging Control Priors in Deep Reinforcement Learning for Robotics*。
原文：https://arxiv.org/html/2107.09822 （v3，2023-04-03）
出版链接：https://journals.sagepub.com/doi/full/10.1177/02783649231167210

- **机制**：RL 策略与传统控制先验均输出带不确定性的动作分布，归一化乘积融合。熟悉状态更依赖 RL，未知状态更依赖保守先验。训练与部署都使用融合策略，并做零样本 sim-to-real。
- **公式**：\(\phi(a\mid s)\propto\pi_{RL}(a\mid s)\psi_{prior}(a\mid s)\)。一维 Gaussian 情况：
  \[
  \mu_\phi=\frac{\mu_\pi\sigma_\psi^2+\mu_\psi\sigma_\pi^2}{\sigma_\psi^2+\sigma_\pi^2},\quad
  \sigma_\phi^2=\frac{\sigma_\pi^2\sigma_\psi^2}{\sigma_\psi^2+\sigma_\pi^2}.
  \]
- **重要限定**：普通 SAC action-head 方差是探索分布，**不是 epistemic uncertainty**。论文另训策略 ensemble 并估计动作分布。控制先验方差用噪声传播与人工下界构造。
- **局限（原文承认）**：主要验证自由空间任务，未完成复杂接触评估；初期 ensemble 全接近零会虚假一致；先验方差过小阻断探索，过大弱化先验。以 VLM 代替可靠传统先验是新假设，VLM 的自报置信度不足以保证融合可靠。

### 2. MCP，NeurIPS 2019

Xue Bin Peng et al., *MCP: Learning Composable Hierarchical Control with Multiplicative Compositional Policies*。
原文：https://arxiv.org/html/1905.09808
会议：https://proceedings.neurips.cc/paper_files/paper/2019/hash/95192c98732387165bf8e396c0f2dad2-Abstract.html

- **机制**：多个 motor primitives 同时通过 product-of-experts (PoE) 组合，gate 学每个 primitive 的权重；可端到端 RL 优化组合分布。
- **公式**：\(\pi(a\mid s,g)=Z^{-1}\prod_i\pi_i(a\mid s,g)^{w_i(s,g)}\)，\(w_i\ge0\)，不必和为 1。Gaussian 时（此处统一用协方差矩阵记号）
  \[
  \Lambda=\sum_iw_i\Sigma_i^{-1},\quad
  \Sigma=\Lambda^{-1},\quad
  \mu=\Sigma\sum_iw_i\Sigma_i^{-1}\mu_i.
  \]
- **启发**：同一动作空间上，接近、避障、姿态保持等兼容技能可同时约束动作。VLM 与 fast policy 必须先统一坐标系、单位、时间尺度。
- **局限**：论文 primitives 预训练使用动作模仿，再冻结 primitives、训练新 gate 做 transfer；并非所需无示范慢快共同成型的直接验证。Gaussian PoE 的结果仍可能是两个冲突动作的折中，不能声称 PoE 自动避免动作平均的失效。

### 3. Composable Deep RL，ICRA 2018

Tuomas Haarnoja et al., *Composable Deep Reinforcement Learning for Robotic Manipulation*。
原文：https://arxiv.org/html/1803.06773

- **机制**：最大熵 RL 训练的技能通过 soft-Q 组合，在真实机器人上研究操纵。
- **公式**：组合奖励取平均 \(r_C=(r_1+r_2)/2\)，构造 \(Q_\Sigma=(Q_1^*+Q_2^*)/2\)，策略 \(\pi_\Sigma\propto\exp(Q_\Sigma/\alpha)\propto\sqrt{\pi_1^*\pi_2^*}\)。
- **启发**：若“靠近目标”和“避开障碍”是可组合奖励，可用分布乘积而非两个动作均值。
- **局限**：只是近似组合，最优性界依赖组件策略分歧；同动力学、匹配温度与相关任务等假设重要。VLM 不具有同一任务的准确 soft-Q 时，理论不能直接套用。

### 4. Divergence Correction，ICML 2019

Jonathan Hunt et al., *Composing Entropic Policies using Divergence Correction*。
原文：https://proceedings.mlr.press/v97/hunt19a.html
PDF：https://proceedings.mlr.press/v97/hunt19a/hunt19a.pdf

- **机制**：证明直接 Q 加权存在 compositional optimism；学习未来策略分歧的修正。
- **公式（Theorem 3.2）**：\(r_b=br_i+(1-b)r_j\)，\(Q_b^*=bQ_i^*+(1-b)Q_j^*-C_b^\infty\)。论文也给出 max-ent GPI：\(\pi(a\mid s)\propto\exp[\max_iQ^{\pi_i}(s,a)/\alpha]\)，前提是所有 Q 在**同一目标奖励下**评估。
- **启发**：两个技能各自成功不代表可同时成功；冲突需要在未来结果层面处理。
- **局限**：理论要求准确值函数、同一动力学和特定组合奖励；小样本视觉 critic 和联合变化的两策略不满足精确条件，不能把理论保证宣传到完整机器人系统。

### 5. Residual RL，ICRA 2019

Tobias Johannink et al., *Residual Reinforcement Learning for Robot Control*。
原文：https://arxiv.org/html/1812.03201

- **机制**：\(u=\pi_H(s_m)+\pi_\theta(s_m,s_o)\)，固定反馈控制器解决易建模部分，RL 学接触、摩擦等残差；有真实块装配实验。
- **启发**：VLM 产生低频 waypoint，传统局部控制器执行，快 RL 学细节，是低成本起步方法。
- **局限**：标准残差仍每次依赖基础控制器；不能自动得到脱离 VLM 的独立本能。若要撤掉慢系统，须增加在线蒸馏/独立 actor，或明确的基控制衰减机制。两个控制器相加也可能互相抵消。

### 6. Option-Critic，AAAI 2017

Pierre-Luc Bacon et al., *The Option-Critic Architecture*。
原文：https://arxiv.org/html/1609.05140
会议 PDF：https://ojs.aaai.org/index.php/AAAI/article/download/10916/10775

- **机制**：联合学习 option 内部策略、终止函数 \(\beta_m(s)\) 与 option 价值/选择，不必预先给额外子目标或示范。
- **关键梯度**：\(\nabla_\vartheta J=-\mathbb E[\nabla_\vartheta\beta_m(s)A_\Omega(s,m)]\)，\(A_\Omega=Q_\Omega-V_\Omega\)。当前技能比可选替代更差时，提高其终止概率。
- **启发**：慢/快/恢复可作为三个 option；不是每一控制步硬切，而在结束或接管条件下重新选择，适合具有不同持续时间的两系统。
- **局限**：训练可能收缩到每步终止、各 option 一样或一个 option 占据全部流量；仅最大化奖励不保证语义分工，也不保证慢快转移。

### 7. Deliberation Cost，AAAI 2018

Jean Harb et al., *When Waiting is not an Option: Learning Options with a Deliberation Cost*。
原文：https://arxiv.org/html/1709.04571

- **机制**：对终止/重新选择付计算或切换成本，改变 bounded-rationality 目标；终止梯度的 advantage 增加 \(\eta\) margin，偏好有价值的持续行为。
- **启发**：直接扣除慢调用实际延迟和推理成本，比“调用 VLA 加0.1”更忠实地表达熟练带来的效率收益。
- **局限**：高成本可造成不愿接管；必须保留失败风险或紧急条件，并测量整任务成功率。实际等待应进入 SMDP 持续时间，不应让仿真暂停思考免费。

### 8. Guided Policy Search，ICML 2013 / 2014

Sergey Levine, Vladlen Koltun，*Guided Policy Search*；*Learning Complex Neural Network Policies with Trajectory Optimization*。
原文：https://proceedings.mlr.press/v28/levine13.html
2014：https://proceedings.mlr.press/v32/levine14.pdf

- **机制**：昂贵轨迹优化产生指导，反应式神经策略学习；2014 将轨迹分布和策略交替优化、约束相互匹配。
- **启发**：和“先想明白，再变熟练”十分贴近，是规划结果向快策略摊销的重要基线。指导轨迹可以完全由仿真优化产生，不必采人类数据。
- **局限**：经典实现用局部动力学/轨迹优化，不是 VLM；若教师能访问隐状态，学生只能看图像，须防止教师依赖学生不可观测信息。它不自动提供运行时 gate。

### 9. Kickstarting Deep RL，2018

Simon Schmitt et al., *Kickstarting Deep Reinforcement Learning*。
原文：https://arxiv.org/html/1803.03835

- **机制**：在学生自己访问的状态上查询教师，将在线监督加入 RL：\(L_k=L_{RL}+\lambda_kH(\pi_T\Vert\pi_S)\)。\(\lambda_k\) 随训练变化，使学生最终能超过教师。
- **启发**：恰好连接“在线交互，不需先采演示”和“指导快速内化”。教师架构与学生不必相同，教师不必为最终上限。
- **局限**：若慢教师错误而始终强制匹配，会限制学生；需要权重退火、优势/回报筛选，且筛选 critic 也需验证。论文主要 DMLab，不是接触机器人验证。

### 10. Distral，NeurIPS 2017

Yee Whye Teh et al., *Distral: Robust Multitask Reinforcement Learning*。
原文：https://arxiv.org/html/1707.04175

- **机制**：多个任务策略与一个共享蒸馏策略共同优化：\(J=\sum_iE_{\pi_i}[\sum_t\gamma^t(r_i-c_{KL}\log(\pi_i/\pi_0)-c_{Ent}\log\pi_i)]\)。共享策略吸收在线经验，再作为先验反馈给各策略。
- **启发**：知识传输可以与 RL 同时发生，无需把教师数据采完再单独训练学生。
- **局限**：研究对象是多任务共享，并非快慢路由；KL 双向牵引可能固化次优先验，需要显式区分谁探索、谁吸收以及何时解除约束。

## 两项补充（可按篇幅加入）

**MAMBA，NeurIPS 2020**：*Policy Improvement via Imitation of Multiple Oracles*，https://proceedings.neurips.cc/paper/2020/hash/3c56fe2f24038c4d22b9eb0aca78f590-Abstract.html 。以各 oracle 状态值的最大值为基准，处理多个次优教师相互矛盾；适合“VLM、脚本、快策略都可能局部更好”的设定。需准确值估计，论文含 IL oracle 访问，不可声称纯奖励零教师。

**Daw et al. 2005 / Lee et al. 2014**：https://doi.org/10.1038/nn1560 ，https://pmc.ncbi.nlm.nih.gov/articles/PMC3968946/ 。前者以不确定性解释 model-based 与 model-free 仲裁，后者有神经与行为证据；可作为认知动机。没有转移模型/规划的 VLM 不能仅因为慢就称 model-based；两类认知标签不等于软件模块的实证对应。

## 三种融合必须区分

1. **Mixture 分布**：\(\pi=\alpha\pi_{slow}+(1-\alpha)\pi_{fast}\)。采样是先选专家，再从该专家采动作；不是平均动作。两条互斥绕障路径适合此类选择。option 的选择可以持续多步。
2. **PoE**：\(\pi\propto\pi_{slow}^{\alpha}\pi_{fast}^{1-\alpha}\)。强调两者共同支持的动作，适合兼容约束；无共同支持可能无解，Gaussian 会给出过度自信的折中。
3. **Residual**：\(a=a_{base}+\delta a_{RL}\)。适合细调，但不会自行使 student 独立。

**线上 knowledge transfer**（RL + 在线教师辅助损失）与上述任一种融合正交，是用户“快速成型”的必要路径之一。若只有混合策略，训练中门控有可能一直用慢系统，让快系统没有覆盖；不能把总成功率当作快策略学会的证据。

## 推荐给根代理的方法要点（明确是综合建议，不归属于某一论文）

- 第一版：冻结 VLM，固定语义到动作适配器；把慢与快当持续时间明确的 options。门控与 fast actor 用同一个仿真 reward 学习，critic 仅训练时可用 privileged state，部署 actor/gate 不能偷看。
- RL 目标包括真实任务回报、时间/计算成本和切换成本；失败约束独立保留。VLM 不需要也不应直接得到穿过物理仿真的反向梯度，frozen 模块画锁。
- 快 actor 用自身访问状态及融合行为的交互数据继续 RL，并可加线上、经过验证的教师 NLL/KL。教师只输出确定 waypoint 时没有现成概率密度，不能直接写 KL；应使用明确 Gaussian proposal、动作 NLL 或子目标级监督。
- 任何 imitation 系数都不应永久强迫追随不完美 VLM；可退火或优势过滤，但价值筛选噪声要审计。
- 如果基线用 PPO，不能把所有慢系统轨迹当作快策略 on-policy 轨迹直接代入快策略 PPO 比率。应对联合行为 \(p(m,a\mid b)=g(m\mid b)\pi_m(a\mid b)\) 正确记录 likelihood，或分 gate/option 更新并用真实行为 old likelihood；较容易的另一条是 off-policy critic + 明确 actor 更新。只记录执行动作还不够解释 policy likelihood。
- 两个 expert 同时快速变动会令 gate 的 target 非平稳。采用冻结 VLM、块状更新快 actor 与 gate、目标 critic、策略版本字段；先证明正确，再全联合。
- gate 塌缩应通过训练日程/最小探索概率、初始化、按阶段覆盖和收益比较处理。永久强制 50/50 load balancing 会强迫使用较差专家，不能作为最终目标。
- 表现报告必须包含：总任务成功率、fast-only 成功率、慢调用比例/延迟、达到目标成功率的仿真 steps 与 GPU-hours。主张快速成型要看学习曲线，而非只看最终成功率。

## 论文方法图该画什么

建议一张三 panel 图；绝不把参数量、全部 loss、21页讲义都挤进一张“总图”。

- **(a) Online control，约70%面积**：左边场景与观测，中央上层慢 VLM → subgoal/waypoint → adapter，中央下层 fast actor；两者进入 option router，再接同一 controller 和仿真。一个连续闭环反馈到观测。普通线代表前向，每条线有单一含义；router 在谁处计算先标清楚（先 routing 再 slow query，不能每步先运行 VLM 再判断要不要运行）。
- **(b) Joint learning，约30%面积**：仿真 reward/transition → replay/rollout → centralized critic；actor gradient 虚线去 fast actor 与 router；online teaching 虚线从 slow proposal 去 fast actor；VLM 冻结锁符号。可选 world model 单独放在此 panel，灰色虚边标 optional，避免声称已证明必须。
- **(c) 成熟过程小条带**：early/mid/late 三段显示慢调用率下降和 fast-only 成功率上升，明确为 expected hypothesis，不画伪实测曲线。或者改成训练算法三步（roll out / update / re-evaluate）不使用假结果。

最关键的科学连线：在线奖励分别如何训练 gate 和 fast policy；slow 的指导如何进入 fast 的损失；gate 如何知道“快已经学会”；训练用 privileged critic 是否在部署被移除。若这些缺失，图再漂亮也不足以评审方法。

视觉约束：白底，最多3种语义色，统一圆角/线宽；模块内不超过两行文字；顶部主图只保留必要张量符号；维度/参数量移到配套表格；不加机器人插画或阴影填充干扰。所有框/箭头/文字在 PPT 原生编辑。
