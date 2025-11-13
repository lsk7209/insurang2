'use client';

import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider, useTheme, useMediaQuery } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';

const DRAWER_WIDTH = 280;

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  title: string;
  path: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  {
    title: '대시보드',
    path: '/admin',
    icon: <DashboardIcon />,
  },
  {
    title: '리드 관리',
    path: '/admin/leads',
    icon: <PeopleIcon />,
  },
  {
    title: '설정',
    path: '/admin/settings',
    icon: <SettingsIcon />,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box>
      <Toolbar
        sx={{
          bgcolor: 'primary.main',
          color: 'background.default',
          minHeight: { xs: 56, sm: 64 },
        }}
      >
        <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700 }}>
          인슈랑 관리자
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/admin' && pathname?.startsWith(item.path));
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  router.push(item.path);
                  if (isMobile) {
                    setMobileOpen(false);
                  }
                }}
                sx={{
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'background.default',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'background.default',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'background.default' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: 1,
        }}
      >
        <Toolbar>
          {isMobile && (
            <Box
              component="button"
              onClick={handleDrawerToggle}
              sx={{
                mr: 2,
                border: 'none',
                bgcolor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'text.primary',
              }}
              aria-label="메뉴 열기"
            >
              <DashboardIcon />
            </Box>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {navItems.find((item) => pathname === item.path || (item.path !== '/admin' && pathname?.startsWith(item.path)))?.title || '관리자'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>{children}</Box>
      </Box>
    </Box>
  );
}

