# How to Integrate

## Introduction

This platform was built specifically for neo4j data so integrating it should be very easy.

There are a couple files you want to pay attention to:

* `main/scripts/neo4jd3.js`
    This is the source code of the library.

*  `/docs/js/data.js`
    This is a small script I wrote to convert the d3 data format currently being used by the Velocity ML graph back to a neo4j format to feed into the graph. YOU SHOULD NOT NEED THIS FILE AS YOU PRESUMABLY HAVE ACCESS TO RAW NEO4J data. THE ONLY TAKE AWAY IS THE CONFIG VARIABLE.

* `main/styles/neo4jd3.scss`
  Style source code. Gulp transpiles this down to a css file

* `bootstrap.min.css`, `font-awesome.min` These are your external style libs

* `/docs/img/svg` contains some image icons.

* `/docs/index.html` Index page where everything happens.

## Directions

* Add the source code, style sheets, src images to whatever your current asset pipeline.

* When you have all dependencies configured ... (You can test library is there by writing `Neo4jd3` in console) create a configuation object. The one I used is at the end of `docs/js/data.js`.
    * You will need to graph the data from an ajax call or have it created on the back end, and then to put that data into the config

* Create a div with some id like #neo4jd3 although it could be anthing and supply the name of the div and config to `new Neo4jd3` as you see in `index.html` on line `30`
