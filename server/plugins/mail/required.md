### Server module design / administration
- Node module that can be imported to server on intial run, this module \
  configures chron jobs etc. that will execute the mail scripts based on 
  configuration 

- mail administration through module in tree, shows only subscribed modules
(configuration JSON)

### Features
- graphing thing using d3.js 

- check if file report exists, create it, create folder for tmp files 
(reportReference)

- chron job should tell _send.js_ what task is being built based on config

- _mail.js_ should accept the following parameters
  - -l language
  - -s service (daily | weekly | monthly | yearly)
