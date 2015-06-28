var Line = function (text) {
    this.text = "";
    this.deferred = [];
    this.history = [];

    this.history.withTimestamp = function (stamp) {
        for (var i = 0; i < this.length; i++) {
            if (this[i].timestamp === stamp) {
                return this[i];
            }
        }
        return null;
    };

    this.history.afterTimestamp = function (stamp) {
        var ret = [];
        for (var i = 0; i < this.length; i++) {
            if (this[i].timestamp > stamp) {
                ret.push(this[i]);
            }
        }
        return ret;
    };

    this.history.betweenTimestamps = function (afterStamp, beforeStamp) {
        var ret = [];
        for (var i = 0; i < this.length; i++) {
            if (this[i].timestamp > afterStamp && this[i].timestamp < beforeStamp) {
                ret.push(this[i]);
            }
        }
        return ret;
    };
    
    this.history._push = this.history.push;
    this.history.push = function (element) {
        this._push(element);
        this.sort(function (a, b) {
            return a.timestamp - b.timestamp;
        });
    };

    this._applyTransformation({
        remove: false,
        index: 0,
        content: text,
        timestamp: 0
    });
    this.history.push({
        remove: false,
        index: 0,
        content: text,
        timestamp: 0
    });
};

Line.prototype._applyTransformation = function (transformation) {
    if (transformation.remove) {
        var newStr = this.text.substring(0, transformation.index);
        newStr += this.text.substring((transformation.index + transformation.content.length));
        this.text = newStr;
        return;
    } else {
        this.text = this.text.slice(0, transformation.index) + transformation.content + this.text.slice(transformation.index);
        return;
    }
};

Line.prototype._undo = function (transformation) {
    transformation.remove = !transformation.remove;
    this._applyTransformation(transformation);
    transformation.remove = !transformation.remove;
};

Line.prototype.applyTransformation = function (transformation, verbose, clone) {
    cv = verbose === true ? console.log : function () { };
    if (clone !== false) {
        transformation = JSON.parse(JSON.stringify(transformation));
    }

    var reference = this.history.withTimestamp(transformation.lastApplied);
    if (reference === null) {
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
            D += toCheck.remove ? (-1 * toCheck.content.length) : toCheck.content.length;
        }
    }
    var initialIndex = transformation.index;
    transformation.index += D;

    cv(transformation.index);
    this._applyTransformation(transformation);

    this.history.push(transformation);

    for (var i = 0; i < U.length; i++) {
        var toApply = U[i];
        if (toApply.index > initialIndex) {
            toApply.index += D + transformation.content.length;
        }
        this._applyTransformation(toApply);
        this.history.push(toApply);
    }
    
    for (var i = 0; i < this.deferred.length; i++) {
        if (this.deferred[i].lastApplied === transformation.timestamp) {
            cv(this.deferred[i].index);
            this.applyTransformation(this.deferred[i], verbose);
            cv(this.text);
            this.deferred.splice(i, 1);
            i--;
        }
    }
};