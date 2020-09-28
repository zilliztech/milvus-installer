const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const Docker = require('dockerode');
const isDev = require('electron-is-dev');
const path = require('path');
const os = require('os');
const fs = require('fs');

const childProcess = require('child_process');

const getTagInfo = () => {
  const dir = path.join(process.cwd(), 'public/repo_tag.json');
  const tagInfo = fs.readFileSync(dir, 'utf8');
  return JSON.parse(tagInfo);
};

const repoTag = getTagInfo().current;
const version = repoTag.includes('cpu')
  ? getTagInfo().version
  : `${getTagInfo().version} (GPU)`;

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

  // win.webContents.openDevTools();
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

ipcMain.on('stopApp', (event, args) => {
  app.exit(0);
});

ipcMain.on('getMilvusVersion', (event, args) => {
  event.returnValue = version;
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
    process.platform === 'win32' ? 'where docker' : 'which docker';
  childProcess.exec(command, (err, stdout) => {
    event.sender.send('dockerInstalled', !!err);
  });
});

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

const getProgress = (layers) => {
  const info = layers.reduce(
    (acc, cur) => {
      acc.current += Number(cur.current);
      acc.total += Number(cur.total);
      return acc;
    },
    { current: 0, total: 0 }
  );

  const percent =
    Object.keys(info).length > 0
      ? Math.floor((info.current / info.total) * 100)
      : 0;

  return percent;
};

//Receive and reply to asynchronous message
ipcMain.on('installMilvus', (event, args) => {
  docker.pull(repoTag, function (err, stream) {
    if (err) {
      const errInfo = JSON.stringify(err, null, 2);
      event.sender.send('installMilvusError', errInfo);
    }

    docker.modem.followProgress(stream, onFinished, onProgress);
    let layers = [];

    function onFinished(err, output) {
      event.sender.send('installMilvusDone', true);
    }
    function onProgress(detail) {
      if (detail.status === 'Downloading') {
        const existedLayers = layers.map((layer) => layer.id);
        const newLayer = {
          id: detail.id,
          current: detail.progressDetail.current,
          total: detail.progressDetail.total,
        };
        if (!existedLayers.includes(detail.id)) {
          layers = [...layers, newLayer];
        } else {
          layers = [
            ...layers.filter((layer) => layer.id !== detail.id),
            newLayer,
          ];
        }
      }

      const progress = getProgress(layers);

      event && event.sender.send('installMilvusProgress', progress);
    }
  });
});

ipcMain.on('startMilvus', (event, createConfig) => {
  docker.createContainer(
    {
      Image: repoTag,
      ...createConfig,
    },
    (err, container) => {
      if (!!err) {
        const errInfo = JSON.stringify(err, null, 2);
        event.sender.send('startMilvusError', errInfo);
      } else {
        container.start({}, (err, data) => {
          if (!!err) {
            const errInfo = JSON.stringify(err, null, 2);
            event.sender.send('startMilvusError', errInfo);
          } else {
            event.sender.send('startMilvusDone', true);
          }
        });
      }
    }
  );
});

ipcMain.on('getContainerInfo', (event, args) => {
  docker.listContainers((err, containers) => {
    containers.forEach((info) => {
      if (info.Image === repoTag) {
        event.sender.send('containerInfo', info);
      }
    });
  });
});

ipcMain.on('stopMilvus', (event, id) => {
  const container = docker.getContainer(id);
  container.stop(() => {
    container.remove();
    app.exit(0);
  });
});

ipcMain.on('checkMilvusStart', (event, args) => {
  docker.listContainers((err, containers) => {
    if (!!err) {
      const errInfo = JSON.stringify(errInfo, null, 2);
      event.sender.send('checkMilvusError', errInfo);
    } else {
      docker.listContainers((err, containers) => {
        if (!!err) {
          const errInfo = JSON.stringify(errInfo, null, 2);
        }
        const isMilvusRunning = containers.some(
          (container) => container.Image === repoTag
        );

        event.sender.send('checkMilvusStartDone', isMilvusRunning);
      });
    }
  });
});
