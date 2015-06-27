/**
 * Represents an ecrit Document.
 * @constructor
 */
ecrit.Document = function () {
    //this.allNodes = {};
    this.children = [];
    this.history = [];
    this.listeners = [];
};

/**
 * Subscribes to an event
 * @param {string} event - The event to subscribe to.
 * @param {string} listener - The listener to call when that event is fired
 */
ecrit.Document.prototype.on = function (event, listener) {
    this.listeners.push({ "event": event, "listener": listener });
};
/**
 * Unsubscribes once from an event
 * @param {string} event - The event to unsubscribe from.
 * @param {string} listener - The listener to unsubscribe.
 */
ecrit.Document.prototype.off = function (event, listener) {
    for (var i = 0; i < this.listeners.length; i++) {
        var found = this.listeners[i];
        if (found.event === event && found.listener == listener) {
            this.listeners.splice(i, 1);
            return;
        }
    }
};
ecrit.Document.prototype._emit = function (event, data) {
    for (var i = 0; i < this.listeners.length; i++) {
        var found = this.listeners[i];
        if (found.event === event) {
            this.listeners[i].listener(data);
        }
    }
};

/**
 * Returns a node in the document by its id.
 * @params id {string} - The id of the node to find, "root" for the Document.
 * @returns {object} - The node found, or null if there was no node found.
 */
ecrit.Document.prototype.getNodeById = function (id) {
    if (id === "root") {
        return this;
    }
    
    for (var i = 0; i < this.children.length; i++) {
        var node = this.children[i].getNodeById(id);
        if (node !== null) { 
            return node;
        }
    }

    return null;
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
    var node = ecrit.Document.prototype.getNodeById(transformation.affectsId);

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