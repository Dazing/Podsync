var feed = require("feed-read");
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');
var http = require('http');

var downloadSuccces;
var fileName = '';
var fileTitle = '';
var fileExist = false;
var faillog = 'faillog.txt';
var failedList = [];
var faillogLines;

var podFolder = '/srv/samba/ArcServer/Media/Podcasts/';
var opt = {
	cwd: podFolder
};

rss_url = 'http://www.bbc.co.uk/programmes/p002vsnb/episodes/downloads.rss';


feed(rss_url, function(err, entries) {

  	if (err) throw err;
  	else {

  		for (var i = 0; i < entries.length-1; i++) {
   			fileName = fileNameFormater(entries[i].title);

            //fileExist = fs.statSync(podFolder+fileName, (error);
            try {
                fs.accessSync(podFolder+fileName, fs.constants.F_OK);
                fileExist = true;
            }
            catch (error) {
                if (error.code === "ENOENT") {
                    fileExist = false
                }
                else {
                    throw error;
                }
            }



  			// If file does exist, end loop and retry previusly failed pods
  			if (fileExist) {
                // TODO TESTING START
				var failedEntry = {
					entry: entries[i],
					attempts: 0
				}
				failedList.push(JSON.stringify(failedEntry));
                // TODO TESTING END


  				break;
  			}
  			else {
				downloadSuccces = downloadFile(
                    entries[i].link,
                    podFolder+fileName,
                    opt
                );

				// If download failed: add to log for attempt later
				if (downloadSuccces != 0) {
					failedList.push(JSON.stringify(entries[i]));
				} // End wget failed statement

  			} // End file does not exist statement

  		} // End RSS entry loop

		faillogLines = fs.readFileSync(faillog).toString().split('\n');
		var tmpLineLink;
		var attemptEntry;

		for (var i = 0; i < faillogLines.length; i++) {

			// TODO TEST
			// Remove the entry from failedList if already in the faillog file
			for (var j = 0; j < failedList.length; j++) {
				tmpLineLink = faillogLines[i];
				console.log("\n\n MATCHING");
				var test = 1+(parseInt(failedList[j].attempts));
				if (failedList[j].entry === tmpLineLink.entry) {
					failedList.splice(j,1);

				}
			}

			// -------------------------------------------------
			// Attempt to download again, with 3 days limit.

			// TODO TEST
    	    if (faillogLines[i] == "") {
                continue;
            }

            console.log("LOGGING faillogLines["+i+"]: \n\n ");
            console.log("'"+faillogLines[i]+"'");
            console.log("------------------------------------------------");

            attemptEntry = JSON.parse(faillogLines[i]);
            console.log("LOGGING stringify of attemptEntry.title: \n\n ");
            console.log("'"+JSON.stringify(attemptEntry.entry.title)+"'");
            console.log("------------------------------------------------");
			if (attemptEntry.attempts > 72) {
				failedList.splice(i,1);
				continue;
			}
			else {
				// Get proper fileName
				fileName = fileNameFormater(attemptEntry.entry.title);
				// Run the wget command to download
				downloadSuccces = downloadFile(
                    attemptEntry.link,
                    podFolder+fileName,
                    opt
                );

				// Attempt to download file NOT successful:
				// increment attemps variable, change in array for write back
				if (downloadSuccces != 0) {
					attemptEntry.attempts = attemptEntry.attempts + 1;
					faillogLines[i] = JSON.stringify(attemptEntry);
				}
				// Attempt to download file successful: remove it from file.
				else {
					faillogLines.splice(i,1);
					continue;
				}
			}
		}

		// Append remaining list to file
		Array.prototype.push.apply(faillogLines, failedList);
		// Write to file;
		var file = fs.createWriteStream('array.txt');

		file.on('error', function(err) {
			console.log('Fail for write stream');
		});

		for (var i = 0; i < faillogLines.length; i++) {
			file.write(faillogLines[i] + '\n');
		}

		file.end();
	}
});


/*
    Function downloadFile

    @param  fileUrl     url to the file for download
    @param  fileDestUrl path+name of file
    @param  options     TODO

    @return 0,1         0 = success, 1 = fail.

*/
function downloadFile(fileUrl, fileDestUrl, options) {
	/*
    var tmpWget = spawnSync(
			'wget',
			[	'--no-verbose',
				'--output-document='+fileDestUrl,
				link
				],
			options
		);
    */

    var file = fs.createWriteStream(fileDestUrl);
    var request = http.get(fileUrl, function (resp){
        resp.pipe(file)
    }).on('error', function (err){
        // Delete the file on error (async)
        fs.unlink(fileDestUrl);
        return 1;
    });
	return 0;
}

function fileNameFormater(title) {
    console.log(title);
    console.log((title === "sting"));
	// Remove all special characters but space
	title = title.replace(/[^a-zA-Z ]/g, '');
	// Replace all spaces with underscore
	title = title.replace(/ /gi,'_')
	// Append '.mp3'
	title = title + '.mp3';
	return title;
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
