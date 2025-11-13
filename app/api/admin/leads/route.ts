import { NextRequest, NextResponse } from 'next/server';
import { getLeadsWithLogs, getLeadById } from '@/lib/db';

/**
 * GET /api/admin/leads
 * 관리자 리드 목록 조회
 * TODO: MVP에서는 Basic Auth 또는 임시 공개, v2에서 인증 추가
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const leadId = searchParams.get('id');

    // 특정 리드 조회
    if (leadId) {
      const lead = await getLeadById(parseInt(leadId));
      if (!lead) {
        return NextResponse.json(
          { success: false, error: '리드를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: lead });
    }

    // 리드 목록 조회
    const leads = await getLeadsWithLogs(limit, offset);

    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error('Leads fetch error:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

