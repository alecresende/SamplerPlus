// Fix up prefixing
'use strict';

console.log("HELLO");
var counter = 0;
var source = null;
var wavesurfer;

/*
var playImage = new Image();
image.src("play.png");

var pauseImage = new Image();
image.src("stop.png");
*/
var lastQuery = "wsgsdgsdgdsg";
var dogBarkingBuffer = null;
// Fix up prefixing
window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();

function loadSample(url) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function() {
    context.decodeAudioData(request.response, function(buffer) {
      dogBarkingBuffer = buffer;
	  playSound(dogBarkingBuffer);
    });
  }
  request.send();
}

//loadDogSound("http://localhost:3000/sound/alec-temp1.wav");

function playSound(buffer) {
	if(source!=null)
		source.disconnect();
  source = context.createBufferSource(); // creates a sound source
  source.buffer = buffer;                    // tell the source which sound to play
  source.connect(context.destination);       // connect the source to the context's destination (the speakers)
  source.start(0);                           // play the source now
                                             // note: on older systems, may have to use deprecated noteOn(time);
}

function makeWavesurfer(buf) {
	
	/*
	wavesurfer = Object.create(WaveSurfer);
	wavesurfer.on('ready', function () {
			wavesurfer.playAt(0);
		});
	
	wavesurfer.on('mark', function (marker) {
			var pos = marker.position;
			
			(function animate (width) {
				webkitRequestAnimationFrame(function () {
						marker.update({ width: width });
						width > 1 && animate(width - 1);
					});
			}(10));
		});
	
	
	// init & load mp3
	wavesurfer.init({
			container     : document.querySelector('.waveform'),
				fillParent    : true,
				markerColor   : 'rgba(0, 0, 0, 0.5)',
				frameMargin   : 0.1,
				maxSecPerPx   : parseFloat(location.hash.substring(1)),
				loadPercent   : true,
				waveColor     : 'violet',
				progressColor : 'orange',
				loaderColor   : 'red',
				selectionColor : 'yellow',
				cursorColor   : 'navy'
				});
	
	wavesurfer.bindMarks();
	
	wavesurfer.bindDragNDrop();
	//	wavesurfer.bindDragNDrop();

	*/
	wavesurfer.loadFromBuffer(buf);
}
function showWaveForm(path) {
	

	wavesurfer = Object.create(WaveSurfer);
	
	wavesurfer.on('ready', function () {
			wavesurfer.playAt(0);
		});
	
	wavesurfer.on('mark', function (marker) {
			var pos = marker.position;
			
			(function animate (width) {
				webkitRequestAnimationFrame(function () {
						marker.update({ width: width });
						width > 1 && animate(width - 1);
					});
			}(10));
		});
	
	// init & load mp3
	wavesurfer.init({
			container     : document.querySelector('.waveform'),
				fillParent    : true,
				markerColor   : 'rgba(0, 0, 0, 0.5)',
				frameMargin   : 0.1,
				maxSecPerPx   : parseFloat(location.hash.substring(1)),
				loadPercent   : true,
				waveColor     : 'violet',
				progressColor : 'orange',
				loaderColor   : 'red',
				selectionColor : 'yellow',
				cursorColor   : 'navy'
				});
	
	wavesurfer.bindMarks();
	
	wavesurfer.bindDragNDrop();
	
	wavesurfer.load(path);

	var image = $('<img src=\"pause.png\"\\>').load(function() {
			$(this).width(30).height(30).prependTo(name);
		});

	image.click(function() {
			wavesurfer.playPause();
		});
	$('.surround').prepend(image);

	var cropImage = $('<img src=\"scissor.png\"\\>').load(function() {
			$(this).width(50).height(50).prependTo(name);
		});

	var surrounding = $('.surround');

	cropImage.click(function() {
			
			/*
			$('.waveform').remove();
			var wa = $("<div>").attr({"class" : "waveform"});
			surrounding.append(wa);
			
			*/
			var buf = wavesurfer.crop();
			makeWavesurfer(buf);
			
		});
	
	$('.surround').prepend(cropImage);
	$('.surround').prepend(image);
	
}

function updateView(data) {
	$("#views").empty();
	var container = $("<div />").attr({id : "user"});
	$.each(data, function(i) {
			var name = $("<ul /> ").text(data[i].Title + " ("+data[i].Tags+")");
			name.attr({id : "sample"});
			var flag = false;
			name.click(function() {
					if(!flag) {
						console.log(data[i]);
						$('.surround').remove();
						$('.waveform').remove();
						var surround = $("<div>").attr({"class" : "surround"});
						var wa = $("<div>").attr({"class" : "waveform"});
						surround.append(wa);
						name.append(surround);
						showWaveForm(data[i].Path.replace("/var/www/upload/", "/sound/"));
					}
					flag = true;

					
				});
			/*
			
			image.click(function() { 
					if(source != null) {
						source = null;
						image.attr({'src' : "play.png"});
						
						console.log("PLAY");
						wavesurfer.playPause();
					}
					else {
						source = 1;
						wavesurfer.playPause();
						console.log("FUCKED");
						image.attr({'src' : "stop.png"});
					}
				
				}

				);

			*/

			container.append(name);
		});
	$("#views").append(container);
	
}

function browse() {
	$.getJSON('browseJSON', function(data) {
			var items = [];
			updateView(data);
			
			$("input.textinput").keydown(function() {
					var text = $("input.textinput").val();
					if(text=="") {
						if(lastQuery == "")
							return;
						browse();
						lastQuery = "";
						return;
					}
					
				});

			$("input.textinput").keyup(function() { 
					counter++;
					var text = $("input.textinput").val();
					if(text=="") {
						if(lastQuery == "")
							return;
						lastQuery = "";
						browse();
						return;
					}
					text.replace(", ", "+");
					text.replace(",", "+");
					text.replace(" ", "");

					if( lastQuery.indexOf(text) == -1 ) {
					
					$.getJSON('tags/'+text, function(data) {
							if(data==null) return;
							updateView(data);
						});
					lastQuery = text;
					}
					
					
				});
			
		});	
}

$("#sample").click(function() { console.log("WHAT"); });

browse();

$("input.textinput").val("Type Some Tags");

console.log("hello");

