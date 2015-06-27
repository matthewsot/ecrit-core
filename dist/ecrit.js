var ecrit = {};
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
/**
 * Represents a transformation to a Document.
 * @constructor
 * @param {object} data - The transformation data to apply.
 */
ecrit.Transformation = function (data) {
    for (var prop in data) {
        if (data.hasOwnProperty(prop)) {
            this[prop] = data[prop];
        }
    }
};

/**
 * Reverses a transformation. The reversed transformation can be applied as an undo transformation.
 * @returns {Transformation} - The reversed transformation
 */
ecrit.Transformation.prototype.reversed = function () {
    var reversed = new Transformation(this);
    
    switch (this.action) {
        case "insertText":
            reversed.action = "removeText";
            reversed.fromIndex = this.atIndex;
            reversed.toIndex = this.atIndex + this.contents.length;
            break;
        case "removeText":
            reversed.action = "insertText";
            reversed.atIndex = this.fromIndex;
            break;

        case "removeNode":
            reversed.action = "insertNode";
            break;
        case "insertNode":
            reversed.action = "removeNode";
            break;

        case "modifyFormat":
            reversed.add = reversed.remove;
            reversed.remove = reversed.add;
            break;
    }

    return reversed;
};

ecrit.Paragraph = function (id, nodes) {
    this.id = id;
    this.nodes = nodes || [];
};
ecrit.TextSpan = function (id, options) {
    this.id = id;
    this.contents = options.contents || "";
    this.formatting = options.formatting || [];
};