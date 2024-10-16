const width = window.innerWidth / 2;
const height = 400;

const fontDefualtSize = 2;
const maxNodeSize = 10;

const username = "gburdell3";
const colorRange = ["white", "blue", "darkBlue"];

const nodeLableLeftPadding = 2;
const nodeLableFontSize = 7;

const api = "./data/board_games.csv";


d3.csv(api).then((data) => {
    const linkData = data;
    const nodeData = [];

    // Fetching nodeData
    linkData.forEach((d) => {
        // source
        if (!nodeData.length || !nodeData.find((n) => n.name === d.source))
            nodeData.push({ name: d.source, pinned: false });

        // target
        if (!nodeData.find((n) => n.name === d.target))
            nodeData.push({ name: d.target, pinned: false });
    })

    // Calculate node degree
    const nodeDegree = [];
    nodeData.forEach((d) => {
        const result = linkData.filter((l) => l.source === d.name);
        nodeDegree.push(result.length);
    })

    // There should be at least 3 color gradations and it must be visually evident that 
    // the nodes with a higher degree use darker/deeper colors and 
    // the nodes with lower degrees use lighter colors
    const color = d3.scaleLinear()
        .domain([0, d3.max(nodeDegree)])
        .range(colorRange);

    const svg = d3.select("#forceDirectedGraph")
        .append("svg")
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto;");

    // Username Lable
    const usernameLable = svg
        .append("text")
        .text(username)
        .attr("id", "credit")
        .attr("class", "usernameLable")
        .attr("transform", `translate(${width / 2},10)`);

    // If the value of the edge is equal to 0(similar), the edge should be gray, thick, and solid
    // If the value of the edge is equal to 1 (not similar), the edge should be green, thin, and dashed.
    const edge = svg
        .append("g")
        .attr("id", "links")
        .selectAll("path")
        .data(linkData)
        .join("path")
        .attr("class", (d) => (+d.value) ? "normalLink" : "dashedLink");

    // You may need to increase the radius of the highly-weighted nodes and reduce their label sizes
    const nodes = svg
        .append("g")
        .attr("id", "nodes")
        .selectAll("nodes")
        .data(nodeData)
        .join("circle")
        .attr("r", (d, i) => checkedNodeSize(i))
        .attr("class", "nodes")
        .style("fill", (d, i) => d.pinned ? "yellow" : color(nodeDegree[i]))
        .call(d3.drag()
            .on("start", dragStarted)
            .on("drag", dragged)
            .on("end", dragEnded))
        .on("dblclick", pinUnpin);

    const lables = svg
        .append("g")
        .attr("id", "lables")
        .selectAll("lables")
        .data(nodeData)
        .join("text")
        .text((d) => d.name)
        .attr("class", "nodeLable")
        .style("font-size", (d, i) => nodeLableFontSize - (checkedNodeSize(i) / 10));

    // Simulation
    const simulation = d3.forceSimulation(nodeData)
        .force("links", d3.forceLink(linkData).id(d => d.name))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter())
        .on("tick", ticked);

    // Creating curve links between nodes
    function ticked() {
        edge
            .attr("d", (d) => {
                const dx = d.target.x - d.source.x;
                const dy = d.target.y - d.source.y;
                const dr = Math.sqrt(dx * dx + dy * dy); // Use for create curve link
                return `M ${d.source.x}, ${d.source.y} A ${dr} ${dr} 0 0, 1 ${d.target.x}, ${d.target.y}`;
            });

        nodes
            .attr("transform", (d) => `translate(${d.x},${d.y})`);

        lables
            .attr("transform", (d, i) => `translate(${d.x + nodeLableLeftPadding},${d.y - checkedNodeSize(i)})`);
    }

    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0).restart();
        if (!d.pinned) {
            d.fx = null;
            d.fy = null;
        }
    }

    // Pin or unpin the node position
    // pinned nodes can be further dragged around by the user. 
    // pinning a node should not affect the free movement of the other nodes.
    // Double clicking a pinned node should unpin (unfreeze) its position and unmark it.
    function pinUnpin(event, d) {
        d.pinned = !d.pinned;
        d3.select(this).style("fill", (d, i) => d.pinned ? "yellow" : color(nodeDegree[i]));
        if (d.pinned) {
            d.fx = d.x;
            d.fy = d.y;
        } else {
            d.fx = null;
            d.fy = null;
        }
    }

    // Scale the radius of each node in the graph based on the degree of the node
    function checkedNodeSize(i) {
        if (nodeDegree[i]) { // Checking min limit of node size
            return (nodeDegree[i] <= maxNodeSize) ? nodeDegree[i] + fontDefualtSize : maxNodeSize; // Checking max limit of node size
        } else {
            return fontDefualtSize;
        }
    }
})