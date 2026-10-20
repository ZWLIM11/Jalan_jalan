import test from 'node:test';
import assert from 'node:assert/strict';
import * as c from '../public/core.js';
import {sampleTrip} from '../public/sample.js';
import worker from '../src/worker.js';
test('backup roundtrip, isolated copies and empty storage',()=>{
 const trip=sampleTrip(),raw=JSON.stringify({app:'jalan-mana',version:1,trips:[trip]});
 assert.deepEqual(c.parseBackup(raw),[trip]);const copy=c.copyTrip(trip);
 assert.notEqual(copy.id,trip.id);assert.notEqual(copy.days[0].stops[0].id,trip.days[0].stops[0].id);
 assert.deepEqual(c.parseBackup(JSON.stringify({app:'jalan-mana',version:1,trips:[]})),[]);
 assert.throws(()=>c.parseBackup(JSON.stringify({app:'jalan-mana',version:1,trips:[trip,trip]})));
});
test('reject corrupt dates, IDs, partial pins and unsafe links',()=>{
 assert.throws(()=>c.validateTrip({...sampleTrip(),start:'2026-02-30'}));
 const t=sampleTrip();t.days[1].id=t.days[0].id;assert.throws(()=>c.validateTrip(t));
 assert.throws(()=>c.validateStop(c.newStop({lat:3,lng:null})));
 assert.equal(c.validateStop(c.newStop({url:'javascript:alert(1)'})).url,'');
});
test('nearby order preserves all stops, first stop and never increases length',()=>{
 const stops=[0,3,1,2].map((lng,i)=>c.newStop({lat:0,lng,name:String(i),priority:'must'}));
 const ordered=c.nearbyOrder(stops);assert.equal(ordered[0].id,stops[0].id);
 assert.deepEqual(new Set(ordered.map(p=>p.id)),new Set(stops.map(p=>p.id)));
 assert.ok(c.routeLength(ordered)<c.routeLength(stops));assert.equal(stops[1].lng,3);
 const incomplete=[...stops,c.newStop()];assert.deepEqual(c.nearbyOrder(incomplete),incomplete);
});
test('reorder boundaries and time overlaps',()=>{
 const a=c.newStop({time:'09:00',duration:90}),b=c.newStop({time:'10:00'});
 assert.deepEqual(c.overlaps([a,b]),[b.id]);assert.deepEqual(c.reorder([a,b],a.id,-1),[a,b]);
 assert.deepEqual(c.reorder([a,b],a.id,1),[b,a]);
});
test('each direction leg uses chosen mode and sharing excludes private fields',()=>{
 const t=sampleTrip(),p=t.days[0].stops[1],u=new URL(c.directionURL(p,t.days[0].stops[0]));
 assert.equal(u.searchParams.get('travelmode'),'walking');assert.ok(u.searchParams.get('origin'));
 t.notes='SECRET-NOTE';t.travelers='SECRET-NAME';p.url='https://example.com/secret';
 assert.ok(!c.tripText(t).includes('SECRET'));assert.ok(!c.tripText(t).includes('/secret'));
 assert.equal(c.distance(c.newStop(),p),null);
});
test('food returns require matching fresh request',()=>{
 const intent={trip:'t',day:'d',token:'abc',created:Date.now()},data={...intent,name:'Cafe',address:'KL',lat:3,lng:101};
 assert.equal(c.parseFoodReturn(JSON.stringify(data),intent).kind,'food');
 assert.throws(()=>c.parseFoodReturn(JSON.stringify({...data,token:'bad'}),intent));
 assert.throws(()=>c.parseFoodReturn(JSON.stringify(data),{...intent,created:0}));
 assert.throws(()=>c.parseFoodReturn(JSON.stringify(data),{...intent,created:undefined}));
});
test('optional search configuration exposes no secret and manual fallback works',async()=>{
 const get=path=>new Request('https://example.com'+path);
 assert.deepEqual(await (await worker.fetch(get('/api/config'),{GEOAPIFY_API_KEY:'secret'})).json(),{search:true});
 assert.equal((await worker.fetch(get('/api/places?q=KLCC'),{})).status,503);
 assert.equal((await worker.fetch(get('/api/places?q=x'),{GEOAPIFY_API_KEY:'secret'})).status,400);
 assert.equal(await (await worker.fetch(get('/'),{ASSETS:{fetch:()=>new Response('asset')}})).text(),'asset');
});

test('day progress handles empty, partial and completed days',()=>{
 assert.deepEqual(c.daySummary([]),{total:0,visited:0,remainingMust:0,next:null,minutes:0});
 const a=c.newStop({name:'First',visited:true,priority:'must',duration:30}),b=c.newStop({name:'Second',priority:'must',duration:45});
 assert.deepEqual(c.daySummary([a,b]),{total:2,visited:1,remainingMust:1,next:b,minutes:75});
 b.visited=true;assert.equal(c.daySummary([a,b]).next,null);assert.equal(c.daySummary([a,b]).remainingMust,0);
});
