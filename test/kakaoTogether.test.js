const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildNowApiUrl,
  donationProgressPct,
  daysUntil,
  normalizeFundraisingRow,
  toMarkdown,
  toCsv,
} = require('../src/kakaoTogether');

test('buildNowApiUrl builds expected path and params', () => {
  const url = buildNowApiUrl({ baseUrl: 'https://together.kakao.com', page: 3, size: 10, seed: 14 });
  assert.ok(
    url.includes('https://together.kakao.com/fundraisings/api/fundraisings/api/v1/fundraisings/now'),
    'url should contain expected pathname'
  );
  assert.ok(url.includes('page=3'));
  assert.ok(url.includes('size=10'));
  assert.ok(url.includes('seed=14'));
});

test('donationProgressPct returns percent with 0.1 precision', () => {
  assert.equal(donationProgressPct(50, 200), 25);
  assert.ok(Math.abs(donationProgressPct(1, 3) - 33.3) < 0.2);
  assert.equal(donationProgressPct(null, 3), undefined);
});

test('daysUntil handles YYYY-MM-DD and returns integer', () => {
  const d = daysUntil('2099-01-01');
  assert.equal(Number.isInteger(d), true);
});

test('normalizeFundraisingRow outputs stable shape', () => {
  const out = normalizeFundraisingRow({
    id: 1,
    title: 't',
    subTopic: 's',
    teamName: 'team',
    fundraisingStartAt: '2026-01-01',
    fundraisingEndAt: '2099-01-01',
    totalDonationAmount: 1000,
    targetAmount: 2000,
    totalDonatorCount: 10,
    status: 'STATUS_FUNDING',
    mainImageUrl: 'https://example.com/a.jpg',
  });
  assert.equal(out.id, 1);
  assert.equal(out.title, 't');
  assert.equal(out.teamName, 'team');
  assert.equal(out.link, 'https://together.kakao.com/fundraisings/1/story');
  assert.equal(out.progressPct, 50);
});

test('toMarkdown and toCsv include expected headers', () => {
  const items = [
    {
      id: 1,
      title: 'hello',
      subTopic: 'topic',
      teamName: 'team',
      fundraisingEndAt: '2099-01-01',
      daysLeft: 10,
      totalDonationAmount: 100,
      targetAmount: 200,
      progressPct: 50,
      totalDonatorCount: 3,
      link: 'https://together.kakao.com/fundraisings/1/story',
    },
  ];
  const md = toMarkdown(items);
  assert.ok(md.includes('| # | 제목 |'));
  assert.ok(md.includes('hello'));

  const csv = toCsv(items);
  assert.ok(csv.split('\n')[0].includes('id,title,teamName'));
  assert.ok(csv.includes('hello'));
});
