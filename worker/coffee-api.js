// Coffee Archive backend — deploy as a Cloudflare Worker.
// Required secrets: GITHUB_TOKEN (fine-grained contents read/write on coffeedatabase),
// SYNC_PASSPHRASE (long random secret), ANTHROPIC_API_KEY (optional).
// Set ALLOWED_ORIGIN = https://wongtszshan.github.io
const REPO="wongtszshan/coffeedatabase", FILE="coffee-data.json";
const gh="https://api.github.com/repos/"+REPO+"/contents/"+FILE;
const json=(v,status=200,headers={})=>new Response(JSON.stringify(v),{status,headers:{"content-type":"application/json; charset=utf-8",...headers}});
function allow(req,env){const o=req.headers.get("Origin")||"";return o===(env.ALLOWED_ORIGIN||"https://wongtszshan.github.io")?{"Access-Control-Allow-Origin":o,"Vary":"Origin","Access-Control-Allow-Headers":"content-type, x-sync-key","Access-Control-Allow-Methods":"GET, PUT, POST, OPTIONS"}:null}
function tokenOK(req,env){const a=req.headers.get("x-sync-key")||"",b=(env.SYNC_PASSPHRASE||env.SYNC_PASSHRASE)||"";if(!b||a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0}
async function github(env,method="GET",data,sha){const body=method==="PUT"?JSON.stringify({message:"Sync Coffee Archive data",content:btoa(unescape(encodeURIComponent(JSON.stringify(data,null,2)))),sha}):undefined;const r=await fetch(gh,{method,headers:{"Authorization":"Bearer "+env.GITHUB_TOKEN,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"coffee-archive-worker",...(body?{"Content-Type":"application/json"}:{})},body});const j=await r.json();if(!r.ok)throw Object.assign(new Error(j.message||"GitHub request failed"),{status:r.status});return j}
function decode64(s){return JSON.parse(decodeURIComponent(escape(atob(s.replace(/\s/g,"")))))}
function valid(d){return d&&["beans","lots","recipes","brews","adjustments"].every(k=>Array.isArray(d[k]))&&JSON.stringify(d).length<750000}
export default {async fetch(request,env){const cors=allow(request,env);if(!cors)return json({error:"Origin not allowed"},403);if(request.method==="OPTIONS")return new Response(null,{headers:cors});if(!tokenOK(request,env))return json({error:"Unauthorized"},401,cors);if(!env.GITHUB_TOKEN)return json({error:"GitHub secret not configured"},503,cors);const path=new URL(request.url).pathname;try{if(path==="/data"&&request.method==="GET"){const f=await github(env);return json({data:decode64(f.content),sha:f.sha},200,cors)}if(path==="/data"&&request.method==="PUT"){const incoming=await request.json();if(!valid(incoming.data)||!incoming.sha)return json({error:"Invalid data or missing revision"},400,cors);const f=await github(env,"PUT",incoming.data,incoming.sha);return json({sha:f.content.sha},200,cors)}if(path==="/recognize"&&request.method==="POST"){
 if(!env.ANTHROPIC_API_KEY)return json({error:"Claude is not configured"},503,cors);
 const input=await request.json(), images=Array.isArray(input.images)?input.images.slice(0,4):(input.image?[input.image]:[]);
 const content=[];
 for(const image of images){
  const m=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(image||"");
  if(!m)return json({error:"Invalid image"},400,cors);
  content.push({type:"image",source:{type:"base64",media_type:m[1],data:m[2]}});
 }
 const description=String(input.text||"").slice(0,12000).trim();
 if(!images.length&&!description)return json({error:"Please provide images or a description"},400,cors);
 const prompt=`你是精品咖啡包装与烘焙商介绍资料分析助手。全面阅读所有图片中的标题、段落、小字、表格，以及用户粘贴的文字；不要只查找冒号后的标签。识别中文及英文，包括自然语言描述、同义术语、跨句关联。只提取确实有文字依据的咖啡信息，不要用常识补全、不猜测产地/豆种/处理法/烘焙日期或养豆天数。保留独立字段 name, roaster, country, region, farm, variety, altitude, process, roast, flavors, note, roastDate, restDays, restNote。restDays 必须是原文明确建议的烘焙后等待天数整数（例如 rest 14 days），不能把最佳赏味期、保质期或数字海拔误当养豆期。roastDate 只在有明确年/月/日时输出 YYYY-MM-DD；无年份则留空并在 warnings 说明。process 仅可为 水洗、日晒、蜜处理、厌氧、其他、未知；roast 仅可为 浅烘、中浅烘、中烘、中深烘、深烘、未知。风味使用逗号分隔文本；海拔可用范围如 1850-2100 m；未知字段统一空字符串。识别遇到冲突时该字段留空并写 warnings。不要把 tasting notes 当成品种名。返回严格 JSON 对象：{"fields":{"name":"","roaster":"","country":"","region":"","farm":"","variety":"","altitude":"","process":"","roast":"","flavors":"","note":"","roastDate":"","restDays":"","restNote":""},"evidence":{},"warnings":[]}；evidence 对每个非空字段写一段简短原文证据；warnings 为简短中文字符串数组；不要 markdown、不要解释。
用户补充文字：${description||"（无）"}`;
 content.push({type:"text",text:prompt});
 const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":env.ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","content-type":"application/json"},body:JSON.stringify({model:env.ANTHROPIC_MODEL||"claude-sonnet-4-5",max_tokens:1900,temperature:0,messages:[{role:"user",content}]})});
 const output=await r.json();
 if(!r.ok)return json({error:output.error?.message||"Claude request failed"},502,cors);
 const t=(output.content||[]).filter(x=>x.type==="text").map(x=>x.text).join("");
 const found=t.match(/\{[\s\S]*\}/);if(!found)return json({error:"No JSON returned"},502,cors);
 let result;try{result=JSON.parse(found[0])}catch{ return json({error:"Invalid Claude JSON response"},502,cors) }
 if(!result.fields||typeof result.fields!=="object")return json({error:"Invalid AI result"},502,cors);
 return json({fields:result.fields,evidence:result.evidence||{},warnings:Array.isArray(result.warnings)?result.warnings:[]},200,cors);
} return json({error:"Not found"},404,cors)}catch(e){return json({error:e.message||"Server error"},e.status===409?409:502,cors)}}};
