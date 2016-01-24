/**
 * Represents an ecrit Document.
 * @constructor
 */
ecrit.Document = function () {
    this.document = this;
    this.id = "root";
    
    ecrit.Node.call(this, this, "root", []);
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