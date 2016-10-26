var feed = require("feed-read");
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');
var wget;
var fileName = '';
var fileTitle = '';
var fileExist = false;
var faillog = 'faillog.txt';
var failedList = [];
var failogLines;

var podFolder = '/srv/samba/ArcServer/Media/Podcasts/';

rss_url = 'http://www.bbc.co.uk/programmes/p002vsnb/episodes/downloads.rss';


feed(rss_url, function(err, entries) {

  	if (err) throw err;
  	else {
		// DEBUG logs
  		console.log(entries[0].feed)
  		console.log(entries[0].link)
  		console.log(entries[0].title.replace(/[^a-zA-Z ]/g, '').replace(/ /gi,'_'));

  		var opt = {
  			cwd: podFolder
  		}
  		console.log("df");

  		for (var i = 0; i < entries.length-1; i++) {
   			fileTitle = fileNameFormater(entries[i].title);

			fileExist = fs.existsSync(podFolder+fileName)

  			console.log("i:"+i+", "+fileName+", "+fileExist+"\n");

  			// If file does exist, end loop and retry previusly failed pods
  			if (fileExist) {
				var failedEntry = {
					entry: entries[i],
					attempts: 0
				}
				console.log(JSON.stringify(failedEntry));
				failedList.push(JSON.stringify(failedEntry));
  				break;
  			}
  			else {
				wget = spawnSync(
						'wget',
						[	'--no-verbose',
							'--output-document='+fileName,
							entries[i].link
							],
						opt
					);

				// If wget failed: try once more.
                // TODO Add failed to list and stop downloading on fileExists
                // TODO And then check failed "download.log".
				if (wget.status != 0) {
					failedList.push(JSON.stringify(entries[i]));
				} // End wget failed statement

  			} // End file does not exist statement

  		} // End RSS entry loop

		failogLines = fs.readFileSync(faillog).toString().split('\n');
		var tmpLineLink;
		var attemptEntry;

		for (var i = 0; i < failogLines.length; i++) {

			// TODO TEST
			// Remove the entry from failedList if already in the faillog file
			for (var j = 0; j < failedList.length; j++) {
				tmpLineLink = failogLines[i];
				console.log("\n\n MATCHING");
				var test = 1+(parseInt(failedList[j].attempts));
				//console.log(parseInt(failedList[j].attempts));
				//console.log("tmpLL:"+tmpLineLink);
				//console.log("failList:"+failedList[j]);
				if (failedList[j].entry === tmpLineLink.entry) {
					failedList.splice(j,1);

				}
			}

			// -------------------------------------------------
			// Attempt to download again, with 3 days limit.

			// TODO TEST
			attemptEntry = JSON.parse(failogLines[j]);
			if (attemptEntry.attempts > 72) {
				failedList.splice(i,1);
				continue;
			}
			else {
				wget = spawnSync(
						'wget',
						[	'--no-verbose',
							'--output-document='+fileName,
							attemptEntry.link
							],
						opt
					);

				if (wget.status != 0) {
					attemptEntry.attempts = attemptEntry.attempts + 1;
					failedList[j] = attemptEntry;
				}
				else {
					failedList.splice(i,1);
					continue;d
				}
			}
		}

		// TODO Append remaining list to file
  	}
});

function fileNameFormater(title) {
	// Remove all special characters but space
	fileTitle = title.replace(/[^a-zA-Z ]/g, '');
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
