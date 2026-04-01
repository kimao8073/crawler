# kakao-together-crawler

`https://together.kakao.com/fundraisings/now` (같이기부 진행중) 리스트를 끝까지 가져와 보기 좋게 정리합니다.

이 페이지는 무한스크롤로 로딩되지만, 내부 API(`.../fundraisings/api/v1/fundraisings/now`)를 호출해서 전체 데이터를 안정적으로 수집합니다.

## 설치

```bash
npm i
```

## 실행

Markdown / JSON / CSV 출력:

```bash
npm run crawl:now:md
npm run crawl:now:json
npm run crawl:now:csv
```

직접 실행 (stdout):

```bash
node src/cli.js now --format md
```

옵션:

```bash
node src/cli.js now --format md --seed 14 --size 20 --delayMs 150 --maxPages 500
```

## 테스트

```bash
npm test
```

## (디버그) API 찾기

Playwright로 네트워크를 캡처해 내부 API를 확인합니다.

```bash
npm run discover:api
```
