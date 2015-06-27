var ecrit = {};
ecrit.Node = function (parent, id, nodes) {
    this.parent = parent;
    this.id = id;
    this.document = parent.document;
    this.children = nodes || [];
    this.listeners = [];
};

/**
 * Returns a node in the document by its id.
 * @params id {string} - The id of the node to find, "root" for the Document.
 * @returns {object} - The node found, or null if there was no node found.
 */
ecrit.Node.prototype.getNodeById = function (id) {
    if (id === this.id) {
        return this;
    }
    
    for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].id === id) {
            return this.children[i];
        }
        
        var node = this.children[i].getNodeById(id);
        if (node !== null) { 
            return node;
        }
    }

    return null;
};

/**
 * Subscribes to an event
 * @param {string} event - The event to subscribe to.
 * @param {string} listener - The listener to call when that event is fired
 */
ecrit.Node.prototype.on = function (event, listener) {
    this.listeners.push({ "event": event, "listener": listener });
};
/**
 * Unsubscribes once from an event
 * @param {string} event - The event to unsubscribe from.
 * @param {string} listener - The listener to unsubscribe.
 */
ecrit.Node.prototype.off = function (event, listener) {
    for (var i = 0; i < this.listeners.length; i++) {
        var found = this.listeners[i];
        if (found.event === event && found.listener == listener) {
            this.listeners.splice(i, 1);
            return;
        }
    }
};
ecrit.Node.prototype._emit = function (event, data) {
    for (var i = 0; i < this.listeners.length; i++) {
        var found = this.listeners[i];
        if (found.event === event) {
            this.listeners[i].listener(data);
        }
    }
};
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

ecrit.Paragraph = function (parent, id, nodes) {
    ecrit.Node.call(this, parent, id, nodes);
};

ecrit.Paragraph.prototype = Object.create(ecrit.Node.prototype);
ecrit.TextSpan = function (id, options) {
    this.id = id;
    this.contents = options.contents || "";
    this.formatting = options.formatting || [];
};