var Line = function (text) {
    this.doc = new ecrit.Document();
    var para = new ecrit.Paragraph(this.doc, "p-id-1");
    
    this.doc.applyTransformation({
        "affectsId": "root",
        "timestamp": (new Date()).getTime(),
        "action": "insertNode",
        "node": para,
        "lastApplied": -1
    });
    
    this.doc.getChildNodeById("p-id-1").applyTransformation({
        "affectsId": "p-id-1",
        "timestamp": (new Date()).getTime(),
        "action": "insertNode",
        "node": new ecrit.TextSpan(para, "ts-id-1", { text: text }),
        "lastApplied": -1
    });

    this.__defineGetter__("text", function(){
        return this.doc.getChildNodeById("ts-id-1").text;
    });
};

Line.prototype.applyTransformation = function (transformation) {
    this.doc.getChildNodeById("ts-id-1").applyTransformation(new ecrit.Transformation(transformation));
};