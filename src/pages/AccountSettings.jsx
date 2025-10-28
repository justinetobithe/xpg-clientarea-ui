import React, { useEffect, useState, useMemo } from "react";
import { getAuth, updatePassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useSnackbar } from "../components/AppSnackbar";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import LockOutlined from "@mui/icons-material/LockOutlined";
import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import PersonOutline from "@mui/icons-material/PersonOutline";
import PublicOutlined from "@mui/icons-material/PublicOutlined";
import GroupOutlined from "@mui/icons-material/GroupOutlined";
import { useTranslation } from "react-i18next";

export default function AccountSettings() {
  const { showSnackbar } = useSnackbar();
  const [email, setEmail] = useState("");
  const [initialFullName, setInitialFullName] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [team, setTeam] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatNewPassword, setRepeatNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setInitialLoading(false);
      return;
    }
    setEmail(user.email || "");
    const docRef = doc(db, "users", user.uid);
    getDoc(docRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setInitialFullName(data.fullName || "");
          setFullName(data.fullName || "");
          setCompany(data.company || "");
          setTeam(data.team || "");
          setCompanyWebsite(data.companyWebsite || "");
        }
      })
      .finally(() => setInitialLoading(false));
  }, []);

  const canShowSaveButton = useMemo(() => {
    const hasChanges =
      fullName.trim() !== initialFullName.trim() ||
      company.trim() !== "" ||
      team.trim() !== "" ||
      companyWebsite.trim() !== "" ||
      newPassword.length > 0 ||
      repeatNewPassword.length > 0;
    const pwValid =
      (newPassword.length === 0 && repeatNewPassword.length === 0) ||
      (newPassword.length >= 6 && newPassword === repeatNewPassword);
    return hasChanges && pwValid;
  }, [fullName, initialFullName, company, team, companyWebsite, newPassword, repeatNewPassword]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      showSnackbar(t("error_not_logged_in"), "error");
      setLoading(false);
      return;
    }
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          fullName: fullName.trim(),
          company: company.trim(),
          team: team.trim(),
          companyWebsite: companyWebsite.trim()
        },
        { merge: true }
      );
      setInitialFullName(fullName.trim());
      showSnackbar(t("success_user_data_updated"), "success");
      if (newPassword.length > 0) {
        await updatePassword(user, newPassword);
        showSnackbar(t("success_password_changed"), "success");
        setNewPassword("");
        setRepeatNewPassword("");
        await signOut(auth);
        showSnackbar(t("info_logged_out_new_password"), "info");
      }
    } catch (error) {
      showSnackbar(error.message, "error");
    }
    setLoading(false);
  };

  const Field = ({ icon, label, value, onChange, disabled, type = "text", placeholder = "" }) => (
    <Stack spacing={0.75}>
      <Typography sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 13 }}>{label}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#1a1f2a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 1.2, px: 1.25, py: 0.75 }}>
        {icon}
        <TextField
          fullWidth
          value={value}
          onChange={onChange}
          disabled={disabled}
          type={type}
          placeholder={placeholder}
          size="small"
          variant="standard"
          InputProps={{ disableUnderline: true, sx: { color: "#fff" } }}
        />
      </Box>
    </Stack>
  );

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#0b0d13" }}>
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
        <Paper
          sx={{
            maxWidth: 980,
            mx: "auto",
            p: { xs: 2.5, md: 4 },
            bgcolor: "#141824",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 2
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ bgcolor: "#23b0ff", color: "#0b0d13", fontWeight: 900 }}>X</Avatar>
              <Box>
                <Typography variant="h4" sx={{ color: "#fff", fontWeight: 900, lineHeight: 1 }}>
                  {t("account_settings_title")}
                </Typography>
                <Typography sx={{ color: "rgba(255,255,255,0.7)" }}>{t("your_details_title")}</Typography>
              </Box>
            </Stack>
          </Stack>

          {initialLoading ? (
            <Box>
              <Grid container spacing={2} sx={{ maxWidth: 760, mt: 1 }}>
                {[...Array(6)].map((_, i) => (
                  <Grid key={i} item xs={12}>
                    <Skeleton variant="rounded" height={56} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
                  </Grid>
                ))}
              </Grid>
              <Divider sx={{ my: 3, borderColor: "rgba(255,255,255,0.06)" }} />
              <Grid container spacing={2} sx={{ maxWidth: 760 }}>
                {[...Array(2)].map((_, i) => (
                  <Grid key={i} item xs={12}>
                    <Skeleton variant="rounded" height={56} sx={{ bgcolor: "rgba(255,255,255,0.06)" }} />
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Skeleton variant="rounded" width={180} height={48} sx={{ bgcolor: "rgba(255,255,255,0.08)", borderRadius: "24px" }} />
              </Box>
            </Box>
          ) : (
            <form onSubmit={handleSaveSettings}>
              <Grid container spacing={2.25} sx={{ maxWidth: 760, mt: 1 }}>
                <Grid item xs={12}>
                  <Field
                    icon={<PersonOutline sx={{ color: "rgba(255,255,255,0.7)" }} />}
                    label={t("email_label")}
                    value={email}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    icon={<PersonOutline sx={{ color: "rgba(255,255,255,0.7)" }} />}
                    label={t("full_name_label")}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    icon={<BusinessOutlined sx={{ color: "rgba(255,255,255,0.7)" }} />}
                    label={t("company_label")}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Your Company"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    icon={<GroupOutlined sx={{ color: "rgba(255,255,255,0.7)" }} />}
                    label={t("team_label")}
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="Partnerships, Marketing, Tech"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    icon={<PublicOutlined sx={{ color: "rgba(255,255,255,0.7)" }} />}
                    label={t("company_website_label")}
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://example.com"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 4, borderColor: "rgba(255,255,255,0.06)" }} />

              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <LockOutlined sx={{ color: "#fff" }} />
                <Typography variant="h6" sx={{ color: "#fff", fontWeight: 900 }}>
                  {t("change_password_title")}
                </Typography>
              </Stack>
              <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontStyle: "italic", mb: 2 }}>
                {t("change_password_info")}
              </Typography>

              <Grid container spacing={2.25} sx={{ maxWidth: 760 }}>
                <Grid item xs={12}>
                  <Field
                    icon={<LockOutlined sx={{ color: "rgba(255,255,255,0.7)" }} />}
                    label={t("set_new_password_label")}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    type="password"
                    placeholder="••••••"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    icon={<LockOutlined sx={{ color: "rgba(255,255,255,0.7)" }} />}
                    label={t("repeat_new_password_label")}
                    value={repeatNewPassword}
                    onChange={(e) => setRepeatNewPassword(e.target.value)}
                    type="password"
                    placeholder="••••••"
                  />
                </Grid>
                {newPassword !== repeatNewPassword && (newPassword || repeatNewPassword) && (
                  <Grid item xs={12}>
                    <Typography sx={{ color: "#ff6b6b", fontSize: 13 }}>Passwords do not match.</Typography>
                  </Grid>
                )}
                {newPassword && newPassword.length < 6 && (
                  <Grid item xs={12}>
                    <Typography sx={{ color: "#ffb347", fontSize: 13 }}>Password must be at least 6 characters.</Typography>
                  </Grid>
                )}
              </Grid>

              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  sx={{ bgcolor: "#23b0ff", "&:hover": { bgcolor: "#1aa1ef" }, borderRadius: "24px", height: 48, px: 3, fontWeight: 900 }}
                  disabled={loading || !canShowSaveButton}
                  type="submit"
                >
                  {loading ? <CircularProgress size={22} sx={{ color: "#0b0d13" }} /> : t("save_settings_button")}
                </Button>
                <Button
                  variant="outlined"
                  sx={{ borderColor: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.9)", borderRadius: "24px", height: 48, px: 3 }}
                  disabled={loading}
                  onClick={() => {
                    setFullName(initialFullName);
                    setCompany("");
                    setTeam("");
                    setCompanyWebsite("");
                    setNewPassword("");
                    setRepeatNewPassword("");
                  }}
                >
                  Reset
                </Button>
              </Stack>
            </form>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
