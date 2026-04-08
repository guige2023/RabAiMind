function Nv(n,e){for(var t=0;t<e.length;t++){const i=e[t];if(typeof i!="string"&&!Array.isArray(i)){for(const r in i)if(r!=="default"&&!(r in n)){const s=Object.getOwnPropertyDescriptor(i,r);s&&Object.defineProperty(n,r,s.get?s:{enumerable:!0,get:()=>i[r]})}}}return Object.freeze(Object.defineProperty(n,Symbol.toStringTag,{value:"Module"}))}/**
* @vue/shared v3.5.30
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/function ih(n){const e=Object.create(null);for(const t of n.split(","))e[t]=1;return t=>t in e}const Ut={},Ds=[],Di=()=>{},gg=()=>!1,Ol=n=>n.charCodeAt(0)===111&&n.charCodeAt(1)===110&&(n.charCodeAt(2)>122||n.charCodeAt(2)<97),rh=n=>n.startsWith("onUpdate:"),Zt=Object.assign,sh=(n,e)=>{const t=n.indexOf(e);t>-1&&n.splice(t,1)},Uv=Object.prototype.hasOwnProperty,wt=(n,e)=>Uv.call(n,e),nt=Array.isArray,Ns=n=>ra(n)==="[object Map]",no=n=>ra(n)==="[object Set]",md=n=>ra(n)==="[object Date]",ut=n=>typeof n=="function",Wt=n=>typeof n=="string",hi=n=>typeof n=="symbol",Rt=n=>n!==null&&typeof n=="object",_g=n=>(Rt(n)||ut(n))&&ut(n.then)&&ut(n.catch),vg=Object.prototype.toString,ra=n=>vg.call(n),Ov=n=>ra(n).slice(8,-1),xg=n=>ra(n)==="[object Object]",Fl=n=>Wt(n)&&n!=="NaN"&&n[0]!=="-"&&""+parseInt(n,10)===n,Oo=ih(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"),Bl=n=>{const e=Object.create(null);return(t=>e[t]||(e[t]=n(t)))},Fv=/-\w/g,Rn=Bl(n=>n.replace(Fv,e=>e.slice(1).toUpperCase())),Bv=/\B([A-Z])/g,Or=Bl(n=>n.replace(Bv,"-$1").toLowerCase()),kl=Bl(n=>n.charAt(0).toUpperCase()+n.slice(1)),mc=Bl(n=>n?`on${kl(n)}`:""),Ci=(n,e)=>!Object.is(n,e),il=(n,...e)=>{for(let t=0;t<n.length;t++)n[t](...e)},yg=(n,e,t,i=!1)=>{Object.defineProperty(n,e,{configurable:!0,enumerable:!1,writable:i,value:t})},Vl=n=>{const e=parseFloat(n);return isNaN(e)?n:e},kv=n=>{const e=Wt(n)?Number(n):NaN;return isNaN(e)?n:e};let gd;const Hl=()=>gd||(gd=typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{});function oh(n){if(nt(n)){const e={};for(let t=0;t<n.length;t++){const i=n[t],r=Wt(i)?Gv(i):oh(i);if(r)for(const s in r)e[s]=r[s]}return e}else if(Wt(n)||Rt(n))return n}const Vv=/;(?![^(]*\))/g,Hv=/:([^]+)/,zv=/\/\*[^]*?\*\//g;function Gv(n){const e={};return n.replace(zv,"").split(Vv).forEach(t=>{if(t){const i=t.split(Hv);i.length>1&&(e[i[0].trim()]=i[1].trim())}}),e}function ah(n){let e="";if(Wt(n))e=n;else if(nt(n))for(let t=0;t<n.length;t++){const i=ah(n[t]);i&&(e+=i+" ")}else if(Rt(n))for(const t in n)n[t]&&(e+=t+" ");return e.trim()}const Wv="itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly",jv=ih(Wv);function Sg(n){return!!n||n===""}function Xv(n,e){if(n.length!==e.length)return!1;let t=!0;for(let i=0;t&&i<n.length;i++)t=Dr(n[i],e[i]);return t}function Dr(n,e){if(n===e)return!0;let t=md(n),i=md(e);if(t||i)return t&&i?n.getTime()===e.getTime():!1;if(t=hi(n),i=hi(e),t||i)return n===e;if(t=nt(n),i=nt(e),t||i)return t&&i?Xv(n,e):!1;if(t=Rt(n),i=Rt(e),t||i){if(!t||!i)return!1;const r=Object.keys(n).length,s=Object.keys(e).length;if(r!==s)return!1;for(const o in n){const a=n.hasOwnProperty(o),l=e.hasOwnProperty(o);if(a&&!l||!a&&l||!Dr(n[o],e[o]))return!1}}return String(n)===String(e)}function lh(n,e){return n.findIndex(t=>Dr(t,e))}const Mg=n=>!!(n&&n.__v_isRef===!0),qv=n=>Wt(n)?n:n==null?"":nt(n)||Rt(n)&&(n.toString===vg||!ut(n.toString))?Mg(n)?qv(n.value):JSON.stringify(n,bg,2):String(n),bg=(n,e)=>Mg(e)?bg(n,e.value):Ns(e)?{[`Map(${e.size})`]:[...e.entries()].reduce((t,[i,r],s)=>(t[gc(i,s)+" =>"]=r,t),{})}:no(e)?{[`Set(${e.size})`]:[...e.values()].map(t=>gc(t))}:hi(e)?gc(e):Rt(e)&&!nt(e)&&!xg(e)?String(e):e,gc=(n,e="")=>{var t;return hi(n)?`Symbol(${(t=n.description)!=null?t:e})`:n};/**
* @vue/reactivity v3.5.30
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let xn;class Eg{constructor(e=!1){this.detached=e,this._active=!0,this._on=0,this.effects=[],this.cleanups=[],this._isPaused=!1,this.__v_skip=!0,this.parent=xn,!e&&xn&&(this.index=(xn.scopes||(xn.scopes=[])).push(this)-1)}get active(){return this._active}pause(){if(this._active){this._isPaused=!0;let e,t;if(this.scopes)for(e=0,t=this.scopes.length;e<t;e++)this.scopes[e].pause();for(e=0,t=this.effects.length;e<t;e++)this.effects[e].pause()}}resume(){if(this._active&&this._isPaused){this._isPaused=!1;let e,t;if(this.scopes)for(e=0,t=this.scopes.length;e<t;e++)this.scopes[e].resume();for(e=0,t=this.effects.length;e<t;e++)this.effects[e].resume()}}run(e){if(this._active){const t=xn;try{return xn=this,e()}finally{xn=t}}}on(){++this._on===1&&(this.prevScope=xn,xn=this)}off(){this._on>0&&--this._on===0&&(xn=this.prevScope,this.prevScope=void 0)}stop(e){if(this._active){this._active=!1;let t,i;for(t=0,i=this.effects.length;t<i;t++)this.effects[t].stop();for(this.effects.length=0,t=0,i=this.cleanups.length;t<i;t++)this.cleanups[t]();if(this.cleanups.length=0,this.scopes){for(t=0,i=this.scopes.length;t<i;t++)this.scopes[t].stop(!0);this.scopes.length=0}if(!this.detached&&this.parent&&!e){const r=this.parent.scopes.pop();r&&r!==this&&(this.parent.scopes[this.index]=r,r.index=this.index)}this.parent=void 0}}}function dP(n){return new Eg(n)}function Kv(){return xn}function pP(n,e=!1){xn&&xn.cleanups.push(n)}let Ft;const _c=new WeakSet;class Tg{constructor(e){this.fn=e,this.deps=void 0,this.depsTail=void 0,this.flags=5,this.next=void 0,this.cleanup=void 0,this.scheduler=void 0,xn&&xn.active&&xn.effects.push(this)}pause(){this.flags|=64}resume(){this.flags&64&&(this.flags&=-65,_c.has(this)&&(_c.delete(this),this.trigger()))}notify(){this.flags&2&&!(this.flags&32)||this.flags&8||wg(this)}run(){if(!(this.flags&1))return this.fn();this.flags|=2,_d(this),Rg(this);const e=Ft,t=ui;Ft=this,ui=!0;try{return this.fn()}finally{Cg(this),Ft=e,ui=t,this.flags&=-3}}stop(){if(this.flags&1){for(let e=this.deps;e;e=e.nextDep)fh(e);this.deps=this.depsTail=void 0,_d(this),this.onStop&&this.onStop(),this.flags&=-2}}trigger(){this.flags&64?_c.add(this):this.scheduler?this.scheduler():this.runIfDirty()}runIfDirty(){zu(this)&&this.run()}get dirty(){return zu(this)}}let Ag=0,Fo,Bo;function wg(n,e=!1){if(n.flags|=8,e){n.next=Bo,Bo=n;return}n.next=Fo,Fo=n}function ch(){Ag++}function uh(){if(--Ag>0)return;if(Bo){let e=Bo;for(Bo=void 0;e;){const t=e.next;e.next=void 0,e.flags&=-9,e=t}}let n;for(;Fo;){let e=Fo;for(Fo=void 0;e;){const t=e.next;if(e.next=void 0,e.flags&=-9,e.flags&1)try{e.trigger()}catch(i){n||(n=i)}e=t}}if(n)throw n}function Rg(n){for(let e=n.deps;e;e=e.nextDep)e.version=-1,e.prevActiveLink=e.dep.activeLink,e.dep.activeLink=e}function Cg(n){let e,t=n.depsTail,i=t;for(;i;){const r=i.prevDep;i.version===-1?(i===t&&(t=r),fh(i),$v(i)):e=i,i.dep.activeLink=i.prevActiveLink,i.prevActiveLink=void 0,i=r}n.deps=e,n.depsTail=t}function zu(n){for(let e=n.deps;e;e=e.nextDep)if(e.dep.version!==e.version||e.dep.computed&&(Pg(e.dep.computed)||e.dep.version!==e.version))return!0;return!!n._dirty}function Pg(n){if(n.flags&4&&!(n.flags&16)||(n.flags&=-17,n.globalVersion===jo)||(n.globalVersion=jo,!n.isSSR&&n.flags&128&&(!n.deps&&!n._dirty||!zu(n))))return;n.flags|=2;const e=n.dep,t=Ft,i=ui;Ft=n,ui=!0;try{Rg(n);const r=n.fn(n._value);(e.version===0||Ci(r,n._value))&&(n.flags|=128,n._value=r,e.version++)}catch(r){throw e.version++,r}finally{Ft=t,ui=i,Cg(n),n.flags&=-3}}function fh(n,e=!1){const{dep:t,prevSub:i,nextSub:r}=n;if(i&&(i.nextSub=r,n.prevSub=void 0),r&&(r.prevSub=i,n.nextSub=void 0),t.subs===n&&(t.subs=i,!i&&t.computed)){t.computed.flags&=-5;for(let s=t.computed.deps;s;s=s.nextDep)fh(s,!0)}!e&&!--t.sc&&t.map&&t.map.delete(t.key)}function $v(n){const{prevDep:e,nextDep:t}=n;e&&(e.nextDep=t,n.prevDep=void 0),t&&(t.prevDep=e,n.nextDep=void 0)}let ui=!0;const Lg=[];function lr(){Lg.push(ui),ui=!1}function cr(){const n=Lg.pop();ui=n===void 0?!0:n}function _d(n){const{cleanup:e}=n;if(n.cleanup=void 0,e){const t=Ft;Ft=void 0;try{e()}finally{Ft=t}}}let jo=0;class Yv{constructor(e,t){this.sub=e,this.dep=t,this.version=t.version,this.nextDep=this.prevDep=this.nextSub=this.prevSub=this.prevActiveLink=void 0}}class hh{constructor(e){this.computed=e,this.version=0,this.activeLink=void 0,this.subs=void 0,this.map=void 0,this.key=void 0,this.sc=0,this.__v_skip=!0}track(e){if(!Ft||!ui||Ft===this.computed)return;let t=this.activeLink;if(t===void 0||t.sub!==Ft)t=this.activeLink=new Yv(Ft,this),Ft.deps?(t.prevDep=Ft.depsTail,Ft.depsTail.nextDep=t,Ft.depsTail=t):Ft.deps=Ft.depsTail=t,Ig(t);else if(t.version===-1&&(t.version=this.version,t.nextDep)){const i=t.nextDep;i.prevDep=t.prevDep,t.prevDep&&(t.prevDep.nextDep=i),t.prevDep=Ft.depsTail,t.nextDep=void 0,Ft.depsTail.nextDep=t,Ft.depsTail=t,Ft.deps===t&&(Ft.deps=i)}return t}trigger(e){this.version++,jo++,this.notify(e)}notify(e){ch();try{for(let t=this.subs;t;t=t.prevSub)t.sub.notify()&&t.sub.dep.notify()}finally{uh()}}}function Ig(n){if(n.dep.sc++,n.sub.flags&4){const e=n.dep.computed;if(e&&!n.dep.subs){e.flags|=20;for(let i=e.deps;i;i=i.nextDep)Ig(i)}const t=n.dep.subs;t!==n&&(n.prevSub=t,t&&(t.nextSub=n)),n.dep.subs=n}}const xl=new WeakMap,is=Symbol(""),Gu=Symbol(""),Xo=Symbol("");function yn(n,e,t){if(ui&&Ft){let i=xl.get(n);i||xl.set(n,i=new Map);let r=i.get(t);r||(i.set(t,r=new hh),r.map=i,r.key=t),r.track()}}function tr(n,e,t,i,r,s){const o=xl.get(n);if(!o){jo++;return}const a=l=>{l&&l.trigger()};if(ch(),e==="clear")o.forEach(a);else{const l=nt(n),c=l&&Fl(t);if(l&&t==="length"){const u=Number(i);o.forEach((h,d)=>{(d==="length"||d===Xo||!hi(d)&&d>=u)&&a(h)})}else switch((t!==void 0||o.has(void 0))&&a(o.get(t)),c&&a(o.get(Xo)),e){case"add":l?c&&a(o.get("length")):(a(o.get(is)),Ns(n)&&a(o.get(Gu)));break;case"delete":l||(a(o.get(is)),Ns(n)&&a(o.get(Gu)));break;case"set":Ns(n)&&a(o.get(is));break}}uh()}function Jv(n,e){const t=xl.get(n);return t&&t.get(e)}function ms(n){const e=bt(n);return e===n?e:(yn(e,"iterate",Xo),Gn(n)?e:e.map(di))}function zl(n){return yn(n=bt(n),"iterate",Xo),n}function Ai(n,e){return ur(n)?Hs(rs(n)?di(e):e):di(e)}const Zv={__proto__:null,[Symbol.iterator](){return vc(this,Symbol.iterator,n=>Ai(this,n))},concat(...n){return ms(this).concat(...n.map(e=>nt(e)?ms(e):e))},entries(){return vc(this,"entries",n=>(n[1]=Ai(this,n[1]),n))},every(n,e){return Xi(this,"every",n,e,void 0,arguments)},filter(n,e){return Xi(this,"filter",n,e,t=>t.map(i=>Ai(this,i)),arguments)},find(n,e){return Xi(this,"find",n,e,t=>Ai(this,t),arguments)},findIndex(n,e){return Xi(this,"findIndex",n,e,void 0,arguments)},findLast(n,e){return Xi(this,"findLast",n,e,t=>Ai(this,t),arguments)},findLastIndex(n,e){return Xi(this,"findLastIndex",n,e,void 0,arguments)},forEach(n,e){return Xi(this,"forEach",n,e,void 0,arguments)},includes(...n){return xc(this,"includes",n)},indexOf(...n){return xc(this,"indexOf",n)},join(n){return ms(this).join(n)},lastIndexOf(...n){return xc(this,"lastIndexOf",n)},map(n,e){return Xi(this,"map",n,e,void 0,arguments)},pop(){return _o(this,"pop")},push(...n){return _o(this,"push",n)},reduce(n,...e){return vd(this,"reduce",n,e)},reduceRight(n,...e){return vd(this,"reduceRight",n,e)},shift(){return _o(this,"shift")},some(n,e){return Xi(this,"some",n,e,void 0,arguments)},splice(...n){return _o(this,"splice",n)},toReversed(){return ms(this).toReversed()},toSorted(n){return ms(this).toSorted(n)},toSpliced(...n){return ms(this).toSpliced(...n)},unshift(...n){return _o(this,"unshift",n)},values(){return vc(this,"values",n=>Ai(this,n))}};function vc(n,e,t){const i=zl(n),r=i[e]();return i!==n&&!Gn(n)&&(r._next=r.next,r.next=()=>{const s=r._next();return s.done||(s.value=t(s.value)),s}),r}const Qv=Array.prototype;function Xi(n,e,t,i,r,s){const o=zl(n),a=o!==n&&!Gn(n),l=o[e];if(l!==Qv[e]){const h=l.apply(n,s);return a?di(h):h}let c=t;o!==n&&(a?c=function(h,d){return t.call(this,Ai(n,h),d,n)}:t.length>2&&(c=function(h,d){return t.call(this,h,d,n)}));const u=l.call(o,c,i);return a&&r?r(u):u}function vd(n,e,t,i){const r=zl(n),s=r!==n&&!Gn(n);let o=t,a=!1;r!==n&&(s?(a=i.length===0,o=function(c,u,h){return a&&(a=!1,c=Ai(n,c)),t.call(this,c,Ai(n,u),h,n)}):t.length>3&&(o=function(c,u,h){return t.call(this,c,u,h,n)}));const l=r[e](o,...i);return a?Ai(n,l):l}function xc(n,e,t){const i=bt(n);yn(i,"iterate",Xo);const r=i[e](...t);return(r===-1||r===!1)&&Gl(t[0])?(t[0]=bt(t[0]),i[e](...t)):r}function _o(n,e,t=[]){lr(),ch();const i=bt(n)[e].apply(n,t);return uh(),cr(),i}const ex=ih("__proto__,__v_isRef,__isVue"),Dg=new Set(Object.getOwnPropertyNames(Symbol).filter(n=>n!=="arguments"&&n!=="caller").map(n=>Symbol[n]).filter(hi));function tx(n){hi(n)||(n=String(n));const e=bt(this);return yn(e,"has",n),e.hasOwnProperty(n)}class Ng{constructor(e=!1,t=!1){this._isReadonly=e,this._isShallow=t}get(e,t,i){if(t==="__v_skip")return e.__v_skip;const r=this._isReadonly,s=this._isShallow;if(t==="__v_isReactive")return!r;if(t==="__v_isReadonly")return r;if(t==="__v_isShallow")return s;if(t==="__v_raw")return i===(r?s?fx:Bg:s?Fg:Og).get(e)||Object.getPrototypeOf(e)===Object.getPrototypeOf(i)?e:void 0;const o=nt(e);if(!r){let l;if(o&&(l=Zv[t]))return l;if(t==="hasOwnProperty")return tx}const a=Reflect.get(e,t,an(e)?e:i);if((hi(t)?Dg.has(t):ex(t))||(r||yn(e,"get",t),s))return a;if(an(a)){const l=o&&Fl(t)?a:a.value;return r&&Rt(l)?ju(l):l}return Rt(a)?r?ju(a):ph(a):a}}class Ug extends Ng{constructor(e=!1){super(!1,e)}set(e,t,i,r){let s=e[t];const o=nt(e)&&Fl(t);if(!this._isShallow){const c=ur(s);if(!Gn(i)&&!ur(i)&&(s=bt(s),i=bt(i)),!o&&an(s)&&!an(i))return c||(s.value=i),!0}const a=o?Number(t)<e.length:wt(e,t),l=Reflect.set(e,t,i,an(e)?e:r);return e===bt(r)&&(a?Ci(i,s)&&tr(e,"set",t,i):tr(e,"add",t,i)),l}deleteProperty(e,t){const i=wt(e,t);e[t];const r=Reflect.deleteProperty(e,t);return r&&i&&tr(e,"delete",t,void 0),r}has(e,t){const i=Reflect.has(e,t);return(!hi(t)||!Dg.has(t))&&yn(e,"has",t),i}ownKeys(e){return yn(e,"iterate",nt(e)?"length":is),Reflect.ownKeys(e)}}class nx extends Ng{constructor(e=!1){super(!0,e)}set(e,t){return!0}deleteProperty(e,t){return!0}}const ix=new Ug,rx=new nx,sx=new Ug(!0);const Wu=n=>n,ya=n=>Reflect.getPrototypeOf(n);function ox(n,e,t){return function(...i){const r=this.__v_raw,s=bt(r),o=Ns(s),a=n==="entries"||n===Symbol.iterator&&o,l=n==="keys"&&o,c=r[n](...i),u=t?Wu:e?Hs:di;return!e&&yn(s,"iterate",l?Gu:is),Zt(Object.create(c),{next(){const{value:h,done:d}=c.next();return d?{value:h,done:d}:{value:a?[u(h[0]),u(h[1])]:u(h),done:d}}})}}function Sa(n){return function(...e){return n==="delete"?!1:n==="clear"?void 0:this}}function ax(n,e){const t={get(r){const s=this.__v_raw,o=bt(s),a=bt(r);n||(Ci(r,a)&&yn(o,"get",r),yn(o,"get",a));const{has:l}=ya(o),c=e?Wu:n?Hs:di;if(l.call(o,r))return c(s.get(r));if(l.call(o,a))return c(s.get(a));s!==o&&s.get(r)},get size(){const r=this.__v_raw;return!n&&yn(bt(r),"iterate",is),r.size},has(r){const s=this.__v_raw,o=bt(s),a=bt(r);return n||(Ci(r,a)&&yn(o,"has",r),yn(o,"has",a)),r===a?s.has(r):s.has(r)||s.has(a)},forEach(r,s){const o=this,a=o.__v_raw,l=bt(a),c=e?Wu:n?Hs:di;return!n&&yn(l,"iterate",is),a.forEach((u,h)=>r.call(s,c(u),c(h),o))}};return Zt(t,n?{add:Sa("add"),set:Sa("set"),delete:Sa("delete"),clear:Sa("clear")}:{add(r){const s=bt(this),o=ya(s),a=bt(r),l=!e&&!Gn(r)&&!ur(r)?a:r;return o.has.call(s,l)||Ci(r,l)&&o.has.call(s,r)||Ci(a,l)&&o.has.call(s,a)||(s.add(l),tr(s,"add",l,l)),this},set(r,s){!e&&!Gn(s)&&!ur(s)&&(s=bt(s));const o=bt(this),{has:a,get:l}=ya(o);let c=a.call(o,r);c||(r=bt(r),c=a.call(o,r));const u=l.call(o,r);return o.set(r,s),c?Ci(s,u)&&tr(o,"set",r,s):tr(o,"add",r,s),this},delete(r){const s=bt(this),{has:o,get:a}=ya(s);let l=o.call(s,r);l||(r=bt(r),l=o.call(s,r)),a&&a.call(s,r);const c=s.delete(r);return l&&tr(s,"delete",r,void 0),c},clear(){const r=bt(this),s=r.size!==0,o=r.clear();return s&&tr(r,"clear",void 0,void 0),o}}),["keys","values","entries",Symbol.iterator].forEach(r=>{t[r]=ox(r,n,e)}),t}function dh(n,e){const t=ax(n,e);return(i,r,s)=>r==="__v_isReactive"?!n:r==="__v_isReadonly"?n:r==="__v_raw"?i:Reflect.get(wt(t,r)&&r in i?t:i,r,s)}const lx={get:dh(!1,!1)},cx={get:dh(!1,!0)},ux={get:dh(!0,!1)};const Og=new WeakMap,Fg=new WeakMap,Bg=new WeakMap,fx=new WeakMap;function hx(n){switch(n){case"Object":case"Array":return 1;case"Map":case"Set":case"WeakMap":case"WeakSet":return 2;default:return 0}}function dx(n){return n.__v_skip||!Object.isExtensible(n)?0:hx(Ov(n))}function ph(n){return ur(n)?n:mh(n,!1,ix,lx,Og)}function px(n){return mh(n,!1,sx,cx,Fg)}function ju(n){return mh(n,!0,rx,ux,Bg)}function mh(n,e,t,i,r){if(!Rt(n)||n.__v_raw&&!(e&&n.__v_isReactive))return n;const s=dx(n);if(s===0)return n;const o=r.get(n);if(o)return o;const a=new Proxy(n,s===2?i:t);return r.set(n,a),a}function rs(n){return ur(n)?rs(n.__v_raw):!!(n&&n.__v_isReactive)}function ur(n){return!!(n&&n.__v_isReadonly)}function Gn(n){return!!(n&&n.__v_isShallow)}function Gl(n){return n?!!n.__v_raw:!1}function bt(n){const e=n&&n.__v_raw;return e?bt(e):n}function mx(n){return!wt(n,"__v_skip")&&Object.isExtensible(n)&&yg(n,"__v_skip",!0),n}const di=n=>Rt(n)?ph(n):n,Hs=n=>Rt(n)?ju(n):n;function an(n){return n?n.__v_isRef===!0:!1}function yc(n){return kg(n,!1)}function mP(n){return kg(n,!0)}function kg(n,e){return an(n)?n:new gx(n,e)}class gx{constructor(e,t){this.dep=new hh,this.__v_isRef=!0,this.__v_isShallow=!1,this._rawValue=t?e:bt(e),this._value=t?e:di(e),this.__v_isShallow=t}get value(){return this.dep.track(),this._value}set value(e){const t=this._rawValue,i=this.__v_isShallow||Gn(e)||ur(e);e=i?e:bt(e),Ci(e,t)&&(this._rawValue=e,this._value=i?e:di(e),this.dep.trigger())}}function Vg(n){return an(n)?n.value:n}const _x={get:(n,e,t)=>e==="__v_raw"?n:Vg(Reflect.get(n,e,t)),set:(n,e,t,i)=>{const r=n[e];return an(r)&&!an(t)?(r.value=t,!0):Reflect.set(n,e,t,i)}};function Hg(n){return rs(n)?n:new Proxy(n,_x)}function gP(n){const e=nt(n)?new Array(n.length):{};for(const t in n)e[t]=xx(n,t);return e}class vx{constructor(e,t,i){this._object=e,this._key=t,this._defaultValue=i,this.__v_isRef=!0,this._value=void 0,this._raw=bt(e);let r=!0,s=e;if(!nt(e)||!Fl(String(t)))do r=!Gl(s)||Gn(s);while(r&&(s=s.__v_raw));this._shallow=r}get value(){let e=this._object[this._key];return this._shallow&&(e=Vg(e)),this._value=e===void 0?this._defaultValue:e}set value(e){if(this._shallow&&an(this._raw[this._key])){const t=this._object[this._key];if(an(t)){t.value=e;return}}this._object[this._key]=e}get dep(){return Jv(this._raw,this._key)}}function xx(n,e,t){return new vx(n,e,t)}class yx{constructor(e,t,i){this.fn=e,this.setter=t,this._value=void 0,this.dep=new hh(this),this.__v_isRef=!0,this.deps=void 0,this.depsTail=void 0,this.flags=16,this.globalVersion=jo-1,this.next=void 0,this.effect=this,this.__v_isReadonly=!t,this.isSSR=i}notify(){if(this.flags|=16,!(this.flags&8)&&Ft!==this)return wg(this,!0),!0}get value(){const e=this.dep.track();return Pg(this),e&&(e.version=this.dep.version),this._value}set value(e){this.setter&&this.setter(e)}}function Sx(n,e,t=!1){let i,r;return ut(n)?i=n:(i=n.get,r=n.set),new yx(i,r,t)}const Ma={},yl=new WeakMap;let Kr;function Mx(n,e=!1,t=Kr){if(t){let i=yl.get(t);i||yl.set(t,i=[]),i.push(n)}}function bx(n,e,t=Ut){const{immediate:i,deep:r,once:s,scheduler:o,augmentJob:a,call:l}=t,c=b=>r?b:Gn(b)||r===!1||r===0?nr(b,1):nr(b);let u,h,d,g,p=!1,x=!1;if(an(n)?(h=()=>n.value,p=Gn(n)):rs(n)?(h=()=>c(n),p=!0):nt(n)?(x=!0,p=n.some(b=>rs(b)||Gn(b)),h=()=>n.map(b=>{if(an(b))return b.value;if(rs(b))return c(b);if(ut(b))return l?l(b,2):b()})):ut(n)?e?h=l?()=>l(n,2):n:h=()=>{if(d){lr();try{d()}finally{cr()}}const b=Kr;Kr=u;try{return l?l(n,3,[g]):n(g)}finally{Kr=b}}:h=Di,e&&r){const b=h,I=r===!0?1/0:r;h=()=>nr(b(),I)}const m=Kv(),_=()=>{u.stop(),m&&m.active&&sh(m.effects,u)};if(s&&e){const b=e;e=(...I)=>{b(...I),_()}}let M=x?new Array(n.length).fill(Ma):Ma;const T=b=>{if(!(!(u.flags&1)||!u.dirty&&!b))if(e){const I=u.run();if(r||p||(x?I.some((D,B)=>Ci(D,M[B])):Ci(I,M))){d&&d();const D=Kr;Kr=u;try{const B=[I,M===Ma?void 0:x&&M[0]===Ma?[]:M,g];M=I,l?l(e,3,B):e(...B)}finally{Kr=D}}}else u.run()};return a&&a(T),u=new Tg(h),u.scheduler=o?()=>o(T,!1):T,g=b=>Mx(b,!1,u),d=u.onStop=()=>{const b=yl.get(u);if(b){if(l)l(b,4);else for(const I of b)I();yl.delete(u)}},e?i?T(!0):M=u.run():o?o(T.bind(null,!0),!0):u.run(),_.pause=u.pause.bind(u),_.resume=u.resume.bind(u),_.stop=_,_}function nr(n,e=1/0,t){if(e<=0||!Rt(n)||n.__v_skip||(t=t||new Map,(t.get(n)||0)>=e))return n;if(t.set(n,e),e--,an(n))nr(n.value,e,t);else if(nt(n))for(let i=0;i<n.length;i++)nr(n[i],e,t);else if(no(n)||Ns(n))n.forEach(i=>{nr(i,e,t)});else if(xg(n)){for(const i in n)nr(n[i],e,t);for(const i of Object.getOwnPropertySymbols(n))Object.prototype.propertyIsEnumerable.call(n,i)&&nr(n[i],e,t)}return n}/**
* @vue/runtime-core v3.5.30
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/function sa(n,e,t,i){try{return i?n(...i):n()}catch(r){oa(r,e,t)}}function pi(n,e,t,i){if(ut(n)){const r=sa(n,e,t,i);return r&&_g(r)&&r.catch(s=>{oa(s,e,t)}),r}if(nt(n)){const r=[];for(let s=0;s<n.length;s++)r.push(pi(n[s],e,t,i));return r}}function oa(n,e,t,i=!0){const r=e?e.vnode:null,{errorHandler:s,throwUnhandledErrorInProduction:o}=e&&e.appContext.config||Ut;if(e){let a=e.parent;const l=e.proxy,c=`https://vuejs.org/error-reference/#runtime-${t}`;for(;a;){const u=a.ec;if(u){for(let h=0;h<u.length;h++)if(u[h](n,l,c)===!1)return}a=a.parent}if(s){lr(),sa(s,null,10,[n,l,c]),cr();return}}Ex(n,t,r,i,o)}function Ex(n,e,t,i=!0,r=!1){if(r)throw n}const wn=[];let bi=-1;const Us=[];let Pr=null,Is=0;const zg=Promise.resolve();let Sl=null;function Gg(n){const e=Sl||zg;return n?e.then(this?n.bind(this):n):e}function Tx(n){let e=bi+1,t=wn.length;for(;e<t;){const i=e+t>>>1,r=wn[i],s=qo(r);s<n||s===n&&r.flags&2?e=i+1:t=i}return e}function gh(n){if(!(n.flags&1)){const e=qo(n),t=wn[wn.length-1];!t||!(n.flags&2)&&e>=qo(t)?wn.push(n):wn.splice(Tx(e),0,n),n.flags|=1,Wg()}}function Wg(){Sl||(Sl=zg.then(Xg))}function Ax(n){nt(n)?Us.push(...n):Pr&&n.id===-1?Pr.splice(Is+1,0,n):n.flags&1||(Us.push(n),n.flags|=1),Wg()}function xd(n,e,t=bi+1){for(;t<wn.length;t++){const i=wn[t];if(i&&i.flags&2){if(n&&i.id!==n.uid)continue;wn.splice(t,1),t--,i.flags&4&&(i.flags&=-2),i(),i.flags&4||(i.flags&=-2)}}}function jg(n){if(Us.length){const e=[...new Set(Us)].sort((t,i)=>qo(t)-qo(i));if(Us.length=0,Pr){Pr.push(...e);return}for(Pr=e,Is=0;Is<Pr.length;Is++){const t=Pr[Is];t.flags&4&&(t.flags&=-2),t.flags&8||t(),t.flags&=-2}Pr=null,Is=0}}const qo=n=>n.id==null?n.flags&2?-1:1/0:n.id;function Xg(n){try{for(bi=0;bi<wn.length;bi++){const e=wn[bi];e&&!(e.flags&8)&&(e.flags&4&&(e.flags&=-2),sa(e,e.i,e.i?15:14),e.flags&4||(e.flags&=-2))}}finally{for(;bi<wn.length;bi++){const e=wn[bi];e&&(e.flags&=-2)}bi=-1,wn.length=0,jg(),Sl=null,(wn.length||Us.length)&&Xg()}}let fn=null,qg=null;function Ml(n){const e=fn;return fn=n,qg=n&&n.type.__scopeId||null,e}function wx(n,e=fn,t){if(!e||n._n)return n;const i=(...r)=>{i._d&&Tl(-1);const s=Ml(e);let o;try{o=n(...r)}finally{Ml(s),i._d&&Tl(1)}return o};return i._n=!0,i._c=!0,i._d=!0,i}function _P(n,e){if(fn===null)return n;const t=Kl(fn),i=n.dirs||(n.dirs=[]);for(let r=0;r<e.length;r++){let[s,o,a,l=Ut]=e[r];s&&(ut(s)&&(s={mounted:s,updated:s}),s.deep&&nr(o),i.push({dir:s,instance:t,value:o,oldValue:void 0,arg:a,modifiers:l}))}return n}function Br(n,e,t,i){const r=n.dirs,s=e&&e.dirs;for(let o=0;o<r.length;o++){const a=r[o];s&&(a.oldValue=s[o].value);let l=a.dir[i];l&&(lr(),pi(l,t,8,[n.el,a,n,e]),cr())}}function Rx(n,e){if(un){let t=un.provides;const i=un.parent&&un.parent.provides;i===t&&(t=un.provides=Object.create(i)),t[n]=e}}function rl(n,e,t=!1){const i=ql();if(i||ss){let r=ss?ss._context.provides:i?i.parent==null||i.ce?i.vnode.appContext&&i.vnode.appContext.provides:i.parent.provides:void 0;if(r&&n in r)return r[n];if(arguments.length>1)return t&&ut(e)?e.call(i&&i.proxy):e}}function vP(){return!!(ql()||ss)}const Cx=Symbol.for("v-scx"),Px=()=>rl(Cx);function Sc(n,e,t){return Kg(n,e,t)}function Kg(n,e,t=Ut){const{immediate:i,deep:r,flush:s,once:o}=t,a=Zt({},t),l=e&&i||!e&&s!=="post";let c;if(zs){if(s==="sync"){const g=Px();c=g.__watcherHandles||(g.__watcherHandles=[])}else if(!l){const g=()=>{};return g.stop=Di,g.resume=Di,g.pause=Di,g}}const u=un;a.call=(g,p,x)=>pi(g,u,p,x);let h=!1;s==="post"?a.scheduler=g=>{vn(g,u&&u.suspense)}:s!=="sync"&&(h=!0,a.scheduler=(g,p)=>{p?g():gh(g)}),a.augmentJob=g=>{e&&(g.flags|=4),h&&(g.flags|=2,u&&(g.id=u.uid,g.i=u))};const d=bx(n,e,a);return zs&&(c?c.push(d):l&&d()),d}function Lx(n,e,t){const i=this.proxy,r=Wt(n)?n.includes(".")?$g(i,n):()=>i[n]:n.bind(i,i);let s;ut(e)?s=e:(s=e.handler,t=e);const o=la(this),a=Kg(r,s.bind(i),t);return o(),a}function $g(n,e){const t=e.split(".");return()=>{let i=n;for(let r=0;r<t.length&&i;r++)i=i[t[r]];return i}}const Yg=Symbol("_vte"),Jg=n=>n.__isTeleport,ko=n=>n&&(n.disabled||n.disabled===""),yd=n=>n&&(n.defer||n.defer===""),Sd=n=>typeof SVGElement<"u"&&n instanceof SVGElement,Md=n=>typeof MathMLElement=="function"&&n instanceof MathMLElement,Xu=(n,e)=>{const t=n&&n.to;return Wt(t)?e?e(t):null:t},Zg={name:"Teleport",__isTeleport:!0,process(n,e,t,i,r,s,o,a,l,c){const{mc:u,pc:h,pbc:d,o:{insert:g,querySelector:p,createText:x,createComment:m}}=c,_=ko(e.props);let{shapeFlag:M,children:T,dynamicChildren:b}=e;if(n==null){const I=e.el=x(""),D=e.anchor=x("");g(I,t,i),g(D,t,i);const B=(w,L)=>{M&16&&u(T,w,L,r,s,o,a,l)},E=()=>{const w=e.target=Xu(e.props,p),L=qu(w,e,x,g);w&&(o!=="svg"&&Sd(w)?o="svg":o!=="mathml"&&Md(w)&&(o="mathml"),r&&r.isCE&&(r.ce._teleportTargets||(r.ce._teleportTargets=new Set)).add(w),_||(B(w,L),sl(e,!1)))};_&&(B(t,D),sl(e,!0)),yd(e.props)?(e.el.__isMounted=!1,vn(()=>{E(),delete e.el.__isMounted},s)):E()}else{if(yd(e.props)&&n.el.__isMounted===!1){vn(()=>{Zg.process(n,e,t,i,r,s,o,a,l,c)},s);return}e.el=n.el,e.targetStart=n.targetStart;const I=e.anchor=n.anchor,D=e.target=n.target,B=e.targetAnchor=n.targetAnchor,E=ko(n.props),w=E?t:D,L=E?I:B;if(o==="svg"||Sd(D)?o="svg":(o==="mathml"||Md(D))&&(o="mathml"),b?(d(n.dynamicChildren,b,w,r,s,o,a),Sh(n,e,!0)):l||h(n,e,w,L,r,s,o,a,!1),_)E?e.props&&n.props&&e.props.to!==n.props.to&&(e.props.to=n.props.to):ba(e,t,I,c,1);else if((e.props&&e.props.to)!==(n.props&&n.props.to)){const R=e.target=Xu(e.props,p);R&&ba(e,R,null,c,0)}else E&&ba(e,D,B,c,1);sl(e,_)}},remove(n,e,t,{um:i,o:{remove:r}},s){const{shapeFlag:o,children:a,anchor:l,targetStart:c,targetAnchor:u,target:h,props:d}=n;if(h&&(r(c),r(u)),s&&r(l),o&16){const g=s||!ko(d);for(let p=0;p<a.length;p++){const x=a[p];i(x,e,t,g,!!x.dynamicChildren)}}},move:ba,hydrate:Ix};function ba(n,e,t,{o:{insert:i},m:r},s=2){s===0&&i(n.targetAnchor,e,t);const{el:o,anchor:a,shapeFlag:l,children:c,props:u}=n,h=s===2;if(h&&i(o,e,t),(!h||ko(u))&&l&16)for(let d=0;d<c.length;d++)r(c[d],e,t,2);h&&i(a,e,t)}function Ix(n,e,t,i,r,s,{o:{nextSibling:o,parentNode:a,querySelector:l,insert:c,createText:u}},h){function d(m,_){let M=_;for(;M;){if(M&&M.nodeType===8){if(M.data==="teleport start anchor")e.targetStart=M;else if(M.data==="teleport anchor"){e.targetAnchor=M,m._lpa=e.targetAnchor&&o(e.targetAnchor);break}}M=o(M)}}function g(m,_){_.anchor=h(o(m),_,a(m),t,i,r,s)}const p=e.target=Xu(e.props,l),x=ko(e.props);if(p){const m=p._lpa||p.firstChild;e.shapeFlag&16&&(x?(g(n,e),d(p,m),e.targetAnchor||qu(p,e,u,c,a(n)===p?n:null)):(e.anchor=o(n),d(p,m),e.targetAnchor||qu(p,e,u,c),h(m&&o(m),e,p,t,i,r,s))),sl(e,x)}else x&&e.shapeFlag&16&&(g(n,e),e.targetStart=n,e.targetAnchor=o(n));return e.anchor&&o(e.anchor)}const xP=Zg;function sl(n,e){const t=n.ctx;if(t&&t.ut){let i,r;for(e?(i=n.el,r=n.anchor):(i=n.targetStart,r=n.targetAnchor);i&&i!==r;)i.nodeType===1&&i.setAttribute("data-v-owner",t.uid),i=i.nextSibling;t.ut()}}function qu(n,e,t,i,r=null){const s=e.targetStart=t(""),o=e.targetAnchor=t("");return s[Yg]=o,n&&(i(s,n,r),i(o,n,r)),o}const Ti=Symbol("_leaveCb"),vo=Symbol("_enterCb");function Qg(){const n={isMounted:!1,isLeaving:!1,isUnmounting:!1,leavingVNodes:new Map};return s_(()=>{n.isMounted=!0}),a_(()=>{n.isUnmounting=!0}),n}const qn=[Function,Array],e_={mode:String,appear:Boolean,persisted:Boolean,onBeforeEnter:qn,onEnter:qn,onAfterEnter:qn,onEnterCancelled:qn,onBeforeLeave:qn,onLeave:qn,onAfterLeave:qn,onLeaveCancelled:qn,onBeforeAppear:qn,onAppear:qn,onAfterAppear:qn,onAppearCancelled:qn},t_=n=>{const e=n.subTree;return e.component?t_(e.component):e},Dx={name:"BaseTransition",props:e_,setup(n,{slots:e}){const t=ql(),i=Qg();return()=>{const r=e.default&&_h(e.default(),!0);if(!r||!r.length)return;const s=n_(r),o=bt(n),{mode:a}=o;if(i.isLeaving)return Mc(s);const l=bd(s);if(!l)return Mc(s);let c=Ko(l,o,i,t,h=>c=h);l.type!==Sn&&as(l,c);let u=t.subTree&&bd(t.subTree);if(u&&u.type!==Sn&&!Yr(u,l)&&t_(t).type!==Sn){let h=Ko(u,o,i,t);if(as(u,h),a==="out-in"&&l.type!==Sn)return i.isLeaving=!0,h.afterLeave=()=>{i.isLeaving=!1,t.job.flags&8||t.update(),delete h.afterLeave,u=void 0},Mc(s);a==="in-out"&&l.type!==Sn?h.delayLeave=(d,g,p)=>{const x=i_(i,u);x[String(u.key)]=u,d[Ti]=()=>{g(),d[Ti]=void 0,delete c.delayedLeave,u=void 0},c.delayedLeave=()=>{p(),delete c.delayedLeave,u=void 0}}:u=void 0}else u&&(u=void 0);return s}}};function n_(n){let e=n[0];if(n.length>1){for(const t of n)if(t.type!==Sn){e=t;break}}return e}const Nx=Dx;function i_(n,e){const{leavingVNodes:t}=n;let i=t.get(e.type);return i||(i=Object.create(null),t.set(e.type,i)),i}function Ko(n,e,t,i,r){const{appear:s,mode:o,persisted:a=!1,onBeforeEnter:l,onEnter:c,onAfterEnter:u,onEnterCancelled:h,onBeforeLeave:d,onLeave:g,onAfterLeave:p,onLeaveCancelled:x,onBeforeAppear:m,onAppear:_,onAfterAppear:M,onAppearCancelled:T}=e,b=String(n.key),I=i_(t,n),D=(w,L)=>{w&&pi(w,i,9,L)},B=(w,L)=>{const R=L[1];D(w,L),nt(w)?w.every(U=>U.length<=1)&&R():w.length<=1&&R()},E={mode:o,persisted:a,beforeEnter(w){let L=l;if(!t.isMounted)if(s)L=m||l;else return;w[Ti]&&w[Ti](!0);const R=I[b];R&&Yr(n,R)&&R.el[Ti]&&R.el[Ti](),D(L,[w])},enter(w){if(I[b]===n)return;let L=c,R=u,U=h;if(!t.isMounted)if(s)L=_||c,R=M||u,U=T||h;else return;let H=!1;w[vo]=J=>{H||(H=!0,J?D(U,[w]):D(R,[w]),E.delayedLeave&&E.delayedLeave(),w[vo]=void 0)};const q=w[vo].bind(null,!1);L?B(L,[w,q]):q()},leave(w,L){const R=String(n.key);if(w[vo]&&w[vo](!0),t.isUnmounting)return L();D(d,[w]);let U=!1;w[Ti]=q=>{U||(U=!0,L(),q?D(x,[w]):D(p,[w]),w[Ti]=void 0,I[R]===n&&delete I[R])};const H=w[Ti].bind(null,!1);I[R]=n,g?B(g,[w,H]):H()},clone(w){const L=Ko(w,e,t,i,r);return r&&r(L),L}};return E}function Mc(n){if(aa(n))return n=Nr(n),n.children=null,n}function bd(n){if(!aa(n))return Jg(n.type)&&n.children?n_(n.children):n;if(n.component)return n.component.subTree;const{shapeFlag:e,children:t}=n;if(t){if(e&16)return t[0];if(e&32&&ut(t.default))return t.default()}}function as(n,e){n.shapeFlag&6&&n.component?(n.transition=e,as(n.component.subTree,e)):n.shapeFlag&128?(n.ssContent.transition=e.clone(n.ssContent),n.ssFallback.transition=e.clone(n.ssFallback)):n.transition=e}function _h(n,e=!1,t){let i=[],r=0;for(let s=0;s<n.length;s++){let o=n[s];const a=t==null?o.key:String(t)+String(o.key!=null?o.key:s);o.type===In?(o.patchFlag&128&&r++,i=i.concat(_h(o.children,e,a))):(e||o.type!==Sn)&&i.push(a!=null?Nr(o,{key:a}):o)}if(r>1)for(let s=0;s<i.length;s++)i[s].patchFlag=-2;return i}function Ux(n,e){return ut(n)?Zt({name:n.name},e,{setup:n}):n}function vh(n){n.ids=[n.ids[0]+n.ids[2]+++"-",0,0]}function Ed(n,e){let t;return!!((t=Object.getOwnPropertyDescriptor(n,e))&&!t.configurable)}const bl=new WeakMap;function Vo(n,e,t,i,r=!1){if(nt(n)){n.forEach((x,m)=>Vo(x,e&&(nt(e)?e[m]:e),t,i,r));return}if(Os(i)&&!r){i.shapeFlag&512&&i.type.__asyncResolved&&i.component.subTree.component&&Vo(n,e,t,i.component.subTree);return}const s=i.shapeFlag&4?Kl(i.component):i.el,o=r?null:s,{i:a,r:l}=n,c=e&&e.r,u=a.refs===Ut?a.refs={}:a.refs,h=a.setupState,d=bt(h),g=h===Ut?gg:x=>Ed(u,x)?!1:wt(d,x),p=(x,m)=>!(m&&Ed(u,m));if(c!=null&&c!==l){if(Td(e),Wt(c))u[c]=null,g(c)&&(h[c]=null);else if(an(c)){const x=e;p(c,x.k)&&(c.value=null),x.k&&(u[x.k]=null)}}if(ut(l))sa(l,a,12,[o,u]);else{const x=Wt(l),m=an(l);if(x||m){const _=()=>{if(n.f){const M=x?g(l)?h[l]:u[l]:p()||!n.k?l.value:u[n.k];if(r)nt(M)&&sh(M,s);else if(nt(M))M.includes(s)||M.push(s);else if(x)u[l]=[s],g(l)&&(h[l]=u[l]);else{const T=[s];p(l,n.k)&&(l.value=T),n.k&&(u[n.k]=T)}}else x?(u[l]=o,g(l)&&(h[l]=o)):m&&(p(l,n.k)&&(l.value=o),n.k&&(u[n.k]=o))};if(o){const M=()=>{_(),bl.delete(n)};M.id=-1,bl.set(n,M),vn(M,t)}else Td(n),_()}}}function Td(n){const e=bl.get(n);e&&(e.flags|=8,bl.delete(n))}const Ad=n=>n.nodeType===8;Hl().requestIdleCallback;Hl().cancelIdleCallback;function Ox(n,e){if(Ad(n)&&n.data==="["){let t=1,i=n.nextSibling;for(;i;){if(i.nodeType===1){if(e(i)===!1)break}else if(Ad(i))if(i.data==="]"){if(--t===0)break}else i.data==="["&&t++;i=i.nextSibling}}else e(n)}const Os=n=>!!n.type.__asyncLoader;function yP(n){ut(n)&&(n={loader:n});const{loader:e,loadingComponent:t,errorComponent:i,delay:r=200,hydrate:s,timeout:o,suspensible:a=!0,onError:l}=n;let c=null,u,h=0;const d=()=>(h++,c=null,g()),g=()=>{let p;return c||(p=c=e().catch(x=>{if(x=x instanceof Error?x:new Error(String(x)),l)return new Promise((m,_)=>{l(x,()=>m(d()),()=>_(x),h+1)});throw x}).then(x=>p!==c&&c?c:(x&&(x.__esModule||x[Symbol.toStringTag]==="Module")&&(x=x.default),u=x,x)))};return Ux({name:"AsyncComponentWrapper",__asyncLoader:g,__asyncHydrate(p,x,m){let _=!1;(x.bu||(x.bu=[])).push(()=>_=!0);const M=()=>{_||m()},T=s?()=>{const b=s(M,I=>Ox(p,I));b&&(x.bum||(x.bum=[])).push(b)}:M;u?T():g().then(()=>!x.isUnmounted&&T())},get __asyncResolved(){return u},setup(){const p=un;if(vh(p),u)return()=>Ea(u,p);const x=T=>{c=null,oa(T,p,13,!i)};if(a&&p.suspense||zs)return g().then(T=>()=>Ea(T,p)).catch(T=>(x(T),()=>i?tn(i,{error:T}):null));const m=yc(!1),_=yc(),M=yc(!!r);return r&&setTimeout(()=>{M.value=!1},r),o!=null&&setTimeout(()=>{if(!m.value&&!_.value){const T=new Error(`Async component timed out after ${o}ms.`);x(T),_.value=T}},o),g().then(()=>{m.value=!0,p.parent&&aa(p.parent.vnode)&&p.parent.update()}).catch(T=>{x(T),_.value=T}),()=>{if(m.value&&u)return Ea(u,p);if(_.value&&i)return tn(i,{error:_.value});if(t&&!M.value)return Ea(t,p)}}})}function Ea(n,e){const{ref:t,props:i,children:r,ce:s}=e.vnode,o=tn(n,i,r);return o.ref=t,o.ce=s,delete e.vnode.ce,o}const aa=n=>n.type.__isKeepAlive;function Fx(n,e){r_(n,"a",e)}function Bx(n,e){r_(n,"da",e)}function r_(n,e,t=un){const i=n.__wdc||(n.__wdc=()=>{let r=t;for(;r;){if(r.isDeactivated)return;r=r.parent}return n()});if(Wl(e,i,t),t){let r=t.parent;for(;r&&r.parent;)aa(r.parent.vnode)&&kx(i,e,t,r),r=r.parent}}function kx(n,e,t,i){const r=Wl(e,n,i,!0);l_(()=>{sh(i[e],r)},t)}function Wl(n,e,t=un,i=!1){if(t){const r=t[n]||(t[n]=[]),s=e.__weh||(e.__weh=(...o)=>{lr();const a=la(t),l=pi(e,t,n,o);return a(),cr(),l});return i?r.unshift(s):r.push(s),s}}const pr=n=>(e,t=un)=>{(!zs||n==="sp")&&Wl(n,(...i)=>e(...i),t)},Vx=pr("bm"),s_=pr("m"),Hx=pr("bu"),o_=pr("u"),a_=pr("bum"),l_=pr("um"),zx=pr("sp"),Gx=pr("rtg"),Wx=pr("rtc");function jx(n,e=un){Wl("ec",n,e)}const Xx="components";function SP(n,e){return Kx(Xx,n,!0,e)||n}const qx=Symbol.for("v-ndc");function Kx(n,e,t=!0,i=!1){const r=fn||un;if(r){const s=r.type;{const a=Dy(s,!1);if(a&&(a===e||a===Rn(e)||a===kl(Rn(e))))return s}const o=wd(r[n]||s[n],e)||wd(r.appContext[n],e);return!o&&i?s:o}}function wd(n,e){return n&&(n[e]||n[Rn(e)]||n[kl(Rn(e))])}function MP(n,e,t,i){let r;const s=t,o=nt(n);if(o||Wt(n)){const a=o&&rs(n);let l=!1,c=!1;a&&(l=!Gn(n),c=ur(n),n=zl(n)),r=new Array(n.length);for(let u=0,h=n.length;u<h;u++)r[u]=e(l?c?Hs(di(n[u])):di(n[u]):n[u],u,void 0,s)}else if(typeof n=="number"){r=new Array(n);for(let a=0;a<n;a++)r[a]=e(a+1,a,void 0,s)}else if(Rt(n))if(n[Symbol.iterator])r=Array.from(n,(a,l)=>e(a,l,void 0,s));else{const a=Object.keys(n);r=new Array(a.length);for(let l=0,c=a.length;l<c;l++){const u=a[l];r[l]=e(n[u],u,l,s)}}else r=[];return r}function bP(n,e,t={},i,r){if(fn.ce||fn.parent&&Os(fn.parent)&&fn.parent.ce){const c=Object.keys(t).length>0;return Zu(),Qu(In,null,[tn("slot",t,i)],c?-2:64)}let s=n[e];s&&s._c&&(s._d=!1),Zu();const o=s&&c_(s(t)),a=t.key||o&&o.key,l=Qu(In,{key:(a&&!hi(a)?a:`_${e}`)+(!o&&i?"_fb":"")},o||[],o&&n._===1?64:-2);return s&&s._c&&(s._d=!0),l}function c_(n){return n.some(e=>Yo(e)?!(e.type===Sn||e.type===In&&!c_(e.children)):!0)?n:null}const Ku=n=>n?C_(n)?Kl(n):Ku(n.parent):null,Ho=Zt(Object.create(null),{$:n=>n,$el:n=>n.vnode.el,$data:n=>n.data,$props:n=>n.props,$attrs:n=>n.attrs,$slots:n=>n.slots,$refs:n=>n.refs,$parent:n=>Ku(n.parent),$root:n=>Ku(n.root),$host:n=>n.ce,$emit:n=>n.emit,$options:n=>f_(n),$forceUpdate:n=>n.f||(n.f=()=>{gh(n.update)}),$nextTick:n=>n.n||(n.n=Gg.bind(n.proxy)),$watch:n=>Lx.bind(n)}),bc=(n,e)=>n!==Ut&&!n.__isScriptSetup&&wt(n,e),$x={get({_:n},e){if(e==="__v_skip")return!0;const{ctx:t,setupState:i,data:r,props:s,accessCache:o,type:a,appContext:l}=n;if(e[0]!=="$"){const d=o[e];if(d!==void 0)switch(d){case 1:return i[e];case 2:return r[e];case 4:return t[e];case 3:return s[e]}else{if(bc(i,e))return o[e]=1,i[e];if(r!==Ut&&wt(r,e))return o[e]=2,r[e];if(wt(s,e))return o[e]=3,s[e];if(t!==Ut&&wt(t,e))return o[e]=4,t[e];$u&&(o[e]=0)}}const c=Ho[e];let u,h;if(c)return e==="$attrs"&&yn(n.attrs,"get",""),c(n);if((u=a.__cssModules)&&(u=u[e]))return u;if(t!==Ut&&wt(t,e))return o[e]=4,t[e];if(h=l.config.globalProperties,wt(h,e))return h[e]},set({_:n},e,t){const{data:i,setupState:r,ctx:s}=n;return bc(r,e)?(r[e]=t,!0):i!==Ut&&wt(i,e)?(i[e]=t,!0):wt(n.props,e)||e[0]==="$"&&e.slice(1)in n?!1:(s[e]=t,!0)},has({_:{data:n,setupState:e,accessCache:t,ctx:i,appContext:r,props:s,type:o}},a){let l;return!!(t[a]||n!==Ut&&a[0]!=="$"&&wt(n,a)||bc(e,a)||wt(s,a)||wt(i,a)||wt(Ho,a)||wt(r.config.globalProperties,a)||(l=o.__cssModules)&&l[a])},defineProperty(n,e,t){return t.get!=null?n._.accessCache[e]=0:wt(t,"value")&&this.set(n,e,t.value,null),Reflect.defineProperty(n,e,t)}};function Rd(n){return nt(n)?n.reduce((e,t)=>(e[t]=null,e),{}):n}let $u=!0;function Yx(n){const e=f_(n),t=n.proxy,i=n.ctx;$u=!1,e.beforeCreate&&Cd(e.beforeCreate,n,"bc");const{data:r,computed:s,methods:o,watch:a,provide:l,inject:c,created:u,beforeMount:h,mounted:d,beforeUpdate:g,updated:p,activated:x,deactivated:m,beforeDestroy:_,beforeUnmount:M,destroyed:T,unmounted:b,render:I,renderTracked:D,renderTriggered:B,errorCaptured:E,serverPrefetch:w,expose:L,inheritAttrs:R,components:U,directives:H,filters:q}=e;if(c&&Jx(c,i,null),o)for(const j in o){const ie=o[j];ut(ie)&&(i[j]=ie.bind(t))}if(r){const j=r.call(t,t);Rt(j)&&(n.data=ph(j))}if($u=!0,s)for(const j in s){const ie=s[j],X=ut(ie)?ie.bind(t,t):ut(ie.get)?ie.get.bind(t,t):Di,Y=!ut(ie)&&ut(ie.set)?ie.set.bind(t):Di,ne=Uy({get:X,set:Y});Object.defineProperty(i,j,{enumerable:!0,configurable:!0,get:()=>ne.value,set:fe=>ne.value=fe})}if(a)for(const j in a)u_(a[j],i,t,j);if(l){const j=ut(l)?l.call(t):l;Reflect.ownKeys(j).forEach(ie=>{Rx(ie,j[ie])})}u&&Cd(u,n,"c");function O(j,ie){nt(ie)?ie.forEach(X=>j(X.bind(t))):ie&&j(ie.bind(t))}if(O(Vx,h),O(s_,d),O(Hx,g),O(o_,p),O(Fx,x),O(Bx,m),O(jx,E),O(Wx,D),O(Gx,B),O(a_,M),O(l_,b),O(zx,w),nt(L))if(L.length){const j=n.exposed||(n.exposed={});L.forEach(ie=>{Object.defineProperty(j,ie,{get:()=>t[ie],set:X=>t[ie]=X,enumerable:!0})})}else n.exposed||(n.exposed={});I&&n.render===Di&&(n.render=I),R!=null&&(n.inheritAttrs=R),U&&(n.components=U),H&&(n.directives=H),w&&vh(n)}function Jx(n,e,t=Di){nt(n)&&(n=Yu(n));for(const i in n){const r=n[i];let s;Rt(r)?"default"in r?s=rl(r.from||i,r.default,!0):s=rl(r.from||i):s=rl(r),an(s)?Object.defineProperty(e,i,{enumerable:!0,configurable:!0,get:()=>s.value,set:o=>s.value=o}):e[i]=s}}function Cd(n,e,t){pi(nt(n)?n.map(i=>i.bind(e.proxy)):n.bind(e.proxy),e,t)}function u_(n,e,t,i){let r=i.includes(".")?$g(t,i):()=>t[i];if(Wt(n)){const s=e[n];ut(s)&&Sc(r,s)}else if(ut(n))Sc(r,n.bind(t));else if(Rt(n))if(nt(n))n.forEach(s=>u_(s,e,t,i));else{const s=ut(n.handler)?n.handler.bind(t):e[n.handler];ut(s)&&Sc(r,s,n)}}function f_(n){const e=n.type,{mixins:t,extends:i}=e,{mixins:r,optionsCache:s,config:{optionMergeStrategies:o}}=n.appContext,a=s.get(e);let l;return a?l=a:!r.length&&!t&&!i?l=e:(l={},r.length&&r.forEach(c=>El(l,c,o,!0)),El(l,e,o)),Rt(e)&&s.set(e,l),l}function El(n,e,t,i=!1){const{mixins:r,extends:s}=e;s&&El(n,s,t,!0),r&&r.forEach(o=>El(n,o,t,!0));for(const o in e)if(!(i&&o==="expose")){const a=Zx[o]||t&&t[o];n[o]=a?a(n[o],e[o]):e[o]}return n}const Zx={data:Pd,props:Ld,emits:Ld,methods:Io,computed:Io,beforeCreate:Tn,created:Tn,beforeMount:Tn,mounted:Tn,beforeUpdate:Tn,updated:Tn,beforeDestroy:Tn,beforeUnmount:Tn,destroyed:Tn,unmounted:Tn,activated:Tn,deactivated:Tn,errorCaptured:Tn,serverPrefetch:Tn,components:Io,directives:Io,watch:ey,provide:Pd,inject:Qx};function Pd(n,e){return e?n?function(){return Zt(ut(n)?n.call(this,this):n,ut(e)?e.call(this,this):e)}:e:n}function Qx(n,e){return Io(Yu(n),Yu(e))}function Yu(n){if(nt(n)){const e={};for(let t=0;t<n.length;t++)e[n[t]]=n[t];return e}return n}function Tn(n,e){return n?[...new Set([].concat(n,e))]:e}function Io(n,e){return n?Zt(Object.create(null),n,e):e}function Ld(n,e){return n?nt(n)&&nt(e)?[...new Set([...n,...e])]:Zt(Object.create(null),Rd(n),Rd(e??{})):e}function ey(n,e){if(!n)return e;if(!e)return n;const t=Zt(Object.create(null),n);for(const i in e)t[i]=Tn(n[i],e[i]);return t}function h_(){return{app:null,config:{isNativeTag:gg,performance:!1,globalProperties:{},optionMergeStrategies:{},errorHandler:void 0,warnHandler:void 0,compilerOptions:{}},mixins:[],components:{},directives:{},provides:Object.create(null),optionsCache:new WeakMap,propsCache:new WeakMap,emitsCache:new WeakMap}}let ty=0;function ny(n,e){return function(i,r=null){ut(i)||(i=Zt({},i)),r!=null&&!Rt(r)&&(r=null);const s=h_(),o=new WeakSet,a=[];let l=!1;const c=s.app={_uid:ty++,_component:i,_props:r,_container:null,_context:s,_instance:null,version:Fy,get config(){return s.config},set config(u){},use(u,...h){return o.has(u)||(u&&ut(u.install)?(o.add(u),u.install(c,...h)):ut(u)&&(o.add(u),u(c,...h))),c},mixin(u){return s.mixins.includes(u)||s.mixins.push(u),c},component(u,h){return h?(s.components[u]=h,c):s.components[u]},directive(u,h){return h?(s.directives[u]=h,c):s.directives[u]},mount(u,h,d){if(!l){const g=c._ceVNode||tn(i,r);return g.appContext=s,d===!0?d="svg":d===!1&&(d=void 0),n(g,u,d),l=!0,c._container=u,u.__vue_app__=c,Kl(g.component)}},onUnmount(u){a.push(u)},unmount(){l&&(pi(a,c._instance,16),n(null,c._container),delete c._container.__vue_app__)},provide(u,h){return s.provides[u]=h,c},runWithContext(u){const h=ss;ss=c;try{return u()}finally{ss=h}}};return c}}let ss=null;const iy=(n,e)=>e==="modelValue"||e==="model-value"?n.modelModifiers:n[`${e}Modifiers`]||n[`${Rn(e)}Modifiers`]||n[`${Or(e)}Modifiers`];function ry(n,e,...t){if(n.isUnmounted)return;const i=n.vnode.props||Ut;let r=t;const s=e.startsWith("update:"),o=s&&iy(i,e.slice(7));o&&(o.trim&&(r=t.map(u=>Wt(u)?u.trim():u)),o.number&&(r=t.map(Vl)));let a,l=i[a=mc(e)]||i[a=mc(Rn(e))];!l&&s&&(l=i[a=mc(Or(e))]),l&&pi(l,n,6,r);const c=i[a+"Once"];if(c){if(!n.emitted)n.emitted={};else if(n.emitted[a])return;n.emitted[a]=!0,pi(c,n,6,r)}}const sy=new WeakMap;function d_(n,e,t=!1){const i=t?sy:e.emitsCache,r=i.get(n);if(r!==void 0)return r;const s=n.emits;let o={},a=!1;if(!ut(n)){const l=c=>{const u=d_(c,e,!0);u&&(a=!0,Zt(o,u))};!t&&e.mixins.length&&e.mixins.forEach(l),n.extends&&l(n.extends),n.mixins&&n.mixins.forEach(l)}return!s&&!a?(Rt(n)&&i.set(n,null),null):(nt(s)?s.forEach(l=>o[l]=null):Zt(o,s),Rt(n)&&i.set(n,o),o)}function jl(n,e){return!n||!Ol(e)?!1:(e=e.slice(2).replace(/Once$/,""),wt(n,e[0].toLowerCase()+e.slice(1))||wt(n,Or(e))||wt(n,e))}function Id(n){const{type:e,vnode:t,proxy:i,withProxy:r,propsOptions:[s],slots:o,attrs:a,emit:l,render:c,renderCache:u,props:h,data:d,setupState:g,ctx:p,inheritAttrs:x}=n,m=Ml(n);let _,M;try{if(t.shapeFlag&4){const b=r||i,I=b;_=wi(c.call(I,b,u,h,g,d,p)),M=a}else{const b=e;_=wi(b.length>1?b(h,{attrs:a,slots:o,emit:l}):b(h,null)),M=e.props?a:oy(a)}}catch(b){zo.length=0,oa(b,n,1),_=tn(Sn)}let T=_;if(M&&x!==!1){const b=Object.keys(M),{shapeFlag:I}=T;b.length&&I&7&&(s&&b.some(rh)&&(M=ay(M,s)),T=Nr(T,M,!1,!0))}return t.dirs&&(T=Nr(T,null,!1,!0),T.dirs=T.dirs?T.dirs.concat(t.dirs):t.dirs),t.transition&&as(T,t.transition),_=T,Ml(m),_}const oy=n=>{let e;for(const t in n)(t==="class"||t==="style"||Ol(t))&&((e||(e={}))[t]=n[t]);return e},ay=(n,e)=>{const t={};for(const i in n)(!rh(i)||!(i.slice(9)in e))&&(t[i]=n[i]);return t};function ly(n,e,t){const{props:i,children:r,component:s}=n,{props:o,children:a,patchFlag:l}=e,c=s.emitsOptions;if(e.dirs||e.transition)return!0;if(t&&l>=0){if(l&1024)return!0;if(l&16)return i?Dd(i,o,c):!!o;if(l&8){const u=e.dynamicProps;for(let h=0;h<u.length;h++){const d=u[h];if(p_(o,i,d)&&!jl(c,d))return!0}}}else return(r||a)&&(!a||!a.$stable)?!0:i===o?!1:i?o?Dd(i,o,c):!0:!!o;return!1}function Dd(n,e,t){const i=Object.keys(e);if(i.length!==Object.keys(n).length)return!0;for(let r=0;r<i.length;r++){const s=i[r];if(p_(e,n,s)&&!jl(t,s))return!0}return!1}function p_(n,e,t){const i=n[t],r=e[t];return t==="style"&&Rt(i)&&Rt(r)?!Dr(i,r):i!==r}function cy({vnode:n,parent:e},t){for(;e;){const i=e.subTree;if(i.suspense&&i.suspense.activeBranch===n&&(i.el=n.el),i===n)(n=e.vnode).el=t,e=e.parent;else break}}const m_={},g_=()=>Object.create(m_),__=n=>Object.getPrototypeOf(n)===m_;function uy(n,e,t,i=!1){const r={},s=g_();n.propsDefaults=Object.create(null),v_(n,e,r,s);for(const o in n.propsOptions[0])o in r||(r[o]=void 0);t?n.props=i?r:px(r):n.type.props?n.props=r:n.props=s,n.attrs=s}function fy(n,e,t,i){const{props:r,attrs:s,vnode:{patchFlag:o}}=n,a=bt(r),[l]=n.propsOptions;let c=!1;if((i||o>0)&&!(o&16)){if(o&8){const u=n.vnode.dynamicProps;for(let h=0;h<u.length;h++){let d=u[h];if(jl(n.emitsOptions,d))continue;const g=e[d];if(l)if(wt(s,d))g!==s[d]&&(s[d]=g,c=!0);else{const p=Rn(d);r[p]=Ju(l,a,p,g,n,!1)}else g!==s[d]&&(s[d]=g,c=!0)}}}else{v_(n,e,r,s)&&(c=!0);let u;for(const h in a)(!e||!wt(e,h)&&((u=Or(h))===h||!wt(e,u)))&&(l?t&&(t[h]!==void 0||t[u]!==void 0)&&(r[h]=Ju(l,a,h,void 0,n,!0)):delete r[h]);if(s!==a)for(const h in s)(!e||!wt(e,h))&&(delete s[h],c=!0)}c&&tr(n.attrs,"set","")}function v_(n,e,t,i){const[r,s]=n.propsOptions;let o=!1,a;if(e)for(let l in e){if(Oo(l))continue;const c=e[l];let u;r&&wt(r,u=Rn(l))?!s||!s.includes(u)?t[u]=c:(a||(a={}))[u]=c:jl(n.emitsOptions,l)||(!(l in i)||c!==i[l])&&(i[l]=c,o=!0)}if(s){const l=bt(t),c=a||Ut;for(let u=0;u<s.length;u++){const h=s[u];t[h]=Ju(r,l,h,c[h],n,!wt(c,h))}}return o}function Ju(n,e,t,i,r,s){const o=n[t];if(o!=null){const a=wt(o,"default");if(a&&i===void 0){const l=o.default;if(o.type!==Function&&!o.skipFactory&&ut(l)){const{propsDefaults:c}=r;if(t in c)i=c[t];else{const u=la(r);i=c[t]=l.call(null,e),u()}}else i=l;r.ce&&r.ce._setProp(t,i)}o[0]&&(s&&!a?i=!1:o[1]&&(i===""||i===Or(t))&&(i=!0))}return i}const hy=new WeakMap;function x_(n,e,t=!1){const i=t?hy:e.propsCache,r=i.get(n);if(r)return r;const s=n.props,o={},a=[];let l=!1;if(!ut(n)){const u=h=>{l=!0;const[d,g]=x_(h,e,!0);Zt(o,d),g&&a.push(...g)};!t&&e.mixins.length&&e.mixins.forEach(u),n.extends&&u(n.extends),n.mixins&&n.mixins.forEach(u)}if(!s&&!l)return Rt(n)&&i.set(n,Ds),Ds;if(nt(s))for(let u=0;u<s.length;u++){const h=Rn(s[u]);Nd(h)&&(o[h]=Ut)}else if(s)for(const u in s){const h=Rn(u);if(Nd(h)){const d=s[u],g=o[h]=nt(d)||ut(d)?{type:d}:Zt({},d),p=g.type;let x=!1,m=!0;if(nt(p))for(let _=0;_<p.length;++_){const M=p[_],T=ut(M)&&M.name;if(T==="Boolean"){x=!0;break}else T==="String"&&(m=!1)}else x=ut(p)&&p.name==="Boolean";g[0]=x,g[1]=m,(x||wt(g,"default"))&&a.push(h)}}const c=[o,a];return Rt(n)&&i.set(n,c),c}function Nd(n){return n[0]!=="$"&&!Oo(n)}const xh=n=>n==="_"||n==="_ctx"||n==="$stable",yh=n=>nt(n)?n.map(wi):[wi(n)],dy=(n,e,t)=>{if(e._n)return e;const i=wx((...r)=>yh(e(...r)),t);return i._c=!1,i},y_=(n,e,t)=>{const i=n._ctx;for(const r in n){if(xh(r))continue;const s=n[r];if(ut(s))e[r]=dy(r,s,i);else if(s!=null){const o=yh(s);e[r]=()=>o}}},S_=(n,e)=>{const t=yh(e);n.slots.default=()=>t},M_=(n,e,t)=>{for(const i in e)(t||!xh(i))&&(n[i]=e[i])},py=(n,e,t)=>{const i=n.slots=g_();if(n.vnode.shapeFlag&32){const r=e._;r?(M_(i,e,t),t&&yg(i,"_",r,!0)):y_(e,i)}else e&&S_(n,e)},my=(n,e,t)=>{const{vnode:i,slots:r}=n;let s=!0,o=Ut;if(i.shapeFlag&32){const a=e._;a?t&&a===1?s=!1:M_(r,e,t):(s=!e.$stable,y_(e,r)),o=e}else e&&(S_(n,e),o={default:1});if(s)for(const a in r)!xh(a)&&o[a]==null&&delete r[a]},vn=yy;function gy(n){return _y(n)}function _y(n,e){const t=Hl();t.__VUE__=!0;const{insert:i,remove:r,patchProp:s,createElement:o,createText:a,createComment:l,setText:c,setElementText:u,parentNode:h,nextSibling:d,setScopeId:g=Di,insertStaticContent:p}=n,x=(k,z,Z,ge=null,ae=null,_e=null,N=void 0,Ee=null,ve=!!z.dynamicChildren)=>{if(k===z)return;k&&!Yr(k,z)&&(ge=Se(k),fe(k,ae,_e,!0),k=null),z.patchFlag===-2&&(ve=!1,z.dynamicChildren=null);const{type:me,ref:xe,shapeFlag:C}=z;switch(me){case Xl:m(k,z,Z,ge);break;case Sn:_(k,z,Z,ge);break;case ol:k==null&&M(z,Z,ge,N);break;case In:U(k,z,Z,ge,ae,_e,N,Ee,ve);break;default:C&1?I(k,z,Z,ge,ae,_e,N,Ee,ve):C&6?H(k,z,Z,ge,ae,_e,N,Ee,ve):(C&64||C&128)&&me.process(k,z,Z,ge,ae,_e,N,Ee,ve,Ae)}xe!=null&&ae?Vo(xe,k&&k.ref,_e,z||k,!z):xe==null&&k&&k.ref!=null&&Vo(k.ref,null,_e,k,!0)},m=(k,z,Z,ge)=>{if(k==null)i(z.el=a(z.children),Z,ge);else{const ae=z.el=k.el;z.children!==k.children&&c(ae,z.children)}},_=(k,z,Z,ge)=>{k==null?i(z.el=l(z.children||""),Z,ge):z.el=k.el},M=(k,z,Z,ge)=>{[k.el,k.anchor]=p(k.children,z,Z,ge,k.el,k.anchor)},T=({el:k,anchor:z},Z,ge)=>{let ae;for(;k&&k!==z;)ae=d(k),i(k,Z,ge),k=ae;i(z,Z,ge)},b=({el:k,anchor:z})=>{let Z;for(;k&&k!==z;)Z=d(k),r(k),k=Z;r(z)},I=(k,z,Z,ge,ae,_e,N,Ee,ve)=>{if(z.type==="svg"?N="svg":z.type==="math"&&(N="mathml"),k==null)D(z,Z,ge,ae,_e,N,Ee,ve);else{const me=k.el&&k.el._isVueCE?k.el:null;try{me&&me._beginPatch(),w(k,z,ae,_e,N,Ee,ve)}finally{me&&me._endPatch()}}},D=(k,z,Z,ge,ae,_e,N,Ee)=>{let ve,me;const{props:xe,shapeFlag:C,transition:S,dirs:W}=k;if(ve=k.el=o(k.type,_e,xe&&xe.is,xe),C&8?u(ve,k.children):C&16&&E(k.children,ve,null,ge,ae,Ec(k,_e),N,Ee),W&&Br(k,null,ge,"created"),B(ve,k,k.scopeId,N,ge),xe){for(const de in xe)de!=="value"&&!Oo(de)&&s(ve,de,null,xe[de],_e,ge);"value"in xe&&s(ve,"value",null,xe.value,_e),(me=xe.onVnodeBeforeMount)&&xi(me,ge,k)}W&&Br(k,null,ge,"beforeMount");const re=vy(ae,S);re&&S.beforeEnter(ve),i(ve,z,Z),((me=xe&&xe.onVnodeMounted)||re||W)&&vn(()=>{me&&xi(me,ge,k),re&&S.enter(ve),W&&Br(k,null,ge,"mounted")},ae)},B=(k,z,Z,ge,ae)=>{if(Z&&g(k,Z),ge)for(let _e=0;_e<ge.length;_e++)g(k,ge[_e]);if(ae){let _e=ae.subTree;if(z===_e||T_(_e.type)&&(_e.ssContent===z||_e.ssFallback===z)){const N=ae.vnode;B(k,N,N.scopeId,N.slotScopeIds,ae.parent)}}},E=(k,z,Z,ge,ae,_e,N,Ee,ve=0)=>{for(let me=ve;me<k.length;me++){const xe=k[me]=Ee?er(k[me]):wi(k[me]);x(null,xe,z,Z,ge,ae,_e,N,Ee)}},w=(k,z,Z,ge,ae,_e,N)=>{const Ee=z.el=k.el;let{patchFlag:ve,dynamicChildren:me,dirs:xe}=z;ve|=k.patchFlag&16;const C=k.props||Ut,S=z.props||Ut;let W;if(Z&&kr(Z,!1),(W=S.onVnodeBeforeUpdate)&&xi(W,Z,z,k),xe&&Br(z,k,Z,"beforeUpdate"),Z&&kr(Z,!0),(C.innerHTML&&S.innerHTML==null||C.textContent&&S.textContent==null)&&u(Ee,""),me?L(k.dynamicChildren,me,Ee,Z,ge,Ec(z,ae),_e):N||ie(k,z,Ee,null,Z,ge,Ec(z,ae),_e,!1),ve>0){if(ve&16)R(Ee,C,S,Z,ae);else if(ve&2&&C.class!==S.class&&s(Ee,"class",null,S.class,ae),ve&4&&s(Ee,"style",C.style,S.style,ae),ve&8){const re=z.dynamicProps;for(let de=0;de<re.length;de++){const se=re[de],Ue=C[se],Te=S[se];(Te!==Ue||se==="value")&&s(Ee,se,Ue,Te,ae,Z)}}ve&1&&k.children!==z.children&&u(Ee,z.children)}else!N&&me==null&&R(Ee,C,S,Z,ae);((W=S.onVnodeUpdated)||xe)&&vn(()=>{W&&xi(W,Z,z,k),xe&&Br(z,k,Z,"updated")},ge)},L=(k,z,Z,ge,ae,_e,N)=>{for(let Ee=0;Ee<z.length;Ee++){const ve=k[Ee],me=z[Ee],xe=ve.el&&(ve.type===In||!Yr(ve,me)||ve.shapeFlag&198)?h(ve.el):Z;x(ve,me,xe,null,ge,ae,_e,N,!0)}},R=(k,z,Z,ge,ae)=>{if(z!==Z){if(z!==Ut)for(const _e in z)!Oo(_e)&&!(_e in Z)&&s(k,_e,z[_e],null,ae,ge);for(const _e in Z){if(Oo(_e))continue;const N=Z[_e],Ee=z[_e];N!==Ee&&_e!=="value"&&s(k,_e,Ee,N,ae,ge)}"value"in Z&&s(k,"value",z.value,Z.value,ae)}},U=(k,z,Z,ge,ae,_e,N,Ee,ve)=>{const me=z.el=k?k.el:a(""),xe=z.anchor=k?k.anchor:a("");let{patchFlag:C,dynamicChildren:S,slotScopeIds:W}=z;W&&(Ee=Ee?Ee.concat(W):W),k==null?(i(me,Z,ge),i(xe,Z,ge),E(z.children||[],Z,xe,ae,_e,N,Ee,ve)):C>0&&C&64&&S&&k.dynamicChildren&&k.dynamicChildren.length===S.length?(L(k.dynamicChildren,S,Z,ae,_e,N,Ee),(z.key!=null||ae&&z===ae.subTree)&&Sh(k,z,!0)):ie(k,z,Z,xe,ae,_e,N,Ee,ve)},H=(k,z,Z,ge,ae,_e,N,Ee,ve)=>{z.slotScopeIds=Ee,k==null?z.shapeFlag&512?ae.ctx.activate(z,Z,ge,N,ve):q(z,Z,ge,ae,_e,N,ve):J(k,z,ve)},q=(k,z,Z,ge,ae,_e,N)=>{const Ee=k.component=Ry(k,ge,ae);if(aa(k)&&(Ee.ctx.renderer=Ae),Cy(Ee,!1,N),Ee.asyncDep){if(ae&&ae.registerDep(Ee,O,N),!k.el){const ve=Ee.subTree=tn(Sn);_(null,ve,z,Z),k.placeholder=ve.el}}else O(Ee,k,z,Z,ae,_e,N)},J=(k,z,Z)=>{const ge=z.component=k.component;if(ly(k,z,Z))if(ge.asyncDep&&!ge.asyncResolved){j(ge,z,Z);return}else ge.next=z,ge.update();else z.el=k.el,ge.vnode=z},O=(k,z,Z,ge,ae,_e,N)=>{const Ee=()=>{if(k.isMounted){let{next:C,bu:S,u:W,parent:re,vnode:de}=k;{const Ye=b_(k);if(Ye){C&&(C.el=de.el,j(k,C,N)),Ye.asyncDep.then(()=>{vn(()=>{k.isUnmounted||me()},ae)});return}}let se=C,Ue;kr(k,!1),C?(C.el=de.el,j(k,C,N)):C=de,S&&il(S),(Ue=C.props&&C.props.onVnodeBeforeUpdate)&&xi(Ue,re,C,de),kr(k,!0);const Te=Id(k),qe=k.subTree;k.subTree=Te,x(qe,Te,h(qe.el),Se(qe),k,ae,_e),C.el=Te.el,se===null&&cy(k,Te.el),W&&vn(W,ae),(Ue=C.props&&C.props.onVnodeUpdated)&&vn(()=>xi(Ue,re,C,de),ae)}else{let C;const{el:S,props:W}=z,{bm:re,m:de,parent:se,root:Ue,type:Te}=k,qe=Os(z);kr(k,!1),re&&il(re),!qe&&(C=W&&W.onVnodeBeforeMount)&&xi(C,se,z),kr(k,!0);{Ue.ce&&Ue.ce._hasShadowRoot()&&Ue.ce._injectChildStyle(Te,k.parent?k.parent.type:void 0);const Ye=k.subTree=Id(k);x(null,Ye,Z,ge,k,ae,_e),z.el=Ye.el}if(de&&vn(de,ae),!qe&&(C=W&&W.onVnodeMounted)){const Ye=z;vn(()=>xi(C,se,Ye),ae)}(z.shapeFlag&256||se&&Os(se.vnode)&&se.vnode.shapeFlag&256)&&k.a&&vn(k.a,ae),k.isMounted=!0,z=Z=ge=null}};k.scope.on();const ve=k.effect=new Tg(Ee);k.scope.off();const me=k.update=ve.run.bind(ve),xe=k.job=ve.runIfDirty.bind(ve);xe.i=k,xe.id=k.uid,ve.scheduler=()=>gh(xe),kr(k,!0),me()},j=(k,z,Z)=>{z.component=k;const ge=k.vnode.props;k.vnode=z,k.next=null,fy(k,z.props,ge,Z),my(k,z.children,Z),lr(),xd(k),cr()},ie=(k,z,Z,ge,ae,_e,N,Ee,ve=!1)=>{const me=k&&k.children,xe=k?k.shapeFlag:0,C=z.children,{patchFlag:S,shapeFlag:W}=z;if(S>0){if(S&128){Y(me,C,Z,ge,ae,_e,N,Ee,ve);return}else if(S&256){X(me,C,Z,ge,ae,_e,N,Ee,ve);return}}W&8?(xe&16&&he(me,ae,_e),C!==me&&u(Z,C)):xe&16?W&16?Y(me,C,Z,ge,ae,_e,N,Ee,ve):he(me,ae,_e,!0):(xe&8&&u(Z,""),W&16&&E(C,Z,ge,ae,_e,N,Ee,ve))},X=(k,z,Z,ge,ae,_e,N,Ee,ve)=>{k=k||Ds,z=z||Ds;const me=k.length,xe=z.length,C=Math.min(me,xe);let S;for(S=0;S<C;S++){const W=z[S]=ve?er(z[S]):wi(z[S]);x(k[S],W,Z,null,ae,_e,N,Ee,ve)}me>xe?he(k,ae,_e,!0,!1,C):E(z,Z,ge,ae,_e,N,Ee,ve,C)},Y=(k,z,Z,ge,ae,_e,N,Ee,ve)=>{let me=0;const xe=z.length;let C=k.length-1,S=xe-1;for(;me<=C&&me<=S;){const W=k[me],re=z[me]=ve?er(z[me]):wi(z[me]);if(Yr(W,re))x(W,re,Z,null,ae,_e,N,Ee,ve);else break;me++}for(;me<=C&&me<=S;){const W=k[C],re=z[S]=ve?er(z[S]):wi(z[S]);if(Yr(W,re))x(W,re,Z,null,ae,_e,N,Ee,ve);else break;C--,S--}if(me>C){if(me<=S){const W=S+1,re=W<xe?z[W].el:ge;for(;me<=S;)x(null,z[me]=ve?er(z[me]):wi(z[me]),Z,re,ae,_e,N,Ee,ve),me++}}else if(me>S)for(;me<=C;)fe(k[me],ae,_e,!0),me++;else{const W=me,re=me,de=new Map;for(me=re;me<=S;me++){const Oe=z[me]=ve?er(z[me]):wi(z[me]);Oe.key!=null&&de.set(Oe.key,me)}let se,Ue=0;const Te=S-re+1;let qe=!1,Ye=0;const be=new Array(Te);for(me=0;me<Te;me++)be[me]=0;for(me=W;me<=C;me++){const Oe=k[me];if(Ue>=Te){fe(Oe,ae,_e,!0);continue}let ze;if(Oe.key!=null)ze=de.get(Oe.key);else for(se=re;se<=S;se++)if(be[se-re]===0&&Yr(Oe,z[se])){ze=se;break}ze===void 0?fe(Oe,ae,_e,!0):(be[ze-re]=me+1,ze>=Ye?Ye=ze:qe=!0,x(Oe,z[ze],Z,null,ae,_e,N,Ee,ve),Ue++)}const Ce=qe?xy(be):Ds;for(se=Ce.length-1,me=Te-1;me>=0;me--){const Oe=re+me,ze=z[Oe],Ve=z[Oe+1],lt=Oe+1<xe?Ve.el||E_(Ve):ge;be[me]===0?x(null,ze,Z,lt,ae,_e,N,Ee,ve):qe&&(se<0||me!==Ce[se]?ne(ze,Z,lt,2):se--)}}},ne=(k,z,Z,ge,ae=null)=>{const{el:_e,type:N,transition:Ee,children:ve,shapeFlag:me}=k;if(me&6){ne(k.component.subTree,z,Z,ge);return}if(me&128){k.suspense.move(z,Z,ge);return}if(me&64){N.move(k,z,Z,Ae);return}if(N===In){i(_e,z,Z);for(let C=0;C<ve.length;C++)ne(ve[C],z,Z,ge);i(k.anchor,z,Z);return}if(N===ol){T(k,z,Z);return}if(ge!==2&&me&1&&Ee)if(ge===0)Ee.beforeEnter(_e),i(_e,z,Z),vn(()=>Ee.enter(_e),ae);else{const{leave:C,delayLeave:S,afterLeave:W}=Ee,re=()=>{k.ctx.isUnmounted?r(_e):i(_e,z,Z)},de=()=>{_e._isLeaving&&_e[Ti](!0),C(_e,()=>{re(),W&&W()})};S?S(_e,re,de):de()}else i(_e,z,Z)},fe=(k,z,Z,ge=!1,ae=!1)=>{const{type:_e,props:N,ref:Ee,children:ve,dynamicChildren:me,shapeFlag:xe,patchFlag:C,dirs:S,cacheIndex:W}=k;if(C===-2&&(ae=!1),Ee!=null&&(lr(),Vo(Ee,null,Z,k,!0),cr()),W!=null&&(z.renderCache[W]=void 0),xe&256){z.ctx.deactivate(k);return}const re=xe&1&&S,de=!Os(k);let se;if(de&&(se=N&&N.onVnodeBeforeUnmount)&&xi(se,z,k),xe&6)tt(k.component,Z,ge);else{if(xe&128){k.suspense.unmount(Z,ge);return}re&&Br(k,null,z,"beforeUnmount"),xe&64?k.type.remove(k,z,Z,Ae,ge):me&&!me.hasOnce&&(_e!==In||C>0&&C&64)?he(me,z,Z,!1,!0):(_e===In&&C&384||!ae&&xe&16)&&he(ve,z,Z),ge&&ye(k)}(de&&(se=N&&N.onVnodeUnmounted)||re)&&vn(()=>{se&&xi(se,z,k),re&&Br(k,null,z,"unmounted")},Z)},ye=k=>{const{type:z,el:Z,anchor:ge,transition:ae}=k;if(z===In){je(Z,ge);return}if(z===ol){b(k);return}const _e=()=>{r(Z),ae&&!ae.persisted&&ae.afterLeave&&ae.afterLeave()};if(k.shapeFlag&1&&ae&&!ae.persisted){const{leave:N,delayLeave:Ee}=ae,ve=()=>N(Z,_e);Ee?Ee(k.el,_e,ve):ve()}else _e()},je=(k,z)=>{let Z;for(;k!==z;)Z=d(k),r(k),k=Z;r(z)},tt=(k,z,Z)=>{const{bum:ge,scope:ae,job:_e,subTree:N,um:Ee,m:ve,a:me}=k;Ud(ve),Ud(me),ge&&il(ge),ae.stop(),_e&&(_e.flags|=8,fe(N,k,z,Z)),Ee&&vn(Ee,z),vn(()=>{k.isUnmounted=!0},z)},he=(k,z,Z,ge=!1,ae=!1,_e=0)=>{for(let N=_e;N<k.length;N++)fe(k[N],z,Z,ge,ae)},Se=k=>{if(k.shapeFlag&6)return Se(k.component.subTree);if(k.shapeFlag&128)return k.suspense.next();const z=d(k.anchor||k.el),Z=z&&z[Yg];return Z?d(Z):z};let Me=!1;const Le=(k,z,Z)=>{let ge;k==null?z._vnode&&(fe(z._vnode,null,null,!0),ge=z._vnode.component):x(z._vnode||null,k,z,null,null,null,Z),z._vnode=k,Me||(Me=!0,xd(ge),jg(),Me=!1)},Ae={p:x,um:fe,m:ne,r:ye,mt:q,mc:E,pc:ie,pbc:L,n:Se,o:n};return{render:Le,hydrate:void 0,createApp:ny(Le)}}function Ec({type:n,props:e},t){return t==="svg"&&n==="foreignObject"||t==="mathml"&&n==="annotation-xml"&&e&&e.encoding&&e.encoding.includes("html")?void 0:t}function kr({effect:n,job:e},t){t?(n.flags|=32,e.flags|=4):(n.flags&=-33,e.flags&=-5)}function vy(n,e){return(!n||n&&!n.pendingBranch)&&e&&!e.persisted}function Sh(n,e,t=!1){const i=n.children,r=e.children;if(nt(i)&&nt(r))for(let s=0;s<i.length;s++){const o=i[s];let a=r[s];a.shapeFlag&1&&!a.dynamicChildren&&((a.patchFlag<=0||a.patchFlag===32)&&(a=r[s]=er(r[s]),a.el=o.el),!t&&a.patchFlag!==-2&&Sh(o,a)),a.type===Xl&&(a.patchFlag===-1&&(a=r[s]=er(a)),a.el=o.el),a.type===Sn&&!a.el&&(a.el=o.el)}}function xy(n){const e=n.slice(),t=[0];let i,r,s,o,a;const l=n.length;for(i=0;i<l;i++){const c=n[i];if(c!==0){if(r=t[t.length-1],n[r]<c){e[i]=r,t.push(i);continue}for(s=0,o=t.length-1;s<o;)a=s+o>>1,n[t[a]]<c?s=a+1:o=a;c<n[t[s]]&&(s>0&&(e[i]=t[s-1]),t[s]=i)}}for(s=t.length,o=t[s-1];s-- >0;)t[s]=o,o=e[o];return t}function b_(n){const e=n.subTree.component;if(e)return e.asyncDep&&!e.asyncResolved?e:b_(e)}function Ud(n){if(n)for(let e=0;e<n.length;e++)n[e].flags|=8}function E_(n){if(n.placeholder)return n.placeholder;const e=n.component;return e?E_(e.subTree):null}const T_=n=>n.__isSuspense;function yy(n,e){e&&e.pendingBranch?nt(n)?e.effects.push(...n):e.effects.push(n):Ax(n)}const In=Symbol.for("v-fgt"),Xl=Symbol.for("v-txt"),Sn=Symbol.for("v-cmt"),ol=Symbol.for("v-stc"),zo=[];let zn=null;function Zu(n=!1){zo.push(zn=n?null:[])}function Sy(){zo.pop(),zn=zo[zo.length-1]||null}let $o=1;function Tl(n,e=!1){$o+=n,n<0&&zn&&e&&(zn.hasOnce=!0)}function A_(n){return n.dynamicChildren=$o>0?zn||Ds:null,Sy(),$o>0&&zn&&zn.push(n),n}function EP(n,e,t,i,r,s){return A_(R_(n,e,t,i,r,s,!0))}function Qu(n,e,t,i,r){return A_(tn(n,e,t,i,r,!0))}function Yo(n){return n?n.__v_isVNode===!0:!1}function Yr(n,e){return n.type===e.type&&n.key===e.key}const w_=({key:n})=>n??null,al=({ref:n,ref_key:e,ref_for:t})=>(typeof n=="number"&&(n=""+n),n!=null?Wt(n)||an(n)||ut(n)?{i:fn,r:n,k:e,f:!!t}:n:null);function R_(n,e=null,t=null,i=0,r=null,s=n===In?0:1,o=!1,a=!1){const l={__v_isVNode:!0,__v_skip:!0,type:n,props:e,key:e&&w_(e),ref:e&&al(e),scopeId:qg,slotScopeIds:null,children:t,component:null,suspense:null,ssContent:null,ssFallback:null,dirs:null,transition:null,el:null,anchor:null,target:null,targetStart:null,targetAnchor:null,staticCount:0,shapeFlag:s,patchFlag:i,dynamicProps:r,dynamicChildren:null,appContext:null,ctx:fn};return a?(Mh(l,t),s&128&&n.normalize(l)):t&&(l.shapeFlag|=Wt(t)?8:16),$o>0&&!o&&zn&&(l.patchFlag>0||s&6)&&l.patchFlag!==32&&zn.push(l),l}const tn=My;function My(n,e=null,t=null,i=0,r=null,s=!1){if((!n||n===qx)&&(n=Sn),Yo(n)){const a=Nr(n,e,!0);return t&&Mh(a,t),$o>0&&!s&&zn&&(a.shapeFlag&6?zn[zn.indexOf(n)]=a:zn.push(a)),a.patchFlag=-2,a}if(Ny(n)&&(n=n.__vccOpts),e){e=by(e);let{class:a,style:l}=e;a&&!Wt(a)&&(e.class=ah(a)),Rt(l)&&(Gl(l)&&!nt(l)&&(l=Zt({},l)),e.style=oh(l))}const o=Wt(n)?1:T_(n)?128:Jg(n)?64:Rt(n)?4:ut(n)?2:0;return R_(n,e,t,i,r,o,s,!0)}function by(n){return n?Gl(n)||__(n)?Zt({},n):n:null}function Nr(n,e,t=!1,i=!1){const{props:r,ref:s,patchFlag:o,children:a,transition:l}=n,c=e?Ty(r||{},e):r,u={__v_isVNode:!0,__v_skip:!0,type:n.type,props:c,key:c&&w_(c),ref:e&&e.ref?t&&s?nt(s)?s.concat(al(e)):[s,al(e)]:al(e):s,scopeId:n.scopeId,slotScopeIds:n.slotScopeIds,children:a,target:n.target,targetStart:n.targetStart,targetAnchor:n.targetAnchor,staticCount:n.staticCount,shapeFlag:n.shapeFlag,patchFlag:e&&n.type!==In?o===-1?16:o|16:o,dynamicProps:n.dynamicProps,dynamicChildren:n.dynamicChildren,appContext:n.appContext,dirs:n.dirs,transition:l,component:n.component,suspense:n.suspense,ssContent:n.ssContent&&Nr(n.ssContent),ssFallback:n.ssFallback&&Nr(n.ssFallback),placeholder:n.placeholder,el:n.el,anchor:n.anchor,ctx:n.ctx,ce:n.ce};return l&&i&&as(u,l.clone(u)),u}function Ey(n=" ",e=0){return tn(Xl,null,n,e)}function TP(n,e){const t=tn(ol,null,n);return t.staticCount=e,t}function AP(n="",e=!1){return e?(Zu(),Qu(Sn,null,n)):tn(Sn,null,n)}function wi(n){return n==null||typeof n=="boolean"?tn(Sn):nt(n)?tn(In,null,n.slice()):Yo(n)?er(n):tn(Xl,null,String(n))}function er(n){return n.el===null&&n.patchFlag!==-1||n.memo?n:Nr(n)}function Mh(n,e){let t=0;const{shapeFlag:i}=n;if(e==null)e=null;else if(nt(e))t=16;else if(typeof e=="object")if(i&65){const r=e.default;r&&(r._c&&(r._d=!1),Mh(n,r()),r._c&&(r._d=!0));return}else{t=32;const r=e._;!r&&!__(e)?e._ctx=fn:r===3&&fn&&(fn.slots._===1?e._=1:(e._=2,n.patchFlag|=1024))}else ut(e)?(e={default:e,_ctx:fn},t=32):(e=String(e),i&64?(t=16,e=[Ey(e)]):t=8);n.children=e,n.shapeFlag|=t}function Ty(...n){const e={};for(let t=0;t<n.length;t++){const i=n[t];for(const r in i)if(r==="class")e.class!==i.class&&(e.class=ah([e.class,i.class]));else if(r==="style")e.style=oh([e.style,i.style]);else if(Ol(r)){const s=e[r],o=i[r];o&&s!==o&&!(nt(s)&&s.includes(o))&&(e[r]=s?[].concat(s,o):o)}else r!==""&&(e[r]=i[r])}return e}function xi(n,e,t,i=null){pi(n,e,7,[t,i])}const Ay=h_();let wy=0;function Ry(n,e,t){const i=n.type,r=(e?e.appContext:n.appContext)||Ay,s={uid:wy++,vnode:n,type:i,parent:e,appContext:r,root:null,next:null,subTree:null,effect:null,update:null,job:null,scope:new Eg(!0),render:null,proxy:null,exposed:null,exposeProxy:null,withProxy:null,provides:e?e.provides:Object.create(r.provides),ids:e?e.ids:["",0,0],accessCache:null,renderCache:[],components:null,directives:null,propsOptions:x_(i,r),emitsOptions:d_(i,r),emit:null,emitted:null,propsDefaults:Ut,inheritAttrs:i.inheritAttrs,ctx:Ut,data:Ut,props:Ut,attrs:Ut,slots:Ut,refs:Ut,setupState:Ut,setupContext:null,suspense:t,suspenseId:t?t.pendingId:0,asyncDep:null,asyncResolved:!1,isMounted:!1,isUnmounted:!1,isDeactivated:!1,bc:null,c:null,bm:null,m:null,bu:null,u:null,um:null,bum:null,da:null,a:null,rtg:null,rtc:null,ec:null,sp:null};return s.ctx={_:s},s.root=e?e.root:s,s.emit=ry.bind(null,s),n.ce&&n.ce(s),s}let un=null;const ql=()=>un||fn;let Al,ef;{const n=Hl(),e=(t,i)=>{let r;return(r=n[t])||(r=n[t]=[]),r.push(i),s=>{r.length>1?r.forEach(o=>o(s)):r[0](s)}};Al=e("__VUE_INSTANCE_SETTERS__",t=>un=t),ef=e("__VUE_SSR_SETTERS__",t=>zs=t)}const la=n=>{const e=un;return Al(n),n.scope.on(),()=>{n.scope.off(),Al(e)}},Od=()=>{un&&un.scope.off(),Al(null)};function C_(n){return n.vnode.shapeFlag&4}let zs=!1;function Cy(n,e=!1,t=!1){e&&ef(e);const{props:i,children:r}=n.vnode,s=C_(n);uy(n,i,s,e),py(n,r,t||e);const o=s?Py(n,e):void 0;return e&&ef(!1),o}function Py(n,e){const t=n.type;n.accessCache=Object.create(null),n.proxy=new Proxy(n.ctx,$x);const{setup:i}=t;if(i){lr();const r=n.setupContext=i.length>1?Iy(n):null,s=la(n),o=sa(i,n,0,[n.props,r]),a=_g(o);if(cr(),s(),(a||n.sp)&&!Os(n)&&vh(n),a){if(o.then(Od,Od),e)return o.then(l=>{Fd(n,l)}).catch(l=>{oa(l,n,0)});n.asyncDep=o}else Fd(n,o)}else P_(n)}function Fd(n,e,t){ut(e)?n.type.__ssrInlineRender?n.ssrRender=e:n.render=e:Rt(e)&&(n.setupState=Hg(e)),P_(n)}function P_(n,e,t){const i=n.type;n.render||(n.render=i.render||Di);{const r=la(n);lr();try{Yx(n)}finally{cr(),r()}}}const Ly={get(n,e){return yn(n,"get",""),n[e]}};function Iy(n){const e=t=>{n.exposed=t||{}};return{attrs:new Proxy(n.attrs,Ly),slots:n.slots,emit:n.emit,expose:e}}function Kl(n){return n.exposed?n.exposeProxy||(n.exposeProxy=new Proxy(Hg(mx(n.exposed)),{get(e,t){if(t in e)return e[t];if(t in Ho)return Ho[t](n)},has(e,t){return t in e||t in Ho}})):n.proxy}function Dy(n,e=!0){return ut(n)?n.displayName||n.name:n.name||e&&n.__name}function Ny(n){return ut(n)&&"__vccOpts"in n}const Uy=(n,e)=>Sx(n,e,zs);function Oy(n,e,t){try{Tl(-1);const i=arguments.length;return i===2?Rt(e)&&!nt(e)?Yo(e)?tn(n,null,[e]):tn(n,e):tn(n,null,e):(i>3?t=Array.prototype.slice.call(arguments,2):i===3&&Yo(t)&&(t=[t]),tn(n,e,t))}finally{Tl(1)}}const Fy="3.5.30";/**
* @vue/runtime-dom v3.5.30
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/let tf;const Bd=typeof window<"u"&&window.trustedTypes;if(Bd)try{tf=Bd.createPolicy("vue",{createHTML:n=>n})}catch{}const L_=tf?n=>tf.createHTML(n):n=>n,By="http://www.w3.org/2000/svg",ky="http://www.w3.org/1998/Math/MathML",Qi=typeof document<"u"?document:null,kd=Qi&&Qi.createElement("template"),Vy={insert:(n,e,t)=>{e.insertBefore(n,t||null)},remove:n=>{const e=n.parentNode;e&&e.removeChild(n)},createElement:(n,e,t,i)=>{const r=e==="svg"?Qi.createElementNS(By,n):e==="mathml"?Qi.createElementNS(ky,n):t?Qi.createElement(n,{is:t}):Qi.createElement(n);return n==="select"&&i&&i.multiple!=null&&r.setAttribute("multiple",i.multiple),r},createText:n=>Qi.createTextNode(n),createComment:n=>Qi.createComment(n),setText:(n,e)=>{n.nodeValue=e},setElementText:(n,e)=>{n.textContent=e},parentNode:n=>n.parentNode,nextSibling:n=>n.nextSibling,querySelector:n=>Qi.querySelector(n),setScopeId(n,e){n.setAttribute(e,"")},insertStaticContent(n,e,t,i,r,s){const o=t?t.previousSibling:e.lastChild;if(r&&(r===s||r.nextSibling))for(;e.insertBefore(r.cloneNode(!0),t),!(r===s||!(r=r.nextSibling)););else{kd.innerHTML=L_(i==="svg"?`<svg>${n}</svg>`:i==="mathml"?`<math>${n}</math>`:n);const a=kd.content;if(i==="svg"||i==="mathml"){const l=a.firstChild;for(;l.firstChild;)a.appendChild(l.firstChild);a.removeChild(l)}e.insertBefore(a,t)}return[o?o.nextSibling:e.firstChild,t?t.previousSibling:e.lastChild]}},Sr="transition",xo="animation",Gs=Symbol("_vtc"),I_={name:String,type:String,css:{type:Boolean,default:!0},duration:[String,Number,Object],enterFromClass:String,enterActiveClass:String,enterToClass:String,appearFromClass:String,appearActiveClass:String,appearToClass:String,leaveFromClass:String,leaveActiveClass:String,leaveToClass:String},D_=Zt({},e_,I_),Hy=n=>(n.displayName="Transition",n.props=D_,n),wP=Hy((n,{slots:e})=>Oy(Nx,N_(n),e)),Vr=(n,e=[])=>{nt(n)?n.forEach(t=>t(...e)):n&&n(...e)},Vd=n=>n?nt(n)?n.some(e=>e.length>1):n.length>1:!1;function N_(n){const e={};for(const U in n)U in I_||(e[U]=n[U]);if(n.css===!1)return e;const{name:t="v",type:i,duration:r,enterFromClass:s=`${t}-enter-from`,enterActiveClass:o=`${t}-enter-active`,enterToClass:a=`${t}-enter-to`,appearFromClass:l=s,appearActiveClass:c=o,appearToClass:u=a,leaveFromClass:h=`${t}-leave-from`,leaveActiveClass:d=`${t}-leave-active`,leaveToClass:g=`${t}-leave-to`}=n,p=zy(r),x=p&&p[0],m=p&&p[1],{onBeforeEnter:_,onEnter:M,onEnterCancelled:T,onLeave:b,onLeaveCancelled:I,onBeforeAppear:D=_,onAppear:B=M,onAppearCancelled:E=T}=e,w=(U,H,q,J)=>{U._enterCancelled=J,Cr(U,H?u:a),Cr(U,H?c:o),q&&q()},L=(U,H)=>{U._isLeaving=!1,Cr(U,h),Cr(U,g),Cr(U,d),H&&H()},R=U=>(H,q)=>{const J=U?B:M,O=()=>w(H,U,q);Vr(J,[H,O]),Hd(()=>{Cr(H,U?l:s),Mi(H,U?u:a),Vd(J)||zd(H,i,x,O)})};return Zt(e,{onBeforeEnter(U){Vr(_,[U]),Mi(U,s),Mi(U,o)},onBeforeAppear(U){Vr(D,[U]),Mi(U,l),Mi(U,c)},onEnter:R(!1),onAppear:R(!0),onLeave(U,H){U._isLeaving=!0;const q=()=>L(U,H);Mi(U,h),U._enterCancelled?(Mi(U,d),nf(U)):(nf(U),Mi(U,d)),Hd(()=>{U._isLeaving&&(Cr(U,h),Mi(U,g),Vd(b)||zd(U,i,m,q))}),Vr(b,[U,q])},onEnterCancelled(U){w(U,!1,void 0,!0),Vr(T,[U])},onAppearCancelled(U){w(U,!0,void 0,!0),Vr(E,[U])},onLeaveCancelled(U){L(U),Vr(I,[U])}})}function zy(n){if(n==null)return null;if(Rt(n))return[Tc(n.enter),Tc(n.leave)];{const e=Tc(n);return[e,e]}}function Tc(n){return kv(n)}function Mi(n,e){e.split(/\s+/).forEach(t=>t&&n.classList.add(t)),(n[Gs]||(n[Gs]=new Set)).add(e)}function Cr(n,e){e.split(/\s+/).forEach(i=>i&&n.classList.remove(i));const t=n[Gs];t&&(t.delete(e),t.size||(n[Gs]=void 0))}function Hd(n){requestAnimationFrame(()=>{requestAnimationFrame(n)})}let Gy=0;function zd(n,e,t,i){const r=n._endId=++Gy,s=()=>{r===n._endId&&i()};if(t!=null)return setTimeout(s,t);const{type:o,timeout:a,propCount:l}=U_(n,e);if(!o)return i();const c=o+"end";let u=0;const h=()=>{n.removeEventListener(c,d),s()},d=g=>{g.target===n&&++u>=l&&h()};setTimeout(()=>{u<l&&h()},a+1),n.addEventListener(c,d)}function U_(n,e){const t=window.getComputedStyle(n),i=p=>(t[p]||"").split(", "),r=i(`${Sr}Delay`),s=i(`${Sr}Duration`),o=Gd(r,s),a=i(`${xo}Delay`),l=i(`${xo}Duration`),c=Gd(a,l);let u=null,h=0,d=0;e===Sr?o>0&&(u=Sr,h=o,d=s.length):e===xo?c>0&&(u=xo,h=c,d=l.length):(h=Math.max(o,c),u=h>0?o>c?Sr:xo:null,d=u?u===Sr?s.length:l.length:0);const g=u===Sr&&/\b(?:transform|all)(?:,|$)/.test(i(`${Sr}Property`).toString());return{type:u,timeout:h,propCount:d,hasTransform:g}}function Gd(n,e){for(;n.length<e.length;)n=n.concat(n);return Math.max(...e.map((t,i)=>Wd(t)+Wd(n[i])))}function Wd(n){return n==="auto"?0:Number(n.slice(0,-1).replace(",","."))*1e3}function nf(n){return(n?n.ownerDocument:document).body.offsetHeight}function Wy(n,e,t){const i=n[Gs];i&&(e=(e?[e,...i]:[...i]).join(" ")),e==null?n.removeAttribute("class"):t?n.setAttribute("class",e):n.className=e}const jd=Symbol("_vod"),jy=Symbol("_vsh"),Xy=Symbol(""),qy=/(?:^|;)\s*display\s*:/;function Ky(n,e,t){const i=n.style,r=Wt(t);let s=!1;if(t&&!r){if(e)if(Wt(e))for(const o of e.split(";")){const a=o.slice(0,o.indexOf(":")).trim();t[a]==null&&ll(i,a,"")}else for(const o in e)t[o]==null&&ll(i,o,"");for(const o in t)o==="display"&&(s=!0),ll(i,o,t[o])}else if(r){if(e!==t){const o=i[Xy];o&&(t+=";"+o),i.cssText=t,s=qy.test(t)}}else e&&n.removeAttribute("style");jd in n&&(n[jd]=s?i.display:"",n[jy]&&(i.display="none"))}const Xd=/\s*!important$/;function ll(n,e,t){if(nt(t))t.forEach(i=>ll(n,e,i));else if(t==null&&(t=""),e.startsWith("--"))n.setProperty(e,t);else{const i=$y(n,e);Xd.test(t)?n.setProperty(Or(i),t.replace(Xd,""),"important"):n[i]=t}}const qd=["Webkit","Moz","ms"],Ac={};function $y(n,e){const t=Ac[e];if(t)return t;let i=Rn(e);if(i!=="filter"&&i in n)return Ac[e]=i;i=kl(i);for(let r=0;r<qd.length;r++){const s=qd[r]+i;if(s in n)return Ac[e]=s}return e}const Kd="http://www.w3.org/1999/xlink";function $d(n,e,t,i,r,s=jv(e)){i&&e.startsWith("xlink:")?t==null?n.removeAttributeNS(Kd,e.slice(6,e.length)):n.setAttributeNS(Kd,e,t):t==null||s&&!Sg(t)?n.removeAttribute(e):n.setAttribute(e,s?"":hi(t)?String(t):t)}function Yd(n,e,t,i,r){if(e==="innerHTML"||e==="textContent"){t!=null&&(n[e]=e==="innerHTML"?L_(t):t);return}const s=n.tagName;if(e==="value"&&s!=="PROGRESS"&&!s.includes("-")){const a=s==="OPTION"?n.getAttribute("value")||"":n.value,l=t==null?n.type==="checkbox"?"on":"":String(t);(a!==l||!("_value"in n))&&(n.value=l),t==null&&n.removeAttribute(e),n._value=t;return}let o=!1;if(t===""||t==null){const a=typeof n[e];a==="boolean"?t=Sg(t):t==null&&a==="string"?(t="",o=!0):a==="number"&&(t=0,o=!0)}try{n[e]=t}catch{}o&&n.removeAttribute(r||e)}function ir(n,e,t,i){n.addEventListener(e,t,i)}function Yy(n,e,t,i){n.removeEventListener(e,t,i)}const Jd=Symbol("_vei");function Jy(n,e,t,i,r=null){const s=n[Jd]||(n[Jd]={}),o=s[e];if(i&&o)o.value=i;else{const[a,l]=Zy(e);if(i){const c=s[e]=tS(i,r);ir(n,a,c,l)}else o&&(Yy(n,a,o,l),s[e]=void 0)}}const Zd=/(?:Once|Passive|Capture)$/;function Zy(n){let e;if(Zd.test(n)){e={};let i;for(;i=n.match(Zd);)n=n.slice(0,n.length-i[0].length),e[i[0].toLowerCase()]=!0}return[n[2]===":"?n.slice(3):Or(n.slice(2)),e]}let wc=0;const Qy=Promise.resolve(),eS=()=>wc||(Qy.then(()=>wc=0),wc=Date.now());function tS(n,e){const t=i=>{if(!i._vts)i._vts=Date.now();else if(i._vts<=t.attached)return;pi(nS(i,t.value),e,5,[i])};return t.value=n,t.attached=eS(),t}function nS(n,e){if(nt(e)){const t=n.stopImmediatePropagation;return n.stopImmediatePropagation=()=>{t.call(n),n._stopped=!0},e.map(i=>r=>!r._stopped&&i&&i(r))}else return e}const Qd=n=>n.charCodeAt(0)===111&&n.charCodeAt(1)===110&&n.charCodeAt(2)>96&&n.charCodeAt(2)<123,iS=(n,e,t,i,r,s)=>{const o=r==="svg";e==="class"?Wy(n,i,o):e==="style"?Ky(n,t,i):Ol(e)?rh(e)||Jy(n,e,t,i,s):(e[0]==="."?(e=e.slice(1),!0):e[0]==="^"?(e=e.slice(1),!1):rS(n,e,i,o))?(Yd(n,e,i),!n.tagName.includes("-")&&(e==="value"||e==="checked"||e==="selected")&&$d(n,e,i,o,s,e!=="value")):n._isVueCE&&(sS(n,e)||n._def.__asyncLoader&&(/[A-Z]/.test(e)||!Wt(i)))?Yd(n,Rn(e),i,s,e):(e==="true-value"?n._trueValue=i:e==="false-value"&&(n._falseValue=i),$d(n,e,i,o))};function rS(n,e,t,i){if(i)return!!(e==="innerHTML"||e==="textContent"||e in n&&Qd(e)&&ut(t));if(e==="spellcheck"||e==="draggable"||e==="translate"||e==="autocorrect"||e==="sandbox"&&n.tagName==="IFRAME"||e==="form"||e==="list"&&n.tagName==="INPUT"||e==="type"&&n.tagName==="TEXTAREA")return!1;if(e==="width"||e==="height"){const r=n.tagName;if(r==="IMG"||r==="VIDEO"||r==="CANVAS"||r==="SOURCE")return!1}return Qd(e)&&Wt(t)?!1:e in n}function sS(n,e){const t=n._def.props;if(!t)return!1;const i=Rn(e);return Array.isArray(t)?t.some(r=>Rn(r)===i):Object.keys(t).some(r=>Rn(r)===i)}const O_=new WeakMap,F_=new WeakMap,wl=Symbol("_moveCb"),ep=Symbol("_enterCb"),oS=n=>(delete n.props.mode,n),aS=oS({name:"TransitionGroup",props:Zt({},D_,{tag:String,moveClass:String}),setup(n,{slots:e}){const t=ql(),i=Qg();let r,s;return o_(()=>{if(!r.length)return;const o=n.moveClass||`${n.name||"v"}-move`;if(!fS(r[0].el,t.vnode.el,o)){r=[];return}r.forEach(lS),r.forEach(cS);const a=r.filter(uS);nf(t.vnode.el),a.forEach(l=>{const c=l.el,u=c.style;Mi(c,o),u.transform=u.webkitTransform=u.transitionDuration="";const h=c[wl]=d=>{d&&d.target!==c||(!d||d.propertyName.endsWith("transform"))&&(c.removeEventListener("transitionend",h),c[wl]=null,Cr(c,o))};c.addEventListener("transitionend",h)}),r=[]}),()=>{const o=bt(n),a=N_(o);let l=o.tag||In;if(r=[],s)for(let c=0;c<s.length;c++){const u=s[c];u.el&&u.el instanceof Element&&(r.push(u),as(u,Ko(u,a,i,t)),O_.set(u,B_(u.el)))}s=e.default?_h(e.default()):[];for(let c=0;c<s.length;c++){const u=s[c];u.key!=null&&as(u,Ko(u,a,i,t))}return tn(l,null,s)}}}),RP=aS;function lS(n){const e=n.el;e[wl]&&e[wl](),e[ep]&&e[ep]()}function cS(n){F_.set(n,B_(n.el))}function uS(n){const e=O_.get(n),t=F_.get(n),i=e.left-t.left,r=e.top-t.top;if(i||r){const s=n.el,o=s.style,a=s.getBoundingClientRect();let l=1,c=1;return s.offsetWidth&&(l=a.width/s.offsetWidth),s.offsetHeight&&(c=a.height/s.offsetHeight),(!Number.isFinite(l)||l===0)&&(l=1),(!Number.isFinite(c)||c===0)&&(c=1),Math.abs(l-1)<.01&&(l=1),Math.abs(c-1)<.01&&(c=1),o.transform=o.webkitTransform=`translate(${i/l}px,${r/c}px)`,o.transitionDuration="0s",n}}function B_(n){const e=n.getBoundingClientRect();return{left:e.left,top:e.top}}function fS(n,e,t){const i=n.cloneNode(),r=n[Gs];r&&r.forEach(a=>{a.split(/\s+/).forEach(l=>l&&i.classList.remove(l))}),t.split(/\s+/).forEach(a=>a&&i.classList.add(a)),i.style.display="none";const s=e.nodeType===1?e:e.parentNode;s.appendChild(i);const{hasTransform:o}=U_(i);return s.removeChild(i),o}const Ur=n=>{const e=n.props["onUpdate:modelValue"]||!1;return nt(e)?t=>il(e,t):e};function hS(n){n.target.composing=!0}function tp(n){const e=n.target;e.composing&&(e.composing=!1,e.dispatchEvent(new Event("input")))}const ei=Symbol("_assign");function np(n,e,t){return e&&(n=n.trim()),t&&(n=Vl(n)),n}const CP={created(n,{modifiers:{lazy:e,trim:t,number:i}},r){n[ei]=Ur(r);const s=i||r.props&&r.props.type==="number";ir(n,e?"change":"input",o=>{o.target.composing||n[ei](np(n.value,t,s))}),(t||s)&&ir(n,"change",()=>{n.value=np(n.value,t,s)}),e||(ir(n,"compositionstart",hS),ir(n,"compositionend",tp),ir(n,"change",tp))},mounted(n,{value:e}){n.value=e??""},beforeUpdate(n,{value:e,oldValue:t,modifiers:{lazy:i,trim:r,number:s}},o){if(n[ei]=Ur(o),n.composing)return;const a=(s||n.type==="number")&&!/^0\d/.test(n.value)?Vl(n.value):n.value,l=e??"";a!==l&&(document.activeElement===n&&n.type!=="range"&&(i&&e===t||r&&n.value.trim()===l)||(n.value=l))}},PP={deep:!0,created(n,e,t){n[ei]=Ur(t),ir(n,"change",()=>{const i=n._modelValue,r=Ws(n),s=n.checked,o=n[ei];if(nt(i)){const a=lh(i,r),l=a!==-1;if(s&&!l)o(i.concat(r));else if(!s&&l){const c=[...i];c.splice(a,1),o(c)}}else if(no(i)){const a=new Set(i);s?a.add(r):a.delete(r),o(a)}else o(k_(n,s))})},mounted:ip,beforeUpdate(n,e,t){n[ei]=Ur(t),ip(n,e,t)}};function ip(n,{value:e,oldValue:t},i){n._modelValue=e;let r;if(nt(e))r=lh(e,i.props.value)>-1;else if(no(e))r=e.has(i.props.value);else{if(e===t)return;r=Dr(e,k_(n,!0))}n.checked!==r&&(n.checked=r)}const LP={created(n,{value:e},t){n.checked=Dr(e,t.props.value),n[ei]=Ur(t),ir(n,"change",()=>{n[ei](Ws(n))})},beforeUpdate(n,{value:e,oldValue:t},i){n[ei]=Ur(i),e!==t&&(n.checked=Dr(e,i.props.value))}},IP={deep:!0,created(n,{value:e,modifiers:{number:t}},i){const r=no(e);ir(n,"change",()=>{const s=Array.prototype.filter.call(n.options,o=>o.selected).map(o=>t?Vl(Ws(o)):Ws(o));n[ei](n.multiple?r?new Set(s):s:s[0]),n._assigning=!0,Gg(()=>{n._assigning=!1})}),n[ei]=Ur(i)},mounted(n,{value:e}){rp(n,e)},beforeUpdate(n,e,t){n[ei]=Ur(t)},updated(n,{value:e}){n._assigning||rp(n,e)}};function rp(n,e){const t=n.multiple,i=nt(e);if(!(t&&!i&&!no(e))){for(let r=0,s=n.options.length;r<s;r++){const o=n.options[r],a=Ws(o);if(t)if(i){const l=typeof a;l==="string"||l==="number"?o.selected=e.some(c=>String(c)===String(a)):o.selected=lh(e,a)>-1}else o.selected=e.has(a);else if(Dr(Ws(o),e)){n.selectedIndex!==r&&(n.selectedIndex=r);return}}!t&&n.selectedIndex!==-1&&(n.selectedIndex=-1)}}function Ws(n){return"_value"in n?n._value:n.value}function k_(n,e){const t=e?"_trueValue":"_falseValue";return t in n?n[t]:e}const dS=["ctrl","shift","alt","meta"],pS={stop:n=>n.stopPropagation(),prevent:n=>n.preventDefault(),self:n=>n.target!==n.currentTarget,ctrl:n=>!n.ctrlKey,shift:n=>!n.shiftKey,alt:n=>!n.altKey,meta:n=>!n.metaKey,left:n=>"button"in n&&n.button!==0,middle:n=>"button"in n&&n.button!==1,right:n=>"button"in n&&n.button!==2,exact:(n,e)=>dS.some(t=>n[`${t}Key`]&&!e.includes(t))},DP=(n,e)=>{if(!n)return n;const t=n._withMods||(n._withMods={}),i=e.join(".");return t[i]||(t[i]=((r,...s)=>{for(let o=0;o<e.length;o++){const a=pS[e[o]];if(a&&a(r,e))return}return n(r,...s)}))},mS={esc:"escape",space:" ",up:"arrow-up",left:"arrow-left",right:"arrow-right",down:"arrow-down",delete:"backspace"},NP=(n,e)=>{const t=n._withKeys||(n._withKeys={}),i=e.join(".");return t[i]||(t[i]=(r=>{if(!("key"in r))return;const s=Or(r.key);if(e.some(o=>o===s||mS[o]===s))return n(r)}))},gS=Zt({patchProp:iS},Vy);let sp;function _S(){return sp||(sp=gy(gS))}const UP=((...n)=>{const e=_S().createApp(...n),{mount:t}=e;return e.mount=i=>{const r=xS(i);if(!r)return;const s=e._component;!ut(s)&&!s.render&&!s.template&&(s.template=r.innerHTML),r.nodeType===1&&(r.textContent="");const o=t(r,!1,vS(r));return r instanceof Element&&(r.removeAttribute("v-cloak"),r.setAttribute("data-v-app","")),o},e});function vS(n){if(n instanceof SVGElement)return"svg";if(typeof MathMLElement=="function"&&n instanceof MathMLElement)return"mathml"}function xS(n){return Wt(n)?document.querySelector(n):n}function V_(n,e){return function(){return n.apply(e,arguments)}}const{toString:yS}=Object.prototype,{getPrototypeOf:bh}=Object,{iterator:$l,toStringTag:H_}=Symbol,Yl=(n=>e=>{const t=yS.call(e);return n[t]||(n[t]=t.slice(8,-1).toLowerCase())})(Object.create(null)),mi=n=>(n=n.toLowerCase(),e=>Yl(e)===n),Jl=n=>e=>typeof e===n,{isArray:io}=Array,js=Jl("undefined");function ca(n){return n!==null&&!js(n)&&n.constructor!==null&&!js(n.constructor)&&Nn(n.constructor.isBuffer)&&n.constructor.isBuffer(n)}const z_=mi("ArrayBuffer");function SS(n){let e;return typeof ArrayBuffer<"u"&&ArrayBuffer.isView?e=ArrayBuffer.isView(n):e=n&&n.buffer&&z_(n.buffer),e}const MS=Jl("string"),Nn=Jl("function"),G_=Jl("number"),ua=n=>n!==null&&typeof n=="object",bS=n=>n===!0||n===!1,cl=n=>{if(Yl(n)!=="object")return!1;const e=bh(n);return(e===null||e===Object.prototype||Object.getPrototypeOf(e)===null)&&!(H_ in n)&&!($l in n)},ES=n=>{if(!ua(n)||ca(n))return!1;try{return Object.keys(n).length===0&&Object.getPrototypeOf(n)===Object.prototype}catch{return!1}},TS=mi("Date"),AS=mi("File"),wS=n=>!!(n&&typeof n.uri<"u"),RS=n=>n&&typeof n.getParts<"u",CS=mi("Blob"),PS=mi("FileList"),LS=n=>ua(n)&&Nn(n.pipe);function IS(){return typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:typeof global<"u"?global:{}}const op=IS(),ap=typeof op.FormData<"u"?op.FormData:void 0,DS=n=>{let e;return n&&(ap&&n instanceof ap||Nn(n.append)&&((e=Yl(n))==="formdata"||e==="object"&&Nn(n.toString)&&n.toString()==="[object FormData]"))},NS=mi("URLSearchParams"),[US,OS,FS,BS]=["ReadableStream","Request","Response","Headers"].map(mi),kS=n=>n.trim?n.trim():n.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,"");function fa(n,e,{allOwnKeys:t=!1}={}){if(n===null||typeof n>"u")return;let i,r;if(typeof n!="object"&&(n=[n]),io(n))for(i=0,r=n.length;i<r;i++)e.call(null,n[i],i,n);else{if(ca(n))return;const s=t?Object.getOwnPropertyNames(n):Object.keys(n),o=s.length;let a;for(i=0;i<o;i++)a=s[i],e.call(null,n[a],a,n)}}function W_(n,e){if(ca(n))return null;e=e.toLowerCase();const t=Object.keys(n);let i=t.length,r;for(;i-- >0;)if(r=t[i],e===r.toLowerCase())return r;return null}const Qr=typeof globalThis<"u"?globalThis:typeof self<"u"?self:typeof window<"u"?window:global,j_=n=>!js(n)&&n!==Qr;function rf(){const{caseless:n,skipUndefined:e}=j_(this)&&this||{},t={},i=(r,s)=>{if(s==="__proto__"||s==="constructor"||s==="prototype")return;const o=n&&W_(t,s)||s;cl(t[o])&&cl(r)?t[o]=rf(t[o],r):cl(r)?t[o]=rf({},r):io(r)?t[o]=r.slice():(!e||!js(r))&&(t[o]=r)};for(let r=0,s=arguments.length;r<s;r++)arguments[r]&&fa(arguments[r],i);return t}const VS=(n,e,t,{allOwnKeys:i}={})=>(fa(e,(r,s)=>{t&&Nn(r)?Object.defineProperty(n,s,{value:V_(r,t),writable:!0,enumerable:!0,configurable:!0}):Object.defineProperty(n,s,{value:r,writable:!0,enumerable:!0,configurable:!0})},{allOwnKeys:i}),n),HS=n=>(n.charCodeAt(0)===65279&&(n=n.slice(1)),n),zS=(n,e,t,i)=>{n.prototype=Object.create(e.prototype,i),Object.defineProperty(n.prototype,"constructor",{value:n,writable:!0,enumerable:!1,configurable:!0}),Object.defineProperty(n,"super",{value:e.prototype}),t&&Object.assign(n.prototype,t)},GS=(n,e,t,i)=>{let r,s,o;const a={};if(e=e||{},n==null)return e;do{for(r=Object.getOwnPropertyNames(n),s=r.length;s-- >0;)o=r[s],(!i||i(o,n,e))&&!a[o]&&(e[o]=n[o],a[o]=!0);n=t!==!1&&bh(n)}while(n&&(!t||t(n,e))&&n!==Object.prototype);return e},WS=(n,e,t)=>{n=String(n),(t===void 0||t>n.length)&&(t=n.length),t-=e.length;const i=n.indexOf(e,t);return i!==-1&&i===t},jS=n=>{if(!n)return null;if(io(n))return n;let e=n.length;if(!G_(e))return null;const t=new Array(e);for(;e-- >0;)t[e]=n[e];return t},XS=(n=>e=>n&&e instanceof n)(typeof Uint8Array<"u"&&bh(Uint8Array)),qS=(n,e)=>{const i=(n&&n[$l]).call(n);let r;for(;(r=i.next())&&!r.done;){const s=r.value;e.call(n,s[0],s[1])}},KS=(n,e)=>{let t;const i=[];for(;(t=n.exec(e))!==null;)i.push(t);return i},$S=mi("HTMLFormElement"),YS=n=>n.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g,function(t,i,r){return i.toUpperCase()+r}),lp=(({hasOwnProperty:n})=>(e,t)=>n.call(e,t))(Object.prototype),JS=mi("RegExp"),X_=(n,e)=>{const t=Object.getOwnPropertyDescriptors(n),i={};fa(t,(r,s)=>{let o;(o=e(r,s,n))!==!1&&(i[s]=o||r)}),Object.defineProperties(n,i)},ZS=n=>{X_(n,(e,t)=>{if(Nn(n)&&["arguments","caller","callee"].indexOf(t)!==-1)return!1;const i=n[t];if(Nn(i)){if(e.enumerable=!1,"writable"in e){e.writable=!1;return}e.set||(e.set=()=>{throw Error("Can not rewrite read-only method '"+t+"'")})}})},QS=(n,e)=>{const t={},i=r=>{r.forEach(s=>{t[s]=!0})};return io(n)?i(n):i(String(n).split(e)),t},eM=()=>{},tM=(n,e)=>n!=null&&Number.isFinite(n=+n)?n:e;function nM(n){return!!(n&&Nn(n.append)&&n[H_]==="FormData"&&n[$l])}const iM=n=>{const e=new Array(10),t=(i,r)=>{if(ua(i)){if(e.indexOf(i)>=0)return;if(ca(i))return i;if(!("toJSON"in i)){e[r]=i;const s=io(i)?[]:{};return fa(i,(o,a)=>{const l=t(o,r+1);!js(l)&&(s[a]=l)}),e[r]=void 0,s}}return i};return t(n,0)},rM=mi("AsyncFunction"),sM=n=>n&&(ua(n)||Nn(n))&&Nn(n.then)&&Nn(n.catch),q_=((n,e)=>n?setImmediate:e?((t,i)=>(Qr.addEventListener("message",({source:r,data:s})=>{r===Qr&&s===t&&i.length&&i.shift()()},!1),r=>{i.push(r),Qr.postMessage(t,"*")}))(`axios@${Math.random()}`,[]):t=>setTimeout(t))(typeof setImmediate=="function",Nn(Qr.postMessage)),oM=typeof queueMicrotask<"u"?queueMicrotask.bind(Qr):typeof process<"u"&&process.nextTick||q_,aM=n=>n!=null&&Nn(n[$l]),ue={isArray:io,isArrayBuffer:z_,isBuffer:ca,isFormData:DS,isArrayBufferView:SS,isString:MS,isNumber:G_,isBoolean:bS,isObject:ua,isPlainObject:cl,isEmptyObject:ES,isReadableStream:US,isRequest:OS,isResponse:FS,isHeaders:BS,isUndefined:js,isDate:TS,isFile:AS,isReactNativeBlob:wS,isReactNative:RS,isBlob:CS,isRegExp:JS,isFunction:Nn,isStream:LS,isURLSearchParams:NS,isTypedArray:XS,isFileList:PS,forEach:fa,merge:rf,extend:VS,trim:kS,stripBOM:HS,inherits:zS,toFlatObject:GS,kindOf:Yl,kindOfTest:mi,endsWith:WS,toArray:jS,forEachEntry:qS,matchAll:KS,isHTMLForm:$S,hasOwnProperty:lp,hasOwnProp:lp,reduceDescriptors:X_,freezeMethods:ZS,toObjectSet:QS,toCamelCase:YS,noop:eM,toFiniteNumber:tM,findKey:W_,global:Qr,isContextDefined:j_,isSpecCompliantForm:nM,toJSONObject:iM,isAsyncFn:rM,isThenable:sM,setImmediate:q_,asap:oM,isIterable:aM};let at=class K_ extends Error{static from(e,t,i,r,s,o){const a=new K_(e.message,t||e.code,i,r,s);return a.cause=e,a.name=e.name,e.status!=null&&a.status==null&&(a.status=e.status),o&&Object.assign(a,o),a}constructor(e,t,i,r,s){super(e),Object.defineProperty(this,"message",{value:e,enumerable:!0,writable:!0,configurable:!0}),this.name="AxiosError",this.isAxiosError=!0,t&&(this.code=t),i&&(this.config=i),r&&(this.request=r),s&&(this.response=s,this.status=s.status)}toJSON(){return{message:this.message,name:this.name,description:this.description,number:this.number,fileName:this.fileName,lineNumber:this.lineNumber,columnNumber:this.columnNumber,stack:this.stack,config:ue.toJSONObject(this.config),code:this.code,status:this.status}}};at.ERR_BAD_OPTION_VALUE="ERR_BAD_OPTION_VALUE";at.ERR_BAD_OPTION="ERR_BAD_OPTION";at.ECONNABORTED="ECONNABORTED";at.ETIMEDOUT="ETIMEDOUT";at.ERR_NETWORK="ERR_NETWORK";at.ERR_FR_TOO_MANY_REDIRECTS="ERR_FR_TOO_MANY_REDIRECTS";at.ERR_DEPRECATED="ERR_DEPRECATED";at.ERR_BAD_RESPONSE="ERR_BAD_RESPONSE";at.ERR_BAD_REQUEST="ERR_BAD_REQUEST";at.ERR_CANCELED="ERR_CANCELED";at.ERR_NOT_SUPPORT="ERR_NOT_SUPPORT";at.ERR_INVALID_URL="ERR_INVALID_URL";const lM=null;function sf(n){return ue.isPlainObject(n)||ue.isArray(n)}function $_(n){return ue.endsWith(n,"[]")?n.slice(0,-2):n}function Rc(n,e,t){return n?n.concat(e).map(function(r,s){return r=$_(r),!t&&s?"["+r+"]":r}).join(t?".":""):e}function cM(n){return ue.isArray(n)&&!n.some(sf)}const uM=ue.toFlatObject(ue,{},null,function(e){return/^is[A-Z]/.test(e)});function Zl(n,e,t){if(!ue.isObject(n))throw new TypeError("target must be an object");e=e||new FormData,t=ue.toFlatObject(t,{metaTokens:!0,dots:!1,indexes:!1},!1,function(x,m){return!ue.isUndefined(m[x])});const i=t.metaTokens,r=t.visitor||u,s=t.dots,o=t.indexes,l=(t.Blob||typeof Blob<"u"&&Blob)&&ue.isSpecCompliantForm(e);if(!ue.isFunction(r))throw new TypeError("visitor must be a function");function c(p){if(p===null)return"";if(ue.isDate(p))return p.toISOString();if(ue.isBoolean(p))return p.toString();if(!l&&ue.isBlob(p))throw new at("Blob is not supported. Use a Buffer instead.");return ue.isArrayBuffer(p)||ue.isTypedArray(p)?l&&typeof Blob=="function"?new Blob([p]):Buffer.from(p):p}function u(p,x,m){let _=p;if(ue.isReactNative(e)&&ue.isReactNativeBlob(p))return e.append(Rc(m,x,s),c(p)),!1;if(p&&!m&&typeof p=="object"){if(ue.endsWith(x,"{}"))x=i?x:x.slice(0,-2),p=JSON.stringify(p);else if(ue.isArray(p)&&cM(p)||(ue.isFileList(p)||ue.endsWith(x,"[]"))&&(_=ue.toArray(p)))return x=$_(x),_.forEach(function(T,b){!(ue.isUndefined(T)||T===null)&&e.append(o===!0?Rc([x],b,s):o===null?x:x+"[]",c(T))}),!1}return sf(p)?!0:(e.append(Rc(m,x,s),c(p)),!1)}const h=[],d=Object.assign(uM,{defaultVisitor:u,convertValue:c,isVisitable:sf});function g(p,x){if(!ue.isUndefined(p)){if(h.indexOf(p)!==-1)throw Error("Circular reference detected in "+x.join("."));h.push(p),ue.forEach(p,function(_,M){(!(ue.isUndefined(_)||_===null)&&r.call(e,_,ue.isString(M)?M.trim():M,x,d))===!0&&g(_,x?x.concat(M):[M])}),h.pop()}}if(!ue.isObject(n))throw new TypeError("data must be an object");return g(n),e}function cp(n){const e={"!":"%21","'":"%27","(":"%28",")":"%29","~":"%7E","%20":"+","%00":"\0"};return encodeURIComponent(n).replace(/[!'()~]|%20|%00/g,function(i){return e[i]})}function Eh(n,e){this._pairs=[],n&&Zl(n,this,e)}const Y_=Eh.prototype;Y_.append=function(e,t){this._pairs.push([e,t])};Y_.toString=function(e){const t=e?function(i){return e.call(this,i,cp)}:cp;return this._pairs.map(function(r){return t(r[0])+"="+t(r[1])},"").join("&")};function fM(n){return encodeURIComponent(n).replace(/%3A/gi,":").replace(/%24/g,"$").replace(/%2C/gi,",").replace(/%20/g,"+")}function J_(n,e,t){if(!e)return n;const i=t&&t.encode||fM,r=ue.isFunction(t)?{serialize:t}:t,s=r&&r.serialize;let o;if(s?o=s(e,r):o=ue.isURLSearchParams(e)?e.toString():new Eh(e,r).toString(i),o){const a=n.indexOf("#");a!==-1&&(n=n.slice(0,a)),n+=(n.indexOf("?")===-1?"?":"&")+o}return n}class up{constructor(){this.handlers=[]}use(e,t,i){return this.handlers.push({fulfilled:e,rejected:t,synchronous:i?i.synchronous:!1,runWhen:i?i.runWhen:null}),this.handlers.length-1}eject(e){this.handlers[e]&&(this.handlers[e]=null)}clear(){this.handlers&&(this.handlers=[])}forEach(e){ue.forEach(this.handlers,function(i){i!==null&&e(i)})}}const Th={silentJSONParsing:!0,forcedJSONParsing:!0,clarifyTimeoutError:!1,legacyInterceptorReqResOrdering:!0},hM=typeof URLSearchParams<"u"?URLSearchParams:Eh,dM=typeof FormData<"u"?FormData:null,pM=typeof Blob<"u"?Blob:null,mM={isBrowser:!0,classes:{URLSearchParams:hM,FormData:dM,Blob:pM},protocols:["http","https","file","blob","url","data"]},Ah=typeof window<"u"&&typeof document<"u",of=typeof navigator=="object"&&navigator||void 0,gM=Ah&&(!of||["ReactNative","NativeScript","NS"].indexOf(of.product)<0),_M=typeof WorkerGlobalScope<"u"&&self instanceof WorkerGlobalScope&&typeof self.importScripts=="function",vM=Ah&&window.location.href||"http://localhost",xM=Object.freeze(Object.defineProperty({__proto__:null,hasBrowserEnv:Ah,hasStandardBrowserEnv:gM,hasStandardBrowserWebWorkerEnv:_M,navigator:of,origin:vM},Symbol.toStringTag,{value:"Module"})),Mn={...xM,...mM};function yM(n,e){return Zl(n,new Mn.classes.URLSearchParams,{visitor:function(t,i,r,s){return Mn.isNode&&ue.isBuffer(t)?(this.append(i,t.toString("base64")),!1):s.defaultVisitor.apply(this,arguments)},...e})}function SM(n){return ue.matchAll(/\w+|\[(\w*)]/g,n).map(e=>e[0]==="[]"?"":e[1]||e[0])}function MM(n){const e={},t=Object.keys(n);let i;const r=t.length;let s;for(i=0;i<r;i++)s=t[i],e[s]=n[s];return e}function Z_(n){function e(t,i,r,s){let o=t[s++];if(o==="__proto__")return!0;const a=Number.isFinite(+o),l=s>=t.length;return o=!o&&ue.isArray(r)?r.length:o,l?(ue.hasOwnProp(r,o)?r[o]=[r[o],i]:r[o]=i,!a):((!r[o]||!ue.isObject(r[o]))&&(r[o]=[]),e(t,i,r[o],s)&&ue.isArray(r[o])&&(r[o]=MM(r[o])),!a)}if(ue.isFormData(n)&&ue.isFunction(n.entries)){const t={};return ue.forEachEntry(n,(i,r)=>{e(SM(i),r,t,0)}),t}return null}function bM(n,e,t){if(ue.isString(n))try{return(e||JSON.parse)(n),ue.trim(n)}catch(i){if(i.name!=="SyntaxError")throw i}return(t||JSON.stringify)(n)}const ha={transitional:Th,adapter:["xhr","http","fetch"],transformRequest:[function(e,t){const i=t.getContentType()||"",r=i.indexOf("application/json")>-1,s=ue.isObject(e);if(s&&ue.isHTMLForm(e)&&(e=new FormData(e)),ue.isFormData(e))return r?JSON.stringify(Z_(e)):e;if(ue.isArrayBuffer(e)||ue.isBuffer(e)||ue.isStream(e)||ue.isFile(e)||ue.isBlob(e)||ue.isReadableStream(e))return e;if(ue.isArrayBufferView(e))return e.buffer;if(ue.isURLSearchParams(e))return t.setContentType("application/x-www-form-urlencoded;charset=utf-8",!1),e.toString();let a;if(s){if(i.indexOf("application/x-www-form-urlencoded")>-1)return yM(e,this.formSerializer).toString();if((a=ue.isFileList(e))||i.indexOf("multipart/form-data")>-1){const l=this.env&&this.env.FormData;return Zl(a?{"files[]":e}:e,l&&new l,this.formSerializer)}}return s||r?(t.setContentType("application/json",!1),bM(e)):e}],transformResponse:[function(e){const t=this.transitional||ha.transitional,i=t&&t.forcedJSONParsing,r=this.responseType==="json";if(ue.isResponse(e)||ue.isReadableStream(e))return e;if(e&&ue.isString(e)&&(i&&!this.responseType||r)){const o=!(t&&t.silentJSONParsing)&&r;try{return JSON.parse(e,this.parseReviver)}catch(a){if(o)throw a.name==="SyntaxError"?at.from(a,at.ERR_BAD_RESPONSE,this,null,this.response):a}}return e}],timeout:0,xsrfCookieName:"XSRF-TOKEN",xsrfHeaderName:"X-XSRF-TOKEN",maxContentLength:-1,maxBodyLength:-1,env:{FormData:Mn.classes.FormData,Blob:Mn.classes.Blob},validateStatus:function(e){return e>=200&&e<300},headers:{common:{Accept:"application/json, text/plain, */*","Content-Type":void 0}}};ue.forEach(["delete","get","head","post","put","patch"],n=>{ha.headers[n]={}});const EM=ue.toObjectSet(["age","authorization","content-length","content-type","etag","expires","from","host","if-modified-since","if-unmodified-since","last-modified","location","max-forwards","proxy-authorization","referer","retry-after","user-agent"]),TM=n=>{const e={};let t,i,r;return n&&n.split(`
`).forEach(function(o){r=o.indexOf(":"),t=o.substring(0,r).trim().toLowerCase(),i=o.substring(r+1).trim(),!(!t||e[t]&&EM[t])&&(t==="set-cookie"?e[t]?e[t].push(i):e[t]=[i]:e[t]=e[t]?e[t]+", "+i:i)}),e},fp=Symbol("internals");function yo(n){return n&&String(n).trim().toLowerCase()}function ul(n){return n===!1||n==null?n:ue.isArray(n)?n.map(ul):String(n)}function AM(n){const e=Object.create(null),t=/([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;let i;for(;i=t.exec(n);)e[i[1]]=i[2];return e}const wM=n=>/^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(n.trim());function Cc(n,e,t,i,r){if(ue.isFunction(i))return i.call(this,e,t);if(r&&(e=t),!!ue.isString(e)){if(ue.isString(i))return e.indexOf(i)!==-1;if(ue.isRegExp(i))return i.test(e)}}function RM(n){return n.trim().toLowerCase().replace(/([a-z\d])(\w*)/g,(e,t,i)=>t.toUpperCase()+i)}function CM(n,e){const t=ue.toCamelCase(" "+e);["get","set","has"].forEach(i=>{Object.defineProperty(n,i+t,{value:function(r,s,o){return this[i].call(this,e,r,s,o)},configurable:!0})})}let Un=class{constructor(e){e&&this.set(e)}set(e,t,i){const r=this;function s(a,l,c){const u=yo(l);if(!u)throw new Error("header name must be a non-empty string");const h=ue.findKey(r,u);(!h||r[h]===void 0||c===!0||c===void 0&&r[h]!==!1)&&(r[h||l]=ul(a))}const o=(a,l)=>ue.forEach(a,(c,u)=>s(c,u,l));if(ue.isPlainObject(e)||e instanceof this.constructor)o(e,t);else if(ue.isString(e)&&(e=e.trim())&&!wM(e))o(TM(e),t);else if(ue.isObject(e)&&ue.isIterable(e)){let a={},l,c;for(const u of e){if(!ue.isArray(u))throw TypeError("Object iterator must return a key-value pair");a[c=u[0]]=(l=a[c])?ue.isArray(l)?[...l,u[1]]:[l,u[1]]:u[1]}o(a,t)}else e!=null&&s(t,e,i);return this}get(e,t){if(e=yo(e),e){const i=ue.findKey(this,e);if(i){const r=this[i];if(!t)return r;if(t===!0)return AM(r);if(ue.isFunction(t))return t.call(this,r,i);if(ue.isRegExp(t))return t.exec(r);throw new TypeError("parser must be boolean|regexp|function")}}}has(e,t){if(e=yo(e),e){const i=ue.findKey(this,e);return!!(i&&this[i]!==void 0&&(!t||Cc(this,this[i],i,t)))}return!1}delete(e,t){const i=this;let r=!1;function s(o){if(o=yo(o),o){const a=ue.findKey(i,o);a&&(!t||Cc(i,i[a],a,t))&&(delete i[a],r=!0)}}return ue.isArray(e)?e.forEach(s):s(e),r}clear(e){const t=Object.keys(this);let i=t.length,r=!1;for(;i--;){const s=t[i];(!e||Cc(this,this[s],s,e,!0))&&(delete this[s],r=!0)}return r}normalize(e){const t=this,i={};return ue.forEach(this,(r,s)=>{const o=ue.findKey(i,s);if(o){t[o]=ul(r),delete t[s];return}const a=e?RM(s):String(s).trim();a!==s&&delete t[s],t[a]=ul(r),i[a]=!0}),this}concat(...e){return this.constructor.concat(this,...e)}toJSON(e){const t=Object.create(null);return ue.forEach(this,(i,r)=>{i!=null&&i!==!1&&(t[r]=e&&ue.isArray(i)?i.join(", "):i)}),t}[Symbol.iterator](){return Object.entries(this.toJSON())[Symbol.iterator]()}toString(){return Object.entries(this.toJSON()).map(([e,t])=>e+": "+t).join(`
`)}getSetCookie(){return this.get("set-cookie")||[]}get[Symbol.toStringTag](){return"AxiosHeaders"}static from(e){return e instanceof this?e:new this(e)}static concat(e,...t){const i=new this(e);return t.forEach(r=>i.set(r)),i}static accessor(e){const i=(this[fp]=this[fp]={accessors:{}}).accessors,r=this.prototype;function s(o){const a=yo(o);i[a]||(CM(r,o),i[a]=!0)}return ue.isArray(e)?e.forEach(s):s(e),this}};Un.accessor(["Content-Type","Content-Length","Accept","Accept-Encoding","User-Agent","Authorization"]);ue.reduceDescriptors(Un.prototype,({value:n},e)=>{let t=e[0].toUpperCase()+e.slice(1);return{get:()=>n,set(i){this[t]=i}}});ue.freezeMethods(Un);function Pc(n,e){const t=this||ha,i=e||t,r=Un.from(i.headers);let s=i.data;return ue.forEach(n,function(a){s=a.call(t,s,r.normalize(),e?e.status:void 0)}),r.normalize(),s}function Q_(n){return!!(n&&n.__CANCEL__)}let da=class extends at{constructor(e,t,i){super(e??"canceled",at.ERR_CANCELED,t,i),this.name="CanceledError",this.__CANCEL__=!0}};function e0(n,e,t){const i=t.config.validateStatus;!t.status||!i||i(t.status)?n(t):e(new at("Request failed with status code "+t.status,[at.ERR_BAD_REQUEST,at.ERR_BAD_RESPONSE][Math.floor(t.status/100)-4],t.config,t.request,t))}function PM(n){const e=/^([-+\w]{1,25})(:?\/\/|:)/.exec(n);return e&&e[1]||""}function LM(n,e){n=n||10;const t=new Array(n),i=new Array(n);let r=0,s=0,o;return e=e!==void 0?e:1e3,function(l){const c=Date.now(),u=i[s];o||(o=c),t[r]=l,i[r]=c;let h=s,d=0;for(;h!==r;)d+=t[h++],h=h%n;if(r=(r+1)%n,r===s&&(s=(s+1)%n),c-o<e)return;const g=u&&c-u;return g?Math.round(d*1e3/g):void 0}}function IM(n,e){let t=0,i=1e3/e,r,s;const o=(c,u=Date.now())=>{t=u,r=null,s&&(clearTimeout(s),s=null),n(...c)};return[(...c)=>{const u=Date.now(),h=u-t;h>=i?o(c,u):(r=c,s||(s=setTimeout(()=>{s=null,o(r)},i-h)))},()=>r&&o(r)]}const Rl=(n,e,t=3)=>{let i=0;const r=LM(50,250);return IM(s=>{const o=s.loaded,a=s.lengthComputable?s.total:void 0,l=o-i,c=r(l),u=o<=a;i=o;const h={loaded:o,total:a,progress:a?o/a:void 0,bytes:l,rate:c||void 0,estimated:c&&a&&u?(a-o)/c:void 0,event:s,lengthComputable:a!=null,[e?"download":"upload"]:!0};n(h)},t)},hp=(n,e)=>{const t=n!=null;return[i=>e[0]({lengthComputable:t,total:n,loaded:i}),e[1]]},dp=n=>(...e)=>ue.asap(()=>n(...e)),DM=Mn.hasStandardBrowserEnv?((n,e)=>t=>(t=new URL(t,Mn.origin),n.protocol===t.protocol&&n.host===t.host&&(e||n.port===t.port)))(new URL(Mn.origin),Mn.navigator&&/(msie|trident)/i.test(Mn.navigator.userAgent)):()=>!0,NM=Mn.hasStandardBrowserEnv?{write(n,e,t,i,r,s,o){if(typeof document>"u")return;const a=[`${n}=${encodeURIComponent(e)}`];ue.isNumber(t)&&a.push(`expires=${new Date(t).toUTCString()}`),ue.isString(i)&&a.push(`path=${i}`),ue.isString(r)&&a.push(`domain=${r}`),s===!0&&a.push("secure"),ue.isString(o)&&a.push(`SameSite=${o}`),document.cookie=a.join("; ")},read(n){if(typeof document>"u")return null;const e=document.cookie.match(new RegExp("(?:^|; )"+n+"=([^;]*)"));return e?decodeURIComponent(e[1]):null},remove(n){this.write(n,"",Date.now()-864e5,"/")}}:{write(){},read(){return null},remove(){}};function UM(n){return typeof n!="string"?!1:/^([a-z][a-z\d+\-.]*:)?\/\//i.test(n)}function OM(n,e){return e?n.replace(/\/?\/$/,"")+"/"+e.replace(/^\/+/,""):n}function t0(n,e,t){let i=!UM(e);return n&&(i||t==!1)?OM(n,e):e}const pp=n=>n instanceof Un?{...n}:n;function ls(n,e){e=e||{};const t={};function i(c,u,h,d){return ue.isPlainObject(c)&&ue.isPlainObject(u)?ue.merge.call({caseless:d},c,u):ue.isPlainObject(u)?ue.merge({},u):ue.isArray(u)?u.slice():u}function r(c,u,h,d){if(ue.isUndefined(u)){if(!ue.isUndefined(c))return i(void 0,c,h,d)}else return i(c,u,h,d)}function s(c,u){if(!ue.isUndefined(u))return i(void 0,u)}function o(c,u){if(ue.isUndefined(u)){if(!ue.isUndefined(c))return i(void 0,c)}else return i(void 0,u)}function a(c,u,h){if(h in e)return i(c,u);if(h in n)return i(void 0,c)}const l={url:s,method:s,data:s,baseURL:o,transformRequest:o,transformResponse:o,paramsSerializer:o,timeout:o,timeoutMessage:o,withCredentials:o,withXSRFToken:o,adapter:o,responseType:o,xsrfCookieName:o,xsrfHeaderName:o,onUploadProgress:o,onDownloadProgress:o,decompress:o,maxContentLength:o,maxBodyLength:o,beforeRedirect:o,transport:o,httpAgent:o,httpsAgent:o,cancelToken:o,socketPath:o,responseEncoding:o,validateStatus:a,headers:(c,u,h)=>r(pp(c),pp(u),h,!0)};return ue.forEach(Object.keys({...n,...e}),function(u){if(u==="__proto__"||u==="constructor"||u==="prototype")return;const h=ue.hasOwnProp(l,u)?l[u]:r,d=h(n[u],e[u],u);ue.isUndefined(d)&&h!==a||(t[u]=d)}),t}const n0=n=>{const e=ls({},n);let{data:t,withXSRFToken:i,xsrfHeaderName:r,xsrfCookieName:s,headers:o,auth:a}=e;if(e.headers=o=Un.from(o),e.url=J_(t0(e.baseURL,e.url,e.allowAbsoluteUrls),n.params,n.paramsSerializer),a&&o.set("Authorization","Basic "+btoa((a.username||"")+":"+(a.password?unescape(encodeURIComponent(a.password)):""))),ue.isFormData(t)){if(Mn.hasStandardBrowserEnv||Mn.hasStandardBrowserWebWorkerEnv)o.setContentType(void 0);else if(ue.isFunction(t.getHeaders)){const l=t.getHeaders(),c=["content-type","content-length"];Object.entries(l).forEach(([u,h])=>{c.includes(u.toLowerCase())&&o.set(u,h)})}}if(Mn.hasStandardBrowserEnv&&(i&&ue.isFunction(i)&&(i=i(e)),i||i!==!1&&DM(e.url))){const l=r&&s&&NM.read(s);l&&o.set(r,l)}return e},FM=typeof XMLHttpRequest<"u",BM=FM&&function(n){return new Promise(function(t,i){const r=n0(n);let s=r.data;const o=Un.from(r.headers).normalize();let{responseType:a,onUploadProgress:l,onDownloadProgress:c}=r,u,h,d,g,p;function x(){g&&g(),p&&p(),r.cancelToken&&r.cancelToken.unsubscribe(u),r.signal&&r.signal.removeEventListener("abort",u)}let m=new XMLHttpRequest;m.open(r.method.toUpperCase(),r.url,!0),m.timeout=r.timeout;function _(){if(!m)return;const T=Un.from("getAllResponseHeaders"in m&&m.getAllResponseHeaders()),I={data:!a||a==="text"||a==="json"?m.responseText:m.response,status:m.status,statusText:m.statusText,headers:T,config:n,request:m};e0(function(B){t(B),x()},function(B){i(B),x()},I),m=null}"onloadend"in m?m.onloadend=_:m.onreadystatechange=function(){!m||m.readyState!==4||m.status===0&&!(m.responseURL&&m.responseURL.indexOf("file:")===0)||setTimeout(_)},m.onabort=function(){m&&(i(new at("Request aborted",at.ECONNABORTED,n,m)),m=null)},m.onerror=function(b){const I=b&&b.message?b.message:"Network Error",D=new at(I,at.ERR_NETWORK,n,m);D.event=b||null,i(D),m=null},m.ontimeout=function(){let b=r.timeout?"timeout of "+r.timeout+"ms exceeded":"timeout exceeded";const I=r.transitional||Th;r.timeoutErrorMessage&&(b=r.timeoutErrorMessage),i(new at(b,I.clarifyTimeoutError?at.ETIMEDOUT:at.ECONNABORTED,n,m)),m=null},s===void 0&&o.setContentType(null),"setRequestHeader"in m&&ue.forEach(o.toJSON(),function(b,I){m.setRequestHeader(I,b)}),ue.isUndefined(r.withCredentials)||(m.withCredentials=!!r.withCredentials),a&&a!=="json"&&(m.responseType=r.responseType),c&&([d,p]=Rl(c,!0),m.addEventListener("progress",d)),l&&m.upload&&([h,g]=Rl(l),m.upload.addEventListener("progress",h),m.upload.addEventListener("loadend",g)),(r.cancelToken||r.signal)&&(u=T=>{m&&(i(!T||T.type?new da(null,n,m):T),m.abort(),m=null)},r.cancelToken&&r.cancelToken.subscribe(u),r.signal&&(r.signal.aborted?u():r.signal.addEventListener("abort",u)));const M=PM(r.url);if(M&&Mn.protocols.indexOf(M)===-1){i(new at("Unsupported protocol "+M+":",at.ERR_BAD_REQUEST,n));return}m.send(s||null)})},kM=(n,e)=>{const{length:t}=n=n?n.filter(Boolean):[];if(e||t){let i=new AbortController,r;const s=function(c){if(!r){r=!0,a();const u=c instanceof Error?c:this.reason;i.abort(u instanceof at?u:new da(u instanceof Error?u.message:u))}};let o=e&&setTimeout(()=>{o=null,s(new at(`timeout of ${e}ms exceeded`,at.ETIMEDOUT))},e);const a=()=>{n&&(o&&clearTimeout(o),o=null,n.forEach(c=>{c.unsubscribe?c.unsubscribe(s):c.removeEventListener("abort",s)}),n=null)};n.forEach(c=>c.addEventListener("abort",s));const{signal:l}=i;return l.unsubscribe=()=>ue.asap(a),l}},VM=function*(n,e){let t=n.byteLength;if(t<e){yield n;return}let i=0,r;for(;i<t;)r=i+e,yield n.slice(i,r),i=r},HM=async function*(n,e){for await(const t of zM(n))yield*VM(t,e)},zM=async function*(n){if(n[Symbol.asyncIterator]){yield*n;return}const e=n.getReader();try{for(;;){const{done:t,value:i}=await e.read();if(t)break;yield i}}finally{await e.cancel()}},mp=(n,e,t,i)=>{const r=HM(n,e);let s=0,o,a=l=>{o||(o=!0,i&&i(l))};return new ReadableStream({async pull(l){try{const{done:c,value:u}=await r.next();if(c){a(),l.close();return}let h=u.byteLength;if(t){let d=s+=h;t(d)}l.enqueue(new Uint8Array(u))}catch(c){throw a(c),c}},cancel(l){return a(l),r.return()}},{highWaterMark:2})},gp=64*1024,{isFunction:Ta}=ue,GM=(({Request:n,Response:e})=>({Request:n,Response:e}))(ue.global),{ReadableStream:_p,TextEncoder:vp}=ue.global,xp=(n,...e)=>{try{return!!n(...e)}catch{return!1}},WM=n=>{n=ue.merge.call({skipUndefined:!0},GM,n);const{fetch:e,Request:t,Response:i}=n,r=e?Ta(e):typeof fetch=="function",s=Ta(t),o=Ta(i);if(!r)return!1;const a=r&&Ta(_p),l=r&&(typeof vp=="function"?(p=>x=>p.encode(x))(new vp):async p=>new Uint8Array(await new t(p).arrayBuffer())),c=s&&a&&xp(()=>{let p=!1;const x=new t(Mn.origin,{body:new _p,method:"POST",get duplex(){return p=!0,"half"}}).headers.has("Content-Type");return p&&!x}),u=o&&a&&xp(()=>ue.isReadableStream(new i("").body)),h={stream:u&&(p=>p.body)};r&&["text","arrayBuffer","blob","formData","stream"].forEach(p=>{!h[p]&&(h[p]=(x,m)=>{let _=x&&x[p];if(_)return _.call(x);throw new at(`Response type '${p}' is not supported`,at.ERR_NOT_SUPPORT,m)})});const d=async p=>{if(p==null)return 0;if(ue.isBlob(p))return p.size;if(ue.isSpecCompliantForm(p))return(await new t(Mn.origin,{method:"POST",body:p}).arrayBuffer()).byteLength;if(ue.isArrayBufferView(p)||ue.isArrayBuffer(p))return p.byteLength;if(ue.isURLSearchParams(p)&&(p=p+""),ue.isString(p))return(await l(p)).byteLength},g=async(p,x)=>{const m=ue.toFiniteNumber(p.getContentLength());return m??d(x)};return async p=>{let{url:x,method:m,data:_,signal:M,cancelToken:T,timeout:b,onDownloadProgress:I,onUploadProgress:D,responseType:B,headers:E,withCredentials:w="same-origin",fetchOptions:L}=n0(p),R=e||fetch;B=B?(B+"").toLowerCase():"text";let U=kM([M,T&&T.toAbortSignal()],b),H=null;const q=U&&U.unsubscribe&&(()=>{U.unsubscribe()});let J;try{if(D&&c&&m!=="get"&&m!=="head"&&(J=await g(E,_))!==0){let ne=new t(x,{method:"POST",body:_,duplex:"half"}),fe;if(ue.isFormData(_)&&(fe=ne.headers.get("content-type"))&&E.setContentType(fe),ne.body){const[ye,je]=hp(J,Rl(dp(D)));_=mp(ne.body,gp,ye,je)}}ue.isString(w)||(w=w?"include":"omit");const O=s&&"credentials"in t.prototype,j={...L,signal:U,method:m.toUpperCase(),headers:E.normalize().toJSON(),body:_,duplex:"half",credentials:O?w:void 0};H=s&&new t(x,j);let ie=await(s?R(H,L):R(x,j));const X=u&&(B==="stream"||B==="response");if(u&&(I||X&&q)){const ne={};["status","statusText","headers"].forEach(tt=>{ne[tt]=ie[tt]});const fe=ue.toFiniteNumber(ie.headers.get("content-length")),[ye,je]=I&&hp(fe,Rl(dp(I),!0))||[];ie=new i(mp(ie.body,gp,ye,()=>{je&&je(),q&&q()}),ne)}B=B||"text";let Y=await h[ue.findKey(h,B)||"text"](ie,p);return!X&&q&&q(),await new Promise((ne,fe)=>{e0(ne,fe,{data:Y,headers:Un.from(ie.headers),status:ie.status,statusText:ie.statusText,config:p,request:H})})}catch(O){throw q&&q(),O&&O.name==="TypeError"&&/Load failed|fetch/i.test(O.message)?Object.assign(new at("Network Error",at.ERR_NETWORK,p,H,O&&O.response),{cause:O.cause||O}):at.from(O,O&&O.code,p,H,O&&O.response)}}},jM=new Map,i0=n=>{let e=n&&n.env||{};const{fetch:t,Request:i,Response:r}=e,s=[i,r,t];let o=s.length,a=o,l,c,u=jM;for(;a--;)l=s[a],c=u.get(l),c===void 0&&u.set(l,c=a?new Map:WM(e)),u=c;return c};i0();const wh={http:lM,xhr:BM,fetch:{get:i0}};ue.forEach(wh,(n,e)=>{if(n){try{Object.defineProperty(n,"name",{value:e})}catch{}Object.defineProperty(n,"adapterName",{value:e})}});const yp=n=>`- ${n}`,XM=n=>ue.isFunction(n)||n===null||n===!1;function qM(n,e){n=ue.isArray(n)?n:[n];const{length:t}=n;let i,r;const s={};for(let o=0;o<t;o++){i=n[o];let a;if(r=i,!XM(i)&&(r=wh[(a=String(i)).toLowerCase()],r===void 0))throw new at(`Unknown adapter '${a}'`);if(r&&(ue.isFunction(r)||(r=r.get(e))))break;s[a||"#"+o]=r}if(!r){const o=Object.entries(s).map(([l,c])=>`adapter ${l} `+(c===!1?"is not supported by the environment":"is not available in the build"));let a=t?o.length>1?`since :
`+o.map(yp).join(`
`):" "+yp(o[0]):"as no adapter specified";throw new at("There is no suitable adapter to dispatch the request "+a,"ERR_NOT_SUPPORT")}return r}const r0={getAdapter:qM,adapters:wh};function Lc(n){if(n.cancelToken&&n.cancelToken.throwIfRequested(),n.signal&&n.signal.aborted)throw new da(null,n)}function Sp(n){return Lc(n),n.headers=Un.from(n.headers),n.data=Pc.call(n,n.transformRequest),["post","put","patch"].indexOf(n.method)!==-1&&n.headers.setContentType("application/x-www-form-urlencoded",!1),r0.getAdapter(n.adapter||ha.adapter,n)(n).then(function(i){return Lc(n),i.data=Pc.call(n,n.transformResponse,i),i.headers=Un.from(i.headers),i},function(i){return Q_(i)||(Lc(n),i&&i.response&&(i.response.data=Pc.call(n,n.transformResponse,i.response),i.response.headers=Un.from(i.response.headers))),Promise.reject(i)})}const s0="1.13.6",Ql={};["object","boolean","number","function","string","symbol"].forEach((n,e)=>{Ql[n]=function(i){return typeof i===n||"a"+(e<1?"n ":" ")+n}});const Mp={};Ql.transitional=function(e,t,i){function r(s,o){return"[Axios v"+s0+"] Transitional option '"+s+"'"+o+(i?". "+i:"")}return(s,o,a)=>{if(e===!1)throw new at(r(o," has been removed"+(t?" in "+t:"")),at.ERR_DEPRECATED);return t&&!Mp[o]&&(Mp[o]=!0),e?e(s,o,a):!0}};Ql.spelling=function(e){return(t,i)=>!0};function KM(n,e,t){if(typeof n!="object")throw new at("options must be an object",at.ERR_BAD_OPTION_VALUE);const i=Object.keys(n);let r=i.length;for(;r-- >0;){const s=i[r],o=e[s];if(o){const a=n[s],l=a===void 0||o(a,s,n);if(l!==!0)throw new at("option "+s+" must be "+l,at.ERR_BAD_OPTION_VALUE);continue}if(t!==!0)throw new at("Unknown option "+s,at.ERR_BAD_OPTION)}}const fl={assertOptions:KM,validators:Ql},Kn=fl.validators;let os=class{constructor(e){this.defaults=e||{},this.interceptors={request:new up,response:new up}}async request(e,t){try{return await this._request(e,t)}catch(i){if(i instanceof Error){let r={};Error.captureStackTrace?Error.captureStackTrace(r):r=new Error;const s=r.stack?r.stack.replace(/^.+\n/,""):"";try{i.stack?s&&!String(i.stack).endsWith(s.replace(/^.+\n.+\n/,""))&&(i.stack+=`
`+s):i.stack=s}catch{}}throw i}}_request(e,t){typeof e=="string"?(t=t||{},t.url=e):t=e||{},t=ls(this.defaults,t);const{transitional:i,paramsSerializer:r,headers:s}=t;i!==void 0&&fl.assertOptions(i,{silentJSONParsing:Kn.transitional(Kn.boolean),forcedJSONParsing:Kn.transitional(Kn.boolean),clarifyTimeoutError:Kn.transitional(Kn.boolean),legacyInterceptorReqResOrdering:Kn.transitional(Kn.boolean)},!1),r!=null&&(ue.isFunction(r)?t.paramsSerializer={serialize:r}:fl.assertOptions(r,{encode:Kn.function,serialize:Kn.function},!0)),t.allowAbsoluteUrls!==void 0||(this.defaults.allowAbsoluteUrls!==void 0?t.allowAbsoluteUrls=this.defaults.allowAbsoluteUrls:t.allowAbsoluteUrls=!0),fl.assertOptions(t,{baseUrl:Kn.spelling("baseURL"),withXsrfToken:Kn.spelling("withXSRFToken")},!0),t.method=(t.method||this.defaults.method||"get").toLowerCase();let o=s&&ue.merge(s.common,s[t.method]);s&&ue.forEach(["delete","get","head","post","put","patch","common"],p=>{delete s[p]}),t.headers=Un.concat(o,s);const a=[];let l=!0;this.interceptors.request.forEach(function(x){if(typeof x.runWhen=="function"&&x.runWhen(t)===!1)return;l=l&&x.synchronous;const m=t.transitional||Th;m&&m.legacyInterceptorReqResOrdering?a.unshift(x.fulfilled,x.rejected):a.push(x.fulfilled,x.rejected)});const c=[];this.interceptors.response.forEach(function(x){c.push(x.fulfilled,x.rejected)});let u,h=0,d;if(!l){const p=[Sp.bind(this),void 0];for(p.unshift(...a),p.push(...c),d=p.length,u=Promise.resolve(t);h<d;)u=u.then(p[h++],p[h++]);return u}d=a.length;let g=t;for(;h<d;){const p=a[h++],x=a[h++];try{g=p(g)}catch(m){x.call(this,m);break}}try{u=Sp.call(this,g)}catch(p){return Promise.reject(p)}for(h=0,d=c.length;h<d;)u=u.then(c[h++],c[h++]);return u}getUri(e){e=ls(this.defaults,e);const t=t0(e.baseURL,e.url,e.allowAbsoluteUrls);return J_(t,e.params,e.paramsSerializer)}};ue.forEach(["delete","get","head","options"],function(e){os.prototype[e]=function(t,i){return this.request(ls(i||{},{method:e,url:t,data:(i||{}).data}))}});ue.forEach(["post","put","patch"],function(e){function t(i){return function(s,o,a){return this.request(ls(a||{},{method:e,headers:i?{"Content-Type":"multipart/form-data"}:{},url:s,data:o}))}}os.prototype[e]=t(),os.prototype[e+"Form"]=t(!0)});let $M=class o0{constructor(e){if(typeof e!="function")throw new TypeError("executor must be a function.");let t;this.promise=new Promise(function(s){t=s});const i=this;this.promise.then(r=>{if(!i._listeners)return;let s=i._listeners.length;for(;s-- >0;)i._listeners[s](r);i._listeners=null}),this.promise.then=r=>{let s;const o=new Promise(a=>{i.subscribe(a),s=a}).then(r);return o.cancel=function(){i.unsubscribe(s)},o},e(function(s,o,a){i.reason||(i.reason=new da(s,o,a),t(i.reason))})}throwIfRequested(){if(this.reason)throw this.reason}subscribe(e){if(this.reason){e(this.reason);return}this._listeners?this._listeners.push(e):this._listeners=[e]}unsubscribe(e){if(!this._listeners)return;const t=this._listeners.indexOf(e);t!==-1&&this._listeners.splice(t,1)}toAbortSignal(){const e=new AbortController,t=i=>{e.abort(i)};return this.subscribe(t),e.signal.unsubscribe=()=>this.unsubscribe(t),e.signal}static source(){let e;return{token:new o0(function(r){e=r}),cancel:e}}};function YM(n){return function(t){return n.apply(null,t)}}function JM(n){return ue.isObject(n)&&n.isAxiosError===!0}const af={Continue:100,SwitchingProtocols:101,Processing:102,EarlyHints:103,Ok:200,Created:201,Accepted:202,NonAuthoritativeInformation:203,NoContent:204,ResetContent:205,PartialContent:206,MultiStatus:207,AlreadyReported:208,ImUsed:226,MultipleChoices:300,MovedPermanently:301,Found:302,SeeOther:303,NotModified:304,UseProxy:305,Unused:306,TemporaryRedirect:307,PermanentRedirect:308,BadRequest:400,Unauthorized:401,PaymentRequired:402,Forbidden:403,NotFound:404,MethodNotAllowed:405,NotAcceptable:406,ProxyAuthenticationRequired:407,RequestTimeout:408,Conflict:409,Gone:410,LengthRequired:411,PreconditionFailed:412,PayloadTooLarge:413,UriTooLong:414,UnsupportedMediaType:415,RangeNotSatisfiable:416,ExpectationFailed:417,ImATeapot:418,MisdirectedRequest:421,UnprocessableEntity:422,Locked:423,FailedDependency:424,TooEarly:425,UpgradeRequired:426,PreconditionRequired:428,TooManyRequests:429,RequestHeaderFieldsTooLarge:431,UnavailableForLegalReasons:451,InternalServerError:500,NotImplemented:501,BadGateway:502,ServiceUnavailable:503,GatewayTimeout:504,HttpVersionNotSupported:505,VariantAlsoNegotiates:506,InsufficientStorage:507,LoopDetected:508,NotExtended:510,NetworkAuthenticationRequired:511,WebServerIsDown:521,ConnectionTimedOut:522,OriginIsUnreachable:523,TimeoutOccurred:524,SslHandshakeFailed:525,InvalidSslCertificate:526};Object.entries(af).forEach(([n,e])=>{af[e]=n});function a0(n){const e=new os(n),t=V_(os.prototype.request,e);return ue.extend(t,os.prototype,e,{allOwnKeys:!0}),ue.extend(t,e,null,{allOwnKeys:!0}),t.create=function(r){return a0(ls(n,r))},t}const Qt=a0(ha);Qt.Axios=os;Qt.CanceledError=da;Qt.CancelToken=$M;Qt.isCancel=Q_;Qt.VERSION=s0;Qt.toFormData=Zl;Qt.AxiosError=at;Qt.Cancel=Qt.CanceledError;Qt.all=function(e){return Promise.all(e)};Qt.spread=YM;Qt.isAxiosError=JM;Qt.mergeConfig=ls;Qt.AxiosHeaders=Un;Qt.formToJSON=n=>Z_(ue.isHTMLForm(n)?new FormData(n):n);Qt.getAdapter=r0.getAdapter;Qt.HttpStatusCode=af;Qt.default=Qt;const{Axios:kP,AxiosError:VP,CanceledError:HP,isCancel:zP,CancelToken:GP,VERSION:WP,all:jP,Cancel:XP,isAxiosError:qP,spread:KP,toFormData:$P,AxiosHeaders:YP,HttpStatusCode:JP,formToJSON:ZP,getAdapter:QP,mergeConfig:eL}=Qt;var Xs=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};function ZM(n){return n&&n.__esModule&&Object.prototype.hasOwnProperty.call(n,"default")?n.default:n}var Ic={exports:{}},bp;function QM(){return bp||(bp=1,(function(n){var e=(function(t){var i=Object.prototype,r=i.hasOwnProperty,s=Object.defineProperty||function(X,Y,ne){X[Y]=ne.value},o,a=typeof Symbol=="function"?Symbol:{},l=a.iterator||"@@iterator",c=a.asyncIterator||"@@asyncIterator",u=a.toStringTag||"@@toStringTag";function h(X,Y,ne){return Object.defineProperty(X,Y,{value:ne,enumerable:!0,configurable:!0,writable:!0}),X[Y]}try{h({},"")}catch{h=function(Y,ne,fe){return Y[ne]=fe}}function d(X,Y,ne,fe){var ye=Y&&Y.prototype instanceof T?Y:T,je=Object.create(ye.prototype),tt=new O(fe||[]);return s(je,"_invoke",{value:U(X,ne,tt)}),je}t.wrap=d;function g(X,Y,ne){try{return{type:"normal",arg:X.call(Y,ne)}}catch(fe){return{type:"throw",arg:fe}}}var p="suspendedStart",x="suspendedYield",m="executing",_="completed",M={};function T(){}function b(){}function I(){}var D={};h(D,l,function(){return this});var B=Object.getPrototypeOf,E=B&&B(B(j([])));E&&E!==i&&r.call(E,l)&&(D=E);var w=I.prototype=T.prototype=Object.create(D);b.prototype=I,s(w,"constructor",{value:I,configurable:!0}),s(I,"constructor",{value:b,configurable:!0}),b.displayName=h(I,u,"GeneratorFunction");function L(X){["next","throw","return"].forEach(function(Y){h(X,Y,function(ne){return this._invoke(Y,ne)})})}t.isGeneratorFunction=function(X){var Y=typeof X=="function"&&X.constructor;return Y?Y===b||(Y.displayName||Y.name)==="GeneratorFunction":!1},t.mark=function(X){return Object.setPrototypeOf?Object.setPrototypeOf(X,I):(X.__proto__=I,h(X,u,"GeneratorFunction")),X.prototype=Object.create(w),X},t.awrap=function(X){return{__await:X}};function R(X,Y){function ne(je,tt,he,Se){var Me=g(X[je],X,tt);if(Me.type==="throw")Se(Me.arg);else{var Le=Me.arg,Ae=Le.value;return Ae&&typeof Ae=="object"&&r.call(Ae,"__await")?Y.resolve(Ae.__await).then(function(Fe){ne("next",Fe,he,Se)},function(Fe){ne("throw",Fe,he,Se)}):Y.resolve(Ae).then(function(Fe){Le.value=Fe,he(Le)},function(Fe){return ne("throw",Fe,he,Se)})}}var fe;function ye(je,tt){function he(){return new Y(function(Se,Me){ne(je,tt,Se,Me)})}return fe=fe?fe.then(he,he):he()}s(this,"_invoke",{value:ye})}L(R.prototype),h(R.prototype,c,function(){return this}),t.AsyncIterator=R,t.async=function(X,Y,ne,fe,ye){ye===void 0&&(ye=Promise);var je=new R(d(X,Y,ne,fe),ye);return t.isGeneratorFunction(Y)?je:je.next().then(function(tt){return tt.done?tt.value:je.next()})};function U(X,Y,ne){var fe=p;return function(je,tt){if(fe===m)throw new Error("Generator is already running");if(fe===_){if(je==="throw")throw tt;return ie()}for(ne.method=je,ne.arg=tt;;){var he=ne.delegate;if(he){var Se=H(he,ne);if(Se){if(Se===M)continue;return Se}}if(ne.method==="next")ne.sent=ne._sent=ne.arg;else if(ne.method==="throw"){if(fe===p)throw fe=_,ne.arg;ne.dispatchException(ne.arg)}else ne.method==="return"&&ne.abrupt("return",ne.arg);fe=m;var Me=g(X,Y,ne);if(Me.type==="normal"){if(fe=ne.done?_:x,Me.arg===M)continue;return{value:Me.arg,done:ne.done}}else Me.type==="throw"&&(fe=_,ne.method="throw",ne.arg=Me.arg)}}}function H(X,Y){var ne=Y.method,fe=X.iterator[ne];if(fe===o)return Y.delegate=null,ne==="throw"&&X.iterator.return&&(Y.method="return",Y.arg=o,H(X,Y),Y.method==="throw")||ne!=="return"&&(Y.method="throw",Y.arg=new TypeError("The iterator does not provide a '"+ne+"' method")),M;var ye=g(fe,X.iterator,Y.arg);if(ye.type==="throw")return Y.method="throw",Y.arg=ye.arg,Y.delegate=null,M;var je=ye.arg;if(!je)return Y.method="throw",Y.arg=new TypeError("iterator result is not an object"),Y.delegate=null,M;if(je.done)Y[X.resultName]=je.value,Y.next=X.nextLoc,Y.method!=="return"&&(Y.method="next",Y.arg=o);else return je;return Y.delegate=null,M}L(w),h(w,u,"Generator"),h(w,l,function(){return this}),h(w,"toString",function(){return"[object Generator]"});function q(X){var Y={tryLoc:X[0]};1 in X&&(Y.catchLoc=X[1]),2 in X&&(Y.finallyLoc=X[2],Y.afterLoc=X[3]),this.tryEntries.push(Y)}function J(X){var Y=X.completion||{};Y.type="normal",delete Y.arg,X.completion=Y}function O(X){this.tryEntries=[{tryLoc:"root"}],X.forEach(q,this),this.reset(!0)}t.keys=function(X){var Y=Object(X),ne=[];for(var fe in Y)ne.push(fe);return ne.reverse(),function ye(){for(;ne.length;){var je=ne.pop();if(je in Y)return ye.value=je,ye.done=!1,ye}return ye.done=!0,ye}};function j(X){if(X){var Y=X[l];if(Y)return Y.call(X);if(typeof X.next=="function")return X;if(!isNaN(X.length)){var ne=-1,fe=function ye(){for(;++ne<X.length;)if(r.call(X,ne))return ye.value=X[ne],ye.done=!1,ye;return ye.value=o,ye.done=!0,ye};return fe.next=fe}}return{next:ie}}t.values=j;function ie(){return{value:o,done:!0}}return O.prototype={constructor:O,reset:function(X){if(this.prev=0,this.next=0,this.sent=this._sent=o,this.done=!1,this.delegate=null,this.method="next",this.arg=o,this.tryEntries.forEach(J),!X)for(var Y in this)Y.charAt(0)==="t"&&r.call(this,Y)&&!isNaN(+Y.slice(1))&&(this[Y]=o)},stop:function(){this.done=!0;var X=this.tryEntries[0],Y=X.completion;if(Y.type==="throw")throw Y.arg;return this.rval},dispatchException:function(X){if(this.done)throw X;var Y=this;function ne(Se,Me){return je.type="throw",je.arg=X,Y.next=Se,Me&&(Y.method="next",Y.arg=o),!!Me}for(var fe=this.tryEntries.length-1;fe>=0;--fe){var ye=this.tryEntries[fe],je=ye.completion;if(ye.tryLoc==="root")return ne("end");if(ye.tryLoc<=this.prev){var tt=r.call(ye,"catchLoc"),he=r.call(ye,"finallyLoc");if(tt&&he){if(this.prev<ye.catchLoc)return ne(ye.catchLoc,!0);if(this.prev<ye.finallyLoc)return ne(ye.finallyLoc)}else if(tt){if(this.prev<ye.catchLoc)return ne(ye.catchLoc,!0)}else if(he){if(this.prev<ye.finallyLoc)return ne(ye.finallyLoc)}else throw new Error("try statement without catch or finally")}}},abrupt:function(X,Y){for(var ne=this.tryEntries.length-1;ne>=0;--ne){var fe=this.tryEntries[ne];if(fe.tryLoc<=this.prev&&r.call(fe,"finallyLoc")&&this.prev<fe.finallyLoc){var ye=fe;break}}ye&&(X==="break"||X==="continue")&&ye.tryLoc<=Y&&Y<=ye.finallyLoc&&(ye=null);var je=ye?ye.completion:{};return je.type=X,je.arg=Y,ye?(this.method="next",this.next=ye.finallyLoc,M):this.complete(je)},complete:function(X,Y){if(X.type==="throw")throw X.arg;return X.type==="break"||X.type==="continue"?this.next=X.arg:X.type==="return"?(this.rval=this.arg=X.arg,this.method="return",this.next="end"):X.type==="normal"&&Y&&(this.next=Y),M},finish:function(X){for(var Y=this.tryEntries.length-1;Y>=0;--Y){var ne=this.tryEntries[Y];if(ne.finallyLoc===X)return this.complete(ne.completion,ne.afterLoc),J(ne),M}},catch:function(X){for(var Y=this.tryEntries.length-1;Y>=0;--Y){var ne=this.tryEntries[Y];if(ne.tryLoc===X){var fe=ne.completion;if(fe.type==="throw"){var ye=fe.arg;J(ne)}return ye}}throw new Error("illegal catch attempt")},delegateYield:function(X,Y,ne){return this.delegate={iterator:j(X),resultName:Y,nextLoc:ne},this.method==="next"&&(this.arg=o),M}},t})(n.exports);try{regeneratorRuntime=e}catch{typeof globalThis=="object"?globalThis.regeneratorRuntime=e:Function("r","regeneratorRuntime = r")(e)}})(Ic)),Ic.exports}var Dc,Ep;function Rh(){return Ep||(Ep=1,Dc=(n,e)=>`${n}-${e}-${Math.random().toString(16).slice(3,8)}`),Dc}var Nc,Tp;function l0(){if(Tp)return Nc;Tp=1;const n=Rh();let e=0;return Nc=({id:t,action:i,payload:r={}})=>{let s=t;return typeof s>"u"&&(s=n("Job",e),e+=1),{id:s,action:i,payload:r}},Nc}var So={},Ap;function Ch(){if(Ap)return So;Ap=1;let n=!1;return So.logging=n,So.setLogging=e=>{n=e},So.log=(...e)=>n?void 0:null,So}var Uc,wp;function eb(){if(wp)return Uc;wp=1;const n=l0(),{log:e}=Ch(),t=Rh();let i=0;return Uc=()=>{const r=t("Scheduler",i),s={},o={};let a=[];i+=1;const l=()=>a.length,c=()=>Object.keys(s).length,u=()=>{if(a.length!==0){const x=Object.keys(s);for(let m=0;m<x.length;m+=1)if(typeof o[x[m]]>"u"){a[0](s[x[m]]);break}}},h=(x,m)=>new Promise((_,M)=>{const T=n({action:x,payload:m});a.push(async b=>{a.shift(),o[b.id]=T;try{_(await b[x].apply(this,[...m,T.id]))}catch(I){M(I)}finally{delete o[b.id],u()}}),e(`[${r}]: Add ${T.id} to JobQueue`),e(`[${r}]: JobQueue length=${a.length}`),u()});return{addWorker:x=>(s[x.id]=x,e(`[${r}]: Add ${x.id}`),e(`[${r}]: Number of workers=${c()}`),u(),x.id),addJob:async(x,...m)=>{if(c()===0)throw Error(`[${r}]: You need to have at least one worker before adding jobs`);return h(x,m)},terminate:async()=>{Object.keys(s).forEach(async x=>{await s[x].terminate()}),a=[]},getQueueLen:l,getNumWorkers:c}},Uc}function tb(n){throw new Error('Could not dynamically require "'+n+'". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.')}var Oc,Rp;function nb(){return Rp||(Rp=1,Oc=n=>{const e={};return typeof WorkerGlobalScope<"u"?e.type="webworker":typeof document=="object"?e.type="browser":typeof process=="object"&&typeof tb=="function"&&(e.type="node"),typeof n>"u"?e:e[n]}),Oc}var Fc,Cp;function ib(){if(Cp)return Fc;Cp=1;const e=nb()("type")==="browser"?t=>new URL(t,window.location.href).href:t=>t;return Fc=t=>{const i={...t};return["corePath","workerPath","langPath"].forEach(r=>{t[r]&&(i[r]=e(i[r]))}),i},Fc}var Bc,Pp;function c0(){return Pp||(Pp=1,Bc={TESSERACT_ONLY:0,LSTM_ONLY:1,TESSERACT_LSTM_COMBINED:2,DEFAULT:3}),Bc}const rb="7.0.0",sb={version:rb};var kc,Lp;function ob(){return Lp||(Lp=1,kc={workerBlobURL:!0,logger:()=>{}}),kc}var Vc,Ip;function ab(){if(Ip)return Vc;Ip=1;const n=sb.version;return Vc={...ob(),workerPath:`https://cdn.jsdelivr.net/npm/tesseract.js@v${n}/dist/worker.min.js`},Vc}var Hc,Dp;function lb(){return Dp||(Dp=1,Hc=({workerPath:n,workerBlobURL:e})=>{let t;if(Blob&&URL&&e){const i=new Blob([`importScripts("${n}");`],{type:"application/javascript"});t=new Worker(URL.createObjectURL(i))}else t=new Worker(n);return t}),Hc}var zc,Np;function cb(){return Np||(Np=1,zc=n=>{n.terminate()}),zc}var Gc,Up;function ub(){return Up||(Up=1,Gc=(n,e)=>{n.onmessage=({data:t})=>{e(t)}}),Gc}var Wc,Op;function fb(){return Op||(Op=1,Wc=async(n,e)=>{n.postMessage(e)}),Wc}var jc,Fp;function hb(){if(Fp)return jc;Fp=1;const n=t=>new Promise((i,r)=>{const s=new FileReader;s.onload=()=>{i(s.result)},s.onerror=({target:{error:{code:o}}})=>{r(Error(`File could not be read! Code=${o}`))},s.readAsArrayBuffer(t)}),e=async t=>{let i=t;if(typeof t>"u")return"undefined";if(typeof t=="string")/data:image\/([a-zA-Z]*);base64,([^"]*)/.test(t)?i=atob(t.split(",")[1]).split("").map(r=>r.charCodeAt(0)):i=await(await fetch(t)).arrayBuffer();else if(typeof HTMLElement<"u"&&t instanceof HTMLElement)t.tagName==="IMG"&&(i=await e(t.src)),t.tagName==="VIDEO"&&(i=await e(t.poster)),t.tagName==="CANVAS"&&await new Promise(r=>{t.toBlob(async s=>{i=await n(s),r()})});else if(typeof OffscreenCanvas<"u"&&t instanceof OffscreenCanvas){const r=await t.convertToBlob();i=await n(r)}else(t instanceof File||t instanceof Blob)&&(i=await n(t));return new Uint8Array(i)};return jc=e,jc}var Xc,Bp;function db(){if(Bp)return Xc;Bp=1;const n=ab(),e=lb(),t=cb(),i=ub(),r=fb(),s=hb();return Xc={defaultOptions:n,spawnWorker:e,terminateWorker:t,onMessage:i,send:r,loadImage:s},Xc}var qc,kp;function u0(){if(kp)return qc;kp=1;const n=ib(),e=l0(),{log:t}=Ch(),i=Rh(),r=c0(),{defaultOptions:s,spawnWorker:o,terminateWorker:a,onMessage:l,loadImage:c,send:u}=db();let h=0;return qc=async(d="eng",g=r.LSTM_ONLY,p={},x={})=>{const m=i("Worker",h),{logger:_,errorHandler:M,...T}=n({...s,...p}),b={},I=typeof d=="string"?d.split("+"):d;let D=g,B=x;const E=[r.DEFAULT,r.LSTM_ONLY].includes(g)&&!T.legacyCore;let w,L;const R=new Promise((Le,Ae)=>{L=Le,w=Ae}),U=Le=>{w(Le.message)};let H=o(T);H.onerror=U,h+=1;const q=({id:Le,action:Ae,payload:Fe})=>new Promise((k,z)=>{t(`[${m}]: Start ${Le}, action=${Ae}`);const Z=`${Ae}-${Le}`;b[Z]={resolve:k,reject:z},u(H,{workerId:m,jobId:Le,action:Ae,payload:Fe})}),J=()=>{},O=Le=>q(e({id:Le,action:"load",payload:{options:{lstmOnly:E,corePath:T.corePath,logging:T.logging}}})),j=(Le,Ae,Fe)=>q(e({id:Fe,action:"FS",payload:{method:"writeFile",args:[Le,Ae]}})),ie=(Le,Ae)=>q(e({id:Ae,action:"FS",payload:{method:"readFile",args:[Le,{encoding:"utf8"}]}})),X=(Le,Ae)=>q(e({id:Ae,action:"FS",payload:{method:"unlink",args:[Le]}})),Y=(Le,Ae,Fe)=>q(e({id:Fe,action:"FS",payload:{method:Le,args:Ae}})),ne=(Le,Ae)=>q(e({id:Ae,action:"loadLanguage",payload:{langs:Le,options:{langPath:T.langPath,dataPath:T.dataPath,cachePath:T.cachePath,cacheMethod:T.cacheMethod,gzip:T.gzip,lstmOnly:[r.DEFAULT,r.LSTM_ONLY].includes(D)&&!T.legacyLang}}})),fe=(Le,Ae,Fe,k)=>q(e({id:k,action:"initialize",payload:{langs:Le,oem:Ae,config:Fe}})),ye=(Le="eng",Ae,Fe,k)=>{if(E&&[r.TESSERACT_ONLY,r.TESSERACT_LSTM_COMBINED].includes(Ae))throw Error("Legacy model requested but code missing.");const z=Ae||D;D=z;const Z=Fe||B;B=Z;const ae=(typeof Le=="string"?Le.split("+"):Le).filter(_e=>!I.includes(_e));return I.push(...ae),ae.length>0?ne(ae,k).then(()=>fe(Le,z,Z,k)):fe(Le,z,Z,k)},je=(Le={},Ae)=>q(e({id:Ae,action:"setParameters",payload:{params:Le}})),tt=async(Le,Ae={},Fe={text:!0},k)=>q(e({id:k,action:"recognize",payload:{image:await c(Le),options:Ae,output:Fe}})),he=async(Le,Ae)=>{if(E)throw Error("`worker.detect` requires Legacy model, which was not loaded.");return q(e({id:Ae,action:"detect",payload:{image:await c(Le)}}))},Se=async()=>(H!==null&&(a(H),H=null),Promise.resolve());l(H,({workerId:Le,jobId:Ae,status:Fe,action:k,data:z})=>{const Z=`${k}-${Ae}`;if(Fe==="resolve")t(`[${Le}]: Complete ${Ae}`),b[Z].resolve({jobId:Ae,data:z}),delete b[Z];else if(Fe==="reject")if(b[Z].reject(z),delete b[Z],k==="load"&&w(z),M)M(z);else throw Error(z);else Fe==="progress"&&_({...z,userJobId:Ae})});const Me={id:m,worker:H,load:J,writeText:j,readText:ie,removeFile:X,FS:Y,reinitialize:ye,setParameters:je,recognize:tt,detect:he,terminate:Se};return O().then(()=>ne(d)).then(()=>fe(d,g,x)).then(()=>L(Me)).catch(()=>{}),R},qc}var Kc,Vp;function pb(){if(Vp)return Kc;Vp=1;const n=u0();return Kc={recognize:async(i,r,s)=>{const o=await n(r,1,s);return o.recognize(i).finally(async()=>{await o.terminate()})},detect:async(i,r)=>{const s=await n("osd",0,r);return s.detect(i).finally(async()=>{await s.terminate()})}},Kc}var $c,Hp;function mb(){return Hp||(Hp=1,$c={AFR:"afr",AMH:"amh",ARA:"ara",ASM:"asm",AZE:"aze",AZE_CYRL:"aze_cyrl",BEL:"bel",BEN:"ben",BOD:"bod",BOS:"bos",BUL:"bul",CAT:"cat",CEB:"ceb",CES:"ces",CHI_SIM:"chi_sim",CHI_TRA:"chi_tra",CHR:"chr",CYM:"cym",DAN:"dan",DEU:"deu",DZO:"dzo",ELL:"ell",ENG:"eng",ENM:"enm",EPO:"epo",EST:"est",EUS:"eus",FAS:"fas",FIN:"fin",FRA:"fra",FRK:"frk",FRM:"frm",GLE:"gle",GLG:"glg",GRC:"grc",GUJ:"guj",HAT:"hat",HEB:"heb",HIN:"hin",HRV:"hrv",HUN:"hun",IKU:"iku",IND:"ind",ISL:"isl",ITA:"ita",ITA_OLD:"ita_old",JAV:"jav",JPN:"jpn",KAN:"kan",KAT:"kat",KAT_OLD:"kat_old",KAZ:"kaz",KHM:"khm",KIR:"kir",KOR:"kor",KUR:"kur",LAO:"lao",LAT:"lat",LAV:"lav",LIT:"lit",MAL:"mal",MAR:"mar",MKD:"mkd",MLT:"mlt",MSA:"msa",MYA:"mya",NEP:"nep",NLD:"nld",NOR:"nor",ORI:"ori",PAN:"pan",POL:"pol",POR:"por",PUS:"pus",RON:"ron",RUS:"rus",SAN:"san",SIN:"sin",SLK:"slk",SLV:"slv",SPA:"spa",SPA_OLD:"spa_old",SQI:"sqi",SRP:"srp",SRP_LATN:"srp_latn",SWA:"swa",SWE:"swe",SYR:"syr",TAM:"tam",TEL:"tel",TGK:"tgk",TGL:"tgl",THA:"tha",TIR:"tir",TUR:"tur",UIG:"uig",UKR:"ukr",URD:"urd",UZB:"uzb",UZB_CYRL:"uzb_cyrl",VIE:"vie",YID:"yid"}),$c}var Yc,zp;function gb(){return zp||(zp=1,Yc={OSD_ONLY:"0",AUTO_OSD:"1",AUTO_ONLY:"2",AUTO:"3",SINGLE_COLUMN:"4",SINGLE_BLOCK_VERT_TEXT:"5",SINGLE_BLOCK:"6",SINGLE_LINE:"7",SINGLE_WORD:"8",CIRCLE_WORD:"9",SINGLE_CHAR:"10",SPARSE_TEXT:"11",SPARSE_TEXT_OSD:"12",RAW_LINE:"13"}),Yc}var Jc,Gp;function _b(){if(Gp)return Jc;Gp=1,QM();const n=eb(),e=u0(),t=pb(),i=mb(),r=c0(),s=gb(),{setLogging:o}=Ch();return Jc={languages:i,OEM:r,PSM:s,createScheduler:n,createWorker:e,setLogging:o,...t},Jc}var f0=_b();const vb=ZM(f0),tL=Nv({__proto__:null,default:vb},[f0]);var Zc={},Wp;function xb(){return Wp||(Wp=1,(function(){var n;function e(f){var v=0;return function(){return v<f.length?{done:!1,value:f[v++]}:{done:!0}}}var t=typeof Object.defineProperties=="function"?Object.defineProperty:function(f,v,y){return f==Array.prototype||f==Object.prototype||(f[v]=y.value),f};function i(f){f=[typeof globalThis=="object"&&globalThis,f,typeof window=="object"&&window,typeof self=="object"&&self,typeof Xs=="object"&&Xs];for(var v=0;v<f.length;++v){var y=f[v];if(y&&y.Math==Math)return y}throw Error("Cannot find global object")}var r=i(this);function s(f,v){if(v)e:{var y=r;f=f.split(".");for(var A=0;A<f.length-1;A++){var F=f[A];if(!(F in y))break e;y=y[F]}f=f[f.length-1],A=y[f],v=v(A),v!=A&&v!=null&&t(y,f,{configurable:!0,writable:!0,value:v})}}s("Symbol",function(f){function v(G){if(this instanceof v)throw new TypeError("Symbol is not a constructor");return new y(A+(G||"")+"_"+F++,G)}function y(G,V){this.h=G,t(this,"description",{configurable:!0,writable:!0,value:V})}if(f)return f;y.prototype.toString=function(){return this.h};var A="jscomp_symbol_"+(1e9*Math.random()>>>0)+"_",F=0;return v}),s("Symbol.iterator",function(f){if(f)return f;f=Symbol("Symbol.iterator");for(var v="Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".split(" "),y=0;y<v.length;y++){var A=r[v[y]];typeof A=="function"&&typeof A.prototype[f]!="function"&&t(A.prototype,f,{configurable:!0,writable:!0,value:function(){return o(e(this))}})}return f});function o(f){return f={next:f},f[Symbol.iterator]=function(){return this},f}function a(f){var v=typeof Symbol<"u"&&Symbol.iterator&&f[Symbol.iterator];return v?v.call(f):{next:e(f)}}function l(f){if(!(f instanceof Array)){f=a(f);for(var v,y=[];!(v=f.next()).done;)y.push(v.value);f=y}return f}var c=typeof Object.assign=="function"?Object.assign:function(f,v){for(var y=1;y<arguments.length;y++){var A=arguments[y];if(A)for(var F in A)Object.prototype.hasOwnProperty.call(A,F)&&(f[F]=A[F])}return f};s("Object.assign",function(f){return f||c});var u=typeof Object.create=="function"?Object.create:function(f){function v(){}return v.prototype=f,new v},h;if(typeof Object.setPrototypeOf=="function")h=Object.setPrototypeOf;else{var d;e:{var g={a:!0},p={};try{p.__proto__=g,d=p.a;break e}catch{}d=!1}h=d?function(f,v){if(f.__proto__=v,f.__proto__!==v)throw new TypeError(f+" is not extensible");return f}:null}var x=h;function m(f,v){if(f.prototype=u(v.prototype),f.prototype.constructor=f,x)x(f,v);else for(var y in v)if(y!="prototype")if(Object.defineProperties){var A=Object.getOwnPropertyDescriptor(v,y);A&&Object.defineProperty(f,y,A)}else f[y]=v[y];f.ya=v.prototype}function _(){this.m=!1,this.j=null,this.i=void 0,this.h=1,this.v=this.s=0,this.l=null}function M(f){if(f.m)throw new TypeError("Generator is already running");f.m=!0}_.prototype.u=function(f){this.i=f};function T(f,v){f.l={ma:v,na:!0},f.h=f.s||f.v}_.prototype.return=function(f){this.l={return:f},this.h=this.v};function b(f,v,y){return f.h=y,{value:v}}function I(f){this.h=new _,this.i=f}function D(f,v){M(f.h);var y=f.h.j;return y?B(f,"return"in y?y.return:function(A){return{value:A,done:!0}},v,f.h.return):(f.h.return(v),E(f))}function B(f,v,y,A){try{var F=v.call(f.h.j,y);if(!(F instanceof Object))throw new TypeError("Iterator result "+F+" is not an object");if(!F.done)return f.h.m=!1,F;var G=F.value}catch(V){return f.h.j=null,T(f.h,V),E(f)}return f.h.j=null,A.call(f.h,G),E(f)}function E(f){for(;f.h.h;)try{var v=f.i(f.h);if(v)return f.h.m=!1,{value:v.value,done:!1}}catch(y){f.h.i=void 0,T(f.h,y)}if(f.h.m=!1,f.h.l){if(v=f.h.l,f.h.l=null,v.na)throw v.ma;return{value:v.return,done:!0}}return{value:void 0,done:!0}}function w(f){this.next=function(v){return M(f.h),f.h.j?v=B(f,f.h.j.next,v,f.h.u):(f.h.u(v),v=E(f)),v},this.throw=function(v){return M(f.h),f.h.j?v=B(f,f.h.j.throw,v,f.h.u):(T(f.h,v),v=E(f)),v},this.return=function(v){return D(f,v)},this[Symbol.iterator]=function(){return this}}function L(f){function v(A){return f.next(A)}function y(A){return f.throw(A)}return new Promise(function(A,F){function G(V){V.done?A(V.value):Promise.resolve(V.value).then(v,y).then(G,F)}G(f.next())})}function R(f){return L(new w(new I(f)))}s("Promise",function(f){function v(V){this.i=0,this.j=void 0,this.h=[],this.u=!1;var $=this.l();try{V($.resolve,$.reject)}catch(le){$.reject(le)}}function y(){this.h=null}function A(V){return V instanceof v?V:new v(function($){$(V)})}if(f)return f;y.prototype.i=function(V){if(this.h==null){this.h=[];var $=this;this.j(function(){$.m()})}this.h.push(V)};var F=r.setTimeout;y.prototype.j=function(V){F(V,0)},y.prototype.m=function(){for(;this.h&&this.h.length;){var V=this.h;this.h=[];for(var $=0;$<V.length;++$){var le=V[$];V[$]=null;try{le()}catch(we){this.l(we)}}}this.h=null},y.prototype.l=function(V){this.j(function(){throw V})},v.prototype.l=function(){function V(we){return function(Ne){le||(le=!0,we.call($,Ne))}}var $=this,le=!1;return{resolve:V(this.I),reject:V(this.m)}},v.prototype.I=function(V){if(V===this)this.m(new TypeError("A Promise cannot resolve to itself"));else if(V instanceof v)this.L(V);else{e:switch(typeof V){case"object":var $=V!=null;break e;case"function":$=!0;break e;default:$=!1}$?this.F(V):this.s(V)}},v.prototype.F=function(V){var $=void 0;try{$=V.then}catch(le){this.m(le);return}typeof $=="function"?this.M($,V):this.s(V)},v.prototype.m=function(V){this.v(2,V)},v.prototype.s=function(V){this.v(1,V)},v.prototype.v=function(V,$){if(this.i!=0)throw Error("Cannot settle("+V+", "+$+"): Promise already settled in state"+this.i);this.i=V,this.j=$,this.i===2&&this.K(),this.H()},v.prototype.K=function(){var V=this;F(function(){if(V.D()){var $=r.console;typeof $<"u"&&$.error(V.j)}},1)},v.prototype.D=function(){if(this.u)return!1;var V=r.CustomEvent,$=r.Event,le=r.dispatchEvent;return typeof le>"u"?!0:(typeof V=="function"?V=new V("unhandledrejection",{cancelable:!0}):typeof $=="function"?V=new $("unhandledrejection",{cancelable:!0}):(V=r.document.createEvent("CustomEvent"),V.initCustomEvent("unhandledrejection",!1,!0,V)),V.promise=this,V.reason=this.j,le(V))},v.prototype.H=function(){if(this.h!=null){for(var V=0;V<this.h.length;++V)G.i(this.h[V]);this.h=null}};var G=new y;return v.prototype.L=function(V){var $=this.l();V.T($.resolve,$.reject)},v.prototype.M=function(V,$){var le=this.l();try{V.call($,le.resolve,le.reject)}catch(we){le.reject(we)}},v.prototype.then=function(V,$){function le(Qe,Ge){return typeof Qe=="function"?function(st){try{we(Qe(st))}catch(gt){Ne(gt)}}:Ge}var we,Ne,rt=new v(function(Qe,Ge){we=Qe,Ne=Ge});return this.T(le(V,we),le($,Ne)),rt},v.prototype.catch=function(V){return this.then(void 0,V)},v.prototype.T=function(V,$){function le(){switch(we.i){case 1:V(we.j);break;case 2:$(we.j);break;default:throw Error("Unexpected state: "+we.i)}}var we=this;this.h==null?G.i(le):this.h.push(le),this.u=!0},v.resolve=A,v.reject=function(V){return new v(function($,le){le(V)})},v.race=function(V){return new v(function($,le){for(var we=a(V),Ne=we.next();!Ne.done;Ne=we.next())A(Ne.value).T($,le)})},v.all=function(V){var $=a(V),le=$.next();return le.done?A([]):new v(function(we,Ne){function rt(st){return function(gt){Qe[st]=gt,Ge--,Ge==0&&we(Qe)}}var Qe=[],Ge=0;do Qe.push(void 0),Ge++,A(le.value).T(rt(Qe.length-1),Ne),le=$.next();while(!le.done)})},v});function U(f,v){f instanceof String&&(f+="");var y=0,A=!1,F={next:function(){if(!A&&y<f.length){var G=y++;return{value:v(G,f[G]),done:!1}}return A=!0,{done:!0,value:void 0}}};return F[Symbol.iterator]=function(){return F},F}s("Array.prototype.keys",function(f){return f||function(){return U(this,function(v){return v})}}),s("Array.prototype.fill",function(f){return f||function(v,y,A){var F=this.length||0;for(0>y&&(y=Math.max(0,F+y)),(A==null||A>F)&&(A=F),A=Number(A),0>A&&(A=Math.max(0,F+A)),y=Number(y||0);y<A;y++)this[y]=v;return this}});function H(f){return f||Array.prototype.fill}s("Int8Array.prototype.fill",H),s("Uint8Array.prototype.fill",H),s("Uint8ClampedArray.prototype.fill",H),s("Int16Array.prototype.fill",H),s("Uint16Array.prototype.fill",H),s("Int32Array.prototype.fill",H),s("Uint32Array.prototype.fill",H),s("Float32Array.prototype.fill",H),s("Float64Array.prototype.fill",H),s("Object.is",function(f){return f||function(v,y){return v===y?v!==0||1/v===1/y:v!==v&&y!==y}}),s("Array.prototype.includes",function(f){return f||function(v,y){var A=this;A instanceof String&&(A=String(A));var F=A.length;for(y=y||0,0>y&&(y=Math.max(y+F,0));y<F;y++){var G=A[y];if(G===v||Object.is(G,v))return!0}return!1}}),s("String.prototype.includes",function(f){return f||function(v,y){if(this==null)throw new TypeError("The 'this' value for String.prototype.includes must not be null or undefined");if(v instanceof RegExp)throw new TypeError("First argument to String.prototype.includes must not be a regular expression");return this.indexOf(v,y||0)!==-1}});var q=this||self;function J(f,v){f=f.split(".");var y=q;f[0]in y||typeof y.execScript>"u"||y.execScript("var "+f[0]);for(var A;f.length&&(A=f.shift());)f.length||v===void 0?y[A]&&y[A]!==Object.prototype[A]?y=y[A]:y=y[A]={}:y[A]=v}function O(f){var v;e:{if((v=q.navigator)&&(v=v.userAgent))break e;v=""}return v.indexOf(f)!=-1}var j=Array.prototype.map?function(f,v){return Array.prototype.map.call(f,v,void 0)}:function(f,v){for(var y=f.length,A=Array(y),F=typeof f=="string"?f.split(""):f,G=0;G<y;G++)G in F&&(A[G]=v.call(void 0,F[G],G,f));return A},ie={},X=null;function Y(f){var v=f.length,y=3*v/4;y%3?y=Math.floor(y):"=.".indexOf(f[v-1])!=-1&&(y="=.".indexOf(f[v-2])!=-1?y-2:y-1);var A=new Uint8Array(y),F=0;return ne(f,function(G){A[F++]=G}),F!==y?A.subarray(0,F):A}function ne(f,v){function y(le){for(;A<f.length;){var we=f.charAt(A++),Ne=X[we];if(Ne!=null)return Ne;if(!/^[\s\xa0]*$/.test(we))throw Error("Unknown base64 encoding at char: "+we)}return le}fe();for(var A=0;;){var F=y(-1),G=y(0),V=y(64),$=y(64);if($===64&&F===-1)break;v(F<<2|G>>4),V!=64&&(v(G<<4&240|V>>2),$!=64&&v(V<<6&192|$))}}function fe(){if(!X){X={};for(var f="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split(""),v=["+/=","+/","-_=","-_.","-_"],y=0;5>y;y++){var A=f.concat(v[y].split(""));ie[y]=A;for(var F=0;F<A.length;F++){var G=A[F];X[G]===void 0&&(X[G]=F)}}}}var ye=typeof Uint8Array<"u",je=!(O("Trident")||O("MSIE"))&&typeof q.btoa=="function";function tt(f){if(!je){var v;v===void 0&&(v=0),fe(),v=ie[v];for(var y=Array(Math.floor(f.length/3)),A=v[64]||"",F=0,G=0;F<f.length-2;F+=3){var V=f[F],$=f[F+1],le=f[F+2],we=v[V>>2];V=v[(V&3)<<4|$>>4],$=v[($&15)<<2|le>>6],le=v[le&63],y[G++]=we+V+$+le}switch(we=0,le=A,f.length-F){case 2:we=f[F+1],le=v[(we&15)<<2]||A;case 1:f=f[F],y[G]=v[f>>2]+v[(f&3)<<4|we>>4]+le+A}return y.join("")}for(v="";10240<f.length;)v+=String.fromCharCode.apply(null,f.subarray(0,10240)),f=f.subarray(10240);return v+=String.fromCharCode.apply(null,f),btoa(v)}var he=RegExp("[-_.]","g");function Se(f){switch(f){case"-":return"+";case"_":return"/";case".":return"=";default:return""}}function Me(f){if(!je)return Y(f);he.test(f)&&(f=f.replace(he,Se)),f=atob(f);for(var v=new Uint8Array(f.length),y=0;y<f.length;y++)v[y]=f.charCodeAt(y);return v}var Le;function Ae(){return Le||(Le=new Uint8Array(0))}var Fe={},k=typeof Uint8Array.prototype.slice=="function",z=0,Z=0;function ge(f){var v=0>f;f=Math.abs(f);var y=f>>>0;f=Math.floor((f-y)/4294967296),v&&(y=a(_e(y,f)),v=y.next().value,f=y.next().value,y=v),z=y>>>0,Z=f>>>0}var ae=typeof BigInt=="function";function _e(f,v){return v=~v,f?f=~f+1:v+=1,[f,v]}function N(f,v){this.i=f>>>0,this.h=v>>>0}function Ee(f){if(!f)return ve||(ve=new N(0,0));if(!/^-?\d+$/.test(f))return null;if(16>f.length)ge(Number(f));else if(ae)f=BigInt(f),z=Number(f&BigInt(4294967295))>>>0,Z=Number(f>>BigInt(32)&BigInt(4294967295));else{var v=+(f[0]==="-");Z=z=0;for(var y=f.length,A=v,F=(y-v)%6+v;F<=y;A=F,F+=6)A=Number(f.slice(A,F)),Z*=1e6,z=1e6*z+A,4294967296<=z&&(Z+=z/4294967296|0,z%=4294967296);v&&(v=a(_e(z,Z)),f=v.next().value,v=v.next().value,z=f,Z=v)}return new N(z,Z)}var ve;function me(f,v){return Error("Invalid wire type: "+f+" (at position "+v+")")}function xe(){return Error("Failed to read varint, encoding is invalid.")}function C(f,v){return Error("Tried to read past the end of the data "+v+" > "+f)}function S(){throw Error("Invalid UTF8")}function W(f,v){return v=String.fromCharCode.apply(null,v),f==null?v:f+v}var re=void 0,de,se=typeof TextDecoder<"u",Ue,Te=typeof TextEncoder<"u",qe;function Ye(f){if(f!==Fe)throw Error("illegal external caller")}function be(f,v){if(Ye(v),this.V=f,f!=null&&f.length===0)throw Error("ByteString should be constructed with non-empty values")}function Ce(){return qe||(qe=new be(null,Fe))}function Oe(f){Ye(Fe);var v=f.V;return v=v==null||ye&&v!=null&&v instanceof Uint8Array?v:typeof v=="string"?Me(v):null,v==null?v:f.V=v}function ze(f){if(typeof f=="string")return{buffer:Me(f),C:!1};if(Array.isArray(f))return{buffer:new Uint8Array(f),C:!1};if(f.constructor===Uint8Array)return{buffer:f,C:!1};if(f.constructor===ArrayBuffer)return{buffer:new Uint8Array(f),C:!1};if(f.constructor===be)return{buffer:Oe(f)||Ae(),C:!0};if(f instanceof Uint8Array)return{buffer:new Uint8Array(f.buffer,f.byteOffset,f.byteLength),C:!1};throw Error("Type not convertible to a Uint8Array, expected a Uint8Array, an ArrayBuffer, a base64 encoded string, a ByteString or an Array of numbers")}function Ve(f,v){this.i=null,this.m=!1,this.h=this.j=this.l=0,lt(this,f,v)}function lt(f,v,y){y=y===void 0?{}:y,f.S=y.S===void 0?!1:y.S,v&&(v=ze(v),f.i=v.buffer,f.m=v.C,f.l=0,f.j=f.i.length,f.h=f.l)}Ve.prototype.reset=function(){this.h=this.l};function K(f,v){if(f.h=v,v>f.j)throw C(f.j,v)}function Ie(f){var v=f.i,y=f.h,A=v[y++],F=A&127;if(A&128&&(A=v[y++],F|=(A&127)<<7,A&128&&(A=v[y++],F|=(A&127)<<14,A&128&&(A=v[y++],F|=(A&127)<<21,A&128&&(A=v[y++],F|=A<<28,A&128&&v[y++]&128&&v[y++]&128&&v[y++]&128&&v[y++]&128&&v[y++]&128)))))throw xe();return K(f,y),F}function Pe(f,v){if(0>v)throw Error("Tried to read a negative byte length: "+v);var y=f.h,A=y+v;if(A>f.j)throw C(v,f.j-y);return f.h=A,y}var Ke=[];function Re(){this.h=[]}Re.prototype.length=function(){return this.h.length},Re.prototype.end=function(){var f=this.h;return this.h=[],f};function pe(f,v,y){for(;0<y||127<v;)f.h.push(v&127|128),v=(v>>>7|y<<25)>>>0,y>>>=7;f.h.push(v)}function Xe(f,v){for(;127<v;)f.h.push(v&127|128),v>>>=7;f.h.push(v)}function it(f,v){if(Ke.length){var y=Ke.pop();lt(y,f,v),f=y}else f=new Ve(f,v);this.h=f,this.j=this.h.h,this.i=this.l=-1,this.setOptions(v)}it.prototype.setOptions=function(f){f=f===void 0?{}:f,this.ca=f.ca===void 0?!1:f.ca},it.prototype.reset=function(){this.h.reset(),this.j=this.h.h,this.i=this.l=-1};function Ct(f){var v=f.h;if(v.h==v.j)return!1;f.j=f.h.h;var y=Ie(f.h)>>>0;if(v=y>>>3,y&=7,!(0<=y&&5>=y))throw me(y,f.j);if(1>v)throw Error("Invalid field number: "+v+" (at position "+f.j+")");return f.l=v,f.i=y,!0}function Mt(f){switch(f.i){case 0:if(f.i!=0)Mt(f);else e:{f=f.h;for(var v=f.h,y=v+10,A=f.i;v<y;)if((A[v++]&128)===0){K(f,v);break e}throw xe()}break;case 1:f=f.h,K(f,f.h+8);break;case 2:f.i!=2?Mt(f):(v=Ie(f.h)>>>0,f=f.h,K(f,f.h+v));break;case 5:f=f.h,K(f,f.h+4);break;case 3:v=f.l;do{if(!Ct(f))throw Error("Unmatched start-group tag: stream EOF");if(f.i==4){if(f.l!=v)throw Error("Unmatched end-group tag");break}Mt(f)}while(!0);break;default:throw me(f.i,f.j)}}var Cn=[];function ti(){this.j=[],this.i=0,this.h=new Re}function zi(f,v){v.length!==0&&(f.j.push(v),f.i+=v.length)}function co(f,v){if(v=v.R){zi(f,f.h.end());for(var y=0;y<v.length;y++)zi(f,Oe(v[y])||Ae())}}var ni=typeof Symbol=="function"&&typeof Symbol()=="symbol"?Symbol():void 0;function _i(f,v){return ni?f[ni]|=v:f.A!==void 0?f.A|=v:(Object.defineProperties(f,{A:{value:v,configurable:!0,writable:!0,enumerable:!1}}),v)}function uo(f,v){ni?f[ni]&&(f[ni]&=~v):f.A!==void 0&&(f.A&=~v)}function Pt(f){var v;return ni?v=f[ni]:v=f.A,v??0}function Pn(f,v){ni?f[ni]=v:f.A!==void 0?f.A=v:Object.defineProperties(f,{A:{value:v,configurable:!0,writable:!0,enumerable:!1}})}function fs(f){return _i(f,1),f}function ma(f,v){Pn(v,(f|0)&-51)}function Gi(f,v){Pn(v,(f|18)&-41)}var hs={};function Wi(f){return f!==null&&typeof f=="object"&&!Array.isArray(f)&&f.constructor===Object}var _r,fo=[];Pn(fo,23),_r=Object.freeze(fo);function ho(f){if(Pt(f.o)&2)throw Error("Cannot mutate an immutable Message")}function po(f){var v=f.length;(v=v?f[v-1]:void 0)&&Wi(v)?v.g=1:(v={},f.push((v.g=1,v)))}function ga(f){var v=f.i+f.G;return f.B||(f.B=f.o[v]={})}function Fn(f,v){return v===-1?null:v>=f.i?f.B?f.B[v]:void 0:f.o[v+f.G]}function jn(f,v,y,A){ho(f),Fr(f,v,y,A)}function Fr(f,v,y,A){f.j&&(f.j=void 0),v>=f.i||A?ga(f)[v]=y:(f.o[v+f.G]=y,(f=f.B)&&v in f&&delete f[v])}function P(f,v,y,A){var F=Fn(f,v);Array.isArray(F)||(F=_r);var G=Pt(F);if(G&1||fs(F),A)G&2||_i(F,2),y&1||Object.freeze(F);else{A=!(y&2);var V=G&2;y&1||!V?A&&G&16&&!V&&uo(F,16):(F=fs(Array.prototype.slice.call(F)),Fr(f,v,F))}return F}function Q(f,v){var y=Fn(f,v),A=y==null?y:typeof y=="number"||y==="NaN"||y==="Infinity"||y==="-Infinity"?Number(y):void 0;return A!=null&&A!==y&&Fr(f,v,A),A}function ce(f,v,y,A,F){f.h||(f.h={});var G=f.h[y],V=P(f,y,3,F);if(!G){var $=V;G=[];var le=!!(Pt(f.o)&16);V=!!(Pt($)&2);var we=$;!F&&V&&($=Array.prototype.slice.call($));for(var Ne=V,rt=0;rt<$.length;rt++){var Qe=$[rt],Ge=v,st=!1;if(st=st===void 0?!1:st,Qe=Array.isArray(Qe)?new Ge(Qe):st?new Ge:void 0,Qe!==void 0){Ge=Qe.o;var gt=st=Pt(Ge);V&&(gt|=2),le&&(gt|=16),gt!=st&&Pn(Ge,gt),Ge=gt,Ne=Ne||!!(2&Ge),G.push(Qe)}}return f.h[y]=G,le=Pt($),v=le|33,v=Ne?v&-9:v|8,le!=v&&(Ne=$,Object.isFrozen(Ne)&&(Ne=Array.prototype.slice.call(Ne)),Pn(Ne,v),$=Ne),we!==$&&Fr(f,y,$),(F||A&&V)&&_i(G,2),A&&Object.freeze(G),G}return F||(F=Object.isFrozen(G),A&&!F?Object.freeze(G):!A&&F&&(G=Array.prototype.slice.call(G),f.h[y]=G)),G}function oe(f,v,y){var A=!!(Pt(f.o)&2);if(v=ce(f,v,y,A,A),f=P(f,y,3,A),!(A||Pt(f)&8)){for(A=0;A<v.length;A++){if(y=v[A],Pt(y.o)&2){var F=en(y,!1);F.j=y}else F=y;y!==F&&(v[A]=F,f[A]=F.o)}_i(f,8)}return v}function te(f,v,y){if(y!=null&&typeof y!="number")throw Error("Value of float/double field must be a number|null|undefined, found "+typeof y+": "+y);jn(f,v,y)}function Be(f,v,y,A,F){ho(f);var G=ce(f,y,v,!1,!1);return y=A??new y,f=P(f,v,2,!1),F!=null?(G.splice(F,0,y),f.splice(F,0,y.o)):(G.push(y),f.push(y.o)),y.C()&&uo(f,8),y}function We(f,v){return f??v}function De(f,v,y){return y=y===void 0?0:y,We(Q(f,v),y)}var $e;function Je(f){switch(typeof f){case"number":return isFinite(f)?f:String(f);case"object":if(f)if(Array.isArray(f)){if((Pt(f)&128)!==0)return f=Array.prototype.slice.call(f),po(f),f}else{if(ye&&f!=null&&f instanceof Uint8Array)return tt(f);if(f instanceof be){var v=f.V;return v==null?"":typeof v=="string"?v:f.V=tt(v)}}}return f}function ct(f,v,y,A){if(f!=null){if(Array.isArray(f))f=ht(f,v,y,A!==void 0);else if(Wi(f)){var F={},G;for(G in f)F[G]=ct(f[G],v,y,A);f=F}else f=v(f,A);return f}}function ht(f,v,y,A){var F=Pt(f);A=A?!!(F&16):void 0,f=Array.prototype.slice.call(f);for(var G=0;G<f.length;G++)f[G]=ct(f[G],v,y,A);return y(F,f),f}function Ze(f){return f.ja===hs?f.toJSON():Je(f)}function At(f,v){f&128&&po(v)}function Ht(f,v,y){if(y=y===void 0?Gi:y,f!=null){if(ye&&f instanceof Uint8Array)return f.length?new be(new Uint8Array(f),Fe):Ce();if(Array.isArray(f)){var A=Pt(f);return A&2?f:v&&!(A&32)&&(A&16||A===0)?(Pn(f,A|2),f):(f=ht(f,Ht,A&4?Gi:y,!0),v=Pt(f),v&4&&v&2&&Object.freeze(f),f)}return f.ja===hs?Tt(f):f}}function Bt(f,v,y,A,F,G,V){if(f=f.h&&f.h[y]){if(A=Pt(f),A&2?A=f:(G=j(f,Tt),Gi(A,G),Object.freeze(G),A=G),ho(v),V=A==null?_r:fs([]),A!=null){for(G=!!A.length,f=0;f<A.length;f++){var $=A[f];G=G&&!(Pt($.o)&2),V[f]=$.o}G=(G?8:0)|1,f=Pt(V),(f&G)!==G&&(Object.isFrozen(V)&&(V=Array.prototype.slice.call(V)),Pn(V,f|G)),v.h||(v.h={}),v.h[y]=A}else v.h&&(v.h[y]=void 0);Fr(v,y,V,F)}else jn(v,y,Ht(A,G,V),F)}function Tt(f){return Pt(f.o)&2||(f=en(f,!0),_i(f.o,2)),f}function en(f,v){var y=f.o,A=[];_i(A,16);var F=f.constructor.h;if(F&&A.push(F),F=f.B,F){A.length=y.length,A.fill(void 0,A.length,y.length);var G={};A[A.length-1]=G}(Pt(y)&128)!==0&&po(A),v=v||f.C()?Gi:ma,G=f.constructor,$e=A,A=new G(A),$e=void 0,f.R&&(A.R=f.R.slice()),G=!!(Pt(y)&16);for(var V=F?y.length-1:y.length,$=0;$<V;$++)Bt(f,A,$-f.G,y[$],!1,G,v);if(F)for(var le in F)Bt(f,A,+le,F[le],!0,G,v);return A}function He(f,v,y){f==null&&(f=$e),$e=void 0;var A=this.constructor.i||0,F=0<A,G=this.constructor.h,V=!1;if(f==null){f=G?[G]:[];var $=48,le=!0;F&&(A=0,$|=128),Pn(f,$)}else{if(!Array.isArray(f)||G&&G!==f[0])throw Error();var we=$=_i(f,0);if((le=(16&we)!==0)&&((V=(32&we)!==0)||(we|=32)),F){if(128&we)A=0;else if(0<f.length){var Ne=f[f.length-1];if(Wi(Ne)&&"g"in Ne){A=0,we|=128,delete Ne.g;var rt=!0,Qe;for(Qe in Ne){rt=!1;break}rt&&f.pop()}}}else if(128&we)throw Error();$!==we&&Pn(f,we)}this.G=(G?0:-1)-A,this.h=void 0,this.o=f;e:{if(G=this.o.length,A=G-1,G&&(G=this.o[A],Wi(G))){this.B=G,this.i=A-this.G;break e}v!==void 0&&-1<v?(this.i=Math.max(v,A+1-this.G),this.B=void 0):this.i=Number.MAX_VALUE}if(!F&&this.B&&"g"in this.B)throw Error('Unexpected "g" flag in sparse object of message that is not a group type.');if(y){v=le&&!V&&!0,F=this.i;var Ge;for(le=0;le<y.length;le++)V=y[le],V<F?(V+=this.G,(A=f[V])?pn(A,v):f[V]=_r):(Ge||(Ge=ga(this)),(A=Ge[V])?pn(A,v):Ge[V]=_r)}}He.prototype.toJSON=function(){return ht(this.o,Ze,At)},He.prototype.C=function(){return!!(Pt(this.o)&2)};function pn(f,v){if(Array.isArray(f)){var y=Pt(f),A=1;!v||y&2||(A|=16),(y&A)!==A&&Pn(f,y|A)}}He.prototype.ja=hs,He.prototype.toString=function(){return this.o.toString()};function xt(f,v,y){if(y){var A={},F;for(F in y){var G=y[F],V=G.qa;V||(A.J=G.wa||G.oa.W,G.ia?(A.aa=ri(G.ia),V=(function($){return function(le,we,Ne){return $.J(le,we,Ne,$.aa)}})(A)):G.ka?(A.Z=ji(G.da.P,G.ka),V=(function($){return function(le,we,Ne){return $.J(le,we,Ne,$.Z)}})(A)):V=A.J,G.qa=V),V(v,f,G.da),A={J:A.J,aa:A.aa,Z:A.Z}}}co(v,f)}var mn=Symbol();function Bn(f,v,y){return f[mn]||(f[mn]=function(A,F){return v(A,F,y)})}function vi(f){var v=f[mn];if(!v){var y=cc(f);v=function(A,F){return Jh(A,F,y)},f[mn]=v}return v}function vr(f){var v=f.ia;if(v)return vi(v);if(v=f.va)return Bn(f.da.P,v,f.ka)}function Lt(f){var v=vr(f),y=f.da,A=f.oa.U;return v?function(F,G){return A(F,G,y,v)}:function(F,G){return A(F,G,y)}}function Kt(f,v){var y=f[v];return typeof y=="function"&&y.length===0&&(y=y(),f[v]=y),Array.isArray(y)&&(mo in y||xr in y||0<y.length&&typeof y[0]=="function")?y:void 0}function ii(f,v,y,A,F,G){v.P=f[0];var V=1;if(f.length>V&&typeof f[V]!="number"){var $=f[V++];y(v,$)}for(;V<f.length;){y=f[V++];for(var le=V+1;le<f.length&&typeof f[le]!="number";)le++;switch($=f[V++],le-=V,le){case 0:A(v,y,$);break;case 1:(le=Kt(f,V))?(V++,F(v,y,$,le)):A(v,y,$,f[V++]);break;case 2:le=V++,le=Kt(f,le),F(v,y,$,le,f[V++]);break;case 3:G(v,y,$,f[V++],f[V++],f[V++]);break;case 4:G(v,y,$,f[V++],f[V++],f[V++],f[V++]);break;default:throw Error("unexpected number of binary field arguments: "+le)}}return v}var zt=Symbol();function ri(f){var v=f[zt];if(!v){var y=lc(f);v=function(A,F){return Zh(A,F,y)},f[zt]=v}return v}function ji(f,v){var y=f[zt];return y||(y=function(A,F){return xt(A,F,v)},f[zt]=y),y}var xr=Symbol();function rv(f,v){f.push(v)}function sv(f,v,y){f.push(v,y.W)}function ov(f,v,y,A){var F=ri(A),G=lc(A).P,V=y.W;f.push(v,function($,le,we){return V($,le,we,G,F)})}function av(f,v,y,A,F,G){var V=ji(A,G),$=y.W;f.push(v,function(le,we,Ne){return $(le,we,Ne,A,V)})}function lc(f){var v=f[xr];return v||(v=ii(f,f[xr]=[],rv,sv,ov,av),mo in f&&xr in f&&(f.length=0),v)}var mo=Symbol();function lv(f,v){f[0]=v}function cv(f,v,y,A){var F=y.U;f[v]=A?function(G,V,$){return F(G,V,$,A)}:F}function uv(f,v,y,A,F){var G=y.U,V=vi(A),$=cc(A).P;f[v]=function(le,we,Ne){return G(le,we,Ne,$,V,F)}}function fv(f,v,y,A,F,G,V){var $=y.U,le=Bn(A,F,G);f[v]=function(we,Ne,rt){return $(we,Ne,rt,A,le,V)}}function cc(f){var v=f[mo];return v||(v=ii(f,f[mo]={},lv,cv,uv,fv),mo in f&&xr in f&&(f.length=0),v)}function Jh(f,v,y){for(;Ct(v)&&v.i!=4;){var A=v.l,F=y[A];if(!F){var G=y[0];G&&(G=G[A])&&(F=y[A]=Lt(G))}if(!F||!F(v,f,A)){F=v,A=f,G=F.j,Mt(F);var V=F;if(!V.ca){if(F=V.h.h-G,V.h.h=G,V=V.h,F==0)F=Ce();else{if(G=Pe(V,F),V.S&&V.m)F=V.i.subarray(G,G+F);else{V=V.i;var $=G;F=G+F,F=$===F?Ae():k?V.slice($,F):new Uint8Array(V.subarray($,F))}F=F.length==0?Ce():new be(F,Fe)}(G=A.R)?G.push(F):A.R=[F]}}}return f}function Zh(f,v,y){for(var A=y.length,F=A%2==1,G=F?1:0;G<A;G+=2)(0,y[G+1])(v,f,y[G]);xt(f,v,F?y[0]:void 0)}function go(f,v){return{U:f,W:v}}var si=go(function(f,v,y){if(f.i!==5)return!1;f=f.h;var A=f.i,F=f.h,G=A[F],V=A[F+1],$=A[F+2];return A=A[F+3],K(f,f.h+4),V=(G<<0|V<<8|$<<16|A<<24)>>>0,f=2*(V>>31)+1,G=V>>>23&255,V&=8388607,jn(v,y,G==255?V?NaN:1/0*f:G==0?f*Math.pow(2,-149)*V:f*Math.pow(2,G-150)*(V+Math.pow(2,23))),!0},function(f,v,y){if(v=Q(v,y),v!=null){Xe(f.h,8*y+5),f=f.h;var A=+v;A===0?0<1/A?z=Z=0:(Z=0,z=2147483648):isNaN(A)?(Z=0,z=2147483647):(A=(y=0>A?-2147483648:0)?-A:A,34028234663852886e22<A?(Z=0,z=(y|2139095040)>>>0):11754943508222875e-54>A?(A=Math.round(A/Math.pow(2,-149)),Z=0,z=(y|A)>>>0):(v=Math.floor(Math.log(A)/Math.LN2),A*=Math.pow(2,-v),A=Math.round(8388608*A),16777216<=A&&++v,Z=0,z=(y|v+127<<23|A&8388607)>>>0)),y=z,f.h.push(y>>>0&255),f.h.push(y>>>8&255),f.h.push(y>>>16&255),f.h.push(y>>>24&255)}}),hv=go(function(f,v,y){if(f.i!==0)return!1;var A=f.h,F=0,G=f=0,V=A.i,$=A.h;do{var le=V[$++];F|=(le&127)<<G,G+=7}while(32>G&&le&128);for(32<G&&(f|=(le&127)>>4),G=3;32>G&&le&128;G+=7)le=V[$++],f|=(le&127)<<G;if(K(A,$),128>le)A=F>>>0,le=f>>>0,(f=le&2147483648)&&(A=~A+1>>>0,le=~le>>>0,A==0&&(le=le+1>>>0)),A=4294967296*le+(A>>>0);else throw xe();return jn(v,y,f?-A:A),!0},function(f,v,y){v=Fn(v,y),v!=null&&(typeof v=="string"&&Ee(v),v!=null&&(Xe(f.h,8*y),typeof v=="number"?(f=f.h,ge(v),pe(f,z,Z)):(y=Ee(v),pe(f.h,y.i,y.h))))}),dv=go(function(f,v,y){return f.i!==0?!1:(jn(v,y,Ie(f.h)),!0)},function(f,v,y){if(v=Fn(v,y),v!=null&&v!=null)if(Xe(f.h,8*y),f=f.h,y=v,0<=y)Xe(f,y);else{for(v=0;9>v;v++)f.h.push(y&127|128),y>>=7;f.h.push(1)}}),Qh=go(function(f,v,y){if(f.i!==2)return!1;var A=Ie(f.h)>>>0;f=f.h;var F=Pe(f,A);if(f=f.i,se){var G=f,V;(V=de)||(V=de=new TextDecoder("utf-8",{fatal:!0})),f=F+A,G=F===0&&f===G.length?G:G.subarray(F,f);try{var $=V.decode(G)}catch(rt){if(re===void 0){try{V.decode(new Uint8Array([128]))}catch{}try{V.decode(new Uint8Array([97])),re=!0}catch{re=!1}}throw!re&&(de=void 0),rt}}else{$=F,A=$+A,F=[];for(var le=null,we,Ne;$<A;)we=f[$++],128>we?F.push(we):224>we?$>=A?S():(Ne=f[$++],194>we||(Ne&192)!==128?($--,S()):F.push((we&31)<<6|Ne&63)):240>we?$>=A-1?S():(Ne=f[$++],(Ne&192)!==128||we===224&&160>Ne||we===237&&160<=Ne||((G=f[$++])&192)!==128?($--,S()):F.push((we&15)<<12|(Ne&63)<<6|G&63)):244>=we?$>=A-2?S():(Ne=f[$++],(Ne&192)!==128||(we<<28)+(Ne-144)>>30!==0||((G=f[$++])&192)!==128||((V=f[$++])&192)!==128?($--,S()):(we=(we&7)<<18|(Ne&63)<<12|(G&63)<<6|V&63,we-=65536,F.push((we>>10&1023)+55296,(we&1023)+56320))):S(),8192<=F.length&&(le=W(le,F),F.length=0);$=W(le,F)}return jn(v,y,$),!0},function(f,v,y){if(v=Fn(v,y),v!=null){var A=!1;if(A=A===void 0?!1:A,Te){if(A&&/(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(v))throw Error("Found an unpaired surrogate");v=(Ue||(Ue=new TextEncoder)).encode(v)}else{for(var F=0,G=new Uint8Array(3*v.length),V=0;V<v.length;V++){var $=v.charCodeAt(V);if(128>$)G[F++]=$;else{if(2048>$)G[F++]=$>>6|192;else{if(55296<=$&&57343>=$){if(56319>=$&&V<v.length){var le=v.charCodeAt(++V);if(56320<=le&&57343>=le){$=1024*($-55296)+le-56320+65536,G[F++]=$>>18|240,G[F++]=$>>12&63|128,G[F++]=$>>6&63|128,G[F++]=$&63|128;continue}else V--}if(A)throw Error("Found an unpaired surrogate");$=65533}G[F++]=$>>12|224,G[F++]=$>>6&63|128}G[F++]=$&63|128}}v=F===G.length?G:G.subarray(0,F)}Xe(f.h,8*y+2),Xe(f.h,v.length),zi(f,f.h.end()),zi(f,v)}}),ed=go(function(f,v,y,A,F){if(f.i!==2)return!1;v=Be(v,y,A),y=f.h.j,A=Ie(f.h)>>>0;var G=f.h.h+A,V=G-y;if(0>=V&&(f.h.j=G,F(v,f,void 0,void 0,void 0),V=G-f.h.h),V)throw Error("Message parsing ended unexpectedly. Expected to read "+(A+" bytes, instead read "+(A-V)+" bytes, either the data ended unexpectedly or the message misreported its own length"));return f.h.h=G,f.h.j=y,!0},function(f,v,y,A,F){if(v=oe(v,A,y),v!=null)for(A=0;A<v.length;A++){var G=f;Xe(G.h,8*y+2);var V=G.h.end();zi(G,V),V.push(G.i),G=V,F(v[A],f),V=f;var $=G.pop();for($=V.i+V.h.length()-$;127<$;)G.push($&127|128),$>>>=7,V.i++;G.push($),V.i++}});function uc(f){return function(v,y){e:{if(Cn.length){var A=Cn.pop();A.setOptions(y),lt(A.h,v,y),v=A}else v=new it(v,y);try{var F=cc(f),G=Jh(new F.P,v,F);break e}finally{F=v.h,F.i=null,F.m=!1,F.l=0,F.j=0,F.h=0,F.S=!1,v.l=-1,v.i=-1,100>Cn.length&&Cn.push(v)}G=void 0}return G}}function fc(f){return function(){var v=new ti;Zh(this,v,lc(f)),zi(v,v.h.end());for(var y=new Uint8Array(v.i),A=v.j,F=A.length,G=0,V=0;V<F;V++){var $=A[V];y.set($,G),G+=$.length}return v.j=[y],y}}function ds(f){He.call(this,f)}m(ds,He);var td=[ds,1,dv,2,si,3,Qh,4,Qh];ds.prototype.l=fc(td);function hc(f){He.call(this,f,-1,pv)}m(hc,He),hc.prototype.addClassification=function(f,v){return Be(this,1,ds,f,v),this};var pv=[1],nd=uc([hc,1,ed,td]);function ps(f){He.call(this,f)}m(ps,He);var id=[ps,1,si,2,si,3,si,4,si,5,si];ps.prototype.l=fc(id);function rd(f){He.call(this,f,-1,mv)}m(rd,He);var mv=[1],sd=uc([rd,1,ed,id]);function _a(f){He.call(this,f)}m(_a,He);var od=[_a,1,si,2,si,3,si,4,si,5,si,6,hv],gv=uc(od);_a.prototype.l=fc(od);function ad(f,v,y){if(y=f.createShader(y===0?f.VERTEX_SHADER:f.FRAGMENT_SHADER),f.shaderSource(y,v),f.compileShader(y),!f.getShaderParameter(y,f.COMPILE_STATUS))throw Error(`Could not compile WebGL shader.

`+f.getShaderInfoLog(y));return y}function ld(f){return oe(f,ds,1).map(function(v){var y=Fn(v,1);return{index:y??0,score:De(v,2),label:Fn(v,3)!=null?We(Fn(v,3),""):void 0,displayName:Fn(v,4)!=null?We(Fn(v,4),""):void 0}})}function cd(f){return{x:De(f,1),y:De(f,2),z:De(f,3),visibility:Q(f,4)!=null?De(f,4):void 0}}function ud(f){return f.map(function(v){return oe(sd(v),ps,1).map(cd)})}function dc(f,v){this.i=f,this.h=v,this.m=0}function fd(f,v,y){return _v(f,v),typeof f.h.canvas.transferToImageBitmap=="function"?Promise.resolve(f.h.canvas.transferToImageBitmap()):y?Promise.resolve(f.h.canvas):typeof createImageBitmap=="function"?createImageBitmap(f.h.canvas):(f.j===void 0&&(f.j=document.createElement("canvas")),new Promise(function(A){f.j.height=f.h.canvas.height,f.j.width=f.h.canvas.width,f.j.getContext("2d",{}).drawImage(f.h.canvas,0,0,f.h.canvas.width,f.h.canvas.height),A(f.j)}))}function _v(f,v){var y=f.h;if(f.s===void 0){var A=ad(y,`
  attribute vec2 aVertex;
  attribute vec2 aTex;
  varying vec2 vTex;
  void main(void) {
    gl_Position = vec4(aVertex, 0.0, 1.0);
    vTex = aTex;
  }`,0),F=ad(y,`
  precision mediump float;
  varying vec2 vTex;
  uniform sampler2D sampler0;
  void main(){
    gl_FragColor = texture2D(sampler0, vTex);
  }`,1),G=y.createProgram();if(y.attachShader(G,A),y.attachShader(G,F),y.linkProgram(G),!y.getProgramParameter(G,y.LINK_STATUS))throw Error(`Could not compile WebGL program.

`+y.getProgramInfoLog(G));A=f.s=G,y.useProgram(A),F=y.getUniformLocation(A,"sampler0"),f.l={O:y.getAttribLocation(A,"aVertex"),N:y.getAttribLocation(A,"aTex"),xa:F},f.v=y.createBuffer(),y.bindBuffer(y.ARRAY_BUFFER,f.v),y.enableVertexAttribArray(f.l.O),y.vertexAttribPointer(f.l.O,2,y.FLOAT,!1,0,0),y.bufferData(y.ARRAY_BUFFER,new Float32Array([-1,-1,-1,1,1,1,1,-1]),y.STATIC_DRAW),y.bindBuffer(y.ARRAY_BUFFER,null),f.u=y.createBuffer(),y.bindBuffer(y.ARRAY_BUFFER,f.u),y.enableVertexAttribArray(f.l.N),y.vertexAttribPointer(f.l.N,2,y.FLOAT,!1,0,0),y.bufferData(y.ARRAY_BUFFER,new Float32Array([0,1,0,0,1,0,1,1]),y.STATIC_DRAW),y.bindBuffer(y.ARRAY_BUFFER,null),y.uniform1i(F,0)}A=f.l,y.useProgram(f.s),y.canvas.width=v.width,y.canvas.height=v.height,y.viewport(0,0,v.width,v.height),y.activeTexture(y.TEXTURE0),f.i.bindTexture2d(v.glName),y.enableVertexAttribArray(A.O),y.bindBuffer(y.ARRAY_BUFFER,f.v),y.vertexAttribPointer(A.O,2,y.FLOAT,!1,0,0),y.enableVertexAttribArray(A.N),y.bindBuffer(y.ARRAY_BUFFER,f.u),y.vertexAttribPointer(A.N,2,y.FLOAT,!1,0,0),y.bindFramebuffer(y.DRAW_FRAMEBUFFER?y.DRAW_FRAMEBUFFER:y.FRAMEBUFFER,null),y.clearColor(0,0,0,0),y.clear(y.COLOR_BUFFER_BIT),y.colorMask(!0,!0,!0,!0),y.drawArrays(y.TRIANGLE_FAN,0,4),y.disableVertexAttribArray(A.O),y.disableVertexAttribArray(A.N),y.bindBuffer(y.ARRAY_BUFFER,null),f.i.bindTexture2d(0)}function vv(f){this.h=f}var xv=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,2,1,0,10,9,1,7,0,65,0,253,15,26,11]);function yv(f,v){return v+f}function hd(f,v){window[f]=v}function Sv(f){var v=document.createElement("script");return v.setAttribute("src",f),v.setAttribute("crossorigin","anonymous"),new Promise(function(y){v.addEventListener("load",function(){y()},!1),v.addEventListener("error",function(){y()},!1),document.body.appendChild(v)})}function Mv(){return R(function(f){switch(f.h){case 1:return f.s=2,b(f,WebAssembly.instantiate(xv),4);case 4:f.h=3,f.s=0;break;case 2:return f.s=0,f.l=null,f.return(!1);case 3:return f.return(!0)}})}function pc(f){if(this.h=f,this.listeners={},this.l={},this.L={},this.s={},this.v={},this.M=this.u=this.ga=!0,this.I=Promise.resolve(),this.fa="",this.D={},this.locateFile=f&&f.locateFile||yv,typeof window=="object")var v=window.location.pathname.toString().substring(0,window.location.pathname.toString().lastIndexOf("/"))+"/";else if(typeof location<"u")v=location.pathname.toString().substring(0,location.pathname.toString().lastIndexOf("/"))+"/";else throw Error("solutions can only be loaded on a web page or in a web worker");if(this.ha=v,f.options){v=a(Object.keys(f.options));for(var y=v.next();!y.done;y=v.next()){y=y.value;var A=f.options[y].default;A!==void 0&&(this.l[y]=typeof A=="function"?A():A)}}}n=pc.prototype,n.close=function(){return this.j&&this.j.delete(),Promise.resolve()};function bv(f){var v,y,A,F,G,V,$,le,we,Ne,rt;return R(function(Qe){switch(Qe.h){case 1:return f.ga?(v=f.h.files===void 0?[]:typeof f.h.files=="function"?f.h.files(f.l):f.h.files,b(Qe,Mv(),2)):Qe.return();case 2:if(y=Qe.i,typeof window=="object")return hd("createMediapipeSolutionsWasm",{locateFile:f.locateFile}),hd("createMediapipeSolutionsPackedAssets",{locateFile:f.locateFile}),V=v.filter(function(Ge){return Ge.data!==void 0}),$=v.filter(function(Ge){return Ge.data===void 0}),le=Promise.all(V.map(function(Ge){var st=va(f,Ge.url);if(Ge.path!==void 0){var gt=Ge.path;st=st.then(function(kt){return f.overrideFile(gt,kt),Promise.resolve(kt)})}return st})),we=Promise.all($.map(function(Ge){return Ge.simd===void 0||Ge.simd&&y||!Ge.simd&&!y?Sv(f.locateFile(Ge.url,f.ha)):Promise.resolve()})).then(function(){var Ge,st,gt;return R(function(kt){if(kt.h==1)return Ge=window.createMediapipeSolutionsWasm,st=window.createMediapipeSolutionsPackedAssets,gt=f,b(kt,Ge(st),2);gt.i=kt.i,kt.h=0})}),Ne=(function(){return R(function(Ge){return f.h.graph&&f.h.graph.url?Ge=b(Ge,va(f,f.h.graph.url),0):(Ge.h=0,Ge=void 0),Ge})})(),b(Qe,Promise.all([we,le,Ne]),7);if(typeof importScripts!="function")throw Error("solutions can only be loaded on a web page or in a web worker");return A=v.filter(function(Ge){return Ge.simd===void 0||Ge.simd&&y||!Ge.simd&&!y}).map(function(Ge){return f.locateFile(Ge.url,f.ha)}),importScripts.apply(null,l(A)),F=f,b(Qe,createMediapipeSolutionsWasm(Module),6);case 6:F.i=Qe.i,f.m=new OffscreenCanvas(1,1),f.i.canvas=f.m,G=f.i.GL.createContext(f.m,{antialias:!1,alpha:!1,ua:typeof WebGL2RenderingContext<"u"?2:1}),f.i.GL.makeContextCurrent(G),Qe.h=4;break;case 7:if(f.m=document.createElement("canvas"),rt=f.m.getContext("webgl2",{}),!rt&&(rt=f.m.getContext("webgl",{}),!rt))return alert("Failed to create WebGL canvas context when passing video frame."),Qe.return();f.K=rt,f.i.canvas=f.m,f.i.createContext(f.m,!0,!0,{});case 4:f.j=new f.i.SolutionWasm,f.ga=!1,Qe.h=0}})}function Ev(f){var v,y,A,F,G,V,$,le;return R(function(we){if(we.h==1){if(f.h.graph&&f.h.graph.url&&f.fa===f.h.graph.url)return we.return();if(f.u=!0,!f.h.graph||!f.h.graph.url){we.h=2;return}return f.fa=f.h.graph.url,b(we,va(f,f.h.graph.url),3)}for(we.h!=2&&(v=we.i,f.j.loadGraph(v)),y=a(Object.keys(f.D)),A=y.next();!A.done;A=y.next())F=A.value,f.j.overrideFile(F,f.D[F]);if(f.D={},f.h.listeners)for(G=a(f.h.listeners),V=G.next();!V.done;V=G.next())$=V.value,Rv(f,$);le=f.l,f.l={},f.setOptions(le),we.h=0})}n.reset=function(){var f=this;return R(function(v){f.j&&(f.j.reset(),f.s={},f.v={}),v.h=0})},n.setOptions=function(f,v){var y=this;if(v=v||this.h.options){for(var A=[],F=[],G={},V=a(Object.keys(f)),$=V.next();!$.done;G={X:G.X,Y:G.Y},$=V.next())if($=$.value,!($ in this.l&&this.l[$]===f[$])){this.l[$]=f[$];var le=v[$];le!==void 0&&(le.onChange&&(G.X=le.onChange,G.Y=f[$],A.push((function(we){return function(){var Ne;return R(function(rt){if(rt.h==1)return b(rt,we.X(we.Y),2);Ne=rt.i,Ne===!0&&(y.u=!0),rt.h=0})}})(G))),le.graphOptionXref&&($=Object.assign({},{calculatorName:"",calculatorIndex:0},le.graphOptionXref,{valueNumber:le.type===1?f[$]:0,valueBoolean:le.type===0?f[$]:!1,valueString:le.type===2?f[$]:""}),F.push($)))}(A.length!==0||F.length!==0)&&(this.u=!0,this.H=(this.H===void 0?[]:this.H).concat(F),this.F=(this.F===void 0?[]:this.F).concat(A))}};function Tv(f){var v,y,A,F,G,V,$;return R(function(le){switch(le.h){case 1:if(!f.u)return le.return();if(!f.F){le.h=2;break}v=a(f.F),y=v.next();case 3:if(y.done){le.h=5;break}return A=y.value,b(le,A(),4);case 4:y=v.next(),le.h=3;break;case 5:f.F=void 0;case 2:if(f.H){for(F=new f.i.GraphOptionChangeRequestList,G=a(f.H),V=G.next();!V.done;V=G.next())$=V.value,F.push_back($);f.j.changeOptions(F),F.delete(),f.H=void 0}f.u=!1,le.h=0}})}n.initialize=function(){var f=this;return R(function(v){return v.h==1?b(v,bv(f),2):v.h!=3?b(v,Ev(f),3):b(v,Tv(f),0)})};function va(f,v){var y,A;return R(function(F){return v in f.L?F.return(f.L[v]):(y=f.locateFile(v,""),A=fetch(y).then(function(G){return G.arrayBuffer()}),f.L[v]=A,F.return(A))})}n.overrideFile=function(f,v){this.j?this.j.overrideFile(f,v):this.D[f]=v},n.clearOverriddenFiles=function(){this.D={},this.j&&this.j.clearOverriddenFiles()},n.send=function(f,v){var y=this,A,F,G,V,$,le,we,Ne,rt;return R(function(Qe){switch(Qe.h){case 1:return y.h.inputs?(A=1e3*(v??performance.now()),b(Qe,y.I,2)):Qe.return();case 2:return b(Qe,y.initialize(),3);case 3:for(F=new y.i.PacketDataList,G=a(Object.keys(f)),V=G.next();!V.done;V=G.next())if($=V.value,le=y.h.inputs[$]){e:{var Ge=f[$];switch(le.type){case"video":var st=y.s[le.stream];if(st||(st=new dc(y.i,y.K),y.s[le.stream]=st),st.m===0&&(st.m=st.i.createTexture()),typeof HTMLVideoElement<"u"&&Ge instanceof HTMLVideoElement)var gt=Ge.videoWidth,kt=Ge.videoHeight;else typeof HTMLImageElement<"u"&&Ge instanceof HTMLImageElement?(gt=Ge.naturalWidth,kt=Ge.naturalHeight):(gt=Ge.width,kt=Ge.height);kt={glName:st.m,width:gt,height:kt},gt=st.h,gt.canvas.width=kt.width,gt.canvas.height=kt.height,gt.activeTexture(gt.TEXTURE0),st.i.bindTexture2d(st.m),gt.texImage2D(gt.TEXTURE_2D,0,gt.RGBA,gt.RGBA,gt.UNSIGNED_BYTE,Ge),st.i.bindTexture2d(0),st=kt;break e;case"detections":for(st=y.s[le.stream],st||(st=new vv(y.i),y.s[le.stream]=st),st.data||(st.data=new st.h.DetectionListData),st.data.reset(Ge.length),kt=0;kt<Ge.length;++kt){gt=Ge[kt];var Ot=st.data,ln=Ot.setBoundingBox,Xn=kt,Ln=gt.la,Et=new _a;if(te(Et,1,Ln.ra),te(Et,2,Ln.sa),te(Et,3,Ln.height),te(Et,4,Ln.width),te(Et,5,Ln.rotation),jn(Et,6,Ln.pa),Ln=Et.l(),ln.call(Ot,Xn,Ln),gt.ea)for(Ot=0;Ot<gt.ea.length;++Ot){Et=gt.ea[Ot],ln=st.data,Xn=ln.addNormalizedLandmark,Ln=kt,Et=Object.assign({},Et,{visibility:Et.visibility?Et.visibility:0});var cn=new ps;te(cn,1,Et.x),te(cn,2,Et.y),te(cn,3,Et.z),Et.visibility&&te(cn,4,Et.visibility),Et=cn.l(),Xn.call(ln,Ln,Et)}if(gt.ba)for(Ot=0;Ot<gt.ba.length;++Ot)ln=st.data,Xn=ln.addClassification,Ln=kt,Et=gt.ba[Ot],cn=new ds,te(cn,2,Et.score),Et.index&&jn(cn,1,Et.index),Et.label&&jn(cn,3,Et.label),Et.displayName&&jn(cn,4,Et.displayName),Et=cn.l(),Xn.call(ln,Ln,Et)}st=st.data;break e;default:st={}}}switch(we=st,Ne=le.stream,le.type){case"video":F.pushTexture2d(Object.assign({},we,{stream:Ne,timestamp:A}));break;case"detections":rt=we,rt.stream=Ne,rt.timestamp=A,F.pushDetectionList(rt);break;default:throw Error("Unknown input config type: '"+le.type+"'")}}return y.j.send(F),b(Qe,y.I,4);case 4:F.delete(),Qe.h=0}})};function Av(f,v,y){var A,F,G,V,$,le,we,Ne,rt,Qe,Ge,st,gt,kt;return R(function(Ot){switch(Ot.h){case 1:if(!y)return Ot.return(v);for(A={},F=0,G=a(Object.keys(y)),V=G.next();!V.done;V=G.next())$=V.value,le=y[$],typeof le!="string"&&le.type==="texture"&&v[le.stream]!==void 0&&++F;1<F&&(f.M=!1),we=a(Object.keys(y)),V=we.next();case 2:if(V.done){Ot.h=4;break}if(Ne=V.value,rt=y[Ne],typeof rt=="string")return gt=A,kt=Ne,b(Ot,wv(f,Ne,v[rt]),14);if(Qe=v[rt.stream],rt.type==="detection_list"){if(Qe){for(var ln=Qe.getRectList(),Xn=Qe.getLandmarksList(),Ln=Qe.getClassificationsList(),Et=[],cn=0;cn<ln.size();++cn){var yr=gv(ln.get(cn)),Cv=De(yr,1),Pv=De(yr,2),Lv=De(yr,3),Iv=De(yr,4),Dv=De(yr,5,0),xa=void 0;xa=xa===void 0?0:xa,yr={la:{ra:Cv,sa:Pv,height:Lv,width:Iv,rotation:Dv,pa:We(Fn(yr,6),xa)},ea:oe(sd(Xn.get(cn)),ps,1).map(cd),ba:ld(nd(Ln.get(cn)))},Et.push(yr)}ln=Et}else ln=[];A[Ne]=ln,Ot.h=7;break}if(rt.type==="proto_list"){if(Qe){for(ln=Array(Qe.size()),Xn=0;Xn<Qe.size();Xn++)ln[Xn]=Qe.get(Xn);Qe.delete()}else ln=[];A[Ne]=ln,Ot.h=7;break}if(Qe===void 0){Ot.h=3;break}if(rt.type==="float_list"){A[Ne]=Qe,Ot.h=7;break}if(rt.type==="proto"){A[Ne]=Qe,Ot.h=7;break}if(rt.type!=="texture")throw Error("Unknown output config type: '"+rt.type+"'");return Ge=f.v[Ne],Ge||(Ge=new dc(f.i,f.K),f.v[Ne]=Ge),b(Ot,fd(Ge,Qe,f.M),13);case 13:st=Ot.i,A[Ne]=st;case 7:rt.transform&&A[Ne]&&(A[Ne]=rt.transform(A[Ne])),Ot.h=3;break;case 14:gt[kt]=Ot.i;case 3:V=we.next(),Ot.h=2;break;case 4:return Ot.return(A)}})}function wv(f,v,y){var A;return R(function(F){return typeof y=="number"||y instanceof Uint8Array||y instanceof f.i.Uint8BlobList?F.return(y):y instanceof f.i.Texture2dDataOut?(A=f.v[v],A||(A=new dc(f.i,f.K),f.v[v]=A),F.return(fd(A,y,f.M))):F.return(void 0)})}function Rv(f,v){for(var y=v.name||"$",A=[].concat(l(v.wants)),F=new f.i.StringList,G=a(v.wants),V=G.next();!V.done;V=G.next())F.push_back(V.value);G=f.i.PacketListener.implement({onResults:function($){for(var le={},we=0;we<v.wants.length;++we)le[A[we]]=$.get(we);var Ne=f.listeners[y];Ne&&(f.I=Av(f,le,v.outs).then(function(rt){rt=Ne(rt);for(var Qe=0;Qe<v.wants.length;++Qe){var Ge=le[A[Qe]];typeof Ge=="object"&&Ge.hasOwnProperty&&Ge.hasOwnProperty("delete")&&Ge.delete()}rt&&(f.I=rt)}))}}),f.j.attachMultiListener(F,G),F.delete()}n.onResults=function(f,v){this.listeners[v||"$"]=f},J("Solution",pc),J("OptionType",{BOOL:0,NUMBER:1,ta:2,0:"BOOL",1:"NUMBER",2:"STRING"});function dd(f){return f===void 0&&(f=0),f===1?"hand_landmark_full.tflite":"hand_landmark_lite.tflite"}function pd(f){var v=this;f=f||{},this.h=new pc({locateFile:f.locateFile,files:function(y){return[{url:"hands_solution_packed_assets_loader.js"},{simd:!1,url:"hands_solution_wasm_bin.js"},{simd:!0,url:"hands_solution_simd_wasm_bin.js"},{data:!0,url:dd(y.modelComplexity)}]},graph:{url:"hands.binarypb"},inputs:{image:{type:"video",stream:"input_frames_gpu"}},listeners:[{wants:["multi_hand_landmarks","multi_hand_world_landmarks","image_transformed","multi_handedness"],outs:{image:"image_transformed",multiHandLandmarks:{type:"proto_list",stream:"multi_hand_landmarks",transform:ud},multiHandWorldLandmarks:{type:"proto_list",stream:"multi_hand_world_landmarks",transform:ud},multiHandedness:{type:"proto_list",stream:"multi_handedness",transform:function(y){return y.map(function(A){return ld(nd(A))[0]})}}}}],options:{useCpuInference:{type:0,graphOptionXref:{calculatorType:"InferenceCalculator",fieldName:"use_cpu_inference"},default:typeof window!="object"||window.navigator===void 0?!1:"iPad Simulator;iPhone Simulator;iPod Simulator;iPad;iPhone;iPod".split(";").includes(navigator.platform)||navigator.userAgent.includes("Mac")&&"ontouchend"in document},selfieMode:{type:0,graphOptionXref:{calculatorType:"GlScalerCalculator",calculatorIndex:1,fieldName:"flip_horizontal"}},maxNumHands:{type:1,graphOptionXref:{calculatorType:"ConstantSidePacketCalculator",calculatorName:"ConstantSidePacketCalculator",fieldName:"int_value"}},modelComplexity:{type:1,graphOptionXref:{calculatorType:"ConstantSidePacketCalculator",calculatorName:"ConstantSidePacketCalculatorModelComplexity",fieldName:"int_value"},onChange:function(y){var A,F,G;return R(function(V){return V.h==1?(A=dd(y),F="third_party/mediapipe/modules/hand_landmark/"+A,b(V,va(v.h,A),2)):(G=V.i,v.h.overrideFile(F,G),V.return(!0))})}},minDetectionConfidence:{type:1,graphOptionXref:{calculatorType:"TensorsToDetectionsCalculator",calculatorName:"handlandmarktrackinggpu__palmdetectiongpu__TensorsToDetectionsCalculator",fieldName:"min_score_thresh"}},minTrackingConfidence:{type:1,graphOptionXref:{calculatorType:"ThresholdingCalculator",calculatorName:"handlandmarktrackinggpu__handlandmarkgpu__ThresholdingCalculator",fieldName:"threshold"}}}})}n=pd.prototype,n.close=function(){return this.h.close(),Promise.resolve()},n.onResults=function(f){this.h.onResults(f)},n.initialize=function(){var f=this;return R(function(v){return b(v,f.h.initialize(),0)})},n.reset=function(){this.h.reset()},n.send=function(f){var v=this;return R(function(y){return b(y,v.h.send(f),0)})},n.setOptions=function(f){this.h.setOptions(f)},J("Hands",pd),J("HAND_CONNECTIONS",[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[0,17],[17,18],[18,19],[19,20]]),J("VERSION","0.4.1675469240")}).call(Zc)),Zc}var nL=xb(),Qc={},jp;function yb(){return jp||(jp=1,(function(){function n(L){var R=0;return function(){return R<L.length?{done:!1,value:L[R++]}:{done:!0}}}var e=typeof Object.defineProperties=="function"?Object.defineProperty:function(L,R,U){return L==Array.prototype||L==Object.prototype||(L[R]=U.value),L};function t(L){L=[typeof globalThis=="object"&&globalThis,L,typeof window=="object"&&window,typeof self=="object"&&self,typeof Xs=="object"&&Xs];for(var R=0;R<L.length;++R){var U=L[R];if(U&&U.Math==Math)return U}throw Error("Cannot find global object")}var i=t(this);function r(L,R){if(R)e:{var U=i;L=L.split(".");for(var H=0;H<L.length-1;H++){var q=L[H];if(!(q in U))break e;U=U[q]}L=L[L.length-1],H=U[L],R=R(H),R!=H&&R!=null&&e(U,L,{configurable:!0,writable:!0,value:R})}}r("Symbol",function(L){function R(J){if(this instanceof R)throw new TypeError("Symbol is not a constructor");return new U(H+(J||"")+"_"+q++,J)}function U(J,O){this.g=J,e(this,"description",{configurable:!0,writable:!0,value:O})}if(L)return L;U.prototype.toString=function(){return this.g};var H="jscomp_symbol_"+(1e9*Math.random()>>>0)+"_",q=0;return R}),r("Symbol.iterator",function(L){if(L)return L;L=Symbol("Symbol.iterator");for(var R="Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".split(" "),U=0;U<R.length;U++){var H=i[R[U]];typeof H=="function"&&typeof H.prototype[L]!="function"&&e(H.prototype,L,{configurable:!0,writable:!0,value:function(){return s(n(this))}})}return L});function s(L){return L={next:L},L[Symbol.iterator]=function(){return this},L}function o(L){var R=typeof Symbol<"u"&&Symbol.iterator&&L[Symbol.iterator];return R?R.call(L):{next:n(L)}}function a(){this.i=!1,this.g=null,this.o=void 0,this.j=1,this.m=0,this.h=null}function l(L){if(L.i)throw new TypeError("Generator is already running");L.i=!0}a.prototype.l=function(L){this.o=L};function c(L,R){L.h={F:R,G:!0},L.j=L.m}a.prototype.return=function(L){this.h={return:L},this.j=this.m};function u(L){this.g=new a,this.h=L}function h(L,R){l(L.g);var U=L.g.g;return U?d(L,"return"in U?U.return:function(H){return{value:H,done:!0}},R,L.g.return):(L.g.return(R),g(L))}function d(L,R,U,H){try{var q=R.call(L.g.g,U);if(!(q instanceof Object))throw new TypeError("Iterator result "+q+" is not an object");if(!q.done)return L.g.i=!1,q;var J=q.value}catch(O){return L.g.g=null,c(L.g,O),g(L)}return L.g.g=null,H.call(L.g,J),g(L)}function g(L){for(;L.g.j;)try{var R=L.h(L.g);if(R)return L.g.i=!1,{value:R.value,done:!1}}catch(U){L.g.o=void 0,c(L.g,U)}if(L.g.i=!1,L.g.h){if(R=L.g.h,L.g.h=null,R.G)throw R.F;return{value:R.return,done:!0}}return{value:void 0,done:!0}}function p(L){this.next=function(R){return l(L.g),L.g.g?R=d(L,L.g.g.next,R,L.g.l):(L.g.l(R),R=g(L)),R},this.throw=function(R){return l(L.g),L.g.g?R=d(L,L.g.g.throw,R,L.g.l):(c(L.g,R),R=g(L)),R},this.return=function(R){return h(L,R)},this[Symbol.iterator]=function(){return this}}function x(L){function R(H){return L.next(H)}function U(H){return L.throw(H)}return new Promise(function(H,q){function J(O){O.done?H(O.value):Promise.resolve(O.value).then(R,U).then(J,q)}J(L.next())})}r("Promise",function(L){function R(O){this.h=0,this.i=void 0,this.g=[],this.o=!1;var j=this.j();try{O(j.resolve,j.reject)}catch(ie){j.reject(ie)}}function U(){this.g=null}function H(O){return O instanceof R?O:new R(function(j){j(O)})}if(L)return L;U.prototype.h=function(O){if(this.g==null){this.g=[];var j=this;this.i(function(){j.l()})}this.g.push(O)};var q=i.setTimeout;U.prototype.i=function(O){q(O,0)},U.prototype.l=function(){for(;this.g&&this.g.length;){var O=this.g;this.g=[];for(var j=0;j<O.length;++j){var ie=O[j];O[j]=null;try{ie()}catch(X){this.j(X)}}}this.g=null},U.prototype.j=function(O){this.i(function(){throw O})},R.prototype.j=function(){function O(X){return function(Y){ie||(ie=!0,X.call(j,Y))}}var j=this,ie=!1;return{resolve:O(this.A),reject:O(this.l)}},R.prototype.A=function(O){if(O===this)this.l(new TypeError("A Promise cannot resolve to itself"));else if(O instanceof R)this.C(O);else{e:switch(typeof O){case"object":var j=O!=null;break e;case"function":j=!0;break e;default:j=!1}j?this.v(O):this.m(O)}},R.prototype.v=function(O){var j=void 0;try{j=O.then}catch(ie){this.l(ie);return}typeof j=="function"?this.D(j,O):this.m(O)},R.prototype.l=function(O){this.u(2,O)},R.prototype.m=function(O){this.u(1,O)},R.prototype.u=function(O,j){if(this.h!=0)throw Error("Cannot settle("+O+", "+j+"): Promise already settled in state"+this.h);this.h=O,this.i=j,this.h===2&&this.B(),this.H()},R.prototype.B=function(){var O=this;q(function(){if(O.I()){var j=i.console;typeof j<"u"&&j.error(O.i)}},1)},R.prototype.I=function(){if(this.o)return!1;var O=i.CustomEvent,j=i.Event,ie=i.dispatchEvent;return typeof ie>"u"?!0:(typeof O=="function"?O=new O("unhandledrejection",{cancelable:!0}):typeof j=="function"?O=new j("unhandledrejection",{cancelable:!0}):(O=i.document.createEvent("CustomEvent"),O.initCustomEvent("unhandledrejection",!1,!0,O)),O.promise=this,O.reason=this.i,ie(O))},R.prototype.H=function(){if(this.g!=null){for(var O=0;O<this.g.length;++O)J.h(this.g[O]);this.g=null}};var J=new U;return R.prototype.C=function(O){var j=this.j();O.s(j.resolve,j.reject)},R.prototype.D=function(O,j){var ie=this.j();try{O.call(j,ie.resolve,ie.reject)}catch(X){ie.reject(X)}},R.prototype.then=function(O,j){function ie(fe,ye){return typeof fe=="function"?function(je){try{X(fe(je))}catch(tt){Y(tt)}}:ye}var X,Y,ne=new R(function(fe,ye){X=fe,Y=ye});return this.s(ie(O,X),ie(j,Y)),ne},R.prototype.catch=function(O){return this.then(void 0,O)},R.prototype.s=function(O,j){function ie(){switch(X.h){case 1:O(X.i);break;case 2:j(X.i);break;default:throw Error("Unexpected state: "+X.h)}}var X=this;this.g==null?J.h(ie):this.g.push(ie),this.o=!0},R.resolve=H,R.reject=function(O){return new R(function(j,ie){ie(O)})},R.race=function(O){return new R(function(j,ie){for(var X=o(O),Y=X.next();!Y.done;Y=X.next())H(Y.value).s(j,ie)})},R.all=function(O){var j=o(O),ie=j.next();return ie.done?H([]):new R(function(X,Y){function ne(je){return function(tt){fe[je]=tt,ye--,ye==0&&X(fe)}}var fe=[],ye=0;do fe.push(void 0),ye++,H(ie.value).s(ne(fe.length-1),Y),ie=j.next();while(!ie.done)})},R});var m=typeof Object.assign=="function"?Object.assign:function(L,R){for(var U=1;U<arguments.length;U++){var H=arguments[U];if(H)for(var q in H)Object.prototype.hasOwnProperty.call(H,q)&&(L[q]=H[q])}return L};r("Object.assign",function(L){return L||m});var _=this||self,M={facingMode:"user",width:640,height:480};function T(L,R){this.video=L,this.i=0,this.h=Object.assign(Object.assign({},M),R)}T.prototype.stop=function(){var L=this,R,U,H,q;return x(new p(new u(function(J){if(L.g){for(R=L.g.getTracks(),U=o(R),H=U.next();!H.done;H=U.next())q=H.value,q.stop();L.g=void 0}J.j=0})))},T.prototype.start=function(){var L=this,R;return x(new p(new u(function(U){return navigator.mediaDevices&&navigator.mediaDevices.getUserMedia||alert("No navigator.mediaDevices.getUserMedia exists."),R=L.h,U.return(navigator.mediaDevices.getUserMedia({video:{facingMode:R.facingMode,width:R.width,height:R.height}}).then(function(H){I(L,H)}).catch(function(H){var q="Failed to acquire camera feed: "+H;throw alert(q),H}))})))};function b(L){window.requestAnimationFrame(function(){D(L)})}function I(L,R){L.g=R,L.video.srcObject=R,L.video.onloadedmetadata=function(){L.video.play(),b(L)}}function D(L){var R=null;L.video.paused||L.video.currentTime===L.i||(L.i=L.video.currentTime,R=L.h.onFrame()),R?R.then(function(){b(L)}):b(L)}var B=["Camera"],E=_;B[0]in E||typeof E.execScript>"u"||E.execScript("var "+B[0]);for(var w;B.length&&(w=B.shift());)B.length||T===void 0?E[w]&&E[w]!==Object.prototype[w]?E=E[w]:E=E[w]={}:E[w]=T}).call(Qc)),Qc}var iL=yb(),eu={},Xp;function Sb(){return Xp||(Xp=1,(function(){function n(p){var x=0;return function(){return x<p.length?{done:!1,value:p[x++]}:{done:!0}}}var e=typeof Object.defineProperties=="function"?Object.defineProperty:function(p,x,m){return p==Array.prototype||p==Object.prototype||(p[x]=m.value),p};function t(p){p=[typeof globalThis=="object"&&globalThis,p,typeof window=="object"&&window,typeof self=="object"&&self,typeof Xs=="object"&&Xs];for(var x=0;x<p.length;++x){var m=p[x];if(m&&m.Math==Math)return m}throw Error("Cannot find global object")}var i=t(this);function r(p,x){if(x)e:{var m=i;p=p.split(".");for(var _=0;_<p.length-1;_++){var M=p[_];if(!(M in m))break e;m=m[M]}p=p[p.length-1],_=m[p],x=x(_),x!=_&&x!=null&&e(m,p,{configurable:!0,writable:!0,value:x})}}function s(p){var x=typeof Symbol<"u"&&Symbol.iterator&&p[Symbol.iterator];return x?x.call(p):{next:n(p)}}var o=typeof Object.assign=="function"?Object.assign:function(p,x){for(var m=1;m<arguments.length;m++){var _=arguments[m];if(_)for(var M in _)Object.prototype.hasOwnProperty.call(_,M)&&(p[M]=_[M])}return p};r("Object.assign",function(p){return p||o}),r("Array.prototype.fill",function(p){return p||function(x,m,_){var M=this.length||0;for(0>m&&(m=Math.max(0,M+m)),(_==null||_>M)&&(_=M),_=Number(_),0>_&&(_=Math.max(0,M+_)),m=Number(m||0);m<_;m++)this[m]=x;return this}});function a(p){return p||Array.prototype.fill}r("Int8Array.prototype.fill",a),r("Uint8Array.prototype.fill",a),r("Uint8ClampedArray.prototype.fill",a),r("Int16Array.prototype.fill",a),r("Uint16Array.prototype.fill",a),r("Int32Array.prototype.fill",a),r("Uint32Array.prototype.fill",a),r("Float32Array.prototype.fill",a),r("Float64Array.prototype.fill",a);var l=this||self;function c(p,x){p=p.split(".");var m=l;p[0]in m||typeof m.execScript>"u"||m.execScript("var "+p[0]);for(var _;p.length&&(_=p.shift());)p.length||x===void 0?m[_]&&m[_]!==Object.prototype[_]?m=m[_]:m=m[_]={}:m[_]=x}var u={color:"white",lineWidth:4,radius:6,visibilityMin:.5};function h(p){return p=p||{},Object.assign({},u,{fillColor:p.color},p)}function d(p,x){return p instanceof Function?p(x):p}function g(p,x,m){return Math.max(Math.min(x,m),Math.min(Math.max(x,m),p))}c("clamp",g),c("drawLandmarks",function(p,x,m){if(x){m=h(m),p.save();var _=p.canvas,M=0;x=s(x);for(var T=x.next();!T.done;T=x.next())if(T=T.value,T!==void 0&&(T.visibility===void 0||T.visibility>m.visibilityMin)){p.fillStyle=d(m.fillColor,{index:M,from:T}),p.strokeStyle=d(m.color,{index:M,from:T}),p.lineWidth=d(m.lineWidth,{index:M,from:T});var b=new Path2D;b.arc(T.x*_.width,T.y*_.height,d(m.radius,{index:M,from:T}),0,2*Math.PI),p.fill(b),p.stroke(b),++M}p.restore()}}),c("drawConnectors",function(p,x,m,_){if(x&&m){_=h(_),p.save();var M=p.canvas,T=0;m=s(m);for(var b=m.next();!b.done;b=m.next()){var I=b.value;p.beginPath(),b=x[I[0]],I=x[I[1]],b&&I&&(b.visibility===void 0||b.visibility>_.visibilityMin)&&(I.visibility===void 0||I.visibility>_.visibilityMin)&&(p.strokeStyle=d(_.color,{index:T,from:b,to:I}),p.lineWidth=d(_.lineWidth,{index:T,from:b,to:I}),p.moveTo(b.x*M.width,b.y*M.height),p.lineTo(I.x*M.width,I.y*M.height)),++T,p.stroke()}p.restore()}}),c("drawRectangle",function(p,x,m){m=h(m),p.save();var _=p.canvas;p.beginPath(),p.lineWidth=d(m.lineWidth,{}),p.strokeStyle=d(m.color,{}),p.fillStyle=d(m.fillColor,{}),p.translate(x.xCenter*_.width,x.yCenter*_.height),p.rotate(x.rotation*Math.PI/180),p.rect(-x.width/2*_.width,-x.height/2*_.height,x.width*_.width,x.height*_.height),p.translate(-x.xCenter*_.width,-x.yCenter*_.height),p.stroke(),p.fill(),p.restore()}),c("lerp",function(p,x,m,_,M){return g(_*(1-(p-x)/(m-x))+M*(1-(m-p)/(m-x)),_,M)})}).call(eu)),eu}var rL=Sb();/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Ph="183",Mb=0,qp=1,bb=2,hl=1,Eb=2,Do=3,fr=0,On=1,Pi=2,or=0,Fs=1,Kp=2,$p=3,Yp=4,Tb=5,Jr=100,Ab=101,wb=102,Rb=103,Cb=104,Pb=200,Lb=201,Ib=202,Db=203,lf=204,cf=205,Nb=206,Ub=207,Ob=208,Fb=209,Bb=210,kb=211,Vb=212,Hb=213,zb=214,uf=0,ff=1,hf=2,qs=3,df=4,pf=5,mf=6,gf=7,h0=0,Gb=1,Wb=2,Ni=0,d0=1,p0=2,m0=3,g0=4,_0=5,v0=6,x0=7,Jp="attached",jb="detached",y0=300,cs=301,Ks=302,tu=303,nu=304,ec=306,$s=1e3,Li=1001,Cl=1002,nn=1003,S0=1004,No=1005,jt=1006,dl=1007,rr=1008,Hn=1009,M0=1010,b0=1011,Jo=1012,Lh=1013,Fi=1014,Zn=1015,hr=1016,Ih=1017,Dh=1018,Zo=1020,E0=35902,T0=35899,A0=1021,w0=1022,Qn=1023,dr=1026,es=1027,Nh=1028,Uh=1029,Ys=1030,Oh=1031,Fh=1033,pl=33776,ml=33777,gl=33778,_l=33779,_f=35840,vf=35841,xf=35842,yf=35843,Sf=36196,Mf=37492,bf=37496,Ef=37488,Tf=37489,Af=37490,wf=37491,Rf=37808,Cf=37809,Pf=37810,Lf=37811,If=37812,Df=37813,Nf=37814,Uf=37815,Of=37816,Ff=37817,Bf=37818,kf=37819,Vf=37820,Hf=37821,zf=36492,Gf=36494,Wf=36495,jf=36283,Xf=36284,qf=36285,Kf=36286,Qo=2300,ea=2301,iu=2302,Zp=2303,Qp=2400,em=2401,tm=2402,Xb=2500,qb=0,R0=1,$f=2,Kb=3200,C0=0,$b=1,Lr="",Yt="srgb",bn="srgb-linear",Pl="linear",It="srgb",gs=7680,nm=519,Yb=512,Jb=513,Zb=514,Bh=515,Qb=516,eE=517,kh=518,tE=519,Yf=35044,im="300 es",Ii=2e3,ta=2001;function nE(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function iE(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function na(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function rE(){const n=na("canvas");return n.style.display="block",n}const rm={};function Ll(...n){const e="THREE."+n.shift()}function P0(n){const e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function et(...n){n=P0(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace}}function ot(...n){n=P0(n);const e="THREE."+n.shift();{const t=n[0];t&&t.isStackTrace}}function Il(...n){const e=n.join(" ");e in rm||(rm[e]=!0,et(...n))}function sE(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}const oE={[uf]:ff,[hf]:mf,[df]:gf,[qs]:pf,[ff]:uf,[mf]:hf,[gf]:df,[pf]:qs};class ro{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){const i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){const i=this._listeners;if(i===void 0)return;const r=i[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const i=t[e.type];if(i!==void 0){e.target=this;const r=i.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,e);e.target=null}}}const gn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let sm=1234567;const Bs=Math.PI/180,Js=180/Math.PI;function fi(){const n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(gn[n&255]+gn[n>>8&255]+gn[n>>16&255]+gn[n>>24&255]+"-"+gn[e&255]+gn[e>>8&255]+"-"+gn[e>>16&15|64]+gn[e>>24&255]+"-"+gn[t&63|128]+gn[t>>8&255]+"-"+gn[t>>16&255]+gn[t>>24&255]+gn[i&255]+gn[i>>8&255]+gn[i>>16&255]+gn[i>>24&255]).toLowerCase()}function vt(n,e,t){return Math.max(e,Math.min(t,n))}function Vh(n,e){return(n%e+e)%e}function aE(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function lE(n,e,t){return n!==e?(t-n)/(e-n):0}function Go(n,e,t){return(1-t)*n+t*e}function cE(n,e,t,i){return Go(n,e,1-Math.exp(-t*i))}function uE(n,e=1){return e-Math.abs(Vh(n,e*2)-e)}function fE(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function hE(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function dE(n,e){return n+Math.floor(Math.random()*(e-n+1))}function pE(n,e){return n+Math.random()*(e-n)}function mE(n){return n*(.5-Math.random())}function gE(n){n!==void 0&&(sm=n);let e=sm+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function _E(n){return n*Bs}function vE(n){return n*Js}function xE(n){return(n&n-1)===0&&n!==0}function yE(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function SE(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function ME(n,e,t,i,r){const s=Math.cos,o=Math.sin,a=s(t/2),l=o(t/2),c=s((e+i)/2),u=o((e+i)/2),h=s((e-i)/2),d=o((e-i)/2),g=s((i-e)/2),p=o((i-e)/2);switch(r){case"XYX":n.set(a*u,l*h,l*d,a*c);break;case"YZY":n.set(l*d,a*u,l*h,a*c);break;case"ZXZ":n.set(l*h,l*d,a*u,a*c);break;case"XZX":n.set(a*u,l*p,l*g,a*c);break;case"YXY":n.set(l*g,a*u,l*p,a*c);break;case"ZYZ":n.set(l*p,l*g,a*u,a*c);break;default:et("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function ci(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("Invalid component type.")}}function Dt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("Invalid component type.")}}const bE={DEG2RAD:Bs,RAD2DEG:Js,generateUUID:fi,clamp:vt,euclideanModulo:Vh,mapLinear:aE,inverseLerp:lE,lerp:Go,damp:cE,pingpong:uE,smoothstep:fE,smootherstep:hE,randInt:dE,randFloat:pE,randFloatSpread:mE,seededRandom:gE,degToRad:_E,radToDeg:vE,isPowerOfTwo:xE,ceilPowerOfTwo:yE,floorPowerOfTwo:SE,setQuaternionFromProperEuler:ME,normalize:Dt,denormalize:ci};class St{constructor(e=0,t=0){St.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=vt(this.x,e.x,t.x),this.y=vt(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=vt(this.x,e,t),this.y=vt(this.y,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(vt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(vt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,o=this.y-e.y;return this.x=s*i-o*r+e.x,this.y=s*r+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class mr{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,o,a){let l=i[r+0],c=i[r+1],u=i[r+2],h=i[r+3],d=s[o+0],g=s[o+1],p=s[o+2],x=s[o+3];if(h!==x||l!==d||c!==g||u!==p){let m=l*d+c*g+u*p+h*x;m<0&&(d=-d,g=-g,p=-p,x=-x,m=-m);let _=1-a;if(m<.9995){const M=Math.acos(m),T=Math.sin(M);_=Math.sin(_*M)/T,a=Math.sin(a*M)/T,l=l*_+d*a,c=c*_+g*a,u=u*_+p*a,h=h*_+x*a}else{l=l*_+d*a,c=c*_+g*a,u=u*_+p*a,h=h*_+x*a;const M=1/Math.sqrt(l*l+c*c+u*u+h*h);l*=M,c*=M,u*=M,h*=M}}e[t]=l,e[t+1]=c,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,i,r,s,o){const a=i[r],l=i[r+1],c=i[r+2],u=i[r+3],h=s[o],d=s[o+1],g=s[o+2],p=s[o+3];return e[t]=a*p+u*h+l*g-c*d,e[t+1]=l*p+u*d+c*h-a*g,e[t+2]=c*p+u*g+a*d-l*h,e[t+3]=u*p-a*h-l*d-c*g,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const i=e._x,r=e._y,s=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(i/2),u=a(r/2),h=a(s/2),d=l(i/2),g=l(r/2),p=l(s/2);switch(o){case"XYZ":this._x=d*u*h+c*g*p,this._y=c*g*h-d*u*p,this._z=c*u*p+d*g*h,this._w=c*u*h-d*g*p;break;case"YXZ":this._x=d*u*h+c*g*p,this._y=c*g*h-d*u*p,this._z=c*u*p-d*g*h,this._w=c*u*h+d*g*p;break;case"ZXY":this._x=d*u*h-c*g*p,this._y=c*g*h+d*u*p,this._z=c*u*p+d*g*h,this._w=c*u*h-d*g*p;break;case"ZYX":this._x=d*u*h-c*g*p,this._y=c*g*h+d*u*p,this._z=c*u*p-d*g*h,this._w=c*u*h+d*g*p;break;case"YZX":this._x=d*u*h+c*g*p,this._y=c*g*h+d*u*p,this._z=c*u*p-d*g*h,this._w=c*u*h-d*g*p;break;case"XZY":this._x=d*u*h-c*g*p,this._y=c*g*h-d*u*p,this._z=c*u*p+d*g*h,this._w=c*u*h+d*g*p;break;default:et("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,i=t[0],r=t[4],s=t[8],o=t[1],a=t[5],l=t[9],c=t[2],u=t[6],h=t[10],d=i+a+h;if(d>0){const g=.5/Math.sqrt(d+1);this._w=.25/g,this._x=(u-l)*g,this._y=(s-c)*g,this._z=(o-r)*g}else if(i>a&&i>h){const g=2*Math.sqrt(1+i-a-h);this._w=(u-l)/g,this._x=.25*g,this._y=(r+o)/g,this._z=(s+c)/g}else if(a>h){const g=2*Math.sqrt(1+a-i-h);this._w=(s-c)/g,this._x=(r+o)/g,this._y=.25*g,this._z=(l+u)/g}else{const g=2*Math.sqrt(1+h-i-a);this._w=(o-r)/g,this._x=(s+c)/g,this._y=(l+u)/g,this._z=.25*g}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(vt(this.dot(e),-1,1)))}rotateTowards(e,t){const i=this.angleTo(e);if(i===0)return this;const r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const i=e._x,r=e._y,s=e._z,o=e._w,a=t._x,l=t._y,c=t._z,u=t._w;return this._x=i*u+o*a+r*c-s*l,this._y=r*u+o*l+s*a-i*c,this._z=s*u+o*c+i*l-r*a,this._w=o*u-i*a-r*l-s*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,s=e._z,o=e._w,a=this.dot(e);a<0&&(i=-i,r=-r,s=-s,o=-o,a=-a);let l=1-t;if(a<.9995){const c=Math.acos(a),u=Math.sin(c);l=Math.sin(l*c)/u,t=Math.sin(t*c)/u,this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+o*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+r*t,this._z=this._z*l+s*t,this._w=this._w*l+o*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class ee{constructor(e=0,t=0,i=0){ee.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(om.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(om.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=e.elements,o=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*o,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*o,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*o,this}applyQuaternion(e){const t=this.x,i=this.y,r=this.z,s=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*r-a*i),u=2*(a*t-s*r),h=2*(s*i-o*t);return this.x=t+l*c+o*h-a*u,this.y=i+l*u+a*c-s*h,this.z=r+l*h+s*u-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=vt(this.x,e.x,t.x),this.y=vt(this.y,e.y,t.y),this.z=vt(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=vt(this.x,e,t),this.y=vt(this.y,e,t),this.z=vt(this.z,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(vt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const i=e.x,r=e.y,s=e.z,o=t.x,a=t.y,l=t.z;return this.x=r*l-s*a,this.y=s*o-i*l,this.z=i*a-r*o,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return ru.copy(this).projectOnVector(e),this.sub(ru)}reflect(e){return this.sub(ru.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const i=this.dot(e)/t;return Math.acos(vt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){const r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const ru=new ee,om=new mr;class dt{constructor(e,t,i,r,s,o,a,l,c){dt.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,o,a,l,c)}set(e,t,i,r,s,o,a,l,c){const u=this.elements;return u[0]=e,u[1]=r,u[2]=a,u[3]=t,u[4]=s,u[5]=l,u[6]=i,u[7]=o,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],u=i[4],h=i[7],d=i[2],g=i[5],p=i[8],x=r[0],m=r[3],_=r[6],M=r[1],T=r[4],b=r[7],I=r[2],D=r[5],B=r[8];return s[0]=o*x+a*M+l*I,s[3]=o*m+a*T+l*D,s[6]=o*_+a*b+l*B,s[1]=c*x+u*M+h*I,s[4]=c*m+u*T+h*D,s[7]=c*_+u*b+h*B,s[2]=d*x+g*M+p*I,s[5]=d*m+g*T+p*D,s[8]=d*_+g*b+p*B,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8];return t*o*u-t*a*c-i*s*u+i*a*l+r*s*c-r*o*l}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],h=u*o-a*c,d=a*l-u*s,g=c*s-o*l,p=t*h+i*d+r*g;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);const x=1/p;return e[0]=h*x,e[1]=(r*c-u*i)*x,e[2]=(a*i-r*o)*x,e[3]=d*x,e[4]=(u*t-r*l)*x,e[5]=(r*s-a*t)*x,e[6]=g*x,e[7]=(i*l-c*t)*x,e[8]=(o*t-i*s)*x,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,o,a){const l=Math.cos(s),c=Math.sin(s);return this.set(i*l,i*c,-i*(l*o+c*a)+o+e,-r*c,r*l,-r*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(su.makeScale(e,t)),this}rotate(e){return this.premultiply(su.makeRotation(-e)),this}translate(e,t){return this.premultiply(su.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const su=new dt,am=new dt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),lm=new dt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function EE(){const n={enabled:!0,workingColorSpace:bn,spaces:{},convert:function(r,s,o){return this.enabled===!1||s===o||!s||!o||(this.spaces[s].transfer===It&&(r.r=ar(r.r),r.g=ar(r.g),r.b=ar(r.b)),this.spaces[s].primaries!==this.spaces[o].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===It&&(r.r=ks(r.r),r.g=ks(r.g),r.b=ks(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Lr?Pl:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,o){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Il("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Il("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[bn]:{primaries:e,whitePoint:i,transfer:Pl,toXYZ:am,fromXYZ:lm,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Yt},outputColorSpaceConfig:{drawingBufferColorSpace:Yt}},[Yt]:{primaries:e,whitePoint:i,transfer:It,toXYZ:am,fromXYZ:lm,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Yt}}}),n}const yt=EE();function ar(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function ks(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}let _s;class TE{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{_s===void 0&&(_s=na("canvas")),_s.width=e.width,_s.height=e.height;const r=_s.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=_s}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=na("canvas");t.width=e.width,t.height=e.height;const i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);const r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=ar(s[o]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(ar(t[i]/255)*255):t[i]=ar(t[i]);return{data:t,width:e.width,height:e.height}}else return et("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let AE=0;class Hh{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:AE++}),this.uuid=fi(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayHeight,t.displayWidth,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,a=r.length;o<a;o++)r[o].isDataTexture?s.push(ou(r[o].image)):s.push(ou(r[o]))}else s=ou(r);i.url=s}return t||(e.images[this.uuid]=i),i}}function ou(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?TE.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(et("Texture: Unable to serialize Texture."),{})}let wE=0;const au=new ee;class Jt extends ro{constructor(e=Jt.DEFAULT_IMAGE,t=Jt.DEFAULT_MAPPING,i=Li,r=Li,s=jt,o=rr,a=Qn,l=Hn,c=Jt.DEFAULT_ANISOTROPY,u=Lr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:wE++}),this.uuid=fi(),this.name="",this.source=new Hh(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new St(0,0),this.repeat=new St(1,1),this.center=new St(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new dt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0}get width(){return this.source.getSize(au).x}get height(){return this.source.getSize(au).y}get depth(){return this.source.getSize(au).z}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const i=e[t];if(i===void 0){et(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){et(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==y0)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case $s:e.x=e.x-Math.floor(e.x);break;case Li:e.x=e.x<0?0:1;break;case Cl:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case $s:e.y=e.y-Math.floor(e.y);break;case Li:e.y=e.y<0?0:1;break;case Cl:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Jt.DEFAULT_IMAGE=null;Jt.DEFAULT_MAPPING=y0;Jt.DEFAULT_ANISOTROPY=1;class Vt{constructor(e=0,t=0,i=0,r=1){Vt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,i=this.y,r=this.z,s=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*r+o[12]*s,this.y=o[1]*t+o[5]*i+o[9]*r+o[13]*s,this.z=o[2]*t+o[6]*i+o[10]*r+o[14]*s,this.w=o[3]*t+o[7]*i+o[11]*r+o[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s;const l=e.elements,c=l[0],u=l[4],h=l[8],d=l[1],g=l[5],p=l[9],x=l[2],m=l[6],_=l[10];if(Math.abs(u-d)<.01&&Math.abs(h-x)<.01&&Math.abs(p-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+x)<.1&&Math.abs(p+m)<.1&&Math.abs(c+g+_-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const T=(c+1)/2,b=(g+1)/2,I=(_+1)/2,D=(u+d)/4,B=(h+x)/4,E=(p+m)/4;return T>b&&T>I?T<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(T),r=D/i,s=B/i):b>I?b<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(b),i=D/r,s=E/r):I<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(I),i=B/s,r=E/s),this.set(i,r,s,t),this}let M=Math.sqrt((m-p)*(m-p)+(h-x)*(h-x)+(d-u)*(d-u));return Math.abs(M)<.001&&(M=1),this.x=(m-p)/M,this.y=(h-x)/M,this.z=(d-u)/M,this.w=Math.acos((c+g+_-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=vt(this.x,e.x,t.x),this.y=vt(this.y,e.y,t.y),this.z=vt(this.z,e.z,t.z),this.w=vt(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=vt(this.x,e,t),this.y=vt(this.y,e,t),this.z=vt(this.z,e,t),this.w=vt(this.w,e,t),this}clampLength(e,t){const i=this.length();return this.divideScalar(i||1).multiplyScalar(vt(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class RE extends ro{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:jt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new Vt(0,0,e,t),this.scissorTest=!1,this.viewport=new Vt(0,0,e,t),this.textures=[];const r={width:e,height:t,depth:i.depth},s=new Jt(r),o=i.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview}_setTextureOptions(e={}){const t={minFilter:jt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new Hh(r)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Ui extends RE{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}}class L0 extends Jt{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=nn,this.minFilter=nn,this.wrapR=Li,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class CE extends Jt{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=nn,this.minFilter=nn,this.wrapR=Li,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class mt{constructor(e,t,i,r,s,o,a,l,c,u,h,d,g,p,x,m){mt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,o,a,l,c,u,h,d,g,p,x,m)}set(e,t,i,r,s,o,a,l,c,u,h,d,g,p,x,m){const _=this.elements;return _[0]=e,_[4]=t,_[8]=i,_[12]=r,_[1]=s,_[5]=o,_[9]=a,_[13]=l,_[2]=c,_[6]=u,_[10]=h,_[14]=d,_[3]=g,_[7]=p,_[11]=x,_[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new mt().fromArray(this.elements)}copy(e){const t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){const t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinant()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinant()===0)return this.identity();const t=this.elements,i=e.elements,r=1/vs.setFromMatrixColumn(e,0).length(),s=1/vs.setFromMatrixColumn(e,1).length(),o=1/vs.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,i=e.x,r=e.y,s=e.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(r),c=Math.sin(r),u=Math.cos(s),h=Math.sin(s);if(e.order==="XYZ"){const d=o*u,g=o*h,p=a*u,x=a*h;t[0]=l*u,t[4]=-l*h,t[8]=c,t[1]=g+p*c,t[5]=d-x*c,t[9]=-a*l,t[2]=x-d*c,t[6]=p+g*c,t[10]=o*l}else if(e.order==="YXZ"){const d=l*u,g=l*h,p=c*u,x=c*h;t[0]=d+x*a,t[4]=p*a-g,t[8]=o*c,t[1]=o*h,t[5]=o*u,t[9]=-a,t[2]=g*a-p,t[6]=x+d*a,t[10]=o*l}else if(e.order==="ZXY"){const d=l*u,g=l*h,p=c*u,x=c*h;t[0]=d-x*a,t[4]=-o*h,t[8]=p+g*a,t[1]=g+p*a,t[5]=o*u,t[9]=x-d*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){const d=o*u,g=o*h,p=a*u,x=a*h;t[0]=l*u,t[4]=p*c-g,t[8]=d*c+x,t[1]=l*h,t[5]=x*c+d,t[9]=g*c-p,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){const d=o*l,g=o*c,p=a*l,x=a*c;t[0]=l*u,t[4]=x-d*h,t[8]=p*h+g,t[1]=h,t[5]=o*u,t[9]=-a*u,t[2]=-c*u,t[6]=g*h+p,t[10]=d-x*h}else if(e.order==="XZY"){const d=o*l,g=o*c,p=a*l,x=a*c;t[0]=l*u,t[4]=-h,t[8]=c*u,t[1]=d*h+x,t[5]=o*u,t[9]=g*h-p,t[2]=p*h-g,t[6]=a*u,t[10]=x*h+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(PE,e,LE)}lookAt(e,t,i){const r=this.elements;return kn.subVectors(e,t),kn.lengthSq()===0&&(kn.z=1),kn.normalize(),Mr.crossVectors(i,kn),Mr.lengthSq()===0&&(Math.abs(i.z)===1?kn.x+=1e-4:kn.z+=1e-4,kn.normalize(),Mr.crossVectors(i,kn)),Mr.normalize(),Aa.crossVectors(kn,Mr),r[0]=Mr.x,r[4]=Aa.x,r[8]=kn.x,r[1]=Mr.y,r[5]=Aa.y,r[9]=kn.y,r[2]=Mr.z,r[6]=Aa.z,r[10]=kn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const i=e.elements,r=t.elements,s=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],u=i[1],h=i[5],d=i[9],g=i[13],p=i[2],x=i[6],m=i[10],_=i[14],M=i[3],T=i[7],b=i[11],I=i[15],D=r[0],B=r[4],E=r[8],w=r[12],L=r[1],R=r[5],U=r[9],H=r[13],q=r[2],J=r[6],O=r[10],j=r[14],ie=r[3],X=r[7],Y=r[11],ne=r[15];return s[0]=o*D+a*L+l*q+c*ie,s[4]=o*B+a*R+l*J+c*X,s[8]=o*E+a*U+l*O+c*Y,s[12]=o*w+a*H+l*j+c*ne,s[1]=u*D+h*L+d*q+g*ie,s[5]=u*B+h*R+d*J+g*X,s[9]=u*E+h*U+d*O+g*Y,s[13]=u*w+h*H+d*j+g*ne,s[2]=p*D+x*L+m*q+_*ie,s[6]=p*B+x*R+m*J+_*X,s[10]=p*E+x*U+m*O+_*Y,s[14]=p*w+x*H+m*j+_*ne,s[3]=M*D+T*L+b*q+I*ie,s[7]=M*B+T*R+b*J+I*X,s[11]=M*E+T*U+b*O+I*Y,s[15]=M*w+T*H+b*j+I*ne,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],o=e[1],a=e[5],l=e[9],c=e[13],u=e[2],h=e[6],d=e[10],g=e[14],p=e[3],x=e[7],m=e[11],_=e[15],M=l*g-c*d,T=a*g-c*h,b=a*d-l*h,I=o*g-c*u,D=o*d-l*u,B=o*h-a*u;return t*(x*M-m*T+_*b)-i*(p*M-m*I+_*D)+r*(p*T-x*I+_*B)-s*(p*b-x*D+m*B)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){const e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],l=e[6],c=e[7],u=e[8],h=e[9],d=e[10],g=e[11],p=e[12],x=e[13],m=e[14],_=e[15],M=t*a-i*o,T=t*l-r*o,b=t*c-s*o,I=i*l-r*a,D=i*c-s*a,B=r*c-s*l,E=u*x-h*p,w=u*m-d*p,L=u*_-g*p,R=h*m-d*x,U=h*_-g*x,H=d*_-g*m,q=M*H-T*U+b*R+I*L-D*w+B*E;if(q===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const J=1/q;return e[0]=(a*H-l*U+c*R)*J,e[1]=(r*U-i*H-s*R)*J,e[2]=(x*B-m*D+_*I)*J,e[3]=(d*D-h*B-g*I)*J,e[4]=(l*L-o*H-c*w)*J,e[5]=(t*H-r*L+s*w)*J,e[6]=(m*b-p*B-_*T)*J,e[7]=(u*B-d*b+g*T)*J,e[8]=(o*U-a*L+c*E)*J,e[9]=(i*L-t*U-s*E)*J,e[10]=(p*D-x*b+_*M)*J,e[11]=(h*b-u*D-g*M)*J,e[12]=(a*w-o*R-l*E)*J,e[13]=(t*R-i*w+r*E)*J,e[14]=(x*T-p*I-m*M)*J,e[15]=(u*I-h*T+d*M)*J,this}scale(e){const t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const i=Math.cos(t),r=Math.sin(t),s=1-i,o=e.x,a=e.y,l=e.z,c=s*o,u=s*a;return this.set(c*o+i,c*a-r*l,c*l+r*a,0,c*a+r*l,u*a+i,u*l-r*o,0,c*l-r*a,u*l+r*o,s*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,o){return this.set(1,i,s,0,e,1,o,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){const r=this.elements,s=t._x,o=t._y,a=t._z,l=t._w,c=s+s,u=o+o,h=a+a,d=s*c,g=s*u,p=s*h,x=o*u,m=o*h,_=a*h,M=l*c,T=l*u,b=l*h,I=i.x,D=i.y,B=i.z;return r[0]=(1-(x+_))*I,r[1]=(g+b)*I,r[2]=(p-T)*I,r[3]=0,r[4]=(g-b)*D,r[5]=(1-(d+_))*D,r[6]=(m+M)*D,r[7]=0,r[8]=(p+T)*B,r[9]=(m-M)*B,r[10]=(1-(d+x))*B,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const s=this.determinant();if(s===0)return i.set(1,1,1),t.identity(),this;let o=vs.set(r[0],r[1],r[2]).length();const a=vs.set(r[4],r[5],r[6]).length(),l=vs.set(r[8],r[9],r[10]).length();s<0&&(o=-o),oi.copy(this);const c=1/o,u=1/a,h=1/l;return oi.elements[0]*=c,oi.elements[1]*=c,oi.elements[2]*=c,oi.elements[4]*=u,oi.elements[5]*=u,oi.elements[6]*=u,oi.elements[8]*=h,oi.elements[9]*=h,oi.elements[10]*=h,t.setFromRotationMatrix(oi),i.x=o,i.y=a,i.z=l,this}makePerspective(e,t,i,r,s,o,a=Ii,l=!1){const c=this.elements,u=2*s/(t-e),h=2*s/(i-r),d=(t+e)/(t-e),g=(i+r)/(i-r);let p,x;if(l)p=s/(o-s),x=o*s/(o-s);else if(a===Ii)p=-(o+s)/(o-s),x=-2*o*s/(o-s);else if(a===ta)p=-o/(o-s),x=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=d,c[12]=0,c[1]=0,c[5]=h,c[9]=g,c[13]=0,c[2]=0,c[6]=0,c[10]=p,c[14]=x,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,r,s,o,a=Ii,l=!1){const c=this.elements,u=2/(t-e),h=2/(i-r),d=-(t+e)/(t-e),g=-(i+r)/(i-r);let p,x;if(l)p=1/(o-s),x=o/(o-s);else if(a===Ii)p=-2/(o-s),x=-(o+s)/(o-s);else if(a===ta)p=-1/(o-s),x=-s/(o-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=u,c[4]=0,c[8]=0,c[12]=d,c[1]=0,c[5]=h,c[9]=0,c[13]=g,c[2]=0,c[6]=0,c[10]=p,c[14]=x,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){const i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}}const vs=new ee,oi=new mt,PE=new ee(0,0,0),LE=new ee(1,1,1),Mr=new ee,Aa=new ee,kn=new ee,cm=new mt,um=new mr;class Bi{constructor(e=0,t=0,i=0,r=Bi.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){const r=e.elements,s=r[0],o=r[4],a=r[8],l=r[1],c=r[5],u=r[9],h=r[2],d=r[6],g=r[10];switch(t){case"XYZ":this._y=Math.asin(vt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,g),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-vt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,g),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-h,s),this._z=0);break;case"ZXY":this._x=Math.asin(vt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,g),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,s));break;case"ZYX":this._y=Math.asin(-vt(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,g),this._z=Math.atan2(l,s)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(vt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-h,s)):(this._x=0,this._y=Math.atan2(a,g));break;case"XZY":this._z=Math.asin(-vt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-u,g),this._y=0);break;default:et("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return cm.makeRotationFromQuaternion(e),this.setFromRotationMatrix(cm,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return um.setFromEuler(this),this.setFromQuaternion(um,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Bi.DEFAULT_ORDER="XYZ";class I0{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let IE=0;const fm=new ee,xs=new mr,qi=new mt,wa=new ee,Mo=new ee,DE=new ee,NE=new mr,hm=new ee(1,0,0),dm=new ee(0,1,0),pm=new ee(0,0,1),mm={type:"added"},UE={type:"removed"},ys={type:"childadded",child:null},lu={type:"childremoved",child:null};class Gt extends ro{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:IE++}),this.uuid=fi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Gt.DEFAULT_UP.clone();const e=new ee,t=new Bi,i=new mr,r=new ee(1,1,1);function s(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new mt},normalMatrix:{value:new dt}}),this.matrix=new mt,this.matrixWorld=new mt,this.matrixAutoUpdate=Gt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Gt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new I0,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return xs.setFromAxisAngle(e,t),this.quaternion.multiply(xs),this}rotateOnWorldAxis(e,t){return xs.setFromAxisAngle(e,t),this.quaternion.premultiply(xs),this}rotateX(e){return this.rotateOnAxis(hm,e)}rotateY(e){return this.rotateOnAxis(dm,e)}rotateZ(e){return this.rotateOnAxis(pm,e)}translateOnAxis(e,t){return fm.copy(e).applyQuaternion(this.quaternion),this.position.add(fm.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(hm,e)}translateY(e){return this.translateOnAxis(dm,e)}translateZ(e){return this.translateOnAxis(pm,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(qi.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?wa.copy(e):wa.set(e,t,i);const r=this.parent;this.updateWorldMatrix(!0,!1),Mo.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?qi.lookAt(Mo,wa,this.up):qi.lookAt(wa,Mo,this.up),this.quaternion.setFromRotationMatrix(qi),r&&(qi.extractRotation(r.matrixWorld),xs.setFromRotationMatrix(qi),this.quaternion.premultiply(xs.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(ot("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(mm),ys.child=e,this.dispatchEvent(ys),ys.child=null):ot("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(UE),lu.child=e,this.dispatchEvent(lu),lu.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),qi.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),qi.multiply(e.parent.matrixWorld)),e.applyMatrix4(qi),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(mm),ys.child=e,this.dispatchEvent(ys),ys.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){const o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Mo,e,DE),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Mo,NE,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*i-s[8]*r,s[13]+=i-s[1]*t-s[5]*i-s[9]*r,s[14]+=r-s[2]*t-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t){const i=this.parent;if(e===!0&&i!==null&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,this.name!==""&&(r.name=this.name),this.castShadow===!0&&(r.castShadow=!0),this.receiveShadow===!0&&(r.receiveShadow=!0),this.visible===!1&&(r.visible=!1),this.frustumCulled===!1&&(r.frustumCulled=!1),this.renderOrder!==0&&(r.renderOrder=this.renderOrder),this.static!==!1&&(r.static=this.static),Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.matrixAutoUpdate===!1&&(r.matrixAutoUpdate=!1),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(a=>({...a})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const l=a.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){const h=l[c];s(e.shapes,h)}else s(e.shapes,l)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(s(e.materials,this.material[l]));r.material=a}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){const l=this.animations[a];r.animations.push(s(e.animations,l))}}if(t){const a=o(e.geometries),l=o(e.materials),c=o(e.textures),u=o(e.images),h=o(e.shapes),d=o(e.skeletons),g=o(e.animations),p=o(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),h.length>0&&(i.shapes=h),d.length>0&&(i.skeletons=d),g.length>0&&(i.animations=g),p.length>0&&(i.nodes=p)}return i.object=r,i;function o(a){const l=[];for(const c in a){const u=a[c];delete u.metadata,l.push(u)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),e.pivot!==null&&(this.pivot=e.pivot.clone()),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){const r=e.children[i];this.add(r.clone())}return this}}Gt.DEFAULT_UP=new ee(0,1,0);Gt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Gt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class ts extends Gt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const OE={type:"move"};class cu{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ts,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ts,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new ee,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new ee),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ts,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new ee,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new ee),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,o=null;const a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(const x of e.hand.values()){const m=t.getJointPose(x,i),_=this._getHandJoint(c,x);m!==null&&(_.matrix.fromArray(m.transform.matrix),_.matrix.decompose(_.position,_.rotation,_.scale),_.matrixWorldNeedsUpdate=!0,_.jointRadius=m.radius),_.visible=m!==null}const u=c.joints["index-finger-tip"],h=c.joints["thumb-tip"],d=u.position.distanceTo(h.position),g=.02,p=.005;c.inputState.pinching&&d>g+p?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=g-p&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(l.matrix.fromArray(s.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,s.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(s.linearVelocity)):l.hasLinearVelocity=!1,s.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(s.angularVelocity)):l.hasAngularVelocity=!1));a!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(OE)))}return a!==null&&(a.visible=r!==null),l!==null&&(l.visible=s!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const i=new ts;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}}const D0={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},br={h:0,s:0,l:0},Ra={h:0,s:0,l:0};function uu(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}class ft{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Yt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,yt.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=yt.workingColorSpace){return this.r=e,this.g=t,this.b=i,yt.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=yt.workingColorSpace){if(e=Vh(e,1),t=vt(t,0,1),i=vt(i,0,1),t===0)this.r=this.g=this.b=i;else{const s=i<=.5?i*(1+t):i+t-i*t,o=2*i-s;this.r=uu(o,s,e+1/3),this.g=uu(o,s,e),this.b=uu(o,s,e-1/3)}return yt.colorSpaceToWorking(this,r),this}setStyle(e,t=Yt){function i(s){s!==void 0&&parseFloat(s)<1&&et("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const o=r[1],a=r[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:et("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(s,16),t);et("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Yt){const i=D0[e.toLowerCase()];return i!==void 0?this.setHex(i,t):et("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=ar(e.r),this.g=ar(e.g),this.b=ar(e.b),this}copyLinearToSRGB(e){return this.r=ks(e.r),this.g=ks(e.g),this.b=ks(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Yt){return yt.workingToColorSpace(_n.copy(this),e),Math.round(vt(_n.r*255,0,255))*65536+Math.round(vt(_n.g*255,0,255))*256+Math.round(vt(_n.b*255,0,255))}getHexString(e=Yt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=yt.workingColorSpace){yt.workingToColorSpace(_n.copy(this),t);const i=_n.r,r=_n.g,s=_n.b,o=Math.max(i,r,s),a=Math.min(i,r,s);let l,c;const u=(a+o)/2;if(a===o)l=0,c=0;else{const h=o-a;switch(c=u<=.5?h/(o+a):h/(2-o-a),o){case i:l=(r-s)/h+(r<s?6:0);break;case r:l=(s-i)/h+2;break;case s:l=(i-r)/h+4;break}l/=6}return e.h=l,e.s=c,e.l=u,e}getRGB(e,t=yt.workingColorSpace){return yt.workingToColorSpace(_n.copy(this),t),e.r=_n.r,e.g=_n.g,e.b=_n.b,e}getStyle(e=Yt){yt.workingToColorSpace(_n.copy(this),e);const t=_n.r,i=_n.g,r=_n.b;return e!==Yt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(br),this.setHSL(br.h+e,br.s+t,br.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(br),e.getHSL(Ra);const i=Go(br.h,Ra.h,t),r=Go(br.s,Ra.s,t),s=Go(br.l,Ra.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const _n=new ft;ft.NAMES=D0;class sL extends Gt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Bi,this.environmentIntensity=1,this.environmentRotation=new Bi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}const ai=new ee,Ki=new ee,fu=new ee,$i=new ee,Ss=new ee,Ms=new ee,gm=new ee,hu=new ee,du=new ee,pu=new ee,mu=new Vt,gu=new Vt,_u=new Vt;class Jn{constructor(e=new ee,t=new ee,i=new ee){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),ai.subVectors(e,t),r.cross(ai);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){ai.subVectors(r,t),Ki.subVectors(i,t),fu.subVectors(e,t);const o=ai.dot(ai),a=ai.dot(Ki),l=ai.dot(fu),c=Ki.dot(Ki),u=Ki.dot(fu),h=o*c-a*a;if(h===0)return s.set(0,0,0),null;const d=1/h,g=(c*l-a*u)*d,p=(o*u-a*l)*d;return s.set(1-g-p,p,g)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,$i)===null?!1:$i.x>=0&&$i.y>=0&&$i.x+$i.y<=1}static getInterpolation(e,t,i,r,s,o,a,l){return this.getBarycoord(e,t,i,r,$i)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(s,$i.x),l.addScaledVector(o,$i.y),l.addScaledVector(a,$i.z),l)}static getInterpolatedAttribute(e,t,i,r,s,o){return mu.setScalar(0),gu.setScalar(0),_u.setScalar(0),mu.fromBufferAttribute(e,t),gu.fromBufferAttribute(e,i),_u.fromBufferAttribute(e,r),o.setScalar(0),o.addScaledVector(mu,s.x),o.addScaledVector(gu,s.y),o.addScaledVector(_u,s.z),o}static isFrontFacing(e,t,i,r){return ai.subVectors(i,t),Ki.subVectors(e,t),ai.cross(Ki).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return ai.subVectors(this.c,this.b),Ki.subVectors(this.a,this.b),ai.cross(Ki).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return Jn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return Jn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return Jn.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return Jn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return Jn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const i=this.a,r=this.b,s=this.c;let o,a;Ss.subVectors(r,i),Ms.subVectors(s,i),hu.subVectors(e,i);const l=Ss.dot(hu),c=Ms.dot(hu);if(l<=0&&c<=0)return t.copy(i);du.subVectors(e,r);const u=Ss.dot(du),h=Ms.dot(du);if(u>=0&&h<=u)return t.copy(r);const d=l*h-u*c;if(d<=0&&l>=0&&u<=0)return o=l/(l-u),t.copy(i).addScaledVector(Ss,o);pu.subVectors(e,s);const g=Ss.dot(pu),p=Ms.dot(pu);if(p>=0&&g<=p)return t.copy(s);const x=g*c-l*p;if(x<=0&&c>=0&&p<=0)return a=c/(c-p),t.copy(i).addScaledVector(Ms,a);const m=u*p-g*h;if(m<=0&&h-u>=0&&g-p>=0)return gm.subVectors(s,r),a=(h-u)/(h-u+(g-p)),t.copy(r).addScaledVector(gm,a);const _=1/(m+x+d);return o=x*_,a=d*_,t.copy(i).addScaledVector(Ss,o).addScaledVector(Ms,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class gr{constructor(e=new ee(1/0,1/0,1/0),t=new ee(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(li.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(li.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const i=li.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const i=e.geometry;if(i!==void 0){const s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,li):li.fromBufferAttribute(s,o),li.applyMatrix4(e.matrixWorld),this.expandByPoint(li);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Ca.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Ca.copy(i.boundingBox)),Ca.applyMatrix4(e.matrixWorld),this.union(Ca)}const r=e.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,li),li.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(bo),Pa.subVectors(this.max,bo),bs.subVectors(e.a,bo),Es.subVectors(e.b,bo),Ts.subVectors(e.c,bo),Er.subVectors(Es,bs),Tr.subVectors(Ts,Es),Hr.subVectors(bs,Ts);let t=[0,-Er.z,Er.y,0,-Tr.z,Tr.y,0,-Hr.z,Hr.y,Er.z,0,-Er.x,Tr.z,0,-Tr.x,Hr.z,0,-Hr.x,-Er.y,Er.x,0,-Tr.y,Tr.x,0,-Hr.y,Hr.x,0];return!vu(t,bs,Es,Ts,Pa)||(t=[1,0,0,0,1,0,0,0,1],!vu(t,bs,Es,Ts,Pa))?!1:(La.crossVectors(Er,Tr),t=[La.x,La.y,La.z],vu(t,bs,Es,Ts,Pa))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,li).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(li).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Yi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Yi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Yi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Yi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Yi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Yi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Yi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Yi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Yi),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const Yi=[new ee,new ee,new ee,new ee,new ee,new ee,new ee,new ee],li=new ee,Ca=new gr,bs=new ee,Es=new ee,Ts=new ee,Er=new ee,Tr=new ee,Hr=new ee,bo=new ee,Pa=new ee,La=new ee,zr=new ee;function vu(n,e,t,i,r){for(let s=0,o=n.length-3;s<=o;s+=3){zr.fromArray(n,s);const a=r.x*Math.abs(zr.x)+r.y*Math.abs(zr.y)+r.z*Math.abs(zr.z),l=e.dot(zr),c=t.dot(zr),u=i.dot(zr);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>a)return!1}return!0}const $t=new ee,Ia=new St;let FE=0;class hn{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:FE++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=Yf,this.updateRanges=[],this.gpuType=Zn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Ia.fromBufferAttribute(this,t),Ia.applyMatrix3(e),this.setXY(t,Ia.x,Ia.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)$t.fromBufferAttribute(this,t),$t.applyMatrix3(e),this.setXYZ(t,$t.x,$t.y,$t.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)$t.fromBufferAttribute(this,t),$t.applyMatrix4(e),this.setXYZ(t,$t.x,$t.y,$t.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)$t.fromBufferAttribute(this,t),$t.applyNormalMatrix(e),this.setXYZ(t,$t.x,$t.y,$t.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)$t.fromBufferAttribute(this,t),$t.transformDirection(e),this.setXYZ(t,$t.x,$t.y,$t.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=ci(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Dt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=ci(t,this.array)),t}setX(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=ci(t,this.array)),t}setY(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=ci(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=ci(t,this.array)),t}setW(e,t){return this.normalized&&(t=Dt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Dt(t,this.array),i=Dt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=Dt(t,this.array),i=Dt(i,this.array),r=Dt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=Dt(t,this.array),i=Dt(i,this.array),r=Dt(r,this.array),s=Dt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Yf&&(e.usage=this.usage),e}}class N0 extends hn{constructor(e,t,i){super(new Uint16Array(e),t,i)}}class U0 extends hn{constructor(e,t,i){super(new Uint32Array(e),t,i)}}class Xt extends hn{constructor(e,t,i){super(new Float32Array(e),t,i)}}const BE=new gr,Eo=new ee,xu=new ee;class Vi{constructor(e=new ee,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const i=this.center;t!==void 0?i.copy(t):BE.setFromPoints(e).getCenter(i);let r=0;for(let s=0,o=e.length;s<o;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Eo.subVectors(e,this.center);const t=Eo.lengthSq();if(t>this.radius*this.radius){const i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(Eo,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(xu.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Eo.copy(e.center).add(xu)),this.expandByPoint(Eo.copy(e.center).sub(xu))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let kE=0;const $n=new mt,yu=new Gt,As=new ee,Vn=new gr,To=new gr,on=new ee;class dn extends ro{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:kE++}),this.uuid=fi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(nE(e)?U0:N0)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const i=this.attributes.normal;if(i!==void 0){const s=new dt().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return $n.makeRotationFromQuaternion(e),this.applyMatrix4($n),this}rotateX(e){return $n.makeRotationX(e),this.applyMatrix4($n),this}rotateY(e){return $n.makeRotationY(e),this.applyMatrix4($n),this}rotateZ(e){return $n.makeRotationZ(e),this.applyMatrix4($n),this}translate(e,t,i){return $n.makeTranslation(e,t,i),this.applyMatrix4($n),this}scale(e,t,i){return $n.makeScale(e,t,i),this.applyMatrix4($n),this}lookAt(e){return yu.lookAt(e),yu.updateMatrix(),this.applyMatrix4(yu.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(As).negate(),this.translate(As.x,As.y,As.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const i=[];for(let r=0,s=e.length;r<s;r++){const o=e[r];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Xt(i,3))}else{const i=Math.min(e.length,t.count);for(let r=0;r<i;r++){const s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&et("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new gr);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){ot("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new ee(-1/0,-1/0,-1/0),new ee(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){const s=t[i];Vn.setFromBufferAttribute(s),this.morphTargetsRelative?(on.addVectors(this.boundingBox.min,Vn.min),this.boundingBox.expandByPoint(on),on.addVectors(this.boundingBox.max,Vn.max),this.boundingBox.expandByPoint(on)):(this.boundingBox.expandByPoint(Vn.min),this.boundingBox.expandByPoint(Vn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&ot('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Vi);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){ot("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new ee,1/0);return}if(e){const i=this.boundingSphere.center;if(Vn.setFromBufferAttribute(e),t)for(let s=0,o=t.length;s<o;s++){const a=t[s];To.setFromBufferAttribute(a),this.morphTargetsRelative?(on.addVectors(Vn.min,To.min),Vn.expandByPoint(on),on.addVectors(Vn.max,To.max),Vn.expandByPoint(on)):(Vn.expandByPoint(To.min),Vn.expandByPoint(To.max))}Vn.getCenter(i);let r=0;for(let s=0,o=e.count;s<o;s++)on.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(on));if(t)for(let s=0,o=t.length;s<o;s++){const a=t[s],l=this.morphTargetsRelative;for(let c=0,u=a.count;c<u;c++)on.fromBufferAttribute(a,c),l&&(As.fromBufferAttribute(e,c),on.add(As)),r=Math.max(r,i.distanceToSquared(on))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&ot('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){ot("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const i=t.position,r=t.normal,s=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new hn(new Float32Array(4*i.count),4));const o=this.getAttribute("tangent"),a=[],l=[];for(let E=0;E<i.count;E++)a[E]=new ee,l[E]=new ee;const c=new ee,u=new ee,h=new ee,d=new St,g=new St,p=new St,x=new ee,m=new ee;function _(E,w,L){c.fromBufferAttribute(i,E),u.fromBufferAttribute(i,w),h.fromBufferAttribute(i,L),d.fromBufferAttribute(s,E),g.fromBufferAttribute(s,w),p.fromBufferAttribute(s,L),u.sub(c),h.sub(c),g.sub(d),p.sub(d);const R=1/(g.x*p.y-p.x*g.y);isFinite(R)&&(x.copy(u).multiplyScalar(p.y).addScaledVector(h,-g.y).multiplyScalar(R),m.copy(h).multiplyScalar(g.x).addScaledVector(u,-p.x).multiplyScalar(R),a[E].add(x),a[w].add(x),a[L].add(x),l[E].add(m),l[w].add(m),l[L].add(m))}let M=this.groups;M.length===0&&(M=[{start:0,count:e.count}]);for(let E=0,w=M.length;E<w;++E){const L=M[E],R=L.start,U=L.count;for(let H=R,q=R+U;H<q;H+=3)_(e.getX(H+0),e.getX(H+1),e.getX(H+2))}const T=new ee,b=new ee,I=new ee,D=new ee;function B(E){I.fromBufferAttribute(r,E),D.copy(I);const w=a[E];T.copy(w),T.sub(I.multiplyScalar(I.dot(w))).normalize(),b.crossVectors(D,w);const R=b.dot(l[E])<0?-1:1;o.setXYZW(E,T.x,T.y,T.z,R)}for(let E=0,w=M.length;E<w;++E){const L=M[E],R=L.start,U=L.count;for(let H=R,q=R+U;H<q;H+=3)B(e.getX(H+0)),B(e.getX(H+1)),B(e.getX(H+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new hn(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let d=0,g=i.count;d<g;d++)i.setXYZ(d,0,0,0);const r=new ee,s=new ee,o=new ee,a=new ee,l=new ee,c=new ee,u=new ee,h=new ee;if(e)for(let d=0,g=e.count;d<g;d+=3){const p=e.getX(d+0),x=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,p),s.fromBufferAttribute(t,x),o.fromBufferAttribute(t,m),u.subVectors(o,s),h.subVectors(r,s),u.cross(h),a.fromBufferAttribute(i,p),l.fromBufferAttribute(i,x),c.fromBufferAttribute(i,m),a.add(u),l.add(u),c.add(u),i.setXYZ(p,a.x,a.y,a.z),i.setXYZ(x,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let d=0,g=t.count;d<g;d+=3)r.fromBufferAttribute(t,d+0),s.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),u.subVectors(o,s),h.subVectors(r,s),u.cross(h),i.setXYZ(d+0,u.x,u.y,u.z),i.setXYZ(d+1,u.x,u.y,u.z),i.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)on.fromBufferAttribute(e,t),on.normalize(),e.setXYZ(t,on.x,on.y,on.z)}toNonIndexed(){function e(a,l){const c=a.array,u=a.itemSize,h=a.normalized,d=new c.constructor(l.length*u);let g=0,p=0;for(let x=0,m=l.length;x<m;x++){a.isInterleavedBufferAttribute?g=l[x]*a.data.stride+a.offset:g=l[x]*u;for(let _=0;_<u;_++)d[p++]=c[g++]}return new hn(d,u,h)}if(this.index===null)return et("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new dn,i=this.index.array,r=this.attributes;for(const a in r){const l=r[a],c=e(l,i);t.setAttribute(a,c)}const s=this.morphAttributes;for(const a in s){const l=[],c=s[a];for(let u=0,h=c.length;u<h;u++){const d=c[u],g=e(d,i);l.push(g)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,l=o.length;a<l;a++){const c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const l=this.parameters;for(const c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const i=this.attributes;for(const l in i){const c=i[l];e.data.attributes[l]=c.toJSON(e.data)}const r={};let s=!1;for(const l in this.morphAttributes){const c=this.morphAttributes[l],u=[];for(let h=0,d=c.length;h<d;h++){const g=c[h];u.push(g.toJSON(e.data))}u.length>0&&(r[l]=u,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const i=e.index;i!==null&&this.setIndex(i.clone());const r=e.attributes;for(const c in r){const u=r[c];this.setAttribute(c,u.clone(t))}const s=e.morphAttributes;for(const c in s){const u=[],h=s[c];for(let d=0,g=h.length;d<g;d++)u.push(h[d].clone(t));this.morphAttributes[c]=u}this.morphTargetsRelative=e.morphTargetsRelative;const o=e.groups;for(let c=0,u=o.length;c<u;c++){const h=o[c];this.addGroup(h.start,h.count,h.materialIndex)}const a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());const l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}class O0{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=Yf,this.updateRanges=[],this.version=0,this.uuid=fi()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,i){e*=this.stride,i*=t.stride;for(let r=0,s=this.stride;r<s;r++)this.array[e+r]=t.array[i+r];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=fi()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(t,this.stride);return i.setUsage(this.usage),i}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=fi()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const En=new ee;class tc{constructor(e,t,i,r=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=i,this.normalized=r}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,i=this.data.count;t<i;t++)En.fromBufferAttribute(this,t),En.applyMatrix4(e),this.setXYZ(t,En.x,En.y,En.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)En.fromBufferAttribute(this,t),En.applyNormalMatrix(e),this.setXYZ(t,En.x,En.y,En.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)En.fromBufferAttribute(this,t),En.transformDirection(e),this.setXYZ(t,En.x,En.y,En.z);return this}getComponent(e,t){let i=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(i=ci(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Dt(i,this.array)),this.data.array[e*this.data.stride+this.offset+t]=i,this}setX(e,t){return this.normalized&&(t=Dt(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=Dt(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=Dt(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=Dt(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=ci(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=ci(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=ci(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=ci(t,this.array)),t}setXY(e,t,i){return e=e*this.data.stride+this.offset,this.normalized&&(t=Dt(t,this.array),i=Dt(i,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this}setXYZ(e,t,i,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=Dt(t,this.array),i=Dt(i,this.array),r=Dt(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=Dt(t,this.array),i=Dt(i,this.array),r=Dt(r,this.array),s=Dt(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=i,this.data.array[e+2]=r,this.data.array[e+3]=s,this}clone(e){if(e===void 0){Ll("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let i=0;i<this.count;i++){const r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return new hn(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new tc(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){Ll("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let i=0;i<this.count;i++){const r=i*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[r+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}let VE=0;class Oi extends ro{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:VE++}),this.uuid=fi(),this.name="",this.type="Material",this.blending=Fs,this.side=fr,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=lf,this.blendDst=cf,this.blendEquation=Jr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ft(0,0,0),this.blendAlpha=0,this.depthFunc=qs,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=nm,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=gs,this.stencilZFail=gs,this.stencilZPass=gs,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const i=e[t];if(i===void 0){et(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){et(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==Fs&&(i.blending=this.blending),this.side!==fr&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==lf&&(i.blendSrc=this.blendSrc),this.blendDst!==cf&&(i.blendDst=this.blendDst),this.blendEquation!==Jr&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==qs&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==nm&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==gs&&(i.stencilFail=this.stencilFail),this.stencilZFail!==gs&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==gs&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.allowOverride===!1&&(i.allowOverride=!1),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){const o=[];for(const a in s){const l=s[a];delete l.metadata,o.push(l)}return o}if(t){const s=r(e.textures),o=r(e.images);s.length>0&&(i.textures=s),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let i=null;if(t!==null){const r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const Ji=new ee,Su=new ee,Da=new ee,Ar=new ee,Mu=new ee,Na=new ee,bu=new ee;class nc{constructor(e=new ee,t=new ee(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Ji)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Ji.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Ji.copy(this.origin).addScaledVector(this.direction,t),Ji.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Su.copy(e).add(t).multiplyScalar(.5),Da.copy(t).sub(e).normalize(),Ar.copy(this.origin).sub(Su);const s=e.distanceTo(t)*.5,o=-this.direction.dot(Da),a=Ar.dot(this.direction),l=-Ar.dot(Da),c=Ar.lengthSq(),u=Math.abs(1-o*o);let h,d,g,p;if(u>0)if(h=o*l-a,d=o*a-l,p=s*u,h>=0)if(d>=-p)if(d<=p){const x=1/u;h*=x,d*=x,g=h*(h+o*d+2*a)+d*(o*h+d+2*l)+c}else d=s,h=Math.max(0,-(o*d+a)),g=-h*h+d*(d+2*l)+c;else d=-s,h=Math.max(0,-(o*d+a)),g=-h*h+d*(d+2*l)+c;else d<=-p?(h=Math.max(0,-(-o*s+a)),d=h>0?-s:Math.min(Math.max(-s,-l),s),g=-h*h+d*(d+2*l)+c):d<=p?(h=0,d=Math.min(Math.max(-s,-l),s),g=d*(d+2*l)+c):(h=Math.max(0,-(o*s+a)),d=h>0?s:Math.min(Math.max(-s,-l),s),g=-h*h+d*(d+2*l)+c);else d=o>0?-s:s,h=Math.max(0,-(o*d+a)),g=-h*h+d*(d+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,h),r&&r.copy(Su).addScaledVector(Da,d),g}intersectSphere(e,t){Ji.subVectors(e.center,this.origin);const i=Ji.dot(this.direction),r=Ji.dot(Ji)-i*i,s=e.radius*e.radius;if(r>s)return null;const o=Math.sqrt(s-r),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){const i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,o,a,l;const c=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return c>=0?(i=(e.min.x-d.x)*c,r=(e.max.x-d.x)*c):(i=(e.max.x-d.x)*c,r=(e.min.x-d.x)*c),u>=0?(s=(e.min.y-d.y)*u,o=(e.max.y-d.y)*u):(s=(e.max.y-d.y)*u,o=(e.min.y-d.y)*u),i>o||s>r||((s>i||isNaN(i))&&(i=s),(o<r||isNaN(r))&&(r=o),h>=0?(a=(e.min.z-d.z)*h,l=(e.max.z-d.z)*h):(a=(e.max.z-d.z)*h,l=(e.min.z-d.z)*h),i>l||a>r)||((a>i||i!==i)&&(i=a),(l<r||r!==r)&&(r=l),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Ji)!==null}intersectTriangle(e,t,i,r,s){Mu.subVectors(t,e),Na.subVectors(i,e),bu.crossVectors(Mu,Na);let o=this.direction.dot(bu),a;if(o>0){if(r)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Ar.subVectors(this.origin,e);const l=a*this.direction.dot(Na.crossVectors(Ar,Na));if(l<0)return null;const c=a*this.direction.dot(Mu.cross(Ar));if(c<0||l+c>o)return null;const u=-a*Ar.dot(bu);return u<0?null:this.at(u/o,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class ns extends Oi{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ft(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Bi,this.combine=h0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const _m=new mt,Gr=new nc,Ua=new Vi,vm=new ee,Oa=new ee,Fa=new ee,Ba=new ee,Eu=new ee,ka=new ee,xm=new ee,Va=new ee;class Wn extends Gt{constructor(e=new dn,t=new ns){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(e,t){const i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(r,e);const a=this.morphTargetInfluences;if(s&&a){ka.set(0,0,0);for(let l=0,c=s.length;l<c;l++){const u=a[l],h=s[l];u!==0&&(Eu.fromBufferAttribute(h,e),o?ka.addScaledVector(Eu,u):ka.addScaledVector(Eu.sub(t),u))}t.add(ka)}return t}raycast(e,t){const i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Ua.copy(i.boundingSphere),Ua.applyMatrix4(s),Gr.copy(e.ray).recast(e.near),!(Ua.containsPoint(Gr.origin)===!1&&(Gr.intersectSphere(Ua,vm)===null||Gr.origin.distanceToSquared(vm)>(e.far-e.near)**2))&&(_m.copy(s).invert(),Gr.copy(e.ray).applyMatrix4(_m),!(i.boundingBox!==null&&Gr.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Gr)))}_computeIntersections(e,t,i){let r;const s=this.geometry,o=this.material,a=s.index,l=s.attributes.position,c=s.attributes.uv,u=s.attributes.uv1,h=s.attributes.normal,d=s.groups,g=s.drawRange;if(a!==null)if(Array.isArray(o))for(let p=0,x=d.length;p<x;p++){const m=d[p],_=o[m.materialIndex],M=Math.max(m.start,g.start),T=Math.min(a.count,Math.min(m.start+m.count,g.start+g.count));for(let b=M,I=T;b<I;b+=3){const D=a.getX(b),B=a.getX(b+1),E=a.getX(b+2);r=Ha(this,_,e,i,c,u,h,D,B,E),r&&(r.faceIndex=Math.floor(b/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const p=Math.max(0,g.start),x=Math.min(a.count,g.start+g.count);for(let m=p,_=x;m<_;m+=3){const M=a.getX(m),T=a.getX(m+1),b=a.getX(m+2);r=Ha(this,o,e,i,c,u,h,M,T,b),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(l!==void 0)if(Array.isArray(o))for(let p=0,x=d.length;p<x;p++){const m=d[p],_=o[m.materialIndex],M=Math.max(m.start,g.start),T=Math.min(l.count,Math.min(m.start+m.count,g.start+g.count));for(let b=M,I=T;b<I;b+=3){const D=b,B=b+1,E=b+2;r=Ha(this,_,e,i,c,u,h,D,B,E),r&&(r.faceIndex=Math.floor(b/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const p=Math.max(0,g.start),x=Math.min(l.count,g.start+g.count);for(let m=p,_=x;m<_;m+=3){const M=m,T=m+1,b=m+2;r=Ha(this,o,e,i,c,u,h,M,T,b),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}}function HE(n,e,t,i,r,s,o,a){let l;if(e.side===On?l=i.intersectTriangle(o,s,r,!0,a):l=i.intersectTriangle(r,s,o,e.side===fr,a),l===null)return null;Va.copy(a),Va.applyMatrix4(n.matrixWorld);const c=t.ray.origin.distanceTo(Va);return c<t.near||c>t.far?null:{distance:c,point:Va.clone(),object:n}}function Ha(n,e,t,i,r,s,o,a,l,c){n.getVertexPosition(a,Oa),n.getVertexPosition(l,Fa),n.getVertexPosition(c,Ba);const u=HE(n,e,t,i,Oa,Fa,Ba,xm);if(u){const h=new ee;Jn.getBarycoord(xm,Oa,Fa,Ba,h),r&&(u.uv=Jn.getInterpolatedAttribute(r,a,l,c,h,new St)),s&&(u.uv1=Jn.getInterpolatedAttribute(s,a,l,c,h,new St)),o&&(u.normal=Jn.getInterpolatedAttribute(o,a,l,c,h,new ee),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));const d={a,b:l,c,normal:new ee,materialIndex:0};Jn.getNormal(Oa,Fa,Ba,d.normal),u.face=d,u.barycoord=h}return u}const ym=new ee,Sm=new Vt,Mm=new Vt,zE=new ee,bm=new mt,za=new ee,Tu=new Vi,Em=new mt,Au=new nc;class GE extends Wn{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=Jp,this.bindMatrix=new mt,this.bindMatrixInverse=new mt,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const e=this.geometry;this.boundingBox===null&&(this.boundingBox=new gr),this.boundingBox.makeEmpty();const t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,za),this.boundingBox.expandByPoint(za)}computeBoundingSphere(){const e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Vi),this.boundingSphere.makeEmpty();const t=e.getAttribute("position");for(let i=0;i<t.count;i++)this.getVertexPosition(i,za),this.boundingSphere.expandByPoint(za)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){const i=this.material,r=this.matrixWorld;i!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Tu.copy(this.boundingSphere),Tu.applyMatrix4(r),e.ray.intersectsSphere(Tu)!==!1&&(Em.copy(r).invert(),Au.copy(e.ray).applyMatrix4(Em),!(this.boundingBox!==null&&Au.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Au)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const e=new Vt,t=this.geometry.attributes.skinWeight;for(let i=0,r=t.count;i<r;i++){e.fromBufferAttribute(t,i);const s=1/e.manhattanLength();s!==1/0?e.multiplyScalar(s):e.set(1,0,0,0),t.setXYZW(i,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===Jp?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===jb?this.bindMatrixInverse.copy(this.bindMatrix).invert():et("SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){const i=this.skeleton,r=this.geometry;Sm.fromBufferAttribute(r.attributes.skinIndex,e),Mm.fromBufferAttribute(r.attributes.skinWeight,e),ym.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let s=0;s<4;s++){const o=Mm.getComponent(s);if(o!==0){const a=Sm.getComponent(s);bm.multiplyMatrices(i.bones[a].matrixWorld,i.boneInverses[a]),t.addScaledVector(zE.copy(ym).applyMatrix4(bm),o)}}return t.applyMatrix4(this.bindMatrixInverse)}}class F0 extends Gt{constructor(){super(),this.isBone=!0,this.type="Bone"}}class zh extends Jt{constructor(e=null,t=1,i=1,r,s,o,a,l,c=nn,u=nn,h,d){super(null,o,a,l,c,u,r,s,h,d),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Tm=new mt,WE=new mt;class Gh{constructor(e=[],t=[]){this.uuid=fi(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.previousBoneMatrices=null,this.boneTexture=null,this.init()}init(){const e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){et("Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let i=0,r=this.bones.length;i<r;i++)this.boneInverses.push(new mt)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){const i=new mt;this.bones[e]&&i.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(i)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){const i=this.bones[e];i&&i.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){const i=this.bones[e];i&&(i.parent&&i.parent.isBone?(i.matrix.copy(i.parent.matrixWorld).invert(),i.matrix.multiply(i.matrixWorld)):i.matrix.copy(i.matrixWorld),i.matrix.decompose(i.position,i.quaternion,i.scale))}}update(){const e=this.bones,t=this.boneInverses,i=this.boneMatrices,r=this.boneTexture;for(let s=0,o=e.length;s<o;s++){const a=e[s]?e[s].matrixWorld:WE;Tm.multiplyMatrices(a,t[s]),Tm.toArray(i,s*16)}r!==null&&(r.needsUpdate=!0)}clone(){return new Gh(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);const t=new Float32Array(e*e*4);t.set(this.boneMatrices);const i=new zh(t,e,e,Qn,Zn);return i.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=i,this}getBoneByName(e){for(let t=0,i=this.bones.length;t<i;t++){const r=this.bones[t];if(r.name===e)return r}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let i=0,r=e.bones.length;i<r;i++){const s=e.bones[i];let o=t[s];o===void 0&&(et("Skeleton: No bone found with UUID:",s),o=new F0),this.bones.push(o),this.boneInverses.push(new mt().fromArray(e.boneInverses[i]))}return this.init(),this}toJSON(){const e={metadata:{version:4.7,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;const t=this.bones,i=this.boneInverses;for(let r=0,s=t.length;r<s;r++){const o=t[r];e.bones.push(o.uuid);const a=i[r];e.boneInverses.push(a.toArray())}return e}}class Jf extends hn{constructor(e,t,i,r=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=r}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){const e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}}const ws=new mt,Am=new mt,Ga=[],wm=new gr,jE=new mt,Ao=new Wn,wo=new Vi;class XE extends Wn{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Jf(new Float32Array(i*16),16),this.previousInstanceMatrix=null,this.instanceColor=null,this.morphTexture=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let r=0;r<i;r++)this.setMatrixAt(r,jE)}computeBoundingBox(){const e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new gr),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,ws),wm.copy(e.boundingBox).applyMatrix4(ws),this.boundingBox.union(wm)}computeBoundingSphere(){const e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Vi),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,ws),wo.copy(e.boundingSphere).applyMatrix4(ws),this.boundingSphere.union(wo)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.previousInstanceMatrix!==null&&(this.previousInstanceMatrix=e.previousInstanceMatrix.clone()),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){const i=t.morphTargetInfluences,r=this.morphTexture.source.data.data,s=i.length+1,o=e*s+1;for(let a=0;a<i.length;a++)i[a]=r[o+a]}raycast(e,t){const i=this.matrixWorld,r=this.count;if(Ao.geometry=this.geometry,Ao.material=this.material,Ao.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),wo.copy(this.boundingSphere),wo.applyMatrix4(i),e.ray.intersectsSphere(wo)!==!1))for(let s=0;s<r;s++){this.getMatrixAt(s,ws),Am.multiplyMatrices(i,ws),Ao.matrixWorld=Am,Ao.raycast(e,Ga);for(let o=0,a=Ga.length;o<a;o++){const l=Ga[o];l.instanceId=s,l.object=this,t.push(l)}Ga.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Jf(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){const i=t.morphTargetInfluences,r=i.length+1;this.morphTexture===null&&(this.morphTexture=new zh(new Float32Array(r*this.count),r,this.count,Nh,Zn));const s=this.morphTexture.source.data.data;let o=0;for(let c=0;c<i.length;c++)o+=i[c];const a=this.geometry.morphTargetsRelative?1:1-o,l=r*e;s[l]=a,s.set(i,l+1)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null)}}const wu=new ee,qE=new ee,KE=new dt;class $r{constructor(e=new ee(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){const r=wu.subVectors(i,t).cross(qE.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const i=e.delta(wu),r=this.normal.dot(i);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const s=-(e.start.dot(this.normal)+this.constant)/r;return s<0||s>1?null:t.copy(e.start).addScaledVector(i,s)}intersectsLine(e){const t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const i=t||KE.getNormalMatrix(e),r=this.coplanarPoint(wu).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const Wr=new Vi,$E=new St(.5,.5),Wa=new ee;class Wh{constructor(e=new $r,t=new $r,i=new $r,r=new $r,s=new $r,o=new $r){this.planes=[e,t,i,r,s,o]}set(e,t,i,r,s,o){const a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(r),a[4].copy(s),a[5].copy(o),this}copy(e){const t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Ii,i=!1){const r=this.planes,s=e.elements,o=s[0],a=s[1],l=s[2],c=s[3],u=s[4],h=s[5],d=s[6],g=s[7],p=s[8],x=s[9],m=s[10],_=s[11],M=s[12],T=s[13],b=s[14],I=s[15];if(r[0].setComponents(c-o,g-u,_-p,I-M).normalize(),r[1].setComponents(c+o,g+u,_+p,I+M).normalize(),r[2].setComponents(c+a,g+h,_+x,I+T).normalize(),r[3].setComponents(c-a,g-h,_-x,I-T).normalize(),i)r[4].setComponents(l,d,m,b).normalize(),r[5].setComponents(c-l,g-d,_-m,I-b).normalize();else if(r[4].setComponents(c-l,g-d,_-m,I-b).normalize(),t===Ii)r[5].setComponents(c+l,g+d,_+m,I+b).normalize();else if(t===ta)r[5].setComponents(l,d,m,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Wr.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Wr.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Wr)}intersectsSprite(e){Wr.center.set(0,0,0);const t=$E.distanceTo(e.center);return Wr.radius=.7071067811865476+t,Wr.applyMatrix4(e.matrixWorld),this.intersectsSphere(Wr)}intersectsSphere(e){const t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let i=0;i<6;i++){const r=t[i];if(Wa.x=r.normal.x>0?e.max.x:e.min.x,Wa.y=r.normal.y>0?e.max.y:e.min.y,Wa.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Wa)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class B0 extends Oi{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new ft(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Dl=new ee,Nl=new ee,Rm=new mt,Ro=new nc,ja=new Vi,Ru=new ee,Cm=new ee;class jh extends Gt{constructor(e=new dn,t=new B0){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[0];for(let r=1,s=t.count;r<s;r++)Dl.fromBufferAttribute(t,r-1),Nl.fromBufferAttribute(t,r),i[r]=i[r-1],i[r]+=Dl.distanceTo(Nl);e.setAttribute("lineDistance",new Xt(i,1))}else et("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){const i=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),ja.copy(i.boundingSphere),ja.applyMatrix4(r),ja.radius+=s,e.ray.intersectsSphere(ja)===!1)return;Rm.copy(r).invert(),Ro.copy(e.ray).applyMatrix4(Rm);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=this.isLineSegments?2:1,u=i.index,d=i.attributes.position;if(u!==null){const g=Math.max(0,o.start),p=Math.min(u.count,o.start+o.count);for(let x=g,m=p-1;x<m;x+=c){const _=u.getX(x),M=u.getX(x+1),T=Xa(this,e,Ro,l,_,M,x);T&&t.push(T)}if(this.isLineLoop){const x=u.getX(p-1),m=u.getX(g),_=Xa(this,e,Ro,l,x,m,p-1);_&&t.push(_)}}else{const g=Math.max(0,o.start),p=Math.min(d.count,o.start+o.count);for(let x=g,m=p-1;x<m;x+=c){const _=Xa(this,e,Ro,l,x,x+1,x);_&&t.push(_)}if(this.isLineLoop){const x=Xa(this,e,Ro,l,p-1,g,p-1);x&&t.push(x)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function Xa(n,e,t,i,r,s,o){const a=n.geometry.attributes.position;if(Dl.fromBufferAttribute(a,r),Nl.fromBufferAttribute(a,s),t.distanceSqToSegment(Dl,Nl,Ru,Cm)>i)return;Ru.applyMatrix4(n.matrixWorld);const c=e.ray.origin.distanceTo(Ru);if(!(c<e.near||c>e.far))return{distance:c,point:Cm.clone().applyMatrix4(n.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:n}}const Pm=new ee,Lm=new ee;class YE extends jh{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,i=[];for(let r=0,s=t.count;r<s;r+=2)Pm.fromBufferAttribute(t,r),Lm.fromBufferAttribute(t,r+1),i[r]=r===0?0:i[r-1],i[r+1]=i[r]+Pm.distanceTo(Lm);e.setAttribute("lineDistance",new Xt(i,1))}else et("LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class JE extends jh{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}}class k0 extends Oi{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new ft(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}}const Im=new mt,Zf=new nc,qa=new Vi,Ka=new ee;class ZE extends Gt{constructor(e=new dn,t=new k0){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){const i=this.geometry,r=this.matrixWorld,s=e.params.Points.threshold,o=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),qa.copy(i.boundingSphere),qa.applyMatrix4(r),qa.radius+=s,e.ray.intersectsSphere(qa)===!1)return;Im.copy(r).invert(),Zf.copy(e.ray).applyMatrix4(Im);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),l=a*a,c=i.index,h=i.attributes.position;if(c!==null){const d=Math.max(0,o.start),g=Math.min(c.count,o.start+o.count);for(let p=d,x=g;p<x;p++){const m=c.getX(p);Ka.fromBufferAttribute(h,m),Dm(Ka,m,l,r,e,t,this)}}else{const d=Math.max(0,o.start),g=Math.min(h.count,o.start+o.count);for(let p=d,x=g;p<x;p++)Ka.fromBufferAttribute(h,p),Dm(Ka,p,l,r,e,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){const r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){const a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function Dm(n,e,t,i,r,s,o){const a=Zf.distanceSqToPoint(n);if(a<t){const l=new ee;Zf.closestPointToPoint(n,l),l.applyMatrix4(i);const c=r.ray.origin.distanceTo(l);if(c<r.near||c>r.far)return;s.push({distance:c,distanceToRay:Math.sqrt(a),point:l,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}class oL extends Jt{constructor(e,t,i,r,s=jt,o=jt,a,l,c){super(e,t,i,r,s,o,a,l,c),this.isVideoTexture=!0,this.generateMipmaps=!1,this._requestVideoFrameCallbackId=0;const u=this;function h(){u.needsUpdate=!0,u._requestVideoFrameCallbackId=e.requestVideoFrameCallback(h)}"requestVideoFrameCallback"in e&&(this._requestVideoFrameCallbackId=e.requestVideoFrameCallback(h))}clone(){return new this.constructor(this.image).copy(this)}update(){const e=this.image;"requestVideoFrameCallback"in e===!1&&e.readyState>=e.HAVE_CURRENT_DATA&&(this.needsUpdate=!0)}dispose(){this._requestVideoFrameCallbackId!==0&&(this.source.data.cancelVideoFrameCallback(this._requestVideoFrameCallbackId),this._requestVideoFrameCallbackId=0),super.dispose()}}class V0 extends Jt{constructor(e=[],t=cs,i,r,s,o,a,l,c,u){super(e,t,i,r,s,o,a,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class aL extends Jt{constructor(e,t,i,r,s,o,a,l,c){super(e,t,i,r,s,o,a,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}}class ia extends Jt{constructor(e,t,i=Fi,r,s,o,a=nn,l=nn,c,u=dr,h=1){if(u!==dr&&u!==es)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:e,height:t,depth:h};super(d,r,s,o,a,l,u,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Hh(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class QE extends ia{constructor(e,t=Fi,i=cs,r,s,o=nn,a=nn,l,c=dr){const u={width:e,height:e,depth:1},h=[u,u,u,u,u,u];super(e,e,t,i,r,s,o,a,l,c),this.image=h,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class H0 extends Jt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class pa extends dn{constructor(e=1,t=1,i=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:o};const a=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);const l=[],c=[],u=[],h=[];let d=0,g=0;p("z","y","x",-1,-1,i,t,e,o,s,0),p("z","y","x",1,-1,i,t,-e,o,s,1),p("x","z","y",1,1,e,i,t,r,o,2),p("x","z","y",1,-1,e,i,-t,r,o,3),p("x","y","z",1,-1,e,t,i,r,s,4),p("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(l),this.setAttribute("position",new Xt(c,3)),this.setAttribute("normal",new Xt(u,3)),this.setAttribute("uv",new Xt(h,2));function p(x,m,_,M,T,b,I,D,B,E,w){const L=b/B,R=I/E,U=b/2,H=I/2,q=D/2,J=B+1,O=E+1;let j=0,ie=0;const X=new ee;for(let Y=0;Y<O;Y++){const ne=Y*R-H;for(let fe=0;fe<J;fe++){const ye=fe*L-U;X[x]=ye*M,X[m]=ne*T,X[_]=q,c.push(X.x,X.y,X.z),X[x]=0,X[m]=0,X[_]=D>0?1:-1,u.push(X.x,X.y,X.z),h.push(fe/B),h.push(1-Y/E),j+=1}}for(let Y=0;Y<E;Y++)for(let ne=0;ne<B;ne++){const fe=d+ne+J*Y,ye=d+ne+J*(Y+1),je=d+(ne+1)+J*(Y+1),tt=d+(ne+1)+J*Y;l.push(fe,ye,tt),l.push(ye,je,tt),ie+=6}a.addGroup(g,ie,w),g+=ie,d+=j}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new pa(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class Xh extends dn{constructor(e=1,t=1,i=1,r=32,s=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:s,openEnded:o,thetaStart:a,thetaLength:l};const c=this;r=Math.floor(r),s=Math.floor(s);const u=[],h=[],d=[],g=[];let p=0;const x=[],m=i/2;let _=0;M(),o===!1&&(e>0&&T(!0),t>0&&T(!1)),this.setIndex(u),this.setAttribute("position",new Xt(h,3)),this.setAttribute("normal",new Xt(d,3)),this.setAttribute("uv",new Xt(g,2));function M(){const b=new ee,I=new ee;let D=0;const B=(t-e)/i;for(let E=0;E<=s;E++){const w=[],L=E/s,R=L*(t-e)+e;for(let U=0;U<=r;U++){const H=U/r,q=H*l+a,J=Math.sin(q),O=Math.cos(q);I.x=R*J,I.y=-L*i+m,I.z=R*O,h.push(I.x,I.y,I.z),b.set(J,B,O).normalize(),d.push(b.x,b.y,b.z),g.push(H,1-L),w.push(p++)}x.push(w)}for(let E=0;E<r;E++)for(let w=0;w<s;w++){const L=x[w][E],R=x[w+1][E],U=x[w+1][E+1],H=x[w][E+1];(e>0||w!==0)&&(u.push(L,R,H),D+=3),(t>0||w!==s-1)&&(u.push(R,U,H),D+=3)}c.addGroup(_,D,0),_+=D}function T(b){const I=p,D=new St,B=new ee;let E=0;const w=b===!0?e:t,L=b===!0?1:-1;for(let U=1;U<=r;U++)h.push(0,m*L,0),d.push(0,L,0),g.push(.5,.5),p++;const R=p;for(let U=0;U<=r;U++){const q=U/r*l+a,J=Math.cos(q),O=Math.sin(q);B.x=w*O,B.y=m*L,B.z=w*J,h.push(B.x,B.y,B.z),d.push(0,L,0),D.x=J*.5+.5,D.y=O*.5*L+.5,g.push(D.x,D.y),p++}for(let U=0;U<r;U++){const H=I+U,q=R+U;b===!0?u.push(q,q+1,H):u.push(q+1,q,H),E+=3}c.addGroup(_,E,b===!0?1:2),_+=E}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Xh(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class z0 extends Xh{constructor(e=1,t=1,i=32,r=1,s=!1,o=0,a=Math.PI*2){super(0,e,t,i,r,s,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:s,thetaStart:o,thetaLength:a}}static fromJSON(e){return new z0(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}const $a=new ee,Ya=new ee,Cu=new ee,Ja=new Jn;class lL extends dn{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){const r=Math.pow(10,4),s=Math.cos(Bs*t),o=e.getIndex(),a=e.getAttribute("position"),l=o?o.count:a.count,c=[0,0,0],u=["a","b","c"],h=new Array(3),d={},g=[];for(let p=0;p<l;p+=3){o?(c[0]=o.getX(p),c[1]=o.getX(p+1),c[2]=o.getX(p+2)):(c[0]=p,c[1]=p+1,c[2]=p+2);const{a:x,b:m,c:_}=Ja;if(x.fromBufferAttribute(a,c[0]),m.fromBufferAttribute(a,c[1]),_.fromBufferAttribute(a,c[2]),Ja.getNormal(Cu),h[0]=`${Math.round(x.x*r)},${Math.round(x.y*r)},${Math.round(x.z*r)}`,h[1]=`${Math.round(m.x*r)},${Math.round(m.y*r)},${Math.round(m.z*r)}`,h[2]=`${Math.round(_.x*r)},${Math.round(_.y*r)},${Math.round(_.z*r)}`,!(h[0]===h[1]||h[1]===h[2]||h[2]===h[0]))for(let M=0;M<3;M++){const T=(M+1)%3,b=h[M],I=h[T],D=Ja[u[M]],B=Ja[u[T]],E=`${b}_${I}`,w=`${I}_${b}`;w in d&&d[w]?(Cu.dot(d[w].normal)<=s&&(g.push(D.x,D.y,D.z),g.push(B.x,B.y,B.z)),d[w]=null):E in d||(d[E]={index0:c[M],index1:c[T],normal:Cu.clone()})}}for(const p in d)if(d[p]){const{index0:x,index1:m}=d[p];$a.fromBufferAttribute(a,x),Ya.fromBufferAttribute(a,m),g.push($a.x,$a.y,$a.z),g.push(Ya.x,Ya.y,Ya.z)}this.setAttribute("position",new Xt(g,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}}class ic extends dn{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};const s=e/2,o=t/2,a=Math.floor(i),l=Math.floor(r),c=a+1,u=l+1,h=e/a,d=t/l,g=[],p=[],x=[],m=[];for(let _=0;_<u;_++){const M=_*d-o;for(let T=0;T<c;T++){const b=T*h-s;p.push(b,-M,0),x.push(0,0,1),m.push(T/a),m.push(1-_/l)}}for(let _=0;_<l;_++)for(let M=0;M<a;M++){const T=M+c*_,b=M+c*(_+1),I=M+1+c*(_+1),D=M+1+c*_;g.push(T,b,D),g.push(b,I,D)}this.setIndex(g),this.setAttribute("position",new Xt(p,3)),this.setAttribute("normal",new Xt(x,3)),this.setAttribute("uv",new Xt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new ic(e.width,e.height,e.widthSegments,e.heightSegments)}}class G0 extends dn{constructor(e=1,t=32,i=16,r=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:r,phiLength:s,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));const l=Math.min(o+a,Math.PI);let c=0;const u=[],h=new ee,d=new ee,g=[],p=[],x=[],m=[];for(let _=0;_<=i;_++){const M=[],T=_/i;let b=0;_===0&&o===0?b=.5/t:_===i&&l===Math.PI&&(b=-.5/t);for(let I=0;I<=t;I++){const D=I/t;h.x=-e*Math.cos(r+D*s)*Math.sin(o+T*a),h.y=e*Math.cos(o+T*a),h.z=e*Math.sin(r+D*s)*Math.sin(o+T*a),p.push(h.x,h.y,h.z),d.copy(h).normalize(),x.push(d.x,d.y,d.z),m.push(D+b,1-T),M.push(c++)}u.push(M)}for(let _=0;_<i;_++)for(let M=0;M<t;M++){const T=u[_][M+1],b=u[_][M],I=u[_+1][M],D=u[_+1][M+1];(_!==0||o>0)&&g.push(T,b,D),(_!==i-1||l<Math.PI)&&g.push(b,I,D)}this.setIndex(g),this.setAttribute("position",new Xt(p,3)),this.setAttribute("normal",new Xt(x,3)),this.setAttribute("uv",new Xt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new G0(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class W0 extends dn{constructor(e=1,t=.4,i=12,r=48,s=Math.PI*2,o=0,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:s,thetaStart:o,thetaLength:a},i=Math.floor(i),r=Math.floor(r);const l=[],c=[],u=[],h=[],d=new ee,g=new ee,p=new ee;for(let x=0;x<=i;x++){const m=o+x/i*a;for(let _=0;_<=r;_++){const M=_/r*s;g.x=(e+t*Math.cos(m))*Math.cos(M),g.y=(e+t*Math.cos(m))*Math.sin(M),g.z=t*Math.sin(m),c.push(g.x,g.y,g.z),d.x=e*Math.cos(M),d.y=e*Math.sin(M),p.subVectors(g,d).normalize(),u.push(p.x,p.y,p.z),h.push(_/r),h.push(x/i)}}for(let x=1;x<=i;x++)for(let m=1;m<=r;m++){const _=(r+1)*x+m-1,M=(r+1)*(x-1)+m-1,T=(r+1)*(x-1)+m,b=(r+1)*x+m;l.push(_,M,b),l.push(M,T,b)}this.setIndex(l),this.setAttribute("position",new Xt(c,3)),this.setAttribute("normal",new Xt(u,3)),this.setAttribute("uv",new Xt(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new W0(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}}function Zs(n){const e={};for(const t in n){e[t]={};for(const i in n[t]){const r=n[t][i];r&&(r.isColor||r.isMatrix3||r.isMatrix4||r.isVector2||r.isVector3||r.isVector4||r.isTexture||r.isQuaternion)?r.isRenderTargetTexture?(et("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone():Array.isArray(r)?e[t][i]=r.slice():e[t][i]=r}}return e}function An(n){const e={};for(let t=0;t<n.length;t++){const i=Zs(n[t]);for(const r in i)e[r]=i[r]}return e}function eT(n){const e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function j0(n){const e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:yt.workingColorSpace}const tT={clone:Zs,merge:An};var nT=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,iT=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ki extends Oi{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=nT,this.fragmentShader=iT,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Zs(e.uniforms),this.uniformsGroups=eT(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const o=this.uniforms[r].value;o&&o.isTexture?t.uniforms[r]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[r]={type:"m4",value:o.toArray()}:t.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const i={};for(const r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}}class rT extends ki{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class qh extends Oi{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new ft(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ft(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=C0,this.normalScale=new St(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Bi,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}}class Hi extends qh{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new St(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return vt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new ft(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new ft(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new ft(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}}class sT extends Oi{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Kb,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class oT extends Oi{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}function Za(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function aT(n){function e(r,s){return n[r]-n[s]}const t=n.length,i=new Array(t);for(let r=0;r!==t;++r)i[r]=r;return i.sort(e),i}function Nm(n,e,t){const i=n.length,r=new n.constructor(i);for(let s=0,o=0;o!==i;++s){const a=t[s]*e;for(let l=0;l!==e;++l)r[o++]=n[a+l]}return r}function X0(n,e,t,i){let r=1,s=n[0];for(;s!==void 0&&s[i]===void 0;)s=n[r++];if(s===void 0)return;let o=s[i];if(o!==void 0)if(Array.isArray(o))do o=s[i],o!==void 0&&(e.push(s.time),t.push(...o)),s=n[r++];while(s!==void 0);else if(o.toArray!==void 0)do o=s[i],o!==void 0&&(e.push(s.time),o.toArray(t,t.length)),s=n[r++];while(s!==void 0);else do o=s[i],o!==void 0&&(e.push(s.time),t.push(o)),s=n[r++];while(s!==void 0)}class so{constructor(e,t,i,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){const t=this.parameterPositions;let i=this._cachedIndex,r=t[i],s=t[i-1];e:{t:{let o;n:{i:if(!(e<r)){for(let a=i+2;;){if(r===void 0){if(e<s)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(s=r,r=t[++i],e<r)break t}o=t.length;break n}if(!(e>=s)){const a=t[1];e<a&&(i=2,s=a);for(let l=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(r=s,s=t[--i-1],e>=s)break t}o=i,i=0;break n}break e}for(;i<o;){const a=i+o>>>1;e<t[a]?o=a:i=a+1}if(r=t[i],s=t[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,r)}return this.interpolate_(i,s,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){const t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=e*r;for(let o=0;o!==r;++o)t[o]=i[s+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}}class lT extends so{constructor(e,t,i,r){super(e,t,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Qp,endingEnd:Qp}}intervalChanged_(e,t,i){const r=this.parameterPositions;let s=e-2,o=e+1,a=r[s],l=r[o];if(a===void 0)switch(this.getSettings_().endingStart){case em:s=e,a=2*t-i;break;case tm:s=r.length-2,a=t+r[s]-r[s+1];break;default:s=e,a=i}if(l===void 0)switch(this.getSettings_().endingEnd){case em:o=e,l=2*i-t;break;case tm:o=1,l=i+r[1]-r[0];break;default:o=e-1,l=t}const c=(i-t)*.5,u=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-i),this._offsetPrev=s*u,this._offsetNext=o*u}interpolate_(e,t,i,r){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,u=this._offsetPrev,h=this._offsetNext,d=this._weightPrev,g=this._weightNext,p=(i-t)/(r-t),x=p*p,m=x*p,_=-d*m+2*d*x-d*p,M=(1+d)*m+(-1.5-2*d)*x+(-.5+d)*p+1,T=(-1-g)*m+(1.5+g)*x+.5*p,b=g*m-g*x;for(let I=0;I!==a;++I)s[I]=_*o[u+I]+M*o[c+I]+T*o[l+I]+b*o[h+I];return s}}class cT extends so{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,u=(i-t)/(r-t),h=1-u;for(let d=0;d!==a;++d)s[d]=o[c+d]*h+o[l+d]*u;return s}}class uT extends so{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e){return this.copySampleValue_(e-1)}}class fT extends so{interpolate_(e,t,i,r){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,u=this.settings||this.DefaultSettings_,h=u.inTangents,d=u.outTangents;if(!h||!d){const x=(i-t)/(r-t),m=1-x;for(let _=0;_!==a;++_)s[_]=o[c+_]*m+o[l+_]*x;return s}const g=a*2,p=e-1;for(let x=0;x!==a;++x){const m=o[c+x],_=o[l+x],M=p*g+x*2,T=d[M],b=d[M+1],I=e*g+x*2,D=h[I],B=h[I+1];let E=(i-t)/(r-t),w,L,R,U,H;for(let q=0;q<8;q++){w=E*E,L=w*E,R=1-E,U=R*R,H=U*R;const O=H*t+3*U*E*T+3*R*w*D+L*r-i;if(Math.abs(O)<1e-10)break;const j=3*U*(T-t)+6*R*E*(D-T)+3*w*(r-D);if(Math.abs(j)<1e-10)break;E=E-O/j,E=Math.max(0,Math.min(1,E))}s[x]=H*m+3*U*E*b+3*R*w*B+L*_}return s}}class gi{constructor(e,t,i,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Za(t,this.TimeBufferType),this.values=Za(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){const t=e.constructor;let i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Za(e.times,Array),values:Za(e.values,Array)};const r=e.getInterpolation();r!==e.DefaultInterpolation&&(i.interpolation=r)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new uT(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new cT(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new lT(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){const t=new fT(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.settings=this.settings),t}setInterpolation(e){let t;switch(e){case Qo:t=this.InterpolantFactoryMethodDiscrete;break;case ea:t=this.InterpolantFactoryMethodLinear;break;case iu:t=this.InterpolantFactoryMethodSmooth;break;case Zp:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){const i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return et("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Qo;case this.InterpolantFactoryMethodLinear:return ea;case this.InterpolantFactoryMethodSmooth:return iu;case this.InterpolantFactoryMethodBezier:return Zp}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){const t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]+=e}return this}scale(e){if(e!==1){const t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]*=e}return this}trim(e,t){const i=this.times,r=i.length;let s=0,o=r-1;for(;s!==r&&i[s]<e;)++s;for(;o!==-1&&i[o]>t;)--o;if(++o,s!==0||o!==r){s>=o&&(o=Math.max(o,1),s=o-1);const a=this.getValueSize();this.times=i.slice(s,o),this.values=this.values.slice(s*a,o*a)}return this}validate(){let e=!0;const t=this.getValueSize();t-Math.floor(t)!==0&&(ot("KeyframeTrack: Invalid value size in track.",this),e=!1);const i=this.times,r=this.values,s=i.length;s===0&&(ot("KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==s;a++){const l=i[a];if(typeof l=="number"&&isNaN(l)){ot("KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){ot("KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(r!==void 0&&iE(r))for(let a=0,l=r.length;a!==l;++a){const c=r[a];if(isNaN(c)){ot("KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){const e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===iu,s=e.length-1;let o=1;for(let a=1;a<s;++a){let l=!1;const c=e[a],u=e[a+1];if(c!==u&&(a!==1||c!==e[0]))if(r)l=!0;else{const h=a*i,d=h-i,g=h+i;for(let p=0;p!==i;++p){const x=t[h+p];if(x!==t[d+p]||x!==t[g+p]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];const h=a*i,d=o*i;for(let g=0;g!==i;++g)t[d+g]=t[h+g]}++o}}if(s>0){e[o]=e[s];for(let a=s*i,l=o*i,c=0;c!==i;++c)t[l+c]=t[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*i)):(this.times=e,this.values=t),this}clone(){const e=this.times.slice(),t=this.values.slice(),i=this.constructor,r=new i(this.name,e,t);return r.createInterpolant=this.createInterpolant,r}}gi.prototype.ValueTypeName="";gi.prototype.TimeBufferType=Float32Array;gi.prototype.ValueBufferType=Float32Array;gi.prototype.DefaultInterpolation=ea;class oo extends gi{constructor(e,t,i){super(e,t,i)}}oo.prototype.ValueTypeName="bool";oo.prototype.ValueBufferType=Array;oo.prototype.DefaultInterpolation=Qo;oo.prototype.InterpolantFactoryMethodLinear=void 0;oo.prototype.InterpolantFactoryMethodSmooth=void 0;class q0 extends gi{constructor(e,t,i,r){super(e,t,i,r)}}q0.prototype.ValueTypeName="color";class Qs extends gi{constructor(e,t,i,r){super(e,t,i,r)}}Qs.prototype.ValueTypeName="number";class hT extends so{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(i-t)/(r-t);let c=e*a;for(let u=c+a;c!==u;c+=4)mr.slerpFlat(s,0,o,c-a,o,c,l);return s}}class eo extends gi{constructor(e,t,i,r){super(e,t,i,r)}InterpolantFactoryMethodLinear(e){return new hT(this.times,this.values,this.getValueSize(),e)}}eo.prototype.ValueTypeName="quaternion";eo.prototype.InterpolantFactoryMethodSmooth=void 0;class ao extends gi{constructor(e,t,i){super(e,t,i)}}ao.prototype.ValueTypeName="string";ao.prototype.ValueBufferType=Array;ao.prototype.DefaultInterpolation=Qo;ao.prototype.InterpolantFactoryMethodLinear=void 0;ao.prototype.InterpolantFactoryMethodSmooth=void 0;class to extends gi{constructor(e,t,i,r){super(e,t,i,r)}}to.prototype.ValueTypeName="vector";class dT{constructor(e="",t=-1,i=[],r=Xb){this.name=e,this.tracks=i,this.duration=t,this.blendMode=r,this.uuid=fi(),this.userData={},this.duration<0&&this.resetDuration()}static parse(e){const t=[],i=e.tracks,r=1/(e.fps||1);for(let o=0,a=i.length;o!==a;++o)t.push(mT(i[o]).scale(r));const s=new this(e.name,e.duration,t,e.blendMode);return s.uuid=e.uuid,s.userData=JSON.parse(e.userData||"{}"),s}static toJSON(e){const t=[],i=e.tracks,r={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode,userData:JSON.stringify(e.userData)};for(let s=0,o=i.length;s!==o;++s)t.push(gi.toJSON(i[s]));return r}static CreateFromMorphTargetSequence(e,t,i,r){const s=t.length,o=[];for(let a=0;a<s;a++){let l=[],c=[];l.push((a+s-1)%s,a,(a+1)%s),c.push(0,1,0);const u=aT(l);l=Nm(l,1,u),c=Nm(c,1,u),!r&&l[0]===0&&(l.push(s),c.push(c[0])),o.push(new Qs(".morphTargetInfluences["+t[a].name+"]",l,c).scale(1/i))}return new this(e,-1,o)}static findByName(e,t){let i=e;if(!Array.isArray(e)){const r=e;i=r.geometry&&r.geometry.animations||r.animations}for(let r=0;r<i.length;r++)if(i[r].name===t)return i[r];return null}static CreateClipsFromMorphTargetSequences(e,t,i){const r={},s=/^([\w-]*?)([\d]+)$/;for(let a=0,l=e.length;a<l;a++){const c=e[a],u=c.name.match(s);if(u&&u.length>1){const h=u[1];let d=r[h];d||(r[h]=d=[]),d.push(c)}}const o=[];for(const a in r)o.push(this.CreateFromMorphTargetSequence(a,r[a],t,i));return o}static parseAnimation(e,t){if(et("AnimationClip: parseAnimation() is deprecated and will be removed with r185"),!e)return ot("AnimationClip: No animation in JSONLoader data."),null;const i=function(h,d,g,p,x){if(g.length!==0){const m=[],_=[];X0(g,m,_,p),m.length!==0&&x.push(new h(d,m,_))}},r=[],s=e.name||"default",o=e.fps||30,a=e.blendMode;let l=e.length||-1;const c=e.hierarchy||[];for(let h=0;h<c.length;h++){const d=c[h].keys;if(!(!d||d.length===0))if(d[0].morphTargets){const g={};let p;for(p=0;p<d.length;p++)if(d[p].morphTargets)for(let x=0;x<d[p].morphTargets.length;x++)g[d[p].morphTargets[x]]=-1;for(const x in g){const m=[],_=[];for(let M=0;M!==d[p].morphTargets.length;++M){const T=d[p];m.push(T.time),_.push(T.morphTarget===x?1:0)}r.push(new Qs(".morphTargetInfluence["+x+"]",m,_))}l=g.length*o}else{const g=".bones["+t[h].name+"]";i(to,g+".position",d,"pos",r),i(eo,g+".quaternion",d,"rot",r),i(to,g+".scale",d,"scl",r)}}return r.length===0?null:new this(s,l,r,a)}resetDuration(){const e=this.tracks;let t=0;for(let i=0,r=e.length;i!==r;++i){const s=this.tracks[i];t=Math.max(t,s.times[s.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){const e=[];for(let i=0;i<this.tracks.length;i++)e.push(this.tracks[i].clone());const t=new this.constructor(this.name,this.duration,e,this.blendMode);return t.userData=JSON.parse(JSON.stringify(this.userData)),t}toJSON(){return this.constructor.toJSON(this)}}function pT(n){switch(n.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Qs;case"vector":case"vector2":case"vector3":case"vector4":return to;case"color":return q0;case"quaternion":return eo;case"bool":case"boolean":return oo;case"string":return ao}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+n)}function mT(n){if(n.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const e=pT(n.type);if(n.times===void 0){const t=[],i=[];X0(n.keys,t,i,"value"),n.times=t,n.values=i}return e.parse!==void 0?e.parse(n):new e(n.name,n.times,n.values,n.interpolation)}const sr={enabled:!1,files:{},add:function(n,e){this.enabled!==!1&&(Um(n)||(this.files[n]=e))},get:function(n){if(this.enabled!==!1&&!Um(n))return this.files[n]},remove:function(n){delete this.files[n]},clear:function(){this.files={}}};function Um(n){try{const e=n.slice(n.indexOf(":")+1);return new URL(e).protocol==="blob:"}catch{return!1}}class gT{constructor(e,t,i){const r=this;let s=!1,o=0,a=0,l;const c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(u){a++,s===!1&&r.onStart!==void 0&&r.onStart(u,o,a),s=!0},this.itemEnd=function(u){o++,r.onProgress!==void 0&&r.onProgress(u,o,a),o===a&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(u){r.onError!==void 0&&r.onError(u)},this.resolveURL=function(u){return l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,h){return c.push(u,h),this},this.removeHandler=function(u){const h=c.indexOf(u);return h!==-1&&c.splice(h,2),this},this.getHandler=function(u){for(let h=0,d=c.length;h<d;h+=2){const g=c[h],p=c[h+1];if(g.global&&(g.lastIndex=0),g.test(u))return p}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const _T=new gT;class us{constructor(e){this.manager=e!==void 0?e:_T,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){const i=this;return new Promise(function(r,s){i.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}}us.DEFAULT_MATERIAL_NAME="__DEFAULT";const Zi={};class vT extends Error{constructor(e,t){super(e),this.response=t}}class Ul extends us{constructor(e){super(e),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(e,t,i,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=sr.get(`file:${e}`);if(s!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(s),this.manager.itemEnd(e)},0),s;if(Zi[e]!==void 0){Zi[e].push({onLoad:t,onProgress:i,onError:r});return}Zi[e]=[],Zi[e].push({onLoad:t,onProgress:i,onError:r});const o=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),a=this.mimeType,l=this.responseType;fetch(o).then(c=>{if(c.status===200||c.status===0){if(c.status===0&&et("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||c.body===void 0||c.body.getReader===void 0)return c;const u=Zi[e],h=c.body.getReader(),d=c.headers.get("X-File-Size")||c.headers.get("Content-Length"),g=d?parseInt(d):0,p=g!==0;let x=0;const m=new ReadableStream({start(_){M();function M(){h.read().then(({done:T,value:b})=>{if(T)_.close();else{x+=b.byteLength;const I=new ProgressEvent("progress",{lengthComputable:p,loaded:x,total:g});for(let D=0,B=u.length;D<B;D++){const E=u[D];E.onProgress&&E.onProgress(I)}_.enqueue(b),M()}},T=>{_.error(T)})}}});return new Response(m)}else throw new vT(`fetch for "${c.url}" responded with ${c.status}: ${c.statusText}`,c)}).then(c=>{switch(l){case"arraybuffer":return c.arrayBuffer();case"blob":return c.blob();case"document":return c.text().then(u=>new DOMParser().parseFromString(u,a));case"json":return c.json();default:if(a==="")return c.text();{const h=/charset="?([^;"\s]*)"?/i.exec(a),d=h&&h[1]?h[1].toLowerCase():void 0,g=new TextDecoder(d);return c.arrayBuffer().then(p=>g.decode(p))}}}).then(c=>{sr.add(`file:${e}`,c);const u=Zi[e];delete Zi[e];for(let h=0,d=u.length;h<d;h++){const g=u[h];g.onLoad&&g.onLoad(c)}}).catch(c=>{const u=Zi[e];if(u===void 0)throw this.manager.itemError(e),c;delete Zi[e];for(let h=0,d=u.length;h<d;h++){const g=u[h];g.onError&&g.onError(c)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const Rs=new WeakMap;class xT extends us{constructor(e){super(e)}load(e,t,i,r){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=this,o=sr.get(`image:${e}`);if(o!==void 0){if(o.complete===!0)s.manager.itemStart(e),setTimeout(function(){t&&t(o),s.manager.itemEnd(e)},0);else{let h=Rs.get(o);h===void 0&&(h=[],Rs.set(o,h)),h.push({onLoad:t,onError:r})}return o}const a=na("img");function l(){u(),t&&t(this);const h=Rs.get(this)||[];for(let d=0;d<h.length;d++){const g=h[d];g.onLoad&&g.onLoad(this)}Rs.delete(this),s.manager.itemEnd(e)}function c(h){u(),r&&r(h),sr.remove(`image:${e}`);const d=Rs.get(this)||[];for(let g=0;g<d.length;g++){const p=d[g];p.onError&&p.onError(h)}Rs.delete(this),s.manager.itemError(e),s.manager.itemEnd(e)}function u(){a.removeEventListener("load",l,!1),a.removeEventListener("error",c,!1)}return a.addEventListener("load",l,!1),a.addEventListener("error",c,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),sr.add(`image:${e}`,a),s.manager.itemStart(e),a.src=e,a}}class yT extends us{constructor(e){super(e)}load(e,t,i,r){const s=new Jt,o=new xT(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){s.image=a,s.needsUpdate=!0,t!==void 0&&t(s)},i,r),s}}class rc extends Gt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new ft(e),this.intensity=t}dispose(){this.dispatchEvent({type:"dispose"})}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){const t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}}const Pu=new mt,Om=new ee,Fm=new ee;class Kh{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new St(512,512),this.mapType=Hn,this.map=null,this.mapPass=null,this.matrix=new mt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Wh,this._frameExtents=new St(1,1),this._viewportCount=1,this._viewports=[new Vt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){const t=this.camera,i=this.matrix;Om.setFromMatrixPosition(e.matrixWorld),t.position.copy(Om),Fm.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Fm),t.updateMatrixWorld(),Pu.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(Pu,t.coordinateSystem,t.reversedDepth),t.coordinateSystem===ta||t.reversedDepth?i.set(.5,0,0,.5,0,.5,0,.5,0,0,1,0,0,0,0,1):i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(Pu)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}}const Qa=new ee,el=new mr,yi=new ee;class K0 extends Gt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new mt,this.projectionMatrix=new mt,this.projectionMatrixInverse=new mt,this.coordinateSystem=Ii,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Qa,el,yi),yi.x===1&&yi.y===1&&yi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Qa,el,yi.set(1,1,1)).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorld.decompose(Qa,el,yi),yi.x===1&&yi.y===1&&yi.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Qa,el,yi.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const wr=new ee,Bm=new St,km=new St;class Dn extends K0{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Js*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(Bs*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Js*2*Math.atan(Math.tan(Bs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){wr.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(wr.x,wr.y).multiplyScalar(-e/wr.z),wr.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(wr.x,wr.y).multiplyScalar(-e/wr.z)}getViewSize(e,t){return this.getViewBounds(e,Bm,km),t.subVectors(km,Bm)}setViewOffset(e,t,i,r,s,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(Bs*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r;const o=this.view;if(this.view!==null&&this.view.enabled){const l=o.fullWidth,c=o.fullHeight;s+=o.offsetX*r/l,t-=o.offsetY*i/c,r*=o.width/l,i*=o.height/c}const a=this.filmOffset;a!==0&&(s+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class ST extends Kh{constructor(){super(new Dn(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1,this.aspect=1}updateMatrices(e){const t=this.camera,i=Js*2*e.angle*this.focus,r=this.mapSize.width/this.mapSize.height*this.aspect,s=e.distance||t.far;(i!==t.fov||r!==t.aspect||s!==t.far)&&(t.fov=i,t.aspect=r,t.far=s,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}}class MT extends rc{constructor(e,t,i=0,r=Math.PI/3,s=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Gt.DEFAULT_UP),this.updateMatrix(),this.target=new Gt,this.distance=i,this.angle=r,this.penumbra=s,this.decay=o,this.map=null,this.shadow=new ST}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.map=e.map,this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.distance=this.distance,t.object.angle=this.angle,t.object.decay=this.decay,t.object.penumbra=this.penumbra,t.object.target=this.target.uuid,this.map&&this.map.isTexture&&(t.object.map=this.map.toJSON(e).uuid),t.object.shadow=this.shadow.toJSON(),t}}class bT extends Kh{constructor(){super(new Dn(90,1,.5,500)),this.isPointLightShadow=!0}}class ET extends rc{constructor(e,t,i=0,r=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=i,this.decay=r,this.shadow=new bT}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.distance=this.distance,t.object.decay=this.decay,t.object.shadow=this.shadow.toJSON(),t}}class sc extends K0{constructor(e=-1,t=1,i=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=i-e,o=i+e,a=r+t,l=r-t;if(this.view!==null&&this.view.enabled){const c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=c*this.view.offsetX,o=s+c*this.view.width,a-=u*this.view.offsetY,l=a-u*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class TT extends Kh{constructor(){super(new sc(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class AT extends rc{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Gt.DEFAULT_UP),this.updateMatrix(),this.target=new Gt,this.shadow=new TT}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){const t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}}class cL extends rc{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}}class Wo{static extractUrlBase(e){const t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}}const Lu=new WeakMap;class wT extends us{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&et("ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&et("ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"},this._abortController=new AbortController}setOptions(e){return this.options=e,this}load(e,t,i,r){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);const s=this,o=sr.get(`image-bitmap:${e}`);if(o!==void 0){if(s.manager.itemStart(e),o.then){o.then(c=>{if(Lu.has(o)===!0)r&&r(Lu.get(o)),s.manager.itemError(e),s.manager.itemEnd(e);else return t&&t(c),s.manager.itemEnd(e),c});return}return setTimeout(function(){t&&t(o),s.manager.itemEnd(e)},0),o}const a={};a.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",a.headers=this.requestHeader,a.signal=typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal;const l=fetch(e,a).then(function(c){return c.blob()}).then(function(c){return createImageBitmap(c,Object.assign(s.options,{colorSpaceConversion:"none"}))}).then(function(c){return sr.add(`image-bitmap:${e}`,c),t&&t(c),s.manager.itemEnd(e),c}).catch(function(c){r&&r(c),Lu.set(l,c),sr.remove(`image-bitmap:${e}`),s.manager.itemError(e),s.manager.itemEnd(e)});sr.add(`image-bitmap:${e}`,l),s.manager.itemStart(e)}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}const Cs=-90,Ps=1;class RT extends Gt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new Dn(Cs,Ps,e,t);r.layers=this.layers,this.add(r);const s=new Dn(Cs,Ps,e,t);s.layers=this.layers,this.add(s);const o=new Dn(Cs,Ps,e,t);o.layers=this.layers,this.add(o);const a=new Dn(Cs,Ps,e,t);a.layers=this.layers,this.add(a);const l=new Dn(Cs,Ps,e,t);l.layers=this.layers,this.add(l);const c=new Dn(Cs,Ps,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[i,r,s,o,a,l]=t;for(const c of t)this.remove(c);if(e===Ii)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===ta)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,o,a,l,c,u]=this.children,h=e.getRenderTarget(),d=e.getActiveCubeFace(),g=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;const x=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,1,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,2,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,3,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=x,e.setRenderTarget(i,5,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(h,d,g),e.xr.enabled=p,i.texture.needsPMREMUpdate=!0}}class CT extends Dn{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}const $h="\\[\\]\\.:\\/",PT=new RegExp("["+$h+"]","g"),Yh="[^"+$h+"]",LT="[^"+$h.replace("\\.","")+"]",IT=/((?:WC+[\/:])*)/.source.replace("WC",Yh),DT=/(WCOD+)?/.source.replace("WCOD",LT),NT=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Yh),UT=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Yh),OT=new RegExp("^"+IT+DT+NT+UT+"$"),FT=["material","materials","bones","map"];class BT{constructor(e,t,i){const r=i||Nt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();const i=this._targetGroup.nCachedObjects_,r=this._bindings[i];r!==void 0&&r.getValue(e,t)}setValue(e,t){const i=this._bindings;for(let r=this._targetGroup.nCachedObjects_,s=i.length;r!==s;++r)i[r].setValue(e,t)}bind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){const e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}}class Nt{constructor(e,t,i){this.path=t,this.parsedPath=i||Nt.parseTrackName(t),this.node=Nt.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new Nt.Composite(e,t,i):new Nt(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(PT,"")}static parseTrackName(e){const t=OT.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);const i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){const s=i.nodeName.substring(r+1);FT.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){const i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){const i=function(s){for(let o=0;o<s.length;o++){const a=s[o];if(a.name===t||a.uuid===t)return a;const l=i(a.children);if(l)return l}return null},r=i(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){const i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)e[t++]=i[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){const i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){const i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){const i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node;const t=this.parsedPath,i=t.objectName,r=t.propertyName;let s=t.propertyIndex;if(e||(e=Nt.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){et("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){ot("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){ot("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){ot("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===c){c=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){ot("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){ot("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){ot("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){ot("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}const o=e[r];if(o===void 0){const c=t.nodeName;ot("PropertyBinding: Trying to update property for track: "+c+"."+r+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(s!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry){ot("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){ot("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=s}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=r;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}Nt.Composite=BT;Nt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Nt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Nt.prototype.GetterByBindingType=[Nt.prototype._getValue_direct,Nt.prototype._getValue_array,Nt.prototype._getValue_arrayElement,Nt.prototype._getValue_toArray];Nt.prototype.SetterByBindingTypeAndVersioning=[[Nt.prototype._setValue_direct,Nt.prototype._setValue_direct_setNeedsUpdate,Nt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Nt.prototype._setValue_array,Nt.prototype._setValue_array_setNeedsUpdate,Nt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Nt.prototype._setValue_arrayElement,Nt.prototype._setValue_arrayElement_setNeedsUpdate,Nt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Nt.prototype._setValue_fromArray,Nt.prototype._setValue_fromArray_setNeedsUpdate,Nt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];function Vm(n,e,t,i){const r=kT(i);switch(t){case A0:return n*e;case Nh:return n*e/r.components*r.byteLength;case Uh:return n*e/r.components*r.byteLength;case Ys:return n*e*2/r.components*r.byteLength;case Oh:return n*e*2/r.components*r.byteLength;case w0:return n*e*3/r.components*r.byteLength;case Qn:return n*e*4/r.components*r.byteLength;case Fh:return n*e*4/r.components*r.byteLength;case pl:case ml:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case gl:case _l:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case vf:case yf:return Math.max(n,16)*Math.max(e,8)/4;case _f:case xf:return Math.max(n,8)*Math.max(e,8)/2;case Sf:case Mf:case Ef:case Tf:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case bf:case Af:case wf:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Rf:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Cf:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case Pf:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Lf:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case If:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case Df:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case Nf:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Uf:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Of:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Ff:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Bf:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case kf:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Vf:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case Hf:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case zf:case Gf:case Wf:return Math.ceil(n/4)*Math.ceil(e/4)*16;case jf:case Xf:return Math.ceil(n/4)*Math.ceil(e/4)*8;case qf:case Kf:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function kT(n){switch(n){case Hn:case M0:return{byteLength:1,components:1};case Jo:case b0:case hr:return{byteLength:2,components:1};case Ih:case Dh:return{byteLength:2,components:4};case Fi:case Lh:case Zn:return{byteLength:4,components:1};case E0:case T0:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ph}}));typeof window<"u"&&(window.__THREE__?et("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ph);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function $0(){let n=null,e=!1,t=null,i=null;function r(s,o){t(s,o),i=n.requestAnimationFrame(r)}return{start:function(){e!==!0&&t!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function VT(n){const e=new WeakMap;function t(a,l){const c=a.array,u=a.usage,h=c.byteLength,d=n.createBuffer();n.bindBuffer(l,d),n.bufferData(l,c,u),a.onUploadCallback();let g;if(c instanceof Float32Array)g=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)g=n.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?g=n.HALF_FLOAT:g=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)g=n.SHORT;else if(c instanceof Uint32Array)g=n.UNSIGNED_INT;else if(c instanceof Int32Array)g=n.INT;else if(c instanceof Int8Array)g=n.BYTE;else if(c instanceof Uint8Array)g=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)g=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:d,type:g,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:h}}function i(a,l,c){const u=l.array,h=l.updateRanges;if(n.bindBuffer(c,a),h.length===0)n.bufferSubData(c,0,u);else{h.sort((g,p)=>g.start-p.start);let d=0;for(let g=1;g<h.length;g++){const p=h[d],x=h[g];x.start<=p.start+p.count+1?p.count=Math.max(p.count,x.start+x.count-p.start):(++d,h[d]=x)}h.length=d+1;for(let g=0,p=h.length;g<p;g++){const x=h[g];n.bufferSubData(c,x.start*u.BYTES_PER_ELEMENT,u,x.start,x.count)}l.clearUpdateRanges()}l.onUploadCallback()}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);const l=e.get(a);l&&(n.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){const u=e.get(a);(!u||u.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}const c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:r,remove:s,update:o}}var HT=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,zT=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,GT=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,WT=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,jT=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,XT=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,qT=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,KT=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,$T=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,YT=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,JT=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,ZT=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,QT=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,eA=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,tA=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,nA=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,iA=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,rA=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,sA=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,oA=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,aA=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,lA=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,cA=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,uA=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,fA=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,hA=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,dA=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,pA=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,mA=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,gA=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,_A="gl_FragColor = linearToOutputTexel( gl_FragColor );",vA=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,xA=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,yA=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,SA=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,MA=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,bA=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,EA=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,TA=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,AA=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,wA=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,RA=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,CA=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,PA=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,LA=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,IA=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,DA=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,NA=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,UA=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,OA=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,FA=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,BA=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,kA=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
		vec3 iridescenceFresnelDielectric;
		vec3 iridescenceFresnelMetallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return v;
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
vec3 BRDF_GGX_Multiscatter( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 singleScatter = BRDF_GGX( lightDir, viewDir, normal, material );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 dfgV = texture2D( dfgLUT, vec2( material.roughness, dotNV ) ).rg;
	vec2 dfgL = texture2D( dfgLUT, vec2( material.roughness, dotNL ) ).rg;
	vec3 FssEss_V = material.specularColorBlended * dfgV.x + material.specularF90 * dfgV.y;
	vec3 FssEss_L = material.specularColorBlended * dfgL.x + material.specularF90 * dfgL.y;
	float Ess_V = dfgV.x + dfgV.y;
	float Ess_L = dfgL.x + dfgL.y;
	float Ems_V = 1.0 - Ess_V;
	float Ems_L = 1.0 - Ess_L;
	vec3 Favg = material.specularColorBlended + ( 1.0 - material.specularColorBlended ) * 0.047619;
	vec3 Fms = FssEss_V * FssEss_L * Favg / ( 1.0 - Ems_V * Ems_L * Favg + EPSILON );
	float compensationFactor = Ems_V * Ems_L;
	vec3 multiScatter = Fms * compensationFactor;
	return singleScatter + multiScatter;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX_Multiscatter( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnelDielectric, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceFresnelMetallic, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( geometryNormal, geometryViewDir, material.diffuseColor, material.specularF90, material.roughness, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,VA=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( material.iridescenceFresnelDielectric, material.iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,HA=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,zA=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,GA=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,WA=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,jA=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,XA=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,qA=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,KA=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,$A=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,YA=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,JA=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,ZA=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,QA=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,ew=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,tw=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,nw=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,iw=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,rw=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,sw=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,ow=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,aw=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,lw=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,cw=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,uw=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,fw=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,hw=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,dw=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,pw=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,mw=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,gw=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,_w=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,vw=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,xw=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,yw=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Sw=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Mw=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,bw=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Ew=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Tw=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Aw=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ww=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Rw=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Cw=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Pw=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Lw=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Iw=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Dw=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Nw=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Uw=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Ow=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Fw=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Bw=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,kw=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Vw=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Hw=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,zw=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Gw=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ww=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,jw=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Xw=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,qw=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Kw=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,$w=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Yw=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Jw=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zw=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Qw=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,eR=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,tR=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,nR=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,iR=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,rR=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,sR=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,oR=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,aR=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,lR=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,cR=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,uR=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,fR=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hR=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,dR=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pR=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,mR=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,gR=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,_R=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,vR=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,xR=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,pt={alphahash_fragment:HT,alphahash_pars_fragment:zT,alphamap_fragment:GT,alphamap_pars_fragment:WT,alphatest_fragment:jT,alphatest_pars_fragment:XT,aomap_fragment:qT,aomap_pars_fragment:KT,batching_pars_vertex:$T,batching_vertex:YT,begin_vertex:JT,beginnormal_vertex:ZT,bsdfs:QT,iridescence_fragment:eA,bumpmap_pars_fragment:tA,clipping_planes_fragment:nA,clipping_planes_pars_fragment:iA,clipping_planes_pars_vertex:rA,clipping_planes_vertex:sA,color_fragment:oA,color_pars_fragment:aA,color_pars_vertex:lA,color_vertex:cA,common:uA,cube_uv_reflection_fragment:fA,defaultnormal_vertex:hA,displacementmap_pars_vertex:dA,displacementmap_vertex:pA,emissivemap_fragment:mA,emissivemap_pars_fragment:gA,colorspace_fragment:_A,colorspace_pars_fragment:vA,envmap_fragment:xA,envmap_common_pars_fragment:yA,envmap_pars_fragment:SA,envmap_pars_vertex:MA,envmap_physical_pars_fragment:DA,envmap_vertex:bA,fog_vertex:EA,fog_pars_vertex:TA,fog_fragment:AA,fog_pars_fragment:wA,gradientmap_pars_fragment:RA,lightmap_pars_fragment:CA,lights_lambert_fragment:PA,lights_lambert_pars_fragment:LA,lights_pars_begin:IA,lights_toon_fragment:NA,lights_toon_pars_fragment:UA,lights_phong_fragment:OA,lights_phong_pars_fragment:FA,lights_physical_fragment:BA,lights_physical_pars_fragment:kA,lights_fragment_begin:VA,lights_fragment_maps:HA,lights_fragment_end:zA,logdepthbuf_fragment:GA,logdepthbuf_pars_fragment:WA,logdepthbuf_pars_vertex:jA,logdepthbuf_vertex:XA,map_fragment:qA,map_pars_fragment:KA,map_particle_fragment:$A,map_particle_pars_fragment:YA,metalnessmap_fragment:JA,metalnessmap_pars_fragment:ZA,morphinstance_vertex:QA,morphcolor_vertex:ew,morphnormal_vertex:tw,morphtarget_pars_vertex:nw,morphtarget_vertex:iw,normal_fragment_begin:rw,normal_fragment_maps:sw,normal_pars_fragment:ow,normal_pars_vertex:aw,normal_vertex:lw,normalmap_pars_fragment:cw,clearcoat_normal_fragment_begin:uw,clearcoat_normal_fragment_maps:fw,clearcoat_pars_fragment:hw,iridescence_pars_fragment:dw,opaque_fragment:pw,packing:mw,premultiplied_alpha_fragment:gw,project_vertex:_w,dithering_fragment:vw,dithering_pars_fragment:xw,roughnessmap_fragment:yw,roughnessmap_pars_fragment:Sw,shadowmap_pars_fragment:Mw,shadowmap_pars_vertex:bw,shadowmap_vertex:Ew,shadowmask_pars_fragment:Tw,skinbase_vertex:Aw,skinning_pars_vertex:ww,skinning_vertex:Rw,skinnormal_vertex:Cw,specularmap_fragment:Pw,specularmap_pars_fragment:Lw,tonemapping_fragment:Iw,tonemapping_pars_fragment:Dw,transmission_fragment:Nw,transmission_pars_fragment:Uw,uv_pars_fragment:Ow,uv_pars_vertex:Fw,uv_vertex:Bw,worldpos_vertex:kw,background_vert:Vw,background_frag:Hw,backgroundCube_vert:zw,backgroundCube_frag:Gw,cube_vert:Ww,cube_frag:jw,depth_vert:Xw,depth_frag:qw,distance_vert:Kw,distance_frag:$w,equirect_vert:Yw,equirect_frag:Jw,linedashed_vert:Zw,linedashed_frag:Qw,meshbasic_vert:eR,meshbasic_frag:tR,meshlambert_vert:nR,meshlambert_frag:iR,meshmatcap_vert:rR,meshmatcap_frag:sR,meshnormal_vert:oR,meshnormal_frag:aR,meshphong_vert:lR,meshphong_frag:cR,meshphysical_vert:uR,meshphysical_frag:fR,meshtoon_vert:hR,meshtoon_frag:dR,points_vert:pR,points_frag:mR,shadow_vert:gR,shadow_frag:_R,sprite_vert:vR,sprite_frag:xR},ke={common:{diffuse:{value:new ft(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new dt},alphaMap:{value:null},alphaMapTransform:{value:new dt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new dt}},envmap:{envMap:{value:null},envMapRotation:{value:new dt},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new dt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new dt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new dt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new dt},normalScale:{value:new St(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new dt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new dt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new dt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new dt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ft(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new ft(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new dt},alphaTest:{value:0},uvTransform:{value:new dt}},sprite:{diffuse:{value:new ft(16777215)},opacity:{value:1},center:{value:new St(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new dt},alphaMap:{value:null},alphaMapTransform:{value:new dt},alphaTest:{value:0}}},Ri={basic:{uniforms:An([ke.common,ke.specularmap,ke.envmap,ke.aomap,ke.lightmap,ke.fog]),vertexShader:pt.meshbasic_vert,fragmentShader:pt.meshbasic_frag},lambert:{uniforms:An([ke.common,ke.specularmap,ke.envmap,ke.aomap,ke.lightmap,ke.emissivemap,ke.bumpmap,ke.normalmap,ke.displacementmap,ke.fog,ke.lights,{emissive:{value:new ft(0)},envMapIntensity:{value:1}}]),vertexShader:pt.meshlambert_vert,fragmentShader:pt.meshlambert_frag},phong:{uniforms:An([ke.common,ke.specularmap,ke.envmap,ke.aomap,ke.lightmap,ke.emissivemap,ke.bumpmap,ke.normalmap,ke.displacementmap,ke.fog,ke.lights,{emissive:{value:new ft(0)},specular:{value:new ft(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:pt.meshphong_vert,fragmentShader:pt.meshphong_frag},standard:{uniforms:An([ke.common,ke.envmap,ke.aomap,ke.lightmap,ke.emissivemap,ke.bumpmap,ke.normalmap,ke.displacementmap,ke.roughnessmap,ke.metalnessmap,ke.fog,ke.lights,{emissive:{value:new ft(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:pt.meshphysical_vert,fragmentShader:pt.meshphysical_frag},toon:{uniforms:An([ke.common,ke.aomap,ke.lightmap,ke.emissivemap,ke.bumpmap,ke.normalmap,ke.displacementmap,ke.gradientmap,ke.fog,ke.lights,{emissive:{value:new ft(0)}}]),vertexShader:pt.meshtoon_vert,fragmentShader:pt.meshtoon_frag},matcap:{uniforms:An([ke.common,ke.bumpmap,ke.normalmap,ke.displacementmap,ke.fog,{matcap:{value:null}}]),vertexShader:pt.meshmatcap_vert,fragmentShader:pt.meshmatcap_frag},points:{uniforms:An([ke.points,ke.fog]),vertexShader:pt.points_vert,fragmentShader:pt.points_frag},dashed:{uniforms:An([ke.common,ke.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:pt.linedashed_vert,fragmentShader:pt.linedashed_frag},depth:{uniforms:An([ke.common,ke.displacementmap]),vertexShader:pt.depth_vert,fragmentShader:pt.depth_frag},normal:{uniforms:An([ke.common,ke.bumpmap,ke.normalmap,ke.displacementmap,{opacity:{value:1}}]),vertexShader:pt.meshnormal_vert,fragmentShader:pt.meshnormal_frag},sprite:{uniforms:An([ke.sprite,ke.fog]),vertexShader:pt.sprite_vert,fragmentShader:pt.sprite_frag},background:{uniforms:{uvTransform:{value:new dt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:pt.background_vert,fragmentShader:pt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new dt}},vertexShader:pt.backgroundCube_vert,fragmentShader:pt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:pt.cube_vert,fragmentShader:pt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:pt.equirect_vert,fragmentShader:pt.equirect_frag},distance:{uniforms:An([ke.common,ke.displacementmap,{referencePosition:{value:new ee},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:pt.distance_vert,fragmentShader:pt.distance_frag},shadow:{uniforms:An([ke.lights,ke.fog,{color:{value:new ft(0)},opacity:{value:1}}]),vertexShader:pt.shadow_vert,fragmentShader:pt.shadow_frag}};Ri.physical={uniforms:An([Ri.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new dt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new dt},clearcoatNormalScale:{value:new St(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new dt},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new dt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new dt},sheen:{value:0},sheenColor:{value:new ft(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new dt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new dt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new dt},transmissionSamplerSize:{value:new St},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new dt},attenuationDistance:{value:0},attenuationColor:{value:new ft(0)},specularColor:{value:new ft(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new dt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new dt},anisotropyVector:{value:new St},anisotropyMap:{value:null},anisotropyMapTransform:{value:new dt}}]),vertexShader:pt.meshphysical_vert,fragmentShader:pt.meshphysical_frag};const tl={r:0,b:0,g:0},jr=new Bi,yR=new mt;function SR(n,e,t,i,r,s){const o=new ft(0);let a=r===!0?0:1,l,c,u=null,h=0,d=null;function g(M){let T=M.isScene===!0?M.background:null;if(T&&T.isTexture){const b=M.backgroundBlurriness>0;T=e.get(T,b)}return T}function p(M){let T=!1;const b=g(M);b===null?m(o,a):b&&b.isColor&&(m(b,1),T=!0);const I=n.xr.getEnvironmentBlendMode();I==="additive"?t.buffers.color.setClear(0,0,0,1,s):I==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(n.autoClear||T)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function x(M,T){const b=g(T);b&&(b.isCubeTexture||b.mapping===ec)?(c===void 0&&(c=new Wn(new pa(1,1,1),new ki({name:"BackgroundCubeMaterial",uniforms:Zs(Ri.backgroundCube.uniforms),vertexShader:Ri.backgroundCube.vertexShader,fragmentShader:Ri.backgroundCube.fragmentShader,side:On,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(I,D,B){this.matrixWorld.copyPosition(B.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),jr.copy(T.backgroundRotation),jr.x*=-1,jr.y*=-1,jr.z*=-1,b.isCubeTexture&&b.isRenderTargetTexture===!1&&(jr.y*=-1,jr.z*=-1),c.material.uniforms.envMap.value=b,c.material.uniforms.flipEnvMap.value=b.isCubeTexture&&b.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=T.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(yR.makeRotationFromEuler(jr)),c.material.toneMapped=yt.getTransfer(b.colorSpace)!==It,(u!==b||h!==b.version||d!==n.toneMapping)&&(c.material.needsUpdate=!0,u=b,h=b.version,d=n.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null)):b&&b.isTexture&&(l===void 0&&(l=new Wn(new ic(2,2),new ki({name:"BackgroundMaterial",uniforms:Zs(Ri.background.uniforms),vertexShader:Ri.background.vertexShader,fragmentShader:Ri.background.fragmentShader,side:fr,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=b,l.material.uniforms.backgroundIntensity.value=T.backgroundIntensity,l.material.toneMapped=yt.getTransfer(b.colorSpace)!==It,b.matrixAutoUpdate===!0&&b.updateMatrix(),l.material.uniforms.uvTransform.value.copy(b.matrix),(u!==b||h!==b.version||d!==n.toneMapping)&&(l.material.needsUpdate=!0,u=b,h=b.version,d=n.toneMapping),l.layers.enableAll(),M.unshift(l,l.geometry,l.material,0,0,null))}function m(M,T){M.getRGB(tl,j0(n)),t.buffers.color.setClear(tl.r,tl.g,tl.b,T,s)}function _(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return o},setClearColor:function(M,T=1){o.set(M),a=T,m(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(M){a=M,m(o,a)},render:p,addToRenderList:x,dispose:_}}function MR(n,e){const t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=d(null);let s=r,o=!1;function a(R,U,H,q,J){let O=!1;const j=h(R,q,H,U);s!==j&&(s=j,c(s.object)),O=g(R,q,H,J),O&&p(R,q,H,J),J!==null&&e.update(J,n.ELEMENT_ARRAY_BUFFER),(O||o)&&(o=!1,b(R,U,H,q),J!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(J).buffer))}function l(){return n.createVertexArray()}function c(R){return n.bindVertexArray(R)}function u(R){return n.deleteVertexArray(R)}function h(R,U,H,q){const J=q.wireframe===!0;let O=i[U.id];O===void 0&&(O={},i[U.id]=O);const j=R.isInstancedMesh===!0?R.id:0;let ie=O[j];ie===void 0&&(ie={},O[j]=ie);let X=ie[H.id];X===void 0&&(X={},ie[H.id]=X);let Y=X[J];return Y===void 0&&(Y=d(l()),X[J]=Y),Y}function d(R){const U=[],H=[],q=[];for(let J=0;J<t;J++)U[J]=0,H[J]=0,q[J]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:H,attributeDivisors:q,object:R,attributes:{},index:null}}function g(R,U,H,q){const J=s.attributes,O=U.attributes;let j=0;const ie=H.getAttributes();for(const X in ie)if(ie[X].location>=0){const ne=J[X];let fe=O[X];if(fe===void 0&&(X==="instanceMatrix"&&R.instanceMatrix&&(fe=R.instanceMatrix),X==="instanceColor"&&R.instanceColor&&(fe=R.instanceColor)),ne===void 0||ne.attribute!==fe||fe&&ne.data!==fe.data)return!0;j++}return s.attributesNum!==j||s.index!==q}function p(R,U,H,q){const J={},O=U.attributes;let j=0;const ie=H.getAttributes();for(const X in ie)if(ie[X].location>=0){let ne=O[X];ne===void 0&&(X==="instanceMatrix"&&R.instanceMatrix&&(ne=R.instanceMatrix),X==="instanceColor"&&R.instanceColor&&(ne=R.instanceColor));const fe={};fe.attribute=ne,ne&&ne.data&&(fe.data=ne.data),J[X]=fe,j++}s.attributes=J,s.attributesNum=j,s.index=q}function x(){const R=s.newAttributes;for(let U=0,H=R.length;U<H;U++)R[U]=0}function m(R){_(R,0)}function _(R,U){const H=s.newAttributes,q=s.enabledAttributes,J=s.attributeDivisors;H[R]=1,q[R]===0&&(n.enableVertexAttribArray(R),q[R]=1),J[R]!==U&&(n.vertexAttribDivisor(R,U),J[R]=U)}function M(){const R=s.newAttributes,U=s.enabledAttributes;for(let H=0,q=U.length;H<q;H++)U[H]!==R[H]&&(n.disableVertexAttribArray(H),U[H]=0)}function T(R,U,H,q,J,O,j){j===!0?n.vertexAttribIPointer(R,U,H,J,O):n.vertexAttribPointer(R,U,H,q,J,O)}function b(R,U,H,q){x();const J=q.attributes,O=H.getAttributes(),j=U.defaultAttributeValues;for(const ie in O){const X=O[ie];if(X.location>=0){let Y=J[ie];if(Y===void 0&&(ie==="instanceMatrix"&&R.instanceMatrix&&(Y=R.instanceMatrix),ie==="instanceColor"&&R.instanceColor&&(Y=R.instanceColor)),Y!==void 0){const ne=Y.normalized,fe=Y.itemSize,ye=e.get(Y);if(ye===void 0)continue;const je=ye.buffer,tt=ye.type,he=ye.bytesPerElement,Se=tt===n.INT||tt===n.UNSIGNED_INT||Y.gpuType===Lh;if(Y.isInterleavedBufferAttribute){const Me=Y.data,Le=Me.stride,Ae=Y.offset;if(Me.isInstancedInterleavedBuffer){for(let Fe=0;Fe<X.locationSize;Fe++)_(X.location+Fe,Me.meshPerAttribute);R.isInstancedMesh!==!0&&q._maxInstanceCount===void 0&&(q._maxInstanceCount=Me.meshPerAttribute*Me.count)}else for(let Fe=0;Fe<X.locationSize;Fe++)m(X.location+Fe);n.bindBuffer(n.ARRAY_BUFFER,je);for(let Fe=0;Fe<X.locationSize;Fe++)T(X.location+Fe,fe/X.locationSize,tt,ne,Le*he,(Ae+fe/X.locationSize*Fe)*he,Se)}else{if(Y.isInstancedBufferAttribute){for(let Me=0;Me<X.locationSize;Me++)_(X.location+Me,Y.meshPerAttribute);R.isInstancedMesh!==!0&&q._maxInstanceCount===void 0&&(q._maxInstanceCount=Y.meshPerAttribute*Y.count)}else for(let Me=0;Me<X.locationSize;Me++)m(X.location+Me);n.bindBuffer(n.ARRAY_BUFFER,je);for(let Me=0;Me<X.locationSize;Me++)T(X.location+Me,fe/X.locationSize,tt,ne,fe*he,fe/X.locationSize*Me*he,Se)}}else if(j!==void 0){const ne=j[ie];if(ne!==void 0)switch(ne.length){case 2:n.vertexAttrib2fv(X.location,ne);break;case 3:n.vertexAttrib3fv(X.location,ne);break;case 4:n.vertexAttrib4fv(X.location,ne);break;default:n.vertexAttrib1fv(X.location,ne)}}}}M()}function I(){w();for(const R in i){const U=i[R];for(const H in U){const q=U[H];for(const J in q){const O=q[J];for(const j in O)u(O[j].object),delete O[j];delete q[J]}}delete i[R]}}function D(R){if(i[R.id]===void 0)return;const U=i[R.id];for(const H in U){const q=U[H];for(const J in q){const O=q[J];for(const j in O)u(O[j].object),delete O[j];delete q[J]}}delete i[R.id]}function B(R){for(const U in i){const H=i[U];for(const q in H){const J=H[q];if(J[R.id]===void 0)continue;const O=J[R.id];for(const j in O)u(O[j].object),delete O[j];delete J[R.id]}}}function E(R){for(const U in i){const H=i[U],q=R.isInstancedMesh===!0?R.id:0,J=H[q];if(J!==void 0){for(const O in J){const j=J[O];for(const ie in j)u(j[ie].object),delete j[ie];delete J[O]}delete H[q],Object.keys(H).length===0&&delete i[U]}}}function w(){L(),o=!0,s!==r&&(s=r,c(s.object))}function L(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:w,resetDefaultState:L,dispose:I,releaseStatesOfGeometry:D,releaseStatesOfObject:E,releaseStatesOfProgram:B,initAttributes:x,enableAttribute:m,disableUnusedAttributes:M}}function bR(n,e,t){let i;function r(c){i=c}function s(c,u){n.drawArrays(i,c,u),t.update(u,i,1)}function o(c,u,h){h!==0&&(n.drawArraysInstanced(i,c,u,h),t.update(u,i,h))}function a(c,u,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,u,0,h);let g=0;for(let p=0;p<h;p++)g+=u[p];t.update(g,i,1)}function l(c,u,h,d){if(h===0)return;const g=e.get("WEBGL_multi_draw");if(g===null)for(let p=0;p<c.length;p++)o(c[p],u[p],d[p]);else{g.multiDrawArraysInstancedWEBGL(i,c,0,u,0,d,0,h);let p=0;for(let x=0;x<h;x++)p+=u[x]*d[x];t.update(p,i,1)}}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=l}function ER(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const B=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(B.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(B){return!(B!==Qn&&i.convert(B)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(B){const E=B===hr&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(B!==Hn&&i.convert(B)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE)&&B!==Zn&&!E)}function l(B){if(B==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";B="mediump"}return B==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp";const u=l(c);u!==c&&(et("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);const h=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),g=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),p=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),x=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),_=n.getParameter(n.MAX_VERTEX_ATTRIBS),M=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),T=n.getParameter(n.MAX_VARYING_VECTORS),b=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),I=n.getParameter(n.MAX_SAMPLES),D=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:h,reversedDepthBuffer:d,maxTextures:g,maxVertexTextures:p,maxTextureSize:x,maxCubemapSize:m,maxAttributes:_,maxVertexUniforms:M,maxVaryings:T,maxFragmentUniforms:b,maxSamples:I,samples:D}}function TR(n){const e=this;let t=null,i=0,r=!1,s=!1;const o=new $r,a=new dt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){const g=h.length!==0||d||i!==0||r;return r=d,i=h.length,g},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(h,d){t=u(h,d,0)},this.setState=function(h,d,g){const p=h.clippingPlanes,x=h.clipIntersection,m=h.clipShadows,_=n.get(h);if(!r||p===null||p.length===0||s&&!m)s?u(null):c();else{const M=s?0:i,T=M*4;let b=_.clippingState||null;l.value=b,b=u(p,d,T,g);for(let I=0;I!==T;++I)b[I]=t[I];_.clippingState=b,this.numIntersection=x?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(h,d,g,p){const x=h!==null?h.length:0;let m=null;if(x!==0){if(m=l.value,p!==!0||m===null){const _=g+x*4,M=d.matrixWorldInverse;a.getNormalMatrix(M),(m===null||m.length<_)&&(m=new Float32Array(_));for(let T=0,b=g;T!==x;++T,b+=4)o.copy(h[T]).applyMatrix4(M,a),o.normal.toArray(m,b),m[b+3]=o.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=x,e.numIntersection=0,m}}const Ir=4,Hm=[.125,.215,.35,.446,.526,.582],Zr=20,AR=256,Co=new sc,zm=new ft;let Iu=null,Du=0,Nu=0,Uu=!1;const wR=new ee;class Gm{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._sigmas=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){const{size:o=256,position:a=wR}=s;Iu=this._renderer.getRenderTarget(),Du=this._renderer.getActiveCubeFace(),Nu=this._renderer.getActiveMipmapLevel(),Uu=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);const l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,r,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Xm(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=jm(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Iu,Du,Nu),this._renderer.xr.enabled=Uu,e.scissorTest=!1,Ls(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===cs||e.mapping===Ks?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Iu=this._renderer.getRenderTarget(),Du=this._renderer.getActiveCubeFace(),Nu=this._renderer.getActiveMipmapLevel(),Uu=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:jt,minFilter:jt,generateMipmaps:!1,type:hr,format:Qn,colorSpace:bn,depthBuffer:!1},r=Wm(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Wm(e,t,i);const{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods,sigmas:this._sigmas}=RR(s)),this._blurMaterial=PR(s,e,t),this._ggxMaterial=CR(s,e,t)}return r}_compileMaterial(e){const t=new Wn(new dn,e);this._renderer.compile(t,Co)}_sceneToCubeUV(e,t,i,r,s){const l=new Dn(90,1,t,i),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,g=h.toneMapping;h.getClearColor(zm),h.toneMapping=Ni,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(r),h.clearDepth(),h.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Wn(new pa,new ns({name:"PMREM.Background",side:On,depthWrite:!1,depthTest:!1})));const x=this._backgroundBox,m=x.material;let _=!1;const M=e.background;M?M.isColor&&(m.color.copy(M),e.background=null,_=!0):(m.color.copy(zm),_=!0);for(let T=0;T<6;T++){const b=T%3;b===0?(l.up.set(0,c[T],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x+u[T],s.y,s.z)):b===1?(l.up.set(0,0,c[T]),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y+u[T],s.z)):(l.up.set(0,c[T],0),l.position.set(s.x,s.y,s.z),l.lookAt(s.x,s.y,s.z+u[T]));const I=this._cubeSize;Ls(r,b*I,T>2?I:0,I,I),h.setRenderTarget(r),_&&h.render(x,l),h.render(e,l)}h.toneMapping=g,h.autoClear=d,e.background=M}_textureToCubeUV(e,t){const i=this._renderer,r=e.mapping===cs||e.mapping===Ks;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Xm()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=jm());const s=r?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=s;const a=s.uniforms;a.envMap.value=e;const l=this._cubeSize;Ls(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,Co)}_applyPMREM(e){const t=this._renderer,i=t.autoClear;t.autoClear=!1;const r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){const r=this._renderer,s=this._pingPongRenderTarget,o=this._ggxMaterial,a=this._lodMeshes[i];a.material=o;const l=o.uniforms,c=i/(this._lodMeshes.length-1),u=t/(this._lodMeshes.length-1),h=Math.sqrt(c*c-u*u),d=0+c*1.25,g=h*d,{_lodMax:p}=this,x=this._sizeLods[i],m=3*x*(i>p-Ir?i-p+Ir:0),_=4*(this._cubeSize-x);l.envMap.value=e.texture,l.roughness.value=g,l.mipInt.value=p-t,Ls(s,m,_,3*x,2*x),r.setRenderTarget(s),r.render(a,Co),l.envMap.value=s.texture,l.roughness.value=0,l.mipInt.value=p-i,Ls(e,m,_,3*x,2*x),r.setRenderTarget(e),r.render(a,Co)}_blur(e,t,i,r,s){const o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,r,"latitudinal",s),this._halfBlur(o,e,i,i,r,"longitudinal",s)}_halfBlur(e,t,i,r,s,o,a){const l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&ot("blur direction must be either latitudinal or longitudinal!");const u=3,h=this._lodMeshes[r];h.material=c;const d=c.uniforms,g=this._sizeLods[i]-1,p=isFinite(s)?Math.PI/(2*g):2*Math.PI/(2*Zr-1),x=s/p,m=isFinite(s)?1+Math.floor(u*x):Zr;m>Zr&&et(`sigmaRadians, ${s}, is too large and will clip, as it requested ${m} samples when the maximum is set to ${Zr}`);const _=[];let M=0;for(let B=0;B<Zr;++B){const E=B/x,w=Math.exp(-E*E/2);_.push(w),B===0?M+=w:B<m&&(M+=2*w)}for(let B=0;B<_.length;B++)_[B]=_[B]/M;d.envMap.value=e.texture,d.samples.value=m,d.weights.value=_,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);const{_lodMax:T}=this;d.dTheta.value=p,d.mipInt.value=T-i;const b=this._sizeLods[r],I=3*b*(r>T-Ir?r-T+Ir:0),D=4*(this._cubeSize-b);Ls(t,I,D,3*b,2*b),l.setRenderTarget(t),l.render(h,Co)}}function RR(n){const e=[],t=[],i=[];let r=n;const s=n-Ir+1+Hm.length;for(let o=0;o<s;o++){const a=Math.pow(2,r);e.push(a);let l=1/a;o>n-Ir?l=Hm[o-n+Ir-1]:o===0&&(l=0),t.push(l);const c=1/(a-2),u=-c,h=1+c,d=[u,u,h,u,h,h,u,u,h,h,u,h],g=6,p=6,x=3,m=2,_=1,M=new Float32Array(x*p*g),T=new Float32Array(m*p*g),b=new Float32Array(_*p*g);for(let D=0;D<g;D++){const B=D%3*2/3-1,E=D>2?0:-1,w=[B,E,0,B+2/3,E,0,B+2/3,E+1,0,B,E,0,B+2/3,E+1,0,B,E+1,0];M.set(w,x*p*D),T.set(d,m*p*D);const L=[D,D,D,D,D,D];b.set(L,_*p*D)}const I=new dn;I.setAttribute("position",new hn(M,x)),I.setAttribute("uv",new hn(T,m)),I.setAttribute("faceIndex",new hn(b,_)),i.push(new Wn(I,null)),r>Ir&&r--}return{lodMeshes:i,sizeLods:e,sigmas:t}}function Wm(n,e,t){const i=new Ui(n,e,t);return i.texture.mapping=ec,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ls(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function CR(n,e,t){return new ki({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:AR,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:oc(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:or,depthTest:!1,depthWrite:!1})}function PR(n,e,t){const i=new Float32Array(Zr),r=new ee(0,1,0);return new ki({name:"SphericalGaussianBlur",defines:{n:Zr,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:i},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:r}},vertexShader:oc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:or,depthTest:!1,depthWrite:!1})}function jm(){return new ki({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:oc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:or,depthTest:!1,depthWrite:!1})}function Xm(){return new ki({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:oc(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:or,depthTest:!1,depthWrite:!1})}function oc(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}class Y0 extends Ui{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new V0(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new pa(5,5,5),s=new ki({name:"CubemapFromEquirect",uniforms:Zs(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:On,blending:or});s.uniforms.tEquirect.value=t;const o=new Wn(r,s),a=t.minFilter;return t.minFilter===rr&&(t.minFilter=jt),new RT(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){const s=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,r);e.setRenderTarget(s)}}function LR(n){let e=new WeakMap,t=new WeakMap,i=null;function r(d,g=!1){return d==null?null:g?o(d):s(d)}function s(d){if(d&&d.isTexture){const g=d.mapping;if(g===tu||g===nu)if(e.has(d)){const p=e.get(d).texture;return a(p,d.mapping)}else{const p=d.image;if(p&&p.height>0){const x=new Y0(p.height);return x.fromEquirectangularTexture(n,d),e.set(d,x),d.addEventListener("dispose",c),a(x.texture,d.mapping)}else return null}}return d}function o(d){if(d&&d.isTexture){const g=d.mapping,p=g===tu||g===nu,x=g===cs||g===Ks;if(p||x){let m=t.get(d);const _=m!==void 0?m.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==_)return i===null&&(i=new Gm(n)),m=p?i.fromEquirectangular(d,m):i.fromCubemap(d,m),m.texture.pmremVersion=d.pmremVersion,t.set(d,m),m.texture;if(m!==void 0)return m.texture;{const M=d.image;return p&&M&&M.height>0||x&&M&&l(M)?(i===null&&(i=new Gm(n)),m=p?i.fromEquirectangular(d):i.fromCubemap(d),m.texture.pmremVersion=d.pmremVersion,t.set(d,m),d.addEventListener("dispose",u),m.texture):null}}}return d}function a(d,g){return g===tu?d.mapping=cs:g===nu&&(d.mapping=Ks),d}function l(d){let g=0;const p=6;for(let x=0;x<p;x++)d[x]!==void 0&&g++;return g===p}function c(d){const g=d.target;g.removeEventListener("dispose",c);const p=e.get(g);p!==void 0&&(e.delete(g),p.dispose())}function u(d){const g=d.target;g.removeEventListener("dispose",u);const p=t.get(g);p!==void 0&&(t.delete(g),p.dispose())}function h(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:h}}function IR(n){const e={};function t(i){if(e[i]!==void 0)return e[i];const r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){const r=t(i);return r===null&&Il("WebGLRenderer: "+i+" extension not supported."),r}}}function DR(n,e,t,i){const r={},s=new WeakMap;function o(h){const d=h.target;d.index!==null&&e.remove(d.index);for(const p in d.attributes)e.remove(d.attributes[p]);d.removeEventListener("dispose",o),delete r[d.id];const g=s.get(d);g&&(e.remove(g),s.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(h,d){return r[d.id]===!0||(d.addEventListener("dispose",o),r[d.id]=!0,t.memory.geometries++),d}function l(h){const d=h.attributes;for(const g in d)e.update(d[g],n.ARRAY_BUFFER)}function c(h){const d=[],g=h.index,p=h.attributes.position;let x=0;if(p===void 0)return;if(g!==null){const M=g.array;x=g.version;for(let T=0,b=M.length;T<b;T+=3){const I=M[T+0],D=M[T+1],B=M[T+2];d.push(I,D,D,B,B,I)}}else{const M=p.array;x=p.version;for(let T=0,b=M.length/3-1;T<b;T+=3){const I=T+0,D=T+1,B=T+2;d.push(I,D,D,B,B,I)}}const m=new(p.count>=65535?U0:N0)(d,1);m.version=x;const _=s.get(h);_&&e.remove(_),s.set(h,m)}function u(h){const d=s.get(h);if(d){const g=h.index;g!==null&&d.version<g.version&&c(h)}else c(h);return s.get(h)}return{get:a,update:l,getWireframeAttribute:u}}function NR(n,e,t){let i;function r(d){i=d}let s,o;function a(d){s=d.type,o=d.bytesPerElement}function l(d,g){n.drawElements(i,g,s,d*o),t.update(g,i,1)}function c(d,g,p){p!==0&&(n.drawElementsInstanced(i,g,s,d*o,p),t.update(g,i,p))}function u(d,g,p){if(p===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,g,0,s,d,0,p);let m=0;for(let _=0;_<p;_++)m+=g[_];t.update(m,i,1)}function h(d,g,p,x){if(p===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let _=0;_<d.length;_++)c(d[_]/o,g[_],x[_]);else{m.multiDrawElementsInstancedWEBGL(i,g,0,s,d,0,x,0,p);let _=0;for(let M=0;M<p;M++)_+=g[M]*x[M];t.update(_,i,1)}}this.setMode=r,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=u,this.renderMultiDrawInstances=h}function UR(n){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(s/3);break;case n.LINES:t.lines+=a*(s/2);break;case n.LINE_STRIP:t.lines+=a*(s-1);break;case n.LINE_LOOP:t.lines+=a*s;break;case n.POINTS:t.points+=a*s;break;default:ot("WebGLInfo: Unknown draw mode:",o);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function OR(n,e,t){const i=new WeakMap,r=new Vt;function s(o,a,l){const c=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0;let d=i.get(a);if(d===void 0||d.count!==h){let w=function(){B.dispose(),i.delete(a),a.removeEventListener("dispose",w)};d!==void 0&&d.texture.dispose();const g=a.morphAttributes.position!==void 0,p=a.morphAttributes.normal!==void 0,x=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],_=a.morphAttributes.normal||[],M=a.morphAttributes.color||[];let T=0;g===!0&&(T=1),p===!0&&(T=2),x===!0&&(T=3);let b=a.attributes.position.count*T,I=1;b>e.maxTextureSize&&(I=Math.ceil(b/e.maxTextureSize),b=e.maxTextureSize);const D=new Float32Array(b*I*4*h),B=new L0(D,b,I,h);B.type=Zn,B.needsUpdate=!0;const E=T*4;for(let L=0;L<h;L++){const R=m[L],U=_[L],H=M[L],q=b*I*4*L;for(let J=0;J<R.count;J++){const O=J*E;g===!0&&(r.fromBufferAttribute(R,J),D[q+O+0]=r.x,D[q+O+1]=r.y,D[q+O+2]=r.z,D[q+O+3]=0),p===!0&&(r.fromBufferAttribute(U,J),D[q+O+4]=r.x,D[q+O+5]=r.y,D[q+O+6]=r.z,D[q+O+7]=0),x===!0&&(r.fromBufferAttribute(H,J),D[q+O+8]=r.x,D[q+O+9]=r.y,D[q+O+10]=r.z,D[q+O+11]=H.itemSize===4?r.w:1)}}d={count:h,texture:B,size:new St(b,I)},i.set(a,d),a.addEventListener("dispose",w)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let g=0;for(let x=0;x<c.length;x++)g+=c[x];const p=a.morphTargetsRelative?1:1-g;l.getUniforms().setValue(n,"morphTargetBaseInfluence",p),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",d.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",d.size)}return{update:s}}function FR(n,e,t,i,r){let s=new WeakMap;function o(c){const u=r.render.frame,h=c.geometry,d=e.get(c,h);if(s.get(d)!==u&&(e.update(d),s.set(d,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),s.get(c)!==u&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),s.set(c,u))),c.isSkinnedMesh){const g=c.skeleton;s.get(g)!==u&&(g.update(),s.set(g,u))}return d}function a(){s=new WeakMap}function l(c){const u=c.target;u.removeEventListener("dispose",l),i.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:o,dispose:a}}const BR={[d0]:"LINEAR_TONE_MAPPING",[p0]:"REINHARD_TONE_MAPPING",[m0]:"CINEON_TONE_MAPPING",[g0]:"ACES_FILMIC_TONE_MAPPING",[v0]:"AGX_TONE_MAPPING",[x0]:"NEUTRAL_TONE_MAPPING",[_0]:"CUSTOM_TONE_MAPPING"};function kR(n,e,t,i,r){const s=new Ui(e,t,{type:n,depthBuffer:i,stencilBuffer:r}),o=new Ui(e,t,{type:hr,depthBuffer:!1,stencilBuffer:!1}),a=new dn;a.setAttribute("position",new Xt([-1,3,0,-1,-1,0,3,-1,0],3)),a.setAttribute("uv",new Xt([0,2,0,0,2,0],2));const l=new rT({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),c=new Wn(a,l),u=new sc(-1,1,1,-1,0,1);let h=null,d=null,g=!1,p,x=null,m=[],_=!1;this.setSize=function(M,T){s.setSize(M,T),o.setSize(M,T);for(let b=0;b<m.length;b++){const I=m[b];I.setSize&&I.setSize(M,T)}},this.setEffects=function(M){m=M,_=m.length>0&&m[0].isRenderPass===!0;const T=s.width,b=s.height;for(let I=0;I<m.length;I++){const D=m[I];D.setSize&&D.setSize(T,b)}},this.begin=function(M,T){if(g||M.toneMapping===Ni&&m.length===0)return!1;if(x=T,T!==null){const b=T.width,I=T.height;(s.width!==b||s.height!==I)&&this.setSize(b,I)}return _===!1&&M.setRenderTarget(s),p=M.toneMapping,M.toneMapping=Ni,!0},this.hasRenderPass=function(){return _},this.end=function(M,T){M.toneMapping=p,g=!0;let b=s,I=o;for(let D=0;D<m.length;D++){const B=m[D];if(B.enabled!==!1&&(B.render(M,I,b,T),B.needsSwap!==!1)){const E=b;b=I,I=E}}if(h!==M.outputColorSpace||d!==M.toneMapping){h=M.outputColorSpace,d=M.toneMapping,l.defines={},yt.getTransfer(h)===It&&(l.defines.SRGB_TRANSFER="");const D=BR[d];D&&(l.defines[D]=""),l.needsUpdate=!0}l.uniforms.tDiffuse.value=b.texture,M.setRenderTarget(x),M.render(c,u),x=null,g=!1},this.isCompositing=function(){return g},this.dispose=function(){s.dispose(),o.dispose(),a.dispose(),l.dispose()}}const J0=new Jt,Qf=new ia(1,1),Z0=new L0,Q0=new CE,ev=new V0,qm=[],Km=[],$m=new Float32Array(16),Ym=new Float32Array(9),Jm=new Float32Array(4);function lo(n,e,t){const i=n[0];if(i<=0||i>0)return n;const r=e*t;let s=qm[r];if(s===void 0&&(s=new Float32Array(r),qm[r]=s),e!==0){i.toArray(s,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(s,a)}return s}function rn(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function sn(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function ac(n,e){let t=Km[e];t===void 0&&(t=new Int32Array(e),Km[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function VR(n,e){const t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function HR(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(rn(t,e))return;n.uniform2fv(this.addr,e),sn(t,e)}}function zR(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(rn(t,e))return;n.uniform3fv(this.addr,e),sn(t,e)}}function GR(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(rn(t,e))return;n.uniform4fv(this.addr,e),sn(t,e)}}function WR(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(rn(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),sn(t,e)}else{if(rn(t,i))return;Jm.set(i),n.uniformMatrix2fv(this.addr,!1,Jm),sn(t,i)}}function jR(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(rn(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),sn(t,e)}else{if(rn(t,i))return;Ym.set(i),n.uniformMatrix3fv(this.addr,!1,Ym),sn(t,i)}}function XR(n,e){const t=this.cache,i=e.elements;if(i===void 0){if(rn(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),sn(t,e)}else{if(rn(t,i))return;$m.set(i),n.uniformMatrix4fv(this.addr,!1,$m),sn(t,i)}}function qR(n,e){const t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function KR(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(rn(t,e))return;n.uniform2iv(this.addr,e),sn(t,e)}}function $R(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(rn(t,e))return;n.uniform3iv(this.addr,e),sn(t,e)}}function YR(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(rn(t,e))return;n.uniform4iv(this.addr,e),sn(t,e)}}function JR(n,e){const t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function ZR(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(rn(t,e))return;n.uniform2uiv(this.addr,e),sn(t,e)}}function QR(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(rn(t,e))return;n.uniform3uiv(this.addr,e),sn(t,e)}}function e1(n,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(rn(t,e))return;n.uniform4uiv(this.addr,e),sn(t,e)}}function t1(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(Qf.compareFunction=t.isReversedDepthBuffer()?kh:Bh,s=Qf):s=J0,t.setTexture2D(e||s,r)}function n1(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||Q0,r)}function i1(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||ev,r)}function r1(n,e,t){const i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||Z0,r)}function s1(n){switch(n){case 5126:return VR;case 35664:return HR;case 35665:return zR;case 35666:return GR;case 35674:return WR;case 35675:return jR;case 35676:return XR;case 5124:case 35670:return qR;case 35667:case 35671:return KR;case 35668:case 35672:return $R;case 35669:case 35673:return YR;case 5125:return JR;case 36294:return ZR;case 36295:return QR;case 36296:return e1;case 35678:case 36198:case 36298:case 36306:case 35682:return t1;case 35679:case 36299:case 36307:return n1;case 35680:case 36300:case 36308:case 36293:return i1;case 36289:case 36303:case 36311:case 36292:return r1}}function o1(n,e){n.uniform1fv(this.addr,e)}function a1(n,e){const t=lo(e,this.size,2);n.uniform2fv(this.addr,t)}function l1(n,e){const t=lo(e,this.size,3);n.uniform3fv(this.addr,t)}function c1(n,e){const t=lo(e,this.size,4);n.uniform4fv(this.addr,t)}function u1(n,e){const t=lo(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function f1(n,e){const t=lo(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function h1(n,e){const t=lo(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function d1(n,e){n.uniform1iv(this.addr,e)}function p1(n,e){n.uniform2iv(this.addr,e)}function m1(n,e){n.uniform3iv(this.addr,e)}function g1(n,e){n.uniform4iv(this.addr,e)}function _1(n,e){n.uniform1uiv(this.addr,e)}function v1(n,e){n.uniform2uiv(this.addr,e)}function x1(n,e){n.uniform3uiv(this.addr,e)}function y1(n,e){n.uniform4uiv(this.addr,e)}function S1(n,e,t){const i=this.cache,r=e.length,s=ac(t,r);rn(i,s)||(n.uniform1iv(this.addr,s),sn(i,s));let o;this.type===n.SAMPLER_2D_SHADOW?o=Qf:o=J0;for(let a=0;a!==r;++a)t.setTexture2D(e[a]||o,s[a])}function M1(n,e,t){const i=this.cache,r=e.length,s=ac(t,r);rn(i,s)||(n.uniform1iv(this.addr,s),sn(i,s));for(let o=0;o!==r;++o)t.setTexture3D(e[o]||Q0,s[o])}function b1(n,e,t){const i=this.cache,r=e.length,s=ac(t,r);rn(i,s)||(n.uniform1iv(this.addr,s),sn(i,s));for(let o=0;o!==r;++o)t.setTextureCube(e[o]||ev,s[o])}function E1(n,e,t){const i=this.cache,r=e.length,s=ac(t,r);rn(i,s)||(n.uniform1iv(this.addr,s),sn(i,s));for(let o=0;o!==r;++o)t.setTexture2DArray(e[o]||Z0,s[o])}function T1(n){switch(n){case 5126:return o1;case 35664:return a1;case 35665:return l1;case 35666:return c1;case 35674:return u1;case 35675:return f1;case 35676:return h1;case 5124:case 35670:return d1;case 35667:case 35671:return p1;case 35668:case 35672:return m1;case 35669:case 35673:return g1;case 5125:return _1;case 36294:return v1;case 36295:return x1;case 36296:return y1;case 35678:case 36198:case 36298:case 36306:case 35682:return S1;case 35679:case 36299:case 36307:return M1;case 35680:case 36300:case 36308:case 36293:return b1;case 36289:case 36303:case 36311:case 36292:return E1}}class A1{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=s1(t.type)}}class w1{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=T1(t.type)}}class R1{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){const r=this.seq;for(let s=0,o=r.length;s!==o;++s){const a=r[s];a.setValue(e,t[a.id],i)}}}const Ou=/(\w+)(\])?(\[|\.)?/g;function Zm(n,e){n.seq.push(e),n.map[e.id]=e}function C1(n,e,t){const i=n.name,r=i.length;for(Ou.lastIndex=0;;){const s=Ou.exec(i),o=Ou.lastIndex;let a=s[1];const l=s[2]==="]",c=s[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===r){Zm(t,c===void 0?new A1(a,n,e):new w1(a,n,e));break}else{let h=t.map[a];h===void 0&&(h=new R1(a),Zm(t,h)),t=h}}}class vl{constructor(e,t){this.seq=[],this.map={};const i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let o=0;o<i;++o){const a=e.getActiveUniform(t,o),l=e.getUniformLocation(t,a.name);C1(a,l,this)}const r=[],s=[];for(const o of this.seq)o.type===e.SAMPLER_2D_SHADOW||o.type===e.SAMPLER_CUBE_SHADOW||o.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(o):s.push(o);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,i,r){const s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){const r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,o=t.length;s!==o;++s){const a=t[s],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,r)}}static seqWithValue(e,t){const i=[];for(let r=0,s=e.length;r!==s;++r){const o=e[r];o.id in t&&i.push(o)}return i}}function Qm(n,e,t){const i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}const P1=37297;let L1=0;function I1(n,e){const t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let o=r;o<s;o++){const a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}const eg=new dt;function D1(n){yt._getMatrix(eg,yt.workingColorSpace,n);const e=`mat3( ${eg.elements.map(t=>t.toFixed(4))} )`;switch(yt.getTransfer(n)){case Pl:return[e,"LinearTransferOETF"];case It:return[e,"sRGBTransferOETF"];default:return et("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function tg(n,e,t){const i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";const o=/ERROR: 0:(\d+)/.exec(s);if(o){const a=parseInt(o[1]);return t.toUpperCase()+`

`+s+`

`+I1(n.getShaderSource(e),a)}else return s}function N1(n,e){const t=D1(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}const U1={[d0]:"Linear",[p0]:"Reinhard",[m0]:"Cineon",[g0]:"ACESFilmic",[v0]:"AgX",[x0]:"Neutral",[_0]:"Custom"};function O1(n,e){const t=U1[e];return t===void 0?(et("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const nl=new ee;function F1(){yt.getLuminanceCoefficients(nl);const n=nl.x.toFixed(4),e=nl.y.toFixed(4),t=nl.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function B1(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Uo).join(`
`)}function k1(n){const e=[];for(const t in n){const i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function V1(n,e){const t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){const s=n.getActiveAttrib(e,r),o=s.name;let a=1;s.type===n.FLOAT_MAT2&&(a=2),s.type===n.FLOAT_MAT3&&(a=3),s.type===n.FLOAT_MAT4&&(a=4),t[o]={type:s.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function Uo(n){return n!==""}function ng(n,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function ig(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const H1=/^[ \t]*#include +<([\w\d./]+)>/gm;function eh(n){return n.replace(H1,G1)}const z1=new Map;function G1(n,e){let t=pt[e];if(t===void 0){const i=z1.get(e);if(i!==void 0)t=pt[i],et('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("Can not resolve #include <"+e+">")}return eh(t)}const W1=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function rg(n){return n.replace(W1,j1)}function j1(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function sg(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const X1={[hl]:"SHADOWMAP_TYPE_PCF",[Do]:"SHADOWMAP_TYPE_VSM"};function q1(n){return X1[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const K1={[cs]:"ENVMAP_TYPE_CUBE",[Ks]:"ENVMAP_TYPE_CUBE",[ec]:"ENVMAP_TYPE_CUBE_UV"};function $1(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":K1[n.envMapMode]||"ENVMAP_TYPE_CUBE"}const Y1={[Ks]:"ENVMAP_MODE_REFRACTION"};function J1(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":Y1[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Z1={[h0]:"ENVMAP_BLENDING_MULTIPLY",[Gb]:"ENVMAP_BLENDING_MIX",[Wb]:"ENVMAP_BLENDING_ADD"};function Q1(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":Z1[n.combine]||"ENVMAP_BLENDING_NONE"}function eC(n){const e=n.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function tC(n,e,t,i){const r=n.getContext(),s=t.defines;let o=t.vertexShader,a=t.fragmentShader;const l=q1(t),c=$1(t),u=J1(t),h=Q1(t),d=eC(t),g=B1(t),p=k1(s),x=r.createProgram();let m,_,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p].filter(Uo).join(`
`),m.length>0&&(m+=`
`),_=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p].filter(Uo).join(`
`),_.length>0&&(_+=`
`)):(m=[sg(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Uo).join(`
`),_=[sg(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Ni?"#define TONE_MAPPING":"",t.toneMapping!==Ni?pt.tonemapping_pars_fragment:"",t.toneMapping!==Ni?O1("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",pt.colorspace_pars_fragment,N1("linearToOutputTexel",t.outputColorSpace),F1(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Uo).join(`
`)),o=eh(o),o=ng(o,t),o=ig(o,t),a=eh(a),a=ng(a,t),a=ig(a,t),o=rg(o),a=rg(a),t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,m=[g,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,_=["#define varying in",t.glslVersion===im?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===im?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+_);const T=M+m+o,b=M+_+a,I=Qm(r,r.VERTEX_SHADER,T),D=Qm(r,r.FRAGMENT_SHADER,b);r.attachShader(x,I),r.attachShader(x,D),t.index0AttributeName!==void 0?r.bindAttribLocation(x,0,t.index0AttributeName):t.morphTargets===!0&&r.bindAttribLocation(x,0,"position"),r.linkProgram(x);function B(R){if(n.debug.checkShaderErrors){const U=r.getProgramInfoLog(x)||"",H=r.getShaderInfoLog(I)||"",q=r.getShaderInfoLog(D)||"",J=U.trim(),O=H.trim(),j=q.trim();let ie=!0,X=!0;if(r.getProgramParameter(x,r.LINK_STATUS)===!1)if(ie=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,x,I,D);else{const Y=tg(r,I,"vertex"),ne=tg(r,D,"fragment");ot("THREE.WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(x,r.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+J+`
`+Y+`
`+ne)}else J!==""?et("WebGLProgram: Program Info Log:",J):(O===""||j==="")&&(X=!1);X&&(R.diagnostics={runnable:ie,programLog:J,vertexShader:{log:O,prefix:m},fragmentShader:{log:j,prefix:_}})}r.deleteShader(I),r.deleteShader(D),E=new vl(r,x),w=V1(r,x)}let E;this.getUniforms=function(){return E===void 0&&B(this),E};let w;this.getAttributes=function(){return w===void 0&&B(this),w};let L=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return L===!1&&(L=r.getProgramParameter(x,P1)),L},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(x),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=L1++,this.cacheKey=e,this.usedTimes=1,this.program=x,this.vertexShader=I,this.fragmentShader=D,this}let nC=0;class iC{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,i=e.fragmentShader,r=this._getShaderStage(t),s=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(r)===!1&&(o.add(r),r.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){const t=this.shaderCache;let i=t.get(e);return i===void 0&&(i=new rC(e),t.set(e,i)),i}}class rC{constructor(e){this.id=nC++,this.code=e,this.usedTimes=0}}function sC(n,e,t,i,r,s){const o=new I0,a=new iC,l=new Set,c=[],u=new Map,h=i.logarithmicDepthBuffer;let d=i.precision;const g={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(E){return l.add(E),E===0?"uv":`uv${E}`}function x(E,w,L,R,U){const H=R.fog,q=U.geometry,J=E.isMeshStandardMaterial||E.isMeshLambertMaterial||E.isMeshPhongMaterial?R.environment:null,O=E.isMeshStandardMaterial||E.isMeshLambertMaterial&&!E.envMap||E.isMeshPhongMaterial&&!E.envMap,j=e.get(E.envMap||J,O),ie=j&&j.mapping===ec?j.image.height:null,X=g[E.type];E.precision!==null&&(d=i.getMaxPrecision(E.precision),d!==E.precision&&et("WebGLProgram.getParameters:",E.precision,"not supported, using",d,"instead."));const Y=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,ne=Y!==void 0?Y.length:0;let fe=0;q.morphAttributes.position!==void 0&&(fe=1),q.morphAttributes.normal!==void 0&&(fe=2),q.morphAttributes.color!==void 0&&(fe=3);let ye,je,tt,he;if(X){const Mt=Ri[X];ye=Mt.vertexShader,je=Mt.fragmentShader}else ye=E.vertexShader,je=E.fragmentShader,a.update(E),tt=a.getVertexShaderID(E),he=a.getFragmentShaderID(E);const Se=n.getRenderTarget(),Me=n.state.buffers.depth.getReversed(),Le=U.isInstancedMesh===!0,Ae=U.isBatchedMesh===!0,Fe=!!E.map,k=!!E.matcap,z=!!j,Z=!!E.aoMap,ge=!!E.lightMap,ae=!!E.bumpMap,_e=!!E.normalMap,N=!!E.displacementMap,Ee=!!E.emissiveMap,ve=!!E.metalnessMap,me=!!E.roughnessMap,xe=E.anisotropy>0,C=E.clearcoat>0,S=E.dispersion>0,W=E.iridescence>0,re=E.sheen>0,de=E.transmission>0,se=xe&&!!E.anisotropyMap,Ue=C&&!!E.clearcoatMap,Te=C&&!!E.clearcoatNormalMap,qe=C&&!!E.clearcoatRoughnessMap,Ye=W&&!!E.iridescenceMap,be=W&&!!E.iridescenceThicknessMap,Ce=re&&!!E.sheenColorMap,Oe=re&&!!E.sheenRoughnessMap,ze=!!E.specularMap,Ve=!!E.specularColorMap,lt=!!E.specularIntensityMap,K=de&&!!E.transmissionMap,Ie=de&&!!E.thicknessMap,Pe=!!E.gradientMap,Ke=!!E.alphaMap,Re=E.alphaTest>0,pe=!!E.alphaHash,Xe=!!E.extensions;let it=Ni;E.toneMapped&&(Se===null||Se.isXRRenderTarget===!0)&&(it=n.toneMapping);const Ct={shaderID:X,shaderType:E.type,shaderName:E.name,vertexShader:ye,fragmentShader:je,defines:E.defines,customVertexShaderID:tt,customFragmentShaderID:he,isRawShaderMaterial:E.isRawShaderMaterial===!0,glslVersion:E.glslVersion,precision:d,batching:Ae,batchingColor:Ae&&U._colorsTexture!==null,instancing:Le,instancingColor:Le&&U.instanceColor!==null,instancingMorph:Le&&U.morphTexture!==null,outputColorSpace:Se===null?n.outputColorSpace:Se.isXRRenderTarget===!0?Se.texture.colorSpace:bn,alphaToCoverage:!!E.alphaToCoverage,map:Fe,matcap:k,envMap:z,envMapMode:z&&j.mapping,envMapCubeUVHeight:ie,aoMap:Z,lightMap:ge,bumpMap:ae,normalMap:_e,displacementMap:N,emissiveMap:Ee,normalMapObjectSpace:_e&&E.normalMapType===$b,normalMapTangentSpace:_e&&E.normalMapType===C0,metalnessMap:ve,roughnessMap:me,anisotropy:xe,anisotropyMap:se,clearcoat:C,clearcoatMap:Ue,clearcoatNormalMap:Te,clearcoatRoughnessMap:qe,dispersion:S,iridescence:W,iridescenceMap:Ye,iridescenceThicknessMap:be,sheen:re,sheenColorMap:Ce,sheenRoughnessMap:Oe,specularMap:ze,specularColorMap:Ve,specularIntensityMap:lt,transmission:de,transmissionMap:K,thicknessMap:Ie,gradientMap:Pe,opaque:E.transparent===!1&&E.blending===Fs&&E.alphaToCoverage===!1,alphaMap:Ke,alphaTest:Re,alphaHash:pe,combine:E.combine,mapUv:Fe&&p(E.map.channel),aoMapUv:Z&&p(E.aoMap.channel),lightMapUv:ge&&p(E.lightMap.channel),bumpMapUv:ae&&p(E.bumpMap.channel),normalMapUv:_e&&p(E.normalMap.channel),displacementMapUv:N&&p(E.displacementMap.channel),emissiveMapUv:Ee&&p(E.emissiveMap.channel),metalnessMapUv:ve&&p(E.metalnessMap.channel),roughnessMapUv:me&&p(E.roughnessMap.channel),anisotropyMapUv:se&&p(E.anisotropyMap.channel),clearcoatMapUv:Ue&&p(E.clearcoatMap.channel),clearcoatNormalMapUv:Te&&p(E.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:qe&&p(E.clearcoatRoughnessMap.channel),iridescenceMapUv:Ye&&p(E.iridescenceMap.channel),iridescenceThicknessMapUv:be&&p(E.iridescenceThicknessMap.channel),sheenColorMapUv:Ce&&p(E.sheenColorMap.channel),sheenRoughnessMapUv:Oe&&p(E.sheenRoughnessMap.channel),specularMapUv:ze&&p(E.specularMap.channel),specularColorMapUv:Ve&&p(E.specularColorMap.channel),specularIntensityMapUv:lt&&p(E.specularIntensityMap.channel),transmissionMapUv:K&&p(E.transmissionMap.channel),thicknessMapUv:Ie&&p(E.thicknessMap.channel),alphaMapUv:Ke&&p(E.alphaMap.channel),vertexTangents:!!q.attributes.tangent&&(_e||xe),vertexColors:E.vertexColors,vertexAlphas:E.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!q.attributes.uv&&(Fe||Ke),fog:!!H,useFog:E.fog===!0,fogExp2:!!H&&H.isFogExp2,flatShading:E.wireframe===!1&&(E.flatShading===!0||q.attributes.normal===void 0&&_e===!1&&(E.isMeshLambertMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isMeshPhysicalMaterial)),sizeAttenuation:E.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:Me,skinning:U.isSkinnedMesh===!0,morphTargets:q.morphAttributes.position!==void 0,morphNormals:q.morphAttributes.normal!==void 0,morphColors:q.morphAttributes.color!==void 0,morphTargetsCount:ne,morphTextureStride:fe,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:E.dithering,shadowMapEnabled:n.shadowMap.enabled&&L.length>0,shadowMapType:n.shadowMap.type,toneMapping:it,decodeVideoTexture:Fe&&E.map.isVideoTexture===!0&&yt.getTransfer(E.map.colorSpace)===It,decodeVideoTextureEmissive:Ee&&E.emissiveMap.isVideoTexture===!0&&yt.getTransfer(E.emissiveMap.colorSpace)===It,premultipliedAlpha:E.premultipliedAlpha,doubleSided:E.side===Pi,flipSided:E.side===On,useDepthPacking:E.depthPacking>=0,depthPacking:E.depthPacking||0,index0AttributeName:E.index0AttributeName,extensionClipCullDistance:Xe&&E.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Xe&&E.extensions.multiDraw===!0||Ae)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:E.customProgramCacheKey()};return Ct.vertexUv1s=l.has(1),Ct.vertexUv2s=l.has(2),Ct.vertexUv3s=l.has(3),l.clear(),Ct}function m(E){const w=[];if(E.shaderID?w.push(E.shaderID):(w.push(E.customVertexShaderID),w.push(E.customFragmentShaderID)),E.defines!==void 0)for(const L in E.defines)w.push(L),w.push(E.defines[L]);return E.isRawShaderMaterial===!1&&(_(w,E),M(w,E),w.push(n.outputColorSpace)),w.push(E.customProgramCacheKey),w.join()}function _(E,w){E.push(w.precision),E.push(w.outputColorSpace),E.push(w.envMapMode),E.push(w.envMapCubeUVHeight),E.push(w.mapUv),E.push(w.alphaMapUv),E.push(w.lightMapUv),E.push(w.aoMapUv),E.push(w.bumpMapUv),E.push(w.normalMapUv),E.push(w.displacementMapUv),E.push(w.emissiveMapUv),E.push(w.metalnessMapUv),E.push(w.roughnessMapUv),E.push(w.anisotropyMapUv),E.push(w.clearcoatMapUv),E.push(w.clearcoatNormalMapUv),E.push(w.clearcoatRoughnessMapUv),E.push(w.iridescenceMapUv),E.push(w.iridescenceThicknessMapUv),E.push(w.sheenColorMapUv),E.push(w.sheenRoughnessMapUv),E.push(w.specularMapUv),E.push(w.specularColorMapUv),E.push(w.specularIntensityMapUv),E.push(w.transmissionMapUv),E.push(w.thicknessMapUv),E.push(w.combine),E.push(w.fogExp2),E.push(w.sizeAttenuation),E.push(w.morphTargetsCount),E.push(w.morphAttributeCount),E.push(w.numDirLights),E.push(w.numPointLights),E.push(w.numSpotLights),E.push(w.numSpotLightMaps),E.push(w.numHemiLights),E.push(w.numRectAreaLights),E.push(w.numDirLightShadows),E.push(w.numPointLightShadows),E.push(w.numSpotLightShadows),E.push(w.numSpotLightShadowsWithMaps),E.push(w.numLightProbes),E.push(w.shadowMapType),E.push(w.toneMapping),E.push(w.numClippingPlanes),E.push(w.numClipIntersection),E.push(w.depthPacking)}function M(E,w){o.disableAll(),w.instancing&&o.enable(0),w.instancingColor&&o.enable(1),w.instancingMorph&&o.enable(2),w.matcap&&o.enable(3),w.envMap&&o.enable(4),w.normalMapObjectSpace&&o.enable(5),w.normalMapTangentSpace&&o.enable(6),w.clearcoat&&o.enable(7),w.iridescence&&o.enable(8),w.alphaTest&&o.enable(9),w.vertexColors&&o.enable(10),w.vertexAlphas&&o.enable(11),w.vertexUv1s&&o.enable(12),w.vertexUv2s&&o.enable(13),w.vertexUv3s&&o.enable(14),w.vertexTangents&&o.enable(15),w.anisotropy&&o.enable(16),w.alphaHash&&o.enable(17),w.batching&&o.enable(18),w.dispersion&&o.enable(19),w.batchingColor&&o.enable(20),w.gradientMap&&o.enable(21),E.push(o.mask),o.disableAll(),w.fog&&o.enable(0),w.useFog&&o.enable(1),w.flatShading&&o.enable(2),w.logarithmicDepthBuffer&&o.enable(3),w.reversedDepthBuffer&&o.enable(4),w.skinning&&o.enable(5),w.morphTargets&&o.enable(6),w.morphNormals&&o.enable(7),w.morphColors&&o.enable(8),w.premultipliedAlpha&&o.enable(9),w.shadowMapEnabled&&o.enable(10),w.doubleSided&&o.enable(11),w.flipSided&&o.enable(12),w.useDepthPacking&&o.enable(13),w.dithering&&o.enable(14),w.transmission&&o.enable(15),w.sheen&&o.enable(16),w.opaque&&o.enable(17),w.pointsUvs&&o.enable(18),w.decodeVideoTexture&&o.enable(19),w.decodeVideoTextureEmissive&&o.enable(20),w.alphaToCoverage&&o.enable(21),E.push(o.mask)}function T(E){const w=g[E.type];let L;if(w){const R=Ri[w];L=tT.clone(R.uniforms)}else L=E.uniforms;return L}function b(E,w){let L=u.get(w);return L!==void 0?++L.usedTimes:(L=new tC(n,w,E,r),c.push(L),u.set(w,L)),L}function I(E){if(--E.usedTimes===0){const w=c.indexOf(E);c[w]=c[c.length-1],c.pop(),u.delete(E.cacheKey),E.destroy()}}function D(E){a.remove(E)}function B(){a.dispose()}return{getParameters:x,getProgramCacheKey:m,getUniforms:T,acquireProgram:b,releaseProgram:I,releaseShaderCache:D,programs:c,dispose:B}}function oC(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function r(o,a,l){n.get(o)[a]=l}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function aC(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function og(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function ag(){const n=[];let e=0;const t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function o(d){let g=0;return d.isInstancedMesh&&(g+=2),d.isSkinnedMesh&&(g+=1),g}function a(d,g,p,x,m,_){let M=n[e];return M===void 0?(M={id:d.id,object:d,geometry:g,material:p,materialVariant:o(d),groupOrder:x,renderOrder:d.renderOrder,z:m,group:_},n[e]=M):(M.id=d.id,M.object=d,M.geometry=g,M.material=p,M.materialVariant=o(d),M.groupOrder=x,M.renderOrder=d.renderOrder,M.z=m,M.group=_),e++,M}function l(d,g,p,x,m,_){const M=a(d,g,p,x,m,_);p.transmission>0?i.push(M):p.transparent===!0?r.push(M):t.push(M)}function c(d,g,p,x,m,_){const M=a(d,g,p,x,m,_);p.transmission>0?i.unshift(M):p.transparent===!0?r.unshift(M):t.unshift(M)}function u(d,g){t.length>1&&t.sort(d||aC),i.length>1&&i.sort(g||og),r.length>1&&r.sort(g||og)}function h(){for(let d=e,g=n.length;d<g;d++){const p=n[d];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:l,unshift:c,finish:h,sort:u}}function lC(){let n=new WeakMap;function e(i,r){const s=n.get(i);let o;return s===void 0?(o=new ag,n.set(i,[o])):r>=s.length?(o=new ag,s.push(o)):o=s[r],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function cC(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new ee,color:new ft};break;case"SpotLight":t={position:new ee,direction:new ee,color:new ft,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new ee,color:new ft,distance:0,decay:0};break;case"HemisphereLight":t={direction:new ee,skyColor:new ft,groundColor:new ft};break;case"RectAreaLight":t={color:new ft,position:new ee,halfWidth:new ee,halfHeight:new ee};break}return n[e.id]=t,t}}}function uC(){const n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new St};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new St};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new St,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}let fC=0;function hC(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function dC(n){const e=new cC,t=uC(),i={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new ee);const r=new ee,s=new mt,o=new mt;function a(c){let u=0,h=0,d=0;for(let w=0;w<9;w++)i.probe[w].set(0,0,0);let g=0,p=0,x=0,m=0,_=0,M=0,T=0,b=0,I=0,D=0,B=0;c.sort(hC);for(let w=0,L=c.length;w<L;w++){const R=c[w],U=R.color,H=R.intensity,q=R.distance;let J=null;if(R.shadow&&R.shadow.map&&(R.shadow.map.texture.format===Ys?J=R.shadow.map.texture:J=R.shadow.map.depthTexture||R.shadow.map.texture),R.isAmbientLight)u+=U.r*H,h+=U.g*H,d+=U.b*H;else if(R.isLightProbe){for(let O=0;O<9;O++)i.probe[O].addScaledVector(R.sh.coefficients[O],H);B++}else if(R.isDirectionalLight){const O=e.get(R);if(O.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){const j=R.shadow,ie=t.get(R);ie.shadowIntensity=j.intensity,ie.shadowBias=j.bias,ie.shadowNormalBias=j.normalBias,ie.shadowRadius=j.radius,ie.shadowMapSize=j.mapSize,i.directionalShadow[g]=ie,i.directionalShadowMap[g]=J,i.directionalShadowMatrix[g]=R.shadow.matrix,M++}i.directional[g]=O,g++}else if(R.isSpotLight){const O=e.get(R);O.position.setFromMatrixPosition(R.matrixWorld),O.color.copy(U).multiplyScalar(H),O.distance=q,O.coneCos=Math.cos(R.angle),O.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),O.decay=R.decay,i.spot[x]=O;const j=R.shadow;if(R.map&&(i.spotLightMap[I]=R.map,I++,j.updateMatrices(R),R.castShadow&&D++),i.spotLightMatrix[x]=j.matrix,R.castShadow){const ie=t.get(R);ie.shadowIntensity=j.intensity,ie.shadowBias=j.bias,ie.shadowNormalBias=j.normalBias,ie.shadowRadius=j.radius,ie.shadowMapSize=j.mapSize,i.spotShadow[x]=ie,i.spotShadowMap[x]=J,b++}x++}else if(R.isRectAreaLight){const O=e.get(R);O.color.copy(U).multiplyScalar(H),O.halfWidth.set(R.width*.5,0,0),O.halfHeight.set(0,R.height*.5,0),i.rectArea[m]=O,m++}else if(R.isPointLight){const O=e.get(R);if(O.color.copy(R.color).multiplyScalar(R.intensity),O.distance=R.distance,O.decay=R.decay,R.castShadow){const j=R.shadow,ie=t.get(R);ie.shadowIntensity=j.intensity,ie.shadowBias=j.bias,ie.shadowNormalBias=j.normalBias,ie.shadowRadius=j.radius,ie.shadowMapSize=j.mapSize,ie.shadowCameraNear=j.camera.near,ie.shadowCameraFar=j.camera.far,i.pointShadow[p]=ie,i.pointShadowMap[p]=J,i.pointShadowMatrix[p]=R.shadow.matrix,T++}i.point[p]=O,p++}else if(R.isHemisphereLight){const O=e.get(R);O.skyColor.copy(R.color).multiplyScalar(H),O.groundColor.copy(R.groundColor).multiplyScalar(H),i.hemi[_]=O,_++}}m>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ke.LTC_FLOAT_1,i.rectAreaLTC2=ke.LTC_FLOAT_2):(i.rectAreaLTC1=ke.LTC_HALF_1,i.rectAreaLTC2=ke.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=h,i.ambient[2]=d;const E=i.hash;(E.directionalLength!==g||E.pointLength!==p||E.spotLength!==x||E.rectAreaLength!==m||E.hemiLength!==_||E.numDirectionalShadows!==M||E.numPointShadows!==T||E.numSpotShadows!==b||E.numSpotMaps!==I||E.numLightProbes!==B)&&(i.directional.length=g,i.spot.length=x,i.rectArea.length=m,i.point.length=p,i.hemi.length=_,i.directionalShadow.length=M,i.directionalShadowMap.length=M,i.pointShadow.length=T,i.pointShadowMap.length=T,i.spotShadow.length=b,i.spotShadowMap.length=b,i.directionalShadowMatrix.length=M,i.pointShadowMatrix.length=T,i.spotLightMatrix.length=b+I-D,i.spotLightMap.length=I,i.numSpotLightShadowsWithMaps=D,i.numLightProbes=B,E.directionalLength=g,E.pointLength=p,E.spotLength=x,E.rectAreaLength=m,E.hemiLength=_,E.numDirectionalShadows=M,E.numPointShadows=T,E.numSpotShadows=b,E.numSpotMaps=I,E.numLightProbes=B,i.version=fC++)}function l(c,u){let h=0,d=0,g=0,p=0,x=0;const m=u.matrixWorldInverse;for(let _=0,M=c.length;_<M;_++){const T=c[_];if(T.isDirectionalLight){const b=i.directional[h];b.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),b.direction.sub(r),b.direction.transformDirection(m),h++}else if(T.isSpotLight){const b=i.spot[g];b.position.setFromMatrixPosition(T.matrixWorld),b.position.applyMatrix4(m),b.direction.setFromMatrixPosition(T.matrixWorld),r.setFromMatrixPosition(T.target.matrixWorld),b.direction.sub(r),b.direction.transformDirection(m),g++}else if(T.isRectAreaLight){const b=i.rectArea[p];b.position.setFromMatrixPosition(T.matrixWorld),b.position.applyMatrix4(m),o.identity(),s.copy(T.matrixWorld),s.premultiply(m),o.extractRotation(s),b.halfWidth.set(T.width*.5,0,0),b.halfHeight.set(0,T.height*.5,0),b.halfWidth.applyMatrix4(o),b.halfHeight.applyMatrix4(o),p++}else if(T.isPointLight){const b=i.point[d];b.position.setFromMatrixPosition(T.matrixWorld),b.position.applyMatrix4(m),d++}else if(T.isHemisphereLight){const b=i.hemi[x];b.direction.setFromMatrixPosition(T.matrixWorld),b.direction.transformDirection(m),x++}}}return{setup:a,setupView:l,state:i}}function lg(n){const e=new dC(n),t=[],i=[];function r(u){c.camera=u,t.length=0,i.length=0}function s(u){t.push(u)}function o(u){i.push(u)}function a(){e.setup(t)}function l(u){e.setupView(t,u)}const c={lightsArray:t,shadowsArray:i,camera:null,lights:e,transmissionRenderTarget:{}};return{init:r,state:c,setupLights:a,setupLightsView:l,pushLight:s,pushShadow:o}}function pC(n){let e=new WeakMap;function t(r,s=0){const o=e.get(r);let a;return o===void 0?(a=new lg(n),e.set(r,[a])):s>=o.length?(a=new lg(n),o.push(a)):a=o[s],a}function i(){e=new WeakMap}return{get:t,dispose:i}}const mC=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,gC=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,_C=[new ee(1,0,0),new ee(-1,0,0),new ee(0,1,0),new ee(0,-1,0),new ee(0,0,1),new ee(0,0,-1)],vC=[new ee(0,-1,0),new ee(0,-1,0),new ee(0,0,1),new ee(0,0,-1),new ee(0,-1,0),new ee(0,-1,0)],cg=new mt,Po=new ee,Fu=new ee;function xC(n,e,t){let i=new Wh;const r=new St,s=new St,o=new Vt,a=new sT,l=new oT,c={},u=t.maxTextureSize,h={[fr]:On,[On]:fr,[Pi]:Pi},d=new ki({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new St},radius:{value:4}},vertexShader:mC,fragmentShader:gC}),g=d.clone();g.defines.HORIZONTAL_PASS=1;const p=new dn;p.setAttribute("position",new hn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const x=new Wn(p,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=hl;let _=this.type;this.render=function(D,B,E){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||D.length===0)return;this.type===Eb&&(et("WebGLShadowMap: PCFSoftShadowMap has been deprecated. Using PCFShadowMap instead."),this.type=hl);const w=n.getRenderTarget(),L=n.getActiveCubeFace(),R=n.getActiveMipmapLevel(),U=n.state;U.setBlending(or),U.buffers.depth.getReversed()===!0?U.buffers.color.setClear(0,0,0,0):U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);const H=_!==this.type;H&&B.traverse(function(q){q.material&&(Array.isArray(q.material)?q.material.forEach(J=>J.needsUpdate=!0):q.material.needsUpdate=!0)});for(let q=0,J=D.length;q<J;q++){const O=D[q],j=O.shadow;if(j===void 0){et("WebGLShadowMap:",O,"has no shadow.");continue}if(j.autoUpdate===!1&&j.needsUpdate===!1)continue;r.copy(j.mapSize);const ie=j.getFrameExtents();r.multiply(ie),s.copy(j.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/ie.x),r.x=s.x*ie.x,j.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/ie.y),r.y=s.y*ie.y,j.mapSize.y=s.y));const X=n.state.buffers.depth.getReversed();if(j.camera._reversedDepth=X,j.map===null||H===!0){if(j.map!==null&&(j.map.depthTexture!==null&&(j.map.depthTexture.dispose(),j.map.depthTexture=null),j.map.dispose()),this.type===Do){if(O.isPointLight){et("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}j.map=new Ui(r.x,r.y,{format:Ys,type:hr,minFilter:jt,magFilter:jt,generateMipmaps:!1}),j.map.texture.name=O.name+".shadowMap",j.map.depthTexture=new ia(r.x,r.y,Zn),j.map.depthTexture.name=O.name+".shadowMapDepth",j.map.depthTexture.format=dr,j.map.depthTexture.compareFunction=null,j.map.depthTexture.minFilter=nn,j.map.depthTexture.magFilter=nn}else O.isPointLight?(j.map=new Y0(r.x),j.map.depthTexture=new QE(r.x,Fi)):(j.map=new Ui(r.x,r.y),j.map.depthTexture=new ia(r.x,r.y,Fi)),j.map.depthTexture.name=O.name+".shadowMap",j.map.depthTexture.format=dr,this.type===hl?(j.map.depthTexture.compareFunction=X?kh:Bh,j.map.depthTexture.minFilter=jt,j.map.depthTexture.magFilter=jt):(j.map.depthTexture.compareFunction=null,j.map.depthTexture.minFilter=nn,j.map.depthTexture.magFilter=nn);j.camera.updateProjectionMatrix()}const Y=j.map.isWebGLCubeRenderTarget?6:1;for(let ne=0;ne<Y;ne++){if(j.map.isWebGLCubeRenderTarget)n.setRenderTarget(j.map,ne),n.clear();else{ne===0&&(n.setRenderTarget(j.map),n.clear());const fe=j.getViewport(ne);o.set(s.x*fe.x,s.y*fe.y,s.x*fe.z,s.y*fe.w),U.viewport(o)}if(O.isPointLight){const fe=j.camera,ye=j.matrix,je=O.distance||fe.far;je!==fe.far&&(fe.far=je,fe.updateProjectionMatrix()),Po.setFromMatrixPosition(O.matrixWorld),fe.position.copy(Po),Fu.copy(fe.position),Fu.add(_C[ne]),fe.up.copy(vC[ne]),fe.lookAt(Fu),fe.updateMatrixWorld(),ye.makeTranslation(-Po.x,-Po.y,-Po.z),cg.multiplyMatrices(fe.projectionMatrix,fe.matrixWorldInverse),j._frustum.setFromProjectionMatrix(cg,fe.coordinateSystem,fe.reversedDepth)}else j.updateMatrices(O);i=j.getFrustum(),b(B,E,j.camera,O,this.type)}j.isPointLightShadow!==!0&&this.type===Do&&M(j,E),j.needsUpdate=!1}_=this.type,m.needsUpdate=!1,n.setRenderTarget(w,L,R)};function M(D,B){const E=e.update(x);d.defines.VSM_SAMPLES!==D.blurSamples&&(d.defines.VSM_SAMPLES=D.blurSamples,g.defines.VSM_SAMPLES=D.blurSamples,d.needsUpdate=!0,g.needsUpdate=!0),D.mapPass===null&&(D.mapPass=new Ui(r.x,r.y,{format:Ys,type:hr})),d.uniforms.shadow_pass.value=D.map.depthTexture,d.uniforms.resolution.value=D.mapSize,d.uniforms.radius.value=D.radius,n.setRenderTarget(D.mapPass),n.clear(),n.renderBufferDirect(B,null,E,d,x,null),g.uniforms.shadow_pass.value=D.mapPass.texture,g.uniforms.resolution.value=D.mapSize,g.uniforms.radius.value=D.radius,n.setRenderTarget(D.map),n.clear(),n.renderBufferDirect(B,null,E,g,x,null)}function T(D,B,E,w){let L=null;const R=E.isPointLight===!0?D.customDistanceMaterial:D.customDepthMaterial;if(R!==void 0)L=R;else if(L=E.isPointLight===!0?l:a,n.localClippingEnabled&&B.clipShadows===!0&&Array.isArray(B.clippingPlanes)&&B.clippingPlanes.length!==0||B.displacementMap&&B.displacementScale!==0||B.alphaMap&&B.alphaTest>0||B.map&&B.alphaTest>0||B.alphaToCoverage===!0){const U=L.uuid,H=B.uuid;let q=c[U];q===void 0&&(q={},c[U]=q);let J=q[H];J===void 0&&(J=L.clone(),q[H]=J,B.addEventListener("dispose",I)),L=J}if(L.visible=B.visible,L.wireframe=B.wireframe,w===Do?L.side=B.shadowSide!==null?B.shadowSide:B.side:L.side=B.shadowSide!==null?B.shadowSide:h[B.side],L.alphaMap=B.alphaMap,L.alphaTest=B.alphaToCoverage===!0?.5:B.alphaTest,L.map=B.map,L.clipShadows=B.clipShadows,L.clippingPlanes=B.clippingPlanes,L.clipIntersection=B.clipIntersection,L.displacementMap=B.displacementMap,L.displacementScale=B.displacementScale,L.displacementBias=B.displacementBias,L.wireframeLinewidth=B.wireframeLinewidth,L.linewidth=B.linewidth,E.isPointLight===!0&&L.isMeshDistanceMaterial===!0){const U=n.properties.get(L);U.light=E}return L}function b(D,B,E,w,L){if(D.visible===!1)return;if(D.layers.test(B.layers)&&(D.isMesh||D.isLine||D.isPoints)&&(D.castShadow||D.receiveShadow&&L===Do)&&(!D.frustumCulled||i.intersectsObject(D))){D.modelViewMatrix.multiplyMatrices(E.matrixWorldInverse,D.matrixWorld);const H=e.update(D),q=D.material;if(Array.isArray(q)){const J=H.groups;for(let O=0,j=J.length;O<j;O++){const ie=J[O],X=q[ie.materialIndex];if(X&&X.visible){const Y=T(D,X,w,L);D.onBeforeShadow(n,D,B,E,H,Y,ie),n.renderBufferDirect(E,null,H,Y,D,ie),D.onAfterShadow(n,D,B,E,H,Y,ie)}}}else if(q.visible){const J=T(D,q,w,L);D.onBeforeShadow(n,D,B,E,H,J,null),n.renderBufferDirect(E,null,H,J,D,null),D.onAfterShadow(n,D,B,E,H,J,null)}}const U=D.children;for(let H=0,q=U.length;H<q;H++)b(U[H],B,E,w,L)}function I(D){D.target.removeEventListener("dispose",I);for(const E in c){const w=c[E],L=D.target.uuid;L in w&&(w[L].dispose(),delete w[L])}}}function yC(n,e){function t(){let K=!1;const Ie=new Vt;let Pe=null;const Ke=new Vt(0,0,0,0);return{setMask:function(Re){Pe!==Re&&!K&&(n.colorMask(Re,Re,Re,Re),Pe=Re)},setLocked:function(Re){K=Re},setClear:function(Re,pe,Xe,it,Ct){Ct===!0&&(Re*=it,pe*=it,Xe*=it),Ie.set(Re,pe,Xe,it),Ke.equals(Ie)===!1&&(n.clearColor(Re,pe,Xe,it),Ke.copy(Ie))},reset:function(){K=!1,Pe=null,Ke.set(-1,0,0,0)}}}function i(){let K=!1,Ie=!1,Pe=null,Ke=null,Re=null;return{setReversed:function(pe){if(Ie!==pe){const Xe=e.get("EXT_clip_control");pe?Xe.clipControlEXT(Xe.LOWER_LEFT_EXT,Xe.ZERO_TO_ONE_EXT):Xe.clipControlEXT(Xe.LOWER_LEFT_EXT,Xe.NEGATIVE_ONE_TO_ONE_EXT),Ie=pe;const it=Re;Re=null,this.setClear(it)}},getReversed:function(){return Ie},setTest:function(pe){pe?Se(n.DEPTH_TEST):Me(n.DEPTH_TEST)},setMask:function(pe){Pe!==pe&&!K&&(n.depthMask(pe),Pe=pe)},setFunc:function(pe){if(Ie&&(pe=oE[pe]),Ke!==pe){switch(pe){case uf:n.depthFunc(n.NEVER);break;case ff:n.depthFunc(n.ALWAYS);break;case hf:n.depthFunc(n.LESS);break;case qs:n.depthFunc(n.LEQUAL);break;case df:n.depthFunc(n.EQUAL);break;case pf:n.depthFunc(n.GEQUAL);break;case mf:n.depthFunc(n.GREATER);break;case gf:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}Ke=pe}},setLocked:function(pe){K=pe},setClear:function(pe){Re!==pe&&(Re=pe,Ie&&(pe=1-pe),n.clearDepth(pe))},reset:function(){K=!1,Pe=null,Ke=null,Re=null,Ie=!1}}}function r(){let K=!1,Ie=null,Pe=null,Ke=null,Re=null,pe=null,Xe=null,it=null,Ct=null;return{setTest:function(Mt){K||(Mt?Se(n.STENCIL_TEST):Me(n.STENCIL_TEST))},setMask:function(Mt){Ie!==Mt&&!K&&(n.stencilMask(Mt),Ie=Mt)},setFunc:function(Mt,Cn,ti){(Pe!==Mt||Ke!==Cn||Re!==ti)&&(n.stencilFunc(Mt,Cn,ti),Pe=Mt,Ke=Cn,Re=ti)},setOp:function(Mt,Cn,ti){(pe!==Mt||Xe!==Cn||it!==ti)&&(n.stencilOp(Mt,Cn,ti),pe=Mt,Xe=Cn,it=ti)},setLocked:function(Mt){K=Mt},setClear:function(Mt){Ct!==Mt&&(n.clearStencil(Mt),Ct=Mt)},reset:function(){K=!1,Ie=null,Pe=null,Ke=null,Re=null,pe=null,Xe=null,it=null,Ct=null}}}const s=new t,o=new i,a=new r,l=new WeakMap,c=new WeakMap;let u={},h={},d=new WeakMap,g=[],p=null,x=!1,m=null,_=null,M=null,T=null,b=null,I=null,D=null,B=new ft(0,0,0),E=0,w=!1,L=null,R=null,U=null,H=null,q=null;const J=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let O=!1,j=0;const ie=n.getParameter(n.VERSION);ie.indexOf("WebGL")!==-1?(j=parseFloat(/^WebGL (\d)/.exec(ie)[1]),O=j>=1):ie.indexOf("OpenGL ES")!==-1&&(j=parseFloat(/^OpenGL ES (\d)/.exec(ie)[1]),O=j>=2);let X=null,Y={};const ne=n.getParameter(n.SCISSOR_BOX),fe=n.getParameter(n.VIEWPORT),ye=new Vt().fromArray(ne),je=new Vt().fromArray(fe);function tt(K,Ie,Pe,Ke){const Re=new Uint8Array(4),pe=n.createTexture();n.bindTexture(K,pe),n.texParameteri(K,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(K,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Xe=0;Xe<Pe;Xe++)K===n.TEXTURE_3D||K===n.TEXTURE_2D_ARRAY?n.texImage3D(Ie,0,n.RGBA,1,1,Ke,0,n.RGBA,n.UNSIGNED_BYTE,Re):n.texImage2D(Ie+Xe,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Re);return pe}const he={};he[n.TEXTURE_2D]=tt(n.TEXTURE_2D,n.TEXTURE_2D,1),he[n.TEXTURE_CUBE_MAP]=tt(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),he[n.TEXTURE_2D_ARRAY]=tt(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),he[n.TEXTURE_3D]=tt(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),Se(n.DEPTH_TEST),o.setFunc(qs),ae(!1),_e(qp),Se(n.CULL_FACE),Z(or);function Se(K){u[K]!==!0&&(n.enable(K),u[K]=!0)}function Me(K){u[K]!==!1&&(n.disable(K),u[K]=!1)}function Le(K,Ie){return h[K]!==Ie?(n.bindFramebuffer(K,Ie),h[K]=Ie,K===n.DRAW_FRAMEBUFFER&&(h[n.FRAMEBUFFER]=Ie),K===n.FRAMEBUFFER&&(h[n.DRAW_FRAMEBUFFER]=Ie),!0):!1}function Ae(K,Ie){let Pe=g,Ke=!1;if(K){Pe=d.get(Ie),Pe===void 0&&(Pe=[],d.set(Ie,Pe));const Re=K.textures;if(Pe.length!==Re.length||Pe[0]!==n.COLOR_ATTACHMENT0){for(let pe=0,Xe=Re.length;pe<Xe;pe++)Pe[pe]=n.COLOR_ATTACHMENT0+pe;Pe.length=Re.length,Ke=!0}}else Pe[0]!==n.BACK&&(Pe[0]=n.BACK,Ke=!0);Ke&&n.drawBuffers(Pe)}function Fe(K){return p!==K?(n.useProgram(K),p=K,!0):!1}const k={[Jr]:n.FUNC_ADD,[Ab]:n.FUNC_SUBTRACT,[wb]:n.FUNC_REVERSE_SUBTRACT};k[Rb]=n.MIN,k[Cb]=n.MAX;const z={[Pb]:n.ZERO,[Lb]:n.ONE,[Ib]:n.SRC_COLOR,[lf]:n.SRC_ALPHA,[Bb]:n.SRC_ALPHA_SATURATE,[Ob]:n.DST_COLOR,[Nb]:n.DST_ALPHA,[Db]:n.ONE_MINUS_SRC_COLOR,[cf]:n.ONE_MINUS_SRC_ALPHA,[Fb]:n.ONE_MINUS_DST_COLOR,[Ub]:n.ONE_MINUS_DST_ALPHA,[kb]:n.CONSTANT_COLOR,[Vb]:n.ONE_MINUS_CONSTANT_COLOR,[Hb]:n.CONSTANT_ALPHA,[zb]:n.ONE_MINUS_CONSTANT_ALPHA};function Z(K,Ie,Pe,Ke,Re,pe,Xe,it,Ct,Mt){if(K===or){x===!0&&(Me(n.BLEND),x=!1);return}if(x===!1&&(Se(n.BLEND),x=!0),K!==Tb){if(K!==m||Mt!==w){if((_!==Jr||b!==Jr)&&(n.blendEquation(n.FUNC_ADD),_=Jr,b=Jr),Mt)switch(K){case Fs:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Kp:n.blendFunc(n.ONE,n.ONE);break;case $p:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Yp:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:ot("WebGLState: Invalid blending: ",K);break}else switch(K){case Fs:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case Kp:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case $p:ot("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Yp:ot("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:ot("WebGLState: Invalid blending: ",K);break}M=null,T=null,I=null,D=null,B.set(0,0,0),E=0,m=K,w=Mt}return}Re=Re||Ie,pe=pe||Pe,Xe=Xe||Ke,(Ie!==_||Re!==b)&&(n.blendEquationSeparate(k[Ie],k[Re]),_=Ie,b=Re),(Pe!==M||Ke!==T||pe!==I||Xe!==D)&&(n.blendFuncSeparate(z[Pe],z[Ke],z[pe],z[Xe]),M=Pe,T=Ke,I=pe,D=Xe),(it.equals(B)===!1||Ct!==E)&&(n.blendColor(it.r,it.g,it.b,Ct),B.copy(it),E=Ct),m=K,w=!1}function ge(K,Ie){K.side===Pi?Me(n.CULL_FACE):Se(n.CULL_FACE);let Pe=K.side===On;Ie&&(Pe=!Pe),ae(Pe),K.blending===Fs&&K.transparent===!1?Z(or):Z(K.blending,K.blendEquation,K.blendSrc,K.blendDst,K.blendEquationAlpha,K.blendSrcAlpha,K.blendDstAlpha,K.blendColor,K.blendAlpha,K.premultipliedAlpha),o.setFunc(K.depthFunc),o.setTest(K.depthTest),o.setMask(K.depthWrite),s.setMask(K.colorWrite);const Ke=K.stencilWrite;a.setTest(Ke),Ke&&(a.setMask(K.stencilWriteMask),a.setFunc(K.stencilFunc,K.stencilRef,K.stencilFuncMask),a.setOp(K.stencilFail,K.stencilZFail,K.stencilZPass)),Ee(K.polygonOffset,K.polygonOffsetFactor,K.polygonOffsetUnits),K.alphaToCoverage===!0?Se(n.SAMPLE_ALPHA_TO_COVERAGE):Me(n.SAMPLE_ALPHA_TO_COVERAGE)}function ae(K){L!==K&&(K?n.frontFace(n.CW):n.frontFace(n.CCW),L=K)}function _e(K){K!==Mb?(Se(n.CULL_FACE),K!==R&&(K===qp?n.cullFace(n.BACK):K===bb?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):Me(n.CULL_FACE),R=K}function N(K){K!==U&&(O&&n.lineWidth(K),U=K)}function Ee(K,Ie,Pe){K?(Se(n.POLYGON_OFFSET_FILL),(H!==Ie||q!==Pe)&&(H=Ie,q=Pe,o.getReversed()&&(Ie=-Ie),n.polygonOffset(Ie,Pe))):Me(n.POLYGON_OFFSET_FILL)}function ve(K){K?Se(n.SCISSOR_TEST):Me(n.SCISSOR_TEST)}function me(K){K===void 0&&(K=n.TEXTURE0+J-1),X!==K&&(n.activeTexture(K),X=K)}function xe(K,Ie,Pe){Pe===void 0&&(X===null?Pe=n.TEXTURE0+J-1:Pe=X);let Ke=Y[Pe];Ke===void 0&&(Ke={type:void 0,texture:void 0},Y[Pe]=Ke),(Ke.type!==K||Ke.texture!==Ie)&&(X!==Pe&&(n.activeTexture(Pe),X=Pe),n.bindTexture(K,Ie||he[K]),Ke.type=K,Ke.texture=Ie)}function C(){const K=Y[X];K!==void 0&&K.type!==void 0&&(n.bindTexture(K.type,null),K.type=void 0,K.texture=void 0)}function S(){try{n.compressedTexImage2D(...arguments)}catch(K){ot("WebGLState:",K)}}function W(){try{n.compressedTexImage3D(...arguments)}catch(K){ot("WebGLState:",K)}}function re(){try{n.texSubImage2D(...arguments)}catch(K){ot("WebGLState:",K)}}function de(){try{n.texSubImage3D(...arguments)}catch(K){ot("WebGLState:",K)}}function se(){try{n.compressedTexSubImage2D(...arguments)}catch(K){ot("WebGLState:",K)}}function Ue(){try{n.compressedTexSubImage3D(...arguments)}catch(K){ot("WebGLState:",K)}}function Te(){try{n.texStorage2D(...arguments)}catch(K){ot("WebGLState:",K)}}function qe(){try{n.texStorage3D(...arguments)}catch(K){ot("WebGLState:",K)}}function Ye(){try{n.texImage2D(...arguments)}catch(K){ot("WebGLState:",K)}}function be(){try{n.texImage3D(...arguments)}catch(K){ot("WebGLState:",K)}}function Ce(K){ye.equals(K)===!1&&(n.scissor(K.x,K.y,K.z,K.w),ye.copy(K))}function Oe(K){je.equals(K)===!1&&(n.viewport(K.x,K.y,K.z,K.w),je.copy(K))}function ze(K,Ie){let Pe=c.get(Ie);Pe===void 0&&(Pe=new WeakMap,c.set(Ie,Pe));let Ke=Pe.get(K);Ke===void 0&&(Ke=n.getUniformBlockIndex(Ie,K.name),Pe.set(K,Ke))}function Ve(K,Ie){const Ke=c.get(Ie).get(K);l.get(Ie)!==Ke&&(n.uniformBlockBinding(Ie,Ke,K.__bindingPointIndex),l.set(Ie,Ke))}function lt(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),u={},X=null,Y={},h={},d=new WeakMap,g=[],p=null,x=!1,m=null,_=null,M=null,T=null,b=null,I=null,D=null,B=new ft(0,0,0),E=0,w=!1,L=null,R=null,U=null,H=null,q=null,ye.set(0,0,n.canvas.width,n.canvas.height),je.set(0,0,n.canvas.width,n.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:Se,disable:Me,bindFramebuffer:Le,drawBuffers:Ae,useProgram:Fe,setBlending:Z,setMaterial:ge,setFlipSided:ae,setCullFace:_e,setLineWidth:N,setPolygonOffset:Ee,setScissorTest:ve,activeTexture:me,bindTexture:xe,unbindTexture:C,compressedTexImage2D:S,compressedTexImage3D:W,texImage2D:Ye,texImage3D:be,updateUBOMapping:ze,uniformBlockBinding:Ve,texStorage2D:Te,texStorage3D:qe,texSubImage2D:re,texSubImage3D:de,compressedTexSubImage2D:se,compressedTexSubImage3D:Ue,scissor:Ce,viewport:Oe,reset:lt}}function SC(n,e,t,i,r,s,o){const a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new St,u=new WeakMap;let h;const d=new WeakMap;let g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function p(C,S){return g?new OffscreenCanvas(C,S):na("canvas")}function x(C,S,W){let re=1;const de=xe(C);if((de.width>W||de.height>W)&&(re=W/Math.max(de.width,de.height)),re<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){const se=Math.floor(re*de.width),Ue=Math.floor(re*de.height);h===void 0&&(h=p(se,Ue));const Te=S?p(se,Ue):h;return Te.width=se,Te.height=Ue,Te.getContext("2d").drawImage(C,0,0,se,Ue),et("WebGLRenderer: Texture has been resized from ("+de.width+"x"+de.height+") to ("+se+"x"+Ue+")."),Te}else return"data"in C&&et("WebGLRenderer: Image in DataTexture is too big ("+de.width+"x"+de.height+")."),C;return C}function m(C){return C.generateMipmaps}function _(C){n.generateMipmap(C)}function M(C){return C.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?n.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function T(C,S,W,re,de=!1){if(C!==null){if(n[C]!==void 0)return n[C];et("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let se=S;if(S===n.RED&&(W===n.FLOAT&&(se=n.R32F),W===n.HALF_FLOAT&&(se=n.R16F),W===n.UNSIGNED_BYTE&&(se=n.R8)),S===n.RED_INTEGER&&(W===n.UNSIGNED_BYTE&&(se=n.R8UI),W===n.UNSIGNED_SHORT&&(se=n.R16UI),W===n.UNSIGNED_INT&&(se=n.R32UI),W===n.BYTE&&(se=n.R8I),W===n.SHORT&&(se=n.R16I),W===n.INT&&(se=n.R32I)),S===n.RG&&(W===n.FLOAT&&(se=n.RG32F),W===n.HALF_FLOAT&&(se=n.RG16F),W===n.UNSIGNED_BYTE&&(se=n.RG8)),S===n.RG_INTEGER&&(W===n.UNSIGNED_BYTE&&(se=n.RG8UI),W===n.UNSIGNED_SHORT&&(se=n.RG16UI),W===n.UNSIGNED_INT&&(se=n.RG32UI),W===n.BYTE&&(se=n.RG8I),W===n.SHORT&&(se=n.RG16I),W===n.INT&&(se=n.RG32I)),S===n.RGB_INTEGER&&(W===n.UNSIGNED_BYTE&&(se=n.RGB8UI),W===n.UNSIGNED_SHORT&&(se=n.RGB16UI),W===n.UNSIGNED_INT&&(se=n.RGB32UI),W===n.BYTE&&(se=n.RGB8I),W===n.SHORT&&(se=n.RGB16I),W===n.INT&&(se=n.RGB32I)),S===n.RGBA_INTEGER&&(W===n.UNSIGNED_BYTE&&(se=n.RGBA8UI),W===n.UNSIGNED_SHORT&&(se=n.RGBA16UI),W===n.UNSIGNED_INT&&(se=n.RGBA32UI),W===n.BYTE&&(se=n.RGBA8I),W===n.SHORT&&(se=n.RGBA16I),W===n.INT&&(se=n.RGBA32I)),S===n.RGB&&(W===n.UNSIGNED_INT_5_9_9_9_REV&&(se=n.RGB9_E5),W===n.UNSIGNED_INT_10F_11F_11F_REV&&(se=n.R11F_G11F_B10F)),S===n.RGBA){const Ue=de?Pl:yt.getTransfer(re);W===n.FLOAT&&(se=n.RGBA32F),W===n.HALF_FLOAT&&(se=n.RGBA16F),W===n.UNSIGNED_BYTE&&(se=Ue===It?n.SRGB8_ALPHA8:n.RGBA8),W===n.UNSIGNED_SHORT_4_4_4_4&&(se=n.RGBA4),W===n.UNSIGNED_SHORT_5_5_5_1&&(se=n.RGB5_A1)}return(se===n.R16F||se===n.R32F||se===n.RG16F||se===n.RG32F||se===n.RGBA16F||se===n.RGBA32F)&&e.get("EXT_color_buffer_float"),se}function b(C,S){let W;return C?S===null||S===Fi||S===Zo?W=n.DEPTH24_STENCIL8:S===Zn?W=n.DEPTH32F_STENCIL8:S===Jo&&(W=n.DEPTH24_STENCIL8,et("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):S===null||S===Fi||S===Zo?W=n.DEPTH_COMPONENT24:S===Zn?W=n.DEPTH_COMPONENT32F:S===Jo&&(W=n.DEPTH_COMPONENT16),W}function I(C,S){return m(C)===!0||C.isFramebufferTexture&&C.minFilter!==nn&&C.minFilter!==jt?Math.log2(Math.max(S.width,S.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?S.mipmaps.length:1}function D(C){const S=C.target;S.removeEventListener("dispose",D),E(S),S.isVideoTexture&&u.delete(S)}function B(C){const S=C.target;S.removeEventListener("dispose",B),L(S)}function E(C){const S=i.get(C);if(S.__webglInit===void 0)return;const W=C.source,re=d.get(W);if(re){const de=re[S.__cacheKey];de.usedTimes--,de.usedTimes===0&&w(C),Object.keys(re).length===0&&d.delete(W)}i.remove(C)}function w(C){const S=i.get(C);n.deleteTexture(S.__webglTexture);const W=C.source,re=d.get(W);delete re[S.__cacheKey],o.memory.textures--}function L(C){const S=i.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),i.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let re=0;re<6;re++){if(Array.isArray(S.__webglFramebuffer[re]))for(let de=0;de<S.__webglFramebuffer[re].length;de++)n.deleteFramebuffer(S.__webglFramebuffer[re][de]);else n.deleteFramebuffer(S.__webglFramebuffer[re]);S.__webglDepthbuffer&&n.deleteRenderbuffer(S.__webglDepthbuffer[re])}else{if(Array.isArray(S.__webglFramebuffer))for(let re=0;re<S.__webglFramebuffer.length;re++)n.deleteFramebuffer(S.__webglFramebuffer[re]);else n.deleteFramebuffer(S.__webglFramebuffer);if(S.__webglDepthbuffer&&n.deleteRenderbuffer(S.__webglDepthbuffer),S.__webglMultisampledFramebuffer&&n.deleteFramebuffer(S.__webglMultisampledFramebuffer),S.__webglColorRenderbuffer)for(let re=0;re<S.__webglColorRenderbuffer.length;re++)S.__webglColorRenderbuffer[re]&&n.deleteRenderbuffer(S.__webglColorRenderbuffer[re]);S.__webglDepthRenderbuffer&&n.deleteRenderbuffer(S.__webglDepthRenderbuffer)}const W=C.textures;for(let re=0,de=W.length;re<de;re++){const se=i.get(W[re]);se.__webglTexture&&(n.deleteTexture(se.__webglTexture),o.memory.textures--),i.remove(W[re])}i.remove(C)}let R=0;function U(){R=0}function H(){const C=R;return C>=r.maxTextures&&et("WebGLTextures: Trying to use "+C+" texture units while this GPU supports only "+r.maxTextures),R+=1,C}function q(C){const S=[];return S.push(C.wrapS),S.push(C.wrapT),S.push(C.wrapR||0),S.push(C.magFilter),S.push(C.minFilter),S.push(C.anisotropy),S.push(C.internalFormat),S.push(C.format),S.push(C.type),S.push(C.generateMipmaps),S.push(C.premultiplyAlpha),S.push(C.flipY),S.push(C.unpackAlignment),S.push(C.colorSpace),S.join()}function J(C,S){const W=i.get(C);if(C.isVideoTexture&&ve(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&W.__version!==C.version){const re=C.image;if(re===null)et("WebGLRenderer: Texture marked for update but no image data found.");else if(re.complete===!1)et("WebGLRenderer: Texture marked for update but image is incomplete");else{he(W,C,S);return}}else C.isExternalTexture&&(W.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,W.__webglTexture,n.TEXTURE0+S)}function O(C,S){const W=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&W.__version!==C.version){he(W,C,S);return}else C.isExternalTexture&&(W.__webglTexture=C.sourceTexture?C.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,W.__webglTexture,n.TEXTURE0+S)}function j(C,S){const W=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&W.__version!==C.version){he(W,C,S);return}t.bindTexture(n.TEXTURE_3D,W.__webglTexture,n.TEXTURE0+S)}function ie(C,S){const W=i.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&W.__version!==C.version){Se(W,C,S);return}t.bindTexture(n.TEXTURE_CUBE_MAP,W.__webglTexture,n.TEXTURE0+S)}const X={[$s]:n.REPEAT,[Li]:n.CLAMP_TO_EDGE,[Cl]:n.MIRRORED_REPEAT},Y={[nn]:n.NEAREST,[S0]:n.NEAREST_MIPMAP_NEAREST,[No]:n.NEAREST_MIPMAP_LINEAR,[jt]:n.LINEAR,[dl]:n.LINEAR_MIPMAP_NEAREST,[rr]:n.LINEAR_MIPMAP_LINEAR},ne={[Yb]:n.NEVER,[tE]:n.ALWAYS,[Jb]:n.LESS,[Bh]:n.LEQUAL,[Zb]:n.EQUAL,[kh]:n.GEQUAL,[Qb]:n.GREATER,[eE]:n.NOTEQUAL};function fe(C,S){if(S.type===Zn&&e.has("OES_texture_float_linear")===!1&&(S.magFilter===jt||S.magFilter===dl||S.magFilter===No||S.magFilter===rr||S.minFilter===jt||S.minFilter===dl||S.minFilter===No||S.minFilter===rr)&&et("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(C,n.TEXTURE_WRAP_S,X[S.wrapS]),n.texParameteri(C,n.TEXTURE_WRAP_T,X[S.wrapT]),(C===n.TEXTURE_3D||C===n.TEXTURE_2D_ARRAY)&&n.texParameteri(C,n.TEXTURE_WRAP_R,X[S.wrapR]),n.texParameteri(C,n.TEXTURE_MAG_FILTER,Y[S.magFilter]),n.texParameteri(C,n.TEXTURE_MIN_FILTER,Y[S.minFilter]),S.compareFunction&&(n.texParameteri(C,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(C,n.TEXTURE_COMPARE_FUNC,ne[S.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(S.magFilter===nn||S.minFilter!==No&&S.minFilter!==rr||S.type===Zn&&e.has("OES_texture_float_linear")===!1)return;if(S.anisotropy>1||i.get(S).__currentAnisotropy){const W=e.get("EXT_texture_filter_anisotropic");n.texParameterf(C,W.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(S.anisotropy,r.getMaxAnisotropy())),i.get(S).__currentAnisotropy=S.anisotropy}}}function ye(C,S){let W=!1;C.__webglInit===void 0&&(C.__webglInit=!0,S.addEventListener("dispose",D));const re=S.source;let de=d.get(re);de===void 0&&(de={},d.set(re,de));const se=q(S);if(se!==C.__cacheKey){de[se]===void 0&&(de[se]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,W=!0),de[se].usedTimes++;const Ue=de[C.__cacheKey];Ue!==void 0&&(de[C.__cacheKey].usedTimes--,Ue.usedTimes===0&&w(S)),C.__cacheKey=se,C.__webglTexture=de[se].texture}return W}function je(C,S,W){return Math.floor(Math.floor(C/W)/S)}function tt(C,S,W,re){const se=C.updateRanges;if(se.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,S.width,S.height,W,re,S.data);else{se.sort((be,Ce)=>be.start-Ce.start);let Ue=0;for(let be=1;be<se.length;be++){const Ce=se[Ue],Oe=se[be],ze=Ce.start+Ce.count,Ve=je(Oe.start,S.width,4),lt=je(Ce.start,S.width,4);Oe.start<=ze+1&&Ve===lt&&je(Oe.start+Oe.count-1,S.width,4)===Ve?Ce.count=Math.max(Ce.count,Oe.start+Oe.count-Ce.start):(++Ue,se[Ue]=Oe)}se.length=Ue+1;const Te=n.getParameter(n.UNPACK_ROW_LENGTH),qe=n.getParameter(n.UNPACK_SKIP_PIXELS),Ye=n.getParameter(n.UNPACK_SKIP_ROWS);n.pixelStorei(n.UNPACK_ROW_LENGTH,S.width);for(let be=0,Ce=se.length;be<Ce;be++){const Oe=se[be],ze=Math.floor(Oe.start/4),Ve=Math.ceil(Oe.count/4),lt=ze%S.width,K=Math.floor(ze/S.width),Ie=Ve,Pe=1;n.pixelStorei(n.UNPACK_SKIP_PIXELS,lt),n.pixelStorei(n.UNPACK_SKIP_ROWS,K),t.texSubImage2D(n.TEXTURE_2D,0,lt,K,Ie,Pe,W,re,S.data)}C.clearUpdateRanges(),n.pixelStorei(n.UNPACK_ROW_LENGTH,Te),n.pixelStorei(n.UNPACK_SKIP_PIXELS,qe),n.pixelStorei(n.UNPACK_SKIP_ROWS,Ye)}}function he(C,S,W){let re=n.TEXTURE_2D;(S.isDataArrayTexture||S.isCompressedArrayTexture)&&(re=n.TEXTURE_2D_ARRAY),S.isData3DTexture&&(re=n.TEXTURE_3D);const de=ye(C,S),se=S.source;t.bindTexture(re,C.__webglTexture,n.TEXTURE0+W);const Ue=i.get(se);if(se.version!==Ue.__version||de===!0){t.activeTexture(n.TEXTURE0+W);const Te=yt.getPrimaries(yt.workingColorSpace),qe=S.colorSpace===Lr?null:yt.getPrimaries(S.colorSpace),Ye=S.colorSpace===Lr||Te===qe?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,S.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,S.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ye);let be=x(S.image,!1,r.maxTextureSize);be=me(S,be);const Ce=s.convert(S.format,S.colorSpace),Oe=s.convert(S.type);let ze=T(S.internalFormat,Ce,Oe,S.colorSpace,S.isVideoTexture);fe(re,S);let Ve;const lt=S.mipmaps,K=S.isVideoTexture!==!0,Ie=Ue.__version===void 0||de===!0,Pe=se.dataReady,Ke=I(S,be);if(S.isDepthTexture)ze=b(S.format===es,S.type),Ie&&(K?t.texStorage2D(n.TEXTURE_2D,1,ze,be.width,be.height):t.texImage2D(n.TEXTURE_2D,0,ze,be.width,be.height,0,Ce,Oe,null));else if(S.isDataTexture)if(lt.length>0){K&&Ie&&t.texStorage2D(n.TEXTURE_2D,Ke,ze,lt[0].width,lt[0].height);for(let Re=0,pe=lt.length;Re<pe;Re++)Ve=lt[Re],K?Pe&&t.texSubImage2D(n.TEXTURE_2D,Re,0,0,Ve.width,Ve.height,Ce,Oe,Ve.data):t.texImage2D(n.TEXTURE_2D,Re,ze,Ve.width,Ve.height,0,Ce,Oe,Ve.data);S.generateMipmaps=!1}else K?(Ie&&t.texStorage2D(n.TEXTURE_2D,Ke,ze,be.width,be.height),Pe&&tt(S,be,Ce,Oe)):t.texImage2D(n.TEXTURE_2D,0,ze,be.width,be.height,0,Ce,Oe,be.data);else if(S.isCompressedTexture)if(S.isCompressedArrayTexture){K&&Ie&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Ke,ze,lt[0].width,lt[0].height,be.depth);for(let Re=0,pe=lt.length;Re<pe;Re++)if(Ve=lt[Re],S.format!==Qn)if(Ce!==null)if(K){if(Pe)if(S.layerUpdates.size>0){const Xe=Vm(Ve.width,Ve.height,S.format,S.type);for(const it of S.layerUpdates){const Ct=Ve.data.subarray(it*Xe/Ve.data.BYTES_PER_ELEMENT,(it+1)*Xe/Ve.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Re,0,0,it,Ve.width,Ve.height,1,Ce,Ct)}S.clearLayerUpdates()}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Re,0,0,0,Ve.width,Ve.height,be.depth,Ce,Ve.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,Re,ze,Ve.width,Ve.height,be.depth,0,Ve.data,0,0);else et("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else K?Pe&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,Re,0,0,0,Ve.width,Ve.height,be.depth,Ce,Oe,Ve.data):t.texImage3D(n.TEXTURE_2D_ARRAY,Re,ze,Ve.width,Ve.height,be.depth,0,Ce,Oe,Ve.data)}else{K&&Ie&&t.texStorage2D(n.TEXTURE_2D,Ke,ze,lt[0].width,lt[0].height);for(let Re=0,pe=lt.length;Re<pe;Re++)Ve=lt[Re],S.format!==Qn?Ce!==null?K?Pe&&t.compressedTexSubImage2D(n.TEXTURE_2D,Re,0,0,Ve.width,Ve.height,Ce,Ve.data):t.compressedTexImage2D(n.TEXTURE_2D,Re,ze,Ve.width,Ve.height,0,Ve.data):et("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):K?Pe&&t.texSubImage2D(n.TEXTURE_2D,Re,0,0,Ve.width,Ve.height,Ce,Oe,Ve.data):t.texImage2D(n.TEXTURE_2D,Re,ze,Ve.width,Ve.height,0,Ce,Oe,Ve.data)}else if(S.isDataArrayTexture)if(K){if(Ie&&t.texStorage3D(n.TEXTURE_2D_ARRAY,Ke,ze,be.width,be.height,be.depth),Pe)if(S.layerUpdates.size>0){const Re=Vm(be.width,be.height,S.format,S.type);for(const pe of S.layerUpdates){const Xe=be.data.subarray(pe*Re/be.data.BYTES_PER_ELEMENT,(pe+1)*Re/be.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,pe,be.width,be.height,1,Ce,Oe,Xe)}S.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,be.width,be.height,be.depth,Ce,Oe,be.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,ze,be.width,be.height,be.depth,0,Ce,Oe,be.data);else if(S.isData3DTexture)K?(Ie&&t.texStorage3D(n.TEXTURE_3D,Ke,ze,be.width,be.height,be.depth),Pe&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,be.width,be.height,be.depth,Ce,Oe,be.data)):t.texImage3D(n.TEXTURE_3D,0,ze,be.width,be.height,be.depth,0,Ce,Oe,be.data);else if(S.isFramebufferTexture){if(Ie)if(K)t.texStorage2D(n.TEXTURE_2D,Ke,ze,be.width,be.height);else{let Re=be.width,pe=be.height;for(let Xe=0;Xe<Ke;Xe++)t.texImage2D(n.TEXTURE_2D,Xe,ze,Re,pe,0,Ce,Oe,null),Re>>=1,pe>>=1}}else if(lt.length>0){if(K&&Ie){const Re=xe(lt[0]);t.texStorage2D(n.TEXTURE_2D,Ke,ze,Re.width,Re.height)}for(let Re=0,pe=lt.length;Re<pe;Re++)Ve=lt[Re],K?Pe&&t.texSubImage2D(n.TEXTURE_2D,Re,0,0,Ce,Oe,Ve):t.texImage2D(n.TEXTURE_2D,Re,ze,Ce,Oe,Ve);S.generateMipmaps=!1}else if(K){if(Ie){const Re=xe(be);t.texStorage2D(n.TEXTURE_2D,Ke,ze,Re.width,Re.height)}Pe&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,Ce,Oe,be)}else t.texImage2D(n.TEXTURE_2D,0,ze,Ce,Oe,be);m(S)&&_(re),Ue.__version=se.version,S.onUpdate&&S.onUpdate(S)}C.__version=S.version}function Se(C,S,W){if(S.image.length!==6)return;const re=ye(C,S),de=S.source;t.bindTexture(n.TEXTURE_CUBE_MAP,C.__webglTexture,n.TEXTURE0+W);const se=i.get(de);if(de.version!==se.__version||re===!0){t.activeTexture(n.TEXTURE0+W);const Ue=yt.getPrimaries(yt.workingColorSpace),Te=S.colorSpace===Lr?null:yt.getPrimaries(S.colorSpace),qe=S.colorSpace===Lr||Ue===Te?n.NONE:n.BROWSER_DEFAULT_WEBGL;n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,S.flipY),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,S.premultiplyAlpha),n.pixelStorei(n.UNPACK_ALIGNMENT,S.unpackAlignment),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,qe);const Ye=S.isCompressedTexture||S.image[0].isCompressedTexture,be=S.image[0]&&S.image[0].isDataTexture,Ce=[];for(let pe=0;pe<6;pe++)!Ye&&!be?Ce[pe]=x(S.image[pe],!0,r.maxCubemapSize):Ce[pe]=be?S.image[pe].image:S.image[pe],Ce[pe]=me(S,Ce[pe]);const Oe=Ce[0],ze=s.convert(S.format,S.colorSpace),Ve=s.convert(S.type),lt=T(S.internalFormat,ze,Ve,S.colorSpace),K=S.isVideoTexture!==!0,Ie=se.__version===void 0||re===!0,Pe=de.dataReady;let Ke=I(S,Oe);fe(n.TEXTURE_CUBE_MAP,S);let Re;if(Ye){K&&Ie&&t.texStorage2D(n.TEXTURE_CUBE_MAP,Ke,lt,Oe.width,Oe.height);for(let pe=0;pe<6;pe++){Re=Ce[pe].mipmaps;for(let Xe=0;Xe<Re.length;Xe++){const it=Re[Xe];S.format!==Qn?ze!==null?K?Pe&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Xe,0,0,it.width,it.height,ze,it.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Xe,lt,it.width,it.height,0,it.data):et("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):K?Pe&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Xe,0,0,it.width,it.height,ze,Ve,it.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Xe,lt,it.width,it.height,0,ze,Ve,it.data)}}}else{if(Re=S.mipmaps,K&&Ie){Re.length>0&&Ke++;const pe=xe(Ce[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,Ke,lt,pe.width,pe.height)}for(let pe=0;pe<6;pe++)if(be){K?Pe&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,0,0,0,Ce[pe].width,Ce[pe].height,ze,Ve,Ce[pe].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,0,lt,Ce[pe].width,Ce[pe].height,0,ze,Ve,Ce[pe].data);for(let Xe=0;Xe<Re.length;Xe++){const Ct=Re[Xe].image[pe].image;K?Pe&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Xe+1,0,0,Ct.width,Ct.height,ze,Ve,Ct.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Xe+1,lt,Ct.width,Ct.height,0,ze,Ve,Ct.data)}}else{K?Pe&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,0,0,0,ze,Ve,Ce[pe]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,0,lt,ze,Ve,Ce[pe]);for(let Xe=0;Xe<Re.length;Xe++){const it=Re[Xe];K?Pe&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Xe+1,0,0,ze,Ve,it.image[pe]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+pe,Xe+1,lt,ze,Ve,it.image[pe])}}}m(S)&&_(n.TEXTURE_CUBE_MAP),se.__version=de.version,S.onUpdate&&S.onUpdate(S)}C.__version=S.version}function Me(C,S,W,re,de,se){const Ue=s.convert(W.format,W.colorSpace),Te=s.convert(W.type),qe=T(W.internalFormat,Ue,Te,W.colorSpace),Ye=i.get(S),be=i.get(W);if(be.__renderTarget=S,!Ye.__hasExternalTextures){const Ce=Math.max(1,S.width>>se),Oe=Math.max(1,S.height>>se);de===n.TEXTURE_3D||de===n.TEXTURE_2D_ARRAY?t.texImage3D(de,se,qe,Ce,Oe,S.depth,0,Ue,Te,null):t.texImage2D(de,se,qe,Ce,Oe,0,Ue,Te,null)}t.bindFramebuffer(n.FRAMEBUFFER,C),Ee(S)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,re,de,be.__webglTexture,0,N(S)):(de===n.TEXTURE_2D||de>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&de<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,re,de,be.__webglTexture,se),t.bindFramebuffer(n.FRAMEBUFFER,null)}function Le(C,S,W){if(n.bindRenderbuffer(n.RENDERBUFFER,C),S.depthBuffer){const re=S.depthTexture,de=re&&re.isDepthTexture?re.type:null,se=b(S.stencilBuffer,de),Ue=S.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;Ee(S)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,N(S),se,S.width,S.height):W?n.renderbufferStorageMultisample(n.RENDERBUFFER,N(S),se,S.width,S.height):n.renderbufferStorage(n.RENDERBUFFER,se,S.width,S.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,Ue,n.RENDERBUFFER,C)}else{const re=S.textures;for(let de=0;de<re.length;de++){const se=re[de],Ue=s.convert(se.format,se.colorSpace),Te=s.convert(se.type),qe=T(se.internalFormat,Ue,Te,se.colorSpace);Ee(S)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,N(S),qe,S.width,S.height):W?n.renderbufferStorageMultisample(n.RENDERBUFFER,N(S),qe,S.width,S.height):n.renderbufferStorage(n.RENDERBUFFER,qe,S.width,S.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function Ae(C,S,W){const re=S.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,C),!(S.depthTexture&&S.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const de=i.get(S.depthTexture);if(de.__renderTarget=S,(!de.__webglTexture||S.depthTexture.image.width!==S.width||S.depthTexture.image.height!==S.height)&&(S.depthTexture.image.width=S.width,S.depthTexture.image.height=S.height,S.depthTexture.needsUpdate=!0),re){if(de.__webglInit===void 0&&(de.__webglInit=!0,S.depthTexture.addEventListener("dispose",D)),de.__webglTexture===void 0){de.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,de.__webglTexture),fe(n.TEXTURE_CUBE_MAP,S.depthTexture);const Ye=s.convert(S.depthTexture.format),be=s.convert(S.depthTexture.type);let Ce;S.depthTexture.format===dr?Ce=n.DEPTH_COMPONENT24:S.depthTexture.format===es&&(Ce=n.DEPTH24_STENCIL8);for(let Oe=0;Oe<6;Oe++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+Oe,0,Ce,S.width,S.height,0,Ye,be,null)}}else J(S.depthTexture,0);const se=de.__webglTexture,Ue=N(S),Te=re?n.TEXTURE_CUBE_MAP_POSITIVE_X+W:n.TEXTURE_2D,qe=S.depthTexture.format===es?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(S.depthTexture.format===dr)Ee(S)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,qe,Te,se,0,Ue):n.framebufferTexture2D(n.FRAMEBUFFER,qe,Te,se,0);else if(S.depthTexture.format===es)Ee(S)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,qe,Te,se,0,Ue):n.framebufferTexture2D(n.FRAMEBUFFER,qe,Te,se,0);else throw new Error("Unknown depthTexture format")}function Fe(C){const S=i.get(C),W=C.isWebGLCubeRenderTarget===!0;if(S.__boundDepthTexture!==C.depthTexture){const re=C.depthTexture;if(S.__depthDisposeCallback&&S.__depthDisposeCallback(),re){const de=()=>{delete S.__boundDepthTexture,delete S.__depthDisposeCallback,re.removeEventListener("dispose",de)};re.addEventListener("dispose",de),S.__depthDisposeCallback=de}S.__boundDepthTexture=re}if(C.depthTexture&&!S.__autoAllocateDepthBuffer)if(W)for(let re=0;re<6;re++)Ae(S.__webglFramebuffer[re],C,re);else{const re=C.texture.mipmaps;re&&re.length>0?Ae(S.__webglFramebuffer[0],C,0):Ae(S.__webglFramebuffer,C,0)}else if(W){S.__webglDepthbuffer=[];for(let re=0;re<6;re++)if(t.bindFramebuffer(n.FRAMEBUFFER,S.__webglFramebuffer[re]),S.__webglDepthbuffer[re]===void 0)S.__webglDepthbuffer[re]=n.createRenderbuffer(),Le(S.__webglDepthbuffer[re],C,!1);else{const de=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,se=S.__webglDepthbuffer[re];n.bindRenderbuffer(n.RENDERBUFFER,se),n.framebufferRenderbuffer(n.FRAMEBUFFER,de,n.RENDERBUFFER,se)}}else{const re=C.texture.mipmaps;if(re&&re.length>0?t.bindFramebuffer(n.FRAMEBUFFER,S.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,S.__webglFramebuffer),S.__webglDepthbuffer===void 0)S.__webglDepthbuffer=n.createRenderbuffer(),Le(S.__webglDepthbuffer,C,!1);else{const de=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,se=S.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,se),n.framebufferRenderbuffer(n.FRAMEBUFFER,de,n.RENDERBUFFER,se)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function k(C,S,W){const re=i.get(C);S!==void 0&&Me(re.__webglFramebuffer,C,C.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),W!==void 0&&Fe(C)}function z(C){const S=C.texture,W=i.get(C),re=i.get(S);C.addEventListener("dispose",B);const de=C.textures,se=C.isWebGLCubeRenderTarget===!0,Ue=de.length>1;if(Ue||(re.__webglTexture===void 0&&(re.__webglTexture=n.createTexture()),re.__version=S.version,o.memory.textures++),se){W.__webglFramebuffer=[];for(let Te=0;Te<6;Te++)if(S.mipmaps&&S.mipmaps.length>0){W.__webglFramebuffer[Te]=[];for(let qe=0;qe<S.mipmaps.length;qe++)W.__webglFramebuffer[Te][qe]=n.createFramebuffer()}else W.__webglFramebuffer[Te]=n.createFramebuffer()}else{if(S.mipmaps&&S.mipmaps.length>0){W.__webglFramebuffer=[];for(let Te=0;Te<S.mipmaps.length;Te++)W.__webglFramebuffer[Te]=n.createFramebuffer()}else W.__webglFramebuffer=n.createFramebuffer();if(Ue)for(let Te=0,qe=de.length;Te<qe;Te++){const Ye=i.get(de[Te]);Ye.__webglTexture===void 0&&(Ye.__webglTexture=n.createTexture(),o.memory.textures++)}if(C.samples>0&&Ee(C)===!1){W.__webglMultisampledFramebuffer=n.createFramebuffer(),W.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,W.__webglMultisampledFramebuffer);for(let Te=0;Te<de.length;Te++){const qe=de[Te];W.__webglColorRenderbuffer[Te]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,W.__webglColorRenderbuffer[Te]);const Ye=s.convert(qe.format,qe.colorSpace),be=s.convert(qe.type),Ce=T(qe.internalFormat,Ye,be,qe.colorSpace,C.isXRRenderTarget===!0),Oe=N(C);n.renderbufferStorageMultisample(n.RENDERBUFFER,Oe,Ce,C.width,C.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Te,n.RENDERBUFFER,W.__webglColorRenderbuffer[Te])}n.bindRenderbuffer(n.RENDERBUFFER,null),C.depthBuffer&&(W.__webglDepthRenderbuffer=n.createRenderbuffer(),Le(W.__webglDepthRenderbuffer,C,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(se){t.bindTexture(n.TEXTURE_CUBE_MAP,re.__webglTexture),fe(n.TEXTURE_CUBE_MAP,S);for(let Te=0;Te<6;Te++)if(S.mipmaps&&S.mipmaps.length>0)for(let qe=0;qe<S.mipmaps.length;qe++)Me(W.__webglFramebuffer[Te][qe],C,S,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+Te,qe);else Me(W.__webglFramebuffer[Te],C,S,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+Te,0);m(S)&&_(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Ue){for(let Te=0,qe=de.length;Te<qe;Te++){const Ye=de[Te],be=i.get(Ye);let Ce=n.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(Ce=C.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(Ce,be.__webglTexture),fe(Ce,Ye),Me(W.__webglFramebuffer,C,Ye,n.COLOR_ATTACHMENT0+Te,Ce,0),m(Ye)&&_(Ce)}t.unbindTexture()}else{let Te=n.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(Te=C.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(Te,re.__webglTexture),fe(Te,S),S.mipmaps&&S.mipmaps.length>0)for(let qe=0;qe<S.mipmaps.length;qe++)Me(W.__webglFramebuffer[qe],C,S,n.COLOR_ATTACHMENT0,Te,qe);else Me(W.__webglFramebuffer,C,S,n.COLOR_ATTACHMENT0,Te,0);m(S)&&_(Te),t.unbindTexture()}C.depthBuffer&&Fe(C)}function Z(C){const S=C.textures;for(let W=0,re=S.length;W<re;W++){const de=S[W];if(m(de)){const se=M(C),Ue=i.get(de).__webglTexture;t.bindTexture(se,Ue),_(se),t.unbindTexture()}}}const ge=[],ae=[];function _e(C){if(C.samples>0){if(Ee(C)===!1){const S=C.textures,W=C.width,re=C.height;let de=n.COLOR_BUFFER_BIT;const se=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,Ue=i.get(C),Te=S.length>1;if(Te)for(let Ye=0;Ye<S.length;Ye++)t.bindFramebuffer(n.FRAMEBUFFER,Ue.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ye,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,Ue.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ye,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,Ue.__webglMultisampledFramebuffer);const qe=C.texture.mipmaps;qe&&qe.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ue.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ue.__webglFramebuffer);for(let Ye=0;Ye<S.length;Ye++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(de|=n.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(de|=n.STENCIL_BUFFER_BIT)),Te){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,Ue.__webglColorRenderbuffer[Ye]);const be=i.get(S[Ye]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,be,0)}n.blitFramebuffer(0,0,W,re,0,0,W,re,de,n.NEAREST),l===!0&&(ge.length=0,ae.length=0,ge.push(n.COLOR_ATTACHMENT0+Ye),C.depthBuffer&&C.resolveDepthBuffer===!1&&(ge.push(se),ae.push(se),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,ae)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,ge))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),Te)for(let Ye=0;Ye<S.length;Ye++){t.bindFramebuffer(n.FRAMEBUFFER,Ue.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ye,n.RENDERBUFFER,Ue.__webglColorRenderbuffer[Ye]);const be=i.get(S[Ye]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,Ue.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+Ye,n.TEXTURE_2D,be,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,Ue.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.resolveDepthBuffer===!1&&l){const S=C.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[S])}}}function N(C){return Math.min(r.maxSamples,C.samples)}function Ee(C){const S=i.get(C);return C.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&S.__useRenderToTexture!==!1}function ve(C){const S=o.render.frame;u.get(C)!==S&&(u.set(C,S),C.update())}function me(C,S){const W=C.colorSpace,re=C.format,de=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||W!==bn&&W!==Lr&&(yt.getTransfer(W)===It?(re!==Qn||de!==Hn)&&et("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):ot("WebGLTextures: Unsupported texture color space:",W)),S}function xe(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=H,this.resetTextureUnits=U,this.setTexture2D=J,this.setTexture2DArray=O,this.setTexture3D=j,this.setTextureCube=ie,this.rebindTextures=k,this.setupRenderTarget=z,this.updateRenderTargetMipmap=Z,this.updateMultisampleRenderTarget=_e,this.setupDepthRenderbuffer=Fe,this.setupFrameBufferTexture=Me,this.useMultisampledRTT=Ee,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function MC(n,e){function t(i,r=Lr){let s;const o=yt.getTransfer(r);if(i===Hn)return n.UNSIGNED_BYTE;if(i===Ih)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Dh)return n.UNSIGNED_SHORT_5_5_5_1;if(i===E0)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===T0)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===M0)return n.BYTE;if(i===b0)return n.SHORT;if(i===Jo)return n.UNSIGNED_SHORT;if(i===Lh)return n.INT;if(i===Fi)return n.UNSIGNED_INT;if(i===Zn)return n.FLOAT;if(i===hr)return n.HALF_FLOAT;if(i===A0)return n.ALPHA;if(i===w0)return n.RGB;if(i===Qn)return n.RGBA;if(i===dr)return n.DEPTH_COMPONENT;if(i===es)return n.DEPTH_STENCIL;if(i===Nh)return n.RED;if(i===Uh)return n.RED_INTEGER;if(i===Ys)return n.RG;if(i===Oh)return n.RG_INTEGER;if(i===Fh)return n.RGBA_INTEGER;if(i===pl||i===ml||i===gl||i===_l)if(o===It)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===pl)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===ml)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===gl)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===_l)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===pl)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===ml)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===gl)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===_l)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===_f||i===vf||i===xf||i===yf)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===_f)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===vf)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===xf)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===yf)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Sf||i===Mf||i===bf||i===Ef||i===Tf||i===Af||i===wf)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Sf||i===Mf)return o===It?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===bf)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===Ef)return s.COMPRESSED_R11_EAC;if(i===Tf)return s.COMPRESSED_SIGNED_R11_EAC;if(i===Af)return s.COMPRESSED_RG11_EAC;if(i===wf)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Rf||i===Cf||i===Pf||i===Lf||i===If||i===Df||i===Nf||i===Uf||i===Of||i===Ff||i===Bf||i===kf||i===Vf||i===Hf)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Rf)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Cf)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Pf)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Lf)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===If)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Df)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Nf)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Uf)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Of)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Ff)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Bf)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===kf)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Vf)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Hf)return o===It?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===zf||i===Gf||i===Wf)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===zf)return o===It?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Gf)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Wf)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===jf||i===Xf||i===qf||i===Kf)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===jf)return s.COMPRESSED_RED_RGTC1_EXT;if(i===Xf)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===qf)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Kf)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Zo?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}const bC=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,EC=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class TC{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const i=new H0(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,i=new ki({vertexShader:bC,fragmentShader:EC,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Wn(new ic(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class AC extends ro{constructor(e,t){super();const i=this;let r=null,s=1,o=null,a="local-floor",l=1,c=null,u=null,h=null,d=null,g=null,p=null;const x=typeof XRWebGLBinding<"u",m=new TC,_={},M=t.getContextAttributes();let T=null,b=null;const I=[],D=[],B=new St;let E=null;const w=new Dn;w.viewport=new Vt;const L=new Dn;L.viewport=new Vt;const R=[w,L],U=new CT;let H=null,q=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(he){let Se=I[he];return Se===void 0&&(Se=new cu,I[he]=Se),Se.getTargetRaySpace()},this.getControllerGrip=function(he){let Se=I[he];return Se===void 0&&(Se=new cu,I[he]=Se),Se.getGripSpace()},this.getHand=function(he){let Se=I[he];return Se===void 0&&(Se=new cu,I[he]=Se),Se.getHandSpace()};function J(he){const Se=D.indexOf(he.inputSource);if(Se===-1)return;const Me=I[Se];Me!==void 0&&(Me.update(he.inputSource,he.frame,c||o),Me.dispatchEvent({type:he.type,data:he.inputSource}))}function O(){r.removeEventListener("select",J),r.removeEventListener("selectstart",J),r.removeEventListener("selectend",J),r.removeEventListener("squeeze",J),r.removeEventListener("squeezestart",J),r.removeEventListener("squeezeend",J),r.removeEventListener("end",O),r.removeEventListener("inputsourceschange",j);for(let he=0;he<I.length;he++){const Se=D[he];Se!==null&&(D[he]=null,I[he].disconnect(Se))}H=null,q=null,m.reset();for(const he in _)delete _[he];e.setRenderTarget(T),g=null,d=null,h=null,r=null,b=null,tt.stop(),i.isPresenting=!1,e.setPixelRatio(E),e.setSize(B.width,B.height,!1),i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(he){s=he,i.isPresenting===!0&&et("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(he){a=he,i.isPresenting===!0&&et("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(he){c=he},this.getBaseLayer=function(){return d!==null?d:g},this.getBinding=function(){return h===null&&x&&(h=new XRWebGLBinding(r,t)),h},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(he){if(r=he,r!==null){if(T=e.getRenderTarget(),r.addEventListener("select",J),r.addEventListener("selectstart",J),r.addEventListener("selectend",J),r.addEventListener("squeeze",J),r.addEventListener("squeezestart",J),r.addEventListener("squeezeend",J),r.addEventListener("end",O),r.addEventListener("inputsourceschange",j),M.xrCompatible!==!0&&await t.makeXRCompatible(),E=e.getPixelRatio(),e.getSize(B),x&&"createProjectionLayer"in XRWebGLBinding.prototype){let Me=null,Le=null,Ae=null;M.depth&&(Ae=M.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Me=M.stencil?es:dr,Le=M.stencil?Zo:Fi);const Fe={colorFormat:t.RGBA8,depthFormat:Ae,scaleFactor:s};h=this.getBinding(),d=h.createProjectionLayer(Fe),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),b=new Ui(d.textureWidth,d.textureHeight,{format:Qn,type:Hn,depthTexture:new ia(d.textureWidth,d.textureHeight,Le,void 0,void 0,void 0,void 0,void 0,void 0,Me),stencilBuffer:M.stencil,colorSpace:e.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1})}else{const Me={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:s};g=new XRWebGLLayer(r,t,Me),r.updateRenderState({baseLayer:g}),e.setPixelRatio(1),e.setSize(g.framebufferWidth,g.framebufferHeight,!1),b=new Ui(g.framebufferWidth,g.framebufferHeight,{format:Qn,type:Hn,colorSpace:e.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:g.ignoreDepthValues===!1,resolveStencilBuffer:g.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await r.requestReferenceSpace(a),tt.setContext(r),tt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function j(he){for(let Se=0;Se<he.removed.length;Se++){const Me=he.removed[Se],Le=D.indexOf(Me);Le>=0&&(D[Le]=null,I[Le].disconnect(Me))}for(let Se=0;Se<he.added.length;Se++){const Me=he.added[Se];let Le=D.indexOf(Me);if(Le===-1){for(let Fe=0;Fe<I.length;Fe++)if(Fe>=D.length){D.push(Me),Le=Fe;break}else if(D[Fe]===null){D[Fe]=Me,Le=Fe;break}if(Le===-1)break}const Ae=I[Le];Ae&&Ae.connect(Me)}}const ie=new ee,X=new ee;function Y(he,Se,Me){ie.setFromMatrixPosition(Se.matrixWorld),X.setFromMatrixPosition(Me.matrixWorld);const Le=ie.distanceTo(X),Ae=Se.projectionMatrix.elements,Fe=Me.projectionMatrix.elements,k=Ae[14]/(Ae[10]-1),z=Ae[14]/(Ae[10]+1),Z=(Ae[9]+1)/Ae[5],ge=(Ae[9]-1)/Ae[5],ae=(Ae[8]-1)/Ae[0],_e=(Fe[8]+1)/Fe[0],N=k*ae,Ee=k*_e,ve=Le/(-ae+_e),me=ve*-ae;if(Se.matrixWorld.decompose(he.position,he.quaternion,he.scale),he.translateX(me),he.translateZ(ve),he.matrixWorld.compose(he.position,he.quaternion,he.scale),he.matrixWorldInverse.copy(he.matrixWorld).invert(),Ae[10]===-1)he.projectionMatrix.copy(Se.projectionMatrix),he.projectionMatrixInverse.copy(Se.projectionMatrixInverse);else{const xe=k+ve,C=z+ve,S=N-me,W=Ee+(Le-me),re=Z*z/C*xe,de=ge*z/C*xe;he.projectionMatrix.makePerspective(S,W,re,de,xe,C),he.projectionMatrixInverse.copy(he.projectionMatrix).invert()}}function ne(he,Se){Se===null?he.matrixWorld.copy(he.matrix):he.matrixWorld.multiplyMatrices(Se.matrixWorld,he.matrix),he.matrixWorldInverse.copy(he.matrixWorld).invert()}this.updateCamera=function(he){if(r===null)return;let Se=he.near,Me=he.far;m.texture!==null&&(m.depthNear>0&&(Se=m.depthNear),m.depthFar>0&&(Me=m.depthFar)),U.near=L.near=w.near=Se,U.far=L.far=w.far=Me,(H!==U.near||q!==U.far)&&(r.updateRenderState({depthNear:U.near,depthFar:U.far}),H=U.near,q=U.far),U.layers.mask=he.layers.mask|6,w.layers.mask=U.layers.mask&-5,L.layers.mask=U.layers.mask&-3;const Le=he.parent,Ae=U.cameras;ne(U,Le);for(let Fe=0;Fe<Ae.length;Fe++)ne(Ae[Fe],Le);Ae.length===2?Y(U,w,L):U.projectionMatrix.copy(w.projectionMatrix),fe(he,U,Le)};function fe(he,Se,Me){Me===null?he.matrix.copy(Se.matrixWorld):(he.matrix.copy(Me.matrixWorld),he.matrix.invert(),he.matrix.multiply(Se.matrixWorld)),he.matrix.decompose(he.position,he.quaternion,he.scale),he.updateMatrixWorld(!0),he.projectionMatrix.copy(Se.projectionMatrix),he.projectionMatrixInverse.copy(Se.projectionMatrixInverse),he.isPerspectiveCamera&&(he.fov=Js*2*Math.atan(1/he.projectionMatrix.elements[5]),he.zoom=1)}this.getCamera=function(){return U},this.getFoveation=function(){if(!(d===null&&g===null))return l},this.setFoveation=function(he){l=he,d!==null&&(d.fixedFoveation=he),g!==null&&g.fixedFoveation!==void 0&&(g.fixedFoveation=he)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(U)},this.getCameraTexture=function(he){return _[he]};let ye=null;function je(he,Se){if(u=Se.getViewerPose(c||o),p=Se,u!==null){const Me=u.views;g!==null&&(e.setRenderTargetFramebuffer(b,g.framebuffer),e.setRenderTarget(b));let Le=!1;Me.length!==U.cameras.length&&(U.cameras.length=0,Le=!0);for(let z=0;z<Me.length;z++){const Z=Me[z];let ge=null;if(g!==null)ge=g.getViewport(Z);else{const _e=h.getViewSubImage(d,Z);ge=_e.viewport,z===0&&(e.setRenderTargetTextures(b,_e.colorTexture,_e.depthStencilTexture),e.setRenderTarget(b))}let ae=R[z];ae===void 0&&(ae=new Dn,ae.layers.enable(z),ae.viewport=new Vt,R[z]=ae),ae.matrix.fromArray(Z.transform.matrix),ae.matrix.decompose(ae.position,ae.quaternion,ae.scale),ae.projectionMatrix.fromArray(Z.projectionMatrix),ae.projectionMatrixInverse.copy(ae.projectionMatrix).invert(),ae.viewport.set(ge.x,ge.y,ge.width,ge.height),z===0&&(U.matrix.copy(ae.matrix),U.matrix.decompose(U.position,U.quaternion,U.scale)),Le===!0&&U.cameras.push(ae)}const Ae=r.enabledFeatures;if(Ae&&Ae.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&x){h=i.getBinding();const z=h.getDepthInformation(Me[0]);z&&z.isValid&&z.texture&&m.init(z,r.renderState)}if(Ae&&Ae.includes("camera-access")&&x){e.state.unbindTexture(),h=i.getBinding();for(let z=0;z<Me.length;z++){const Z=Me[z].camera;if(Z){let ge=_[Z];ge||(ge=new H0,_[Z]=ge);const ae=h.getCameraImage(Z);ge.sourceTexture=ae}}}}for(let Me=0;Me<I.length;Me++){const Le=D[Me],Ae=I[Me];Le!==null&&Ae!==void 0&&Ae.update(Le,Se,c||o)}ye&&ye(he,Se),Se.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:Se}),p=null}const tt=new $0;tt.setAnimationLoop(je),this.setAnimationLoop=function(he){ye=he},this.dispose=function(){}}}const Xr=new Bi,wC=new mt;function RC(n,e){function t(m,_){m.matrixAutoUpdate===!0&&m.updateMatrix(),_.value.copy(m.matrix)}function i(m,_){_.color.getRGB(m.fogColor.value,j0(n)),_.isFog?(m.fogNear.value=_.near,m.fogFar.value=_.far):_.isFogExp2&&(m.fogDensity.value=_.density)}function r(m,_,M,T,b){_.isMeshBasicMaterial?s(m,_):_.isMeshLambertMaterial?(s(m,_),_.envMap&&(m.envMapIntensity.value=_.envMapIntensity)):_.isMeshToonMaterial?(s(m,_),h(m,_)):_.isMeshPhongMaterial?(s(m,_),u(m,_),_.envMap&&(m.envMapIntensity.value=_.envMapIntensity)):_.isMeshStandardMaterial?(s(m,_),d(m,_),_.isMeshPhysicalMaterial&&g(m,_,b)):_.isMeshMatcapMaterial?(s(m,_),p(m,_)):_.isMeshDepthMaterial?s(m,_):_.isMeshDistanceMaterial?(s(m,_),x(m,_)):_.isMeshNormalMaterial?s(m,_):_.isLineBasicMaterial?(o(m,_),_.isLineDashedMaterial&&a(m,_)):_.isPointsMaterial?l(m,_,M,T):_.isSpriteMaterial?c(m,_):_.isShadowMaterial?(m.color.value.copy(_.color),m.opacity.value=_.opacity):_.isShaderMaterial&&(_.uniformsNeedUpdate=!1)}function s(m,_){m.opacity.value=_.opacity,_.color&&m.diffuse.value.copy(_.color),_.emissive&&m.emissive.value.copy(_.emissive).multiplyScalar(_.emissiveIntensity),_.map&&(m.map.value=_.map,t(_.map,m.mapTransform)),_.alphaMap&&(m.alphaMap.value=_.alphaMap,t(_.alphaMap,m.alphaMapTransform)),_.bumpMap&&(m.bumpMap.value=_.bumpMap,t(_.bumpMap,m.bumpMapTransform),m.bumpScale.value=_.bumpScale,_.side===On&&(m.bumpScale.value*=-1)),_.normalMap&&(m.normalMap.value=_.normalMap,t(_.normalMap,m.normalMapTransform),m.normalScale.value.copy(_.normalScale),_.side===On&&m.normalScale.value.negate()),_.displacementMap&&(m.displacementMap.value=_.displacementMap,t(_.displacementMap,m.displacementMapTransform),m.displacementScale.value=_.displacementScale,m.displacementBias.value=_.displacementBias),_.emissiveMap&&(m.emissiveMap.value=_.emissiveMap,t(_.emissiveMap,m.emissiveMapTransform)),_.specularMap&&(m.specularMap.value=_.specularMap,t(_.specularMap,m.specularMapTransform)),_.alphaTest>0&&(m.alphaTest.value=_.alphaTest);const M=e.get(_),T=M.envMap,b=M.envMapRotation;T&&(m.envMap.value=T,Xr.copy(b),Xr.x*=-1,Xr.y*=-1,Xr.z*=-1,T.isCubeTexture&&T.isRenderTargetTexture===!1&&(Xr.y*=-1,Xr.z*=-1),m.envMapRotation.value.setFromMatrix4(wC.makeRotationFromEuler(Xr)),m.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,m.reflectivity.value=_.reflectivity,m.ior.value=_.ior,m.refractionRatio.value=_.refractionRatio),_.lightMap&&(m.lightMap.value=_.lightMap,m.lightMapIntensity.value=_.lightMapIntensity,t(_.lightMap,m.lightMapTransform)),_.aoMap&&(m.aoMap.value=_.aoMap,m.aoMapIntensity.value=_.aoMapIntensity,t(_.aoMap,m.aoMapTransform))}function o(m,_){m.diffuse.value.copy(_.color),m.opacity.value=_.opacity,_.map&&(m.map.value=_.map,t(_.map,m.mapTransform))}function a(m,_){m.dashSize.value=_.dashSize,m.totalSize.value=_.dashSize+_.gapSize,m.scale.value=_.scale}function l(m,_,M,T){m.diffuse.value.copy(_.color),m.opacity.value=_.opacity,m.size.value=_.size*M,m.scale.value=T*.5,_.map&&(m.map.value=_.map,t(_.map,m.uvTransform)),_.alphaMap&&(m.alphaMap.value=_.alphaMap,t(_.alphaMap,m.alphaMapTransform)),_.alphaTest>0&&(m.alphaTest.value=_.alphaTest)}function c(m,_){m.diffuse.value.copy(_.color),m.opacity.value=_.opacity,m.rotation.value=_.rotation,_.map&&(m.map.value=_.map,t(_.map,m.mapTransform)),_.alphaMap&&(m.alphaMap.value=_.alphaMap,t(_.alphaMap,m.alphaMapTransform)),_.alphaTest>0&&(m.alphaTest.value=_.alphaTest)}function u(m,_){m.specular.value.copy(_.specular),m.shininess.value=Math.max(_.shininess,1e-4)}function h(m,_){_.gradientMap&&(m.gradientMap.value=_.gradientMap)}function d(m,_){m.metalness.value=_.metalness,_.metalnessMap&&(m.metalnessMap.value=_.metalnessMap,t(_.metalnessMap,m.metalnessMapTransform)),m.roughness.value=_.roughness,_.roughnessMap&&(m.roughnessMap.value=_.roughnessMap,t(_.roughnessMap,m.roughnessMapTransform)),_.envMap&&(m.envMapIntensity.value=_.envMapIntensity)}function g(m,_,M){m.ior.value=_.ior,_.sheen>0&&(m.sheenColor.value.copy(_.sheenColor).multiplyScalar(_.sheen),m.sheenRoughness.value=_.sheenRoughness,_.sheenColorMap&&(m.sheenColorMap.value=_.sheenColorMap,t(_.sheenColorMap,m.sheenColorMapTransform)),_.sheenRoughnessMap&&(m.sheenRoughnessMap.value=_.sheenRoughnessMap,t(_.sheenRoughnessMap,m.sheenRoughnessMapTransform))),_.clearcoat>0&&(m.clearcoat.value=_.clearcoat,m.clearcoatRoughness.value=_.clearcoatRoughness,_.clearcoatMap&&(m.clearcoatMap.value=_.clearcoatMap,t(_.clearcoatMap,m.clearcoatMapTransform)),_.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=_.clearcoatRoughnessMap,t(_.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),_.clearcoatNormalMap&&(m.clearcoatNormalMap.value=_.clearcoatNormalMap,t(_.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(_.clearcoatNormalScale),_.side===On&&m.clearcoatNormalScale.value.negate())),_.dispersion>0&&(m.dispersion.value=_.dispersion),_.iridescence>0&&(m.iridescence.value=_.iridescence,m.iridescenceIOR.value=_.iridescenceIOR,m.iridescenceThicknessMinimum.value=_.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=_.iridescenceThicknessRange[1],_.iridescenceMap&&(m.iridescenceMap.value=_.iridescenceMap,t(_.iridescenceMap,m.iridescenceMapTransform)),_.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=_.iridescenceThicknessMap,t(_.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),_.transmission>0&&(m.transmission.value=_.transmission,m.transmissionSamplerMap.value=M.texture,m.transmissionSamplerSize.value.set(M.width,M.height),_.transmissionMap&&(m.transmissionMap.value=_.transmissionMap,t(_.transmissionMap,m.transmissionMapTransform)),m.thickness.value=_.thickness,_.thicknessMap&&(m.thicknessMap.value=_.thicknessMap,t(_.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=_.attenuationDistance,m.attenuationColor.value.copy(_.attenuationColor)),_.anisotropy>0&&(m.anisotropyVector.value.set(_.anisotropy*Math.cos(_.anisotropyRotation),_.anisotropy*Math.sin(_.anisotropyRotation)),_.anisotropyMap&&(m.anisotropyMap.value=_.anisotropyMap,t(_.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=_.specularIntensity,m.specularColor.value.copy(_.specularColor),_.specularColorMap&&(m.specularColorMap.value=_.specularColorMap,t(_.specularColorMap,m.specularColorMapTransform)),_.specularIntensityMap&&(m.specularIntensityMap.value=_.specularIntensityMap,t(_.specularIntensityMap,m.specularIntensityMapTransform))}function p(m,_){_.matcap&&(m.matcap.value=_.matcap)}function x(m,_){const M=e.get(_).light;m.referencePosition.value.setFromMatrixPosition(M.matrixWorld),m.nearDistance.value=M.shadow.camera.near,m.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function CC(n,e,t,i){let r={},s={},o=[];const a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(M,T){const b=T.program;i.uniformBlockBinding(M,b)}function c(M,T){let b=r[M.id];b===void 0&&(p(M),b=u(M),r[M.id]=b,M.addEventListener("dispose",m));const I=T.program;i.updateUBOMapping(M,I);const D=e.render.frame;s[M.id]!==D&&(d(M),s[M.id]=D)}function u(M){const T=h();M.__bindingPointIndex=T;const b=n.createBuffer(),I=M.__size,D=M.usage;return n.bindBuffer(n.UNIFORM_BUFFER,b),n.bufferData(n.UNIFORM_BUFFER,I,D),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,T,b),b}function h(){for(let M=0;M<a;M++)if(o.indexOf(M)===-1)return o.push(M),M;return ot("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(M){const T=r[M.id],b=M.uniforms,I=M.__cache;n.bindBuffer(n.UNIFORM_BUFFER,T);for(let D=0,B=b.length;D<B;D++){const E=Array.isArray(b[D])?b[D]:[b[D]];for(let w=0,L=E.length;w<L;w++){const R=E[w];if(g(R,D,w,I)===!0){const U=R.__offset,H=Array.isArray(R.value)?R.value:[R.value];let q=0;for(let J=0;J<H.length;J++){const O=H[J],j=x(O);typeof O=="number"||typeof O=="boolean"?(R.__data[0]=O,n.bufferSubData(n.UNIFORM_BUFFER,U+q,R.__data)):O.isMatrix3?(R.__data[0]=O.elements[0],R.__data[1]=O.elements[1],R.__data[2]=O.elements[2],R.__data[3]=0,R.__data[4]=O.elements[3],R.__data[5]=O.elements[4],R.__data[6]=O.elements[5],R.__data[7]=0,R.__data[8]=O.elements[6],R.__data[9]=O.elements[7],R.__data[10]=O.elements[8],R.__data[11]=0):(O.toArray(R.__data,q),q+=j.storage/Float32Array.BYTES_PER_ELEMENT)}n.bufferSubData(n.UNIFORM_BUFFER,U,R.__data)}}}n.bindBuffer(n.UNIFORM_BUFFER,null)}function g(M,T,b,I){const D=M.value,B=T+"_"+b;if(I[B]===void 0)return typeof D=="number"||typeof D=="boolean"?I[B]=D:I[B]=D.clone(),!0;{const E=I[B];if(typeof D=="number"||typeof D=="boolean"){if(E!==D)return I[B]=D,!0}else if(E.equals(D)===!1)return E.copy(D),!0}return!1}function p(M){const T=M.uniforms;let b=0;const I=16;for(let B=0,E=T.length;B<E;B++){const w=Array.isArray(T[B])?T[B]:[T[B]];for(let L=0,R=w.length;L<R;L++){const U=w[L],H=Array.isArray(U.value)?U.value:[U.value];for(let q=0,J=H.length;q<J;q++){const O=H[q],j=x(O),ie=b%I,X=ie%j.boundary,Y=ie+X;b+=X,Y!==0&&I-Y<j.storage&&(b+=I-Y),U.__data=new Float32Array(j.storage/Float32Array.BYTES_PER_ELEMENT),U.__offset=b,b+=j.storage}}}const D=b%I;return D>0&&(b+=I-D),M.__size=b,M.__cache={},this}function x(M){const T={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(T.boundary=4,T.storage=4):M.isVector2?(T.boundary=8,T.storage=8):M.isVector3||M.isColor?(T.boundary=16,T.storage=12):M.isVector4?(T.boundary=16,T.storage=16):M.isMatrix3?(T.boundary=48,T.storage=48):M.isMatrix4?(T.boundary=64,T.storage=64):M.isTexture?et("WebGLRenderer: Texture samplers can not be part of an uniforms group."):et("WebGLRenderer: Unsupported uniform value type.",M),T}function m(M){const T=M.target;T.removeEventListener("dispose",m);const b=o.indexOf(T.__bindingPointIndex);o.splice(b,1),n.deleteBuffer(r[T.id]),delete r[T.id],delete s[T.id]}function _(){for(const M in r)n.deleteBuffer(r[M]);o=[],r={},s={}}return{bind:l,update:c,dispose:_}}const PC=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let Si=null;function LC(){return Si===null&&(Si=new zh(PC,16,16,Ys,hr),Si.name="DFG_LUT",Si.minFilter=jt,Si.magFilter=jt,Si.wrapS=Li,Si.wrapT=Li,Si.generateMipmaps=!1,Si.needsUpdate=!0),Si}class uL{constructor(e={}){const{canvas:t=rE(),context:i=null,depth:r=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:d=!1,outputBufferType:g=Hn}=e;this.isWebGLRenderer=!0;let p;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=i.getContextAttributes().alpha}else p=o;const x=g,m=new Set([Fh,Oh,Uh]),_=new Set([Hn,Fi,Jo,Zo,Ih,Dh]),M=new Uint32Array(4),T=new Int32Array(4);let b=null,I=null;const D=[],B=[];let E=null;this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Ni,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const w=this;let L=!1;this._outputColorSpace=Yt;let R=0,U=0,H=null,q=-1,J=null;const O=new Vt,j=new Vt;let ie=null;const X=new ft(0);let Y=0,ne=t.width,fe=t.height,ye=1,je=null,tt=null;const he=new Vt(0,0,ne,fe),Se=new Vt(0,0,ne,fe);let Me=!1;const Le=new Wh;let Ae=!1,Fe=!1;const k=new mt,z=new ee,Z=new Vt,ge={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let ae=!1;function _e(){return H===null?ye:1}let N=i;function Ee(P,Q){return t.getContext(P,Q)}try{const P={alpha:!0,depth:r,stencil:s,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Ph}`),t.addEventListener("webglcontextlost",Xe,!1),t.addEventListener("webglcontextrestored",it,!1),t.addEventListener("webglcontextcreationerror",Ct,!1),N===null){const Q="webgl2";if(N=Ee(Q,P),N===null)throw Ee(Q)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(P){throw ot("WebGLRenderer: "+P.message),P}let ve,me,xe,C,S,W,re,de,se,Ue,Te,qe,Ye,be,Ce,Oe,ze,Ve,lt,K,Ie,Pe,Ke;function Re(){ve=new IR(N),ve.init(),Ie=new MC(N,ve),me=new ER(N,ve,e,Ie),xe=new yC(N,ve),me.reversedDepthBuffer&&d&&xe.buffers.depth.setReversed(!0),C=new UR(N),S=new oC,W=new SC(N,ve,xe,S,me,Ie,C),re=new LR(w),de=new VT(N),Pe=new MR(N,de),se=new DR(N,de,C,Pe),Ue=new FR(N,se,de,Pe,C),Ve=new OR(N,me,W),Ce=new TR(S),Te=new sC(w,re,ve,me,Pe,Ce),qe=new RC(w,S),Ye=new lC,be=new pC(ve),ze=new SR(w,re,xe,Ue,p,l),Oe=new xC(w,Ue,me),Ke=new CC(N,C,me,xe),lt=new bR(N,ve,C),K=new NR(N,ve,C),C.programs=Te.programs,w.capabilities=me,w.extensions=ve,w.properties=S,w.renderLists=Ye,w.shadowMap=Oe,w.state=xe,w.info=C}Re(),x!==Hn&&(E=new kR(x,t.width,t.height,r,s));const pe=new AC(w,N);this.xr=pe,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){const P=ve.get("WEBGL_lose_context");P&&P.loseContext()},this.forceContextRestore=function(){const P=ve.get("WEBGL_lose_context");P&&P.restoreContext()},this.getPixelRatio=function(){return ye},this.setPixelRatio=function(P){P!==void 0&&(ye=P,this.setSize(ne,fe,!1))},this.getSize=function(P){return P.set(ne,fe)},this.setSize=function(P,Q,ce=!0){if(pe.isPresenting){et("WebGLRenderer: Can't change size while VR device is presenting.");return}ne=P,fe=Q,t.width=Math.floor(P*ye),t.height=Math.floor(Q*ye),ce===!0&&(t.style.width=P+"px",t.style.height=Q+"px"),E!==null&&E.setSize(t.width,t.height),this.setViewport(0,0,P,Q)},this.getDrawingBufferSize=function(P){return P.set(ne*ye,fe*ye).floor()},this.setDrawingBufferSize=function(P,Q,ce){ne=P,fe=Q,ye=ce,t.width=Math.floor(P*ce),t.height=Math.floor(Q*ce),this.setViewport(0,0,P,Q)},this.setEffects=function(P){if(x!==Hn){if(P)for(let Q=0;Q<P.length&&P[Q].isOutputPass!==!0;Q++);E.setEffects(P||[])}},this.getCurrentViewport=function(P){return P.copy(O)},this.getViewport=function(P){return P.copy(he)},this.setViewport=function(P,Q,ce,oe){P.isVector4?he.set(P.x,P.y,P.z,P.w):he.set(P,Q,ce,oe),xe.viewport(O.copy(he).multiplyScalar(ye).round())},this.getScissor=function(P){return P.copy(Se)},this.setScissor=function(P,Q,ce,oe){P.isVector4?Se.set(P.x,P.y,P.z,P.w):Se.set(P,Q,ce,oe),xe.scissor(j.copy(Se).multiplyScalar(ye).round())},this.getScissorTest=function(){return Me},this.setScissorTest=function(P){xe.setScissorTest(Me=P)},this.setOpaqueSort=function(P){je=P},this.setTransparentSort=function(P){tt=P},this.getClearColor=function(P){return P.copy(ze.getClearColor())},this.setClearColor=function(){ze.setClearColor(...arguments)},this.getClearAlpha=function(){return ze.getClearAlpha()},this.setClearAlpha=function(){ze.setClearAlpha(...arguments)},this.clear=function(P=!0,Q=!0,ce=!0){let oe=0;if(P){let te=!1;if(H!==null){const Be=H.texture.format;te=m.has(Be)}if(te){const Be=H.texture.type,We=_.has(Be),De=ze.getClearColor(),$e=ze.getClearAlpha(),Je=De.r,ct=De.g,ht=De.b;We?(M[0]=Je,M[1]=ct,M[2]=ht,M[3]=$e,N.clearBufferuiv(N.COLOR,0,M)):(T[0]=Je,T[1]=ct,T[2]=ht,T[3]=$e,N.clearBufferiv(N.COLOR,0,T))}else oe|=N.COLOR_BUFFER_BIT}Q&&(oe|=N.DEPTH_BUFFER_BIT),ce&&(oe|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),oe!==0&&N.clear(oe)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",Xe,!1),t.removeEventListener("webglcontextrestored",it,!1),t.removeEventListener("webglcontextcreationerror",Ct,!1),ze.dispose(),Ye.dispose(),be.dispose(),S.dispose(),re.dispose(),Ue.dispose(),Pe.dispose(),Ke.dispose(),Te.dispose(),pe.dispose(),pe.removeEventListener("sessionstart",_i),pe.removeEventListener("sessionend",uo),Pt.stop()};function Xe(P){P.preventDefault(),Ll("WebGLRenderer: Context Lost."),L=!0}function it(){Ll("WebGLRenderer: Context Restored."),L=!1;const P=C.autoReset,Q=Oe.enabled,ce=Oe.autoUpdate,oe=Oe.needsUpdate,te=Oe.type;Re(),C.autoReset=P,Oe.enabled=Q,Oe.autoUpdate=ce,Oe.needsUpdate=oe,Oe.type=te}function Ct(P){ot("WebGLRenderer: A WebGL context could not be created. Reason: ",P.statusMessage)}function Mt(P){const Q=P.target;Q.removeEventListener("dispose",Mt),Cn(Q)}function Cn(P){ti(P),S.remove(P)}function ti(P){const Q=S.get(P).programs;Q!==void 0&&(Q.forEach(function(ce){Te.releaseProgram(ce)}),P.isShaderMaterial&&Te.releaseShaderCache(P))}this.renderBufferDirect=function(P,Q,ce,oe,te,Be){Q===null&&(Q=ge);const We=te.isMesh&&te.matrixWorld.determinant()<0,De=ho(P,Q,ce,oe,te);xe.setMaterial(oe,We);let $e=ce.index,Je=1;if(oe.wireframe===!0){if($e=se.getWireframeAttribute(ce),$e===void 0)return;Je=2}const ct=ce.drawRange,ht=ce.attributes.position;let Ze=ct.start*Je,At=(ct.start+ct.count)*Je;Be!==null&&(Ze=Math.max(Ze,Be.start*Je),At=Math.min(At,(Be.start+Be.count)*Je)),$e!==null?(Ze=Math.max(Ze,0),At=Math.min(At,$e.count)):ht!=null&&(Ze=Math.max(Ze,0),At=Math.min(At,ht.count));const Ht=At-Ze;if(Ht<0||Ht===1/0)return;Pe.setup(te,oe,De,ce,$e);let Bt,Tt=lt;if($e!==null&&(Bt=de.get($e),Tt=K,Tt.setIndex(Bt)),te.isMesh)oe.wireframe===!0?(xe.setLineWidth(oe.wireframeLinewidth*_e()),Tt.setMode(N.LINES)):Tt.setMode(N.TRIANGLES);else if(te.isLine){let en=oe.linewidth;en===void 0&&(en=1),xe.setLineWidth(en*_e()),te.isLineSegments?Tt.setMode(N.LINES):te.isLineLoop?Tt.setMode(N.LINE_LOOP):Tt.setMode(N.LINE_STRIP)}else te.isPoints?Tt.setMode(N.POINTS):te.isSprite&&Tt.setMode(N.TRIANGLES);if(te.isBatchedMesh)if(te._multiDrawInstances!==null)Il("WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),Tt.renderMultiDrawInstances(te._multiDrawStarts,te._multiDrawCounts,te._multiDrawCount,te._multiDrawInstances);else if(ve.get("WEBGL_multi_draw"))Tt.renderMultiDraw(te._multiDrawStarts,te._multiDrawCounts,te._multiDrawCount);else{const en=te._multiDrawStarts,He=te._multiDrawCounts,pn=te._multiDrawCount,xt=$e?de.get($e).bytesPerElement:1,mn=S.get(oe).currentProgram.getUniforms();for(let Bn=0;Bn<pn;Bn++)mn.setValue(N,"_gl_DrawID",Bn),Tt.render(en[Bn]/xt,He[Bn])}else if(te.isInstancedMesh)Tt.renderInstances(Ze,Ht,te.count);else if(ce.isInstancedBufferGeometry){const en=ce._maxInstanceCount!==void 0?ce._maxInstanceCount:1/0,He=Math.min(ce.instanceCount,en);Tt.renderInstances(Ze,Ht,He)}else Tt.render(Ze,Ht)};function zi(P,Q,ce){P.transparent===!0&&P.side===Pi&&P.forceSinglePass===!1?(P.side=On,P.needsUpdate=!0,Wi(P,Q,ce),P.side=fr,P.needsUpdate=!0,Wi(P,Q,ce),P.side=Pi):Wi(P,Q,ce)}this.compile=function(P,Q,ce=null){ce===null&&(ce=P),I=be.get(ce),I.init(Q),B.push(I),ce.traverseVisible(function(te){te.isLight&&te.layers.test(Q.layers)&&(I.pushLight(te),te.castShadow&&I.pushShadow(te))}),P!==ce&&P.traverseVisible(function(te){te.isLight&&te.layers.test(Q.layers)&&(I.pushLight(te),te.castShadow&&I.pushShadow(te))}),I.setupLights();const oe=new Set;return P.traverse(function(te){if(!(te.isMesh||te.isPoints||te.isLine||te.isSprite))return;const Be=te.material;if(Be)if(Array.isArray(Be))for(let We=0;We<Be.length;We++){const De=Be[We];zi(De,ce,te),oe.add(De)}else zi(Be,ce,te),oe.add(Be)}),I=B.pop(),oe},this.compileAsync=function(P,Q,ce=null){const oe=this.compile(P,Q,ce);return new Promise(te=>{function Be(){if(oe.forEach(function(We){S.get(We).currentProgram.isReady()&&oe.delete(We)}),oe.size===0){te(P);return}setTimeout(Be,10)}ve.get("KHR_parallel_shader_compile")!==null?Be():setTimeout(Be,10)})};let co=null;function ni(P){co&&co(P)}function _i(){Pt.stop()}function uo(){Pt.start()}const Pt=new $0;Pt.setAnimationLoop(ni),typeof self<"u"&&Pt.setContext(self),this.setAnimationLoop=function(P){co=P,pe.setAnimationLoop(P),P===null?Pt.stop():Pt.start()},pe.addEventListener("sessionstart",_i),pe.addEventListener("sessionend",uo),this.render=function(P,Q){if(Q!==void 0&&Q.isCamera!==!0){ot("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(L===!0)return;const ce=pe.enabled===!0&&pe.isPresenting===!0,oe=E!==null&&(H===null||ce)&&E.begin(w,H);if(P.matrixWorldAutoUpdate===!0&&P.updateMatrixWorld(),Q.parent===null&&Q.matrixWorldAutoUpdate===!0&&Q.updateMatrixWorld(),pe.enabled===!0&&pe.isPresenting===!0&&(E===null||E.isCompositing()===!1)&&(pe.cameraAutoUpdate===!0&&pe.updateCamera(Q),Q=pe.getCamera()),P.isScene===!0&&P.onBeforeRender(w,P,Q,H),I=be.get(P,B.length),I.init(Q),B.push(I),k.multiplyMatrices(Q.projectionMatrix,Q.matrixWorldInverse),Le.setFromProjectionMatrix(k,Ii,Q.reversedDepth),Fe=this.localClippingEnabled,Ae=Ce.init(this.clippingPlanes,Fe),b=Ye.get(P,D.length),b.init(),D.push(b),pe.enabled===!0&&pe.isPresenting===!0){const We=w.xr.getDepthSensingMesh();We!==null&&Pn(We,Q,-1/0,w.sortObjects)}Pn(P,Q,0,w.sortObjects),b.finish(),w.sortObjects===!0&&b.sort(je,tt),ae=pe.enabled===!1||pe.isPresenting===!1||pe.hasDepthSensing()===!1,ae&&ze.addToRenderList(b,P),this.info.render.frame++,Ae===!0&&Ce.beginShadows();const te=I.state.shadowsArray;if(Oe.render(te,P,Q),Ae===!0&&Ce.endShadows(),this.info.autoReset===!0&&this.info.reset(),(oe&&E.hasRenderPass())===!1){const We=b.opaque,De=b.transmissive;if(I.setupLights(),Q.isArrayCamera){const $e=Q.cameras;if(De.length>0)for(let Je=0,ct=$e.length;Je<ct;Je++){const ht=$e[Je];ma(We,De,P,ht)}ae&&ze.render(P);for(let Je=0,ct=$e.length;Je<ct;Je++){const ht=$e[Je];fs(b,P,ht,ht.viewport)}}else De.length>0&&ma(We,De,P,Q),ae&&ze.render(P),fs(b,P,Q)}H!==null&&U===0&&(W.updateMultisampleRenderTarget(H),W.updateRenderTargetMipmap(H)),oe&&E.end(w),P.isScene===!0&&P.onAfterRender(w,P,Q),Pe.resetDefaultState(),q=-1,J=null,B.pop(),B.length>0?(I=B[B.length-1],Ae===!0&&Ce.setGlobalState(w.clippingPlanes,I.state.camera)):I=null,D.pop(),D.length>0?b=D[D.length-1]:b=null};function Pn(P,Q,ce,oe){if(P.visible===!1)return;if(P.layers.test(Q.layers)){if(P.isGroup)ce=P.renderOrder;else if(P.isLOD)P.autoUpdate===!0&&P.update(Q);else if(P.isLight)I.pushLight(P),P.castShadow&&I.pushShadow(P);else if(P.isSprite){if(!P.frustumCulled||Le.intersectsSprite(P)){oe&&Z.setFromMatrixPosition(P.matrixWorld).applyMatrix4(k);const We=Ue.update(P),De=P.material;De.visible&&b.push(P,We,De,ce,Z.z,null)}}else if((P.isMesh||P.isLine||P.isPoints)&&(!P.frustumCulled||Le.intersectsObject(P))){const We=Ue.update(P),De=P.material;if(oe&&(P.boundingSphere!==void 0?(P.boundingSphere===null&&P.computeBoundingSphere(),Z.copy(P.boundingSphere.center)):(We.boundingSphere===null&&We.computeBoundingSphere(),Z.copy(We.boundingSphere.center)),Z.applyMatrix4(P.matrixWorld).applyMatrix4(k)),Array.isArray(De)){const $e=We.groups;for(let Je=0,ct=$e.length;Je<ct;Je++){const ht=$e[Je],Ze=De[ht.materialIndex];Ze&&Ze.visible&&b.push(P,We,Ze,ce,Z.z,ht)}}else De.visible&&b.push(P,We,De,ce,Z.z,null)}}const Be=P.children;for(let We=0,De=Be.length;We<De;We++)Pn(Be[We],Q,ce,oe)}function fs(P,Q,ce,oe){const{opaque:te,transmissive:Be,transparent:We}=P;I.setupLightsView(ce),Ae===!0&&Ce.setGlobalState(w.clippingPlanes,ce),oe&&xe.viewport(O.copy(oe)),te.length>0&&Gi(te,Q,ce),Be.length>0&&Gi(Be,Q,ce),We.length>0&&Gi(We,Q,ce),xe.buffers.depth.setTest(!0),xe.buffers.depth.setMask(!0),xe.buffers.color.setMask(!0),xe.setPolygonOffset(!1)}function ma(P,Q,ce,oe){if((ce.isScene===!0?ce.overrideMaterial:null)!==null)return;if(I.state.transmissionRenderTarget[oe.id]===void 0){const Ze=ve.has("EXT_color_buffer_half_float")||ve.has("EXT_color_buffer_float");I.state.transmissionRenderTarget[oe.id]=new Ui(1,1,{generateMipmaps:!0,type:Ze?hr:Hn,minFilter:rr,samples:Math.max(4,me.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:yt.workingColorSpace})}const Be=I.state.transmissionRenderTarget[oe.id],We=oe.viewport||O;Be.setSize(We.z*w.transmissionResolutionScale,We.w*w.transmissionResolutionScale);const De=w.getRenderTarget(),$e=w.getActiveCubeFace(),Je=w.getActiveMipmapLevel();w.setRenderTarget(Be),w.getClearColor(X),Y=w.getClearAlpha(),Y<1&&w.setClearColor(16777215,.5),w.clear(),ae&&ze.render(ce);const ct=w.toneMapping;w.toneMapping=Ni;const ht=oe.viewport;if(oe.viewport!==void 0&&(oe.viewport=void 0),I.setupLightsView(oe),Ae===!0&&Ce.setGlobalState(w.clippingPlanes,oe),Gi(P,ce,oe),W.updateMultisampleRenderTarget(Be),W.updateRenderTargetMipmap(Be),ve.has("WEBGL_multisampled_render_to_texture")===!1){let Ze=!1;for(let At=0,Ht=Q.length;At<Ht;At++){const Bt=Q[At],{object:Tt,geometry:en,material:He,group:pn}=Bt;if(He.side===Pi&&Tt.layers.test(oe.layers)){const xt=He.side;He.side=On,He.needsUpdate=!0,hs(Tt,ce,oe,en,He,pn),He.side=xt,He.needsUpdate=!0,Ze=!0}}Ze===!0&&(W.updateMultisampleRenderTarget(Be),W.updateRenderTargetMipmap(Be))}w.setRenderTarget(De,$e,Je),w.setClearColor(X,Y),ht!==void 0&&(oe.viewport=ht),w.toneMapping=ct}function Gi(P,Q,ce){const oe=Q.isScene===!0?Q.overrideMaterial:null;for(let te=0,Be=P.length;te<Be;te++){const We=P[te],{object:De,geometry:$e,group:Je}=We;let ct=We.material;ct.allowOverride===!0&&oe!==null&&(ct=oe),De.layers.test(ce.layers)&&hs(De,Q,ce,$e,ct,Je)}}function hs(P,Q,ce,oe,te,Be){P.onBeforeRender(w,Q,ce,oe,te,Be),P.modelViewMatrix.multiplyMatrices(ce.matrixWorldInverse,P.matrixWorld),P.normalMatrix.getNormalMatrix(P.modelViewMatrix),te.onBeforeRender(w,Q,ce,oe,P,Be),te.transparent===!0&&te.side===Pi&&te.forceSinglePass===!1?(te.side=On,te.needsUpdate=!0,w.renderBufferDirect(ce,Q,oe,te,P,Be),te.side=fr,te.needsUpdate=!0,w.renderBufferDirect(ce,Q,oe,te,P,Be),te.side=Pi):w.renderBufferDirect(ce,Q,oe,te,P,Be),P.onAfterRender(w,Q,ce,oe,te,Be)}function Wi(P,Q,ce){Q.isScene!==!0&&(Q=ge);const oe=S.get(P),te=I.state.lights,Be=I.state.shadowsArray,We=te.state.version,De=Te.getParameters(P,te.state,Be,Q,ce),$e=Te.getProgramCacheKey(De);let Je=oe.programs;oe.environment=P.isMeshStandardMaterial||P.isMeshLambertMaterial||P.isMeshPhongMaterial?Q.environment:null,oe.fog=Q.fog;const ct=P.isMeshStandardMaterial||P.isMeshLambertMaterial&&!P.envMap||P.isMeshPhongMaterial&&!P.envMap;oe.envMap=re.get(P.envMap||oe.environment,ct),oe.envMapRotation=oe.environment!==null&&P.envMap===null?Q.environmentRotation:P.envMapRotation,Je===void 0&&(P.addEventListener("dispose",Mt),Je=new Map,oe.programs=Je);let ht=Je.get($e);if(ht!==void 0){if(oe.currentProgram===ht&&oe.lightsStateVersion===We)return fo(P,De),ht}else De.uniforms=Te.getUniforms(P),P.onBeforeCompile(De,w),ht=Te.acquireProgram(De,$e),Je.set($e,ht),oe.uniforms=De.uniforms;const Ze=oe.uniforms;return(!P.isShaderMaterial&&!P.isRawShaderMaterial||P.clipping===!0)&&(Ze.clippingPlanes=Ce.uniform),fo(P,De),oe.needsLights=ga(P),oe.lightsStateVersion=We,oe.needsLights&&(Ze.ambientLightColor.value=te.state.ambient,Ze.lightProbe.value=te.state.probe,Ze.directionalLights.value=te.state.directional,Ze.directionalLightShadows.value=te.state.directionalShadow,Ze.spotLights.value=te.state.spot,Ze.spotLightShadows.value=te.state.spotShadow,Ze.rectAreaLights.value=te.state.rectArea,Ze.ltc_1.value=te.state.rectAreaLTC1,Ze.ltc_2.value=te.state.rectAreaLTC2,Ze.pointLights.value=te.state.point,Ze.pointLightShadows.value=te.state.pointShadow,Ze.hemisphereLights.value=te.state.hemi,Ze.directionalShadowMatrix.value=te.state.directionalShadowMatrix,Ze.spotLightMatrix.value=te.state.spotLightMatrix,Ze.spotLightMap.value=te.state.spotLightMap,Ze.pointShadowMatrix.value=te.state.pointShadowMatrix),oe.currentProgram=ht,oe.uniformsList=null,ht}function _r(P){if(P.uniformsList===null){const Q=P.currentProgram.getUniforms();P.uniformsList=vl.seqWithValue(Q.seq,P.uniforms)}return P.uniformsList}function fo(P,Q){const ce=S.get(P);ce.outputColorSpace=Q.outputColorSpace,ce.batching=Q.batching,ce.batchingColor=Q.batchingColor,ce.instancing=Q.instancing,ce.instancingColor=Q.instancingColor,ce.instancingMorph=Q.instancingMorph,ce.skinning=Q.skinning,ce.morphTargets=Q.morphTargets,ce.morphNormals=Q.morphNormals,ce.morphColors=Q.morphColors,ce.morphTargetsCount=Q.morphTargetsCount,ce.numClippingPlanes=Q.numClippingPlanes,ce.numIntersection=Q.numClipIntersection,ce.vertexAlphas=Q.vertexAlphas,ce.vertexTangents=Q.vertexTangents,ce.toneMapping=Q.toneMapping}function ho(P,Q,ce,oe,te){Q.isScene!==!0&&(Q=ge),W.resetTextureUnits();const Be=Q.fog,We=oe.isMeshStandardMaterial||oe.isMeshLambertMaterial||oe.isMeshPhongMaterial?Q.environment:null,De=H===null?w.outputColorSpace:H.isXRRenderTarget===!0?H.texture.colorSpace:bn,$e=oe.isMeshStandardMaterial||oe.isMeshLambertMaterial&&!oe.envMap||oe.isMeshPhongMaterial&&!oe.envMap,Je=re.get(oe.envMap||We,$e),ct=oe.vertexColors===!0&&!!ce.attributes.color&&ce.attributes.color.itemSize===4,ht=!!ce.attributes.tangent&&(!!oe.normalMap||oe.anisotropy>0),Ze=!!ce.morphAttributes.position,At=!!ce.morphAttributes.normal,Ht=!!ce.morphAttributes.color;let Bt=Ni;oe.toneMapped&&(H===null||H.isXRRenderTarget===!0)&&(Bt=w.toneMapping);const Tt=ce.morphAttributes.position||ce.morphAttributes.normal||ce.morphAttributes.color,en=Tt!==void 0?Tt.length:0,He=S.get(oe),pn=I.state.lights;if(Ae===!0&&(Fe===!0||P!==J)){const zt=P===J&&oe.id===q;Ce.setState(oe,P,zt)}let xt=!1;oe.version===He.__version?(He.needsLights&&He.lightsStateVersion!==pn.state.version||He.outputColorSpace!==De||te.isBatchedMesh&&He.batching===!1||!te.isBatchedMesh&&He.batching===!0||te.isBatchedMesh&&He.batchingColor===!0&&te.colorTexture===null||te.isBatchedMesh&&He.batchingColor===!1&&te.colorTexture!==null||te.isInstancedMesh&&He.instancing===!1||!te.isInstancedMesh&&He.instancing===!0||te.isSkinnedMesh&&He.skinning===!1||!te.isSkinnedMesh&&He.skinning===!0||te.isInstancedMesh&&He.instancingColor===!0&&te.instanceColor===null||te.isInstancedMesh&&He.instancingColor===!1&&te.instanceColor!==null||te.isInstancedMesh&&He.instancingMorph===!0&&te.morphTexture===null||te.isInstancedMesh&&He.instancingMorph===!1&&te.morphTexture!==null||He.envMap!==Je||oe.fog===!0&&He.fog!==Be||He.numClippingPlanes!==void 0&&(He.numClippingPlanes!==Ce.numPlanes||He.numIntersection!==Ce.numIntersection)||He.vertexAlphas!==ct||He.vertexTangents!==ht||He.morphTargets!==Ze||He.morphNormals!==At||He.morphColors!==Ht||He.toneMapping!==Bt||He.morphTargetsCount!==en)&&(xt=!0):(xt=!0,He.__version=oe.version);let mn=He.currentProgram;xt===!0&&(mn=Wi(oe,Q,te));let Bn=!1,vi=!1,vr=!1;const Lt=mn.getUniforms(),Kt=He.uniforms;if(xe.useProgram(mn.program)&&(Bn=!0,vi=!0,vr=!0),oe.id!==q&&(q=oe.id,vi=!0),Bn||J!==P){xe.buffers.depth.getReversed()&&P.reversedDepth!==!0&&(P._reversedDepth=!0,P.updateProjectionMatrix()),Lt.setValue(N,"projectionMatrix",P.projectionMatrix),Lt.setValue(N,"viewMatrix",P.matrixWorldInverse);const ri=Lt.map.cameraPosition;ri!==void 0&&ri.setValue(N,z.setFromMatrixPosition(P.matrixWorld)),me.logarithmicDepthBuffer&&Lt.setValue(N,"logDepthBufFC",2/(Math.log(P.far+1)/Math.LN2)),(oe.isMeshPhongMaterial||oe.isMeshToonMaterial||oe.isMeshLambertMaterial||oe.isMeshBasicMaterial||oe.isMeshStandardMaterial||oe.isShaderMaterial)&&Lt.setValue(N,"isOrthographic",P.isOrthographicCamera===!0),J!==P&&(J=P,vi=!0,vr=!0)}if(He.needsLights&&(pn.state.directionalShadowMap.length>0&&Lt.setValue(N,"directionalShadowMap",pn.state.directionalShadowMap,W),pn.state.spotShadowMap.length>0&&Lt.setValue(N,"spotShadowMap",pn.state.spotShadowMap,W),pn.state.pointShadowMap.length>0&&Lt.setValue(N,"pointShadowMap",pn.state.pointShadowMap,W)),te.isSkinnedMesh){Lt.setOptional(N,te,"bindMatrix"),Lt.setOptional(N,te,"bindMatrixInverse");const zt=te.skeleton;zt&&(zt.boneTexture===null&&zt.computeBoneTexture(),Lt.setValue(N,"boneTexture",zt.boneTexture,W))}te.isBatchedMesh&&(Lt.setOptional(N,te,"batchingTexture"),Lt.setValue(N,"batchingTexture",te._matricesTexture,W),Lt.setOptional(N,te,"batchingIdTexture"),Lt.setValue(N,"batchingIdTexture",te._indirectTexture,W),Lt.setOptional(N,te,"batchingColorTexture"),te._colorsTexture!==null&&Lt.setValue(N,"batchingColorTexture",te._colorsTexture,W));const ii=ce.morphAttributes;if((ii.position!==void 0||ii.normal!==void 0||ii.color!==void 0)&&Ve.update(te,ce,mn),(vi||He.receiveShadow!==te.receiveShadow)&&(He.receiveShadow=te.receiveShadow,Lt.setValue(N,"receiveShadow",te.receiveShadow)),(oe.isMeshStandardMaterial||oe.isMeshLambertMaterial||oe.isMeshPhongMaterial)&&oe.envMap===null&&Q.environment!==null&&(Kt.envMapIntensity.value=Q.environmentIntensity),Kt.dfgLUT!==void 0&&(Kt.dfgLUT.value=LC()),vi&&(Lt.setValue(N,"toneMappingExposure",w.toneMappingExposure),He.needsLights&&po(Kt,vr),Be&&oe.fog===!0&&qe.refreshFogUniforms(Kt,Be),qe.refreshMaterialUniforms(Kt,oe,ye,fe,I.state.transmissionRenderTarget[P.id]),vl.upload(N,_r(He),Kt,W)),oe.isShaderMaterial&&oe.uniformsNeedUpdate===!0&&(vl.upload(N,_r(He),Kt,W),oe.uniformsNeedUpdate=!1),oe.isSpriteMaterial&&Lt.setValue(N,"center",te.center),Lt.setValue(N,"modelViewMatrix",te.modelViewMatrix),Lt.setValue(N,"normalMatrix",te.normalMatrix),Lt.setValue(N,"modelMatrix",te.matrixWorld),oe.isShaderMaterial||oe.isRawShaderMaterial){const zt=oe.uniformsGroups;for(let ri=0,ji=zt.length;ri<ji;ri++){const xr=zt[ri];Ke.update(xr,mn),Ke.bind(xr,mn)}}return mn}function po(P,Q){P.ambientLightColor.needsUpdate=Q,P.lightProbe.needsUpdate=Q,P.directionalLights.needsUpdate=Q,P.directionalLightShadows.needsUpdate=Q,P.pointLights.needsUpdate=Q,P.pointLightShadows.needsUpdate=Q,P.spotLights.needsUpdate=Q,P.spotLightShadows.needsUpdate=Q,P.rectAreaLights.needsUpdate=Q,P.hemisphereLights.needsUpdate=Q}function ga(P){return P.isMeshLambertMaterial||P.isMeshToonMaterial||P.isMeshPhongMaterial||P.isMeshStandardMaterial||P.isShadowMaterial||P.isShaderMaterial&&P.lights===!0}this.getActiveCubeFace=function(){return R},this.getActiveMipmapLevel=function(){return U},this.getRenderTarget=function(){return H},this.setRenderTargetTextures=function(P,Q,ce){const oe=S.get(P);oe.__autoAllocateDepthBuffer=P.resolveDepthBuffer===!1,oe.__autoAllocateDepthBuffer===!1&&(oe.__useRenderToTexture=!1),S.get(P.texture).__webglTexture=Q,S.get(P.depthTexture).__webglTexture=oe.__autoAllocateDepthBuffer?void 0:ce,oe.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(P,Q){const ce=S.get(P);ce.__webglFramebuffer=Q,ce.__useDefaultFramebuffer=Q===void 0};const Fn=N.createFramebuffer();this.setRenderTarget=function(P,Q=0,ce=0){H=P,R=Q,U=ce;let oe=null,te=!1,Be=!1;if(P){const De=S.get(P);if(De.__useDefaultFramebuffer!==void 0){xe.bindFramebuffer(N.FRAMEBUFFER,De.__webglFramebuffer),O.copy(P.viewport),j.copy(P.scissor),ie=P.scissorTest,xe.viewport(O),xe.scissor(j),xe.setScissorTest(ie),q=-1;return}else if(De.__webglFramebuffer===void 0)W.setupRenderTarget(P);else if(De.__hasExternalTextures)W.rebindTextures(P,S.get(P.texture).__webglTexture,S.get(P.depthTexture).__webglTexture);else if(P.depthBuffer){const ct=P.depthTexture;if(De.__boundDepthTexture!==ct){if(ct!==null&&S.has(ct)&&(P.width!==ct.image.width||P.height!==ct.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");W.setupDepthRenderbuffer(P)}}const $e=P.texture;($e.isData3DTexture||$e.isDataArrayTexture||$e.isCompressedArrayTexture)&&(Be=!0);const Je=S.get(P).__webglFramebuffer;P.isWebGLCubeRenderTarget?(Array.isArray(Je[Q])?oe=Je[Q][ce]:oe=Je[Q],te=!0):P.samples>0&&W.useMultisampledRTT(P)===!1?oe=S.get(P).__webglMultisampledFramebuffer:Array.isArray(Je)?oe=Je[ce]:oe=Je,O.copy(P.viewport),j.copy(P.scissor),ie=P.scissorTest}else O.copy(he).multiplyScalar(ye).floor(),j.copy(Se).multiplyScalar(ye).floor(),ie=Me;if(ce!==0&&(oe=Fn),xe.bindFramebuffer(N.FRAMEBUFFER,oe)&&xe.drawBuffers(P,oe),xe.viewport(O),xe.scissor(j),xe.setScissorTest(ie),te){const De=S.get(P.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+Q,De.__webglTexture,ce)}else if(Be){const De=Q;for(let $e=0;$e<P.textures.length;$e++){const Je=S.get(P.textures[$e]);N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0+$e,Je.__webglTexture,ce,De)}}else if(P!==null&&ce!==0){const De=S.get(P.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,De.__webglTexture,ce)}q=-1},this.readRenderTargetPixels=function(P,Q,ce,oe,te,Be,We,De=0){if(!(P&&P.isWebGLRenderTarget)){ot("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let $e=S.get(P).__webglFramebuffer;if(P.isWebGLCubeRenderTarget&&We!==void 0&&($e=$e[We]),$e){xe.bindFramebuffer(N.FRAMEBUFFER,$e);try{const Je=P.textures[De],ct=Je.format,ht=Je.type;if(P.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+De),!me.textureFormatReadable(ct)){ot("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!me.textureTypeReadable(ht)){ot("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}Q>=0&&Q<=P.width-oe&&ce>=0&&ce<=P.height-te&&N.readPixels(Q,ce,oe,te,Ie.convert(ct),Ie.convert(ht),Be)}finally{const Je=H!==null?S.get(H).__webglFramebuffer:null;xe.bindFramebuffer(N.FRAMEBUFFER,Je)}}},this.readRenderTargetPixelsAsync=async function(P,Q,ce,oe,te,Be,We,De=0){if(!(P&&P.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let $e=S.get(P).__webglFramebuffer;if(P.isWebGLCubeRenderTarget&&We!==void 0&&($e=$e[We]),$e)if(Q>=0&&Q<=P.width-oe&&ce>=0&&ce<=P.height-te){xe.bindFramebuffer(N.FRAMEBUFFER,$e);const Je=P.textures[De],ct=Je.format,ht=Je.type;if(P.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+De),!me.textureFormatReadable(ct))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!me.textureTypeReadable(ht))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Ze=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,Ze),N.bufferData(N.PIXEL_PACK_BUFFER,Be.byteLength,N.STREAM_READ),N.readPixels(Q,ce,oe,te,Ie.convert(ct),Ie.convert(ht),0);const At=H!==null?S.get(H).__webglFramebuffer:null;xe.bindFramebuffer(N.FRAMEBUFFER,At);const Ht=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await sE(N,Ht,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,Ze),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,Be),N.deleteBuffer(Ze),N.deleteSync(Ht),Be}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(P,Q=null,ce=0){const oe=Math.pow(2,-ce),te=Math.floor(P.image.width*oe),Be=Math.floor(P.image.height*oe),We=Q!==null?Q.x:0,De=Q!==null?Q.y:0;W.setTexture2D(P,0),N.copyTexSubImage2D(N.TEXTURE_2D,ce,0,0,We,De,te,Be),xe.unbindTexture()};const jn=N.createFramebuffer(),Fr=N.createFramebuffer();this.copyTextureToTexture=function(P,Q,ce=null,oe=null,te=0,Be=0){let We,De,$e,Je,ct,ht,Ze,At,Ht;const Bt=P.isCompressedTexture?P.mipmaps[Be]:P.image;if(ce!==null)We=ce.max.x-ce.min.x,De=ce.max.y-ce.min.y,$e=ce.isBox3?ce.max.z-ce.min.z:1,Je=ce.min.x,ct=ce.min.y,ht=ce.isBox3?ce.min.z:0;else{const Kt=Math.pow(2,-te);We=Math.floor(Bt.width*Kt),De=Math.floor(Bt.height*Kt),P.isDataArrayTexture?$e=Bt.depth:P.isData3DTexture?$e=Math.floor(Bt.depth*Kt):$e=1,Je=0,ct=0,ht=0}oe!==null?(Ze=oe.x,At=oe.y,Ht=oe.z):(Ze=0,At=0,Ht=0);const Tt=Ie.convert(Q.format),en=Ie.convert(Q.type);let He;Q.isData3DTexture?(W.setTexture3D(Q,0),He=N.TEXTURE_3D):Q.isDataArrayTexture||Q.isCompressedArrayTexture?(W.setTexture2DArray(Q,0),He=N.TEXTURE_2D_ARRAY):(W.setTexture2D(Q,0),He=N.TEXTURE_2D),N.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,Q.flipY),N.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,Q.premultiplyAlpha),N.pixelStorei(N.UNPACK_ALIGNMENT,Q.unpackAlignment);const pn=N.getParameter(N.UNPACK_ROW_LENGTH),xt=N.getParameter(N.UNPACK_IMAGE_HEIGHT),mn=N.getParameter(N.UNPACK_SKIP_PIXELS),Bn=N.getParameter(N.UNPACK_SKIP_ROWS),vi=N.getParameter(N.UNPACK_SKIP_IMAGES);N.pixelStorei(N.UNPACK_ROW_LENGTH,Bt.width),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,Bt.height),N.pixelStorei(N.UNPACK_SKIP_PIXELS,Je),N.pixelStorei(N.UNPACK_SKIP_ROWS,ct),N.pixelStorei(N.UNPACK_SKIP_IMAGES,ht);const vr=P.isDataArrayTexture||P.isData3DTexture,Lt=Q.isDataArrayTexture||Q.isData3DTexture;if(P.isDepthTexture){const Kt=S.get(P),ii=S.get(Q),zt=S.get(Kt.__renderTarget),ri=S.get(ii.__renderTarget);xe.bindFramebuffer(N.READ_FRAMEBUFFER,zt.__webglFramebuffer),xe.bindFramebuffer(N.DRAW_FRAMEBUFFER,ri.__webglFramebuffer);for(let ji=0;ji<$e;ji++)vr&&(N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,S.get(P).__webglTexture,te,ht+ji),N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,S.get(Q).__webglTexture,Be,Ht+ji)),N.blitFramebuffer(Je,ct,We,De,Ze,At,We,De,N.DEPTH_BUFFER_BIT,N.NEAREST);xe.bindFramebuffer(N.READ_FRAMEBUFFER,null),xe.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else if(te!==0||P.isRenderTargetTexture||S.has(P)){const Kt=S.get(P),ii=S.get(Q);xe.bindFramebuffer(N.READ_FRAMEBUFFER,jn),xe.bindFramebuffer(N.DRAW_FRAMEBUFFER,Fr);for(let zt=0;zt<$e;zt++)vr?N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,Kt.__webglTexture,te,ht+zt):N.framebufferTexture2D(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,Kt.__webglTexture,te),Lt?N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,ii.__webglTexture,Be,Ht+zt):N.framebufferTexture2D(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,ii.__webglTexture,Be),te!==0?N.blitFramebuffer(Je,ct,We,De,Ze,At,We,De,N.COLOR_BUFFER_BIT,N.NEAREST):Lt?N.copyTexSubImage3D(He,Be,Ze,At,Ht+zt,Je,ct,We,De):N.copyTexSubImage2D(He,Be,Ze,At,Je,ct,We,De);xe.bindFramebuffer(N.READ_FRAMEBUFFER,null),xe.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else Lt?P.isDataTexture||P.isData3DTexture?N.texSubImage3D(He,Be,Ze,At,Ht,We,De,$e,Tt,en,Bt.data):Q.isCompressedArrayTexture?N.compressedTexSubImage3D(He,Be,Ze,At,Ht,We,De,$e,Tt,Bt.data):N.texSubImage3D(He,Be,Ze,At,Ht,We,De,$e,Tt,en,Bt):P.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,Be,Ze,At,We,De,Tt,en,Bt.data):P.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,Be,Ze,At,Bt.width,Bt.height,Tt,Bt.data):N.texSubImage2D(N.TEXTURE_2D,Be,Ze,At,We,De,Tt,en,Bt);N.pixelStorei(N.UNPACK_ROW_LENGTH,pn),N.pixelStorei(N.UNPACK_IMAGE_HEIGHT,xt),N.pixelStorei(N.UNPACK_SKIP_PIXELS,mn),N.pixelStorei(N.UNPACK_SKIP_ROWS,Bn),N.pixelStorei(N.UNPACK_SKIP_IMAGES,vi),Be===0&&Q.generateMipmaps&&N.generateMipmap(He),xe.unbindTexture()},this.initRenderTarget=function(P){S.get(P).__webglFramebuffer===void 0&&W.setupRenderTarget(P)},this.initTexture=function(P){P.isCubeTexture?W.setTextureCube(P,0):P.isData3DTexture?W.setTexture3D(P,0):P.isDataArrayTexture||P.isCompressedArrayTexture?W.setTexture2DArray(P,0):W.setTexture2D(P,0),xe.unbindTexture()},this.resetState=function(){R=0,U=0,H=null,xe.reset(),Pe.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Ii}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=yt._getDrawingBufferColorSpace(e),t.unpackColorSpace=yt._getUnpackColorSpace()}}function ug(n,e){if(e===qb)return n;if(e===$f||e===R0){let t=n.getIndex();if(t===null){const o=[],a=n.getAttribute("position");if(a!==void 0){for(let l=0;l<a.count;l++)o.push(l);n.setIndex(o),t=n.getIndex()}else return n}const i=t.count-2,r=[];if(e===$f)for(let o=1;o<=i;o++)r.push(t.getX(0)),r.push(t.getX(o)),r.push(t.getX(o+1));else for(let o=0;o<i;o++)o%2===0?(r.push(t.getX(o)),r.push(t.getX(o+1)),r.push(t.getX(o+2))):(r.push(t.getX(o+2)),r.push(t.getX(o+1)),r.push(t.getX(o)));r.length/3;const s=n.clone();return s.setIndex(r),s.clearGroups(),s}else return n}function IC(n){const e=new Map,t=new Map,i=n.clone();return tv(n,i,function(r,s){e.set(s,r),t.set(r,s)}),i.traverse(function(r){if(!r.isSkinnedMesh)return;const s=r,o=e.get(r),a=o.skeleton.bones;s.skeleton=o.skeleton.clone(),s.bindMatrix.copy(o.bindMatrix),s.skeleton.bones=a.map(function(l){return t.get(l)}),s.bind(s.skeleton,s.bindMatrix)}),i}function tv(n,e,t){t(n,e);for(let i=0;i<n.children.length;i++)tv(n.children[i],e.children[i],t)}class fL extends us{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new FC(t)}),this.register(function(t){return new BC(t)}),this.register(function(t){return new qC(t)}),this.register(function(t){return new KC(t)}),this.register(function(t){return new $C(t)}),this.register(function(t){return new VC(t)}),this.register(function(t){return new HC(t)}),this.register(function(t){return new zC(t)}),this.register(function(t){return new GC(t)}),this.register(function(t){return new OC(t)}),this.register(function(t){return new WC(t)}),this.register(function(t){return new kC(t)}),this.register(function(t){return new XC(t)}),this.register(function(t){return new jC(t)}),this.register(function(t){return new NC(t)}),this.register(function(t){return new fg(t,_t.EXT_MESHOPT_COMPRESSION)}),this.register(function(t){return new fg(t,_t.KHR_MESHOPT_COMPRESSION)}),this.register(function(t){return new YC(t)})}load(e,t,i,r){const s=this;let o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){const c=Wo.extractUrlBase(e);o=Wo.resolveURL(c,this.path)}else o=Wo.extractUrlBase(e);this.manager.itemStart(e);const a=function(c){r&&r(c),s.manager.itemError(e),s.manager.itemEnd(e)},l=new Ul(this.manager);l.setPath(this.path),l.setResponseType("arraybuffer"),l.setRequestHeader(this.requestHeader),l.setWithCredentials(this.withCredentials),l.load(e,function(c){try{s.parse(c,o,function(u){t(u),s.manager.itemEnd(e)},a)}catch(u){a(u)}},i,a)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,i,r){let s;const o={},a={},l=new TextDecoder;if(typeof e=="string")s=JSON.parse(e);else if(e instanceof ArrayBuffer)if(l.decode(new Uint8Array(e,0,4))===nv){try{o[_t.KHR_BINARY_GLTF]=new JC(e)}catch(h){r&&r(h);return}s=JSON.parse(o[_t.KHR_BINARY_GLTF].content)}else s=JSON.parse(l.decode(e));else s=e;if(s.asset===void 0||s.asset.version[0]<2){r&&r(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const c=new uP(s,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});c.fileLoader.setRequestHeader(this.requestHeader);for(let u=0;u<this.pluginCallbacks.length;u++){const h=this.pluginCallbacks[u](c);h.name,a[h.name]=h,o[h.name]=!0}if(s.extensionsUsed)for(let u=0;u<s.extensionsUsed.length;++u){const h=s.extensionsUsed[u],d=s.extensionsRequired||[];switch(h){case _t.KHR_MATERIALS_UNLIT:o[h]=new UC;break;case _t.KHR_DRACO_MESH_COMPRESSION:o[h]=new ZC(s,this.dracoLoader);break;case _t.KHR_TEXTURE_TRANSFORM:o[h]=new QC;break;case _t.KHR_MESH_QUANTIZATION:o[h]=new eP;break;default:d.indexOf(h)>=0&&a[h]}}c.setExtensions(o),c.setPlugins(a),c.parse(i,r)}parseAsync(e,t){const i=this;return new Promise(function(r,s){i.parse(e,t,r,s)})}}function DC(){let n={};return{get:function(e){return n[e]},add:function(e,t){n[e]=t},remove:function(e){delete n[e]},removeAll:function(){n={}}}}function qt(n,e,t){const i=n.json.materials[e];return i.extensions&&i.extensions[t]?i.extensions[t]:null}const _t={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",KHR_MESHOPT_COMPRESSION:"KHR_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class NC{constructor(e){this.parser=e,this.name=_t.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const e=this.parser,t=this.parser.json.nodes||[];for(let i=0,r=t.length;i<r;i++){const s=t[i];s.extensions&&s.extensions[this.name]&&s.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,s.extensions[this.name].light)}}_loadLight(e){const t=this.parser,i="light:"+e;let r=t.cache.get(i);if(r)return r;const s=t.json,l=((s.extensions&&s.extensions[this.name]||{}).lights||[])[e];let c;const u=new ft(16777215);l.color!==void 0&&u.setRGB(l.color[0],l.color[1],l.color[2],bn);const h=l.range!==void 0?l.range:0;switch(l.type){case"directional":c=new AT(u),c.target.position.set(0,0,-1),c.add(c.target);break;case"point":c=new ET(u),c.distance=h;break;case"spot":c=new MT(u),c.distance=h,l.spot=l.spot||{},l.spot.innerConeAngle=l.spot.innerConeAngle!==void 0?l.spot.innerConeAngle:0,l.spot.outerConeAngle=l.spot.outerConeAngle!==void 0?l.spot.outerConeAngle:Math.PI/4,c.angle=l.spot.outerConeAngle,c.penumbra=1-l.spot.innerConeAngle/l.spot.outerConeAngle,c.target.position.set(0,0,-1),c.add(c.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+l.type)}return c.position.set(0,0,0),Ei(c,l),l.intensity!==void 0&&(c.intensity=l.intensity),c.name=t.createUniqueName(l.name||"light_"+e),r=Promise.resolve(c),t.cache.add(i,r),r}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){const t=this,i=this.parser,s=i.json.nodes[e],a=(s.extensions&&s.extensions[this.name]||{}).light;return a===void 0?null:this._loadLight(a).then(function(l){return i._getNodeRef(t.cache,a,l)})}}class UC{constructor(){this.name=_t.KHR_MATERIALS_UNLIT}getMaterialType(){return ns}extendParams(e,t,i){const r=[];e.color=new ft(1,1,1),e.opacity=1;const s=t.pbrMetallicRoughness;if(s){if(Array.isArray(s.baseColorFactor)){const o=s.baseColorFactor;e.color.setRGB(o[0],o[1],o[2],bn),e.opacity=o[3]}s.baseColorTexture!==void 0&&r.push(i.assignTexture(e,"map",s.baseColorTexture,Yt))}return Promise.all(r)}}class OC{constructor(e){this.parser=e,this.name=_t.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){const i=qt(this.parser,e,this.name);return i===null||i.emissiveStrength!==void 0&&(t.emissiveIntensity=i.emissiveStrength),Promise.resolve()}}class FC{constructor(e){this.parser=e,this.name=_t.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){return qt(this.parser,e,this.name)!==null?Hi:null}extendMaterialParams(e,t){const i=qt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];if(i.clearcoatFactor!==void 0&&(t.clearcoat=i.clearcoatFactor),i.clearcoatTexture!==void 0&&r.push(this.parser.assignTexture(t,"clearcoatMap",i.clearcoatTexture)),i.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=i.clearcoatRoughnessFactor),i.clearcoatRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,"clearcoatRoughnessMap",i.clearcoatRoughnessTexture)),i.clearcoatNormalTexture!==void 0&&(r.push(this.parser.assignTexture(t,"clearcoatNormalMap",i.clearcoatNormalTexture)),i.clearcoatNormalTexture.scale!==void 0)){const s=i.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new St(s,s)}return Promise.all(r)}}class BC{constructor(e){this.parser=e,this.name=_t.KHR_MATERIALS_DISPERSION}getMaterialType(e){return qt(this.parser,e,this.name)!==null?Hi:null}extendMaterialParams(e,t){const i=qt(this.parser,e,this.name);return i===null||(t.dispersion=i.dispersion!==void 0?i.dispersion:0),Promise.resolve()}}class kC{constructor(e){this.parser=e,this.name=_t.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){return qt(this.parser,e,this.name)!==null?Hi:null}extendMaterialParams(e,t){const i=qt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];return i.iridescenceFactor!==void 0&&(t.iridescence=i.iridescenceFactor),i.iridescenceTexture!==void 0&&r.push(this.parser.assignTexture(t,"iridescenceMap",i.iridescenceTexture)),i.iridescenceIor!==void 0&&(t.iridescenceIOR=i.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),i.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=i.iridescenceThicknessMinimum),i.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=i.iridescenceThicknessMaximum),i.iridescenceThicknessTexture!==void 0&&r.push(this.parser.assignTexture(t,"iridescenceThicknessMap",i.iridescenceThicknessTexture)),Promise.all(r)}}class VC{constructor(e){this.parser=e,this.name=_t.KHR_MATERIALS_SHEEN}getMaterialType(e){return qt(this.parser,e,this.name)!==null?Hi:null}extendMaterialParams(e,t){const i=qt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];if(t.sheenColor=new ft(0,0,0),t.sheenRoughness=0,t.sheen=1,i.sheenColorFactor!==void 0){const s=i.sheenColorFactor;t.sheenColor.setRGB(s[0],s[1],s[2],bn)}return i.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=i.sheenRoughnessFactor),i.sheenColorTexture!==void 0&&r.push(this.parser.assignTexture(t,"sheenColorMap",i.sheenColorTexture,Yt)),i.sheenRoughnessTexture!==void 0&&r.push(this.parser.assignTexture(t,"sheenRoughnessMap",i.sheenRoughnessTexture)),Promise.all(r)}}class HC{constructor(e){this.parser=e,this.name=_t.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){return qt(this.parser,e,this.name)!==null?Hi:null}extendMaterialParams(e,t){const i=qt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];return i.transmissionFactor!==void 0&&(t.transmission=i.transmissionFactor),i.transmissionTexture!==void 0&&r.push(this.parser.assignTexture(t,"transmissionMap",i.transmissionTexture)),Promise.all(r)}}class zC{constructor(e){this.parser=e,this.name=_t.KHR_MATERIALS_VOLUME}getMaterialType(e){return qt(this.parser,e,this.name)!==null?Hi:null}extendMaterialParams(e,t){const i=qt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];t.thickness=i.thicknessFactor!==void 0?i.thicknessFactor:0,i.thicknessTexture!==void 0&&r.push(this.parser.assignTexture(t,"thicknessMap",i.thicknessTexture)),t.attenuationDistance=i.attenuationDistance||1/0;const s=i.attenuationColor||[1,1,1];return t.attenuationColor=new ft().setRGB(s[0],s[1],s[2],bn),Promise.all(r)}}class GC{constructor(e){this.parser=e,this.name=_t.KHR_MATERIALS_IOR}getMaterialType(e){return qt(this.parser,e,this.name)!==null?Hi:null}extendMaterialParams(e,t){const i=qt(this.parser,e,this.name);return i===null||(t.ior=i.ior!==void 0?i.ior:1.5),Promise.resolve()}}class WC{constructor(e){this.parser=e,this.name=_t.KHR_MATERIALS_SPECULAR}getMaterialType(e){return qt(this.parser,e,this.name)!==null?Hi:null}extendMaterialParams(e,t){const i=qt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];t.specularIntensity=i.specularFactor!==void 0?i.specularFactor:1,i.specularTexture!==void 0&&r.push(this.parser.assignTexture(t,"specularIntensityMap",i.specularTexture));const s=i.specularColorFactor||[1,1,1];return t.specularColor=new ft().setRGB(s[0],s[1],s[2],bn),i.specularColorTexture!==void 0&&r.push(this.parser.assignTexture(t,"specularColorMap",i.specularColorTexture,Yt)),Promise.all(r)}}class jC{constructor(e){this.parser=e,this.name=_t.EXT_MATERIALS_BUMP}getMaterialType(e){return qt(this.parser,e,this.name)!==null?Hi:null}extendMaterialParams(e,t){const i=qt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];return t.bumpScale=i.bumpFactor!==void 0?i.bumpFactor:1,i.bumpTexture!==void 0&&r.push(this.parser.assignTexture(t,"bumpMap",i.bumpTexture)),Promise.all(r)}}class XC{constructor(e){this.parser=e,this.name=_t.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){return qt(this.parser,e,this.name)!==null?Hi:null}extendMaterialParams(e,t){const i=qt(this.parser,e,this.name);if(i===null)return Promise.resolve();const r=[];return i.anisotropyStrength!==void 0&&(t.anisotropy=i.anisotropyStrength),i.anisotropyRotation!==void 0&&(t.anisotropyRotation=i.anisotropyRotation),i.anisotropyTexture!==void 0&&r.push(this.parser.assignTexture(t,"anisotropyMap",i.anisotropyTexture)),Promise.all(r)}}class qC{constructor(e){this.parser=e,this.name=_t.KHR_TEXTURE_BASISU}loadTexture(e){const t=this.parser,i=t.json,r=i.textures[e];if(!r.extensions||!r.extensions[this.name])return null;const s=r.extensions[this.name],o=t.options.ktx2Loader;if(!o){if(i.extensionsRequired&&i.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,s.source,o)}}class KC{constructor(e){this.parser=e,this.name=_t.EXT_TEXTURE_WEBP}loadTexture(e){const t=this.name,i=this.parser,r=i.json,s=r.textures[e];if(!s.extensions||!s.extensions[t])return null;const o=s.extensions[t],a=r.images[o.source];let l=i.textureLoader;if(a.uri){const c=i.options.manager.getHandler(a.uri);c!==null&&(l=c)}return i.loadTextureImage(e,o.source,l)}}class $C{constructor(e){this.parser=e,this.name=_t.EXT_TEXTURE_AVIF}loadTexture(e){const t=this.name,i=this.parser,r=i.json,s=r.textures[e];if(!s.extensions||!s.extensions[t])return null;const o=s.extensions[t],a=r.images[o.source];let l=i.textureLoader;if(a.uri){const c=i.options.manager.getHandler(a.uri);c!==null&&(l=c)}return i.loadTextureImage(e,o.source,l)}}class fg{constructor(e,t){this.name=t,this.parser=e}loadBufferView(e){const t=this.parser.json,i=t.bufferViews[e];if(i.extensions&&i.extensions[this.name]){const r=i.extensions[this.name],s=this.parser.getDependency("buffer",r.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return s.then(function(a){const l=r.byteOffset||0,c=r.byteLength||0,u=r.count,h=r.byteStride,d=new Uint8Array(a,l,c);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(u,h,d,r.mode,r.filter).then(function(g){return g.buffer}):o.ready.then(function(){const g=new ArrayBuffer(u*h);return o.decodeGltfBuffer(new Uint8Array(g),u,h,d,r.mode,r.filter),g})})}else return null}}class YC{constructor(e){this.name=_t.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){const t=this.parser.json,i=t.nodes[e];if(!i.extensions||!i.extensions[this.name]||i.mesh===void 0)return null;const r=t.meshes[i.mesh];for(const c of r.primitives)if(c.mode!==Yn.TRIANGLES&&c.mode!==Yn.TRIANGLE_STRIP&&c.mode!==Yn.TRIANGLE_FAN&&c.mode!==void 0)return null;const o=i.extensions[this.name].attributes,a=[],l={};for(const c in o)a.push(this.parser.getDependency("accessor",o[c]).then(u=>(l[c]=u,l[c])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(c=>{const u=c.pop(),h=u.isGroup?u.children:[u],d=c[0].count,g=[];for(const p of h){const x=new mt,m=new ee,_=new mr,M=new ee(1,1,1),T=new XE(p.geometry,p.material,d);for(let b=0;b<d;b++)l.TRANSLATION&&m.fromBufferAttribute(l.TRANSLATION,b),l.ROTATION&&_.fromBufferAttribute(l.ROTATION,b),l.SCALE&&M.fromBufferAttribute(l.SCALE,b),T.setMatrixAt(b,x.compose(m,_,M));for(const b in l)if(b==="_COLOR_0"){const I=l[b];T.instanceColor=new Jf(I.array,I.itemSize,I.normalized)}else b!=="TRANSLATION"&&b!=="ROTATION"&&b!=="SCALE"&&p.geometry.setAttribute(b,l[b]);Gt.prototype.copy.call(T,p),this.parser.assignFinalMaterial(T),g.push(T)}return u.isGroup?(u.clear(),u.add(...g),u):g[0]}))}}const nv="glTF",Lo=12,hg={JSON:1313821514,BIN:5130562};class JC{constructor(e){this.name=_t.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(e,0,Lo),i=new TextDecoder;if(this.header={magic:i.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==nv)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const r=this.header.length-Lo,s=new DataView(e,Lo);let o=0;for(;o<r;){const a=s.getUint32(o,!0);o+=4;const l=s.getUint32(o,!0);if(o+=4,l===hg.JSON){const c=new Uint8Array(e,Lo+o,a);this.content=i.decode(c)}else if(l===hg.BIN){const c=Lo+o;this.body=e.slice(c,c+a)}o+=a}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class ZC{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=_t.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){const i=this.json,r=this.dracoLoader,s=e.extensions[this.name].bufferView,o=e.extensions[this.name].attributes,a={},l={},c={};for(const u in o){const h=th[u]||u.toLowerCase();a[h]=o[u]}for(const u in e.attributes){const h=th[u]||u.toLowerCase();if(o[u]!==void 0){const d=i.accessors[e.attributes[u]],g=Vs[d.componentType];c[h]=g.name,l[h]=d.normalized===!0}}return t.getDependency("bufferView",s).then(function(u){return new Promise(function(h,d){r.decodeDracoFile(u,function(g){for(const p in g.attributes){const x=g.attributes[p],m=l[p];m!==void 0&&(x.normalized=m)}h(g)},a,c,bn,d)})})}}class QC{constructor(){this.name=_t.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}}class eP{constructor(){this.name=_t.KHR_MESH_QUANTIZATION}}class iv extends so{constructor(e,t,i,r){super(e,t,i,r)}copySampleValue_(e){const t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=e*r*3+r;for(let o=0;o!==r;o++)t[o]=i[s+o];return t}interpolate_(e,t,i,r){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=a*2,c=a*3,u=r-t,h=(i-t)/u,d=h*h,g=d*h,p=e*c,x=p-c,m=-2*g+3*d,_=g-d,M=1-m,T=_-d+h;for(let b=0;b!==a;b++){const I=o[x+b+a],D=o[x+b+l]*u,B=o[p+b+a],E=o[p+b]*u;s[b]=M*I+T*D+m*B+_*E}return s}}const tP=new mr;class nP extends iv{interpolate_(e,t,i,r){const s=super.interpolate_(e,t,i,r);return tP.fromArray(s).normalize().toArray(s),s}}const Yn={POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6},Vs={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},dg={9728:nn,9729:jt,9984:S0,9985:dl,9986:No,9987:rr},pg={33071:Li,33648:Cl,10497:$s},Bu={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},th={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Rr={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},iP={CUBICSPLINE:void 0,LINEAR:ea,STEP:Qo},ku={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function rP(n){return n.DefaultMaterial===void 0&&(n.DefaultMaterial=new qh({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:fr})),n.DefaultMaterial}function qr(n,e,t){for(const i in t.extensions)n[i]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[i]=t.extensions[i])}function Ei(n,e){e.extras!==void 0&&typeof e.extras=="object"&&Object.assign(n.userData,e.extras)}function sP(n,e,t){let i=!1,r=!1,s=!1;for(let c=0,u=e.length;c<u;c++){const h=e[c];if(h.POSITION!==void 0&&(i=!0),h.NORMAL!==void 0&&(r=!0),h.COLOR_0!==void 0&&(s=!0),i&&r&&s)break}if(!i&&!r&&!s)return Promise.resolve(n);const o=[],a=[],l=[];for(let c=0,u=e.length;c<u;c++){const h=e[c];if(i){const d=h.POSITION!==void 0?t.getDependency("accessor",h.POSITION):n.attributes.position;o.push(d)}if(r){const d=h.NORMAL!==void 0?t.getDependency("accessor",h.NORMAL):n.attributes.normal;a.push(d)}if(s){const d=h.COLOR_0!==void 0?t.getDependency("accessor",h.COLOR_0):n.attributes.color;l.push(d)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(l)]).then(function(c){const u=c[0],h=c[1],d=c[2];return i&&(n.morphAttributes.position=u),r&&(n.morphAttributes.normal=h),s&&(n.morphAttributes.color=d),n.morphTargetsRelative=!0,n})}function oP(n,e){if(n.updateMorphTargets(),e.weights!==void 0)for(let t=0,i=e.weights.length;t<i;t++)n.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){const t=e.extras.targetNames;if(n.morphTargetInfluences.length===t.length){n.morphTargetDictionary={};for(let i=0,r=t.length;i<r;i++)n.morphTargetDictionary[t[i]]=i}}}function aP(n){let e;const t=n.extensions&&n.extensions[_t.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+Vu(t.attributes):e=n.indices+":"+Vu(n.attributes)+":"+n.mode,n.targets!==void 0)for(let i=0,r=n.targets.length;i<r;i++)e+=":"+Vu(n.targets[i]);return e}function Vu(n){let e="";const t=Object.keys(n).sort();for(let i=0,r=t.length;i<r;i++)e+=t[i]+":"+n[t[i]]+";";return e}function nh(n){switch(n){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function lP(n){return n.search(/\.jpe?g($|\?)/i)>0||n.search(/^data\:image\/jpeg/)===0?"image/jpeg":n.search(/\.webp($|\?)/i)>0||n.search(/^data\:image\/webp/)===0?"image/webp":n.search(/\.ktx2($|\?)/i)>0||n.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}const cP=new mt;class uP{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new DC,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let i=!1,r=-1,s=!1,o=-1;if(typeof navigator<"u"&&typeof navigator.userAgent<"u"){const a=navigator.userAgent;i=/^((?!chrome|android).)*safari/i.test(a)===!0;const l=a.match(/Version\/(\d+)/);r=i&&l?parseInt(l[1],10):-1,s=a.indexOf("Firefox")>-1,o=s?a.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||i&&r<17||s&&o<98?this.textureLoader=new yT(this.options.manager):this.textureLoader=new wT(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new Ul(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){const i=this,r=this.json,s=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([i.getDependencies("scene"),i.getDependencies("animation"),i.getDependencies("camera")])}).then(function(o){const a={scene:o[0][r.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:r.asset,parser:i,userData:{}};return qr(s,a,r),Ei(a,r),Promise.all(i._invokeAll(function(l){return l.afterRoot&&l.afterRoot(a)})).then(function(){for(const l of a.scenes)l.updateMatrixWorld();e(a)})}).catch(t)}_markDefs(){const e=this.json.nodes||[],t=this.json.skins||[],i=this.json.meshes||[];for(let r=0,s=t.length;r<s;r++){const o=t[r].joints;for(let a=0,l=o.length;a<l;a++)e[o[a]].isBone=!0}for(let r=0,s=e.length;r<s;r++){const o=e[r];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(i[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,i){if(e.refs[t]<=1)return i;const r=i.clone(),s=(o,a)=>{const l=this.associations.get(o);l!=null&&this.associations.set(a,l);for(const[c,u]of o.children.entries())s(u,a.children[c])};return s(i,r),r.name+="_instance_"+e.uses[t]++,r}_invokeOne(e){const t=Object.values(this.plugins);t.push(this);for(let i=0;i<t.length;i++){const r=e(t[i]);if(r)return r}return null}_invokeAll(e){const t=Object.values(this.plugins);t.unshift(this);const i=[];for(let r=0;r<t.length;r++){const s=e(t[r]);s&&i.push(s)}return i}getDependency(e,t){const i=e+":"+t;let r=this.cache.get(i);if(!r){switch(e){case"scene":r=this.loadScene(t);break;case"node":r=this._invokeOne(function(s){return s.loadNode&&s.loadNode(t)});break;case"mesh":r=this._invokeOne(function(s){return s.loadMesh&&s.loadMesh(t)});break;case"accessor":r=this.loadAccessor(t);break;case"bufferView":r=this._invokeOne(function(s){return s.loadBufferView&&s.loadBufferView(t)});break;case"buffer":r=this.loadBuffer(t);break;case"material":r=this._invokeOne(function(s){return s.loadMaterial&&s.loadMaterial(t)});break;case"texture":r=this._invokeOne(function(s){return s.loadTexture&&s.loadTexture(t)});break;case"skin":r=this.loadSkin(t);break;case"animation":r=this._invokeOne(function(s){return s.loadAnimation&&s.loadAnimation(t)});break;case"camera":r=this.loadCamera(t);break;default:if(r=this._invokeOne(function(s){return s!=this&&s.getDependency&&s.getDependency(e,t)}),!r)throw new Error("Unknown type: "+e);break}this.cache.add(i,r)}return r}getDependencies(e){let t=this.cache.get(e);if(!t){const i=this,r=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(r.map(function(s,o){return i.getDependency(e,o)})),this.cache.add(e,t)}return t}loadBuffer(e){const t=this.json.buffers[e],i=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[_t.KHR_BINARY_GLTF].body);const r=this.options;return new Promise(function(s,o){i.load(Wo.resolveURL(t.uri,r.path),s,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){const t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(i){const r=t.byteLength||0,s=t.byteOffset||0;return i.slice(s,s+r)})}loadAccessor(e){const t=this,i=this.json,r=this.json.accessors[e];if(r.bufferView===void 0&&r.sparse===void 0){const o=Bu[r.type],a=Vs[r.componentType],l=r.normalized===!0,c=new a(r.count*o);return Promise.resolve(new hn(c,o,l))}const s=[];return r.bufferView!==void 0?s.push(this.getDependency("bufferView",r.bufferView)):s.push(null),r.sparse!==void 0&&(s.push(this.getDependency("bufferView",r.sparse.indices.bufferView)),s.push(this.getDependency("bufferView",r.sparse.values.bufferView))),Promise.all(s).then(function(o){const a=o[0],l=Bu[r.type],c=Vs[r.componentType],u=c.BYTES_PER_ELEMENT,h=u*l,d=r.byteOffset||0,g=r.bufferView!==void 0?i.bufferViews[r.bufferView].byteStride:void 0,p=r.normalized===!0;let x,m;if(g&&g!==h){const _=Math.floor(d/g),M="InterleavedBuffer:"+r.bufferView+":"+r.componentType+":"+_+":"+r.count;let T=t.cache.get(M);T||(x=new c(a,_*g,r.count*g/u),T=new O0(x,g/u),t.cache.add(M,T)),m=new tc(T,l,d%g/u,p)}else a===null?x=new c(r.count*l):x=new c(a,d,r.count*l),m=new hn(x,l,p);if(r.sparse!==void 0){const _=Bu.SCALAR,M=Vs[r.sparse.indices.componentType],T=r.sparse.indices.byteOffset||0,b=r.sparse.values.byteOffset||0,I=new M(o[1],T,r.sparse.count*_),D=new c(o[2],b,r.sparse.count*l);a!==null&&(m=new hn(m.array.slice(),m.itemSize,m.normalized)),m.normalized=!1;for(let B=0,E=I.length;B<E;B++){const w=I[B];if(m.setX(w,D[B*l]),l>=2&&m.setY(w,D[B*l+1]),l>=3&&m.setZ(w,D[B*l+2]),l>=4&&m.setW(w,D[B*l+3]),l>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}m.normalized=p}return m})}loadTexture(e){const t=this.json,i=this.options,s=t.textures[e].source,o=t.images[s];let a=this.textureLoader;if(o.uri){const l=i.manager.getHandler(o.uri);l!==null&&(a=l)}return this.loadTextureImage(e,s,a)}loadTextureImage(e,t,i){const r=this,s=this.json,o=s.textures[e],a=s.images[t],l=(a.uri||a.bufferView)+":"+o.sampler;if(this.textureCache[l])return this.textureCache[l];const c=this.loadImageSource(t,i).then(function(u){u.flipY=!1,u.name=o.name||a.name||"",u.name===""&&typeof a.uri=="string"&&a.uri.startsWith("data:image/")===!1&&(u.name=a.uri);const d=(s.samplers||{})[o.sampler]||{};return u.magFilter=dg[d.magFilter]||jt,u.minFilter=dg[d.minFilter]||rr,u.wrapS=pg[d.wrapS]||$s,u.wrapT=pg[d.wrapT]||$s,u.generateMipmaps=!u.isCompressedTexture&&u.minFilter!==nn&&u.minFilter!==jt,r.associations.set(u,{textures:e}),u}).catch(function(){return null});return this.textureCache[l]=c,c}loadImageSource(e,t){const i=this,r=this.json,s=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(h=>h.clone());const o=r.images[e],a=self.URL||self.webkitURL;let l=o.uri||"",c=!1;if(o.bufferView!==void 0)l=i.getDependency("bufferView",o.bufferView).then(function(h){c=!0;const d=new Blob([h],{type:o.mimeType});return l=a.createObjectURL(d),l});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");const u=Promise.resolve(l).then(function(h){return new Promise(function(d,g){let p=d;t.isImageBitmapLoader===!0&&(p=function(x){const m=new Jt(x);m.needsUpdate=!0,d(m)}),t.load(Wo.resolveURL(h,s.path),p,void 0,g)})}).then(function(h){return c===!0&&a.revokeObjectURL(l),Ei(h,o),h.userData.mimeType=o.mimeType||lP(o.uri),h}).catch(function(h){throw h});return this.sourceCache[e]=u,u}assignTexture(e,t,i,r){const s=this;return this.getDependency("texture",i.index).then(function(o){if(!o)return null;if(i.texCoord!==void 0&&i.texCoord>0&&(o=o.clone(),o.channel=i.texCoord),s.extensions[_t.KHR_TEXTURE_TRANSFORM]){const a=i.extensions!==void 0?i.extensions[_t.KHR_TEXTURE_TRANSFORM]:void 0;if(a){const l=s.associations.get(o);o=s.extensions[_t.KHR_TEXTURE_TRANSFORM].extendTexture(o,a),s.associations.set(o,l)}}return r!==void 0&&(o.colorSpace=r),e[t]=o,o})}assignFinalMaterial(e){const t=e.geometry;let i=e.material;const r=t.attributes.tangent===void 0,s=t.attributes.color!==void 0,o=t.attributes.normal===void 0;if(e.isPoints){const a="PointsMaterial:"+i.uuid;let l=this.cache.get(a);l||(l=new k0,Oi.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,l.sizeAttenuation=!1,this.cache.add(a,l)),i=l}else if(e.isLine){const a="LineBasicMaterial:"+i.uuid;let l=this.cache.get(a);l||(l=new B0,Oi.prototype.copy.call(l,i),l.color.copy(i.color),l.map=i.map,this.cache.add(a,l)),i=l}if(r||s||o){let a="ClonedMaterial:"+i.uuid+":";r&&(a+="derivative-tangents:"),s&&(a+="vertex-colors:"),o&&(a+="flat-shading:");let l=this.cache.get(a);l||(l=i.clone(),s&&(l.vertexColors=!0),o&&(l.flatShading=!0),r&&(l.normalScale&&(l.normalScale.y*=-1),l.clearcoatNormalScale&&(l.clearcoatNormalScale.y*=-1)),this.cache.add(a,l),this.associations.set(l,this.associations.get(i))),i=l}e.material=i}getMaterialType(){return qh}loadMaterial(e){const t=this,i=this.json,r=this.extensions,s=i.materials[e];let o;const a={},l=s.extensions||{},c=[];if(l[_t.KHR_MATERIALS_UNLIT]){const h=r[_t.KHR_MATERIALS_UNLIT];o=h.getMaterialType(),c.push(h.extendParams(a,s,t))}else{const h=s.pbrMetallicRoughness||{};if(a.color=new ft(1,1,1),a.opacity=1,Array.isArray(h.baseColorFactor)){const d=h.baseColorFactor;a.color.setRGB(d[0],d[1],d[2],bn),a.opacity=d[3]}h.baseColorTexture!==void 0&&c.push(t.assignTexture(a,"map",h.baseColorTexture,Yt)),a.metalness=h.metallicFactor!==void 0?h.metallicFactor:1,a.roughness=h.roughnessFactor!==void 0?h.roughnessFactor:1,h.metallicRoughnessTexture!==void 0&&(c.push(t.assignTexture(a,"metalnessMap",h.metallicRoughnessTexture)),c.push(t.assignTexture(a,"roughnessMap",h.metallicRoughnessTexture))),o=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(e)}),c.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(e,a)})))}s.doubleSided===!0&&(a.side=Pi);const u=s.alphaMode||ku.OPAQUE;if(u===ku.BLEND?(a.transparent=!0,a.depthWrite=!1):(a.transparent=!1,u===ku.MASK&&(a.alphaTest=s.alphaCutoff!==void 0?s.alphaCutoff:.5)),s.normalTexture!==void 0&&o!==ns&&(c.push(t.assignTexture(a,"normalMap",s.normalTexture)),a.normalScale=new St(1,1),s.normalTexture.scale!==void 0)){const h=s.normalTexture.scale;a.normalScale.set(h,h)}if(s.occlusionTexture!==void 0&&o!==ns&&(c.push(t.assignTexture(a,"aoMap",s.occlusionTexture)),s.occlusionTexture.strength!==void 0&&(a.aoMapIntensity=s.occlusionTexture.strength)),s.emissiveFactor!==void 0&&o!==ns){const h=s.emissiveFactor;a.emissive=new ft().setRGB(h[0],h[1],h[2],bn)}return s.emissiveTexture!==void 0&&o!==ns&&c.push(t.assignTexture(a,"emissiveMap",s.emissiveTexture,Yt)),Promise.all(c).then(function(){const h=new o(a);return s.name&&(h.name=s.name),Ei(h,s),t.associations.set(h,{materials:e}),s.extensions&&qr(r,h,s),h})}createUniqueName(e){const t=Nt.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){const t=this,i=this.extensions,r=this.primitiveCache;function s(a){return i[_t.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a,t).then(function(l){return mg(l,a,t)})}const o=[];for(let a=0,l=e.length;a<l;a++){const c=e[a],u=aP(c),h=r[u];if(h)o.push(h.promise);else{let d;c.extensions&&c.extensions[_t.KHR_DRACO_MESH_COMPRESSION]?d=s(c):d=mg(new dn,c,t),r[u]={primitive:c,promise:d},o.push(d)}}return Promise.all(o)}loadMesh(e){const t=this,i=this.json,r=this.extensions,s=i.meshes[e],o=s.primitives,a=[];for(let l=0,c=o.length;l<c;l++){const u=o[l].material===void 0?rP(this.cache):this.getDependency("material",o[l].material);a.push(u)}return a.push(t.loadGeometries(o)),Promise.all(a).then(function(l){const c=l.slice(0,l.length-1),u=l[l.length-1],h=[];for(let g=0,p=u.length;g<p;g++){const x=u[g],m=o[g];let _;const M=c[g];if(m.mode===Yn.TRIANGLES||m.mode===Yn.TRIANGLE_STRIP||m.mode===Yn.TRIANGLE_FAN||m.mode===void 0)_=s.isSkinnedMesh===!0?new GE(x,M):new Wn(x,M),_.isSkinnedMesh===!0&&_.normalizeSkinWeights(),m.mode===Yn.TRIANGLE_STRIP?_.geometry=ug(_.geometry,R0):m.mode===Yn.TRIANGLE_FAN&&(_.geometry=ug(_.geometry,$f));else if(m.mode===Yn.LINES)_=new YE(x,M);else if(m.mode===Yn.LINE_STRIP)_=new jh(x,M);else if(m.mode===Yn.LINE_LOOP)_=new JE(x,M);else if(m.mode===Yn.POINTS)_=new ZE(x,M);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+m.mode);Object.keys(_.geometry.morphAttributes).length>0&&oP(_,s),_.name=t.createUniqueName(s.name||"mesh_"+e),Ei(_,s),m.extensions&&qr(r,_,m),t.assignFinalMaterial(_),h.push(_)}for(let g=0,p=h.length;g<p;g++)t.associations.set(h[g],{meshes:e,primitives:g});if(h.length===1)return s.extensions&&qr(r,h[0],s),h[0];const d=new ts;s.extensions&&qr(r,d,s),t.associations.set(d,{meshes:e});for(let g=0,p=h.length;g<p;g++)d.add(h[g]);return d})}loadCamera(e){let t;const i=this.json.cameras[e],r=i[i.type];if(r)return i.type==="perspective"?t=new Dn(bE.radToDeg(r.yfov),r.aspectRatio||1,r.znear||1,r.zfar||2e6):i.type==="orthographic"&&(t=new sc(-r.xmag,r.xmag,r.ymag,-r.ymag,r.znear,r.zfar)),i.name&&(t.name=this.createUniqueName(i.name)),Ei(t,i),Promise.resolve(t)}loadSkin(e){const t=this.json.skins[e],i=[];for(let r=0,s=t.joints.length;r<s;r++)i.push(this._loadNodeShallow(t.joints[r]));return t.inverseBindMatrices!==void 0?i.push(this.getDependency("accessor",t.inverseBindMatrices)):i.push(null),Promise.all(i).then(function(r){const s=r.pop(),o=r,a=[],l=[];for(let c=0,u=o.length;c<u;c++){const h=o[c];if(h){a.push(h);const d=new mt;s!==null&&d.fromArray(s.array,c*16),l.push(d)}}return new Gh(a,l)})}loadAnimation(e){const t=this.json,i=this,r=t.animations[e],s=r.name?r.name:"animation_"+e,o=[],a=[],l=[],c=[],u=[];for(let h=0,d=r.channels.length;h<d;h++){const g=r.channels[h],p=r.samplers[g.sampler],x=g.target,m=x.node,_=r.parameters!==void 0?r.parameters[p.input]:p.input,M=r.parameters!==void 0?r.parameters[p.output]:p.output;x.node!==void 0&&(o.push(this.getDependency("node",m)),a.push(this.getDependency("accessor",_)),l.push(this.getDependency("accessor",M)),c.push(p),u.push(x))}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(l),Promise.all(c),Promise.all(u)]).then(function(h){const d=h[0],g=h[1],p=h[2],x=h[3],m=h[4],_=[];for(let T=0,b=d.length;T<b;T++){const I=d[T],D=g[T],B=p[T],E=x[T],w=m[T];if(I===void 0)continue;I.updateMatrix&&I.updateMatrix();const L=i._createAnimationTracks(I,D,B,E,w);if(L)for(let R=0;R<L.length;R++)_.push(L[R])}const M=new dT(s,void 0,_);return Ei(M,r),M})}createNodeMesh(e){const t=this.json,i=this,r=t.nodes[e];return r.mesh===void 0?null:i.getDependency("mesh",r.mesh).then(function(s){const o=i._getNodeRef(i.meshCache,r.mesh,s);return r.weights!==void 0&&o.traverse(function(a){if(a.isMesh)for(let l=0,c=r.weights.length;l<c;l++)a.morphTargetInfluences[l]=r.weights[l]}),o})}loadNode(e){const t=this.json,i=this,r=t.nodes[e],s=i._loadNodeShallow(e),o=[],a=r.children||[];for(let c=0,u=a.length;c<u;c++)o.push(i.getDependency("node",a[c]));const l=r.skin===void 0?Promise.resolve(null):i.getDependency("skin",r.skin);return Promise.all([s,Promise.all(o),l]).then(function(c){const u=c[0],h=c[1],d=c[2];d!==null&&u.traverse(function(g){g.isSkinnedMesh&&g.bind(d,cP)});for(let g=0,p=h.length;g<p;g++)u.add(h[g]);if(u.userData.pivot!==void 0&&h.length>0){const g=u.userData.pivot,p=h[0];u.pivot=new ee().fromArray(g),u.position.x-=g[0],u.position.y-=g[1],u.position.z-=g[2],p.position.set(0,0,0),delete u.userData.pivot}return u})}_loadNodeShallow(e){const t=this.json,i=this.extensions,r=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];const s=t.nodes[e],o=s.name?r.createUniqueName(s.name):"",a=[],l=r._invokeOne(function(c){return c.createNodeMesh&&c.createNodeMesh(e)});return l&&a.push(l),s.camera!==void 0&&a.push(r.getDependency("camera",s.camera).then(function(c){return r._getNodeRef(r.cameraCache,s.camera,c)})),r._invokeAll(function(c){return c.createNodeAttachment&&c.createNodeAttachment(e)}).forEach(function(c){a.push(c)}),this.nodeCache[e]=Promise.all(a).then(function(c){let u;if(s.isBone===!0?u=new F0:c.length>1?u=new ts:c.length===1?u=c[0]:u=new Gt,u!==c[0])for(let h=0,d=c.length;h<d;h++)u.add(c[h]);if(s.name&&(u.userData.name=s.name,u.name=o),Ei(u,s),s.extensions&&qr(i,u,s),s.matrix!==void 0){const h=new mt;h.fromArray(s.matrix),u.applyMatrix4(h)}else s.translation!==void 0&&u.position.fromArray(s.translation),s.rotation!==void 0&&u.quaternion.fromArray(s.rotation),s.scale!==void 0&&u.scale.fromArray(s.scale);if(!r.associations.has(u))r.associations.set(u,{});else if(s.mesh!==void 0&&r.meshCache.refs[s.mesh]>1){const h=r.associations.get(u);r.associations.set(u,{...h})}return r.associations.get(u).nodes=e,u}),this.nodeCache[e]}loadScene(e){const t=this.extensions,i=this.json.scenes[e],r=this,s=new ts;i.name&&(s.name=r.createUniqueName(i.name)),Ei(s,i),i.extensions&&qr(t,s,i);const o=i.nodes||[],a=[];for(let l=0,c=o.length;l<c;l++)a.push(r.getDependency("node",o[l]));return Promise.all(a).then(function(l){for(let u=0,h=l.length;u<h;u++){const d=l[u];d.parent!==null?s.add(IC(d)):s.add(d)}const c=u=>{const h=new Map;for(const[d,g]of r.associations)(d instanceof Oi||d instanceof Jt)&&h.set(d,g);return u.traverse(d=>{const g=r.associations.get(d);g!=null&&h.set(d,g)}),h};return r.associations=c(s),s})}_createAnimationTracks(e,t,i,r,s){const o=[],a=e.name?e.name:e.uuid,l=[];Rr[s.path]===Rr.weights?e.traverse(function(d){d.morphTargetInfluences&&l.push(d.name?d.name:d.uuid)}):l.push(a);let c;switch(Rr[s.path]){case Rr.weights:c=Qs;break;case Rr.rotation:c=eo;break;case Rr.translation:case Rr.scale:c=to;break;default:switch(i.itemSize){case 1:c=Qs;break;case 2:case 3:default:c=to;break}break}const u=r.interpolation!==void 0?iP[r.interpolation]:ea,h=this._getArrayFromAccessor(i);for(let d=0,g=l.length;d<g;d++){const p=new c(l[d]+"."+Rr[s.path],t.array,h,u);r.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(p),o.push(p)}return o}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){const i=nh(t.constructor),r=new Float32Array(t.length);for(let s=0,o=t.length;s<o;s++)r[s]=t[s]*i;t=r}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(i){const r=this instanceof eo?nP:iv;return new r(this.times,this.values,this.getValueSize()/3,i)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}}function fP(n,e,t){const i=e.attributes,r=new gr;if(i.POSITION!==void 0){const a=t.json.accessors[i.POSITION],l=a.min,c=a.max;if(l!==void 0&&c!==void 0){if(r.set(new ee(l[0],l[1],l[2]),new ee(c[0],c[1],c[2])),a.normalized){const u=nh(Vs[a.componentType]);r.min.multiplyScalar(u),r.max.multiplyScalar(u)}}else return}else return;const s=e.targets;if(s!==void 0){const a=new ee,l=new ee;for(let c=0,u=s.length;c<u;c++){const h=s[c];if(h.POSITION!==void 0){const d=t.json.accessors[h.POSITION],g=d.min,p=d.max;if(g!==void 0&&p!==void 0){if(l.setX(Math.max(Math.abs(g[0]),Math.abs(p[0]))),l.setY(Math.max(Math.abs(g[1]),Math.abs(p[1]))),l.setZ(Math.max(Math.abs(g[2]),Math.abs(p[2]))),d.normalized){const x=nh(Vs[d.componentType]);l.multiplyScalar(x)}a.max(l)}}}r.expandByVector(a)}n.boundingBox=r;const o=new Vi;r.getCenter(o.center),o.radius=r.min.distanceTo(r.max)/2,n.boundingSphere=o}function mg(n,e,t){const i=e.attributes,r=[];function s(o,a){return t.getDependency("accessor",o).then(function(l){n.setAttribute(a,l)})}for(const o in i){const a=th[o]||o.toLowerCase();a in n.attributes||r.push(s(i[o],a))}if(e.indices!==void 0&&!n.index){const o=t.getDependency("accessor",e.indices).then(function(a){n.setIndex(a)});r.push(o)}return yt.workingColorSpace!==bn&&"COLOR_0"in i,Ei(n,e),fP(n,e,t),Promise.all(r).then(function(){return e.targets!==void 0?sP(n,e.targets,t):n})}const Hu=new WeakMap;class hL extends us{constructor(e){super(e),this.decoderPath="",this.decoderConfig={},this.decoderBinary=null,this.decoderPending=null,this.workerLimit=4,this.workerPool=[],this.workerNextTaskID=1,this.workerSourceURL="",this.defaultAttributeIDs={position:"POSITION",normal:"NORMAL",color:"COLOR",uv:"TEX_COORD"},this.defaultAttributeTypes={position:"Float32Array",normal:"Float32Array",color:"Float32Array",uv:"Float32Array"}}setDecoderPath(e){return this.decoderPath=e,this}setDecoderConfig(e){return this.decoderConfig=e,this}setWorkerLimit(e){return this.workerLimit=e,this}load(e,t,i,r){const s=new Ul(this.manager);s.setPath(this.path),s.setResponseType("arraybuffer"),s.setRequestHeader(this.requestHeader),s.setWithCredentials(this.withCredentials),s.load(e,o=>{this.parse(o,t,r)},i,r)}parse(e,t,i=()=>{}){this.decodeDracoFile(e,t,null,null,Yt,i).catch(i)}decodeDracoFile(e,t,i,r,s=bn,o=()=>{}){const a={attributeIDs:i||this.defaultAttributeIDs,attributeTypes:r||this.defaultAttributeTypes,useUniqueIDs:!!i,vertexColorSpace:s};return this.decodeGeometry(e,a).then(t).catch(o)}decodeGeometry(e,t){const i=JSON.stringify(t);if(Hu.has(e)){const l=Hu.get(e);if(l.key===i)return l.promise;if(e.byteLength===0)throw new Error("THREE.DRACOLoader: Unable to re-decode a buffer with different settings. Buffer has already been transferred.")}let r;const s=this.workerNextTaskID++,o=e.byteLength,a=this._getWorker(s,o).then(l=>(r=l,new Promise((c,u)=>{r._callbacks[s]={resolve:c,reject:u},r.postMessage({type:"decode",id:s,taskConfig:t,buffer:e},[e])}))).then(l=>this._createGeometry(l.geometry));return a.catch(()=>!0).then(()=>{r&&s&&this._releaseTask(r,s)}),Hu.set(e,{key:i,promise:a}),a}_createGeometry(e){const t=new dn;e.index&&t.setIndex(new hn(e.index.array,1));for(let i=0;i<e.attributes.length;i++){const{name:r,array:s,itemSize:o,stride:a,vertexColorSpace:l}=e.attributes[i];let c;if(o===a)c=new hn(s,o);else{const u=new O0(s,a);c=new tc(u,o,0)}r==="color"&&(this._assignVertexColorSpace(c,l),c.normalized=!(s instanceof Float32Array)),t.setAttribute(r,c)}return t}_assignVertexColorSpace(e,t){if(t!==Yt)return;const i=new ft;for(let r=0,s=e.count;r<s;r++)i.fromBufferAttribute(e,r),yt.colorSpaceToWorking(i,Yt),e.setXYZ(r,i.r,i.g,i.b)}_loadLibrary(e,t){const i=new Ul(this.manager);return i.setPath(this.decoderPath),i.setResponseType(t),i.setWithCredentials(this.withCredentials),new Promise((r,s)=>{i.load(e,r,void 0,s)})}preload(){return this._initDecoder(),this}_initDecoder(){if(this.decoderPending)return this.decoderPending;const e=typeof WebAssembly!="object"||this.decoderConfig.type==="js",t=[];return e?t.push(this._loadLibrary("draco_decoder.js","text")):(t.push(this._loadLibrary("draco_wasm_wrapper.js","text")),t.push(this._loadLibrary("draco_decoder.wasm","arraybuffer"))),this.decoderPending=Promise.all(t).then(i=>{const r=i[0];e||(this.decoderConfig.wasmBinary=i[1]);const s=hP.toString(),o=["/* draco decoder */",r,"","/* worker */",s.substring(s.indexOf("{")+1,s.lastIndexOf("}"))].join(`
`);this.workerSourceURL=URL.createObjectURL(new Blob([o]))}),this.decoderPending}_getWorker(e,t){return this._initDecoder().then(()=>{if(this.workerPool.length<this.workerLimit){const r=new Worker(this.workerSourceURL);r._callbacks={},r._taskCosts={},r._taskLoad=0,r.postMessage({type:"init",decoderConfig:this.decoderConfig}),r.onmessage=function(s){const o=s.data;switch(o.type){case"decode":r._callbacks[o.id].resolve(o);break;case"error":r._callbacks[o.id].reject(o);break;default:}},this.workerPool.push(r)}else this.workerPool.sort(function(r,s){return r._taskLoad>s._taskLoad?-1:1});const i=this.workerPool[this.workerPool.length-1];return i._taskCosts[e]=t,i._taskLoad+=t,i})}_releaseTask(e,t){e._taskLoad-=e._taskCosts[t],delete e._callbacks[t],delete e._taskCosts[t]}debug(){}dispose(){for(let e=0;e<this.workerPool.length;++e)this.workerPool[e].terminate();return this.workerPool.length=0,this.workerSourceURL!==""&&URL.revokeObjectURL(this.workerSourceURL),this}}function hP(){let n,e;onmessage=function(o){const a=o.data;switch(a.type){case"init":n=a.decoderConfig,e=new Promise(function(u){n.onModuleLoaded=function(h){u({draco:h})},DracoDecoderModule(n)});break;case"decode":const l=a.buffer,c=a.taskConfig;e.then(u=>{const h=u.draco,d=new h.Decoder;try{const g=t(h,d,new Int8Array(l),c),p=g.attributes.map(x=>x.array.buffer);g.index&&p.push(g.index.array.buffer),self.postMessage({type:"decode",id:a.id,geometry:g},p)}catch(g){self.postMessage({type:"error",id:a.id,error:g.message})}finally{h.destroy(d)}});break}};function t(o,a,l,c){const u=c.attributeIDs,h=c.attributeTypes;let d,g;const p=a.GetEncodedGeometryType(l);if(p===o.TRIANGULAR_MESH)d=new o.Mesh,g=a.DecodeArrayToMesh(l,l.byteLength,d);else if(p===o.POINT_CLOUD)d=new o.PointCloud,g=a.DecodeArrayToPointCloud(l,l.byteLength,d);else throw new Error("THREE.DRACOLoader: Unexpected geometry type.");if(!g.ok()||d.ptr===0)throw new Error("THREE.DRACOLoader: Decoding failed: "+g.error_msg());const x={index:null,attributes:[]};for(const m in u){const _=self[h[m]];let M,T;if(c.useUniqueIDs)T=u[m],M=a.GetAttributeByUniqueId(d,T);else{if(T=a.GetAttributeId(d,o[u[m]]),T===-1)continue;M=a.GetAttribute(d,T)}const b=r(o,a,d,m,_,M);m==="color"&&(b.vertexColorSpace=c.vertexColorSpace),x.attributes.push(b)}return p===o.TRIANGULAR_MESH&&(x.index=i(o,a,d)),o.destroy(d),x}function i(o,a,l){const u=l.num_faces()*3,h=u*4,d=o._malloc(h);a.GetTrianglesUInt32Array(l,h,d);const g=new Uint32Array(o.HEAPF32.buffer,d,u).slice();return o._free(d),{array:g,itemSize:1}}function r(o,a,l,c,u,h){const d=l.num_points(),g=h.num_components(),p=s(o,u),x=g*u.BYTES_PER_ELEMENT,m=Math.ceil(x/4)*4,_=m/u.BYTES_PER_ELEMENT,M=d*x,T=d*m,b=o._malloc(M);a.GetAttributeDataArrayForAllPoints(l,h,p,M,b);const I=new u(o.HEAPF32.buffer,b,M/u.BYTES_PER_ELEMENT);let D;if(x===m)D=I.slice();else{D=new u(T/u.BYTES_PER_ELEMENT);let B=0;for(let E=0,w=I.length;E<w;E++){for(let L=0;L<g;L++)D[B+L]=I[E*g+L];B+=_}}return o._free(b),{name:c,count:d,itemSize:g,array:D,stride:_}}function s(o,a){switch(a){case Float32Array:return o.DT_FLOAT32;case Int8Array:return o.DT_INT8;case Int16Array:return o.DT_INT16;case Int32Array:return o.DT_INT32;case Uint8Array:return o.DT_UINT8;case Uint16Array:return o.DT_UINT16;case Uint32Array:return o.DT_UINT32}}}export{yP as $,R_ as A,NP as B,DP as C,qv as D,tn as E,wx as F,In as G,MP as H,ah as I,AP as J,a_ as K,Qu as L,_P as M,CP as N,xP as O,Qt as P,IP as Q,PP as R,Ey as S,wP as T,SP as U,RP as V,oh as W,UP as X,bP as Y,TP as Z,LP as _,mP as a,nL as a0,iL as a1,rL as a2,fL as a3,hL as a4,uL as a5,sL as a6,Dn as a7,cL as a8,AT as a9,ic as aa,yT as ab,ns as ac,fr as ad,Wn as ae,pa as af,qh as ag,oL as ah,G0 as ai,aL as aj,Yt as ak,On as al,MT as am,Xh as an,ft as ao,lL as ap,B0 as aq,YE as ar,W0 as as,z0 as at,Pi as au,rl as b,Uy as c,Ux as d,yc as e,dP as f,an as g,Oy as h,tL as i,rs as j,Kv as k,gP as l,mx as m,Gg as n,pP as o,Rx as p,vP as q,ph as r,px as s,bt as t,Vg as u,s_ as v,Sc as w,l_ as x,Zu as y,EP as z};
