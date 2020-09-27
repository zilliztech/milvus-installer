import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Alert from '../../components/alert';
import Button from '../../components/button';

import loader from '../../images/loader.png';
import logo from '../../images/logo.png';
import './index.css';

const getInstallationHintMap = () => {
  const map = {
    checking: 'checking environment',
    checked: 'install Milvus 0.10.2',
    installing: 'installing Milvus 0.10.2',
    installed: 'installed successfully',
  };

  return map;
};

const detectDocker = () => {
  const { ipcRenderer } = window.require('electron');
  ipcRenderer.send('detectDocker', 'start');
};

const InstallationPage = () => {
  const history = useHistory();

  // checking, checked, installing, installed
  const [installStatus, setInstallStatus] = useState('checking');
  const [alertInfo, setAlertInfo] = useState(null);
  const hintMap = getInstallationHintMap();

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
    const { ipcRenderer } = window.require('electron');
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
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.on('dockerInstalled', (event, args) => {
      if (!args) {
        detectMilvus();
      } else {
        setAlertInfo({
          content: 'Please install Docker first',
        });
      }
    });
  };

  const monitorMilvusInstallation = () => {
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.on('milvusInstallation', (event, args) => {
      /* 
        1. check milvus installation
        2. check running containers info
        3. if already started, go to finish page, else go to config page
      */
      if (args) {
        checkWhetherMilvusStarted(ipcRenderer);
      } else {
        setInstallStatus('checked');
      }
    });
  };

  const checkWhetherMilvusStarted = (ipcRenderer) => {
    ipcRenderer.send('checkMilvusStart', 'start');
    monitorMilvusRunningStatus(ipcRenderer);
  };

  const monitorMilvusRunningStatus = (ipcRenderer) => {
    ipcRenderer.on('checkMilvusStartDone', (event, isMilvusStart) => {
      if (isMilvusStart) {
        history.push('/finish');
      } else {
        history.push('/config');
      }
    });
  };

  const monitorInstallationProgress = (ipcRenderer) => {
    ipcRenderer.on('installMilvusProgress', (event, args) => {
      // console.log('progress event', event, 'args', args);
    });

    ipcRenderer.on('installMilvusDone', (event, args) => {
      setInstallStatus('installed');
      history.push('/config');
    });
  };

  const handleInstallError = (ipcRenderer) => {
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
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.send('installMilvus', 'start');

    setInstallStatus('installing');
    monitorInstallationProgress(ipcRenderer);
    handleInstallError(ipcRenderer);
  };

  const onAlertClose = () => {
    setAlertInfo(null);
  };

  return (
    <section className="install-wrapper">
      <Alert
        open={alertInfo !== null}
        onClose={onAlertClose}
        content={alertInfo && alertInfo.content}
      />

      <div>
        {installStatus === 'checked' ? (
          <img className="install-img" src={logo} alt="logo" />
        ) : (
          <img className="install-img-spin" src={loader} alt="loader" />
        )}
      </div>

      <div className="install-content">
        <div>
          <div className="install-title">Milvus Launcher</div>
          <div className="install-hint">{hintMap[installStatus]}</div>
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
