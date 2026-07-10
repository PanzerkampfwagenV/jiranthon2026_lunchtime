"""틈나는 시간 추천 웹앱 E2E 테스트 (Playwright).

전제:
  - 프론트엔드 dev 서버가 http://localhost:5173 에서 실행 중
  - 백엔드 API 서버가 http://localhost:4000 에서 실행 중
  - frontend/.env 에 VITE_KAKAO_MAP_KEY, VITE_API_BASE_URL 설정됨

검증 시나리오:
  1. 홈 화면 진입 → 장소 검색(서울시청) 자동완성 동작 (= Kakao SDK 정상 로드)
  2. 위치 선택 후 "추천 받기" → 결과 페이지 이동
  3. 백엔드 연동으로 추천 장소 목록 렌더 (Mock 아님)
  4. Kakao 지도 로드 완료 ("지도 불러오는 중…" 사라지고 지도 타일 렌더)
"""

import re

import pytest
from playwright.sync_api import Page, expect

BASE_URL = "http://localhost:5173"


@pytest.fixture(autouse=True)
def _fail_on_orb(page: Page):
    """Kakao SDK가 ORB(401)로 차단되면 잡아내기 위한 실패 요청 수집."""
    blocked: list[str] = []

    def on_response(resp):
        if "dapi.kakao.com/v2/maps/sdk.js" in resp.url and resp.status != 200:
            blocked.append(f"{resp.status} {resp.url}")

    page.on("response", on_response)
    yield
    assert not blocked, f"Kakao SDK 로드가 차단됨(ORB 위험): {blocked}"


def test_search_recommend_and_map(page: Page):
    page.goto(BASE_URL)

    # Kakao SDK(services) 로드 완료를 기다린다.
    # window.kakao.maps.services 가 준비돼야 검색 자동완성이 동작한다.
    page.wait_for_function(
        "() => Boolean(window.kakao && window.kakao.maps && window.kakao.maps.services)",
        timeout=15_000,
    )

    # 1. 장소 검색 자동완성 (Kakao services 라이브러리 = SDK 로드 확인)
    # 검색은 onChange 마다 실행되므로 한 글자씩 입력해 재검색을 트리거한다.
    search = page.get_by_role("combobox", name="장소 또는 주소 검색")
    search.click()
    search.press_sequentially("서울시청", delay=80)

    option = page.get_by_role("option").first
    expect(option).to_be_visible(timeout=10_000)
    option.click()

    # 위치 선택 확인
    expect(page.get_by_text("선택된 위치:")).to_be_visible()

    # 2. 추천 받기
    recommend = page.get_by_role("button", name="추천 받기")
    expect(recommend).to_be_enabled()
    recommend.click()

    # 3. 결과 페이지 + 추천 목록 렌더 (백엔드 연동)
    expect(page.get_by_role("heading", name="추천 결과")).to_be_visible(timeout=10_000)
    cards = page.locator(".result-list li")
    expect(cards.first).to_be_visible(timeout=10_000)
    assert cards.count() >= 1, "추천 장소가 하나도 렌더되지 않음"

    # 4. Kakao 지도 로드 완료: 로딩 오버레이가 사라져야 함
    loading = page.get_by_role("status", name="지도 불러오는 중…")
    expect(loading).to_have_count(0, timeout=15_000)

    # 지도 캔버스가 존재하고 타일 이미지가 렌더되었는지 확인
    canvas = page.locator(".map-view__canvas")
    expect(canvas).to_be_visible()
    tiles = canvas.locator("img")
    expect(tiles.first).to_be_visible(timeout=15_000)

    # 검증 결과를 눈으로 확인할 수 있도록 스크린샷 저장
    page.screenshot(path="tests/e2e/_artifacts/results_map.png", full_page=True)
    print(f"\n[검증] 추천 카드 수={cards.count()}, 지도 타일 수={tiles.count()}")
