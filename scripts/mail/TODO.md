-> Node module that can be imported to server on intial run, this module \
  configures chron jobs etc. that will execute the mail scripts based on 
  configuration 
-> ? Module can be administered using seperate CLI?

// TODO everything should be split into smaller utilities, DI etc.
// TODO graphing thing using d3.js 
// TODO check if file report exists, create it, create folder for tmp files (reportReference)

_________________

- chron job should tell send.js what task is being built
- send.js should tell mail.js what language is being built
- file name should refelct all information dd-mm-yyyy-daily-en.html

- mail.js should accept the following parameters
  -l language
  -s service (daily | weekly | monthly | yearly)
