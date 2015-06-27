Ecrit Design Overview
=====================
### Layers
Ecrit will be broken up into three main "layers": the underlying text manipulation layer, the presentation layer, and the interaction layer.

#### Text Manipulation
The text manipulation layer will define a Document object that can be acted on via Transformation objects.

#### Presentation Layer
The presentation layer will translate that underlying Document to a set of HTML elements and update those elements when the underlying Document is changed.

#### Interaction Layer
The interaction layer creates an interface for editing the text manipulation layer's Document. It's in charge of handling key presses, mouse clicks, toolbars, and more. The interaction layer probably won't get much work until the text manipulation and presentation layers are working.

### Layer Separation
One goal of Ecrit will be to keep layers separate and interchangeable. Each layer should define a public API, and no other layer should use any portion of a layer not defined in its public API.