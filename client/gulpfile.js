var gulp = require('gulp'),
    notify  = require('gulp-notify'),
    jshint = require('gulp-jshint');

var jshintrcPath = '../.jshintrc';

var paths = {
  scripts : ['src/**/*.js', '!src/js/controllers/*.js']
};

gulp.task('scripts', function () {
  return gulp.src(paths.scripts)
    .pipe(jshint(jshintrcPath))
    .pipe(jshint.reporter('default'))
    .pipe(notify({ message : 'Completed jshint task.' }));
});

gulp.task('default', [], function () {
  gulp.start('scripts');
});
