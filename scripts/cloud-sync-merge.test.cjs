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

test('selects the newest chats from the newest-first workspace list',()=>{\n const {selectRecentChats}=require('../nova-sync-merge.js');\n const chats=Array.from({length:50},(_,i)=>({id:String(i)}));\n assert.deepEqual(selectRecentChats(chats,40),chats.slice(0,40));\n assert.deepEqual(selectRecentChats(chats,5),chats.slice(0,5));\n assert.deepEqual(selectRecentChats(null,40),[]);\n});\n