import React, { useState, useContext, useEffect, useRef } from "react";
import { AccountContext } from "./Account";
import Identicon from "identicon.js";
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import PortfolioImporter from "./ImportExport/PortfolioImporter";

const Status = () => {
    let history = useHistory();
    const [svgString, setSvgString] = useState("");

    const { getSession, logout } = useContext(AccountContext);

    const downloadAnchorRef = useRef();

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [fileDownloadUrl, setFileDownloadUrl] = React.useState("");
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

    const handleExportPortfolio = () => {
        console.log("Export portfolio pressed");
        getSession()
            .then((session) => {
                const endpoint = `${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}portfolio/export/?accountId=${session.idToken.payload.sub}`;
                axios.get(endpoint)
                .then(res => {
                    console.log(res);
                    const blob = new Blob([JSON.stringify(res.data)]);
                    const fileDownloadUrl = URL.createObjectURL(blob);
                    setFileDownloadUrl(fileDownloadUrl);
                    downloadAnchorRef.current.click();
                    URL.revokeObjectURL(fileDownloadUrl);
                    setFileDownloadUrl("");
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
            <a
                style={{display: "none"}}
                href={fileDownloadUrl}
                download={"portfolio.json"}
                ref={downloadAnchorRef}
            >Download</a>
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
                <PortfolioImporter />
                <MenuItem onClick={handleExportPortfolio}>Export portfolio</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
        </div>
    );
};

export default Status;
