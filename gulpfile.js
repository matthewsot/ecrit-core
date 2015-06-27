var gulp = require('gulp');
var concat = require('gulp-concat');

var vm = require('vm');
var fs = require("fs");

gulp.task('default', function () {
    return gulp.src(["./src/**/*.js"])
        .pipe(concat('ecrit.js'))
        .pipe(gulp.dest('./dist/'));
});

function assert(val, err) {
    if (!val) {
        console.log("FAILED: " + err);
    }
    console.log("Passed: " + err)
}

gulp.task('test', function () {
    var code = fs.readFileSync("./dist/ecrit.js", 'utf-8');

    var sandbox = {};
    vm.runInNewContext(code, sandbox);
    
    var m = new sandbox.ecrit.Document();
    assert(m.id === "root", "Doc ID check");
    assert(m.getNodeById("root").id === "root", "getNodeById");
});