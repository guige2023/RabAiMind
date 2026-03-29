const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/js/index-Bawil9sl.js","assets/js/vendor-other-BmcXdRcn.js","assets/js/vendor-vue-rkGSwP-Z.js","assets/css/index-YHrqK0jh.css"])))=>i.map(i=>d[i]);
import{b as k,_ as et}from"./index-Bawil9sl.js";import{d as nt,q as lt,e as u,g as e,t as m,H as E,C as ot,E as st,I as at,m as b,F as h,j as w,x as C,K as D,b as v,r as it,o as r,l as N,y as F,k as x}from"./vendor-other-BmcXdRcn.js";import{b as ct,u as ut}from"./vendor-vue-rkGSwP-Z.js";const rt={class:"outline-edit-page"},dt={class:"outline-header"},pt={class:"header-actions"},yt=["disabled"],mt={class:"outline-preview"},vt={class:"outline-summary"},_t={class:"summary-item"},ht={class:"summary-item"},wt={class:"summary-item"},gt={class:"slides-container"},ft=["onClick"],kt={class:"slide-number"},bt={class:"slide-content"},Ct={class:"slide-header"},It=["onUpdate:modelValue"],Tt=["onClick"],qt={class:"slide-body"},St=["onUpdate:modelValue"],Vt={class:"slide-footer"},Ot=["onUpdate:modelValue"],Pt={class:"word-count"},xt={key:0,class:"loading-overlay"},$t={key:1,class:"chart-upload-panel"},Et={class:"panel-header"},Dt={class:"chart-type-selector"},Rt=["onClick"],Ut={key:0,class:"column-selector"},At=["value"],Lt={key:1,class:"column-selector"},Nt=["value"],Ft={key:2,class:"preview-table"},jt=nt({__name:"OutlineEditView",setup(Mt){const R=ut(),_=ct(),g=v(0),f=v(!1),I=v(!1),j=["bar","pie","line","horizontal_bar","stacked_bar"],T=v(!1),U=v(""),q=v("bar"),d=v({all_columns:[],label_columns:[],numeric_columns:[],preview:[]}),S=v(0),V=v(0),M=v([]),$=v(null),i=it({slides:[],style:"professional",theme:"blue"}),o=()=>Math.random().toString(36).substr(2,9),z=l=>({professional:"专业商务",simple:"简约现代",energetic:"活力创意",premium:"高端奢华",tech:"科技感",creative:"创意艺术"})[l]||l,B=l=>l?l.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g,"").length:0,G=()=>{R.back()},A=()=>{i.slides.push({id:o(),title:"",content:"",layout:"content"}),g.value=i.slides.length-1},J=l=>{if(i.slides.length<=1){alert("至少保留一页");return}i.slides.splice(l,1),g.value>=i.slides.length&&(g.value=i.slides.length-1)},K=l=>({title_slide:"title",content:"content",content_card:"content",two_column:"two-column",left_text_right_image:"image-right",left_image_right_text:"image-left",three_column:"three-column",center:"centered",center_radiation:"centered",toc:"toc",timeline:"timeline",data_visualization:"chart",quote:"quote",comparison:"comparison",thank_you:"end"})[l]||"content",W=async()=>{const l=document.createElement("input");l.type="file",l.accept=".csv,.xlsx,.xls",l.onchange=async t=>{var a;const s=(a=t.target.files)==null?void 0:a[0];if(s){U.value=s.name,$.value=s;try{const c=new FormData;c.append("file",s);const{api:y}=await k(async()=>{const{api:P}=await import("./index-Bawil9sl.js").then(tt=>tt.e);return{api:P}},__vite__mapDeps([0,1,2,3])),p=await fetch(`/api/v1/ppt/chart/preview/${_.query.taskId||"temp"}`,{method:"GET",headers:{"Content-Type":"multipart/form-data"},body:c}),O=await fetch(`/api/v1/ppt/chart/preview/${_.query.taskId||"temp"}`,{method:"POST",body:c});if(O.ok){const P=await O.json();P.success&&(d.value=P.columns,S.value=0,V.value=0)}}catch{alert("文件解析失败，请检查文件格式")}}},l.click()},H=async()=>{var s,a;if(!$.value){alert("请先选择文件");return}const l=((s=d.value.label_columns)==null?void 0:s[S.value])||"",t=((a=d.value.numeric_columns)==null?void 0:a[V.value])||"";if(!l||!t){alert("请选择标签列和数值列");return}const n=_.query.taskId||"temp_chart_task";try{const c=new FormData;c.append("file",$.value),c.append("chart_type",q.value),c.append("label_col",l),c.append("value_col",t);const y=await fetch(`/api/v1/ppt/chart/upload/${n}`,{method:"POST",body:c});if(!y.ok)throw new Error("图表生成失败");const p=await y.json();p.success&&(M.value=p.svg_urls,T.value=!1,i.slides.push({id:o(),title:`${l} - ${t}`,content:`图表类型: ${q.value}`,layout:"content"}),alert(`图表已生成！共 ${p.charts.length} 个图表。
文件: ${p.svg_urls.join(", ")}`))}catch{alert("图表生成失败，请重试")}},L=async()=>{var s;f.value=!0;const l=_.query.request||"商务演示";try{const{api:a}=await k(async()=>{const{api:y}=await import("./index-Bawil9sl.js").then(p=>p.e);return{api:y}},__vite__mapDeps([0,1,2,3])),c=await a.ppt.plan(l);if(c!=null&&c.data){const y=c.data;if(y.success&&y.slides&&y.slides.length>0){i.slides=y.slides.map((p,O)=>({id:o(),title:p.title||`第${O+1}页`,content:Array.isArray(p.content)?p.content.join(`
`):p.content||"",layout:K(p.layout||p.slide_type||"content")})),f.value=!1;return}}}catch(a){if(!(a!=null&&a.response)||(a==null?void 0:a.code)==="ERR_NETWORK"||(s=a==null?void 0:a.message)!=null&&s.includes("Network")){f.value=!1,alert(`⚠️ 无法连接到后端服务

请确保后端服务已启动:
cd /Users/guige/my_project/RabAiMind
source .venv/bin/activate
python3 -m uvicorn src.main:app --host 127.0.0.1 --port 8003

如果后端已启动，请检查浏览器控制台获取更多信息。`);return}}await new Promise(a=>setTimeout(a,800));const t=l.toLowerCase();let n;try{t.includes("商务")||t.includes("企业")||t.includes("公司")?n=[{title:l,content:`副标题
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
• 感谢聆听`,layout:"centered"}]:t.includes("教育")||t.includes("培训")||t.includes("课程")?n=[{title:l,content:`课程名称
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
欢迎提问交流`,layout:"centered"}]:t.includes("数据")||t.includes("报告")||t.includes("分析")?n=[{title:l,content:`报告周期：2024年
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
• 下一步计划`,layout:"centered"}]:t.includes("产品")||t.includes("发布")?n=[{title:l,content:`产品名称
发布会主题`,layout:"title"},{title:"产品介绍",content:`• 核心功能
• 创新亮点
• 使用体验`,layout:"content"},{title:"产品特点",content:`• 特点一
• 特点二
• 特点三`,layout:"two-column"},{title:"应用场景",content:`• 场景一
• 场景二
• 场景三`,layout:"content"},{title:"定价与发售",content:`• 价格方案
• 优惠政策
• 上市时间`,layout:"content"},{title:"谢谢观看",content:`感谢您的关注
欢迎预订`,layout:"centered"}]:n=[{title:l,content:`副标题
演讲者信息`,layout:"title"},{title:"目录",content:`第一部分：背景
第二部分：内容
第三部分：总结`,layout:"content"},{title:"第一部分",content:`• 要点1
• 要点2
• 要点3`,layout:"content"},{title:"第二部分",content:`• 要点1
• 要点2
• 要点3`,layout:"two-column"},{title:"第三部分",content:`• 总结1
• 总结2
• 总结3`,layout:"content"},{title:"谢谢观看",content:`感谢您的聆听
欢迎提问`,layout:"centered"}],i.slides=n.map(a=>({id:o(),title:a.title,content:a.content,layout:a.layout}))}catch{alert("生成失败，请重试")}finally{f.value=!1}},Z=()=>{const l=[{name:"1. 商业计划书",slides:[{id:o(),title:"公司介绍",content:`公司背景
核心业务
团队介绍`,layout:"title"},{id:o(),title:"市场分析",content:`行业规模
目标用户
竞争分析`,layout:"content"},{id:o(),title:"产品服务",content:`产品特点
核心优势
商业模式`,layout:"two-column"},{id:o(),title:"发展规划",content:`短期目标
中期规划
长期愿景`,layout:"content"}]},{name:"2. 产品发布会",slides:[{id:o(),title:"新品发布",content:`产品名称
发布主题
演讲嘉宾`,layout:"title"},{id:o(),title:"产品介绍",content:`核心功能
创新亮点
使用体验`,layout:"content"},{id:o(),title:"产品演示",content:`演示环节
互动问答`,layout:"image-right"},{id:o(),title:"定价与上市",content:`价格方案
优惠政策
上市时间`,layout:"content"}]},{name:"3. 培训课件",slides:[{id:o(),title:"培训主题",content:`培训目标
课程大纲`,layout:"title"},{id:o(),title:"知识点一",content:`概念讲解
案例分析`,layout:"content"},{id:o(),title:"知识点二",content:`方法论
实践操作`,layout:"content"},{id:o(),title:"总结与问答",content:`要点回顾
课后作业
问答环节`,layout:"centered"}]},{name:"4. 年度总结",slides:[{id:o(),title:"年度工作总结",content:`年度回顾
核心成就`,layout:"title"},{id:o(),title:"业绩数据",content:`关键指标
同比分析
环比趋势`,layout:"two-column"},{id:o(),title:"团队成就",content:`团队建设
人才培养
文化建设`,layout:"content"},{id:o(),title:"明年计划",content:`目标设定
战略方向
资源规划`,layout:"content"}]},{name:"5. 项目汇报",slides:[{id:o(),title:"项目概述",content:`项目背景
项目目标
团队成员`,layout:"title"},{id:o(),title:"项目进度",content:`里程碑
已完成工作
进行中工作`,layout:"content"},{id:o(),title:"问题与解决",content:`遇到的问题
解决方案
风险控制`,layout:"two-column"},{id:o(),title:"下一步计划",content:`后续安排
资源需求
预期成果`,layout:"content"}]},{name:"6. 公司介绍",slides:[{id:o(),title:"公司介绍",content:`公司名称
创立时间
发展历程`,layout:"title"},{id:o(),title:"核心业务",content:`主要产品
服务领域
客户群体`,layout:"content"},{id:o(),title:"竞争优势",content:`技术优势
团队优势
资源优势`,layout:"two-column"},{id:o(),title:"发展愿景",content:`战略目标
未来规划
合作期待`,layout:"centered"}]},{name:"7. 融资路演",slides:[{id:o(),title:"融资计划",content:`项目名称
融资轮次
融资金额`,layout:"title"},{id:o(),title:"商业模式",content:`产品定位
盈利模式
市场空间`,layout:"content"},{id:o(),title:"竞争优势",content:`核心竞争力
技术壁垒
团队优势`,layout:"two-column"},{id:o(),title:"融资用途",content:`资金分配
使用计划
预期回报`,layout:"content"},{id:o(),title:"联系方式",content:`联系人
电话
邮箱`,layout:"centered"}]},{name:"8. 党建汇报",slides:[{id:o(),title:"党建工作汇报",content:`党组织名称
汇报时间`,layout:"title"},{id:o(),title:"组织建设",content:`党员情况
组织活动
制度建设`,layout:"content"},{id:o(),title:"思想建设",content:`理论学习
主题教育
思想动态`,layout:"content"},{id:o(),title:"下一步计划",content:`工作目标
重点任务`,layout:"centered"}]}],t=prompt(`选择模板:
${l.map(s=>s.name).join(`
`)}`),n=parseInt(t||"0")-1;n>=0&&n<l.length&&(i.slides=l[n].slides.map(s=>({...s,id:o()})))},Q=()=>{confirm("确定要清空所有页面吗？")&&(i.slides=[{id:o(),title:"",content:"",layout:"content"}],g.value=0)},X=async()=>{if(i.slides.filter(t=>!t.title.trim()).length>0){alert("请填写所有页面的标题");return}I.value=!0;try{const t=i.slides.map(c=>({title:c.title,content:c.content,slide_type:c.layout==="title"?"title":"content",layout:c.layout})),{api:n}=await k(async()=>{const{api:c}=await import("./index-Bawil9sl.js").then(y=>y.e);return{api:c}},__vite__mapDeps([0,1,2,3]));await Y();const a=(await n.ppt.createTask({user_request:_.query.request||"PPT 生成",slide_count:i.slides.length,scene:_.query.scene||"business",style:i.style||"professional",pre_generated_slides:t})).data.task_id;localStorage.setItem("ppt_outline",JSON.stringify(i)),R.push({path:"/generating",query:{taskId:a}})}catch(t){alert(`生成失败: ${(t==null?void 0:t.message)||"请重试"}`),I.value=!1}},Y=async()=>{try{const{api:l}=await k(async()=>{const{api:n}=await import("./index-Bawil9sl.js").then(s=>s.e);return{api:n}},__vite__mapDeps([0,1,2,3])),t={slides:i.slides.map(n=>({title:n.title,content:n.content,layout:n.layout,slide_type:n.layout==="title"?"title":"content"})),style:i.style,scene:_.query.scene||"business"};if(window.__currentTaskId)await l.ppt.saveOutline(window.__currentTaskId,t);else{const s=(await l.ppt.commitOutline({user_request:_.query.request||"PPT生成",slide_count:t.slides.length,scene:t.scene,style:t.style,pre_generated_slides:t.slides})).data.task_id;window.__currentTaskId=s}localStorage.setItem("ppt_outline",JSON.stringify(t))}catch{}};return lt(async()=>{const l=_.query.taskId;if(l){window.__currentTaskId=l;try{const{api:n}=await k(async()=>{const{api:a}=await import("./index-Bawil9sl.js").then(c=>c.e);return{api:a}},__vite__mapDeps([0,1,2,3])),s=await n.ppt.getOutline(l);if(s.data&&s.data.outline){i.slides=s.data.outline.slides||[],i.style=s.data.outline.style||"professional",i.theme=s.data.outline.theme||"blue";return}}catch{}}const t=localStorage.getItem("ppt_outline_temp");if(t){const n=JSON.parse(t);Object.assign(i,n),localStorage.removeItem("ppt_outline_temp")}else i.slides.length===0&&L()}),(l,t)=>(r(),u("div",rt,[e("div",dt,[e("div",{class:"header-left"},[e("button",{class:"btn-back",onClick:G}," ← 返回 "),t[7]||(t[7]=e("div",{class:"header-info"},[e("h1",{class:"page-title"},"编辑 PPT 大纲"),e("p",{class:"page-subtitle"},"调整每页标题和内容，确认后生成演示文稿")],-1))]),e("div",pt,[e("button",{class:"btn btn-outline",onClick:A}," + 添加页面 "),e("button",{class:"btn btn-primary",onClick:X,disabled:I.value},m(I.value?"生成中...":"生成 PPT"),9,yt)])]),e("div",mt,[e("div",vt,[e("span",_t,[t[8]||(t[8]=e("span",{class:"summary-icon"},"📄",-1)),E(" "+m(i.slides.length)+" 页 ",1)]),e("span",ht,[t[9]||(t[9]=e("span",{class:"summary-icon"},"⏱️",-1)),E(" 预计 "+m(i.slides.length*30)+" 秒 ",1)]),e("span",wt,[t[10]||(t[10]=e("span",{class:"summary-icon"},"🎨",-1)),E(" "+m(z(i.style)),1)])])]),e("div",gt,[ot(at,{name:"slide",tag:"div",class:"slides-list"},{default:st(()=>[(r(!0),u(h,null,w(i.slides,(n,s)=>(r(),u("div",{key:n.id,class:N(["slide-card",{active:g.value===s}]),onClick:a=>g.value=s},[e("div",kt,m(s+1),1),e("div",bt,[e("div",Ct,[C(e("input",{"onUpdate:modelValue":a=>n.title=a,type:"text",class:"slide-title-input",placeholder:"页面标题",onClick:t[0]||(t[0]=x(()=>{},["stop"]))},null,8,It),[[F,n.title]]),e("button",{class:"btn-icon btn-delete",onClick:x(a=>J(s),["stop"]),title:"删除页面"}," 🗑️ ",8,Tt)]),e("div",qt,[C(e("textarea",{"onUpdate:modelValue":a=>n.content=a,class:"slide-content-input",placeholder:"输入页面内容要点，每行一个要点...",rows:"4",onClick:t[1]||(t[1]=x(()=>{},["stop"]))},null,8,St),[[F,n.content]])]),e("div",Vt,[C(e("select",{"onUpdate:modelValue":a=>n.layout=a,class:"layout-select",onClick:t[2]||(t[2]=x(()=>{},["stop"]))},[...t[11]||(t[11]=[e("option",{value:"title"},"标题页",-1),e("option",{value:"content"},"内容页",-1),e("option",{value:"two-column"},"双栏",-1),e("option",{value:"image-left"},"左图右文",-1),e("option",{value:"image-right"},"左文右图",-1),e("option",{value:"centered"},"居中",-1)])],8,Ot),[[D,n.layout]]),e("span",Pt,m(B(n.content))+" 字",1)])])],10,ft))),128))]),_:1}),e("div",{class:"add-slide-card",onClick:A},[...t[12]||(t[12]=[e("span",{class:"add-icon"},"+",-1),e("span",null,"添加新页面",-1)])])]),e("div",{class:"quick-actions"},[e("button",{class:"quick-action",onClick:L},[...t[13]||(t[13]=[e("span",{class:"action-icon"},"✨",-1),e("span",null,"AI 重新生成大纲",-1)])]),e("button",{class:"quick-action",onClick:Z},[...t[14]||(t[14]=[e("span",{class:"action-icon"},"📋",-1),e("span",null,"加载模板",-1)])]),e("button",{class:"quick-action",onClick:Q},[...t[15]||(t[15]=[e("span",{class:"action-icon"},"🗑️",-1),e("span",null,"清空所有",-1)])])]),f.value?(r(),u("div",xt,[...t[16]||(t[16]=[e("div",{class:"loading-spinner"},null,-1),e("p",null,"正在生成大纲...",-1)])])):b("",!0),e("button",{class:"quick-action chart-upload-btn",onClick:t[3]||(t[3]=n=>T.value=!0)},[...t[17]||(t[17]=[e("span",{class:"action-icon"},"📊",-1),e("span",null,"上传数据生成图表",-1)])]),T.value?(r(),u("div",$t,[e("view",Et,[t[18]||(t[18]=e("text",{class:"panel-title"},"📊 数据可视化",-1)),e("span",{class:"close-btn",onClick:t[4]||(t[4]=n=>T.value=!1)},"✕")]),e("view",{class:"upload-area",onClick:W},[e("text",null,m(U.value||"点击选择 CSV/Excel 文件"),1)]),e("view",Dt,[(r(),u(h,null,w(j,n=>e("view",{class:N(["type-btn",q.value===n?"active":""]),onClick:s=>q.value=n},m(n==="bar"?"柱状图":n==="pie"?"饼图":n==="line"?"折线图":n==="horizontal_bar"?"横向柱图":"堆叠柱图"),11,Rt)),64))]),d.value.label_columns&&d.value.label_columns.length?(r(),u("view",Ut,[t[19]||(t[19]=e("text",{class:"selector-label"},"标签列：",-1)),C(e("select",{"onUpdate:modelValue":t[5]||(t[5]=n=>S.value=n),class:"column-select"},[(r(!0),u(h,null,w(d.value.label_columns,(n,s)=>(r(),u("option",{key:s,value:s},m(n),9,At))),128))],512),[[D,S.value]])])):b("",!0),d.value.numeric_columns&&d.value.numeric_columns.length?(r(),u("view",Lt,[t[20]||(t[20]=e("text",{class:"selector-label"},"数值列：",-1)),C(e("select",{"onUpdate:modelValue":t[6]||(t[6]=n=>V.value=n),class:"column-select"},[(r(!0),u(h,null,w(d.value.numeric_columns,(n,s)=>(r(),u("option",{key:s,value:s},m(n),9,Nt))),128))],512),[[D,V.value]])])):b("",!0),d.value.preview&&d.value.preview.length?(r(),u("view",Ft,[t[21]||(t[21]=e("text",{class:"preview-title"},"数据预览（前5行）",-1)),e("table",null,[e("thead",null,[e("tr",null,[(r(!0),u(h,null,w(d.value.all_columns,n=>(r(),u("th",{key:n},m(n),1))),128))])]),e("tbody",null,[(r(!0),u(h,null,w(d.value.preview,(n,s)=>(r(),u("tr",{key:s},[(r(!0),u(h,null,w(d.value.all_columns,a=>(r(),u("td",{key:a},m(n[a]),1))),128))]))),128))])])])):b("",!0),e("button",{class:"generate-btn",type:"primary",onClick:H},"生成图表")])):b("",!0)]))}}),Jt=et(jt,[["__scopeId","data-v-8d9d9f57"]]);export{Jt as default};
