// Import/require needed libraries.
var feed = require("feed-read");
var fs = require('fs');
var http = require('http');
var config = require('./config.json');


// Create needed variables.
var downloadSuccces;
var fileName = '';
var fileTitle = '';
var fileExist = false;
var faillog = 'faillog.json';
var failedList = [];
var faillogLines;
var subFolder;
var podUrl;

// Make sure master folder exists
try {
    fs.accessSync(config.masterFolder, fs.F_OK);
}
// Catch error and set varibles accordningly
catch (errAcc) {
    // File dooes not exist
    if (errAcc.code === "ENOENT") {
        console.log("Master folder could not be found, check the folder path");
    }
    // General error clause
    else {
        throw errAcc;
    }
}

// If subfolders are enabled: make sure subfolder exists, else create it.
if (config.useSubFolders) {
	for (var i = 0; i < config.podcastList.length; i++) {
    	subFolder = config.podcastList[i].folderName;

        try {
            fs.accessSync(config.masterFolder+subFolder, fs.constants.F_OK);
        }
        // Catch error and create directory
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


// Initial download for all Pods
downloadStart();

// Run the download function every hour from startup
setInterval(downloadStart, config.interval * 60000);


// TODO ADD FUNCTION COMMENT
function downloadStart(){
    for (var g = 0; g < config.podcastList.length; g++) {
		// Full path for the subfolder
		if (config.useSubFolders) {
			subFolder = config.masterFolder + config.podcastList[g].folderName + "/";
		}
		else {
			subFolder = config.masterFolder
		}

		// Start downloading the current podcast
        downloadPodcast(
            config.podcastList[g].url,
			config.podcastList[g].extension,
            subFolder
        );
    }
}

/*

    Function downloadPodcast

	Downloads podcasts file from an rss feed until it reaches one thats already
	downloaded, if a download fails its added in the failog and will be
	downloaded at a later time.

    @param  podcastUrl		Download url (the rss feed).
	@param  podFolder		Folder to put downloaded files in.

*/
function downloadPodcast(podcastUrl, extension,podFolder) {
    feed(podcastUrl, function(err, entries) {

      	if (err) throw err;
      	else {
      		for (var i = 0; i < entries.length-1; i++) {
       			fileName = fileNameFormater(entries[i].title);
				fileName = fileName + extension;

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
                        podFolder+fileName
                    );

    				// If download failed: add to log for attempt later
    				if (downloadSuccces != 0) {
                        failedEntry = {
                            entry : entries[i],
                            attempts : 0
                        }
						if (validateJSON(failedEntry)) {
							failedList.push(JSON.stringify(failedEntry));
						}


                    }

      			} // End file does not exist statement

      		} // End RSS entry loop

            // Read faillog file
			try {
				faillogLines = fs.readFileSync(faillog).toString().split('\n');
			} catch (e) {
				faillogLines = [];
			}

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
    			// Attempt to download again, with 3 (1 attempt per hour) days limit.

    			// Skip iteration if the entry is empty
        	    if (faillogLines[i] == "") {
                    continue;
                }

				if (!(validateJSON(faillogLines[i]))) {
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
    					faillogLines.splice(i,1);
    					continue;
    				}
    			}
    		} // End attempt to download failed files.

    		// Append remaining list to file
    		Array.prototype.push.apply(faillogLines, failedList);

    		// Write to file;
    		var file = fs.createWriteStream('faillog.json');
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


/*
    Function fileNameFormater

    @param  title		String to format.

    @return string     	Formated string.

*/
function fileNameFormater(title) {
	// Remove all special characters but space
	title = title.replace(/[^a-zA-Z ]/g, '');
	// Replace all spaces with underscore
	title = title.replace(/ /gi,'_')
	// Append '.mp3'
	title = title

	return title;
}

/*
    Function downloadFile

	Handles the download giv

    @param  fileUrl     url to the file for download
    @param  fileDestUrl path+name of file for saving

    @return 0,1         0 = success, 1 = fail.

*/
function downloadFile(fileUrl, fileDestUrl) {
    var file = fs.createWriteStream(fileDestUrl);
    var res = http.get(fileUrl, function (resp){
        resp.pipe(file)
    });
    res.on('error', function (err){
        // Delete the file on error (async)
        console.log("Error on download");
        fs.unlink(fileDestUrl);
        return 1;
    });

    res.on('finish', function (err){
        return 0;
    });
}


/*
    Function validateJSON

	Validates if a given string is a valid JSON object.

    @param  entry		String to validate.

    @return boolean		True if the string is valid, else false.

*/
function validateJSON(entry) {
	try {
		JSON.parse(entry);
	} catch (e) {
		return false;
	}
	return true;
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
