import React, { useState, useEffect, useContext } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import Paper from '@mui/material/Paper';
import axios from 'axios';
import HoldingsTable from './HoldingsTable';
import ContentLoading from '../ContentLoading';
import { AccountContext } from "../Account";
import  { Redirect } from 'react-router-dom'

const useStyles = makeStyles((theme) => ({}));


export default function HoldingsListView() {
    const classes = useStyles();

    const [holdings, setHoldings] = useState([]);
    const [contentLoading, setContentLoading] = useState(true);
    const [authFailed, setAuthFailed] = useState(false);

    const { getSession } = useContext(AccountContext);

    useEffect(() => {
        getSession()
            .then((session) => {
                console.log(`Authenticated with session ${session}`);
                const endpoint = `${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}holdings/list/accountId='${session.idToken.payload.sub}'`;
                axios.get(endpoint)
                    .then(res => {
                        console.log(res);
                        setHoldings(res.data.items);
                        setContentLoading(false); 
                    });
            })
            .catch((err) => {
                setAuthFailed(true);
                console.log("Not authenticated. Redirecting")
            });
    }, [getSession]);

    if (authFailed) {
        return <Redirect to='/login' />
    }

    return (
        <>
            {contentLoading? (
                <ContentLoading />
            ) : (
                <div className={classes.root} component={Paper}>
                    <HoldingsTable
                        holdings={holdings}
                        setHoldings={setHoldings}
                    />
                </div>
            )}
        </>

    )
}
