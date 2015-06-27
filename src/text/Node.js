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