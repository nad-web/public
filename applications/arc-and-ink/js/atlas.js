/* Arc & Ink · Noorullah Adel · MIT */
const ArcAtlas = (function buildAtlas(G){
  'use strict';
  const {point:p,line:L,circle:C,pin,mid,intersections:cross,reflect,bisector}=G;
  const A=p(-1,0), B=p(1,0), O=p(0,0), AB=L(A,B), CA=C(A,B), CB=C(B,A);
  const P=p(-.18,.84), M=mid(A,B), half=bisector(A,B);
  const tri={A:p(-.98,-.54), B:p(1.02,-.32), C:p(-.16,.98)};
  const cc=cross(bisector(tri.A,tri.B),bisector(tri.A,tri.C))[0];
  const ray={O, A:p(1.1,-.35), B:p(.36,1.48)};
  function unit(o,v){const d=G.dist(o,v);return p((v.x-o.x)/d,(v.y-o.y)/d);}
  function angle(o,a,b){const u=unit(o,a),v=unit(o,b);return L(o,p(o.x+u.x+v.x,o.y+u.y+v.y));}
  const along=(o,d,r)=>p(o.x+Math.cos(d)*r,o.y+Math.sin(d)*r);
  const ringCenter=p(.12,-.11), radius=1.16;
  const rim={A:along(ringCenter,2.85,radius),B:along(ringCenter,-.88,radius),C:along(ringCenter,1.08,radius)};
  const east=p(1.08,0), dial=C(O,east), axis=L(O,east);
  const square=[0,1,2,3].map(i=>along(O,i*Math.PI/2,east.x));
  const hex=[0,1,2,3,4,5].map(i=>along(O,i*Math.PI/3,east.x));
  const edges=vs=>vs.map((v,i)=>L(v,vs[(i+1)%vs.length]));
  const ext={O:p(-.5,-.1),T:p(-.5,.77),P:p(1.38,.26)};
  const extCircle=C(ext.O,ext.T), extLine=L(ext.O,ext.P);
  const contacts=cross(extCircle,C(mid(ext.O,ext.P),ext.P));
  const chapters=['First marks','The balance bench','The circle room','Surveyor’s desk'];
  const list=[];
  function add(id,title,brief,given,shapes,goals,par,hints,proof,options={}){
    list.push({id,title,brief,given,shapes,goals,par,hints,proof,index:list.length,chapter:chapters[Math.floor(list.length/4)],view:[3.35,2.45],tool:'line',...options});
  }
  add('seam','The meeting line','Draw one straight line through both crossings of the two ink circles.',
    {A,B},[CA,CB],[[half]],1,
    ['Look for the two hollow dots where the rims cross.','Choose Straightedge. Tap one crossing, then the other.'],
    'Each crossing is equally far from A and B because the circles have the same radius. The line through those two crossings is the perpendicular bisector of AB.');
  add('orbit','A signal radius','Draw a circle centered at A that passes through B.',
    {A:p(-.72,-.36),B:p(.68,.32)},[],[[C(p(-.72,-.36),p(.68,.32))]],1,
    ['A compass needs a center and a point on the rim.','Choose Compass. Tap A first, then B.'],
    'The opening of the compass is the distance AB. Every point on the rim stays exactly that far from A.',{tool:'circle',view:[2.8,2.25]});
  add('twins','Twin beacons','Give each beacon a circle that runs through the other beacon.',
    {A,B},[],[[CA,CB]],2,
    ['The compass opening will be the same twice.','Draw the circle centered at A through B, then the circle centered at B through A.'],
    'The two radii are both the length AB. At either crossing, the distances to A and B are equal.',{tool:'circle'});
  add('triangle','A three-sided sail','Use the given baseline AB as one side. Draw the other two side lines of an equilateral triangle on either side of AB.',
    {A,B},[AB],cross(CA,CB).map(apex=>[L(A,apex),L(B,apex)]),4,
    ['The third vertex must be one AB-length from both A and B.','Draw a circle from A through B and one from B through A. Choose either crossing.','Join the same crossing to A and to B with the straightedge.'],
    'The apex sits on both circles. Its distances to A and B equal AB, so all three sides have the same length.',{tool:'circle'});
  add('midpoint','Halfway home','Pin the exact midpoint of AB on the given line.',
    {A,B},[AB],[[pin(M)]],4,
    ['A point halfway along AB lies on its perpendicular bisector.','Draw matching circles from A through B and B through A. Join their two crossings.','Use Pin on the crossing of your new line and the original AB line.'],
    'The bisector meets AB at the only point on the segment that is the same distance from both ends.',{tool:'circle'});
  add('mirror','The mirror post','The line AB is a mirror. Pin the reflection of P on the other side.',
    {A,B,P},[AB],[[pin(reflect(P,AB))]],3,
    ['A reflection keeps its distances to every point on the mirror.','Draw a circle centered at A through P. Repeat from B through P.','The circles meet at P and its reflection. Pin the other crossing.'],
    'A and B keep their distances to the reflected point. The same two circles locate P on one side and its unique reflection on the other.',{tool:'circle',view:[2.65,1.9]});
  add('angle','Share the opening','Draw the internal bisector of the smaller angle AOB.',
    ray,[L(O,ray.A),L(O,ray.B)],[[angle(O,ray.A,ray.B)]],4,
    ['First mark equal distances along the two rays from O.','Draw a circle centered at O through A. Take the crossing on ray OB in the direction of B.','Draw equal circles centered at A and that crossing, through each other. Join their two crossings.'],
    'The two points chosen on the rays are equally far from O. Their perpendicular bisector passes through O and splits the angle into two equal parts.',{tool:'circle',view:[2.65,2.1]});
  add('plumb','The plumb line','Draw a line through P perpendicular to AB.',
    {A,B,P},[AB],[[L(P,reflect(P,AB))]],3,
    ['P and its reflection are on the same perpendicular.','Draw circles from A and B, each passing through P.','Join P to the second crossing of those circles.'],
    'The common chord of the two circles passes through P. A line joining the centers is perpendicular to that common chord.',{tool:'circle',view:[2.65,1.9]});
  add('diameter','A full turn','Draw the circle whose diameter is AB.',
    {A,B},[AB],[[C(M,A)]],4,
    ['Its center must be halfway between A and B.','Use two equal circles at A and B. Join their crossings to cut AB in half.','Set the compass center at the midpoint and open it to either endpoint.'],
    'A diameter passes through the center. Centering the compass at the midpoint makes A and B opposite points of the rim.',{tool:'circle'});
  add('touch','A single touch','Draw the tangent to the given circle at T.',
    {O,T:east},[dial,axis],[[L(east,p(east.x,1))]],4,
    ['A tangent at T is perpendicular to OT. Place T halfway between two points on the radial line.','Draw the circle centered at T through O. Its other crossing with OT gives you a point beyond T.','Use O and that far point as centers of equal circles through each other. Join their two crossings.'],
    'A line perpendicular to the radius at its endpoint touches the circle at exactly that one point.',{tool:'circle',view:[3.5,2.65]});
  add('circum','Three lanterns','Draw one circle passing through all three lanterns A, B and C.',
    tri,[],[[C(cc,tri.A)]],7,
    ['The center has to be equally far from all three lanterns.','Build the perpendicular bisector of AB using two circles and a line. Repeat for AC.','Draw a circle at the meeting point of the bisectors through any lantern.'],
    'One bisector makes the distances to A and B equal. A second makes the distances to A and C equal. Their crossing is the center of a circle through all three.',{tool:'circle'});
  add('hub','The missing hub','Three marks survive on this wheel. Use them to recover and pin its center.',
    rim,[C(ringCenter,rim.A)],[[pin(ringCenter)]],7,
    ['A circle’s center lies on the perpendicular bisector of each chord.','Treat AB and AC as chords. For each pair, draw two equal circles through each other and join their crossings.','Pin the crossing of the two bisectors.'],
    'The perpendicular bisector of each chord contains the center. Two distinct chords fix that center uniquely.',{tool:'circle'});
  add('parallel','The guide rail','Run a second line through P parallel to AB.',
    {A,B,P},[AB],[[L(P,p(P.x+1,P.y))]],7,
    ['Two lines perpendicular to the same line are parallel. First construct the perpendicular to AB through P.','Circles centered at A and B through P give its reflection Q. Draw PQ. A circle centered at P through Q cuts PQ again at R.','Draw equal circles at Q and R through each other. Join their crossings. This second perpendicular passes through P.'],
    'The line through P and its mirror image is perpendicular to AB. Bisecting a segment centered at P on that perpendicular gives the required parallel.',{tool:'circle',view:[3.65,3.0]});
  add('square','The square window','Inscribe a square with A as one vertex. Draw its four side lines.',
    {O,A:east},[dial,axis],[edges(square)],7,
    ['Find the ends of two perpendicular diameters.','Use A and the opposite end of the given diameter as compass centers. Draw equal circles through each other and join their crossings.','The new diameter cuts the wheel in two more vertices. Join the four rim points in order.'],
    'Perpendicular diameters divide the circle into four equal arcs. Consecutive endpoints give four equal edges and four right angles.',{tool:'circle'});
  add('hex','The sixfold seal','Inscribe a regular hexagon starting at A. Draw all six side lines.',
    {O,A:east},[dial],[edges(hex)],10,
    ['A regular hexagon inscribed in a circle has sides equal to its radius.','Draw a circle at A through O. Its rim marks the two neighbors of A on the original circle.','Repeat from new rim points through O until you have all six vertices, then join adjacent vertices.'],
    'Each step along the rim forms an equilateral triangle with O. Six central angles of 60 degrees fill one full turn.',{tool:'circle',view:[2.55,2.0]});
  add('gate','The double tangent','From the outside point P, draw both lines tangent to the given circle.',
    ext,[extCircle,extLine],[contacts.length===2?contacts.map(q=>L(ext.P,q)):[]],6,
    ['A radius to a tangent point meets the tangent at a right angle. Look for a second circle whose diameter is OP.','Construct the perpendicular bisector of OP. Where it cuts OP, center a new circle through P.','Join P to each crossing of this new circle with the original circle.'],
    'Each contact lies on the circle with diameter OP, so its angle between O and P is a right angle. The two lines from P are therefore perpendicular to the two radii at contact.',{tool:'circle',view:[3.35,2.55]});
  const free={id:'free',title:'Free laboratory',brief:'Plant points, draw with the instruments and save a diagram of your own.',given:{A:p(-.82,-.23),B:p(.76,.24)},shapes:[],goals:[],hints:[],par:0,proof:'',chapter:'Open notebook',view:[2.5,1.8],tool:'point',free:true};
  function hash(text){let x=2166136261;for(const ch of text){x^=ch.charCodeAt(0);x=Math.imul(x,16777619);}return x>>>0;}
  function daily(date){
    let seed=hash('arc-ink:'+date);
    function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
    const base=list[3+Math.floor(rand()*(list.length-3))];
    const f=G.similarity((rand()-.5)*Math.PI*.78,.82+.20*rand(),rand()>.5,(rand()-.5)*.32,(rand()-.5)*.22);
    const given=Object.fromEntries(Object.entries(base.given).map(([id,p])=>[id,f(p)]));
    return {...base,id:'daily-'+date,baseId:base.id,date,given,shapes:base.shapes.map(s=>G.transformShape(s,f)),goals:base.goals.map(targets=>targets.map(s=>G.transformShape(s,f))),view:[3.75,3.3],transform:f};
  }
  return {list,chapters,free,daily};
})(typeof module !== "undefined" && module.exports ? require("./geometry.js") : ArcGeometry);
if (typeof module !== "undefined" && module.exports) module.exports = ArcAtlas;
