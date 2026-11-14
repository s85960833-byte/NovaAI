'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {mergeMessages}=require('../nova-sync-merge.js');
const m=(r,c)=>({r,c});
test('appends local messages after the shared remote history',()=>{assert.deepEqual(mergeMessages([m('user','a'),m('assistant','b')],[m('user','a'),m('assistant','b'),m('user','c')]),[m('user','a'),m('assistant','b'),m('user','c')])});
test('preserves legitimate repeated identical messages',()=>{assert.deepEqual(mergeMessages([m('user','same'),m('assistant','ok')],[m('user','same'),m('assistant','ok'),m('user','same')]),[m('user','same'),m('assistant','ok'),m('user','same')])});
test('keeps divergent histories rather than globally deduplicating',()=>{assert.deepEqual(mergeMessages([m('user','a'),m('assistant','remote')],[m('user','a'),m('assistant','local')]),[m('user','a'),m('assistant','remote'),m('assistant','local')])});
test('handles missing and malformed inputs',()=>{assert.deepEqual(mergeMessages(null,[m('user','local')]),[m('user','local')]);assert.deepEqual(mergeMessages([null,{},m('user','ok')],null),[m('assistant',''),m('user','ok')])});
test('caps merged history at 150 messages',()=>{const remote=Array.from({length:100},(_,i)=>m(i%2?'assistant':'user',String(i)));const local=[...remote,...Array.from({length:80},(_,i)=>m(i%2?'assistant':'user','new'+i))];assert.equal(mergeMessages(remote,local).length,150)});

test('merges deletion tombstones from both devices without duplicates',()=>{
 const {mergeDeletedIds}=require('../nova-sync-merge.js');
 assert.deepEqual(mergeDeletedIds(['chat-a','chat-b'],['chat-b','chat-c']),['chat-a','chat-b','chat-c']);
});
test('bounds deletion tombstones and normalizes malformed identifiers',()=>{
 const {mergeDeletedIds}=require('../nova-sync-merge.js');
 assert.deepEqual(mergeDeletedIds([null,'','x'.repeat(200)],['local'],2),['x'.repeat(120),'local']);
});

test('selects the newest chats from the newest-first workspace list',()=>{
 const {selectRecentChats}=require('../nova-sync-merge.js');
 const chats=Array.from({length:50},(_,i)=>({id:String(i)}));
 assert.deepEqual(selectRecentChats(chats,40),chats.slice(0,40));
 assert.deepEqual(selectRecentChats(chats,5),chats.slice(0,5));
 assert.deepEqual(selectRecentChats(null,40),[]);
});

test('propagates explicit empty memory and custom-instruction values by timestamp',()=>{
 const {mergeSnapshotField}=require('../nova-sync-merge.js');
 assert.deepEqual(mergeSnapshotField('',200,'previous memory',100,1500),{value:'',updatedAt:200});
 assert.deepEqual(mergeSnapshotField('',300,'previous instructions',100,800),{value:'',updatedAt:300});
 assert.deepEqual(mergeSnapshotField(undefined,0,'local fallback',200,20),{value:'local fallback',updatedAt:200});
});
test('does not resurrect a document explicitly removed on the local device',()=>{
 const {mergeChatDocument}=require('../nova-sync-merge.js');
 assert.equal(mergeChatDocument({doc:{n:'remote.pdf',t:'remote text'}},{doc:null}),null);
});
test('uses remote document when the local chat has no document field',()=>{
 const {mergeChatDocument}=require('../nova-sync-merge.js');
 assert.deepEqual(mergeChatDocument({doc:{n:'remote.pdf',t:'remote text'}}, {id:'chat-1'}),{n:'remote.pdf',t:'remote text'});
});
test('prefers the local document when both devices have one',()=>{
 const {mergeChatDocument}=require('../nova-sync-merge.js');
 assert.deepEqual(mergeChatDocument({doc:{n:'remote.pdf',t:'remote'}},{doc:{n:'local.pdf',t:'local'}}),{n:'local.pdf',t:'local'});
});

test('uses newer field timestamps so explicit empty values sync as deletions',()=>{
 const {mergeSnapshotField}=require('../nova-sync-merge.js');
 assert.deepEqual(mergeSnapshotField('',200,'old memory',100,1500),{value:'',updatedAt:200});
 assert.deepEqual(mergeSnapshotField('remote',100,'local edit',200,1500),{value:'local edit',updatedAt:200});
});
test('loads legacy remote field values when the local field is empty and timestamps are absent',()=>{
 const {mergeSnapshotField}=require('../nova-sync-merge.js');
 assert.deepEqual(mergeSnapshotField('legacy remote',0,'',0,800),{value:'legacy remote',updatedAt:0});
});
test('keeps local field values on timestamp ties and bounds text',()=>{
 const {mergeSnapshotField}=require('../nova-sync-merge.js');
 assert.deepEqual(mergeSnapshotField('remote value',100,'local value',100,5),{value:'local',updatedAt:100});
});
