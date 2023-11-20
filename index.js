// sets up variables needed in multiple functions 
let store = {};
let brushedSchools = [];
let bubble;
let bubbleHeight;
let cloudContainerWidth;
let cloudContainerHeight;
let arc;
let arcLabel;
let prevBubbleChartData;
let prevWordCloudData;
let neighborhoodData = [];
let neighborhoodList = [];

const pieChartConfig = {
    width: 300,
    height: 300,
    margin: {
        top: 40,
        bottom: 10,
        left: 10,
        right: 10
    }
};

const colorPie = (race) => {
    switch (race) {
        case 'Hispanic/Latinx':
            return "#4e79a7";
        case 'Black':
            return "#f28e2c";
        case 'Multi-racial':
            return '#e15759';
        case 'White':
            return '#76b7b2';
    }
}

// datasets into array
function loadData() {
    return Promise.all([
        d3.csv("./data/careerChat.csv"),
        d3.csv("./data/strengthsGained.csv"),
        d3.csv("./data/ethnicities.csv"),
        d3.json('https://gist.githubusercontent.com/jdev42092/5c285c4a3608eb9f9864f5da27db4e49/raw/a1c33b1432ca2948f14f656cc14c7c7335f78d95/boston_neighborhoods.json'),
        d3.csv("./data/studentdata21.csv"),
        d3.csv("./data/schools.csv")
    ]).then(datasets => {
        store.careerChat = datasets[0];
        store.strengthsGained = datasets[1];
        store.ethnicities = datasets[2];
        store.map = datasets[3];
        store.neighborhoods = datasets[4];
        store.schools = datasets[5];
    });
}

// groups strengths gained dataset by the strength gained
function groupByStrengthsGained(data) {
    let result = data.reduce((result, d) => {
        const currentData = result[d["Strength Gained"]] || {
            strengthGained: d["Strength Gained"],
            count: 0
        };

        currentData.count++;

        result[d["Strength Gained"]] = currentData;

        return result;
    }, {});

    result = Object.keys(result).map(key => result[key]);

    return result.map(d => {
        return { strengthGained: d.strengthGained.replace(" ", "\n"), count: d.count }
    });
}

// groups career chat dataset by the lesson learned
function groupByWhatTheyLearned(data) {
    let result = data.reduce((result, d) => {
        const currentData = result[d["What is one thing you learned? "]] || {
            thingLearned: d["What is one thing you learned? "],
            count: 0
        };

        currentData.count++;

        result[d["What is one thing you learned? "]] = currentData;
        return result;
    }, {});

    result = Object.keys(result).map(key => result[key]);

    return result;
}

// groups ethnicity dataset by the ethnicity
function groupByEthnicity() {
    let result = store.ethnicities.reduce((result, d) => {
        const currentData = result[d["Race"]] || {
            race: d["Race"],
            count: 0
        };

        currentData.count++;

        result[d["Race"]] = currentData;

        return result;
    }, {});

    result = Object.keys(result).map(key => result[key]);

    return result;
}

// groups neighborhood dataset by the neighborhood
function groupByNeighborhoods(data) {
    let result = data.reduce((result, d) => {
        let currentData = result[d["Neighborhood"]] || 0

        currentData++;

        result[d["Neighborhood"]] = currentData;

        return result;
    }, {});
    return result;
}

// draws the bubble chart
function showBubbleChart() {
    // bubble chart code from https://bl.ocks.org/alokkshukla/3d6be4be0ef9f6977ec6718b2916d168
    const config = {
        width: 800,
        height: 500,
        margin: {
            top: 30,
            bottom: 0,
            left: 0,
            right: 0
        }
    };

    // sets cursor to pointer, code from http://www.javascripter.net/faq/stylesc.htm
    function setCursorByID(id, cursorStyle) {
        var elem;
        if (document.getElementById &&
            (elem = document.getElementById(id))) {
            if (elem.style) elem.style.cursor = cursorStyle;
        }
    }

    setCursorByID('bubbleChart', 'default')

    bubbleHeight = config.height;

    const data = { children: groupByStrengthsGained(store.strengthsGained) };
    prevBubbleChartData = data;

    const containerWidth = config.width - config.margin.left - config.margin.right;
    const containerHeight = config.height - config.margin.top - config.margin.bottom;

    const svg = d3.select("#bubbleChart")
        .append("svg")
        .attr('width', config.width)
        .attr('height', config.height);

    const container = svg.append("g")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .attr("transform",
            "translate(" + config.margin.left + "," + config.margin.top + ")")
        .attr("class", "bubbleContainer");

    svg.append('text')
        .attr('x', config.width / 2)
        .attr('y', 25)
        .attr('font-size', '22px')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .text('Strengths Gained During the Program');

    var color = d3.scaleOrdinal(d3.schemeTableau10);

    bubble = d3.pack(data).size([containerWidth, containerHeight]).padding(2);

    var nodes = d3.hierarchy(data)
        .sum(d => d.count);
    var node = container.selectAll(".node")
        .data(bubble(nodes).descendants())
        .enter()
        .filter(function (d) {
            return !d.children
        })
        .append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    node.append("title")
        .text(function (d) {
            return d.strengthGained + ": " + d.count;
        });

    // transition - bubbles expand when drawn
    node.append("circle")
        .attr('r', 0)
        .transition()
        .duration(1000)
        .attr("r", function (d) {
            return d.r;
        })
        .style("fill", color(0));

    node.append("text")
        .attr("dy", ".2em")
        .style("text-anchor", "middle")
        .text(function (d) {
            return d.data.strengthGained.substring(0, d.r / 2);
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", function (d) {
            return d.r / 5;
        })
        .attr("fill", "white");

    node.append("text")
        .attr("dy", "1.3em")
        .style("text-anchor", "middle")
        .text(function (d) {
            return d.data.count;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", function (d) {
            return d.r / 5;
        })
        .attr("fill", "white");

    d3.select(self.frameElement)
        .style("height", config.height + "px");
}

// draws a new bubble chart on brush
function updateBubbleChart() {
    let newBubbleChartData;
    if (brushedSchools.length == 0) {
        newBubbleChartData = { children: groupByStrengthsGained(store.strengthsGained) };
    } else {
        const selectedStudents = store.neighborhoods
            .filter(student =>
                brushedSchools.map(school => school.School).includes(student.School));
        newBubbleChartData = {
            children: groupByStrengthsGained(store.strengthsGained
                .filter(student => selectedStudents.map(s => s.Name).includes(student.Name)))
        };
    }

    let rerender = false;
    if (newBubbleChartData.children.length === prevBubbleChartData.children.length) {
        newBubbleChartData.children.forEach(currentData => {
            const matches = prevBubbleChartData.children.filter(prevData => prevData.strengthGained === currentData.strengthGained
                && prevData.count === currentData.count);
            if (matches.length === 0) {
                rerender = true;
            }
        });
    } else {
        rerender = true;
    }

    if (!rerender) {
        return;
    }

    prevBubbleChartData = newBubbleChartData;

    const container = d3.select("#bubbleChart").select(".bubbleContainer");
    var color = d3.scaleOrdinal(d3.schemeTableau10);

    container.selectAll(".node").remove();

    var nodes = d3.hierarchy(newBubbleChartData)
        .sum(d => d.count);
    var node = container.selectAll(".node")
        .data(bubble(nodes).descendants())
        .enter()
        .filter(function (d) {
            return !d.children
        })
        .append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    node.append("title")
        .text(function (d) {
            return d.strengthGained + ": " + d.count;
        });

    // transition - circles expand out when drawn
    node.append("circle")
        .attr('r', 0)
        .transition()
        .duration(1000)
        .attr("r", function (d) {
            if (isNaN(d.r)) {
                return 1;
            }
            return d.r;
        })
        .style("fill", color(0));

    node.append("text")
        .attr("dy", ".2em")
        .style("text-anchor", "middle")
        .text(function (d) {
            if (d.data.children) {
                return "hi";
            }
            return d.data.strengthGained.substring(0, d.r / 2);
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", function (d) {
            if (isNaN(d.r)) {
                return 1;
            }
            return d.r / 5;
        })
        .attr("fill", "white");

    node.append("text")
        .attr("dy", "1.3em")
        .style("text-anchor", "middle")
        .text(function (d) {
            if (d.data.children) {
                return "0";
            }
            return d.data.count;
        })
        .attr("font-family", "sans-serif")
        .attr("font-size", function (d) {
            if (isNaN(d.r)) {
                return 1;
            }
            return d.r / 5;
        })
        .attr("fill", "white");

    d3.select(self.frameElement)
        .style("height", bubbleHeight + "px");
}

// draws word cloud
function showWordCloud() {
    // word cloud code from https://www.d3-graph-gallery.com/wordcloud
    const config = {
        width: 500,
        height: 300,
        margin: {
            top: 30,
            bottom: 5,
            left: 5,
            right: 5
        }
    };

    function setCursorByID(id, cursorStyle) {
        var elem;
        if (document.getElementById &&
            (elem = document.getElementById(id))) {
            if (elem.style) elem.style.cursor = cursorStyle;
        }
    }

    setCursorByID('wordCloud', 'default')

    const data = groupByWhatTheyLearned(store.careerChat);
    prevWordCloudData = data;

    cloudContainerWidth = config.width - config.margin.left - config.margin.right;
    cloudContainerHeight = config.height - config.margin.top - config.margin.bottom;

    const svg = d3.select("#wordCloud")
        .append("svg")
        .attr('width', config.width)
        .attr('height', config.height);
    const container = svg.append("g")
        .attr("width", cloudContainerWidth)
        .attr("height", cloudContainerHeight)
        .attr("transform",
            "translate(" + config.margin.left + "," + config.margin.top + ")")
        .attr("class", "wordCloudContainer");

    svg.append('text')
        .attr('x', config.width / 2)
        .attr('y', 25)
        .attr('font-size', '22px')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .text('What Students Learned From the Career Chat');

    var color = d3.scaleOrdinal(d3.schemeTableau10);
    wordSizeScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
        .range([10, 50]);

    var layout = d3.layout.cloud()
        .size([cloudContainerWidth, cloudContainerHeight])
        .words(data.map(d => { return { text: d.thingLearned, size: d.count }; }))
        .padding(5)
        .rotate(() => 0)
        .fontSize(d => wordSizeScale(d.size))
        .on("end", words => {
            container.append("g")
                .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
                .attr("class", "wordCloudText")
                .selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", d => d.size + "px")
                .style("fill", (d, i) => color(i))
                .attr("text-anchor", "middle")
                .style("font-family", "sans-serif")
                .attr("transform", d => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")")
                .text(function (d) { return d.text; })
                // hover effects
                .on('mouseover', handleMouseOver)
                .on('mouseout', handleMouseOut)
                // transition - words move to proper location when drawn
                .attr("transform", d => "translate(" + [0, 0] + ")rotate(" + d.rotate + ")")
                .transition()
                .duration(1000)
                .attr("transform", d => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")");
        });

    // detail on demand - text on hover effects from https://bl.ocks.org/allisonking/ece2f8a08a626b7067381317a385a245
    function handleMouseOver(d) {
        var group = container.append('g')
            .attr('id', 'wordTitles');
        group.selectAll('text')
            .data(data.filter(data => data.thingLearned === d.path[0].textContent))
            .enter().append('text')
            .attr('x', 160)
            .attr('y', 260)
            .text(function (d) {
                return 'Number of student responses: ' + String(d.count);
            });
    }

    // removes text when mouse moves off of a word
    function handleMouseOut(d) {
        d3.select('#wordTitles').remove();
    }

    layout.start();
}

// redraws word cloud upon brush
function updateWordCloud() {
    let newWordCloudData;
    if (brushedSchools.length == 0) {
        newWordCloudData = groupByWhatTheyLearned(store.careerChat);
    } else {
        const selectedStudents = store.neighborhoods
            .filter(student =>
                brushedSchools.map(school => school.School).includes(student.School));
        newWordCloudData = groupByWhatTheyLearned(store.careerChat
            .filter(student => selectedStudents.map(s => s.Name).includes(student.Name)));
    }

    let rerender = false;
    if (newWordCloudData.length === prevWordCloudData.length) {
        newWordCloudData.forEach(currentData => {
            const matches = prevWordCloudData.filter(prevData => prevData.thingLearned === currentData.thingLearned
                && prevData.count === currentData.count);
            if (matches.length === 0) {
                rerender = true;
            }
        });
    } else {
        rerender = true;
    }

    if (!rerender) {
        return;
    }

    prevWordCloudData = newWordCloudData;

    var color = d3.scaleOrdinal(d3.schemeTableau10);
    const container = d3.select("#wordCloud").select(".wordCloudContainer");
    container.select(".wordCloudText").selectAll("text").remove();

    var layout = d3.layout.cloud()
        .size([cloudContainerWidth, cloudContainerHeight])
        .words(newWordCloudData.map(d => { return { text: d.thingLearned, size: d.count }; }))
        .padding(5)
        .rotate(() => 0)
        .fontSize(d => wordSizeScale(d.size))
        .on("end", words => {
            container.select(".wordCloudText").selectAll("text")
            container.select(".wordCloudText").selectAll("text")
                .data(words)
                .enter().append("text")
                .style("font-size", d => d.size + "px")
                .style("fill", (d, i) => color(i))
                .attr("text-anchor", "middle")
                .style("font-family", "sans-serif")
                .attr("transform", d => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")")
                .text(function (d) { return d.text; })
                // hover effects
                .on('mouseover', handleMouseOver)
                .on('mouseout', handleMouseOut)
                // transition - words move to proper location when drawn
                .attr("transform", d => "translate(" + [0, 0] + ")rotate(" + d.rotate + ")")
                .transition()
                .duration(1000)
                .attr("transform", d => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")");
        });

    // detail on demand hover effect
    function handleMouseOver(d) {
        var group = container.append('g')
            .attr('id', 'wordTitles');
        group.selectAll('text')
            .data(newWordCloudData.filter(data => data.thingLearned === d.path[0].textContent))
            .enter().append('text')
            .attr('x', 160)
            .attr('y', 260)
            .text(function (d) {
                return 'Number of student responses: ' + String(d.count);
            });
    }

    function handleMouseOut(d) {
        d3.select('#wordTitles').remove();
    }

    layout.start();
}

// draws pie chart
function showPieChart() {
    const containerWidth = pieChartConfig.width - pieChartConfig.margin.left - pieChartConfig.margin.right;
    const containerHeight = pieChartConfig.height - pieChartConfig.margin.top - pieChartConfig.margin.bottom;

    const radius = containerHeight / 2;

    const data = groupByEthnicity();

    const svg = d3.select("#pieChart")
        .append("svg")
        .attr('width', pieChartConfig.width)
        .attr('height', pieChartConfig.height);

    // detail on demand code source https://www.youtube.com/watch?v=7QuFEk-XlTY
    const tooldiv = d3.select("#pieChart")
        .append('div')
        .style('opacity', 0)
        .style('position', 'absolute');

    const container = svg
        .append("g")
        .attr("width", containerWidth)
        .attr("height", containerHeight)
        .attr("transform",
            "translate(" + pieChartConfig.margin.left + "," + pieChartConfig.margin.top + ")");;

    svg.append('text')
        .attr('x', pieChartConfig.width / 2)
        .attr('y', 15)
        .attr('font-size', '22px')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .text('Student Ethnicities');

    // pie chart code below from https://medium.com/javarevisited/create-a-pie-or-doughnut-chart-using-d3-js-7d4a1d590420
    var pie = d3.pie()
        .sort(null)
        .value(d => d.count);

    arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius - 1);

    arcRadius = radius * 0.85;
    arcLabel = d3.arc().innerRadius(arcRadius).outerRadius(arcRadius);

    const arcs = pie(data);
    const totalStudents = data.reduce((prev, curr) => prev + curr.count, 0);

    container.append("g")
        .attr('transform',
            "translate(" + containerWidth / 2 + "," + containerHeight / 2 + ")")
        .attr("stroke", "white")
        .attr("class", "pieCircle")
        .selectAll("path")
        .data(arcs)
        .enter().append("path")
        .attr("fill", d => colorPie(d.data.race))
        .attr("d", arc)
        // hover detail on demand (moves with mouse)
        .on('mouseover', (e, d) => {
            tooldiv.style('opacity', 1)
                .text('Students: ' + `${d.data.count}`)
        })
        .on('mousemove', (e, d) => {
            tooldiv.style('left', (e.pageX + 20) + 'px')
            tooldiv.style('top', (e.pageY + 10) + 'px')
            tooldiv.style('background-color', colorPie(d.data.race))
            tooldiv.style('border', 'solid')
            tooldiv.style('border-width', '1px')
            tooldiv.style('border-radius', '5px')
        })
        .on('mouseout', () => {
            tooldiv.transition()
                .duration(200)
            tooldiv.style('opacity', 0)
        });

    container.append("g")
        .attr('transform',
            "translate(" + containerWidth / 2 + "," + containerHeight / 2 + ")")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
        .attr("text-anchor", "middle")
        .attr("class", "pieText")
        .selectAll("text")
        .data(arcs)
        .enter().append("text")
        .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
        .call(text => text.append("tspan")
            .attr("y", '-2em')
            .attr("x", d => {
                if (d.data.race === "Multi-racial") {
                    return -25;
                }
                return 0
            })
            .attr("font-weight", "bold")
            .attr("fill", "black")
            .text(d => d.data.race))
        .call(text => text.append("tspan")
            .attr("x", 0)
            .attr("y", "0.7em")
            .attr("fill-opacity", 0.7)
            .attr("fill", "black")
            .text(d => Math.round(d.data.count / totalStudents * 100) + "%"));
}

//Assuming that the a school is brushed, the pie chart will update 
//with new info for each category 
function updatePieChart() {
    var newPieData = updatePieData();

    var pie = d3.pie()
        .sort(null)
        .value(d => d.count);

    const arcs = pie(newPieData);
    const arcsLabels = pie(newPieData.filter(race => race.count > 0))

    //update chart : https://bl.ocks.org/jonsadka/fa05f8d53d4e8b5f262e
    const container = d3.select("#pieChart")
        .select("svg");

    const tooldiv = d3.select("#pieChart")
        .append('div')
        .style('opacity', 0)
        .style('position', 'absolute');

    container.selectAll("path")
        .data(arcs)
        .transition().duration(750).attrTween("d", arcTween);

    container.select(".pieCircle")
        .selectAll("path")
        .data(arcs)
        .enter().append("path")
        .attr("fill", d => colorPie(d.data.race))
        .attr("d", arc)
        // hover detail on demand
        .on('mouseover', (e, d) => {
            tooldiv.style('opacity', 1)
                .text('Students: ' + `${d.data.count}`)
        })
        .on('mousemove', (e, d) => {
            tooldiv.style('left', (e.pageX + 20) + 'px')
            tooldiv.style('top', (e.pageY + 10) + 'px')
            tooldiv.style('background-color', colorPie(d.data.race))
            tooldiv.style('border', 'solid')
            tooldiv.style('border-width', '1px')
            tooldiv.style('border-radius', '5px')
        })
        .on('mouseout', () => {
            tooldiv.transition()
                .duration(200)
            tooldiv.style('opacity', 0)
        });

    container.select(".pieText").selectAll("text").remove();

    const totalStudents = newPieData.reduce((prev, curr) => prev + curr.count, 0);

    container.select(".pieText")
        .selectAll("text")
        .data(arcsLabels)
        .enter().append("text")
        .attr("transform", d => `translate(${arcLabel.centroid(d)})`)
        .call(text => text.append("tspan")
            .attr("y", '-2em')
            .attr("x", d => {
                if (d.data.race === "Multi-racial") {
                    return -25;
                }
                return 0
            })
            .attr("font-weight", "bold")
            .attr("fill", "black")
            .text(d => d.data.race))
        .call(text => text.append("tspan")
            .attr("x", 0)
            .attr("y", "0.7em")
            .attr("fill-opacity", 0.7)
            .attr("fill", "black")
            .text(d => Math.round(d.data.count / totalStudents * 100) + "%"));
}

//Update data for the pie chart depending on what it being brushed 
function updatePieData() {
    if (brushedSchools.length === 0) {
        return groupByEthnicity();
    }
    const newPieData = [];
    let neighborhoodData = store.neighborhoods;
    neighborhoodData.forEach(student => {
        if (brushedSchools.map(school => school.School).includes(student.School)) {
            newPieData.push(student);
        }
    })

    var countB = 0,
        countW = 0,
        countHL = 0,
        countM = 0;
    for (var i = 0; i < newPieData.length; i++) {
        if (newPieData[i].Race == "Black") {
            countB++
        } else if (newPieData[i].Race == "White") {
            countW++
        } else if (newPieData[i].Race == "Hispanic/Latinx") {
            countHL++
        } else {
            countM++
        }
    }
    var raceCounts = [
        {
            race: 'Hispanic/Latinx',
            count: countHL
        },
        {
            race: 'Black',
            count: countB
        },
        {
            race: 'Multi-racial',
            count: countM
        },
        {
            race: 'White',
            count: countW
        }];
    return raceCounts;
}

// draws the map
function showMap() {
    const config = {
        width: 550,
        height: 800,
        margin: {
            top: 40,
            bottom: 10,
            left: 10,
            right: 10
        }
    }

    const containerWidth = config.width - config.margin.left - config.margin.right;
    const containerHeight = config.height - config.margin.top - config.margin.bottom;

    //Create the brush for the map 
    const brush = d3.brush()
        .extent([[0, 0], [containerWidth, containerHeight]])

    var svg = d3.select("#Map")
        .append("svg")
        .attr("width", config.width)
        .attr("height", config.height);

    svg.append('text')
        .attr('x', config.width / 2)
        .attr('y', 40)
        .attr('font-size', '22px')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .text('Student Neighborhoods and Schools');


    //var boston = d3.map();
    var projection = d3.geoAlbers()
        .scale(155000)
        .rotate([71.057, 0]) //longitude
        .center([0, 42.313]) //latitude
        .translate([containerWidth / 2, containerHeight / 2]);

    //var projection = d3.geoConicEqualArea();
    //projection.scale(500).translate([100, 200 ])
    //projection.translate([config.width / 4, config.height / 4 ])
    var path = d3.geoPath().projection(projection);

    const color = d3.scaleOrdinal([
        "#FFFFFF",
        d3.interpolateGreens(1 / 16),
        d3.interpolateGreens(2 / 16),
        d3.interpolateGreens(3 / 16),
        d3.interpolateGreens(4 / 16),
        d3.interpolateGreens(5 / 16),
        d3.interpolateGreens(6 / 16),
        d3.interpolateGreens(7 / 16),
        d3.interpolateGreens(8 / 16),
        d3.interpolateGreens(9 / 16),
        d3.interpolateGreens(10 / 16),
        d3.interpolateGreens(11 / 16),
        d3.interpolateGreens(12 / 16),
        d3.interpolateGreens(13 / 16),
        d3.interpolateGreens(14 / 16),
        d3.interpolateGreens(15 / 16),
        d3.interpolateGreens(1),
    ])

    var container = svg.append("g")
        .attr("class", "key")
        .attr("transform", `translate(${config.margin.left},${config.margin.top})`);

    const xScale = d3.scaleLinear()
        .domain([0, 16])
        .rangeRound([0, 15 * 16])

    // key color map
    container.selectAll("rect")
        .data([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
        .enter().append("rect")
        .attr("height", 8)
        .attr("x", d => 20 + 15 * d)
        .attr('y', 50)
        .attr("width", 15)
        .attr("fill", function (d) { return color(d); });

    const xAxis = d3.axisBottom(xScale)

    container.append("g").attr("transform", "translate(28,58)").call(xAxis)

    container.append("text")
        .attr("class", "caption")
        .attr("x", 20)
        .attr("y", 44)
        .attr("fill", "#000")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("Number of Students");

    // key school
    container.append("circle")
        .data([1])
        .attr("cx", 25)
        .attr("cy", 100)
        .attr("r", 3)
        .attr("fill", "red")
        .attr("stroke", "black")
    container.append("text")
        .attr("class", "caption")
        .attr("x", 35)
        .attr("y", 104)
        .attr("fill", "#000")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("- School")

    const neighborhoods = groupByNeighborhoods(store.neighborhoods);

    container.selectAll("path.neighborhood")
        .data(store.map.features)
        .enter()
        .append("path")
        .attr("class", "neighborhood")
        .attr("d", d => {
            return path(d)
        })
        .attr("stroke", "grey")
        .attr("fill", d =>
            color(neighborhoods[d.properties.Name] || 0));

    container.selectAll(".brushContainer")
        .data([1])
        .join("g")
        .attr("class", "brushContainer")
        .call(brush);

    //Add schools to map 
    container.selectAll("school")
        .data(store.schools)
        .enter()
        .append("circle")
        .attr("class", "school")
        .attr("r", 3)
        .attr("cx", d => projection([d.Longitude, d.Latitude])[0])
        .attr("cy", d => projection([d.Longitude, d.Latitude])[1])
        .attr("fill", "red")
        .attr("stroke", "black")
        // hover detail on demand for school names
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);

    // displays school name on mouse hover
    function handleMouseOver(d) {
        if (brushedSchools.length === 0) {

            // draws rectangle behind text
            var backgroundGroup = container.append('g')
                .attr('id', 'background');

            backgroundGroup.selectAll('rect')
                .data(store.schools.filter(data => data.School === d.path[0].__data__.School))
                .enter()
                .append('rect')
                .attr("width", d => {
                    if (d.School === "Epiphany School") {
                        return 135;
                    } else if (d.School === "Boston Teachers Union School") {
                        return 205;
                    }
                    else if (d.School === "Dearborn STEM Academy" || d.School === "Rafael Hernandez School") {
                        return 185;
                    }
                    else if (d.School === "Tech Boston" || d.School === "Mildred" || d.School === "Cathedral") {
                        return 120;
                    }
                    return 150;
                })
                .text(function (d) {
                    return String(d.School);
                })
                .attr("height", 16)
                .attr('stroke', 'black')
                .attr('stroke-width', '0.3')
                .style("fill", "white")
                .style("opacity", '0.8')
                .attr("x", d => {
                    if (d.School === "Rafael Hernandez School") {
                        return projection([d.Longitude, d.Latitude])[0] - 170;
                    } else if (d.School === "Boston Latin Academy") {
                        return projection([d.Longitude, d.Latitude])[0] - 2;
                    }
                    else if (d.School === "Dearborn STEM Academy") {
                        return projection([d.Longitude, d.Latitude])[0] - 92;
                    }
                    else if (d.School === "Boston Teachers Union School") {
                        return projection([d.Longitude, d.Latitude])[0] - 172;
                    }
                    else if (d.School === "Jackson Mann School") {
                        return projection([d.Longitude, d.Latitude])[0] - 72;
                    }
                    else if (d.School === "Epiphany School") {
                        return projection([d.Longitude, d.Latitude])[0] - 12;
                    }
                    return projection([d.Longitude, d.Latitude])[0] - 62;
                })
                .attr("y", d => projection([d.Longitude, d.Latitude])[1] - 18)
                .text(function (d) {
                    return String(d.School);
                });


            // draws text (school name)
            var group = container.append('g')
                .attr('id', 'schoolNames');

            group.selectAll('text')
                .data(store.schools.filter(data => data.School === d.path[0].__data__.School))
                .enter()
                .append('text')
                .attr("x", d => {
                    if (d.School === "Boston Teachers Union School") {
                        return projection([d.Longitude, d.Latitude])[0] - 70;
                    }
                    return projection([d.Longitude, d.Latitude])[0];
                })
                .attr("y", d => {
                    return projection([d.Longitude, d.Latitude])[1] - 5;
                })
                .attr("font-size", "16px")
                .attr("text-anchor", d => {
                    if (d.School === "Rafael Hernandez School") {
                        return "end";
                    } else if (d.School === "Boston Latin Academy" || d.School === "Epiphany School") {
                        return "start";
                    }
                    return "middle";
                })
                .text(function (d) {
                    return String(d.School);
                });
        }
    }

    // removes text when mouse moves off of a word
    function handleMouseOut(d) {
        d3.select('#schoolNames').remove()
        d3.select('#background').remove();
    }

    //Create the brush for the map 
    brush.on("end", event => {
        // clear prev brushed school names
        d3.select('#schoolNames2').remove();
        d3.select('#background2').remove();

        if (event.selection === null) {
            brushedSchools = [];
        } else {
            const [[x0, y0], [x1, y1]] = event.selection;
            brushedSchools = store.schools.filter(d => {
                return x0 <= projection([d.Longitude, d.Latitude])[0] &&
                    x1 >= projection([d.Longitude, d.Latitude])[0] &&
                    y0 <= projection([d.Longitude, d.Latitude])[1] &&
                    y1 >= projection([d.Longitude, d.Latitude])[1];
            });
        }

        // places white rectangular background behind school names that are brushed
        var backgroundGroup2 = container.append('g')
            .attr('id', 'background2');

        backgroundGroup2.selectAll('rect')
            .data(brushedSchools)
            .enter()
            .append('rect')
            .attr("width", d => {
                if (d.School === "Epiphany School") {
                    return 135;
                } else if (d.School === "Boston Teachers Union School") {
                    return 205;
                }
                else if (d.School === "Dearborn STEM Academy" || d.School === "Rafael Hernandez School") {
                    return 185;
                }
                else if (d.School === "Tech Boston" || d.School === "Mildred" || d.School === "Cathedral") {
                    return 120;
                }
                return 150;
            })
            .text(function (d) {
                return String(d.School);
            })
            .attr("height", 16)
            .attr('stroke', 'red')
            .attr('stroke-width', '0.3')
            .style("fill", "white")
            .style("opacity", '0.8')
            .attr("x", d => {
                if (d.School === "Rafael Hernandez School") {
                    return projection([d.Longitude, d.Latitude])[0] - 170;
                } else if (d.School === "Boston Latin Academy") {
                    return projection([d.Longitude, d.Latitude])[0] - 2;
                }
                else if (d.School === "Dearborn STEM Academy") {
                    return projection([d.Longitude, d.Latitude])[0] - 92;
                }
                else if (d.School === "Boston Teachers Union School") {
                    return projection([d.Longitude, d.Latitude])[0] - 172;
                }
                else if (d.School === "Jackson Mann School") {
                    return projection([d.Longitude, d.Latitude])[0] - 72;
                }
                else if (d.School === "Epiphany School") {
                    return projection([d.Longitude, d.Latitude])[0] - 12;
                }
                return projection([d.Longitude, d.Latitude])[0] - 62;
            })
            .attr("y", d => projection([d.Longitude, d.Latitude])[1] - 18)
            .text(function (d) {
                return String(d.School);
            });

        // show names of schools in brush
        var group2 = container.append('g')
            .attr('id', 'schoolNames2');

        group2.selectAll('text')
            .data(brushedSchools)
            .enter().append('text')
            .attr("x", d => {
                if (d.School === "Boston Teachers Union School") {
                    return projection([d.Longitude, d.Latitude])[0] - 70;
                }
                return projection([d.Longitude, d.Latitude])[0];
            })
            .attr("y", d => {
                return projection([d.Longitude, d.Latitude])[1] - 5;
            })
            .attr("font-size", "16px")
            .attr("text-anchor", d => {
                if (d.School === "Rafael Hernandez School") {
                    return "end";
                } else if (d.School === "Boston Latin Academy" || d.School === "Epiphany School") {
                    return "start";
                }
                return "middle";
            })
            .text(function (d) {
                return String(d.School);
            });

        //Change opacity of the circles when brushed
        container.selectAll(".school")
            .data(store.schools)
            .attr("opacity", d => {
                if (brushedSchools.length === 0 || brushedSchools.includes(d)) {
                    return 1;
                } else {
                    return 0.3;
                }
            });

        //when brushed show the color of the neighborhood
        container.selectAll("path.neighborhood")
            .data(store.map.features)
            .attr("fill", d => {
                if (brushedSchools.length > 0) {
                    const studentsInBrushedSchools = groupByNeighborhoods(store.neighborhoods
                        .filter(dt => {
                            return brushedSchools.map(school => school.School).includes(dt.School)
                        }));
                    return color(studentsInBrushedSchools[d.properties.Name] || 0);
                } else {
                    return color(neighborhoods[d.properties.Name] || 0);
                }
            });

        // removes label of the schools previously brushed 
        container.selectAll(".schoolsInBrush").remove();

        // update the other graphs based on the new brushed data
        updatePieChart()
        updateWordCloud()
        updateBubbleChart()
    });

    // displays school names on map when checkbox is clicked
    // checkbox code from https://www.d3-graph-gallery.com/graph/bubblemap_buttonControl.html
    function schoolsCheckUpdate() {

        // if box was checked previously, when unchecked it removes the associated text
        d3.select('#backgroundRect').remove();
        d3.select('#schoolNameCheckboxGroup').remove();

        // if box is checked, displays the text on the map
        d3.selectAll(".schoolNameCheckbox").each(function (d) {
            const checkbox = d3.select(this);
            if (checkbox.property("checked")) {

                // places rects behind school names that are brushed
                var backgroundRect = container.append('g')
                    .attr('id', 'backgroundRect');

                backgroundRect.selectAll('rect')
                    .data(store.schools)
                    .enter()
                    .append('rect')
                    .attr("width", d => {
                        if (d.School === "Epiphany School") {
                            return 135;
                        } else if (d.School === "Boston Teachers Union School") {
                            return 205;
                        }
                        else if (d.School === "Dearborn STEM Academy" || d.School === "Rafael Hernandez School") {
                            return 185;
                        }
                        else if (d.School === "Tech Boston" || d.School === "Mildred" || d.School === "Cathedral") {
                            return 120;
                        }
                        return 150;
                    })
                    .text(function (d) {
                        return String(d.School);
                    })
                    .attr("height", 16)
                    .attr('stroke', 'red')
                    .attr('stroke-width', '0.3')
                    .style("fill", "white")
                    .style("opacity", '0.8')
                    .attr("x", d => {
                        if (d.School === "Rafael Hernandez School") {
                            return projection([d.Longitude, d.Latitude])[0] - 170;
                        } else if (d.School === "Boston Latin Academy") {
                            return projection([d.Longitude, d.Latitude])[0] - 2;
                        }
                        else if (d.School === "Dearborn STEM Academy") {
                            return projection([d.Longitude, d.Latitude])[0] - 92;
                        }
                        else if (d.School === "Boston Teachers Union School") {
                            return projection([d.Longitude, d.Latitude])[0] - 172;
                        }
                        else if (d.School === "Jackson Mann School") {
                            return projection([d.Longitude, d.Latitude])[0] - 72;
                        }
                        else if (d.School === "Epiphany School") {
                            return projection([d.Longitude, d.Latitude])[0] - 12;
                        }
                        return projection([d.Longitude, d.Latitude])[0] - 62;
                    })
                    .attr("y", d => projection([d.Longitude, d.Latitude])[1] - 18)
                    .text(function (d) {
                        return String(d.School);
                    });

                // draws names of schools 
                var schoolNameCheckboxGroup = container.append('g')
                    .attr('id', 'schoolNameCheckboxGroup');

                schoolNameCheckboxGroup.selectAll('text')
                    .data(store.schools)
                    .enter().append('text')
                    .attr("x", d => {
                        if (d.School === "Boston Teachers Union School") {
                            return projection([d.Longitude, d.Latitude])[0] - 70;
                        }
                        return projection([d.Longitude, d.Latitude])[0];
                    })
                    .attr("y", d => {
                        return projection([d.Longitude, d.Latitude])[1] - 5;
                    })
                    .attr("font-size", "16px")
                    .attr("text-anchor", d => {
                        if (d.School === "Rafael Hernandez School") {
                            return "end";
                        } else if (d.School === "Boston Latin Academy" || d.School === "Epiphany School") {
                            return "start";
                        }
                        return "middle";
                    })
                    .text(function (d) {
                        return String(d.School);
                    });
            }
        })
    }

    // displays main finding textbox when checkbox is clicked
    function findingsCheckUpdate() {

         // if box was checked previously, when unchecked it removes the associated text
        d3.select('#resultsGroup').remove();
        d3.select('#answersGroup').remove();

        // if box is checked, displays the text on the viz
        d3.selectAll(".results").each(function (d) {
            const checkbox = d3.select(this);
            if (checkbox.property("checked")) {

                var resultsGroup = container.append('g')
                    .attr('id', 'resultsGroup');

                resultsGroup.selectAll('text')
                    .data([1])
                    .enter().append('text')
                    .attr("x", 112)
                    .attr("y", 630)
                    .attr('font-size', '24px')
                    .text("*Most students were from Southern Boston");

                var resultsSvg = d3.select("#filler3")
                    .append("svg")
                    .attr('id', 'answersGroup')
                    .attr("width", 1000)
                    .attr("height", 40);

                resultsSvg
                    .append('text')
                    .attr("class", "resultsSvg")
                    .attr('x', 160)
                    .attr('y', 30)
                    .attr('font-size', '24px')
                    .text('*Students made both personal and professional progress');
            }
        })
    }

    // makes array of neighborhoods in Boston that at least one student attends
    store.neighborhoods.forEach(d => {
        if (!neighborhoodList.includes(String(d.Neighborhood)) & String(d.Neighborhood)[String(d.Neighborhood).length - 1] !== ' ') {
            neighborhoodData.push(d)
            neighborhoodList.push(d.Neighborhood)
        }
    })

    // displays neighborhood names when checkbox is checked
    function neighborhoodCheckUpdate() {

        // if box was checked previously, when unchecked it removes the associated text
        d3.select('#neighborhoodNamesGroup').remove();

        // if box is checked, displays the text on the viz
        d3.selectAll(".neighborhoodNames").each(function (d) {
            const checkbox = d3.select(this);
            if (checkbox.property("checked")) {

                var neighborhoodNamesGroup = container.append('g')
                    .attr('id', 'neighborhoodNamesGroup');

                // show names of neighborhoods
                neighborhoodNamesGroup.selectAll('text')
                    .data(neighborhoodData)
                    .enter().append('text')
                    .attr("x", d => {
                        if ((String(d.Neighborhood)) === "Allston") {
                            return 102;
                        }
                        else if ((String(d.Neighborhood)) === "Back Bay") {
                            return 184;
                        }
                        else if ((String(d.Neighborhood)) === "Dorchester") {
                            return 305;
                        }
                        else if ((String(d.Neighborhood)) === "Fenway") {
                            return 115;
                        }
                        else if ((String(d.Neighborhood)) === "Hyde Park") {
                            return 157;
                        }
                        else if ((String(d.Neighborhood)) === "Jamaica Plain") {
                            return 12;
                        }
                        else if ((String(d.Neighborhood)) === "Mattapan") {
                            return 200;
                        }
                        else if ((String(d.Neighborhood)) === "Roslindale") {
                            return 12;
                        }
                        else if ((String(d.Neighborhood)) === "Roxbury") {
                            return 232;
                        }
                    })
                    .attr("y", d => {
                        if ((String(d.Neighborhood)) === "Allston") {
                            return 205;
                        }
                        else if ((String(d.Neighborhood)) === "Back Bay") {
                            return 257;
                        }
                        else if ((String(d.Neighborhood)) === "Dorchester") {
                            return 455;
                        }
                        else if ((String(d.Neighborhood)) === "Fenway") {
                            return 292;
                        }
                        else if ((String(d.Neighborhood)) === "Hyde Park") {
                            return 565;
                        }
                        else if ((String(d.Neighborhood)) === "Jamaica Plain") {
                            return 395;
                        }
                        else if ((String(d.Neighborhood)) === "Mattapan") {
                            return 515;
                        }
                        else if ((String(d.Neighborhood)) === "Roslindale") {
                            return 465;
                        }
                        else if ((String(d.Neighborhood)) === "Roxbury") {
                            return 315;
                        }
                    })
                    .text(d => (String(d.Neighborhood)));
            }
        });
    }

    // updates checkbox when that checkbox is clicked
    d3.selectAll(".schoolNameCheckbox").on("change", schoolsCheckUpdate);
    d3.selectAll(".neighborhoodNames").on("change", neighborhoodCheckUpdate);
    d3.selectAll(".results").on("change", findingsCheckUpdate);
}

//Update data for the bubble chart depending on what it being brushed 
function updateBubbleData() {
    var schoolsInfo = updatePieData();
    var strengthsData = store.strengthsGained
    var newDataSet = new Array();
    for (var n = 0; n < schoolsInfo.length; n++) {
        var name = schoolsInfo[n].FirstName + " " + schoolsInfo[n].LastName
        newDataSet.push(strengthsData.filter(function (d) {
            return d.YourName == name;
        }))
    }

    newDataSet = [].concat.apply([], newDataSet)
    return newDataSet;
}

function arcTween(a) {
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function (t) {
        return arc(i(t));
    };
}

function showData() {
    showBubbleChart();
    showWordCloud();
    showPieChart();
    showMap();
}

loadData().then(showData);
