const apis = [
    d3.json('./data/rawStars.json'), // https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/stars.6.json
    d3.json('./data/constellationLine.json'), // https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json
    d3.json('./data/chineseConstellationLines.json') // https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.cn.json
];

const width = 500;
const height = 500;

const showConstellations = true;
const westernColor = "#726d1c";

const showChineseConstellations = false;
const chineseColor = "#c0bfb0";

const constellationOpacity = 0.5;
const showGraticules = true;
const dsoWidth = 0.5;
const graticuleStrokeWidth = 0.5;

const showStars = true;
const magnitudeThreshold = 7;

const minStar = 0.5;
const maxStar = 6;

const clock = new Date().toLocaleTimeString("en-GB");
const calendar = new Date().toLocaleDateString("en-GB").split("/").reverse().join("-");

let worldCoords = [21.1702, 72.8311]; // surat
let observer = { latitude: worldCoords[1], longitude: worldCoords[0] };
const observationTime = new Date(calendar + " " + clock);

const discRadius = width / 2;

Promise.all(apis).then(([rawStars, constellationLines, chineseConstellationLines]) => {
    const stars = {
        type: "FeatureCollection",
        features: rawStars.features
            .filter((s) => s.properties.mag)
            .filter((s) => parseInt(s.properties?.mag) < magnitudeThreshold)
    };

    const constellationScale = d3
        .scaleLinear()
        .domain(
            d3.extent(
                constellationLines.features.map((d) => parseInt(d.properties.rank))
            )
        )
        .range([1, 3]);

    const magnitudeScale = d3
        .scaleLinear()
        .domain(
            d3.extent(
                stars.features.map((d) =>
                    parseInt(d?.properties?.mag ? d.properties.mag : 1)
                )
            )
        )
        .range([maxStar, minStar]);

    let projection = d3
        .geoProjection(flippedStereographicProjection)
        .scale(discRadius)
        .clipAngle(90)
        .rotate([-localSiderealTime, -observer.latitude])
        .translate([discRadius, discRadius])
        .precision(0.1)

    let astroPath = d3
        .geoPath(projection)
        .pointRadius((d) =>
            d.properties?.mag ? magnitudeScale(d.properties.mag) : 1
        )
    const svg = d3.select("#svgContainer")
        .append("svg")
        .attr("width", width)
        .attr("height", width);

    // const bg = svg.append("rect").attr("width", width).attr("height", width);

    const graticule = d3.geoGraticule()
        .stepMinor([15, 10])
        .stepMajor([90, 10]);

    const sphere = { type: "Sphere" };

    function loadGraph() {
        svg.selectAll("g").remove();

        const sphereG = svg.append("g").append("path");
        const graticuleG = svg.append("g").attr("id", "graticuleG").append("path");
        const starsG = svg.append("g").attr("id", "starsG");
        const constellationsG = svg.append("g").attr("id", "constellationsG");
        const chineseConstellationsG = svg.append("g").attr("id", "chineseConstellationsG");

        sphereG
            .datum(sphere)
            .transition()
            .attr("class", "sky")
            .attr("d", astroPath)
            .style("fill", "#b9dccd")
            .attr("stroke", "white");

        if (showGraticules) {
            graticuleG
                .datum(graticule)
                .transition()
                .attr("class", "graticule")
                .attr("d", (d) => astroPath(d))
                .attr("fill", "none")
                .attr("stroke", "white")
                .attr("stroke-width", graticuleStrokeWidth);
        }
        if (showStars) {
            starsG
                .selectAll()
                .data(stars.features)
                .join("path")
                .transition()
                .attr("d", (d) => astroPath(d))
                .attr("fill", "#345f62");
        }
        if (showConstellations) {
            constellationsG
                .selectAll()
                .data(constellationLines.features)
                .join("path")
                .transition()
                .attr("d", (d) => astroPath(d))
                .style("stroke", westernColor)
                .attr("opacity", constellationOpacity)
                .attr("fill", "none")
                .attr("stroke-width", (d) =>
                    constellationScale(parseInt(d.properties.rank))
                );
        }
        if (showChineseConstellations) {
            chineseConstellationsG
                .selectAll()
                .data(chineseConstellationLines.features)
                .join("path")
                .transition()
                .attr("d", (d) => astroPath(d))
                .attr("stroke", chineseColor)
                .attr("opacity", constellationOpacity)
                .attr("fill", "none")
                .attr("stroke-width", (d) =>
                    constellationScale(parseInt(d.properties.rank))
                );
        }


        const saveLatLong = document.getElementById("saveLatLong");
        saveLatLong.addEventListener("click", function () {
            const lat = document.getElementById("latitude").value;
            const long = document.getElementById("longitude").value;
            worldCoords = [lat, long];
            observer = { latitude: worldCoords[1], longitude: worldCoords[0] }

            projection = d3
                .geoProjection(flippedStereographicProjection)
                .scale(discRadius)
                .clipAngle(90)
                .rotate([-localSiderealTime, -observer.latitude])
                .translate([discRadius, discRadius])
                .precision(0.1);

            astroPath = d3
                .geoPath(projection)
                .pointRadius((d) =>
                    d.properties?.mag ? magnitudeScale(d.properties.mag) : 1
                );

            // sphereG.transition().attr("d", astroPath);
            // graticuleG.transition().attr("d", (d) => astroPath(d));
            // starsG.transition().attr("d", (d) => astroPath(d));
            // constellationsG.transition().attr("d", (d) => astroPath(d));
            // chineseConstellationsG.transition().attr("d", (d) => astroPath(d));
            loadGraph();
        })
    }
    loadGraph();
});

function localSiderealTime() {
    const time = observationTime.getTime(); // the timestamp, not neccessarely using UTC as current time
    const julianDay =
        time / 86400000 - observationTime.getTimezoneOffset() / 1440 + 2440587.5;

    const daysSinceJ2000 = julianDay - 2451545.0;

    const universalTimeHours =
        observationTime.getUTCHours() +
        observationTime.getUTCMinutes() / 60 +
        observationTime.getUTCSeconds() / 3600;

    const greenwichMeanSiderealTime =
        100.46 + 0.985647 * daysSinceJ2000 + 15.0 * universalTimeHours;

    return greenwichMeanSiderealTime + observer.longitude;
}

function flippedStereographicProjection(lambda, phi) {
    var coslambda = Math.cos(lambda),
        cosphi = Math.cos(phi),
        k = 1 / (1 + coslambda * cosphi);
    return [-k * cosphi * Math.sin(lambda), k * Math.sin(phi)];
}