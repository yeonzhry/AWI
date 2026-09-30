// 사진은 src/assets/<할머니 id>/<연도>.jpg 로 넣으면 자동으로 매칭됩니다.
// 예) src/assets/kim-uigyeong/1918.jpg
// 확장자는 jpg, jpeg, png, webp 모두 가능. 사진 없는 연도는 표시되지 않습니다.

const photoFiles = require.context("../assets", true, /\.(jpe?g|png|webp)$/i);

// ("kim-uigyeong", 1918) → 사진 경로, 없으면 null
export function getPhoto(personId, year) {
  const pattern = new RegExp(`^\\./${personId}/${year}\\.(jpe?g|png|webp)$`, "i");
  const match = photoFiles.keys().find((key) => pattern.test(key));
  return match ? photoFiles(match) : null;
}

export const governmentTimeline = [
  { year: 1965, text: "위안부 문제가 포함되지 않은 한일청구권협정 체결" },
  { year: 1991, text: "위안부 피해자 김학순, 최초 공개 증언" },
  { year: 1993, text: "고노 요헤이, 일본군 위안부 동원의 강제성 인정" },
  { year: 1995, text: "아시아 여성 기금 설립" },
  { year: 2001, text: "일본 역사 교과서 위안부 서술 삭제" },
  { year: 2011, text: "헌법재판소, 정부 부작위 위헌 결정" },
  { year: 2015, text: "한일 위안부 합의 발표" },
  { year: 2018, text: "화해치유재단 해산 결정" },
];

export const grandmothers = [
  {
    id: "kim-uigyeong",
    name: "김의경",
    events: [
      { year: 1918, text: "서울 태평로 출생" },
      { year: 1938, text: "일본군에 의해 강제 동원되어 위안부 생활 시작" },
      { year: 1939, text: "후베이성 이창에서 군위안부 생활" },
      { year: 1941, text: "후난성 창사에서 군위안부 생활" },
      { year: 1945, text: "우한으로 와서 귀국하고자 하였으나 실패" },
      { year: 1994, text: "변영주 감독의 <낮은 목소리>에 영상 기록" },
      { year: 2001, text: "한국정신대연구소 여순주 연구원 면담" },
      { year: 2006, text: "정부에 일본군 위안부 피해 등록" },
      { year: 2009, text: "사망" },
    ],
  },
  {
    id: "mun-okju",
    name: "문옥주",
    events: [
      { year: 1924, text: "대구시 동명동 출생" },
      { year: 1936, text: "일본 친척집으로 감" },
      { year: 1937, text: "돈을 벌 수 없어 한국으로 귀국" },
      { year: 1941, text: "중국 둥안성 위안소에 동원" },
      { year: 1942, text: "제4차 위안단의 일원으로 버마행" },
      { year: 1943, text: "아키압 작전에 동원" },
      { year: 1944, text: "일본군의 퇴각과 함께 이동" },
      { year: 1945, text: "타이에서 해방을 맞음" },
      { year: 1946, text: "대구로 귀환" },
      { year: 1991, text: "한국정신대문제대책협의회에 피해 신고" },
      { year: 1993, text: "한국 정부에 일본군 위안부 피해 등록" },
      { year: 1996, text: "대구에서 사망" },
    ],
  },
  {
    id: "kim-haksun",
    name: "김학순",
    events: [
      { year: 1924, text: "중국 지린 출생" }, // 원본 PDF엔 1942로 적혀 있음 → 확인 필요
      { year: 1939, text: "평양 기생학교 다님" },
      { year: 1941, text: "평양 기생학교 졸업 후 베이징에서 군위안부로 강제 동원" },
      { year: 1942, text: "군위안소 탈출" },
      { year: 1946, text: "인천으로 귀국" },
      { year: 1991, text: "8월 14일 국내 거주자 중 최초로 일본군 위안부 피해자로 증언, 도쿄지방재판소에 제소" },
      { year: 1992, text: "일본 도쿄 <전후 보상에 관한 국제 공청회>에서 증언, 이후 지속적인 증언 활동" }, // 원본에 1993과 같은 내용 중복 → 확인 필요
      { year: 1997, text: "사망" },
    ],
  },
  {
    id: "lee-sangok",
    name: "리상옥",
    events: [
      { year: 1926, text: "황해도 곡성군 출생" },
      { year: 1943, text: "구장의 처녀공출로 동원되어 아사코라는 이름으로 군위안부 생활" },
      { year: 1995, text: "<짓밟힌 인생의 웨침>에 구술 수록" },
      { year: 1997, text: "이토 다카시, <종군위안부: 남북 종군위안부 27인의 증언>에 증언 수록" },
      { year: 2004, text: "<일본의 과거청산을 요구하는 제2회 국제연대협의회 서울대회> 참가" },
      { year: 2005, text: "사망" },
    ],
  },
  {
    id: "choi-seonsun",
    name: "최선순",
    events: [
      { year: 1929, text: "전북 고창 출생" },
      { year: 1942, text: "부산을 통해 일본으로 가 미상지역에서 군위안부 생활" },
      { year: 1945, text: "정신이상 상태로 해방 후 귀국" },
      { year: 1993, text: "태평양전쟁희생자유족회를 통해 한국 정부에 위안부 피해 등록" },
      { year: 2013, text: "전북 고창에서 사망" },
    ],
  },
  {
    id: "park-chasun",
    name: "박차순",
    events: [
      { year: 1923, text: "전라북도 전주(추정) 출생" },
      { year: 1940, text: "일본인 식당 등에서 일함" },
      { year: 1941, text: "일하던 가게의 업주가 군위안소 업자에게 팔아넘김" },
      { year: 1942, text: "중국 후난성에서 2년간 군위안부 생활" },
      { year: 1944, text: "중국 난징에서 2개월간 군위안부 생활" },
      { year: 2003, text: "한국정신대연구소 연구원과 면담" },
      { year: 2006, text: "한국 정부에 일본군 위안부 피해 등록" },
    ],
  },
  {
    id: "jeong-seoun",
    name: "정서운",
    events: [
      { year: 1923, text: "경상남도 하동 출생" },
      { year: 1941, text: "공권력 위협 및 취업 사기로 일본군 위안부에 강제 동원" },
      { year: 1942, text: "인도네시아 자바섬 스마랑에서 군위안부 생활" },
      { year: 1945, text: "해방 후 싱가포르에서 수용소 생활" },
      { year: 1993, text: "한국 정부에 피해 등록, 이후 유엔 기구·미국 등 국내외에서 증언 활동" },
      { year: 2002, text: "<그 말을 어디다 다 할꼬: 일본군 위안부 증언자료집>에 구술 수록" },
      { year: 2004, text: "사망" },
    ],
  },
  {
    id: "kim-yeongsuk",
    name: "김영숙",
    events: [
      { year: 1927, text: "평안북도 태천군 학봉리 출생" },
      { year: 1940, text: "일본 순사의 꾀임으로 중국 선양에서 군위안부로 강제 동원" },
      { year: 1991, text: "남측 피해자들이 나서는 것을 보고 증언" },
      { year: 1995, text: "<짓밟힌 인생의 웨침>에 증언 수록" },
      { year: 2000, text: "<2000년 일본군성노예전범국제여성법정>에서 피해자로서 증언" },
      { year: 2002, text: "<민족 21> 3월호에 구술 수록" },
      { year: 2010, text: "사망" },
    ],
  },
  {
    id: "mun-pilgi",
    name: "문필기",
    events: [
      { year: 1925, text: "경남 진양군 출생" },
      { year: 1934, text: "보통학교에 입학하였으나 아버지의 반대로 중도 포기" },
      { year: 1943, text: "일본인 앞잡이의 속임수로 만주에서 군위안부로 강제 동원" },
      { year: 1945, text: "해방 후 고향으로 귀환" },
      { year: 1992, text: "군위안부 신고에 대해 우연히 알게 되어 신고" },
      { year: 1993, text: "일본군 위안부 피해 등록" },
      { year: 2000, text: "국제인권변호인단 인권상 수상, <2000년 일본군성노예전범국제여성법정>에서 증언" },
      { year: 2007, text: "미국 하원에 위안부 사죄 결의안의 빠른 통과를 위한 영상편지 발송" },
      { year: 2008, text: "사망" },
    ],
  },
  {
    id: "gil-wonok",
    name: "길원옥",
    events: [
      { year: 1928, text: "평안북도 희천군 출생" }, // 원본 PDF엔 1925 → 확인 필요
      { year: 1940, text: "중국 헤이룽장성 소재의 위안소로 동원" },
      { year: 1942, text: "취업사기로 중국 허베이성 스자좡 도키와 위안소로 동원" },
      { year: 1944, text: "부친 부고에도 귀향 시도 좌절" },
      { year: 1946, text: "해방 후 인천으로 귀환" },
      { year: 1998, text: "한국 정부에 위안부 피해자로 등록" },
      { year: 2016, text: "정대협 쉼터 평화의 우리집에서 거주" },
      { year: 2025, text: "사망" },
    ],
  },
];