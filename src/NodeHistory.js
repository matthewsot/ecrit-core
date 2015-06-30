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