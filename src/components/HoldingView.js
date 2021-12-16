import React, { useState, useEffect } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import Paper from '@mui/material/Paper';
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

export default function HoldingView() {
    const classes = useStyles();
    const { holdingId } = useParams();

    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    // const [units, setUnits] = useState(0);
    const [currentPrice, setCurrentPrice] = useState(0);
    // const [tickerId, setTickerId] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [tickerPrices, setTickerPrices] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [twentyFourHrChange, setTwentyFourHrChange] = useState(0);
    const [twentyFourHrVolume, setTwentyFourHrVolume] = useState(0);
    const [marketCap, setMarketCap] = useState(0);
    const [holdingColor, setHoldingColor] = useState('#75daad');

    useEffect(() => {
        const endpoint = `${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}holdings/?id=${holdingId}`;
        axios.get(endpoint)
        .then(res => {
            console.log(res);
            setName(res.data.holding.ticker_name);
            setSymbol(res.data.holding.ticker_symbol);
            // setUnits(res.data.holding.units);
            setCurrentPrice(res.data.holding.current_price);
            // setTickerId(res.data.holding.ticker_id);
            setImageUrl(res.data.holding.image_url);
            setTwentyFourHrChange(res.data.holding.twenty_four_hour_change);
            setTwentyFourHrVolume(res.data.holding.volume);
            setMarketCap(res.data.holding.market_cap);
            setTickerPrices(res.data.tickerPrices.map((p) => {
                return [new Date(p.datetime), parseFloat(p.price)]
            }));
            setTransactions(res.data.transactions);
            setHoldingColor(res.data.holding.color);
        });
    }, [holdingId]);

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
                            <img src={imageUrl} className={classes.logo} alt="Coin logo" ></img>
                        </div>
                    </div>
                    <Divider className={classes.divider}></Divider>
                    <TransactionsTable transactions={transactions} currentPrice={currentPrice} holdingId={holdingId}></TransactionsTable>
                </div>
            </div>            
            {/* <XYGraph graphData = {tickerPrices} /> */}
            <HoldingPriceChart data={tickerPrices} chartColor={holdingColor} />
            {/* <HoldingPriceChart 
                chartData={tickerPrices}
                hideBottomAxis
                hideLeftAxis
                hideGrid
            /> */}
        </div>
    )
}
