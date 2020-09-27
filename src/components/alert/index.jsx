import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  makeStyles,
} from '@material-ui/core';
import WarningIcon from '@material-ui/icons/Warning';
import React from 'react';

const useStyles = makeStyles({
  content: {
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    color: 'orange',
    marginRight: '8px',
  },
});

const Alert = (props) => {
  const { open, onClose, title, content } = props;
  const classes = useStyles();

  return (
    <Dialog open={open} onClose={onClose}>
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent>
        <DialogContentText className={classes.content}>
          <WarningIcon className={classes.icon} />
          {content}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Alert;
