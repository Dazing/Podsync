# Podsync
Simple Node JS client for continously downloading podcasts to your media server/device from a RSS feed.
---
### Config.json
    "masterFolder" : "path/to/podcast/MasterFolder",
        The folder where all you podcasts or subfolders, if enabled, are located.
    "useSubFolders": true,
        Boolean (true/false), if true put podcasts in subfolders (name defined in list of podcasts) in masterFolder.
    "interval": 60,
        Interval of where to to check for new episodes/retry old ones, in minutes.
    "podcastList" : [
        {
            "url": "rss_url_to_podcast",
            "folderName": "podcast_sub_folder"
        }
    ]
