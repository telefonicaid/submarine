/*
Copyright (c) 2015 Telefónica Investigación y Desarrollo, S.A.U, http://tid.es/

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
*/

/* WHAT IS THIS FOR?
submarine.maps is an object containing a set of methods aimed at
making life easer drawing geoJSON-based SVG objects over Tiles handled by the Leaflet library

You can use it to draw dynamic maps (w/ elements moving), choropleths or just plain old static maps w/ some
SVG Objects and interactions like mouseover, tooltips, and so on

PARAMETERS:
-idName: Name of the parent div in which you want to embed the map
-className: ditto for the class name. This parameter is reserved for future developments
-options OBJECT: An key-value object, with the following fields:
    +'tileLayer': An instance of L.tileLayer.provider.
                  See examples and doc here: https://github.com/leaflet-extras/leaflet-providers
    +'initLatLng': initial latitude and longitude, as an array of two floats. Mandatory.
    +'hideOnZoom': Whether you want to hide svg layer on zoom changes or not (boolean). Mandatory
    +'mapOptions': Object of Leaflet map Options (key-value properties).
                   See full listing here: http://leafletjs.com/reference.html#map-options. Only 'zoom' is mandatory
    +'callBackDict': Object with callbacks for every event and geometry type. See submarine.js README for details
    +'idCallBackDict': (optional) Object with callbacks for every geometry type (path, polygon, point),
                       in order to specify the 'unicity' of each datum on the data join
*/
var submarine = submarine || {'version':0.9, 'controller':{}, 'viz': {} ,'extras': {}  , 'comm': {}};
submarine.maps = function(idName, className, options){

    // Object
    var self = {};

    self.idName = idName;
    self.className = className;

    // Get options data
    for (key in options){
        self[key] = options[key];
    }

    // Aux function to reference idCallBackDict (if exists)
    self._getId = function(d,i,type,layerName)
    {
        if((self.idCallBackDict) && (type in self.idCallBackDict))
        {
            return self.idCallBackDict[type](d,i,layerName);
        }
        else
        {
            return d.id;
        }
    };

    self._init = function(){

        // Get the callbacks straight: If some callback does not exist in parameter 'callBackDict':
        // Add a void function
        // Else: Assign the callback into self.callBacks
        var callBackTypes = ['point','path','polygon'];
        var callBackEvents = ['over','out','click','enter','exit','update','zoom'];

        self.callBacks = {};

        for(var i=0; i<callBackTypes.length; i++){

            var type = callBackTypes[i];
            self.callBacks[type] = {};

            for (var j=0; j<callBackEvents.length; j++){

                var event = callBackEvents[j];

                if((self.callBackDict) && (type in self.callBackDict) && (event in self.callBackDict[type])){
                    self.callBacks[type][event] = self.callBackDict[type][event];
                }
                else{
                    self.callBacks[type][event] = function(){};
                }
            }
        }

        // Get map options from controller
        var layers = [];
        if (self.tileLayer) layers.push(self.tileLayer)
        var mapOptions = { center: new L.LatLng(self.initLatLng[0],self.initLatLng[1]),
                            layers: layers
        };

        if(self.mapOptions){
            for(option in self.mapOptions){
                mapOptions[option] = self.mapOptions[option];
            }
        }

        self.map = new L.Map(self.idName, mapOptions);

        // Needed before inserting an svg layer in leaflet layers
        self.map._initPathRoot();

        // Pixels/Meters relationship initialized. See method explanation below
        self._updateResolution();

        // svg init
        self.svg = d3.select("#"+self.idName).select("svg");

        // hide on zoom attribute handling + main container insertion + mousemove handling
        if(self.hideOnZoom){
    	    self.g = self.svg.append("g").attr("class", "leaflet-zoom-hide").on("mousemove",self._mousemove);
        }
        else{
            self.g = self.svg.append("g").on("mousemove", self._mousemove);
        }

        self.svg = self.g;

        // Just in case you need a tooltip. Have to be styled as a relative HTML element
        self.tooltip = d3.select("body").append("div")
        .attr("id","tooltip")
        .html("")
        .attr("class", "tooltip")
        .style("opacity", 0);

        // Path building

        // GeoJson polygon paths
        self.path = d3.geo.path().projection(self.project);

        // GeoJSON line paths [straight arcs]
        self.line = d3.svg.line()
            .interpolate("linear")
            .x(function(d) { return self.project(d)[0];})
            .y(function(d) { return self.project(d)[1];});

        // Layer management

        // Object containing all layer names and reference to its svg
        self.layers = {};
        self.layersPrimitives = {};

        // Object containing geoData (polygons, points and paths) for every layer
        self.geoData = {};

        // Object containing all heatmap [canvas] layers, by name. Content is the actual leaflet layer
        self.heatmapLayers = {};

        // Object containing all marker layers, by name. Contents the actual L.LayerGroup
        self.markerLayers = {};

        // Callback on map zoom & pan to reproject
        self.map.on("viewreset", self._updateMapMove);

    };

    // Marker layers:

    // init the marker definition data: a dictionary with icon names and L.AwesomeMarkers icon definitions (like in
    // https://github.com/lvoogdt/Leaflet.awesome-markers/blob/2.0/develop/examples/basic-example.html, line 30)
    self.initMarkers = function(data)
    {
        self.markerDefinitions = data;
    };

    // init a markerLayer (please not that this is different from actually *showing* the layer)
    // a layer name is passed and a geoJSON with (hopefully, note the 'else') point data.
    // The code actually expects a property string named 'markerType', matching the icon names in the icon
    // definitions of previous methos
    self.initMarkerLayer = function(name,markerData,typeCallback,popupCallback)
    {

        var markers = [];

        for(var i=0; i<markerData.features.length;i++)
        {
            var feature = markerData.features[i];

            if(feature.geometry.type=="Point")
            {
               var myMarker = L.marker([feature.geometry.coordinates[1],feature.geometry.coordinates[0]], {icon: L.AwesomeMarkers.icon(self.markerDefinitions[typeCallback(feature,i)]) });

               myMarker.bindPopup(popupCallback(feature,i));

               markers.push(myMarker);
            }
        }

        var markerLayer = L.layerGroup(markers);
        self.markerLayers[name] = markerLayer;
    };

    // init a markerLayer (please not that this is different from actually *showing* the layer)
    // a layer name is passed and a geoJSON with (hopefully, note the 'else') point data.
    // The code actually expects a property string named 'markerType', matching the icon names in the icon
    // definitions of previous methos
    // In this case, it renders the markers as clusters
    self.initMarkerLayerCluster = function(name,markerData,typeCallback,popupCallback,options)
    {

        var markers = [];

        for(var i=0; i<markerData.features.length;i++)
        {
            var feature = markerData.features[i];

            if(feature.geometry.type=="Point")
            {
               var myMarker = L.marker([feature.geometry.coordinates[1],feature.geometry.coordinates[0]], {icon: L.AwesomeMarkers.icon(self.markerDefinitions[typeCallback(feature,i)]) });

               myMarker.bindPopup(popupCallback(feature,i));

               markers.push(myMarker);
            }
        }

        var markerLayer = new L.MarkerClusterGroup(options);

        for(var i=0; i<markers.length;i++)
        {
            markerLayer.addLayer(markers[i]);
        }

        self.markerLayers[name] = markerLayer;
    };

    // Actually show the layer
    self.showMarkerLayer = function(name)
    {
        if(self.markerLayers[name])
        {
            self.map.addLayer(self.markerLayers[name]);
        }
    };

    // Actually remove the marker layer (not that the L.layerGroup still exists in memory,
    // but it's not actually attached to the map
    self.removeMarkerLayer = function(name)
    {
        if(self.markerLayers[name])
        {
            self.map.removeLayer(self.markerLayers[name]);
        }
    };

    // Add a heatmap layer with passed options and data (array of {'lat','lon','value'})
    // maps/common/QuadTree.js, maps/common/heatmap.js, maps/common/heatmap-leaflet.js must be loaded
    // And example of options object
    // {
    //					// radius could be absolute or relative
    //					// absolute: radius in meters, relative: radius in pixels
    //					radius: { value: 15000, absolute: true },
    //			        //radius: { value: 20, absolute: false },
    //					opacity: 0.8,
    //					gradient: {
    //						0.45: "rgb(0,0,255)",
    //						0.55: "rgb(0,255,255)",
    //						0.65: "rgb(0,255,0)",
    //						0.95: "black",
    //						1.0: "rgb(255,0,0)"
    //					}
    // }
    self.initHeatmapLayer = function(name,options,data,callBack)
    {
        var heatmapLayer = L.TileLayer.heatMap(options);
        var myData = [];

        for(var i=0; i<data.features.length;i++)
        {
            var feature = data.features[i];

            if(feature.geometry.type=="Point")
            {
                myData.push({'lat':feature.geometry.coordinates[1], 'lon': feature.geometry.coordinates[0],'value': callBack(feature)});
            }
        }

        heatmapLayer.setData(myData);
        self.heatmapLayers[name] = heatmapLayer;
    };

    // show a heatmap layer
    self.showHeatmapLayer = function(name)
    {
        if(self.heatmapLayers[name])
        {
            self.map.addLayer(self.heatmapLayers[name]);
        }
    };

    // remove the heatmap layer
    self.removeHeatmapLayer = function(name)
    {
        if (self.heatmapLayers[name])
        {
            self.map.removeLayer(self.heatmapLayers[name]);
        }
    };

    // Create a new layer named 'layerName' on the container and associated data structures
    self.addLayer = function(layerName, primitiveDict){
        // Add layer to container
        self.layers[layerName] = self.svg.append("g").attr("layerName",layerName);

        // Data structure to hold point, polygon and path data
        self.geoData[layerName] = {};
        self.geoData[layerName].geoPoints = [];
        self.geoData[layerName].geoPolygons = [];
        self.geoData[layerName].geoPaths = [];

        if(primitiveDict)
        {
            self.layersPrimitives[layerName] = primitiveDict;
        }
        else
        {
            self.layersPrimitives[layerName] = {'points':'circle'};
        }
    };

    // Set an attribute 'attrName' = 'attrValue' of an entire layer. E.g: visibility attribute
    self.layerAttr = function(layerName, attrName, attrValue){
        self.layers[layerName].attr(attrName,attrValue);
    };

    // Empty 'layerName' layer [on svg & associated data structs]
    self.emptyLayer = function(layerName){

        // Remove layer svg group from container
        self.layers[layerName].remove();
        // Recreate the layer
        self.addLayer(layerName,self.layersPrimitives[layerName]);
    };

    // Renders 'mapData' (geoJSON format) into layer 'layerName'.
    // Layer must be created beforewards.
    // It calls self.{polygon,point,path}Over, Out, Click, Enter, Update, Exit callbacks
    self.render = function(mapData,layerName){

        // Initializes geoJSON data container struct
        self.geoData[layerName].geoPoints.length = 0;
        self.geoData[layerName].geoPolygons.length = 0;
        self.geoData[layerName].geoPaths.length = 0;

        // And insert each {Point,Polygon,MultiPolygon,LineString} in its pertinent geoData place
        mapData.features.forEach(function(d) {
            if(d.geometry.type=="Point"){
                self.geoData[layerName].geoPoints.push(d);
            }
            if(d.geometry.type=="Polygon" || d.geometry.type=="MultiPolygon"){
                self.geoData[layerName].geoPolygons.push(d);
            }
            if(d.geometry.type=="LineString"){
                self.geoData[layerName].geoPaths.push(d);
            }
        });

        // Update resolution just in case
        self._updateResolution();

        // Polygons: Data join, enter and exit
        var mapPolygons = self.layers[layerName].selectAll(".polygons")
                          .data(self.geoData[layerName].geoPolygons, function(d,i){ return self._getId(d,i,'polygon', layerName)});

        mapPolygons.call(self.callBacks.polygon.update,layerName);

        var mapPolygonsEnter = mapPolygons.enter().insert("path",".paths").attr("class","polygons").on("mouseover",function(d,i){self.callBacks.polygon.over(d,i);}).on("mouseout",function(d,i){self.callBacks.polygon.out(d,i);}).on("click", function(d,i){ var domElement = this; self.callBacks.polygon.click(d,i,domElement);}).call(self.callBacks.polygon.enter,layerName);

        var mapPolygonsExit = mapPolygons.exit().call(self.callBacks.polygon.exit,layerName);

        // Paths: Data join, enter and exit. It also binds mouseover & mouseout callbacks
        var mapPaths = self.layers[layerName].selectAll(".paths")
                        .data(self.geoData[layerName].geoPaths, function(d,i){ return self._getId(d,i,'path', layerName)});

        mapPaths.call(self.callBacks.path.update,layerName);

        var mapPathsEnter = mapPaths.enter().insert("path",".points").attr("class","paths").on("mouseover",function(d,i){self.callBacks.path.over(d,i);}).on("mouseout",function(d,i){self.callBacks.path.out(d,i);}).call(self.callBacks.path.enter,layerName);

        var mapPathsExit = mapPaths.exit().call(self.callBacks.path.exit,layerName);

        // Points: Data join, enter and exit. It also binds mouseover & mouseout callbacks
        var mapPoints = self.layers[layerName].selectAll(".points")
                        .data(self.geoData[layerName].geoPoints, function(d,i){ return self._getId(d,i,'point', layerName)});

        mapPoints.call(self.callBacks.point.update,layerName);

        var mapPointsEnter = mapPoints.enter()
                            .append(self.layersPrimitives[layerName]['points']).attr("class","points").on("mouseover",function(d,i){self.callBacks.point.over(d,i);}).on("mouseout",function(d,i){self.callBacks.point.out(d,i);})
                            .call(self.callBacks.point.enter, layerName);

        var mapPointsExit = mapPoints.exit().call(self.callBacks.point.exit,layerName);
    };

    // Aux function to project a point on the map [geo coordinates to screen coordinates relative to the map svg]
    // Projection is handled by Leaflet, NOT D3.js
    self.project = function (x){
              var point = self.map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
              return [point.x, point.y];
    };

    // Called every time zoom is changed and a reprojection is needed
    // It calls self.{polygon,point,path}MapMove callbacks
    self._updateMapMove = function() {

        self._updateResolution();

        for(var layerName in self.layers){

            var mapPolygons = self.layers[layerName].selectAll(".polygons")
                            .data(self.geoData[layerName].geoPolygons,function(d,i){ return self._getId(d,i,'polygon', layerName)});

            var mapPaths = self.layers[layerName].selectAll(".paths")
                            .data(self.geoData[layerName].geoPaths,function(d,i){ return self._getId(d,i,'path', layerName)});

            var mapPoints = self.layers[layerName].selectAll(".points")
                            .data(self.geoData[layerName].geoPoints,function(d,i){ return self._getId(d,i,'point', layerName)});

            mapPoints.call(self.callBacks.point.zoom,layerName);

            mapPolygons.call(self.callBacks.polygon.zoom,layerName);

            mapPaths.call(self.callBacks.path.zoom,layerName);
        }
    };

    // Method called outside whenever rendering of the layers included in 'layersVector' array is needed
    // E.g: when a slider changes data to be rendered on polygons, points or paths
    // It calls self.{polygon,point,path}Update callbacks
    self.updateValues = function(layersVector){

        self._updateResolution();

        for(var layerName in self.layers){

            if(layersVector.indexOf(layerName)>-1){

                var mapPolygons = self.layers[layerName].selectAll(".polygons")
                                .data(self.geoData[layerName].geoPolygons,function(d,i){ return self._getId(d,i,'polygon', layerName)});

                var mapPaths = self.layers[layerName].selectAll(".paths")
                                .data(self.geoData[layerName].geoPaths,function(d,i){ return self._getId(d,i,'path', layerName)});

                var mapPoints = self.layers[layerName].selectAll(".points")
                                .data(self.geoData[layerName].geoPoints,function(d,i){ return self._getId(d,i,'point', layerName)});

                mapPoints.call(self.callBacks.point.update, layerName);

                mapPolygons.call(self.callBacks.polygon.update, layerName);

                mapPaths.call(self.callBacks.path.update, layerName);
            }
        }
    };

    // Called every time a mousemove is detected & updates a 'tooltip' div coordinates
    self._mousemove = function(){
        self.tooltip
        .style("left", (d3.event.pageX +20) + "px")
        .style("top", (d3.event.pageY - 12) + "px");
    };

    // How many pixels per meter on the map? Must be called on zoom changes (this is handled by the library)
    self._updateResolution = function(){

        // http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Resolution_and_Scale
        // pixel / meters
        self.resolution = Math.pow(2,self.map.getZoom())/156543.034 ;
    };

    // Calculate screen pixels based on meters and latitude
    self.getRealPixels = function(meters,latitude){
        return meters*self.resolution / Math.abs(Math.cos(latitude*Math.PI/180));
    };

    // Tweening for smooth path transition.
    // Tweaked from http://bl.ocks.org/mbostock/3916621
    self.pathTween = function(precision) {
        return function() {
            var path0 = this,
                path1 = path0.cloneNode(),
                d1 = path0.cloneNode().getAttribute("dfinal"),
                n0 = path0.getTotalLength(),
                n1 = (path1.setAttribute("d", d1), path1).getTotalLength();

            // Uniform sampling of distance based on specified precision.
            var distances = [0], i = 0, dt = precision / Math.max(n0, n1);
            while ((i += dt) < 1) distances.push(i);
            distances.push(1);

            // Compute point-interpolators at each distance.
            var points = distances.map(function(t) {
                var p0 = path0.getPointAtLength(t * n0),
                    p1 = path1.getPointAtLength(t * n1);
                return d3.interpolate([p0.x, p0.y], [p1.x, p1.y]);
            });

            return function(t) {
                return t < 1 ? "M" + points.map(function(p) { return p(t); }).join("L") : d1;
            };
        }
    };

    // Object main
    self._init();
    return self;
};
