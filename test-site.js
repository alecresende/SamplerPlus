var express = require('express');
var mysql = require ('mysql');

var connection = mysql.createConnection({
		host : 'localhost',
		user : 'root',
		password : 'gaybriel'
	});

connection.connect();

var app = express();
var path = require('path');
var fs = require('fs');

app.use(express.bodyParser());

app.use(express.static(__dirname + '/pub'));

app.use('/sound', express.static(__dirname + '/upload'));

app.post('/search', function(req, res) {
		
		var name = req.body.name;
		console.log('search query : ' + name);
		
		var tags = name.split(",");
		
		var str = '';
		str += 'select * from Samples where Tags like \'%' + tags[0] + '%\' ';
		for (var i = 1 ; i < tags.length; i++) {
			str += 'UNION\n';
			str += 'select * from Samples where Tags like \'%' + tags[i] + '%\' ';
		}
		str += ';';
		console.log(str);

		connection.query('use samples;');
		connection.query(str, function(err, rows, fields) {
				for(var i=0 ; i<rows.length ;i++) {
					res.send("<a href=\"" + rows[i].Path.replace("/var/www/upload/", "/sound/") + "\"> " + rows[i].Title + " </a> <br>");
				}
				
			});
	});


app.post('/upload', function(req, res) {
		
		if(req.files == null) console.log('WHAT 2');
		
		var name = req.body.name;
		var tags = req.body.tags;
		connection.query('use samples;');
		
		console.log(req.body);
		console.log(req.files);
		var temp = req.files.file.path;
		console.log('Did it');
		var targetPath = path.resolve('/var/www/upload/' + req.files.file.name);

		connection.query('INSERT INTO Samples (Tags, Title, Path) VALUES (\'' + 
						 tags + '\', \'' + name + '\' , \'' + targetPath + '\');');
		
		fs.rename(temp, targetPath, function(err) {
				if (err) throw err;
				console.log('Upload Successful');
			});

		res.redirect('/');
	});


app.get('/tags/:id?', function(req, res){
		var ids = req.route.params.id;
		console.log(ids);
		
		var tags = ids.split('+');

		console.log(tags);
		var str = '';
		str += 'select * from Samples where Tags like \'%' + tags[0] + '%\' ';
		for (var i = 1 ; i < tags.length; i++) {
			str += 'UNION\n';
			str += 'select * from Samples where Tags like \'%' + tags[i] + '%\' ';
		}
		str += ';';
		console.log(str);

		connection.query('use samples;');
		connection.query(str, function(err, rows, fields) {
				res.send(rows);
				
			});
			
});

app.get("/browse",  function(req,res) {
		connection.query("use samples;");
		connection.query("select * from Samples;", function(err, rows, fields) {
				var str = "";
				for(var x in rows) { 
					var row  = rows[x];
				
					str+="<a href=\"" + row.Path.replace("/var/www/upload/", "/sound/");
					str += "\"> " + row.Title + " </a> (" + row.Tags + ")<br>";
				}
				res.send(str);
			});
	});

app.get("/browseJSON", function(req, res) {
		connection.query("use samples;");
		connection.query("select * from Samples;", function(err, rows, fields) {
				res.send(rows);
			});
	});

app.listen(3000);
