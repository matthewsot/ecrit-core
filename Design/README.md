Ecrit Design Overview
=====================

Ecrit will be broken up into three main "layers": the underlying text manipulation layer, the presentation layer, and the interaction layer.

### Text Manipulation
The text manipulation layer will define a Document object that can be acted on via Transformation objects.

### Presentation Layer
The presentation layer will translate that underlying Document to a set of HTML elements and update those elements when the underlying Document is changed.

### Interaction Layer
The interaction layer creates an interface for editing the text manipulation layer's Document. It's in charge of handling key presses, mouse clicks, toolbars, and more. The interaction layer probably won't get much work until the text manipulation and presentation layers are working.