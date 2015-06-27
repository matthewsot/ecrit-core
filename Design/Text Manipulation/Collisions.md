Collisions
==========
Collisions will be prevented by applying transformations in a consistent way. Note that this is not a perfect solution, and will not work as you would expect in every case. Real collision handling is a lot more complicated, and part of why Ecrit will never be on the same level as Google Docs. Though if you have experience with it, please contribute!

### Applying transforms
When applying a transform, the text manipulation layer should first check its edit history for any transformations with timestamps after the currently being applied transformation.

If any are found, they are then evaluated to determine whether they pose a risk of collision with the to-be-applied transformation. In general, any transformation affecting the same node would be considered a possible collision.

If there are transformations that possibly collide with the new transformation and have a later timestamp, they are undone by first reversing the transformation and then applying that reversed transformation. After that, the new transformation is applied and the original transformation is re-applied.