/* Lumen · Calendario litúrgico (rito romano, calendario general con traslados de Colombia),
   leccionario y armado de la Misa del día. Datos: Liturgical Calendar Project (Apache-2.0)
   y Biblia Reina-Valera 1909 (dominio público). */
(function(root){
'use strict';

/* ---------- Fechas ---------- */
function D(y,m,d){ return new Date(y,m-1,d); }
function add(d,n){ var x=new Date(d.getFullYear(),d.getMonth(),d.getDate()); x.setDate(x.getDate()+n); return x; }
function diff(a,b){ return Math.round((D(a.getFullYear(),a.getMonth()+1,a.getDate())-D(b.getFullYear(),b.getMonth()+1,b.getDate()))/864e5); }
function same(a,b){ return diff(a,b)===0; }
var DAYEN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var DAYES=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
var ROM=['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI','XXII','XXIII','XXIV','XXV','XXVI','XXVII','XXVIII','XXIX','XXX','XXXI','XXXII','XXXIII','XXXIV'];
var MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function easter(Y){ var a=Y%19,b=Math.floor(Y/100),c=Y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1; return D(Y,mo,da); }
function advent1(Y){ var c=D(Y,12,25), w=c.getDay(); return add(c,-(w===0?7:w)-21); }
function epiphany(Y){ var j=D(Y,1,2); return add(j,(7-j.getDay())%7); }      // Colombia: domingo entre el 2 y el 8 de enero
function baptism(Y){ var e=epiphany(Y); return e.getDate()>=7?add(e,1):add(e,7); }

/* ---------- Datos ---------- */
var CAL=null, LEC=null;
function setData(cal,lec){ CAL=cal; LEC=lec;
  if(CAL.santos.OurLadyOfGuadalupe) CAL.santos.OurLadyOfGuadalupe.g=4; // fiesta en América Latina
}

/* ---------- Tiempo litúrgico ---------- */
function temporal(dt){
  var y=dt.getFullYear(), w=dt.getDay(), A1=advent1(y), E=easter(y), ash=add(E,-46), pent=add(E,49), ctk=add(A1,-7);
  var r={key:null,g:0,season:'ord',file:null};
  function S(key,g,season){ r.key=key; r.g=g; r.season=season; return r; }
  var m=dt.getMonth()+1, d=dt.getDate();
  // Navidad (25-31 dic)
  if(m===12&&d>=25){
    if(d===25) return S('Christmas',7,'nav');
    var hf=null; for(var i=26;i<=31;i++) if(D(y,12,i).getDay()===0) hf=i; if(!hf) hf=30;
    if(d===hf) return S('HolyFamily',5,'nav');
    if(d>=29) return S('ChristmasWeekdayDec'+d,3.5,'nav');
    return S('ChristmasOctave',3.5,'nav');
  }
  if(diff(dt,A1)>=0){
    var wk=Math.floor(diff(dt,A1)/7)+1;
    if(w===0) return S('Advent'+wk,7,'adv');
    if(m===12&&d>=17) return S('AdventWeekdayDec'+d,3.5,'adv');
    return S('AdventWeekday'+wk+DAYEN[w],0,'adv');
  }
  var ep=epiphany(y), bp=baptism(y);
  if(diff(dt,bp)<=0){
    if(m===1&&d===1) return S('MaryMotherOfGod',6,'nav');
    if(same(dt,ep)) return S('Epiphany',7,'nav');
    if(same(dt,bp)) return S('BaptismLord',5,'nav');
    if(diff(dt,ep)<0) return S('ChristmasWeekdayJan'+d,0,'nav');
    return S('DayAfterEpiphany'+DAYEN[w],0,'nav');
  }
  if(diff(dt,ash)<0){
    var ref=bp.getDay()===0?bp:add(bp,-1), wo=Math.floor(diff(dt,ref)/7)+1;
    return w===0?S('OrdSunday'+wo,5,'ord'):S('OrdWeekday'+wo+DAYEN[w],0,'ord');
  }
  if(diff(dt,E)<0){
    var dd=diff(dt,ash);
    if(dd===0) return S('AshWednesday',7,'cua');
    if(dd<4) return S(['','ThursdayAfterAshWednesday','FridayAfterAshWednesday','SaturdayAfterAshWednesday'][dd],3.5,'cua');
    var wl=Math.floor((dd-4)/7)+1;
    if(wl<=5) return w===0?S('Lent'+wl,7,'cua'):S('LentWeekday'+wl+DAYEN[w],3.5,'cua');
    return S(['PalmSun','MonHolyWeek','TueHolyWeek','WedHolyWeek','HolyThurs','GoodFri','EasterVigil'][w],7,'cua');
  }
  if(diff(dt,pent)<=0){
    var de=diff(dt,E);
    if(de===0) return S('Easter',7,'pas');
    if(de<7) return S(['','MonOctaveEaster','TueOctaveEaster','WedOctaveEaster','ThuOctaveEaster','FriOctaveEaster','SatOctaveEaster'][de],7,'pas');
    if(de===42) return S('Ascension',7,'pas');                  // Colombia: trasladada al domingo
    if(de===49) return S('Pentecost',7,'pas');
    var we=Math.floor(de/7)+1;
    return w===0?S('Easter'+we,7,'pas'):S('EasterWeekday'+we+DAYEN[w],0,'pas');
  }
  var dp=diff(dt,pent);
  if(dp===7) return S('Trinity',6,'ord');
  if(dp===14) return S('CorpusChristi',6,'ord');                // Colombia: trasladado al domingo
  if(dp===19) return S('SacredHeart',6,'ord');
  if(same(dt,ctk)) return S('ChristKing',6,'ord');
  var sun=add(dt,-w), wn=34-Math.round(diff(ctk,sun)/7);
  return w===0?S('OrdSunday'+wn,5,'ord'):S('OrdWeekday'+wn+DAYEN[w],0,'ord');
}

/* Santoral del día (con traslados de solemnidades) */
function sanctoral(dt){
  var y=dt.getFullYear(), E=easter(y), list=[];
  Object.keys(CAL.santos).forEach(function(k){ var s=CAL.santos[k]; if(s.since&&s.since>y) return;
    var at=D(y,s.m,s.d);
    if(k==='ImmaculateConception'&&at.getDay()===0) at=add(at,1);
    if(k==='StJoseph'){ var palm=add(E,-7); if(diff(at,palm)>=0&&diff(at,E)<=7) at=add(palm,-1); else if(at.getDay()===0) at=add(at,1); }
    if(k==='Annunciation'){ var palm2=add(E,-7); if(diff(at,palm2)>=0&&diff(at,E)<=7) at=add(E,8); else if(at.getDay()===0) at=add(at,1); }
    if(same(at,dt)) list.push({key:k,g:s.g,c:s.c,n:s.n});
  });
  var pent=add(E,49);
  if(y>=2018&&diff(dt,pent)===1) list.push({key:'MaryMotherChurch',g:3,c:'white',n:CAL.moviles.MaryMotherChurch.n});
  if(diff(dt,pent)===20) list.push({key:'ImmaculateHeart',g:3,c:'white',n:CAL.tiempo.n.ImmaculateHeart||'Inmaculado Corazón de la Bienaventurada Virgen María'});
  list.sort(function(a,b){ return b.g-a.g; });
  return list;
}

var SEASON={adv:'Adviento',nav:'Navidad',cua:'Cuaresma',pas:'Pascua',ord:'Tiempo Ordinario'};
var SEASONCOLOR={adv:'purple',nav:'white',cua:'purple',pas:'white',ord:'green'};
var COLOR_ES={white:'Blanco',green:'Verde',purple:'Morado',red:'Rojo',rose:'Rosado',black:'Negro'};
function weekdayName(key,w,season){
  var m;
  if((m=/^OrdWeekday(\d+)/.exec(key))) return DAYES[w]+' de la semana '+ROM[+m[1]]+' del Tiempo Ordinario';
  if((m=/^AdventWeekday(\d+)/.exec(key))) return DAYES[w]+' de la semana '+ROM[+m[1]]+' de Adviento';
  if((m=/^AdventWeekdayDec(\d+)/.exec(key))) return 'Feria de Adviento, '+m[1]+' de diciembre';
  if((m=/^LentWeekday(\d+)/.exec(key))) return DAYES[w]+' de la semana '+ROM[+m[1]]+' de Cuaresma';
  if((m=/^EasterWeekday(\d+)/.exec(key))) return DAYES[w]+' de la semana '+ROM[+m[1]]+' de Pascua';
  if(/OctaveEaster$/.test(key)) return DAYES[w]+' de la Octava de Pascua';
  if(/^ChristmasWeekday|^DayAfterEpiphany|ChristmasOctave/.test(key)) return DAYES[w]+' del tiempo de Navidad';
  if(key==='ThursdayAfterAshWednesday') return 'Jueves después de Ceniza';
  if(key==='FridayAfterAshWednesday') return 'Viernes después de Ceniza';
  if(key==='SaturdayAfterAshWednesday') return 'Sábado después de Ceniza';
  var map={MonHolyWeek:'Lunes Santo',TueHolyWeek:'Martes Santo',WedHolyWeek:'Miércoles Santo',HolyThurs:'Jueves Santo · Misa de la Cena del Señor',GoodFri:'Viernes Santo · Pasión del Señor',EasterVigil:'Sábado Santo · Vigilia Pascual'};
  return map[key]||null;
}

function day(dt){
  var t=temporal(dt), ss=sanctoral(dt), s=ss[0]||null, y=dt.getFullYear();
  var A1=advent1(y), litYear=diff(dt,A1)>=0?y+1:y;
  var cycle=['C','A','B'][litYear%3], wcyc=litYear%2?'I':'II';
  var cel={kind:'t',key:t.key,g:t.g,n:CAL.tiempo.n[t.key]||weekdayName(t.key,dt.getDay(),t.season)||'',c:CAL.tiempo.c[t.key]||SEASONCOLOR[t.season]};
  if(t.key==='Advent3'||t.key==='Lent4') cel.c='rose';
  var commem=null;
  if(s){
    var sg=s.g, wins=false;
    if(t.key.indexOf('OrdSunday')===0) wins=sg>=5;            // fiestas del Señor y solemnidades reemplazan el domingo ordinario
    else if(t.g>=7) wins=false;
    else wins=sg>t.g&&sg>=3;                                   // la memoria libre no reemplaza la feria
    if(t.key==='HolyFamily'||t.key==='BaptismLord'||t.key==='MaryMotherOfGod'||t.key==='Trinity'||t.key==='CorpusChristi'||t.key==='ChristKing'||t.key==='SacredHeart') wins=wins&&sg>=7;
    if(wins) cel={kind:'s',key:s.key,g:sg,n:s.n,c:s.c};
    else if(sg>=2) commem=s;
  }
  if(t.key==='ChristmasOctave'&&cel.kind==='t') cel.n='Octava de Navidad';
  var info={date:dt,season:t.season,seasonName:SEASON[t.season],cycle:cycle,wcyc:wcyc,litYear:litYear,cel:cel,temporal:t,commem:commem,santo:ss[0]||null,
    sunday:dt.getDay()===0,colorName:COLOR_ES[cel.c]||''};
  info.gloria=(info.sunday&&t.season!=='adv'&&t.season!=='cua')||cel.g>=4||/OctaveEaster$/.test(t.key)||t.key==='ChristmasOctave'||/^ChristmasWeekdayDec/.test(t.key)||t.key==='HolyThurs';
  if(t.key==='GoodFri') info.gloria=false;
  info.credo=info.sunday||cel.g>=6;
  if(t.key==='HolyThurs'||t.key==='GoodFri'||t.key==='EasterVigil') info.credo=false;
  info.special=t.key==='GoodFri'?'viernes':(t.key==='EasterVigil'?'vigilia':null);
  return info;
}

/* ---------- Lecturas (Leccionario: proyecto Lectio, MIT; Ordo Lectionum Missae 1981) ---------- */
var DAYK=['sun','mon','tue','wed','thu','fri','sat'];
var TKEY={Christmas:'nativity-of-the-lord',HolyFamily:'holy-family-of-jesus-mary-and-joseph',MaryMotherOfGod:'mary-mother-of-god',Christmas2:'second-sunday-after-christmas',Epiphany:'epiphany-of-the-lord',BaptismLord:'baptism-of-the-lord',PalmSun:'palm-sunday-of-the-passion-of-the-lord',HolyThurs:'thursday-of-the-lords-supper',GoodFri:'friday-of-the-passion-of-the-lord',EasterVigil:'easter-sunday',Easter:'easter-sunday',Ascension:'ascension-of-the-lord',Pentecost:'pentecost-sunday',Trinity:'most-holy-trinity',CorpusChristi:'most-holy-body-and-blood-of-christ',SacredHeart:'most-sacred-heart-of-jesus',ChristKing:'our-lord-jesus-christ-king-of-the-universe',AshWednesday:'lent-weekday-0-wed',ThursdayAfterAshWednesday:'lent-weekday-0-thu',FridayAfterAshWednesday:'lent-weekday-0-fri',SaturdayAfterAshWednesday:'lent-weekday-0-sat',MonHolyWeek:'lent-weekday-6-mon',TueHolyWeek:'lent-weekday-6-tue',WedHolyWeek:'lent-weekday-6-wed',MonOctaveEaster:'easter-monday',TueOctaveEaster:'easter-tuesday',WedOctaveEaster:'easter-wednesday',ThuOctaveEaster:'easter-thursday',FriOctaveEaster:'easter-friday',SatOctaveEaster:'easter-saturday'};
var SKEY={AllSaints:'all-saints',StAndrewAp:'andrew-apostle',Annunciation:'annunciation-of-the-lord',Assumption:'assumption-of-the-blessed-virgin-mary',StBarnabasAp:'barnabas-apostle',StBartholomewAp:'bartholomew-apostle',ChairStPeter:'chair-of-saint-peter-the-apostle',AllSouls:'commemoration-of-all-the-faithful-departed',ConversionStPaul:'conversion-of-saint-paul-the-apostle',DedicationStsPeterPaul:'dedication-of-the-basilicas-of-saints-peter-and-paul-apostles',DedicationLateran:'dedication-of-the-lateran-basilica',ExaltationCross:'exaltation-of-the-holy-cross',StFaustinaKowalska:'faustina-kowalska-virgin',StGregoryNarek:'gregory-of-narek-abbot',StHildegardBingen:'hildegard-of-bingen-abbess',GuardianAngels:'holy-guardian-angels',HolyInnocents:'holy-innocents-martyrs',ImmaculateConception:'immaculate-conception-of-the-blessed-virgin-mary',ImmaculateHeart:'immaculate-heart-of-mary',StJamesAp:'james-apostle',StJohnEvangelist:'john-apostle',StJohnAvila:'john-of-avila-priest',StJohnPaulII:'john-paul-ii-pope',StJohnXXIII:'john-xxiii-pope',StJoseph:'joseph-spouse-of-mary',StJosephWorker:'joseph-the-worker',StLawrenceDeacon:'lawrence-of-rome-deacon',StLukeEvangelist:'luke-evangelist',StMarkEvangelist:'mark-evangelist',StMartha:'martha-of-bethany-mary-of-bethany-and-lazarus-of-bethany',StMaryMagdalene:'mary-magdalene',MaryMotherChurch:'mary-mother-of-the-church',StMatthiasAp:'matthias-apostle',StsArchangels:'michael-gabriel-and-raphael-archangels',NameJesus:'most-holy-name-of-jesus',NativityJohnBaptist:'nativity-of-john-the-baptist',NativityVirginMary:'nativity-of-the-blessed-virgin-mary',OurLadyOfLoreto:'our-lady-of-loreto',OurLadyOfSorrows:'our-lady-of-sorrows',BeheadingJohnBaptist:'passion-of-saint-john-the-baptist',StPaulVI:'paul-vi-pope',StsPeterPaulAp:'peter-and-paul-apostles',StsPhilipJames:'philip-and-james-apostles',Presentation:'presentation-of-the-lord',StSimonStJudeAp:'simon-and-jude-apostles',StStephenProtomartyr:'stephen-the-first-martyr',StMotherTeresa:'teresa-of-calcutta-virgin',StThomasAp:'thomas-apostle',StsTimothyTitus:'timothy-of-ephesus-and-titus-of-crete-bishops',Transfiguration:'transfiguration-of-the-lord',Visitation:'visitation-of-mary',OurLadyOfGuadalupe:'our-lady-of-guadalupe'};
function temporalKey(k,dt){
  var m;
  if(TKEY[k]) return TKEY[k];
  if((m=/^Advent(\d)$/.exec(k))) return 'advent-sunday-'+m[1];
  if((m=/^Lent(\d)$/.exec(k))) return 'lent-sunday-'+m[1];
  if((m=/^Easter(\d)$/.exec(k))) return 'easter-sunday-'+m[1];
  if((m=/^OrdSunday(\d+)$/.exec(k))) return 'ot-sunday-'+m[1];
  if((m=/^OrdWeekday(\d+)/.exec(k))) return 'ot-weekday-'+m[1]+'-'+DAYK[dt.getDay()];
  if((m=/^AdventWeekdayDec(\d+)$/.exec(k))) return 'advent-december-'+m[1];
  if((m=/^AdventWeekday(\d+)/.exec(k))) return 'advent-weekday-'+m[1]+'-'+DAYK[dt.getDay()];
  if((m=/^LentWeekday(\d+)/.exec(k))) return 'lent-weekday-'+m[1]+'-'+DAYK[dt.getDay()];
  if((m=/^EasterWeekday(\d+)/.exec(k))) return 'easter-weekday-'+m[1]+'-'+DAYK[dt.getDay()];
  if((m=/^ChristmasWeekdayDec(\d+)$/.exec(k))) return 'christmas-octave-day-'+(+m[1]-24);
  if((m=/^ChristmasWeekdayJan(\d+)$/.exec(k))) return 'christmas-time-january-'+m[1];
  if(/^DayAfterEpiphany/.test(k)) return ['','monday','tuesday','wednesday','thursday','friday','saturday'][dt.getDay()]+'-after-epiphany';
  return null;
}
var SLOT={'first-reading':'Primera lectura','second-reading':'Segunda lectura','epistle':'Epístola','gospel':'Evangelio','psalm':'Salmo responsorial'};
var ORDN=['','Primera','Segunda','Tercera','Cuarta','Quinta','Sexta','Séptima','Octava'];
function readingsFor(info){
  var entry=null, massId='day';
  if(info.cel.kind==='s'&&info.cel.g>=4&&SKEY[info.cel.key]) entry=LEC[SKEY[info.cel.key]];
  if(!entry){ var tk=temporalKey(info.temporal.key,info.date); entry=tk&&LEC[tk]; }
  if(info.temporal.key==='EasterVigil') massId='easter-vigil';
  if(!entry) return [];
  var rows=entry[massId]||entry.day||entry[Object.keys(entry)[0]], bySlot={}, order=[];
  rows.forEach(function(r){ var slot=r[0], cyc=r[1];
    if(cyc&&cyc!==info.cycle&&cyc!==info.wcyc) return;
    if(!bySlot[slot]){ bySlot[slot]=[]; order.push(slot); }
    bySlot[slot].push(r); });
  var out=[];
  order.forEach(function(slot){
    var list=bySlot[slot], pick=list.filter(function(r){ return r[1]; })[0]||list[0];
    if(slot==='second-reading'&&!(info.sunday||info.cel.g>=6||info.special)) return;
    var m=/^(reading|psalm)-(\d)$/.exec(slot), label=SLOT[slot]||(m?(m[1]==='psalm'?'Salmo responsorial':ORDN[+m[2]]+' lectura'):slot);
    out.push({tipo:/^psalm/.test(slot)?'salmo':(slot==='gospel'?'evangelio':'lectura'),label:label,ref:pick[2],slot:slot});
  });
  var rank=function(x){ var s=x.slot; if(s==='first-reading') return 10; if(s==='psalm') return 11; if(s==='second-reading') return 12; if(s==='epistle') return 40; if(s==='gospel') return 50;
    var m=/^(reading|psalm)-(\d)$/.exec(s); return m?(+m[2])*2+(m[1]==='psalm'?1:0):30; };
  out.sort(function(a,b){ return rank(a)-rank(b); });
  if(info.temporal.key==='EasterVigil'){ var ep=out.filter(function(x){ return x.slot==='epistle'; })[0]; if(ep){ var ps=out.filter(function(x){ return x.slot==='psalm-8'; }); } }
  return out;
}

/* ---------- Citas bíblicas → texto RV1909 ---------- */
var BK={'genesis':1,'exodus':2,'leviticus':3,'numbers':4,'deuteronomy':5,'joshua':6,'judges':7,'ruth':8,'1 samuel':9,'2 samuel':10,'1 kings':11,'2 kings':12,'1 chronicles':13,'2 chronicles':14,'ezra':15,'nehemiah':16,'esther':17,'job':18,'psalm':19,'psalms':19,'proverbs':20,'proverbe':20,'ecclesiastes':21,'song of songs':22,'isaiah':23,'jeremiah':24,'lamentations':25,'ezekiel':26,'daniel':27,'hosea':28,'joel':29,'amos':30,'obadiah':31,'jonah':32,'micah':33,'nahum':34,'habakkuk':35,'zephaniah':36,'haggai':37,'zechariah':38,'malachi':39,'matthew':40,'mattthew':40,'mark':41,'marc':41,'luke':42,'john':43,'acts':44,'romans':45,'1 corinthians':46,'1 corithians':46,'2 corinthians':47,'galatians':48,'ephesians':49,'philippians':50,'colossians':51,'1 thessalonians':52,'2 thessalonians':53,'1 timothy':54,'2 timothy':55,'titus':56,'philemon':57,'hebrews':58,'hewbrews':58,'james':59,'1 peter':60,'1 pt':60,'2 peter':61,'1 john':62,'2 john':63,'3 john':64,'jude':65,'revelation':66};
var AB={'gn':1,'ex':2,'lv':3,'nm':4,'dt':5,'jos':6,'jgs':7,'ru':8,'1 sm':9,'2 sm':10,'1 kgs':11,'2 kgs':12,'1 chr':13,'2 chr':14,'ezr':15,'neh':16,'est':17,'jb':18,'ps':19,'prv':20,'eccl':21,'sg':22,'is':23,'jer':24,'lam':25,'ez':26,'dn':27,'hos':28,'jl':29,'am':30,'ob':31,'jon':32,'mi':33,'na':34,'hb':35,'zep':36,'hg':37,'zec':38,'mal':39,'mt':40,'mk':41,'lk':42,'jn':43,'acts':44,'rom':45,'1 cor':46,'2 cor':47,'gal':48,'eph':49,'phil':50,'col':51,'1 thes':52,'2 thes':53,'1 tm':54,'2 tm':55,'ti':56,'phlm':57,'heb':58,'jas':59,'1 pt':60,'2 pt':61,'1 jn':62,'2 jn':63,'3 jn':64,'jude':65,'rv':66};
for(var _k in AB) BK[_k]=AB[_k];
var DC={'tb':'Tobías','jdt':'Judit','wis':'Sabiduría','sir':'Eclesiástico','bar':'Baruc','1 mc':'1 Macabeos','2 mc':'2 Macabeos','tobit':'Tobías','tobiah':'Tobías','judith':'Judit','wisdom':'Sabiduría','sirach':'Eclesiástico','baruch':'Baruc','1 maccabees':'1 Macabeos','2 maccabees':'2 Macabeos'};
// Libros deuterocanónicos: ahora están en la Biblia de la app (67-73)
var DCB={'tb':67,'tobit':67,'tobiah':67,'jdt':68,'judith':68,'1 mc':69,'1 maccabees':69,'2 mc':70,'2 maccabees':70,'wis':71,'wisdom':71,'sir':72,'sirach':72,'bar':73,'baruch':73};
var NAMES=null;
// Diferencia de numeración de los salmos (el leccionario cuenta el título como versículo; la RV 1909 no)
var PSOFF={3:1,4:1,5:1,6:1,7:1,8:1,9:1,12:1,13:1,18:1,19:1,20:1,21:1,22:1,30:1,31:1,34:1,36:1,38:1,39:1,40:1,41:1,42:1,44:1,45:1,46:1,47:1,48:1,49:1,51:2,52:2,53:1,54:2,55:1,56:1,57:1,58:1,59:1,60:2,61:1,62:1,63:1,64:1,65:1,67:1,68:1,69:1,70:1,75:1,76:1,77:1,80:1,81:1,83:1,84:1,85:1,88:1,89:1,92:1,102:1,108:1,140:1,142:1};
function parseRef(ref){
  ref=String(ref||'').split('|')[0];
  ref=ref.replace(/^\s*Cf\.?\s*/i,'').replace(/[—–]/g,'-').replace(/\s+and\s+/g,', ').replace(/\s*\(\d+\)/g,'').trim();
  var m=/^(\d?\s?[A-Za-z][A-Za-z ]*?)\s+([\dA-Z].*)$/.exec(ref); if(!m) return null;
  var bname=m[1].toLowerCase().replace(/\s+/g,' '), spec=m[2];
  var bi=BK[bname]||DCB[bname]; if(bname==='maccabees') return {dc:'Macabeos',ref:ref};
  // Ester griego: la sección C del leccionario (oraciones de Mardoqueo y Ester) es Ester 4:18-47 en la Biblia de la app
  if(bname==='est'&&/^C:/.test(spec)){ spec='4:'+spec.slice(2).replace(/\d+/g,function(n){ return String(17+(+n)); }); bi=17; }
  else if(bname==='est'&&/^[A-F]/.test(spec)) return {dc:'Ester',spec:spec,ref:ref};
  if(!bi) return DC[bname]?{dc:DC[bname],spec:spec,ref:ref}:null;
  if((bi===31||bi===57||bi===63||bi===64||bi===65)&&spec.indexOf(':')<0) spec='1:'+spec;     // libros de un solo capítulo
  var segs=[], ch=null;
  spec.split(';').forEach(function(group){
    group.split(',').forEach(function(item){
      item=item.trim(); if(!item) return;
      var a=item.split('-'), s=a[0].trim(), e=(a[1]||'').trim(), sc, sv, ec, ev;
      if(s.indexOf(':')>=0){ sc=parseInt(s,10); sv=parseInt(s.split(':')[1],10); ch=sc; } else { sc=ch; sv=parseInt(s,10); }
      if(ch===null){ segs.push([sc||sv,1,sc||sv,999]); ch=sc||sv; return; }
      if(!e){ ec=sc; ev=sv; } else if(e.indexOf(':')>=0){ ec=parseInt(e,10); ev=parseInt(e.split(':')[1],10); ch=ec; } else { ec=sc; ev=parseInt(e,10); }
      if(isNaN(sv)) return; if(isNaN(ev)) ev=sv;
      segs.push([sc,sv,ec,ev]);
    });
  });
  if(!segs.length&&/^\d+$/.test(spec.trim())) segs.push([+spec,1,+spec,999]);
  return {book:bi,segs:segs,spec:spec,ref:ref};
}
function refEs(p){
  if(!p) return '';
  var name=p.book?NAMES[p.book-1][0]:p.dc;
  var spec=String(p.spec||'').replace(/,\s*/g,'. ').replace(/:/g,', ').replace(/;\s*/g,'; ');
  return name+' '+spec;
}
// Diferencias de numeración entre el Leccionario (texto hebreo/Vulgata) y la RV 1909
function mapCV(b,c,v){
  if(b===23&&c===8&&v===23) return [9,1];
  if(b===47&&c===13&&v===13) return [13,14];
  if(b===19) return [c,Math.max(1,v-(PSOFF[c]||0))];
  if(b===23&&c===9) return [9,v+1];
  if(b===33&&c===5) return [5,v+1];
  if(b===39&&c===3&&v>=19) return [4,v-18];
  if(b===29&&c===3) return [2,v+27];
  if(b===29&&c===4) return [3,v];
  if(b===38&&c===2) return v>=5?[2,v-4]:[1,v+17];
  if(b===28&&c===2) return [2,Math.max(1,v-2)];
  if(b===28&&c===14) return [14,Math.max(1,v-1)];
  // Daniel con el texto griego: 3:1-97 como el leccionario; 3:98-100 del leccionario son 4:1-3, y su 4:n es 4:n+3
  if(b===27&&c===3&&v>=98) return [4,v-97];
  if(b===27&&c===4) return [4,v+3];
  return [c,v];
}
function textOf(p,book){
  var out=[], seen={};
  p.segs.forEach(function(sg){
    for(var c=sg[0];c<=sg[2];c++){
      var from=(c===sg[0]?sg[1]:1), to=(c===sg[2]?sg[3]:999);
      for(var v=from;v<=to;v++){
        var m=mapCV(p.book,c,v), chap=book.c[m[0]-1]; if(!chap) break;
        if(m[1]>chap.length){ if(v>200) break; continue; }
        var id=m[0]+':'+m[1]; if(seen[id]) continue; seen[id]=1; if(chap[m[1]-1]) out.push({c:m[0],v:m[1],t:chap[m[1]-1]});
        if(to===999&&m[1]>=chap.length) break;
      }
    }
  });
  return out;
}
var INTRO={1:'Lectura del libro del Génesis',2:'Lectura del libro del Éxodo',3:'Lectura del libro del Levítico',4:'Lectura del libro de los Números',5:'Lectura del libro del Deuteronomio',6:'Lectura del libro de Josué',7:'Lectura del libro de los Jueces',8:'Lectura del libro de Rut',9:'Lectura del primer libro de Samuel',10:'Lectura del segundo libro de Samuel',11:'Lectura del primer libro de los Reyes',12:'Lectura del segundo libro de los Reyes',13:'Lectura del primer libro de las Crónicas',14:'Lectura del segundo libro de las Crónicas',15:'Lectura del libro de Esdras',16:'Lectura del libro de Nehemías',17:'Lectura del libro de Ester',18:'Lectura del libro de Job',20:'Lectura del libro de los Proverbios',21:'Lectura del libro del Eclesiastés',22:'Lectura del libro del Cantar de los Cantares',25:'Lectura del libro de las Lamentaciones',27:'Lectura de la profecía de Daniel',44:'Lectura del libro de los Hechos de los Apóstoles',45:'Lectura de la carta del apóstol san Pablo a los Romanos',46:'Lectura de la primera carta del apóstol san Pablo a los Corintios',47:'Lectura de la segunda carta del apóstol san Pablo a los Corintios',48:'Lectura de la carta del apóstol san Pablo a los Gálatas',49:'Lectura de la carta del apóstol san Pablo a los Efesios',50:'Lectura de la carta del apóstol san Pablo a los Filipenses',51:'Lectura de la carta del apóstol san Pablo a los Colosenses',52:'Lectura de la primera carta del apóstol san Pablo a los Tesalonicenses',53:'Lectura de la segunda carta del apóstol san Pablo a los Tesalonicenses',54:'Lectura de la primera carta del apóstol san Pablo a Timoteo',55:'Lectura de la segunda carta del apóstol san Pablo a Timoteo',56:'Lectura de la carta del apóstol san Pablo a Tito',57:'Lectura de la carta del apóstol san Pablo a Filemón',58:'Lectura de la carta a los Hebreos',59:'Lectura de la carta del apóstol Santiago',60:'Lectura de la primera carta del apóstol san Pedro',61:'Lectura de la segunda carta del apóstol san Pedro',62:'Lectura de la primera carta del apóstol san Juan',63:'Lectura de la segunda carta del apóstol san Juan',64:'Lectura de la tercera carta del apóstol san Juan',65:'Lectura de la carta del apóstol san Judas',66:'Lectura del libro del Apocalipsis',40:'Lectura del santo Evangelio según san Mateo',41:'Lectura del santo Evangelio según san Marcos',42:'Lectura del santo Evangelio según san Lucas',43:'Lectura del santo Evangelio según san Juan'};
INTRO[67]='Lectura del libro de Tobías';INTRO[68]='Lectura del libro de Judit';INTRO[69]='Lectura del primer libro de los Macabeos';INTRO[70]='Lectura del segundo libro de los Macabeos';INTRO[71]='Lectura del libro de la Sabiduría';INTRO[72]='Lectura del libro del Eclesiástico';INTRO[73]='Lectura de la profecía de Baruc';
function introOf(bi){ if(INTRO[bi]) return INTRO[bi]; if(bi>=23&&bi<=39) return 'Lectura del libro del profeta '+NAMES[bi-1][0]; return 'Lectura del libro de '+NAMES[bi-1][0]; }

/* ---------- Partes fijas de la Misa ---------- */
var T={
 senal:'En el nombre del Padre, y del Hijo, y del Espíritu Santo. Amén.',
 saludo:'La gracia de nuestro Señor Jesucristo, el amor del Padre y la comunión del Espíritu Santo estén con todos ustedes. Y con tu espíritu.',
 confieso:'Yo confieso ante Dios todopoderoso y ante ustedes, hermanos, que he pecado mucho de pensamiento, palabra, obra y omisión. Por mi culpa, por mi culpa, por mi gran culpa. Por eso ruego a santa María, siempre Virgen, a los ángeles, a los santos y a ustedes, hermanos, que intercedan por mí ante Dios, nuestro Señor. Dios todopoderoso tenga misericordia de nosotros, perdone nuestros pecados y nos lleve a la vida eterna. Amén.',
 kyrie:'Señor, ten piedad. Señor, ten piedad. Cristo, ten piedad. Cristo, ten piedad. Señor, ten piedad. Señor, ten piedad.',
 gloria:'Gloria a Dios en el cielo, y en la tierra paz a los hombres que ama el Señor. Por tu inmensa gloria te alabamos, te bendecimos, te adoramos, te glorificamos, te damos gracias, Señor Dios, Rey celestial, Dios Padre todopoderoso. Señor, Hijo único, Jesucristo. Señor Dios, Cordero de Dios, Hijo del Padre; tú que quitas el pecado del mundo, ten piedad de nosotros; tú que quitas el pecado del mundo, atiende nuestra súplica; tú que estás sentado a la derecha del Padre, ten piedad de nosotros; porque solo tú eres Santo, solo tú Señor, solo tú Altísimo, Jesucristo, con el Espíritu Santo en la gloria de Dios Padre. Amén.',
 colecta:'Oración colecta. El sacerdote reúne en una sola oración las intenciones de toda la asamblea y las presenta al Padre, por Jesucristo, en la unidad del Espíritu Santo. Amén.',
 trasLectura:'Palabra de Dios. Te alabamos, Señor.',
 evIni:'El Señor esté con ustedes. Y con tu espíritu.',
 evIni2:'Gloria a ti, Señor.',
 evFin:'Palabra del Señor. Gloria a ti, Señor Jesús.',
 aleluya:'Aleluya, aleluya, aleluya.',
 cuaresma:'Honor y gloria a ti, Señor Jesús.',
 homilia:'Homilía. Guardemos un momento de silencio para que la Palabra que hemos escuchado eche raíces en nuestro corazón.',
 credo:'Creo en un solo Dios, Padre todopoderoso, Creador del cielo y de la tierra, de todo lo visible y lo invisible. Creo en un solo Señor, Jesucristo, Hijo único de Dios, nacido del Padre antes de todos los siglos: Dios de Dios, Luz de Luz, Dios verdadero de Dios verdadero, engendrado, no creado, de la misma naturaleza del Padre, por quien todo fue hecho; que por nosotros, los hombres, y por nuestra salvación bajó del cielo, y por obra del Espíritu Santo se encarnó de María, la Virgen, y se hizo hombre; y por nuestra causa fue crucificado en tiempos de Poncio Pilato; padeció y fue sepultado, y resucitó al tercer día, según las Escrituras, y subió al cielo, y está sentado a la derecha del Padre; y de nuevo vendrá con gloria para juzgar a vivos y muertos, y su reino no tendrá fin. Creo en el Espíritu Santo, Señor y dador de vida, que procede del Padre y del Hijo, que con el Padre y el Hijo recibe una misma adoración y gloria, y que habló por los profetas. Creo en la Iglesia, que es una, santa, católica y apostólica. Confieso que hay un solo bautismo para el perdón de los pecados. Espero la resurrección de los muertos y la vida del mundo futuro. Amén.',
 fieles:'Oración de los fieles. Presentemos al Padre nuestras peticiones por la Iglesia, por quienes nos gobiernan, por los que sufren, por nuestras familias y por nuestra comunidad. A cada petición respondemos: Te rogamos, óyenos.',
 ofrendas:'Presentación de las ofrendas. El pan y el vino, fruto de la tierra y del trabajo del hombre, se llevan al altar. Bendito seas por siempre, Señor.',
 orad:'Oren, hermanos, para que este sacrificio, mío y de ustedes, sea agradable a Dios, Padre todopoderoso. El Señor reciba de tus manos este sacrificio, para alabanza y gloria de su nombre, para nuestro bien y el de toda su santa Iglesia.',
 prefacio:'El Señor esté con ustedes. Y con tu espíritu. Levantemos el corazón. Lo tenemos levantado hacia el Señor. Demos gracias al Señor, nuestro Dios. Es justo y necesario.',
 santo:'Santo, Santo, Santo es el Señor, Dios del universo. Llenos están el cielo y la tierra de tu gloria. Hosanna en el cielo. Bendito el que viene en nombre del Señor. Hosanna en el cielo.',
 consagracion:'Plegaria eucarística. En la consagración, el pan y el vino se convierten en el Cuerpo y la Sangre de Cristo. Adoremos en silencio. Este es el sacramento de nuestra fe. Anunciamos tu muerte, proclamamos tu resurrección. ¡Ven, Señor Jesús! Por Cristo, con él y en él, a ti, Dios Padre omnipotente, en la unidad del Espíritu Santo, todo honor y toda gloria por los siglos de los siglos. Amén.',
 padre:'Padre nuestro, que estás en el cielo, santificado sea tu Nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal. Tuyo es el reino, tuyo el poder y la gloria, por siempre, Señor.',
 paz:'La paz del Señor esté siempre con ustedes. Y con tu espíritu. Dense fraternalmente la paz.',
 cordero:'Cordero de Dios, que quitas el pecado del mundo, ten piedad de nosotros. Cordero de Dios, que quitas el pecado del mundo, ten piedad de nosotros. Cordero de Dios, que quitas el pecado del mundo, danos la paz.',
 digno:'Este es el Cordero de Dios, que quita el pecado del mundo. Dichosos los invitados a la cena del Señor. Señor, no soy digno de que entres en mi casa, pero una palabra tuya bastará para sanarme.',
 espiritual:'Comunión espiritual. Creo, Jesús mío, que estás realmente presente en el Santísimo Sacramento del altar. Te amo sobre todas las cosas y deseo recibirte en mi alma. Ya que ahora no puedo recibirte sacramentalmente, ven al menos espiritualmente a mi corazón. Como si ya te hubiese recibido, te abrazo y me uno todo a ti. No permitas, Señor, que jamás me separe de ti. Amén.',
 bendicion:'El Señor esté con ustedes. Y con tu espíritu. La bendición de Dios todopoderoso, Padre, Hijo y Espíritu Santo, descienda sobre ustedes. Amén.',
 despedida:'Pueden ir en paz. Demos gracias a Dios.',
 despedidaPascua:'Pueden ir en paz, aleluya, aleluya. Demos gracias a Dios, aleluya, aleluya.',
 adoracion:'Adoración de la santa Cruz. Miren el árbol de la Cruz, donde estuvo clavada la salvación del mundo. Vengan a adorarlo.',
 viernes:'Hoy la Iglesia no celebra la Misa. Se celebra la Pasión del Señor: Liturgia de la Palabra, oración universal, adoración de la Cruz y comunión.',
 vigilia:'Vigilia Pascual en la noche santa. Bendición del fuego y pregón pascual: Cristo, luz del mundo, ha resucitado.'
};

function tailSections(info){
  var out=[], cua=info.season==='cua', pas=info.season==='pas';
  function sec(title){ var s={title:title,parts:[]}; out.push(s); return s; }
  function P(s,h,text){ s.parts.push({h:h,text:text}); }
  if(info.special==='viernes'){
    var o=sec('Oración y adoración'); P(o,'Oración universal',T.fieles); P(o,'Adoración de la Cruz',T.adoracion);
    var c=sec('Sagrada Comunión'); P(c,'Padre Nuestro',T.padre); P(c,'Señor, no soy digno',T.digno); P(c,'Comunión espiritual',T.espiritual);
    return out;
  }
  var e=sec('Liturgia eucarística'); P(e,'Ofrendas',T.ofrendas); P(e,'Oren, hermanos',T.orad); P(e,'Prefacio',T.prefacio); P(e,'Santo',T.santo); P(e,'Consagración',T.consagracion);
  var c2=sec('Rito de comunión'); P(c2,'Padre Nuestro',T.padre); P(c2,'Rito de la paz',T.paz); P(c2,'Cordero de Dios',T.cordero); P(c2,'Señor, no soy digno',T.digno); P(c2,'Comunión espiritual',T.espiritual);
  var f=sec('Ritos de conclusión'); P(f,'Bendición',T.bendicion); P(f,'Despedida',(pas&&/OctaveEaster|^Easter$|^Pentecost$/.test(info.temporal.key))?T.despedidaPascua:T.despedida);
  return out;
}

/* Lectura → parte de la Misa con texto */
function readingPart(info,rd,book,p){
  var verses=book?textOf(p,book):[], body=verses.map(function(x){ return x.t; }).join(' ');
  var cua=info.season==='cua';
  if(rd.tipo==='salmo'){
    return {h:rd.label,ref:refEs(p),verses:verses,text:'Salmo responsorial. '+(p.book===19?'Salmo '+p.segs[0][0]+'. ':'')+body};
  }
  if(rd.tipo==='evangelio'){
    var pre=(cua?T.cuaresma:T.aleluya)+' '+T.evIni+' '+introOf(p.book)+'. '+T.evIni2+' ';
    return {h:rd.label,ref:refEs(p),verses:verses,text:pre+body+' '+T.evFin,gospel:true};
  }
  return {h:rd.label,ref:refEs(p),verses:verses,text:rd.label+'. '+introOf(p.book)+'. '+body+' '+T.trasLectura};
}

root.Liturgia={setData:setData,setNames:function(n){ NAMES=n; },day:day,readingsFor:readingsFor,parseRef:parseRef,refEs:refEs,textOf:textOf,
  tailSections:tailSections,readingPart:readingPart,T:T,easter:easter,D:D,add:add,MESES:MESES,DAYES:DAYES};
})(typeof window!=='undefined'?window:globalThis);
