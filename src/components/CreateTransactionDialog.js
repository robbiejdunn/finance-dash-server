import React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import makeStyles from '@mui/styles/makeStyles';
import { FilledInput, FormControlLabel, IconButton, Radio, RadioGroup, Tooltip } from '@mui/material';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';

const useStyles = makeStyles((theme) => ({
    horizControlsContainer: {
        display: "flex",
        gap: "15px",
    },
    formControl: {
        marginBottom: "20px",
    },
    formControlHoriz: {
        marginBottom: "10px",
    },
    formLabelOr: {
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
    },
}));

export default function CreateTransactionDialog(props) {
    const classes = useStyles();

    const endpoint = `${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}transactions`;
    
    const [open, setOpen] = React.useState(false);
    const [buySell, setBuySell] = React.useState('BUY');
    const [units, setUnits] = React.useState('');
    const [price, setPrice] = React.useState('');
    const [pricePerUnit, setPricePerUnit] = React.useState('');
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
            props.snackbarRef.current.showSnackbar("success", "Transaction added successfully!");
        });
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
                    <FormControl variant="filled" className={classes.formControl} fullWidth>
                        <InputLabel id="date-label" shrink>Transaction date</InputLabel>
                        <FilledInput
                            type="date"
                            id="date-input"
                            value={date}
                            onChange={(e) => {setDate(e.target.value)}}
                            labelId="date-label"
                        ></FilledInput>
                    </FormControl>
                    <FormControl variant="filled" className={classes.formControl} fullWidth>
                        <RadioGroup 
                            row
                            aria-label="gender"
                            name="row-radio-buttons-group"
                            value={buySell}
                            onChange={(e) => {setBuySell(e.target.value)}}
                        >
                            <FormControlLabel
                                value="BUY"
                                control={<Radio />}
                                label="Buy"
                            />
                            <FormControlLabel
                                value="SELL"
                                control={<Radio />}
                                label="Sell"
                                disabled
                            />
                        </RadioGroup>
                    </FormControl>
                    <FormControl variant="filled" className={classes.formControl} fullWidth>
                        <TextField
                            label="Units"
                            id="units-textfield"
                            variant="filled"
                            type="number"
                            value={units}
                            onChange={(e) => {
                                setUnits(e.target.value);
                            }}
                        />
                    </FormControl>
                    <div className={classes.horizControlsContainer}>
                        <FormControl variant="filled" className={classes.formControl} fullWidth>
                            <TextField
                                label="Total price"
                                id="price-textfield"
                                variant="filled"
                                type="number"
                                value={price}
                                onChange={(e) => {
                                    setPrice(e.target.value);
                                    if (units) {
                                        setPricePerUnit(parseFloat(e.target.value) / parseFloat(units));
                                    }
                                }}
                            />
                        </FormControl>
                        <div className={classes.formLabelOr}>OR</div>
                        <FormControl variant="filled" className={classes.formControl} fullWidth>
                            <TextField
                                label="Price per unit"
                                id="pricepu-textfield"
                                variant="filled"
                                type="number"
                                value={pricePerUnit}
                                onChange={(e) => {
                                    setPricePerUnit(e.target.value);
                                    if (units) {
                                        setPrice(parseFloat(e.target.value) * parseFloat(units));
                                    }
                                }}
                            />
                        </FormControl>
                    </div>
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