Collisions
==========
Collisions will be prevented by applying transformations in a consistent way. Note that this is not a perfect solution, and will not work as you would expect in every case. Real collision handling is a lot more complicated, and part of why Ecrit will never be on the same level as Google Docs. Though if you have experience with it, please contribute!

### Applying Transforms Consistently
When applying a transform, the text manipulation layer should first check its edit history for any transformations with timestamps after the currently being applied transformation.

If any are found, they are then evaluated to determine whether they pose a risk of collision with the to-be-applied transformation. In general, any transformation affecting the same node would be considered a possible collision.

If there are transformations that possibly collide with the new transformation and have a later timestamp, they are undone by first reversing the transformation and then applying that reversed transformation. After that, the new transformation is applied and the original transformation is re-applied.

### Correcting for Collisions
Using the above will ensure that all editors have the same file, but that final will not necessarily be what all editors expect.

Consider a situation with user A and user B connected directly to each other with 10ms network lag editing a line consisting of: "xyz123". The following happens:

* User A inserts "abc" at index 0 and timestamp 001ms to see "abcxyz123" and instantly sends out the transformation
* User B inserts "hello" at index 3 and timestamp 005ms (before receiving A's transformation), between "xyz" and "123," and instantly sends out the transformation

The expected result would be: "abcxyzhello123," however following the above rules would give us:

* A receives B's transformation at 15ms, and since B's transformation has a later timestamp immediately applies it. A "hello" is inserted at index 3, which is now between "abc" and "xyz," giving "abchelloxyz123"
* B receives A's transformation at 11ms, and since A's transformation has an earlier timestamp, B undoes its transformation, applies A's transformation to get "abcxyz123," then re-applys its own transformation in the same way A did to get "abchelloxyz123"

Thus A and B are both synchronized, yet they're also both clearly wrong.

There are a few ways to deal with this, the most promising I've found is the following:

* Each user sends along with its transformation the timestamp of the last applied transformation. So if we were to say that the insertion of "xyz123" happened at 000ms, both A and B would send "lastAppliedTimestamp": 000 along with their transformations.
* A would receive B's transformation and check for collisions *anywhere between 000ms and 005ms.* Finding its own transformation at 001ms conflicting, A would then recognize that B (having only seen the 000ms transformation) wouldn't have known about the conflict. A would then compute that the 005ms transformation would increase B's insertion point by 3 places and automatically change B's 005ms transformation's insertion index to 6 (3 + 3).
* B would receive A's transformation and check for collisions between 000ms and 001ms. Finding none, it would continue to undo its own 005ms transformation (to keep chronological order), then apply A's 001ms transformation. It will then re-apply its 005ms transformation, but recognize that A's 001ms transformation is in conflict and automatically change the 005ms transformation's insertion index to 6 in the same way A did.