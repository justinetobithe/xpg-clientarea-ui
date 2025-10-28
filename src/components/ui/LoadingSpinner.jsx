import React from "react";
import { Box, CircularProgress } from "@mui/material";

const LoadingSpinner = () => {
    return (
        <Box
            sx={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                backdropFilter: "blur(5px)",
                zIndex: 9999,  
            }}
        >
            <CircularProgress size={60} sx={{ color: "#36454F" }} />
        </Box>
    );
};

export default LoadingSpinner;
