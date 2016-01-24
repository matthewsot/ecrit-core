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
    var foundNode = this.getChildNodeById(node.id);
    if (foundNode === null || foundNode === this) return;

    var index = this.children.indexOf(foundNode);
    this.children.splice(index, 1);

    this._emit("nodeRemoved", foundNode);
};