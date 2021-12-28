import * as React from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export const CustomSnackBar = React.forwardRef(function CustomSnackBar(props, ref) {
    const [open, setOpen] = React.useState(false);

    React.useImperativeHandle(ref, () => ({
        handleClick() {
            setOpen(true);
        }
    }))

    const handleClick = () => {
      setOpen(true);
    };
  
    const handleClose = (event, reason) => {
      if (reason === 'clickaway') {
        return;
      }
      setOpen(false);
    };
  
    return (
      <Snackbar
          open={open}
          autoHideDuration={6000}
          onClose={handleClose}
          openFunction={handleClick}
      >
          <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
              Transaction added successfully
          </Alert>
      </Snackbar>
    );
});

// export default function CustomSnackBar() {

// }
