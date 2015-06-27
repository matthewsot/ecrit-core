# ecrit
High-performance editor with a custom writing surface, a la Google Kix


### What?
Ecrit will be a Javascript editor that doesn't use any native HTML editing surfaces, like textarea or input. You will be able to turn any div into an editor, and it will use some form of operational transformation to keep everything in check.

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