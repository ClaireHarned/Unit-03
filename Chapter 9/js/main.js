(function (){

	//pseudo-global variables
	var attrArray = ["IDPs (disaster-related)", "Refugees", "Asylum Seekers", "International Immigrants", "Emigrants"]; //list of attributes
	var expressed = attrArray[1]; //initial attribute


	//begin script when window loads
	window.onload = setMap();

	//set up choropleth map
function setMap() {
    //map frame dimensions
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3
        .select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //projection
    var projection = d3
        .geoAlbers()
        .center([-6, 47])
        .rotate([-20, 0, 0])
        .parallels([42, 62])
        .scale(1000)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath().projection(projection);

    //use promise to parallelize asynchronous data loading
    var promises = [
        d3.csv("data/Countries.csv"),
        d3.json("data/EuropeCountries.json"),
        d3.json("data/Countries.json"),
    ];
    Promise.all(promises).then(callback);

    function callback(data) {
        var csvData = data[0],
            europe = data[1],
            countries = data[2];

        //europe TopoJSON
        var europeCountries = topojson.feature(europe, europe.objects.pasted).features;

        //countries TopoJSON
        var countries = topojson.feature(countries, countries.objects.CountriesTJSON);

        //add in graticule lines every 5 degrees
        var graticule = d3.geoGraticule().step([5, 5]);

        //create graticule background
        var gratBackground = map
            .append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class
            .attr("d", path); //project graticule

        //create graticule lines
        var gratLines = map
            .select(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class
            .attr("d", path);

        //add all countries to map
        var countries = map
            .append("path")
            .datum(countries)
            .attr("class", "countries")
            .attr("d", path);

        //add Europe countries to map
       /* var europe = map
            .append("path")
            .datum(europeCountries)
            .attr("class", "europe")
            .attr("d", path);*/

	        europeCountries = joinData(europeCountries, csvData);

	        var colorScale = makeColorScale(csvData);

	        setEnumerationUnits(europeCountries,map,path,colorScale);

	        //add coordinated visualization to the map
        	setChart(csvData, colorScale);

	    };

	    
	};

	function setGraticule(map,path){
		var graticule = d3.geoGraticule()
	            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

	        //create graticule background
	        var gratBackground = map.append("path")
	            .datum(graticule.outline()) 
	            .attr("class", "gratBackground") 
	            .attr("d", path)

	        //create graticule lines
	        var gratLines = map.selectAll(".gratLines")
	            .data(graticule.lines())
	            .enter()
	            .append("path") 
	            .attr("class", "gratLines") 
	            .attr("d", path); 
	}

	function joinData(countries,csvData){
		//loop through csv to assign each set of csv attribute values to geojson country
	        for (var i=0; i<csvData.length; i++){
	            var csvCountry = csvData[i]; //the current country
	            var csvKey = csvCountry.Country; //the CSV primary key

	            //loop through geojson country to find correct country
	            for (var a=0; a<countries.length; a++){

	                var geojsonProps = countries[a].properties; //the current country geojson properties
	                var geojsonKey = geojsonProps.name; //the geojson primary key

	                
	                if (geojsonKey == csvKey){

	                    //assign all attributes and values
	                    attrArray.forEach(function(attr){
	                        var val = parseFloat(csvCountry[attr]); //get csv attribute value
	                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
	                    });
	                };
	            };
	        };
	        return countries;
	}

	function makeColorScale(data){
		var colorClasses = [
	        "#ffffc",
	        "#a1dab4",
	        "#41b6c4",
	        "#2c7fb8",
	        "#253494"
	    ];

	    //create color scale generator
	    var colorScale = d3.scaleQuantile()
	        .range(colorClasses);

	    //build array of all values of the expressed attribute
	    var domainArray = [];
	    for (var i=0; i<data.length; i++){
	        var val = parseFloat(data[i][expressed]);
	        domainArray.push(val);
	    };

	    //assign array of expressed values as scale domain
	    colorScale.domain(domainArray);

	    return colorScale;
	}

function setEnumerationUnits(countries,map,path,colorScale){
	//add coiuntries to map
    var countries = map.selectAll(".countries")
        .data(countries)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "countries " + d.properties.name;
        })
        .attr("d", path)
        .style("fill", function(d){
            var value = d.properties[expressed];
            console.log(value)
            if(value) {
            	return colorScale(d.properties[expressed]);
            } else {
            	return "#ccc";
            }
    });
}

//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.340,
        chartHeight = 473,
        leftPadding = 50,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([292, 1111350]);

    //set bars for each variable
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.adm1_code;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return colorScale(d[expressed]);
        });

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 60)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of " + expressed + " in Each EU Country");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
};

})();