'use strict';

WaveSurfer.WebAudio = {
    defaultParams: {
        fftSize: 1024,
        smoothingTimeConstant: 0.3
    },

    /**
     * Initializes the analyser with given params.
     */
    init: function (params) {
        this.params = WaveSurfer.util.extend({}, this.defaultParams, params);

        this.ac = this.params.AudioContext ||
            new (window.AudioContext || window.webkitAudioContext);
        this.byteTimeDomain = new Uint8Array(this.params.fftSize);
		this.currentBuffers = new Array();
        this.byteFrequency = new Uint8Array(this.params.fftSize);

		this.players = null;
        this.paused = true;
		
		this.sources = null;

        this.createAnalyzer();
        this.createScriptNode();
    },

    createAnalyzer: function () {
        this.analyser = this.ac.createAnalyser();
        this.analyser.smoothingTimeConstant = this.params.smoothingTimeConstant;
        this.analyser.fftSize = this.params.fftSize;
        this.analyser.connect(this.ac.destination);
    },

    createScriptNode: function () {
        this.scriptNode = this.ac.createJavaScriptNode(this.params.fftSize / 2, 1, 1);
        this.scriptNode.connect(this.ac.destination);
        var my = this;
        this.scriptNode.onaudioprocess = function () {
            if (!my.isPaused()) {
                my.fireEvent('audioprocess', my.getPlayedPercents());
            }
        };
    },

	
	getLoopStart: function() {
		return this.players[0].loopStart;
	},

	selection: function (start, finish) {
		
		if(this.players != null) {
			var x = this.players[0];
			console.log(x);
			var dura = this.getDuration();
			x.loopStart = dura*start;
			x.loopEnd = dura*finish;
			x.start(0,0, x.loopEnd - x.loopStart);
			this.startTime = this.ac.currentTime;
		}
		
	},
	
    setSource: function (source) {
		console.log("SOURCE YALL");
        this.source && this.source.disconnect();
        this.source = source;
        this.source.connect(this.analyser);
        this.source.connect(this.scriptNode);
		
		var x = new Array();
		x[0] = this.sources;
		this.setSources(x);
    },
	
	setSources: function (sources) {
		this.sources = sources;
	},
	
    /**
     * Create and connect to a media element source.
     */
    streamUrl: function (url) {
        var my = this;
        var audio = new Audio();

        audio.addEventListener('canplay', function () {
            my.setSource(my.ac.createMediaElementSource(audio));
            my.fireEvent('canplay');
        });

        audio.addEventListener('timeupdate', function () {
            if (!audio.paused) {
                my.fireEvent('timeupdate', audio.currentTime);
            }
        });

        audio.autoplay = false;
        audio.src = url;
        return audio;
    },
	loadMultiData: function (audioparts, cb, errb) {
		var arr = new Array();
		var my = this;
		for(var i in audiobuffers) {
			var currentPart = audioparts[i];
			
			this.pause();
			
			this.ac.decodeAudioData(
									currentPart.buffer,
									function (buffer) {
										my.lastStart = 0;
										my.lastPause = 0;
										my.startTime = null;
										
										cb && cb(buffer);
										var ap = new AudioPart(buffer, currentPart.delay, currentPart.offset, currentPart.duration);
									},
									function () {
										//console.error('Error decoding audio buffer');
										errb && errb();
									}
									);
			
		}
		
		my.currentBuffers = arr;
		
	},
	
	loadData2: function (buffer, cb, errb) {
		this.currentBuffer = buffer;
		this.lastStart = 0;
		this.lastPause = 0;
		this.startTime = null;
		this.currentBuffers = new Array();
		this.currentBuffers[0] = new AudioPart(buffer, 0, 0, buffer.duration);
		console.log("ADDED AS CURRENT");
		
		cb && cb(buffer);
		
           
	},
    /**
     * Loads audiobuffer.
     *
     * @param {AudioBuffer} audioData Audio data.
     */
    loadData: function (audiobuffer, cb, errb) {
		console.log("LOADIN DATA");
        var my = this;

        this.pause();

        this.ac.decodeAudioData(
            audiobuffer,
            function (buffer) {
				console.log("LOADED TH EDATA");
                my.currentBuffer = buffer;
                my.lastStart = 0;
                my.lastPause = 0;
                my.startTime = null;
				my.currentBuffers = new Array();
				my.currentBuffers[0] = new AudioPart(buffer, 0, 0, buffer.duration);
				console.log("ADDED AS CURRENT");
                cb && cb(buffer);
            },
            function () {
                //console.error('Error decoding audio buffer');
                errb && errb();
            }
        );
    },

    isPaused: function () {
        return this.paused;
    },

    getDuration: function () {
        return this.currentBuffer && this.currentBuffer.duration;
    },

    /**
     * Plays the loaded audio region.
     *
     * @param {Number} start Start offset in seconds,
     * relative to the beginning of the track.
     *
     * @param {Number} end End offset in seconds,
     * relative to the beginning of the track.
     */
    play: function (start, end, delay) {
        if (!this.currentBuffer) {
            return;
        }

        this.pause();
		
		this.players = playArray(this.currentBuffers, this.ac, this, start);
		this.paused = false;
		/*
        this.setSource(this.ac.createBufferSource());
        this.source.buffer = this.currentBuffer;

		*/

        if (null == start) { start = this.getCurrentTime(); }

        if (null == end  ) { end = this.source.buffer.duration; }
        if (null == delay) { delay = 0; }

        this.lastStart = start;
        this.startTime = this.ac.currentTime;
		/*
        this.source.noteGrainOn(delay, start, end - start);

        this.paused = false;
		*/
    },

    /**
     * Pauses the loaded audio.
     */
    pause: function (delay) {
        if (!this.currentBuffer || this.paused) {
            return;
        }

        this.lastPause = this.getCurrentTime();

        this.source.noteOff(delay || 0);

        this.paused = true;
    },

    /**
     * @returns {Float32Array} Array of peaks.
     */
    getPeaks: function (length, sampleStep) {
        sampleStep = sampleStep || 100;
        var buffer = this.currentBuffer;
        var k = buffer.length / length;
        var peaks = new Float32Array(length);

        for (var c = 0; c < buffer.numberOfChannels; c++) {
            var chan = buffer.getChannelData(c);

            for (var i = 0; i < length; i++) {
                var peak = -Infinity;
                var start = ~~(i * k);
                var end = (i + 1) * k;
                for (var j = start; j < end; j += sampleStep) {
                    var val = chan[j];
                    if (val > peak) {
                        peak = val;
                    } else if (-val > peak) {
                        peak = -val;
                    }
                }

                if (c > 0) {
                    peaks[i] += peak;
                } else {
                    peaks[i] = peak;
                }
            }
        }

        return peaks;
    },

    getPlayedPercents: function () {
        var duration = this.getDuration();
		//.log("DURATION = " + duration);
        return duration > 0 ? this.getCurrentTime() / duration : 0;
    },

    getCurrentTime: function () {
        if (this.isPaused()) {
			return this.lastPause;
		} 
			else {
				return this.lastStart + (this.ac.currentTime - this.startTime);
        }
    },

    /**
     * Returns the real-time waveform data.
     *
     * @return {Uint8Array} The waveform data.
     * Values range from 0 to 255.
     */
    waveform: function () {
        this.analyser.getByteTimeDomainData(this.byteTimeDomain);
        return this.byteTimeDomain;
    },

    /**
     * Returns the real-time frequency data.
     *
     * @return {Uint8Array} The frequency data.
     * Values range from 0 to 255.
     */
    frequency: function () {
        this.analyser.getByteFrequencyData(this.byteFrequency);
        return this.byteFrequency;
    }
};

WaveSurfer.util.extend(WaveSurfer.WebAudio, Observer);
