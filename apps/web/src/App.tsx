import { Routes, Route } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';
import { useEffect, useState } from 'react';

function Home() {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Workflow Platform
      </Typography>
      <Typography variant="body1">
        Welcome to the full-stack workflow platform monorepo!
      </Typography>
    </Box>
  );
}

function App() {
  return (
    <Container maxWidth="lg">
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </Container>
  );
}

export default App;
