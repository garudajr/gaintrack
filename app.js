const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10),today=()=>iso(new Date());
const KEY='gaintrack_v1';let S,cur=today(),view='tracker',ref=null,snap=null,tt,rt,ch,anim=0,obs=null,pendName='';
window.OneSignalDeferred=window.OneSignalDeferred||[];
if(CFG.onesignalAppId)OneSignalDeferred.push(O=>O.init({appId:CFG.onesignalAppId,serviceWorkerPath:'sw.js',serviceWorkerParam:{scope:location.pathname.replace(/[^/]*$/,'')}}));
const blank=()=>({v:1,cfg:null,days:{},weights:[],body:[],lastBackup:Date.now(),prof:{name:'',photo:''}});
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
const go=k=>{view=k;anim=1;render()};
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
// ---------- profile
const P=()=>S.prof||={name:'',photo:''},email=()=>window.firebase&&ref?firebase.auth().currentUser?.email||'':'';
const PEN='<svg width=15 height=15 viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>';
const CHK='<svg class=chk width=14 height=14 viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=3 stroke-linecap=round stroke-linejoin=round><path d="M5 13l4 4L19 7"/></svg>';
function avHTML(n=96,ph){const p=P(),ini=esc(([...(p.name||email()||'?').trim()][0]||'?').toUpperCase()),st=`width:${n}px;height:${n}px`;
 if(p.photo)return`<img class=pimg src="${esc(p.photo)}" alt="Foto profil" style="${st}">`;
 return`<div class="pimg ini${ph?' ph':''}" style="${st};font-size:${Math.round(n*.42)}px">${ph?'📷':ini}</div>`}
function headHTML(){const p=P(),e=email();return`<div class=av id=av onclick="photoSheet()">${avHTML()}<button class=cam onclick="photoSheet()" aria-label="Ganti foto profil">📷</button></div>
<div class=nm id=nmrow><h2>${esc(p.name)||'<span class=note>Tambah nama</span>'}</h2><button class=pen onclick="editName()" aria-label="Ubah nama">${PEN}</button></div>${e?`<small>${esc(e)}</small>`:''}`}
function refreshHead(){const h=$('#phead');if(h)h.innerHTML=headHTML()}
function editName(){$('#nmrow').innerHTML=`<input id=nin maxlength=40 value="${esc(P().name)}" placeholder="Nama panggilan" onkeydown="if(event.key==='Enter')saveName();if(event.key==='Escape')refreshHead()"><button class=sm onclick="saveName()">Simpan</button>`;$('#nin').focus()}
function saveName(){const v=$('#nin').value.trim();if(!v)return toast('Nama tidak boleh kosong');P().name=v;save();if(window.firebase&&ref)firebase.auth().currentUser?.updateProfile({displayName:v}).catch(()=>{});refreshHead();toast('Nama tersimpan')}
// modal + foto
function openModal(h,sheet){const m=$('#modal');m.className=sheet?'sheetm':'';m.innerHTML=h;m.hidden=false}
function closeModal(){const m=$('#modal');if(m.hidden)return;stopCam();m.classList.add('closing');setTimeout(()=>{m.hidden=true;m.className='';m.innerHTML=''},220)}
const photoSheet=()=>openModal(`<div class="mbox pm"><div class=pmav>${avHTML(112,1)}</div><h3>${esc(P().name)||'Foto profil'}</h3><p class=note>Pilih cara memasang foto wajahmu</p>
<div class=opt><button class=tile onclick="pickPhoto(1)"><span>📸</span>Ambil Selfie</button><button class=tile onclick="pickPhoto(0)"><span>🖼️</span>Pilih dari Galeri</button></div>${P().photo?'<button class="btn2 dng" onclick="rmPhoto()">Hapus foto</button>':''}<button class=lnk onclick="closeModal()">Tutup</button></div>`);
function pickPhoto(cam){if(cam)return openCam();$('#fgal').click();closeModal()}
// kamera selfie di dalam aplikasi
let cs=null,shot='';
function stopCam(){cs?.getTracks().forEach(t=>t.stop());cs=null}
async function openCam(){
 if(!navigator.mediaDevices?.getUserMedia){closeModal();toast('Kamera tidak didukung, pilih dari galeri');return}
 shot='';openModal(`<div class="mbox cm"><h3>Ambil selfie</h3><p class=note id=ch>Posisikan wajah di tengah lingkaran</p>
<div class=ring id=ring><video id=cv playsinline muted autoplay></video><img id=cimg alt="Hasil foto"><div class=flash id=fl></div></div>
<div class="row camb" id=cb1><button class=btn2 onclick="closeModal();$('#fgal').click()">🖼️ Galeri</button><button class=shut onclick="shoot()" aria-label="Ambil foto"><i></i></button><button class=btn2 onclick="closeModal()">Batal</button></div>
<div class="row camb" id=cb2 hidden><button class=btn2 onclick="retake()">↺ Ulangi</button><button onclick="useShot()">Pakai Foto ✓</button></div></div>`);
 try{cs=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:720},height:{ideal:720}},audio:false});const v=$('#cv');if(!v){stopCam();return}v.srcObject=cs;await v.play()}
 catch{closeModal();toast('Izin kamera ditolak. Pakai "Pilih dari Galeri" ya.')}}
function shoot(){const v=$('#cv');if(!v||!v.videoWidth)return;const n=256,s=Math.min(v.videoWidth,v.videoHeight),c=document.createElement('canvas');c.width=c.height=n;
 c.getContext('2d').drawImage(v,(v.videoWidth-s)/2,(v.videoHeight-s)/2,s,s,0,0,n,n);shot=c.toDataURL('image/jpeg',.82);
 const f=$('#fl');f.classList.remove('go');void f.offsetWidth;f.classList.add('go');navigator.vibrate?.(30);
 setTimeout(()=>{$('#cimg').src=shot;$('#ring').classList.add('done');$('#cb1').hidden=true;$('#cb2').hidden=false;$('#ch').textContent='Suka hasilnya?'},180)}
function retake(){shot='';$('#ring').classList.remove('done');$('#cb1').hidden=false;$('#cb2').hidden=true;$('#ch').textContent='Posisikan wajah di tengah lingkaran'}
function useShot(){if(!shot)return;P().photo=shot;save();closeModal();if(!S.cfg)obPrev();else refreshHead();$('#av,#obav')?.classList.add('pop');toast('Foto diperbarui')}
// pop-up info kartu statistik
function infoPop(k){const c=S.cfg,w=curW(),b=+bmi(),h2=(c.h/100)**2;let h;
 if(k=='bmi'){const m=Math.max(2,Math.min(98,(b-15)/20*100)),st=b<18.5?'Kurus':b<25?'Normal':b<30?'Berlebih':'Obesitas';
  h=`<div class=wico>⚖️</div><h3>BMI kamu ${b.toFixed(1)}</h3><span class="pill ${b>=18.5&&b<25?'ok':'low'}">${st}</span>
<div class=scale><i style="left:${m}%"></i><span style="background:#f59e0b"></span><span style="background:#14b8a6"></span><span style="background:#f59e0b"></span><span style="background:#ef4444"></span></div>
<div class=sl><small>&lt;18.5</small><small>18.5–24.9</small><small>25–29.9</small><small>≥30</small></div>
<p class=note>Berat normal untuk tinggi ${c.h} cm: <b>${(18.5*h2).toFixed(1)}–${(24.9*h2).toFixed(1)} kg</b>.${b<18.5?`<br>Kamu perlu naik sekitar ${(18.5*h2-w).toFixed(1)} kg untuk masuk rentang normal.`:''}</p>`}
 else{const pr=c.target>c.w0?Math.max(0,Math.min(100,Math.round((w-c.w0)/(c.target-c.w0)*100))):(w>=c.target?100:0);
  h=`<div class=wico>🎯</div><h3>${pr}% menuju target</h3><div class=bar2><i style="width:${pr}%"></i></div>
<div class=sl><small>Awal ${(+c.w0).toFixed(1)} kg</small><small>Kini ${w} kg</small><small>Target ${c.target} kg</small></div><p class=note>${predict()}</p>`}
 openModal(`<div class=mbox>${h}<button style="margin-top:12px" onclick="closeModal()">Mengerti</button></div>`)}
function rmPhoto(){P().photo='';save();closeModal();refreshHead();toast('Foto dihapus')}
// potong persegi di tengah + kecilkan ke 256px agar ringan disimpan di Firestore (~20 KB)
const squash=(f,n=256)=>new Promise((ok,no)=>{const u=URL.createObjectURL(f),i=new Image();i.onload=()=>{const s=Math.min(i.width,i.height),c=document.createElement('canvas');c.width=c.height=n;c.getContext('2d').drawImage(i,(i.width-s)/2,(i.height-s)/2,s,s,0,0,n,n);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.82))};i.onerror=()=>no();i.src=u});
async function gotPhoto(i){const f=i.files[0];i.value='';if(!f)return;
 try{P().photo=await squash(f);save();if(!S.cfg)obPrev();else refreshHead();$('#av,#obav')?.classList.add('pop');toast('Foto diperbarui')}catch{toast('Foto tidak bisa dibaca, coba foto lain')}}
// baris pengaturan
function notifRow(){const st=window.Notification?.permission,on=st==='granted';
 return`<div class=srow><span class=ico>🔔</span><div class=stx><b>Notifikasi pengingat</b><small>${on?'Pengingat harian aktif':st==='denied'?'Diblokir, ubah di pengaturan browser':'Pengingat makan, minum & timbang'}</small></div>${on?`<span class="pill ok big2">${CHK}Aktif</span>`:st==='denied'?'':'<button class="sm ghost" onclick="notif()">Aktifkan</button>'}</div>`}
function toggleTheme(b){document.body.classList.add('tt');S.cfg.dark=!S.cfg.dark;save();theme();b.classList.toggle('on',!!S.cfg.dark);b.setAttribute('aria-checked',!!S.cfg.dark);$('#thl').textContent=S.cfg.dark?'Mode gelap':'Mode terang';setTimeout(()=>document.body.classList.remove('tt'),450)}
function pinBlock(){const on=!!S.cfg.pin;return`<div class=srow><span class=ico id=pinico>${on?'🔒':'🔓'}</span><div class=stx><b>Kunci PIN</b><small>${on?'PIN Aktif':'Lindungi data dengan PIN 4–6 digit'}</small></div><div class=mini>${on?'<button class="sm ghost" onclick="openPin()">Ubah</button><button class="sm ghost bad" onclick="offPin()">Matikan</button>':'<button class="sm ghost" onclick="openPin()">Atur PIN</button>'}</div></div>
<div class=acc id=acc><div><div class=accin><input id=np type=password inputmode=numeric maxlength=6 autocomplete=new-password placeholder="${on?'PIN baru':'Masukkan PIN'} (4–6 digit)"><button id=pinbtn onclick="setPin()">${on?'Simpan PIN baru':'Aktifkan PIN'}</button></div></div></div>`}
function openPin(){const a=$('#acc');a.classList.toggle('open');if(a.classList.contains('open'))setTimeout(()=>$('#np')?.focus(),350)}
async function setPin(){const p=$('#np').value;if(!/^\d{4,6}$/.test(p))return toast('PIN harus 4–6 digit angka');
 const b=$('#pinbtn');b.disabled=true;S.cfg.pin=await sha(p);save();b.classList.add('pulse');const ic=$('#pinico');ic.textContent='🔒';ic.classList.add('nod');
 setTimeout(()=>$('#acc').classList.remove('open'),700);setTimeout(()=>{$('#pinbox').innerHTML=pinBlock();toast('PIN aktif')},1100)}
function offPin(){S.cfg.pin=null;save();$('#pinbox').innerHTML=pinBlock();toast('PIN dimatikan')}
// keluar akun
const confirmOut=()=>openModal(`<div class=mbox><div class=wico>⚠️</div><h3>Yakin ingin keluar akun?</h3><p class=note>Pastikan data sudah tersinkronisasi dan kamu mengingat email serta password untuk masuk kembali.</p><div class=row><button class=btn2 onclick="closeModal()">Batal</button><button class=bad id=lo onclick="doLogout()">Ya, Keluar Sekarang</button></div></div>`);
async function doLogout(){const b=$('#lo');b.disabled=true;b.textContent='Menyinkronkan…';
 try{await Promise.race([ref.set(JSON.parse(JSON.stringify(S))),new Promise((_,j)=>setTimeout(j,6000))])}
 catch{b.disabled=false;b.textContent='Ya, Keluar Sekarang';return toast('Data belum tersinkron. Cek koneksi lalu coba lagi.')}
 localStorage.removeItem(KEY);OneSignalDeferred.push(O=>O.logout?.());await firebase.auth().signOut();location.reload()}
function vProfile(){const c=S.cfg,w=curW(),b=+bmi(),st=b<18.5?['Kurus','low']:b<25?['Normal','ok']:b<30?['Berlebih','low']:['Obesitas','low'],
 pr=c.target>c.w0?Math.max(0,Math.min(1,(w-c.w0)/(c.target-c.w0))):(w>=c.target?1:0),left=Math.max(0,c.target-w),dk=!!c.dark;
 return`<div class="phead fu" id=phead style="--i:0">${headHTML()}</div>
<div class=g3><div class="stat tap fu" style="--i:1" onclick="toast('Tinggi badan diatur saat pendaftaran')"><small>Tinggi</small><b>${c.h}<span class=u> cm</span></b></div>
<div class="stat tap fu" style="--i:2" onclick="toast('Berat awal jadi patokan progresmu')"><small>Berat awal</small><b>${(+c.w0).toFixed(1)}<span class=u> kg</span></b></div>
<div class="stat tap fu" style="--i:3" onclick="infoPop('bmi')"><small>BMI terkini</small><b>${b.toFixed(1)}</b><span class="pill ${st[1]}">${st[0]}</span></div></div>
<div class=g2><div class="stat hl tap fu" style="--i:4" onclick="infoPop('target')"><small>Target berat akhir</small><b>${c.target}<span class=u> kg</span></b><div class=bar style="--w:${Math.round(pr*100)}%"><i></i></div><small>${left>0?`Kini ${w} kg · sisa ${left.toFixed(1)} kg`:'🎉 Target tercapai'}</small></div>
<div class="stat hl fu" style="--i:5"><small>Target per minggu</small><b>+${c.wk}<span class=u> kg</span></b><small>naik per minggu</small></div></div>
<div class="card pc fu" style="--i:6"><h4 class=sec>Pengaturan</h4><div id=nbox>${notifRow()}</div>
<div class=srow><span class=ico>🎨</span><div class=stx><b>Tampilan</b><small id=thl>${dk?'Mode gelap':'Mode terang'}</small></div><button class="sw${dk?' on':''}" role=switch aria-checked="${dk}" aria-label="Mode gelap" onclick="toggleTheme(this)"><i class=knob><span class=sun>☀️</span><span class=moon>🌙</span></i></button></div>
<div id=pinbox>${pinBlock()}</div></div>
<div class="card pc fu" style="--i:7"><h4 class=sec>Data & cadangan</h4><div class=row><button class=btn2 onclick="exp()">⬇️ Ekspor JSON</button><label class=btn2>⬆️ Impor JSON<input type=file accept=.json hidden onchange="imp(this.files[0]);this.value=''"></label></div></div>
${ref?'<button class="exit fu" style="--i:8" onclick="confirmOut()">Keluar Akun</button>':''}`}
// ---------- core
function render(){if(!S.cfg)return onboard();theme();$('#menu').hidden=true;$('#main').className=anim&&view=='profile'?'enter':'';anim=0;$('#title').textContent=TITLE[view];$('#main').innerHTML=({profile:vProfile,tracker:vTracker,weigh:vWeigh,body:vBody,hyd:vHyd,sleep:vSleep,game:vGame})[view]();
 if(view=='weigh')chart(S.weights.map(x=>x.d.slice(5)),S.weights.map(x=>x.w),'Berat (kg)');if(view=='hyd')chart(last(7).map(k=>k.slice(5)),last(7).map(k=>water(S.days[k]||{})),'Air (ml)')}
function chart(l,d,lb){if(ch)ch.destroy();const c=$('#c');if(c&&window.Chart)ch=new Chart(c,{type:'line',data:{labels:l,datasets:[{label:lb,data:d,tension:.3,borderColor:'#0f766e'}]}})}
const theme=()=>document.body.classList.toggle('dark',!!S.cfg?.dark);
const SN=()=>ref?3:2;
function onboard(){if(!obs)obs=P().photo?'body':'photo';$('#main').innerHTML=obs=='photo'?obPhoto():obBody()}
function obPhoto(){const p=P();return`<div class="card ob"><div class=step>Langkah ${SN()-1} dari ${SN()}</div><h2>Tambah foto wajahmu</h2><p class=note>Foto ini tampil di profilmu. Ambil selfie atau pilih dari galeri.</p>
<div class=obav id=obav>${avHTML(120,1)}</div>${p.name?'':'<input id=on maxlength=40 placeholder="Nama panggilan" autocomplete=nickname>'}
<div class=row><button onclick="pickPhoto(1)">📷 Ambil Selfie</button><button class=btn2 onclick="pickPhoto(0)">🖼️ Pilih dari Galeri</button></div>
<button id=obnext ${p.photo?'':'disabled'} onclick="obNext()">Lanjut Isi Data Tubuh</button><button class=lnk onclick="obNext(1)">Lewati dulu</button></div>`}
function obPrev(){$('#obav').innerHTML=avHTML(120,1);$('#obnext').disabled=!P().photo}
function obNext(skip){const i=$('#on');if(i){const n=i.value.trim();if(!n)return toast('Isi nama panggilan dulu');P().name=n;save()}if(!skip&&!P().photo)return;obs='body';render()}
function obBody(){return`<div class=card><div class=step>Langkah ${SN()} dari ${SN()}</div><h2>Halo${P().name?', '+esc(P().name):''}!</h2><p class=note>Isi data awal sebagai patokan perhitungan.</p><input id=oh type=number placeholder="Tinggi badan (cm)"><input id=ow type=number step=.1 placeholder="Berat badan awal (kg)"><input id=ot type=number step=.1 placeholder="Target berat akhir (kg)"><label>Target naik per minggu<select id=ok><option>0.25<option>0.5</select></label><button onclick="saveCfg()">Mulai</button></div>`}
function saveCfg(){const h=+$('#oh').value,w=+$('#ow').value,t=+$('#ot').value;if(!h||!w||!t)return toast('Lengkapi semua isian');S.cfg={h,w0:w,target:t,wk:+$('#ok').value,hyd:2000};S.weights=[{d:today(),w,c:[]}];save();render()}
const sha=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');
async function unlock(){if(await sha($('#pin').value)===S.cfg.pin){$('#lock').hidden=true;$('#pin').value=''}else toast('PIN salah')}
function notif(){if(!CFG.onesignalAppId)return toast('OneSignal belum diisi di config.js');OneSignalDeferred.push(async O=>{await O.Notifications.requestPermission();toast(O.Notifications.permission?'Notifikasi aktif ✅':'Izin ditolak');const b=$('#nbox');if(b)b.innerHTML=notifRow()})}
function exp(){S.lastBackup=Date.now();save();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({schema:1,exportedAt:new Date().toISOString(),data:S})],{type:'application/json'}));a.download='gaintrack-backup-'+today()+'.json';a.click()}
function imp(f){if(!f)return;const r=new FileReader();r.onload=()=>{try{const j=JSON.parse(r.result);if(j.schema!==1||!j.data)throw 0;const old=S.prof;S=j.data;if(!S.prof?.name&&!S.prof?.photo)S.prof=old;save();render();toast('Impor berhasil')}catch{toast('File backup tidak valid')}};r.readAsText(f)}
function authUI(m=0){$('#main').innerHTML=`<div class="card auth"><h2>${m?'Buat akun baru':'Masuk'}</h2><p class=note>Akun yang sama dipakai di semua perangkat.</p>${m?'<input id=nm0 maxlength=40 placeholder="Nama lengkap / panggilan" autocomplete=name>':''}<input id=em type=email placeholder=Email autocomplete=email><input id=pw type=password placeholder="Password (min. 6)" autocomplete="${m?'new-password':'current-password'}"><button onclick="auth(${m})">${m?'Daftar':'Masuk'}</button><button class=alt onclick="authUI(${m?0:1})">${m?'Sudah punya akun? Masuk':'Daftar akun baru'}</button></div>`}
async function auth(n){const a=firebase.auth(),e=$('#em').value,p=$('#pw').value,nm=n?$('#nm0').value.trim():'';if(n&&!nm)return toast('Isi nama dulu');pendName=nm;try{await(n?a.createUserWithEmailAndPassword(e,p):a.signInWithEmailAndPassword(e,p))}catch(x){pendName='';toast(x.message)}}
function start(){$('#menu').innerHTML=Object.entries(TITLE).map(([k,l])=>`<button onclick="go('${k}')">${l}</button>`).join('');if(S.cfg?.pin)$('#lock').hidden=false;render()}
function boot(){const l=localStorage.getItem(KEY);S=l?JSON.parse(l):blank();
 if(window.firebase&&CFG.firebase.apiKey){firebase.initializeApp(CFG.firebase);const db=firebase.firestore();db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
  firebase.auth().onAuthStateChanged(async u=>{if(!u){$('#lock').hidden=true;return authUI()}ref=db.doc('users/'+u.uid);
   try{const s=await ref.get();if(s.exists)S=s.data();else ref.set(JSON.parse(JSON.stringify(S)))}catch(e){}
   const pf=P();if(pendName){pf.name=pendName;u.updateProfile({displayName:pendName}).catch(()=>{});pendName='';save()}else if(!pf.name&&u.displayName){pf.name=u.displayName;save()}
   OneSignalDeferred.push(O=>O.login(u.uid));start()})}else start()}
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').then(r=>r.addEventListener('updatefound',()=>{const w=r.installing;w?.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)toast('Versi baru tersedia <button onclick=location.reload()>Muat ulang</button>')})}));
boot();
