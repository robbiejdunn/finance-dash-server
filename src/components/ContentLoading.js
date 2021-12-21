import React from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { CircularProgress } from '@mui/material';


const useStyles = makeStyles((theme) => ({
    loadingProgressContainer: {
        height: '500px',
        display: 'flex'
    },
    loadingProgress: {
        margin: 'auto'
    }
}));


export default function ContentLoading() {
    const classes = useStyles();

    return (
        <div className={classes.loadingProgressContainer}>
            <CircularProgress
                color="primary"
                className={classes.loadingProgress}
            />
        </div>
    )
}
