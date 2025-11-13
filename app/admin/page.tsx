'use client';

import { Box, Container, Grid, Paper, Typography, Stack } from '@mui/material';
import { useEffect, useState } from 'react';
import PeopleIcon from '@mui/icons-material/People';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface DashboardStats {
  totalLeads: number;
  todayLeads: number;
  emailSuccess: number;
  smsSuccess: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    todayLeads: 0,
    emailSuccess: 0,
    smsSuccess: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/leads');
        const result = await response.json();

        if (result.success && result.data) {
          const leads = result.data;
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const todayLeads = leads.filter((lead: any) => {
            const leadDate = new Date(lead.created_at);
            leadDate.setHours(0, 0, 0, 0);
            return leadDate.getTime() === today.getTime();
          });

          const emailSuccess = leads.filter((lead: any) => lead.email_status === 'success').length;
          const smsSuccess = leads.filter((lead: any) => lead.sms_status === 'success').length;

          setStats({
            totalLeads: leads.length,
            todayLeads: todayLeads.length,
            emailSuccess,
            smsSuccess,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: '전체 리드',
      value: stats.totalLeads,
      icon: <PeopleIcon sx={{ fontSize: '2.5rem' }} />,
      color: 'primary.main',
    },
    {
      title: '오늘 신청',
      value: stats.todayLeads,
      icon: <TrendingUpIcon sx={{ fontSize: '2.5rem' }} />,
      color: 'success.main',
    },
    {
      title: '이메일 발송 성공',
      value: stats.emailSuccess,
      icon: <EmailIcon sx={{ fontSize: '2.5rem' }} />,
      color: 'info.main',
    },
    {
      title: 'SMS 발송 성공',
      value: stats.smsSuccess,
      icon: <SmsIcon sx={{ fontSize: '2.5rem' }} />,
      color: 'warning.main',
    },
  ];

  return (
    <Container maxWidth="xl">
      <Stack spacing={4}>
        {/* 헤더 */}
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            대시보드
          </Typography>
          <Typography variant="body2" color="text.secondary">
            전체 현황을 한눈에 확인하세요.
          </Typography>
        </Box>

        {/* 통계 카드 */}
        <Grid container spacing={3}>
          {statCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                sx={{
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  borderRadius: 2,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      color: card.color,
                      opacity: 0.8,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                      {loading ? '...' : card.value}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* 빠른 링크 */}
        <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            빠른 링크
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Box
                component="a"
                href="/admin/leads"
                sx={{
                  display: 'block',
                  p: 2,
                  bgcolor: 'neutral.50',
                  borderRadius: 1,
                  textDecoration: 'none',
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'neutral.100',
                  },
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  리드 관리
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  신청 리드 목록 확인
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box
                component="a"
                href="/admin/settings"
                sx={{
                  display: 'block',
                  p: 2,
                  bgcolor: 'neutral.50',
                  borderRadius: 1,
                  textDecoration: 'none',
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'neutral.100',
                  },
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  설정 관리
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  SMTP, API 키 등 설정
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Stack>
    </Container>
  );
}

