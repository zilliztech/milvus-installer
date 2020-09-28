import {
  CircularProgress,
  IconButton,
  InputAdornment,
  makeStyles,
  TextField,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import Button from '../../components/button';
import logo from '../../images/logo.png';
import './index.css';
import { useHistory } from 'react-router-dom';
import {
  checkStorage,
  getStorage,
  setStorage,
} from '../../shared/storage.util';
import { STORAGE_CONFIGS } from '../../shared/constants';

const useStyles = makeStyles({
  root: {
    '& label.Mui-focused': {
      color: '#4fc4f9',
    },
    '& .MuiInput-underline:after': {
      borderBottomColor: '#4fc4f9',
    },
  },
  loading: {
    color: '#4fc4f9',
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -24,
    marginLeft: -24,
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

const getCreateOption = (configs, version) => {
  const [, ver] = version.split(' ');
  let createConfig = {
    name: `milvus_${ver}_cpu`,
    HostConfig: {
      PortBindings: {},
      Binds: [],
    },
  };

  if (version.includes('GPU')) {
    createConfig = {
      ...createConfig,
      gpus: 'all',
      name: `milvus_${ver}_gpu`,
    };
  }

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
  const [configs, setConfigs] = useState(
    checkStorage(STORAGE_CONFIGS)
      ? getStorage(STORAGE_CONFIGS)
      : getConfigInput()
  );
  const [showLoading, setShowLoading] = useState(false);
  const [version, setVersion] = useState('');
  const history = useHistory();

  useEffect(() => {
    const { ipcRenderer } = window.require('electron');
    ipcRenderer.send('getMilvusVersion', 'start');

    ipcRenderer.on('milvusVersion', (event, version) => {
      setVersion(version);
    });
  }, []);

  const onStartButtonClick = () => {
    const { ipcRenderer } = window.require('electron');

    const validConfigs = configs.filter((config) => config.value);
    const createConfig = getCreateOption(validConfigs, version);

    ipcRenderer.send('startMilvus', createConfig);
    setShowLoading(true);
    monitorStartMilvus(ipcRenderer);

    // save configs
    setStorage(STORAGE_CONFIGS, configs);
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
        setShowLoading(false);
        // move to finish page
        history.push('/finish');
      }
    });

    ipcRenderer.on('startMilvusError', (event, errInfo) => {
      setShowLoading(false);
      // move to err page
      history.push({
        pathname: '/error',
        state: {
          info: errInfo,
        },
      });
    });
  };

  const onInputChange = (event, config) => {
    const value = event.target.value;
    config.value = value;
  };

  return (
    <section className="config-wrapper">
      <img className="config-image" src={logo} alt="logo" />
      <div className="config-main">
        <h2 className="config-title">Configuration</h2>
        <form className="config-form">
          {configs.map((config) => (
            <div className="config-input" key={config.label}>
              {config.needPathIcon ? (
                <TextField
                  className={classes.root}
                  label={config.label}
                  fullWidth
                  value={config.value}
                  InputProps={{
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
                  }}
                />
              ) : (
                <TextField
                  className={classes.root}
                  label={config.label}
                  defaultValue={config.value}
                  onChange={(event) => onInputChange(event, config)}
                />
              )}
            </div>
          ))}
        </form>

        <Button
          label="Start Milvus"
          disabled={showLoading}
          onButtonClick={onStartButtonClick}
        />
        {showLoading && (
          <CircularProgress size={48} className={classes.loading} />
        )}
      </div>
    </section>
  );
};

export default ConfigurationPage;
