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

    // InitialDate
    self.initMoment = moment(self.dateBegin, "YYYYMMDD");

    self.nowMoment = self.initMoment.clone();
    self.dateLookup = self.dateBegin + "00";
    self.weatherLookup = self.dateBegin;

    // Radius scale
    self.rScale = d3.scale.sqrt().domain([0,300]).range([0,500]);

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

    self.getDatumFromId = function(id)
    {

        if(id=="10")
        {
            return 0;
        }
        else
        {
            var intId = parseInt(id,10);
            id = intId < 10 ? "0" + intId.toString(): intId.toString();

            var lookup = self.dateLookup+id;

            return(parseInt(self.mapData[lookup],10));
        }

    };

    self.fillWeatherInfo = function()
    {
        var temp = self.weatherData[self.weatherLookup]['temp'];
        var wind = self.weatherData[self.weatherLookup]['wind'];
        var rain = self.weatherData[self.weatherLookup]['rain'];

        $('#tempId').html(temp + " ºC");
        $('#windId').html(wind + " km/h");
        $('#rainId').html(rain + " mm");
        $('#weatherTitle').html(self.nowMoment.clone().format("DD/MM/YYYY"));
    };

    // submarine.maps callbacks
    self.callBacks = {
                    'point':{
                        'zoom':function(selection){
                                selection.transition().duration(0)
                                    .attr("cx",function(d) {return self.mapChart.project(d.geometry.coordinates)[0];})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1];})
                                    .attr("r",function(d) {
                                        var datum = self.getDatumFromId(d.id);
                                        var radius = self.rScale(datum);
                                        return self.mapChart.getRealPixels(radius, d.geometry.coordinates[1])
                                    });
                        },

                        'enter': function(selection){
                                selection
                                    .attr("cx",function(d) {return self.mapChart.project(d.geometry.coordinates)[0];})
                                    .attr("cy",function(d) { return self.mapChart.project(d.geometry.coordinates)[1];})
                                    .attr("r",function(d) {
                                        var datum = self.getDatumFromId(d.id);
                                        var radius = self.rScale(datum);
                                        return self.mapChart.getRealPixels(radius, d.geometry.coordinates[1])
                                    });

                        },
                        'update': function(selection){
                                selection.transition().ease("linear").duration(self.transTime)
                                .attr("r",function(d) {
                                        var datum = self.getDatumFromId(d.id);
                                        var radius = self.rScale(datum);
                                        return self.mapChart.getRealPixels(radius, d.geometry.coordinates[1])
                                    });

                        },
                        'over': function(d,i)
                        {
                            var myHtml ="EcoContador num "+ d.id+": "+ d.properties.name;
                            myHtml+="</br>Conteo a " + self.nowMoment.format("DD/MM/YYYY HH:00")+" horas:</br><b>"+self.getDatumFromId(d.id)+"</b></br>";
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
            '<div class="infoTitle">Selecciona fecha/hora</div>'+
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


        var weatherHtml =
            '<div class="infoTitle" id="weatherTitle"></div>'+
                '<div class="infoContent">'+
                    '<div class="weatherLegend"><img width="40" src="img/temp.png"></div>'+
                    '<div class="weatherInfo" id="tempId"></div>'+
                '</div>'+
                '<div class="infoContent">'+
                    '<div class="weatherLegend"><img width="40" src="img/rain.png"></div>'+
                    '<div class="weatherInfo" id="rainId"></div>'+
                '</div>'+
                '<div class="infoContent">'+
                    '<div class="weatherLegend"><img width="40" src="img/wind.png"></div>'+
                    '<div class="weatherInfo" id="windId"></div>'+
                '</div>'+
            '</div>';

        self.weatherBox = d3.select("body").append("div")
            .attr("id","weatherBox")
            .html(weatherHtml)
            .attr("class", "weatherBox");

        // Slider callback and declaration
        self.changeSliderCallBack = function (value){
            self.sliderFrame = value;
            var hour = value % 24;
            var addedDays = Math.floor(value/24);
            var myMoment = self.initMoment.clone().add('days',addedDays).add('hours',hour);
            self.nowMoment = myMoment.clone();
            self.dateLookup = myMoment.format("YYYYMMDDHH");
            self.weatherLookup = myMoment.clone().format("YYYYMMDD");
            self.fillWeatherInfo();
            self.mapChart.updateValues(["all"]);
        };

        self.mySlider = submarine.extras.genericSlider({
            sliderId: 'SliderSingle',
            playId: 'play',
            from: 0,
            to: ((self.numDays*24)-1),
            pathToImages: self.pathToImages,
            step: 1,
            interval: self.timerInterval,
            skin: "round_plastic",
            calculate: function( value ){
                var hour = value % 24;
                var addedDays = Math.floor(value/24);
                var myMoment = self.initMoment.clone().add('days',addedDays).add('hours',hour);
                return myMoment.format("DD/MM/YYYY, HH:00, dddd");
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

                    d3.json(self.baseJUrl+self.weatherFile, function(weatherData)
                    {
                        if(weatherData!=null){
                            self.mapData = mapData;
                            self.weatherData = weatherData;
                            self.renderFile(self.geoFile, "all");
                            self.fillWeatherInfo();
                        }
                        else
                        {
                            self.myLog("Could not load file: "+self.baseJUrl+self.weatherData,1);
                        }
                    });
                }
                else{

                    self.myLog("Could not load file: "+self.baseJUrl+self.mapData,1);
                }
        });
    });

    return self;
};
