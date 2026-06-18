const STORAGE_KEY = "nexus_admin_github_items_v1";

const panelInfo = {
  article: ["Article", "Save a complete Markdown article to GitHub."],
  topic: ["Topic Card", "Save a fast explanation card."],
  risk: ["Risk Family", "Save a reusable clinical risk family."],
  rule: ["Clinical Rule", "Save a pharmacist decision rule."],
  drug: ["Drug Monograph", "Save a structured drug monograph."],
  library: ["Saved Items", "Review local saved items."]
};

let current = "article";

function $(id){ return document.getElementById(id); }
function csv(v){ return (v||"").split(",").map(x=>x.trim()).filter(Boolean); }
function lines(v){ return (v||"").split("\n").map(x=>x.trim()).filter(Boolean); }
function slug(v){ return String(v||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"") || "untitled"; }

function getItems(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function setItems(items){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

function pathFor(item){
  if(item.kind==="article") return `articles/${slug(item.title || item.id)}.md`;
  if(item.kind==="topic") return `data/topics/${item.id}.json`;
  if(item.kind==="risk") return `data/risk_families/${item.id}.json`;
  if(item.kind==="rule") return `data/clinical_rules/${item.id}.json`;
  if(item.kind==="drug") return `data/drugs/${item.id}.json`;
  return `data/${item.id}.json`;
}

function buildArticle(){
  const id=$("articleId").value.trim(), title=$("articleTitle").value.trim(), topic=$("articleTopic").value.trim();
  const sourceId=$("articleSourceId").value.trim(), tags=csv($("articleTags").value), body=$("articleBody").value.trim();
  const md=`---\nid: ${id}\ntitle: ${title}\ntype: article\ntopic: ${topic}\ntags:\n${tags.map(t=>`  - ${t}`).join("\n")}\nsource_id: ${sourceId}\nstatus: active\nlast_reviewed: ${new Date().toISOString().slice(0,10)}\n---\n\n# ${title}\n\n${body}\n`;
  return {kind:"article",id,title,topic,tags,sourceIds:[sourceId].filter(Boolean),content:md};
}

function buildTopic(){
  const obj={
    id:$("topicId").value.trim(), type:$("topicType").value, name:$("topicName").value.trim(), status:"active",
    sourceIds:csv($("topicSourceIds").value), definition:$("topicDefinition").value.trim(),
    overview:$("topicOverview").value.trim(), keyPoints:lines($("topicKeyPoints").value),
    assessment:lines($("topicAssessment").value), redFlags:lines($("topicRedFlags").value)
  };
  return {kind:"topic",id:obj.id,title:obj.name,topic:obj.id.replace(/^topic_/,""),sourceIds:obj.sourceIds,content:obj};
}

function buildRisk(){
  const obj={
    id:$("riskId").value.trim(), type:"risk_family", label:$("riskLabel").value.trim(),
    severityDefault:$("riskSeverity").value, description:$("riskDescription").value.trim(),
    commonTriggers:lines($("riskTriggers").value), monitoring:lines($("riskMonitoring").value),
    redFlags:lines($("riskRedFlags").value), pharmacistActions:lines($("riskActions").value),
    sourceIds:csv($("riskSourceIds").value), status:"active"
  };
  return {kind:"risk",id:obj.id,title:obj.label,topic:obj.id.replace(/^risk_/,""),sourceIds:obj.sourceIds,content:obj};
}

function buildRule(){
  const obj={
    id:$("ruleId").value.trim(), type:"clinical_rule", title:$("ruleTitle").value.trim(),
    riskFamily:$("ruleRiskFamily").value.trim(), severity:$("ruleSeverity").value,
    triggers:lines($("ruleTriggers").value), missingData:lines($("ruleMissingData").value),
    clinicalMeaning:$("ruleClinicalMeaning").value.trim(), pharmacistActions:lines($("ruleActions").value),
    patientCounseling:lines($("ruleCounseling").value), sourceIds:csv($("ruleSourceIds").value),
    status:"active"
  };
  return {kind:"rule",id:obj.id,title:obj.title,topic:obj.riskFamily,sourceIds:obj.sourceIds,content:obj};
}

function buildDrug(){
  const obj={
    id:$("drugId").value.trim(), type:"drug_monograph", status:"active",
    identity:{ genericName:$("drugName").value.trim(), pharmacologicCategory:$("drugClass").value.trim() },
    coreInfo:{ indications:lines($("drugIndications").value), dosageRegimen:lines($("drugDose").value) },
    safety:{ warningsPrecautions:lines($("drugWarnings").value), monitoringParameters:lines($("drugMonitoring").value) },
    patientCounseling:lines($("drugCounseling").value), riskFamilies:lines($("drugRisks").value),
    sourceIds:csv($("drugSourceIds").value)
  };
  return {kind:"drug",id:obj.id,title:obj.identity.genericName,topic:obj.identity.genericName,sourceIds:obj.sourceIds,content:obj};
}

function buildCurrent(){
  if(current==="article") return buildArticle();
  if(current==="topic") return buildTopic();
  if(current==="risk") return buildRisk();
  if(current==="rule") return buildRule();
  if(current==="drug") return buildDrug();
  return null;
}

function buildIndex(items=getItems()){
  return {
    libraryName:"Nexus Knowledge Core",
    version:"0.1.0",
    generatedAt:new Date().toISOString(),
    items: items.map(i=>({
      id:i.id, type:i.kind, title:i.title, path:i.path, topic:i.topic,
      sourceIds:i.sourceIds || [], status:"active"
    }))
  };
}

function saveLocal(){
  const item=buildCurrent();
  if(!item || !item.id){ alert("اكتب ID الأول"); return null; }
  item.path=pathFor(item);
  item.updatedAt=new Date().toISOString();
  const items=getItems();
  const idx=items.findIndex(x=>x.kind===item.kind && x.id===item.id);
  if(idx>=0) items[idx]=item; else items.push(item);
  setItems(items);
  renderList();
  return item;
}

async function uploadGitHub(){
  const item=saveLocal();
  if(!item) return;

  $("uploadGitHubBtn").disabled=true;
  $("uploadGitHubBtn").textContent="Uploading...";

  try{
    const response=await fetch("/api/github-save",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        item,
        index: buildIndex()
      })
    });

    const data=await response.json();
    if(!response.ok) throw new Error(data.error || "Upload failed");

    alert("اترفع على GitHub ✅");
  }catch(err){
    alert("GitHub upload error: " + err.message);
  }finally{
    $("uploadGitHubBtn").disabled=false;
    $("uploadGitHubBtn").textContent="Upload to GitHub";
  }
}

function renderList(){
  const list=$("list"), preview=$("preview");
  if(!list || !preview) return;
  const items=getItems();
  list.innerHTML="";
  if(!items.length){ list.innerHTML=`<div class="item"><strong>No items</strong><span>Save something first.</span></div>`; preview.textContent=""; return; }
  items.forEach(item=>{
    const div=document.createElement("div");
    div.className="item";
    div.innerHTML=`<strong>${item.title || item.id}</strong><span>${item.kind} · ${item.path}</span>`;
    div.onclick=()=>{ preview.textContent = typeof item.content==="string" ? item.content : JSON.stringify(item.content,null,2); };
    list.appendChild(div);
  });
  preview.textContent=JSON.stringify(buildIndex(items),null,2);
}

function downloadIndex(){
  const blob=new Blob([JSON.stringify(buildIndex(),null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob); a.download="index.json"; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

document.querySelectorAll(".nav").forEach(btn=>{
  btn.onclick=()=>{
    current=btn.dataset.panel;
    document.querySelectorAll(".nav").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".panel").forEach(p=>p.classList.remove("active"));
    $("panel-"+current).classList.add("active");
    $("title").textContent=panelInfo[current][0];
    $("subtitle").textContent=panelInfo[current][1];
    renderList();
  };
});

$("saveLocalBtn").onclick=()=>{ if(saveLocal()) alert("Saved locally ✅"); };
$("uploadGitHubBtn").onclick=uploadGitHub;
$("clearBtn").onclick=()=>document.querySelectorAll(".panel.active input,.panel.active textarea").forEach(el=>el.value="");
$("downloadIndexBtn").onclick=downloadIndex;
$("resetBtn").onclick=()=>{ if(confirm("Delete local saved items?")){ localStorage.removeItem(STORAGE_KEY); renderList(); } };

renderList();
