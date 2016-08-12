life_unbounded
==============

Conway's GOL HTML5 with an unbounded plane (no boundaries)

This algorithm is demonstrated at http://jhiltscher42.github.io/life_unbounded/

To use the demo: left click a cell to toggle it.  When you're done adjusting the initial cells, right click to start the generations.  As long as it detects 'interesting' activity, it will continue to generate.  When all cells are dead or are in stable still life or single generation repeating colonies, it will stop.  Mouse wheel controls zoom, reset button in the corner clears the field.

Here is the Conway's Game of Life, implemented in a way that it scales to the number of live cells, rather than to any arbitrary field size.  Instead of keeping a mostly empty static structure of the field, which a first guess would make an array of arrays, or a second guess would make 2 arrays of arrays (one is the current generation G, the other is the next generation G+1, so that you can have partially completed calculations with out G+1 cells interfering with G cells.)  Both those suffer at higher resolutions, as the life algorithm has to iterate the entire field for each generation to produce the next one.  In addition, the implementor always has to decide what to do at the edges of the field.  

The canonical rules state that any empty cell with 3 live neighbors is a 'birth', and any live cell with either 2 or 3 live neighbors is stable, and any other number of neighbors is dead.  The majority of the cells in the field have eight neighbors, but the ones on the edges have only 5, and the ones in the corners have only 3.  This means that the edges are a hostile environment for the cells, and it also means that the deterministic quality of the algorithm is unfairly affected by the size of the field.  One approach is to wrap the edges around, so that the top wraps to the bottom, and the left to right.  This means that as far as the cells are concerned, there are no edges, but it also means that gliders emitted from a stabilizing colony will eventually wrap around and destabilize the colony that emitted them from the other side.  This means, that although the hostile environment issue has been addressed, the determinism is still affected by the underlying size of the field.

The solution implemented here is to do away with the field altogether.  Instead of an array of arrays, we keep a collection of cells that are alive, or have the possibility of being alive for the next generation.  We know from the rules that if an empty cell has no live neighbors, it can't possibly give birth.  Another way of saying that is, only the empty cells next to any live cell need checking.  Therefore, when you add a live cell to the collection, you also add any of its empty cell neighbors that haven't already been added.

When processing, you iterate over that small collection, and generate a new collection the same way.  In each collection, we also cache the neighbor search as we add a cell, as otherwise finding a cell by coordinate means iterating the collection.

By doing away with the field-as-data-structure, we have no edges to deal with.  Gliders glide as long as they want, and never take up more space, and never interfere with the colony that emitted them.
