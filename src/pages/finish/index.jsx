import React, { useEffect, useState } from 'react';
import './index.css';
import logo from '../../images/logo.png';
import Button from '../../components/button';

const FinishPage = () => {
  const versionInfo = 'Milvus 0.10.2';
  const [url, setUrl] = useState('');
  const [containerId, setContainerId] = useState('');

  useEffect(() => {
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.send('getContainerInfo', 'start');

    getContainerInfo(ipcRenderer);
  }, []);

  const getContainerInfo = (ipcRenderer) => {
    ipcRenderer.on('containerInfo', (event, container) => {
      const {
        Id,
        NetworkSettings: {
          Networks: {
            bridge: { IPAddress },
          },
        },
        Ports: [{ PublicPort }],
      } = container;

      const url = `${IPAddress}:${PublicPort}`;
      setContainerId(Id);
      setUrl(url);
    });
  };

  const onStopMilvusClick = () => {
    const { ipcRenderer } = window.require('electron');
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
