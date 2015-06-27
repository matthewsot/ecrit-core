ecrit.Paragraph = function (parent, id, nodes) {
    ecrit.Node.call(this, parent, id, nodes);
};

ecrit.Paragraph.prototype = Object.create(ecrit.Node.prototype);