import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Alert from '../../components/alert';
import Button from '../../components/button';

import loader from '../../images/loader.png';
import logo from '../../images/logo.png';
import './index.css';

const { ipcRenderer } = window.require('electron');

const getInstallationHintMap = (version) => {
  const map = {
    checking: 'checking environment',
    checked: `install ${version}`,
    installing: `installing ${version}`,
    installed: 'installed successfully',
  };

  return map;
};

const detectDocker = () => {
  ipcRenderer.send('detectDocker', 'start');
};

const InstallationPage = () => {
  const history = useHistory();

  // checking, checked, installing, installed
  const [installStatus, setInstallStatus] = useState('checking');
  const [alertInfo, setAlertInfo] = useState(null);
  const [percent, setPercent] = useState(0);

  const version = ipcRenderer.sendSync('getMilvusVersion', 'start');
  const hintMap = getInstallationHintMap(version);

  const detectNetwork = () => {
    // use baidu to test network
    fetch('https://www.baidu.com', {
      mode: 'no-cors',
    })
      .then(() => {
        detectDocker();
        monitorDockerInstallation();
      })
      .catch((e) => {
        setAlertInfo({
          content: 'There is something wrong with your Internet',
        });
      });
  };

  const detectMilvus = () => {
    ipcRenderer.send('detectMilvus', 'start');

    monitorMilvusInstallation();
  };

  useEffect(() => {
    detectNetwork();
    window.addEventListener('offline', detectNetwork);
    window.addEventListener('online', detectNetwork);

    return () => {
      window.removeEventListener('offline', detectNetwork);
      window.removeEventListener('online', detectNetwork);
    };
    // eslint-disable-next-line
  }, []);

  const monitorDockerInstallation = () => {
    ipcRenderer.on('dockerInfo', (event, error) => {
      if (!error) {
        detectMilvus();
      } else {
        setAlertInfo({
          content: 'Please install and run Docker first',
        });
      }
    });
  };

  const monitorMilvusInstallation = () => {
    ipcRenderer.on('milvusInstallation', (event, args) => {
      /* 
        1. check milvus installation
        2. check running containers info
        3. if already started, go to finish page, else go to config page
      */
      if (args) {
        checkWhetherMilvusStarted();
      } else {
        setInstallStatus('checked');
      }
    });
  };

  const checkWhetherMilvusStarted = () => {
    ipcRenderer.send('checkMilvusStart', 'start');
    monitorMilvusRunningStatus();
  };

  const monitorMilvusRunningStatus = () => {
    ipcRenderer.on('checkMilvusStartDone', (event, isMilvusStart) => {
      if (isMilvusStart) {
        history.push('/finish');
      } else {
        history.push('/config');
      }
    });
  };

  const monitorInstallationProgress = () => {
    ipcRenderer.on('installMilvusProgress', (event, progress) => {
      if (!Number.isNaN(progress) && percent !== progress) {
        setPercent(progress);
      }
    });

    ipcRenderer.on('installMilvusDone', (event, args) => {
      setInstallStatus('installed');
      history.push('/config');
    });
  };

  const handleInstallError = () => {
    ipcRenderer.on('installMilvusError', (event, args) => {
      history.push({
        pathname: '/error',
        state: {
          info: args,
        },
      });
    });
  };

  const onInstallButtonClick = () => {
    setInstallStatus('installing');

    ipcRenderer.send('installMilvus', 'start');

    monitorInstallationProgress();
    handleInstallError();
  };

  const onAlertClose = () => {
    setAlertInfo(null);
    ipcRenderer.send('stopApp', 'start');
  };

  return (
    <section className="install-wrapper">
      <Alert
        open={alertInfo !== null}
        onClose={onAlertClose}
        content={alertInfo && alertInfo.content}
      />

      <div className="install-progress">
        {installStatus === 'checked' ? (
          <img className="install-img" src={logo} alt="logo" />
        ) : (
          <img className="install-img-spin" src={loader} alt="loader" />
        )}

        {percent !== 0 && <div className="install-percent">{percent}%</div>}
      </div>

      <div className="install-content">
        <div>
          <div className="install-title">Milvus Launcher</div>
          <div className="install-hint">
            {hintMap && hintMap[installStatus]}
          </div>
        </div>

        <Button
          label={installStatus === 'installing' ? 'installing' : 'install'}
          onButtonClick={onInstallButtonClick}
          disabled={installStatus !== 'checked'}
        />
      </div>
    </section>
  );
};

export default InstallationPage;
