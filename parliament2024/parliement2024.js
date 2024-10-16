const mainSvg = document.getElementById("mainSvg");
const imageSvg = document.getElementById("imageSvg");
const dialog = document.getElementById("dialog");
const width = mainSvg.clientWidth;
const height = mainSvg.clientHeight;
const innerRadiusCoef = 0.4;
const outerParliamentRadius = Math.min(width / 2, height / 2);
const innerParliementRadius = outerParliamentRadius * innerRadiusCoef;
const tooltip = d3.select("#tooltip").attr("class", "tooltip");
tooltip.style("top", 100 + "px").style("left", width + "px");

const numCols = imageSvg.clientWidth * 0.015;
const rectSize = 30;
const padding = rectSize + 10;
let selectedValue = "";
const svg = d3.select("#mainSvg")
    .append("svg")
    .attr("height", mainSvg.clientHeight)
    .attr("width", mainSvg.clientWidth)

const imageContainerSvg = d3.select("#imageSvg")
    .append("svg")
    .attr("height", imageSvg.clientHeight)
    .attr("width", imageSvg.clientWidth)

const imageContainerG = imageContainerSvg
    .append("g")
    .attr("transform", "translate(0,0)");

const memberG = svg.append("g")
    .attr("id", "memberList")
    .attr("transform", `translate(100,${(height / 2) + 200})`);

const parliamentArcG = svg.append("g")
    .attr("id", "parliamentArcG")
    .attr("transform", `translate(0, 0)`);

/* animations */
const enter = {
    "smallToBig": true,
    "fromCenter": true,
};

let nSeats = 0;
const apis = [
    d3.json('./data/parliement2024.json'),
    d3.csv('./data/parlimentMemberList2024.csv'),
    d3.csv('./data/candidates_with_phase.csv'),
    d3.csv('./data/results_2024_winners.csv'),
    d3.csv('./data/results_2024.csv')
];

Promise.all(apis).then(([parliamentData, parliamentMemberData, candidateList, winnerCandidates, allCandidateList]) => {
    let listData = parliamentMemberData.filter((d) => !candidateList.find((dd) => dd['Candidate Name'].toLowerCase().trim() === d['Name'].toLowerCase().trim()));

    console.log(listData);

    function d3Parliament() {
        function parliament(data) {
            data.each(function (d) {
                // Count total no of seats
                d.forEach(function (p) {
                    nSeats += Math.floor(p.count);
                });

                let nRows = 0;
                let maxSeatNumber = 0;
                let b = 0.5;
                let a = innerRadiusCoef / (1 - innerRadiusCoef);
                while (maxSeatNumber < nSeats) {
                    nRows++;
                    b += a;
                    /* NOTE: the number of seats available in each row depends on the total number
                    of rows and floor() is needed because a row can only contain entire seats. So,
                    it is not possible to increment the total number of seats adding a row. */
                    maxSeatNumber = series(function (i) { return Math.floor(Math.PI * (b + i)); }, nRows - 1);
                }

                /***
                 * create the seats list */
                /* compute the cartesian and polar coordinates for each seat */
                let rowWidth = (outerParliamentRadius - innerParliementRadius) / nRows;
                let seats = [];

                let seatsToRemove = maxSeatNumber - nSeats;
                for (let i = 0; i < nRows; i++) {
                    let rowRadius = innerParliementRadius + rowWidth * (i + 0.5);
                    let rowSeats = Math.floor(Math.PI * (b + i)) - Math.floor(seatsToRemove / nRows) - (seatsToRemove % nRows > i ? 1 : 0);
                    let anglePerSeat = Math.PI / rowSeats;
                    for (let j = 0; j < rowSeats; j++) {
                        let s = {};
                        s.polar = {
                            r: rowRadius,
                            teta: -Math.PI + anglePerSeat * (j + 0.5)
                        };
                        s.cartesian = {
                            x: s.polar.r * Math.cos(s.polar.teta),
                            y: s.polar.r * Math.sin(s.polar.teta)
                        };
                        seats.push(s);
                    }
                };

                /* sort the seats by angle */
                seats.sort(function (a, b) {
                    return a.polar.teta - b.polar.teta || b.polar.r - a.polar.r;
                });

                /* fill the seat objects with data of its party and of itself if existing */
                let partyIndex = 0;
                let seatIndex = 0;
                seats.forEach(function (s) {
                    /* get current party and go to the next one if it has all its seats filled */
                    let party = d[partyIndex];
                    let nSeatsInParty = party.count;
                    if (seatIndex >= nSeatsInParty) {
                        partyIndex++;
                        seatIndex = 0;
                        party = d[partyIndex];
                    }

                    /* set party data */
                    s.party = party;
                    s.data = party.count[seatIndex];
                    seatIndex++;
                });


                /***
                 * helpers to get value from seat data */
                let seatClasses = function (d) {
                    let c = "count";
                    c += (d.party && d.party.id) || "";
                    return c.trim();
                };
                let seatX = function (d) { return d.cartesian.x; };
                let seatY = function (d) { return d.cartesian.y; };
                let seatRadius = function (d) {
                    let r = 0.4 * rowWidth;
                    if (d.data && typeof d.data.size === 'number') {
                        r *= d.data.size;
                    }
                    return r;
                };

                /***
                 * fill svg with seats as circles */
                /* container of the parliament */
                let container = parliamentArcG.select(".parliament");
                if (container.empty()) {
                    container = parliamentArcG.append("g");
                    container.classed("parliament", true);
                }
                container.attr("transform", "translate(" + width / 2 + "," + outerParliamentRadius + ")");

                /* all the seats as circles */

                const circleG = container.selectAll("circleContainer")
                    .data(parliamentData)
                    .enter()
                    .append("g")
                    .attr("id", (d) => d.title);

                let circles = circleG.selectAll("seat").data((d) => seats.filter((s) => s.party.title === d.title));
                circles.attr("class", seatClasses);

                /* animation adding seats to the parliament */
                let circlesEnter = circles.enter().append("circle");
                circlesEnter.attr("class", seatClasses);
                circlesEnter.attr("cx", enter.fromCenter ? 0 : seatX);
                circlesEnter.attr("cy", enter.fromCenter ? 0 : seatY);
                circlesEnter.attr("r", enter.smallToBig ? 0 : seatRadius);
                if (enter.fromCenter || enter.smallToBig) {
                    let t = circlesEnter.transition().duration(function () { return 1000 + Math.random() * 800; });
                    if (enter.fromCenter) {
                        t.attr("cx", seatX);
                        t.attr("cy", seatY);
                    }
                    if (enter.smallToBig) {
                        t.attr("r", seatRadius);
                    }
                }

                circleG
                    .on("click", function (event, data) {
                        if (selectedValue !== data.title) {
                            selectedValue = data.title;
                            partyLable.text(data.title).style("fill", data.color);
                            seatLable.text(data.count).style("fill", data.color);
                            circleG.transition().style("opacity", (d) => d.title === data.title ? 1 : 0.2);

                            d3.selectAll(".legend-text").style("opacity", (d) => d.title === data.title ? 1 : 0.2);
                            d3.selectAll(".legend-circle").style("opacity", (d) => d.title === data.title ? 1 : 0.2);


                            let winnerCandidateData = [];
                            parliamentMemberData.forEach((p) => {
                                const result = candidateList.find((c) => c['Candidate Name'].toLowerCase().trim() === p['Name'].toLowerCase().trim() && c['Party'].toLowerCase().trim() === data.partyName.toLowerCase().trim());
                                if (result) winnerCandidateData.push(result);
                            })

                            imageContainerG.selectAll("defs").remove();
                            imageContainerG.selectAll("rect").remove();

                            const circlesPerRow = Math.floor(imageSvg.clientWidth / (rectSize * 2.1));
                            const rows = Math.ceil(winnerCandidateData.length / circlesPerRow);

                            imageContainerSvg.attr("height", rows * (rectSize * 2) + padding);
                            d3.select("#imageSvg").style("height", rows * (rectSize * 2) + padding);

                            for (let i = 0; i < winnerCandidateData.length; i++) {
                                const row = Math.floor(i / circlesPerRow);
                                const col = i % circlesPerRow;
                                imageContainerG
                                    .append("defs")
                                    .append("pattern")
                                    .attr("id", () => `candidate${i}`)
                                    .attr("x", "0%")
                                    .attr("y", "0%")
                                    .attr("height", "100%")
                                    .attr("width", "100%")
                                    .append("image")
                                    .attr("xlink:href", () => winnerCandidateData[i]["Photo Link"])
                                    .attr("x", "0%")
                                    .attr("y", "0.2%")
                                    .attr("height", rectSize * 2)
                                    .attr("width", rectSize * 2)
                                    .attr("preserveAspectRatio", "xMidYMid slice");


                                imageContainerG
                                    .append("circle")
                                    .attr("r", rectSize)
                                    .attr("cx", col * (rectSize * 2) + rectSize + padding)
                                    .attr("cy", row * (rectSize * 2) + rectSize + padding)
                                    .attr("fill", () => `url(#candidate${i})`)
                                    .on("mouseover", function (event) {
                                        d3.select(this)
                                            .transition()
                                            .style("opacity", 0.5)
                                            .style("stroke", "black")
                                            .style("stroke-width", 5)

                                        imageContainerG.append("title").text(winnerCandidateData[i]["Candidate Name"]);

                                    }).on("mouseout", function (event, d) {
                                        d3.select(this)
                                            .transition()
                                            .style("opacity", 1)
                                            .style("stroke", "none")
                                            .style("stroke-width", 0)

                                        imageContainerG.selectAll("title").remove();
                                    }).on("click", function (event) {
                                        showDialog(winnerCandidateData[i], allCandidateList);
                                    })
                            }

                        } else {
                            selectedValue = "";
                            partyLable.text("seats").style("fill", "black");
                            seatLable.text(nSeats).style("fill", "black");
                            circleG.style("opacity", 1);

                            d3.selectAll(".legend-text").style("opacity", 1);
                            d3.selectAll(".legend-circle").style("opacity", 1);

                            imageContainerG.selectAll("defs").remove();
                            imageContainerG.selectAll("rect").remove();
                        }
                    });
            });
        }
        return parliament
    };

    const parliament = d3Parliament();

    svg.datum(parliamentData)
        .call(parliament)
        .selectAll('circle')
        .attr('fill', d => d.party.color);

    const seatNumberLable = parliamentArcG.append("g").attr("id", "seatNumberLable");
    seatNumberLable.attr("transform", "translate(" + width / 2 + "," + outerParliamentRadius + ")");
    const partyLable = seatNumberLable
        .append("text")
        .style("text-anchor", "middle")
        .style("font-size", "30px")
        .text("seats");

    const seatLable = seatNumberLable
        .append("text")
        .attr("y", -30)
        .style("text-anchor", "middle")
        .style("font-size", "70px")
        .style("font-weight", "bold")
        .text(nSeats);

    // Legend
    createLegend(parliamentData.slice(0, 10), 10);
    createLegend(parliamentData.slice(10, 20), 25);
    createLegend(parliamentData.slice(20, 30), 40);
    createLegend(parliamentData.slice(30, 40), 55);
    createLegend(parliamentData.slice(40, 50), 70);
})

// util
function series(s, n) { let r = 0; for (let i = 0; i <= n; i++) { r += s(i); } return r; }

function getCorrectTextColor(hex) {
    threshold = 130;
    hRed = hexToR(hex);
    hGreen = hexToG(hex);
    hBlue = hexToB(hex);

    function hexToR(h) { return parseInt((cutHex(h)).substring(0, 2), 16) }
    function hexToG(h) { return parseInt((cutHex(h)).substring(2, 4), 16) }
    function hexToB(h) { return parseInt((cutHex(h)).substring(4, 6), 16) }
    function cutHex(h) { return (h.charAt(0) == "#") ? h.substring(1, 7) : h }

    cBrightness = ((hRed * 299) + (hGreen * 587) + (hBlue * 114)) / 1000;
    if (cBrightness > threshold) { return "#000000"; } else { return "#ffffff"; }
}

// create legend
function createLegend(data, place) {
    const legendContainer = parliamentArcG.append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${(width / 2) - 430},${(outerParliamentRadius + 100 + place)})`);

    const legendContainerList = legendContainer.selectAll("lists")
        .data(data)
        .enter()
        .append("g");

    legendContainerList
        .append("circle")
        .attr("class", "legend-circle")
        .attr("r", 5)
        .attr("cy", -50)
        .attr("cx", (d, i) => i * 90)
        .attr("fill", (d) => d.color);

    legendContainerList
        .append("text")
        .attr("class", "legend-text")
        .attr("y", -47)
        .attr("x", (d, i) => i * 90 + 8)
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .text((d) => d.title);
}

function formatText(text) {
    text = text ? text : "";
    return text.toLowerCase().trim();
}

function showDialog(d, allCandidateList) {

    const listData = allCandidateList.filter((a) => a["PC Name"] === d["Constituency"]);
    listData.sort((a, b) => b["Total Votes"] - a["Total Votes"]);

    // Get the viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate dialog size and position
    const dialogWidth = viewportWidth * 0.5;
    const dialogHeight = viewportHeight * 0.5;
    const dialogX = (viewportWidth - dialogWidth) / 2;
    const dialogY = (viewportHeight - dialogHeight) / 2;

    // Create or select the dialog element
    let dialog = d3.select("#dialog");

    // Style and position the dialog
    dialog.style("width", `${dialogWidth}px`)
        // .style("height", `${dialogHeight}px`)
        .style("left", `${dialogX}px`)
        .style("top", `20px`)
        .style("display", "block")
        .html(`
            <div class="close-button">✖</div>
            <div class="profile">
                <div class="dailogImageContainer">
                    <img class="dailogImage" src="${d['Photo Link']}" height="150px" width="120px"/>
                </div>
                <div style="margin-left:10px">
                    <p><b>Name:</b> ${d["Candidate Name"]}</p>
                    <p><b>Age:</b> ${d["Age"]}</p>
                    <p><b>Gender:</b> ${d["Gender"]}</p>
                    <p><b>Party:</b> ${d["Party"]}</p>
                    <p><b>Constituency:</b> ${d["Constituency"]}</p>
                    <p><b>State:</b> ${d["State"]}</p>
                </div>
            </div>
            <div class="tableContainer">
                <table class="tooltipTable">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Party</th>
                            <th>Total Votes</th>
                            <th>Vote Share</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${listData.map(detail => `
                            <tr>
                                <td>${detail.Candidate}</td>
                                <td>${detail.Party}</td>
                                <td>${parseInt(detail["Total Votes"]).toLocaleString('en-US')}</td>
                                <td>${detail["Vote Share"]}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `);
    dialog.select(".close-button").on("click", hideDialog);
}

function hideDialog() {
    d3.select("#dialog").style("display", "none");
}