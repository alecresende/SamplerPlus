//
// samples is an array of samples with each element having a Tags, Title, and Path field
// name is simply the name of the folder

function Folder(name, samples) {
	
	this.name = name;
	this.samples = samples;
}

function SamplePointer(Title, Tags, Path) {
	this.Title = Title;
	this.Tags = Tags;
	this.Path = Path;
}


function folders() {
	browseFolders();	

}

// Make a folder with folderName w/ contents being a list of stuff that's 
// selected already

function newFolder(folderName, contents) {
	
	document.body.innerHTML = "";
	
	var listWidget = $("<ol>").attr({"id" : "selectable"});
	
	$.getJSON('browseJSON', function (data) {
			$.each(data,
				   function (i) {
					  
					   var ul = $("<ul>").text(data[i].Title + " (" + data[i].Tags + ")");
					   ul.attr({"class" : "ui-widget-content",
								   "name" : data[i].Title,
								   "tags" : data[i].Tags,
								   "path" : data[i].Path
								   });

					   var title_contents = $.map(contents, function(x) {
						   return x[0].Title; });

					   console.log("*****");
					   console.log(title_contents);
					   if(title_contents.indexOf(data[i].Title) > -1) {
						   console.log(data[i].Title + " is in contents");
						   ul.attr({"class" : "ui-selected"});
					   }
					   
					   
					   listWidget.append(ul);
				   })
		});
	
	var folderContents = null;
	listWidget.selectable();

	listWidget.on("selectableselected", function (event, ui) {
			folderContents = $(".ui-selected");
			console.log($(".ui-selected"));
		});
	
	var image = $('<img src=\"add-icon.png\"\\>').load(function() {
			$(this).width(30).height(30).prependTo(name);
		});

	
	image.click(function () {
			if(folderContents) {
				var formdata = new FormData();
				var list = "";
				var mapped = $.map(folderContents, function (x) {
					if (list=="")
						list = $(x).attr("path");
					else
						list+=";"+($(x).attr("path"));
					return $(x);
				});
				
				var folderObj = new Folder(folderName, mapped);
				
				var formdata = new FormData();
				formdata.append("name", folderName);
				formdata.append("list", list);

				$.ajax({
						url: 'newFolder',
							data: formdata,
							cache: false,
							contentType: false,
							processData: false,
							type: 'POST',
							success: function(data){
								console.log("SUCCESS");
							}
				});
				
				document.location = "main.html";
					
			}
		});
	$("body").append(image);
	$("body").append($("<br>"));
	$("body").append(listWidget);

	// should look up a list of all the samples and allow the user to choose which ones should be added
}

setTimeout(function () {
	$("img.folders").click( function() {
		folders();
	});
	
	
	$("img.new-folder").click( function () {
		var folderName = prompt("What should we call this new folder?");
		newFolder(folderName, []);
	});
	
	
	$("img.upload").click( function () {
		document.location = "/";
	});
	
	console.log("Folder functions set up");
}, 1000);
