const width = window.innerWidth;
const height = 800;

const gameDropdown = document.getElementById("gameDropdown");
const colorRange = ["#feecde", "#fabf87", "#fd8c3e", "#d74802"];
const defualtMapColor = "gray";

// projecting the map
const projection = d3
    .geoEquirectangular()
    .scale(200)
    .translate([width / 2, height / 2]);

// drow the lines based on map data
const path = d3
    .geoPath()
    .projection(projection);

const legendTopSpacing = 150;
const legendListTopSpacing = 5;
const legendRectSize = 10;
const legendListLeftSpacing = legendRectSize + 5;
const legendTextTopSpacing = 8;

const apis = [
    d3.csv("./data/ratings-by-country.csv"),
    d3.json("./data/world_countries.json"),
];

// Tooltip
const tooltip = d3
    .select("#tooltip")
    .attr("class", "tooltip");

Promise.all(apis).then(([ratingData, mapData]) => {

    // Filtering and formating Data
    const gameList = [];
    ratingData.forEach((d) => {
        d["Average Rating"] = +d["Average Rating"];
        d["Number of Users"] = +d["Number of Users"];
        if (!gameList.includes(d.Game)) gameList.push(d.Game); // Creating distinct game name list
    });

    // Sort game list
    gameList.sort((a, b) => b.name - a.name);

    // Calculate Quantiles of ratingData
    let quantile = calculateQuantiles(ratingData.map((d) => d["Average Rating"]));

    const color = d3
        .scaleQuantile()
        .domain([1, 2, 3, 4])
        .range(colorRange);

    // Added Game name options
    gameList.forEach((d) => {
        const option = document.createElement("option");
        option.value = d;
        option.textContent = d;
        gameDropdown.append(option);
    });

    const svg = d3
        .select("#choroplethMap")
        .append("svg")
        .attr("id", "choropleth")
        .attr("height", height)
        .attr("width", width);

    const countries = svg.append("g").attr("id", "countries");

    const countryPaths = countries
        .selectAll("countrie")
        .data(mapData.features)
        .join("path")
        .attr("d", path)
        .attr("class", "countrie");

    const legend = svg
        .append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${width - legendTopSpacing},0)`);

    loadGameDataOnMap(gameDropdown.value);

    // Load Data on selection change
    gameDropdown.addEventListener("change", (event) => {
        loadGameDataOnMap(gameDropdown.value);
    });

    function loadGameDataOnMap(game) {

        //Get the rating data based on game name selected 
        const ratingsOfSelectedGame = ratingData.filter((d) => d.Game === game);

        // Passed to the calculateQuantiles mathod to get 4 parts of rating data
        quantile = calculateQuantiles(ratingsOfSelectedGame.map((d) => d["Average Rating"]));

        // Removed all the legend text and rect elements
        d3.selectAll(".legendText").remove();
        d3.selectAll(".legendRects").remove();

        for (i = 1; i <= 4; i++) {
            legend
                .append("rect")
                .attr("x", 0)
                .attr("y", i * (legendListTopSpacing + legendRectSize))
                .attr("fill", color(i))
                .attr("class", "legendRects")
                .attr("height", legendRectSize)
                .attr("width", legendRectSize);

            legend
                .append("text")
                .text(`${quantile[i - 1].toFixed(2)} to ${quantile[i].toFixed(2)}`)
                .attr("class", "legendText")
                .attr("x", legendListLeftSpacing)
                .attr("y", i * (legendListTopSpacing + legendRectSize) + legendTextTopSpacing);
        }

        countryPaths
            .style("fill", (d) => setColor(d, game))
            .on("mousemove", function (event, map) {
                // Showing tooltip if game name and country is available in data. 
                const result = ratingData.find((d) => (d.Game === game) && (d.Country === map.properties.name));

                if (result) {
                    tooltip
                        .style("display", "block")
                        .html(
                            `
                                <div><b>Country:</b> ${result["Country"]}</div>
                                <div><b>Game:</b> ${result["Game"]}</div>
                                <div><b>Avg Rating:</b> ${result["Average Rating"]}</div >
                                <div><b>Number of users:</b> ${result["Number of Users"]}</div>
                        `
                        )
                        .style("left", event.pageX + 10 + "px")
                        .style("top", event.pageY + "px");
                }
            })
            .on("mouseout", function (event) {
                tooltip.style("display", "none");
            });
    }

    // Set color
    function setColor(coutry, game) {
        const countryName = coutry.properties.name;
        const gameRatingList = ratingData.filter((d) => d.Game === game);
        const result = gameRatingList.find((d) => d.Country === countryName);
        if (result) {
            if (result["Average Rating"] <= quantile[1]) return color(1);
            else if (result["Average Rating"] <= quantile[2]) return color(2);
            else if (result["Average Rating"] <= quantile[3]) return color(3);
            else return color(4);
        } else {
            return defualtMapColor;
        }
    }

    // Dividing rating data into 4 parts
    function calculateQuantiles(rate) {
        const q0 = d3.quantile(rate, 0);
        const q1 = d3.quantile(rate, 0.25);
        const q2 = d3.quantile(rate, 0.5);
        const q3 = d3.quantile(rate, 0.75);
        const q4 = d3.quantile(rate, 1);
        return [q0, q1, q2, q3, q4];
    }
});
