Kapok
=================

Goals
---------------
1. Free as in Manyok.  Runs anywhere with a decent web browser.
2. Provide a robust accounting and management solution for rural hospitals
3. Flexible reporting system to allow hospital administrators, non-governmental programs, and aid
    to satisfy inquiries into the hospital management.
4. Designed for hospitals who's patrons live on less than a dollar a day.

About
---------------
Kapok is an open source accounting and hospital information management suite (HIMS).  We are an international
team developing Kapok in D.R. Congo.

Contributing
---------------
All contributions are welcome!  Our project is still in the alpha phase; we provide no guarantee on the
build until our first releases (Spring 2014).  However, feel free to fork, send us a pull request, do some
style or translation work!

Installation
-------------------
Dependencies
 - Latest MySQL or [MariaDB] (http://mariadb.org/) client
 - [grunt] (https://npmjs.org/package/grunt)

To install, grab a copy of the latest build on the *dev* branch ([https://github.com/IMA-WorldHealth/Kapok] <https://github.com/IMA-WorldHealth/Kapok>)

Using git:
```bash
$ git clone https://github.com/IMA-WorldHealth/Kapok
Cloning into 'Kapok' ...
$ cd Kapok && npm install
...
```

After npm has finished installing, set up your mysql user and permissions.  For the standard build, the user is `kpk` and password is `HISCongo2013`.

Next, you need to build the project.  We use [grunt] (https://npmjs.org/package/grunt) as our build tool, so you'll need to run grunt
```bash
$ grunt
Running "cssmin:combine" (cssmin) task

Running "concat:kapok" (concat) task

Running "watch" task
```

Congratulations!  Fire up node and navigate to [localhost] (http://localhost:8080).

License
---------------
See [License](./LICENSE.md)
