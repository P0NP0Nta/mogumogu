import { useCallback, useEffect, useRef, useState } from "react";

type KeySpec = { label: string; chars: string[]; special?: "dakuten" | "small" | "delete" | "space" };

const foods = [
  "ちーずかれー","ぎゅうどん","かるぼなーら","とまとしちゅー","しょうがやきていしょく",
  "おむらいす","はんばーぐ","えびふらい","からあげていしょく","みそらーめん",
  "しおらーめん","しょうゆらーめん","つけめん","やきそば","おこのみやき",
  "たこやき","もんじゃやき","ぎょうざ","しゅうまい","はるまき",
  "ちゃーはん","まーぼーどうふ","すぶた","えびちり","ほいこーろー",
  "やきにくていしょく","とんかつ","ひれかつ","かつどん","てんどん",
  "おやこどん","かつかれー","びーふしちゅー","くりーむしちゅー","ぽーくそてー",
  "さばのみそに","さんまのしおやき","さけのむにえる","ぶりのてりやき","あじふらい",
  "にくじゃが","ぶたじる","とんじる","おでん","すきやき",
  "しゃぶしゃぶ","みずたき","ちゃんこなべ","もつなべ","きむちなべ",
  "てっかどん","かいせんどん","まぐろどん","ねぎとろどん","いくらどん",
  "ちらしずし","にぎりずし","てまりずし","いなりずし","えほうまき",
  "やきとりどん","そぼろどん","ろこもこ","たこらいす","どりあ",
  "ぐらたん","ぴざ","みーとそーすぱすた","ぺぺろんちーの","なぽりたん",
  "ぺんねあらびあーた","ぼんごれ","しーふーどぱすた","らざにあ","ぱえりあ",
  "ちきんらいす","ばたーちきんかれー","どらいかれー","ほうれんそうかれー","なすかれー",
  "おろしそば","てんぷらそば","きつねうどん","かれーうどん","やきうどん",
  "ざるそば","かまたまうどん","にくうどん","おにぎり","たまごさんど",
  "かつさんど","ふれんちとーすと","ほっとけーき","わっふる","ふるーつぱふぇ",
  "あんみつ","ぷりん","しょーとけーき","ちーずけーき","くりーむぱん"
];

const keyRows: KeySpec[][] = [
  [
    { label: "あ", chars: ["あ","い","う","え","お"] },
    { label: "か", chars: ["か","き","く","け","こ"] },
    { label: "さ", chars: ["さ","し","す","せ","そ"] },
  ],
  [
    { label: "た", chars: ["た","ち","つ","て","と"] },
    { label: "な", chars: ["な","に","ぬ","ね","の"] },
    { label: "は", chars: ["は","ひ","ふ","へ","ほ"] },
  ],
  [
    { label: "ま", chars: ["ま","み","む","め","も"] },
    { label: "や", chars: ["や","や","ゆ","や","よ"] },
    { label: "ら", chars: ["ら","り","る","れ","ろ"] },
  ],
  [
    { label: "わ", chars: ["わ","を","ん","ー",""] },
    { label: "゛", chars: [], special: "dakuten" },
    { label: "小", chars: [], special: "small" },
    { label: "⌫", chars: [], special: "delete" },
  ],
];

const dakutenMap: Record<string, string> = {
  か:"が",き:"ぎ",く:"ぐ",け:"げ",こ:"ご",
  さ:"ざ",し:"じ",す:"ず",せ:"ぜ",そ:"ぞ",
  た:"だ",ち:"ぢ",つ:"づ",て:"で",と:"ど",
  は:"ば",ひ:"び",ふ:"ぶ",へ:"べ",ほ:"ぼ",
  う:"ゔ"
};
const handakutenMap: Record<string, string> = { は:"ぱ",ひ:"ぴ",ふ:"ぷ",へ:"ぺ",ほ:"ぽ" };
const voicedToSemiMap: Record<string, string> = { ば:"ぱ",び:"ぴ",ぶ:"ぷ",べ:"ぺ",ぼ:"ぽ" };
const smallMap: Record<string, string> = {
  あ:"ぁ",い:"ぃ",う:"ぅ",え:"ぇ",お:"ぉ",
  や:"ゃ",ゆ:"ゅ",よ:"ょ",つ:"っ",わ:"ゎ"
};

type TouchStart = { x: number; y: number };

function App() {
  const [screen, setScreen] = useState<"start" | "playing" | "result">("start");
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [question, setQuestion] = useState(foods[0]);
  const [typed, setTyped] = useState("");
  const [lastFeedback, setLastFeedback] = useState("");
  const [bestScore, setBestScore] = useState(0);
  const touchStart = useRef<TouchStart | null>(null);
  const lastQuestion = useRef("");

  const nextQuestion = useCallback(() => {
    let next = foods[Math.floor(Math.random() * foods.length)];
    while (next === lastQuestion.current) next = foods[Math.floor(Math.random() * foods.length)];
    lastQuestion.current = next;
    setQuestion(next);
    setTyped("");
  }, []);

  const startGame = () => {
    setScore(0);
    setCorrectCount(0);
    setTimeLeft(60);
    setTyped("");
    setLastFeedback("");
    lastQuestion.current = "";
    nextQuestion();
    setScreen("playing");
  };

  useEffect(() => {
    if (screen !== "playing") return;
    if (timeLeft <= 0) {
      setBestScore((best) => Math.max(best, score));
      setScreen("result");
      return;
    }
    const timer = window.setTimeout(() => setTimeLeft((time) => time - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [screen, timeLeft, score]);

  const enterChar = (char: string) => {
    if (screen !== "playing" || !char) return;
    const updated = typed + char;
    setTyped(updated);
    if (updated === question) {
      setScore((s) => s + 10);
      setCorrectCount((c) => c + 1);
      setLastFeedback("せいかい！ +10点 🎉");
      window.setTimeout(() => {
        setLastFeedback("");
        nextQuestion();
      }, 180);
    } else if (!question.startsWith(updated)) {
      setLastFeedback("おしい！もういちど");
      window.setTimeout(() => setLastFeedback(""), 550);
    } else {
      setLastFeedback("");
    }
  };

  const pressKey = (key: KeySpec, direction: "tap" | "up" | "right" | "down" | "left") => {
    if (key.special === "delete") {
      setTyped((value) => value.slice(0, -1));
      return;
    }
    if (key.special === "dakuten") {
      setTyped((value) => {
        if (!value) return value;
        const chars = [...value];
        const last = chars.pop()!;
        chars.push(voicedToSemiMap[last] ?? dakutenMap[last] ?? handakutenMap[last] ?? last);
        return chars.join("");
      });
      return;
    }
    if (key.special === "small") {
      setTyped((value) => {
        if (!value) return value;
        const chars = [...value];
        const last = chars.pop()!;
        chars.push(smallMap[last] ?? last);
        return chars.join("");
      });
      return;
    }
    const index = direction === "tap" ? 0 : direction === "left" ? 1 : direction === "up" ? 2 : direction === "right" ? 3 : 4;
    enterChar(key.chars[index] ?? "");
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    touchStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>, key: KeySpec) => {
    const start = touchStart.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const distance = Math.hypot(dx, dy);
    let direction: "tap" | "up" | "right" | "down" | "left" = "tap";
    if (distance > 18) {
      if (Math.abs(dx) > Math.abs(dy)) direction = dx > 0 ? "right" : "left";
      else direction = dy > 0 ? "down" : "up";
    }
    pressKey(key, direction);
    touchStart.current = null;
  };

  const progress = typed.length ? Math.min(100, (typed.length / question.length) * 100) : 0;

  return (
    <main className="app-shell">
      <div className="bubble bubble-one" />
      <div className="bubble bubble-two" />
      <div className="bubble bubble-three" />
      <header className="top-brand">
        <span className="brand-icon">🍴</span>
        <span>もぐもぐフリック！</span>
      </header>

      {screen === "start" && (
        <section className="panel start-panel">
          <div className="hero-emoji">🍛 🥟 🍝</div>
          <p className="eyebrow">FOOD FLICK CHALLENGE</p>
          <h1>たべものの名前を<br /><span>フリック入力</span>しよう！</h1>
          <p className="intro">60秒で何問クリアできるかな？<br />料理名を正しく入力すると10点ゲット！</p>
          <div className="rule-pills"><span>⏱ 60びょう</span><span>⭐ 1問10点</span><span>🍽 全100種類</span></div>
          <button className="primary-button start-button" onClick={startGame}>ゲームスタート！ <span>▶</span></button>
          <p className="small-note">スマホは指でフリック ／ PCはマウスで操作</p>
        </section>
      )}

      {screen === "playing" && (
        <section className="panel game-panel">
          <div className="stats-row">
            <div className={`stat-box timer-box ${timeLeft <= 10 ? "urgent" : ""}`}>
              <span className="stat-label">のこり時間</span>
              <strong>{timeLeft}<small>秒</small></strong>
            </div>
            <div className="stat-box score-box">
              <span className="stat-label">スコア</span>
              <strong>{score}<small>点</small></strong>
            </div>
            <div className="stat-box count-box">
              <span className="stat-label">せいかい</span>
              <strong>{correctCount}<small>問</small></strong>
            </div>
          </div>

          <div className="question-card">
            <div className="question-top"><span>🍽 つぎのおだい</span><span className="random-tag">RANDOM</span></div>
            <div className="question-text">{question}</div>
            <div className="answer-line" aria-label="入力中の文字">
              {typed || <span className="placeholder">ここに入力されるよ</span>}
              <span className="cursor" />
            </div>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            <div className={`feedback ${lastFeedback.includes("せいかい") ? "good" : ""}`}>{lastFeedback || "おだいと同じ文字を入力してね！"}</div>
          </div>

          <div className="keyboard-wrap">
            <div className="keyboard-hint">タップ＝あ行の先頭 ／ 上下左右にフリックで文字を選択</div>
            <div className="flick-keyboard">
              {keyRows.map((row, rowIndex) => (
                <div className="key-row" key={rowIndex}>
                  {row.map((key) => (
                    <button
                      className={`flick-key ${key.special ? `special-key ${key.special}` : ""}`}
                      key={key.label}
                      onPointerDown={handlePointerDown}
                      onPointerUp={(event) => handlePointerUp(event, key)}
                      onContextMenu={(event) => event.preventDefault()}
                      aria-label={key.label}
                    >
                      <span>{key.label}</span>
                      {!key.special && <small>↖ {key.chars[1]}　↑ {key.chars[2]}<br />← {key.chars[1]}　→ {key.chars[3]}　↓ {key.chars[4]}</small>}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <button className="quit-button" onClick={() => setScreen("result")}>ゲームを終了する</button>
        </section>
      )}

      {screen === "result" && (
        <section className="panel result-panel">
          <div className="result-emoji">🏆</div>
          <p className="eyebrow">TIME UP!</p>
          <h1>おつかれさま！</h1>
          <p className="result-caption">今回のチャレンジ結果</p>
          <div className="final-score"><strong>{score}</strong><span>点</span></div>
          <div className="result-stats"><div><strong>{correctCount}</strong><span>正解数</span></div><div><strong>{bestScore}</strong><span>今回までの最高得点</span></div></div>
          <button className="primary-button" onClick={startGame}>もう一度あそぶ！ ↻</button>
          <button className="secondary-button" onClick={() => setScreen("start")}>タイトルにもどる</button>
        </section>
      )}
      <footer>© もぐもぐフリック！ <span>おいしくたのしく脳トレ 🍮</span></footer>
    </main>
  );
}

export default App;