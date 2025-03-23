import { useEffect, useState } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from "@mui/material";

interface TableProps {
  shortUrl: string;
}

export const InfoTable = (props: TableProps) => {
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

export const StatisticTable = (props: TableProps) => {
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
