#!/usr/bin/env bash

rm -rf ./dist
mkdir ./dist
NODE_ENV=production node_modules/.bin/webpack -p

cp manifest.json ./dist/manifest.json
cp src/popup/* ./dist/
cp icons/dist/* ./dist
cd ./dist
zip extension.zip *
