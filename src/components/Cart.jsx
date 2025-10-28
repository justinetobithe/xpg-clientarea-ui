import React, { useContext, useRef, useEffect, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography
} from '@mui/material';
import { Close, ChevronLeft, ChevronRight } from '@mui/icons-material';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../firebase';
import { getThumbnailForFile } from './helpers/fileUtils';
import { CartContext } from '../contexts/CartContext';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

function Cart() {
  const { cartItems, removeItem, emptyCart } = useContext(CartContext);

  const [display, setDisplay] = useState("lg");
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    function checkScreenSize() {
      const width = window.innerWidth;
      if (width > 1280) setDisplay("xl");
      else if (width > 1024) setDisplay("lg");
      else if (width > 768) setDisplay("md");
      else setDisplay("sm");
    }

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const getSlidesPerView = () => {
    if (display === "xl") return 8;
    if (display === "lg") return 6;
    if (display === "md") return 4;
    return 2;
  };

  const visibleSlides = getSlidesPerView();
  const showNavigation = cartItems.length > visibleSlides;


  const extractPathFromUrl = (firebaseUrl) => {
    const url = typeof firebaseUrl === 'string'
      ? firebaseUrl
      : firebaseUrl?.url || '';

    if (typeof url !== 'string') return null;

    const match = url.match(/o\/(.+?)\?/);
    return match ? decodeURIComponent(match[1]) : null;
  };


  const handleDownloadAll = async () => {
    if (cartItems.length === 0) return;
    const zip = new JSZip();

    for (const item of cartItems) {
      const filePath = item.path || extractPathFromUrl(item.url);
      if (!filePath) {
        console.warn("Skipping item with invalid path:", item);
        continue;
      }

      try {
        const fileRef = ref(storage, filePath);
        const downloadUrl = await getDownloadURL(fileRef);
        const response = await fetch(downloadUrl);
        const blob = await response.blob();
        zip.file(item.fileName, blob);
      } catch (error) {
        console.error(`Failed to download ${item.fileName}:`, error);
      }
    }

    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'carts.zip');
    });
  };


  return (
    <Box
      sx={{
        width: '100%',
        px: { xs: 2, sm: 3, md: 4 },
        py: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        boxSizing: 'border-box',
      }}
    >
      {cartItems.length === 0 ? (
        <Typography variant="h6" textAlign="center" color="#fff">
          Your cart is empty.
        </Typography>
      ) : (
        <>
          <Box
            sx={{
              maxWidth: (visibleSlides * 110),
              mx: 'auto',
              position: 'relative',
              width: '100%',
            }}
          >


            <Swiper
              modules={[Navigation]}
              loop={false}
              autoplay={false}
              spaceBetween={3}
              slidesPerView={3}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              navigation={
                showNavigation
                  ? {
                    prevEl: prevRef.current,
                    nextEl: nextRef.current,
                  }
                  : false
              }
              resizeObserver={false}
            >
              {cartItems.map((item, index) => {
                const extension = item?.fileName?.split('.').pop().toLowerCase() || '';
                const resolvedUrl = typeof item.url === 'string' ? item.url : item.url?.url || '';
                const thumbnail = getThumbnailForFile(resolvedUrl);

                return (
                  <SwiperSlide key={index}>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Box
                        sx={{
                          width: 100,
                          height: 100,
                          position: 'relative',
                          border: '1px solid #ccc',
                          borderRadius: 2,
                          backgroundColor: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={thumbnail}
                          alt={item.fileName}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: 4,
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/placeholder-image.png';
                          }}
                        />

                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 2,
                            left: 4,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            color: '#fff',
                            fontSize: 10,
                            px: 0.5,
                            borderRadius: 1,
                          }}
                        >
                          {extension.toUpperCase()}
                        </Box>

                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            color: 'white',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                          }}
                          onClick={() => removeItem(index)}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: { xs: 'center', sm: 'space-between' },
              alignItems: 'center',
            }}
          >
            <Button
              fullWidth
              variant="outlined"
              color="error"
              onClick={emptyCart}
              sx={{ maxWidth: { sm: 200 } }}
            >
              Empty Cart
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleDownloadAll}
              sx={{ maxWidth: { sm: 200 } }}
            >
              Download All
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}

export default Cart;
