# gdrive-player

Play mp3 files automatically from a google drive folder.

# Installation

1. clone repo
2. install npm dependencies
3. place a google cloud service account key file at the root of the repo as
   `svcacc.json`

## Npm commands

-   `check`: run the typescript checker
-   `start`: run the code (using tsm just-in-time typescript compilation)
-   `build`: bundle all of the code (excluding native addons) into a single .cjs
    file (using esbuild)
-   `export`: create a portable executable binary from the bundle and the native
    addons (using [pkg](https://github.com/vercel/pkg)) (needs the google cloud
    key file to run)

# How it works

This program uses the
[google drive API](https://developers.google.com/drive/api) to query the audio
files inside a folder and download them to play.

The name of the audio files must be
`[optional comment] valid ISO timestamp.mp3`. The timestamp is when the file
will be played.
