var gulp = require('gulp'),
    notify  = require('gulp-notify'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    minifycss = require('gulp-minify-css'),
    htmlreplace = require('gulp-html-replace'),
    jshint = require('gulp-jshint');

var jshintrcPath = '../.jshintrc';

var paths = {
  scripts : ['src/**/*.js', '!src/js/app.js'],
  
  // FIXME You shouldn't need src/partials/**/**/*.css
  styles : ['src/partials/**/*.css', 'src/partials/**/**/*.css', 'src/css/*.css', '!src/css/*.min.css', 'src/css/grid/*.css'],
  templates : ['src/partials/**/*.html'],
  assets : ['src/assets/**/*'],
  structure : ['src/index.html', 'src/login.html', 'src/error.html', 'project.html', 'src/js/app.js'],
  vendor : ['vendor/']
};

var destPath = 'dest/';

gulp.task('scripts', function () {
  return gulp.src(paths.scripts)
    .pipe(jshint(jshintrcPath))
    .pipe(jshint.reporter('default'))
    .pipe(uglify())
    .pipe(concat('bhima.min.js'))
    .pipe(gulp.dest(destPath))
    .pipe(notify({ message : 'Completed compiling scripts.' }));
});

// TODO Remove minification of other vendors CSS, only minify and compile bhima CSS
gulp.task('styles', function () {
  return gulp.src(paths.styles)
    .pipe(minifycss())
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest(destPath))
    .pipe(notify({ message : 'Completed compliling styles.' }));
});

// TODO Not all assets will be images, this will have to be more specific
gulp.task('assets', function () {
  return gulp.src(paths.assets)
    // .pipe(imagemin({ optimizationLevel : 3, progressive : true, interlaced : true}))
    .pipe(gulp.dest(destPath + 'assets/'))
    .pipe(notify({ message : 'Completed optimizing and transfering assets' }));
});

gulp.task('templates', function () {
  return gulp.src(paths.templates)
    .pipe(gulp.dest(destPath + 'templates/'))
    .pipe(notify({message : 'Completed transfering templates.' }));
});

gulp.task('vendor', function () {
  return gulp.src(paths.vendor)
    .pipe(gulp.dest(destPath + 'lib/'))
    .pipe(notify({ message : 'Completed transfering vendor files'}));
});

// TODO rename
gulp.task('structure', function () {
  return gulp.src(paths.structure)
    .pipe(gulp.dest(destPath))
    .pipe(notify({ message : 'Completed compiling/ transfering structure files'}));
});

gulp.task('watch', function () {

  // TODO Use gulp-changed/ gulp-newer
  gulp.watch(paths.styles, ['styles']);
  gulp.watch(paths.templates, ['templates']);
  gulp.watch(paths.scripts, ['scripts']);
});

gulp.task('default', [], function () {
  gulp.start('scripts', 'templates', 'styles', 'assets', 'vendor', 'structure');
});
