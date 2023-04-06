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
        var europeCountries = topojson.feature(europe, europe.objects.pasted);

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
            .selectAll(".gratLines") //select graticule elements that will be created
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
        var europe = map
            .append("path")
            .datum(europeCountries)
            .attr("class", "europe")
            .attr("d", path);


    }
}