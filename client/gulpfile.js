var gulp      = require('gulp'),
    gulpif    = require('gulp-if'),
    concat    = require('gulp-concat'),
    uglify    = require('gulp-uglify'),
    minifycss = require('gulp-minify-css'),
    jshint    = require('gulp-jshint'),
    exec      = require('child_process').exec;

var jshintrcPath = '../.jshintrc',
    destPath = 'dest/';

var UGLIFY = false;

var paths = {
  scripts : ['src/js/define.js', 'src/**/*.js', '!src/js/app.js'],
  styles  : ['src/partials/**/*.css', 'src/partials/**/**/*.css', 'src/css/*.css', '!src/css/*.min.css', 'src/css/grid/*.css'],
  assets  : ['src/assets/**/*'],
  static  : ['src/index.html', 'src/login.html', 'src/error.html', 'src/project.html', 'src/js/app.js', 'src/i18n/*', 'src/css/fonts/*', 'src/partials/**/*.html', 'src/css/images/*'],
  vendor  : ['vendor/angular/angular.js', 'vendor/angular/*.js', 'vendor/angular-translate/*', 'vendor/*.js'],
  jquery : ['vendor/jquery/*.js', 'vendor/jquery/**/*.js'],
  slick : ['vendor/SlickGrid/*.js', 'vendor/SlickGrid/plugins/*.js'],
};

gulp.task('scripts', function () {
  return gulp.src(paths.scripts)
    .pipe(gulpif(UGLIFY, uglify()))
    .pipe(concat('js/bhima.min.js'))
    .pipe(gulp.dest(destPath));
});

gulp.task('styles', function () {
  return gulp.src(paths.styles)
    .pipe(minifycss())
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest(destPath + 'css/'));
});

gulp.task('assets', function () {
  return gulp.src(paths.assets)
    .pipe(gulp.dest(destPath + 'assets/'));
});

gulp.task('vendor', function () {
  return gulp.src(paths.vendor)
    .pipe(gulp.dest(destPath + 'lib/'));
});

gulp.task('jquery', function () {
  return gulp.src(paths.jquery)
    .pipe(gulpif(UGLIFY, uglify()))
    .pipe(concat('jquery.min.js'))
    .pipe(gulp.dest(destPath+'lib/'));
});

gulp.task('slick', function () {
  return gulp.src(paths.slick)
    .pipe(gulpif(UGLIFY, uglify()))
    .pipe(concat('slickgrid.min.js'))
    .pipe(gulp.dest(destPath+'lib/'));
});

gulp.task('static', function () {
  return gulp.src(paths.static, { base : './src/' })
    .pipe(gulp.dest(destPath));
});

gulp.task('watch', function () {
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.scripts, ['scripts']);
  gulp.watch(paths.static, ['static']);
});

gulp.task('lint', function () {
  return gulp.src(paths.scripts)
    .pipe(jshint(jshintrcPath))
    .pipe(jshint.reporter('default'));
});

gulp.task('i18n', function () {
  // Compare the English and French for missing tokens
  var progPath = '../utilities/translation/tfcomp.js',
      enPath = 'src/i18n/en.json',
      frPath = 'src/i18n/fr.json';

  exec('node ' + [progPath, enPath, frPath].join(' '), function(err, _, warning) {
    if (warning) { console.error(warning); }
 	});

  return;
});

gulp.task('build', [], function () {
  gulp.start('scripts', 'styles', 'assets', 'vendor', 'jquery', 'slick', 'static');
});

gulp.task('default', [], function () {
  gulp.start('i18n', 'scripts', 'styles', 'assets', 'vendor', 'jquery', 'slick', 'static', 'watch');
});
