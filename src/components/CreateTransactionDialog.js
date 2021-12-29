import React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import makeStyles from '@mui/styles/makeStyles';
import { FilledInput, IconButton, Tooltip } from '@mui/material';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';

const useStyles = makeStyles((theme) => ({
    formControl: {
        marginBottom: '20px'
    }
}));

export default function CreateTransactionDialog(props) {
    const classes = useStyles();

    const endpoint = `${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}transactions`;
    
    const [open, setOpen] = React.useState(false);
    const [buySell, setBuySell] = React.useState('BUY');
    const [units, setUnits] = React.useState(0);
    const [price, setPrice] = React.useState(0);
    const [date, setDate] = React.useState('');

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSubmit = () => {
        const data = {
            holdingId: props.holdingId,
            datetime: date,
            buySell: buySell,
            units: units,
            price: price
        };
        axios.post(
            endpoint,
            data
        ).then(res => {
            console.log(res);
            props.setTransactions([...props.transactions, res.data])
            setOpen(false);
            props.snackbarRef.current.show("success", "Transaction added");
        });
        // props.
    }

  return (
      <div>
          <Tooltip title="Add" onClick={handleClickOpen}>
              <IconButton aria-label="add" size="large">
                  <AddIcon />
              </IconButton>
          </Tooltip>
          <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
              <DialogTitle id="form-dialog-title">Add transaction</DialogTitle>
              <DialogContent>
                  <DialogContentText>Add a new transaction for this holding.</DialogContentText>
                  <FormControl variant="filled" className={classes.formControl} fullWidth>
                      <InputLabel id="date-label" shrink>Transaction date</InputLabel>
                      <FilledInput
                          type="datetime-local"
                          id="date-input"
                          value={date}
                          onChange={(e) => {setDate(e.target.value)}}
                          labelId="date-label"
                      ></FilledInput>
                  </FormControl>
                  <FormControl variant="filled" className={classes.formControl} fullWidth>
                      <InputLabel id="buy-sell-label">Type</InputLabel>
                      <Select
                          labelId="buy-sell-label"
                          id="buy-sell-select"
                          value={buySell}
                          onChange={(e) => {setBuySell(e.target.value)}}
                      >
                          <MenuItem value={'BUY'}>BUY</MenuItem>
                          <MenuItem value={'SELL'}>SELL</MenuItem>
                      </Select>
                  </FormControl>
                  <FormControl variant="filled" className={classes.formControl} fullWidth>
                      <TextField
                          label="Units"
                          id="units-textfield"
                          variant="filled"
                          type="number"
                          value={units}
                          onChange={(e) => {setUnits(e.target.value)}}
                      />
                  </FormControl>
                  <FormControl variant="filled" className={classes.formControl} fullWidth>
                      <TextField
                          label="Price"
                          id="price-textfield"
                          variant="filled"
                          type="number"
                          value={price}
                          onChange={(e) => {setPrice(e.target.value)}}
                      />
                  </FormControl>
              </DialogContent>
          <DialogActions>
            <Button
                onClick={handleClose}
                color="primary"
                variant="contained"
            >
              Cancel
            </Button>
            <Button
                onClick={handleSubmit}
                color="primary"
                variant="contained"
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </div>
  );
}