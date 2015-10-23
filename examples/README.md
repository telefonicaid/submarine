submarine.maps examples
=========================

In this directory you will find some code to see some examples of applications of the [submarine.maps](../lib/) object.
Data used lives in the data/directory, stylesheets on css/ and .js helpers (controllers, which you
can replicate or copy&paste to taste) on js/


[Basic static examples](basic_static)
---------------------

- **basic_static_all.html** loads a GeoJSON with all three elements (polygions, paths and points) and renders them.
It uses js/basic_static_all.js as a middleware helper to interface with the mapViz object

- **basic_static_points.html** loads a GeoJSON filled with points representing all the airports on the USA and renders them.
On the bin directory you can find the original csv file and a python script to convert data into a GeoJSON

- **basic_static_polygons** loads a GeoJSON with London LSOA data (polygons), and a plain GeoJSON with a normalized metric
of every LSOA pollution, and draws a choropleth map

- **basic_static_layers** loads two different geoJSON, one with points, one with polygons, and make use of layer
management and a checkbox to switch the different layers

- **basic_static_points_images** shows how to draw images instead of points. Airport data from **basic_static_points.html** is
drawn using airport images. See the 'zoom' and 'enter' callback methods for points and 'addLayer' call for details

[Basic dynamic examples](basic_dynamic)
-----------------------

- **basic_dynamic_points.html** loads a GeoJSON with a list of points, initially with a dummy coordinate (lat=0,lng=0), and
another plain .json with time-dependent movement for each point. The example implements an slider to render all the points moving.
In bin/ you can find the original dataset (dataset_points.tsv) and a Python script used to sample them and write a .json file. To
render a time slider, [submarine.extras.genericSlider][1] Object is used

[Interactive examples](interactive)
----------------

- **interactive_select_polygons.html** is similar to **basic_static_polygons.html**, but you can select whether you want to visualize
**pollution** or **crime** data. An options box is added, with a combobox to change which dataset to show. The callbacks for polygon
update and enter are changed accordingly

- **interactive_tooltip_points.html** shows how to handle a tooltip (included on the mapViz main object). It's similar to **basic_static_points.html**,
but in this case you view the airport data on a basic tooltip. The callbacks for points 'over' and 'out' are changed accordingly

[Advanced examples](advanced_samples)
----------------

- **ma_zaragoza.html** loads a geo file to define the point who are going to be drawed. The real dataset is defined in other file. Both datasets are joined by a key. The dataset contains weather data and information about eco counters (quality of the air) in Zaragoza city.

- **eco_contadores.html** loads a geo file to define the point who are going to be drawed. Then load two datasets with information about the number of bikes for each point and weather information.

- **eco_contadores_iconos.html** is similar to the previous sample but it uses an image instead a circle.


[1]: ../../common/js/extras
