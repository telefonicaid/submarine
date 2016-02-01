var submarine = submarine || {'version':0.9, 'controller':{}, 'viz': {} ,'extras': {} };

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

    // Point categorial scale [in the code, based on 'id']
    self.colorScale = d3.scale.category10();

    self.callBacks = {
                    'point':{
                        'zoom':function(selection){
                                selection
                                    .attr("cx",function(d) {return self.mapChart.project(self.mapData[d.id][self.sliderFrame])[0];})
                                    .attr("cy",function(d) { return self.mapChart.project(self.mapData[d.id][self.sliderFrame])[1];})
                                    .attr("r",function(d) { return self.mapChart.getRealPixels(self.pointRadius, self.mapData[d.id][self.sliderFrame][1])})
                        },

                        'enter': function(selection){
                                selection
                                    .attr("cx",function(d) {return self.mapChart.project(self.mapData[d.id][self.sliderFrame])[0];})
                                    .attr("cy",function(d) { return self.mapChart.project(self.mapData[d.id][self.sliderFrame])[1];})
                                    .attr("r",function(d) { return self.mapChart.getRealPixels(self.pointRadius, self.mapData[d.id][self.sliderFrame][1])})
                                    .style("fill",function(d,i){ return self.colorScale(d.id);});
                        },
                        'update': function(selection){
                                selection.transition().ease("linear").duration(self.transTime)
                                    .attr("cx",function(d) {return self.mapChart.project(self.mapData[d.id][self.sliderFrame])[0];})
                                    .attr("cy",function(d) { return self.mapChart.project(self.mapData[d.id][self.sliderFrame])[1];})
                        }
                    }
    };

    // ... On document ready ...
    $(document).ready(function()
    {

        // Html layout with slider
        var optionsHtml =
            '<div class="infoTitle">Options</div>'+
                '<div class="infoContent">'+
                    '<span class="optionsLegend" style="float:right">Time slot</span>'+
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
            self.mapChart.updateValues(["all"]);
        };


        self.mySlider = submarine.extras.genericSlider({
            sliderId: 'SliderSingle',
            playId: 'play',
            from: 0,
            to: 180,
            pathToImages: self.pathToImages,
            step: 1,
            interval: self.timerInterval,
            skin: "round_plastic",
            calculate: function( value ){
                return value;
            },
            callback: self.changeSliderCallBack
        });

        // Insert callback maps onto vizOptions
        self.vizOptions['callBackDict'] = self.callBacks;

        // Instantiate mapChart
        self.mapChart = submarine.maps(self.idName, self.className, self.vizOptions);

        // Add a layer for everything, to keep the example simple
        self.mapChart.addLayer("all");

        // Render dataFile
        d3.json(self.baseJUrl+self.dataFile, function(mapData){

                if(mapData!=null){

                    self.mapData = mapData;
                    self.renderFile(self.geoFile, "all");
                }
                else{

                    self.myLog("Could not load file: "+self.baseJUrl+self.geoFile,1);
                }
        });
    });

    return self;
};
