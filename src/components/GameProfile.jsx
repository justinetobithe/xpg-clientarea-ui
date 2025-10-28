// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import {
//   doc,
//   getDoc,
//   collection,
//   query,
//   orderBy,
//   limit,
//   onSnapshot,
//   where,
//   getDocs,
// } from 'firebase/firestore';
// import { db } from '../firebase';
// import {
//   Box,
//   Typography,
//   Grid,
//   Card,
//   CardActionArea,
//   CardMedia,
//   Container,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Skeleton,
// } from '@mui/material';
// import Accordion from '@mui/material/Accordion';
// import AccordionDetails from '@mui/material/AccordionDetails';
// import AccordionSummary from '@mui/material/AccordionSummary';
// import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
// import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
// import defaultThumbnail from '../assets/images/thumbnails/file-icon.png';
// import AppFileList from './ui/AppFileList';
// import { useAuth } from '../contexts/AuthContext';
// import { useTranslation } from 'react-i18next';

// function GameProfile() {
//   const { gameId } = useParams();
//   const navigate = useNavigate();
//   const { t, i18n } = useTranslation();
//   const { currentUser } = useAuth();

//   const [game, setGame] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [imageLoaded, setImageLoaded] = useState(false);
//   const [error, setError] = useState(null);
//   const [expanded, setExpanded] = useState(null);

//   const [fileTypeFilters, setFileTypeFilters] = useState({});
//   const [promotionGames, setPromotionGames] = useState([]);

//   const INITIAL_CHUNK = 30;
//   const LOAD_MORE_STEP = 50;
//   const [visibleCounts, setVisibleCounts] = useState({});

//   const showMore = (idx, total) =>
//     setVisibleCounts((prev) => ({
//       ...prev,
//       [idx]: Math.min((prev[idx] ?? INITIAL_CHUNK) + LOAD_MORE_STEP, total),
//     }));

//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []);

//   useEffect(() => {
//     if (!gameId || !currentUser) {
//       setLoading(false);
//       return;
//     }

//     const fetchGame = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         let gameData = null;

//         if (currentUser.role === 'super admin') {
//           const gameRef = doc(db, 'games', gameId);
//           const gameSnap = await getDoc(gameRef);
//           if (!gameSnap.exists()) {
//             setError('Game not found');
//             return;
//           }
//           gameData = gameSnap.data();
//         } else {
//           const accessRef = collection(db, 'gameUserAccess');
//           const accessQuery = query(
//             accessRef,
//             where('game_id', '==', gameId),
//             where('user_id', '==', currentUser?.uid)
//           );
//           const accessSnap = await getDocs(accessQuery);
//           if (accessSnap.empty) {
//             setError('You do not have access to this game.');
//             navigate('/dashboard');
//             return;
//           }
//           const allowedSections = accessSnap.docs
//             .map((d) => d.data())
//             .flatMap((a) => a.customSections?.map((s) => s.section_id) || []);

//           const gameRef = doc(db, 'games', gameId);
//           const gameSnap = await getDoc(gameRef);
//           if (!gameSnap.exists()) {
//             setError('Game not found');
//             return;
//           }
//           gameData = gameSnap.data();

//           if (Array.isArray(gameData.customSections)) {
//             gameData.customSections = gameData.customSections.filter((s) =>
//               allowedSections.includes(s.id)
//             );
//           }
//         }

//         setGame(gameData);
//       } catch (err) {
//         console.error('Error fetching game:', err);
//         setError('Error fetching game');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchGame();
//   }, [gameId, currentUser, navigate]);

//   useEffect(() => {
//     if (game && (game.imageURL || game.bannerURL)) {
//       const img = new Image();
//       img.src = game.bannerURL ?? game.imageURL;
//       img.onload = () => setImageLoaded(true);
//       img.onerror = () => setImageLoaded(true);
//     } else {
//       setImageLoaded(true);
//     }
//   }, [game]);

//   useEffect(() => {
//     if (!currentUser) return;

//     let unsubscribe;
//     (async () => {
//       try {
//         let gamesQuery;

//         if (currentUser.role === 'super admin') {
//           gamesQuery = query(
//             collection(db, 'games'),
//             orderBy('createdAt', 'desc'),
//             limit(10)
//           );
//         } else {
//           const gameUserAccessRef = collection(db, 'gameUserAccess');
//           const accessQuery = query(
//             gameUserAccessRef,
//             where('user_id', '==', currentUser.uid)
//           );
//           const accessSnap = await getDocs(accessQuery);
//           const ids = accessSnap.docs.map((d) => d.data().game_id);
//           if (ids.length === 0) {
//             setPromotionGames([]);
//             return;
//           }
//           gamesQuery = query(
//             collection(db, 'games'),
//             where('id', 'in', ids.slice(0, 10)),
//             orderBy('createdAt', 'desc'),
//             limit(10)
//           );
//         }

//         unsubscribe = onSnapshot(
//           gamesQuery,
//           (snap) => {
//             const data = snap.docs
//               .map((d) => ({ id: d.id, ...d.data() }))
//               .filter((g) => g.id !== gameId);
//             setPromotionGames(data);
//           },
//           (err) => console.error('Error fetching promotion games:', err)
//         );
//       } catch (err) {
//         console.error('Error setting up promotion games subscription:', err);
//       }
//     })();

//     return () => {
//       if (typeof unsubscribe === 'function') unsubscribe();
//     };
//   }, [gameId, currentUser]);

//   const handleFilterChange = (sectionIndex, event) => {
//     setFileTypeFilters((prev) => ({
//       ...prev,
//       [sectionIndex]: event.target.value,
//     }));
//     setVisibleCounts((prev) => ({
//       ...prev,
//       [sectionIndex]: INITIAL_CHUNK,
//     }));
//   };

//   const handleAccordionChange = (panel) => (_evt, isExpanded) => {
//     setExpanded(isExpanded ? panel : null);
//   };

//   const handlePromotionClick = (promotionGameId) => {
//     window.scrollTo(0, 0);
//     setExpanded(null);
//     navigate(`/game/${promotionGameId}`);
//   };

//   if (error) {
//     return (
//       <Container maxWidth="xl" sx={{ pt: 10, pb: 5 }}>
//         <Typography variant="h5" color="error" align="center">
//           {error}
//         </Typography>
//       </Container>
//     );
//   }

//   return (
//     <>
//       <Container
//         maxWidth
//         sx={{ backgroundColor: '#444444', padding: { xs: '0 !important', sm: '0 !important' } }}
//       >
//         <Container maxWidth="xl" sx={{ backgroundColor: '#fff', padding: '0 !important' }}>
//           {loading || !imageLoaded ? (
//             <Skeleton
//               variant="rectangular"
//               sx={{
//                 width: '100%',
//                 height: { xs: 200, sm: 450, md: 600 },
//                 mx: { xs: 'auto', sm: 'auto' },
//               }}
//             />
//           ) : (
//             (game?.imageURL || game?.bannerURL) && (
//               <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
//                 <CardMedia
//                   component="img"
//                   image={(game?.bannerURL ?? game?.imageURL) || defaultThumbnail}
//                   alt={game?.name || 'Game Image'}
//                   sx={{
//                     width: '100%',
//                     height: 'auto',
//                     maxHeight: { xs: 200, sm: 450, md: 600 },
//                     objectFit: 'cover',
//                     objectPosition: 'center',
//                     mx: { xs: 'auto', sm: 'auto' },
//                   }}
//                 />
//               </Box>
//             )
//           )}
//         </Container>
//       </Container>

//       <Container
//         maxWidth
//         sx={{ backgroundColor: '#444444', padding: { xs: '0 !important', sm: '0 !important' } }}
//       >
//         <Container maxWidth="xl" sx={{ backgroundColor: '#fff', padding: '0 !important' }}>
//           <Container maxWidth="xl" sx={{ pt: 10, pb: 5 }}>
//             {loading ? (
//               <>
//                 <Skeleton variant="text" sx={{ fontSize: '32px', width: '60%' }} />
//                 <Skeleton variant="text" sx={{ fontSize: '16px', width: '80%' }} />
//                 <Skeleton variant="text" sx={{ fontSize: '16px', width: '70%' }} />
//                 <Box sx={{ width: { sm: '100%', md: '75%', lg: '75%' }, mt: 3 }}>
//                   {[...Array(3)].map((_, i) => (
//                     <Skeleton
//                       key={i}
//                       variant="rectangular"
//                       height={70}
//                       sx={{ mb: 2, borderRadius: 2 }}
//                     />
//                   ))}
//                 </Box>
//               </>
//             ) : (
//               <>
//                 <Typography variant="h3" gutterBottom color="#595959" sx={{ fontSize: '32px' }}>
//                   {game?.[i18n.language]?.name || game?.name}
//                 </Typography>

//                 {game?.description && (
//                   <Typography variant="body1" gutterBottom color="#595959" sx={{ fontSize: '16px' }}>
//                     {game?.[i18n.language]?.description || game?.description}
//                   </Typography>
//                 )}

//                 {Array.isArray(game?.customSections) && game.customSections.length > 0 && (
//                   <Box sx={{ width: { sm: '100%', md: '75%', lg: '75%' }, mt: 3 }}>
//                     {game.customSections
//                       .slice()
//                       .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
//                       .map((section, index) => {
//                         const isOpen = expanded === `panel-${index}`;

//                         const filesArr = isOpen ? section.files || [] : [];
//                         const fileTypes = isOpen
//                           ? Array.from(
//                             new Set(filesArr.map((f) => f?.type).filter(Boolean))
//                           )
//                           : [];

//                         const appliedFilter = fileTypeFilters[index];
//                         const filteredFiles = isOpen
//                           ? appliedFilter
//                             ? filesArr.filter((f) => f?.type === appliedFilter)
//                             : filesArr
//                           : [];

//                         const total = filteredFiles.length;
//                         const visible =
//                           isOpen && total > 0
//                             ? Math.min(visibleCounts[index] ?? INITIAL_CHUNK, total)
//                             : 0;
//                         const displayFiles = isOpen ? filteredFiles.slice(0, visible) : [];

//                         return (
//                           <Accordion
//                             key={index}
//                             expanded={isOpen}
//                             onChange={handleAccordionChange(`panel-${index}`)}
//                             sx={{ mb: 2, borderRadius: 2 }}
//                           >
//                             <AccordionSummary
//                               expandIcon={
//                                 <Box
//                                   sx={{
//                                     width: 25,
//                                     height: 25,
//                                     borderRadius: '50%',
//                                     backgroundColor: '#414141',
//                                     display: 'flex',
//                                     justifyContent: 'center',
//                                     alignItems: 'center',
//                                   }}
//                                 >
//                                   <ArrowDropDownIcon sx={{ color: '#e3e3e3', fontSize: 30 }} />
//                                 </Box>
//                               }
//                               aria-controls={`panel${index}-content`}
//                               id={`panel${index}-header`}
//                               sx={{
//                                 backgroundColor: isOpen ? '#5BC2E7' : '#f5f5f5',
//                                 display: 'flex',
//                                 alignItems: 'center',
//                               }}
//                             >
//                               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                                 <Box
//                                   sx={{
//                                     width: 40,
//                                     height: 40,
//                                     borderRadius: '50%',
//                                     backgroundColor: '#414141',
//                                     display: 'flex',
//                                     justifyContent: 'center',
//                                     alignItems: 'center',
//                                     mr: 3,
//                                   }}
//                                 >
//                                   <InsertDriveFileIcon sx={{ color: '#fff', fontSize: 20 }} />
//                                 </Box>
//                                 <Typography
//                                   variant="h6"
//                                   sx={{ color: isOpen ? '#fff' : '#000', fontSize: '16px' }}
//                                 >
//                                   {section.title || 'Untitled Section'}
//                                 </Typography>
//                               </Box>
//                             </AccordionSummary>

//                             {isOpen && (
//                               <AccordionDetails>
//                                 {fileTypes.length > 1 && (
//                                   <FormControl fullWidth sx={{ mb: 2 }}>
//                                     <InputLabel>{t('gameProfile.filter_by_file_type')}</InputLabel>
//                                     <Select
//                                       value={appliedFilter || ''}
//                                       onChange={(e) => handleFilterChange(index, e)}
//                                       displayEmpty
//                                       sx={{ width: { xs: '100%', sm: '50%' } }}
//                                     >
//                                       <MenuItem value="">{t('gameProfile.all')}</MenuItem>
//                                       {fileTypes.map((type) => (
//                                         <MenuItem key={type} value={type}>
//                                           {type}
//                                         </MenuItem>
//                                       ))}
//                                     </Select>
//                                   </FormControl>
//                                 )}

//                                 <AppFileList files={displayFiles} />

//                                 {visible < total && (
//                                   <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
//                                     <button
//                                       type="button"
//                                       onClick={() => showMore(index, total)}
//                                       style={{
//                                         padding: '8px 12px',
//                                         borderRadius: 6,
//                                         border: '1px solid #bdbdbd',
//                                         background: '#fff',
//                                         cursor: 'pointer',
//                                       }}
//                                     >
//                                       {t('gameProfile.load_more') || 'Load more'}
//                                     </button>
//                                     <Typography variant="body2" sx={{ ml: 2, color: '#666' }}>
//                                       {visible} / {total}
//                                     </Typography>
//                                   </Box>
//                                 )}
//                               </AccordionDetails>
//                             )}
//                           </Accordion>
//                         );
//                       })}
//                   </Box>
//                 )}
//               </>
//             )}
//           </Container>
//         </Container>
//       </Container>

//       <Container
//         maxWidth
//         sx={{
//           pt: 5,
//           pb: 5,
//           backgroundColor: '#444444',
//           padding: { xs: '0 !important', sm: '0 !important' },
//         }}
//       >
//         <Container maxWidth="xl" sx={{ backgroundColor: '#fff', padding: '0 !important' }}>
//           <Container maxWidth="xl" sx={{ pt: 5, pb: 5 }}>
//             {loading ? (
//               <>
//                 <Skeleton variant="text" sx={{ fontSize: '24px', width: '50%', mb: 4 }} />
//                 <Grid container spacing={3} justifyContent="center" sx={{ mt: 4 }}>
//                   {[...Array(4)].map((_, i) => (
//                     <Grid item key={i} xs={6} sm={4} md={3} lg={3} xl={2.4}>
//                       <Skeleton
//                         variant="rectangular"
//                         sx={{
//                           boxShadow: 3,
//                           borderRadius: 0,
//                           height: { xs: 100, sm: 120, md: 140, lg: 180, xl: 160 },
//                           mx: 'auto',
//                         }}
//                       />
//                       <Skeleton variant="text" sx={{ fontSize: '16px', mt: 1 }} />
//                     </Grid>
//                   ))}
//                 </Grid>
//               </>
//             ) : (
//               <>
//                 <Typography variant="h4" fontWeight="bold" gutterBottom color="#595959">
//                   {t('gameProfile.more_promotion_packs')}
//                 </Typography>
//                 <Grid container spacing={3} justifyContent="center" sx={{ mt: 4 }}>
//                   {promotionGames.map((promotionGame) => (
//                     <Grid item key={promotionGame.id} xs={6} sm={4} md={3} lg={3} xl={2.4}>
//                       <Card
//                         sx={{
//                           boxShadow: 3,
//                           borderRadius: 0,
//                           transition: '0.3s',
//                           '&:hover': { transform: 'scale(1.05)' },
//                           position: 'relative',
//                           overflow: 'hidden',
//                           mx: { xs: 'auto', sm: 'auto' },
//                         }}
//                         onClick={() => handlePromotionClick(promotionGame.id)}
//                       >
//                         <CardActionArea
//                           sx={{
//                             display: 'flex',
//                             justifyContent: 'center',
//                             alignItems: 'center',
//                             height: { xs: 100, sm: 120, md: 140, lg: 180, xl: 160 },
//                           }}
//                         >
//                           <CardMedia
//                             component="img"
//                             sx={{
//                               width: '100%',
//                               height: { xs: 100, sm: 120, md: 140, lg: 180, xl: 160 },
//                               objectFit: 'cover',
//                             }}
//                             image={
//                               promotionGame.imageURL ||
//                               'https://via.placeholder.com/300?text=No+Image'
//                             }
//                             alt={promotionGame?.[i18n.language]?.name || promotionGame?.name}
//                           />
//                         </CardActionArea>
//                       </Card>
//                       <Typography
//                         variant="h6"
//                         sx={{
//                           fontSize: { xs: '16px', sm: '16px', lg: '20px' },
//                           color: '#595959',
//                           p: 1,
//                         }}
//                       >
//                         {promotionGame?.[i18n.language]?.name || promotionGame?.name}
//                       </Typography>
//                     </Grid>
//                   ))}
//                 </Grid>
//               </>
//             )}
//           </Container>
//         </Container>
//       </Container>
//     </>
//   );
// }

// export default GameProfile;


import React from 'react'

export default function GameProfile() {
  return (
    <div>GameProfile</div>
  )
}
