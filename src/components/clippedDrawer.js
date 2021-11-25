import React from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    NavLink,
    useRouteMatch
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
import PagesIcon from '@mui/icons-material/Pages';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HoldingsListView from './HoldingsList/HoldingsListView';
import HoldingView from './holdingView';
import Dashboard from './Dashboard';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    backgroundColor: '#0b3910'
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
    backgroundColor: theme.palette.secondary.main,
  },
  nested: {
    paddingLeft: theme.spacing(4),
  },
}));

export default function ClippedDrawer() {
    const classes = useStyles();
    const [tickersOpen, tickersSetOpen] = React.useState(true);

    const handleTickersOpenClick = () => {
        tickersSetOpen(!tickersOpen);
    }

    return (
        <Router>
            <div className={classes.root}>
            <CssBaseline />
            <AppBar position="fixed" className={classes.appBar}>
                <Toolbar>
                <Typography variant="h6" noWrap>
                    Investment Tracker
                </Typography>
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
                    <List>
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
                    <Route path="/dashboard">
                        <Dashboard />
                    </Route>
                    <Route path="/holdings/:holdingId">
                        <HoldingView />
                    </Route>
                    <Route path="/holdings">
                        <HoldingsListView />
                    </Route>
                </Switch>
            </main>
            </div>
        </Router>
  );
}
