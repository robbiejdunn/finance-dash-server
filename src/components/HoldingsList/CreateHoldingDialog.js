import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import makeStyles from '@mui/styles/makeStyles';
import { FilledInput, IconButton, Tooltip } from '@mui/material';
import axios from 'axios';
import Pagination from '@mui/material/Pagination';
import AddIcon from '@mui/icons-material/Add';
import CircularProgress from '@mui/material/CircularProgress';

const useStyles = makeStyles((theme) => ({
    formControl: {
        marginBottom: '20px'
    },
    dialog: {
        height: '400px',
        width: '600px'
    },
    searchField: {
        width: '100%'
    },
    coinOptionsContainer: {
        display: 'flex',
        flexDirection: 'column',
        height: '280px'
    },
    coinOptionRow: {
        flex: 1,
        display: 'flex',
        border: '1px solid #bbbbbb59',
        padding: '10px',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
        maxHeight: '20%'
    },
    coinOptionSymbol: {
        flex: 1,
        margin: 'auto'
    },
    coinOptionName: {
        flex: 3,
        margin: 'auto'
    },
    pagination: {
        marginTop: '12px'
    },
    rowSelected: {
        backgroundColor: theme.palette.secondary.main
    },
}));

export default function CreateHoldingDialog(props) {
    const classes = useStyles();
    
    const [open, setOpen] = React.useState(false);
    const [searchText, setSearchText] = React.useState('');
    const [coinData, setCoinData] = React.useState([]);
    const [displayedCoins, setDisplayedCoins] = React.useState([]);
    const [pageCoins, setPageCoins] = React.useState([]);
    const [page, setPage] = React.useState(1);
    const [selected, setSelected] = React.useState(null);
    const [addLoading, setAddLoading] = React.useState(false);
    const [addSuccess, setAddSuccess] = React.useState(false);

    const buttonSx = {
        ...(addSuccess && {
          bgcolor: '#4CAF50',
          '&:hover': {
            bgcolor: '#4CAF50',
          },
        }),
    };

    const handleClickOpen = () => {
        if(coinData.length === 0 ) {
            const endpoint = "https://api.coingecko.com/api/v3/coins/list";
            axios.get(endpoint)
            .then(res => {
                setCoinData(res.data);
                setPageCoins(res.data.slice(0, 5));
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleAdd = (event) => {
        setAddLoading(true);
        console.log("Adding holding", selected);
        const data = {
            coinId: selected.id,
        };
        const endpoint = `${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}holdings`;
        axios.post(
            endpoint, 
            data,
            {
                timeout: 10000
            }
        )
        .then(res => {
            setAddLoading(false);   
            setAddSuccess(true);
        })
        .catch((err) => {
            console.log(err);
        });
        // setAddLoading(false);
    };

    const handleSearchTextUpdated = (text) => {
        setSearchText(text);
        const newDisplayed = coinData.filter(e => {
            return (
                e['name'].toLowerCase().includes(text.toLowerCase()) ||
                e['symbol'].toLowerCase().includes(text.toLowerCase())
            )
        });
        setDisplayedCoins(newDisplayed);
        setPageCoins(newDisplayed.slice(0, 5));
        setPage(1);
    };

    const handlePageChange = (event, value) => {
        setPage(value);
        setPageCoins(
            displayedCoins.slice((value - 1) * 5, value * 5)
        );
    }

    const getPageNumbers = (displayedLength, perPage = 5) => {
        return Math.ceil(displayedLength / perPage);
    };

    const handleSetSelected = (event, coin) => {
        setSelected(coin);
    }

    return (
        <div>
            <Tooltip title="Add" onClick={handleClickOpen}>
                <IconButton aria-label="add" size="large">
                    <AddIcon />
                </IconButton>
            </Tooltip>
            <Dialog 
                open={open} onClose={handleClose} 
                aria-labelledby="form-dialog-title"
            >
                <DialogTitle id="form-dialog-title">Add holding</DialogTitle>
                <DialogContent className={classes.dialog}>
                    <TextField 
                        id="search-text"
                        label="Search"
                        variant="filled"
                        value={searchText}
                        onChange={(e) => {handleSearchTextUpdated(e.target.value)}}
                        className={classes.searchField}
                    />
                    <div className={classes.coinOptionsContainer}>
                        {pageCoins.map((coin) => (
                            coin === selected ? (
                                <div 
                                    className={`${classes.coinOptionRow} ${classes.rowSelected}`}
                                    onClick={(e) => handleSetSelected(e, coin)}
                                    key={coin.id}
                                >
                                    <div className={classes.coinOptionSymbol}>
                                        {coin.symbol}
                                    </div>
                                    <div className={classes.coinOptionName}>
                                        {coin.name}
                                    </div>
                                </div>
                            ) : (
                                <div 
                                    className={classes.coinOptionRow}
                                    onClick={(e) => handleSetSelected(e, coin)}
                                    key={coin.id}
                                >
                                    <div className={classes.coinOptionSymbol}>
                                        {coin.symbol}
                                    </div>
                                    <div className={classes.coinOptionName}>
                                        {coin.name}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                    <Pagination 
                        count={getPageNumbers(displayedCoins.length)}
                        color="primary"
                        className={classes.pagination}
                        onChange={handlePageChange}
                        page={page}
                    />
                </DialogContent>
            <DialogActions>
            <Button onClick={handleClose} color="primary">
                Cancel
            </Button>
            <Button
                variant="contained"
                sx={buttonSx}
                disabled={addLoading}
                onClick={handleAdd}
                color="primary"
            >
                {addLoading ? (
                <CircularProgress
                    size={24}
                />
                ) : (
                <>
                    Add
                </>
                )}
            </Button>
            </DialogActions>
        </Dialog>
        </div>
    );
}
