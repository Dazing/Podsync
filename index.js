var feed = require("feed-read");
var spawnSync = require('child_process').spawnSync;
var fs = require('fs');
var wget;
var filename = "";
var filetitle = "";
var fileexist = false;

podfolder = '/srv/samba/ArcServer/Media/Podcasts/';

rss_url = 'http://www.bbc.co.uk/programmes/p002vsnb/episodes/downloads.rss';


feed(rss_url, function(err, articles) {

  	if (err) throw err;
  	else {
  		console.log(articles[0].feed)

  		console.log(articles[0].link)

  		console.log(articles[0].title.replace(/[^a-zA-Z ]/g, '').replace(/ /gi,'_'));

  		var opt = {
  			cwd: podfolder
  		} 
  		console.log("df");

  		for (var i = 0; i < articles.length-1; i++) {
  			// Remove all special characters but space
   			filetitle = articles[i].title.replace(/[^a-zA-Z ]/g, '');
   			// Replace all spaces with underscore
  			filetitle = filetitle.replace(/ /gi,'_')
  			// Append '.mp3'
  			filename = filetitle + ".mp3";
			fileexist = fs.existsSync(podfolder+filename)

  			console.log("i:"+i+", "+filename+", "+fileexist+"\n");

  			// If file does exist, skip to the next episode!
  			if (fileexist) {
  				continue;
  			}
  			else {
				wget = spawnSync(
						'wget', 
						[	'--no-verbose', 
							'--output-document='+filename,
							articles[i].link
							],
						opt
					);
 				
				// If wget failed: try once more. 
                // TODO Add failed to list and stop downloading on fileexists
                // TODO And then check failed "download.log".
				if (wget.status != 0) {
					wget = spawnSync(
							'wget', 
							[	'--no-verbose', 
								'--output-document='+filename,
								articles[i].link
								], 
							opt
						);
				}

  			}
  		
  		}

  	}
});


