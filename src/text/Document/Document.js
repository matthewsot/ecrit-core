/**
 * Represents an ecrit Document.
 * @constructor
 */
ecrit.Document = function () {
    this.nodes = [];
    this.history = [];
};

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