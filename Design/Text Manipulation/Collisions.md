Collisions
==========
Collisions will be prevented by applying transformations in a consistent way. Note that this is not a perfect solution, and will not work as you would expect in every case. Real collision handling is a lot more complicated, and part of why Ecrit will never be on the same level as Google Docs. Though if you have experience with it, please contribute!

### Applying Transforms Consistently
When applying a transform, the text manipulation layer should first check its edit history for any transformations with timestamps after the currently being applied transformation.

If any are found, they are then evaluated to determine whether they pose a risk of collision with the to-be-applied transformation. In general, any transformation affecting the same node would be considered a possible collision.

If there are transformations that possibly collide with the new transformation and have a later timestamp, they are undone by first reversing the transformation and then applying that reversed transformation. After that, the new transformation is applied and the original transformation is re-applied.

### Correcting for Collisions
Using the above will ensure that all editors have the same file, but that final will not necessarily be what all editors expect. We'll try to solve the collision problem first for a 2-person collision and then for more complicated collisions involving three-or-more people.

#### 2-Person Collision

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

#### 3-Person Collisions
Let's set up the same scenario, except now there is a User C with 25ms lag with User A and a 3ms lag with User B.

What would happen if:
* A inserts "abc" at original index 0 and timestamp 003ms
* B inserts "hello" at original index 3 and timestamp 005ms
* C inserts "aaa" at original index 1 (between the "x" and "y") and timestamp 001ms

The expected result is: "abcxaaayzhello123"

Using the above model, in chronological order:
1. 001ms: C inserts "aaa" at index 1, creating "xaaayz123" and sends out the transformation to both A (with a 25ms lag) and B (3ms lag) with a "lastAppliedTimestamp" of 000ms
2. 003ms: A inserts "abc" at index 0, creating "abcxyz123" and sends out the transformation to B (10ms lag) and C (25ms lag) with a "lastAppliedTimestamp" of 000ms
3. 004ms: B receives C's transformation, and applies it directly to get "xaaayz123" (the same as C)
4. 005ms: B inserts "hello" between "yz" and "123" to get "xaaayzhello123," now index 6 and sends out the transformation to both A (10ms lag) and C (3ms lag) with a "lastAppliedTimestamp" of B's 001ms.
5. 008ms: C receives B's transformation, notes that B has already applied C's transformation and simply applies it on top of "xaaayz123" to get "xaaayzhello123" (same as B)
6. 013ms: B receives A's transformation and recognizes that A didn't know about either C or B's transformations. B then calculates that since neither B nor C was editing text before index 0, no changes need to be made and As transformation is applied directly, creating "abcxaaayzhello123" (**the expected result**).
7. 015ms: A receives B's transformation and realizes that it does not know about B's reference point of 001ms. **How should A deal with this situation?** One solution is to have A "defer" B's insertion until it receives the 001ms reference point. If so, on this step A simply puts B's transformation into a "defer" array.
8. 026ms: A receives C's transformation and recognizes that C edited before A's 003ms insertion (001ms vs 003ms), undoes its own 003ms transformation, applies C's 001ms transformation, recognizes that the 001ms transformation doesn't affect A's insertion in the same way that B did, and finally checks the "defered" array to find that B's transformation was waiting on the 001ms transformation. A then looks at B's transformation, looks for conflicts between 001ms and 005ms and realizes that B didn't know about A's transformation at 003ms. It then calculates that A's transformation increased the insertion index by 3, setting B's insertion index to 9. After re-applying all transformations, A gets "abcxaaayzhello123" (**the expected result**).
9. 028ms: C receives A's transformation from 003ms. C realizes that A didn't know about any other transformations, but realizes that (since A is inserting at index 0) it doesn't matter. C then applies A's transformation, and updates B and C's transformations in its history with new insertion points. Now c has "abcxaaayzhello123" (**the expected result**).

So with "defered transformations" it seems like this works pretty well!

#### Generalizations
Since that seems to work, let's see if we can get a generalization of what each user should do when receiving a transformation. Then we might be able to break that generalization to get a better idea of its limitations.

Upon receiving transformation T, each client C should:

1. Check C's transformation history for a transformation R with timestamp T.lastAppliedStamp. If R is not found, push T to a "deferred" array and return.
2. Undo all transformations with the same affectsId with a timestamp later than T.timestamp and store the undone transformations in a new array U.
3. Pull all transformations with timestamps between R.timestamp and T.timestamp (not including R) that have the same affectsId as T into a new array E.
4. Create an integer D = 0. Loop through the transforms in E chronologically as TE. For each TE that removes characters before the T.insertAt, D -= (TE.to - TE.from). **What if it removes the insertion point?** For each TE that adds characters before the T.insertAt, D+= TE.contents.length.
5. Save T's initial insertion index. (for insertions): T.insertAt += D (for removals): T.removeAt += D
6. Apply transformation T with the new insertion point
7. Loop through each TU in U. If TU's insertion index is after T's initial insertion index, TU's insertion index += D. Reapply TU.
8. Add T to history
9. Check for any previously deferred transformations that should now be applied

In pseudocode, we might get:

```
applyTransformation(T) {
    var reference = history.getTransformationWithTimestamp(T.lastAppliedStamp);
    if (reference === null) {
        deferred.push(T);
        return;
    }

    var U = history.getTransformationsWithAffectsAfter(T.affectsId, T.timestamp);
    for (var toUndo in U.reverse()) {
        toUndo.undo();
    }

    var E = history.getTransformationsWithAffectsBetween(T.affectsId, T.lastAppliedStamp, T.timestamp);
    var D = 0;
    for (var toCheck in E) {
        if (toCheck.insertIndex < T.insertIndex) {
            D += toCheck.removing ? (-1 * toCheck.length) : toCheck.length;
        }
    }
    var initialIndex = T.insertIndex;
    T.insertIndex += D;

    document.applyTransformation(T);

    for (var toApply in U) {
        if (toApply.insertIndex > initialIndex) {
            toApply.insertIndex += D;
            document.applyTransformation(toApply);
        }
    }
    
    for (var deferredT in deferred) {
        if (deferredT.lastAppliedStamp === T.timestamp) {
            applyTransformation(deferredT);
        }
    }
}
```