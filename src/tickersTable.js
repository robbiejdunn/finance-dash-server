import axios from 'axios';
import React from 'react';
import './App.css';
import makeStyles from '@mui/styles/makeStyles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';


class TickersTable extends React.Component {
  state = {
    tickersCount: "",
    tickers: []
  }

  componentDidMount() {
    // axios.get("http://localhost:4566/restapis/iua15wzoqx/prod/_user_request_/Tickers")
    //   .then(res => {
    //     // const items = res.data.Items.map(obj => `${obj.id} : ${obj.name}`);
    //     this.setState({ 
    //       tickersCount: res.data.Count,
    //       tickers: res.data.Items
    //     });
    //   });
    axios.get(`${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}tickers/list`)
    .then(res => {
      // const items = res.data.Items.map(obj => `${obj.id} : ${obj.name}`);
      this.setState({ 
        tickersCount: res.data.Count,
        tickers: res.data.Items
      });
    });
  }

  render() {
    const classes = makeStyles({
      table: {
        minWidth: 650,
      }
    });
    return (
      <div>
        <h1>Scan of {this.state.tickersCount} tickers</h1>
        <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Ticker Name</TableCell>
              <TableCell align="right">Ticker Symbol</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {this.state.tickers.map((ticker) => (
              <TableRow hover={true}>
                <TableCell component="th" scope="row">
                  {ticker.name}
                </TableCell>
                <TableCell align="right">{ticker.symbol}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableContainer>
      </div>
    );
  }
}

export default TickersTable;
