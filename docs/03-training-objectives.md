# 训练目标、行为概率与在线数据流

记录日期：2026-11-11。

**状态：数学与算法设计记录；尚未实现、尚未训练、尚无实验结果。** 本文区分参考基线、用户原始设想和助手候选方案，不把候选目标视为已确定方法。

## 1. 统一符号与训练边界

| 符号 | 含义 |
|---|---|
| $t$ | 环境底层时间步。 |
| $k$ | 一次 chunk/option 决策边界。 |
| $h_k$ | 机器人部署时可得的观测历史、任务状态与短期记忆。 |
| $m_k$ | 模式或 option，如 FAST、SLOW；RECOVER 可选。 |
| $z_k$ | 慢系统的局部目标、语义建议或已记录上下文。 |
| $Y_k=(Y_{k,1},\ldots,Y_{k,J})$ | 原始采样动作变量，例如离散 action bins。 |
| $A_k$ | 由 $Y_k$ 解码的动作 chunk。 |
| $u_t^{exec}$ | 经过适配/约束后实际发送给底层控制器的命令。 |
| $g_\kappa$ | gate/query/option 策略。 |
| $\pi^F_\theta$ | 快策略。 |
| $\mu_{old}$ | 生成当前 rollout 的完整旧行为分布。 |
| $\hat A$ | 优势估计，不能与动作 chunk $A_k$ 混淆。 |

推荐第一版冻结 VLM 与语义适配器；更新快策略与 gate。若以后训练慢系统或适配器，必须重新包含其随机变量、概率与版本，不能沿用冻结假设下的简化。

训练 critic 可使用仿真 privileged state，但部署的 actor、gate 不得读取不可获得的仿真状态。若教师使用了 privileged state，应作为额外信息条件单独报告。

## 2. 参考 SimpleVLA-RL：可复用什么，不能默认什么

原论文与其代码在本次研究笔记中被用作参考：[论文](https://arxiv.org/abs/2509.09674)、[官方仓库](https://github.com/PRIME-RL/SimpleVLA-RL)。本次笔记检查的代码版本为 `7c51662df27b586f9e8a1ab35fcf849f2b8852f9`。

参考机制包括：

- 从任务 SFT 的 VLA 出发，再进行仿真在线 RL；不能将其结果称为零任务示范冷启动。
- 将动作标量表示为 256-bin categorical，保留并行解码与 action chunking。
- LIBERO 参考 chunk 为 8 步、单臂动作维 7，即 56 个动作 token；其他平台需遵守其真实维度。
- 对相同任务和初态采样一组轨迹；参考组大小为 8。
- 稀疏任务成功回报形成组内归一化优势；参考优化为逐 action-token 的 clipped surrogate。
- 只在有效动作位置计算损失；终止之后的填充位置必须 mask。
- rollout 与 logprob 重算必须保持温度、动作子词表和有效长度一致。

这些是基线特征，不是用户方法已达到的结果。加入慢指导、gate、成本回报后，行为分布和组过滤条件都可能改变，需要明确算法差异。

## 3. 共同目标：成功、耗时与计算资源

一个候选回报是：

$$
R=\mathbf1[\mathrm{success}]
-\lambda_T T_{\mathrm{elapsed}}
-\lambda_Q N_{\mathrm{query}}
-\lambda_{sw}N_{\mathrm{switch}}
-\lambda_F C_{\mathrm{failure}}.
$$

另一种表达是先约束风险/成功率，再最小化时间和调用成本。两者的选择尚未确定。

不建议无条件给“调用 VLA/慢系统”正奖励，例如每次 +0.1，因为这会奖励调用本身。希望策略成熟后更少思考，应计入真实成本，并检验成本是否使 gate 过早拒绝必要指导。

不同持续时间的 option 应采用 SMDP：

$$
R_k^{(n_k)}=\sum_{j=0}^{n_k-1}\gamma^j r_{t_k+j},
$$

$$
\delta_k=R_k^{(n_k)}+\gamma^{n_k}(1-d_k)V(h_{k+1})-V(h_k).
$$

等待慢推理的时间应进入 $n_k$、实际时间成本或明确的延迟模型。不能仿真暂停思考、实物继续运动，却声称相同问题已解决。若使用终局 GRPO 与局部 gate actor-critic 的混合，也应说明这已经改变基线目标。

## 4. 原始 hard gate 的联合 likelihood

设：

$$
m_k\sim g_\kappa(m\mid h_k),\qquad
A_k\sim\pi^{m_k}(A\mid h_k).
$$

当所有相关随机控制变量均有可计算的概率时：

$$
\mu_\Theta(m,A\mid h)
=g_\kappa(m\mid h)\pi^m(A\mid h),
$$

$$
\rho_k=
\frac{g_\kappa(m_k\mid h_k)}{g_{old}(m_k\mid h_k)}
\frac{\pi^{m_k}_{new}(A_k\mid h_k)}{\pi^{m_k}_{old}(A_k\mid h_k)}.
$$

慢分支固定时，其概率比可抵消，但 gate 的比率仍存在。若慢分支包含可训练的随机推理变量 $z$，联合分布还需包括 $p(z\mid h)$。

独立快动作头的梯度为：

$$
\nabla_\theta J
=\mathbb E\left[
\mathbf1[m=F]\,\hat A\,
\nabla_\theta\log\pi^F_\theta(A\mid h)
\right].
$$

因此 slow takeover 本身不会把慢动作的 actor 梯度传给独立快动作头。它可以改变后续快策略访问的状态分布，critic 也可能受益，但不能据此宣称快头已直接吸收慢动作。

自然语言 $z$ 经确定性 interpreter 变成动作时，一般不能直接写出物理动作边缘密度 $\pi_S(A)$：多个文本可能映射到同一动作。如果需要动作密度，应设计明确、可归一化的 categorical/Gaussian proposal，或对包含 $z$ 的联合随机过程建模。

## 5. RL + 在线教师辅助目标

在不采集人工任务示范的约束下，可以在在线 rollout 中加入：

$$
L_{total}=L_{RL}
+\lambda_{teach}(s)
\mathbb E\left[
w(h,a_S)
\left(-\log\pi^F_\theta(a_S\mid h)\right)
\right].
$$

这里 $s$ 表示训练进度，$w$ 可以是回报筛选、优势权重或人工定义的可信度规则，但必须验证误筛选。对一个只有确定 waypoint 的教师，NLL 或动作回归可以有明确含义；没有密度的教师不能直接被写成现成的 KL 分布。

学生自己采样的数据可以用于相应 RL 更新；教师生成的数据用于明确的辅助损失，或者采用具有正确行为归属的混合/off-policy 目标。**不能从教师采样动作，再把快策略自己的 old logprob 伪装成行为概率。**

这条路线为在线知识转移，包含非 RL 辅助目标。它与“无需人工任务数据”相容，与“所有训练目标仅由 RL 构成”不相容。

## 6. strict RL guided PoE 候选

### 6.1 慢先验的构造

冻结 VLM 在被查询时输出 $z_k$。固定适配器按统一动作尺度产生 prior：

$$
p^S_j(b\mid h_k,z_k)
=(1-\epsilon)p_{bin,j}(b;\mu^S_j,\sigma_j)
+\epsilon/B,
\quad B=256,\quad\epsilon>0.
$$

$p_{bin}$ 必须明确归一化。离散化 Gaussian 可以按 bin 区间积分，再处理边界质量；也可以使用归一化 logits。$\epsilon$ 防止先验将某动作永久排除。$\sigma$ 是设计或校准参数，不等于 VLM 的自报置信度。

### 6.2 受引导的动作分布

$$
q_{\theta,j}(b\mid h,z,m)
=\frac{
\exp(\ell^F_{\theta,j}(b\mid h)/T)
\,p^S_j(b\mid h,z)^{\alpha_m}
}{
\sum_{b'}\exp(\ell^F_{\theta,j}(b'\mid h)/T)
\,p^S_j(b'\mid h,z)^{\alpha_m}
},
$$

$$
\alpha_0=0,\qquad\alpha_1>0.
$$

最终动作始终从 $q_\theta$ 采样。无指导模式退化为快 logits 的温度分布。它不是 $\pi_F$ 与慢动作的均值，也不是先随机选老师/学生再直接执行所选独立动作。

对应梯度为：

$$
\frac{\partial\log q_{\theta,j}(Y_j)}
{\partial\ell^F_{\theta,j}(b)}
=\frac1T\left[\mathbf1(Y_j=b)-q_{\theta,j}(b)\right].
$$

所以有指导模式仍可用奖励优势更新快 logits，不必加入 CE/BC。**该事实仅说明梯度存在，不能证明撤掉先验后一定成功。**

### 6.3 Gate 与完整行为分布

设 gate 只使用廉价可得输入 $(h,c)$，其中 $c$ 可含调用预算和缓存年龄。先采样 mode，再在需要时生成慢建议。因此完整联合分布应把 $z$ 也写入随机变量：

$$
\mu_{\theta,\kappa}(m,z,Y\mid h,c)
=g_\kappa(m\mid h,c)
p_S(z\mid h,c,m)
\prod_{j\in\mathcal V}q_{\theta,j}(Y_j\mid h,z,m).
$$

$p_S$ 是教师/缓存提供建议的生成核，与动作先验 $p^S_j$ 区分；无缓存依赖时可简写为 $p_S(z\mid h,m)$。快模式令 $p_S(z\mid h,c,m=0)=\delta_{\varnothing}(z)$，即 $z$ 为空的点质量；查询模式使用相应教师生成核。$\mathcal V$ 为有效采样位置。若实际策略存在自回归依赖，应把每项写为对先前 token 的条件概率；上式的独立并行形式只适用于相应实现。

完整旧行为 log likelihood 在概率/密度存在时为：

$$
\log\mu_{old}
=\log g_{old}(m\mid h,c)
+\log p_{S,old}(z\mid h,c,m)
+\sum_{j\in\mathcal V}\log q_{{old},j}(Y_j\mid h,z,m).
$$

若教师/缓存生成核冻结，且 new/old 比率使用相同的 $(h,c,m,z)$，其生成项在联合 ratio 中抵消。确定性教师对应点质量；无须虚构一个连续密度。实现可记录可训练因子的旧 log likelihood（gate 加 action 项）用于此时的 ratio，但必须明确它不是省略生成过程后的完整 $\log\mu_{old}$。冻结教师的数值 logprob 在抵消时不必求出。

冻结但随机的教师仍需保存本次实际生成的 $z$；重算时不能换一个建议。如果教师生成分布也被训练，则需包含 $p_{S,new}(z\mid h,c,m)/p_{S,old}(z\mid h,c,m)$。缓存读写、陈旧度和调用选择同样需可重现，不能把 mode 生成之后的 $z$ 当作 mode 决策之前已知的条件。

### 6.4 不要混淆 ratio 的粒度

在上述教师/缓存生成核冻结、且条件与本次建议保持一致的条件下，一个 chunk 的联合 ratio 是：

$$
\rho_k^{joint}
=\exp\left[
\Delta\log g_k+
\sum_{j\in\mathcal V_k}\Delta\log q_{k,j}
\right].
$$

一个动作 token 的 ratio 是：

$$
\rho_{k,j}^{token}
=\exp(\log q_{new,k,j}-\log q_{old,k,j}).
$$

对整个 chunk 的 joint ratio 做 clipping，与对每个 token ratio 单独 clipping 后求和，不是同一个优化目标。高维 product ratio 也可能具有更大方差。

若保留 SimpleVLA-RL 式 token surrogate，再单独为每个 chunk 的 gate 决策计算一次 surrogate，应明确这是 factor-wise 设计，而非声称 exact joint clipping。gate 只做了一次随机选择，不能把同一个 $\log g$ 加进全部动作 token，导致 gate 梯度被 chunk 长度隐式重复放大。

## 7. GRPO 的优势与零信号问题

对同一初态组中的 $G$ 条轨迹：

$$
\hat A_i=
\frac{R_i-\bar R}{\mathrm{Std}(R_1,\ldots,R_G)+\varepsilon}.
$$

代表性的 token clipped surrogate 可写成：

$$
L_{actor}=-\mathbb E_{i,k,j}
\left[
\min\left(
\rho_{i,k,j}\hat A_i,
\operatorname{clip}(\rho_{i,k,j},1-\epsilon_l,1+\epsilon_u)\hat A_i
\right)
\right],
$$

实际实现还须定义有效长度归一化和 gate 损失权重。此式只说明 token 目标结构，不代表已选择最终代码实现。

纯 0/1 成功回报时，如果同组全部失败或全部成功，优势都可能为零。若单次成功率为 $p$，且采样条件允许独立近似，得到混合结果的概率为：

$$
P(\mathrm{mixed})=1-p^G-(1-p)^G.
$$

当 $p=0$ 时，动态采样无法制造首次成功。慢指导若让一部分探索真正成功，才可能为冷启动创造信号。反过来，慢系统救回所有轨迹，纯二元目标又可能失去差异，并掩盖快策略弱点。

如果总回报包含调用或时间成本，即使全成功也可能有回报差异。这时不能照搬按 success accuracy 丢弃“全成功组”的过滤，应按实际目标的回报变化或约束设计处理。

可能的冷启动扩展包括自动课程、从可达中间状态重置、经证明或明确声明的 shaping、更好的 grounding。但它们提供额外任务结构，必须单独计量，不能藏在“纯稀疏奖励”名义下。

## 8. 边缘 mixture：仅在条件满足时使用

若两个技能都有可计算的同一动作空间密度：

$$
\mu(A\mid h)=g_F(h)\pi_F(A\mid h)+g_S(h)\pi_S(A\mid h).
$$

快策略对边缘 log likelihood 的梯度含 responsibility：

$$
\nabla_\theta\log\mu(A\mid h)
=w_F(A,h)\nabla_\theta\log\pi_F(A\mid h),
$$

$$
w_F=
\frac{g_F\pi_F(A\mid h)}
{g_F\pi_F(A\mid h)+g_S\pi_S(A\mid h)}.
$$

因此慢分支采到的动作也可能通过边缘 likelihood 给快策略奖励梯度；但若快策略对其概率极低，$w_F$ 近零，转移仍可能缓慢。

**重要条件：**给定物理动作后，mode 不应继续直接改变回报或转移；否则把 mode 完全边缘化会漏掉调用成本、等待时间或控制周期的信息。真实慢快系统往往不满足该条件，应保留 joint $(m,A)$ 或采用严格推导的分解目标。它是候选研究支线，不是无条件替代 hard gate 的答案。

## 9. 最小 rollout 记录与重算契约

| 字段 | 必要原因 |
|---|---|
| task、init-state、seed、扰动种子 | 构建相同初态组、重现实验、控制环境分布。 |
| policy/gate/teacher/adapter 版本 | 联合训练中避免行为来源不明和陈旧概率。 |
| 原始观测或可重算特征、历史状态 | 还原 gate 与 actor 实际输入；隐藏状态需有明确复原方式。 |
| mode、mode logprob、模式 mask | 学习 gate，并记录哪些选项实际可用。 |
| query/缓存命中、建议内容、时间戳、age、validity | 还原本次教师上下文，避免重算时换 prior。 |
| prior 或其足够重建参数 | 保证 new/old logprob 对应同一建议。 |
| 原始采样动作 token、action mask、old logprob | 维护真实行为 likelihood；终止和 padding 不得误算。 |
| 温度、指导强度、动作子词表与归一化配置 | 这些都会改变行为分布与概率。 |
| 解码动作、约束过滤输出、实际发送命令 | 区分采样随机变量、执行变换与真实环境后果。 |
| chunk 执行长度、等待时间、图像年龄 | 处理不同持续时间、提前终止和真实延迟。 |
| 成功、失败、阶段、恢复、人工接管、总回报分量 | 支持可靠性与成本分析，防止只统计最终成功。 |

采样时与重算时的 mask 不一致，或以新生成建议替换原缓存，均会改变概率对象。确定性裁剪、饱和或安全过滤可能使执行动作分布非一一映射；策略梯度应基于保存的原始采样变量，不得假装实际发送命令就是原始样本。

## 10. 一轮在线训练的候选流程

1. 冻结本轮行为版本、先验构造配置、gate 和动作采样配置。
2. 按任务与初态组并行采样；gate 在 chunk 边界先决策是否查询。
3. 必要时获得慢建议，构造明确的 action prior；按照选定的 hard gate、在线转移或 guided PoE 机制采样。
4. 通过统一接口执行，记录原始随机变量、实际命令、持续时间、奖励与终止。
5. 只根据真实仿真反馈计算任务回报和成本；世界模型可暂不参与。
6. 用与真实行为一致的 likelihood 更新 RL 目标；若选在线知识转移，单独记录其辅助损失与权重。
7. 在固定且隔离的评估初态上进行 hybrid 与清缓存 fast-only 评估。
8. 保存模型与配置版本，进入下一轮。新的策略不能用旧版本的虚构 logprob 继续冒充 on-policy 数据。

“同时训练”不等于所有模块每次优化器步一起更新。分块更新、目标 critic 或周期冻结是可比较的稳定化手段。

## 11. 可选 WAM 目标与梯度边界

若加入动作条件动力学：

$$
L_{WM}=
\sum_j\alpha_j\left[
\mathrm{NLL}(\mathrm{sg}(b_{t+j}),\hat b_{t+j})
+\lambda_r(\hat r-r)^2
+\lambda_f\mathrm{BCE}(\hat p_{fail},f)
+\lambda_x\|\hat x-x\|^2
\right].
$$

这里 $f$ 为失败事件标签，与用于 bootstrap 的终止指示 $d$ 区分：成功终止可以有 $d=1,f=0$。具体失败事件及预测时间窗必须在数据契约中定义。

这是辅助预测训练，不意味着动作策略也使用模仿损失。需要分别说明“actor 仅 RL”与“全系统不存在任何辅助目标”的区别。

若动作路径可微，例如连续确定性策略或可重参数化的连续随机动作，用想象回报优化策略时可以写：

$$
\hat b_{j+1}=f_\omega(\hat b_j,\hat u_j),\qquad
\hat u_j=\pi_\theta(\hat b_j,g),
$$

$$
\frac{d\hat b_{j+1}}{d\theta}
=f_b\frac{d\hat b_j}{d\theta}
+f_u\frac{d\hat u_j}{d\theta}.
$$

冻结 $\omega$ 时仍可保留 $f_b,f_u$；detach 整个输出则没有这条梯度。上述路径导数不能直接穿过 SimpleVLA-RL / guided PoE 的离散 categorical 采样。对这类 actor，可使用基于预测回报的 score-function/策略梯度，或显式引入可微松弛、连续代理等另行说明的估计器；松弛或 straight-through 带来的偏差和原训练目标的差异必须披露，不可把它当作原 categorical 策略的精确 BPTT。

模型接触预测、候选排序和局部 Jacobian 的有效性，需要先于“预测奖励更高所以动作更好”的结论验证。

如果使用 learned reward 或世界模型想象数据，必须与真实仿真 reward 区分，并单独报告模型偏差、使用比例和校准。完整方法尚未决定采用此分支。
