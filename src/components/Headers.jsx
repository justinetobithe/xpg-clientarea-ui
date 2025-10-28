import React, { useState, useEffect, useRef, useContext } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Button, Menu, MenuItem, Badge, Box, Drawer, List, ListItem, ListItemText, useMediaQuery, Container } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '../contexts/AuthContext';
import { CartContext } from '../contexts/CartContext';
import { collection, doc, getDoc, limit, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from 'react-router-dom';
import AppRegisterForm from "./forms/AppRegisterForm";
import AppLoginForm from "./forms/AppLoginForm";
import Cart from './Cart';
import CloseIcon from '@mui/icons-material/Close';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: "en", name: "English", flag: "🇬🇧", initial: "EN" },
  { code: "ko", name: "Korean", flag: "🇰🇷", initial: "KO" },
  { code: "th", name: "Thai", flag: "🇹🇭", initial: "TH" },
  { code: "zh", name: "Chinese", flag: "🇨🇳", initial: "ZH" },
  { code: "tr", name: "Turkish", flag: "🇹🇷", initial: "TR" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹", initial: "PT" },
  { code: "ru", name: "Russian", flag: "🇷🇺", initial: "RU" }
];

function Header() {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorElLang, setAnchorElLang] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [anchorElCart, setAnchorElCart] = useState(null);
  const handleCartOpen = (event) => setAnchorElCart(event.currentTarget);
  const handleCartClose = () => setAnchorElCart(null);

  const { currentUser, logout } = useAuth();
  const { cartItems } = useContext(CartContext);
  const cartCount = cartItems.length;
  const navigate = useNavigate();

  const [game, setGame] = useState(null);

  useEffect(() => {
    const fetchUserName = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          setUserName(userDoc.exists() ? userDoc.data().fullName || currentUser.email : currentUser.email);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserName(currentUser.email);
        }
      } else {
        setUserName('');
      }
    };
    fetchUserName();
  }, [currentUser]);

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const toggleMobileMenu = () => setMobileOpen(!mobileOpen);

  const handleLangMenuOpen = (event) => setAnchorElLang(event.currentTarget);
  const handleLangMenuClose = () => setAnchorElLang(null);

  const handleLogout = async () => {
    try {
      await logout();
      handleMenuClose();
      navigate("/");
      window.location.reload();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    const savedLang = localStorage.getItem('selectedLanguage') || 'en';
    const activeLang = languages.find(lang => lang.code === savedLang) || languages[0];
    setSelectedLanguage(activeLang);
    i18n.changeLanguage(activeLang.code);
  }, []);

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    i18n.changeLanguage(lang.code);
    localStorage.setItem('selectedLanguage', lang.code);
    setAnchorElLang(null);
  };

  useEffect(() => {
    const gamesRef = collection(db, "games");

    const q = query(gamesRef, where("category", "==", "Document"), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setGame({ id: doc.id, ...doc.data() });
      } else {
        setGame(null);
        console.log("No game found with category 'Document'.");
      }
    }, (error) => {
      console.error("Error fetching single document game:", error);
      setGame(null);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <Container maxWidth sx={{ backgroundColor: "#444444", padding: { xs: "0 !important", sm: "0 !important" }, }}>
        <Container maxWidth="xl" sx={{ backgroundColor: "#fff", padding: "0 !important", overflow: "hidden" }}>
          <AppBar position="static" sx={{
            backgroundColor: "#262626",
            py: 1,
            px: { xs: 2, sm: 3, md: 4, lg: 4, xl: 4 },
            width: "100%",
          }}>
            <Toolbar sx={{ padding: "0 !important" }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <img src="/image/xpg-logo-clientarea.png" alt="XPG Logo" style={{ height: 50, cursor: 'pointer' }} onClick={() => navigate(currentUser ? '/dashboard' : '/')} />

                <Box sx={{ display: { xs: 'none', md: 'flex' }, marginLeft: 7, gap: 2 }}>
                  <Button
                    onClick={() => navigate('/home')}
                    sx={{
                      color: location.pathname === '/home' || location.pathname === '/' ? '#fff' : 'inherit',
                      position: 'relative',
                      textTransform: "capitalize",
                      fontSize: "16px"
                    }}
                  >
                    {t('home')}
                  </Button>
                  <Button
                    onClick={() => (currentUser ? navigate('/dashboard') : setIsLoginOpen(true))}
                    sx={{
                      color: location.pathname === '/dashboard' ? '#fff' : 'inherit',
                      position: 'relative',
                      textTransform: "capitalize",
                      fontSize: "16px"
                    }}
                  >
                    {t('games')}
                  </Button>

                  <Button
                    onClick={() => (currentUser ? navigate(game ? "/game/" + game.id : "") : setIsLoginOpen(true))}
                    sx={{
                      color: location.pathname === '/dashboard' ? '#fff' : 'inherit',
                      position: 'relative',
                      textTransform: "capitalize",
                      fontSize: "16px"
                    }}
                  >
                    API
                  </Button>
                </Box>
              </Box>

              <Box
                sx={{ position: 'relative', display: { xs: 'flex', md: 'none' }, }}
              >
                <IconButton color="inherit" onClick={handleCartOpen}>
                  <Badge badgeContent={cartCount} color="primary">
                    <ShoppingCartIcon sx={{ fontSize: 25 }} />
                  </Badge>
                </IconButton>
                <Menu
                  anchorEl={anchorElCart}
                  open={Boolean(anchorElCart)}
                  onClose={() => setAnchorElCart(null)}
                  anchorReference="anchorPosition"
                  anchorPosition={{ top: 64, left: 0 }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                  sx={{
                    '& .MuiPaper-root': {
                      position: "fixed",
                      left: "0 !important",
                      maxWidth: { xs: "100%", sm: "100%", md: "100%", lg: "100%", xl: "60%" },
                      boxShadow: '0px 4px 10px #262626',
                      borderRadius: 0,
                      backgroundColor: '#262626',
                      borderTop: '1px solid #fff',
                      display: 'flex',
                      justifyContent: 'center',
                      margin: { xs: "8px auto", sm: "16px auto", md: "16px auto", lg: "16px auto" },
                      right: 0,
                    },
                  }}
                >
                  <Cart />
                </Menu>
              </Box>

              <IconButton
                color="inherit"
                onClick={toggleMobileMenu}
                sx={{ display: { xs: 'flex', md: 'none' }, color: "#fff", cursor: "pointer" }}
              >
                {mobileOpen ? <CloseIcon sx={{ fontSize: 35, cursor: "pointer" }} /> : <MenuIcon sx={{ fontSize: 35 }} />}
              </IconButton>

              {currentUser ? (
                <>
                  <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2, mr: 7 }}>

                    <Box
                      sx={{ position: 'relative' }}
                    >
                      <IconButton color="inherit" onClick={handleCartOpen}>
                        <Badge badgeContent={cartCount} color="primary">
                          <ShoppingCartIcon sx={{ fontSize: 25 }} />
                        </Badge>
                      </IconButton>
                      <Menu
                        anchorEl={anchorElCart}
                        open={Boolean(anchorElCart)}
                        onClose={() => setAnchorElCart(null)}
                        anchorReference="anchorPosition"
                        anchorPosition={{ top: 64, left: 0 }}
                        transformOrigin={{ vertical: "top", horizontal: "left" }}
                        sx={{
                          '& .MuiPaper-root': {
                            position: "fixed",
                            left: "0 !important",
                            maxWidth: { xs: "100%", sm: "100%", md: "100%", lg: "100%", xl: "60%" },
                            boxShadow: '0px 4px 10px #262626',
                            borderRadius: 0,
                            backgroundColor: '#262626',
                            borderTop: '1px solid #fff',
                            display: 'flex',
                            justifyContent: 'center',
                            margin: { xs: "8px auto", sm: "16px auto", md: "16px auto", lg: "16px auto" },
                            right: 0,
                          },
                        }}
                      >
                        <Cart />
                      </Menu>
                    </Box>

                    <Box
                      onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
                      onMouseLeave={() => setAnchorEl(null)}
                      sx={{ position: 'relative' }}
                    >
                      <Button color="inherit" endIcon={<ExpandMoreIcon />}>
                        {userName}
                      </Button>

                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                        sx={{
                          '& .MuiPaper-root': {
                            mt: '22px',
                            boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
                            borderRadius: 0,
                            backgroundColor: '#4D4D4D',
                          }
                        }}
                      >
                        <MenuItem
                          onClick={() => navigate('/account-settings')}
                          sx={{
                            color: '#fff',
                            borderLeft: '6px solid transparent',
                            '&:hover': {
                              color: '#5BC2E7',
                              borderLeft: '6px solid #5BC2E7',
                              backgroundColor: 'transparent',
                            }
                          }}
                        >
                          {t('accountSettings')}
                        </MenuItem>
                        <MenuItem
                          onClick={handleLogout}
                          sx={{
                            color: '#fff',
                            borderLeft: '6px solid transparent',
                            '&:hover': {
                              color: '#5BC2E7',
                              borderLeft: '6px solid #5BC2E7',
                              backgroundColor: 'transparent',
                            }
                          }}
                        >
                          {t('logout')}
                        </MenuItem>
                      </Menu>

                    </Box>

                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button color="inherit" onClick={handleLangMenuOpen}>
                        <span style={{ marginRight: 4 }}>{selectedLanguage.flag}</span> {selectedLanguage.initial}
                      </Button>

                      <Menu
                        anchorEl={anchorElLang}
                        open={Boolean(anchorElLang)}
                        onClose={handleLangMenuClose}
                        sx={{
                          '& .MuiPaper-root': {
                            mt: '22px',
                            boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
                            borderRadius: 0,
                            backgroundColor: '#4D4D4D',
                          }
                        }}
                      >
                        {languages.map((lang) => (
                          <MenuItem
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang)}
                            sx={{
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              borderLeft: '6px solid transparent',
                              '&:hover': {
                                color: '#5BC2E7',
                                borderLeft: '6px solid #5BC2E7',
                                backgroundColor: 'transparent',
                              }
                            }}
                          >
                            <span>{lang.flag}</span> {lang.name}
                          </MenuItem>
                        ))}
                      </Menu>
                    </Box>

                  </Box>
                </>
              ) : (
                <>
                  <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2 }}>
                    <Button
                      onClick={() => setIsLoginOpen(true)}
                      sx={{
                        backgroundColor: "#5BC2E7",
                        color: "white",
                        borderRadius: "30px",
                        width: "160px",
                        textTransform: "none",
                        "&:hover": {
                          backgroundColor: "#white",
                        },
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      onClick={() => setIsRegisterModalOpen(true)}
                      sx={{
                        backgroundColor: "#5BC2E7",
                        color: "white",
                        borderRadius: "30px",
                        width: "160px",
                        textTransform: "none",
                        "&:hover": {
                          backgroundColor: "#white",
                        },
                      }}
                    >
                      Create Account
                    </Button>

                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button color="inherit" onClick={handleLangMenuOpen}>
                        <span style={{ marginRight: 4 }}>{selectedLanguage.flag}</span> {selectedLanguage.initial}
                      </Button>

                      <Menu
                        anchorEl={anchorElLang}
                        open={Boolean(anchorElLang)}
                        onClose={handleLangMenuClose}
                        sx={{
                          '& .MuiPaper-root': {
                            mt: '22px',
                            boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
                            borderRadius: 0,
                            backgroundColor: '#4D4D4D',
                          }
                        }}
                      >
                        {languages.map((lang) => (
                          <MenuItem
                            key={lang.code}
                            onClick={() => handleLanguageChange(lang)}
                            sx={{
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              borderLeft: '6px solid transparent',
                              '&:hover': {
                                color: '#5BC2E7',
                                borderLeft: '6px solid #5BC2E7',
                                backgroundColor: 'transparent',
                              }
                            }}
                          >
                            <span>{lang.flag}</span> {lang.name}
                          </MenuItem>
                        ))}
                      </Menu>
                    </Box>
                  </Box>
                </>
              )}
            </Toolbar>

            <Drawer
              anchor="right"
              open={mobileOpen}
              onClose={toggleMobileMenu}
              BackdropProps={{
                sx: { backgroundColor: "transparent" },
              }}
              sx={{
                [`& .MuiDrawer-paper`]: {
                  width: "100%",
                  height: "100vh",
                  marginTop: "70px",
                  backgroundColor: "#262626",
                  opacity: mobileOpen ? 1 : 0,
                  transition: "opacity 0.5s ease",
                  boxShadow: "none",
                }
              }}
            >

              <List sx={{ mx: 5.5, my: 2, lineSpacing: 15 }}>
                <ListItem button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate('/home')
                  }}
                  sx={{ justifyContent: "flex-start" }}>
                  <ListItemText
                    primary={t('home')}
                    primaryTypographyProps={{
                      sx: {
                        textAlign: "left",
                        color: "white",
                        fontSize: "29px",
                        textDecoration: "none",
                        fontWeight: "bold",
                        marginBottom: 0
                      }
                    }}
                  />
                </ListItem>

                <ListItem
                  button
                  onClick={() => {
                    setMobileOpen(false);
                    currentUser ? navigate('/dashboard') : setIsLoginOpen(true);
                  }}
                  sx={{ justifyContent: "flex-start" }}
                >
                  <ListItemText
                    primary={t('games')}
                    primaryTypographyProps={{
                      sx: {
                        textAlign: "left",
                        color: "white",
                        fontSize: "29px",
                        textDecoration: "none",
                        fontWeight: "bold",
                        marginBottom: 0
                      }
                    }}
                  />
                </ListItem>

                {!currentUser ? (
                  <>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>

                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <ListItemText
                          onClick={handleLangMenuOpen}
                          primary={
                            <Typography
                              sx={{
                                textAlign: "left",
                                color: "white",
                                fontSize: "29px",
                                textDecoration: "none",
                                fontWeight: "bold",
                                marginBottom: 0
                              }}
                            >
                              <span style={{ marginRight: 4 }}>{selectedLanguage.flag}</span> {selectedLanguage.initial}
                            </Typography>
                          }
                        />

                        <Menu
                          anchorEl={anchorElLang}
                          open={Boolean(anchorElLang)}
                          onClose={handleLangMenuClose}
                          sx={{
                            '& .MuiPaper-root': {
                              mt: '22px',
                              boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
                              borderRadius: 0,
                              backgroundColor: '#4D4D4D',
                            }
                          }}
                        >
                          {languages.map((lang) => (
                            <MenuItem
                              key={lang.code}
                              onClick={() => handleLanguageChange(lang)}
                              sx={{
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                borderLeft: '6px solid transparent',
                                '&:hover': {
                                  color: '#5BC2E7',
                                  borderLeft: '6px solid #5BC2E7',
                                  backgroundColor: 'transparent',
                                }
                              }}
                            >
                              <span>{lang.flag}</span> {lang.name}
                            </MenuItem>
                          ))}
                        </Menu>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button onClick={() => setIsLoginOpen(true)} sx={{ backgroundColor: "#5BC2E7", color: "white" }}>
                        Login
                      </Button>
                      <Button onClick={() => setIsRegisterModalOpen(true)} sx={{ backgroundColor: "#5BC2E7", color: "white" }}>
                        Create Account
                      </Button>
                    </Box>
                  </>
                ) : (
                  <>

                    <ListItem button onClick={() => {
                      setMobileOpen(false);
                      navigate('/account-settings')
                    }} sx={{ justifyContent: "flex-start" }}>
                      <ListItemText
                        primary={t('accountSettings')}
                        primaryTypographyProps={{
                          sx: {
                            textAlign: "left",
                            color: "white",
                            fontSize: "29px",
                            textDecoration: "none",
                            fontWeight: "bold",
                            marginBottom: 0
                          }
                        }}
                      />
                    </ListItem>

                    <ListItem button onClick={() => {
                      setMobileOpen(false);
                      navigate(game ? "/game/" + game.id : "")
                    }} sx={{ justifyContent: "flex-start" }}>
                      <ListItemText
                        primary="API"
                        primaryTypographyProps={{
                          sx: {
                            textAlign: "left",
                            color: "white",
                            fontSize: "29px",
                            textDecoration: "none",
                            fontWeight: "bold",
                            marginBottom: 0
                          }
                        }}
                      />
                    </ListItem>

                    <ListItem
                      button
                      onClick={handleLogout}
                      sx={{ justifyContent: "flex-start" }}
                    >
                      <ListItemText
                        primary={t('logout')}
                        primaryTypographyProps={{
                          sx: {
                            textAlign: "left",
                            color: "white",
                            fontSize: "29px",
                            textDecoration: "none",
                            fontWeight: "bold",
                            marginBottom: 0
                          }
                        }}
                      />
                    </ListItem>

                    <ListItem button onClick={handleLangMenuOpen} sx={{ justifyContent: "flex-start" }}>
                      <ListItemText
                        primary={
                          <Typography
                            sx={{
                              textAlign: "left",
                              color: "white",
                              fontSize: "29px",
                              textDecoration: "none",
                              fontWeight: "bold",
                              marginBottom: 0
                            }}
                          >
                            <span style={{ marginRight: 4 }}>{selectedLanguage.flag}</span> {selectedLanguage.initial}
                          </Typography>
                        }
                      />
                    </ListItem>

                  </>
                )}

                <ListItem sx={{ justifyContent: "flex-start" }}>
                  <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Menu
                      anchorEl={anchorElLang}
                      open={Boolean(anchorElLang)}
                      onClose={handleLangMenuClose}
                      sx={{
                        '& .MuiPaper-root': {
                          mt: '22px',
                          boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
                          borderRadius: 0,
                          backgroundColor: '#4D4D4D',
                        }
                      }}
                    >
                      {languages.map((lang) => (
                        <MenuItem
                          key={lang.code}
                          onClick={() => {
                            handleLanguageChange(lang)
                            setMobileOpen(false);
                          }}
                          sx={{
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            borderLeft: '6px solid transparent',
                            '&:hover': {
                              color: '#5BC2E7',
                              borderLeft: '6px solid #5BC2E7',
                              backgroundColor: 'transparent',
                            }
                          }}
                        >
                          <Typography variant="span" sx={{
                            textAlign: "left",
                            color: "white",
                            fontSize: "29px",
                          }}>{lang.flag}</Typography> {lang.name}
                        </MenuItem>
                      ))}
                    </Menu>
                  </Box>
                </ListItem>
              </List>
            </Drawer>

          </AppBar>
        </Container>
      </Container >
      {
        isLoginOpen && (
          <AppLoginForm isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onSwitchToRegister={() => { setIsLoginOpen(false); setIsRegisterModalOpen(true); }} />
        )
      }
      {
        isRegisterModalOpen && (
          <AppRegisterForm isOpen={isRegisterModalOpen} onClose={() => setIsRegisterModalOpen(false)} onSwitchToRegister={() => { setIsRegisterModalOpen(false); setIsRegisterModalOpen(true); }} />
        )
      }
    </>
  );
}

export default Header;
