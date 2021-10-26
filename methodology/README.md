
git clone [the potrex folder] 
or git pull [if you have a outdated version of the folder] 

cd potrex/methodology 
npm install [all the dependecies]  

Before to start: Because some part of the data we collect are manually coded, you will have to make a copy of potrex/methodology/guardoniconf.json.EXAMPLE and specifying your OS, DEVICE, CITY, and profile name. Saving the new document as potrex/methodology/guardoniconf.json


When you execute it:

1) you need the additional dependency of google chrome installed.
2) node src/guardoni.js --source <AN URL OF A VALID DIRECTIVE FILE> --profile profileName

The profile would be created if don't exist, or reused if already present. if you add 'profile' to you guardoniconf.json, easier for you!

2) node src/guardoni.js --source <AN URL OF A VALID DIRECTIVE FILE>
