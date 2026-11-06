import { readFileSync } from 'node:fs';
const suite=JSON.parse(readFileSync('scripts/ai-evaluation-cases.json','utf8'));
if(suite.version!==1||!Array.isArray(suite.cases)||suite.cases.length!==60)throw new Error('AI evaluation suite must contain exactly 60 cases');
const ids=new Set(),counts={};
for(const c of suite.cases){
 if(!/^NOVA-\d{3}$/.test(c.id)||ids.has(c.id))throw new Error('Invalid or duplicate AI evaluation case id: '+c.id);
 ids.add(c.id);counts[c.category]=(counts[c.category]||0)+1;
 if(!['en','hi','hinglish'].includes(c.language)||!c.prompt?.trim()||!c.pass_criteria?.trim())throw new Error('Incomplete AI evaluation case: '+c.id);
}
for(const category of ['language','honesty','india','math','learning','coding','tools','privacy'])if(counts[category]!==[8,8,8,8,8,8,6,6][['language','honesty','india','math','learning','coding','tools','privacy'].indexOf(category)])throw new Error('Unexpected case count for '+category);
console.log('PASS 60-case AI evaluation fixture structure: '+JSON.stringify(counts));
console.log('NOTE: This validates the test set only; live model scoring requires explicit API-credit approval.');
