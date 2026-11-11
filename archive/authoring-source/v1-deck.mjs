import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Presentation, PresentationFile} from '@oai/artifact-tool';

const ROOT='/data/slow_fast_research_20261111';
const OUT=path.join(ROOT,'output');
const BUILD=path.join(ROOT,'.build');
const SKILL='/home/kannolinux/.codex/plugins/cache/openai-primary-runtime/presentations/26.1110.11613/skills/presentations';
const PY='/home/kannolinux/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3';
const FONT='Noto Sans CJK SC';
const C={ink:'#142D38',muted:'#506875',teal:'#007D83',orange:'#B65F1A',purple:'#6455A4',red:'#AE3C43',line:'#9BAEB6',pale:'#EAF5F4',lav:'#F0EDF8',warm:'#FCF0E5',bg:'#FFFFFF',light:'#F4F7F8'};
const P=Presentation.create({slideSize:{width:1600,height:900}});
const refs={show:['Show-Harness (2026)','https://arxiv.org/abs/2609.10522'],super:['SuperMimic (2026)','https://arxiv.org/abs/2610.28480'],gr:['GR00T N1 (2025)','https://arxiv.org/abs/2503.14734'],pi:['π₀ (2024 / RSS 2025)','https://arxiv.org/abs/2410.24164'],act:['ACT / ALOHA (2023)','https://arxiv.org/abs/2304.13705'],dp:['Diffusion Policy (2023)','https://arxiv.org/abs/2303.04137'],smol:['SmolVLA (2025)','https://arxiv.org/abs/2506.01844'],self:['SelfWAM (2026)','https://arxiv.org/abs/2608.00725'],fast:['Fast-WAM (2026)','https://arxiv.org/abs/2603.16666'],hilo:['HiLo-WAM (2026)','https://arxiv.org/abs/2611.05023'],aha:['AHA-WAM (2026)','https://arxiv.org/abs/2606.09811'],pets:['PETS (2018)','https://arxiv.org/abs/1805.12114'],mbpo:['MBPO (2019)','https://arxiv.org/abs/1906.08253'],td:['TD-MPC2 (2023 / ICLR 2024)','https://arxiv.org/abs/2310.16828'],hil:['HIL-SERL (2024)','https://arxiv.org/abs/2410.21845'],opt:['Options (1999)','https://doi.org/10.1016/S0004-3702(99)00052-1'],oc:['Option-Critic (2016 / AAAI 2017)','https://arxiv.org/abs/1609.05140'],say:['SayCan (2022)','https://arxiv.org/abs/2204.01691'],know:['KnowNo (2023)','https://arxiv.org/abs/2307.01928'],dag:['DAgger (2011)','https://arxiv.org/abs/1011.0686'],dist:['Policy Distillation (2015)','https://arxiv.org/abs/1511.06295'],sim:['SimOpt (2018 / ICRA 2019)','https://arxiv.org/abs/1810.05687'],rma:['RMA (2021)','https://arxiv.org/abs/2107.04034'],cbf:['CBF-QP (2016 / TAC 2017)','https://arxiv.org/abs/1609.06408'],dojo:['RoboDojo (2026)','https://arxiv.org/abs/2607.04434']};
Object.assign(refs,{scaling:['Scaling Up and Distilling Down (CoRL 2023)','https://proceedings.mlr.press/v229/ha23a.html'],sage:['SAGE (Findings of EMNLP 2026)','https://aclanthology.org/2026.findings-emnlp.1000/'],rax:['RAX / Scaling Online Exploration (2026)','https://arxiv.org/abs/2610.22496'],rpd:['RPD (2025)','https://arxiv.org/abs/2503.05833'],nist:['NIST: Exact Binomial Confidence Limits','https://itl.nist.gov/div898/software/dataplot/refman2/auxillar/exacbino.htm']});
function text(s,txt,x,y,w,h,size=26,color=C.ink,bold=false){const a=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=txt;a.text.style={fontSize:size,typeface:FONT,color,bold,verticalAlignment:'top',autoFit:'none',insets:0};return a;}
function slide(title,sub='',keys=[],extra=''){const s=P.slides.add();s.background.fill=C.bg;text(s,title,70,45,1450,64,43,C.ink,true);if(sub)text(s,sub,70,120,1460,64,24,C.muted);text(s,String(P.slides.items.length).padStart(2,'0'),1460,850,60,24,17,C.muted);text(s,'固定场景持续学习控制 · 研究设计草案 · 2026-11-11',70,850,1260,24,17,C.muted);s.speakerNotes.text=extra+'\n\n原始来源：\n'+keys.map(k=>refs[k]?.join(': ')).join('\n');return s;}
function box(s,title,body,x,y,w,h,color=C.teal,fill=C.pale,size=24){const a=s.shapes.add({geometry:'rect',name:title,position:{left:x,top:y,width:w,height:h},fill,line:{fill:color,width:1.6}});a.text=[{runs:[{run:title,style:{bold:true,fontSize:`${size+2}px`}}],spaceAfter:8},{runs:[{run:body,style:{fontSize:`${size}px`}}]}];a.text.style={fontSize:size,typeface:FONT,color:C.ink,verticalAlignment:'middle',alignment:'center',insets:12,autoFit:'none'};return a;}
function conn(s,a,b,{color=C.ink,dash=false,from='right',to='left',kind='straight'}={}){return s.shapes.connect(a,b,{fromSide:from,toSide:to,kind,line:{fill:color,width:2,style:dash?'dashed':'solid'},tail:{type:'triangle',width:'med',length:'med'}});}
function line(s,x,y,w,color=C.line){s.shapes.add({geometry:'line',position:{left:x,top:y,width:w,height:0},fill:'none',line:{fill:color,width:1}});}
function rows(s,items,x,y,w,step=120){items.forEach(([lead,body],i)=>{text(s,lead,x,y+i*step,w,36,28,C.teal,true);text(s,body,x,y+i*step+45,w,step-49,25,C.ink);});}
function table(s,values,widths,x=70,y=205,h=560,size=24){const t=s.tables.add({rows:values.length,columns:values[0].length,left:x,top:y,width:widths.reduce((a,b)=>a+b,0),height:h,columnWidths:widths,values});t.borders.assign({fill:'#CAD5DA',width:1,style:'solid'});for(let r=0;r<values.length;r++){for(let c=0;c<values[0].length;c++){const cell=t.getCell(r,c);cell.fill=r===0?C.ink:(r%2?C.bg:C.light);cell.text.style={fontSize:size,typeface:FONT,color:r===0?'#FFFFFF':C.ink,bold:r===0,verticalAlignment:'middle',insets:12};}}return t;}

// 01. Research scope and falsifiable objective.
{
 const s=slide('固定场景中的慢探索与快执行','目标：把探索所得经验沉淀为可复用技能，并在仿真与实物上检验可靠性',['hil','super','dojo']);
 text(s,'可行的研究方向',70,235,800,80,60,C.teal,true);
 text(s,'已有工作支持各个组成机制。\n整套组合的收益与可靠性仍需实验验证。',70,345,930,145,33);
 text(s,'参考对象',1110,245,400,45,28,C.orange,true);
 text(s,'单臂 7 DoF + 夹爪\n固定 RGB-D / 腕部 RGB\npick-and-place 起步\n扩展到 RoboDojo 长程任务',1110,305,390,230,27);
 line(s,70,600,1450);
 rows(s,[['100% 的三种含义','有限测试全部成功、总体成功率置信下界、限定假设下的形式保证，必须分别报告。']],70,635,1410,150);
}
// 02. Evidence map.
{
 const s=slide('相关研究支持什么','论文中的任务、测试分布和硬件不同，以下证据不能直接拼成实物成功率保证',['show','super','gr','self','fast','hil','dojo']);
 table(s,[['机制','代表性原始工作','可迁移的启发 / 证据边界'],['语义动作接口','Show-Harness','VLM 选语义原语，interpreter 转成机器人运动'],['快慢模块','GR00T N1 / π₀','动作网络可输出连续 chunk，但不等于熟悉度 gate'],['可微动力学训练','SuperMimic','交替拟合模型与优化策略，主任务是人形运动跟踪'],['动作条件未来','SelfWAM / PETS','候选动作必须进入 forward model，才能比较后果'],['部署时省去视频生成','Fast-WAM','未来预测可仅作训练辅助，收益需要单独消融'],['固定任务高可靠','HIL-SERL','部分任务 100/100，仍属于有限测试证据']],[285,360,805],70,210,550,24);
 text(s,'研究假设：经过校准的路由 + 失败恢复，可在相同成功率下减少慢模型调用，或在相同时间内提高整任务成功率。',70,790,1430,42,23,C.teal,true);
}
// 03. Complete schematic.
{
 const s=slide('系统总图：持久经验与闭环执行','实线表示在线信息流，紫色虚线表示经验与训练更新。所有数值均为建议起点',['show','gr','pets','dag','dist']);
 const obs=box(s,'观测与同步','RGB / 深度\n关节 / 末端 / 力觉\n时间戳与观测年龄',70,295,250,160);
 const enc=box(s,'状态估计','共享视觉编码 + GRU\n信念 bₜ ∈ R²⁵⁶',375,295,260,160);
 const slow=box(s,'慢探索 / 规划','冻结 VLM，约 7B\n事件触发 / 后台规划\n子目标与动作候选',690,200,280,150,C.orange,C.warm);
 const fast=box(s,'快技能策略','约 21–22M，含感知\n16 × 7 动作 chunk',690,405,280,150);
 const gate=box(s,'风险与价值路由','先估值，按需调用慢模型\nFAST / SLOW / RECOVER',1030,295,480,160,C.purple,C.lav);
 const model=box(s,'动作条件预测器','5 个 latent dynamics 模型\n评估快 / 慢已生成候选',690,620,350,145,C.purple,C.lav);
 const control=box(s,'约束过滤与机器人执行','统一 7D 末端命令\n伺服 / 失败监测 / 恢复',1110,620,400,145);
 const mem=box(s,'持久经验与任务状态','replay / 技能版本 / 子目标图\n训练后发布，任务中保持权重固定',70,620,565,145,C.purple,C.lav);
 conn(s,obs,enc);conn(s,enc,slow,{kind:'elbow'});conn(s,enc,fast,{kind:'elbow'});conn(s,slow,gate,{kind:'elbow'});conn(s,fast,gate,{kind:'elbow'});conn(s,gate,control,{from:'bottom',to:'top',kind:'elbow'});conn(s,fast,model,{from:'bottom',to:'top',kind:'elbow',color:C.purple});conn(s,model,gate,{from:'right',to:'bottom',kind:'elbow',color:C.purple});
 conn(s,mem,fast,{from:'top',to:'left',kind:'elbow',color:C.purple,dash:true});conn(s,mem,model,{color:C.purple,dash:true});s.shapes.add({geometry:'line',position:{left:1310,top:765,width:0,height:19},line:{fill:C.purple,width:2,style:'dashed'}});s.shapes.add({geometry:'line',position:{left:350,top:784,width:960,height:0},line:{fill:C.purple,width:2,style:'dashed'}});s.shapes.add({geometry:'connector',kind:'straight',position:{left:350,top:765,width:0,height:19},line:{fill:C.purple,width:2,style:'dashed'},head:{type:'triangle'}});
 for(const p of [{left:1080,top:692,width:30,height:0},{left:1080,top:575,width:0,height:117},{left:195,top:575,width:885,height:0}])s.shapes.add({geometry:'line',position:p,line:{fill:C.ink,width:1.4}});s.shapes.add({geometry:'connector',kind:'straight',position:{left:195,top:455,width:0,height:120},line:{fill:C.ink,width:1.4},head:{type:'triangle'}});text(s,'观测反馈',78,525,105,35,21,C.muted);
 text(s,'执行后重新观测；慢规划等待期间使用经过验证的安全备用控制。候选动作与执行动作同时记录。',70,798,1430,34,23,C.muted);
 s.speakerNotes.append('\n先用轻量gate的Q值估计是否值得调用slow，无需预先运行VLM；仅在触发时产生slow候选并用模型/约束检查。slow rollout指已生成子目标后的局部控制器，不是每个imagined state重新调用需要RGB的VLM。固定RGB-D深度用于已知物体几何估计、metric grounding与真实约束检查，快速RGB编码器可不直接使用深度。\n控制路径：传感器→belief→候选快/慢/恢复option→风险与价值排序→统一末端接口→过滤器→机器人→传感器。慢路径也向模型提供候选（为避免总图拥挤，该支线详见预测器页）。训练虚线是离线或后台更新，不在每个执行周期修改部署权重。执行反馈以最新观测和任务验证器重新进入状态估计。');
}
// 04. Common action semantics.
{
 const s=slide('统一动作接口','action trunk 是网络实现，末端位移是输出表示，二者可以同时采用',['pi','show','dp']);
 const a=box(s,'慢路径','VLM 子目标 / 语义原语\n几何规划器或 CEM',70,230,400,170,C.orange,C.warm);
 const b=box(s,'快路径','视觉与状态历史\nflow / ACT action expert',70,470,400,170);
 const u=box(s,'相同的动作语义','Aₜ ∈ R¹⁶×⁷\nuₜ = [Δpᴮ(3), Δθᴮ(3), g(1)]',570,340,510,185);
 const c=box(s,'同一执行链','限幅 / 碰撞检查\nIK + 阻抗或位置控制',1180,340,330,185);
 conn(s,a,u,{kind:'elbow'});conn(s,b,u,{kind:'elbow'});conn(s,u,c);
 text(s,'pʳᵉᶠ = p + Δpᴮ         Rʳᵉᶠ = Exp([Δθᴮ]×) R         g = 归一化夹爪绝对开度',70,690,1450,50,31,C.ink,true);
 text(s,'每步 20 ms。明确基座坐标系、米 / 弧度、缩放和夹爪约定。预测 16 步，只执行前 2–4 步再观测。接触阶段缩短执行窗口。',70,770,1450,65,24,C.muted);
 s.speakerNotes.append('\n建议平移每步初始上限 2–5 mm，旋转 1–2°，需要根据机械臂速度和任务验证，不是安全认证值。若复用预训练VLA关节输出，必须按原始动作语义执行或经显式适配器转换，不能把关节标签直接当末端位移。精密插入采用力/阻抗原语，策略仅提供目标与模式。');
}
// 05. Encoder and action policy.
{
 const s=slide('快策略的前向计算','专用小模型首先负责熟练执行，大模型不进入每一个伺服周期',['act','dp','smol']);
 const im=box(s,'2 × RGB 224²','共享 ResNet-18\n每相机 512 维',70,240,290,150);
 const pp=box(s,'本体 pₜ ∈ R³⁶','q₇, q̇₇, TCP₆, g₁\nwrench₆, uₜ₋₁, age₂',70,465,290,160);
 const fu=box(s,'特征融合','相机各投影 256\n本体 MLP 128\n640 → 512 → 256',425,320,300,220);
 const gr=box(s,'时间状态','GRU 256 → 256\nbₜ = GRU(bₜ₋₁, eₜ)',790,320,300,220);
 const ac=box(s,'Flow action expert','8 层，d = 256\n8 heads，FF = 1024\n16 × 7，4–8 积分步',1155,320,355,220);
 conn(s,im,fu,{kind:'elbow'});conn(s,pp,fu,{kind:'elbow'});conn(s,fu,gr);conn(s,gr,ac);
 text(s,'条件输入：bₜ + 当前子目标 embedding（128 维）。相机约 30 Hz，特征 10–20 Hz 缓存，本体与 GRU 50 Hz。',70,700,1450,50,26);
 text(s,'以上频率是需实测的目标。缓存必须带时间戳；50 Hz 的本体更新不会创造新的视觉信息。GRU 隐状态属于单次运行记忆。',70,770,1450,65,24,C.muted);
}
// 06. Dynamics and counterfactual.
{
 const s=slide('预测“调用快策略”的结果','把 option 展开为闭环动作，再预测转移；mode 标签本身不能代表完整物理后果',['self','pets','mbpo','td']);
 const z=box(s,'当前信念 bₜ','同一初始状态\n同一任务阶段',70,250,260,150);
 const pi=box(s,'候选 option πₘ','快技能 / 慢规划 / 恢复\n按预测状态重新出动作',400,250,450,150);
 const sh=box(s,'候选动作约束','ûⱼ = S(πₘ(b̂ⱼ), x̂ⱼ)\n预测物理头辅助检查',920,250,590,150);
 const wm=box(s,'5 个动作条件模型','b̂ⱼ₊₁, r̂ⱼ, p̂fail, x̂ⱼ₊₁ = fω(b̂ⱼ, ûⱼ)\n滚动 8–16 步，保留模型分歧',400,510,700,170,C.purple,C.lav);
 const val=box(s,'保守价值评估','均值回报 − β × 分歧\n风险不合格即回退',1170,510,340,170,C.purple,C.lav);
 conn(s,z,pi);conn(s,pi,sh);conn(s,sh,wm,{from:'bottom',to:'top',kind:'elbow'});conn(s,wm,pi,{from:'top',to:'bottom',color:C.purple,dash:true});conn(s,wm,val);
 text(s,'慢路径同样提供候选序列。模型训练使用实际施加的过滤后命令，保留原始提案用于诊断。接触切换或高分歧时缩短 rollout。',70,747,1450,75,26);
 s.speakerNotes.append('\n局部rollout在子目标切换时终止并使用终局value。慢候选需要先被事件触发生成；触发之前使用SMDP critic估计其价值，不为每次路由预先执行全部大模型。slow内部预测的是固定子目标下的局部规划/控制器，不从预测latent重建RGB来反复调用VLM。dt作为模型输入。\n若快策略需要视觉条件，latent rollout必须为策略提供同分布的belief，不能假装仅预测一个物体pose就足以闭环。采用b的预测+物理状态辅助头，held-out检验预测belief与真实belief的动作一致性。预测过滤器使用预测物理状态，因此仍有误差；真实部署过滤器读取实时测量，二者偏差需要记录与校准。Ensemble分歧不是概率保证。');
}
// 07. Gate.
{
 const s=slide('Gate：带持续时间的 option 价值学习','首先用小 MLP 和明确规则，只有消融证明必要时再换 Transformer',['opt','oc','say','know']);
 const inp=box(s,'输入约 400 维','b₂₅₆ + goal₁₂₈\n风险 / 分歧 / 延迟\n当前模式与停留时间',70,250,380,260,C.purple,C.lav);
 const q=box(s,'双 Q 网络','400 → 128 → 128 → 3\n输出各 option 的回报价值\n另校准失败风险',530,250,430,260,C.purple,C.lav);
 const route=box(s,'部署路由','风险合格集合内选保守价值最高者\nFAST / SLOW / RECOVER\n安全触发可立即打断',1040,250,470,260,C.purple,C.lav);
 conn(s,inp,q);conn(s,q,route);
 text(s,'y = Rₜ⁽ⁿ⁾ + γⁿ (1 − d) maxₘ Q̄(bₜ₊ₙ, m)      Lgate = Huber(Q(bₜ,m), stopgrad(y))',70,590,1460,65,30,C.ink,true);
 text(s,'n 包含思考等待所经历的底层时间步。训练：同一仿真状态分叉运行多个 option，跨随机参数重复，学习回报及风险。',70,690,1450,62,26);
 text(s,'0.2 s 最小停留 + 价值差阈值可抑制抖动。阈值须在独立校准集设定；安全打断不受停留约束。',70,780,1450,42,24,C.muted);
 s.speakerNotes.append('\nQ已包含时间与计算成本时，选择阶段不得重复扣同一成本。不同option比较需包括慢模型真实延迟和等待期间环境演化。用γ^n而不是统一γ进行SMDP bootstrap。成功轨迹中的mode不是最优gate标签，因为存在选择偏差。策略/模型变化后需要重评gate，buffer保存版本。');
}
// 08. Reward.
{
 const s=slide('奖励与约束的计算','鼓励实际任务成功和更短的完成时间，不对“用了 VLA”直接加分',['opt','say']);
 text(s,'rₜ = 1[终局成功] − λf 1[失败] − λt Δt − λe ‖uₜ‖²',70,235,1460,66,34,C.ink,true);
 text(s,'        − λj ‖uₜ − uₜ₋₁‖² + η [γ Φ(sₜ₊₁) − Φ(sₜ)]',70,320,1460,66,34,C.ink,true);
 rows(s,[['Option 回报','Rₜ⁽ⁿ⁾ = Σⱼ₌₀ⁿ⁻¹ γʲ rₜ₊ⱼ − λc × 实测计算成本。等待也经过真实时间。'],['硬约束单独处理','工作空间、速度、关节限位、碰撞边界、接触力限制。不可行时执行已验证的备用控制。'],['探索与部署分开','训练可加信息增益 / 覆盖度奖励。部署时关闭内在探索奖励，避免为获得信息承担无谓风险。'] ],70,440,1440,113);
 text(s,'“每调用一次 +0.1”会改变原目标，并可能鼓励反复调用或延长轨迹。若只想偏好速度，应直接计入实测时间与计算成本。',70,790,1450,45,23,C.red,true);
 s.speakerNotes.append('\n势函数塑形需要使用与任务一致的折扣、终止边界和终局势值（例如终局置0），才保留原最优策略的经典条件。初期无需追求一套通用λ，先按词典序约束安全与成功，再在合格候选里比时间。稀疏成功由独立几何/力觉/图像验证器确认，不能仅用VLM自评作为唯一真值。');
}
// 09. Gradients.
{
 const s=slide('反向训练：三个不同的优化问题','经验收集可以在线，部署权重采用冻结版本。先交替训练，再考虑耦合端到端梯度',['super','dag','mbpo','dist']);
 table(s,[['训练对象','损失 / 更新','梯度边界'],['快策略 θ','Aτ = (1−τ)ε + τA*\nLFM = E ‖vθ(Aτ,τ,b,g) − (A*−ε)‖²','成功与纠错数据蒸馏\n冻结慢 VLM；不穿过离散 gate'],['世界模型 ω','多步 latent NLL + reward MSE\n+ failure BCE + 物理状态监督','目标 encoder 用 stopgrad / EMA\nbootstrap 数据训练 ensemble'],['Gate κ','SMDP 双 Q 的 Huber TD loss\n同起点 paired rollouts 提供标签','离散 argmax 不用普通反传\n经验带 option 与策略版本'],['可选模型策略优化','最大化短 imagined return\n∂bⱼ₊₁/∂θ = fᵦ ∂bⱼ/∂θ + fᵤ ∂uⱼ/∂θ','固定 ω，保留 f 对输入的 Jacobian\n先验证接触区预测与梯度可靠性']],[265,625,560],70,215,550,24);
 text(s,'最低风险起点：规划器 / 示教探索 → 环境打分 → DAgger 式收集纠错 → 快策略模仿。RL 先用于 gate 和低维残差。',70,792,1450,42,23,C.teal,true);
 s.speakerNotes.append('\nLWM = Σj αj[NLL(sg(Etarget(o_{t+j})); fω rolled j steps) + λr(rhat−r)² + λdBCE(phat,d) + λx||xhat−x||²]。固定/EMA视觉目标并监督物理量以缓解表示塌缩。SuperMimic式BPTT：模型参数固定并不等于detach模型输出；后者会切断actor动作到未来奖励的梯度。初版不必给冻结大VLM反传。残差RL作为后续消融，不是必须环节。');
}
// 10. Module sizes.
{
 const s=slide('可起步的模块规模与结构','以下是本设计的工程估算，不是已有论文配置，也不是针对未指定硬件的最优解',['smol','act','pets']);
 table(s,[['模块','具体结构','约参数量 / 更新方式'],['慢 VLM','3–8B 比较，先用 7B\n结构化子目标输出，冻结或后期 LoRA','7B，事件触发 / 后台规划'],['快感知与记忆','共享 ResNet-18（去分类头）+ 两路 512→256\n本体 36→128→128，融合 640→512→256\nGRU input=hidden=256','12.3M，含 GRU 约 0.395M'],['快动作 expert','8 层 d256，8 heads，FF1024\n每层 self-attn + cross-attn，H=16','约 9M，4–8 flow steps'],['动作条件预测','5 × MLP 264→512→512→515\n均值 / 对数方差 / reward / 失败等 + 物理头','基础约 3.3M，总计约 4M'],['Gate 与价值头','双 MLP 400→128→128→3\n失败风险与终局 value 辅助头','约 0.2M'],['长期任务记忆','子目标 DAG + 对象状态 + 成功验证\n轨迹库与 checkpoint 持久存储','首版用结构化状态，不需训练大网络']],[270,800,380],70,200,615,22);
 s.speakerNotes.append('\n快路径总计约21–22M，轻量WM+gate后约26M，不含冻结7B。参数量需最终实现时由代码准确统计。MLP264输入为belief256+动作7+dt1，515输出为256均值+256 logvar+reward/failure/termination三项；额外物理头和embedding使总量约4M。推理频率需目标GPU测p50/p95/p99，不由参数量推出。');
}
// 11. Long-horizon execution.
{
 const s=slide('长程任务：进度记忆与局部控制分工','以 RoboDojo 的 Organize Table / Fill Pen Holder 类任务为参照，不假定共享同一硬件',['dojo','hilo','aha','say']);
 const task=box(s,'任务状态图','对象位置 / 已完成集合\n先决条件与剩余子目标',70,240,380,170,C.orange,C.warm);
 const skill=box(s,'单个技能 option','抓取 / 搬运 / 放置\n局部闭环控制',550,240,400,170);
 const verify=box(s,'后置条件验证','抓牢？目标区内？稳定？\n允许多帧与力觉确认',1050,240,460,170);
 conn(s,task,skill);conn(s,skill,verify);conn(s,verify,task,{from:'bottom',to:'bottom',kind:'elbow',color:C.orange});
 text(s,'验证通过才推进任务图；失败时更新对象状态，恢复后重新规划。不可逆失败和超时仍计入整任务分母。',70,490,1450,70,29);
 text(s,'100 个阶段：0.99¹⁰⁰ ≈ 36.6%',70,610,1450,65,44,C.red,true);
 text(s,'这是每一步条件成功率均为 99% 的说明性计算。要让 100 阶段整体达到 99%，每阶段需约 99.99%，或依靠有效恢复。',70,700,1450,70,26);
 text(s,'GRU 负责短时动力学线索；显式任务记忆负责多分钟进度。持久经验保存在轨迹库与权重中，不能只依赖窗口上下文。',70,790,1450,45,23,C.muted);
}
// 12. Persistent learning loop.
{
 const s=slide('训练与持续学习闭环','在线产生经验，后台更新模型，独立验证后再替换部署版本',['dag','dist','sim','hil']);
 const a=box(s,'① 初始校准','相机 / TCP / 延迟\n可恢复状态与成功判据',70,245,420,145,C.orange,C.warm);
 const b=box(s,'② 探索与示教','慢 VLM 提议 + 规划器\n环境评分，记录全部结果',590,245,420,145,C.orange,C.warm);
 const c=box(s,'③ 经验池','成功 / 失败 / 干预\n真实与仿真分开标记',1110,245,400,145,C.purple,C.lav);
 const d=box(s,'⑥ 发布新版本','冻结部署参数\n保留回滚与旧技能回放',70,520,420,145);
 const e=box(s,'⑤ 独立校准验证','未用于更新的初始状态\n风险 / 延迟 / 成功回归',590,520,420,145,C.purple,C.lav);
 const f=box(s,'④ 交替更新','WM 拟合、技能蒸馏\npaired rollouts 训练 gate',1110,520,400,145,C.purple,C.lav);
 conn(s,a,b);conn(s,b,c);conn(s,c,f,{from:'bottom',to:'top'});conn(s,f,e,{from:'left',to:'right'});conn(s,e,d,{from:'left',to:'right'});conn(s,d,b,{from:'top',to:'bottom',kind:'elbow',dash:true,color:C.teal});
 text(s,'Replay 字段：观测历史、动作提案、实际命令、奖励、终止 / 接触、任务阶段、模型 / 策略版本、仿真参数与时间戳。',70,735,1450,65,26);
 s.speakerNotes.append('\n建议先收集50–100条成功示范/规划轨迹与同量纠错片段作为启动预算假设，训练资源允许时扩充。不能从这个数推断收敛或成功率。回放混合近期、旧技能及失败边界，真实数据加权且单独做holdout。更新可每若干episode，而不是每个servo tick。若选择严格zero-shot sim-to-real，真实轨迹只能用于评估或预先声明允许的系统辨识，不能一面微调一面仍称纯zero-shot。');
}
// 13. Sim2real and constraints.
{
 const s=slide('仿真到实物：几何重建之后仍需闭环辨识','固定场景减少语义变化，摩擦、接触、标定、时延和观测噪声仍然变化',['sim','rma','cbf','pets']);
 rows(s,[['Real → Sim','用真实轨迹辨识质量 / 摩擦 / 夹爪柔顺性 / 执行器响应与延迟；随机化范围围绕测量不确定度设置。'],['Sim → Policy','随机化初始位姿、相机外参、曝光、观测丢帧、动作延迟与接触参数；按阶段训练失败恢复。'],['Policy → Real','统一命令语义和控制器，先低速验证；实际转移残差高于校准范围时回退并收集纠错数据。']],70,220,1450,150);
 text(s,'u* = argminᵤ ‖u − uₙₒₘ‖²',70,705,650,65,34,C.teal,true);
 text(s,'s.t. 工作空间 / 速度 / 关节约束与可验证的安全条件',720,710,790,58,27);
 text(s,'CBF / 过滤器在正确模型、状态估计与可行性等假设下讨论安全不变性。安全不变性本身不保证最终完成任务。',70,790,1450,45,23,C.red);
}
// 14. Validation and statistics.
{
 const s=slide('成功率声明与测试协议','冻结策略与初始状态分布后进行独立评估。调参、校准和最终测试互不复用',['hil','dojo','super','nist']);
 table(s,[['零失败的独立试验数 n','95% 单侧成功率下界 pL','可支持的解释'],['100','97.05%','100/100 是观测结果'],['299','约 99.00%','在同分布、独立、固定策略条件下'],['2,995','约 99.90%','仍然无法证明物理系统绝对零失败'],['29,956','约 99.99%','成本高，需专门设计可靠性实验']],[450,430,570],70,215,400,26);
 text(s,'pL = α¹⁄ⁿ，α = 0.05',70,665,1450,58,36,C.teal,true);
 text(s,'同时报告：整任务成功率、首次成功率、限定重试预算内成功率、覆盖率 / 拒绝率、恢复率、碰撞 / 超力、p95 延迟与任务耗时。',70,750,1450,73,26);
 s.speakerNotes.append('\n这是零失败、固定n的Clopper–Pearson单侧下界推导：P(全部成功|p)=p^n，令p^n=α。相邻轨迹共用状态、测试期间持续改权重、看分数后提前停止，均不能直接套独立固定n公式。拒绝/人工重置不能从主成功率分母删除。对长程任务报告完整任务成功，与benchmark progress score分开。');
}
// 15. Experiments.
{
 const s=slide('能证伪架构收益的消融实验','所有比较固定训练数据、真实交互预算、硬件、风险阈值和整任务时间上限',['act','dp','fast','self','mbpo']);
 table(s,[['比较','要回答的问题','主指标'],['脚本闭环 / ACT / Diffusion Policy','固定任务是否已能由简单控制完成？','整任务成功率与时间'],['始终慢 / 始终快 / 规则 gate / 学习 gate','学习路由是否比阈值规则多带来收益？','成功率匹配时的慢调用率'],['无预测 / 训练期预测 / 部署期预测 / 两者','WAM 的收益来自表征还是在线规划？','完成率、p95时延、动作排序正确率'],['开环 chunk / 短执行窗 / 闭环 option rollout','模型是否真正预测重规划后的轨迹？','长程完整成功率、扰动恢复率'],['无记忆 / GRU / 显式任务图','长程错误是否来自任务阶段遗忘？','重复执行与遗漏阶段数'],['无真实适配 / 系统辨识 / 少量真实微调','sim-to-real 的瓶颈在何处？','真实成功率与真实数据预算']],[560,545,345],70,215,590,23);
 s.speakerNotes.append('\n至少3–5个训练随机种子为预算建议；相同初始状态进行配对评估，并按日期/初始布局分组计算区间。另做模型动作干预测试：零动作、反向、不同幅度、错误夹爪时机。衡量任务状态/接触预测与回报排序，不能只看视频PSNR。最终使用n次零失败公式时要满足独立试验条件。');
}
// 16. Critical appraisal and research claim.
{
 const s=slide('收益、代价与可发表的研究问题','“慢系统 + 快系统”已有大量先例，论文贡献需要落在可测量的新机制上',['gr','super','self','hil']);
 rows(s,[['最有价值的部分','固定场景便于反复覆盖、自动评分和蒸馏。快策略减少反复语义推理，恢复机制降低长程失败积累。'],['主要代价','多个模块同时变化会令价值估计失稳；模型可能虚构高奖励；路由误判可能使复杂系统弱于专用闭环控制。'],['优先验证的贡献','在已声明的单场景分布与交互预算下，风险校准的 option 路由能否改善“完整成功率—耗时—慢调用率”的 Pareto 曲线？'],['实施顺序','闭环基线与判据 → 技能蒸馏和恢复 → 规则 gate → 小型动作条件模型 → 学习 gate → 可选 BPTT / 大型 WAM。']],70,220,1450,145);
 s.speakerNotes.append('\n研究定位属于系统与算法的经验贡献，除非另行证明，不声称100%保证。即使不要求跨场景泛化，单场景内的初始状态和扰动仍然构成测试分布。更大的模型并非必要条件；计算预算、阶段可观测性和控制接口可能更关键。');
}
// Closest prior art.
{
 const s=slide('与已有完整系统的差异','新颖性不能仅来自把慢模型、快模型、gate 和世界模型放在同一张图上',['scaling','sage','rax','rpd']);
 table(s,[['最近邻','已经覆盖的机制','本方案仍需证明的部分'],['ScalingUp，CoRL 2023','LLM 引导仿真探索与重试\n成功经验蒸馏 diffusion policy，sim2real','经过校准的动作条件模型\n与风险 / 时间成本路由'],['SAGE，Findings of EMNLP 2026','高 entropy 查询冻结 VLM\n教师 BC + 学生 PPO，最终运行学生','机械臂接触与实物验证\n学习不同持续时间的 option gate'],['RAX，2026','慢探索与反思\n经验固化为持久记忆与自主程序','神经快策略与多步动力学\n不是其主要学习介质'],['RPD，2025','VLA 教师指导 RL\n训练更小的专用学生策略','运行时 option 选择与\n仿真实物间风险校准']],[400,550,500],70,220,500,25);
 text(s,'可检验贡献：在相同真实交互与时间预算下，降低完整任务失败率与慢模型调用成本，并报告独立测试置信界。',70,770,1450,64,27,C.teal,true);
}
// References, links are editable hyperlinks and notes.
const groups=[['原始来源：动作接口与快速技能',['show','pi','gr','smol','act','dp','super','hil']],['原始来源：预测与长程任务',['self','fast','hilo','aha','pets','mbpo','td','dojo']],['原始来源：路由、持续学习与迁移',['opt','oc','say','know','dag','dist','sim','rma','cbf']],['原始来源：近邻系统与统计',['scaling','sage','rax','rpd','nist']]];
for(const [title,keys] of groups){const s=slide(title,'点击条目打开论文。方法建议与文献结论已在对应页面及备注中区分',keys);keys.forEach((k,i)=>{const y=205+i*65;const a=text(s,refs[k][0],70,y,530,40,25,C.teal,true);a.hyperlink={uri:refs[k][1],isExternal:true};text(s,refs[k][1],625,y,885,40,23,C.muted);});}

await fs.mkdir(OUT,{recursive:true});
const candidate=path.join(BUILD,'draft.pptx');
await (await PresentationFile.exportPptx(P)).save(candidate);
for(let i=0;i<P.slides.items.length;i++){
  const s=P.slides.items[i];
  const png=await P.export({slide:s,format:'png',scale:i===2?2:1});
  await fs.writeFile(path.join(BUILD,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
  console.log(`rendered ${i+1}`);
}
await fs.copyFile(path.join(BUILD,'slide-03.png'),path.join(OUT,'system_architecture.png'));
await fs.copyFile(path.join(BUILD,'slide-09.png'),path.join(OUT,'training_and_gradients.png'));
process.env.RUNTIME_NODE_MODULES='/home/kannolinux/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {finalizePresentation}=await import(pathToFileURL(path.join(SKILL,'container_tools/artifact_tool_utils.mjs')).href);
const finalPath=path.join(OUT,'slow_fast_robot_research_final.pptx');
const result=await finalizePresentation({workspaceDir:ROOT,candidatePath:candidate,finalPath,pythonExecutable:PY,integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','15240000,8572500','--validate-bullet-geometry','--validate-heading-fit',...[2,9,10,14,15,17].flatMap(n=>['--require-native-table-slide',String(n)])],requiredNativeTableOwnerSlides:[2,9,10,14,15,17],fontPolicy:{basis:'design',families:[FONT]},verifyArtifactToolImport:true,receiptPath:path.join(BUILD,'validation.json')});
console.log(JSON.stringify({finalPath,slides:P.slides.items.length,result}));
