const color_label_width = 10;
const width = 360;
const bandwith = 10;
const thresholds = 10;
const cellsize = 5;
const curve = 1.8;
const KelvinType = 273.15;
const temparetureCircleRadius = 3;
const legendRectHeight = 5;

const sphere = ({ type: "Sphere" });
const tooltip = d3.select("#tooltip").attr("class", "tooltip");
const apis = [d3.json("./data/worldWeather.json"), d3.json("https://unpkg.com/world-atlas@1/world/110m.json")];
const url = "./data/temp.tiff";
const colorInterpolator = d3.interpolateRgbBasis(["#bff6ff", "#3f51b5", "#b53fb1", "#f44336", "#ff9800", "#ffeb3b", "#fffff"]);

const projectionList = [
    { 'name': 'geoCylindricalStereographic', 'value': 'geoCylindricalStereographic' },
    { 'name': 'geoNaturalEarth1', 'value': 'geoNaturalEarth1' },
    { 'name': 'geoConicEqualArea', 'value': 'geoConicEqualArea' },
    { 'name': 'geoConicEquidistant', 'value': 'geoConicEquidistant' },
    { 'name': 'geoCraig', 'value': 'geoCraig' },
    { 'name': 'geoEckert1', 'value': 'geoEckert1' },
    { 'name': 'geoEckert6', 'value': 'geoEckert6' },
    { 'name': 'geoEisenlohr', 'value': 'geoEisenlohr' },
    { 'name': 'geoGingery', 'value': 'geoGingery' },
    { 'name': 'geoOrthographic', 'value': 'geoOrthographic' },
    { 'name': 'geoInterruptedHomolosine', 'value': 'geoInterruptedHomolosine' },
    { 'name': 'geoInterruptedBoggs', 'value': 'geoInterruptedBoggs' },
    { 'name': 'geoInterruptedMollweideHemispheres', 'value': 'geoInterruptedMollweideHemispheres' },
    { 'name': 'geoPolyhedralButterfly', 'value': 'geoPolyhedralButterfly' },
    { 'name': 'geoPolyhedralWaterman', 'value': 'geoPolyhedralWaterman' },
    { 'name': 'geoGringortenQuincuncial', 'value': 'geoGringortenQuincuncial' },
]

const projectionSelection = document.getElementById("projectionSelection");
projectionList.forEach((d) => {
    const option = document.createElement("option");
    option.value = d.value;
    option.textContent = d.name;
    projectionSelection.append(option);
});

projectionSelection.addEventListener("change", (event) => {
    loadData()
});
loadData();

function loadData() {
    const temperatureData = [];
    const projection = d3[projectionSelection.value]();

    Promise.all(apis).then(([weatherData, r]) => {
        weatherData.forEach((d, i) => {
            temperatureData.push({
                "id": i + 1,
                "lat": d.coord.lat,
                "lon": d.coord.lon,
                "cityName": d.name,
                "temperature": d.main.temp,
                "temp_min": d.main.temp_min,
                "temp_max": d.main.temp_max,
                "feelsLike": d.main.feels_like,
                "windDeg": d.wind.deg,
                "speed": d.wind.speed,
                "windGust": d.wind.gust,
                "pressure": d.main.pressure,
                "humidity": d.main.humidity,
                "sea_level": d.main.sea_level,
                "grnd_level": d.main.grnd_level,
                "visibility": d.visibility,
                "sunrise": d.sys.sunrise,
                "sunset": d.sys.sunset,
                "clouds": d.clouds.all
            })
        });



        const land = topojson.feature(r, r.objects.countries);
        const dots = temperatureData.map((d) => d);

        // Calculate Height
        const [[x0, y0], [x1, y1]] = d3.geoPath(projection.fitWidth(width, sphere)).bounds(sphere);
        const dy = Math.ceil(y1 - y0);
        const height = dy;

        const path = d3.geoPath(projection);

        const weatherForcast = d3.select("#weatherForcast");
        weatherForcast.selectAll("svg").remove();
        const svg = weatherForcast
            .append("svg")
            .attr("viewBox", [0, 0, width, height])
            .style("width", "100%")
            .style("height", "auto");

        // geoTiff
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(buffer => GeoTIFF.fromArrayBuffer(buffer))
            .then(tiff => tiff.getImage())
            .then(async image => {

                const n = image.getWidth();
                const m = image.getHeight();
                const values = rotate((await image.readRasters())[0], 0, 0);
                const contour = d3.contours().size([n, m])
                // const contourColor = d3.scaleSequential().domain(d3.extent(values)).interpolator(colorInterpolator);
                const contourColor = d3.scaleSequential(d3.extent(values), d3.interpolateMagma)
                const temperatureColorScale = d3.scaleSequential(d3.extent(values), d3.interpolateMagma);

                svg
                    .append("g")
                    .attr("id", "world")
                    .selectAll("paths")
                    .data(Array.from(contour(values)))
                    .join("path")
                    .attr("d", d => path(invert(d, n, m)))
                    .style("fill", d => contourColor(d.value))

                svg.call(drawtemplate);

                // clip path contour on the map
                svg
                    .append("clipPath")
                    .attr("id", "landclip")
                    .append("path")
                    .datum(land)
                    .attr("d", path);

                const pointContainer = svg
                    .append("g")
                    .attr("id", "pointContainer")
                    .selectAll("container")
                    .data(dots)
                    .join("g")
                    .on("mousemove", function (event, d) {
                        tooltip
                            .style("display", "block")
                            .html(
                                `       <div class="tooltipTitle" style="background-color:${temperatureColorScale(d.temperature - KelvinType)};">
                                            <h2> ${d.cityName}</h2>
                                            <img src="${getSkyImage(d.clouds)}" height=20>
                                        </div>
                                            <div style="padding:10px;display:flex" >
                                                <div class="tooltipConatiner1" >
                                                    <div><b>Tempareture</b></div>
                                                    <hr/>
                                                    <div class="tooltipSpace"><b>Avg:</b> <i>${parseInt(d.temperature - KelvinType)}°</i></div>
                                                    <div class="tooltipSpace"><b>Min:</b> <i>${parseInt(d.temp_min - KelvinType)}°</i></div>
                                                    <div class="tooltipSpace"><b>Max:</b> <i>${parseInt(d.temp_max - KelvinType)}°</i></div>
                                                    <br/>
                                                    <div><b>Wind</b></div>
                                                    <hr/>
                                                    <div class="tooltipSpace"><b>Direction: </b> <i>${determineDirection(d.windDeg)}°</i></div> 
                                                    <div class="tooltipSpace"><b>Speed:</b> <i>${d.speed} km/h</i></div>
                                                    <div class="tooltipSpace"><b>Gusts:</b> <i>${d.windGust}  km/h</i></div>
                                                </div>
                                                <div class="tooltipConatiner1">
                                                    <div><b>Other</b></div>
                                                    <hr/>
                                                    <div class="tooltipSpace"><b>Pressure:</b> <i>${d.pressure}hPa</i></div>
                                                    <div class="tooltipSpace"><b>Humidity:</b> <i>${d.humidity}%</i></div>
                                                    <div class="tooltipSpace"><b>Visibility:</b> <i>${d.visibility / 100}%</i></div>
                                                    <br/>
                                                    <div><b>Time</b></div>
                                                    <hr/>
                                                    <div class="tooltipSpace"><b>Sunrise:</b> <i>${formatTime(d.sunrise)}</i></div>
                                                    <div class="tooltipSpace"><b>Sunset:</b> <i>${formatTime(d.sunset)}</i></div>
                                                </div>
                                            </div>
                                    `
                            )
                            .style("left", event.pageX + 10 + "px")
                            .style("top", event.pageY + "px");

                        // d3.select(`#wind-${d.id}`)
                        //     .transition()
                        //     .duration(100)
                        //     .attr("d", `M 0,0 L 5,5 L 4.3 3.5 M 5 5 L 3.5 4.3`);

                        d3.select(`#circle-${d.id}`)
                            .transition()
                            .duration(100)
                            .style("fill", (d) => temperatureColorScale(d.temperature - KelvinType))
                            .attr("r", temparetureCircleRadius)
                            .attr("stroke-width", 0.1)
                            .style("stroke", "black");

                        d3.select(`#image-${d.id}`)
                            .transition()
                            .duration(100)
                            .attr("height", 5)
                            .attr("x", -2.5)
                            .attr("y", -2.5)

                        // d3.select(`#lable-${d.id}`)
                        //     .transition()
                        //     .duration(100)
                        //     .text((d) => parseInt(d.temperature - KelvinType));
                    })
                    .on("mouseout", function (event, d) {
                        tooltip.style("display", "none");

                        // d3.select(`#wind-${d.id}`)
                        //     .transition()
                        //     .duration(1000)
                        //     .attr("d", `M 0,0`);

                        d3.select(`#image-${d.id}`)
                            .transition()
                            .duration(2000)
                            .attr("height", 3)
                            .attr("x", -1.5)
                            .attr("y", -3)

                        d3.select(`#circle-${d.id}`)
                            .transition()
                            .duration(2000)
                            .style("fill", "black")
                            .attr("r", 0.5)


                        // d3.select(`#lable-${d.id}`)
                        //     .transition()
                        //     .duration(2000)
                        //     .text('');
                    });

                // pointContainer.append("g")
                //     .attr("fill", "black")
                //     .selectAll("winds")
                //     .data(dots)
                //     .join("path")
                //     .attr("id", (d) => `wind-${d.id}`)
                //     .attr("class", "wind")
                //     .attr("fill", "none")
                //     .attr("stroke", "black")
                //     .attr("stroke-width", 0.3)
                //     .attr("transform", d => `translate(${projection([d.lon, d.lat])}) rotate(${d.windDeg})`);

                pointContainer
                    .append("circle")
                    .attr("id", (d) => `circle-${d.id}`)
                    .attr("r", 0.5)
                    .attr("transform", d => `translate(${projection([d.lon, d.lat])})`)
                    .style("fill", "black");

                pointContainer
                    .append("image")
                    .attr("id", (d) => `image-${d.id}`)
                    .attr("height", 3)
                    .attr("x", -1.5)
                    .attr("y", -3)
                    .attr("opacity", 1)
                    .attr("transform", d => `translate(${projection([d.lon, d.lat])})`)
                    .attr("xlink:href", './images/location.png');

                // pointContainer
                //     .append("text")
                //     .attr("class", "tempLable")
                //     .attr("id", (d) => `lable-${d.id}`)
                //     .attr("text-anchor", "middle")
                //     .attr("transform", d => `translate(${projection([d.lon, d.lat - 1])})`);

                const density_thresholds = Array.from(contour(values)).map((d) => d.value);

                const legend = svg
                    .append("g")
                    .selectAll('legend')
                    .data(density_thresholds)
                    .join("g");

                legend.attr("transform", `translate(${((width - (density_thresholds.length * color_label_width)) / 2)}, ${height - 10})`)
                legend
                    .append("rect")
                    .attr('class', 'color_label')
                    .attr("width", color_label_width)
                    .attr("height", legendRectHeight)
                    .attr("x", (d, i) => ((color_label_width) * i) + 1)
                    .attr("y", 0)
                    .style("stroke-width", 0)
                    .attr("fill", d => contourColor(d));

                legend
                    .append("text")
                    .attr('class', 'color_label_text')
                    .style("text-anchor", "start")
                    .attr("x", (d, i) => ((color_label_width) * i) + (color_label_width / 2) - 1)
                    .attr("y", legendRectHeight / 2)
                    .attr("width", color_label_width)
                    .text(d => `${d}°C`)
                    .style('fill', (d) => d >= 0 ? "black" : "white");
            })
            .catch(error => {
                console.error("Error loading GeoTIFF:", error);
            });

        // Draw map 
        function drawtemplate(selection) {

            // Sphere of map
            selection
                .append("g")
                .append("path")
                .datum(sphere)
                .style("fill", "#a9daeb")
                .attr("fill-opacity", 0)
                .attr("d", path);

            // Land of map
            selection
                .append("g")
                .append("path")
                .datum(land)
                .attr("fill", "white")
                .attr("fill-opacity", 0.1)
                .style("stroke", "#CCCCCC")
                .attr("stroke-width", 0.1)
                .attr("d", path);
        }
    })
}



function rotate(values, n, m) {
    var l = n >> 1;
    for (var j = 0, k = 0; j < m; ++j, k += n) {
        values.subarray(k, k + l).reverse();
        values.subarray(k + l, k + n).reverse();
        values.subarray(k, k + n).reverse();
    }
    return values;
}

// Get direction
function determineDirection(degree) {
    // Normalize the degree to be within [0, 360)
    degree = ((degree % 360) + 360) % 360;

    if (degree >= 337.5 || degree < 22.5) {
        return "N";
    } else if (degree >= 22.5 && degree < 67.5) {
        return "NE";
    } else if (degree >= 67.5 && degree < 112.5) {
        return "E";
    } else if (degree >= 112.5 && degree < 157.5) {
        return "SE";
    } else if (degree >= 157.5 && degree < 202.5) {
        return "S";
    } else if (degree >= 202.5 && degree < 247.5) {
        return "SW";
    } else if (degree >= 247.5 && degree < 292.5) {
        return "W";
    } else {
        return "NW";
    }
}

function formatTime(value) {
    const date = new Date(value * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}: ${minutes}: ${seconds} `;
}

function invert(d, n, m) {
    const shared = {};

    let p = {
        type: "Polygon",
        coordinates: d3.merge(d.coordinates.map(polygon => {
            return polygon.map(ring => {
                return ring.map(point => {
                    return [point[0] / n * 360 - 180, 90 - point[1] / m * 180];
                }).reverse();
            });
        }))
    };

    // Record the y-intersections with the antimeridian.
    p.coordinates.forEach(ring => {
        ring.forEach(p => {
            if (p[0] === -180) shared[p[1]] |= 1;
            else if (p[0] === 180) shared[p[1]] |= 2;
        });
    });

    // Offset any unshared antimeridian points to prevent their stitching.
    p.coordinates.forEach(ring => {
        ring.forEach(p => {
            if ((p[0] === -180 || p[0] === 180) && shared[p[1]] !== 3) {
                p[0] = p[0] === -180 ? -179.9995 : 179.9995;
            }
        });
    });

    p = d3.geoStitch(p);

    // If the MultiPolygon is empty, treat it as the Sphere.
    return p.coordinates.length
        ? { type: "Polygon", coordinates: p.coordinates }
        : { type: "Sphere" };
}

function getSkyImage(cloud) {
    if (cloud > 70) return './images/cloud.png';
    else if (cloud >= 30 && cloud <= 70) return './images/cloudy-sunny.png';
    else return './images/sun.png';
}