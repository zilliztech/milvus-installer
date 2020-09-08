const { app, BrowserWindow, ipcMain } = require("electron");
const Docker = require("dockerode");
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

function createWindow() {
  // create window
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
    },
    frame: true,
    // titleBarStyle: 'hidden'
  });

  // win.show();

  win.loadFile("index.html");
  // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle("perform-action", (event, ...args) => {
  // ... do something on behalf of the renderer ...
  console.log("perform-action", event, ...args);
});

//Receive and reply to synchronous message
ipcMain.on("helloSync", (event, args) => {
  console.log("helloSync", event, ...args);
  //do something with args
  event.returnValue = "Hi, sync reply";
});

const repoTag = "milvusdb/milvus:0.10.2-cpu-d081520-8a2393";

//Receive and reply to asynchronous message
ipcMain.on("installMilvus", (event, args) => {
  docker.pull(repoTag, function (err, stream) {
    event.sender.send("installMilvusProgress", "start");
    docker.modem.followProgress(stream, onFinished, onProgress);

    function onFinished(err, output) {
      console.log("on finished", output);
      event.sender.send("installMilvusDone", true);
    }
    function onProgress(evt) {
      console.log("on progress", evt.progress);
      event && event.sender.send("installMilvusProgress", evt.progress);
    }
  });
});
