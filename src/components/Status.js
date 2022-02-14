import React, { useState, useContext, useEffect } from "react";
import { AccountContext } from "./Account";
import Identicon from "identicon.js";
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useHistory } from 'react-router-dom';
import axios from 'axios';

const Status = () => {
    let history = useHistory();
    const [svgString, setSvgString] = useState("");

    const { getSession, logout } = useContext(AccountContext);

    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        setAnchorEl(null);
        history.push("/login");
    };

    const handleImportPortfolio = () => {
        console.log("Import portfolio pressed");
    };

    const handleExportPortfolio = () => {
        console.log("Export portfolio pressed");
        getSession()
            .then((session) => {
                const endpoint = `${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}portfolio/export/?accountId=${session.idToken.payload.sub}`;
                axios.get(endpoint)
                .then(res => {
                    console.log(res);
                });
            })
            .catch((err) => {
                console.error(err);
            });
    };

    useEffect(() => {
        getSession()
            .then((session) => {
                console.log("Session", session);
                var options = {
                    foreground: [0, 0, 0, 255],               // rgba black
                    background: [255, 255, 255, 255],         // rgba white
                    margin: 0.2,                              // 20% margin
                    size: 40,                                // 420px square
                    format: 'svg'                             // use SVG instead of PNG
                };
                const initSvgStr = new Identicon(session.idToken.payload.sub, options).toString();
                console.log(initSvgStr)
                setSvgString(
                    '<img style="border-radius: 50%" width=40 height=40 src="data:image/svg+xml;base64,' + initSvgStr + '">'
                );
            })
            .catch((err) => {
                console.error(err);
            });
    }, [getSession]);

    return (
        <div>
            <Button
                id="basic-button"
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
            >
                <div dangerouslySetInnerHTML={{ __html: svgString }} />
            </Button>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={handleImportPortfolio}>Import portfolio</MenuItem>
                <MenuItem onClick={handleExportPortfolio}>Export portfolio</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
        </div>
    )
};

export default Status;