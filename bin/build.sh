#!/bin/bash

echo "var gBuildDate = \"$(date)\";console.log(\"tile map build date: \" + gBuildDate);" > version.js

touch parser-debug.js

cat	version.js \
	../src/util.js \
	../src/querystring.js \
	../src/url.js \
	../src/parser.js \
	../src/drawImage.js > parser-debug.js
mv parser-debug.js ../demos/
rm ./version.js
