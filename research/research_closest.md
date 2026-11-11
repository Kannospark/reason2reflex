# 最接近方案的研究与新颖性核查

核查截至 2026-11-11。仅按原始论文中的方法和评估判断；“未包含”指本文所述机制中未报告，不是对所有代码分支的形式证明。尚不能声称穷尽相关研究。

## 最关键结论

用户的“慢推理探索→经验固化→快速执行”总体思路已经有相当直接的先例。**不能把快慢系统、教师蒸馏、在线 RL、世界模型、SMDP gate 的简单组合本身当作充分的新颖性。** 更有研究价值的是：动作条件的可靠反事实预测，按风险和计算成本学习何时调用教师，跨仿真实物的门控校准，以及不忘旧技能的持续 consolidation；这些还需逐项对比和实验证明。

## 接近程度与缺失要素

| 原始工作 | 与方案最接近的机制 | 在线神经 RL | 学得的多步 WAM | 学得的 SMDP gate | sim-to-real 证据 |
|---|---|---|---|---|---|
| RAX，2026-10-15 | 冻结 coding agent 探索、反思、持久记忆，再编译成自主程序 | 否，明确无参数更新 | 未包含；其 world model 是 3D 几何对象表示 | 未包含 | 仿真和实物分别评估，未见同一神经策略 sim2real 机制 |
| SAGE，2026-09-01；EMNLP 2026 | 高不确定性调用 VLM，教师动作在线蒸馏进轻量 RL policy | 是，PPO+BC | 未包含 | 否，固定 entropy threshold | 否，离散视觉/符号环境 |
| Scaling Up and Distilling Down，CoRL 2023 | LLM 引导仿真探索、验证重试，成功经验蒸馏 diffusion policy | 非在线 actor-critic | 未包含 | 未包含 | 是，domain randomization 后直接实物部署 |
| RPD，2025-03-06；IROS 2025 | VLA 指导学生 RL 探索，PPO+BC 得到更小、更强专用策略 | 是 | 未包含 | 未包含 | 论文主要 ManiSkill3，未报告实物转移实验 |
| RLDG，2024-12-13；RSS 2025 | 专用 RL experts 生成数据，反向蒸馏进 generalist | 是，专用实物 RL | 未包含 | 未包含 | 实物训练/评估，不是纯仿真转移 |
| RFST，2024-01-08 | instruction discriminator 路由快策略/慢 VLM 推理 | 未以在线探索蒸馏为核心 | 未包含 | 非 SMDP，按指令类型分类 | 仿真+实物分别验证，不能由此推出sim2real |
| SimEX，2026-09-30 | 仿真 probe-and-optimize，少量实物试验共同修正 simulator 与程序工具箱 | 非神经 RL 核心方法 | 非 learned WAM 核心方法 | 未包含 | 是，仿真程序能力经实物反馈适配 |

## RAX 应如何准确描述

[Scaling Online Exploration for Robot Agents](https://arxiv.org/html/2610.22496v1)，首稿 2026-10-15，§3.3 明确从慢 LLM tool calls 逐渐转为独立程序，经验保存在 notes 和 verified skills。它已非常直接实现“第一次慢慢理解操作，之后把经验变快”，但固化介质是代码和记忆，不是神经动作头。

它没有 VLA 蒸馏、actor-critic 更新、WAM imagination rollout 或 learned SMDP router；“online exploration”不能翻译成“online reinforcement learning”。文中的 3D world model 来自点云拟合、颜色和几何估计，不等同于动作条件的神经动力学。

评估需保留限定：HumanoidArena 主设置使用少量动作演示与可复用 motion segment，另有去动作演示消融；实物 session 记录了操作员 reset、resume 和干预。不能把概括性摘要写成所有实验均零演示、完全无人监督、纯 sim2real。

## SAGE 是 gate+教师+在线RL 的最近邻

[Selective Agent Guidance via Entropy](https://aclanthology.org/2026.findings-emnlp.1000/)，[原始 PDF](https://aclanthology.org/2026.findings-emnlp.1000.pdf)，首稿 2026-09-01。使用归一化 policy entropy 超固定阈值来调用冻结 VLM，并执行教师动作；学生动作 buffer 用 PPO，教师动作 buffer 用 BC，value 用两者的环境奖励。部署仅运行学生。它还缓存相同状态的教师建议。

这是比 RAX 更接近用户“gate 决定探索/快执行，一边探索一边训练”的算法先例。边界是离散导航/推理任务，无机械臂接触或 WAM，也无学习 option 持续时间的 SMDP。其消融支持显式 BC 的必要性，**没有稳定证据表明 advantage weighting 优于普通 BC**；不应只按摘要把 AWBC 写成已证实改进。

## 三种蒸馏方向不可混淆

[Scaling Up and Distilling Down](https://proceedings.mlr.press/v229/ha23a.html)（CoRL 2023）：LLM+采样式机器人 planner 产生带重试行为的仿真经验，成功过滤后蒸馏为 language-conditioned diffusion policy；报告 domain randomization 直接实物转移。这已经覆盖了慢规划/探索、快神经策略、恢复行为、sim2real 的大部分骨架。主要缺的是在线 actor-critic、learned gate 和 learned dynamics。

[RPD](https://arxiv.org/html/2503.05833v2)（首稿 2025-03-06，核查 v2）：VLA→小 RL expert，PPO 中加入对 teacher mean action 的 MSE 模仿项，学生可超过教师。其方法很适合不追求跨场景泛化的用户目标，但不含运行时选择“调用 VLA”的 gate。它证明直接 teacher-student refinement 值得作为强基线。

[RLDG](https://arxiv.org/abs/2412.09858)（首稿 2024-12-13）：方向相反，是专用实物 RL expert→generalist。用 HIL-SERL 类方法训练专家，再收集高质量数据微调 OpenVLA/Octo。它能支持“职业选手操作分布比普通人示范更一致”的数据观点，但不证明大模型 slow teacher 自动探索足够。

## 另外两条边界

[RFST](https://arxiv.org/html/2401.04181v2)（首稿 2024-01-08）已有快慢推理路由，但 gate 判断的是 instruction 类型，并非状态熟悉度、失败风险或计算价值；论文的认知类比不能代替控制机制定义。

[SimEX](https://arxiv.org/html/2609.38982v1)（2026-09-30）特别接近“仿真中探索、实物修正”的流程。其关键是每次物理试验校正 simulator，再用仿真筛选程序修复；是程序能力/知识迁移，不是把 online RL + WAM 端到端学出来。

## 对新颖性应采取的表述

不宜：“首次将大模型慢思考与快控制结合”“首次利用探索经验训练快策略”“首次训练模型预测未来来加快策略”“首次将 VLA 调用作为高层动作”。

可研究但尚未证实的具体命题：**在单场景长程操纵中，以经过校准的动作条件短期动力学评估 fast/slow/recovery options，并联合计入教师延迟、切换持续时间和失败风险；把成功与恢复轨迹持续蒸馏成快策略，在固定真实扰动分布上降低失败率与教师调用成本。**

强制对照至少应有：RAX/纯代码技能固化；ScalingUp 式 planner→BC；SAGE entropy gate+BC+RL；RPD teacher-guided PPO；无 gate 的始终 fast/始终 slow；有 gate 无 WAM；仅训练期 WAM；候选动作 rollout WAM。只有完整方法在等真实交互、等算力或清楚报告成本的条件下取得稳定收益，才有理由把这套组合视为有实质贡献的研究方案。
