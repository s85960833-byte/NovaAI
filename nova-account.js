(()=>{'use strict';
const PROJECT_URL='https://qrfwsewppafhxibdboam.supabase.co';
const SYNC_KEY='nova-cloud-sync-enabled';
const $=id=>document.getElementById(id);
const mount=$('novaAccountMount'),dialog=$('novaAccountDialog');
if(!mount||!dialog)return;
let client=null,user=null,session=null,recovery=false,suppressSync=false,timer=null,busy=false;
const say=(message,error=false)=>{const n=$('novaAccountStatus');if(n){n.textContent=message;n.dataset.error=error?'true':'false'}};
const enabled=()=>{try{return localStorage.getItem(SYNC_KEY)==='true'}catch(e){return false}};
const setEnabled=value=>{try{if(value)localStorage.setItem(SYNC_KEY,'true');else localStorage.removeItem(SYNC_KEY)}catch(e){throw new Error('This browser does not allow local sync preferences to be saved.')}};
function getClient(){
 if(client)return client;
 if(!window.NovaBusinessCloud?.getClient)throw new Error('Account service is not ready. Refresh and try again.');
 client=window.NovaBusinessCloud.getClient();
 return client;
}
function showDialog(){dialog.showModal();$('novaAccountEmailInput').focus()}
function render(){
 const signed=!!user;
 $('novaSignedOut').hidden=signed||recovery;
 $('novaSignedIn').hidden=!signed||recovery;
 $('novaRecoveryForm').hidden=!recovery;
 $('novaAccountEmail').textContent=user?.email||'';
 $('novaCloudSync').checked=enabled();
 $('novaAccountOpen').textContent=signed?'Account: '+(user.email||'Signed in'):'Sign in / Create account';
 if(!signed&&!recovery)say('Sign in to enable optional cross-device chat sync. Your chats remain on this device unless you turn sync on.');
 if(signed&&!recovery)say(enabled()?'Cloud sync is enabled for this account.':'Signed in. Cloud sync is OFF until you enable it.');
}
function cleanSnapshot(){
 const raw=window.NovaWorkspaceActions?.getAccountSnapshot?.();
 if(!raw||typeof raw!=='object')throw new Error('NOVA workspace is not ready yet.');
 const payload={schema_version:1,chats:Array.isArray(raw.chats)?raw.chats.slice(-40):[],mem:String(raw.mem||'').slice(0,1500),ci:String(raw.ci||'').slice(0,800)};
 const bytes=new TextEncoder().encode(JSON.stringify(payload)).length;
 if(bytes>700000)throw new Error('Your cloud backup is too large. Export a local backup and remove large documents before syncing.');
 return payload;
}
async function syncNow(){
 if(!user||!enabled()||busy)return;
 busy=true;say('Syncing your chats…');
 try{
  const c=getClient();
  const {data:remote,error:readError}=await c.from('nova_user_workspaces').select('payload,updated_at').eq('user_id',user.id).maybeSingle();
  if(readError)throw readError;
  if(remote?.payload){
   suppressSync=true;
   try{window.NovaWorkspaceActions?.applyAccountSnapshot?.(remote.payload)}finally{suppressSync=false}
  }
  const payload=cleanSnapshot();
  const {error:writeError}=await c.from('nova_user_workspaces').upsert({user_id:user.id,payload,schema_version:1,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(writeError)throw writeError;
  say('Synced successfully · '+new Date().toLocaleTimeString());
 }catch(e){say(e.message||'Cloud sync failed. Your local chats are still available.',true)}
 finally{busy=false}
}
function scheduleSync(){
 if(suppressSync||!user||!enabled())return;
 clearTimeout(timer);
 timer=setTimeout(()=>syncNow(),1400);
}
async function boot(){
 try{
  const c=getClient();
  c.auth.onAuthStateChange((event,nextSession)=>{
   session=nextSession;user=nextSession?.user||null;recovery=event==='PASSWORD_RECOVERY';
   render();
   if(user&&enabled()&&!recovery)queueMicrotask(()=>syncNow());
  });
  const {data,error}=await c.auth.getSession();
  if(error)throw error;
  session=data.session;user=session?.user||null;render();
  if(user&&enabled())await syncNow();
 }catch(e){say(e.message||'Account service unavailable.',true)}
}
mount.innerHTML='<button id="novaAccountOpen" type="button" class="sbtn">Sign in / Create account</button><small class="nova-account-hint">Optional account. Chat sync is off by default. / वैकल्पिक खाता; चैट सिंक डिफ़ॉल्ट रूप से बंद है।</small>';
dialog.innerHTML='<div class="ptop"><b>NOVA Account / NOVA खाता</b><button id="novaAccountClose" type="button" aria-label="Close">✕</button></div><p id="novaAccountStatus" role="status" aria-live="polite"></p><section id="novaSignedOut"><form id="novaAuthForm"><label>Email<input id="novaAccountEmailInput" type="email" autocomplete="email" maxlength="254" required></label><label>Password<input id="novaAccountPasswordInput" type="password" autocomplete="current-password" minlength="10" maxlength="128" required></label><div class="row"><button id="novaSignIn" type="button">Sign in</button><button id="novaSignUp" type="button">Create account</button></div><button id="novaForgot" type="button">Forgot password?</button><button id="novaResend" type="button">Resend confirmation email</button></form></section><section id="novaSignedIn" hidden><p>Signed in as <b id="novaAccountEmail"></b></p><label class="sw"><input id="novaCloudSync" type="checkbox"><span>Sync my chats to my account / मेरी चैट अकाउंट से सिंक करें</span></label><p class="nova-account-hint">Only text, titles and memory are synced. Image attachments are excluded. Disable sync to stop future uploads; use Delete cloud backup to erase the saved copy.</p><div class="row"><button id="novaSyncNow" type="button">Sync now</button><button id="novaDeleteCloud" type="button" class="danger">Delete cloud backup</button></div><button id="novaSignOut" type="button">Sign out</button></section><form id="novaRecoveryForm" hidden><label>New password<input id="novaNewPassword" type="password" minlength="10" maxlength="128" autocomplete="new-password" required></label><button id="novaUpdatePassword" type="submit">Update password</button></form><p class="nova-account-hint">Use a unique password. Account confirmation and recovery emails depend on the project's email delivery settings.</p>';
$('novaAccountOpen').addEventListener('click',showDialog);
$('novaAccountClose').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
const email=()=>$('novaAccountEmailInput').value.trim().toLowerCase();
const password=()=>$('novaAccountPasswordInput').value;
$('novaSignIn').addEventListener('click',async()=>{
 if(!$('novaAuthForm').reportValidity())return;
 try{say('Signing in…');const {error}=await getClient().auth.signInWithPassword({email:email(),password:password()});if(error)throw error;say('Signed in successfully.');}catch(e){say(e.message,true)}
});
$('novaSignUp').addEventListener('click',async()=>{
 if(!$('novaAuthForm').reportValidity())return;
 try{say('Creating account…');const {data,error}=await getClient().auth.signUp({email:email(),password:password(),options:{emailRedirectTo:location.origin}});if(error)throw error;if(data.session){say('Account created and signed in.')}else{say('Account request received. Check your email to confirm before signing in.')} }catch(e){say(e.message,true)}
});
$('novaForgot').addEventListener('click',async()=>{
 if(!$('novaAccountEmailInput').reportValidity())return;
 try{const {error}=await getClient().auth.resetPasswordForEmail(email(),{redirectTo:location.origin});if(error)throw error;say('If the address is registered, a password recovery email has been sent.');}catch(e){say(e.message,true)}
});
$('novaResend').addEventListener('click',async()=>{
 if(!$('novaAccountEmailInput').reportValidity())return;
 try{const {error}=await getClient().auth.resend({type:'signup',email:email(),options:{emailRedirectTo:location.origin}});if(error)throw error;say('If confirmation is pending, a new email has been requested.');}catch(e){say(e.message,true)}
});
$('novaRecoveryForm').addEventListener('submit',async e=>{
 e.preventDefault();
 try{const {error}=await getClient().auth.updateUser({password:$('novaNewPassword').value});if(error)throw error;recovery=false;$('novaNewPassword').value='';render();say('Password updated.');}catch(x){say(x.message,true)}
});
$('novaCloudSync').addEventListener('change',async e=>{
 if(e.target.checked){
  if(!confirm('Enable cloud sync? Chat text, titles and memory will be stored in your NOVA account. Image attachments are excluded.')){
   e.target.checked=false;return;
  }
  try{setEnabled(true)}catch(err){e.target.checked=false;say(err.message,true);return}await syncNow();
 }else{
  setEnabled(false);say('Cloud sync is off. The saved cloud copy remains until you delete it.');
 }
});
$('novaSyncNow').addEventListener('click',syncNow);
$('novaDeleteCloud').addEventListener('click',async()=>{
 if(!user||!confirm('Delete the cloud chat backup for this account? Local chats on this device will remain.'))return;
 try{const {error}=await getClient().from('nova_user_workspaces').delete().eq('user_id',user.id);if(error)throw error;setEnabled(false);$('novaCloudSync').checked=false;say('Cloud backup deleted. Local chats remain.');}catch(e){say(e.message,true)}
});
$('novaSignOut').addEventListener('click',async()=>{
 try{const {error}=await getClient().auth.signOut();if(error)throw error;setEnabled(false);say('Signed out.');}catch(e){say(e.message,true)}
});
window.addEventListener('nova:state-saved',scheduleSync);
boot();
})();