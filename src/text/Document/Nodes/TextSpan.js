ecrit.TextSpan = function (id, options) {
    this.id = id;
    this.text = options.text || "";
    this.formatting = options.formatting || [];
};

ecrit.TextSpan.prototype = Object.create(ecrit.Node.prototype);
ecrit.TextSpan.prototype.constructor = ecrit.TextSpan;

ecrit.TextSpan.prototype._applyTransformation = function (transformation) {
    switch (transformation.action) {
        case "removeText":
            var newStr = this.text.substring(0, transformation.index);
            newStr += this.text.substring((transformation.index + transformation.text.length));
            this.text = newStr;
            return;
        case "insertText":
            this.text = this.text.slice(0, transformation.index) + transformation.text + this.text.slice(transformation.index);
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
        transformation = JSON.parse(JSON.stringify(transformation));
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
};