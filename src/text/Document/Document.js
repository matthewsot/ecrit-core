/**
 * Represents an ecrit Document.
 * @constructor
 */
ecrit.Document = function () {
    this.document = this;
    
    ecrit.Node.call(this, this, "root", []);
    
    this.history = [];
};

ecrit.Document.prototype = Object.create(ecrit.Node.prototype);

ecrit.Document.prototype._detectConflicts = function (transformation) {
    var conflicts = [];

    for (var i = 0; i < this.history.length; i++) {
        var compare = this.history[i];

        if (compare.timestamp > transformation.timestamp && compare.affectsId === transformation.affectsId) {
            conflicts.push(compare);
        }
    }
    
    return conflicts;
};

ecrit.Document.prototype._applyTransformation = function (transformation) {
    var node = this.getNodeById(transformation.affectsId);

    switch (transformation.action) {
        case "insertText":
            node.insertText(transformation.atIndex, transformation.contents);
            break;
        case "removeText":
            node.removeText(transformation.fromIndex, transformation.toIndex);
            break;

        case "insertNode":
            node.insertNode(transformation.node, transformation.afterId, transformation.beforeId);
            break;
        case "removeNode":
            node.remove();
            break;

        case "modifyFormatting":
            node.modifyFormatting(transformation.add, transformation.remove);
            break;
    }

    this._emit("transformationApplied", { transformation: transformation });
};

/** 
 * Applies a transformation, deals with conflicting transformations, and adds the transformation to the history.
 * @param {Transformation} transformation - The transformation to apply
 */
ecrit.Document.prototype.applyTransformation = function (transformation) {
    var conflicts = this._detectConflicts(transformation);

    // Undo the conflicts in LIFO order (last applied -> undone first)
    for (var i = (conflicts.length - 1); i >= 0; i--) {
        this._applyTransformation(conflicts[i].reversed());
    }

    this._applyTransformation(transformation);

    // Reapply the conflicts in LOFI order (last undone -> last reapplied)
    for (var i = 0; i < conflicts.length; i++) {
        this._applyTransformation(conflicts[i]);
    }

    this.history.push(transformation);
};