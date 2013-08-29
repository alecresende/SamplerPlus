// Edited from wavesurfer.js
// found at https://github.com/katspaugh/wavesurfer.js/

'use strict';

WaveSurfer.Drawer = {
    defaultParams: {
        waveColor     : '#999',
        progressColor : '#333',
        cursorColor   : '#ddd',
        markerColor   : '#eee',
        loaderColor   : '#000',
		selectionColor : '#c00',
        loaderHeight  : 2,
        cursorWidth   : 1,
        loadPercent   : false,
        markerWidth   : 1,
        container     : null
    },

    init: function (params) {
        this.params = WaveSurfer.util.extend({}, this.defaultParams, params);

        this.container = this.params.container;
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
		this.last_progress = 0;

        this.createSvg();
    },

    attr: function (node, attrs) {
        Object.keys(attrs).forEach(function (key) {
            node.setAttribute(key, attrs[key]);
        });
    },

    node: function (name, attrs) {
        var node = document.createElementNS('http://www.w3.org/2000/svg', name);
        attrs && this.attr(node, attrs);
        return node;
    },

    createSvg: function () {
		
		console.log("CREATOING THE SVG");
        var svg = this.node('svg', {
            viewBox: [ 0, 0, this.width, this.height ].join(' ')
        });

        var defs = this.node('defs');

        // Wave path
        var pathId = WaveSurfer.util.getId();
		console.log("PATH ID = " + pathId);
        var path = this.node('path', {
            id: pathId
        });
        defs.appendChild(path);

        // Progress clip
        var clipId = WaveSurfer.util.getId();
        var clip = this.node('clipPath', {
            id: clipId
        });
		console.log("CLIP ID = " + clipId);
        var clipRect = this.node('rect', {
            width: 0,
            height: this.height
        });


        clip.appendChild(clipRect);
        defs.appendChild(clip);

		/*
		var selectId = WaveSurfer.util.getId();
		var select = this.node('path', { id: selectId });
		var selectRect = this.node('rect', { width: 100, height : this.height });
		console.log("SELCT ID = " + selectId);
		select.appendChild(selectRect);
		defs.appendChild(select);
		*/
        var useWave = this.node('use', {
            stroke: this.params.waveColor,
            'class': 'wavesurfer-wave'
        });
        useWave.href.baseVal = '#' + pathId;

        var useClip = this.node('use', {
            stroke: this.params.progressColor,
            'clip-path': 'url(#' + clipId + ')',
            'class': 'wavesurfer-progress'
        });
        useClip.href.baseVal = '#' + pathId;
		/*
		var useSelect = this.node('use', {
				stroke : this.params.selectionColor,
				'clip-path': 'url(#' + selectId + ')',
				'class' : 'wavesurfer-selection' });
		useSelect.href.baseVal = "#" + selectId;
		*/

        var cursor = this.node('rect', {
            width: this.params.cursorWidth,
            height: this.height,
            fill: this.params.cursorColor
        });

		var selection = this.node('rect', {
				width : 0,
				height : this.height/6,
				fill : this.params.selectionColor 
			});
		
		$(selection).draggable({opacity : 0.5, "axis" : "x"});

        // Loader
        var loader = this.node('line', {
            x1: 0,
            x2: 0,
            y1: this.height / 2 - this.params.loaderHeight / 2,
            y2: this.height / 2 + this.params.loaderHeight,
            'stroke-width': this.params.loaderHeight,
            stroke: this.params.loaderColor
        });

        [ defs, useWave, useClip,  cursor, selection, loader ].forEach(function (node) {
            svg.appendChild(node);
        });

        this.container.appendChild(svg);

        this.svg = svg;
        this.wavePath = path;
        this.progressPath = clipRect;
		//this.selectPath = selectRect;
		this.selection = selection;
		
        this.cursor = cursor;
        this.loader = loader;
    },


    /* API */
    drawPeaks: function (peaks, max) {
		console.log("WHATEVER");
        var len = peaks.length;
        var height = this.height;
        var data = [];
        var factor = height / max;

        for (var i = 0; i < len; i++) {
            var h = Math.round(peaks[i] * factor);
            var y = Math.round((height - h) / 2);
            data.push('M', i, y, 'l', 0, h);
        }

        this.wavePath.setAttribute('d', data.join(' '));
        this.loader.style.display = 'none';
    },


	select: function (start, finish) {
		console.log("StART = " + start + " FINISH = " + finish);
		var a =  Math.round(start * this.width);
		var b =  Math.round(finish* this.width);
		this.selection.setAttribute('x', a);
		this.selection.setAttribute('width', b-a);
		console.log("WOAHHHHHHHHHH! x = " + a + " width : " + b-a);
		
	},

    progress: function (progress) {
		this.last_progress = progress;
        var pos = Math.round(progress * this.width);
        if (pos != this.lastPos) {
            this.progressPath.setAttribute('width', pos);
            this.cursor.setAttribute('x', pos);
            this.lastPos = pos;
        }
    },

    loading: function (progress) {
        this.loader.setAttribute('x2', Math.round(progress * this.width));
        this.loader.style.display = 'block';
    },

    addMark: function (mark) {
        var markRect = document.getElementById(mark.id);
        if (!markRect) {
            markRect = this.node('rect');
            markRect.setAttribute('id', mark.id);
            this.svg.appendChild(markRect);
        }
        this.attr(markRect, {
            fill: mark.color,
            width: mark.width || 1,
            height: this.height,
            x: Math.round(mark.percentage * this.width)
        });
    },

    removeMark: function (mark) {
        var markRect = document.getElementById(mark.id);
        if (markRect) {
            this.svg.removeChild(markRect);
        }
    }
};
