ecrit.TextSpan = function (id, options) {
    this.id = id;
    this.contents = options.contents || "";
    this.formatting = options.formatting || [];
};