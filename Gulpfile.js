var path = require('path');
var bluebird = require('bluebird');
var fs = require('fs');
var gulp = require('gulp');
var del = bluebird.promisifyAll(require('del'));
var merge = require('merge-stream');

// Load plugins from the package.json
var plugins = require('gulp-load-plugins')();
var constants = require('./constants');
var assetsPath = path.resolve('assets');

var paths = {
  assets: {
    js: path.join(assetsPath, 'js'),
    css: path.join(assetsPath, 'css'),
  },
  public: './public/assets',
};

gulp.task('default', ['js:uglify', 'css:minify', 'index:compile']);
gulp.task('js', ['js:bundle']);
gulp.task('css', ['css:compile']);
gulp.task('watch', ['js', 'css'], function() {
  gulp.watch(path.join(paths.assets.js, 'src/**'), ['js']);
  gulp.watch(path.join(paths.assets.css, '**'), ['css']);
});

gulp.task('clean:js', function(done) { del(path.join(paths.public, '*.min.js'), done); });
gulp.task('clean:css:compilation', function(done) { del(path.join(paths.assets.css, '*.compiled.css'), done); });
gulp.task('clean:css:minification', function(done) { del(path.join(paths.public, '*.min.css'), done); });

gulp.task('mkdir:public', function(done) {
  // Avoid EEXISTS error
  fs.mkdir(paths.public, function() { done(); });
});

gulp.task('js:bundle', function() {
  return gulp.src(path.join(paths.assets.js, 'src/index.js'))
    .pipe(plugins.browserify({ debug: process.env.NODE_ENV !== 'production' }))
    .pipe(plugins.rename({ basename: 'bundle' }))
    .pipe(gulp.dest(path.join(paths.assets.js)));
});

gulp.task('js:uglify', ['clean:js', 'mkdir:public', 'js:bundle'], function() {
  var manifests = gulpMatches(paths.assets.js, '.manifest.js', function(data) {
    return gulp.src(data.assets)
      .pipe(plugins.concat(path.join(data.basename + constants.gitHead + '.min.js')))
      .pipe(plugins.uglify()).on('error', errorHandler) 
      .pipe(gulp.dest(paths.public));
  });

  var term = gulp.src(path.join(paths.assets.js, 'term.client.js'))
    .pipe(plugins.uglify())
    .pipe(plugins.rename(function(filepath) { filepath.basename += constants.gitHead + '.min'; }))
    .pipe(gulp.dest(paths.public));

  return merge(manifests, term);
});

gulp.task('css:compile', ['clean:css:compilation'], function() {
  return gulpMatches(paths.assets.css, '.sass', function(data) {
    return gulp.src(data.assets)
      .pipe(plugins.rename({ basename: data.basename + '.compiled' }))
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.sass())
      .pipe(plugins.sourcemaps.write('./maps'))
      .pipe(gulp.dest(paths.assets.css));
  });
});

gulp.task('css:minify', ['css:compile', 'clean:css:minification', 'mkdir:public'], function() {
  return gulpMatches(paths.assets.css, '.compiled.css', function(data) {
    return gulp.src(data.assets)
      .pipe(plugins.rename({ basename: data.basename + constants.gitHead + '.min' }))
      .pipe(plugins.minifyCss())
      .pipe(gulp.dest(paths.public));
  });
});

gulp.task('index:compile', function() {
  var jadeHelpers = require('./jadeHelpers')();

  var port = 8181
  return gulp.src('public/index.jade')
    .pipe(plugins.jade({
      locals: {
        port: port,
        commit: constants.gitHead,
        version: constants._COMPUTE_VERSION,
        js: jadeHelpers.js,
        css: jadeHelpers.css,
        showPopovers: constants.showPopovers,
        includeTerminalHelp: constants.includeTerminalHelp,
        createUsername: constants.createUsername,
        useDashForPort: constants.useDashForPort,
        externalUrl: constants.externalUrl,
        dir: process.env.NODE_ENV !== 'production' ? __dirname : constants.dirname
      }
    }))
    .pipe(gulp.dest('./public/'));
});

function gulpMatches(filepath, ext, task) {
  var files = fs.readdirSync(filepath);
  var streams = files
    .filter(function(basename) { return new RegExp(ext.replace(/\./g, '\\.') + '$').test(basename); })
    .map(function(relpath) { return path.join(filepath, relpath); })
    .map(function(filepath) {
      var dir = path.dirname(filepath);
      var basename = path.basename(filepath, ext);
      var deps;
      if (/\.js(on)?$/.test(filepath)) {
        // Load js files
        deps = require(filepath).map(function(filepath) { return path.join(dir, filepath); });
      } else {
        // Load other files
        deps = filepath;
      }
      return {
        basename: basename,
        assets: deps,
      };
    })
    .map(task);

  return merge(streams);
}

function errorHandler (error) {
  console.error(error.toString());
  this.emit('end');
}
