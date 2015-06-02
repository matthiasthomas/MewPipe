'use strict';

// Include Gulp & Tools We'll Use
var fs = require('fs');
var gulp = require('gulp');
var sass = require('gulp-ruby-sass');
var header = require('gulp-header');
var footer = require('gulp-footer');
var rename = require('gulp-rename');
var concat = require('gulp-concat');

var minifyCss = require('gulp-minify-css');
var minifyHtml = require("gulp-minify-html");
var uglify = require('gulp-uglifyjs');

var watch = require('gulp-watch');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');
var reload = browserSync.reload;

var config = {
  pkg : JSON.parse(fs.readFileSync('./package.json')),
  banner:
  '/*!\n' +
  ' * <%= pkg.name %>\n' +
  ' * <%= pkg.author %>\n' +
  ' * Version: <%= pkg.version %> - <%= timestamp %>\n' +
  ' * License: <%= pkg.license %>\n' +
  ' */\n\n\n',
  lib:[
  "./lib/angular/angular.js",
  "./lib/angular-animate/angular-animate.js",
  "./lib/angular-bootstrap/ui-bootstrap.js",
  "./lib/angular-bootstrap/ui-bootstrap-tpls.js",
  "./lib/angular-cookies/angular-cookies.js",
  "./lib/angular-moment/angular-moment.js",
  "./lib/angular-resource/angular-resource.js",
  "./lib/angular-route/angular-route.js",
  "./lib/angular-sanitize/angular-sanitize.js",
  "./lib/angular-touch/angular-touch.js",
  "./lib/jquery/dist/jquery.min.js",
  "./lib/classie/classie.js",
  "./lib/moment/moment.js",
  "./lib/bootswatch-dist/js/bootstrap.js",  
  "./lib/ng-file-upload/ng-file-upload-shim.js",
  "./lib/ng-file-upload/ng-file-upload.js",
  "./lib/videogular/videogular.js",
  "./lib/videogular-buffering/vg-buffering.js",
  "./lib/videogular-controls/vg-controls.js",
  "./lib/videogular-ima-ads/vg-ima-ads.js",
  "./lib/videogular-overlay-play/vg-overlay-play.js",
  "./lib/videogular-poster/vg-poster.js"
  ]
};

// task CSS/SCSS
gulp.task('sass', function() {
  return sass('./styles/scss/global.scss', { compass: true, sourcemap: true, noCache : true, style: 'compact' })
    .on('error', function (err) {
      console.error('Error', err.message);
   })
  .pipe(header(config.banner, {
    timestamp: (new Date()).toISOString(), pkg: config.pkg
  }))
  .pipe(concat('style.css'))
  .pipe(gulp.dest('./styles'));
});

// task JS 
gulp.task('js', ['js-lib'], function () {
  gulp.src('./scripts/**/*.js')
  .pipe(header(config.banner+'(function () { \n"use strict";\n\n', {
    timestamp: (new Date()).toISOString(), pkg: config.pkg
  }))
  .pipe(footer('\n}());'))
    // .pipe(gulp.dest('./dist/js'));
  });

gulp.task('js-lib', function(){
  return gulp.src(config.lib)
  .pipe(sourcemaps.init())
  .pipe(concat('lib.concat.js'))
  // .pipe(uglify({
  //   compress: {
  //     negate_iife: false
  //   }
  // }))
  .pipe(rename('lib.min.js'))
  .pipe(sourcemaps.write('./'))
  .pipe(gulp.dest('./lib'));
});

// task watch
gulp.task('watch', function() {
  gulp.watch('styles/scss/*.scss', ['sass']);
  gulp.watch('styles/*.css', reload);

});

// task default
gulp.task('default', ['sass', 'js', 'watch'], function () {
  browserSync({
    notify: false,
    // https: true,
    server: ['.tmp', '']
  });

  gulp.watch(['./**/*.html'], reload);
  gulp.watch(['./styles/**/*.scss'], ['sass', reload]);
  gulp.watch(['./images/**/*'], reload);

});
