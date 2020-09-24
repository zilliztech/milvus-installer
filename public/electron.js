const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const Docker = require('dockerode');
const isDev = require('electron-is-dev');
const path = require('path');
const os = require('os');
const fs = require('fs');

const childProcess = require('child_process');

const socketPath =
  process.platform === 'win32'
    ? '//./pipe/docker_engine'
    : '/var/run/docker.sock';

const docker = new Docker({ socketPath });

function createWindow() {
  // create window
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    },
    frame: true,
    // titleBarStyle: 'hidden'
  });

  // win.show();

  win.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('perform-action', (event, ...args) => {
  // ... do something on behalf of the renderer ...
  console.log('perform-action', event, ...args);
});

// Receive and reply to synchronous message
ipcMain.on('helloSync', (event, args) => {
  console.log('helloSync', event, ...args);
  //do something with args
  event.returnValue = 'Hi, sync reply';
});

const moveFileToConfFolder = (dir) => {
  const sourcePath = path.join(process.cwd(), 'public/server_config.yaml');
  const targetPath = path.join(dir, 'server_config.yaml');

  try {
    if (!fs.existsSync(targetPath)) {
      fs.copyFile(sourcePath, targetPath, (err) => {
        if (err) {
          throw err;
        }
      });
    }
  } catch (err) {
    throw err;
  }
};

ipcMain.on('openFolder', (event, args) => {
  const { type } = args;
  const basicPath = os.homedir();
  const defaultPath = path.join(basicPath, type);

  const dialogOption = {
    properties: ['openDirectory'],
    defaultPath,
  };

  dialog
    .showOpenDialog(dialogOption)
    .then((result) => {
      const { filePaths } = result;
      if (filePaths.length > 0) {
        const [dir] = filePaths;

        if (type === 'milvus/conf') {
          moveFileToConfFolder(dir);
        }

        const newConfig = {
          ...args,
          value: dir,
        };
        event.sender.send('dirSelectDone', newConfig);
      }
    })
    .catch((err) => {
      const error = JSON.stringify(err, null, 2);
      event.sender.send('dirSelectError', error);
    });
});

ipcMain.on('detectDocker', (event, args) => {
  const command =
    process.platform === 'win32' ? 'where docker' : 'type -p docker';
  childProcess.exec(command, (err, stdout) => {
    event.sender.send('dockerInstalled', !!err);
  });
});

const repoTag = 'milvusdb/milvus:0.10.2-cpu-d081520-8a2393';

ipcMain.on('detectMilvus', (event, args) => {
  docker
    .listImages()
    .then((data) => {
      const milvus = data.find((item) => item.RepoTags.includes(repoTag));
      event.sender.send('milvusInstallation', !!milvus);
    })
    .catch((err) => {
      event.sender.send('milvusInstallation', false);
      throw err;
    });
});

//Receive and reply to asynchronous message
ipcMain.on('installMilvus', (event, args) => {
  docker.pull(repoTag, function (err, stream) {
    if (err) {
      const errInfo = JSON.stringify(err, null, 2);
      event.sender.send('installMilvusError', errInfo);
    }

    event.sender.send('installMilvusProgress', 'start');
    docker.modem.followProgress(stream, onFinished, onProgress);

    function onFinished(err, output) {
      event.sender.send('installMilvusDone', true);
    }
    function onProgress(evt) {
      event && event.sender.send('installMilvusProgress', evt);
    }
  });
});

ipcMain.on('startMilvus', (event, createConfig) => {
  docker.run(
    repoTag,
    [],
    process.stdout,
    createConfig,
    (err, data, container) => {
      if (!!err) {
        const errInfo = JSON.stringify(err, null, 2);
        event.sender.send('startMilvusError', errInfo);
      } else {
        event.sender.send('startMilvusDone', true);
      }
    }
  );
});
ipcMain.on('checkMilvusStart', (event, args) => {});
