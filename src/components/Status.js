import React, { useState, useContext, useEffect } from "react";
import { AccountContext } from "./Account";

const Status = () => {
    const [status, setStatus] = useState(false);

    const { getSession } = useContext(AccountContext);

    useEffect(() => {
        getSession()
            .then((session) => {
                console.log("Session", session);
                setStatus(true);
            })
            .catch((err) => {
                console.error(err);
            });
    }, [getSession]);

    return (
        <div>
            {status ? "Logged in" : "Not logged in"}
        </div>
    )
};

export default Status;