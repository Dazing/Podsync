var feed = require("feed-read");
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');
var http = require('http');
var nodeID3 = require('node-id3');
var config = require('./config.json')
var request = require('request');

var downloadSuccces;
var fileName = '';
var fileTitle = '';
var fileExist = false;
var faillog = 'faillog.txt';
var failedList = [];
var faillogLines;


var subFolder;
var podUrl;

// Make sure master folder exists
try {
    fs.accessSync(config.masterFolder, fs.constants.F_OK);
}
// Catch error and set varibles accordningly
catch (errAcc) {
    // File dooes not exist
    if (errAcc.code === "ENOENT") {
        // Create master folder
        try {fs.mkdirSync(config.masterFolder)}
        catch (errDir) {console.log(errDir);}
    }
    // General error clause
    else {
        throw errAcc;
    }
}

// Make sure all subfolders exists
for (var i = 0; i < config.podcastList.length; i++) {
    subFolder = config.podcastList[i].folderName;

    // If subfolders are enabled: make sure subfolder exists, else create it.
    if (config.useSubFolders) {
        try {
            fs.accessSync(config.masterFolder+subFolder, fs.constants.F_OK);
        }
        // Catch error and set varibles accordningly
        catch (errAcc) {
            // File dooes not exist
            if (errAcc.code === "ENOENT") {
                // Create subfolder
                try {fs.mkdirSync(config.masterFolder+subFolder)}
                catch (errDir) {console.log(errDir);}
            }
            // General error clause
            else {
                throw errAcc;
            }
        }
    }
}

downloadStart();
try {
    fs.accessSync("/srv/samba/ArcServer/Media/Podcasts/Science_In_Action/Has_the_Latest_Mars_Lander_Failed.mp3", fs.constants.F_OK);
}
// Catch error and set varibles accordningly
catch (errAcc) {
    // File dooes not exist
    if (errAcc.code === "ENOENT") {
        console.log("ENOENT ");
    }
    // General error clause
    else {
        throw errAcc;
    }
}


setInterval(downloadStart, config.interval * 60000);

function downloadStart(){
    for (var g = 0; g < config.podcastList.length; g++) {
        subFolder = config.masterFolder + config.podcastList[g].folderName + "/"
        downloadPodcast(
            config.podcastList[g].url,
            subFolder,
            config.podcastList[g].podcastName
        )
    }
}

function downloadPodcast(podcastUrl, podFolder, podcastName) {
    console.log("podFolder: " + podFolder);
    feed(podcastUrl, function(err, entries) {

      	if (err) throw err;
      	else {
      		for (var i = 0; i < entries.length-1; i++) {
       			fileName = fileNameFormater(entries[i].title);

                // Check if the file already exists
                try {
                    fs.accessSync(podFolder+fileName, fs.constants.F_OK);
                    fileExist = true;
                }
                // Catch error and set varibles accordningly
                catch (error) {
                    // File dooes not exist
                    if (error.code === "ENOENT") {
                        //console.log("ENOENT for "+fileName);
                        fileExist = false
                    }
                    // General error clause
                    else {
                        throw error;
                    }
                }

     			// If file does exist, end loop and retry previusly failed pods
      			if (fileExist) {
      				break;
      			}
      			else {
    				downloadSuccces = downloadFile(
                        entries[i].link,
                        podFolder+fileName,
                        entries[i].title,
                        entries[i].published,
                        podcastName
                    );

    				// If download failed: add to log for attempt later
    				if (downloadSuccces != 0) {
                        failedEntry = {
                            entry : entries[i],
                            attempts : 0
                        }
    					failedList.push(JSON.stringify(failedEntry));

                    }

      			} // End file does not exist statement

      		} // End RSS entry loop

            // Read faillog file
    		faillogLines = fs.readFileSync(faillog).toString().split('\n');
    		var tmpLineLink;
    		var attemptEntry;

            // Attempt to download failed files.
    		for (var i = 0; i < faillogLines.length; i++) {

    			// Remove the entry from failedList if already in the faillog file
    			for (var j = 0; j < failedList.length; j++) {
    				tmpLineLink = faillogLines[i];
    				var test = 1+(parseInt(failedList[j].attempts));
    				if (failedList[j].entry === tmpLineLink.entry) {
    					failedList.splice(j,1);

    				}
    			}

    			// -------------------------------------------------
    			// Attempt to download again, with 3 (1 attempt per hour)days limit.

    			// Skip iteration if the entry is empty
        	    if (faillogLines[i] == "") {
                    continue;
                }

                // Turn string from file into JSON
                attemptEntry = JSON.parse(faillogLines[i]);

                // Limit for attempts, if more then 72 attempts has been done,
                // remove it from the list/file.
    			if (attemptEntry.attempts > 72) {
    				failedList.splice(i,1);
    				continue;
    			}
    			else {
    				// Get proper fileName
    				fileName = fileNameFormater(attemptEntry.entry.title);

                    // Attempt to download the file
    				downloadSuccces = downloadFile(
                        attemptEntry.entry.link,
                        podFolder+fileName
                    );



    				// Attempt to download file NOT successful:
    				// increment attemps variable, change in array for write back
    				if (downloadSuccces != 0) {
    					attemptEntry.attempts = attemptEntry.attempts + 1;
    					faillogLines[i] = JSON.stringify(attemptEntry);
    				}
    				// Attempt to download file successful: remove it from file.
    				else {
                        /*setMetaData(podFolder+fileName,
                            attemptEntry.entry.title,
                            attemptEntry.entry.published,
                            podcastName
                        );*/

    					faillogLines.splice(i,1);
    					continue;
    				}
    			}
    		} // End attempt to download failed files.

    		// Append remaining list to file
    		Array.prototype.push.apply(faillogLines, failedList);

    		// Write to file;
    		var file = fs.createWriteStream('faillog.txt');
    		file.on('error', function(err) {
    			console.log('Fail for write stream:'+err);
    		});

            // Write each line to file, speparete entrie with line break ()
    		for (var i = 0; i < faillogLines.length; i++) {
    			file.write(faillogLines[i] + '\n');
    		}

    		file.end();
    	}
    });




}

function fileNameFormater(title) {
	// Remove all special characters but space
	title = title.replace(/[^a-zA-Z ]/g, '');
	// Replace all spaces with underscore
	title = title.replace(/ /gi,'_')
	// Append '.mp3'
	title = title + '.mp3';
	return title;
}

/*
    Function downloadFile

    @param  fileUrl     url to the file for download
    @param  fileDestUrl path+name of file

    @return 0,1         0 = success, 1 = fail.

*/

function downloadFile(fileUrl, fileDestUrl, fileTitle, fileDate, podcastName) {
    var file = fs.createWriteStream(fileDestUrl);

    request(fileUrl).pipe(fs.createWriteStream(fileDestUrl))

    /*var res = http.get(fileUrl, function (resp){
        resp.pipe(file)
    });
    res.on('error', function (err){
        // Delete the file on error (async)
        console.log("Error on download");
        fs.unlink(fileDestUrl);
        return 1;
    });
    setMetaData(fileDestUrl,
    res.on('finish', function (err){
            fileTitle,
            fileDate,
            podcastName
        );
        return 0;
    });*/
}


/*
    Function setMetaData

    @param  fileUrl     url to the file for download
    @param  fileDestUrl path+name of file

    @return 0,1         0 = success, 1 = fail.

*/

function setMetaData(fileUrl, fileTitle, fileDate, podcastName) {
    // TODO Format date 2016-10-20T21:32:00.000Z
    console.log("setmetadata for fileUrl: "+fileUrl+", fileTitle: "+fileTitle+", album: "+podcastName);
    var data = {
        title: fileTitle.toString(),
        album: podcastName.toString()
    }
    var success = nodeID3.write(data, fileUrl);
    console.log("setMetaData: " + success);

    var read = nodeID3.read(fileUrl);

    //returns tags
    console.log(read);
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
