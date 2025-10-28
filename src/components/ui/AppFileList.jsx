import React, { useState, useContext } from "react";
import { List, ListItem, ListItemAvatar, Avatar, ListItemText, IconButton, Tooltip, Button, DialogActions, Box, useMediaQuery } from "@mui/material";
import PreviewIcon from "@mui/icons-material/Visibility";
import FileDownloadIcon from "@mui/icons-material/Download";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import { CartContext } from "../../contexts/CartContext";
import defaultThumbnail from "../../assets/images/thumbnails/file-icon.png";
import { getThumbnailForFile, extractFileInfo } from "../helpers/fileUtils";
import AppDialog from "./AppDialog";
import { useTheme } from "@mui/material/styles";

const AppFileList = ({ files }) => {
    const { addItem } = useContext(CartContext);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const handleDownload = async (file, fileName = "download") => {
        try {
            const response = await fetch(file.url, { mode: "cors" });
            if (!response.ok) throw new Error("Network error");
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = blobUrl;
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Error downloading file:", error);
        }
    };

    const handlePreview = (file) => {
        setSelectedFile(file);
        setIsDialogOpen(true);
    };

    if (!Array.isArray(files) || files.length === 0) {
        return <p style={{ marginTop: "1rem" }}>No files available.</p>;
    }

    return (
        <>
            <List sx={{ mt: 2 }}>
                {files.filter(Boolean).map((file, index) => {
                    if (!file || !file.url) return null;

                    const { fileName, extension } = extractFileInfo(file);

                    return (
                        <ListItem
                            key={index}
                            sx={{
                                m: 2,
                                bgcolor: "#f0f0f0",
                                width: "auto",
                                flexDirection: isSmallScreen ? "column" : "row",
                                alignItems: "center",
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar
                                    variant="square"
                                    src={getThumbnailForFile(file.url)}
                                    alt={`Thumbnail ${fileName}`}
                                    sx={{
                                        width: 70,
                                        height: 70,
                                        bgcolor: "transparent",
                                        '& img': {
                                            width: '100%',
                                            height: '100%',
                                            objectFit: extension.toLowerCase().match(/(jpg|jpeg|png)/) ? 'contain' : 'contain',
                                        },
                                    }}
                                    onError={(e) => { e.target.src = defaultThumbnail; }}
                                />

                            </ListItemAvatar>

                            <Box sx={{ flex: 1, ml: 2 }}>
                                <ListItemText
                                    primary={fileName}
                                    secondary={`Format: ${extension.toLowerCase()} | Size: ${file.size || "N/A"} ${file.dimensions ? `| Dimensions: ${file.dimensions}` : ''}`}
                                    sx={{
                                        wordBreak: "break-word",
                                        whiteSpace: "normal",
                                        overflowWrap: "anywhere"
                                    }}
                                />
                            </Box>

                            {isSmallScreen ? (
                                <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                                    <Tooltip title="Preview">
                                        <IconButton onClick={() => handlePreview(file)}>
                                            <PreviewIcon color="primary" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Download">
                                        <IconButton onClick={() => handleDownload(file, fileName)}>
                                            <FileDownloadIcon color="secondary" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Add to cart">
                                        <IconButton onClick={() => addItem({ url: file, fileName })}>
                                            <ShoppingCartIcon color="secondary" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            ) : (
                                <Box sx={{ display: "flex", gap: 1 }}>
                                    <Tooltip title="Preview">
                                        <IconButton onClick={() => handlePreview(file)}>
                                            <PreviewIcon color="primary" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Download">
                                        <IconButton onClick={() => handleDownload(file, fileName)}>
                                            <FileDownloadIcon color="secondary" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Add to cart">
                                        <IconButton onClick={() => addItem({ url: file, fileName })}>
                                            <ShoppingCartIcon color="secondary" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            )}
                        </ListItem>
                    );
                })}
            </List>

            <AppDialog isOpen={isDialogOpen} title="Preview" onClose={() => setIsDialogOpen(false)}>
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 3 }}>
                    {selectedFile && (
                        <img
                            src={selectedFile.url}
                            alt="Preview"
                            style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
                        />
                    )}
                </Box>
                <DialogActions>
                    <Button onClick={() => handleDownload(selectedFile)} color="primary" variant="contained" startIcon={<FileDownloadIcon />}>Download</Button>
                    <Button onClick={() => addItem({ url: selectedFile })} color="secondary" variant="contained" startIcon={<ShoppingCartIcon />}>Add to Cart</Button>
                </DialogActions>
            </AppDialog>
        </>
    );
};

export default AppFileList;
