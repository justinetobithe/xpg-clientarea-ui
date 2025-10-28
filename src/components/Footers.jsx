import React, { useEffect, useState } from "react";
import { Box, Typography, Link as MuiLink, Container } from "@mui/material";
import { useTranslation } from 'react-i18next';
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

const Footer = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [certificate, setCertificate] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "files"), where("type", "==", "iTech Cert")),
      (snapshot) => {
        const files = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCertificate(files.length > 0 ? files[0] : null);
      },
      (error) => {
        console.error("Error fetching certificate:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "files"), where("type", "==", "privacy_policy")),
      (snapshot) => {
        const files = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFile(files.length > 0 ? files[0] : null);
      },
      (error) => {
        console.error("Error fetching file:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDownload = () => {
    if (file?.fileUrl) {
      window.open(file.fileUrl, "_blank");
    }
  };

  return (
    <Container maxWidth sx={{ backgroundColor: "#444444", padding: { xs: "0 !important", sm: "0 !important" } }}>
      <Container maxWidth="xl" sx={{ backgroundColor: "#fff", padding: "0 !important" }}>
        <Box component="footer" sx={{ backgroundColor: "#262626", color: "#fff", py: 5, textAlign: "center" }}>
          <Container maxWidth="md">
            <Link to="/">
              <img
                src="/image/xpg-logo-clientarea.png"
                alt="XPG Logo"
                style={{ height: 50, marginBottom: 10 }}
              />
            </Link>

            <Typography variant="body2" sx={{ fontSize: 13, color: "#9B9B9B" }}>
              {t('footer.privacy_policy')}{' '}
              {file?.fileUrl ? (
                <MuiLink component="button" onClick={handleDownload} color="#5BC2E7">
                  {t('footer.here')}
                </MuiLink>
              ) : (
                <span style={{ color: "#ccc", fontStyle: "italic" }}>Coming soon</span>
              )}
              .
            </Typography>

            <Typography variant="body2" sx={{ mb: 2, fontSize: 13, color: "#9B9B9B" }}>
              {t('footer.cookie_policy')} <MuiLink href="#" color="#5BC2E7">{t('footer.here')}</MuiLink>.
            </Typography>

            <Typography variant="body2" sx={{ mt: 2, fontWeight: "bold", fontSize: 13, color: "#9B9B9B" }}>
              {t('footer.copyright')}
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mt: 3,
              }}
            >
              {certificate?.fileUrl && (
                <a
                  href={certificate.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Download iTech Labs Certificate"
                >
                  <img
                    src="/image/itech-lab-icon.png"
                    alt="iTech Labs"
                    style={{
                      filter: 'grayscale(100%)',
                      height: 80,
                      width: 'auto',
                      objectFit: "contain",
                    }}
                  />
                </a>
              )}
            </Box>
          </Container>
        </Box>
      </Container>
    </Container>
  );
};

export default Footer;
