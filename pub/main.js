
var wavesurfer = null;

function showWaveForm(path, whereTo) {
	
	
	first_time = false;
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
	
	wavesurfer.load(path);

	var image = $('<img src=\"pause.png\"\\>').load(function() {
			$(this).width(30).height(30).prependTo(name);
		});

	image.click(function() {
			wavesurfer.playPause();
		});
	$('.surroundMain').prepend(image);

	var cropImage = $('<img src=\"scissor.png\"\\>').load(function() {
			$(this).width(50).height(50).prependTo(name);
		});

	var surrounding = $('.surroundMain');

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
	
	$('.surroundMain').prepend(cropImage);
	$('.surroundMain').prepend(image);
	return wavesurfer;
	
}


var savedSamples = [];

function updateView(data) {
	$("#views").empty();
	var container = $("<div />").attr({id : "user"});

	$.each(savedSamples, function(i) {
			console.log("FUCK MEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE" + savedSamples[i].Title);
			var name = $("<ul /> ").text(savedSamples[i].Title + " ("+savedSamples[i].Tags+")");
			var flag = false;
			name.attr({id : "sample"});
			name.click(function() {
					if(mainEditor == null) {
						
					}
					if(!flag) {
						console.log(data[i]);
						$('.surround').remove();
						$('.waveform').remove();
						var surround = $("<div>").attr({"class" : "surround"});
						var wa = $("<div>").attr({"class" : "waveform"});
						surround.append(wa);
						name.append(surround);
						newWaveFromBuffer(savedSamples[i].buffer);
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
					if(!flag) {
						console.log(data[i]);
						$('.surroundMain').remove();
						$('.waveformMain').remove();
						var surround = $("<div>").attr({"class" : "surroundMain"});
						var wa = $("<div>").attr({"class" : "waveformMain"});
						surround.append(wa);
						name.append(surround);
						showWaveForm(data[i].Path.replace("/var/www/upload/", "/sound/"), ".waveformMain");
						
					}
					flag = true;

					
				});
		
			container.append(name);
		});
	$("#views").append(container);
	
}
var first_time_flag = true;

function browse() {

	$.getJSON('browseJSON', function(data) {
			var items = [];
			/*
			if(first_time_flag) {
				$('img.save').click(function () {
						wavesurfer.pause();
						var name_of_sample = prompt("Name of sample: ");
						console.log(name_of_sample);
						var tags = prompt("Tags: ");
						console.log(tags);
						// get the clipboard
						

						var clip = clipboard;
						var samp = new SavedSample(name_of_sample,
											   clip,
											   tags);
						waveList.push(samp);
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

			}
			*/
			first_time_flag = false;
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

browse();