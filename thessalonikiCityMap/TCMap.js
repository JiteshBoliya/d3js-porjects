const apis = [
    d3.json('./data/districts.json'),
    d3.json('./data/blocks.topojson'),
    d3.json('./data/listings.json'),
    d3.json('./data/boroughs.topojson')
];

const selectionOptionArray = [
    "MUNICIPALITY OF THESSALONIKI",
    "MALAKOPI",
    "of March",
    "HIPPOKRATEIO-FALIRO",
    "HOLY TRINITY",
    "TOP DUMP",
    "TRIANDRIA",
    "METROPOLITAN AREA 1",
    "40 CHURCHES",
    "CHAMBER - ROTTONA",
    "WHITE TOWER",
    "ARISTOTELOUS",
    "ADMINISTRATOR",
    "A.POLI - EPTAPYRGIO",
    "P.MANIFESTED",
    "DRY FAUCET",
    "FIX - VEGETABLE GARDENS",
    "GIANNICSON - STATION",
    "Climb - BOTSAR",
    "CHARILAOU",
    "RAILWAYS",
    "DEPOT",
    "N. SWITZERLAND",
    "BULGARI - KIFISIA",
    "DROP DOWN",
    "PAPAFI",
    "METROPOLITAN AREA 2"
];

const svgContainer = document.getElementById("svgContainer");
const svgContainer2 = document.getElementById("svgContainer2");
const svgContainer3 = document.getElementById("svgContainer3");
const svgContainer4 = document.getElementById("svgContainer4");
const svgContainer5 = document.getElementById("svgContainer5");

const ageColorScale = d3.scaleThreshold([1950, 1970, 1990, 2010], ['#feebe2', '#fbb4b9', '#f768a1', '#c51b8a', '#7a0177']);
const seismicRegulationsMilestones = [1959, 1984, 1992, 2000];
const seismicRegulationsColorScale = d3.scaleThreshold()
    .domain(seismicRegulationsMilestones)
    .range(['#d7191c', '#fdae61', '#ffffbf', '#a6d96a', '#1a9641']);

const width = 0.98 * svgContainer.clientWidth;
const height = width / 1.618;
const rotate = [0, 0, 35]
const mapGap = 2;
const tooltipWidth = 50;
const tooltipHeight = 30;

svgContainer.appendChild(Legend(ageColorScale, { title: "Year of Manufacture" }));
svgContainer2.appendChild(Legend(seismicRegulationsColorScale, { title: "Year of Manufacture" }));
svgContainer3.appendChild(Legend(seismicRegulationsColorScale, { title: "Year of Manufacture" }));
svgContainer4.appendChild(Legend(seismicRegulationsColorScale, { title: "Year of Manufacture" }));
svgContainer5.appendChild(Legend(seismicRegulationsColorScale, { title: "Year of Manufacture" }));

Promise.all(apis).then(async ([districtsTopojson, blocksTopojson, listings, boroughsTopojson]) => {
    const topo = topojson.feature(districtsTopojson, districtsTopojson.objects.collection);
    const cityBoundaries = topojson.merge(districtsTopojson, districtsTopojson.objects.collection.geometries);
    const blockFeatures = topojson.feature(blocksTopojson, blocksTopojson.objects.collection).features;
    const listingsByBlock = d3.group(listings, d => d.block_id);

    const projection = d3.geoMercator()
        .rotate(rotate)
        .fitExtent([[mapGap, mapGap], [width - mapGap, height - mapGap]], topo);
    const shapeGenerator = d3.geoPath().projection(projection);

    function choropleth(id, colorScale, aggregation = "median", showColoredBlocks = true, showColoredPoints = false) {
        const svg = d3.select(id)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background", "#FFF");

        const tooltip = svg.append("g")
            .attr("class", "tooltip")
            .attr("transform", "translate(0,0)")
            .style("opacity", 0)
            .style("pointer-events", "none");

        const tooltipRect = tooltip.append("rect")
            .attr("class", "tooltip-rect")
            .attr("width", tooltipWidth)
            .attr("height", tooltipHeight)
            .attr("rx", 5)
            .attr("ry", 5)
            .attr("fill", "rgba(97, 97, 97, 0.97)");

        const tooltipText = tooltip.append("text")
            .attr("class", "tooltip-text")
            .attr("transform", `translate(${[tooltipWidth / 2, tooltipHeight / 2]})`)
            .attr("dy", 6)
            .attr("text-anchor", "middle")
            .style("fill", "#FFF")
            .style("font", "17px/1.5 var(--sans-serif)");

        const shapeValues = new Map(blockFeatures.map((d, i) =>
            [d.properties.id, listingsByBlock.get(d.properties.id) ? d3[aggregation](listingsByBlock.get(d.properties.id), e => e.construction_year) : null]));

        svg.append("path")
            .attr("d", (d, i) => shapeGenerator(cityBoundaries))
            .attr("fill", "rgb(245, 245, 245, 0.3)")
            .attr("stroke-width", 0.5)
            .attr("stroke", d3.rgb("whitesmoke").darker());

        if (showColoredPoints) {
            svg.selectAll(".shape-boundary")
                .data(blockFeatures, (d, i) => d.properties.id)
                .join("path")
                .attr("class", "shape")
                .attr("strokeLinecap", "round")
                .attr("strokeLinejoin", "round")
                .attr("fill", "rgb(245, 245, 245, 0.9)")
                .attr("stroke", d3.rgb("whitesmoke").darker(1))
                .attr("d", shapeGenerator);

            svg.selectAll(".pin")
                .data(listings.sort((a, b) => d3.descending(a.construction_year, b.construction_year)))
                .join("circle")
                .attr("class", "pin")
                .attr("r", 1.6)
                .attr("fill", (d, i) => colorScale(d.construction_year))
                .attr("transform", (d) => `translate(${projection([d.longitude, d.latitude])})`)
                .on("mouseover", function (e, d) {
                    d3.select(this)
                        .attr("stroke", "#ff7f0e")
                        .attr("stroke-width", 1)
                        .raise();
                    svg.select("g.tooltip").raise();
                    svg.select(".tooltip-text").text(d.construction_year);
                }).on("mousemove", function (e, d) {
                    svg.select("g.tooltip")
                        .attr("transform", `translate(${e.offsetX + 5}, ${e.offsetY + 5})`)
                        .transition()
                        .duration(50)
                        .style("opacity", 1);
                }).on("mouseout", function (e, d) {
                    d3.select(this)
                        .attr("stroke", d3.rgb("whitesmoke").darker(1))
                        .attr("stroke-width", 0.5);
                    svg.select("g.tooltip")
                        .transition()
                        .duration(50)
                        .style("opacity", 0);
                });
        }

        if (showColoredBlocks) {
            svg.selectAll(".shape")
                .data(blockFeatures, (d, i) => d.properties.id)
                .join("path")
                .attr("class", "shape")
                .attr("strokeLinecap", "round")
                .attr("strokeLinejoin", "round")
                .attr("d", shapeGenerator)
                .attr("opacity", 1)
                .attr("fill", (d, i) => shapeValues.get(d.properties.id) ? colorScale(shapeValues.get(d.properties.id)) : "rgb(245, 245, 245, 0.9)")
                .attr("stroke-width", 0.5)
                .attr("alt", (d, i) => shapeValues.get(d.properties.id))
                .attr("stroke", d3.rgb("whitesmoke").darker(1))
                .attr("pointer-events", (d, i) => shapeValues.get(d.properties.id) ? "all" : "none")
                .on("mouseover", function (e, d) {
                    d3.select(this)
                        .attr("stroke", "#ff7f0e")
                        .attr("stroke-width", 1)
                        .raise();
                    svg.select("g.tooltip").raise();
                    svg.select(".tooltip-text").text(Math.round(shapeValues.get(d.properties.id)));
                }).on("mousemove", function (e, d) {
                    svg.select("g.tooltip")
                        .attr("transform", `translate(${e.offsetX + 5}, ${e.offsetY + 5})`)
                        .transition()
                        .duration(50)
                        .style("opacity", 1);
                }).on("mouseout", function (e, d) {
                    d3.select(this)
                        .attr("stroke", d3.rgb("whitesmoke").darker(1))
                        .attr("stroke-width", 0.5);
                    svg.select("g.tooltip")
                        .transition()
                        .duration(50)
                        .style("opacity", 0);
                });
        }

    }


    // ===============================================
    // Dropdown
    // ===============================================

    const selectElement = document.getElementById("selectElement");
    selectionOptionArray.forEach((optionData, i) => {
        const newOption = document.createElement('option');
        newOption.value = i;
        newOption.text = optionData;

        selectElement.appendChild(newOption);
    });
    boroughsChoropleth();

    selectElement.addEventListener("change", function () {
        boroughsChoropleth(selectElement.value);
    })


    function boroughsChoropleth(boroughId = 0) {
        let width = 0.16 * svgContainer.clientWidth;
        let height = width / 1.618;
        let rotate = [0, 0, 35]
        let mapGap = 2;
        d3.select("#boroughsChoroplethSvg").selectAll("svg").remove();
        const svg = d3.select("#boroughsChoroplethSvg")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("background", "#FFF");

        let topo = topojson.feature(boroughsTopojson, boroughsTopojson.objects.collection);
        let projection = d3.geoMercator().rotate(rotate).fitExtent([[mapGap, mapGap], [width - mapGap, height - mapGap]], topo);
        // Create a path generator.
        let shapeGenerator = d3.geoPath().projection(projection);
        // Calculate the bounds based on the topojson
        let cityBoundaries = topojson.merge(boroughsTopojson, boroughsTopojson.objects.collection.geometries);

        let blockFeatures = topojson.feature(boroughsTopojson, boroughsTopojson.objects.collection).features;

        svg
            .append("path")
            .attr("d", (d, i) => shapeGenerator(cityBoundaries))
            .attr("fill", "whitesmoke")
            .attr("stroke-width", 0.5)
            .attr("stroke", d3.rgb("whitesmoke").darker());

        svg
            .append("path")
            .attr("d", (d, i) => shapeGenerator(cityBoundaries))
            .attr("fill", "whitesmoke")
            .attr("stroke-width", 0)
            .attr("stroke", "whitesmoke");

        let shapes = svg
            .selectAll(".shape")
            .data(blockFeatures.filter((d, i) => boroughId < 1 || +d.properties.id === +boroughId), (d, i) => d.properties.id)
            .join("path")
            .attr("class", "shape")
            .attr("strokeLinecap", "round")
            .attr("strokeLinejoin", "round")
            .attr("d", shapeGenerator)
            .attr("stroke", d3.rgb("#ff7f0e").darker())
            .attr("stroke-width", 1)
            .attr("fill", "#ff7f0e")

        Histogram(listings.filter(d => boroughId === 0 ? true : d.borough_id === boroughId), {
            value: d => d.construction_year,
            label: "Year of Manufacture →",
            yLabel: "↑ Frequency",
            width: svgContainer.clientWidth,
            height: 500,
            color: "steelblue",
            xFormat: d3.format(".4"),
            svgId: "#histogramChartSvg",
        });


        const boroughsRollup = d3.bin().thresholds(seismicRegulationsMilestones)(listings.filter(d => boroughId === 0 ? true : d.borough_id === boroughId).map(d => d.construction_year)).map((d, i) => {
            return {
                frequency: d.length,
                entries: d,
                lim: d.x0,
                lim2: d.x1,
                construction_year: `${d.x0} to ${d.x1}`
            }
        })

        BarChart(boroughsRollup, {
            x: d => d.construction_year,
            y: d => d.frequency,
            xLabel: "Year of Manufacture →",
            yLabel: "↑ Frequency",
            width: svgContainer.clientWidth,
            height: 500,
            color: "steelblue",
            svgId: "#barChartSvg",
        })
    };

    choropleth("#svgContainer", ageColorScale, "min", false, true);
    choropleth("#svgContainer2", seismicRegulationsColorScale, "min", false, true);
    choropleth("#svgContainer3", seismicRegulationsColorScale, "mean");
    choropleth("#svgContainer4", seismicRegulationsColorScale, "median");
    choropleth("#svgContainer5", seismicRegulationsColorScale, "min")
})

// ===============================================
// Legend
// ===============================================
function Legend(color, {
    title,
    tickSize = 6,
    width = 320,
    height = 44 + tickSize,
    marginTop = 18,
    marginRight = 0,
    marginBottom = 16 + tickSize,
    marginLeft = 0,
    ticks = width / 64,
    tickFormat,
    tickValues
} = {}) {

    function ramp(color, n = 256) {
        const canvas = document.createElement("canvas");
        canvas.width = n;
        canvas.height = 1;
        const context = canvas.getContext("2d");
        for (let i = 0; i < n; ++i) {
            context.fillStyle = color(i / (n - 1));
            context.fillRect(i, 0, 1, 1);
        }
        return canvas;
    }

    const svgLegend = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("overflow", "visible")
        .style("display", "block");

    let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
    let x;

    // Continuous
    if (color.interpolate) {
        const n = Math.min(color.domain().length, color.range().length);

        x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));

        svgLegend.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
    }

    // Sequential
    else if (color.interpolator) {
        x = Object.assign(color.copy()
            .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
            { range() { return [marginLeft, width - marginRight]; } });

        svgLegend.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.interpolator()).toDataURL());

        // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
        if (!x.ticks) {
            if (tickValues === undefined) {
                const n = Math.round(ticks + 1);
                tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
            }
            if (typeof tickFormat !== "function") {
                tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
            }
        }
    }

    // Threshold
    else if (color.invertExtent) {
        const thresholds
            = color.thresholds ? color.thresholds() // scaleQuantize
                : color.quantiles ? color.quantiles() // scaleQuantile
                    : color.domain(); // scaleThreshold

        const thresholdFormat
            = tickFormat === undefined ? d => d
                : typeof tickFormat === "string" ? d3.format(tickFormat)
                    : tickFormat;

        x = d3.scaleLinear()
            .domain([-1, color.range().length - 1])
            .rangeRound([marginLeft, width - marginRight]);

        svgLegend.append("g")
            .selectAll("rect")
            .data(color.range())
            .join("rect")
            .attr("x", (d, i) => x(i - 1))
            .attr("y", marginTop)
            .attr("width", (d, i) => x(i) - x(i - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", d => d);

        tickValues = d3.range(thresholds.length);
        tickFormat = i => thresholdFormat(thresholds[i], i);
    }

    // Ordinal
    else {
        x = d3.scaleBand()
            .domain(color.domain())
            .rangeRound([marginLeft, width - marginRight]);

        svgLegend.append("g")
            .selectAll("rect")
            .data(color.domain())
            .join("rect")
            .attr("x", x)
            .attr("y", marginTop)
            .attr("width", Math.max(0, x.bandwidth() - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", color);

        tickAdjust = () => { };
    }

    svgLegend.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x)
            .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
            .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
            .tickSize(tickSize)
            .tickValues(tickValues))
        .call(tickAdjust)
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", marginLeft)
            .attr("y", marginTop + marginBottom - height - 6)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .attr("class", "title")
            .text(title));

    return svgLegend.node();
}

// ==========================================
// Histogram
// ==========================================
function Histogram(data, {
    value = d => d, // convenience alias for x
    domain, // convenience alias for xDomain
    label, // convenience alias for xLabel
    format, // convenience alias for xFormat
    type = d3.scaleLinear, // convenience alias for xType
    x = value, // given d in data, returns the (quantitative) x-value
    y = () => 1, // given d in data, returns the (quantitative) weight
    thresholds = 40, // approximate number of bins to generate, or threshold function
    normalize, // whether to normalize values to a total of 100%
    marginTop = 20, // top margin, in pixels
    marginRight = 30, // right margin, in pixels
    marginBottom = 30, // bottom margin, in pixels
    marginLeft = 40, // left margin, in pixels
    width = 640, // outer width of chart, in pixels
    height = 400, // outer height of chart, in pixels
    insetLeft = 0.5, // inset left edge of bar
    insetRight = 0.5, // inset right edge of bar
    xType = type, // type of x-scale
    xDomain = domain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight], // [left, right]
    xLabel = label, // a label for the x-axis
    xFormat = format, // a format specifier string for the x-axis
    yType = d3.scaleLinear, // type of y-scale
    yDomain, // [ymin, ymax]
    yRange = [height - marginBottom, marginTop], // [bottom, top]
    yLabel = "↑ Frequency", // a label for the y-axis
    yFormat = normalize ? "%" : undefined, // a format specifier string for the y-axis
    color = "currentColor", // bar fill color
    svgId = "#histogramChartSvg"
} = {}) {
    // Compute values.
    const X = d3.map(data, x);
    const Y0 = d3.map(data, y);
    const I = d3.range(X.length);

    // Compute bins.
    const bins = d3.bin().thresholds(thresholds).value(i => X[i])(I);
    const Y = Array.from(bins, I => d3.sum(I, i => Y0[i]));
    if (normalize) {
        const total = d3.sum(Y);
        for (let i = 0; i < Y.length; ++i) Y[i] /= total;
    }

    // Compute default domains.
    if (xDomain === undefined) xDomain = [bins[0].x0, bins[bins.length - 1].x1];
    if (yDomain === undefined) yDomain = [0, d3.max(Y)];

    // Construct scales and axes.
    const xScale = xType(xDomain, xRange);
    const yScale = yType(yDomain, yRange);
    const xAxis = d3.axisBottom(xScale).ticks(width / 80, xFormat).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);
    yFormat = yScale.tickFormat(100, yFormat);
    d3.select(svgId).selectAll("svg").remove();
    const svg = d3.select(svgId)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(yLabel));

    svg.append("g")
        .attr("fill", color)
        .selectAll("rect")
        .data(bins)
        .join("rect")
        .attr("x", d => xScale(d.x0) + insetLeft)
        .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - insetLeft - insetRight))
        .attr("y", (d, i) => yScale(Y[i]))
        .attr("height", (d, i) => yScale(0) - yScale(Y[i]))
        .append("title")
        .text((d, i) => [`${d.x0} ≤ x < ${d.x1}`, yFormat(Y[i])].join("\n"));

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis)
        .call(g => g.append("text")
            .attr("x", width - marginRight)
            .attr("y", 27)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text(xLabel));
}


// ==========================================
// Bar chart
// ==========================================
function BarChart(data, {
    x = (d, i) => i, // given d in data, returns the (ordinal) x-value
    y = d => d, // given d in data, returns the (quantitative) y-value
    title, // given d in data, returns the title text
    marginTop = 20, // the top margin, in pixels
    marginRight = 0, // the right margin, in pixels
    marginBottom = 30, // the bottom margin, in pixels
    marginLeft = 40, // the left margin, in pixels
    width = 640, // the outer width of the chart, in pixels
    height = 400, // the outer height of the chart, in pixels
    xDomain, // an array of (ordinal) x-values
    xRange = [marginLeft, width - marginRight], // [left, right]
    yType = d3.scaleLinear, // y-scale type
    yDomain, // [ymin, ymax]
    yRange = [height - marginBottom, marginTop], // [bottom, top]
    xPadding = 0.1, // amount of x-range to reserve to separate bars
    yFormat, // a format specifier string for the y-axis
    yLabel, // a label for the y-axis
    color = "currentColor", // bar fill color
    svgId = "#barChartSvg",
} = {}) {
    // Compute values.
    const X = d3.map(data, x);
    const Y = d3.map(data, y);

    // Compute default domains, and unique the x-domain.
    if (xDomain === undefined) xDomain = X;
    if (yDomain === undefined) yDomain = [0, d3.max(Y)];
    xDomain = new d3.InternSet(xDomain);

    // Omit any data not present in the x-domain.
    const I = d3.range(X.length).filter(i => xDomain.has(X[i]));

    // Construct scales, axes, and formats.
    const xScale = d3.scaleBand(xDomain, xRange).padding(xPadding);
    const yScale = yType(yDomain, yRange);
    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);

    // Compute titles.
    if (title === undefined) {
        const formatValue = yScale.tickFormat(100, yFormat);
        title = i => `${X[i]}\n${formatValue(Y[i])}`;
    } else {
        const O = d3.map(data, d => d);
        const T = title;
        title = i => T(O[i], i, data);
    }

    d3.select(svgId).selectAll("svg").remove();
    const svg = d3.select(svgId)
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width - marginLeft - marginRight)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", -marginLeft)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(yLabel));

    const bar = svg.append("g")
        .attr("fill", color)
        .selectAll("rect")
        .data(I)
        .join("rect")
        .attr("x", i => xScale(X[i]))
        .attr("y", i => yScale(Y[i]))
        .attr("height", i => yScale(0) - yScale(Y[i]))
        .attr("width", xScale.bandwidth());

    if (title) bar.append("title")
        .text(title);

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(xAxis);

    return svg.node();
}