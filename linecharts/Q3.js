const margin = { top: 20, right: 50, bottom: 30, left: 30 };
const width = window.innerWidth - margin.left - margin.right - 15; //15 for vartical scroll bar
const height = 400 - margin.top - margin.bottom;

const columns = [];

const xAxisLable = "Month";
const yAxisLable = "Num of Ratings";

const rankLines = ['Catan', 'Codenames', 'Terraforming Mars', 'Gloomhaven'];

const legendCircleText = "Rank";
const legendCircleRadius = 15;
const legendtitle = "BoardGameGeek Rank";

const rankCircleRadius = 9;
const lineLableLeftSpacing = 5;

const formatter = d3.timeFormat("%b %d"); // Date formatter

const api = "./data/boardgame_ratings.csv";

const username = document.getElementById("signature");

d3.csv(api).then((data) => {
    // Fetch the column names from csv data
    columns.push(...data["columns"]);

    // Fetching count and rank columns from the all the column list
    const countColumns = columns.filter((c) => c.includes("count"));
    const rankColumns = columns.filter((c) => c.includes("rank"));

    // Color scale
    const color = d3.scaleOrdinal().domain(countColumns).range(d3.schemeCategory10);

    // Updating data according to the chart
    const chartData = data.map((d) => {
        d.date = new Date(d.date);  // Change string to date
        countColumns.forEach((columns) => d[columns] = +d[columns]); // Change string to number
        rankColumns.forEach((columns) => d[columns] = +d[columns]);
        return d;
    })

    // Calculate max count of all columns
    let maxCount = 0;
    countColumns.forEach((columns) => {
        const result = d3.max(chartData, (d) => d[columns]);
        if (maxCount < result) maxCount = result;
    });

    // Time scale
    const xDomain = d3.extent(chartData, (d) => d.date);
    const xRange = [margin.left, width - margin.right];
    const x = d3.scaleTime().domain(xDomain).range(xRange);

    // Linear scale
    const yDomain = [maxCount, 0];
    const yRange = [margin.top, height - margin.bottom];
    const y = d3.scaleLinear().domain(yDomain).range(yRange);

    // Squar root scale
    const sqrtY = d3.scaleSqrt().domain(yDomain).range(yRange);

    // Log scale
    const logY = d3.scaleLog().domain([maxCount, 10]).range(yRange);

    // Comparing Dates for show circles on ticks
    function compareDates(x, d) {
        return x.ticks().find((t) =>
        (new Date(t).getFullYear() === new Date(d.date).getFullYear()
            && new Date(t).getMonth() === new Date(d.date).getMonth()));
    }

    // Validating and filtering point plot data
    const pointPlotData = chartData.map((d) => compareDates(x, d) ? d : null).filter((d) => d != undefined);

    // Charts
    chartA(countColumns, chartData, color, x, y);
    chartB(countColumns, rankColumns, chartData, color, x, y, pointPlotData);
    chartC1(countColumns, rankColumns, chartData, color, x, sqrtY, pointPlotData);
    chartC2(countColumns, rankColumns, chartData, color, x, logY, pointPlotData);
})

function chartA(countColumns, chartData, color, x, y) {
    const ChartTitleA = "Number of Ratings 2016-2020";

    const svgA = d3.select("#lineCharts")
        .append("svg")
        .attr("id", "svg-a")
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const titleA = svgA
        .append("text")
        .attr("id", "title-a")
        .text(ChartTitleA)
        .attr("text-anchor", "middle")
        .attr("class", "chartTitle")
        .attr("transform", `translate(${width / 2},${margin.top})`);

    const plotA = svgA
        .append("g")
        .attr("id", "plot-a")
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const lineA = plotA.append("g").attr("id", "lines-a");

    // Creating all count lines
    countColumns.forEach((columns) => {
        let lineLablePosition = 0; // Get the line lable position

        const line = d3.line()
            .x((d) => x(d.date))
            .y((d) => lineLablePosition = y(d[columns]));

        const lines = lineA
            .append("path")
            .attr("class", "lines")
            .attr("d", line(chartData))
            .style("stroke", color(columns));

        const lineLable = lineA
            .append("text")
            .text(columns.replace("=count", ''))
            .attr("text-anchor", "start")
            .attr("class", "lineLable")
            .style("fill", color(columns))
            .attr("transform", `translate(${(width - margin.right) + lineLableLeftSpacing},${lineLablePosition})`);
    })

    // Axis
    const xAxisA = plotA
        .append("g")
        .attr("id", "x-axis-a")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(formatter));

    xAxisA
        .append("text")
        .text(xAxisLable)
        .attr("class", "axisLable")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${width / 2},${margin.bottom})`);

    const yAxisA = plotA
        .append("g")
        .attr("id", "y-axis-a")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    yAxisA
        .append("text")
        .text(yAxisLable)
        .attr("class", "axisLable")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${-margin.right},${height / 2}) rotate(-90)`);
}

function chartB(countColumns, rankColumns, chartData, color, x, y, pointPlotData) {
    const ChartTitleB = "Number of Ratings 2016-2020 with Rankings";

    const svgB = d3.select("#lineCharts")
        .append("svg")
        .attr("id", "svg-b")
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)

    const titleB = svgB
        .append("text")
        .attr("id", "title-b")
        .text(ChartTitleB)
        .attr("text-anchor", "middle")
        .attr("class", "chartTitle")
        .attr("transform", `translate(${width / 2},${margin.top})`);

    const plotB = svgB
        .append("g")
        .attr("id", "plot-b")
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const lineB = plotB.append("g").attr("id", "lines-b");

    // Creating all count lines
    countColumns.forEach((columns) => {
        let lineLablePosition = 0; // Get the line lable position

        const line = d3.line()
            .x((d) => x(d.date))
            .y((d) => lineLablePosition = y(d[columns]));

        const lines = lineB
            .append("path")
            .attr("class", "lines")
            .attr("d", line(chartData))
            .style("stroke", color(columns));

        const lineLable = lineB
            .append("text")
            .text(columns.replace("=count", ''))
            .attr("class", "lineLable")
            .attr("text-anchor", "start")
            .style("fill", color(columns))
            .attr("transform", `translate(${(width - margin.right) + lineLableLeftSpacing},${lineLablePosition})`);
    })

    // Legend
    const legendB = svgB
        .append("g")
        .attr("id", "legend-b")
        .attr("transform", `translate(${width + margin.left},${height - margin.bottom})`);

    // Legend circle
    legendB
        .append("circle")
        .attr("r", legendCircleRadius);

    createLegend(legendB);


    // Axis
    const xAxisB = plotB
        .append("g")
        .attr("id", "x-axis-b")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(formatter));

    xAxisB
        .append("text")
        .text(xAxisLable)
        .attr("class", "axisLable")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${width / 2},${margin.bottom})`);

    const yAxisB = plotB
        .append("g")
        .attr("id", "y-axis-b")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    yAxisB
        .append("text")
        .text(yAxisLable)
        .attr("class", "axisLable")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${-margin.right},${height / 2}) rotate(-90)`);

    // Shwoing Ranks
    countColumns.forEach((columns) => {
        const showRank = rankLines.includes(columns.replace("=count", ''));
        if (showRank) {
            const circles = lineB
                .selectAll("circles")
                .data(pointPlotData)
                .enter()
                .append("circle")
                .attr("class", "circles")
                .attr("r", rankCircleRadius)
                .style("fill", color(columns))
                .attr("cx", (d) => x(d.date))
                .attr("cy", (d) => y(d[columns]));

            const circleLables = lineB
                .selectAll("lables")
                .data(pointPlotData)
                .enter()
                .append("text")
                .text((d, i) => d[columns.replace("count", "rank")])
                .attr("text-anchor", "middle")
                .attr("class", "circleLables")
                .attr("x", (d) => x(d.date))
                .attr("y", (d) => y(d[columns]))
                .attr("transform", (d) => `translate(0,2)`);

        }
    })
}

function chartC1(countColumns, rankColumns, chartData, color, x, y, pointPlotData) {
    const ChartTitleC1 = "Number of Ratings 2016-2020 with Rankings(Square root scale)";

    const svgC1 = d3.select("#lineCharts")
        .append("svg")
        .attr("id", "svg-c-1")
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)

    const titleC1 = svgC1
        .append("text")
        .attr("id", "title-c-1")
        .text(ChartTitleC1)
        .attr("text-anchor", "middle")
        .attr("class", "chartTitle")
        .attr("transform", `translate(${width / 2},${margin.top})`);

    const plotC1 = svgC1
        .append("g")
        .attr("id", "plot-c-1")
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const lineC1 = plotC1.append("g").attr("id", "lines-c-1");

    // Creating all count lines
    countColumns.forEach((columns) => {
        let lineLablePosition = 0; // Get the line lable position

        const line = d3.line()
            .x((d) => x(d.date))
            .y((d) => lineLablePosition = y(d[columns]));

        const lines = lineC1
            .append("path")
            .attr("class", "lines")
            .attr("d", line(chartData))
            .style("stroke", color(columns));

        const lineLable = lineC1
            .append("text")
            .text(columns.replace("=count", ''))
            .attr("class", "lineLable")
            .attr("text-anchor", "start")
            .style("fill", color(columns))
            .attr("transform", `translate(${(width - margin.right) + lineLableLeftSpacing},${lineLablePosition})`);
    })


    // Legend
    const legendC1 = svgC1
        .append("g")
        .attr("id", "legend-c-1")
        .attr("transform", `translate(${width + margin.left},${height - margin.bottom})`);

    // Legend circle
    legendC1
        .append("circle")
        .attr("r", legendCircleRadius);

    createLegend(legendC1);


    // Axis
    const xAxisC1 = plotC1
        .append("g")
        .attr("id", "x-axis-c-1")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(formatter));

    xAxisC1
        .append("text")
        .text(xAxisLable)
        .attr("class", "axisLable")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${width / 2},${margin.bottom})`);

    const yAxisC1 = plotC1
        .append("g")
        .attr("id", "y-axis-c-1")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    yAxisC1
        .append("text")
        .text(yAxisLable)
        .attr("class", "axisLable")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${-margin.right},${height / 2}) rotate(-90)`);

    // Shwoing Ranks
    countColumns.forEach((columns) => {
        const showRank = rankLines.includes(columns.replace("=count", ''));
        if (showRank) {
            const circles = lineC1
                .selectAll("circles")
                .data(pointPlotData)
                .enter()
                .append("circle")
                .attr("class", "circles")
                .attr("r", rankCircleRadius)
                .style("fill", color(columns))
                .attr("cx", (d) => x(d.date))
                .attr("cy", (d) => y(d[columns]));

            const circleLables = lineC1
                .selectAll("lables")
                .data(pointPlotData)
                .enter()
                .append("text")
                .text((d, i) => d[columns.replace("count", "rank")])
                .attr("text-anchor", "middle")
                .attr("class", "circleLables")
                .attr("x", (d) => x(d.date))
                .attr("y", (d) => y(d[columns]))
                .attr("transform", (d) => `translate(0,2)`);

        }
    })
}

function chartC2(countColumns, rankColumns, chartData, color, x, y, pointPlotData) {
    const ChartTitleC2 = "Number of Ratings 2016-2020 with Rankings(log scale)";

    const svgC2 = d3.select("#lineCharts")
        .append("svg")
        .attr("id", "svg-c-2")
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)

    const titleC2 = svgC2
        .append("text")
        .attr("id", "title-c-2")
        .text(ChartTitleC2)
        .attr("text-anchor", "middle")
        .attr("class", "chartTitle")
        .attr("transform", `translate(${width / 2},${margin.top})`);

    const plotC2 = svgC2
        .append("g")
        .attr("id", "plot-c-2")
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const lineC2 = plotC2.append("g").attr("id", "lines-c-2");

    // Creating all count lines
    countColumns.forEach((columns) => {
        let lineLablePosition = 0; // Get the line lable position

        const line = d3.line()
            .x((d) => x(d.date))
            .y((d) => lineLablePosition = y(d[columns]));

        const lines = lineC2
            .append("path")
            .attr("class", "lines")
            .attr("d", line(chartData))
            .style("stroke", color(columns));

        const lineLable = lineC2
            .append("text")
            .text(columns.replace("=count", ''))
            .attr("class", "lineLable")
            .attr("text-anchor", "start")
            .style("fill", color(columns))
            .attr("transform", `translate(${(width - margin.right) + lineLableLeftSpacing},${lineLablePosition})`);
    })


    // Legend
    const legendC2 = svgC2
        .append("g")
        .attr("id", "legend-c-2")
        .attr("transform", `translate(${width + margin.left},${height - margin.bottom})`);

    // Legend circle
    legendC2
        .append("circle")
        .attr("r", legendCircleRadius);

    createLegend(legendC2);

    // Axis
    const xAxisC2 = plotC2
        .append("g")
        .attr("id", "x-axis-c-2")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(formatter));

    xAxisC2
        .append("text")
        .text(xAxisLable)
        .attr("class", "axisLable")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${width / 2},${margin.bottom})`);

    const yAxisC2 = plotC2
        .append("g")
        .attr("id", "y-axis-c-2")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    yAxisC2
        .append("text")
        .text(yAxisLable)
        .attr("class", "axisLable")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${-margin.right},${height / 2}) rotate(-90)`);

    // Shwoing Ranks
    countColumns.forEach((columns) => {
        const showRank = rankLines.includes(columns.replace("=count", ''));
        if (showRank) {
            const circles = lineC2
                .selectAll("circles")
                .data(pointPlotData)
                .enter()
                .append("circle")
                .attr("class", "circles")
                .attr("r", rankCircleRadius)
                .style("fill", color(columns))
                .attr("cx", (d) => x(d.date))
                .attr("cy", (d) => y(d[columns]));

            const circleLables = lineC2
                .selectAll("lables")
                .data(pointPlotData)
                .enter()
                .append("text")
                .text((d, i) => d[columns.replace("count", "rank")])
                .attr("text-anchor", "middle")
                .attr("class", "circleLables")
                .attr("x", (d) => x(d.date))
                .attr("y", (d) => y(d[columns]))
                .attr("transform", (d) => `translate(0,2)`);

        }
    })

    username.textContent = "gburdell3";
}

// Create legend of all charts
function createLegend(legend) {
    // Legend circle text 
    legend
        .append("text")
        .text(legendCircleText)
        .attr("text-anchor", "middle")
        .attr("class", "legendCircleText")
        .attr("transform", `translate(0,2)`);

    // Legend title text 
    legend
        .append("text")
        .text(legendtitle)
        .attr("class", "legendtitleText")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(0,25)`);
}