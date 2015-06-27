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
    
    var doc = new sandbox.ecrit.Document();
    assert(doc.id === "root", "Doc ID check");
    assert(doc.getNodeById("root").id === "root", "getNodeById");

    var para = new sandbox.ecrit.Paragraph(doc, "p-id-1");
    doc.applyTransformation({
        "affectsId": "root",
        "timestamp": (new Date()).getTime(),
        "action": "insertNode",
        "node": para
    });
    assert(doc.children.length === 1, "Doc child length");
    assert(doc.getNodeById("p-id-1") === para, "getNodeById");
});