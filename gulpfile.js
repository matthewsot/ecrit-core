var gulp = require("gulp");
var order = require("gulp-order");
var concat = require("gulp-concat");

var vm = require("vm");
var fs = require("fs");

gulp.task('text', function () {
    return gulp.src("src/**/*.js")
        .pipe(order([
            "ecrit.js",
            "NodeHistory.js",
            "Node.js",
            "**/*.js"
        ]))
        .pipe(concat('core.js'))
        .pipe(gulp.dest('dist/'));
});

gulp.task('default', [ "text" ]);
gulp.task('build', [ "text" ]);

function assert(val, err) {
    if (!val) {
        console.log("FAILED: " + err);
        return;
    }
    console.log("Passed: " + err);
}

gulp.task('test', function () {
    gulp.start("default");
    var code = fs.readFileSync("./dist/core.js", 'utf-8');

    var sandbox = { console: console };
    vm.runInNewContext(code, sandbox);
    
    var doc = new sandbox.ecrit.Document();
    assert(doc.id === "root", "Doc ID check");
    assert(doc.getChildNodeById("root").id === "root", "getChildNodeById");
    
    var para = new sandbox.ecrit.Paragraph(doc, "p-id-1");
    
    doc.applyTransformation({
        "affectsId": "root",
        "timestamp": (new Date()).getTime(),
        "action": "insertNode",
        "node": para,
        "lastApplied": -1
    });
    
    assert(doc.children.length === 1, "Doc child length");
    assert(doc.getChildNodeById("p-id-1") === para, "getChildNodeById");
    
    doc.getChildNodeById("p-id-1").applyTransformation({
        "affectsId": "p-id-1",
        "timestamp": (new Date()).getTime(),
        "action": "insertNode",
        "node": new sandbox.ecrit.TextSpan(para, "ts-id-1", { text: "test text" }),
        "lastApplied": -1
    });
    
    assert(doc.getChildNodeById("ts-id-1").text === "test text", "TextSpan text");

    doc.getChildNodeById("ts-id-1").applyTransformation(new sandbox.ecrit.Transformation({
        remove: false,
        action: "insertText",
        text: "abc",
        index: 0,
        timestamp: 300,
        lastApplied: -1
    }));

    assert(doc.getChildNodeById("ts-id-1").text === "abctest text", "TextSpan test text");
});

gulp.task('simple-test', function () {
    var coreCode = fs.readFileSync("./dist/core.js", 'utf-8');
    var lineCode = fs.readFileSync("./Line/line.js", 'utf-8');

    var sandbox = {};
    sandbox.console = console;
    vm.runInNewContext(coreCode, sandbox);
    vm.runInNewContext(lineCode, sandbox);

    // A test of the "3-Person Collisions" example from Design\Text Manipulation\Collisions.md with timestamps x100

    var A = new sandbox.Line("xyz123");
    var B = new sandbox.Line("xyz123");
    var C = new sandbox.Line("xyz123");

    var ATransform = {
        action: "insertText",
        text: "abc",
        index: 0,
        timestamp: 300,
        lastApplied: -1
    };

    var BTransform = {
        action: "insertText",
        text: "hello",
        index: 6,
        timestamp: 500,
        lastApplied: 100
    };

    var CTransform = {
        action: "insertText",
        text: "aaa",
        index: 1,
        timestamp: 100,
        lastApplied: -1
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

gulp.task('watch', function () {
    gulp.watch("src/**/*", function(v) {
        gulp.start('default');
    });
});