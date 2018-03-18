const browserify = require("browserify"),
      gulp = require("gulp"),
      source = require("vinyl-source-stream"),
      ts = require("gulp-typescript"),
      tsify = require("tsify");

/**
 * Server build
 */
gulp.task('server-js', () => {
    var server = ts.createProject("tsconfig.json");

    return server.src()
        .pipe(server())
        .js.pipe(gulp.dest('dist'));
});

gulp.task('server-config', () => {
    return gulp.src(['src/**/config.json'])
        .pipe(gulp.dest('dist'));
});

gulp.task('server', gulp.parallel('server-js', 'server-config'));


/**
 * Client build
 */
gulp.task('client-js', () => {
    return browserify({
        basedir: './src/public',
        debug: true,
        entries: ['js/client.ts'],
        cache: {},
        packageCache: {}
    }).plugin(tsify)
      .bundle()
      .pipe(source('client.js'))
      .pipe(gulp.dest('dist/public/js'));
});

gulp.task('client-views', () => {
    return gulp.src(['src/public/views/**/*.html'])
        .pipe(gulp.dest('dist/public/views'));
});

gulp.task('client-css', () => {
    return gulp.src(['src/public/css/**/*.css'])
        .pipe(gulp.dest('dist/public/css'));
});

gulp.task('client', gulp.parallel('client-js', 'client-css', 'client-views'));


/**
 * Test build
 */
gulp.task('test', () => {
    var test = ts.createProject("test/tsconfig.json");

    return test.src()
        .pipe(test())
        .js.pipe(gulp.dest('dist-test'));
});


/**
 * Default build
 */
gulp.task('default', gulp.parallel('client', 'server'));
