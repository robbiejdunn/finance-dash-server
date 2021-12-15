import React, { useState, useEffect } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Paper from '@mui/material/Paper';
import axios from 'axios';
import HoldingsTable from './HoldingsTable';


const useStyles = makeStyles((theme) => ({}));


export default function HoldingsListView() {
    const classes = useStyles();

    const [holdings, setHoldings] = useState([]);

    useEffect(() => {
        let endpoint;
        if(process.env['NODE_ENV'] && process.env['NODE_ENV'] === 'development') {
            const apiId = process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT.split('.')[0].replace('https://', '');
            endpoint = `http://localhost:4566/restapis/${apiId}/prod/_user_request_/holdings/list`;
        } else {
            endpoint = `${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}holdings/list`;
        }
        axios.get(endpoint)
        .then(res => {
            console.log(res);
            setHoldings(res.data.items);
        });
    }, []);


    return (
        <div className={classes.root} component={Paper}>
            <HoldingsTable holdings={holdings} />
        </div>
    )
}
