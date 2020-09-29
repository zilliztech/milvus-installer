import React, { useEffect, useState } from 'react';
import './index.css';
import logo from '../../images/logo.png';
import Button from '../../components/button';
import { useHistory } from 'react-router-dom';
import Alert from '../../components/alert';

const FinishPage = () => {
  const { ipcRenderer } = window.require('electron');
  const [url, setUrl] = useState('');
  const [containerId, setContainerId] = useState('');
  const [alertInfo, setAlertInfo] = useState(null);
  const history = useHistory();
  const versionInfo = ipcRenderer.sendSync('getMilvusVersion', 'start');

  useEffect(() => {
    ipcRenderer.send('getContainerInfo', 'start');

    getContainerInfo();

    const interval = setInterval(() => {
      ipcRenderer.send('checkMilvusStart');
    }, 3000);

    monitorMilvusRunning();

    return () => {
      clearInterval(interval);
    };
    // eslint-disable-next-line
  }, []);

  const getContainerInfo = () => {
    ipcRenderer.on('containerInfo', (event, container) => {
      const {
        Id,
        NetworkSettings: {
          Networks: {
            bridge: { IPAddress },
          },
        },
        Ports,
      } = container;
      const port = Ports.find((port) => port.PrivatePort === 19530);
      const url = `${IPAddress}:${port.PublicPort || port.PrivatePort}`;
      setContainerId(Id);
      setUrl(url);
    });
  };

  const onStopMilvusClick = () => {
    ipcRenderer.send('stopMilvus', containerId);
  };

  const monitorMilvusRunning = () => {
    ipcRenderer.on('checkMilvusStartDone', (event, isRunning) => {
      if (!isRunning) {
        setAlertInfo({
          content: 'Container has been stopped, please restart it',
        });
      }
    });
  };

  const onAlertClose = () => {
    setAlertInfo(null);
    history.push('/config');
  };

  return (
    <section className="finish-wrapper">
      <Alert
        open={alertInfo !== null}
        onClose={onAlertClose}
        content={alertInfo && alertInfo.content}
      />
      <img className="finish-img" src={logo} alt="logo" />
      <div className="finish-content">
        <div>{versionInfo}</div>
        <div>is running at</div>
        <div>{url}</div>

        <Button label="Stop Milvus" onButtonClick={onStopMilvusClick} />
      </div>
    </section>
  );
};

export default FinishPage;
