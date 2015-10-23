Submarine.js
================

**submarine.maps** is an object containing a set of methods aimed at
making life easier drawing [GeoJSON][1]-based SVG objects over Tiles handled by the [Leaflet][2] library. [D3.js][3] is used to aid in the drawing of geographic objects, namely polygons (GeoJSON polygons or multipolygons), points (GeoJSON points) and paths (lines or multilines in GeoJSON parlance)

Why use submarine.js?
-------------------

The submarine library can make easier a number of tasks:

- You want to draw a bunch of geometric objects and overlay them on top of a tile layer, and access interactively their data in an easy way
- You want to animate geometric features in an easy way (this merit goes to D3.js)
- You want to take advantage of D3.js scale capabilities to make choropleth maps

*In which cases should I use just Leaflet or [Leaflet plugins][4], or [CartoDB][5] or [TileMill][6] or....*

- You can use Leaflet if your application is not interaction-heavy. You just want to draw geometric features, maybe a tooltip, and that's all
- You can use another mapping library/service/software, like TileMill or CartoDB if what you want to draw can be rendered on the background tiles (i.e: you want interaction, but not on a vector layer drawn on top of the tile layer)

Directory structure
-------------

- In [lib/](lib/) you will find the actual .js file to be included (submarine.js).
- In [common/](common/) you will find some libraries heavily used by the library.
- In [examples/](examples/) you will find a bunch of examples.

Dependencies
------------
This object depends on [leaflet.js][2], [d3.js][3], [jQuery](http://jquery.com/) and [leaflet-providers](https://github.com/leaflet-extras/leaflet-providers), aside
from other internal submarine libraries that can be used. See 'Usage' below for information on how to include the dependencies

Options
-------
The object is called with three parameters:

- **idName**: Name of the parent div in which you want to embed the map
- **className**: ditto for the class name. This parameter is reserved for future developments
- **options** OBJECT: A key-value object, with the following fields:
	- **tileLayer**: An instance of L.tileLayer.provider. Mandatory. See examples and doc here: https://github.com/leaflet-extras/leaflet-providers
	- **initLatLng**: initial latitude and longitude, as an array of two floats. Mandatory.
	- **hideOnZoom**: Whether you want to hide svg layer on zoom changes or not (boolean). Mandatory
	- **mapOptions**: Object of Leaflet map Options (key-value properties). See full listing here: http://leafletjs.com/reference.html#map-options. Only 'zoom' is mandatory
	- **callBackDict**: Object with callbacks for every event and geometry type. See the callBack Dictionary below

Methods
-------

**addLayer(layerName)**:
Creates a new layer. submarine can draw geometries in different layers, and you can discriminate object properties and rendering by layer

**emptyLayer(layerName)**:
Empties a layer. All associated data and geometries are deleted, although the layer remains in the list of layers. This method is useful for recreating layers (after emptying a layer, you *do not* have to create it again to use it

**laterAttr(layerName, attrName, attrValue)**
Sets an attribute 'attrName' = 'attrValue' of an entire layer (so all objects on the layer are affected). E.g: visibility attribute

**render(mapData, layerName)**
Draws a GeoJSON-formatted-data (mapData) on a layer. Callbacks are called appropiately (enter, exit or update). If mapData
changes, and you call 'render' again, it will handle the 'enter', 'exit' or 'update' accordingly, based on D3.js data join rules.
**The property used by the identity function in the data join is the 'id' of every GeoJSON Feature (*not properties.id*, 'id' at the root of the Feature object)**

**project(point)**
Projects a point onto screen-space, using Leaflet auxility functions. Point is an array with two element: longitude and latitude (both floats)

**updateValues(layersVector)**
'update' callbacks for each layer in layersVector (array of layer names) are called. This is useful when you want to globally change the appearance of all geometries (for example, changing the value to lookup to fill a choropleth)

**getRealPixels(meters, latitude)**
Returns the size of screen pixels that match 'earth' meters at a certain latitude. This is useful when you want to draw, for example, a circle with 'x' meters of radius and want to make that size reactive to the actual projection size determine by latitude and zoom level

**pathTween(precision)**
This is an advanced feature to help to transition geoArcs and morph one into another, still in debugging phase

'callBackDict': The Callback Dictionary
------------

This is an object containing several handlers for each type of geometry. The first key is the geometry: point, polygon or path. The second key is the handler type:

- 'zoom'. Every time the map zoom changes, this handler is called
- 'update'. Every time an update on an object is issued by D3.js data join, this handler will be called. You can 'force' this handler to be called if you call 'updateValues' method
- 'enter'. Every time a new geometry appears on the data, this handler will be called (of course, it will be called at geometry creation via the render method
- 'exit' Every time a geometry does not belong any longer in the render (if by instance is not longer present on a GeoJSON), this handler will be called

(These handlers receive a d3 selection to 'act' upon, and the name of the layer to which the selection belongs)

- 'over': Called on geometry mouseover
- 'out': Called on geometry mouseout
- 'click': Called on geometry mouseclick

(These handlers receive the 'd' and 'i' of the element (since it will be a *single* element, not a whole selection). In the case of 'click', you also receive the DOM Element involved, so you can change attribute using d3.select(element).attr() or d3.select(element).style(). For 'over' and 'out' is asumed that you use the :hover tag on your CSS to modify appearance)

You *do not* have to include every handler for every geometry, only the ones you will be using. The others will go on silently (since a void function will be assigned). For a practical example of the callBackDict, see below.

Usage
---

To use the object (note: this implementation just follows the singleton approach), follow the following steps:

Check that you include all the dependencies in your html file:


        <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.5/leaflet.css" />

        <title>Basic Example</title>

        <script src="bower_components/jquery/jquery.min.js" charset="utf-8"></script>
        <script src="bower_components/d3/d3.min.js" charset="utf-8"></script>
        <script src="bower_components/leaflet/dist/leaflet.js" charset="utf-8"></script>
        <script src="bower_components/leaflet-providers/leaflet-providers.js" charset="utf-8"></script>



**Please note** A bower.json file is included to help download all dependencies. Execute `bower install` at root folder and it will generate 'bower_components'. See [bower.io][6] for instructions on how to install it if you don't have it already.

First, include the .js source file in your html:

	<script src="lib/submarine.js" charset="utf-8"></script>

Second, you must create the callbacks you are going to use and an object with all the options. Below is an example for drawing just GeoJSON points (as circles). For the 'point' entry, 'zoom', and 'enter' are defined. 'zoom' is implemented to redraw the circles in zoom changes (note the use of 'project' method and 'getRealPixels'), 'enter' is implemented to draw the circles initially

	self.callBacks = {
                    'point':{
                        'zoom':function(selection){
                                selection
                                    .attr("cx",function(d) { return self.mapChart.project(d.geometry.coordinates)[0]})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1]})
                                    .attr("r",function(d) { return self.mapChart.getRealPixels(self.pointRadius ,d.geometry.coordinates[1]);});

                        },

                        'enter': function(selection){
                                selection
                                    .attr("cx",function(d) { return self.mapChart.project(d.geometry.coordinates)[0]})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1]})
                                    .style("fill", function(d){ return self.colorScale(d.properties.state)})
                                    .attr("r",function(d) { return self.mapChart.getRealPixels(self.pointRadius ,d.geometry.coordinates[1]);});
                        }
                    }
    };

	self.vizOptions = {
                            'tileLayer': L.tileLayer.provider('Stamen.TonerLite'),
                            'initLatLng': [40.01,-98.34],
                            'mapOptions':{
                                                'zoom': 4
                            },
                            'hideOnZoom': false
                            'callBackDict': self.callBacks
                        };


Third, instantiate the mapViz Object, passing options dictionary (or Object):

	self.mapChart = submarine.maps("map","map", self.vizOptions);

This last call will actually create a Leaflet map on div id 'map', with class 'map', initializing it with the options and keeping in storage the callback object

To modify the graphical rendering of geometrical properties, you can add some CSS on your html. Paths will be rendered as '.paths' classes, points as '.points' and polygons as '.polygons'. So an example of CSS could go like  this (taking into account that they are 'children' of class '.map', as passed to the Object initialization

    .map .points
    {
        fill: #C00;
        cursor: pointer;
    }

    .map .paths
    {
       stroke:black;
       stroke-width: 1px;
       fill: transparent;
       cursor:pointer;
    }

    .map .polygons {
      fill: #000;
      fill-opacity: .2;
      stroke: #fff;
      stroke-width: 1px;
      cursor: pointer;
    }

Examples
--------

For a whole set of examples, navigate to [examples](examples), including dynamic & static maps, points, polygons, paths, tooltip usage and so on...

License
----

Copyright (c) 2015 TELEFONICA I+D, http://tid.es/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


  [1]: http://daringfireball.net/projects/markdown/
  [2]: http://leafletjs.com
  [3]: http://d3js.org
  [4]: http://leafletjs.com/plugins.html
  [5]: http://cartodb.com
  [6]: http://www.mapbox.com/tilemill/
  [7]: http://bower.io/

