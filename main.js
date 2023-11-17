let user = []

function displayData(JWT) {
    const query = `
    {
        user{
            login
            attrs
            totalUp
            totalDown
            transactions(order_by: { createdAt: desc }) {
                type
                amount
                createdAt
                path
            }
            progresses{
                object{
                  parents{
                    attrs
                  }
                }
            }
        }
    }
  `;

    fetch("https://01.kood.tech/api/graphql-engine/v1/graphql", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${JWT}`
        },
        body: JSON.stringify({ query: query })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            userChart(data)
        })
        .catch(error => {
            console.error("Error:", error);
        });
}
function loginForm() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const credentials = `${username}:${password}`;
    const encodedCredentials = btoa(credentials);

    fetch("https://01.kood.tech/api/auth/signin", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${encodedCredentials}`
        },
    })
        .then(response => {
            if (!response.ok) {
                alert("Missing or wrong credentials!");
                return;
            }
            return response.json();
        })
        .then(data => {
            if (data) {
                document.getElementById("loginForm").classList.add("hidden");
                document.getElementById("logout").classList.remove("hidden");
                document.getElementById("charts").classList.remove("hidden");
                displayData(data);
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

function userChart(data) {

    user = data.data.user[0]
    const level = user.transactions.filter(element => element.type === "level" && !element.path.includes("piscine") && !element.path.includes("rust")).reduce((prevElement, currentElement) => {
        return currentElement.amount > prevElement.amount ? currentElement : prevElement;
    });
    const path = level.path.split("/").reverse()[0]

    document.getElementById("name").innerHTML = (`Welcome, ${user.attrs.firstName} ${user.attrs.lastName}!`);
    document.getElementById("email").innerHTML = (`E-mail: ${user.attrs.email}`);
    document.getElementById("level").innerHTML = (`Level: ${level.amount}`);
    document.getElementById("lastTask").innerHTML = (`Last completed task: ${path}`);

    updateCharts(user);
}

function logoutButton() {
    document.getElementById("loginForm").classList.remove("hidden")
    document.getElementById("logout").classList.add("hidden")
    document.getElementById("charts").classList.add("hidden")
    user = []
    location.reload();
}

function updateCharts(user) {
    createSkillsChart(user);
    designAudits(user);
    designTasks(user);
}

function AuditGraph(audits) {
    var canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'audit-chart');
    var yData = ['done', 'received'];
    yData.forEach((el, i) => {
        var arrow;
        if (el == 'done') {arrow = '\u2191';} else {arrow = '\u2193';}
        yData[i] = `${arrow} ${audits[i]} MB ${el}`;
    });
        
    var bars = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: yData,
            datasets: [{
                data: audits,
                backgroundColor: [
                    'hsl(181, 50%, 53%)',
                    'hsl(59, 100%, 50%)',
                ]
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            aspectRatio: 4,
            plugins: {
                legend: {display: false },
                tooltip: {callbacks: {label: function (context) {return `${audits[context.dataIndex]} MB`;}}}
            },
            scales: {
                x: {display: false},
                y: {position: 'right'}
            },
        }
    });
    return canvas
}

function SkillsGraph(skillMap) {
    var canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'skill-chart');
    var yData = [];
    var xData = [];
    for (const [skill, value] of skillMap.entries()) {
        yData.push(skill);
        xData.push(value)
    }

    var radarChart = new Chart(canvas, {
        type: 'radar',
        data: {
            labels: yData,
            datasets: [{
                data: xData,
                backgroundColor: ['hsl(181, 50%, 53%)']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {display: false },
                tooltip: {callbacks: {label: function (context) {return `${xData[context.dataIndex]} %`;}}},
                filler: {
                    propagate: false
                },
                'samples-filler-analyser': {
                    target: 'chart-analyser'
                }
            },
            scales: {
                x: {display: false},
                y: {position: false},
                r: {
                    min: 0
                },
                
            },
            elements: {
                line: {
                    tension: 0.2
                }
            },
            interaction: {
                intersect: false
            }
        }
    });
    return canvas
}

function XPGraph(xps) {
    let canvas = document.createElement('canvas');
    canvas.setAttribute('id', 'chart');
    var xpData = xps.map(function (entity) {
        return {
            date: new Date(entity.createdAt),
            xp: entity.amount,
            task: entity.path.split('/')[entity.path.split('/').length - 1]
        };
    });
    xpData.sort(function (a, b) {return a.date - b.date;});
    for (let i = 1; i < xpData.length; i++) {xpData[i].xp += xpData[i - 1].xp;}
    var labels = xpData.map(function (data) {return data.date.toLocaleDateString();});
    var data = xpData.map(function (data) {return bytesConversion(data.xp, "KB").amount;});
    var lineChart = new Chart(canvas, {
        type: 'line', 
        data: {
            labels: labels, 
            datasets: [{
                label: 'Your XP',
                data: data,
                fill: false, 
                borderColor: 'hsl(181, 50%, 53%)',
                pointBackgroundColor: 'rgba(255, 255, 255, 0.9)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Amount: ${data[context.dataIndex]} kB\nTask: ${xpData[context.dataIndex].task}`;
                        }
                    }
                }
            }
        }
    });
    return canvas
}

document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();
    loginForm();
});

document.getElementById("logout").addEventListener("click", function (event) {
    event.preventDefault();
    logoutButton();
});

document.getElementById("skillsButton").addEventListener("click", function () {
    showChart("skillChart");
});

document.getElementById("auditButton").addEventListener("click", function () {
    showChart("auditChart");
});

document.getElementById("tasksButton").addEventListener("click", function () {
    showChart("tasksChart");
});

window.addEventListener("resize", updateCharts);

function showChart(chartId) {
    const charts = ["skillChart", "auditChart", "tasksChart"];

    charts.forEach(chart => {
        if (chart === chartId) {
            document.getElementById(chart).style.display = "block";
        } else {
            document.getElementById(chart).style.display = "none";
        }
    });
}

function createSkillsChart(user) {
    let skills = document.getElementById("skillChart")
    let userSkills = document.createElement('h4')
    userSkills.innerHTML = 'User Skills:'
    let skillMap = new Map();
    const progresses = user.progresses
    for (const progress of progresses) {
        for (const parent of progress.object.parents) {
            const attrs = parent.attrs;
            if (attrs && attrs.baseSkills) { 
                const baseSkills = attrs.baseSkills;
                for (const skill in baseSkills) {
                    if (baseSkills.hasOwnProperty(skill)) {
                        const skillValue = baseSkills[skill];
                        if (!skillMap.has(skill) || skillValue > skillMap.get(skill)) {
                            skillMap.set(skill, skillValue);
                        }
                    }
                }
            }
        }
    }
    let skillGraph = document.createElement('div')
    skillGraph.append(SkillsGraph(skillMap))
    skills.append(userSkills, skillGraph)
}

function designAudits(user) {
    let audits = document.getElementById("auditChart");
    let auditRatio = document.createElement('h4')
    auditRatio.innerHTML = `Audits ratio`
    let userAuditRatio = document.createElement('p')
    let auditR = Math.round((user.totalUp / user.totalDown) * 10) / 10
    auditR > 0.4 ? userAuditRatio.innerHTML = `${auditR} Almost perfect!` : userAuditRatio.innerHTML = `${auditR} Be careful, buddy.`
    auditR > 0.4 ? userAuditRatio.style.color = 'hsl(181, 50%, 53%)' : userAuditRatio.style.color = 'hsl(181, 50%, 53%)'
    let auditGraph = document.createElement('div')
    auditGraph.append(AuditGraph([bytesConversion(user.totalUp, "MB").amount, bytesConversion(user.totalDown, "MB").amount]))
    audits.append(auditRatio, auditGraph, userAuditRatio)
}

function designTasks(user) {
    const xps = user.transactions.filter(element => element.type === "xp" && !element.path.includes("piscine") && !element.path.includes("rust"));
    const sum = bytesConversion(xps.reduce((total, element) => total + element.amount, 0));
    let xpCount = document.getElementById("tasksChart")
    let userXP = document.createElement('p')
    userXP.innerHTML = `XP progression`
    let graphCont = document.createElement('div')
    graphCont.className = 'graph-container'
    graphCont.append(XPGraph(xps))
    xpCount.append(userXP, graphCont)
}

function bytesConversion(bytes, size) {
    const sizes = ["Bytes", "KB", "MB"];
    if (bytes === 0) {return "0 Byte";}
    var i = -1
    size != null ? i = sizes.indexOf(size) : i = Math.floor(Math.log(bytes) / Math.log(1000))
    const convertedValue = parseFloat((bytes / Math.pow(1000, i)).toFixed(2));
    return {
        amount: convertedValue,
        size: sizes[i]
    }
}