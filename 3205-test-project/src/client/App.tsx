import { useState } from "react";
import {
  Button,
  Container,
  Stack,
  TextField,
  Typography,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Box,
} from "@mui/material";
import Grid from "@mui/material/Grid2";

const InfoTable = () => {
  return (
    <>
      <Typography variant="h6" sx={{ mt: 2, textAlign: "left" }}>
        Additional Information:
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Original URL</TableCell>
              <TableCell>
                <Typography
                  component="a"
                  href={"originalUrl"}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="primary"
                >
                  originalUrl
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Creation Date</TableCell>
              <TableCell>{new Date().toLocaleString()}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Click Count</TableCell>
              <TableCell>10</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

const StatisticTable = () => {
  const analytics = [
    { date: "2025-03-22T14:30:00", ip: "192.168.1.1" },
    { date: "2025-03-22T15:00:00", ip: "192.168.1.2" },
    { date: "2025-03-22T15:30:00", ip: "192.168.1.3" },
    { date: "2025-03-22T16:00:00", ip: "192.168.1.4" },
    { date: "2025-03-22T16:30:00", ip: "192.168.1.5" },
  ];

  return (
    <>
      <Typography variant="h6" sx={{ mt: 2, textAlign: "left" }}>
        Click Statistics:
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 1 }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <strong>Date</strong>
              </TableCell>
              <TableCell>
                <strong>IP Address</strong>
              </TableCell>
            </TableRow>
            {analytics.length > 0 ? (
              analytics.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(entry.date).toLocaleString()}</TableCell>
                  <TableCell>{entry.ip}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2}>No data available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

function App() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const handleShorten = async () => {
    setShortUrl("http://localhost:3000/shorten");
    try {
      setSnackbarMessage("URL successfully shortened!");
    } catch (error) {
      setSnackbarMessage("Error shortening the URL");
    }
    setSnackbarOpen(true);
  };

  const handleDelete = () => {
    setShortUrl("");
    setSnackbarMessage("Short URL deleted.");
    setSnackbarOpen(true);
  };

  return (
    <div className="App">
      <Container maxWidth="md">
        <Grid container spacing={6} justifyContent="space-between">
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2}>
              <Typography sx={{ marginTop: "1rem" }} variant="h6">
                Original URL:
              </Typography>
              <TextField
                label="Input URL"
                variant="outlined"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <>
                <TextField
                  label="Alias"
                  variant="outlined"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                />
                <TextField
                  variant="outlined"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  label="Expires At"
                  focused
                />
              </>
              <Button
                variant="contained"
                color="primary"
                onClick={handleShorten}
                sx={{ alignSelf: "flex-end" }}
              >
                Shorten
              </Button>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2}>
              <Typography sx={{ marginTop: "1rem" }} variant="h6">
                Short URL:
              </Typography>
              {shortUrl && (
                <>
                  <Typography
                    variant="h6"
                    color="primary"
                    component="a"
                    href={shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {shortUrl}
                  </Typography>
                  {!showInfo ? (
                    <Button
                      onClick={() => setShowInfo(true)}
                      variant="text"
                      color="primary"
                      sx={{ alignSelf: "flex-end" }}
                    >
                      Show more
                    </Button>
                  ) : (
                    <>
                      <Box sx={{ width: "100%", textAlign: "left" }}>
                        <InfoTable />
                        <StatisticTable />
                      </Box>
                    </>
                  )}

                  <Button
                    onClick={handleDelete}
                    variant="text"
                    color="error"
                    sx={{ alignSelf: "flex-end", mt: 2 }}
                  >
                    Delete
                  </Button>
                </>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>
      {/* 
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <div>{snackbarMessage}</div>
      </Snackbar> */}
    </div>
  );
}

export default App;
