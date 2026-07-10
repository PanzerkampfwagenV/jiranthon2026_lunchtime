// 다국어(한국어/영어/일본어) 번역 사전.
// 기본 언어는 한국어(ko). 각 언어는 동일한 키 집합을 가진다.

export type Language = 'ko' | 'en' | 'ja';

export const LANGUAGE_OPTIONS: { value: Language; label: string; flag: string }[] = [
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
];

export interface Translation {
  // 공통
  themeSystem: string;
  themeLight: string;
  themeDark: string;
  themeGroupLabel: string;
  languageGroupLabel: string;

  // 홈 히어로
  homeTitle: string;
  homeSubtitle: string;
  homeFoodTour: string;

  // 패널 감성 문구(카드 상단)
  leadLocation: string;
  leadTime: string;
  leadMode: string;
  leadMbti: string;
  leadLuckyDay: string;

  // 해시태그
  hashtagLocation: string;
  hashtagTime: string;
  hashtagMode: string;
  hashtagMbti: string;
  hashtagCuisine: string;
  hashtagLuckyDay: string;
  searchConditionsLabel: string;

  // 위치 패널
  locationPanelLabel: string;
  useGps: string;
  gpsLoading: string;
  searchPlaceholder: string;
  manualPlaceholder: string;
  confirm: string;
  searching: string;
  searchAriaLabel: string;
  selectedLocationPrefix: string;
  locationHint: string;
  currentLocation: string;

  // 시간 패널
  timePanelLabel: string;
  timePresetGroupLabel: string;
  minutesSuffix: string;
  adjustTime: string;
  timeSliderLabel: string;
  timeHint: string;

  // 이동수단 패널
  modePanelLabel: string;
  modeGroupLabel: string;
  modeWalking: string;
  modeTransit: string;
  modeDriving: string;
  modeHint: string;

  // MBTI 패널
  mbtiPanelLabel: string;
  mbtiGroupLabel: string;
  mbtiHint: string;

  // 맛집투어(음식 종류) 패널
  cuisinePanelLabel: string;
  cuisineGroupLabel: string;
  cuisineHint: string;
  cuisineKorean: string;
  cuisineChinese: string;
  cuisineJapanese: string;
  cuisineWestern: string;
  cuisineSalad: string;
  cuisineCoffee: string;
  cuisineDessert: string;
  cuisineSnack: string;

  // 럭키데이 패널
  luckyDayPanelLabel: string;
  birthDate: string;
  birthTime: string;
  calendar: string;
  calendarSolar: string;
  calendarLunar: string;
  gender: string;
  genderFemale: string;
  genderMale: string;
  save: string;
  reset: string;
  luckyDayHint: string;

  // 제출 버튼
  submitIdle: string;
  submitLoading: string;

  // 에러
  errorLocationFailed: string;
  errorRecommendFailed: string;

  // 시간 포맷
  hourUnit: string;
  minuteUnit: string;
  defaultTimeText: string;

  // 결과 페이지
  resultsTitle: string;
  resultsNoInfo: string;
  goSearch: string;
  backToSearch: string;
  resultsEmpty: string;
  resultsEmptyHint: string;
  resultsCategoryEmpty: string;
  routeNoteTransit: string;
  routeNoteFallback: string;

  // 결과 컨트롤
  sortLabel: string;
  sortByTime: string;
  sortByDistance: string;
  categoryLabel: string;
  categoryAll: string;
  sortGroupLabel: string;
  categoryFilterLabel: string;

  // 장소 카드
  approxPrefix: string;
  actualApproxPrefix: string;
  detailButton: string;

  // 상세 모달
  closeLabel: string;
  detailLoading: string;
  activitiesTitle: string;
  highlightsTitle: string;
  directionsButton: string;

  // 지도
  mapOriginTitle: string;
  mapLoading: string;
  mapNoKey: string;
  mapError: string;
}

const ko: Translation = {
  themeSystem: '시스템 설정',
  themeLight: '라이트',
  themeDark: '다크',
  themeGroupLabel: '화면 모드 선택',
  languageGroupLabel: '언어 선택',

  homeTitle: '틈나는 순간, 여행이 된다',
  homeSubtitle: '지금 위치와 남는 시간을 알려주면 다녀올 수 있는 곳을 찾아드려요.',
  homeFoodTour: '🍜 오늘은 어떤 맛집투어를 떠나볼까요?',

  leadLocation: '📍 지금, 어디에서 출발할까요?',
  leadTime: '⏳ 오늘은 얼마나 여유로우세요?',
  leadMode: '🧭 어떤 방식으로 떠나볼까요?',
  leadMbti: '💞 당신다운 여행을 찾아볼게요.',
  leadLuckyDay: '🍀 오늘의 운을 여행에 담아밐요.',

  hashtagLocation: '위치',
  hashtagTime: '자투리',
  hashtagMode: '이동수단',
  hashtagMbti: 'MBTI',
  hashtagCuisine: '맛집투어',
  hashtagLuckyDay: '럭키데이',
  searchConditionsLabel: '검색 조건 설정',

  locationPanelLabel: '위치 설정',
  useGps: '📍 현재 위치 사용',
  gpsLoading: '위치 확인 중…',
  searchPlaceholder: '장소/주소 검색',
  manualPlaceholder: '장소/주소 직접 입력',
  confirm: '확인',
  searching: '검색 중…',
  searchAriaLabel: '장소 또는 주소 검색',
  selectedLocationPrefix: '선택된 위치: ',
  locationHint: '설정하지 않으면 현재 위치를 사용해요.',
  currentLocation: '현재 위치',

  timePanelLabel: '자투리 시간 설정',
  timePresetGroupLabel: '시간 프리셋',
  minutesSuffix: '분',
  adjustTime: '직접 조절: ',
  timeSliderLabel: '자투리 시간(분)',
  timeHint: '설정하지 않으면 3시간을 사용해요.',

  modePanelLabel: '이동 수단 설정',
  modeGroupLabel: '이동 수단',
  modeWalking: '도보',
  modeTransit: '대중교통',
  modeDriving: '자동차',
  modeHint: '설정하지 않으면 대중교통을 사용해요.',

  mbtiPanelLabel: 'MBTI 선택',
  mbtiGroupLabel: 'MBTI 유형',
  mbtiHint: '선택 사항이에요. 성향에 맞는 여행지를 곧 추천해 드릴게요.',
  cuisinePanelLabel: '맛집투어 종류 선택',
  cuisineGroupLabel: '음식 종류',
  cuisineHint: '선택 사항이에요. 먹고 싶은 메뉴를 여러 개 고를 수 있어요.',
  cuisineKorean: '한식',
  cuisineChinese: '중식',
  cuisineJapanese: '일식',
  cuisineWestern: '양식',
  cuisineSalad: '샐러드',
  cuisineCoffee: '커피',
  cuisineDessert: '디저트',
  cuisineSnack: '분식',
  luckyDayPanelLabel: '럭키데이 정보 입력',
  birthDate: '생년월일',
  birthTime: '태어난 시각 (선택)',
  calendar: '달력',
  calendarSolar: '양력',
  calendarLunar: '음력',
  gender: '성별',
  genderFemale: '여성',
  genderMale: '남성',
  save: '저장',
  reset: '초기화',
  luckyDayHint: '선택 사항이에요. 오늘의 운세에 맞는 여행지를 곧 추천해 드릴게요.',

  submitIdle: '✨ 지금 떠나볼까요?',
  submitLoading: '설레는 곳 찾는 중…',

  errorLocationFailed: '위치를 가져오지 못했습니다.',
  errorRecommendFailed: '추천을 불러오지 못했습니다.',

  hourUnit: '시간',
  minuteUnit: '분',
  defaultTimeText: '3시간',

  resultsTitle: '추천 결과',
  resultsNoInfo: '검색 정보가 없어요. 처음부터 다시 시작해 주세요.',
  goSearch: '← 검색하러 가기',
  backToSearch: '← 다시 검색',
  resultsEmpty: '조건에 맞는 장소가 없어요.',
  resultsEmptyHint: '시간을 늘리거나 이동 수단을 바꿔보세요.',
  resultsCategoryEmpty: '선택한 종류에 해당하는 장소가 없어요.',
  routeNoteTransit: '대중교통 경로는 지도에서 제공되지 않아 직선으로 표시돼요.',
  routeNoteFallback: '실제 경로를 불러오지 못해 직선으로 표시돼요.',

  sortLabel: '정렬',
  sortByTime: '이동시간순',
  sortByDistance: '거리순',
  categoryLabel: '종류',
  categoryAll: '전체',
  sortGroupLabel: '정렬 기준',
  categoryFilterLabel: '카테고리 필터',

  approxPrefix: '약 ',
  actualApproxPrefix: '실제 약 ',
  detailButton: '상세 보기',

  closeLabel: '닫기',
  detailLoading: 'AI가 상세 정보를 준비하고 있어요…',
  activitiesTitle: '할 수 있는 활동',
  highlightsTitle: '이런 게 유명해요',
  directionsButton: '카카오맵에서 길찾기 →',

  mapOriginTitle: '출발지',
  mapLoading: '지도 불러오는 중…',
  mapNoKey: '지도를 표시하려면 VITE_KAKAO_MAP_KEY를 설정하세요.',
  mapError: '지도를 불러오지 못했습니다.',
};

const en: Translation = {
  themeSystem: 'System',
  themeLight: 'Light',
  themeDark: 'Dark',
  themeGroupLabel: 'Select display mode',
  languageGroupLabel: 'Select language',

  homeTitle: 'Spare time — where to go?',
  homeSubtitle: 'Tell us your location and free time, and we\u2019ll find places you can visit.',
  homeFoodTour: '🍜 What kind of food tour shall we go on today?',

  leadLocation: '📍 Where shall we set off from?',
  leadTime: '⏳ How much time do you have today?',
  leadMode: '🧭 How would you like to travel?',
  leadMbti: '💞 Let\u2019s find a trip that\u2019s so you.',
  leadLuckyDay: '🍀 Bring today\u2019s luck along for the trip.',

  hashtagLocation: 'Location',
  hashtagTime: 'Spare',
  hashtagMode: 'Transport',
  hashtagMbti: 'MBTI',
  hashtagCuisine: 'FoodTour',
  hashtagLuckyDay: 'LuckyDay',
  searchConditionsLabel: 'Set search conditions',

  locationPanelLabel: 'Location settings',
  useGps: '📍 Use current location',
  gpsLoading: 'Locating…',
  searchPlaceholder: 'Search place/address',
  manualPlaceholder: 'Enter place/address',
  confirm: 'OK',
  searching: 'Searching…',
  searchAriaLabel: 'Search place or address',
  selectedLocationPrefix: 'Selected location: ',
  locationHint: 'If not set, your current location is used.',
  currentLocation: 'Current location',

  timePanelLabel: 'Spare time settings',
  timePresetGroupLabel: 'Time presets',
  minutesSuffix: ' min',
  adjustTime: 'Adjust: ',
  timeSliderLabel: 'Spare time (minutes)',
  timeHint: 'If not set, 3 hours is used.',

  modePanelLabel: 'Transport settings',
  modeGroupLabel: 'Transport',
  modeWalking: 'Walking',
  modeTransit: 'Transit',
  modeDriving: 'Driving',
  modeHint: 'If not set, transit is used.',

  mbtiPanelLabel: 'Select MBTI',
  mbtiGroupLabel: 'MBTI type',
  mbtiHint: 'Optional. We\u2019ll soon recommend places that match your type.',

  cuisinePanelLabel: 'Pick food types',
  cuisineGroupLabel: 'Food types',
  cuisineHint: 'Optional. Pick as many cravings as you like.',
  cuisineKorean: 'Korean',
  cuisineChinese: 'Chinese',
  cuisineJapanese: 'Japanese',
  cuisineWestern: 'Western',
  cuisineSalad: 'Salad',
  cuisineCoffee: 'Coffee',
  cuisineDessert: 'Dessert',
  cuisineSnack: 'Snacks',

  luckyDayPanelLabel: 'Enter LuckyDay info',
  birthDate: 'Date of birth',
  birthTime: 'Time of birth (optional)',
  calendar: 'Calendar',
  calendarSolar: 'Solar',
  calendarLunar: 'Lunar',
  gender: 'Gender',
  genderFemale: 'Female',
  genderMale: 'Male',
  save: 'Save',
  reset: 'Reset',
  luckyDayHint: 'Optional. We\u2019ll soon recommend places matching your daily fortune.',

  submitIdle: '✨ Ready to go?',
  submitLoading: 'Finding exciting places…',

  errorLocationFailed: 'Could not get your location.',
  errorRecommendFailed: 'Could not load recommendations.',

  hourUnit: 'h',
  minuteUnit: 'm',
  defaultTimeText: '3 hours',

  resultsTitle: 'Recommendations',
  resultsNoInfo: 'No search info. Please start over.',
  goSearch: '← Go search',
  backToSearch: '← Search again',
  resultsEmpty: 'No places match your conditions.',
  resultsEmptyHint: 'Try increasing the time or changing transport.',
  resultsCategoryEmpty: 'No places in the selected category.',
  routeNoteTransit: 'Transit routes aren\u2019t shown on the map, so a straight line is used.',
  routeNoteFallback: 'Could not load the actual route, so a straight line is used.',

  sortLabel: 'Sort',
  sortByTime: 'By time',
  sortByDistance: 'By distance',
  categoryLabel: 'Type',
  categoryAll: 'All',
  sortGroupLabel: 'Sort by',
  categoryFilterLabel: 'Category filter',

  approxPrefix: 'approx. ',
  actualApproxPrefix: 'actual approx. ',
  detailButton: 'Details',

  closeLabel: 'Close',
  detailLoading: 'AI is preparing details…',
  activitiesTitle: 'Things to do',
  highlightsTitle: 'What it\u2019s known for',
  directionsButton: 'Directions on KakaoMap →',

  mapOriginTitle: 'Origin',
  mapLoading: 'Loading map…',
  mapNoKey: 'Set VITE_KAKAO_MAP_KEY to display the map.',
  mapError: 'Could not load the map.',
};

const ja: Translation = {
  themeSystem: 'システム',
  themeLight: 'ライト',
  themeDark: 'ダーク',
  themeGroupLabel: '表示モードを選択',
  languageGroupLabel: '言語を選択',

  homeTitle: 'すきま時間、どこへ行く？',
  homeSubtitle: '今の場所と空き時間を教えてくれれば、行ける場所を探します。',
  homeFoodTour: '🍜 今日はどんなグルメ巡りに出かけますか？',

  leadLocation: '📍 今、どこから出発しますか？',
  leadTime: '⏳ 今日はどれくらい余裕がありますか？',
  leadMode: '🧭 どんな方法で出かけますか？',
  leadMbti: '💞 あなたらしい旅を探します。',
  leadLuckyDay: '🍀 今日の運を旅に込めて。',

  hashtagLocation: '場所',
  hashtagTime: 'すきま',
  hashtagMode: '移動手段',
  hashtagMbti: 'MBTI',
  hashtagCuisine: 'グルメ巡り',
  hashtagLuckyDay: 'ラッキーデー',
  searchConditionsLabel: '検索条件の設定',

  locationPanelLabel: '場所の設定',
  useGps: '📍 現在地を使う',
  gpsLoading: '位置を確認中…',
  searchPlaceholder: '場所・住所を検索',
  manualPlaceholder: '場所・住所を入力',
  confirm: '確認',
  searching: '検索中…',
  searchAriaLabel: '場所または住所を検索',
  selectedLocationPrefix: '選択した場所: ',
  locationHint: '設定しない場合は現在地を使います。',
  currentLocation: '現在地',

  timePanelLabel: 'すきま時間の設定',
  timePresetGroupLabel: '時間プリセット',
  minutesSuffix: '分',
  adjustTime: '調整: ',
  timeSliderLabel: 'すきま時間（分）',
  timeHint: '設定しない場合は3時間を使います。',

  modePanelLabel: '移動手段の設定',
  modeGroupLabel: '移動手段',
  modeWalking: '徒歩',
  modeTransit: '公共交通',
  modeDriving: '車',
  modeHint: '設定しない場合は公共交通を使います。',

  mbtiPanelLabel: 'MBTIを選択',
  mbtiGroupLabel: 'MBTIタイプ',
  mbtiHint: '任意です。性格に合った旅行先を近日おすすめします。',

  cuisinePanelLabel: 'グルメの種類を選択',
  cuisineGroupLabel: '料理の種類',
  cuisineHint: '任意です。食べたいメニューを複数選べます。',
  cuisineKorean: '韓国料理',
  cuisineChinese: '中華',
  cuisineJapanese: '和食',
  cuisineWestern: '洋食',
  cuisineSalad: 'サラダ',
  cuisineCoffee: 'コーヒー',
  cuisineDessert: 'デザート',
  cuisineSnack: '軽食',

  luckyDayPanelLabel: 'ラッキーデー情報の入力',
  birthDate: '生年月日',
  birthTime: '生まれた時刻（任意）',
  calendar: '暦',
  calendarSolar: '新暦',
  calendarLunar: '旧暦',
  gender: '性別',
  genderFemale: '女性',
  genderMale: '男性',
  save: '保存',
  reset: 'リセット',
  luckyDayHint: '任意です。今日の運勢に合った旅行先を近日おすすめします。',

  submitIdle: '✨ 今すぐ出かける？',
  submitLoading: 'ワクワクする場所を探しています…',

  errorLocationFailed: '位置情報を取得できませんでした。',
  errorRecommendFailed: 'おすすめを取得できませんでした。',

  hourUnit: '時間',
  minuteUnit: '分',
  defaultTimeText: '3時間',

  resultsTitle: 'おすすめ結果',
  resultsNoInfo: '検索情報がありません。最初からやり直してください。',
  goSearch: '← 検索へ',
  backToSearch: '← もう一度検索',
  resultsEmpty: '条件に合う場所がありません。',
  resultsEmptyHint: '時間を増やすか、移動手段を変えてみてください。',
  resultsCategoryEmpty: '選択した種類に該当する場所がありません。',
  routeNoteTransit: '公共交通の経路は地図に表示されないため、直線で表示されます。',
  routeNoteFallback: '実際の経路を取得できなかったため、直線で表示されます。',

  sortLabel: '並べ替え',
  sortByTime: '移動時間順',
  sortByDistance: '距離順',
  categoryLabel: '種類',
  categoryAll: 'すべて',
  sortGroupLabel: '並べ替え基準',
  categoryFilterLabel: 'カテゴリーフィルター',

  approxPrefix: '約',
  actualApproxPrefix: '実際 約',
  detailButton: '詳細を見る',

  closeLabel: '閉じる',
  detailLoading: 'AIが詳細情報を準備しています…',
  activitiesTitle: 'できるアクティビティ',
  highlightsTitle: 'これが有名です',
  directionsButton: 'KakaoMapで経路案内 →',

  mapOriginTitle: '出発地',
  mapLoading: '地図を読み込み中…',
  mapNoKey: '地図を表示するには VITE_KAKAO_MAP_KEY を設定してください。',
  mapError: '地図を読み込めませんでした。',
};

export const TRANSLATIONS: Record<Language, Translation> = { ko, en, ja };
