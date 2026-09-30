/**
 * 댓글/편지 필터링 모듈
 * --------------------------------
 * https://github.com/yeonzhry/AWP 의 moderation_template.js를 이 프로젝트에 맞게
 * 옮긴 버전. model_data.json(TF-IDF + 로지스틱회귀 가중치)을 그대로 불러와서
 * 브라우저에서 바로 동일한 계산을 재현한다 (별도 서버/모델 서빙 불필요).
 *
 * 사용법:
 *   import { moderateComment } from '../lib/moderation';
 *   const result = moderateComment('편지 내용');
 *   // result = { action: 'allow' | 'review' | 'block', reason: '...' }
 *
 * action 처리 방법:
 *   - 'allow'  : 그대로 저장, 바로 게시
 *   - 'review' : 저장은 하되 is_hidden=true로 화면에서 숨김, 관리자 검토 후 승인
 *   - 'block'  : 저장하지 않고 사용자에게 에러 메시지(reason) 표시
 *
 * ⚠️ 이 필터는 브라우저(클라이언트)에서 실행되므로, 개발자도구로 우회해서
 * Supabase에 직접 요청을 보내는 게 기술적으로 가능하다. 더 견고하게 만들려면
 * 동일한 로직을 Supabase Edge Function에도 넣어 서버 쪽에서 한 번 더 검증해야 한다.
 */
import MODEL_DATA from './moderationModelData.json';

// 1단계: 욕설/비속어 (즉시 차단)
export const PROFANITY_KEYWORDS = ['시발', '씨발', '개새끼', '병신', '지랄', '쪽바리', '년', '새끼'];

// 2단계: 역사부정/2차가해 표현 (검토 대기)
export const SENSITIVE_KEYWORDS = [
  '매춘부', '자발적 매춘', '위안부는 없었다', '강제성이 없', '강제연행은 없',
  '돈 벌러 간', '직업여성', '성노예 아니', '자발적으로 갔',
  '성매매', '매춘이', '매춘 아니',
  '위안부는 거짓', '위안부는 조작', '위안부는 날조', '숫자를 부풀',
  '그만 좀 우려먹', '돈 뜯어내려고', '국뽕 팔아', '이제 그만해',
  '다 옛날 일', '언제까지 우려먹을', '가짜 피해자', '창녀',
];

const BLOCK_THRESHOLD = 0.8;
const REVIEW_THRESHOLD = 0.4;

function normalize(text) {
  return text.toLowerCase().replace(/[^\w가-힣]/g, '');
}

function containsAny(text, keywords) {
  const norm = normalize(text);
  return keywords.some((kw) => norm.includes(normalize(kw)));
}

function tokenize(text) {
  return text.toLowerCase().match(/[\p{L}\p{N}_]{2,}/gu) || [];
}

function buildNgrams(tokens) {
  const ngrams = tokens.slice();
  for (let i = 0; i < tokens.length - 1; i++) {
    ngrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return ngrams;
}

function mlPredictProba(text) {
  if (!MODEL_DATA) return null;
  const tokens = tokenize(text);
  const ngrams = buildNgrams(tokens);

  const counts = {};
  for (const t of ngrams) {
    const idx = MODEL_DATA.vocabulary[t];
    if (idx !== undefined) counts[idx] = (counts[idx] || 0) + 1;
  }

  const idxList = Object.keys(counts);
  // 문장의 단어가 모델 단어장에 하나도 없으면(norm=0) intercept만 남는데, 이 값의
  // 시그모이드가 우연히 review 임계값(0.4)보다 높아서 "안녕하세요"처럼 아무 신호도
  // 없는 문장까지 전부 검토대기로 빠지는 문제가 있었다. 매칭되는 단어가 없다는 건
  // 모델이 판단할 근거가 없다는 뜻이므로 위험도 0(allow)으로 처리한다.
  if (idxList.length === 0) return 0;

  const vec = {};
  let normSq = 0;
  for (const idx of idxList) {
    const val = counts[idx] * MODEL_DATA.idf[idx];
    vec[idx] = val;
    normSq += val * val;
  }
  const norm = Math.sqrt(normSq);

  let z = MODEL_DATA.intercept;
  for (const idx of idxList) {
    z += (vec[idx] / norm) * MODEL_DATA.coef[idx];
  }
  return 1 / (1 + Math.exp(-z));
}

export function moderateComment(text) {
  if (!text || !text.trim()) {
    return { action: 'block', reason: '빈 댓글' };
  }
  if (containsAny(text, PROFANITY_KEYWORDS)) {
    return { action: 'block', reason: '욕설/비속어 감지' };
  }
  if (containsAny(text, SENSITIVE_KEYWORDS)) {
    return { action: 'review', reason: '역사부정·2차가해 관련 표현 감지, 관리자 검토 필요' };
  }
  const score = mlPredictProba(text);
  if (score === null) {
    return { action: 'allow', reason: '문제 없음 (모델 데이터 없음, 키워드 필터만 적용)' };
  }
  if (score >= BLOCK_THRESHOLD) {
    return { action: 'block', reason: `AI 모델 악성 판단 (확률 ${score.toFixed(2)})` };
  }
  if (score >= REVIEW_THRESHOLD) {
    return { action: 'review', reason: `AI 모델 애매 판단, 관리자 검토 필요 (확률 ${score.toFixed(2)})` };
  }
  return { action: 'allow', reason: `문제 없음 (악성 확률 ${score.toFixed(2)})` };
}
