# ecrit: a better text editor
High-performance editor with a custom writing surface, a la Google Kix

#ecrit-core: the text & transformation layer
This repository contains the "backend" Javascript library to handle underlying text storage and manipulation across multiple concurrent users.
It does not include any code to actually display or interact with that text.

#using it
See gulpfile.js for some demo tests. In general, it'll look something like this:
```
var doc = new ecrit.Document();
var para = new ecrit.Paragraph(doc, "p-id-1");

doc.applyTransformation({
    "affectsId": "root",
    "timestamp": 100,
    "action": "insertNode",
    "node": para,
    "lastApplied": -1
});

var textSpan = new ecrit.TextSpan(para, "ts-id-1", { text: "test text" });

doc.getChildNodeById("p-id-1").applyTransformation({
    "affectsId": "p-id-1",
    "timestamp": 200,
    "action": "insertNode",
    "node": textSpan,
    "lastApplied": -1
});

doc.getChildNodeById("ts-id-1").applyTransformation(new ecrit.Transformation({
    action: "insertText",
    text: "abc ",
    index: 0,
    timestamp: 300,
    lastApplied: -1
}));

doc.getChildNodeById("ts-id-1").applyTransformation(new ecrit.Transformation({
    action: "insertText",
    text: "hello there! ",
    index: 4,
    timestamp: 500,
    lastApplied: 300
}));
```

Documents contain Paragraphs which contain TextSpans, and modifications/additions/removals are handled through ``applyTransformation`` methods on any node.

#ecrit q&a
### What?
Ecrit will be a Javascript editor that doesn't use any native HTML editing surfaces, like textarea or input. You will be able to turn any div into an editor, and it will use some form of operational transformation to keep everything in check.

Ecrit will be composed of three interchangeable parts: the text manipulation layer (containing Document and Transformation objects), the presentation layer (displays the underlying Document), and the interaction layer (reacts to key presses and other user input).

The goal is to have each layer be completely separate, so you can use just the part that you need for your project 
(for example, a backend web service could use just the manipulation layer to keep track of changes, while document viewers could use just the manipulation and presentation layers, while at the same time having an editor editing with all three layers).

#### What *not?*
Ecrit is *not* a real-time collaborative editor like Google Docs or Etherpad. It is simply a Javascript library to create the frontend part of that, although it will be able to handle changesets and almost all other features necessary to implement a Docs or Etherpad alternative.

The ultimate goal will be to use ecrit in a separate project to create a simple Etherpad alternative, eithe with some form of Mongo backend (to keep track of the JSON Transformations) or even with WebRTC.

### Why?
I've been working a lot with Google Doc's editor recently, and it seemed interesting.

### How?
Good question...See the docs in the Design folder in this repo.

### Status?
Currently working on a testable version of the Document, Paragraph, TextSpan, and Transformation objects.

After those are reasonably workable I'll start on simple presentation and interaction layers.