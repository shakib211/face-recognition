const imageUpload = document.getElementById("imageUpload");
const cameraID = document.getElementById("video");
const canvasID = document.getElementById("canvas");
let ctx = canvasID.getContext("2d");
let faceMatcher;
let enabled = false;
let iCanvas = document.getElementById("show");
let image = document.getElementById("cImage");

Promise.all([
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.ssdMobilenetv1.loadFromUri("/models")
]).then(getCamera);

async function getCamera() {
    console.log("1");
    const labeledFaceDescriptors = await loadLabeledImages();
    faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
    console.log("faceMatcher", faceMatcher);

    navigator.mediaDevices
        .getUserMedia({
            video: { width: 600, height: 400 },
            audio: false
        })
        .then((stream) => {
            cameraID.srcObject = stream;
        });

    cameraID.addEventListener("loadeddata", async () => {
        model = await blazeface.load();
        setInterval(() => {
            !enabled && detactFace();
        }, 40);
    });
}

const detactFace = async () => {
    // const prediction = await model.estimateFaces(video, false);
    enabled = true;
    await ctx.drawImage(cameraID, 0, 0, 600, 400);
    var dataURL = await canvasID.toDataURL("image/png");
    const image = new Image();
    image.src = dataURL;
    image.onload = function() {
        drawImage(image);
    }
    await start(image);

    // prediction.forEach((pred) => {
    //     ctx.beginPath();
    //     ctx.lineWidth = "4";
    //     ctx.strokeStyle = "blue";
    //     ctx.rect(
    //         pred.topLeft[0],
    //         pred.topLeft[1],
    //         pred.bottomRight[0] - pred.topLeft[0],
    //         pred.bottomRight[1] - pred.topLeft[1]
    //     );
    //     ctx.stroke();
    // });
};

function drawImage(img) {
    let ctx = image.getContext('2d');

    image.width = img.width;
    image.height = img.height;

    ctx.drawImage(img, 0, 0);       // DRAW THE IMAGE TO THE CANVAS.
}

function updateCanvas(canva) {
    // iCanvas.style.background='url('+img.toDataURL()+')'
    console.log(img.toDataURL)

    // let ctx = canva.getContext('2d');

    // image.width = img.width;
    // image.height = img.height;

    // ctx.drawImage(canva, 0, 0);
}
let lastCanvas;
async function start(image) {
    
    let canvas;
    if (canvas) canvas.remove();

    if (image) {
        canvas = faceapi.createCanvas(image);
        if(lastCanvas) {
            iCanvas.removeChild(lastCanvas)
        }
        lastCanvas = canvas;
        iCanvas.appendChild(canvas);

        const displaySize = { width: 600, height: 400 };
        faceapi.matchDimensions(canvas, displaySize);
        const detections = await faceapi
            .detectAllFaces(image)
            .withFaceLandmarks()
            .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize
        );

        const results = resizedDetections.map((d) =>
            faceMatcher.findBestMatch(d.descriptor)
        );
        // console.log("results", results);
        await results.forEach(async (result, i) => {
            const box = await resizedDetections[i].detection.box;
            const drawBox = await new faceapi.draw.DrawBox(box, {
                label: result.toString()
            });
            await drawBox.draw(canvas);
        });

        enabled = false;
    }
}

async function loadLabeledImages() {
    const labels = [
        "Black Widow",
        "Captain America",
        "Captain Marvel",
        "Hawkeye",
        "Jim Rhodes",
        "Thor",
        "Tony Stark",
        "Shakib"
    ];
    return Promise.all(
        await labels.map(async (label) => {
            const descriptions = [];
            for (let i = 1; i <= 2; i++) {
                const img = await faceapi.fetchImage(
                    `./labeled_images/${label}/${i}.jpg`
                );

                const detections = await faceapi
                    .detectSingleFace(img)
                    .withFaceLandmarks()
                    .withFaceDescriptor();
                descriptions.push(detections.descriptor);
            }

            return await new faceapi.LabeledFaceDescriptors(
                label,
                descriptions
            );
        })
    );
}
