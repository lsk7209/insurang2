'use client';

import { Box, Container, Typography, Paper, TextField, Button, Stack, Divider, Alert, Grid, Switch, FormControlLabel } from '@mui/material';
import { useState, useEffect } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';

interface Settings {
  // SMTP 설정
  smtp_host: string;
  smtp_port: string;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  
  // 솔라피 API 설정
  solapi_api_key: string;
  solapi_api_secret: string;
  solapi_sender_phone: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    smtp_host: '',
    smtp_port: '587',
    smtp_secure: false,
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
    solapi_api_key: '',
    solapi_api_secret: '',
    solapi_sender_phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        const result = await response.json();
        
        if (result.success && result.data) {
          setSettings(result.data);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (field: keyof Settings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'smtp_secure' ? event.target.checked : event.target.value;
    setSettings((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(result.error || '설정 저장에 실패했습니다.');
      }
    } catch (error) {
      setSaveError('설정 저장 중 오류가 발생했습니다.');
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Stack spacing={4}>
        {/* 헤더 */}
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            설정 관리
          </Typography>
          <Typography variant="body2" color="text.secondary">
            SMTP 및 API 키 등 시스템 설정을 관리합니다.
          </Typography>
        </Box>

        {/* 성공/에러 메시지 */}
        {saveSuccess && (
          <Alert severity="success" onClose={() => setSaveSuccess(false)}>
            설정이 성공적으로 저장되었습니다.
          </Alert>
        )}
        {saveError && (
          <Alert severity="error" onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}

        {/* SMTP 설정 */}
        <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 2 }}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EmailIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  SMTP 설정
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  이메일 발송을 위한 SMTP 서버 설정
                </Typography>
              </Box>
            </Box>
            <Divider />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SMTP 호스트"
                  name="smtp_host"
                  value={settings.smtp_host}
                  onChange={handleChange('smtp_host')}
                  fullWidth
                  required
                  placeholder="smtp.example.com"
                  helperText="예: smtp.gmail.com, smtp.naver.com"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SMTP 포트"
                  name="smtp_port"
                  value={settings.smtp_port}
                  onChange={handleChange('smtp_port')}
                  fullWidth
                  required
                  type="number"
                  helperText="일반: 587, SSL: 465"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.smtp_secure}
                      onChange={handleChange('smtp_secure')}
                    />
                  }
                  label="SSL/TLS 사용 (포트 465인 경우 활성화)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SMTP 사용자명"
                  name="smtp_user"
                  value={settings.smtp_user}
                  onChange={handleChange('smtp_user')}
                  fullWidth
                  required
                  type="email"
                  placeholder="your-email@example.com"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SMTP 비밀번호"
                  name="smtp_pass"
                  value={settings.smtp_pass}
                  onChange={handleChange('smtp_pass')}
                  fullWidth
                  required
                  type="password"
                  helperText="Gmail의 경우 앱 비밀번호 사용"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="발신자 이메일"
                  name="smtp_from"
                  value={settings.smtp_from}
                  onChange={handleChange('smtp_from')}
                  fullWidth
                  required
                  type="email"
                  placeholder="noreply@example.com"
                  helperText="수신자에게 표시될 발신자 이메일 주소"
                />
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {/* 솔라피 API 설정 */}
        <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 2 }}>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SmsIcon sx={{ fontSize: '2rem', color: 'warning.main' }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  솔라피 API 설정
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  SMS 발송을 위한 솔라피 API 키 설정
                </Typography>
              </Box>
            </Box>
            <Divider />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  label="API Key"
                  name="solapi_api_key"
                  value={settings.solapi_api_key}
                  onChange={handleChange('solapi_api_key')}
                  fullWidth
                  required
                  placeholder="NCSAYU7YDBXYORXC"
                  helperText="솔라피 콘솔에서 발급받은 API Key"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="API Secret"
                  name="solapi_api_secret"
                  value={settings.solapi_api_secret}
                  onChange={handleChange('solapi_api_secret')}
                  fullWidth
                  required
                  type="password"
                  placeholder="API Secret"
                  helperText="솔라피 콘솔에서 발급받은 API Secret"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="발신자 번호"
                  name="solapi_sender_phone"
                  value={settings.solapi_sender_phone}
                  onChange={handleChange('solapi_sender_phone')}
                  fullWidth
                  required
                  placeholder="01012345678"
                  helperText="SMS 발송 시 사용될 발신자 전화번호 (하이픈 없이 입력)"
                />
              </Grid>
            </Grid>
          </Stack>
        </Paper>

        {/* 저장 버튼 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={loading}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            {loading ? '저장 중...' : '설정 저장'}
          </Button>
        </Box>
      </Stack>
    </Container>
  );
}

