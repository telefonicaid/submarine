var submarine = submarine || {'version':0.9.0, 'controller':{}, 'viz': {} ,'extras': {} };

// Controller example for rendering a geoJSON into HTML5 id 'idName'.
// 'className' is the CSS class of the 'idName'

// Options is an object w/ the following properties:
// - baseJUrl: relative path to geoJSON file (mandatory)
// - dataFile: Name of geoJSON file (mandatory)
// - transTime: Transition time between d3.js transitions
// - debugLevel: Debug depth control for self.myLog
// - vizOptions passed to submarine.maps. See source & README of this component for details

// Example callbacks to pass to submarine.maps are provided.
// Keep in mind that in this example, points are drawn as circles, with radius proportional to geoJSON property 'radius'
submarine.controller.basicDynamic = function(idName, className, options){

    // Instance reference
    var self = {};

    // Copy options object to self
    for (key in options){
        self[key] = options[key];
    }

    self.idName = idName;
    self.className = className;
    self.parentSelect = "#"+self.idName;

    self.pointRadius = 50;
    self.sliderFrame = 0;

    // InitialHour
    self.hour = 0;

    // Radius scale
    self.rScale = d3.scale.sqrt().domain([0,4000]).range([0,300]).clamp(true);

    // logging function w/level
    self.myLog = function(myString, level){
        if ((self.debugLevel!=0)&&(level<=self.debugLevel))
        {
            console.log(myString);
        }
    };

    // Renders a file into a map viz layer
    self.renderFile = function(fileName,layerName){

        d3.json(self.baseJUrl+fileName, function(mapData){

            if(mapData!=null){
               self.mapChart.render(mapData,layerName);
            }
            else{
                self.myLog("Could not load file: "+self.baseJUrl+self.dataFile,1);
            }
        });
    };


    self.getDatumFromId = function(id)
    {
        var hour = self.hour<10?"0"+self.hour:""+self.hour;

        return typeof self.mapData[hour][id] !='undefined'? parseInt(self.mapData[hour][id],10):0;
    };


    // submarine.maps callbacks
    self.callBacks = {
                    'point':{
                        'zoom':function(selection){
                                selection
                                    .attr("r",function(d) {
                                        var datum = self.getDatumFromId(d.id);
                                        var radius = self.rScale(datum);
                                        d.radius = self.mapChart.getRealPixels(radius, d.geometry.coordinates[1]);
                                        return d.radius;
                                    })
                                    .attr("cx",function(d) { return self.mapChart.project(d.geometry.coordinates)[0]})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1]});
                        },

                        'enter': function(selection){
                                selection
                                    // .attr("xlink:href", "img/people_icon_3d.png")
                                    .attr("r",function(d) {
                                        var datum = self.getDatumFromId(d.id);
                                        var radius = self.rScale(datum);
                                        d.radius = self.mapChart.getRealPixels(radius, d.geometry.coordinates[1]);
                                        return d.radius;
                                    })
                                    // .attr("height",function(d) {
                                    //     return d.radius;
                                    // })
                                    .attr("cx",function(d) { return self.mapChart.project(d.geometry.coordinates)[0]})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1]} );
                        },
                        'update': function(selection){
                                selection
                                    .attr("r",function(d) {
                                        var datum = self.getDatumFromId(d.id);
                                        var radius = self.rScale(datum);
                                        d.radius = self.mapChart.getRealPixels(radius, d.geometry.coordinates[1]);
                                        return d.radius;
                                    })
                                    // .attr("height",function(d) {
                                    //     return d.radius;
                                    // })
                                    .attr("cx",function(d) { return self.mapChart.project(d.geometry.coordinates)[0] })
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1] });

                        },
                        'over': function(d,i)
                        {
                            var myHtml ="Footfall</br><b>"+ self.getDatumFromId(d.id)+"</b>";
                            self.mapChart.tooltip.html(myHtml);
                            self.mapChart.tooltip.style("opacity",1.0);
                        },
                        'out': function(d,i)
                        {
                            self.mapChart.tooltip.style("opacity",0.0);
                        }
                    }
    };

    // ... On document ready ...
    $(document).ready(function()
    {

        // Html layout with slider
        var optionsHtml =
            '<div class="infoTitle">Select hour</div>'+
                '<div class="infoContent">'+
                    '<span class="optionsLegend" style="float:right"></span>'+
                    '<div id="play" class="play"></div>'+
                    '<div class="layoutSlider"><input id="SliderSingle" type="slider" name="time" value="0" style="display: none;"></div>'+
                '</div>'+
            '</div>';

        self.optionsBox = d3.select("body").append("div")
            .attr("id","optionsBox")
            .html(optionsHtml)
            .attr("class", "optionsBox");

        // Slider callback and declaration
        self.changeSliderCallBack = function (value){
            self.sliderFrame = value;
            self.hour = value;
            self.mapChart.updateValues(["people"]);
        };

        self.mySlider = submarine.extras.genericSlider({
            sliderId: 'SliderSingle',
            playId: 'play',
            from: 0,
            to: 22,
            pathToImages: self.pathToImages,
            step: 1,
            interval: self.timerInterval,
            skin: "round_plastic",
            calculate: function( value ){
                return "Hora: " + value;
            },
            callback: self.changeSliderCallBack
        });

        // Insert callback maps onto vizOptions
        self.vizOptions['callBackDict'] = self.callBacks;

        // Instantiate mapChart
        self.mapChart = submarine.maps(self.idName, self.className, self.vizOptions);

        // Add a layer for everything, to keep the example simple
        self.mapChart.addLayer("people");

        // Render dataFile
        d3.json(self.baseJUrl+self.dataFile, function(mapData){

                if(mapData!=null){

                            self.mapData = mapData;
                            self.renderFile(self.geoFile, "people");
                }
                else{

                    self.myLog("Could not load file: "+self.baseJUrl+self.mapData,1);
                }
        });
    });

    return self;
};
