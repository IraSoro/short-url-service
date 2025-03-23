import { useEffect, useState } from "react";
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

interface ShortUrlProps {
  shortUrl: string;
}

const InfoTable = (props: ShortUrlProps) => {
  const [originalUrl, setOriginalUrl] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    if (props.shortUrl === "") return;

    const fetchInfo = async () => {
      try {
        const response = await fetch(`/info/${props.shortUrl}`, {
          method: "GET",
        });

        if (response.status === 404) {
          throw new Error(
            `Server returned 404 status code [${
              response.status
            }]: ${await response.text()}`
          );
        }

        const data = await response.json();
        setOriginalUrl(data.originalUrl);
        setCreatedAt(data.createdAt);
        setClickCount(data.clickCount);
      } catch (error) {
        console.error("Error fetching URL info:", error);
      }
    };

    fetchInfo();
  }, [props.shortUrl]);

  return (
    <>
      <Typography variant="h6" sx={{ mt: 2, textAlign: "left" }}>
        Additional Information:
      </Typography>
      <TableContainer component={Paper} elevation={0} sx={{ mt: 1 }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Original URL</TableCell>
              <TableCell>
                <Typography
                  component="a"
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="primary"
                >
                  {originalUrl}
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Creation Date</TableCell>
              <TableCell>{createdAt}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Click Count</TableCell>
              <TableCell>{clickCount}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

const StatisticTable = (props: ShortUrlProps) => {
  const [ipAddresses, setIpAddresses] = useState<string[]>([]);

  useEffect(() => {
    if (props.shortUrl === "") return;

    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/analytics/${props.shortUrl}`, {
          method: "GET",
        });

        if (response.status === 404) {
          throw new Error(
            `Server returned 404 status code [${
              response.status
            }]: ${await response.text()}`
          );
        }

        const data = await response.json();
        setIpAddresses(data.ipAddresses);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchAnalytics();
  }, [props.shortUrl]);

  return (
    <>
      <Typography variant="h6" sx={{ mt: 2, textAlign: "left" }}>
        Statistics:
      </Typography>
      <TableContainer component={Paper} elevation={0} sx={{ mt: 1 }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <strong>IP Address</strong>
              </TableCell>
            </TableRow>
            {ipAddresses.length > 0 ? (
              ipAddresses.map((ip, index) => (
                <TableRow key={index}>
                  <TableCell>{ip}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={1}>No data available</TableCell>
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

  const clearInputs = () => {
    setUrl("");
    setAlias("");
    setExpiresAt("");
  };

  const handleShorten = async () => {
    if (url === "") {
      setSnackbarMessage("URL field is empty");
      setSnackbarOpen(true);
      return;
    }

    try {
      const response = await fetch("/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalUrl: url,
          alias: alias || undefined,
          expiresAt: expiresAt || undefined,
        }),
      });

      if (response.status === 400) {
        throw new Error(
          `Server returned 400 status code [${
            response.status
          }]: ${await response.text()}`
        );
      }

      if (response.status === 200) {
        setSnackbarMessage("The URL has already been shorted");
        setSnackbarOpen(true);
      }

      const shortUrl = await response.text();
      setShortUrl(shortUrl);
      clearInputs();
    } catch (error) {
      console.error("Error shortening URL:", error);
      setSnackbarMessage("Error shortening URL");
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/delete/${shortUrl}`, {
        method: "DELETE",
      });

      if (response.status !== 200) {
        throw new Error(
          `Server returned non-200 status code [${
            response.status
          }]: ${await response.text()}`
        );
      }

      setShortUrl("");
      setSnackbarMessage("Short URL deleted successfully.");
      clearInputs();
    } catch (error) {
      console.error("Error deleting URL:", error);
      setSnackbarMessage("An error occurred while deleting the URL.");
    }
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
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
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
                    <Button
                      onClick={handleDelete}
                      variant="outlined"
                      color="error"
                    >
                      Delete
                    </Button>
                  </Box>
                  <Box sx={{ width: "100%", textAlign: "left" }}>
                    <InfoTable shortUrl={shortUrl} />
                    <StatisticTable shortUrl={shortUrl} />
                  </Box>
                </>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <div>{snackbarMessage}</div>
      </Snackbar>
    </div>
  );
}

export default App;
