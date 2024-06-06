import React from 'react';
import {IconButton, Toolbar} from "@mui/material";
import logoWhite from './assets/logo-white.png';
const TopBar = () => {

    return (
        <Toolbar variant="dense" sx={{
            background: "#2d2d2d",
            display: 'flex',
            justifyContent: 'center',
        }}>
            <IconButton
                size="small"
                edge="start"
                color="primary"
                aria-label="logo"
                sx={{
                    marginRight: 3,
                    justifyContent: 'center',
                    display: 'flex'
                }}
                href="/">
                <img src={logoWhite} alt="logo" width={220} />
            </IconButton>
        </Toolbar>
    );
};

export default TopBar;

