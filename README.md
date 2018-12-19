# music_auto2
Automatic pagination of music for visually impaired musicians

## Overview

As it stands, the program requires to install three types of software:

- python (and related packages)
- node.js (and related packages)
- ancillary software (for pdf conversion etc.)

### Installing python

We've had success using the anaconda distribution. In MacOSX, go to the 
[anaconda download](https://www.anaconda.com/download/#macos) page, choose 3.6 version and install. 

Once anaconda is installed, you can install the packages through the terminal. To open a terminal, type terminal in spotlight, or go to Utilities and click on Terminal.

In the terminal, type:

```
conda install -c conda-forge pypdf2 
conda install -c conda-forge opencv
```

the first line install a pdf manager for python. The second, the computer vision library.

### Installing node.js

As done for python, go to the node.js [donwload page](https://nodejs.org/en/download/) and choose the macOS Installer (.pkg) in the 64 bit version. Install the package. Once node.js is installed, open the terminal and install a few extra packages that are needed by our program:

```
npm install express
npm install csv
npm install ejs
npm install multer
npm install uuid
```

### Ancillary software

Turns out, the program needs imagemagick and ghostscript. Both can be installed directly in the terminal, using HomeBrew.

First, install homebrew:

```
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

Then install the required software:

```
brew install imagemagick
brew install ghostscript
```

## Installing the code

The code can be stored in any directory (e.g., `/Users/jbergelson/music_auto`). I am going to build a zip file with the essential code (right now it takes a long time to download)

## Launching the code

Open a terminal and navigate to the right directory (e.g., `cd music_auto/html`). Then type:

```
node index.js testjoy/
```

where `testjoy` is the directory where you want to store your output. You should get the message:

```
app is listening on port 3000
```

Open any browser, and in the address bar put:

```
http://127.0.0.1:3000/
```

You should see the program running.

## Current issues

- final pdf is way too large
- parsing etc. is a bit slow
- Add Da Capo is not working

