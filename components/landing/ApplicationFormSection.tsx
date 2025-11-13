import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Checkbox,
  FormControlLabel,
  Alert,
} from '@mui/material';
import { memo, useState, useCallback, useMemo } from 'react';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

/**
 * Component: ApplicationFormSection
 * 워크북 신청 폼 섹션
 * @param {() => void} onSubmit - 폼 제출 핸들러 [Optional]
 * @example <ApplicationFormSection onSubmit={() => console.log('submitted')} />
 */
interface Props {
  onSubmit?: (data: FormData) => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  consent_privacy: boolean;
  consent_marketing: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  consent_privacy?: string;
}

export default memo(function ApplicationFormSection({ onSubmit }: Props) {
  const [ref, isVisible] = useScrollAnimation();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    consent_privacy: false,
    consent_marketing: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // 입력값 검증
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요.';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '휴대폰 번호를 입력해주세요.';
    } else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(formData.phone.replace(/-/g, ''))) {
      newErrors.phone = '올바른 휴대폰 번호 형식을 입력해주세요. (예: 010-1234-5678)';
    }

    if (!formData.consent_privacy) {
      newErrors.consent_privacy = '개인정보 수집 및 이용에 동의해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // 휴대폰 번호 자동 포맷팅
  const formatPhoneNumber = useCallback((value: string): string => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }, []);

  // 입력 핸들러
  const handleChange = useCallback(
    (field: keyof FormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const isCheckbox = field === 'consent_privacy' || field === 'consent_marketing';
      const value = isCheckbox ? event.target.checked : event.target.value;
      
      if (field === 'phone' && typeof value === 'string') {
        const formatted = formatPhoneNumber(value);
        setFormData((prev) => ({ ...prev, [field]: formatted }));
      } else {
        setFormData((prev) => ({ ...prev, [field]: value }));
      }

      // 에러 초기화
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [field as keyof FormErrors]: undefined }));
      }
    },
    [errors, formatPhoneNumber]
  );

  // 폼 제출
  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsSubmitting(true);
      setSubmitSuccess(false);

      try {
        if (onSubmit) {
          onSubmit(formData);
        }

        setSubmitSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          consent_privacy: false,
          consent_marketing: false,
        });
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, validateForm, onSubmit]
  );

  const submitButtonLabel = useMemo(
    () => (isSubmitting ? '제출 중...' : 'AI 상담워크북 무료로 받기'),
    [isSubmitting]
  );

  return (
    <Box
      ref={ref}
      component="section"
      role="region"
      aria-label="신청 폼 섹션"
      sx={{
        bgcolor: 'neutral.50',
        py: { xs: 6, sm: 8, md: 14 },
        px: { xs: 2, sm: 3, md: 0 },
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={{ xs: 4, sm: 5, md: 6 }} alignItems="center">
          {/* 헤드라인 */}
          <Typography
            variant="h3"
            component="h2"
            sx={{
              color: 'text.primary',
              textAlign: 'center',
              fontWeight: 700,
              lineHeight: { xs: 1.5, md: 1.4 },
              px: { xs: 1, md: 0 },
            }}
          >
            지금 바로 시작하세요
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: { xs: 1.9, md: 1.8 },
              px: { xs: 1, md: 0 },
            }}
          >
            아래 정보를 입력하시면 AI 상담 워크북을 무료로 받으실 수 있습니다.
          </Typography>

          {/* 폼 */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: '100%',
              maxWidth: { xs: '100%', md: '600px' },
            }}
            noValidate
          >
            <Stack spacing={{ xs: 3, md: 4 }}>
              {/* 성공 메시지 */}
              {submitSuccess && (
                <Alert severity="success" onClose={() => setSubmitSuccess(false)}>
                  신청이 완료되었습니다! 곧 이메일로 워크북을 보내드리겠습니다.
                </Alert>
              )}

              {/* 이름 입력 */}
              <TextField
                label="이름"
                name="name"
                value={formData.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                required
                fullWidth
                autoComplete="name"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              {/* 이메일 입력 */}
              <TextField
                label="이메일"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                required
                fullWidth
                autoComplete="email"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              {/* 휴대폰 입력 */}
              <TextField
                label="휴대폰 번호"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange('phone')}
                error={!!errors.phone}
                helperText={errors.phone || '예: 010-1234-5678'}
                required
                fullWidth
                autoComplete="tel"
                placeholder="010-1234-5678"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              {/* 동의 체크박스 */}
              <Box>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.consent_privacy}
                      onChange={handleChange('consent_privacy')}
                      sx={{
                        '&.Mui-checked': {
                          color: 'primary.main',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ color: errors.consent_privacy ? 'error.main' : 'text.primary' }}>
                      개인정보 수집 및 이용에 동의합니다.
                      <Box component="span" sx={{ color: 'text.secondary', ml: 0.5 }}>
                        (필수)
                      </Box>
                    </Typography>
                  }
                />
                {errors.consent_privacy && (
                  <Typography variant="caption" color="error" sx={{ ml: 4.5, display: 'block', mt: 0.5 }}>
                    {errors.consent_privacy}
                  </Typography>
                )}
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.consent_marketing}
                      onChange={handleChange('consent_marketing')}
                      sx={{
                        '&.Mui-checked': {
                          color: 'primary.main',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body2" color="text.primary">
                      마케팅 정보 수신에 동의합니다.
                      <Box component="span" sx={{ color: 'text.secondary', ml: 0.5 }}>
                        (선택)
                      </Box>
                    </Typography>
                  }
                  sx={{ mt: 1 }}
                />
                
                <Typography variant="caption" sx={{ ml: 4.5, mt: 1, display: 'block', color: 'text.secondary' }}>
                  ※ 수집된 정보는 워크북 제공 및 서비스 안내 목적으로만 사용됩니다.
                </Typography>
              </Box>

              {/* 제출 버튼 */}
              <Button
                type="submit"
                variant="contained"
                color="warning"
                size="large"
                disabled={isSubmitting}
                fullWidth
                sx={{
                  mt: { xs: 1, md: 2 },
                  py: { xs: 2.5, md: 2 },
                  fontSize: { xs: '1rem', md: '1.125rem' },
                  fontWeight: 700,
                  borderRadius: 2,
                  boxShadow: 4,
                  minHeight: { xs: '48px', md: 'auto' },
                  '&:hover': {
                    boxShadow: 6,
                  },
                  '&:disabled': {
                    bgcolor: 'action.disabledBackground',
                  },
                }}
                aria-label="신청 폼 제출"
              >
                {submitButtonLabel}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
});

