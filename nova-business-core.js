(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.NovaBusinessCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MAX_CSV_BYTES=5*1024*1024,MAX_ROWS=20000;
  const fail=(message)=>{throw new Error(message)};
  const text=(v)=>String(v==null?'':v).trim();
  const number=(v)=>{
    if(typeof v==='number')return Number.isFinite(v)?v:null;
    const s=text(v).replace(/[₹$€£]/g,'').replace(/^Rs\.?\s*/i,'').replace(/,/g,'');
    if(!s)return null;
    if(!/^-?\d+(?:\.\d{1,4})?$/.test(s))return null;
    const n=Number(s);return Number.isFinite(n)?n:null;
  };
  const date=(v)=>{
    const s=text(v);if(!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(s))return null;
    const parts=s.slice(0,10).split('-').map(Number),check=new Date(Date.UTC(parts[0],parts[1]-1,parts[2]));
    if(check.getUTCFullYear()!==parts[0]||check.getUTCMonth()!==parts[1]-1||check.getUTCDate()!==parts[2])return null;
    const n=Date.parse(s);return Number.isFinite(n)?n:null;
  };
  const deadlineDate=(v)=>{const value=text(v);if(/^\\d{4}-\\d{2}-\\d{2}$/.test(value)){const stamp=date(value);return stamp===null?null:stamp+86400000-1;}return date(value);};
  function parseCSV(input,options){
    const opts=options||{},maxBytes=opts.maxBytes||MAX_CSV_BYTES,maxRows=opts.maxRows||MAX_ROWS;
    if(typeof input!=='string')fail('CSV input must be text.');
    if(new TextEncoder().encode(input).length>maxBytes)fail('CSV exceeds the 5 MB import limit.');
    const src=input.replace(/^\uFEFF/,'');if(!src.trim())fail('CSV is empty.');
    const matrix=[];let row=[],cell='',quoted=false,closed=false,physicalLine=1,rowStartLine=1;
    for(let i=0;i<src.length;i++){
      const ch=src[i],next=src[i+1];
      if(quoted){
        if(ch==='"'&&next==='"'){cell+='"';i++}
        else if(ch==='"'){quoted=false;closed=true}
        else{
          cell+=ch;
          if(ch==='\r'&&next==='\n'){cell+='\n';i++;physicalLine++}
          else if(ch==='\n'||ch==='\r')physicalLine++;
        }
      }else if(ch===','){
        row.push(cell);cell='';closed=false;
      }else if(ch==='\n'||ch==='\r'){
        if(ch==='\r'&&next==='\n')i++;
        row.push(cell);cell='';closed=false;
        if(row.some(v=>text(v)))matrix.push({cells:row,line:rowStartLine});
        row=[];physicalLine++;rowStartLine=physicalLine;
        if(matrix.length>maxRows+1)fail('CSV contains too many rows.');
      }else if(ch==='"'){
        if(cell.length||closed)fail('CSV contains a quote in an invalid position.');
        quoted=true;
      }else{
        if(closed&&!/\s/.test(ch))fail('Unexpected text after a quoted CSV value.');
        if(!closed)cell+=ch;
      }
    }
    if(quoted)fail('CSV has an unclosed quoted value.');
    row.push(cell);if(row.some(v=>text(v)))matrix.push({cells:row,line:rowStartLine});
    if(!matrix.length)fail('CSV has no header row.');
    const header=matrix.shift().cells,headers=header.map(h=>text(h));
    if(headers.some(h=>!h))fail('CSV headers cannot be blank.');
    const norm=headers.map(h=>h.toLowerCase());
    if(new Set(norm).size!==norm.length)fail('CSV has duplicate column names.');
    if(matrix.length>maxRows)fail('CSV contains too many rows.');
    const warnings=[],records=[];
    matrix.forEach(entry=>{
      const cells=entry.cells,line=entry.line;
      if(cells.length!==headers.length){warnings.push('Row '+line+' has '+cells.length+' columns; expected '+headers.length+'.');return}
      const item={};headers.forEach((h,i)=>item[h]=cells[i]);Object.defineProperty(item,'__novaSourceRowNumber',{value:line,enumerable:false});records.push(item);
    });
    if(!records.length)warnings.push('No valid data rows were found.');
    return {headers,rows:records,warnings,rowCount:records.length,sourceRowCount:matrix.length};
  }
  function requireField(mapping,key){
    const value=text(mapping&&mapping[key]);if(!value)fail('Choose a column for '+key+'.');return value;
  }
  function analyzeExpenses(rows,mapping){
    if(!Array.isArray(rows))fail('Expense rows must be an array.');
    const amountKey=requireField(mapping,'amount'),categoryKey=requireField(mapping,'category');
    const dateKey=text(mapping&&mapping.date),groups=new Map(),months=new Map(),categoryRows=new Map(),monthRows=new Map();let total=0,valid=0,invalid=0,invalidDates=0;
    for(let index=0;index<rows.length;index++){
      const row=rows[index],rowNumber=Number(row.__novaSourceRowNumber)||index+2,amount=number(row[amountKey]),category=text(row[categoryKey])||'Uncategorised';
      if(amount===null||amount<0){invalid++;continue}
      total+=amount;valid++;
      groups.set(category,(groups.get(category)||0)+amount);
      if(!categoryRows.has(category))categoryRows.set(category,[]);
      categoryRows.get(category).push({rowNumber,amount:round(amount)});
      const stamp=dateKey?date(row[dateKey]):null;
      if(dateKey&&stamp===null)invalidDates++;
      if(stamp!==null){const d=new Date(stamp),key=d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0');months.set(key,(months.get(key)||0)+amount);if(!monthRows.has(key))monthRows.set(key,[]);monthRows.get(key).push({rowNumber,amount:round(amount),date:text(row[dateKey])})}
    }
    const monthlyBudget=mapping&&mapping.monthlyBudget!==''&&mapping.monthlyBudget!=null?number(mapping.monthlyBudget):null;
    if(mapping&&mapping.monthlyBudget!==''&&mapping.monthlyBudget!=null&&monthlyBudget===null)fail('Monthly budget must be a valid number.');
    if(monthlyBudget!==null&&monthlyBudget<0)fail('Monthly budget cannot be negative.');
    const chronological=[...months.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
    const monthChanges=chronological.slice(1).map((entry,i)=>{const previous=chronological[i],change=entry[1]-previous[1];return {month:entry[0],previousMonth:previous[0],spend:round(entry[1]),previousSpend:round(previous[1]),change:round(change),changePct:previous[1]>0?round(change/previous[1]*100):null}});
    const spendAlerts=monthChanges.filter(x=>x.change>0&&(x.changePct===null||x.changePct>=25)).map(x=>({type:'spend-increase-review',month:x.month,change:x.change,changePct:x.changePct,sourceRows:(monthRows.get(x.month)||[]).map(y=>y.rowNumber),note:'Review this increase; it is an anomaly signal, not proof of waste.'}));
    const budgetOverruns=monthlyBudget===null?[]:chronological.filter(x=>x[1]>monthlyBudget).map(x=>({month:x[0],spend:round(x[1]),budget:round(monthlyBudget),overrun:round(x[1]-monthlyBudget),sourceRows:(monthRows.get(x[0])||[]).map(y=>y.rowNumber)}));
    return {kind:'expenses',currency:text(mapping&&mapping.currency)||'Not specified',total:round(total),validRows:valid,invalidRows:invalid,invalidDateRows:invalidDates,byCategory:sortedMap(groups),byMonth:sortedMap(months),evidenceByCategory:[...categoryRows.entries()].map(([name,items])=>({name,sourceRows:items.map(x=>x.rowNumber),rowCount:items.length})),evidenceByMonth:[...monthRows.entries()].map(([month,items])=>({month,sourceRows:items.map(x=>x.rowNumber),rowCount:items.length})),monthChanges,monthlyBudget:monthlyBudget===null?null:round(monthlyBudget),budgetOverruns,spendAlerts,coverage:rows.length?round(valid/rows.length*100):0,note:'Spend increases and budget overruns are review signals only; they do not prove fraud, waste or avoidable cost.'};
  }
  function analyzeClients(rows,mapping){
    if(!Array.isArray(rows))fail('Client rows must be an array.');
    const clientKey=requireField(mapping,'client'),revenueKey=requireField(mapping,'revenue'),costKey=requireField(mapping,'directCost');
    const groups=new Map(),sourceRows=new Map();let valid=0,invalid=0;
    for(let index=0;index<rows.length;index++){
      const row=rows[index],rowNumber=Number(row.__novaSourceRowNumber)||index+2,name=text(row[clientKey])||'Unassigned',revenue=number(row[revenueKey]),cost=number(row[costKey]);
      if(revenue===null||cost===null||revenue<0||cost<0){invalid++;continue}
      const g=groups.get(name)||{client:name,revenue:0,directCost:0};g.revenue+=revenue;g.directCost+=cost;groups.set(name,g);if(!sourceRows.has(name))sourceRows.set(name,[]);sourceRows.get(name).push(rowNumber);valid++;
    }
    const clients=[...groups.values()].map(g=>({client:g.client,revenue:round(g.revenue),directCost:round(g.directCost),contribution:round(g.revenue-g.directCost),marginPct:g.revenue?round((g.revenue-g.directCost)/g.revenue*100):null})).sort((a,b)=>b.contribution-a.contribution);
    return {kind:'clients',validRows:valid,invalidRows:invalid,clients,evidenceByClient:[...sourceRows.entries()].map(([client,sourceRows])=>({client,sourceRows,rowCount:sourceRows.length})),totalRevenue:round(clients.reduce((s,x)=>s+x.revenue,0)),totalDirectCost:round(clients.reduce((s,x)=>s+x.directCost,0)),totalContribution:round(clients.reduce((s,x)=>s+x.contribution,0)),note:'Contribution is revenue minus supplied direct costs only; overhead, tax and other unprovided costs are excluded.'};
  }
  function analyzeTasks(rows,mapping,nowValue){
    if(!Array.isArray(rows))fail('Task rows must be an array.');
    const statusKey=requireField(mapping,'status'),teamKey=text(mapping&&mapping.team),createdKey=text(mapping&&mapping.createdAt),completedKey=text(mapping&&mapping.completedAt),dueKey=text(mapping&&mapping.dueDate);
    const now=nowValue==null?Date.now():date(nowValue);if(now===null)fail('Reference date must be an ISO date.');
    const done=/^(done|complete|completed|closed|resolved)$/i,teams=new Map();let completed=0,overdue=0,open=0,cycleTotal=0,cycleCount=0,invalidDates=0,invalidRows=0;
    for(let index=0;index<rows.length;index++){
      const row=rows[index],status=text(row[statusKey]);if(!status){invalidRows++;continue}
      const isDone=done.test(status),team=teamKey?(text(row[teamKey])||'Unassigned'):'All teams';
      const g=teams.get(team)||{team,total:0,completed:0,open:0,overdue:0,cycleDays:[],sourceRows:[]};g.total++;g.sourceRows.push(Number(row.__novaSourceRowNumber)||index+2);
      if(isDone){completed++;g.completed++;const a=createdKey?date(row[createdKey]):null,b=completedKey?date(row[completedKey]):null;if(a!==null&&b!==null&&b>=a){const days=(b-a)/86400000;cycleTotal+=days;cycleCount++;g.cycleDays.push(days)}else if(createdKey||completedKey)invalidDates++}
      else{open++;g.open++;const due=dueKey?deadlineDate(row[dueKey]):null;if(dueKey&&due===null)invalidDates++;if(due!==null&&due<now){overdue++;g.overdue++}}
      teams.set(team,g);
    }
    const sourceRows=rows.length,total=sourceRows-invalidRows;
    return {kind:'tasks',total,sourceRows,validRows:total,invalidRows,completed,open,overdue,completionPct:total?round(completed/total*100):0,overdueOpenPct:open?round(overdue/open*100):0,averageCycleDays:cycleCount?round(cycleTotal/cycleCount,2):null,invalidDateRows:invalidDates,byTeam:[...teams.values()].map(g=>({team:g.team,total:g.total,completed:g.completed,open:g.open,overdue:g.overdue,averageCycleDays:g.cycleDays.length?round(g.cycleDays.reduce((a,b)=>a+b,0)/g.cycleDays.length,2):null,sourceRows:g.sourceRows})).sort((a,b)=>a.team.localeCompare(b.team)),note:'Team-level operational indicators only. They do not measure individual employee effort or performance.'};
  }
  function scoreProjectRisk(project,nowValue){
    const p=project||{},due=deadlineDate(p.dueDate),reference=nowValue==null?Date.now():date(nowValue);
    if(due===null)fail('A valid ISO due date is required for project risk review.');
    if(reference===null)fail('Reference date must be an ISO date.');
    const progress=number(p.progressPct);if(progress===null||progress<0||progress>100)fail('Progress must be between 0 and 100.');
    const blockers=number(p.blockers==null?0:p.blockers);if(blockers===null||blockers<0)fail('Blocker count must be a non-negative number.');
    const daysLeft=(due-reference)/86400000,remaining=100-progress,factors=[];let score=0;
    if(daysLeft<0){score+=35;factors.push({factor:'Deadline passed',points:35})}
    else if(daysLeft<=7&&remaining>20){score+=25;factors.push({factor:'Due within 7 days with more than 20% remaining',points:25})}
    else if(daysLeft<=30&&remaining>50){score+=15;factors.push({factor:'Due within 30 days with more than 50% remaining',points:15})}
    if(blockers>0){const pts=Math.min(30,blockers*10);score+=pts;factors.push({factor:'Open blockers',points:pts})}
    if(remaining>=75){score+=20;factors.push({factor:'At least 75% of work remains',points:20})}
    score=Math.min(100,score);
    return {kind:'project-risk',score,band:score>=60?'High':score>=30?'Medium':'Low',daysUntilDue:round(daysLeft,1),progressPct:progress,blockers,confidence:'Heuristic only — not a trained or calibrated probability.',factors};
  }
  function simulateScenario(input){
    const x=input||{},baseline=number(x.monthlyBaseline),share=number(x.automationSharePct),realization=number(x.realizationPct==null?100:x.realizationPct),oneTime=number(x.oneTimeCost==null?0:x.oneTimeCost),months=number(x.horizonMonths==null?12:x.horizonMonths);
    if(baseline===null||baseline<0)fail('Monthly baseline must be a non-negative number.');
    if(share===null||share<0||share>100)fail('Automation share must be between 0 and 100%.');
    if(realization===null||realization<0||realization>100)fail('Realization assumption must be between 0 and 100%.');
    if(oneTime===null||oneTime<0)fail('One-time cost must be non-negative.');
    if(months===null||!Number.isInteger(months)||months<1||months>60)fail('Scenario horizon must be 1 to 60 months.');
    const potential=baseline*share/100,monthly=potential*realization/100,total=monthly*months-oneTime;
    return {kind:'scenario',currency:text(x.currency)||'Not specified',monthlyBaseline:round(baseline),automationSharePct:share,realizationPct:realization,assumedMonthlyGrossSaving:round(monthly),oneTimeCost:round(oneTime),horizonMonths:months,estimatedNetImpact:round(total),breakEvenMonths:monthly>0?round(oneTime/monthly,2):null,formula:'monthly baseline × automation share × realization assumption; net impact = monthly gross saving × horizon − one-time cost',label:'Illustrative scenario based on user-entered assumptions, not a forecast or guaranteed saving.'};
  }
  function fingerprint(value){
    const bytes=new TextEncoder().encode(typeof value==='string'?value:JSON.stringify(value));
    let hash=14695981039346656037n;
    for(const byte of bytes){hash^=BigInt(byte);hash=BigInt.asUintN(64,hash*1099511628211n)}
    return 'fnv1a64:'+hash.toString(16).padStart(16,'0');
  }
  function makeProof(checks,metadata){
    if(!Array.isArray(checks))fail('Proof checks must be an array.');
    const items=checks.map((c,i)=>({id:text(c&&c.id)||'check-'+(i+1),label:text(c&&c.label)||'Check '+(i+1),passed:!!(c&&c.passed),evidence:text(c&&c.evidence)}));
    return {kind:'action-proof',createdAt:new Date().toISOString(),metadata:metadata||{},passed:items.filter(x=>x.passed).length,failed:items.filter(x=>!x.passed).length,total:items.length,status:items.length&&items.every(x=>x.passed)?'PASS':'INCOMPLETE',checks:items,note:'This proves only that the listed software checks ran and passed; it does not prove real-world savings or business outcomes.'};
  }
  function sortedMap(map){return [...map.entries()].map(([name,value])=>({name,value:round(value)})).sort((a,b)=>b.value-a.value)}
  function round(n,places){if(!Number.isFinite(n))fail('Calculation exceeded the supported numeric range.');const p=10**(places==null?2:places),result=Math.round((n+Number.EPSILON)*p)/p;if(!Number.isFinite(result))fail('Calculation exceeded the supported numeric range.');return result}
  return Object.freeze({parseCSV,analyzeExpenses,analyzeClients,analyzeTasks,scoreProjectRisk,simulateScenario,makeProof,fingerprint,number,date,MAX_CSV_BYTES,MAX_ROWS});
});
