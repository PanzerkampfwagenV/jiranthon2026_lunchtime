import { useEffect, useMemo, useState } from 'react';
import './PolaroidBackdrop.css';

const TOTAL_IMAGES = 10;
const PHOTO_COUNT = 8;
const SWAP_INTERVAL_MS = 4500;

// 각 서울 이미지(seoul-01~10)에 어울리는 감성 여행 문구.
const CAPTIONS: Record<string, string> = {
  'seoul-01': '고궁 담벼락 너머,\n오늘의 설렘이 시작돼',
  'seoul-02': '광화문 앞에서\n잠깐, 숨 고르기',
  'seoul-03': '북한산 능선 위로\n겨울이 스며든다',
  'seoul-04': '낯선 거리 하나가\n여행이 된다',
  'seoul-05': '남산 노을 한 조각,\n오늘은 여기서 멈출래',
  'seoul-06': '기와 사이로 스치는\n오래된 이야기',
  'seoul-07': '다음 역까진\n조금 더 걸어도 좋아',
  'seoul-08': '남산타워를 보며\n걷는 이 순간',
  'seoul-09': '지하철 창밖으로\n스쳐가는 서울',
  'seoul-10': '동대문의 밤,\n도시가 반짝인다',
};

function captionFor(src: string): string {
  const key = src.match(/seoul-\d{2}/)?.[0] ?? '';
  return CAPTIONS[key] ?? '오늘, 이 순간을\n기억해줘';
}

// 화면에 흩뿌릴 폴라로이드의 위치·크기·애니메이션 딜레이를 미리 정의.
// (top/left는 vw/vh 기준 %, size는 px, delay는 s)
// 회전각(rotate)은 교체될 때마다 랜덤하게 다시 부여한다.
const LAYOUT_SLOTS = [
  { top: 6, left: 4, size: 210, delay: 0 },
  { top: 8, left: 76, size: 190, delay: 0.6 },
  { top: 40, left: 2, size: 196, delay: 1.2 },
  { top: 44, left: 80, size: 205, delay: 0.3 },
  { top: 2, left: 40, size: 172, delay: 0.9 },
  { top: 70, left: 20, size: 188, delay: 1.5 },
  { top: 68, left: 60, size: 200, delay: 0.45 },
  { top: 38, left: 42, size: 168, delay: 1.05 },
];

function randomRotate(): number {
  // -16deg ~ 16deg 사이 랜덤 회전
  return Math.round((Math.random() * 32 - 16) * 10) / 10;
}

function buildPool(): string[] {
  return Array.from({ length: TOTAL_IMAGES }, (_, i) =>
    `/images/seoul-${String(i + 1).padStart(2, '0')}.jpg`,
  );
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface SlotState {
  src: string;
  rotate: number;
}

function pickInitialSlots(): SlotState[] {
  const chosen = shuffle(buildPool()).slice(0, PHOTO_COUNT);
  return chosen.map((src) => ({ src, rotate: randomRotate() }));
}

export default function PolaroidBackdrop() {
  const pool = useMemo(() => buildPool(), []);
  const [slots, setSlots] = useState<SlotState[]>(() => pickInitialSlots());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlots((prev) => {
        // 매 주기마다 슬롯 중 하나를 골라 현재 화면에 없는 사진으로 교체하고 회전각도 다시 부여
        const slotIndex = Math.floor(Math.random() * prev.length);
        const currentSrcs = new Set(prev.map((s) => s.src));
        const candidates = pool.filter((src) => !currentSrcs.has(src));
        const nextSrc =
          candidates[Math.floor(Math.random() * candidates.length)] ??
          prev[slotIndex].src;
        const next = [...prev];
        next[slotIndex] = { src: nextSrc, rotate: randomRotate() };
        return next;
      });
    }, SWAP_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [pool]);

  return (
    <div className="polaroid-backdrop" aria-hidden="true">
      {slots.map((slot, i) => {
        const layout = LAYOUT_SLOTS[i % LAYOUT_SLOTS.length];
        return (
          <figure
            key={i}
            className="polaroid-backdrop__photo"
            style={{
              top: `${layout.top}%`,
              left: `${layout.left}%`,
              width: `${layout.size}px`,
              '--rotate': `${slot.rotate}deg`,
              '--float-delay': `${layout.delay}s`,
            } as React.CSSProperties}
          >
            <img key={slot.src} src={slot.src} alt="" loading="eager" />
            <figcaption key={`${slot.src}-caption`} className="polaroid-backdrop__caption">
              {captionFor(slot.src)}
            </figcaption>
          </figure>
        );
      })}
      <div className="polaroid-backdrop__scrim" />
    </div>
  );
}


