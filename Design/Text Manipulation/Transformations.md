Transformations
===============
A basic transformation object requires two properties:
```
{
    "affectsId": "...",
    "timestamp": 000,
    "action": "...",
}
```

* affectsId is the id of the node (Paragraph, TextSpan, or Image) to insert
* action is the action to perform.
* timestamp is a Unix timestamp as returned by the Javascript ``(new Date()).getTime()``.

## Actions:

### insertText
The insertText action inserts text into a specified TextSpan. Use "atIndex" to specify where to start the text insertion.
```
{
    "affectsId": "...",
    "timestamp": 000,
    "action": "insertText",
    "atIndex": 5,
    "contents": "text to insert"
}
```

### removeText
The removeText action removes text from a TextSpan. Use "fromIndex" and "toIndex" to specify the text to remove.

```
{
    "affectsId": "...",
    "timestamp": 000,
    "action": "removeText",
    "fromIndex": 0,
    "toIndex": 15
}
```

## insertNode
The insertNode action inserts the node provided by the node property. The "afterId" property always takes precedence over the "beforeId" property, and if neither is provided the node is inserted at the end of its parent's node collection.

```
{
    "affectsId": "0",
    "timestamp": 000,
    "action": "insertNode",
    "node": {
        "contents": "text to insert",
        "id": "3"
    },
    "afterId": 2
}
```

## removeNode
The removeNode action removes the specified node from its parent.

```
{
    "affectsId": "...",
    "timestamp": 000,
    "action": "removeNode"
}
```

## formatNode
The formatNode action sets a node's format property, overriding any previous formats.

```
{
    "affectsId": "...",
    "timestamp": 000,
    "action": "formatNode",
    "format": [ "bold", "italic" ]
}
```

## modifyFormat
The addFormat action adds and removes items from a node's format list without overriding it.

```
{
    "affectsId": "...",
    "timestamp": 000,
    "action": "addFormat",
    "remove": [ "bold" ],
    "add": [ "underline" ]
}
```