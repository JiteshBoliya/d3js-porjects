const chordGraph = document.getElementById("chordGraph");
const yearDropdownContent = document.getElementById('yearDropdown');
const yearDropdownButton = document.getElementById('yearDropdownButton');
const countrydropdownContent = document.getElementById('countryDropdown');
const countryDropdownButton = document.getElementById('countryDropdownButton');

const width = chordGraph.clientWidth;
const height = chordGraph.clientHeight;
const innerRadius = Math.min(width, height) * 0.5 - 100;
const outerRadius = innerRadius + 50;
const numberFormat = new Intl.NumberFormat('en-US');
const colorArray = ["#118dff", "#12239e", "#e66c37", "#6b007b", "#e044a7", "#744ec2"]; // Color range
const targetedCountry = "Canada";
const fontSize = 13; // Font size
const chordPadAngle = 5; // spacing between ribbons

let selectedYear = [];
let selectedCountries = [];
let coreData = null;
let currentData = null;
let sums = {};
let totalStudents = 0;
let flagSelection = null;


// ChordGraph SVG
const svg = d3
    .select("#chordGraph")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "width: 100%; height: auto; font: 10px");

// ChordDirected
const chord = d3.chordDirected()
    .padAngle(chordPadAngle / innerRadius)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending);

// Arc
const arc = d3.arc()
    .innerRadius(innerRadius - 2)
    .outerRadius(outerRadius);

// Ribbon 
const ribbon = d3.ribbon()
    .radius(innerRadius)
    .padAngle(1 / innerRadius);

// Color scale
const colorScale = d3.scaleOrdinal()
    .domain([0, 1, 2, 3, 4, 5])
    .range(colorArray);

// Tooltip
const tooltip = d3
    .select("#tooltip")
    .attr("class", "tooltip");

// Get the data from the csv file
d3.csv('./data/Internation_students_Canada.csv').then((data) => {
    coreData = data;

    // Get the yearList
    let yearData = [];
    const yearDataSet = new Set();

    data.forEach(d => {
        Object.keys(d)
            .filter(f => !isNaN(f))
            .forEach(key => yearDataSet.add(key));
    });
    yearData = Array.from(yearDataSet);
    populateYearDropdown(yearData); // Populate year data in dropdown list
    loadCountryList();  // Load top 5 Country list
    loadGraph(getFilterData()); // Load the graph
});

// Load the country List
function loadCountryList() {
    // Get the all the countries and calculate the sum of all selected years.
    let countryList = [];
    coreData.forEach(row => {
        let total = 0;
        if (selectedYear.length) {
            selectedYear.forEach(year => {
                total += +row[year];
            });
        }
        else {
            total = 0;
        }
        countryList.push({ "country": row['Country of Citizenship'], "total": total });
    });

    // Sort and get the top 5 countries
    const countries = [];
    countryList.sort((a, b) => b.total - a.total).slice(0, 5).forEach((dd) => {
        countries.push(dd.country);
    })

    populateCountryDropdown(countries); // Populate the country dropdown this top 5 countries.
}

// Filter the data
function getFilterData() {
    // sum of students of each country in selected year
    coreData.forEach(row => {
        const source = row['Country of Citizenship'];
        sums[source] = 0;
        if (selectedYear.length) {
            selectedYear.forEach(year => {
                sums[source] += +row[year];
            });
        }
        else {
            sums[source] = 0;
        }
    });

    // Create JSON output
    let output = Object.keys(sums).map(source => ({
        source: source,
        target: targetedCountry,
        value: sums[source]
    }));

    totalStudents = 0;
    // Get the selected country data 
    output = output.filter((o) => selectedCountries.find((d) => d.title === o.source));
    // Sort data
    output.sort((a, b) => b.value - a.value);
    // Get to 5 data
    output = output.slice(0, 5);
    // Get total students 
    output.forEach((d) => {
        totalStudents += d.value;
    })
    return output;
}

// load the graph
function loadGraph(data) {
    // Clear the old g containers
    svg.selectAll('g').remove();
    // Sort the data
    currentData = data;
    currentData.sort((a, b) => a.value - b.value);
    // Compute a dense matrix from the weighted links in data.
    const names = Array.from(d3.union(data.flatMap(d => [d.target, d.source])));
    const index = new Map(names.map((name, i) => [name, i]));
    const matrix = Array.from(index, () => new Array(names.length).fill(0));
    for (const { source, target, value } of data) matrix[index.get(source)][index.get(target)] += value;
    const chords = chord(matrix);

    // Main chord container
    svg.append("g")
        .append("path")
        .attr("id", "chord")
        .style("fill", "none")
        .attr("d", d3.arc()({ outerRadius, startAngle: 0, endAngle: 2 * Math.PI }));

    // Created sub container based on the country list
    const g = svg
        .append("g")
        .selectAll()
        .data(chords.groups)
        .join("g");

    // Created outer line of the chord graph
    g.append("path")
        .attr("id", d => `p${d.index}`)
        .style("fill", d => colorScale(d.index))
        .style("stroke", "none")
        .style("opacity", (d) => {
            // Condition for hide the country
            const result = selectedCountries.find((s) => s.title === names[d.index]);
            if (!result) return 1;
            else return result.show ? 1 : 0;
        })
        .on("click", (event, d) => {
            // Condition for hide the country event
            const result = selectedCountries.find((s) => s.title === names[d.index]);
            if (!result || result.show) onClick(d);
        })
        .on("mousemove", function (event, d) {
            // Condition for hide the country event
            const result = selectedCountries.find((s) => s.title === names[d.index]);
            if (!result || result.show) {
                // Mouse hover on path
                tooltip
                    .style("display", "block")
                    .style("left", event.pageX + 10 + "px")
                    .style("top", event.pageY + "px");
                // Tooltip for Canada
                if (names[d.index] === targetedCountry) {
                    tooltip.html(`
                            <div class="tooltipBody">
                                <table>
                                    <tr>
                                        <td>Country</td>
                                        <td>${targetedCountry}</td>
                                    </tr>
                                    <tr>
                                        <td>Total students</td>
                                        <td>${numberFormat.format(totalStudents)}</td>
                                    </tr>
                                </table>  
                             </div>`);
                } else {
                    // Tooltip for other countries
                    const tooltipData = currentData.find((c) => c.source === names[d.index]);
                    if (tooltipData) {
                        tooltip.html(
                            `<div class="tooltipBody">
                                    <table>
                                        <tr>
                                            <td>Country of Citizenship</td>
                                            <td>${tooltipData.source}</td>
                                        </tr>
                                        <tr>
                                            <td>Destination</td>
                                            <td>${tooltipData.target}</td>
                                        </tr>
                                        <tr>
                                            <td>No of students</td>
                                            <td>${numberFormat.format(tooltipData.value)}</td>
                                        </tr>
                                    </table>  
                                </div >`
                        )
                    }
                }
            }

        })
        .on("mouseout", function (event, d) {
            tooltip.style("display", "none");
        })
        .transition()
        .duration(1000)
        .attr("d", arc);

    // Added text on the arc
    g.append("text")
        .attr("dy", -30)
        .attr("x", d => arc.centroid(d)[0])
        .attr("y", d => arc.centroid(d)[1])
        .attr("transform", d => `rotate(${(arc.endAngle()(d) + arc.startAngle()(d)) * 90 / Math.PI}, ${arc.centroid(d)})`)
        .style("text-anchor", "middle")
        .style("alignment-baseline", "middle")
        .style("font-size", fontSize)
        .style("opacity", (d) => {
            // Condition for hide the country title
            const result = selectedCountries.find((s) => s.title === names[d.index]);
            if (!result) return 1;
            else return result.show ? 1 : 0;
        })
        .text(d => {
            if (d.value) return formatText(names[d.index]);
        });

    // Added ribbon
    svg.append("g")
        .selectAll()
        .data(chords)
        .join("path")
        .attr("id", d => `ps${d.source.index}`)
        .attr("class", "ribbin")
        .style("fill", d => colorScale(d.source.index))
        .style("opacity", (d) => {
            // Condition for hide the country
            const result = selectedCountries.find((s) => s.title === names[d.source.index]);
            return result.show ? 0.5 : 0;
        })
        .on("click", (event, d) => {
            // Condition for hide the country event
            const result = selectedCountries.find((s) => s.title === names[d.source.index]);
            if (result.show) onClick(d.source);
        })
        .on("mousemove", function (event, d) {
            // Condition for hide the country event
            const result = selectedCountries.find((s) => s.title === names[d.source.index]);
            if (result.show) {
                // Mouse hover on ribbon
                const tooltipData = currentData.find((c) => c.source === names[d.source.index]);
                if (tooltipData) {
                    // Tooltip for all countries(Canada not included)
                    tooltip
                        .style("display", "block")
                        .html(
                            ` <div class="tooltipBody" >
                            <table>
                                <tr>
                                    <td>Country of Citizenship</td>
                                    <td>${tooltipData.source}</td>
                                </tr>
                                <tr>
                                    <td>Destination</td>
                                    <td>${tooltipData.target}</td>
                                </tr>
                                <tr>
                                    <td>No of students</td>
                                    <td>${numberFormat.format(tooltipData.value)}</td>
                                </tr>
                            </table>  
                        </div > `
                        )
                        .style("left", event.pageX + 10 + "px")
                        .style("top", event.pageY + "px");
                }
            }
        })
        .on("mouseout", function (event, d) {
            tooltip.style("display", "none");
        })
        .transition()
        .duration(1000)
        .attr("d", ribbon);

    // Click event for both ribbon and outer line
    function onClick(d) {
        if (d.source) d = d.source;
        // This logic for highlight the ribbon.
        if (flagSelection !== d.index) {
            flagSelection = d.index;
            svg.selectAll("path.ribbin")
                .transition()
                .attr("d", ribbon)
                .style("opacity", (d) => {
                    if (d.source) d = d.source;
                    const result = selectedCountries.find((s) => s.title === names[d.index]);
                    return result.show ? 0.3 : 0;
                })
                .style("stroke", "none");

            ribbon.radius(innerRadius + 50);
            svg.select(`#ps${d.index} `)
                .transition()
                .attr("d", ribbon)
                .style("mix-blend-mode", "normal")
                .style("opacity", (d) => {
                    if (d.source) d = d.source;
                    const result = selectedCountries.find((s) => s.title === names[d.index]);
                    return result.show ? 0.75 : 0;
                })
                .style("stroke", "black");

            ribbon.radius(innerRadius);
        } else {
            flagSelection = null;
            svg.selectAll("path.ribbin")
                .transition()
                .attr("d", ribbon)
                .style("opacity", (d) => {
                    if (d.source) d = d.source;
                    const result = selectedCountries.find((s) => s.title === names[d.index]);
                    return result.show ? 0.5 : 0
                })
                .style("stroke", "none");
        }
    }
}

// Format the country name text
function formatText(str) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
        if (str[i] === ',' || result.length === 10) {
            break;
        }
        result += str[i];
    }
    return result;
}

// Show the dropdowm of year
function populateYearDropdown(yearData) {
    selectedYear = yearData;
    const dropdownContent = document.getElementById('yearDropdown');
    dropdownContent.innerHTML = ''; // Clear existing options

    yearData.forEach(function (option) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = option;
        checkbox.checked = true;
        checkbox.id = option;
        const label = document.createElement('label');
        label.htmlFor = option;
        label.appendChild(document.createTextNode(option));

        const listItem = document.createElement('li');
        listItem.appendChild(checkbox);
        listItem.appendChild(label);

        checkbox.parentElement.addEventListener('click', function (event) {
            event.stopPropagation();
            selectedYear = [];
            checkbox.checked = !checkbox.checked;
            const checkboxes = document.querySelectorAll(`#yearDropdown input[type = "checkbox"]`);
            checkboxes.forEach(function (checkbox) {
                if (checkbox.checked) selectedYear.push(checkbox.value);
            });
            if (coreData) {
                loadCountryList();
                loadGraph(getFilterData())
            };
        });
        dropdownContent.appendChild(listItem);
    });
}

// Show the dropdowm of country
function populateCountryDropdown(countryData) {
    const dropdownContent = document.getElementById('countryDropdown');
    dropdownContent.innerHTML = ''; // Clear existing options
    countryData.forEach(function (option) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = option;
        checkbox.checked = true;
        checkbox.id = option;
        const label = document.createElement('label');
        label.htmlFor = option;
        label.appendChild(document.createTextNode(option));
        const listItem = document.createElement('li');
        listItem.appendChild(checkbox);
        listItem.appendChild(label);

        checkbox.parentElement.addEventListener('click', function (event) {
            event.stopPropagation();
            selectedCountries = [];
            checkbox.checked = !checkbox.checked;
            const checkboxes = document.querySelectorAll(`#countryDropdown input[type = "checkbox"]`);
            checkboxes.forEach(function (checkbox) {
                selectedCountries.push({ "title": checkbox.value, "show": checkbox.checked });
            });
            if (coreData) loadGraph(getFilterData());
        });
        dropdownContent.appendChild(listItem);
        selectedCountries = [];
        const checkboxes = document.querySelectorAll(`#countryDropdown input[type = "checkbox"]`);
        checkboxes.forEach(function (checkbox) {
            selectedCountries.push({ "title": checkbox.value, "show": checkbox.checked });
        });
    });
}

// Hide the dropdown on click on anywhere in page 
document.body.addEventListener('click', function (e) {
    if (e.target !== yearDropdownButton || e.target === countryDropdownButton) yearDropdownContent.style.display = 'none';
    if (e.target === yearDropdownButton || e.target !== countryDropdownButton) countrydropdownContent.style.display = 'none';
});

// Toggle the dropdown visibility
function toggleDropdown(value) {
    const selection = value === 'year' ? yearDropdownContent : countrydropdownContent;
    if (selection.style.display === 'block') {
        selection.style.display = 'none';
    } else {
        selection.style.display = 'block';
    }

}