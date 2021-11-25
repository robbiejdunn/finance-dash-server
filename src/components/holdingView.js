import React, { useState, useEffect } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Typography from '@mui/material/Typography';
import { Button, Divider } from '@mui/material';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import XYGraph from './tickerPriceLineD3';
import TransactionsTable from './TransactionsTable';
import { toCurrencyString } from '../utils';
import HoldingPriceChart from './HoldingPriceChart/HoldingPriceChart';

const useStyles = makeStyles((theme) => ({
    root: {
        wordWrap: 'wr',
        '& a': {
            color: 'green',
        }
    },
    table: {
        // minWidth: 650,
    },
    flexRow: {
        display: 'flex',
        padding: '20px',
    },
    flexColumnNameSymbol: {
        flex: 1,
    },
    flexLogo: {
        display: 'flex',
        alignItems: 'center',
    },
    flexPricesTable: {
        flex: 1,
        display: 'flex',
        height: '100%',
    },
    flexColumnCoinInfo: {
        flex: 2,
        marginRight: '50px',
    },
    flexColumnCoinInfoTop: {
        display: 'flex',
    },
    logo: {
        maxHeight: '100px',
        maxWidth: '100px',
        marginLeft: '30px',
        marginRight: '30px',
    },
    divider: {
        marginTop: '20px',
        marginBottom: '20px',
        height: '5px',
    },
    flexColumnCoinPrices: {
        marginTop: '40px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    },
    flexRowCoinPrices: {
        display: 'flex',
        flex: 1,
        alignItems: 'center'
    },
    coinPricesLabel: {
        flex: 1,
        color: '#fefefe63',
        textAlign: 'right',
        marginRight: '20px'
    },
    coinPricesValue: {
        flex: 2
    },
    gainLoss: {
        color: '#f03333'
    },
    gainProfit: {
        color: '#13cb13'
    }
}));

const columns = [
    { 
        field: 'datetime', 
        headerName: 'Datetime',
        width: 250,
    },
    { 
        field: 'price', 
        headerName: 'Price',
        flex: 1,
    },
];

export default function HoldingView() {
    const classes = useStyles();
    const { holdingId } = useParams();

    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [units, setUnits] = useState(0);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [tickerId, setTickerId] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [description, setDescription] = useState('');
    const [tickerPrices, setTickerPrices] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [twentyFourHrChange, setTwentyFourHrChange] = useState(0);
    const [twentyFourHrVolume, setTwentyFourHrVolume] = useState(0);
    const [marketCap, setMarketCap] = useState(0);

    useEffect(() => {
        let endpoint;
        if(process.env['NODE_ENV'] && process.env['NODE_ENV'] === 'development') {
            const apiId = process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT.split('.')[0].replace('https://', '');
            endpoint = `http://localhost:4566/restapis/${apiId}/prod/_user_request_/holdings?id=${holdingId}`;
        } else {
            endpoint = `${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}holdings/?id=${holdingId}`;
        }
        axios.get(endpoint)
        .then(res => {
            setName(res.data.holding.Item.name.S);
            setSymbol(res.data.holding.Item.symbol.S);
            setUnits(res.data.holding.Item.units.N);
            setCurrentPrice(res.data.holding.Item.currentPrice.N);
            setTickerId(res.data.holding.Item.tickerId.S);
            setImageUrl(res.data.ticker.Item.imageUrl.S);
            setDescription(res.data.ticker.Item.description.S);
            setTickerPrices(res.data.tickerPrices.Items.map((p) => {
                return [new Date(p.datetime.S), parseFloat(p.price.N)]
            }));
            setTransactions(res.data.transactions.Items);
            setTwentyFourHrChange(res.data.holding.Item.twentyFourHourChange.N);
            setTwentyFourHrVolume(res.data.holding.Item.volume.N);
            setMarketCap(res.data.holding.Item.marketCap.N);
        });
    }, []);

    const openCreateTransactionModal = (event) => {

    }

    return (
        <div className={classes.root} component={Paper}>
            <div className={classes.flexRow}>
                <div className={classes.flexColumnCoinInfo}>
                    <div className={classes.flexColumnCoinInfoTop}>
                        <div className={classes.flexColumnNameSymbol}>
                            <Typography variant='h2'>{name}</Typography>
                            <Typography variant='h3'>{symbol}</Typography>
                        </div>
                        <div className={classes.flexColumnCoinPrices}>
                            <div className={classes.flexRowCoinPrices}>
                                <div className={classes.coinPricesLabel}>
                                    <Typography variant='body1'>Price</Typography>
                                </div>
                                <div className={classes.coinPricesValue}>
                                    <Typography variant='body1'>{toCurrencyString(currentPrice)}</Typography>
                                </div>
                            </div>
                            <div className={classes.flexRowCoinPrices}>
                                <div className={classes.coinPricesLabel}>
                                    <Typography variant='body1'>24 hour change (%)</Typography>
                                </div>
                                {twentyFourHrChange < 0 ? (
                                    <div className={`${classes.coinPricesValue} ${classes.gainLoss}`}>
                                        <Typography variant='body1'>
                                            {toCurrencyString((twentyFourHrChange / 100 ) * currentPrice)} ({parseFloat(twentyFourHrChange).toFixed(3)}%)
                                        </Typography>
                                    </div>
                                ) : (
                                    <div className={`${classes.coinPricesValue} ${classes.gainProfit}`}>
                                        <Typography variant='body1'>
                                            {toCurrencyString((twentyFourHrChange / 100 ) * currentPrice)} ({parseFloat(twentyFourHrChange).toFixed(3)}%)
                                        </Typography>
                                    </div>
                                )}
                            </div>
                            <div className={classes.flexRowCoinPrices}>
                                <div className={classes.coinPricesLabel}>
                                    <Typography variant='body1'>24 hour volume</Typography>
                                </div>
                                <div className={classes.coinPricesValue}>
                                    <Typography variant='body1'>{toCurrencyString(twentyFourHrVolume)}</Typography>
                                </div>
                            </div>
                            <div className={classes.flexRowCoinPrices}>
                                <div className={classes.coinPricesLabel}>
                                    <Typography variant='body1'>Market cap</Typography>
                                </div>
                                <div className={classes.coinPricesValue}>
                                    <Typography variant='body1'>{toCurrencyString(marketCap)}</Typography>
                                </div>
                            </div>
                        </div>
                        <div className={classes.flexLogo}>
                            <img src={imageUrl} className={classes.logo} ></img>
                        </div>
                    </div>
                    <Divider className={classes.divider}></Divider>
                    <div>
                        <Typography variant='body2' dangerouslySetInnerHTML={{__html: `<div>${description}</div>`}}>
                        </Typography>
                    </div>
                    <Divider className={classes.divider}></Divider>
                    <TransactionsTable transactions={transactions} currentPrice={currentPrice} holdingId={holdingId}></TransactionsTable>
                </div>
            </div>            
            {/* <XYGraph graphData = {tickerPrices} /> */}
            <HoldingPriceChart data={tickerPrices} />
            {/* <HoldingPriceChart 
                chartData={tickerPrices}
                hideBottomAxis
                hideLeftAxis
                hideGrid
            /> */}
        </div>
    )
}
