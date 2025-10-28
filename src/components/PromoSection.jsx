import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Grid, Card, CardMedia, Button, Container, Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import AppLoginForm from "./forms/AppLoginForm";

export default function PromoSection() {
  const navigate = useNavigate();
  const [promoItems, setPromoItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    setLoading(true);
    const promoRef = collection(db, "promoItems");
    const promoQuery = query(promoRef, orderBy("createdAt", "desc"));

    const unsubscribePromo = onSnapshot(
      promoQuery,
      (snapshot) => {
        const promos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPromoItems(promos);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching promo items:", error);
        setLoading(false);
      }
    );

    return () => unsubscribePromo();
  }, []);

  return (
    <>
      <Container maxWidth="lg" sx={{ pb: 5, mt: 5 }}>
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Container maxWidth="lg" sx={{ m: "5" }}>
            <Grid container spacing={3} justifyContent="center">
              {loading ? (
                [...Array(3)].map((_, index) => (
                  <Grid
                    item
                    xs={12}
                    sm={index === 0 ? 6 : 6}
                    md={index === 0 ? 8 : 4}
                    lg={index === 0 ? 8 : 4}
                    key={index}
                  >
                    <Card
                      sx={{
                        position: "relative",
                        boxShadow: 3,
                        borderRadius: "20px",
                        overflow: "hidden",
                      }}
                    >
                      <Box sx={{ position: "relative" }}>
                        <Skeleton
                          variant="rectangular"
                          sx={{
                            width: "100%",
                            height: { xs: 250, sm: 300, md: 350, lg: 350 },
                          }}
                        />
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            background: "rgba(0, 0, 0, 0.5)",
                            color: "#fff",
                            p: 2,
                          }}
                        >
                          <Skeleton variant="text" width="70%" height={30} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />
                          <Skeleton variant="rectangular" width="40%" height={36} sx={{ borderRadius: "24px", bgcolor: 'rgba(255,255,255,0.3)' }} />
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))
              ) : (
                promoItems.map((item, index) => (
                  <Grid
                    item
                    xs={12}
                    sm={index === 0 ? 6 : 6}
                    md={index === 0 ? 8 : 4}
                    lg={index === 0 ? 8 : 4}
                    key={item.id}
                  >
                    <Card
                      sx={{
                        position: "relative",
                        boxShadow: 3,
                        borderRadius: "20px",
                        transition: "0.3s",
                        overflow: "hidden",
                        "&:hover": { transform: "scale(1.05)" },
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          "&:hover img": { filter: "blur(5px)" },
                          "&:hover .hoverContent": { opacity: 1 },
                        }}
                      >
                        <CardMedia
                          component="img"
                          sx={{
                            width: "100%",
                            height: { xs: 250, sm: 300, md: 350, lg: 350 },
                            objectFit: "cover",
                          }}
                          image={item.image || "https://via.placeholder.com/300?text=No+Image"}
                          alt={(item?.[i18n.language]?.alt || item?.alt)}
                        />
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            background: "rgba(0, 0, 0, 0.5)",
                            color: "#fff",
                            p: 2,
                            opacity: 0,
                            transition: "opacity 0.3s ease-in-out",
                            "&:hover": { opacity: 1 }
                          }}
                          className="hoverContent"
                        >
                          <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
                            {(item?.[i18n.language]?.title || item?.title)}
                          </Typography>
                          <Button
                            variant="contained"
                            href="#"
                            sx={{
                              transition: "0.3s",
                              backgroundColor: "#5BC2E7",
                              borderRadius: "24px",
                              fontWeight: "bold",
                              fontSize: "14px",
                              textTransform: "none",
                              padding: "6px 24px",
                              "&:hover": {
                                backgroundColor: "#5BC2E7",
                                opacity: 1,
                              },
                            }}
                            onClick={() => (currentUser ? navigate(item?.link) : setIsLoginOpen(true))}
                          >
                            {(item?.[i18n.language]?.buttonText || item?.buttonText)}
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </Container>
        </Box>
      </Container>

      {
        isLoginOpen && (
          <AppLoginForm
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}

          />
        )
      }
    </>
  );
}