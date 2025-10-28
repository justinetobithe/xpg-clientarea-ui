import React, { useState, useEffect, useCallback } from "react";
import { collection, query, orderBy, limit, onSnapshot, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  Container,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

const LatestGames = () => {
  const theme = useTheme();
  const isXtraSmallScreen = useMediaQuery(theme.breakpoints.down("xs"));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [latestGames, setLatestGames] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const gamesRef = collection(db, "games");
    const q = query(gamesRef, orderBy("createdAt", "desc"), limit(3));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const gamesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLatestGames(gamesData);
      },
      (error) => {
        console.error("Error fetching latest games:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleGameClick = async (game) => {
    if (!currentUser) return;

    if (currentUser.role === "super admin") {
      navigate(`/game/${game.id}`);
      return;
    }

    try {
      const gameAccessRef = collection(db, "gameUserAccess");
      const q = query(gameAccessRef, where("user_id", "==", currentUser.uid));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userGameAccess = snapshot.docs.map((doc) => doc.data().game_id);

        if (userGameAccess.includes(game.id)) {
          navigate(`/game/${game.id}`);
          return;
        }
      }

      setSelectedGame(game);
      setOpenDialog(true);
    } catch (error) {
      console.error("Error fetching user game access:", error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 5, pb: 5, bgcolor: "#262626" }}>
      <Box sx={{ textAlign: "center" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h4"
            gutterBottom
            color="#fff"
            sx={{ display: "inline-block", paddingBottom: "8px", mb: 3, fontSize: "32px", mt: { xs: 5, sm: 4, md: 1, lg: 1 } }}
          >
            {t('latest_games_title')}
          </Typography>
          <Grid container spacing={isXtraSmallScreen ? 0 : isSmallScreen ? 2 : 4} justifyContent="center">
            {latestGames.map((game) => (
              <Grid item xs={12} sm={6} md={4} key={game.id}>
                <Card
                  sx={{
                    boxShadow: 3,
                    borderRadius: 0,
                    transition: "0.3s",
                    "&:hover": { transform: "scale(1.05)" },
                    position: "relative",
                    overflow: "hidden",
                    width: { xs: 250, sm: "100%", md: "100%" },
                    height: { xs: 150, sm: "auto", md: "auto" },
                    mx: { xs: "auto", sm: "auto" }
                  }}
                  onClick={() => handleGameClick(game)}
                >
                  <CardActionArea>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 2,
                        right: 8,
                        backgroundColor: "#F4633A",
                        color: "white",
                        fontSize: "12px",
                        fontWeight: "bold",
                        textAlign: "center",
                        padding: "4px 8px",
                        borderRadius: "24px",
                        zIndex: 2,
                      }}
                    >
                      {t('new_game_label')}
                    </Box>
                    <CardMedia
                      component="img"
                      height="200"
                      image={game.imageURL || "https://via.placeholder.com/300?text=No+Image"}
                      alt={(game?.[i18n.language]?.name || game?.name)}
                      sx={{
                        filter: "brightness(0.9)",
                        objectFit: "cover",
                        width: "100%",
                        height: { xs: "150px", sm: "200px", md: "200px" }
                      }}
                    />
                  </CardActionArea>
                </Card>
                <Typography variant="h6" fontWeight="bold" sx={{ color: "#fff", p: 1 }}>
                  {(game?.[i18n.language]?.name || game?.name)}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.2)",
            textAlign: "center",
          },
        }}
      >
        <DialogTitle sx={{ fontSize: "20px", fontWeight: "bold", color: "#333" }}>
          {t('access_denied_title')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <img
              src="/image/xpg-logo-clientarea.png"
              alt="XPG Logo"
              style={{ height: 60, cursor: "pointer" }}
              onClick={() => navigate(currentUser ? "/dashboard" : "/")}
            />
          </Box>

          <Typography sx={{ fontSize: "16px", color: "#555", mb: 2 }}>
            {t('access_denied_message')}
          </Typography>
          <Typography sx={{ fontSize: "14px", color: "#777", mb: 2 }}>
            {t('access_denied_contact')}
          </Typography>

          <Box sx={{ textAlign: "center", mt: 2 }}>
            {/* <Typography sx={{ fontWeight: "bold", color: "#444" }}>📞 +421 911 628 998</Typography> */}
            <Typography sx={{ fontWeight: "bold", color: "#444" }}>📧 info@xprogaming.com</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button
            onClick={() => setOpenDialog(false)}
            variant="contained"
            sx={{
              backgroundColor: "#F4633A",
              color: "#fff",
              fontWeight: "bold",
              borderRadius: "8px",
              padding: "8px 20px",
              "&:hover": { backgroundColor: "#d8512e" },
            }}
          >
            {t('close_button')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LatestGames;
