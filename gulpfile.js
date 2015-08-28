// Build, Lint, and Test bhima

// TODO
//  Should we make these requires dependent on what path is being taken, so that
//  not all are required to build bhima?  In this format, there is no difference
//  between the install requirements of a developer and a production environment.

var gulp       = require('gulp'),
    gulpif     = require('gulp-if'),
    concat     = require('gulp-concat'),
    uglify     = require('gulp-uglify'),
    minifycss  = require('gulp-minify-css'),
    jshint     = require('gulp-jshint'),
    flatten    = require('gulp-flatten'),
    del        = require('del'),

    // mocha for server-side testing
    mocha      = require('gulp-mocha'),

    // protractor for e2e tests
    protractor = require('gulp-protractor'),
    webdriver  = protractor.webdriver_standalone,

    // child process for custom scripts
    exec       = require('child_process').exec;


// constants
// toggle client javascript minification
var UGLIFY = false,

    // path to the jshintrc to use
    JSHINT_PATH = '.jshintrc',

    // the output folder for built server files
    SERVER_FOLDER = './bin/server/',

    // the output folder for built client files
    CLIENT_FOLDER = './bin/client/';


// resource paths
var paths = {
  client : {
    javascript : ['client/src/js/define.js', 'client/src/**/*.js', '!client/src/js/app.js'],
    css        : ['client/src/partials/**/*.css', 'src/css/*.css'],
    vendor     : ['client/vendor/*.js', 'client/vendor/**/*.js'],
    static     : ['client/src/index.html', 'client/src/js/app.js', 'client/src/i18n/*.json', 'client/src/fonts/*', 'client/src/partials/**/*.html', 'client/src/css/images/*', 'client/src/assets/**/*']
  },
  server : {
    javascript : ['server/*.js', 'server/**/*.js'],
    files      : ['server/*']
  }
};

/* -------------------------------------------------------------------------- */

/*
 * Client Builds
 *
 * The client build process takes files from the client/src/ folder
 * and writes them to the /bin/client/ folder.  There are tasks to do
 * the following:
 *   - [client-lint-js]     lint the client javascript code (via jshint)
 *   - [client-minify-css]  minify (via minify css) the css
 *   - [client-minify-js]   minify (via uglify) the clientside js code
 *   - [client-lint-i18n]   compares translation files for missing values
 *   - [client-mv-static]   moves the static files (html, img) to the client
 *                          folder
 *   - [client-mv-vendor]   copy the vendor files into the client/vendor folder
 *
 * To run all of the above, run the gulp task `gulp build-client`.
 *
 * Other options include
 *   - [client-watch]       watch the client/src/ for changes and run the build
 *
 * NOTE
 *   Whether you are minifying the files or not, the output of all css/js
 * operations will result in files written with the *.min.js or *.min.css
 * suffix.  This is so that links in index.html do not have to rewritten on the
 * fly depending on the build type.
*/

// removes files with del, and continues
gulp.task('client-clean', function (cb) {
  del([CLIENT_FOLDER], cb);
});

// run jshint on the client javascript code
gulp.task('client-lint-js', function () {
  return gulp.src(paths.client.javascript)
    .pipe(jshint(JSHINT_PATH))
    .pipe(jshint.reporter('default'));
});

// minify the client javascript code via uglify
// writes output to bhima.min.js
gulp.task('client-minify-js', function () {
  return gulp.src(paths.client.javascript)
    .pipe(concat('js/bhima.min.js'))
    .pipe(gulp.dest(CLIENT_FOLDER));
});

// minify the client css styles via minifycss
// writes output to style.min.css
gulp.task('client-minify-css', function () {
  return gulp.src(paths.client.css)
    .pipe(minifycss())
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest(CLIENT_FOLDER + 'css/'));
});

// move vendor files over to the /vendor directory
gulp.task('client-mv-vendor', function () {
  return gulp.src(paths.client.vendor)
    .pipe(flatten())
    .pipe(gulp.dest(CLIENT_FOLDER + 'vendor/'));
});

// move static files to the public directory
gulp.task('client-mv-static', ['client-lint-i18n'], function () {
  return gulp.src(paths.client.static, { base : './src/' })
    .pipe(gulp.dest(CLIENT_FOLDER));
});

// custom task: compare the English and French for missing tokens
gulp.task('client-lint-i18n', function (cb) {
  var progPath = './utilities/translation/tfcomp.js',
      enPath = 'client/src/i18n/en.json',
      frPath = 'client/src/i18n/fr.json';

  exec('node ' + [progPath, enPath, frPath].join(' '), function(err, _, warning) {
    if (warning) { console.error(warning); }
    cb();
 	});
});

// watchs for any change and builds the appropriate route
gulp.task('client-watch', function () {
  gulp.watch(paths.client.css, ['client-minify-css']);
  gulp.watch(paths.client.javascript, ['client-minify-js']);
  gulp.watch(paths.client.static, ['client-mv-static']);
  gulp.watch(paths.client.vendor, ['client-mv-vendor']);
});

// builds the client with all the options available
gulp.task('build-client', ['client-clean'], function () {
  gulp.start('client-lint-js', 'client-minify-js', 'client-minify-css', 'client-mv-vendor', 'client-mv-static');
});

/* -------------------------------------------------------------------------- */

/*
 * Server Builds
 *
 * The server build process takes files from the server/ folder and
 * writes them to the /bin/server/ folder.  It also copies the package.json
 * folder for convenience.
 *
 * Building will run the following tasks:
 *   - [server-lint-js]  lint the server javascript code (via jshint)
 *   - [server-mv-files] move the server files into the /bin/server folder
 *
 * To run all of the above, run the gulp task `gulp build-server`.
*/

gulp.task('server-clean', function (cb) {
  del([SERVER_FOLDER], cb);
});

// run jshint on all server javascript files
gulp.task('server-lint-js', function () {
  return gulp.src(paths.server.javascript)
    .pipe(jshint(JSHINT_PATH))
    .pipe(jshint.reporter('default'));
});

// move the server files into /bin/server
gulp.task('server-mv-files', function () {
  return gulp.src(paths.server.files)
    .pipe(gulp.dest(SERVER_FOLDER));
});

// build the server
gulp.task('build-server', ['server-clean'], function () {
  gulp.start('server-mv-files');
});

/* -------------------------------------------------------------------------- */

// builds both the client and the server
gulp.task('build', ['build-client', 'build-server']);

/* -------------------------------------------------------------------------- */

/* Testing Client Builds
 *
 * The following tasks will run unit and end-to-end tests
 * on bhima.
*/

// run the selenium server for e2e tests
gulp.task('webdriver-standalone', webdriver);

// run the build-client task when no arguments
gulp.task('default', [], function () {
  gulp.start('build-client');
});
