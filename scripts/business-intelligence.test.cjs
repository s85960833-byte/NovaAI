'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {readFileSync}=require('node:fs');
const core=require('../nova-business-core.js');
const LF=String.fromCharCode(10),CRLF=String.fromCharCode(13,10);
test('CSV parses quoted commas, escaped quotes and CRLF',()=>{
 const r=core.parseCSV(['Name,Note,Amount','Acme,"Support, hosting",1200','Widget,"said ""hello""",25',''].join(CRLF));
 assert.deepEqual(r.headers,['Name','Note','Amount']);assert.equal(r.rows[0].Note,'Support, hosting');assert.equal(r.rows[1].Note,'said "hello"');
});
test('CSV rejects malformed quotes and duplicate headers',()=>{
 assert.throws(()=>core.parseCSV(['a,b','"x,2'].join(LF)),/unclosed quoted/);
 assert.throws(()=>core.parseCSV(['A,a','1,2'].join(LF)),/duplicate column/);
});
test('CSV flags inconsistent row widths without silently mapping them',()=>{
 const r=core.parseCSV(['a,b','1,2','3'].join(LF));assert.equal(r.rowCount,1);assert.equal(r.warnings.length,1);
});
test('expense analysis totals categories and months with invalid-row accounting',()=>{
 const r=core.analyzeExpenses([{date:'2026-01-03',category:'Cloud',amount:'100.50'},{date:'2026-01-14',category:'Cloud',amount:'50'},{date:'bad',category:'Travel',amount:'-2'},{date:'bad',category:'Cloud',amount:'10'}],{date:'date',category:'category',amount:'amount',currency:'INR'});
 assert.equal(r.total,160.5);assert.equal(r.validRows,3);assert.equal(r.invalidRows,1);assert.equal(r.invalidDateRows,1);assert.equal(r.byCategory[0].name,'Cloud');assert.equal(r.byMonth[0].name,'2026-01');
});
test('client profitability excludes invalid rows and labels contribution honestly',()=>{
 const r=core.analyzeClients([{client:'A',revenue:'1000',cost:'600'},{client:'B',revenue:'500',cost:'700'},{client:'C',revenue:'bad',cost:'1'}],{client:'client',revenue:'revenue',directCost:'cost'});
 assert.equal(r.totalContribution,200);assert.equal(r.clients[1].contribution,-200);assert.equal(r.invalidRows,1);assert.match(r.note,/overhead, tax/);
});
test('task analytics only produces team-level indicators',()=>{
 const r=core.analyzeTasks([{team:'Alpha',status:'Done',created:'2026-01-01',completed:'2026-01-03',due:'2026-01-02'},{team:'Alpha',status:'Open',created:'2026-01-01',completed:'',due:'2026-01-02'}],{team:'team',status:'status',createdAt:'created',completedAt:'completed',dueDate:'due'},'2026-01-04');
 assert.equal(r.completed,1);assert.equal(r.open,1);assert.equal(r.overdue,1);assert.equal(r.averageCycleDays,2);assert.match(r.note,/Team-level/);
});
test('project risk is heuristic and validates inputs',()=>{
 const r=core.scoreProjectRisk({dueDate:'2026-01-01',progressPct:10,blockers:2},'2026-01-05');
 assert.equal(r.score,75);assert.equal(r.band,'High');assert.match(r.confidence,/not a trained/);
 assert.throws(()=>core.scoreProjectRisk({dueDate:'yesterday',progressPct:20},'2026-01-01'),/ISO due date/);
});
test('scenario math is deterministic and validates assumptions',()=>{
 const r=core.simulateScenario({monthlyBaseline:100000,automationSharePct:20,realizationPct:50,oneTimeCost:10000,horizonMonths:12,currency:'INR'});
 assert.equal(r.assumedMonthlyGrossSaving,10000);assert.equal(r.estimatedNetImpact,110000);assert.equal(r.breakEvenMonths,1);
 assert.throws(()=>core.simulateScenario({monthlyBaseline:100,automationSharePct:120}),/between 0 and 100/);
});
test('action proof never marks incomplete checks as passed',()=>{
 const r=core.makeProof([{id:'csv',passed:true,evidence:'3 rows checked'},{id:'formula',passed:false,evidence:'failed'}],{dataset:'fixture'});
 assert.equal(r.status,'INCOMPLETE');assert.equal(r.passed,1);assert.equal(r.failed,1);assert.match(r.note,/does not prove real-world savings/);
});
test('CSV import enforces configurable byte and row limits',()=>{
 assert.throws(()=>core.parseCSV(['a','1'].join(LF),{maxBytes:1}),/import limit/);
 assert.throws(()=>core.parseCSV(['a','1','2'].join(LF),{maxRows:1}),/too many rows/);
});
test('business workspace does not upload or persist raw company CSV data',()=>{
 const ui=readFileSync(path.join(__dirname,'..','nova-business.js'),'utf8');
 assert.equal(ui.includes('fetch('),false);assert.equal(ui.includes('XMLHttpRequest'),false);assert.equal(ui.includes('localStorage'),false);
 assert.equal(ui.includes('Raw rows are not uploaded to NOVA'),true);
});
test('invalid numeric values are never silently treated as zero',()=>{
 assert.equal(core.number('not-a-number'),null);assert.equal(core.number('Infinity'),null);
 const r=core.analyzeExpenses([{amount:'bad',category:'Cloud'}],{amount:'amount',category:'category'});
 assert.equal(r.validRows,0);assert.equal(r.invalidRows,1);assert.equal(r.total,0);
 assert.throws(()=>core.analyzeExpenses([],{ }),/Choose a column for amount/);
});

test('expense analysis flags budget overruns and large month-to-month increases as review signals',()=>{
 const r=core.analyzeExpenses([{d:'2026-01-02',c:'Cloud',a:'100'},{d:'2026-02-02',c:'Cloud',a:'140'},{d:'2026-03-02',c:'Cloud',a:'90'}],{date:'d',category:'c',amount:'a',monthlyBudget:'120'});
 assert.equal(r.budgetOverruns.length,1);assert.equal(r.budgetOverruns[0].overrun,20);assert.equal(r.spendAlerts.length,1);assert.equal(r.spendAlerts[0].changePct,40);assert.match(r.note,/do not prove fraud/);
});
