Install.md
======================

This guide is intended to help you get up and running fast with BHIMA.

The Repository Structure
------------------------

BHIMA's repository structure is set up as follows:

```bash
  - package.json
  + app/
    + assets/
    + css/
    + i18n/
    + js/
    + lib/
    + partials/
  + scripts/
    - server.js
    - config.json
    + sql/
    + lib/
    + test/
  + docs/
    - INSTALL.md
```

The application is largely divided logically between client and server responsibilites.  The folder `app` and subfolders
contain the HTML markup, CSS styling and JS logic which control the client side behavior.  The folder `scripts` and subfolders
contain the server modules and logic.

Prerequisite Dependencies
--------------------------

The BHIMA server is powered by [Node.js](http://www.nodejs.org) .  Prior to installing the app, Node must be installed 
on the server and executable from the system path.  Nodejs is available from [here](http://www.nodejs.org).  To test if 
node is installed in your system, open the system terminal and type `node -v`.

```bash
$ node -v
v0.10.12
```

The BHIMA server stores all of the application data and state in a MySQL database instance.  If MySQL is not installed on
the server, install it before proceeding with this installation guide.  For security reasons, we recommend choosing a strong
root password that is not used elsewhere in the system.  The lastest MySQL Community Server is available from 
[here](http://dev.mysql.com/downloads/).
Make sure the mysql command is executable from the command line on Linux, or that MySQL is available in Windows (7) under Control Panel > 
Programs and Features > MySQL.

```bash
$ mysql -v

```

Building the Application
---------------------------

The application has one build file, `package.json` in the root directory.  Before building, make sure that Nodejs is installed
and in your system path (see Prequisite Dependencies).  The basic Node installation comes with `npm` or "Node Package Manager".
If the server has access to the internet, use NPM to grab the application build tool grunt.  In the terminal, type `npm install`
to install all build dependencies.  The specific tool used to build BHIMA is called `grunt-cli`. Grab it first.

```bash
$ cd ~/path/to/bhima/
# install grunt
$ npm install -g grunt-cli
# ...
# Lastly, install all remaining dependencies
$ npm install
```

In order to build BHIMA, execute `grunt build` in the application directory.

```bash
$ cd ~/path/to/bhima/
$ grunt build
```

The grunt build tool assembles the application from source files in the `partials/` folder.  TODO : more on this later.

TODO: Running the sql install scripts

Running the Application
----------------------------

BHIMA's system variables can be adjusted by editing the `config.json` file in the `scripts/` directory.  The configuration file defines variables that the server reads in on startup. These include
1. `static` : The static directory from which the server serves files.
2. `port` : The system port on which the HTTP server will listen for incoming requests.
3. `db` : A JSON with database configuration options.
  3.1 `host` : The hostname of the database
  3.2 `user` : The username of the database user
  3.3 `password` : The database password
  3.4 `database` : The name of the database schema used by the application
4. `log` : A JSON with database logger configuration options.  This is not strictly required for building.
5. `session` : Configures the HTTP session encyption information.
6. `auth` : Speicifies a set of global url paths for client access.





