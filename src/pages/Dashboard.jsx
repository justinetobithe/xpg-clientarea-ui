// import React, { useState, useEffect } from "react";
// import LatestGames from '../components/LatestGames';
// import GameGrid from '../components/GameGrid';
// import { Box, Container, Typography } from "@mui/material";
// import { collection, onSnapshot, query, where } from "firebase/firestore";
// import { db } from "../firebase";
// import { useTranslation } from "react-i18next";

// function Dashboard() {
//   const [gameBanner, setGameBanner] = useState(null); 
//   const { t, i18n } = useTranslation();

//   useEffect(() => {
//     const fetchBanner = async () => {
//       const bannerRef = collection(db, 'banners');
//       const bannerQuery = query(bannerRef, where('page', '==', 'Games'));

//       const unsubscribeBanner = onSnapshot(
//         bannerQuery,
//         async (snapshot) => {
//           if (!snapshot.empty) {
//             const bannerData = snapshot.docs[0].data();
//             setGameBanner(bannerData);
//           }
//         },
//         (error) => console.error("Error fetching games banner:", error)
//       );

//       return () => unsubscribeBanner();
//     };

//     fetchBanner();
//   }, []);

//   console.log("t", t)

//   return (
//     <>
//       <Container maxWidth sx={{ backgroundColor: "#444444", padding: { xs: "0 !important", sm: "0 !important" } }}>
//         <Container maxWidth="xl" sx={{ backgroundColor: "#fff", padding: "0 !important" }}>
//           <Box
//             sx={{
//               position: 'relative',
//               width: '100%',
//               minHeight: { xs: 170, sm: 300, md: 400 },
//               backgroundImage: gameBanner?.image ? `url(${gameBanner.image})` : `url(/image/bg_1000x500.jpg)`,
//               backgroundSize: 'cover',
//               backgroundPosition: 'center',
//               display: 'flex',
//               alignItems: 'center',
//               justifyContent: 'center',
//               flexDirection: 'column',
//               textAlign: 'center',
//               color: 'white',
//             }}
//           >
//             <Box
//               sx={{
//                 position: 'absolute',
//                 top: 0,
//                 left: 0,
//                 width: '100%',
//                 height: '100%',
//                 backgroundColor: 'rgba(0, 0, 0, 0.5)'
//               }}
//             />
//             <Box sx={{ zIndex: 1, maxWidth: '80%' }}>
//               <Typography variant="h1" component="h1" sx={{ fontSize: { xs: 36, sm: 36, md: 64 }, mb: 2 }}>
//                 {(gameBanner?.[i18n.language]?.text || gameBanner?.text)}
//               </Typography>
//               {gameBanner?.subText && (
//                 <Typography variant="span" mt={1} sx={{ fontSize: { xs: 18, sm: 18, md: 20 } }}>
//                   {(gameBanner?.[i18n.language]?.subText || gameBanner?.subText)} 
//                 </Typography>
//               )}
//             </Box>
//           </Box>
//         </Container>
//       </Container>

//       <Container maxWidth sx={{ backgroundColor: "#444444", padding: { xs: "0 !important", sm: "0 !important" } }}>
//         <Container maxWidth="xl" sx={{ backgroundColor: "#262626", padding: "0 !important" }}>
//           <LatestGames />
//         </Container>
//       </Container>

//       <Container maxWidth sx={{ backgroundColor: "#444444", padding: { xs: "0 !important", sm: "0 !important" } }}>
//         <Container maxWidth="xl" sx={{ backgroundColor: "#fff", padding: "0 !important" }}>
//           <GameGrid />
//         </Container>
//       </Container>
//     </>
//   );
// }

// export default Dashboard;


import React from 'react'

export default function Dashboard() {
  return (
    <div>Dashboard</div>
  )
}
