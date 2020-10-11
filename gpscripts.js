// Logic for graphical experiment
window.onload = init; // load all event handlers

// defaults
var width = 1400;
var height = 900;
var middleX = width/2;
var middleY = height/2;
var endurl='results.html';  // url to jump when experiment is finished
var language='en'  // default

// flags of actual playing sound
var snd = new Object();
	snd.isText=0; // flag
	snd.gongToPlay=0;  // flag
	snd.gongDisable=0; // flag

// internal buffer for all parameters to sends
var mem = {};

// flags
var DEBUG = 0; // debug mode
var AUDIODEBUG = 0; // play faster
var dragged=0;  // has something been moved?
var noseeall=0;  
var noseep1=0;
var noseep2=0;
var noseep3=0;
var screenclickdisabled = 0; // screenclick not available

// sound variables
var sounds=Array();
var gongsound=0;
var audiotestsound=0;

// schema steps list for running the experiment
// one list per step,
// with format: [pre-sound function (0=nothing), sound to play (''=none), during-sound function (0=nothing), repeat to step X (0=no repeat possible)]
var runningschema = [
[flagsshow,'',0,0],
[flagshide,'',audiotestscreen,0],
[screenclick_on,'01_V42',beginning,0],
[controls_off,'02_V42',practice,0],
[0,'03_V42','',0],
[0,'04_V42','',0],
[0,'05_V42','',0],
[0,'06_V42','',0],
[0,'07_V42','',0],
[controls_on,'08_V42',0,2],
[controls_off,'09_V42',meshow,0], 
[0,'10_V42','',0],
[0,'11_V42',0,0],
[0,'12_V42',0,0],
[personcontrols_on,'13_V42',p1show,9],
[personcontrols_off,'14_V42',p12hide,0],   
[0,'15_V42','',0],
[personcontrols_on,'16_V42',p12show,14],
[personcontrols_off,'17_V42',p123hide,0], 
[0,'18_V42',0,0],
[personcontrols_on,'19_V42',p123show,17], 
[0,'20_V42',finalcheck,0],
[finale,'21_V42',0,0],
[0,0,sendexit,0]
]
function helper_getNumOfSounds(schema) {
	// get number of sound files used in schema
	var num = 0;
	for (var i=0; i<schema.length;i++) {
		if (schema[i][1]) num++;
		}
	return num
}
	
var pos = 0;  // actual position in schema
var soundloadcount=helper_getNumOfSounds(runningschema);   // countdown counter


function debugText(text) {  // display debug text
	t = document.getElementById('debugtext');
	t.textContent=text;
}

function init() {
    document.addEventListener('click',screenclick);
    document.addEventListener('touchstart',screenclick);
    document.addEventListener('keydown',function() {return false;}  );  // catch all button presses, only use releases
    document.addEventListener('keyup',keyclick);
    
	//init draggables
    var dragparams = {
		type:"x,y",
		bounds:document.getElementById("ctrBox"),
        onDragEnd:dragrelease,     // update position parameters
		}
	Draggable.create("#p1",dragparams);
	Draggable.create("#p2",dragparams);
	Draggable.create("#p3",dragparams);

	// init vars
	var QueryString = getRequests();
	mem = {
		// main items with default values (-1000 = not set)
		// person 1
		'p1dist':-1,      // calculated distance of person to me
		'p1angle':-1000,  // calculated angle of person to me
		'p1xpos':-1,      // x position of person
		'p1ypos':-1,      // y position of person
		// person 2
		'p2dist':-1,     
		'p2angle':-1000,
		'p2xpos':-1,
		'p2ypos':-1,
		// person 3
		'p3dist':-1,
		'p3angle':-1000,
		'p3xpos':-1,
		'p3ypos':-1,
		// additional items
		'pitem1':0,   // how many person the user did not see
		'pitem2':-1,  // has user moved something during final check?
		'repeats':0,   // how many repeats did the user need?
		'language': 'en',
	}
	// debugging functions
	if (QueryString['debug']) DEBUG=1;
	if (QueryString['audiodebug']) AUDIODEBUG=1;
	if (QueryString['pos'] && DEBUG) pos=parseInt(QueryString['pos']);
	if (DEBUG) document.getElementById('debugtext').setAttribute('visibility','visible');
	dispatch(); // start schema
}

// ----------------------------------------------------------------------------------------- SCHEMA RUNNING
function dispatch() {
	// call functions & play sound on schmema position
    var p=runningschema[pos][0];  // function pre-sound
	var s=runningschema[pos][1];  // sound
	var m=runningschema[pos][2];  // function during sound
	if (p) p();
	if (s) play();
	if (m) m();
}
function next() {
    // proceed in schmema
	if (DEBUG) debugText("next");
    if (gongsound) gongsound.stop();
	if (sounds[pos]) sounds[pos].stop();
    pos+=1;
	dispatch();
}
function repeat() {
    if (DEBUG) debugText("repeat");
    if (!sounds[pos].playing() || DEBUG) {
	    sounds[pos].stop();
		var newpos = runningschema[pos][3];
		if (newpos) {mem['repeats']+=1;pos=newpos;dispatch();}
	}
}

// ----------------------------------------------------------------------------------------- SCHEMA METHODS
function flagsshow() {
	screenclick_off();
	appear('#flagEN');
	appear('#flagDE');
}

function nosee() {
    if (DEBUG) debugText("nosee");
    switch(pos) {
		case 8: mem['pitem1']+=1;noseeall=1;break;
        case 13: mem['pitem1']+=2;noseep1=1;break;
		case 16: mem['pitem1']+=4;noseep2=1;break;
		case 19: mem['pitem1']+=8;noseep3=1;break;
		default: mem['pitem1']=-99;  // should not happen!!
		}
    next();
}

function start() {
    audiotestsound.stop();
	next();
}

function beginning() {
	disappear('#audiotestbutton');
	disappear('#startbutton');
}

function practice() {
	appear('#circles',1.0,100);  // 100s fade in! :)
}

function finalcheck() {
	dragged=0; // reset
    disappear('#noseebutton');
    disappear('#repeatbutton');
	appear('#okbutton',0.8);
	gong_off();
}

function finale() {
	disappear('#circles');
	Draggable.get("#p1").disable();
	Draggable.get("#p2").disable();
	Draggable.get("#p3").disable();
	mem['pitem2']=dragged;  // has person been moved?
}

// ----------------------------------------------------------------------------------------- SHOW/HIDEs
function flagshide() {
	disappear('#flagEN');
	disappear('#flagDE');
}

function meshow() {
	p1geht();   // wegen repeat :)
	appear('#circles');
	appear('#me');
	gong_on();
}

function p1show() {
	appear('#p1',0.8);
	screenclick_off();
}

function p1geht() {
	disappear('#p1');
}

function p12show() {
	if (!noseep1) appear('#p1',0.8);
	appear('#p2',0.8);
}

function p12hide() {
	disappear('#p1');
	disappear('#p2');
}

function p123show() {
	if (!noseep1) appear('#p1',0.8);
	if (!noseep2) appear('#p2',0.8);
	appear('#p3',0.8);
}

function p123hide() {
	disappear('#p1');
	disappear('#p2');
	disappear('#p3');
    disappear('#okbutton');
}
function controls_on() {
	appear('#repeatbutton',0.8);
	appear('#okbutton',0.8);
	appear('#noseebutton',0.8);
	screenclick_off();
	gong_off();
}

function controls_off() {
	disappear('#repeatbutton');
	disappear('#okbutton');
	disappear('#noseebutton');
	screenclick_on();
	gong_on();
}

function personcontrols_on() {
	appear('#repeatbutton',0.8);
	appear('#okbutton',0.8);
	appear('#noseebutton',0.8);
	screenclick_off();
	gong_off();
}

function personcontrols_off() {
	disappear('#repeatbutton');
	disappear('#okbutton');
	disappear('#noseebutton');
	screenclick_on();
	gong_on();
}

// ----------------------------------------------------------------------------------------- SCREEN EVENT HANDLERS
function chooseEN() {
    language="en";
	mem.language="en";
	flagshide();
	audio_preload();
}
function chooseDE() {
    language="de";
	mem.language="de";
	flagshide();
	audio_preload();
}

function screenclick(e) {
    if (DEBUG) debugText("screenclick")
    if (!screenclickdisabled && !snd.isText) {
		next();
	}
}

function screenclick_off() {if (DEBUG) debugText("screenclick_off");screenclickdisabled=1;}

function screenclick_on() {if (DEBUG) debugText("screenclick_on");screenclickdisabled=0;}

function browsechange(e) {
    if (DEBUG) debugText("browsechange");
	if (!e) e = window.event;
	e.preventDefault(); // suppress standard browser action
	return false;
}

function keyclick(e) {
    if (DEBUG) debugText("keyclick");
	if (!e) e = window.event;
	e.preventDefault(); // suppress standard browser action
    if ((e.keyCode == 32) && !screenclickdisabled && (!snd.isText || DEBUG)) {  // only space bar allowed
	  next();
	}
}

function dragrelease() {
	dragged = 1;	
	var matrix = this.target.transform.baseVal.consolidate().matrix;  // tricky: look at https://stackoverflow.com/questions/19154631/how-to-get-coordinates-of-an-svg-element
	var xpos=matrix.e+60;  // offsets, don't understand why...
	var ypos=matrix.f+60;  // offsets, don't understand why...
	var dx=xpos-middleX;
	var dy=ypos-middleY;
	// calculate distance and angle
	var dist=Math.round(Math.sqrt(dx*dx+dy*dy));
	var angle=180-Math.round(Math.atan2(dx,dy)/Math.PI*180);  

    switch (this.target.id) {
		case 'p1': {mem['p1dist'] = dist;mem['p1angle'] = angle;mem['p1xpos']=Math.round(dx);mem['p1ypos']=Math.round(dy);break;};
		case 'p2': {mem['p2dist'] = dist;mem['p2angle'] = angle;mem['p2xpos']=Math.round(dx);mem['p2ypos']=Math.round(dy);break;};
		case 'p3': {mem['p3dist'] = dist;mem['p3angle'] = angle;mem['p3xpos']=Math.round(dx);mem['p3ypos']=Math.round(dy);break;};
		}
	if (DEBUG) debugText('dist:'+dist+' angle:'+angle+' xpos:'+Math.round(dx)+' ypos:'+Math.round(dy));
}	

// ----------------------------------------------------------------------------------------- AUDIO HANDLING
function audio_preload() {
	appear('#spinner', delay=0); 
	// preload all sounds into Howl objects
	// always use multiple formats, in this case mp3 and ogg
	gongsound=new Howl({src:['audio/'+language+'/QiGong_V43.mp3','audio/'+language+'/QiGong_V43.ogg'],onload:soundloaded});
	audiotestsound=new Howl({src:['audio/'+language+'/00_Audiotest_V42.mp3','audio/'+language+'/00_Audiotest_V42.ogg'],onload:soundloaded}); 
	for (var i=1; i<runningschema.length;i++) {
		if (runningschema[i][1]) {
		sounds[i]=new Howl({
			src: ['audio/'+language+'/'+runningschema[i][1]+'.mp3','audio/'+language+'/'+runningschema[i][1]+'.ogg'],
			onload: soundloaded,
			onend: soundended
			});	
		if (AUDIODEBUG) sounds[i].rate=3.0;
		}
		else
		{
		sounds[i]=''
		}
	}
}

function soundloaded() {
	if (DEBUG) debugText('soundloaded '+soundloadcount);
	soundloadcount--;
	if (soundloadcount==0) {  // all loaded
		disappear('#spinner'); 
		next();
	}
}

function gong_off() {snd.gongDisable=1;}

function gong_on() {snd.gongDisable=0;}

function playaudiotest() {
   audiotestsound.play();
}

function soundended() {
	snd.isText=0;  // interruptable
    if (DEBUG) debugText("soundended. Disabled:"+snd.gongDisable);
	if (!snd.gongDisable && snd.gongToPlay) {gongsound.play();snd.gongToPlay=0;};    // if gong is to be played
}

function play() {
	if (DEBUG) debugText('play pos: '+pos);
	if (AUDIODEBUG) snd.playbackRate=3.5;
	sounds[pos].play();
	snd.isText=1;  // not interruptable
	snd.gongToPlay=1;  // next gong is to play (default)
}

function audiotestscreen() {
	screenclick_off();
    appear('#audiotestbutton');
	appear('#startbutton');
}

// ------------------------------------------------------------------------------------------ VISUAL GIMMICKS
function appear(id, opacity, delay) {
	if (!opacity) opacity=1.0;    
	if (!delay) delay=2.5;
    document.getElementById(id.substring(1)).setAttribute('visibility','visible');
	TweenLite.to(id, delay, {opacity:opacity});
}

function disappear(id) {
	TweenLite.to(id, 1.0, {opacity:0.0});
	setTimeout(function(id){document.getElementById(id.substring(1)).setAttribute('visibility','hidden');},1200,id);
}

function getBigger(id) {  // not used yet
	TweenLite.to(id, 0.5, {scale:1.2});
}

function getNormal(id) {  // not used yet
	TweenLite.to(id, 0.5, {scale:1.0});
}

// ----------------------------------------------------------------------------------------- REQUEST HANDLING
function sendexit() {
    // proceed to evaluation
	if (noseep1) {mem['p1dist']=99;mem['p1angle']=-99;mem['p1xpos']=-99;mem['p1ypos']=-99;};
	if (noseep2) {mem['p2dist']=-99;mem['p2angle']=-99;mem['p2xpos']=-99;mem['p2ypos']=-99;};
	if (noseep3) {mem['p3dist']=-99;mem['p3angle']=-99;mem['p3xpos']=-99;mem['p3ypos']=-99;};	
    post(endurl, mem, 'pre');
}

function getRequests() {
    var s1 = location.search.substring(1, location.search.length).split('&'),
        r = {}, s2, i;
    for (i = 0; i < s1.length; i += 1) {
        s2 = s1[i].split('=');
        r[decodeURIComponent(s2[0]).toLowerCase()] = decodeURIComponent(s2[1]);
    }
    return r;
};

// see https://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
function post(path, params, method) {
    method = method || "post"; // Set method to post by default if not specified.

    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.createElement("form");
    form.setAttribute("method", method);
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
         }
    }
    document.body.appendChild(form);
    form.submit();
}
