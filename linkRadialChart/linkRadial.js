const zoompan = true;
const size = 12;
const bullet = 2;
const PNGprecision = 3;

// leaf offset
const off = 80;
const offDNMN = 32;

// font size
const sizeDepth0 = 28;
const sizeDepth1 = 21;
const sizeDepth2 = 16;
const sizeHeight0 = 8.5;
const sizeHeight1 = 12;

// bullet size
const bulletDepth0 = 2.5;
const bulletDepth1 = 2;
const bulletHeight1 = 1.5;
const bulletHeight0 = 1.5;

// angle offset from midday position
let angleDeg = 90 + 3.3;
let angleRad = (Math.PI / 180) * angleDeg;

let sepDeg = 1.2;
let sepRad = (Math.PI / 180) * sepDeg;

let width = 975;
let height = 600;

let radius = width / 2;
let heightSN = 800;
let divisor = 1.035 + 0.008 - 0.004 - 0.007; // division of the full circle
let scale = 2.5; // global scale

let div = 5;
let divs = div - 1;

let colorShift2 = 12;
let colorShift = 20 * colorShift2;

let s = 35; // Saturation
let l = 50; // Light

const tree = d3.cluster()
    .size([2 * Math.PI, radius - 100]);

const linkRadial = d3.linkRadial()
    .angle((d) => d.x / divisor + angleRad)
    .radius((d) => d.y);

const svg = d3
    .select("#linkRadialSvg")
    .append("svg")
    .attr("id", "radialLinkSvg");

const apis = [
    d3.json('./data/SuttaPitakaTree.json'),
    d3.json("./data/knStar.json"),
];

Promise.all(apis).then(async ([suttaPitakaTree3, kn3]) => {

    // =============================================
    // Chart 1
    // =============================================
    // Convert Data in tree format
    const data = d3.stratify()(suttaPitakaTree3);
    const root = tree(data);

    root.each(function (d) {
        d.y = d.y * scale;
        if (d.data.name == "Devatāsaṁyutta") heightSN = d.y;
        if (d.ancestors()
            .find((x) =>
                x.data.name == "Nidānasaṁyutta" ||
                x.data.name == "Khandhasaṁyutta" ||
                x.data.name == "Saḷāyatanasaṁyutta") && d.height == 1
        ) {
            d.y = 890;
            d.data.spec = "fontSN";
        }
        if (d.height == 2) d.y = heightSN;
        if (d.depth == 1) d.y = 160 + 100 + 25 + 5;
        if (d.depth == 2 && !d.data.acro?.includes("DN")) d.y = 400 + 100 + 30;
        if (d.depth == 0) d.x = (-Math.PI * 1.1 - angleRad) * divisor + 2 * Math.PI;
        if (d.depth == 0) d.y = -70;
        if (d.ancestors().find((x) => x.data.name == "Majjhimanikāya")) d.x = d.x + sepRad;
        if (d.ancestors().find((x) => x.data.name == "Saṁyuttanikāya")) d.x = d.x + 2 * sepRad;
        if (d.ancestors().find((x) => x.data.name == "Aṅguttaranikāya")) d.x = d.x + 3 * sepRad;
        if (d.data.id == "test") {
            d.y = 340 + 60 - 30 - 31;
            d.x = (Math.PI / 2 - angleRad) * divisor;
        }
        if (d.data.id == "test2") {
            d.y = 340 + 60 + 60;
            d.x = (Math.PI / 2 - angleRad) * divisor;
        }
    });

    const g = svg
        .append("g")
        .attr("cursor", "grab");

    // paths
    g.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 1)
        .attr("stroke-width", 1.5)
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("d", linkRadial)
        .attr("stroke", (d) => color(oneDepth(d, true)));

    // bullet
    g.append("g")
        .selectAll("circle")
        .data(root.descendants())
        .join("circle")
        .attr("transform", (d) => `rotate(${(d.x * 180) / divisor / Math.PI - 90 + angleDeg}) translate(${d.y},0)`)
        .attr("r", (d) => bulletSize(d))
        .attr("fill", (d) => isLeaf(d) ? fade(color(oneDepth(d))) : color(oneDepth(d)));

    // text
    g.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 0.5)
        .selectAll("text")
        .data(root.descendants())
        .join("text")
        .attr("font-size", (d) => fontSize(d))
        .style("fill", (d) => color(oneDepth(d))) // colorisation
        .attr("transform", (d) => {
            return `
        rotate(${(d.x * 180) / divisor / Math.PI - 90 + angleDeg}) 
        translate(${d.y},0) 
        rotate(${d.x > (Math.PI - angleRad) * divisor && d.x < (2 * Math.PI - angleRad) * divisor ? 180 : 0})`;
        })
        .attr("dy", "0.31em")
        .attr("x", (d) =>
            (d.x > (Math.PI - angleRad) * divisor &&
                d.x < (2 * Math.PI - angleRad) * divisor) === !d.children ? -6 : 6)
        .attr("text-anchor", (d) =>
            (d.x > (Math.PI - angleRad) * divisor &&
                d.x < (2 * Math.PI - angleRad) * divisor) === !d.children ? "end" : "start")
        .text((d) => {
            if (d.depth == 0 || d.depth == 1) return d.data.name;
            if (d.height != 0 && isDNMN(d)) return d.data.name;
            if (d.data.acro == "") return d.data.name; // not usefull for KN
            if (
                d.x > (Math.PI - angleRad) * divisor &&
                d.x < (2 * Math.PI - angleRad) * divisor
            ) {
                return !d.children
                    ? d.data.name + " : " + d.data.acro
                    : d.data.acro + " : " + d.data.name;
            } else {
                return !d.children
                    ? d.data.acro + " : " + d.data.name
                    : d.data.name + " : " + d.data.acro;
            }
        })
        .style("cursor", "pointer")
        .clone(true)
        .lower()
        .attr("stroke", "white");

    // =============================================
    // Chart 2
    // =============================================
    scale = 3.5;
    divisor = 1.5; // division of the full circle 
    angleDeg = -30; // angle offset from midday position
    angleRad = (Math.PI / 180) * angleDeg;
    const translation = 1270;

    const data2 = d3.stratify()(kn3);
    data2.each(function (d) {
        if (
            d.ancestors().find(
                (x) =>
                    x.data.id != "kn" &&
                    x.data.id != "kp" &&
                    x.data.id != "dhp" &&
                    x.data.id != "bv" &&
                    x.data.id != "mnd" &&
                    x.data.id != "mnd" &&
                    !x.data.id.includes("cnd") &&
                    !x.data.id.includes("cp") &&
                    !x.data.id.includes("ps") &&
                    !x.data.id.includes("ne") &&
                    // x.data.id != "ne" &&
                    x.data.id != "pe"
            ) &&
            d.height == 1
        )
            d.children = null;
    });

    color("1");
    color("2");
    color("3");
    color("4");

    const root2 = tree(data2);

    root2.each(function (d) {
        d.y = d.y * scale;
        if (d.height == 1 || d.height == 0) d.y = 600 + 230 + 100 + 40;
        if (d.height == 2) d.y = 490 + 230 + 30 + 30;
        if (d.depth == 1) d.y = 260 + 100 + 30;
        if (d.depth == 0) d.x = Math.PI;
        if (d.depth == 0) d.y = -9 * 80 - 90 - 30 - 20;
        if (d.data.name == "test") d.y = 800;
        if (d.data.id.slice(0, 3) == "cnd" && d.height == 1) d.y = 490 + 230 + 30 + 30;
        if (d.data.id.slice(0, 3) == "cnd" && d.height == 1) d.data.acro = "";
        if (d.data.id.slice(0, 2) == "cp" && d.height == 1) d.y = 490 + 230 + 30 + 30;
        if (d.data.id.slice(0, 2) == "cp" && d.height == 2) d.y = 490 + 100;
        if (d.data.id.slice(0, 2) == "cp" && d.height == 2) d.data.acro = "";
        if (d.data.id.slice(0, 2) == "ps" && d.height == 1) d.y = 490 + 230 + 30 + 30;
        if (d.data.id.slice(0, 2) == "ps" && d.height == 1) d.data.acro = "";
        if (d.data.id.slice(0, 2) == "ne" && d.height == 1) d.y = 490 + 230 + 30 + 30;
        if (d.data.id.slice(0, 2) == "ne" && d.height == 2) d.y = 490 + 100;
        if (d.data.id.slice(0, 2) == "ne" && d.height == 1) d.data.acro = "";
    });


    const g2 = g
        .append("g")
        .attr("transform", "translate(" + translation + ",0)");

    // paths
    g2.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        // .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 0.8)
        .selectAll("path")
        .data(root2.links())
        .join("path")
        .attr("d", linkRadial)
        .attr("stroke", (d) => color(oneDepth2(d, true)));

    // bullet
    g2.append("g")
        .selectAll("circle")
        .data(root2.descendants())
        .join("circle")
        .attr("transform", (d) => `rotate(${(d.x * 180) / divisor / Math.PI - 90 + angleDeg}) translate(${d.y},0)`)
        .attr("fill", (d) => (d.children ? "#555" : "#999"))
        .attr("r", (d) => bulletSize2(d))
        .attr("fill", (d) => color(oneDepth2(d)))

    // text
    g2.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 0.5)
        .selectAll("text")
        .data(root2.descendants())
        .join("text")
        .attr("font-size", (d) => fontSize2(d))
        .style("fill", (d) => color(oneDepth2(d))) // colorisation
        .attr(
            "transform",
            (d) => `
      rotate(${(d.x * 180) / divisor / Math.PI - 90 + angleDeg}) 
      translate(${d.y},0) 
      rotate(${d.x > (Math.PI - angleRad) * divisor || d.x < -angleRad * divisor
                    ? 180
                    : 0
                })
    `
        )
        .attr("dy", "0.31em")
        .attr("x", (d) =>
            (d.x > (Math.PI - angleRad) * divisor || d.x < -angleRad * divisor) ===
                !d.children
                ? - 6
                : 6
        )
        .attr("text-anchor", (d) =>
            (d.x > (Math.PI - angleRad) * divisor || d.x < -angleRad * divisor) ===
                !d.children
                ? "end"
                : "start"
        )
        .text((d) => {
            if (d.depth == 0 || d.depth == 1) return d.data.name;
            if (d.height != 0 && isDNMN(d)) return d.data.name;
            if (d.data.acro == "") return d.data.name; // not usefull for KN
            if (d.x > (Math.PI - angleRad) * divisor || d.x < -angleRad * divisor) {
                return !d.children
                    ? d.data.name + " : " + d.data.acro
                    : d.data.acro + " : " + d.data.name;
            } else {
                return !d.children
                    ? d.data.acro + " : " + d.data.name
                    : d.data.name + " : " + d.data.acro;
            }
        })
        .style("cursor", "pointer")
        .on("click", function (d, i) {
            let link = "https://suttacentral.net/" + i.data.id;
            if (i.data.id == "suttaPitaka")
                link = "https://suttacentral.net/pitaka/sutta";
            window.open(link);
        })
        .clone(true)
        .lower()
        .attr("stroke", "white");

    svg.attr("width", width).attr("hieght", height).attr("viewBox", [-width / 2, -width * 1.5, width * 2, width * 3]);

    // ==========================================
    // zooming + pan;
    // ==========================================
    if (zoompan) {
        g.call(
            d3
                .drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended)
        );

        function dragstarted() {
            d3.select(this).raise();
            g.attr("cursor", "grabbing");
        }

        function dragged(event, d) {
            d3.select(this)
                .attr("cx", (d.x = event.x))
                .attr("cy", (d.y = event.y));
        }

        function dragended() {
            g.attr("cursor", "grab");
        }

        svg.call(
            d3.zoom()
                .extent([
                    [0, 0],
                    [width, height]
                ])
                .scaleExtent([1, 20])
                .on("zoom", zoomed)
        );

        function zoomed({ transform }) {
            g.attr("transform", transform);
        }
    }
});
// =======================================
// Chart 1 functions
// =======================================

// function for font size
const fontSize = (d) => {
    if (d.height == 0) {
        return sizeHeight0;
    } else if (d.data.spec == "fontSN") {
        return sizeHeight0;
    } else if (d.data.id.slice(0, 2) == "sn" && d.height == 1) {
        return sizeHeight1 - 1;
    } else if (d.depth == 1) {
        return sizeDepth1;
    } else if (d.height == 1 && !d.data.acro.includes("AN")) {
        return sizeHeight1;
    } else if (d.depth == 2) {
        return sizeDepth2;
    } else if (d.depth == 0) {
        return sizeDepth0;
    } else return size;
};


// function for bullet size
const bulletSize = (d) => {
    if (d.depth == 0) return bulletDepth0;
    else if (
        d.data.acro == "SN 12" ||
        d.data.acro == "SN 22" ||
        d.data.acro == "SN 35"
    ) return bulletHeight1;
    else if (d.data.id == "test" || d.data.id == "test2") return 0;
    else if (d.depth == 1) return bulletDepth1;
    else if (d.height == 0) return bulletHeight0;
    else if (d.height == 1 && !d.data.acro.includes("AN")) return bulletHeight1;
    else return bullet;
};

// Function that returns the name of the ancestor of depth 1. useful for colorization
const oneDepth = (d, source = false) => {
    let ancestors = {};
    source == true
        ? (ancestors = d.target.ancestors())
        : (ancestors = d.ancestors());

    const oneDepth = ancestors.find((d) => d.depth == 1);
    const result = oneDepth == null ? d.data.name : oneDepth.data.name;
    return result;
};

const isDNMN = (d) => d.data.acro?.includes("DN") || d.data.acro?.includes("MN");

const isLeaf = (d) => {
    let bool = false;
    if (d.height == 0) bool = true;
    return bool;
};

const fade = (color) => {
    const c = d3.color(color);
    c.l += 0.25;
    return c + "";
};

// Color
const subdivs = (start, end, divs) =>
    [...new Array(divs + 1)].map((_, idx) => start + idx * ((end - start) / divs));
const color2 = (h, s = 50, l = 50) => "hsl(" + h + "," + s + "%," + l + "%)";
const colors2 = subdivs(72, 378, divs).map((x) => color2(x + colorShift, s, l));
const color = d3.scaleOrdinal(colors2);


// =======================================
// Chart 2 functions
// =======================================

// function for font size
const fontSize2 = (d) => {
    if (d.height == 0) {
        return sizeHeight0;
    } else if (d.data.id.slice(0, 2) == "ne" && d.height == 1) {
        return sizeHeight1;
    } else if (d.data.id.slice(0, 2) == "ps" && d.height == 1) {
        return sizeHeight1;
    } else if (d.data.id.slice(0, 3) == "cnd" && d.height == 1) {
        return sizeHeight1;
    } else if (d.data.id.slice(0, 2) == "cp" && d.height == 1) {
        return sizeHeight1;
    } else if (d.data.id.slice(0, 4) == "thag" && d.height == 2) {
        return sizeHeight1 - 2;
    } else if (d.data.id.slice(0, 2) == "ja" && d.height == 2) {
        return sizeHeight1 - 1;
    } else if (d.depth == 1) {
        return sizeDepth2;
    } else if (d.height == 1) {
        return sizeHeight0;
    } else if (d.depth == 2) {
        return sizeHeight1;
    } else if (d.depth == 0) {
        return sizeDepth1;
    } else return size;
};

const oneDepth2 = (d, source = false) => {
    let ancestors = {};
    source == true
        ? (ancestors = d.target.ancestors())
        : (ancestors = d.ancestors());

    const oneDepth = ancestors.find((d) => d.depth == 0);
    const result = oneDepth == null ? d.data.name : oneDepth.data.name;
    return result;
};

const isLeaf2 = (d) => {
    let bool = false;
    if (d.height == 0) bool = true;
    if (
        d.height == 1 &&
        d.data.id.slice(0, 2) != "cp" &&
        d.data.id.slice(0, 2) != "kp" &&
        d.data.id.slice(0, 3) != "dhp" &&
        d.data.id.slice(0, 3) != "cnd" &&
        d.data.id.slice(0, 2) != "ne" &&
        d.data.id.slice(0, 3) != "mnd" &&
        d.data.id.slice(0, 2) != "ps" &&
        d.data.id.slice(0, 2) != "bv" &&
        d.data.id.slice(0, 2) != "pe"
    )
        bool = true;
    return bool;
};

// function for bullet size
const bulletSize2 = (d) => {
    if (d.depth == 0) return bulletDepth1;
    else if (d.depth == 1) return bulletDepth1;
    else return bulletHeight0;
};

// ====================================================
// Export SVG as Image
// ====================================================
function exportSvg() {
    const svgElement = document.getElementById('radialLinkSvg');
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    const canvas = document.createElement('canvas');
    canvas.width = document.getElementById("linkRadialSvg").clientWidth;
    canvas.height = document.getElementById("linkRadialSvg").clientHeight;
    const context = canvas.getContext('2d');
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = function () {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpg');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'radialLink_image.jpg';
        a.click();
    };

    // Properly encode the SVG string to base64
    function utf8ToBase64(str) {
        return btoa(unescape(encodeURIComponent(str)));
    }

    const encodedSvgString = utf8ToBase64(svgString);
    img.src = 'data:image/svg+xml;base64,' + encodedSvgString;
}

// document.getElementById("saveSvgBtn").addEventListener("click", () => {
//     download(_ => rasterize(svg.node()), "abc", "Download MAP1 as PNG");
// });

// ====================================================
// Dark mode
// ====================================================
const themeElement = document.getElementById("flexSwitchCheckDefault");
const darkModeSwitch = document.getElementById("darkModeSwitch");
const body = document.getElementById("body");

darkModeSwitch.textContent = "ON";
isDarkMode = false;

themeElement.addEventListener("click", () => {
    if (!isDarkMode) {
        body.classList.add("darkTheme");
        darkModeSwitch.textContent = "OFF";
        isDarkMode = true;

    } else {
        body.classList.remove("darkTheme");
        darkModeSwitch.textContent = "ON";
        isDarkMode = false;
    }
});

// function rasterizeWhite(svg) {
//     let resolve, reject;
//     const promise = new Promise((y, n) => ((resolve = y), (reject = n)));
//     const image = new Image();
//     image.onerror = reject;
//     image.onload = () => {
//         const rect = svg.getBoundingClientRect();
//         const context = context2d(
//             rect.width * PNGprecision,
//             rect.height * PNGprecision,
//             1
//         );
//         context.fillStyle = "white";
//         context.fillRect(
//             0,
//             0,
//             rect.width * PNGprecision,
//             rect.height * PNGprecision
//         );
//         context.drawImage(
//             image,
//             0,
//             0,
//             rect.width * PNGprecision,
//             rect.height * PNGprecision
//         );
//         context.canvas.toBlob(resolve, "image/png", 1);
//     };
//     image.src = URL.createObjectURL(serialize(svg));
//     return promise;
// }

// Create 2d canvas
// function context2d(width, height, dpi) {
//     if (dpi == null) dpi = devicePixelRatio;
//     let canvas = document.createElement("canvas");
//     canvas.width = width * dpi;
//     canvas.height = height * dpi;
//     canvas.style.width = width + "px";
//     let context = canvas.getContext("2d");
//     context.scale(dpi, dpi);
//     return context;
// }


// function rasterize(svg) {
//     let resolve, reject;
//     const promise = new Promise((y, n) => (resolve = y, reject = n));
//     const image = new Image;
//     image.onerror = reject;
//     image.onload = () => {
//         const rect = svg.getBoundingClientRect();
//         const context = context2d(rect.width, rect.height);
//         context.drawImage(image, 0, 0, rect.width, rect.height);
//         context.canvas.toBlob(resolve);
//     };
//     image.src = URL.createObjectURL(serialize(svg));
//     return promise;
// }

// function serialize(svg) {
//     const xmlns = "http://www.w3.org/2000/xmlns/";
//     const xlinkns = "http://www.w3.org/1999/xlink";
//     const svgns = "http://www.w3.org/2000/svg";

//     svg = svg.cloneNode(true);
//     const fragment = window.location.href + "#";
//     const walker = document.createTreeWalker(svg, NodeFilter.SHOW_ELEMENT);
//     while (walker.nextNode()) {
//         for (const attr of walker.currentNode.attributes) {
//             if (attr.value.includes(fragment)) {
//                 attr.value = attr.value.replace(fragment, "#");
//             }
//         }
//     }
//     svg.setAttributeNS(xmlns, "xmlns", svgns);
//     svg.setAttributeNS(xmlns, "xmlns:xlink", xlinkns);
//     const serializer = new window.XMLSerializer;
//     const string = serializer.serializeToString(svg);
//     return new Blob([string], { type: "image/svg+xml" });
// };


// function download(value, name = "untitled", label = "Save") {
//     const anchor = document.createElement('a');
//     anchor.href = "#";
//     const button = document.createElement('button');
//     anchor.appendChild(button);
//     const a = anchor;
//     const b = a.firstChild;
//     b.textContent = label;
//     a.download = name;

//     async function reset() {
//         await new Promise(requestAnimationFrame);
//         URL.revokeObjectURL(a.href);
//         a.removeAttribute("href");
//         b.textContent = label;
//         b.disabled = false;
//     }
//     console.log("in", a);
//     a.onclick = async event => {
//         console.log("clicked");
//         b.disabled = true;
//         if (a.href) return reset(); // Already saved.
//         b.textContent = "Saving…";
//         try {
//             const object = await (typeof value === "function" ? value() : value);
//             b.textContent = "Download";
//             a.href = URL.createObjectURL(object);
//         } catch (ignore) {
//             b.textContent = label;
//         }
//         if (event.eventPhase) return reset(); // Already downloaded.
//         b.disabled = false;
//     };

//     return a;
// }