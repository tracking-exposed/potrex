# Goal

download all the categories and sample all the suggested category for each category.

## first step

download and make machine readable this list: https://www.pornhub.com/categories

this is become a JSON file with 106 entries: `allcategories.json` 

```
  {
    "name": "Arab",
    "href": "/video?c=98"
  },
  {
    "name": "Asian",
    "href": "/video?c=1"
  },
  {
    "name": "Babe",
    "href": "/categories/babe"
  },
  {
    "name": "Babysitter",
    "href": "/video?c=89"
  },
```

## second step, crawl all the categoies

for each file (renamed Old/Young to Old\_Young because was simpler manage the file), look at:

all the HTML elements with class="tagTopSuggestions";

then run the script `querier.js`

cd downloaded
ls * > ../list.txt

_this hack was just become some filename has a space in their name and ..._
for i in `seq 0 106`; do f=`head -$i list.txt | tail -1`; node querier.js "$f"; done

this created the .json in `created/`

## notes

  * live cams don't have that
  * role play don't have that
  * gay don't have that


