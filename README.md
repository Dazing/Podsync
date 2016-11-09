# Podsync

Simple Node JS client for continuously downloading podcasts to your media server/device from a RSS feed supported on Mac OS and Linux.
---

## Installation

### Prerequisites:

Node 6.9.x (LTS), internet connection (doh!).

### Installing

1: Clone or download the repository.

2: Navigate to the repository folder and run (this will install dependencies):

```
	npm install
```

3: Copy "config_sample.json" to "config.json" and fill in the values and Podcasts that you want the program to download, see the docs down below for more information.

## Docs
### Config.json
    "masterFolder" : "path/to/podcast/MasterFolder",
        The folder where all you podcasts or subfolders, if enabled, are located.
    "useSubFolders": true,
        Boolean (true/false), if true put podcasts in subfolders (name defined in list of podcasts) in masterFolder.
    "interval": 60,
        Interval for checking for new episodes/retry old ones (in minutes).
    "podcastList" : [
        {
            "url": "rss_url_to_podcast",
            "folderName": "podcast_sub_folder"
        }
    ]
