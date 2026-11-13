'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'..','nova-app.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('three answer modes are exposed with a safe standard default',()=>{
 assert.match(html,/id="answerMode"/);
 for(const mode of ['quick','standard','detailed']) assert.match(html,new RegExp('value="'+mode+'"'));
 assert.match(app,/answerMode:'standard'/);
 assert.match(app,/if\(!\['quick','standard','detailed'\]\.includes\(S\.answerMode\)\)S\.answerMode='standard'/);
});
test('each answer mode adds a distinct instruction to both normal and compact prompts',()=>{
 assert.match(app,/ANSWER MODE — QUICK/);
 assert.match(app,/ANSWER MODE — STANDARD/);
 assert.match(app,/ANSWER MODE — DETAILED/);
 assert.match(app,/sysLite=sysRaw[\s\S]*answerModePrompt/);
 assert.match(app,/\$\('answerMode'\)\.onchange/);
});
