ecrit.Transformation = function (data) {
    for (var prop in data) {
        if (data.hasOwnProperty(prop)) {
            this[prop] = data[prop];
        }
    }
};

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