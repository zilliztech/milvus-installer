import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
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
}

const InstallationPage = () => {
  const history = useHistory();

  // checking, checked, installing, installed
  const [installStatus, setInstallStatus] = useState('checking');
  const hintMap = getInstallationHintMap();

  const detectNetwork = () => {
    // use baidu to test network
    fetch('https://www.baidu.com', {
      mode: 'no-cors',
    })
      .then(() => {
        detectDocker()
        monitorDockerInstallation()
      })
      .catch((e) => {
        alert('There is something wrong with your Internet');
      });
  };

  const detectMilvus = () => {
    const { ipcRenderer } = window.require('electron')
    ipcRenderer.send('detectMilvus', 'start')

    monitorMilvusInstallation()
  }

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
        detectMilvus()
      } else {
        alert('Please install Docker first')
      }
    })
  }

  const monitorMilvusInstallation = () => {
    const { ipcRenderer } = window.require('electron')
    ipcRenderer.on('milvusInstallation', (event, args) => {
      // milvus already installed, go to config page
      if (args) {
        history.push('/config');
      } else {
        setInstallStatus('checked')
      }
    })
  }

  const monitorInstallationProgress = (ipcRenderer) => {
    ipcRenderer.on('installMilvusProgress', (event, args) => {
      console.log('progress event', event, 'args', args);
    });

    ipcRenderer.on('installMilvusDone', (event, args) => {
      setInstallStatus('installed');
      history.push('/config');
    });
  };

  const onInstallButtonClick = () => {
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.send('installMilvus', 'start');

    setInstallStatus('installing');
    monitorInstallationProgress(ipcRenderer);
  };

  return (
    <section className="install-wrapper">
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

        <button
          className="install-button"
          disabled={installStatus !== 'checked'}
          onClick={onInstallButtonClick}
        >
          {installStatus === 'installing' ? 'installing' : 'install'}
        </button>
      </div>
    </section>
  );
};

export default InstallationPage;
