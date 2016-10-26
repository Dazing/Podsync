var feed = require("feed-read");
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');
var wget;
var fileName = '';
var fileTitle = '';
var fileExist = false;
var faillog = 'failog.txt';
var failedList = [];
var failogLines;

var podFolder = '/srv/samba/ArcServer/Media/Podcasts/';

rss_url = 'http://www.bbc.co.uk/programmes/p002vsnb/episodes/downloads.rss';


feed(rss_url, function(err, articles) {

  	if (err) throw err;
  	else {
  		console.log(articles[0].feed)

  		console.log(articles[0].link)

  		console.log(articles[0].title.replace(/[^a-zA-Z ]/g, '').replace(/ /gi,'_'));

  		var opt = {
  			cwd: podFolder
  		}
  		console.log("df");

  		for (var i = 0; i < articles.length-1; i++) {
   			fileTitle = fileNameFormater(articles[i].title);

			fileExist = fs.existsSync(podFolder+fileName)

  			console.log("i:"+i+", "+fileName+", "+fileExist+"\n");

  			// If file does exist, end loop and retry previusly failed pods
  			if (fileExist) {
				failedList.push(JSON.stringify(articles[i]))
  				break;
  			}
  			else {
				wget = spawnSync(
						'wget',
						[	'--no-verbose',
							'--output-document='+fileName,
							articles[i].link
							],
						opt
					);

				// If wget failed: try once more.
                // TODO Add failed to list and stop downloading on fileExists
                // TODO And then check failed "download.log".
				if (wget.status != 0) {
					failedList.push(JSON.stringify(articles[i]));
				} // End wget failed statement

  			} // End file does not exist statement

  		} // End RSS entry loop

		failogLines = fs.readFileSync(failog).toString().split('\n');
		var tmpLineLink;
		for (var i = 0; i < failogLines.length; i++) {
			for (var i = 0; i < failedList.length; i++) {
				tmpLineLink = faillogLines.split(' ');
				if (failedList[i] === tmpLineLink) {

					console.log(failedList[i]);
				}
			}
		}
  	}
});

function fileNameFormater(title) {
	// Remove all special characters but space
	fileTitle = articles[i].title.replace(/[^a-zA-Z ]/g, '');
	// Replace all spaces with underscore
	fileTitle = fileTitle.replace(/ /gi,'_')
	// Append '.mp3'
	fileName = fileTitle + '.mp3';
	return fileName;
}

/*

fs.readFileSync("file.txt").toString().split("\n").forEach(function(line, index, arr) {
  if (index === arr.length - 1 && line === "") { return; }
  console.log(index + " " + line);
});

failog = fs.readFileSync("file.txt").toString().split("\n");

for (var i = 0; i < faillog.length; i++) {
	faillog[i]
}

*/
