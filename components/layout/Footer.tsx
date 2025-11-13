import { Box, Container, Typography } from '@mui/material';
import { memo } from 'react';

/**
 * Component: Footer
 * 푸터 컴포넌트
 * @example <Footer />
 */
export default memo(function Footer() {
  return (
    <Box
      component="footer"
      role="contentinfo"
      sx={{
        bgcolor: 'neutral.900',
        color: 'neutral.100',
        py: 4,
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="body2" textAlign="center" sx={{ opacity: 0.8 }}>
          © 2024 INSURANG. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
});

