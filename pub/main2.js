'use strict';

function SavedSample(name, blob, tags) {
	var arrayBuffer;
	var fileReader = new FileReader();
	var my = this;
	fileReader.onload = function() {
		arrayBuffer = this.result;
    	my.blob= arrayBuffer;
		
	};
	fileReader.readAsArrayBuffer(blob);
	this.Title = name;
	this.Tags = tags;
}


var mainEditor = null;
var otherEditor = null;

var clipboardEditor = null;

var otherWaveforms = false;

console.log("HELLO");
var counter = 0;
var source = null;



var waveList = [];

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

var clipboard = null;

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

function makeWavesurfer(editor_obj, buf) {
	editor_obj.loadFromBuffer(buf);
}

var first_time = true;

function showWaveForm(path, whereTo, surround) {
	

	if(mainEditor != null)
		mainEditor.pause();

	first_time = false;
	var wavesurfer = Object.create(WaveSurfer);
	
	console.log("WRITING WHAT");
	/*	wavesurfer.on('ready', function () {
			wavesurfer.playAt(0);
		});
	*/	
	wavesurfer.on('mark', function (marker) {
			var pos = marker.position;
			
			(function animate (width) {
				webkitRequestAnimationFrame(function () {
						marker.update({ width: width });
						width > 1 && animate(width - 1);
					});
			}(10));
		});
	
	if(mainEditor) {
		wavesurfer.init({
				container     : document.querySelector(whereTo),
					AudioContext : mainEditor.backend.ac,
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
	}
	// init & load mp3
	else {
		wavesurfer.init({
				container     : document.querySelector(whereTo),
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
	}
	
	wavesurfer.bindMarks();
	
	wavesurfer.bindDragNDrop();
	
	wavesurfer.load(path);

	var image = $('<img src=\"pause.png\"\\>').load(function() {
			$(this).width(30).height(30).prependTo(name);
		});

	image.click(function() {
			wavesurfer.playPause();
		});
	surround.prepend(image);

	var cropImage = $('<img src=\"scissor.png\"\\>').load(function() {
			$(this).width(50).height(50).prependTo(name);
		});

	var pasteImage = $('<img src=\"paste-icon.png\"\\>').load(function() {
			$(this).width(30).height(30).prependTo(name);
		});

	var deleteImage = $('<img src=\"delete-icon.png\"\\>').load(function() {
			$(this).width(30).height(30).prependTo(name);
		});

	deleteImage.click(function() {
			mainEditor.stop();
			mainEditor.close();
			mainEditor = null;
			$("#main-editor").remove();
			$(".waveform").remove();
			$(".surround").remove();
			otherWaveforms = false;
			
		});

	pasteImage.click(function() {
			console.log("PASTE");
			if(clipboard) {
				wavesurfer.insertAt(clipboard);
			}
		});

	var mixImage = $('<img src=\"mix.jpg\"\\>').load(function() {
			$(this).width(30).height(30).prependTo(name);
		});

	var silenceImage = $('<img src=\"silence.jpg\"\\>').load(function() {
			$(this).width(30).height(30).prependTo(name);
		});

	silenceImage.click(function() {
			var buf = wavesurfer.replaceWithSilence();
			makeWavesurfer(wavesurfer, buf);
		
		});

	var copyImage= $('<img src=\"copy-icon.png"\\>').load(function() {
			$(this).width(30).height(30).prependTo(name);
		});

	copyImage.click(function() {
			var buf = wavesurfer.copy();
			clipboard = buf;
			clipboardEditor = wavesurfer;
		});

	
	mixImage.click(function() {
			if(clipboard) {
				wavesurfer.mixAt(clipboard);
			}
		});

	var surrounding = surround;

	cropImage.click(function() {
			
			/*
			$('.waveform').remove();
			var wa = $("<div>").attr({"class" : "waveform"});
			surrounding.append(wa);
			
			*/
			var buf = wavesurfer.crop();
			clipboard=buf;
			clipboardEditor = wavesurfer;
			makeWavesurfer(wavesurfer, buf);
			
		});
	
	surround.prepend(deleteImage);
	surround.prepend(silenceImage);
	surround.prepend(mixImage);
	surround.prepend(pasteImage);
	surround.prepend(copyImage);
	surround.prepend(cropImage);
	surround.prepend(image);
	
	
	return wavesurfer;
	
}



function showWaveForm2(path, whereTo, surround) {
	

	if(mainEditor != null)
		mainEditor.pause();

	first_time = false;
	var wavesurfer = Object.create(WaveSurfer);
	
	console.log("WRITING WHAT");
	/*	wavesurfer.on('ready', function () {
			wavesurfer.playAt(0);
		});
	*/	
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
			container     : document.querySelector(whereTo),
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
	
	wavesurfer.loadObject(path);

	var image = $('<img src=\"pause.png\"\\>').load(function() {
			$(this).width(30).height(30).prependTo(name);
		});

	image.click(function() {
			wavesurfer.playPause();
		});
	surround.prepend(image);

	var cropImage = $('<img src=\"scissor.png\"\\>').load(function() {
			$(this).width(50).height(50).prependTo(name);
		});

	var copyImage= $('<img src=\"copy-icon.png"\\>').load(function() {
			$(this).width(30).height(30).prependTo(name);
		});

	copyImage.click(function() {
			var buf = wavesurfer.copy();
			clipboard = buf;
			clipboardEditor = wavesurfer;
		});

	var surrounding = surround;

	cropImage.click(function() {
			
			/*
			$('.waveform').remove();
			var wa = $("<div>").attr({"class" : "waveform"});
			surrounding.append(wa);
			
			*/
			var buf = wavesurfer.crop();
			clipboard=buf;
			clipboardEditor = wavesurfer;
			makeWavesurfer(wavesurfer, buf);
			
		});
	
	surround.prepend(copyImage);
	surround.prepend(cropImage);
	
	surround.prepend(image);
	
	return wavesurfer;
	
}

function newWaveFromBuffer(buff, whereTo) {
	
	if(mainEditor != null)
		mainEditor.pause();

	first_time = false;
	var wavesurfer = Object.create(WaveSurfer);
	
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
			container     : whereTo,
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
	
	wavesurfer.loadFromBuffer(buff);

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
			clipboard=buf;
			makeWavesurfer(buf);
			
		});
	
	$('.surround').prepend(cropImage);
	$('.surround').prepend(image);
	
	return wavesurfer;
}


function updateView(data) {
	$("#views").empty();
	var container = $("<div />").attr({id : "user"});

	console.log("WHYYYYYYYYYYY " + data);
	$.each(waveList, function(i) {
			var name = $("<ul /> ").text(waveList[i].Title + " ("+waveList[i].Tags+")");
			var flag = false;
			name.attr({id : "sample"});
			name.click(function() {
					console.log("OKAY");
					if(!flag) {
						var surround = $("<div>").attr({"class" : "surround"});
						var wa = $("<div>").attr({"class" : "waveform"});

						surround.append(wa);
						name.append(surround);
						showWaveForm2(waveList[i].blob, ".waveform", surround );
						console.log("SHUDDA WORKED &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&7");
					}
					flag = true;
					
					
				});
			container.append(name);
		
		});
	$.each(data, function(i) {
			console.log(data[i].Title);
			var name = $("<ul /> ").text(data[i].Title + " ("+data[i].Tags+")");
			name.attr({id : "sample"});
			var flag = false;
			name.click(function() {
					
					console.log("CLICKED THE DAMN SHIT");
					if(!flag) {
						console.log("BUJUUUUUUUUUUU");
						if(mainEditor == null) {
							var myName = $("#mainSample");
							console.log(data[i]);

							var surround = $("<div>").attr({"class" : "surround",
															"id" : "main-editor"});
							var wa = $("<div>").attr({"class" : "waveform", 
													  "id" : "main-editor"});
							surround.append(wa);
							myName.append(surround);
							var wav = showWaveForm(data[i].Path.replace("/var/www/upload/", "/sound/"), ".waveform", surround);
							mainEditor = wav;
							
						}
						else {
							if(otherWaveforms) {
								if($(".waveform").length > 1) {
									$(".waveform")[0].remove();
									$(".surround")[0].remove();
									otherEditor.stop();
									otherEditor.close();
									
									otherEditor = null;
								}
							}
							var surround = $("<div>").attr({"class" : "surround"});
							var wa = $("<div>").attr({"class" : "waveform"});
							surround.append(wa);
							name.append(surround);
							otherEditor =  showWaveForm(data[i].Path.replace("/var/www/upload/", "/sound/"), ".waveform", surround);
							otherWaveforms = true;
						}
						
						flag = true;
					}
					else {
						
					}
				});
		
			console.log("YOOOO");
			container.append(name);
		});
	$("#views").append(container);
	
}

var first_time_flag = true;

function browseFolders() {
	$("#views").empty();
	
	$.getJSON('folders', function(data) {
		console.log("**********");
		console.log(data);
		var container = $("<div />").attr({id : "user"});
		$.each(data, function(n) {
			console.log("Yo "+n);
			var name = $("<ul /> ").text(n);
			console.log(data[n]);
			name.attr({id : "folder"});


			$("#views").append(name);
			
			name.click(function () {
				var header = $("#header");
				var shit = $("<h2/>").text(n);


				var image = $('<img src=\"edit-icon.png\"\\>').load(function() {
					$(this).width(30).height(30);
				});
			
				image.click(function() {
					console.log("contents = " + data[n]);
					newFolder(n, data[n]);
				});

				header.append(shit);
				header.append(image);

				updateView($.map(data[n], function(x) { return x[0];}));
				
			});
		});
		$("#views").append(container);
	});
}

function browse() {

	$.getJSON('browseJSON', function(data) {
			var items = [];
			if(first_time_flag) {
				$('img.save').click(function () {
						var wavesurfer = clipboardEditor;
						wavesurfer.pause();
						var name_of_sample = prompt("Name of sample: ");
						console.log(name_of_sample);
						var tags = prompt("Tags: ");
						console.log(tags);
						// get the clipboard
						

						var clip = clipboard;
						console.log("GONNA RENDER");
						var url = wavesurfer.render();
						console.log("RENDERED");
						var samp = new SavedSample(name_of_sample,
											   url,
												   tags);

						var data_form = new FormData();

						data_form.append('name', name_of_sample);
						data_form.append('tags', tags);
						data_form.append('file', url, name_of_sample+"-"+tags+".wav");
						$.ajax({
								url: 'upload',
									data: data_form,
									cache: false,
									contentType: false,
									processData: false,
									type: 'POST',
									success: function(data){
								}
							});
						
						waveList.push(samp);
						if(samp.blob == null)
							console.log("SOMTHING WENT WRONG");
						updateView(data);



					});

				$('img.paste').click(function () {
						var context = wavesurfer.backend.ac;
						var part1 = wavesurfer.backend.currentBuffer;
						var part2 = clipboard;
						var timeCursor = wavesurfer.drawer.last_progress * part1.duration;
						
						var newBuf = insertAt(context, part1, part2, timeCursor);
						makeWavesurfer(newBuf);
						
					});

				first_time_flag = false;
			}
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

