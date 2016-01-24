var ecrit = ecrit || {};
ecrit.NodeHistory = function () {
	this._push = this.push;
	this.push = function (element) {
	    this._push(element);
	    this.sort(function (a, b) {
	        return a.timestamp - b.timestamp;
	    });
	};
};

ecrit.NodeHistory.prototype = Object.create(Array.prototype);

ecrit.NodeHistory.prototype.withTimestamp = function (stamp) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].timestamp === stamp) {
            return this[i];
        }
    }
    return null;
};

ecrit.NodeHistory.prototype.afterTimestamp = function (stamp) {
    var ret = [];
    for (var i = 0; i < this.length; i++) {
        if (this[i].timestamp > stamp) {
            ret.push(this[i]);
        }
    }
    return ret;
};

ecrit.NodeHistory.prototype.betweenTimestamps = function (afterStamp, beforeStamp) {
    var ret = [];
    for (var i = 0; i < this.length; i++) {
        if (this[i].timestamp > afterStamp && this[i].timestamp < beforeStamp) {
            ret.push(this[i]);
        }
    }
    return ret;
};
ecrit.Node = function (type, parent, id, nodes) {
    this.type = type;
    this.parent = parent;
    this.id = id;
    this.document = parent.document;
    this.children = nodes || [];
    this.listeners = [];
    
    this.deferred = [];
    this.history = new ecrit.NodeHistory();
};

/**
 * Returns a node in the document by its id.
 * @params id {string} - The id of the node to find, "root" for the Document.
 * @returns {object} - The node found, or null if there was no node found.
 */
ecrit.Node.prototype.getChildNodeById = function (id, recursive) {
    recursive = (typeof recursive === "boolean") ? recursive : true;
    
    if (id === this.id) {
        return this;
    }
    
    for (var i = 0; i < this.children.length; i++) {
        if (this.children[i].id === id) {
            return this.children[i];
        }

        if (!recursive) continue;

        var node = this.children[i].getChildNodeById(id);
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
 * Inserts the node at the specified position.
 * @param {Node} node - The node to insert
 * @param {string} beforeId - The ID of the node to insert before
 * @param {string} afterId - The ID of the node to insert after
 */
ecrit.Node.prototype.insertNode = function (node, afterId, beforeId) {
    function emitIt() {
        this._emit("nodeInserted", { node: node, index: this.children.indexOf(node) });
    };
    
    if (typeof afterId === "string") {
        var insertAt = this.children.indexOf(this.getChildNodeById(afterId)) + 1;
        if (insertAt !== -1) {
            this.children.splice(insertAt, 0, node);
        }
        emitIt.call(this);
        return;
    }

    if (typeof beforeId === "string") {
        var insertAt = this.children.indexOf(this.getChildNodeById(beforeId));
        if (insertAt !== -1) {
            this.children.splice(insertAt, 0, node);
        }
        emitIt.call(this);
        return;
    }

    this.children.push(node);
    emitIt.call(this);
};

/**
 * Removes the specified child node.
 * @param {Node} node - The node to remove
 */
ecrit.Node.prototype.removeNode = function (node) {
    var foundNode = this.getChildNodebyId(node.id, false);
    if (foundNode === null || foundNode === this) return;

    var index = this.children.indexOf(foundNode);
    this.children.splice(index, 1);

    this._emit("nodeRemoved", foundNode);
};
/**
 * Represents an ecrit Document.
 * @constructor
 */
ecrit.Document = function () {
    this.document = this;
    this.id = "root";
    
    ecrit.Node.call(this, "Document", this, "root", []);
};

ecrit.Document.prototype = Object.create(ecrit.Node.prototype);
ecrit.Document.prototype.constructor = ecrit.Document;

ecrit.Document.prototype._applyTransformation = function (transformation) {
    switch (transformation.action) {
        case "insertNode":
            this.insertNode(transformation.node, transformation.afterId, transformation.beforeId);
            return;
        case "removeNode":
            this.removeNode(transformation.node);
            return;
    }
};

/** 
 * Applies a transformation, deals with conflicting transformations, and adds the transformation to the history.
 * @param {Transformation} transformation - The transformation to apply
 */
ecrit.Document.prototype.applyTransformation = function (transformation, clone) {
    if (clone !== false) {
        /*var targetNode = transformation.targetNode; //prevents a circular dependency
        
        transformation.targetNode = {};
        var clonedTransformation = JSON.parse(JSON.stringify(transformation));
        clonedTransformation.targetNode = targetNode;
        transformation.targetNode = targetNode;*/
    }

    var reference = this.history.withTimestamp(transformation.lastApplied);
    if (transformation.lastApplied !== -1 && reference === null) {
        this.deferred.push(transformation);
        return;
    }

    var U = this.history.afterTimestamp(transformation.timestamp);
    for (var i = (U.length - 1); i >= 0; i--) {
        this.history.splice(this.history.indexOf(U[i]), 1);
        this._undo(U[i]);
    }

    var E = this.history.betweenTimestamps(transformation.lastApplied, transformation.timestamp);
    var D = 0;
    for (var i = 0; i < E.length; i++) {
        var toCheck = E[i];
        //TODO: handle this?
    }
    /*var initialIndex = transformation.index;
    transformation.index += D;*/

    this._applyTransformation(transformation);

    this.history.push(transformation);

    for (var i = 0; i < U.length; i++) {
        var toApply = U[i];
        /*if (toApply.index > initialIndex) {
            toApply.index += D + transformation.text.length;
        }*/
        this._applyTransformation(toApply);
        this.history.push(toApply);
    }
    
    for (var i = 0; i < this.deferred.length; i++) {
        if (this.deferred[i].lastApplied === transformation.timestamp) {
            this.applyTransformation(this.deferred[i]);
            this.deferred.splice(i, 1);
            i--;
        }
    }
};

ecrit.Paragraph = function (parent, id, nodes) {
    ecrit.Node.call(this, "Paragraph", parent, id, nodes);
};

ecrit.Paragraph.prototype = Object.create(ecrit.Node.prototype);

ecrit.Paragraph.prototype._applyTransformation = function (transformation) {
    switch (transformation.action) {
        case "insertNode":
            this.insertNode(transformation.node, transformation.afterId, transformation.beforeId);
            return;
        case "removeNode":
            this.removeNode(transformation.node);
            return;
    }
};

/** 
 * Applies a transformation, deals with conflicting transformations, and adds the transformation to the history.
 * @param {Transformation} transformation - The transformation to apply
 */
ecrit.Paragraph.prototype.applyTransformation = function (transformation, clone) {
    if (clone !== false) {
        /*var targetNode = transformation.targetNode; //prevents a circular dependency
        
        transformation.targetNode = {};
        var clonedTransformation = JSON.parse(JSON.stringify(transformation));
        clonedTransformation.targetNode = targetNode;
        transformation.targetNode = targetNode;*/
    }

    var reference = this.history.withTimestamp(transformation.lastApplied);
    if (transformation.lastApplied !== -1 && reference === null) {
        this.deferred.push(transformation);
        return;
    }

    var U = this.history.afterTimestamp(transformation.timestamp);
    for (var i = (U.length - 1); i >= 0; i--) {
        this.history.splice(this.history.indexOf(U[i]), 1);
        this._undo(U[i]);
    }

    var E = this.history.betweenTimestamps(transformation.lastApplied, transformation.timestamp);
    var D = 0;
    for (var i = 0; i < E.length; i++) {
        var toCheck = E[i];
        //TODO: handle this?
    }
    /*var initialIndex = transformation.index;
    transformation.index += D;*/

    this._applyTransformation(transformation);

    this.history.push(transformation);

    for (var i = 0; i < U.length; i++) {
        var toApply = U[i];
        /*if (toApply.index > initialIndex) {
            toApply.index += D + transformation.text.length;
        }*/
        this._applyTransformation(toApply);
        this.history.push(toApply);
    }
    
    for (var i = 0; i < this.deferred.length; i++) {
        if (this.deferred[i].lastApplied === transformation.timestamp) {
            this.applyTransformation(this.deferred[i]);
            this.deferred.splice(i, 1);
            i--;
        }
    }
};
ecrit.TextSpan = function (parent, id, options) {
    options = options || {};
    this.text = options.text || "";
    this.formatting = options.formatting || [];
    
    ecrit.Node.call(this, "TextSpan", parent, id);
};

ecrit.TextSpan.prototype = Object.create(ecrit.Node.prototype);
ecrit.TextSpan.prototype.constructor = ecrit.TextSpan;

ecrit.TextSpan.prototype._applyTransformation = function (transformation) {
    switch (transformation.action) {
        case "removeText":
            var newStr = this.text.substring(0, transformation.index);
            newStr += this.text.substring((transformation.index + transformation.text.length));
            this.text = newStr;
            this._emit("textModified", transformation);
            return;
        case "insertText":
            this.text = this.text.slice(0, transformation.index) + transformation.text + this.text.slice(transformation.index);
            this._emit("textModified", transformation);
            return;
    }
};

ecrit.TextSpan.prototype._undo = function (transformation) {
    transformation.action = transformation.action === "insertText" ? "removeText" : "insertText";
    this._applyTransformation(transformation);
    transformation.action = transformation.action === "insertText" ? "removeText" : "insertText";
};

ecrit.TextSpan.prototype.applyTransformation = function (transformation, clone) {
    if (clone !== false) {
        transformation = new ecrit.Transformation(JSON.parse(JSON.stringify(transformation)));
    }

    var reference = this.history.withTimestamp(transformation.lastApplied);
    if (transformation.lastApplied !== -1 && reference === null) {
        this.deferred.push(transformation);
        return;
    }

    var U = this.history.afterTimestamp(transformation.timestamp);
    for (var i = (U.length - 1); i >= 0; i--) {
        this.history.splice(this.history.indexOf(U[i]), 1);
        this._undo(U[i]);
    }
    
    var E = this.history.betweenTimestamps(transformation.lastApplied, transformation.timestamp);
    var D = 0;
    for (var i = 0; i < E.length; i++) {
        var toCheck = E[i];
        if (toCheck.index < transformation.index) {
            D += toCheck.remove ? (-1 * toCheck.text.length) : toCheck.text.length;
        }
    }
    var initialIndex = transformation.index;
    transformation.index += D;

    this._applyTransformation(transformation);

    this.history.push(transformation);

    for (var i = 0; i < U.length; i++) {
        var toApply = U[i];
        if (toApply.index > initialIndex) {
            toApply.index += D + transformation.text.length;
        }
        this._applyTransformation(toApply);
        this.history.push(toApply);
    }
    
    for (var i = 0; i < this.deferred.length; i++) {
        if (this.deferred[i].lastApplied === transformation.timestamp) {
            this.applyTransformation(this.deferred[i]);
            this.deferred.splice(i, 1);
            i--;
        }
    }

    this._emit("appliedTransformation", transformation)
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