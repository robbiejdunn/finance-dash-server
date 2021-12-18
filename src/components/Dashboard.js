import React, { useEffect, useState } from 'react';
import PortfolioGraph from './PortfolioGraph';
import axios from 'axios';
import { toCurrencyString, category20Colors } from '../utils';
import HoldingsPieChart from './HoldingsPieChart';
import ContentLoading from './ContentLoading';


export default function Dashboard(props) {
    const [portfolioValue, setPortfolioValue] = useState(0);
    const [holdingsJoined, setHoldingsJoined] = useState();
    const [pieChartData, setPieChartData] = useState([]);
    const [contentLoading, setContentLoading] = useState(true);
    
    useEffect(() => {
        const endpoint = `${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}portfolio`;
        axios.get(endpoint).then(res => {
            console.log(res);
            let holdingsDict = {};
            
            // Maps holdings to their chart color
            let colorIndex = 0;
            res.data.holdings.map((holding) => {
                const currColor = category20Colors[colorIndex++];
                
                holding.market_value = holding.units * holding.current_price;

                if(holding.market_value > 0) {
                    holdingsDict[holding.holding_id] = {...holding, color: currColor};
                }
                return null;
            });
            console.log(holdingsDict);

            // Join transactions to holdings
            res.data.transactions.map((transaction) => {
                if(holdingsDict[transaction.holding_id]) {
                    if(holdingsDict[transaction.holding_id].transactions) {
                        holdingsDict[transaction.holding_id].transactions.push(transaction);
                    } else {
                        holdingsDict[transaction.holding_id].transactions = [transaction];
                    }
                }
                return null;
            });
            console.log(holdingsDict);
            
            // Join ticker prices to tickers
            let tickerPricesDict = {};
            res.data.tickerPrices.map((tp) => {
                if (tickerPricesDict[tp.ticker_id]) {
                    tickerPricesDict[tp.ticker_id].push(tp);
                } else {
                    tickerPricesDict[tp.ticker_id] = [tp];
                }
                return null;
            });
            console.log(tickerPricesDict);
            Object.entries(holdingsDict).map(([key, val]) => {
                holdingsDict[key].t_prices = tickerPricesDict[val.ticker_id];
                return null;
            });

            // setHoldings(res.data.holdings);
            // setTransactions(res.data.transactions);
            const holdingsValues = res.data.holdings.map((holding) => {
                return holding.market_value;
            });
            // using unary plus operator see https://stackoverflow.com/questions/8976627/how-to-add-two-strings-as-if-they-were-numbers
            setPortfolioValue(holdingsValues.reduce((a, b) => +a + +b));
            setHoldingsJoined(holdingsDict);
            setPieChartData(Object.entries(holdingsDict).filter(([id, holding]) => {
                return parseInt(holding.market_value) > 0
            }).map(([k, v]) => {
                return {
                    marketValue: v.market_value,
                    symbol: v.ticker_symbol,
                    units: v.units,
                    color: v.color,
                }
            }));
            setContentLoading(false);
        });
    }, []);

    return (
        <>
            {contentLoading? (
                <ContentLoading />
            ): (
                <div>
                    <div>
                        Total portfolio value: {toCurrencyString(portfolioValue)}
                    </div>
                    <HoldingsPieChart chartData={pieChartData} />
                    <PortfolioGraph holdingsJoined={holdingsJoined} />
                </div>
            )}
        </>

    );

}
