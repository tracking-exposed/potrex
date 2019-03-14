#!/bin/sh

rm -rf ./dist

V=dist/js/ 
mkdir -p dist/css && 
mkdir -p dist/js/local 
mkdir -p dist/images 
mkdir -p $V 

echo "User-agent: *\nAllow: /\n" >> dist/robots.txt

node_modules/.bin/stylus styles/index.styl -o dist/css

cp styles/favicon.ico dist/
cp -r ../icons/* dist/images
# cp sections/images/* dist/images
cp -r sections/webscripts/* dist/js/local/ 
cp -r node_modules/bootstrap/dist/* dist/
cp styles/WorkSans.ttf dist/fonts

cp node_modules/bootstrap/js/collapse.js $V
cp node_modules/jquery/dist/jquery.js $V 
cp node_modules/moment/min/moment.min.js $V 
cp node_modules/lodash/lodash.min.js $V 

cd $V
curl -O -J -L https://unpkg.com/isotope-layout@3/dist/isotope.pkgd.min.js
cd ../..

cd dist
echo "copying ../static ..."
cp -r ../static/ static
cd static
files=`/bin/ls *.*`
echo "<html><body>" > index.html
for x in $files; do echo '<a href="/static/'$x'">'$x'</a>' >> index.html; done
echo "composed index.html"
ls -l index.html
cd ../..

