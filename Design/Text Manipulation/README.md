Text Manipulation Layer
=======================
The text manipulation layer will define two main objects:

* Document
* Transformation

## Document
The Document object will contain a rich text document.

Each Document will contain an indefinite number of Paragraph objects, which will each contain an indefinite number of TextSpan or Image objects.

Documents will expose applyTransformation methods to modify text and keep a record of text transformations applied to the document.

Documents will also emit events when text is modified.

## Transformation
A Transformation object will represent transformation to either an entire Document (adding or removing a paragraph), a Paragraph (adding or removing a TextSpan or Image), or a TextSpan/Image (editing contents).

#### Examples:
Take the following document where "*" represents bolded text:

```
This is some *very important text*
```

This might be represented in a Document object as:
```
[
    {
        "id": "0",
        "contents": [
            {
                "contents": "This is some ",
                "id": "1"
            },
            {
                "contents": "very important text",
                "formatting": [ "Bold" ],
                "id": "2"
            }
        ]
    }
]
```

If the user were to highglight "important text" and un-bold it, the following transformations might be made:

```
[
    {
        "affectsId": "2",
        "timestamp": 000,
        "action": "removeText",
        "fromIndex": 5,
        "toIndex": 19
    },
    {
        "affectsId": "0",
        "timestamp": 000,
        "action": "insertNode",
        "node": {
            "contents": "important text",
            "id": "3"
        }
    }
]
```

Applying the transformations would give a document consisting of:

```
[
    {
        "id": "0",
        "contents": [
            {
                "contents": "This is some ",
                "id": "1"
            },
            {
                "contents": "very",
                "formatting": [ "Bold" ],
                "id": "2"
            },
            {
                "contents": "important text",
                "id": "3"
            }
        ]
    }
]
```