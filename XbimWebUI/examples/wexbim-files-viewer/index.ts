import { Viewer, Product, State, ViewType, RenderingMode, ProductType, NavigationCube, ViewerInteractionEvent } from '../..';
import { Grid } from '../../src/plugins/Grid/grid';
import { vec3 } from 'gl-matrix';
import { Snapshot, Viewpoint } from '../../src/bcf';
import { LoaderOverlay } from '../../src/plugins/LoaderOverlay/loader-overlay';
import { PlaySpaces } from '../featured-viewer/play-spaces';

var models: any[] = [];

var viewer = new Viewer("xBIM-viewer");
viewer.background = [0, 0, 0, 0];

var grid = new Grid();
grid.zFactor = 20;
viewer.addPlugin(grid);

var cube = new NavigationCube();
cube.ratio = 0.05;
cube.passiveAlpha = cube.activeAlpha = 0.85;
viewer.addPlugin(cube);

var loader = new LoaderOverlay();
viewer.addPlugin(loader);

viewer.on("error", (arg) => {
    var container = viewer.canvas.parentNode as HTMLElement;
    if (container) {
        //preppend error report
        container.innerHTML = "<pre style='color:red;'>" + arg.message + "</pre>" + container.innerHTML;
    }
});
viewer.on("pick", (arg) => {
    if (arg.id) {
        console.log(`Selected id: ${arg.id} model ${arg.model}`);
        if (arg.xyz != null) {
            const wcs = viewer.getCurrentWcs();
            const point = vec3.add(vec3.create(), wcs, arg.xyz);
            console.log(point);
        }
    }
}
);
viewer.on("loaded", (evt) => {
    models.push({ id: evt.model, name: evt.tag, stopped: false });
    viewer.show(ViewType.DEFAULT, undefined, undefined, false);
    loader.hide();
    refreshModelsPanel();
});
viewer.on("fps", (fps) => {
    var span = document.getElementById("fps");
    if (span) {
        span.innerHTML = fps.toString();
    }
});

let input = document.getElementById('input') as HTMLInputElement;
input.addEventListener('change', () => {
    if (!input.files || input.files.length === 0) {
        return;
    }
    

    for (let i = 0; i < input.files.length; i++) {
        // UPLOAD TO SERVER AND WAIT FOR THE XBIM FILE HERE
        const file = input.files[i];
        //if file type is .IFC
        if (file.name.split('.').pop().toLowerCase() == 'ifc') {
            console.log("ifc file");
            console.log(file.name);
            fetch('http://localhost:9001/upload', {
                headers: {
                    'Content-Type': 'application/octet-stream'
                },
                method: 'POST',
                body: file
            }).then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.blob(); // Convert the response to a Blob
            })
            .then(blob => {
                console.log('File received as Blob:', blob);
        
                // Create an Object URL for the Blob
                const url = URL.createObjectURL(blob);
        
                // Pass the URL or Blob directly to the viewer
                viewer.load(url, file.name); // Assuming viewer.load accepts a URL and filename
                viewer.start(); // Start rendering the viewer
            })
                .catch(error => console.error('Error:', error));
        }

        //if file type is .wexbim
        else if (file.name.split('.').pop().toLowerCase() == 'wexbim') {
            console.log("wexbim file");
            console.log(file.name);
            loader.show();
            viewer.load(file, file.name);
            viewer.start();
        }else{
            console.log("YOUR FILETYPE SUCKS ASS");
        }
        /*loader.show();
        viewer.load(file, file.name);
        viewer.start();*/
    }

    input.value = '';
});

let aiPrompt = document.getElementById('aiPrompt') as HTMLInputElement;
let aiButton = document.getElementById('aiButton') as HTMLButtonElement;

aiButton.addEventListener('click', () => {
    const prompt = aiPrompt.value;
    if (prompt) {
        console.log(`AI Prompt: ${prompt}`);
        // Add your AI interaction logic here
        //send post request to /aiprompt
        fetch('http://localhost:9001/aiprompt', {
            headers: {
            'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({ prompt })
        })
        .then(response => response.json())
        .then(data => {
            console.log('AI Response:', data);
            let message = data.message;
            //replace the innerhtml of id="aip" with message.
            //get the id="aip" element
            let aip = document.getElementById('aip') as HTMLParagraphElement;
            //set the innerhtml of the element to message
            aip.innerHTML = message;
            // Handle the AI response here
        })
        .catch(error => console.error('Error:', error));
    }
});

//listener for addsauna button
let addSaunaButton = document.getElementById('addSauna') as HTMLButtonElement;

addSaunaButton.addEventListener('click', () => {
    models.forEach((m) => {
        unload(m.id);
    });
    console.log('Adding sauna');
    fetch('http://localhost:9001/addsauna', {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob(); // Convert the response to a Blob 
    })
    .then(blob => {
        console.log('File received as Blob:', blob);

        // Create an Object URL for the Blob
        const url = URL.createObjectURL(blob);
        //unload all models
        
        // Pass the URL or Blob directly to the viewer
        viewer.load(url, "SAUNA!!!"); // Assuming viewer.load accepts a URL and filename
        viewer.start(); // Start rendering the viewer
    })
        .catch(error => console.error('Error:', error));
});

//delete sauna button
let deleteSaunaButton = document.getElementById('deleteAllSaunas') as HTMLButtonElement;
deleteSaunaButton.addEventListener('click', () => {
    models.forEach((m) => {
        unload(m.id);
    });
    console.log('Deleting all saunas');
    fetch('http://localhost:9001/deletesaunas', {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.blob(); // Convert the response to a Blob 
    })
    .then(blob => {
        console.log('File received as Blob:', blob);

        // Create an Object URL for the Blob
        const url = URL.createObjectURL(blob);
        //unload all models
        
        // Pass the URL or Blob directly to the viewer
        viewer.load(url, "SAUNA!!!"); // Assuming viewer.load accepts a URL and filename
        viewer.start(); // Start rendering the viewer
    })
        .catch(error => console.error('Error:', error));


});

document.addEventListener('keydown', keyEvent => {
    if (keyEvent.ctrlKey && keyEvent.key == 'o') {
        keyEvent.preventDefault();
        input.click();
    }
});

function refreshModelsPanel() {
    var html = "<table>";
    models.forEach((m) => {
        html += "<tr>";
        html += `<td>${m.name}</td>`;
        html += "<td><button onclick='unload(" + m.id + ")'> Unload </button></td>";
        if (m.stopped) {
            html += "<td> <button onclick='start(" + m.id + ")'> Start </button> </td>";
        } else {
            html += "<td> <button onclick='stopModel(" + m.id + ")'> Stop </button> </td>";
        }
        html += "</tr>";
    });
    html += "</table>";
    let modelsDiv = document.getElementById('models') as HTMLDivElement;
    modelsDiv.innerHTML = html;
}
function unload(id: number) {
    viewer.unload(id);
    models = models.filter((m) => m.id !== id);
    refreshModelsPanel();
    viewer.draw();
}
function stop(id: number) {
    viewer.stop(id);
    var model = models.filter((m) => m.id === id).pop();
    model.stopped = true;
    refreshModelsPanel();
}

function start(id: number) {
    viewer.start(id);
    var model = models.filter((m) => m.id === id).pop();
    model.stopped = false;
    refreshModelsPanel();
}

window['unload'] = unload;
window['stopModel'] = stop;
window['start'] = start;

window['viewer'] = viewer;
window['State'] = State;
window['ProductType'] = ProductType;

window['Viewpoint'] = Viewpoint;

window['a2'] = () => {
    const run = () => {
        var err = Viewer.check();
        if (err.noErrors && err.noWarnings) {
            console.log('All checks passed');
        } else {
            console.warn(err.errors);
            console.error(err.errors);
        }
    }
    console.log(run);
    run();
}

window['a3'] = () => {
    const run = () => {
        console.log("Current WCS:", viewer.getCurrentWcs());
        viewer.activeHandles.forEach(h => console.log(`Handle ${h.id} WCS: ${h.wcs}`));
    }
    console.log(run);
    run();
}

let selected: ViewerInteractionEvent = null;
const selector = (args: ViewerInteractionEvent) => {
    if (selected != null)
        viewer.removeState(State.HIGHLIGHTED, [selected.id], selected.model);
    viewer.addState(State.HIGHLIGHTED, [args.id], args.model);
    selected = args;
}
window['selector'] = selector;

window['a4'] = () => {
    const run = () => {
        viewer.highlightingColour = [245, 230, 66, 255];
        viewer.on('pick', selector);
    }
    console.log(run);
    run();
}

window['a5'] = () => {
    const run = () => {
        viewer.xrayColour = [245, 0, 0, 20];
        viewer.renderingMode = RenderingMode.XRAY_ULTRA;
    }
    console.log(run);
    run();
}

window['a6'] = () => {
    const run = () => {
        const lower = [0, 255, 0, 255];
        const upper = [255, 0, 0, 255];

        for (let i = 0; i < 200; i++) {
            const R = lower[0] + (upper[0] - lower[0]) / 200.0
            const G = lower[1] + (upper[1] - lower[1]) / 200.0
            const B = lower[2] + (upper[2] - lower[2]) / 200.0
            const A = lower[3] + (upper[3] - lower[3]) / 200.0
            viewer.defineStyle(i, [R, G, B, A]);
        }

        viewer.setStyle(0, ProductType.IFCWALL);
    }
    console.log(run);
    run();
}

const hidden: ViewerInteractionEvent[] = [];
const hider = (args: ViewerInteractionEvent) => {
    if (args != null && args.id != null) {
        viewer.setState(State.HIDDEN, [args.id], args.model);
        hidden.push(args)
    }
}
window['hider'] = hider;
window['a7'] = () => {
    const run = () => {
        viewer.on('pick', hider);
    }
    console.log(run);
    run();
}

window['a8'] = () => {
    const run = () => {
        viewer.setState(State.HIGHLIGHTED, ProductType.IFCDOOR);
        viewer.setState(State.XRAYVISIBLE, ProductType.IFCWINDOW);
        viewer.renderingMode = RenderingMode.XRAY_ULTRA;
    }
    console.log(run);
    run();
}

const zoomer = (args: ViewerInteractionEvent) => {
    if (args != null && args.id != null) {
        viewer.zoomTo([args]);
    }
}
window['zoomer'] = zoomer;
window['a9'] = () => {
    const run = () => {
        viewer.on('pick', zoomer);
    }
    console.log(run);
    run();
}

window['a10'] = () => {
    const run = () => {
        viewer.startRotation();
    }
    console.log(run);
    run();
}

window['a11'] = () => {
    const run = () => {
        let points: vec3[] = [];
        const m = (args: ViewerInteractionEvent) => {
            if (args == null || args.xyz == null) {
                return;
            }
            points.push(args.xyz);
            if (points.length === 2) {
                const length = vec3.dist(points[0], points[1]);
                console.log(`Measured distance: ${length}`);
                viewer.off('pick', m);
                points = [];
            }
        };
        viewer.on('pick', m);
    }
    console.log(run);
    run();
}

window['a12'] = () => {
    const run = () => {
        const points: vec3[] = [];
        const m = (args: ViewerInteractionEvent) => {
            if (args == null || args.xyz == null) {
                return;
            }
            points.push(args.xyz);
            if (points.length === 2) {
                viewer.off('pick', m);

                const top = Math.max(points[0][2], points[1][2]);
                const bottom = Math.min(points[0][2], points[1][2]);
                const offset = viewer.getCurrentWcs()[2]

                viewer.setClippingPlaneA([0, 0, -1, top + offset])
                viewer.setClippingPlaneB([0, 0, 1, -(bottom + offset)])
            }
        };
        viewer.on('pick', m);
    }
    console.log(run);
    run();
}

window['a13'] = () => {
    const run = () => {
        const points: vec3[] = [];
        const getExtreme = (variant: 'min' | 'max', index: number) => {
            const values = points.map(p => p[index]);
            switch (variant) {
                case 'min': return Math.min(...values);
                case 'max': return Math.max(...values);
            }
        };
        const m = (args: ViewerInteractionEvent) => {
            if (args == null || args.xyz == null) {
                return;
            }
            points.push(args.xyz);

            if (points.length === 4) {
                viewer.show(ViewType.FRONT);
            }

            if (points.length === 6) {
                viewer.off('pick', m);

                const wcs = viewer.getCurrentWcs();
                const top = getExtreme('max', 2);
                const bottom = getExtreme('min', 2);
                const right = getExtreme('max', 0);
                const left = getExtreme('min', 0);
                const front = getExtreme('min', 1);
                const back = getExtreme('max', 1);

                viewer.sectionBox.location = vec3.fromValues((left + right) / 2.0 + wcs[0], (front + back) / 2.0 + wcs[1], (top + bottom) / 2.0 + wcs[2]);
                viewer.sectionBox.lengthX = right - left;
                viewer.sectionBox.lengthY = back - front;
                viewer.sectionBox.lengthZ = top - bottom;
                viewer.show(ViewType.DEFAULT);
            }
        };
        viewer.on('pick', m);
        viewer.show(ViewType.TOP);
    }
    console.log(run);
    run();
}

window['a14'] = () => {
    const run = () => {
        const isolate = (args: ViewerInteractionEvent) => {
            viewer.isolate([args.id], args.model);
            viewer.show(ViewType.DEFAULT);
            viewer.off('pick', isolate);
        }
        viewer.on('pick', isolate);
    }
    console.log(run);
    run();
}

window['a15'] = () => {
    const run = () => {
        cube.stopped = true;
        const view = Viewpoint.GetViewpoint(viewer, null);
        cube.stopped = false;

        console.log(view);

        var img = document.createElement('img');
        img.src = 'data:image/png;base64,' + view.snapshot.snapshot_data;
        img.style.width = "25%";
        img.style.position = "absolute";
        img.style.bottom = "0";
        img.style.left = "0";
        img.style.cursor = "pointer";

        document.body.appendChild(img);
        img.onclick = () => {
            Viewpoint.SetViewpoint(viewer, view, null, 1000);
            document.body.removeChild(img);
        };

    }
    console.log(run);
    run();
}

window['track'] = (id: number, model: number) => {
    var cube = document.createElement('div');
    document.body.append(cube);
    cube.style.backgroundColor = 'red';
    cube.style.position = 'absolute';
    cube.style.width = '30px';
    cube.style.height = '30px';
    cube.style.borderRadius = '30px';
    cube.style.left = `0px`;
    cube.style.top = `0px`;

    const adjust = () => {
        const c = viewer.getHTMLPositionOfProductCentroid(id, model);
        cube.style.left = `${c[0] - 15}px`;
        cube.style.top = `${c[1] - 15}px`;
    };

    viewer.on('pointermove', adjust);
    viewer.on('wheel', adjust);
    adjust();
}

window['playSpaces'] = () => {
    const player = new PlaySpaces(viewer);
    player.play();
}