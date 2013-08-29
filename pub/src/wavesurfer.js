// Edited from wavesurfer.js
// found at https://github.com/katspaugh/wavesurfer.js/

'use strict';

var WaveSurfer = {
    defaultParams: {
        skipLength: 2
    },

    init: function (params) {
        // extract relevant parameters (or defaults)
        this.params = WaveSurfer.util.extend({}, this.defaultParams, params);

		this.isDragging = false;

        this.drawer = Object.create(WaveSurfer.Drawer);
        this.drawer.init(this.params);
		this.weirdDrawer = null;
		
		this.selectionStart = 0;
		this.selectionEnd = 1;
		this.selected = false;

        this.markers = {};
		this.m = null;

        this.createBackend();
        this.bindClick();
    },

    createBackend: function () {
        this.backend = Object.create(WaveSurfer.WebAudio);
        this.backend.init(this.params);
        var my = this;
        var last;
        this.backend.on('audioprocess', function (progress) {
            last = Date.now();
            webkitRequestAnimationFrame(function (t) {
                if (last < t) {
                    my.onAudioProcess(progress);
                }
            });
        });
    },

	render: function(name) {
		var blob =  this.backend.render(name);
		console.log("AGAIN BLOB = " + blob.size);
		return blob;
	},
	
	close: function() {
		this.backend.close();
		delete this.backend;
	},

	getAdjustedPercent: function() {
			var dura = this.backend.getDuration();
			/*
			console.log("SELECT TIME = " + this.backend.ac.currentTime);
			console.log("DURATION = " + this.backend.getDuration());
			console.log("START TIME = " + this.backend.startTime);
			console.log("FIRST START  = " + this.backend.firstStart);
			*/
			var loopTime = (this.selectionEnd * dura) - (this.selectionStart * dura);
			var timeElapsed =  this.backend.totalElapsed + this.backend.ac.currentTime - this.backend.startTime; 


			if (this.backend.isPaused())
				timeElapsed = this.backend.totalElapsed  


			var posInLoop = timeElapsed % loopTime;
			
			var startTime  = this.backend.getLoopStart();

			var exactLocation = startTime + posInLoop;
			return exactLocation / dura;
	},

    onAudioProcess: function (progress) {
		if( progress >= 1.0) {
		}
        // pause when finished
		/*
        if (progress >= 1.0) {
            this.pause();
        }
		*/
		if(this.drawer == null)
			console.log("**********************************");

		if(this.selected) {
			
			var adj = this.getAdjustedPercent();
			this.drawer.progress(adj);

		}

		else
			this.drawer.progress(progress - Math.floor(progress));


        this.fireEvent('progress', progress);
    },

    playAt: function (percents) {
		console.log("wavesurfer.playAt("+percents+")");
        this.backend.play(this.backend.getDuration() * percents);
    },

    pause: function () {
        this.backend.pause();
    },

    playPause: function () {
        if (this.backend.paused) {
			
            var playedPercent = this.backend.getPlayedPercents();
            if (playedPercent >= 1.0) {
				playedPercent = 0;
				console.log("PLAY PAUSED");
			}
            this.playAt(playedPercent);
        } else {
			console.log("PAUSE!");
            this.pause();
        }
    },

    skipBackward: function (seconds) {
        this.skip(seconds || -this.params.skipLength);
    },

    skipForward: function (seconds) {
        this.skip(seconds || this.params.skipLength);
    },

    skip: function (offset) {
        var timings = this.timings(offset);
        var progress = timings[0] / timings[1];

        this.seekTo(progress);
    },

    seekTo: function (progress) {
        var paused = this.backend.paused;
        this.playAt(progress);
        if (paused) {
            this.pause();
            this.drawer.progress(progress);
        }
        this.fireEvent('seek', progress);
    },

    stop: function () {
        this.playAt(0);
        this.pause();
        this.drawer.progress(0);
    },

    mark: function (options) {
        var my = this;
        var timings = this.timings(0);
		
		console.log("MARK timings = " + timings);
		console.log("MARK");
        var opts = WaveSurfer.util.extend({
            id: WaveSurfer.util.getId(),
            position: timings[0]
        }, options);

        opts.percentage = opts.position / timings[1];

        var marker = Object.create(WaveSurfer.Mark);

        marker.on('update', function () {
            my.drawer.addMark(marker);
            my.markers[marker.id] = marker;
        });

        marker.on('remove', function () {
            my.drawer.removeMark(marker);
            delete my.markers[marker.id];
        });

        return marker.update(opts);
    },

    clearMarks: function () {
        Object.keys(this.markers).forEach(function (id) {
            this.markers[id].remove();
        }, this);
    },

    timings: function (offset) {
        var position = this.backend.getCurrentTime() || 0;
        var duration = this.backend.getDuration() || 1;
        position = Math.max(0, Math.min(duration, position + offset));
        return [ position, duration ];
    },

    isReady: function () {
        return this.backend.currentBuffer;
    },

    drawBuffer: function () {
        // Update percentage on any markers added before the audio loaded.
		console.log("DRAWING YALL");
        var duration = this.backend.getDuration() || 1;
        Object.keys(this.markers).forEach(function (id) {
            var marker = this.markers[id];
            marker.update({ percentage: marker.position / duration });
        }, this);

        var peaks = this.backend.getPeaks(this.drawer.width);
        var max = -Infinity;
        for (var i = 0; i < this.drawer.width; i++) {
            var val = peaks[i];
            if (val > max) { max = val; }
        }

		console.log("DRAWING");
        this.drawer.drawPeaks(peaks, max);

        this.fireEvent('ready');
    },

	loadFromBuffer: function (buf) {
		console.log("LOAD FROM BUFFER BUFFER ***");
		this.backend.loadData2(
                buf,
                this.drawBuffer.bind(this)
							  );
	},

	mixAt: function (buf) {

		var dura = this.backend.currentBuffer.duration;
		var pro = this.drawer.last_progress * dura;
		var newBuff = mixAt(this.backend.ac, this.backend.currentBuffer, buf, pro);
		this.loadFromBuffer(newBuff);

	},
	insertAt: function (buf) {
		
		console.log("CLIPBOARD IS " + buf.duration + " seconds");
		var dura = this.backend.currentBuffer.duration;
		console.log("LAST PROGRESS = " + this.drawer.last_progress);
		var pro = this.drawer.last_progress * dura;
		
		console.log("INSDERT AT " + pro);
		
		var newBuff = insertAt(this.backend.ac, this.backend.currentBuffer, buf, pro);
		this.loadFromBuffer(newBuff);
		
	},

	loadObject: function (url) {
		var my = this;
		
		console.log("URL LENGTH = "+ url.byteLength);
		my.drawer.loading(1);
		my.backend.loadData(
							url,
							my.drawBuffer.bind(my)
							)
},

    /**
     * Loads an audio file via XHR.
     */
    load: function (url) {
        var my = this;
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'arraybuffer';

        xhr.addEventListener('progress', function (e) {
            var percentComplete;
            if (e.lengthComputable) {
                percentComplete = e.loaded / e.total;
            } else {
                // TODO
                // for now, approximate progress with an asymptotic
                // function, and assume downloads in the 1-3 MB range.
                percentComplete = e.loaded / (e.loaded + 1000000);
            }
            my.drawer.loading(percentComplete);
        }, false);

        xhr.addEventListener('load', function (e) {
            my.drawer.loading(1);
            my.backend.loadData(
                e.target.response,
                my.drawBuffer.bind(my)
            );
        }, false);

        xhr.open('GET', url, true);
        xhr.send();
    },

    /**
     * Loads an audio file via drag'n'drop.
     */
    bindDragNDrop: function (dropTarget) {
        var my = this;
        var reader = new FileReader();
        reader.addEventListener('load', function (e) {
            my.backend.loadData(
                e.target.result,
                my.drawBuffer.bind(my)
            );
        }, false);

        (dropTarget || document).addEventListener('drop', function (e) {
            e.preventDefault();
            var file = e.dataTransfer.files[0];
            file && reader.readAsArrayBuffer(file);
        }, false);
    },


	crop: function() {
		
		var buf = this.backend.currentBuffer;
		var start = this.selectionStart * this.backend.getDuration();
		var finish = this.selectionEnd * this.backend.getDuration();

		var cropped_buf = crop(this.backend.ac, buf, start, finish);
		this.selected = false;
		this.drawer.select(0,1);
		
		
		return cropped_buf;
	},
	
	replaceWithSilence: function() {
		var buf = this.backend.currentBuffer;
		var start = this.selectionStart * this.backend.getDuration();
		var finish = this.selectionEnd * this.backend.getDuration();

		var modified = replaceWithSilence(this.backend.ac, buf, start, finish);
		this.drawer.select(0,1);
		
		
		return modified;
		
	},

	copy: function() {
		var buf = this.backend.currentBuffer;
		var start = this.selectionStart * this.backend.getDuration();
		var finish = this.selectionEnd * this.backend.getDuration();

		var modified = copySelection(this.backend.ac, buf, start, finish);
		console.log("DURATION OF MODIFIED = " + modified.duration);
		
		return modified;
	
	},

    /**
     * Click to seek.
     */
    bindClick: function () {
        var my = this;
		
		this.drawer.container.draggable = 'true';

		var my = this;
		this.drawer.container.addEventListener('dragstart', function (e) {
				e.preventDefault();
				var relX = e.offsetX;
				my.isDragging = true;
				if (null == relX) { relX = e.layerX; }
				var progress = relX / my.drawer.width;
				my.selectionStart = progress;
				console.log("DRAG START********** " + progress);
			});

		$(this.drawer.container).mousemove(function (e) {
				if(my.isDragging) {
					console.log("FUCKKKK");
					
					var relX = e.offsetX;
					if (null == relX) { relX = e.layerX; }
					var progress = relX / my.drawer.width;
					my.selectionEnd = progress;
					my.selected = true;
					console.log("DRAG END******");
					
					//my.seekTo(my.selectionStart);
					my.backend.selection(my.selectionStart, my.selectionEnd);
					
					my.drawer.select(my.selectionStart, my.selectionEnd);
					
					/*
					console.log("ABOUT TO PLAY!");
					my.playPause();
					*/
					
				}
			
			});

		this.drawer.container.addEventListener('mouseup', function (e) {
				if(my.isDragging) {
					var relX = e.offsetX;
					my.isDragging = false;
					if (null == relX) { relX = e.layerX; }
					var progress = relX / my.drawer.width;
					my.selectionEnd = progress;
					my.selected = true;
					console.log("DRAG END******");
					
					my.seekTo(my.selectionStart);
					my.backend.selection(my.selectionStart, my.selectionEnd);
					
					my.drawer.select(my.selectionStart, my.selectionEnd);
				}
				
			});

		document.addEventListener('keydown', function(e) {
			e.preventDefault();
			console.log("YOOOOOOOOOOOOOOOOOOOOOOOOOOOO " + e.keyCode);
			if(e.keyCode == 32) {
				var timings = my.timings(0);
				var per = timings[0]/timings[1];
				var marker = Object.create(WaveSurfer.Mark);
				marker.percentage = per;
				marker.id = 'paste-mark';
				console.log("Space is pressed at " + per );
				my.drawer.addMark(marker);
			}
			
		});
											   
        this.drawer.container.addEventListener('click', function (e) {
				console.log("SEEKING");
				var relX = e.offsetX;
				if (null == relX) { relX = e.layerX; }
				var progress = relX / my.drawer.width;
				
				my.seekTo(progress);
            my.fireEvent('click', progress);
        }, false);
    },

    normalizeProgress: function (progress, rounding) {
        rounding = rounding || this.drawer.width;
        return Math.round(progress * rounding) / rounding;
    },

    bindMarks: function () {
		console.log("BIND MARKS!!!");
        var my = this;
        var markers = this.markers;

        this.on('progress', function (progress) {

            var normProgress = my.normalizeProgress(progress);


            Object.keys(markers).forEach(function (id) {
                var marker = markers[id];
                var normMark = my.normalizeProgress(marker.percentage);
                if (normMark == normProgress) {
                    my.fireEvent('mark', marker);
                    marker.fireEvent('reached');
                }
            });
        });
    },


    util: {
        extend: function (dest) {
            var sources = Array.prototype.slice.call(arguments, 1);
            sources.forEach(function (source) {
                if (source != null) {
                    Object.keys(source).forEach(function (key) {
                        dest[key] = source[key];
                    });
                }
            });
            return dest;
        },

        getId: function () {
            return 'wavesurfer_' + Math.random().toString(32).substring(2);
        }
    }
};

WaveSurfer.util.extend(WaveSurfer, Observer);


/* Mark */
WaveSurfer.Mark = {
    id: null,
    percentage: 0,
    position: 0,

    update: function (options) {
        WaveSurfer.util.extend(this, options);
        this.fireEvent('update');
        return this;
    },

    remove: function () {
        this.fireEvent('remove');
    }
};

WaveSurfer.util.extend(WaveSurfer.Mark, Observer);
