import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    NavLink,
  } from "react-router-dom";
import makeStyles from '@mui/styles/makeStyles';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HoldingsListView from './HoldingsList/HoldingsListView';
import HoldingView from './HoldingView';
import Dashboard from './Dashboard';
import Status from './Status';
import Login from './Login';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    background: 'linear-gradient(0deg, rgba(41,3,48,1) 0%, rgba(116,15,135,1) 100%)'
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerContainer: {
    overflow: 'auto',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  navItemSelected: {
    background: 'linear-gradient(0deg, #0a093a 0%, #2421b7 100%)'
  },
  nested: {
    paddingLeft: theme.spacing(4),
  },
  titleText: {
      flex: 1
  },
}));

export default function ClippedDrawer() {
    const classes = useStyles();

    return (
        <Router>
            <div className={classes.root}>
            <CssBaseline />
            <AppBar position="fixed" className={classes.appBar}>
                <Toolbar>
                    <Typography
                        className={classes.titleText}
                        variant="h6" 
                        noWrap
                    >
                        Investment Tracker
                    </Typography>
                    <Status />
                </Toolbar>
            </AppBar>
            <Drawer
                className={classes.drawer}
                variant="permanent"
                classes={{
                paper: classes.drawerPaper,
                }}
            >
                <Toolbar />
                <div className={classes.drawerContainer}>
                    <List disablePadding>
                        <ListItem 
                            button 
                            key='Dashboard' 
                            component={NavLink} 
                            activeClassName={classes.navItemSelected} 
                            to="/dashboard"
                        >
                            <ListItemIcon><DashboardIcon /></ListItemIcon>
                            <ListItemText primary='Dashboard' />
                        </ListItem>
                        <ListItem 
                            button 
                            key='Holdings' 
                            component={NavLink} 
                            activeClassName={classes.navItemSelected} 
                            to="/holdings"
                        >
                            <ListItemIcon><AccountBalanceIcon /></ListItemIcon>
                            <ListItemText primary='Holdings' />
                        </ListItem>
                    </List>
                </div>
            </Drawer>
            <main className={classes.content}>
                <Toolbar />
                <Switch>
                    <Route path="/holdings/:holdingId">
                        <HoldingView />
                    </Route>
                    <Route path="/holdings">
                        <HoldingsListView />
                    </Route>
                    <Route path="/dashboard">
                        <Dashboard />
                    </Route>
                    <Route path="/login">
                        <Login />
                    </Route>
                </Switch>
            </main>
            </div>
        </Router>
  );
}
