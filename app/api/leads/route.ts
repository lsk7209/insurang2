import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/leads
 * 리드 생성 및 이메일/SMS 발송
 * 
 * 주의: 이 파일은 Next.js API Routes입니다.
 * Cloudflare Pages에서는 functions/api/leads.ts가 자동으로 사용됩니다.
 * 
 * 로컬 개발 환경에서만 이 파일이 사용됩니다.
 * Cloudflare 배포 시에는 functions/api/leads.ts가 우선적으로 처리됩니다.
 */
export async function POST(request: NextRequest) {
  // Cloudflare Pages Functions가 우선적으로 처리
  return NextResponse.json(
    {
      success: false,
      error: '이 엔드포인트는 Cloudflare Pages Functions에서만 사용 가능합니다. functions/api/leads.ts를 확인하세요.',
    },
    { status: 501 }
  );
}

/**
 * 아래 코드는 참고용입니다. 실제로는 functions/api/leads.ts가 사용됩니다.
 */
/*
import { createLead, createMessageLog, getOfferBySlug } from '@/lib/db';
import { sendEmailCloudflare } from '@/lib/services/email-service-cloudflare';
import { sendSMS } from '@/lib/services/sms-service';

export async function POST_LEGACY(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      offer_slug,
      name,
      email,
      phone,
      organization,
      consent_privacy,
      consent_marketing,
    } = body;

    // 필수 필드 검증
    if (!offer_slug || !name || !email || !phone || consent_privacy === undefined) {
      return NextResponse.json(
        { success: false, error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 휴대폰 번호 검증 (숫자만, 10~11자리)
    const phoneNumbers = phone.replace(/[^\d]/g, '');
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      return NextResponse.json(
        { success: false, error: '올바른 휴대폰 번호 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 오퍼 존재 확인 (없으면 기본값 사용)
    let offer = await getOfferBySlug(offer_slug);
    if (!offer) {
      // 기본 오퍼 생성 (개발 환경용)
      offer = {
        id: 0,
        slug: offer_slug,
        name: 'AI 상담 워크북',
        description: null,
        status: 'active',
        download_link: 'https://example.com/workbook.pdf',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.warn(`Offer not found: ${offer_slug}, using default`);
    }

    // 1. 리드 저장
    let leadId: number;
    try {
      leadId = await createLead({
        offer_slug,
        name,
        email,
        phone: phoneNumbers,
        organization: organization || undefined,
        consent_privacy: Boolean(consent_privacy),
        consent_marketing: Boolean(consent_marketing),
      });
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      const errorMessage = dbError?.message || '데이터베이스 연결 오류';
      
      // 개발 환경에서는 더 자세한 에러 메시지
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json(
          { 
            success: false, 
            error: `데이터베이스 오류: ${errorMessage}. 환경 변수를 확인해주세요.` 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: '데이터베이스 연결에 실패했습니다. 관리자에게 문의해주세요.' },
        { status: 500 }
      );
    }

    // 2. 이메일 발송 (실패해도 리드 저장은 성공 처리)
    try {
      const emailResult = await sendEmail({
        to: email,
        subject: '[AI 상담 워크북] 신청해 주셔서 감사합니다.',
        html: '',
        name,
        downloadLink: offer.download_link || 'https://example.com/workbook.pdf',
      });

      await createMessageLog({
        lead_id: leadId,
        channel: 'email',
        status: emailResult.success ? 'success' : 'failed',
        error_message: emailResult.error || undefined,
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      await createMessageLog({
        lead_id: leadId,
        channel: 'email',
        status: 'failed',
        error_message: emailError instanceof Error ? emailError.message : 'Unknown error',
      });
    }

    // 3. SMS 발송 (실패해도 리드 저장은 성공 처리)
    try {
      const smsResult = await sendSMS({
        to: phoneNumbers,
        message: '',
        shortLink: offer.download_link || undefined,
      });

      await createMessageLog({
        lead_id: leadId,
        channel: 'sms',
        status: smsResult.success ? 'success' : 'failed',
        error_message: smsResult.error || undefined,
      });
    } catch (smsError) {
      console.error('SMS send error:', smsError);
      await createMessageLog({
        lead_id: leadId,
        channel: 'sms',
        status: 'failed',
        error_message: smsError instanceof Error ? smsError.message : 'Unknown error',
      });
    }

    // 리드 저장 성공 시 성공 응답 (이메일/SMS 실패와 무관)
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Lead creation error:', error);
    const errorMessage = error?.message || '알 수 없는 오류';
    
    // 개발 환경에서는 더 자세한 에러 메시지
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          success: false, 
          error: `서버 오류: ${errorMessage}` 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
*/

