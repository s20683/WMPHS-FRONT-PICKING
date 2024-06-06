import React from 'react';
import {Button} from "@mui/material";

interface Props {
    label: string;
    onClick?: () => void;
    icon?: React.ReactElement;
    alternative?: boolean;
    sx?: object;
    hoverColor?: string;
    disabled?: boolean;
}
const ContainedButton = ( {onClick, label, alternative, icon, sx, hoverColor, disabled=false} : Props) => {
    return (
        <Button
            variant="contained"
            disabled={disabled}
            sx={{
                fontSize:"20px",
                marginRight: "10px",
                backgroundColor: alternative ? 'white' : '#2d2d2d',
                color: alternative ? '#2d2d2d' : 'white',
                '&:hover': {
                    backgroundColor: hoverColor ? hoverColor : '#414141'
                },
                ...sx
            }}
            onClick={onClick}
        >
            {icon ? icon : label}
        </Button>
    );
};

export default ContainedButton;
