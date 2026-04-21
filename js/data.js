(function (global) {
  "use strict";

  const DIFFICULTY = {
    easy: {
      id: "easy",
      name: "쉬움",
      subtitle: "입문자의 방",
      desc: "기본 한국사 상식과 친숙한 인물 중심. 처음 도전하기 좋아요.",
      hintsPerRun: 8,
    },
    normal: {
      id: "normal",
      name: "보통",
      subtitle: "서생의 방",
      desc: "사건의 흐름과 연대, 문화사를 아우르는 중급 난이도.",
      hintsPerRun: 6,
      comingSoon: true,
    },
    hard: {
      id: "hard",
      name: "어려움",
      subtitle: "사관의 방",
      desc: "심화 역사 지식과 복합 추론. 진짜 고수를 위한 방.",
      hintsPerRun: 4,
      comingSoon: true,
    },
  };

  // --------------------------------------------------------------------
  // Stage schema
  //   mechanic: 'select' | 'keypad' | 'dial' | 'sequence' | 'match' |
  //             'arrange' | 'hotspot' | 'combine'
  //   type: 'history' | 'common' | 'math' | 'nonsense'
  //   title: 단계 타이틀
  //   scene: { text?: string, items?: [{icon, label, note?}] }
  //   prompt: 추론 안내 한 줄
  //   config: 메커닉별 옵션
  //   solution: 메커닉별 정답 (문자열 / 배열 / 객체)
  //   hints: [관찰힌트, 추론힌트, 조작힌트]
  // --------------------------------------------------------------------

  const GOYEO_STAGES = [
    // 1 ── select
    {
      mechanic: "select",
      type: "history",
      title: "개경의 초상",
      scene: {
        text:
          "고려의 옛 수도 개경. 빛바랜 문루 아래 네 사람의 초상이 걸려 있다. 이 나라를 연 이의 얼굴을 지목해야 문이 열린다.",
      },
      prompt: "고려를 세운 왕을 지목하라.",
      config: {
        options: [
          { id: "wg", label: "왕건", detail: "송악의 호족, 918년 나라를 엶" },
          { id: "gh", label: "견훤", detail: "후백제의 왕" },
          { id: "gy", label: "궁예", detail: "후고구려를 세움" },
          { id: "is", label: "이성계", detail: "위화도에서 회군함" },
        ],
      },
      solution: "wg",
      hints: [
        "초상 하나에는 이름 속에 ‘왕(王)’ 자가 들어 있다.",
        "송악 출신 호족이 918년에 새 나라를 열었다.",
        "정답은 ‘왕건’.",
      ],
    },

    // 2 ── hotspot (remove intruders)
    {
      mechanic: "hotspot",
      type: "common",
      title: "어지러운 창고",
      scene: {
        text:
          "고려 유물만 있어야 할 창고에 누군가 조선 시대 물건을 섞어 두었다. 섞인 것들을 모두 골라내야 다음 방으로 이어지는 문이 열린다.",
      },
      prompt: "조선 시대 물건을 모두 선택한 뒤 ‘확인’을 누르라.",
      config: {
        items: [
          { id: "a", icon: "🏺", label: "상감청자", note: "고려 대표 자기" },
          { id: "b", icon: "📜", label: "직지심체요절", note: "고려 말 금속활자본" },
          { id: "c", icon: "🗂", label: "팔만대장경 목판", note: "몽골 침입기" },
          { id: "d", icon: "📖", label: "훈민정음 언해본", note: "한글 해설본" },
          { id: "e", icon: "⚓", label: "거북선 모형", note: "임진왜란" },
          { id: "f", icon: "🌿", label: "동의보감", note: "조선 의학서" },
          { id: "g", icon: "🏯", label: "수원화성 설계도", note: "정조 시기" },
          { id: "h", icon: "🔔", label: "고려 동종", note: "천흥사 동종" },
        ],
        targets: ["d", "e", "f", "g"],
      },
      solution: ["d", "e", "f", "g"],
      hints: [
        "한글은 고려보다 한참 뒤에 만들어졌다.",
        "조선은 1392년 이후. 그 시기 물건이 네 개 섞여 있다.",
        "훈민정음 언해본 · 거북선 · 동의보감 · 수원화성 설계도.",
      ],
    },

    // 3 ── dial (연호)
    {
      mechanic: "dial",
      type: "history",
      title: "개경의 연호 다이얼",
      scene: {
        text:
          "무거운 철제 자물쇠가 성문을 막는다. 네 개의 바퀴가 달려 있고, 옆의 작은 글귀엔 ‘고려가 열린 해에 이 문이 열린다’라고 적혀 있다.",
        items: [
          { icon: "🔒", label: "철제 자물쇠", note: "네 자리 다이얼" },
          { icon: "📜", label: "옛 문서", note: "‘918년, 송악에서…’" },
        ],
      },
      prompt: "고려 건국의 해(서기 4자리)를 맞추어 자물쇠를 열어라.",
      config: { digits: 4, symbols: "0123456789" },
      solution: "0918",
      hints: [
        "문서에 힌트가 되는 세 자리 숫자가 있다.",
        "네 자리 숫자다. 앞자리는 ‘0’으로 채워야 한다.",
        "0-9-1-8.",
      ],
    },

    // 4 ── keypad (1 digit)
    {
      mechanic: "keypad",
      type: "history",
      title: "서희의 담판",
      scene: {
        text:
          "거란의 장수 소손녕이 쳐들어왔다. 서희는 군사 한 명 움직이지 않고 담판만으로 적을 물렸고, 고려는 강동 ○주를 얻었다.",
        items: [
          { icon: "📯", label: "거란 진지", note: "소손녕의 진영" },
          { icon: "🗺", label: "강동 지도", note: "○ 개의 고을" },
        ],
      },
      prompt: "서희가 얻어낸 ‘강동 ○주’, 그 숫자는?",
      config: { length: 1 },
      solution: "6",
      hints: [
        "한 자리 숫자.",
        "4보다 크고 8보다 작다.",
        "정답은 6.",
      ],
    },

    // 5 ── combine (비석)
    {
      mechanic: "combine",
      type: "history",
      title: "귀주의 승전비",
      scene: {
        text:
          "강감찬의 승전을 기리는 비석이 여섯 조각으로 부서져 있다. 그중 네 조각만이 올바르고, 둘은 엉뚱한 조각이다. 바른 조각을 짝지어 승전비를 복원하라.",
      },
      prompt: "두 조각을 선택해 ‘결합’하라. 끝내 네 글자 전승의 이름을 완성하라.",
      config: {
        inventory: [
          { id: "gwi", icon: "🪨", label: "조각 “귀”" },
          { id: "ju", icon: "🪨", label: "조각 “주”" },
          { id: "dae", icon: "🪨", label: "조각 “대”" },
          { id: "chup", icon: "🪨", label: "조각 “첩”" },
          { id: "mong", icon: "🪨", label: "조각 “몽”" },
          { id: "gol", icon: "🪨", label: "조각 “골”" },
        ],
        recipes: [
          {
            a: "gwi",
            b: "ju",
            result: { id: "gwiju", icon: "📜", label: "반쪽 “귀주”" },
          },
          {
            a: "dae",
            b: "chup",
            result: { id: "daechup", icon: "📜", label: "반쪽 “대첩”" },
          },
          {
            a: "gwiju",
            b: "daechup",
            result: {
              id: "gwiju-daechup",
              icon: "🏛",
              label: "복원된 “귀주대첩” 승전비",
            },
          },
        ],
        goal: "gwiju-daechup",
      },
      solution: "gwiju-daechup",
      hints: [
        "1019년, 강감찬의 큰 승리. 전투 이름은 네 글자다.",
        "먼저 두 글자씩 묶어라: ‘귀+주’, ‘대+첩’.",
        "귀주 + 대첩 = 귀주대첩.",
      ],
    },

    // 6 ── select (청자)
    {
      mechanic: "select",
      type: "common",
      title: "상감의 기법",
      scene: {
        text:
          "네 점의 자기가 진열되어 있다. 고려 청자의 대표 기법인 ‘상감(象嵌)’이 쓰인 것은 단 하나. 나머지는 시대도 방식도 다르다.",
      },
      prompt: "‘상감’ 기법이 쓰인 청자를 골라라.",
      config: {
        options: [
          {
            id: "a",
            label: "표면을 파내 다른 색 흙을 메운 청자",
            detail: "음각 자리에 백토·자토를 메움",
          },
          {
            id: "b",
            label: "유약만 덮어 매끈한 비취색 청자",
            detail: "무늬 없음 (순청자)",
          },
          {
            id: "c",
            label: "회청색 바탕에 붓으로 무늬를 그린 도자기",
            detail: "분청사기",
          },
          {
            id: "d",
            label: "흰 바탕에 푸른 그림을 넣은 도자기",
            detail: "청화백자",
          },
        ],
      },
      solution: "a",
      hints: [
        "‘象嵌’은 ‘파고 메운다’는 뜻.",
        "다른 색 흙을 채워 무늬를 만든다.",
        "첫 번째가 상감청자.",
      ],
    },

    // 7 ── sequence (삼별초)
    {
      mechanic: "sequence",
      type: "history",
      title: "삼별초의 길",
      scene: {
        text:
          "몽골에 끝까지 맞선 삼별초는 네 곳을 차례로 옮겨 다니며 저항했다. 벽면 지도에 네 지명이 흩어져 있다.",
      },
      prompt: "삼별초의 근거지 이동 순서대로 지명을 눌러라.",
      config: {
        items: [
          { id: "je", label: "제주도" },
          { id: "gh", label: "강화도" },
          { id: "gg", label: "개경" },
          { id: "jd", label: "진도" },
        ],
      },
      solution: ["gg", "gh", "jd", "je"],
      hints: [
        "출발지는 고려 수도.",
        "수도 → 섬 → 더 남쪽 섬 → 가장 남쪽.",
        "개경 → 강화도 → 진도 → 제주도.",
      ],
    },

    // 8 ── keypad (팔만)
    {
      mechanic: "keypad",
      type: "math",
      title: "장경판의 수",
      scene: {
        text:
          "해인사 장경판전. 가지런히 쌓인 목판이 끝도 없이 이어진다. 현판엔 ‘팔만대장경’이라 적혔다.",
        items: [
          { icon: "🏛", label: "장경판전", note: "유네스코 세계유산" },
          { icon: "🧮", label: "‘팔만’ 표시", note: "‘만’ = 10,000" },
        ],
      },
      prompt: "‘팔만’을 아라비아 숫자 5자리로 입력하라.",
      config: { length: 5 },
      solution: "80000",
      hints: [
        "‘만’은 10,000.",
        "8 × 10,000 .",
        "80000.",
      ],
    },

    // 9 ── match (인물-업적)
    {
      mechanic: "match",
      type: "history",
      title: "인물과 업적",
      scene: {
        text:
          "낡은 벽화 속에 네 인물과 네 업적이 흩어져 있다. 짝을 맞추어야 벽이 열린다.",
      },
      prompt: "왼쪽 인물과 오른쪽 업적을 바르게 이어라.",
      config: {
        left: [
          { id: "seo", label: "서희" },
          { id: "gang", label: "강감찬" },
          { id: "yun", label: "윤관" },
          { id: "jeong", label: "정도전" },
        ],
        right: [
          { id: "sim", label: "담판으로 강동 6주 확보" },
          { id: "gwi", label: "귀주대첩의 승리" },
          { id: "buk", label: "여진 정벌, 동북 9성" },
          { id: "jo", label: "조선 건국을 설계" },
        ],
        pairs: { seo: "sim", gang: "gwi", yun: "buk", jeong: "jo" },
      },
      solution: { seo: "sim", gang: "gwi", yun: "buk", jeong: "jo" },
      hints: [
        "강감찬은 ‘귀주’라는 이름으로 연결된다.",
        "서희는 칼이 아니라 말로 이겼다.",
        "정도전은 조선의 설계자다.",
      ],
    },

    // 10 ── combine (직지)
    {
      mechanic: "combine",
      type: "history",
      title: "직지의 복원",
      scene: {
        text:
          "청주 흥덕사. 세계에서 가장 오래된 금속활자 인쇄본의 책 이름이 조각나 흩어져 있다.",
      },
      prompt: "조각을 결합해 책의 ‘줄인 정식 이름’(여섯 글자)을 완성하라.",
      config: {
        inventory: [
          { id: "jikji", icon: "📄", label: "조각 “직지”" },
          { id: "simche", icon: "📄", label: "조각 “심체”" },
          { id: "yojul", icon: "📄", label: "조각 “요절”" },
          { id: "baekun", icon: "📄", label: "조각 “백운”" },
          { id: "choerok", icon: "📄", label: "조각 “초록”" },
        ],
        recipes: [
          {
            a: "jikji",
            b: "simche",
            result: { id: "js", icon: "📘", label: "“직지심체”" },
          },
          {
            a: "js",
            b: "yojul",
            result: {
              id: "jsyj",
              icon: "📚",
              label: "완성된 “직지심체요절”",
            },
          },
        ],
        goal: "jsyj",
      },
      solution: "jsyj",
      hints: [
        "책 이름의 줄임은 ‘직지’로 알려져 있다.",
        "필요한 세 조각: 직지, 심체, 요절.",
        "직지+심체 → 직지심체 + 요절.",
      ],
    },

    // 11 ── select (북방)
    {
      mechanic: "select",
      type: "history",
      title: "북방의 장군",
      scene: {
        text:
          "두만강 너머 북쪽. ‘별무반’이라는 특수 부대를 조직해 여진을 정벌하고 동북 9성을 쌓은 장군의 이름이 새겨진 비석을 찾아라.",
      },
      prompt: "여진을 정벌하고 동북 9성을 쌓은 고려의 장군은?",
      config: {
        options: [
          { id: "is", label: "이성계" },
          { id: "seo", label: "서희" },
          { id: "yun", label: "윤관" },
          { id: "gang", label: "강감찬" },
        ],
      },
      solution: "yun",
      hints: [
        "이 장군은 ‘별무반’을 만들었다.",
        "이름은 두 글자, ‘ㅇ’으로 시작한다.",
        "윤관.",
      ],
    },

    // 12 ── select (광종)
    {
      mechanic: "select",
      type: "history",
      title: "개혁의 왕",
      scene: {
        text:
          "고려 초, 한 왕이 억울하게 노비가 된 자를 풀어 주었고, 시험으로 관리를 뽑는 제도를 처음 도입해 왕권을 세웠다.",
      },
      prompt: "노비안검법과 과거 제도를 시행한 고려의 왕은?",
      config: {
        options: [
          { id: "t", label: "태조" },
          { id: "h", label: "혜종" },
          { id: "j", label: "정종" },
          { id: "g", label: "광종" },
        ],
      },
      solution: "g",
      hints: [
        "태조의 손자 세대의 왕이다.",
        "‘빛 광(光)’ 자를 쓴다.",
        "광종.",
      ],
    },

    // 13 ── dial (몽골)
    {
      mechanic: "dial",
      type: "history",
      title: "몽골의 말발굽",
      scene: {
        text:
          "13세기 초, 북방에서 거대한 말발굽 소리가 밀려왔다. 몽골군이 고려 땅을 처음 밟은 해를 맞추어야 다음 방의 문이 열린다.",
      },
      prompt: "몽골의 1차 침입 연도를 4자리로 맞추어라.",
      config: { digits: 4, symbols: "0123456789" },
      solution: "1231",
      hints: [
        "1200년대 초반의 일이다.",
        "각 자리 숫자의 합은 7이다.",
        "1-2-3-1.",
      ],
    },

    // 14 ── sequence (왕 순서)
    {
      mechanic: "sequence",
      type: "common",
      title: "왕의 순서",
      scene: {
        text:
          "제사를 위한 네 개의 위패가 제단 위에 놓여 있다. 왕위에 오른 순서대로 짚어야 위패가 제 자리를 찾는다.",
      },
      prompt: "고려 초기 네 왕을 즉위 순서대로 클릭하라.",
      config: {
        items: [
          { id: "h", label: "혜종" },
          { id: "g", label: "광종" },
          { id: "t", label: "태조" },
          { id: "j", label: "정종" },
        ],
      },
      solution: ["t", "h", "j", "g"],
      hints: [
        "창업 군주가 맨 앞이다.",
        "태(조) → 혜(종) → 정(종) → 광(종).",
        "태조 → 혜종 → 정종 → 광종.",
      ],
    },

    // 15 ── hotspot (왕건 인장, find-one)
    {
      mechanic: "hotspot",
      type: "nonsense",
      title: "왕의 인장",
      scene: {
        text:
          "비단 보자기 위에 아홉 개의 금인(金印)이 놓여 있다. 글자가 새겨져 있고, 그중 하나가 왕건의 것이다. 힌트: 이름 속에 성(姓)이 숨어 있다.",
      },
      prompt: "왕건의 인장을 하나만 골라라.",
      config: {
        items: [
          { id: "i1", icon: "🟨", label: "光" },
          { id: "i2", icon: "🟨", label: "太" },
          { id: "i3", icon: "🟨", label: "穆" },
          { id: "i4", icon: "🟨", label: "王" },
          { id: "i5", icon: "🟨", label: "景" },
          { id: "i6", icon: "🟨", label: "宣" },
          { id: "i7", icon: "🟨", label: "恭" },
          { id: "i8", icon: "🟨", label: "神" },
          { id: "i9", icon: "🟨", label: "仁" },
        ],
        targets: ["i4"],
        exact: true,
      },
      solution: ["i4"],
      hints: [
        "왕건의 성을 한자로 쓰면?",
        "‘王’ 자 하나를 찾으면 된다.",
        "네 번째 줄의 ‘王’.",
      ],
    },

    // 16 ── combine (상감청자)
    {
      mechanic: "combine",
      type: "common",
      title: "청자의 이름",
      scene: {
        text:
          "장인의 공방에 명패가 조각나 있다. 고려 청자의 대표 기법 이름을 바르게 맞추어라.",
      },
      prompt: "두 조각을 결합해 ‘○○청자’ 이름을 완성하라.",
      config: {
        inventory: [
          { id: "sg", icon: "🧩", label: "조각 “상감”" },
          { id: "cj", icon: "🧩", label: "조각 “청자”" },
          { id: "bn", icon: "🧩", label: "조각 “분청”" },
          { id: "bj", icon: "🧩", label: "조각 “백자”" },
          { id: "ch", icon: "🧩", label: "조각 “청화”" },
        ],
        recipes: [
          {
            a: "sg",
            b: "cj",
            result: { id: "sgcj", icon: "🏺", label: "완성된 “상감청자”" },
          },
        ],
        goal: "sgcj",
      },
      solution: "sgcj",
      hints: [
        "‘분청’·‘백자’·‘청화’는 조선의 도자기.",
        "쓸 조각은 ‘상감’과 ‘청자’.",
        "상감 + 청자 = 상감청자.",
      ],
    },

    // 17 ── match (경(京)의 짝)
    {
      mechanic: "match",
      type: "history",
      title: "삼경(三京)의 이름",
      scene: {
        text:
          "고려에는 개경 외에도 ‘경(京)’이라 이름 붙인 도시가 있었다. 옛 이름과 그 위치(현재 도시)를 바르게 이어라.",
      },
      prompt: "고려의 옛 지명과 실제 도시를 연결하라.",
      config: {
        left: [
          { id: "sg", label: "서경(西京)" },
          { id: "ng", label: "남경(南京)" },
          { id: "dg", label: "동경(東京)" },
        ],
        right: [
          { id: "py", label: "평양" },
          { id: "hy", label: "한양(서울)" },
          { id: "gj", label: "경주" },
        ],
        pairs: { sg: "py", ng: "hy", dg: "gj" },
      },
      solution: { sg: "py", ng: "hy", dg: "gj" },
      hints: [
        "‘서(西)’는 서쪽. 고구려의 옛 수도.",
        "‘남(南)’은 지금의 서울 자리.",
        "서경-평양, 남경-한양, 동경-경주.",
      ],
    },

    // 18 ── arrange (사건 연표)
    {
      mechanic: "arrange",
      type: "history",
      title: "고려 연표",
      scene: {
        text:
          "다섯 개의 사건 패가 흩어져 있다. 연대 순으로 다섯 칸에 배열해야 한다.",
      },
      prompt: "다섯 사건을 일어난 순서대로 슬롯에 배치하라.",
      config: {
        slots: 5,
        items: [
          { id: "c", label: "귀주대첩 (1019)" },
          { id: "a", label: "고려 건국 (918)" },
          { id: "e", label: "고려 멸망 (1392)" },
          { id: "b", label: "거란 1차 침입 (993)" },
          { id: "d", label: "몽골 1차 침입 (1231)" },
        ],
      },
      solution: ["a", "b", "c", "d", "e"],
      hints: [
        "건국이 가장 먼저, 멸망이 가장 나중.",
        "거란이 몽골보다 먼저 쳐들어왔다.",
        "918 → 993 → 1019 → 1231 → 1392.",
      ],
    },

    // 19 ── arrange (단심가)
    {
      mechanic: "arrange",
      type: "common",
      title: "단심가의 구절",
      scene: {
        text:
          "정몽주가 이방원의 하여가에 답하며 지은 시조 ‘단심가’. 구절이 흐트러진 채 걸려 있다.",
      },
      prompt: "단심가 다섯 구절을 원래 순서대로 배치하라.",
      config: {
        slots: 5,
        items: [
          { id: "c", label: "백골이 진토되어" },
          { id: "a", label: "이 몸이 죽고 죽어" },
          { id: "e", label: "님 향한 일편단심이야" },
          { id: "b", label: "일백 번 고쳐 죽어" },
          { id: "d", label: "넋이라도 있고 없고" },
        ],
      },
      solution: ["a", "b", "c", "d", "e"],
      hints: [
        "첫 구절은 ‘이 몸이 죽고 죽어’.",
        "‘죽고 죽어’ → ‘고쳐 죽어’ → ‘진토되어’ → ‘있고 없고’.",
        "마지막 구절은 ‘님 향한 일편단심이야’.",
      ],
    },

    // 20 ── keypad (1392)
    {
      mechanic: "keypad",
      type: "history",
      title: "마지막 문",
      scene: {
        text:
          "고려의 마지막 문이 눈앞에 있다. 위화도에서 돌아온 이성계가 새 나라를 연 그 해, 고려의 문은 조용히 닫혔다.",
        items: [
          { icon: "🚪", label: "마지막 성문", note: "4자리 숫자 잠금" },
          { icon: "🗡", label: "녹슨 칼", note: "위화도의 증거" },
        ],
      },
      prompt: "고려가 멸망한(조선 건국) 해를 4자리로 입력하라.",
      config: { length: 4 },
      solution: "1392",
      hints: [
        "14세기 말이다.",
        "1 + 3 + 9 + 2 = 15.",
        "1392.",
      ],
    },
  ];

  const EASY_GAMES = [
    {
      id: "easy-goryeo",
      title: "고려의 길",
      tagline: "개경에서 시작되는 첫 번째 방 · 20관문",
      stages: GOYEO_STAGES,
    },
    {
      id: "easy-joseon",
      title: "조선의 꿈",
      tagline: "한양의 궁궐에서 펼쳐지는 두 번째 방 · 준비 중",
      stages: [],
      comingSoon: true,
    },
    {
      id: "easy-hanyang",
      title: "한양 비사",
      tagline: "궁궐과 저잣거리에 숨은 세 번째 방 · 준비 중",
      stages: [],
      comingSoon: true,
    },
  ];

  const DATA = {
    DIFFICULTY,
    GAMES: {
      easy: EASY_GAMES,
      normal: [],
      hard: [],
    },
  };

  global.ESCAPE_DATA = DATA;
})(window);
