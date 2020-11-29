const { desktopCapturer, remote } = require("electron");
const { writeFile } = require("fs");
const { dialog, Menu } = remote;

let mediaRecorder;
let recordedChunks = [];

const videoElement = document.querySelector("video");
const startBtn = document.querySelector("#start-btn");
const stopBtn = document.querySelector("#stop-btn");
const selectBtn = document.querySelector("#select-btn");

startBtn.onclick = (event) => {
    mediaRecorder.start();
    startBtn.classList.add("is-danger");
    startBtn.innerText = "Recording";
};

stopBtn.onclick = (event) => {
    mediaRecorder.stop();
    startBtn.classList.remove("is-danger");
    startBtn.innerText = "Start";
};

const selectSource = async (source) => {
    selectBtn.innerText = source.name;

    const constraints = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: source.id
            }
        }
    };

    const videoStream = await navigator.mediaDevices.getUserMedia(constraints);

    videoElement.srcObject = videoStream;
    videoElement.play();

    const options = {
        mimeType: "video/webm;codecs=vp9"
    };

    mediaRecorder = new MediaRecorder(videoStream, options);

    mediaRecorder.ondataavailable = handleDataAvailable;

    mediaRecorder.onstop = handleStop;
};

const handleDataAvailable = (event) => {
    console.log("Video data available");
    recordedChunks = [...recordedChunks, event.data];
};

const handleStop = async (event) => {
    const blob = new Blob(recordedChunks, {
        type: "video/webm;codecs=vp9"
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: "Save Video",
        defaultPath: `vid-${Date.now()}.webm`
    });

    if (filePath) {
        writeFile(filePath, buffer, () => {
            console.log("File saved successfully");
        });
    }
};

const getVideoSource = async () => {
    const inputSources = await desktopCapturer.getSources({
        types: ["window", "screen"],
    });

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map((source) => ({
            label: source.name,
            click: () => selectSource(source),
        }))
    );

    videoOptionsMenu.popup();
};

selectBtn.onclick = getVideoSource;
