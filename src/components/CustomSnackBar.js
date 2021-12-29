import * as React from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export const CustomSnackBar = React.forwardRef(function CustomSnackBar(props, ref) {
    const [open, setOpen] = React.useState(false);
    const [severity, setSeverity] = React.useState("success");
    const [message, setMessage] = React.useState("");

    React.useImperativeHandle(ref, () => ({
        showSnackbar(s, m) {
            setSeverity(s);
            setMessage(m);
            setOpen(true);
        }
    }));
  
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
        >
            <Alert 
                onClose={handleClose}
                severity={severity}
                sx={{ width: '100%' }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
});
