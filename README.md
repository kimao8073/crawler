# crawler

Node.js 라이브러리 + CLI로 아래 3개 사이트의 리스트를 끝까지 수집합니다.

- Kakao 같이기부: `https://together.kakao.com/fundraisings/now` (무한스크롤 데이터)
- GoodNeighbors: `https://www.goodneighbors.kr/support/campaign/1/campaignList.gn` (페이지네이션)
- Naver Happybean: `https://happybean.naver.com/donation/DonateHomeMain` ("더보기" 데이터)

브라우저 자동화 없이(가능한 경우) 내부 API/HTML을 직접 호출해서 안정적으로 수집합니다.

## 요구사항

- Node.js 18+

## 설치

```bash
npm i
```

## CLI 사용

패키지 설치 후 로컬에서:

```bash
node bin/cli.js --help
```

Markdown / JSON / CSV 출력 예시:

```bash
node bin/cli.js now --format md --out out/fundraisings-now.md
node bin/cli.js goodneighbors --format json --out out/goodneighbors-campaigns.json
node bin/cli.js happybean --format csv --out out/happybean-donations.csv
```

옵션 예시:

```bash
# Kakao Together: seed/size/maxPages
node bin/cli.js now --format json --seed 14 --size 20 --delayMs 150 --maxPages 500

# GoodNeighbors: 진행중/종료 + 페이지 범위 + 필터
node bin/cli.js goodneighbors --closeYn N --pageNo 1 --endPage 3 --filter "아동" --format md

# Happybean: 정렬/필터 + 요청당 개수
node bin/cli.js happybean --order rcmd_ymdt --sortType desc --onlyDouble false --batchSize 20 --format md
```

`--out`을 생략하면 stdout으로 출력합니다.

## 라이브러리 사용

`src/index.js`가 공개 엔트리포인트입니다.

```js
const { kakaoTogether, goodNeighbors, happybean } = require('kakao-together-crawler');

async function run() {
  const kakao = await kakaoTogether.crawlFundraisingsNow({ seed: 14, size: 20, delayMs: 0, maxPages: 2 });
  console.log(kakao.items[0]);

  const gn = await goodNeighbors.crawlCampaignList({ closeYn: 'N', startPage: 1, endPage: 1, delayMs: 0 });
  console.log(gn.items[0]);

  const hb = await happybean.crawlDonationList({ batchSize: 20, delayMs: 0, maxRequests: 2 });
  console.log(hb.items[0]);
}

run();
```

각 모듈은 다음을 export 합니다.

- `kakaoTogether`
  - `crawlFundraisingsNow(options)`
  - `toMarkdown(items)`, `toCsv(items)`
- `goodNeighbors`
  - `crawlCampaignList(options)`
  - `toMarkdown(items)`, `toCsv(items)`
- `happybean`
  - `crawlDonationList(options)`
  - `toMarkdown(items)`, `toCsv(items)`

옵션에 `fetchImpl`, `signal`을 넘겨서 호출/타임아웃/취소를 제어할 수 있습니다(각 모듈 구현 참고).

## 출력 스키마(요약)

사이트별 `result`는 공통적으로 `{ truncated, count, items, ...meta }` 형태입니다.

- Kakao Together items
  - `id`, `title`, `teamName`, `subTopic`, `fundraisingStartAt`, `fundraisingEndAt`, `daysLeft`, `totalDonationAmount`, `targetAmount`, `progressPct`, `totalDonatorCount`, `status`, `link`, `mainImageUrl`
- GoodNeighbors items
  - `state`, `category`, `title`, `summary`, `detailUrl`, `donateUrl`, `thumbUrl`, `thumbAlt`
- Happybean items
  - `rdonaBoxNo`, `title`, `summary`, `hlogName`, `rdonaBoxType`, `stateCode`, `completeCode`, `currentAmount`, `goalAmount`, `progressPct`, `donationCount`, `startYmd`, `endYmd`, `registDate`, `rcmdDate`, `defaultImage`, `link`

## 테스트

```bash
npm test
```

## (디버그) Kakao 내부 API 확인

Playwright로 네트워크를 캡처해 내부 API를 확인합니다.

```bash
npm run discover:api
```

참고: Playwright는 `devDependencies`입니다. 디버그 스크립트를 쓰지 않으면 설치/실행이 필요 없습니다.
