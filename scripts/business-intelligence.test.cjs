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
test('strict ISO dates reject impossible calendar dates',()=>{
 assert.equal(core.date('2026-02-28')!==null,true);
 assert.equal(core.date('2026-02-31'),null);
 assert.equal(core.date('2026-13-01'),null);
});
test('task analytics excludes blank statuses and reports coverage',()=>{
 const r=core.analyzeTasks([{team:'A',status:'Done',created:'2026-01-01',completed:'2026-01-03'},{team:'A',status:'',created:'2026-01-01',completed:''},{team:'B',status:'Open'}],{team:'team',status:'status',createdAt:'created',completedAt:'completed'},'2026-01-04');
 assert.equal(r.sourceRows,3);assert.equal(r.total,2);assert.equal(r.validRows,2);assert.equal(r.invalidRows,1);assert.equal(r.completionPct,50);
});
test('numeric overflow fails safely instead of exporting Infinity',()=>{
 assert.throws(()=>core.simulateScenario({monthlyBaseline:1e308,automationSharePct:100,realizationPct:100,horizonMonths:60}),/numeric range/);
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

test('dataset fingerprint is stable for identical input and changes when input changes',()=>{
 const a=core.fingerprint([{amount:10},{amount:20}]);
 assert.equal(a,core.fingerprint([{amount:10},{amount:20}]));
 assert.notEqual(a,core.fingerprint([{amount:10},{amount:21}]));
 assert.match(a,/^fnv1a64:/);
});
test('dashboard surfaces dataset coverage and readable project risk factors',()=>{
 const ui=readFileSync(path.join(__dirname,'..','nova-business.js'),'utf8');
 assert.match(ui,/function qualitySummary\(/);
 assert.match(ui,/Calculation coverage/);
 assert.match(ui,/Contributing factors/);
 assert.match(ui,/aria-live="polite"/);
});

test('expense findings cite original CSV source rows, including after malformed lines',()=>{
 const parsed=core.parseCSV(['date,category,amount','2026-01-01,Cloud,100','bad,row','2026-02-01,Cloud,150'].join(LF));
 const r=core.analyzeExpenses(parsed.rows,{date:'date',category:'category',amount:'amount'});
 assert.deepEqual(r.evidenceByCategory[0].sourceRows,[2,4]);
 assert.deepEqual(r.evidenceByMonth.map(x=>x.sourceRows[0]),[2,4]);
 assert.equal(r.spendAlerts[0].sourceRows[0],4);
});

test('client profitability findings retain source-row references',()=>{
 const parsed=core.parseCSV(['client,revenue,cost','A,1000,600','B,500,700','A,200,50'].join(LF));
 const r=core.analyzeClients(parsed.rows,{client:'client',revenue:'revenue',directCost:'cost'});
 assert.deepEqual(r.evidenceByClient.find(x=>x.client==='A').sourceRows,[2,4]);
 assert.equal(r.evidenceByClient.find(x=>x.client==='A').rowCount,2);
});
test('team productivity results retain source-row references',()=>{
 const parsed=core.parseCSV(['team,status','Alpha,Done','Beta,Open','Alpha,Open'].join(LF));
 const r=core.analyzeTasks(parsed.rows,{team:'team',status:'status'},'2026-01-01');
 assert.deepEqual(r.byTeam.find(x=>x.team==='Alpha').sourceRows,[2,4]);
});

test('business dialog supports keyboard focus management and visible focus styles',()=>{
 const ui=readFileSync(path.join(__dirname,'..','nova-business.js'),'utf8');
 assert.match(ui,/aria-modal/);
 assert.match(ui,/if\(e\.key==='Tab'\)/);
 assert.match(ui,/returnFocus\.focus\(\)/);
 assert.match(ui,/focus-visible/);
 assert.match(ui,/aria-current=/);
});

test('tenant schema draft enables RLS on every business table and scopes access by active membership',()=>{
 const migration=readFileSync(path.join(__dirname,'..','supabase','migrations','20261101000000_nova_bi_tenant_schema.sql'),'utf8');
 const followup=readFileSync(path.join(__dirname,'..','supabase','migrations','20261101000001_nova_bi_workflow_execution_hardening.sql'),'utf8');
 const corrections=readFileSync(path.join(__dirname,'..','supabase','migrations','20261101000002_nova_bi_rls_policy_corrections.sql'),'utf8');
 for(const table of ['nova_bi_organizations','nova_bi_memberships','nova_bi_datasets','nova_bi_analyses','nova_bi_workflow_proposals','nova_bi_workflow_approvals','nova_bi_audit_events']){
   assert.ok(migration.includes('alter table public.'+table+' enable row level security'),'RLS missing for '+table);
 }
 assert.ok(followup.includes('alter table public.nova_bi_workflow_executions enable row level security'));
 assert.ok(migration.includes("m.user_id = (select auth.uid()) and m.status = 'active'"));
 assert.ok(migration.includes('foreign key (organization_id, dataset_id)'));
 assert.ok(migration.includes('foreign key (organization_id, proposal_id)'));
 assert.ok(migration.includes('from anon, authenticated'));
 assert.match(migration,/no client policies for membership writes/i);
 assert.ok(followup.includes('revoke update on public.nova_bi_datasets from authenticated'));
 assert.ok(followup.includes('grant update (name, deleted_at) on public.nova_bi_datasets to authenticated'));
 assert.ok(corrections.includes('m.organization_id = nova_bi_organizations.id'));
 assert.ok(corrections.includes('grant update (name) on public.nova_bi_datasets to authenticated'));
 assert.ok(corrections.includes('revoke update (deleted_at) on public.nova_bi_datasets from authenticated'));
});

test('CSV source-row evidence preserves physical line numbers across blank and quoted multiline records',()=>{
 const parsed=core.parseCSV('name,note,amount\nAcme,"line one\nline two",10\n\nBeta,ok,20');
 assert.deepEqual(parsed.rows.map(row=>row.__novaSourceRowNumber),[2,5]);
 assert.equal(parsed.rows[0].note,'line one\nline two');
});
test('CSV malformed-row warnings report physical source line numbers after blank lines',()=>{
 const parsed=core.parseCSV('a,b\n1,2\n\n3\n4,5');
 assert.deepEqual(parsed.warnings,['Row 4 has 1 columns; expected 2.']);
 assert.deepEqual(parsed.rows.map(row=>row.__novaSourceRowNumber),[2,5]);
});

test('CSV file size is checked before reading the selected file into memory',()=>{
 const ui=readFileSync(path.join(__dirname,'..','nova-business.js'),'utf8');
 assert.ok(ui.indexOf('f.size>core.MAX_CSV_BYTES')<ui.indexOf('await f.text()'));
});

test('date-only task deadlines remain due through the end of their calendar day',()=>{
 const dueToday=core.analyzeTasks([{status:'Open',due:'2026-01-04'}],{status:'status',dueDate:'due'},'2026-01-04T12:00:00Z');
 const overdue=core.analyzeTasks([{status:'Open',due:'2026-01-04'}],{status:'status',dueDate:'due'},'2026-01-05T00:00:00Z');
 assert.equal(dueToday.overdue,0);
 assert.equal(overdue.overdue,1);
});
test('date-only project deadlines are not marked passed during the due date',()=>{
 const r=core.scoreProjectRisk({dueDate:'2026-01-04',progressPct:50,blockers:0},'2026-01-04T12:00:00Z');
 assert.equal(r.score,25);
 assert.ok(r.daysUntilDue>0);
 assert.equal(r.factors.some(x=>x.factor==='Deadline passed'),false);
});

test('NOVA BI company cloud uses authenticated Edge Function routes and session-scoped client auth',()=>{
 const cloud=readFileSync(path.join(__dirname,'..','nova-business-cloud.js'),'utf8');
 const edge=readFileSync(path.join(__dirname,'..','supabase','functions','nova-bi-api','index.ts'),'utf8');
 const index=readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 assert.ok(cloud.includes('sb_publishable_'));
 assert.ok(!/service_role|sb_secret_|SUPABASE_SERVICE_ROLE_KEY/.test(cloud));
 assert.ok(cloud.includes('storage:window.sessionStorage'));
 assert.ok(cloud.includes('/functions/v1/\'+CFG.fn+\'/'));
 assert.ok(edge.includes('withSupabase({ auth: "user" }'));
 assert.ok(edge.includes('ctx.jwtClaims?.sub'));
 assert.ok(edge.includes('functions\\/v1\\/nova-bi-api'));
 assert.ok(edge.includes('db.from("nova_bi_organizations")'));
 assert.ok(edge.includes('ctx.supabaseAdmin.from("nova_bi_memberships")'));
 assert.ok(edge.includes('.update({ status: input.decision })'));
 assert.ok(index.includes('@supabase/supabase-js@2.80.0'));
 assert.ok(index.includes('https://cdn.jsdelivr.net'));
});
test('NOVA BI cloud save path stores dataset metadata and aggregate analysis, not raw CSV rows',()=>{
 const cloud=readFileSync(path.join(__dirname,'..','nova-business-cloud.js'),'utf8');
 const core=readFileSync(path.join(__dirname,'..','nova-business.js'),'utf8');
 assert.ok(cloud.includes('column_names:d.headers'));
 assert.ok(cloud.includes('result_json:result'));
 assert.ok(cloud.includes('Raw CSV rows were not uploaded'));
 assert.ok(core.includes('snapshot:()=>({dataset:state.dataset,analysis:state.analysis'));
 assert.ok(!cloud.includes('rows:d.rows'));
});
test('NOVA BI Edge Function bounds request and JSON payload sizes',()=>{
 const edge=readFileSync(path.join(__dirname,'..','supabase','functions','nova-bi-api','index.ts'),'utf8');
 assert.ok(edge.includes('> 70000'));
 assert.ok(edge.includes('maxBytes = 50000'));
 assert.ok(edge.includes('.limit(100)'));
});
test('NOVA BI organization bootstrap and approval routines enforce authenticated ownership rules',()=>{
 const migration=readFileSync(path.join(__dirname,'..','supabase','migrations','20261101000003_nova_bi_authenticated_workflows.sql'),'utf8');
 const recursion=readFileSync(path.join(__dirname,'..','supabase','migrations','20261101000004_nova_bi_membership_rls_recursion_fix.sql'),'utf8');
 assert.ok(migration.includes('security definer'));
 assert.ok(migration.includes('set search_path = \'\''));
 assert.ok(migration.includes('v_creator = v_actor'));
 assert.ok(migration.includes('v_role not in (\'owner\',\'admin\')'));
 assert.ok(migration.includes('organization.created'));
 assert.ok(recursion.includes('security definer'));
 assert.ok(recursion.includes('set search_path = \'\''));
 assert.ok(recursion.includes('nova_bi_membership_read_self_or_admin'));
});

test('NOVA BI organization and workflow writes are protected by RLS and trigger guards',()=>{
 const migration=readFileSync(path.join(__dirname,'..','supabase','migrations','20261101000006_nova_bi_trigger_guarded_mutations.sql'),'utf8');
 assert.ok(migration.includes('revoke all on function public.nova_bi_create_organization(text) from public, anon, authenticated'));
 assert.ok(migration.includes('revoke all on function public.nova_bi_decide_workflow(uuid, text, text) from public, anon, authenticated'));
 assert.ok(migration.includes('nova_bi_org_insert_self'));
 assert.ok(migration.includes('new.created_by <> auth.uid()'));
 assert.ok(migration.includes('nova_bi_organization_bootstrap'));
 assert.ok(migration.includes('grant update(status) on public.nova_bi_workflow_proposals to authenticated'));
 assert.ok(migration.includes('nova_bi_workflow_decide_admin'));
 assert.ok(migration.includes('old.created_by = v_actor'));
 assert.ok(migration.includes('nova_bi_workflow_approvals'));
 assert.ok(migration.includes('nova_bi_audit_events'));
 assert.ok(migration.includes('revoke all on function public.nova_bi_workflow_decision_guard() from public, anon, authenticated'));
});

test('NOVA BI white-label settings are tenant-scoped and owner/admin writable only',()=>{
 const migration=readFileSync(path.join(__dirname,'..','supabase','migrations','20261101000007_nova_bi_white_label_branding.sql'),'utf8');
 const edge=readFileSync(path.join(__dirname,'..','supabase','functions','nova-bi-api','index.ts'),'utf8');
 const cloud=readFileSync(path.join(__dirname,'..','nova-business-cloud.js'),'utf8');
 assert.ok(migration.includes('create table if not exists public.nova_bi_branding'));
 assert.ok(migration.includes('alter table public.nova_bi_branding enable row level security'));
 assert.ok(migration.includes('nova_bi_branding_read_member'));
 assert.ok(migration.includes('nova_bi_branding_update_admin'));
 assert.ok(migration.includes('logo_url ~'));
 assert.ok(migration.includes('primary_color ~'));
 assert.ok(edge.includes('path === "branding"'));
 assert.ok(edge.includes('nova_bi_branding'));
 assert.ok(cloud.includes('White-label workspace appearance'));
 assert.ok(cloud.includes('Custom domains'));
 assert.ok(cloud.includes('primary_color'));
});

test('NOVA BI team invitations are owner/admin gated and accepted only by the invited user',()=>{
 const migration=readFileSync(path.join(__dirname,'..','supabase','migrations','20261101000008_nova_bi_team_invitations.sql'),'utf8');
 const edge=readFileSync(path.join(__dirname,'..','supabase','functions','nova-bi-api','index.ts'),'utf8');
 const cloud=readFileSync(path.join(__dirname,'..','nova-business-cloud.js'),'utf8');
 assert.ok(migration.includes('status = \'invited\''));
 assert.ok(migration.includes('old.user_id <> auth.uid()'));
 assert.ok(migration.includes('nova_bi_invite_accept_guard'));
 assert.ok(migration.includes('grant update(status) on public.nova_bi_memberships to authenticated'));
 assert.ok(edge.includes('auth.admin.inviteUserByEmail'));
 assert.ok(edge.includes('error: auditError'));
 assert.ok(edge.includes('invitation was issued, but its audit record could not be saved'));
 assert.ok(edge.includes(String.raw`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`));
 assert.ok(edge.includes(String.raw`/\s/.test(logoUrl)`));
 assert.ok(edge.includes('role === "admin" && actor.role !== "owner"'));
 assert.ok(edge.includes('path === "invitations"'));
 assert.ok(edge.includes('acceptParts[2] === "accept"'));
 assert.ok(cloud.includes('Pending company invitations'));
 assert.ok(cloud.includes('Send invitation'));
 assert.ok(cloud.includes('Accept invitation'));
});

test('NOVA BI supports explicit company JSON export and audited admin data deletion',()=>{
 const cloud=readFileSync(path.join(__dirname,'..','nova-business-cloud.js'),'utf8');
 const migration=readFileSync(path.join(__dirname,'..','supabase','migrations','20261101000009_nova_bi_data_lifecycle.sql'),'utf8');
 assert.ok(cloud.includes('Export company data (JSON)'));
 assert.ok(cloud.includes('workflow_proposals:state.data.workflows'));
 assert.ok(cloud.includes('audit_events:state.data.events'));
 assert.ok(migration.includes('nova_bi_analysis_delete_admin'));
 assert.ok(migration.includes('nova_bi_audit_delete'));
 assert.ok(migration.includes('nova_bi_analysis_audit_delete'));
 assert.ok(migration.includes('nova_bi_dataset_audit_delete'));
 assert.ok(migration.includes('nova_bi_branding_touch_updated_at'));
 const edge=readFileSync(path.join(__dirname,'..','supabase','functions','nova-bi-api','index.ts'),'utf8');
 assert.ok(edge.includes('"Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS"'));
 assert.ok(edge.includes('req.method === "DELETE" && datasetDelete'));
 assert.ok(edge.includes('req.method === "DELETE" && analysisDelete'));
 assert.ok(cloud.includes('data-delete-dataset'));
 assert.ok(cloud.includes('data-delete-analysis'));
 assert.ok(cloud.includes('Permanently delete this saved analysis?'));
 assert.ok(cloud.includes('Permanently delete this dataset metadata?'));
});


test('NOVA BI API rate limits are atomic, server-only and stricter for invitations',()=>{
 const migration=readFileSync(path.join(__dirname,'..','supabase','migrations','20261101000010_nova_bi_api_rate_limits.sql'),'utf8');
 const edge=readFileSync(path.join(__dirname,'..','supabase','functions','nova-bi-api','index.ts'),'utf8');
 assert.ok(migration.includes('create table if not exists public.nova_bi_rate_limits'));
 assert.ok(migration.includes('alter table public.nova_bi_rate_limits enable row level security'));
 assert.ok(migration.includes('revoke all on table public.nova_bi_rate_limits from public, anon, authenticated'));
 assert.ok(migration.includes('security definer'));
 assert.ok(migration.includes('set search_path = public, pg_temp'));
 assert.ok(migration.includes('revoke all on function public.nova_bi_consume_rate_limit(uuid, text, integer, integer) from public, anon, authenticated'));
 assert.ok(migration.includes('to service_role'));
 assert.ok(edge.includes('nova_bi_consume_rate_limit'));
 assert.ok(edge.includes('p_bucket: "api"'));
 assert.ok(edge.includes('p_limit: 120'));
 assert.ok(edge.includes('p_bucket: "invite"'));
 assert.ok(edge.includes('p_limit: 5'));
 assert.ok(edge.includes('return rateLimited(60)'));
 assert.ok(edge.includes('return rateLimited(3600)'));
});
