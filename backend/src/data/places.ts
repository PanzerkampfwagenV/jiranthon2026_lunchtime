import type { LatLng } from '../types.js';

/** 추천 후보가 되는 여행지 원본 데이터 (좌표 + 메타) */
export interface CandidatePlace {
  id: string;
  name: string;
  category: string;
  location: LatLng;
  tags: string[];
  thumbnail?: string;
  description?: string;
}

/**
 * 서울 도심 기준 후보 장소 시드 데이터.
 * TODO(개발자 C): 추후 Kakao 장소 검색 API 실시간 조회로 대체 가능.
 */
export const CANDIDATE_PLACES: CandidatePlace[] = [
  {
    id: 'p1',
    name: '남산공원',
    category: '공원',
    location: { lat: 37.5512, lng: 126.9882 },
    tags: ['nature', 'walk', 'view'],
    description: '서울 도심 속 자연을 즐길 수 있는 대표 공원.',
  },
  {
    id: 'p2',
    name: '북촌한옥마을',
    category: '명소',
    location: { lat: 37.5826, lng: 126.9831 },
    tags: ['culture', 'photo', 'history'],
    description: '전통 한옥이 밀집한 서울의 대표 관광지.',
  },
  {
    id: 'p3',
    name: '청계천',
    category: '산책',
    location: { lat: 37.5696, lng: 126.9789 },
    tags: ['nature', 'walk'],
    description: '도심을 가로지르는 산책하기 좋은 하천.',
  },
  {
    id: 'p4',
    name: '경복궁',
    category: '고궁',
    location: { lat: 37.5796, lng: 126.977 },
    tags: ['culture', 'history', 'photo'],
    description: '조선 왕조의 법궁. 수문장 교대식으로 유명하다.',
  },
  {
    id: 'p5',
    name: '광장시장',
    category: '시장',
    location: { lat: 37.5701, lng: 126.9999 },
    tags: ['food', 'culture'],
    description: '먹거리와 전통이 살아있는 서울의 대표 재래시장.',
  },
  {
    id: 'p6',
    name: '서울숲',
    category: '공원',
    location: { lat: 37.5443, lng: 127.0374 },
    tags: ['nature', 'walk', 'family'],
    description: '넓은 녹지와 사슴 방사장이 있는 도심 속 숲.',
  },
  {
    id: 'p7',
    name: '익선동 한옥거리',
    category: '골목',
    location: { lat: 37.5741, lng: 126.9905 },
    tags: ['cafe', 'food', 'photo'],
    description: '한옥을 개조한 카페와 맛집이 모인 감성 골목.',
  },
  {
    id: 'p8',
    name: '덕수궁 돌담길',
    category: '산책',
    location: { lat: 37.5658, lng: 126.9751 },
    tags: ['walk', 'photo', 'history'],
    description: '고궁과 도심이 어우러진 낭만적인 산책로.',
  },
  {
    id: 'p9',
    name: '동대문디자인플라자',
    category: '명소',
    location: { lat: 37.5669, lng: 127.0092 },
    tags: ['culture', 'photo', 'shopping'],
    description: '독특한 곡선 건축의 복합 문화 공간.',
  },
  {
    id: 'p10',
    name: '이태원 경리단길',
    category: '골목',
    location: { lat: 37.5405, lng: 126.9895 },
    tags: ['cafe', 'food'],
    description: '이국적인 분위기의 카페·레스토랑 거리.',
  },
  {
    id: 'p11',
    name: '한강 반포지구',
    category: '공원',
    location: { lat: 37.5107, lng: 126.9958 },
    tags: ['nature', 'walk', 'view'],
    description: '달빛무지개분수로 유명한 한강 시민공원.',
  },
  {
    id: 'p12',
    name: '인사동 문화의거리',
    category: '골목',
    location: { lat: 37.5714, lng: 126.9858 },
    tags: ['culture', 'cafe', 'shopping'],
    description: '전통 공예품과 갤러리, 찻집이 모인 문화 거리.',
  },
];
