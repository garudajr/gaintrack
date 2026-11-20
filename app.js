const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10),today=()=>iso(new Date());
const KEY='gaintrack_v1';let S,cur=today(),view='tracker',ref=null,snap=null,tt,rt,ch,user=null,pendingName='',obGo=false,anim=false;
window.OneSignalDeferred=window.OneSignalDeferred||[];
if(CFG.onesignalAppId)OneSignalDeferred.push(O=>O.init({appId:CFG.onesignalAppId,serviceWorkerPath:'sw.js',serviceWorkerParam:{scope:location.pathname.replace(/[^/]*$/,'')}}));
const blank=()=>({v:1,cfg:null,days:{},weights:[],body:[],lastBackup:Date.now()});
const D=()=>S.days[cur]||={b:{},l:{},n:{},milk:[],junk:{},water:[],wo:{p:0,s:0},sl:{}};
const water=d=>(d.water||[]).reduce((a,x)=>a+x.ml,0),hyd=()=>S.cfg.hyd||2000;
const curW=()=>S.weights.at(-1)?.w??S.cfg.w0,bmi=()=>(curW()/((S.cfg.h/100)**2)).toFixed(1);
const mealsN=d=>(d.b?.c?1:0)+(d.l?.s&&d.l.s!=='Tidak dimakan'?1:0)+(d.n?.c?1:0);
const sg=n=>(n>=0?'+':'')+n.toFixed(1),days=()=>Object.entries(S.days).sort();
const last=n=>[...Array(n)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-(n-1-i));return iso(d)});
const xp=()=>Object.values(S.days).reduce((a,d)=>a+(d.done?50:0)+(water(d)>=hyd()?10:0)+(d.wo?.done?30:0),0);
function streak(){let n=0,d=new Date();if(!S.days[iso(d)]?.done)d.setDate(d.getDate()-1);while(S.days[iso(d)]?.done){n++;d.setDate(d.getDate()-1)}return n}
function bestStreak(){let b=0,c=0,p=null;for(const[k,v]of days()){if(!v.done)continue;c=p&&new Date(k)-new Date(p)==864e5?c+1:1;b=Math.max(b,c);p=k}return b}
function badges(){const v=Object.values(S.days);let m=0,c=0;for(const[,d]of days()){c=mealsN(d)==3?c+1:0;m=Math.max(m,c)}
 return[['🥇','First Week',v.filter(d=>d.done).length>=7],['🥛','Milk Lover',v.filter(d=>d.milk?.includes('Susu Full Cream')).length>=7],['💪','Stronger',v.filter(d=>d.wo?.done).length>=12],['🍱','Consistent Eater',m>=7]]}
function alerts(){const a=[],h=new Date().getHours(),d=S.days[today()]||{},w=S.weights;
 if(h>=10&&!mealsN(d))a.push('⏰ Belum ada catatan makan hari ini.');else if(h>=20&&mealsN(d)<2)a.push('🍽️ Asupan hari ini masih sedikit.');
 if(w.length>=3&&Math.abs(w.at(-1).w-w.at(-3).w)<.1)a.push('📉 Berat badan stagnan di 3 penimbangan terakhir.');
 if(Date.now()-S.lastBackup>30*864e5)a.push('💾 Sudah lebih dari 30 hari belum backup data.');return a}
function predict(){const w=S.weights;if(w.length<2)return'Butuh minimal 2 data penimbangan.';const f=w[0],l=w.at(-1),wk=(new Date(l.d)-new Date(f.d))/6048e5;
 if(l.w>=S.cfg.target)return'🎉 Target tercapai!';if(wk<=0)return'Butuh data lebih dari 1 hari.';const s=(l.w-f.w)/wk;if(s<=0)return'Tren belum naik, target belum bisa diperkirakan.';
 const n=(S.cfg.target-l.w)/s;return`Tren ${s.toFixed(2)} kg/minggu → target ${S.cfg.target} kg sekitar ${n.toFixed(1)} minggu lagi (${iso(new Date(Date.now()+n*6048e5))}). Ini estimasi dari tren aktual, bukan jaminan.`}
function save(){localStorage.setItem(KEY,JSON.stringify(S));if(ref)ref.set(JSON.parse(JSON.stringify(S))).catch(()=>{})}
function upd(fn,msg='Tersimpan'){snap=JSON.stringify(S);fn();save();render();toast(msg,1)}
function toast(m,u){const t=$('#toast');t.innerHTML=`<span>${m}</span>`+(u?'<button onclick="undo()">Undo</button>':'');t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,4500)}
function undo(){if(snap){S=JSON.parse(snap);snap=null;save();render();$('#toast').hidden=true}}
const go=k=>{view=k;anim=k=='profile';render()};
const TITLE={profile:'Profilku',tracker:'Tracker',weigh:'Log Penimbangan',body:'Body Measurement',hyd:'Hydration',sleep:'Sleep Quality',game:'Motivasi'};
// ---------- views
function vTracker(){const d=D(),ok=d.n.c&&d.n.d?.trim();
 const meal=(k,l)=>`<label class=row><input type=checkbox ${d[k].c?'checked':''} onchange="upd(()=>D().${k}.c=this.checked)"> ${l}</label><input placeholder="Menu ${l.toLowerCase()}" value="${esc(d[k].d)}" onchange="upd(()=>D().${k}.d=this.value)">`;
 const SN=['Susu Full Cream','Roti gandum','Biskuit gandum','Roti kacang','Roti tawar kacang'];
 return`<input type=date value=${cur} max=${today()} onchange="cur=this.value||today();render()">${cur==today()?alerts().map(a=>`<div class=alert>${a}</div>`).join(''):''}
<details open><summary>Bagian Penting</summary>
${meal('b','Sarapan')}
<b>Makan Siang (MBG)</b><select onchange="upd(()=>D().l.s=this.value)">${[['','Pilih status…'],['Habis','Habis'],['Ambil lauk/ayam saja','Ambil lauk/ayamnya saja'],['Tidak dimakan','Tidak dimakan']].map(([v,t])=>`<option value="${v}" ${d.l.s==v||(!d.l.s&&!v)?'selected':''}>${t}</option>`).join('')}</select>
<input placeholder="Menu makan siang" value="${esc(d.l.d)}" onchange="upd(()=>D().l.d=this.value)">
${meal('n','Makan Malam')}
${d.done?`<p>✅ Laporan hari ini sudah disubmit.</p><button class=alt onclick="upd(()=>D().done=false)">Buka lagi untuk edit</button>`:`<button ${ok?'':'disabled'} onclick="upd(()=>D().done=true,'Laporan terkirim, +50 XP')">Submit Harian</button><small>Submit aktif setelah Makan Malam dicentang dan diisi. Catatan pagi & siang tersimpan sebagai draft.</small>`}
<h4>Susu & camilan padat gizi</h4><div class=chips>${SN.map(s=>`<button class="${d.milk.includes(s)?'on':''}" onclick="upd(()=>{const m=D().milk,i=m.indexOf('${s}');i<0?m.push('${s}'):m.splice(i,1)})">${s}</button>`).join('')}</div>
<input placeholder="Camilan sehat lain (ketik)" value="${esc(d.extra)}" onchange="upd(()=>D().extra=this.value)">
<h4>Guardian Check</h4><div class=row><button class="${d.junk.y===false?'':'alt'}" onclick="upd(()=>D().junk={y:false})">✓ Tidak junk food</button><button class="${d.junk.y?'bad':'alt'}" onclick="upd(()=>D().junk={y:true,t:''})">✕ Makan junk food</button></div>
${d.junk.y?`<input list=jl placeholder="Jenis junk food" value="${esc(d.junk.t)}" onchange="upd(()=>D().junk.t=this.value)"><datalist id=jl><option>Cilok<option>Cireng<option>Mi pedas/instan</datalist>`:''}
</details>
<details><summary>Workout (3x seminggu)</summary><p class=note>Push-up 3 set + Squat 3 set, 10–15 menit.</p>
${[['p','Push-up'],['s','Squat']].map(([k,l])=>`<div class=row><b style="flex:1">${l}: ${d.wo[k]}/3 set</b><button onclick="upd(()=>D().wo.${k}=Math.min(3,D().wo.${k}+1))">+ set</button></div>`).join('')}
<button class=alt id=rest onclick="rest()">⏱ Istirahat 60 dtk</button>
${d.wo.done?'<p>✅ Sesi hari ini selesai</p>':`<button ${d.wo.p>=3&&d.wo.s>=3?'':'disabled'} onclick="upd(()=>D().wo.done=true,'Workout selesai, +30 XP')">Selesaikan sesi</button>`}</details>`}
function rest(){let n=60;clearInterval(rt);rt=setInterval(()=>{n--;const b=$('#rest');if(b)b.textContent=n>0?`⏱ ${n} dtk`:'Lanjut set berikutnya!';if(n<=0){clearInterval(rt);navigator.vibrate?.(300)}},1000)}
const CND=['Badan lebih bertenaga','Pipi aman / tidak sembap','Massa tubuh terasa lebih padat'];
function vWeigh(){const w=S.weights;return`<div class=card><div class=alert>Timbang pagi hari saat bangun, sebelum makan atau minum.</div>
<div class=big>${curW()} kg</div><small>BMI ${bmi()} · target ${S.cfg.target} kg</small><p>${predict()}</p>
<input id=wi type=number step=.1 placeholder="Berat minggu ini (kg)">${CND.map(c=>`<label class=row><input type=checkbox class=cw value="${c}"> ${c}</label>`).join('')}<button onclick="saveW()">Simpan berat</button></div>
<div class=card><canvas id=c></canvas></div><div class=card><table><tr><th>Tanggal<th>kg<th>vs lalu<th>vs awal<th>Kondisi</tr>${w.map((x,i)=>`<tr><td>${x.d.slice(5)}<td>${x.w}<td>${i?sg(x.w-w[i-1].w):'-'}<td>${i?sg(x.w-w[0].w):'-'}<td><small>${esc((x.c||[]).join(', '))}</small></tr>`).reverse().join('')}</table></div>`}
function saveW(){const w=parseFloat($('#wi').value);if(!w)return toast('Isi berat badan dulu');upd(()=>{S.weights=S.weights.filter(x=>x.d!==cur);S.weights.push({d:cur,w,c:[...document.querySelectorAll('.cw:checked')].map(x=>x.value)});S.weights.sort((a,b)=>a.d.localeCompare(b.d))},'Berat tersimpan')}
const BF=[['arm','Lengan'],['chest','Dada'],['waist','Pinggang'],['thigh','Paha'],['calf','Betis']];
function vBody(){const b=S.body,f=b[0],l=b.at(-1),ds=l?Math.floor((Date.now()-new Date(l.d))/864e5):null;
 return`<div class=card><small>Disarankan tiap 2 minggu${ds!=null?` · terakhir ${ds} hari lalu`:''}, tapi boleh kapan saja.</small>${BF.map(([k,t])=>`<input id=b_${k} type=number step=.1 placeholder="Lingkar ${t.toLowerCase()} (cm)">`).join('')}<button onclick="saveB()">Simpan ukuran</button></div>
<div class=card><table><tr><th>Tgl${BF.map(([,t])=>`<th>${t}`).join('')}</tr>${b.map((x,i)=>`<tr><td>${x.d.slice(5)}${BF.map(([k])=>`<td>${x[k]}${i?`<br><small>${sg(x[k]-f[k])}</small>`:''}`).join('')}</tr>`).reverse().join('')}</table></div>`}
function saveB(){const o={d:cur};for(const[k]of BF){o[k]=parseFloat($('#b_'+k).value);if(!o[k])return toast('Isi kelima ukuran')}upd(()=>S.body.push(o),'Ukuran tersimpan')}
const addW=n=>upd(()=>D().water.push({t:new Date().toTimeString().slice(0,5),ml:n}),`+${n} ml`);
function vHyd(){const d=D(),t=water(d);return`<div class=card><div class=big>${t} / ${hyd()} ml</div><progress max=${hyd()} value=${t}></progress><div class=row>${[150,250,500].map(n=>`<button onclick="addW(${n})">+${n} ml</button>`).join('')}</div><label>Target harian (ml)<input type=number value=${hyd()} onchange="upd(()=>S.cfg.hyd=+this.value||2000)"></label></div>
<div class=card><canvas id=c></canvas></div><div class=card><b>Riwayat ${cur}</b>${d.water.map(x=>`<div>${x.t} · ${x.ml} ml</div>`).join('')||'<p class=note>Belum ada catatan. Tekan salah satu tombol di atas.</p>'}</div>`}
const mins=s=>{const[a,b]=s.split(':');return a*60+ +b};
function vSleep(){const s=D().sl,m=s.f&&s.t?(mins(s.t)-mins(s.f)+1440)%1440:null,late=s.f&&(mins(s.f)>mins('22:30')||mins(s.f)<240);
 return`<div class=card><label>Jam tidur<input type=time value="${s.f||''}" onchange="upd(()=>D().sl.f=this.value)"></label><label>Jam bangun<input type=time value="${s.t||''}" onchange="upd(()=>D().sl.t=this.value)"></label>
${m!=null?`<div class=big>${Math.floor(m/60)} j ${m%60} m</div>`:''}${late?'<div class=alert>Target tidur paling lambat 22.30.</div>':''}
<label>Kualitas<select onchange="upd(()=>D().sl.q=this.value)">${['','Buruk','Cukup','Baik'].map(q=>`<option value="${q}" ${s.q==q?'selected':''}>${q||'Pilih…'}</option>`).join('')}</select></label>
<label class=row><input type=checkbox ${s.fr?'checked':''} onchange="upd(()=>D().sl.fr=this.checked)"> Tubuh terasa segar saat bangun</label></div>`}
function vGame(){const x=xp(),w=last(7),milk=w.filter(k=>S.days[k]?.milk?.includes('Susu Full Cream')).length,pw=Math.max(0,...Object.values(S.days).map(water));
 return`<div class=card><div class=big>Level ${Math.floor(x/200)+1}</div><progress max=200 value=${x%200}></progress><small>${x} XP · 🔥 streak ${streak()} hari</small></div>
<div class=card><b>Tantangan minggu ini</b><p>Minum Susu Full Cream 5 hari: ${milk}/5 ${milk>=5?'✅':''}</p></div>
<div class=card><b>Lencana</b>${badges().map(([e,n,ok])=>`<div style="opacity:${ok?1:.35}">${e} ${n}</div>`).join('')}</div>
<div class=card><b>Kepatuhan 35 hari</b><div class=heat>${last(35).map(k=>`<i class="hm l${Math.min(4,S.days[k]?mealsN(S.days[k])+(S.days[k].done?1:0):0)}" title=${k}></i>`).join('')}</div></div>
<div class=card><b>Personal Best</b><p>Streak terpanjang: ${bestStreak()} hari<br>Rekor minum: ${pw} ml</p></div>`}
// ---------- profilku
const nm=()=>S.profile?.name||user?.email?.split('@')[0]||'Pengguna';
const ava=()=>S.profile?.photo?`<img src="${esc(S.profile.photo)}" alt="Foto profil">`:`<span>${esc((nm().trim()[0]||'?').toUpperCase())}</span>`;
const bmiLbl=b=>b<18.5?'Kurang':b<25?'Normal':b<30?'Berlebih':'Obesitas';
const nOn=()=>typeof Notification!=='undefined'&&Notification.permission==='granted';
const PEN='<svg width=16 height=16 viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const CHK='<svg width=16 height=16 viewBox="0 0 24 24"><path class=ck d="M5 12l5 5 9-10" fill=none stroke=currentColor stroke-width=3 stroke-linecap=round stroke-linejoin=round /></svg>';
function vProfile(){const c=S.cfg,b=+bmi(),cw=curW(),span=c.target-c.w0,pr=span>0?Math.max(0,Math.min(100,(cw-c.w0)/span*100)):0,left=c.target-cw;
 return`<div class="hero st" style="--i:0"><div class=ava-wrap><div class=ava onclick="photoSheet()">${ava()}</div><button class=cam onclick="photoSheet()" aria-label="Ganti foto">📷</button></div>
<button class=nm onclick="editName()" aria-label="Ubah nama"><b>${esc(nm())}</b>${PEN}</button><small>${esc(user?.email||'Mode lokal (tanpa akun)')}</small></div>
<div class=grid3><div class="stat st" style="--i:1"><small>Tinggi</small><b>${c.h}</b><small>cm</small></div>
<div class="stat st" style="--i:2"><small>Berat Awal</small><b>${c.w0}</b><small>kg</small></div>
<div class="stat st" style="--i:3"><small>BMI Terkini</small><b>${b}</b><span class=tag>${bmiLbl(b)}</span></div></div>
<div class=grid2><div class="stat hl st" style="--i:4"><small>🎯 Target Akhir</small><b>${c.target} kg</b><small>${left>0?`Sisa ${left.toFixed(1)} kg lagi`:'🎉 Target tercapai'}</small><div class=bar><i style="--w:${pr.toFixed(0)}%"></i></div></div>
<div class="stat hl st" style="--i:5"><small>📈 Target / Minggu</small><b>+${c.wk} kg</b><small>kenaikan per minggu</small></div></div>
<div class="card st" style="--i:6">
<div class=set><span class=ico>🔔</span><div class=lbl>Notifikasi Pengingat<small>${nOn()?'Pengingat harian aktif':'Dapatkan pengingat mencatat'}</small></div>${nOn()?`<span class=pill>${CHK}Aktif</span>`:'<button class=mini onclick="notif()">Aktifkan</button>'}</div>
<div class=set><span class=ico>🌓</span><div class=lbl>Mode Gelap<small>Ganti tampilan terang / gelap</small></div><button class="sw${c.dark?' on':''}" role=switch aria-checked="${!!c.dark}" aria-label="Mode gelap" onclick="toggleDark(this)"><span class=knob><i class=sun>☀️</i><i class=moon>🌙</i></span></button></div>
<div class=set><span class=ico id=lk>${c.pin?'🔒':'🔓'}</span><div class=lbl>Kunci PIN<small>${c.pin?'PIN Aktif':'Belum diatur'}</small></div>${c.pin?'<div class=acts><button class="mini alt" onclick="togglePin()">Ubah</button><button class="mini ghost" onclick="offPin()">Matikan</button></div>':'<button class=mini onclick="togglePin()">Atur PIN</button>'}</div>
<div class=acc id=acc><div><input id=np type=password inputmode=numeric pattern="[0-9]*" maxlength=6 autocomplete=off placeholder="PIN 4–6 digit"><button id=pb onclick="setPin()">${c.pin?'Simpan PIN Baru':'Aktifkan PIN'}</button></div></div></div>
<div class="card st" style="--i:7"><div class=row><button class=ghost onclick="exp()">⬇️ Ekspor Backup</button><button class=ghost onclick="$('#fimp').click()">⬆️ Impor Backup</button></div><input id=fimp type=file accept=.json hidden onchange="imp(this.files[0])"><small>Backup berformat JSON, aman disimpan di Files / Drive.</small></div>
${ref?'<button class="soft st" style="--i:8" onclick="askLogout()">Keluar Akun</button>':''}`}
// modal
function modal(o){$('#modal')?.remove();const m=document.createElement('div');m.id='modal';m.className='mb';m.innerHTML=`<div class=md role=dialog aria-modal=true>${o.icon?`<div class=mi>${o.icon}</div>`:''}<h3>${o.title}</h3><div class=mt>${o.body||''}</div><div class=mbtn>${o.btns}</div></div>`;m.onclick=e=>{if(e.target===m)closeModal()};document.body.append(m)}
function closeModal(){const m=$('#modal');if(!m)return;m.classList.add('out');setTimeout(()=>m.remove(),220)}
function photoSheet(){modal({icon:'📷',title:'Foto Profil',body:'Pilih cara menambahkan fotomu.',btns:`<button onclick="$('#fcam').click()">🤳 Ambil Selfie</button><button class=alt onclick="$('#fgal').click()">🖼️ Pilih dari Galeri</button><button class=ghost onclick="closeModal()">Batal</button>`})}
function editName(){modal({icon:'✏️',title:'Ubah Nama',body:`<input id=nn maxlength=30 value="${esc(nm())}" placeholder="Nama lengkap / panggilan" autocomplete=name>`,btns:`<button onclick="saveName()">Simpan</button><button class=ghost onclick="closeModal()">Batal</button>`});setTimeout(()=>$('#nn')?.select(),60)}
function saveName(){const n=$('#nn').value.trim();if(!n)return toast('Nama tidak boleh kosong');S.profile={...S.profile,name:n};save();closeModal();render();toast('Nama diperbarui')}
// foto: pusat-potong persegi 256px, JPEG ringan (~20-30 KB) agar muat di dokumen Firestore
function shrink(f,sz=256){return new Promise((ok,no)=>{const u=URL.createObjectURL(f),i=new Image();i.onload=()=>{const m=Math.min(i.width,i.height),c=document.createElement('canvas');c.width=c.height=sz;c.getContext('2d').drawImage(i,(i.width-m)/2,(i.height-m)/2,m,m,0,0,sz,sz);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.82))};i.onerror=()=>{URL.revokeObjectURL(u);no()};i.src=u})}
async function pickPhoto(inp){const f=inp.files[0];inp.value='';if(!f)return;try{const d=await shrink(f);S.profile={...S.profile,photo:d};save();closeModal();render();toast('Foto diperbarui')}catch{toast('Foto tidak bisa dibaca, coba foto lain')}}
function toggleDark(el){S.cfg.dark=!S.cfg.dark;save();theme();el.classList.toggle('on',S.cfg.dark);el.setAttribute('aria-checked',!!S.cfg.dark)}
function togglePin(){const a=$('#acc');a.classList.toggle('open');if(a.classList.contains('open'))setTimeout(()=>$('#np')?.focus(),320)}
function offPin(){S.cfg.pin=null;save();render();toast('PIN dimatikan')}
function askLogout(){modal({icon:'⚠️',title:'Keluar akun?',body:'Yakin ingin keluar akun? Pastikan data sudah tersinkronisasi dan kamu mengingat email serta password untuk masuk kembali.',btns:'<button class=alt onclick="closeModal()">Batal</button><button class=bad onclick="logout()">Ya, Keluar Sekarang</button>'})}
function logout(){firebase.auth().signOut().then(()=>location.reload())}
// ---------- core
function render(){if(!S.cfg)return onboard();theme();$('#menu').hidden=true;$('#title').textContent=TITLE[view];$('#main').innerHTML=({profile:vProfile,tracker:vTracker,weigh:vWeigh,body:vBody,hyd:vHyd,sleep:vSleep,game:vGame})[view]();$('#main').className=anim?'anim':'';anim=false;
 if(view=='weigh')chart(S.weights.map(x=>x.d.slice(5)),S.weights.map(x=>x.w),'Berat (kg)');if(view=='hyd')chart(last(7).map(k=>k.slice(5)),last(7).map(k=>water(S.days[k]||{})),'Air (ml)')}
function chart(l,d,lb){if(ch)ch.destroy();const c=$('#c');if(c&&window.Chart)ch=new Chart(c,{type:'line',data:{labels:l,datasets:[{label:lb,data:d,tension:.3,borderColor:'#0f766e'}]}})}
const theme=()=>document.body.classList.toggle('dark',!!S.cfg?.dark);
const dots=n=>`<div class=dots>${[1,2,3].map(i=>`<i class="${i<=n?'on':''}"></i>`).join('')}</div>`;
function onboard(){if(!obGo||!S.profile?.photo)return onbPhoto();onbBody()}
function onbPhoto(){const p=S.profile?.photo;$('#main').innerHTML=`<div class="card ob">${dots(2)}<h2>Halo, ${esc(nm())}! 👋</h2><p class=note>Satu langkah lagi: tambahkan foto wajahmu sebagai foto profil.</p><div class="ava lg">${ava()}</div><button onclick="$('#fcam').click()">🤳 Ambil Selfie</button><button class=alt onclick="$('#fgal').click()">🖼️ Pilih dari Galeri</button><button ${p?'':'disabled'} onclick="obGo=true;onboard()">Lanjut Isi Data Tubuh →</button></div>`}
function onbBody(){$('#main').innerHTML=`<div class="card ob">${dots(3)}<h2>Data Tubuh</h2><p class=note>Isi data awal sebagai patokan perhitungan.</p><input id=oh type=number placeholder="Tinggi badan (cm)"><input id=ow type=number step=.1 placeholder="Berat badan awal (kg)"><input id=ot type=number step=.1 placeholder="Target berat akhir (kg)"><label>Target naik per minggu<select id=ok><option>0.25<option>0.5</select></label><button onclick="saveCfg()">Mulai</button></div>`}
function saveCfg(){const h=+$('#oh').value,w=+$('#ow').value,t=+$('#ot').value;if(!h||!w||!t)return toast('Lengkapi semua isian');S.cfg={h,w0:w,target:t,wk:+$('#ok').value,hyd:2000};S.weights=[{d:today(),w,c:[]}];save();render()}
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
async function setPin(){const p=$('#np').value;if(!/^\d{4,6}$/.test(p))return toast('PIN harus 4–6 digit angka');const b=$('#pb'),l=$('#lk');b.classList.add('pulse');l.textContent='🔒';l.classList.add('nod');S.cfg.pin=await sha(p);save();setTimeout(()=>{$('#acc')?.classList.remove('open');setTimeout(()=>{if(view=='profile')render();toast('PIN aktif')},320)},650)}
async function unlock(){if(await sha($('#pin').value)===S.cfg.pin){$('#lock').hidden=true;$('#pin').value=''}else toast('PIN salah')}
function notif(){if(!CFG.onesignalAppId)return toast('OneSignal belum diisi di config.js');OneSignalDeferred.push(async O=>{await O.Notifications.requestPermission();toast(O.Notifications.permission?'Notifikasi aktif ✅':'Izin ditolak');if(view=='profile')render()})}
function exp(){S.lastBackup=Date.now();save();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({schema:1,exportedAt:new Date().toISOString(),data:S})],{type:'application/json'}));a.download='gaintrack-backup-'+today()+'.json';a.click()}
function imp(f){if(!f)return;const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);if(j.schema!==1||!j.data)throw 0;const old=S.profile;S=j.data;if(!S.profile&&old)S.profile=old;save();render();toast('Impor berhasil')}catch{toast('File backup tidak valid')}};r.readAsText(f)}
const AERR={'auth/invalid-credential':'Email atau password salah','auth/wrong-password':'Email atau password salah','auth/user-not-found':'Akun tidak ditemukan','auth/email-already-in-use':'Email sudah terdaftar, silakan masuk','auth/weak-password':'Password minimal 6 karakter','auth/invalid-email':'Format email tidak valid','auth/network-request-failed':'Tidak ada koneksi internet'};
function authUI(r=false){$('#main').innerHTML=`<div class=card><h2>${r?'Daftar Akun Baru':'Masuk'}</h2><p class=note>Akun yang sama dipakai di semua perangkat.</p>${r?'<input id=an maxlength=30 autocomplete=name placeholder="Nama lengkap / panggilan">':''}<input id=em type=email autocomplete=email placeholder=Email><input id=pw type=password autocomplete="${r?'new-password':'current-password'}" placeholder="Password (min. 6)"><button onclick="auth(${r?1:0})">${r?'Daftar':'Masuk'}</button><button class=alt onclick="authUI(${!r})">${r?'Sudah punya akun? Masuk':'Daftar akun baru'}</button></div>`}
async function auth(n){const a=firebase.auth(),e=$('#em').value.trim(),p=$('#pw').value,name=n?$('#an').value.trim():'';if(n&&!name)return toast('Isi nama dulu');pendingName=name;try{await(n?a.createUserWithEmailAndPassword(e,p):a.signInWithEmailAndPassword(e,p))}catch(x){pendingName='';toast(AERR[x.code]||x.message)}}
function start(){$('#menu').innerHTML=Object.entries(TITLE).map(([k,l])=>`<button onclick="go('${k}')">${l}</button>`).join('');if(S.cfg?.pin)$('#lock').hidden=false;render()}
function boot(){const l=localStorage.getItem(KEY);S=l?JSON.parse(l):blank();
 if(window.firebase&&CFG.firebase.apiKey){firebase.initializeApp(CFG.firebase);const db=firebase.firestore();db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
  firebase.auth().onAuthStateChanged(async u=>{if(!u){user=null;$('#lock').hidden=true;return authUI()}user=u;ref=db.doc('users/'+u.uid);
   try{const s=await ref.get();if(s.exists)S=s.data();else{if(pendingName){S.profile={name:pendingName};pendingName=''}ref.set(JSON.parse(JSON.stringify(S)))}}catch(e){}
   OneSignalDeferred.push(O=>O.login(u.uid));start()})}else start()}
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').then(r=>r.addEventListener('updatefound',()=>{const w=r.installing;w?.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)toast('Versi baru tersedia <button onclick=location.reload()>Muat ulang</button>')})}));
boot();
