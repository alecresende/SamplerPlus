function AudioPart(audiobuffer, delay, offset, duration) {
	
	this.buffer = audiobuffer;
	this.offset = offset; // offset of the audio audiobuffer
	this.delay = delay;
	this.duration = duration;

	this.rate = audiobuffer.sRate;

}


// need an array to represent a spliced audio

function playArray(arr, context, webaudio, offset, loopStart, loopEnd) {
	console.log("WASSAP PLAY ARRAY");
	console.log(arr);
	var players = [];

	for(var i in arr) {
		console.log("PLAYin ARRAY " + i);
		
		var audiop = arr[i];
		var source = context.createBufferSource();
		webaudio.setSource(source);
		source.buffer = audiop.buffer;
		source.loop= true;
		if(loopStart != -1) {
			source.loopStart = loopStart;
			source.loopEnd = loopEnd;
		}
		
		if(i==0)
			source.start(audiop.delay, offset, audiop.duration);
		else
			source.start(audiop.delay, audiop.offset, audiop.duration);

		console.log("PLAYING IT delay = " + audiop.delay + " offset = " + audiop.offset + " duration = " + audiop.duration);
		console.log(source.buffer);
		players.push(source);
	}
	return players;
	
}

function replaceWithSilence(context, audiobuff, start, finish ) {
	var chan1 = audiobuff.getChannelData(0);
	var chan2 = audiobuff.getChannelData(1);
	
	var sRate = audiobuff.sampleRate;
	
	console.log("SRATE = " + sRate);
	console.log("LENGTH = " + chan2.length);
	var startS = Math.round(start * sRate);
	var finishS = Math.round(finish * sRate); 

	console.log("START = " + startS);
	console.log("FINISH = " + finishS);

	for(var i = startS ; i < finishS ; i++) {
		chan1[i] = 0;
		chan2[i] = 0;
	}
	
	var newBuff = context.createBuffer(2, chan1.length, sRate);
	var new_chan1 = newBuff.getChannelData(0);
	var new_chan2 = newBuff.getChannelData(1);

	new_chan1.set(chan1);
	new_chan2.set(chan2);

	return newBuff;
	
}


function renderAudio(buffer, name) {
	return makeWAV(buffer, buffer.sampleRate);
	
}

function crop(context, audiobuff, start,  finish) {
	var chan1 = audiobuff.getChannelData(0);
	var chan2 = audiobuff.getChannelData(1);
	
	var sRate = audiobuff.sampleRate;
	
	console.log("SRATE = " + sRate);
	var startS = Math.round(start * sRate);
	var finishS = Math.round(finish * sRate); 

	console.log("startS = " + startS + " finishS = " + finishS);
	
	var splice1 = chan1.subarray(startS, finishS);
	var splice2 = chan2.subarray(startS, finishS);
	
	var newBuff = context.createBuffer(2, finishS-startS, sRate);

	var tmp1 = newBuff.getChannelData(0);
	var tmp2 = newBuff.getChannelData(1);

	tmp1.set(splice1);
	tmp2.set(splice2);

	return newBuff;
	
}

// Inserts part2 into part1 at offset seconds into part1.
// They are type AudioPart defined above

// 
function insertAt(context, part1, part2, offset) {
	
	var chan1r = part1.getChannelData(0);
	var chan1l = part1.getChannelData(1);
	var chan2r = part2.getChannelData(0);
	var chan2l = part2.getChannelData(1);
	
	var srate = part1.sampleRate;
	var offset_samples = Math.ceil(offset * srate);
	// Just Need part1 until offset for the first splice
	var dura1 = part1.duration;
	var dura2 = part2.duration;

	console.log("SRATE = " + srate);
	var dura1_samples = Math.ceil(dura1 * srate);
	var dura2_samples = Math.ceil(dura2 * srate);

	var sizzz = dura1_samples + dura2_samples;
	
	console.log( "SIZE OF NEW ARRAY = " + dura1_samples);
	console.log("DURATION IN SECS = " + dura1);
	var new_Arrayr = new Float32Array( Math.ceil(part1.duration * srate) + Math.ceil(part2.duration * srate));
	var new_Arrayl = new Float32Array( Math.ceil(part1.duration * srate) + Math.ceil( part2.duration * srate));

	var splice1A_r = chan1r.subarray(0, offset_samples);
	var splice1A_l = chan1l.subarray(0, offset_samples);

	
	new_Arrayr.set(splice1A_r, 0);
	new_Arrayl.set(splice1A_l, 0);
	new_Arrayr.set(chan2r, offset_samples);
	new_Arrayl.set(chan2l, offset_samples);
	

	var splice1B_r = chan1r.subarray(offset_samples);
	var splice1B_l = chan1l.subarray(offset_samples);

	
	new_Arrayr.set(splice1B_r, offset_samples + Math.ceil(part2.duration * srate));

	new_Arrayl.set(splice1B_l, offset_samples + Math.ceil(part2.duration * srate));
	

	// Need part2's sample 
	
	
	var newBuff = context.createBuffer(2, sizzz, srate);

	var tmp1 = newBuff.getChannelData(0);
	var tmp2 = newBuff.getChannelData(1);

	tmp1.set(new_Arrayr);
	tmp2.set(new_Arrayl);

	return newBuff;

} 

// Mixes part2 into part1 at offset seconds in part1

function mixAt(context, part1, part2, offset) {

	var chan1r = part1.getChannelData(0);
	var chan1l = part1.getChannelData(1);
	var chan2r = part2.getChannelData(0);
	var chan2l = part2.getChannelData(1);
	
	var srate = part1.sampleRate;
	var offset_samples = Math.ceil(offset * srate);
	var dura1 = part1.duration;
	var dura2 = part2.duration;
	console.log("OFFSET SAMPLES = " + offset_samples);
	console.log("SRATE = " + srate);
	var dura1_samples = Math.ceil(dura1 * srate);
	var dura2_samples = Math.ceil(dura2 * srate);

	var outR = new Float32Array(chan1r);
	var outL = new Float32Array(chan1l);

	console.log("OUTR length = " + outR.length);
	console.log("DURA1 samples = " + dura1_samples);

	for(var i = 0; i < dura2_samples ; i++) {
		
		var r_1 = chan1r[offset_samples + i];
		var r_2 = chan2r[i];

		var tmp = chan1r[offset_samples + i] + chan2r[i];
		
		if(tmp > 1) {
			console.log(":(");
			tmp = 1;
		}
		
		outR[offset_samples + i] = tmp;

		tmp = chan1l[offset_samples + i] + chan2l[i];
			
	
		if(tmp > 1) 
			tmp = 1;
		
		outL[offset_samples + i] = tmp;
	}
	
	
	var newBuff = context.createBuffer(2, dura1_samples, srate);

	var tmp1 = newBuff.getChannelData(0);
	var tmp2 = newBuff.getChannelData(1);

	tmp1.set(outR);
	tmp2.set(outL);
	console.log("WAHOO))))))))))))))))))))))))))))))))))))))))))))))))0");

	return newBuff;
	
}

function copySelection(context, audiobuff, start, finish) {
	var chan1 = audiobuff.getChannelData(0);
	var chan2 = audiobuff.getChannelData(1);
	
	var sRate = audiobuff.sampleRate;
	
	console.log("SRATE = " + sRate);
	var startS = Math.round(start * sRate);
	var finishS = Math.round(finish * sRate); 

	var newBuff = context.createBuffer(2, finishS-startS, sRate);

	
	var t1 = newBuff.getChannelData(0);
	var t2 = newBuff.getChannelData(1);

	var tmp1 = new Float32Array(finishS-startS);
	var tmp2 = new Float32Array(finishS-startS);

	for(var i=startS ; i < finishS; i++) {
		tmp1[i-startS] = chan1[i];
		tmp2[i-startS] = chan2[i];
	}

	t1.set(tmp1);
	t2.set(tmp2);

	return newBuff;
}

function repeat(context, aud, start_sec, end_sec, times) {

	var chan_r = aud.getChannelData(0);
	var chan_l = aud.getChannelData(1);
	
	var srate = part1.sampleRate;
	var start_samples = Math.ceil(start_sec* srate);
	var end_samples = Math.ceil(end_sec* srate);
	
	var dura = aud.duration;
	var dura_samples = Math.ceil(aud.duration * srate);
	
	
	var loop_samples = end_samples - start_samples;
	var total_looped_samples = loop_samples * times;
	
}

function padWithZeros(before, after, chan) {
	var beforeA = new Array(before);
	for(var i=0;i<before;i++)
		beforeA[i]=0;
	var afterA= new Array(after);
	for(var i=0;i<after;i++)
		afterA[i]=0;

	var newArray = new Float32Array(chan.length + after + before);
	newArray.set(beforeA, 0);
	newArray.set(chan, before);
	newArray.set(afterA, before+chan.length);

	return newArray;
}


