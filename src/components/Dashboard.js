import React, { useEffect, useState } from 'react';
import PortfolioGraph from './PortfolioGraph';
import axios from 'axios';
import { toCurrencyString, category20Colors } from '../utils';
import HoldingsPieChart from './HoldingsPieChart';


export default function Dashboard(props) {
    const [portfolioValue, setPortfolioValue] = useState(0);
    const [holdings, setHoldings] = useState();
    const [transactions, setTransactions] = useState([]);
    const [holdingsJoined, setHoldingsJoined] = useState();
    const [pieChartData, setPieChartData] = useState([]);
    
    useEffect(() => {
        let endpoint;
        if(process.env['NODE_ENV'] && process.env['NODE_ENV'] === 'development') {
            const apiId = process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT.split('.')[0].replace('https://', '');
            endpoint = `http://localhost:4566/restapis/${apiId}/prod/_user_request_/portfolio`
        } else {
            endpoint = `${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}portfolio`
        }
        axios.get(endpoint).then(res => {
            let holdingsDict = {};
            
            // maps holdings to their chart color
            let colorIndex = 0;
            res.data.holdings.Items.map((holding) => {
                const currColor = category20Colors[colorIndex++];
                
                holding.marketValue.N = holding.units.N * holding.currentPrice.N;

                if(holding.marketValue.N > 0) {
                    holdingsDict[holding.id.S] = {...holding, color: currColor};
                }
            });

            // join transactions to holdings
            res.data.transactions.Items.map((transaction) => {
                if(holdingsDict[transaction.holdingId.S]) {
                    if(holdingsDict[transaction.holdingId.S].transactions) {
                        holdingsDict[transaction.holdingId.S].transactions.push(transaction);
                    } else {
                        holdingsDict[transaction.holdingId.S].transactions = [transaction];
                    }
                }
            });
            
            let tickersDict = {};
            res.data.tickers.Items.map((ticker) => {
                tickersDict[ticker.id.S] = ticker;
            });

            // join ticker prices to ticker
            res.data.tickerPrices.Items.map((tickerPrice) => {
                if(tickersDict[tickerPrice.tickerId.S].prices) {
                    tickersDict[tickerPrice.tickerId.S].prices.push(tickerPrice);
                } else {
                    tickersDict[tickerPrice.tickerId.S].prices = [tickerPrice];
                }
            });
            
            // join holdings to tickers
            Object.entries(holdingsDict).map(([key, val]) => {
                holdingsDict[key].ticker = tickersDict[val.tickerId.S];
            })

            setHoldings(res.data.holdings);
            setTransactions(res.data.transactions);
            const holdingsValues = res.data.holdings.Items.map((holding) => {
                return holding.marketValue.N;
            });
            // using unary plus operator see https://stackoverflow.com/questions/8976627/how-to-add-two-strings-as-if-they-were-numbers
            setPortfolioValue(holdingsValues.reduce((a, b) => +a + +b));
            setHoldingsJoined(holdingsDict);
            setPieChartData(Object.entries(holdingsDict).filter(([id, holding]) => {
                return parseInt(holding.marketValue.N) > 0
            }).map(([k, v]) => {
                return {
                    marketValue: v.marketValue.N,
                    symbol: v.symbol.S,
                    units: v.units.N,
                    color: v.color,
                }
            }));
        });
    }, []);

    return (
        <div>
            <div>
                Total portfolio value: {toCurrencyString(portfolioValue)}
            </div>
            <HoldingsPieChart chartData={pieChartData} />
            <PortfolioGraph holdingsJoined={holdingsJoined} />
        </div>
    );

}