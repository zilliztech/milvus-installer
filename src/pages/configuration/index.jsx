import {
  IconButton,
  InputAdornment,
  makeStyles,
  TextField,
} from '@material-ui/core';
import React, { useState } from 'react';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import Button from '../../components/button';
import logo from '../../images/logo.png';
import './index.css';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles({
  root: {
    '& label.Mui-focused': {
      color: '#4fc4f9',
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: '#4fc4f9',
    },
  },
});

const getConfigInput = () => {
  const configs = [
    {
      label: 'Milvus port',
      value: 19530,
      type: 'milvus/port',
      needPathIcon: false,
    },
    {
      label: 'Http port',
      value: 19121,
      type: 'milvus/httpPort',
      needPathIcon: false,
    },
    {
      label: 'Data directory',
      value: '',
      type: 'milvus/db',
      needPathIcon: true,
    },
    {
      label: 'Config directory',
      value: '',
      type: 'milvus/conf',
      needPathIcon: true,
    },
    {
      label: 'Log directory',
      value: '',
      type: 'milvus/logs',
      needPathIcon: true,
    },
    {
      label: 'Wal directory',
      value: '',
      type: 'milvus/wal',
      needPathIcon: true,
    },
  ];

  return configs;
};

const getItemFromConfig = (type, value) => {
  const configCommandMap = {
    'milvus/port': {
      '19530/tcp': [
        {
          HostPort: `${value}`,
        },
      ],
    },
    'milvus/httpPort': {
      '19121/tcp': [
        {
          HostPort: `${value}`,
        },
      ],
    },
    'milvus/db': `${value}:/var/lib/milvus/db`,
    'milvus/conf': `${value}:/var/lib/milvus/conf`,
    'milvus/logs': `${value}:/var/lib/milvus/logs`,
    'milvus/wal': `${value}:/var/lib/milvus/wal`,
  };

  return configCommandMap[type];
};

const getCreateOption = (configs) => {
  let createConfig = {
    name: 'milvus_cpu_0.10.2',
    HostConfig: {
      PortBindings: {},
      Binds: [],
    },
  };

  configs.forEach((config) => {
    const newConfig = getItemFromConfig(config.type, config.value);
    const portsTypes = ['milvus/port', 'milvus/httpPort'];
    if (portsTypes.includes(config.type)) {
      createConfig = {
        ...createConfig,
        HostConfig: {
          PortBindings: {
            ...createConfig.HostConfig.PortBindings,
            ...newConfig,
          },
          Binds: [...createConfig.HostConfig.Binds],
        },
      };
    } else {
      createConfig = {
        ...createConfig,
        HostConfig: {
          PortBindings: {
            ...createConfig.HostConfig.PortBindings,
          },
          Binds: newConfig
            ? [...createConfig.HostConfig.Binds, newConfig]
            : [...createConfig.HostConfig.Binds],
        },
      };
    }
  });

  return createConfig;
};

const ConfigurationPage = () => {
  const classes = useStyles();
  const [configs, setConfigs] = useState(getConfigInput());
  const history = useHistory();

  const onStartButtonClick = () => {
    const { ipcRenderer } = window.require('electron');

    const validConfigs = configs.filter((config) => config.value);
    const createConfig = getCreateOption(validConfigs);
    ipcRenderer.send('startMilvus', createConfig);
    monitorStartMilvus();
  };

  const onFileIconClick = (config) => {
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.send('openFolder', config);
    monitorFileSelect(ipcRenderer);
  };

  const monitorFileSelect = (ipcRenderer) => {
    ipcRenderer.on('dirSelectDone', (event, config) => {
      const newConfigs = configs.map((c) =>
        c.type !== config.type ? c : config
      );

      setConfigs(newConfigs);
    });
  };

  const monitorStartMilvus = (ipcRenderer) => {
    ipcRenderer.on('startMilvusDone', (event, isDone) => {
      if (isDone) {
        // move to finish page
      }
    });

    ipcRenderer.on('startMilvusError', (event, errInfo) => {
      // move to err page
      history.push({
        pathname: '/error',
        state: {
          info: errInfo,
        },
      });
    });
  };

  return (
    <section className="config-wrapper">
      <img className="config-image" src={logo} alt="logo" />
      <div className="config-main">
        <h2 className="config-title">Configuration</h2>
        <form className="config-form">
          {configs.map((config) => (
            <div className="config-input" key={config.label}>
              <TextField
                className={classes.root}
                label={config.label}
                fullWidth={config.needPathIcon}
                value={config.value}
                InputProps={
                  config.needPathIcon
                    ? {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => {
                                onFileIconClick(config);
                              }}
                            >
                              <FolderOpenIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                        readOnly: true,
                      }
                    : {}
                }
              />
            </div>
          ))}
        </form>

        <Button label="Start Milvus" onButtonClick={onStartButtonClick} />
      </div>
    </section>
  );
};

export default ConfigurationPage;
