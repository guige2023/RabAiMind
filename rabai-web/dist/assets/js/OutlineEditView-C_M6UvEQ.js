const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/js/client-DgoMUySq.js","assets/js/vendor-other-DWYnheva.js"])))=>i.map(i=>d[i]);
import{a as N,_ as A}from"./index-DNhteNqg.js";import{d as E,q as L,e as p,g as t,t as d,G as g,B as U,D as B,H as D,m as j,b as _,r as $,o as m,F as G,j as R,l as z,x as f,y as C,k as v,K as F}from"./vendor-other-DWYnheva.js";import{u as J,b as H}from"./vendor-vue-CC9sBoYg.js";const K={class:"outline-edit-page"},W={class:"outline-header"},Z={class:"header-actions"},Q=["disabled"],X={class:"outline-preview"},Y={class:"outline-summary"},tt={class:"summary-item"},nt={class:"summary-item"},et={class:"summary-item"},ot={class:"slides-container"},lt=["onClick"],it={class:"slide-number"},st={class:"slide-content"},at={class:"slide-header"},ct=["onUpdate:modelValue"],ut=["onClick"],dt={class:"slide-body"},rt=["onUpdate:modelValue"],yt={class:"slide-footer"},pt=["onUpdate:modelValue"],mt={class:"word-count"},vt={key:0,class:"loading-overlay"},gt=E({__name:"OutlineEditView",setup(_t){const h=J(),b=H(),u=_(0),r=_(!1),y=_(!1),l=$({slides:[],style:"professional",theme:"blue"}),e=()=>Math.random().toString(36).substr(2,9),S=o=>({professional:"专业商务",simple:"简约现代",energetic:"活力创意",premium:"高端奢华",tech:"科技感",creative:"创意艺术"})[o]||o,q=o=>o?o.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g,"").length:0,V=()=>{h.back()},w=()=>{l.slides.push({id:e(),title:"",content:"",layout:"content"}),u.value=l.slides.length-1},T=o=>{if(l.slides.length<=1){alert("至少保留一页");return}l.slides.splice(o,1),u.value>=l.slides.length&&(u.value=l.slides.length-1)},x=o=>({title_slide:"title",content:"content",two_column:"two-column",left_text_right_image:"image-right",left_image_right_text:"image-left",center:"centered"})[o]||"content",k=async()=>{r.value=!0;try{const o=b.query.request||"商务演示";try{const{api:s}=await N(async()=>{const{api:c}=await import("./client-DgoMUySq.js");return{api:c}},__vite__mapDeps([0,1])),a=await s.ppt.plan(o);if(a&&a.data&&a.data.slides){l.slides=a.data.slides.map((c,M)=>({id:e(),title:c.title||`第${M+1}页`,content:Array.isArray(c.content)?c.content.join(`
`):c.content||"",layout:x(c.layout||"content")})),r.value=!1;return}}catch{}await new Promise(s=>setTimeout(s,800));const n=o.toLowerCase();let i;n.includes("商务")||n.includes("企业")||n.includes("公司")?i=[{title:o,content:`副标题
演讲者：姓名`,layout:"title"},{title:"目录",content:`一、行业概述
二、市场分析
三、竞争格局
四、发展策略
五、总结展望`,layout:"content"},{title:"行业概述",content:`• 行业定义与发展历程
• 市场规模与增长趋势
• 政策环境分析`,layout:"content"},{title:"市场分析",content:`• 目标市场定位
• 用户需求洞察
• 市场份额分析`,layout:"two-column"},{title:"竞争格局",content:`• 主要竞争对手
• 竞争优势分析
• 差异化策略`,layout:"content"},{title:"发展策略",content:`• 短期目标
• 中期规划
• 长期愿景`,layout:"content"},{title:"总结与展望",content:`• 核心观点回顾
• 下一步行动计划
• 感谢聆听`,layout:"centered"}]:n.includes("教育")||n.includes("培训")||n.includes("课程")?i=[{title:o,content:`课程名称
讲师：姓名`,layout:"title"},{title:"课程目录",content:`第一章：基础知识
第二章：核心要点
第三章：实战应用
第四章：总结复习`,layout:"content"},{title:"第一章：基础知识",content:`• 知识点1
• 知识点2
• 知识点3`,layout:"content"},{title:"第二章：核心要点",content:`• 核心概念
• 案例分析
• 实践方法`,layout:"two-column"},{title:"第三章：实战应用",content:`• 实战演练
• 常见问题
• 解决方案`,layout:"content"},{title:"第四章：总结复习",content:`• 知识回顾
• 重点总结
• 课后作业`,layout:"content"},{title:"谢谢观看",content:`感谢您的聆听
欢迎提问交流`,layout:"centered"}]:n.includes("数据")||n.includes("报告")||n.includes("分析")?i=[{title:o,content:`报告周期：2024年
汇报部门：数据分析部`,layout:"title"},{title:"报告摘要",content:`• 核心发现
• 关键指标
• 建议行动`,layout:"content"},{title:"数据概览",content:`• 总体数据
• 趋势分析
• 对比数据`,layout:"content"},{title:"详细分析",content:`• 维度一分析
• 维度二分析
• 维度三分析`,layout:"two-column"},{title:"洞察发现",content:`• 主要发现1
• 主要发现2
• 主要发现3`,layout:"content"},{title:"建议方案",content:`• 短期行动
• 中期优化
• 长期规划`,layout:"content"},{title:"总结",content:`• 核心结论
• 下一步计划`,layout:"centered"}]:n.includes("产品")||n.includes("发布")?i=[{title:o,content:`产品名称
发布会主题`,layout:"title"},{title:"产品介绍",content:`• 核心功能
• 创新亮点
• 使用体验`,layout:"content"},{title:"产品特点",content:`• 特点一
• 特点二
• 特点三`,layout:"two-column"},{title:"应用场景",content:`• 场景一
• 场景二
• 场景三`,layout:"content"},{title:"定价与发售",content:`• 价格方案
• 优惠政策
• 上市时间`,layout:"content"},{title:"谢谢观看",content:`感谢您的关注
欢迎预订`,layout:"centered"}]:i=[{title:o,content:`副标题
演讲者信息`,layout:"title"},{title:"目录",content:`第一部分：背景
第二部分：内容
第三部分：总结`,layout:"content"},{title:"第一部分",content:`• 要点1
• 要点2
• 要点3`,layout:"content"},{title:"第二部分",content:`• 要点1
• 要点2
• 要点3`,layout:"two-column"},{title:"第三部分",content:`• 总结1
• 总结2
• 总结3`,layout:"content"},{title:"谢谢观看",content:`感谢您的聆听
欢迎提问`,layout:"centered"}],l.slides=i.map(s=>({id:e(),title:s.title,content:s.content,layout:s.layout}))}catch{alert("生成失败，请重试")}finally{r.value=!1}},P=()=>{const o=[{name:"1. 商业计划书",slides:[{id:e(),title:"公司介绍",content:`公司背景
核心业务
团队介绍`,layout:"title"},{id:e(),title:"市场分析",content:`行业规模
目标用户
竞争分析`,layout:"content"},{id:e(),title:"产品服务",content:`产品特点
核心优势
商业模式`,layout:"two-column"},{id:e(),title:"发展规划",content:`短期目标
中期规划
长期愿景`,layout:"content"}]},{name:"2. 产品发布会",slides:[{id:e(),title:"新品发布",content:`产品名称
发布主题
演讲嘉宾`,layout:"title"},{id:e(),title:"产品介绍",content:`核心功能
创新亮点
使用体验`,layout:"content"},{id:e(),title:"产品演示",content:`演示环节
互动问答`,layout:"image-right"},{id:e(),title:"定价与上市",content:`价格方案
优惠政策
上市时间`,layout:"content"}]},{name:"3. 培训课件",slides:[{id:e(),title:"培训主题",content:`培训目标
课程大纲`,layout:"title"},{id:e(),title:"知识点一",content:`概念讲解
案例分析`,layout:"content"},{id:e(),title:"知识点二",content:`方法论
实践操作`,layout:"content"},{id:e(),title:"总结与问答",content:`要点回顾
课后作业
问答环节`,layout:"centered"}]},{name:"4. 年度总结",slides:[{id:e(),title:"年度工作总结",content:`年度回顾
核心成就`,layout:"title"},{id:e(),title:"业绩数据",content:`关键指标
同比分析
环比趋势`,layout:"two-column"},{id:e(),title:"团队成就",content:`团队建设
人才培养
文化建设`,layout:"content"},{id:e(),title:"明年计划",content:`目标设定
战略方向
资源规划`,layout:"content"}]},{name:"5. 项目汇报",slides:[{id:e(),title:"项目概述",content:`项目背景
项目目标
团队成员`,layout:"title"},{id:e(),title:"项目进度",content:`里程碑
已完成工作
进行中工作`,layout:"content"},{id:e(),title:"问题与解决",content:`遇到的问题
解决方案
风险控制`,layout:"two-column"},{id:e(),title:"下一步计划",content:`后续安排
资源需求
预期成果`,layout:"content"}]},{name:"6. 公司介绍",slides:[{id:e(),title:"公司介绍",content:`公司名称
创立时间
发展历程`,layout:"title"},{id:e(),title:"核心业务",content:`主要产品
服务领域
客户群体`,layout:"content"},{id:e(),title:"竞争优势",content:`技术优势
团队优势
资源优势`,layout:"two-column"},{id:e(),title:"发展愿景",content:`战略目标
未来规划
合作期待`,layout:"centered"}]},{name:"7. 融资路演",slides:[{id:e(),title:"融资计划",content:`项目名称
融资轮次
融资金额`,layout:"title"},{id:e(),title:"商业模式",content:`产品定位
盈利模式
市场空间`,layout:"content"},{id:e(),title:"竞争优势",content:`核心竞争力
技术壁垒
团队优势`,layout:"two-column"},{id:e(),title:"融资用途",content:`资金分配
使用计划
预期回报`,layout:"content"},{id:e(),title:"联系方式",content:`联系人
电话
邮箱`,layout:"centered"}]},{name:"8. 党建汇报",slides:[{id:e(),title:"党建工作汇报",content:`党组织名称
汇报时间`,layout:"title"},{id:e(),title:"组织建设",content:`党员情况
组织活动
制度建设`,layout:"content"},{id:e(),title:"思想建设",content:`理论学习
主题教育
思想动态`,layout:"content"},{id:e(),title:"下一步计划",content:`工作目标
重点任务`,layout:"centered"}]}],n=prompt(`选择模板:
${o.map(s=>s.name).join(`
`)}`),i=parseInt(n||"0")-1;i>=0&&i<o.length&&(l.slides=o[i].slides.map(s=>({...s,id:e()})))},I=()=>{confirm("确定要清空所有页面吗？")&&(l.slides=[{id:e(),title:"",content:"",layout:"content"}],u.value=0)},O=async()=>{if(l.slides.filter(n=>!n.title.trim()).length>0){alert("请填写所有页面的标题");return}y.value=!0;try{localStorage.setItem("ppt_outline",JSON.stringify(l)),h.push({path:"/generating",query:{request:b.query.request,style:l.style,slideCount:l.slides.length.toString()}})}catch{alert("生成失败，请重试"),y.value=!1}};return L(()=>{const o=localStorage.getItem("ppt_outline_temp");if(o){const n=JSON.parse(o);Object.assign(l,n),localStorage.removeItem("ppt_outline_temp")}else l.slides.length===0&&k()}),(o,n)=>(m(),p("div",K,[t("div",W,[t("div",{class:"header-left"},[t("button",{class:"btn-back",onClick:V}," ← 返回 "),n[3]||(n[3]=t("div",{class:"header-info"},[t("h1",{class:"page-title"},"编辑 PPT 大纲"),t("p",{class:"page-subtitle"},"调整每页标题和内容，确认后生成演示文稿")],-1))]),t("div",Z,[t("button",{class:"btn btn-outline",onClick:w}," + 添加页面 "),t("button",{class:"btn btn-primary",onClick:O,disabled:y.value},d(y.value?"生成中...":"生成 PPT"),9,Q)])]),t("div",X,[t("div",Y,[t("span",tt,[n[4]||(n[4]=t("span",{class:"summary-icon"},"📄",-1)),g(" "+d(l.slides.length)+" 页 ",1)]),t("span",nt,[n[5]||(n[5]=t("span",{class:"summary-icon"},"⏱️",-1)),g(" 预计 "+d(l.slides.length*30)+" 秒 ",1)]),t("span",et,[n[6]||(n[6]=t("span",{class:"summary-icon"},"🎨",-1)),g(" "+d(S(l.style)),1)])])]),t("div",ot,[U(D,{name:"slide",tag:"div",class:"slides-list"},{default:B(()=>[(m(!0),p(G,null,R(l.slides,(i,s)=>(m(),p("div",{key:i.id,class:z(["slide-card",{active:u.value===s}]),onClick:a=>u.value=s},[t("div",it,d(s+1),1),t("div",st,[t("div",at,[f(t("input",{"onUpdate:modelValue":a=>i.title=a,type:"text",class:"slide-title-input",placeholder:"页面标题",onClick:n[0]||(n[0]=v(()=>{},["stop"]))},null,8,ct),[[C,i.title]]),t("button",{class:"btn-icon btn-delete",onClick:v(a=>T(s),["stop"]),title:"删除页面"}," 🗑️ ",8,ut)]),t("div",dt,[f(t("textarea",{"onUpdate:modelValue":a=>i.content=a,class:"slide-content-input",placeholder:"输入页面内容要点，每行一个要点...",rows:"4",onClick:n[1]||(n[1]=v(()=>{},["stop"]))},null,8,rt),[[C,i.content]])]),t("div",yt,[f(t("select",{"onUpdate:modelValue":a=>i.layout=a,class:"layout-select",onClick:n[2]||(n[2]=v(()=>{},["stop"]))},[...n[7]||(n[7]=[t("option",{value:"title"},"标题页",-1),t("option",{value:"content"},"内容页",-1),t("option",{value:"two-column"},"双栏",-1),t("option",{value:"image-left"},"左图右文",-1),t("option",{value:"image-right"},"左文右图",-1),t("option",{value:"centered"},"居中",-1)])],8,pt),[[F,i.layout]]),t("span",mt,d(q(i.content))+" 字",1)])])],10,lt))),128))]),_:1}),t("div",{class:"add-slide-card",onClick:w},[...n[8]||(n[8]=[t("span",{class:"add-icon"},"+",-1),t("span",null,"添加新页面",-1)])])]),t("div",{class:"quick-actions"},[t("button",{class:"quick-action",onClick:k},[...n[9]||(n[9]=[t("span",{class:"action-icon"},"✨",-1),t("span",null,"AI 重新生成大纲",-1)])]),t("button",{class:"quick-action",onClick:P},[...n[10]||(n[10]=[t("span",{class:"action-icon"},"📋",-1),t("span",null,"加载模板",-1)])]),t("button",{class:"quick-action",onClick:I},[...n[11]||(n[11]=[t("span",{class:"action-icon"},"🗑️",-1),t("span",null,"清空所有",-1)])])]),r.value?(m(),p("div",vt,[...n[12]||(n[12]=[t("div",{class:"loading-spinner"},null,-1),t("p",null,"正在生成大纲...",-1)])])):j("",!0)]))}}),wt=A(gt,[["__scopeId","data-v-fbb5742d"]]);export{wt as default};
