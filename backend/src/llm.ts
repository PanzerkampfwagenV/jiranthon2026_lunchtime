import type { LatLng, TravelMode, TripType } from './types.js';

/** Claude가 제안한 장소 (좌표 보정 전) */
export interface LlmSuggestion {
  /** 검색 가능한 구체적 장소명 (예: "경복궁", "성수동 카페거리") */
  name: string;
  /** 분류 (예: 공원, 카페, 명소) */
  category: string;
  /** 추천 이유/설명 한 문장 */
  description: string;
}

interface LlmRecommendInput {
  originLabel?: string;
  origin: LatLng;
  availableMinutes: number;
  mode: TravelMode;
  tags?: string[];
  tripType: TripType;
}

const MODE_LABEL: Record<TravelMode, string> = {
  walking: '도보',
  transit: '대중교통',
  driving: '자동차',
};

const DEFAULT_MODEL = 'claude-haiku-4.5';
const DEFAULT_BASE_URL = 'https://api.anthropic.com/v1';

/** OpenAI 호환 chat.completions 응답 (필요한 필드만) */
interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}

/** Claude API 사용 가능 여부 (키 존재) */
export function isLlmAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** 장소 상세 정보 (LLM 생성) */
export interface PlaceDetailInfo {
  /** 이 장소에서 할 수 있는 활동 목록 (2~5개) */
  activities: string[];
  /** 유명한 것/포토스팟/명물 등 하이라이트 (1~4개) */
  highlights: string[];
  /** 상세 소개 2~3문장 */
  summary: string;
}

/**
 * 특정 장소에 대한 상세 정보(활동, 하이라이트, 소개)를 Claude로 생성한다.
 * 좌표 등 위치 정보는 사용하지 않고 장소명/카테고리만으로 생성한다.
 *
 * @returns 실패 시 예외를 던진다(호출측에서 폴백 처리).
 */
export async function generatePlaceDetail(
  placeName: string,
  category: string,
): Promise<PlaceDetailInfo> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY 미설정');
  }

  const baseUrl = (process.env.ANTHROPIC_BASE_URL || DEFAULT_BASE_URL).replace(
    /\/$/,
    '',
  );
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const prompt = `"${placeName}"(${category})에 대한 여행 정보를 알려주세요.

요구사항:
1. activities: 이곳에서 할 수 있는 구체적인 활동 2~5개 (예: "한강 자전거 타기", "일몰 감상")
2. highlights: 이곳에서 유명하거나 볼만한 것 1~4개 (예: "벚꽃 명소로 유명", "야경 포토스팟")
3. summary: 장소를 소개하는 한국어 2~3문장. 과장 없이 사실 기반으로 작성하세요.
4. 실제로 존재하지 않는 정보를 지어내지 말고, 확실하지 않으면 일반적인 특징만 언급하세요.
5. 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트나 마크다운은 절대 포함하지 마세요.

{
  "activities": ["활동1", "활동2"],
  "highlights": ["하이라이트1"],
  "summary": "소개 문장"
}`;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      messages: [
        {
          role: 'system',
          content:
            '당신은 JSON 생성기입니다. 반드시 유효한 JSON 객체만 출력하세요. 설명, 인사말, 코드펜스(```), 그 외 어떤 텍스트도 출력하지 마세요.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM 요청 실패: ${res.status}`);
  }

  const data = (await res.json()) as ChatCompletionResponse;
  const text = data.choices?.[0]?.message?.content?.trim() ?? '';
  if (!text) {
    throw new Error('LLM 응답이 비어 있습니다.');
  }

  return parsePlaceDetail(text);
}

/** Claude 응답 텍스트에서 장소 상세 정보 JSON 객체를 안전하게 추출·파싱한다. */
function parsePlaceDetail(text: string): PlaceDetailInfo {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('LLM 응답에서 JSON 객체를 찾을 수 없습니다.');
  }

  const json = text.slice(start, end + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    const repaired = json
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/,\s*([\]}])/g, '$1');
    parsed = JSON.parse(repaired); // 실패 시 여기서 던져지고 상위에서 폴백
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('LLM 응답이 객체가 아닙니다.');
  }

  const obj = parsed as Record<string, unknown>;
  const toStringArray = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '')
      : [];

  const activities = toStringArray(obj.activities);
  const highlights = toStringArray(obj.highlights);
  const summary = typeof obj.summary === 'string' ? obj.summary : '';

  if (activities.length === 0 && highlights.length === 0 && !summary) {
    throw new Error('LLM 응답에 유효한 상세 정보가 없습니다.');
  }

  return { activities, highlights, summary };
}

/**
 * Claude에게 입력 조건(위치·시간·이동수단·취향)에 맞는 여행 장소를 추천받는다.
 * 좌표는 생성하지 않고 장소명만 받는다(좌표는 카카오 검색으로 보정).
 *
 * @returns 추천 장소 목록. 키가 없거나 실패 시 예외를 던진다(상위에서 폴백).
 */
export async function recommendWithLlm(
  input: LlmRecommendInput,
): Promise<LlmSuggestion[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY 미설정');
  }

  const baseUrl = (process.env.ANTHROPIC_BASE_URL || DEFAULT_BASE_URL).replace(
    /\/$/,
    '',
  );
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const tripLabel = input.tripType === 'roundtrip' ? '왕복' : '편도';
  const tagLine =
    input.tags && input.tags.length > 0
      ? `- 관심 태그: ${input.tags.join(', ')}`
      : '- 관심 태그: (지정 없음)';
  const originLine = input.originLabel
    ? `${input.originLabel} (위도 ${input.origin.lat}, 경도 ${input.origin.lng})`
    : `위도 ${input.origin.lat}, 경도 ${input.origin.lng}`;

  const prompt = `당신은 한국 여행지 추천 전문가입니다. 사용자가 자투리 시간에 다녀올 수 있는 장소를 추천하세요.

조건:
- 출발지: ${originLine}
- 가용 시간: ${input.availableMinutes}분 (${tripLabel} 이동 + 체류 포함)
- 이동 수단: ${MODE_LABEL[input.mode]}
${tagLine}

요구사항:
1. 출발지에서 ${MODE_LABEL[input.mode]}로 ${tripLabel} 이동과 체류가 ${input.availableMinutes}분 안에 가능한, 실제로 가까운 장소만 추천하세요.
2. 카카오맵에서 정확히 검색되는 대표 장소명을 사용하세요. 관광지·공원·명소·거리 등 "목적지" 이름만 쓰고, 지하철 출구·화장실·주차장·특정 프랜차이즈 지점 같은 세부 시설명은 쓰지 마세요.
3. 출발지 자체나 출발지와 정확히 같은 장소(예: 출발지가 "OO역"이면 "OO역")는 추천하지 마세요. 반드시 출발지에서 이동해서 도착하는 다른 장소여야 합니다.
4. 서로 다른 6~10곳을 추천하고, 같은 장소를 중복하지 마세요.
5. 반드시 아래 JSON 배열 형식으로만 응답하세요. 다른 텍스트나 마크다운은 절대 포함하지 마세요.

[
  { "name": "구체적 장소명", "category": "분류", "description": "추천 이유 한 문장" }
]`;

  // 사내 게이트웨이는 OpenAI 호환 형식(/chat/completions + Bearer 인증)이다.
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content:
            '당신은 JSON 생성기입니다. 반드시 유효한 JSON 배열만 출력하세요. 설명, 인사말, 코드펜스(```), 그 외 어떤 텍스트도 출력하지 마세요.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM 요청 실패: ${res.status}`);
  }

  const data = (await res.json()) as ChatCompletionResponse;
  const text = data.choices?.[0]?.message?.content?.trim() ?? '';
  if (!text) {
    throw new Error('LLM 응답이 비어 있습니다.');
  }

  return parseSuggestions(text);
}

/** Claude 응답 텍스트에서 JSON 배열을 안전하게 추출·파싱한다. */
function parseSuggestions(text: string): LlmSuggestion[] {
  // 코드펜스나 잡음이 섞여도 첫 배열만 추출
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('LLM 응답에서 JSON 배열을 찾을 수 없습니다.');
  }

  const json = text.slice(start, end + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    // 흔한 깨짐 보정: 스마트 따옴표, trailing comma 제거 후 재시도
    const repaired = json
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/,\s*([\]}])/g, '$1');
    try {
      parsed = JSON.parse(repaired);
    } catch {
      // 최후 수단: name/category 키만 정규식으로 추출한다.
      // (Claude가 description 키를 빠뜨리는 등 JSON이 깨져도 장소명은 건진다)
      const salvaged = salvageByRegex(text);
      if (salvaged.length > 0) {
        return salvaged;
      }
      console.error('[llm] JSON 파싱 실패. 원본 응답:', text.slice(0, 500));
      throw new Error('LLM 응답 JSON 파싱 실패');
    }
  }
  if (!Array.isArray(parsed)) {
    throw new Error('LLM 응답이 배열이 아닙니다.');
  }

  const result: LlmSuggestion[] = [];
  for (const item of parsed) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as Record<string, unknown>).name === 'string'
    ) {
      const obj = item as Record<string, unknown>;
      result.push({
        name: obj.name as string,
        category:
          typeof obj.category === 'string' ? obj.category : '장소',
        description:
          typeof obj.description === 'string' ? obj.description : '',
      });
    }
  }

  if (result.length === 0) {
    throw new Error('LLM 응답에서 유효한 장소를 찾을 수 없습니다.');
  }
  return result;
}

/**
 * JSON 파싱이 완전히 실패했을 때, name/category 값만 정규식으로 건진다.
 * Claude가 description 키를 누락하는 등 형식이 깨져도 장소명은 확보한다.
 */
function salvageByRegex(text: string): LlmSuggestion[] {
  const result: LlmSuggestion[] = [];
  const seen = new Set<string>();
  // "name": "..." 뒤에 오는 "category": "..." (있으면)을 함께 잡는다.
  const re =
    /"name"\s*:\s*"([^"]+)"(?:\s*,\s*"category"\s*:\s*"([^"]+)")?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const name = m[1].trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    result.push({ name, category: m[2]?.trim() || '장소', description: '' });
  }
  return result;
}
