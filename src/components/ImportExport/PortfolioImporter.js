import React, { useContext, useRef } from "react";
import { MenuItem } from "@mui/material";
import { AccountContext } from "../Account";
import axios from 'axios';

const PortfolioImporter = () => {
    const { getSession } = useContext(AccountContext);
    const fileSelectorRef = useRef();

    const handleImportClicked = (event) => {
        event.preventDefault();
        console.log("Import portfolio pressed", event);
        fileSelectorRef.current.click();
    };

    const importPortfolio = (event) => {
        event.preventDefault();
        console.log(event);
        let file = event.target.files[0];
        console.log(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (f) => {
                const res = JSON.parse(f.target.result);
                getSession()
                .then((session) => {
                    let endpoint = `${process.env.REACT_APP_FINANCE_DASH_API_ENDPOINT}portfolio/import`;
                    let requestBody = {
                        accountId: session.idToken.payload.sub,
                        portfolio: res,
                    };
                    axios.post(endpoint, requestBody)
                    .then(res => {
                        console.log(res);
                    });
                })
                .catch((err) => {
                    console.error(err);
                });
            };
            reader.readAsText(file);
        }
    };

    return (
        <>
            <input
                style={{display: "none"}}
                ref={fileSelectorRef}
                type="file"
                name="portfolioImportFile"
                onChange={(e) => importPortfolio(e)}
            />
            <MenuItem onClick={handleImportClicked}>Import portfolio</MenuItem>
        </>
    );
};

export default PortfolioImporter;
