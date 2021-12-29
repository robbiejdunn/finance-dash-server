import React, { useState, useEffect, useRef } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import Paper from '@mui/material/Paper';
import TransactionsTable from './TransactionsTable';
import { toCurrencyString, toGainString } from '../utils';
import HoldingPriceChart from './HoldingPriceChart/HoldingPriceChart';
import ContentLoading from './ContentLoading';
import { CustomSnackBar } from './CustomSnackBar';
import { getUnits, getPurchasePrice, getMVTotalGain } from '../utils/holding'

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
    }
}));

export default function HoldingView() {
    const classes = useStyles();
    const { holdingId } = useParams();

    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [currentPrice, setCurrentPrice] = useState(0);
    const [imageUrl, setImageUrl] = useState('');
    const [tickerPrices, setTickerPrices] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [twentyFourHrChange, setTwentyFourHrChange] = useState(0);
    const [twentyFourHrVolume, setTwentyFourHrVolume] = useState(0);
    const [marketCap, setMarketCap] = useState(0);
    const [holdingColor, setHoldingColor] = useState('#75daad');

    const [contentLoading, setContentLoading] = useState(true);

    const snackbarRef = useRef();

    const getTxCircles = () => {
        return transactions.map((t) => {
            return [new Date(t.datetime), parseFloat(t.price) / parseFloat(t.units)];
        })
    };

    useEffect(() => {
        const endpoint = `${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}holdings/?id=${holdingId}`;
        axios.get(endpoint)
        .then(res => {
            setName(res.data.holding.ticker_name);
            setSymbol(res.data.holding.ticker_symbol);
            setImageUrl(res.data.holding.image_url);
            setTickerPrices(res.data.tickerPrices.map((p) => {
                return [new Date(p.datetime), parseFloat(p.price)]
            }));
            setTransactions(res.data.transactions);
            setHoldingColor(res.data.holding.color);
            const recentTP = res.data.tickerPrices[res.data.tickerPrices.length - 1];
            // console.log(recentTP);
            setCurrentPrice(recentTP.price);
            setTwentyFourHrChange(recentTP.twenty_four_hour_change);
            setMarketCap(recentTP.market_cap);
            setTwentyFourHrVolume(recentTP.volume);
            setContentLoading(false);
        });
    }, [holdingId]);

    return (
        <>
            {contentLoading ? (
                <ContentLoading />
            ) : (
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
                                        <div className={classes.coinPricesValue}>
                                            <Typography variant='body1'>
                                                {toGainString(twentyFourHrChange, currentPrice)}
                                            </Typography>
                                        </div>
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
                            <div style={{ display: 'flex' }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', flex: 1 }}>
                                        <div style={{ flex: 1 }} className={classes.coinPricesLabel}>
                                            <Typography variant='h6'>Units</Typography>
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <Typography variant='h6'>{getUnits(transactions)}</Typography>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flex: 1 }}>
                                        <div style={{ flex: 1 }} className={classes.coinPricesLabel}>
                                            <Typography variant='h6'>Market value</Typography>
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <Typography variant='h6'>
                                                {toCurrencyString(getUnits(transactions) * currentPrice)}
                                            </Typography>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flex: 1 }}>
                                        <div style={{ flex: 1 }} className={classes.coinPricesLabel}>
                                            <Typography variant='h6'>Market value 24h gain</Typography>
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <Typography variant='h6'>
                                                {toGainString(
                                                    parseFloat(twentyFourHrChange),
                                                    getPurchasePrice(transactions)
                                                )}
                                            </Typography>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flex: 1 }}>
                                        <div style={{ flex: 1 }} className={classes.coinPricesLabel}>
                                            <Typography variant='h6'>Market value total gain</Typography>
                                        </div>
                                        <div style={{ flex: 2 }}>
                                            <Typography variant='h6'>
                                                {toGainString(
                                                    (100 * getMVTotalGain(transactions, currentPrice) / getPurchasePrice(transactions)),
                                                    getPurchasePrice(transactions)
                                                )}
                                            </Typography>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ flex: 1, display: 'flex' }}>
                                </div>
                            </div>
                            <TransactionsTable 
                                transactions={transactions}
                                currentPrice={currentPrice}
                                twentyFour={twentyFourHrChange}
                                holdingId={holdingId}
                                snackbarRef={snackbarRef}
                                setTransactions={setTransactions}
                            ></TransactionsTable>
                            <HoldingPriceChart 
                                data={tickerPrices}
                                circlesData={getTxCircles()}
                                chartColor={holdingColor}
                            ></HoldingPriceChart>
                            <CustomSnackBar ref={snackbarRef} />
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
