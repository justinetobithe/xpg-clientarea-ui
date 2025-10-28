import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default function HeroSection({ image, image2x, main = false, mainText, subtitle, logo, button }) {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: main ? "560px" : "400px",
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        textAlign: 'center',
        color: 'white',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
      />

      <Box sx={{ zIndex: 1, maxWidth: '80%' }}>
        <Typography variant="h1" component="h1" sx={{ fontSize: "48px" }}>
          {mainText}
        </Typography>
        {subtitle && (
          <Typography variant="h6" mt={1}>
            {subtitle}
          </Typography>
        )}
        {logo && (
          <Box component="img" src={logo} alt="Logo" sx={{ width: 100, mt: 2 }} />
        )}
        {button && (
          <Button
            variant="contained"
            color="primary"
            onClick={button.onClick}
            sx={{ mt: 3 }}
          >
            {button.text}
          </Button>
        )}
      </Box>
    </Box >
  );
}
