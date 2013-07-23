function AudioPart(audiobuffer, delay, offset, duration) {
	
	this.buffer = audiobuffer;
	this.offset = offset; // offset of the audio audiobuffer
	this.delay = delay;
	this.duration = duration;

	this.rate = audiobuffer.sRate;

}


// need an array to represent a spliced audio

function playArray(arr, context, webaudio, offset) {
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
	
	var srate = part1.rate;
	var offset_samples = offset * srate;
	// Just Need part1 until offset for the first splice
	
	
	var splice1A_r = chan1r.subArray(0, offset_samples);
	var splice1A_l = chan1l.subArray(0, offset_samples);

	splice1A_r.set(chan2r, offset_samples);
	splice1A_l.set(chan2l, offset_samples);
	

	var splice1B_r = chan1r.subArray(offset_samples);
	var splice1B_l = chan1l.subArray(offset_samples);

	
	splice1A_r.set(splice1B_r, offset_samples + (part2.duration * srate));
	splice1A_l.set(splice1B_l, offset_samples + (part2.duration * srate));
	

	// Need part2's sample 
	
	
	var newBuff = context.createBuffer(2, finishS-startS, sRate);

	var tmp1 = newBuff.getChannelData(0);
	var tmp2 = newBuff.getChannelData(1);

	tmp1.set(splice1A_r);
	tmp2.set(splice1A_l);

	return newBuff;

} 
