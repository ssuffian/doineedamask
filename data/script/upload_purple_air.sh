#!/bin/sh
DATE=`date '+%Y-%m-%d %H:%M:%S'`
wget -O ../purpleair.json http://www.purpleair.com/json
git commit -am "Uploaded New Purple Air Data at $DATE"
git pull
git push
