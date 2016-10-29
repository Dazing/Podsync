# Podsync
Simple Node JS client for continously downloading podcasts to your media server/device from a RSS feed.
---
### Config.json
    "masterFolder" : "",
        _The folder where all you podcasts lies or subfolders if enabled_
    "useSubFolders": true,
        _Boolean (true/false), if true put podcasts in subfolders (name defined in list of podcasts) in masterFolder_
    "podcastList" : [
        {
            "url": "rss_url_to_podcast",
            "folderName": "podcast_sub_folder"
        }
    ]
