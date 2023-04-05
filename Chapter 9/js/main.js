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
        .center([0, 46.2])
        .rotate([-2, 0, 0])
        .parallels([43, 62])
        .scale(2500)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath().projection(projection);

    //use promise to parallelize asynchronous data loading
    var promises = [
        d3.csv("data/Countries.csv"),
        d3.json("data/EuropeCountries.json"),
    ];
    Promise.all(promises).then(callback);

    function callback(data) {
        var csvData = data[0],
            europe = data[1];

        //europe TopoJSON
        var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries);

        var graticule = d3.geoGraticule().step([5, 5]); //graticule lines every 5 degrees

        //create graticule background
        var gratBackground = map
            .append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class
            .attr("d", path); //project graticule

        //create graticule lines
        var gratLines = map
            .selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class
            .attr("d", path); 

        //add Europe countries to map
        var europe = map
            .append("path")
            .datum(europeCountries)
            .attr("class", "countries")
            .attr("d", path);
    }
}