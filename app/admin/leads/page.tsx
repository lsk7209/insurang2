'use client';

import { Box, Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from '@mui/material';
import { useEffect, useState, useCallback } from 'react';
import VisibilityIcon from '@mui/icons-material/Visibility';

/**
 * Admin Leads Page
 * 관리자 리드 목록 조회 페이지
 */
interface Lead {
  id: number;
  offer_slug: string;
  name: string;
  email: string;
  phone: string;
  organization: string | null;
  consent_privacy: boolean;
  consent_marketing: boolean;
  created_at: string;
  email_status: string;
  sms_status: string;
}

interface LeadDetail extends Lead {
  logs: Array<{
    id: number;
    channel: string;
    status: string;
    error_message: string | null;
    sent_at: string;
  }>;
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<LeadDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/leads');
      const result = await response.json();

      if (result.success) {
        setLeads(result.data);
      } else {
        console.error('Failed to fetch leads:', result.error);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeadDetail = useCallback(async (leadId: number) => {
    try {
      const response = await fetch(`/api/admin/leads?id=${leadId}`);
      const result = await response.json();

      if (result.success) {
        setSelectedLead(result.data);
        setDetailOpen(true);
      }
    } catch (error) {
      console.error('Error fetching lead detail:', error);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusChip = (status: string) => {
    const color = status === 'success' ? 'success' : status === 'failed' ? 'error' : 'default';
    return <Chip label={status} color={color} size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>로딩 중...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
        <Stack spacing={4}>
          {/* 헤더 */}
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              리드 관리
            </Typography>
            <Typography variant="body2" color="text.secondary">
              총 {leads.length}건의 리드가 등록되었습니다.
            </Typography>
          </Box>

          {/* 테이블 */}
          <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'neutral.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>오퍼</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>이름</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>이메일</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>휴대폰</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>소속</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>이메일 상태</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>SMS 상태</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>신청일</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>상세</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">등록된 리드가 없습니다.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead) => (
                    <TableRow key={lead.id} hover>
                      <TableCell>{lead.id}</TableCell>
                      <TableCell>{lead.offer_slug}</TableCell>
                      <TableCell>{lead.name}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell>{lead.organization || '-'}</TableCell>
                      <TableCell>{getStatusChip(lead.email_status)}</TableCell>
                      <TableCell>{getStatusChip(lead.sms_status)}</TableCell>
                      <TableCell>{formatDate(lead.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => fetchLeadDetail(lead.id)}
                        >
                          보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </Container>

      {/* 상세 다이얼로그 */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>리드 상세 정보</DialogTitle>
        <DialogContent>
          {selectedLead && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  기본 정보
                </Typography>
                <Stack spacing={1}>
                  <Typography><strong>ID:</strong> {selectedLead.id}</Typography>
                  <Typography><strong>오퍼:</strong> {selectedLead.offer_slug}</Typography>
                  <Typography><strong>이름:</strong> {selectedLead.name}</Typography>
                  <Typography><strong>이메일:</strong> {selectedLead.email}</Typography>
                  <Typography><strong>휴대폰:</strong> {selectedLead.phone}</Typography>
                  <Typography><strong>소속:</strong> {selectedLead.organization || '-'}</Typography>
                  <Typography>
                    <strong>개인정보 동의:</strong> {selectedLead.consent_privacy ? '동의' : '미동의'}
                  </Typography>
                  <Typography>
                    <strong>마케팅 동의:</strong> {selectedLead.consent_marketing ? '동의' : '미동의'}
                  </Typography>
                  <Typography><strong>신청일:</strong> {formatDate(selectedLead.created_at)}</Typography>
                </Stack>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  메시지 발송 로그
                </Typography>
                {selectedLead.logs.length === 0 ? (
                  <Typography color="text.secondary">발송 로그가 없습니다.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {selectedLead.logs.map((log) => (
                      <Box
                        key={log.id}
                        sx={{
                          p: 2,
                          bgcolor: 'neutral.50',
                          borderRadius: 1,
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Chip label={log.channel} size="small" />
                          {getStatusChip(log.status)}
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(log.sent_at)}
                          </Typography>
                        </Stack>
                        {log.error_message && (
                          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                            오류: {log.error_message}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

