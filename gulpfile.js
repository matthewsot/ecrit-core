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
        return;
    }
    //console.log("Passed: " + err);
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

gulp.task('simple-test', function () {
    var code = fs.readFileSync("./Line/line.js", 'utf-8');

    var sandbox = {};
    sandbox.console = console;
    vm.runInNewContext(code, sandbox);

    // A test of the "3-Person Collisions" example from Design\Text Manipulation\Collisions.md with timestamps x100

    var A = new sandbox.Line("xyz123");
    var B = new sandbox.Line("xyz123");
    var C = new sandbox.Line("xyz123");

    var ATransform = {
        remove: false,
        content: "abc",
        index: 0,
        timestamp: 300,
        lastApplied: 0
    };

    var BTransform = {
        remove: false,
        content: "hello",
        index: 6,
        timestamp: 500,
        lastApplied: 100
    };

    var CTransform = {
        remove: false,
        content: "aaa",
        index: 1,
        timestamp: 100,
        lastApplied: 0
    };

// A tests
    A.applyTransformation(ATransform);
    assert(A.text === "abcxyz123", "A1");

    A.applyTransformation(BTransform);
    assert(A.text === "abcxyz123", "AB1");

    A.applyTransformation(CTransform);
    assert(A.text === "abcxaaayzhello123", "AC1");

// B tests
    B.applyTransformation(CTransform);
    assert(B.text === "xaaayz123", "BC1");

    B.applyTransformation(BTransform);
    assert(B.text === "xaaayzhello123", "B1");

    B.applyTransformation(ATransform);
    assert(B.text === "abcxaaayzhello123", "BA1");

// C tests
    C.applyTransformation(CTransform);
    assert(C.text === "xaaayz123", "C1");

    C.applyTransformation(BTransform);
    assert(C.text === "xaaayzhello123", "C2");

    C.applyTransformation(ATransform);
    assert(C.text === "abcxaaayzhello123", "C1");

    console.log(A.text);
    console.log(B.text);
    console.log(C.text);
});