import React, { useEffect, useState } from 'react';
import './index.css';
import logo from '../../images/logo.png';
import Button from '../../components/button';

const FinishPage = () => {
  const { ipcRenderer } = window.require('electron');
  const [url, setUrl] = useState('');
  const [containerId, setContainerId] = useState('');
  const versionInfo = ipcRenderer.sendSync('getMilvusVersion', 'start');

  useEffect(() => {
    ipcRenderer.send('getContainerInfo', 'start');

    getContainerInfo();
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
      const url = `${IPAddress}:${port.PublicPort}`;
      setContainerId(Id);
      setUrl(url);
    });
  };

  const onStopMilvusClick = () => {
    ipcRenderer.send('stopMilvus', containerId);
  };

  return (
    <section className="finish-wrapper">
      <img className="finish-img" src={logo} alt="logo" />
      <div className="finish-content">
        <div>{versionInfo}</div>
        <div>is running at</div>
        <div>{url}</div>

        <Button label="stop Milvus" onButtonClick={onStopMilvusClick} />
      </div>
    </section>
  );
};

export default FinishPage;
