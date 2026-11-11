import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {Presentation, PresentationFile} from '@oai/artifact-tool';

const ROOT='/data/dual_system_online_rl_20261111';
const OUT=path.join(ROOT,'output');
const BUILD=path.join(ROOT,'.build');
const S='/home/kannolinux/.codex/plugins/cache/openai-primary-runtime/presentations/26.1110.11613/skills/presentations';
const C={ink:'#253541',grey:'#66747E',light:'#DDE3E7',teal:'#167C80',tealFill:'#EDF7F6',orange:'#B87832',orangeFill:'#FCF4E9',grad:'#92517F',white:'#FFFFFF',faint:'#F5F7F8'};
const P=Presentation.create({slideSize:{width:1600,height:1000}});
const sources={base:'https://arxiv.org/abs/2509.09674',bcf:'https://arxiv.org/abs/2107.09822',mcp:'https://arxiv.org/abs/1905.09808',kick:'https://arxiv.org/abs/1803.03835',exit:'https://arxiv.org/abs/1705.08439',distral:'https://arxiv.org/abs/1707.04175',sage:'https://aclanthology.org/2026.findings-emnlp.1000/',rpd:'https://arxiv.org/abs/2503.05833',opt:'https://arxiv.org/abs/1609.05140',res:'https://arxiv.org/abs/1812.03201',gps:'https://proceedings.mlr.press/v28/levine13.html',comp:'https://arxiv.org/abs/1803.06773'};
function t(s,txt,x,y,w,h,size=26,{color=C.ink,bold=false,align='left',math=false,italic=false}={}){const a=s.shapes.add({geometry:'textbox',name:txt.slice(0,45),position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});a.text=txt;a.text.style={typeface:math?'Liberation Serif':'Liberation Sans',fontSize:size,color,bold,italic,alignment:align,verticalAlignment:'middle',insets:0,autoFit:'none'};return a;}
function rect(s,x,y,w,h,{stroke=C.ink,fill=C.white,r=4,lw=1.6,name='module'}={}){return s.shapes.add({geometry:r?'roundRect':'rect',name,position:{left:x,top:y,width:w,height:h},fill,line:{fill:stroke,width:lw},...(r?{borderRadius:r}:{})});}
function node(s,txt,x,y,w,h,{color=C.ink,fill=C.white,size=26,math=false}={}){const b=rect(s,x,y,w,h,{stroke:color,fill});t(s,txt,x+10,y+8,w-20,h-16,size,{align:'center',math});return b;}
function seg(s,points,{color=C.ink,width=1.8,dash=false,arrow=true,name='data flow'}={}){for(let i=0;i<points.length-1;i++){const a=points[i],b=points[i+1];const last=i===points.length-2;const x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]);const dx=Math.abs(b[0]-a[0]),dy=Math.abs(b[1]-a[1]);const dirPositive=dx>0?b[0]>=a[0]:b[1]>=a[1];s.shapes.add({geometry:'connector',name,kind:'straight',position:{left:x,top:y,width:dx,height:dy},line:{fill:color,width,style:dash?'dashed':'solid'},...(last&&arrow?{[dirPositive?'tail':'head']:{type:'triangle',width:'med',length:'med'}}:{})});}}
function rule(s,y){seg(s,[[40,y],[1560,y]],{color:C.light,width:1,arrow:false});}
function panel(s,letter,title,x,y,w=1450){t(s,`(${letter})`,x,y,50,40,29,{bold:true});t(s,title,x+58,y,w-58,40,29,{bold:true});}
function stack(s,txt,x,y,w,h,color=C.teal,fill=C.tealFill){rect(s,x+10,y-10,w,h,{stroke:color,fill,lw:1});rect(s,x+5,y-5,w,h,{stroke:color,fill,lw:1});return node(s,txt,x,y,w,h,{color,fill,size:25});}
function tensor(s,x,y,rows,cols,color=C.teal,cw=13,ch=13){for(let i=0;i<rows;i++)for(let j=0;j<cols;j++)rect(s,x+j*(cw+3),y+i*(ch+3),cw,ch,{stroke:color,fill:i%2?C.white:(color===C.orange?C.orangeFill:C.tealFill),r:0,lw:.7});}
function label(s,txt,x,y,w=280,size=22,color=C.grey){t(s,txt,x,y,w,32,size,{color});}
function notes(s,text,keys=[]){s.speakerNotes.text=text+'\n\n原始研究：\n'+keys.map(k=>`${k}: ${sources[k]}`).join('\n');}

// FIGURE 1: functional architecture and gradients, one continuous composition.
{
 const s=P.slides.add();s.background.fill=C.white;
 panel(s,'a','Guided and unguided control',40,18);
 node(s,'Observation\nhistory hₜ',60,250,175,100,{size:25});
 node(s,'Query gate\ngκ(m | h,c)',70,82,180,84,{color:C.teal,fill:C.tealFill,size:25});
 
 seg(s,[[147,250],[147,166]]);
 seg(s,[[235,300],[300,300],[300,195],[430,195]]);
 seg(s,[[300,300],[300,371],[430,371]]);
 rect(s,430,76,480,152,{stroke:C.orange,fill:C.white,lw:1.3,r:8});
 t(s,'Slow semantic guidance',453,84,350,33,27,{color:C.orange,bold:true});
 stack(s,'VLM',460,133,160,63,C.orange,C.orangeFill);
 label(s,'frozen',487,199,120,20,C.orange);
 node(s,'Metric action\nadapter',710,133,170,63,{color:C.orange,fill:C.orangeFill,size:24});
 seg(s,[[630,164],[710,164]],{color:C.orange});
 label(s,'waypoint',632,128,95,19,C.orange);
 seg(s,[[250,124],[350,124],[350,146],[430,146]],{color:C.grey,dash:true});
 label(s,'query if m = 1',257,84,175,21,C.grey);
 seg(s,[[350,146],[350,256],[1175,256],[1175,286]],{color:C.grey,dash:true});
 label(s,'m = 0: α = 0',500,260,350,21,C.grey);
 rect(s,430,290,480,154,{stroke:C.teal,fill:C.white,lw:1.3,r:8});
 t(s,'Fast actor (trainable θ)',453,300,430,33,27,{color:C.teal,bold:true});
 stack(s,'VLA / policy\nbackbone',462,351,177,68,C.teal,C.tealFill);
 node(s,'Logits ℓθ\n(factorized)',710,351,170,68,{color:C.teal,fill:C.tealFill,size:25});
 seg(s,[[649,385],[710,385]],{color:C.teal});
 
 seg(s,[[880,164],[980,164]],{color:C.orange});
 tensor(s,985,120,4,5,C.orange,16,15);
 label(s,'Prior pˢ',982,190,155,25,C.orange);label(s,'H dₐ × B',982,220,150,20,C.grey);
 seg(s,[[1080,164],[1220,164],[1220,286]],{color:C.orange});
 label(s,'α log pˢ',1130,178,150,25,C.orange);
 node(s,'Normalize\n+ sample qθ',1130,286,180,96,{size:26});
 seg(s,[[880,385],[1050,385],[1050,334],[1130,334]],{color:C.teal});
 label(s,'ℓθ / T',952,395,140,25,C.teal);
 seg(s,[[1310,334],[1365,334]]);
 tensor(s,1375,302,3,7,C.ink,16,15);
 label(s,'Action chunk Aₜ',1350,369,215,24,C.ink);
 label(s,'H × dₐ tokens',1376,401,180,21,C.grey);
 node(s,'Parallel\nsimulators',1340,455,200,86,{size:26});
 seg(s,[[1442,426],[1442,455]]);
 seg(s,[[1340,498],[1030,498],[147,498],[147,350]]);
 label(s,'next observation',380,505,270,22,C.grey);
 rule(s,570);
 panel(s,'b','Joint online optimization',40,590);
 node(s,'Rollout batch\nh,c,m,Y,pˢ,r, log μold\nT, α, masks, length',1170,695,380,112,{size:24});
 seg(s,[[1442,541],[1442,695]]);
 label(s,'r, transition, cost',1250,650,295,22,C.grey);
 node(s,'Grouped returns\nRLOO / GRPO Â',780,695,300,112,{size:25});
 seg(s,[[1170,751],[1080,751]]);
 node(s,'Joint RL objective\nJ(θ, κ)',450,695,240,112,{color:C.grad,fill:'#FBF5F9',size:26});
 seg(s,[[780,751],[690,751]]);
 node(s,'Re-score batch\nlog μnew from gκ, qθ',75,695,285,112,{size:24});
 seg(s,[[360,751],[450,751]]);
 seg(s,[[570,695],[570,635],[665,635],[665,444]],{color:C.grad,dash:true,width:2.2});
 label(s,'∇θ J',670,599,85,24,C.grad);
 seg(s,[[450,780],[400,780],[400,870],[35,870],[35,124],[70,124]],{color:C.grad,dash:true,width:2.2});
 label(s,'∇κ J',70,880,110,24,C.grad);seg(s,[[1360,807],[1360,825],[217,825],[217,807]],{color:C.grey,width:1.5});
 t(s,'μθ,κ(m, Y | h, c) = gκ(m | h, c) ∏ⱼ qθ,j(Yⱼ | h, pˢ, m)',265,835,1250,62,31,{math:true,align:'center'});
 label(s,'c: cache age / query budget',60,929,360,21,C.grey);
 seg(s,[[500,947],[555,947]],{color:C.ink});label(s,'forward',570,931,130,21,C.grey);
 seg(s,[[760,947],[815,947]],{color:C.grey,dash:true});label(s,'query control',830,931,170,21,C.grey);
 seg(s,[[1090,947],[1145,947]],{color:C.grad,dash:true});label(s,'RL gradient',1160,931,180,21,C.grey);
 notes(s,'图1：新的纯RL融合研究提案，尚无实验结果。两个模式并非两个独立动作头：快actor在两模式都生成logits；m=1时冻结VLM产生metric动作建议，经固定adapter构造动作prior；m=0不调用VLM且α=0。最终token始终从归一化的q采样。由此guided数据也能给快actor奖励梯度，但这不证明去指导后的能力已经内化。actor只读部署可得的观测历史，不读教师cache或mode；cache与age可供router和prior使用。训练需要存实际g与q的old logprob。虚线灰表示调用/权重控制，实线表示前向数据，紫色虚线为策略梯度。模块内小格子表示张量，不是实验数据。H与动作维度服从任务接口，例如LIBERO H8×7，RoboTwin不可默认7维。冻结VLM接收同一观测历史的渲染上下文。Environment wrapper可以含固定解码、限幅与底层控制，RL动作概率对应投影前采样token。core采用grouped outcome advantages而非GAE，不含value critic；若改用GAE才需要补训练critic。buffer存c、pS、T、α、合法动作与paddingmask、有效长度；冻结VLM仍可能随机，必须固定复用该次prior。目标还接收重算的当前g和q的logprob。图中c为廉价cache age与查询budget。没有人工示范buffer，没有CE/BC辅助loss是本图core的定义；预训练权重的数据先验需要另行披露。',['base','bcf','mcp','kick']);
}

// FIGURE 2: mathematical detail, precise behavior likelihood and maturation check.
{
 const s=P.slides.add();s.background.fill=C.white;
 panel(s,'a','Compatible action priors and actor logits',40,20);
 node(s,'Frozen VLM\nmetric proposal μˢ',55,125,260,106,{color:C.orange,fill:C.orangeFill,size:27});
 node(s,'Fixed discretization\n+ support floor',400,125,280,106,{color:C.orange,fill:C.orangeFill,size:27});
 seg(s,[[315,178],[400,178]],{color:C.orange});
 node(s,'Action prior\npˢⱼ(b) > 0',765,125,220,106,{color:C.orange,fill:C.orangeFill,size:27});
 seg(s,[[680,178],[765,178]],{color:C.orange});
 node(s,'Factorized logits\nℓθ(h)',55,285,260,100,{color:C.teal,fill:C.tealFill,size:27});
 node(s,'Logit addition\nℓθ,j / T + αₘ log pˢⱼ',400,285,585,100,{size:30,math:true});
 seg(s,[[315,335],[400,335]],{color:C.teal});
 seg(s,[[875,231],[875,285]],{color:C.orange});
 node(s,'Softmax over\nB = 256 bins',1100,185,440,120,{size:29});
 seg(s,[[985,335],[1050,335],[1050,245],[1100,245]]);
 t(s,'pˢⱼ(b) = (1 − ε) pbin,j(b; μˢⱼ, σⱼ) + ε / B',55,420,1450,54,31,{math:true,align:'center'});
 t(s,'α₀ = 0 (unguided),  α₁ > 0 (guided). The prior is a designed proposal, not VLM confidence.',55,486,1490,42,25,{color:C.grey,align:'center'});
 rule(s,555);
 panel(s,'b','Correct probability object',40,576,950);
 t(s,'log μ = log gκ(m | h, c) + Σⱼ log qθ,j(Yⱼ | h, pˢ, m)',65,650,950,55,31,{math:true});
 t(s,'ρ = exp(log μnew − log μold)',65,728,950,55,34,{math:true});
 t(s,'∂ log qθ,j(Yⱼ) / ∂ℓθ,j(b) = [1(Yⱼ = b) − qθ,j(b)] / T',65,815,950,60,29,{math:true});
 t(s,'Store the sampled tokens and the normalized behavior probabilities.',65,915,950,35,24,{color:C.grey});
 seg(s,[[1050,585],[1050,955]],{color:C.light,arrow:false,width:1});
 panel(s,'c','Guidance-free evaluation',1100,576,455);
 node(s,'Remove all guidance\nα = 0, no cached teacher input',1100,660,440,105,{color:C.teal,fill:C.tealFill,size:25});
 seg(s,[[1320,765],[1320,810]],{color:C.teal});
 t(s,'Measure fast-only success\nand time to the target success rate',1100,817,440,76,26,{align:'center'});
 t(s,'Hybrid success alone is insufficient.',1100,920,440,34,23,{color:C.grey,align:'center'});
 notes(s,'图2：本提案的可计算动作先验与似然。pbin可取每维离散高斯/有界原语分布，σ不是VLM自报置信度。保证ε>0，使用合法动作token子词表的logsumexp；连续回归/flow不能直接照搬这个closed-form categorical目标。图中∏j为基线实际token因子分解，若依赖prefix应在q的条件中加入prefix。本图主线为factorized categorical head。sampling与re-scoring应用同一action mask并在softmax前处理，padding与finish mask一致。μ的定义精确，直接chunk product-ratio clipping是对SimpleVLA token-wise算法的修改且可能高方差。实现可拆每chunk一次gate surrogate与token conditional surrogate并声明近似，切勿把gate项重复到每个action token。纯RL梯度存在并不保证知识固化，强先验饱和和group零优势会使学习停滞。采用旧行为快照、同初态group、实际mode和cached prior。无偏推导可使用leave-one-out基线；GRPO的方差归一化与clipping不能称无偏。模式产生不同真实延迟时保留joint mode，不可只用marginal动作概率乘含mode成本的return。',['base','bcf','mcp']);
}

// FIGURE 3: four fusion mechanisms, each an explicit computation graph.
{
 const s=P.slides.add();s.background.fill=C.white;
 panel(s,'a','Option selection',40,25,710);
 node(s,'Slow policy πˢ',70,130,225,70,{color:C.orange,fill:C.orangeFill,size:27});
 node(s,'Fast policy πᶠ',70,255,225,70,{color:C.teal,fill:C.tealFill,size:27});
 node(s,'Select m\n(gate)',405,174,190,105,{size:28});
 seg(s,[[295,165],[355,165],[355,206],[405,206]],{color:C.orange});
 seg(s,[[295,290],[355,290],[355,248],[405,248]],{color:C.teal});
 seg(s,[[595,226],[710,226]]);
 label(s,'a ~ πᵐ',635,177,140,27,C.ink);
 t(s,'μ(m,a) = g(m) πᵐ(a)',70,370,670,50,32,{math:true});
 t(s,'Routing determines control authority',70,438,650,65,26,{color:C.grey});
 panel(s,'b','Multiplicative distribution fusion',845,25,710);
 node(s,'Prior pˢ',870,130,210,70,{color:C.orange,fill:C.orangeFill,size:27});
 node(s,'Fast policy πᶠ',870,255,210,70,{color:C.teal,fill:C.tealFill,size:27});
 node(s,'Product\n+ normalize',1180,174,235,105,{size:28});
 seg(s,[[1080,165],[1125,165],[1125,206],[1180,206]],{color:C.orange});
 seg(s,[[1080,290],[1125,290],[1125,248],[1180,248]],{color:C.teal});
 seg(s,[[1415,226],[1530,226]]);
 t(s,'q(a) ∝ πᶠ(a) pˢ(a)ᵅ',870,370,670,50,32,{math:true});
 t(s,'Shared action support; sensitivity to conflicting priors',870,438,660,65,26,{color:C.grey});
 rule(s,535);
 seg(s,[[800,60],[800,945]],{color:C.light,arrow:false,width:1});
 panel(s,'c','Residual action control',40,575,710);
 node(s,'Base control uˢ',70,690,225,70,{color:C.orange,fill:C.orangeFill,size:27});
 node(s,'RL residual δuθ',70,815,225,70,{color:C.teal,fill:C.tealFill,size:27});
 node(s,'Add\nactions',405,734,190,105,{size:28});
 seg(s,[[295,725],[355,725],[355,766],[405,766]],{color:C.orange});
 seg(s,[[295,850],[355,850],[355,808],[405,808]],{color:C.teal});
 seg(s,[[595,786],[710,786]]);
 label(s,'u = uˢ + δuθ',570,870,210,28,C.ink);
 t(s,'Local correction; continued dependence on base control',70,925,650,60,25,{color:C.grey});
 panel(s,'d','Online knowledge transfer',845,575,710);
 node(s,'Teacher distribution',870,690,265,70,{color:C.orange,fill:C.orangeFill,size:26});
 node(s,'Fast actor + RL',1180,690,340,70,{color:C.teal,fill:C.tealFill,size:27});
 seg(s,[[1002,760],[1002,855],[1020,855]],{color:C.orange});
 node(s,'Online teacher loss\n+ environment RL loss',1020,815,500,80,{color:C.grad,fill:'#FBF5F9',size:27});
 seg(s,[[1330,760],[1330,815]],{color:C.teal});seg(s,[[1520,855],[1550,855],[1550,725],[1520,725]],{color:C.grad,dash:true});
 t(s,'RL + online teacher loss; no manual demonstrations',870,925,670,60,25,{color:C.grey});
 notes(s,'图3：融合位置与知识内化的区别。这里πF=softmax(ℓ/T)，温度与图2一致。a选项：Option-Critic/PEX提供选择结构，若slow冻结且独立替代actor，快动作头在slow分支无直接on-policy梯度。b乘积分布：BCF/MCP/Composable RL，需统一动作接口、归一化与支持集；高斯PoE仍会产生冲突折中，不自动保证安全。本提案使用b且两种mode都含快logits，和a不同。c残差：Residual RL，适合接触修正但持续依赖基础控制器。d在线知识转移：Kickstarting、RPD、SAGE，不需事先采人工示范，但有明确非RL辅助loss。四种机制可以结合，不能把任何一种融合单独当成快策略已学会的证据。',['opt','bcf','mcp','comp','res','kick','rpd','sage']);
}

await fs.mkdir(OUT,{recursive:true});
const draft=path.join(BUILD,'draft.pptx');
await (await PresentationFile.exportPptx(P)).save(draft);
for(let i=0;i<P.slides.items.length;i++){
 const png=await P.export({slide:P.slides.items[i],format:'png',scale:2});
 await fs.writeFile(path.join(OUT,`figure_${i+1}.png`),new Uint8Array(await png.arrayBuffer()));
 console.log(`rendered figure ${i+1}`);
}
process.env.RUNTIME_NODE_MODULES='/home/kannolinux/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {finalizePresentation}=await import(pathToFileURL(path.join(S,'container_tools/artifact_tool_utils.mjs')).href);
const result=await finalizePresentation({workspaceDir:ROOT,candidatePath:draft,finalPath:path.join(OUT,'dual_system_online_rl_paper_figures.pptx'),pythonExecutable:'/home/kannolinux/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',integrityValidatorPath:path.join(S,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(S,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','15240000,9525000','--validate-heading-fit'],fontPolicy:{basis:'design',families:['Liberation Sans','Liberation Serif']},verifyArtifactToolImport:true,receiptPath:path.join(BUILD,'validation-paper.json')});
console.log(JSON.stringify({path:result.finalPath,integrity:result.packageIntegrity.status,layoutFindings:result.presentationLayout.findingCount}));
