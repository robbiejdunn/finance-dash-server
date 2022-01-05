import React, { useEffect, useState, useContext } from 'react';
import PortfolioGraph from './PortfolioGraph';
import axios from 'axios';
import { toCurrencyString } from '../utils';
import HoldingsPieChart from './HoldingsPieChart';
import ContentLoading from './ContentLoading';
import { AccountContext } from "./Account";
import  { Redirect } from 'react-router-dom';

export default function Dashboard(props) {
    const [portfolioValue, setPortfolioValue] = useState(0);
    const [holdingsJoined, setHoldingsJoined] = useState();
    const [pieChartData, setPieChartData] = useState([]);
    const [contentLoading, setContentLoading] = useState(true);
    const [authFailed, setAuthFailed] = useState(false);

    const { getSession } = useContext(AccountContext);
    
    useEffect(() => {
        getSession()
            .then((session) => {
                console.log(`Authenticated with session ${session}`);
                const endpoint = `${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}portfolio/?accountId=${session.idToken.payload.sub}`;
                axios.get(endpoint)
                    .then(res => {
                        console.log(res);
                        const combinedData = res.data.holdings.map((holding) => {
                            const holdingTxs = res.data.transactions.filter((t) => {
                                return t.holding_id === holding.holding_id;
                            });
                            console.log(holdingTxs)
                            const units = holdingTxs.reduce((a, b) => a + +b.units, 0);
                            const marketValue = units * parseFloat(holding.current_price);
                            return {
                                ...holding,
                                units,
                                marketValue,
                            };
                        });
                        console.log(combinedData)
                        const filteredData = combinedData.filter((h) => h.marketValue > 0);
                        const marketValues = filteredData.map((h) => h.marketValue);
                        setPortfolioValue(marketValues.reduce((a, b) => a + b, 0));

                        setPieChartData(filteredData.map((h) => {
                            return {
                                marketValue: h.marketValue,
                                symbol: h.ticker_symbol,
                                units: h.units,
                                color: h.color,
                            };
                        }));

                        setContentLoading(false);
                    });
            }).catch((err) => {
                setAuthFailed(true);
                console.log("Not authenticated. Redirecting");
            });
    }, [getSession]);

    if (authFailed) {
        return <Redirect to='/login' />
    }

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
