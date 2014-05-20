BHIMA
=================

Goals
---------------
1. Free as in Manyok.  Runs anywhere with a decent web browser.
2. Provide a robust accounting and managerial solution for rural hospitals.
3. Flexible reporting system to allow hospital administrators, non-governmental agencies, and aid organizations
    up to date access to utilization data.
4. Designed for hospitals whose patrons live on less than a dollar a day.

About
---------------
Bhima is an open source accounting and hospital information management suite (HIMS).  We are an international
team developing bhima in D.R. Congo.

Contributing
---------------
All contributions are welcome!  Our project is still in the alpha phase; we provide no guarantee on the
build until our first releases (Spring 2014).  However, feel free to fork, send us a pull request, do some
style or translation work!

Installation
-------------------
Dependencies
 - Latest [MySQL] (dev.mysql.com/downloads/) or [MariaDB] (http://mariadb.org/) server 
 - [gulp] (www.gulpjs.com)

To install, grab a copy of the latest build on the *dev* branch ([https://github.com/IMA-WorldHealth/Kapok] <https://github.com/IMA-WorldHealth/Kapok>)

Using git:
```bash
$ git clone https://github.com/IMA-WorldHealth/Bhima bhima
Cloning into 'bhima' ...
$ cd bhima && npm install
...
```

After npm has finished installing, set up your mysql user and permissions.  For the standard build, the user is `bhima` and password is `HISCongo2013`.

Next, you need to build the project.  We use gulp as our build tool, so you'll need to run gulp with the following command: 
```bash
$ gulp 
Running "cssmin:combine" (cssmin) task

Running "concat:bhima" (concat) task

Running "watch" task
```

Congratulations!  Fire up node and navigate to [localhost] (http://localhost:8080).  The default port is 8080.

License
---------------
See [License](./LICENSE.md)
