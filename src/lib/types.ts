/** Kiểu dữ liệu API — chép nguyên từ `lib/types.ts` của hanni-client, sửa ở web thì chép lại sang đây. */
export interface Me {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  locale: string;
  role: string;
  emailVerifiedAt: string | null;
  hasPassword: boolean;
  premiumUntil: string | null;
  settings?: UserSettings | null;
  streak?: { currentStreak: number; longestStreak: number } | null;
}

export interface UserSettings {
  dailyGoalType: "WORDS" | "MINUTES";
  dailyGoalValue: number;
  maxReviewsPerDay: number | null;
  srsScheduler: "sm2" | "fsrs";
  targetRetention: number;
  reminderHour: number | null;
  weeklyDigestEnabled: boolean;
}

export interface HskLevel {
  level: number;
  band: "ELEMENTARY" | "INTERMEDIATE" | "ADVANCED";
  nameVi: string;
  newWords2025: number;
  cumulative2025: number;
  readingChars: number | null;
  writingChars: number | null;
  wordsInDb: number;
}

export interface Word {
  id: string;
  simplified: string;
  traditional: string | null;
  pinyin: string;
  pinyinNumeric: string;
  hskLevel: number;
  pos: string[];
  frequencyRank: number | null;
  meaningVi: string | null;
  meaningEn: string | null;
  hanViet: string | null;
  translationStatus: string;
  audioUrl: string | null;
  /** mẹo nhớ theo âm Hán Việt do AI viết (tạo 1 lần, dùng chung) */
  mnemonicVi?: string | null;
  lessonId?: string | null;
  lessonOrder?: number | null;
  examples?: WordExample[];
  progressState?: string;
}

export interface LessonNode {
  id: string;
  orderIndex: number;
  title: string;
  wordCount: number;
  learnedWords: number;
  startedWords: number;
  dueWords: number;
  status: "COMPLETED" | "IN_PROGRESS" | "AVAILABLE";
  previewWords: string[];
}

export interface LearnPath {
  level: number;
  levelName: string;
  band: string;
  totalLessons: number;
  completedLessons: number;
  currentLessonId: string | null;
  lessons: LessonNode[];
  levels: number[];
}

/** Bài đang học dở — để các trang luyện tập mặc định theo đúng chủ đề người
 * dùng đang theo, thay vì mỗi trang tự lấy ngẫu nhiên theo cấp HSK. */
export interface CurrentLesson {
  id: string;
  title: string;
  orderIndex: number;
  hskLevel: number;
  inProgress: boolean;
  totalLessons: number;
  completedLessons: number;
}

export interface LessonDetail {
  lesson: {
    id: string;
    title: string;
    orderIndex: number;
    hskLevel: number;
    wordCount: number;
  };
  words: Word[];
  relatedGrammar: GrammarListItem[];
}

export interface WordExample {
  id: string;
  zh: string;
  pinyin: string | null;
  vi: string | null;
  en: string | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface QueueItem {
  progressId?: string;
  state: string;
  dueAt?: string;
  word: Word;
}

export interface StudyQueue {
  due: QueueItem[];
  newCards: QueueItem[];
  counts: {
    due: number;
    reviewsDoneToday: number;
  };
}

export interface StudyStats {
  dueNow: number;
  /** đến hạn trong 24h tới — dùng cho thông điệp "sắp quên" */
  atRisk: number;
  learnedTotal: number;
  inProgress: number;
  reviewsDoneToday: number;
  leechCount: number;
  /** số từ người dùng đã tự ẩn khỏi hàng đợi ôn */
  suspendedCount: number;
}

export type Rating = "AGAIN" | "HARD" | "GOOD" | "EASY";

export interface ReviewResult {
  isCorrect: boolean;
  dueAt: string;
  intervalDays: number;
  state: string;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  streakFreezeCount: number;
  lastActiveLocalDate: string | null;
  activeToday: boolean;
  /** Hôm qua lỡ nghỉ nhưng còn lá chắn — học hôm nay là chuỗi được giữ (server trước 2026-10-21 chưa có). */
  savedByFreeze?: boolean;
  goal: {
    type: "WORDS" | "MINUTES";
    value: number;
    progress: number;
    met: boolean;
  };
}

export interface DayActivity {
  date: string | null;
  wordsReviewed: number;
  minutesStudied: number;
  goalMet: boolean;
}

export interface LevelBucket {
  level: number;
  band: string;
  nameVi: string;
  totalWords: number;
  learned: number;
  learning: number;
  due: number;
  atRisk: number;
  notStarted: number;
  percentComplete: number;
}

export interface ProgressOverview {
  levels: LevelBucket[];
  totals: Omit<LevelBucket, "level" | "band" | "nameVi">;
}

/** Từ người dùng tự ẩn khỏi hàng đợi ôn ("tôi biết từ này rồi"). */
export interface SuspendedWord {
  word: {
    id: string;
    simplified: string;
    pinyin: string;
    meaningVi: string | null;
    hanViet: string | null;
    hskLevel: number;
    audioUrl: string | null;
  };
  hiddenAt: string;
}

export interface LeechWord {
  word: Word;
  lapses: number;
  dueAt: string;
}

export interface Achievement {
  id: string;
  code: string;
  nameVi: string;
  descriptionVi: string;
  category: string;
  threshold: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progressCurrent: number;
  progressTarget: number;
}

export interface QuizQuestion {
  wordId: string;
  mode: "reading" | "listening";
  prompt: string;
  pinyin: string;
  audioUrl?: string | null;
  options: string[];
  answer: string;
}

export interface Quiz {
  attemptId: string;
  questions: QuizQuestion[];
}

export interface QuizAttemptSummary {
  id: string;
  completedAt: string | null;
  totalQuestions: number;
  correctCount: number;
  scorePct: number;
}

export type VideoKind =
  | "PODCAST"
  | "STORY"
  | "SONG"
  | "DIALOGUE"
  | "CLIP"
  | "OTHER";

export interface VideoCard {
  id: string;
  youtubeId: string;
  title: string;
  titleZh: string | null;
  description: string | null;
  hskLevel: number | null;
  kind: VideoKind;
  sentenceCount: number;
  thumbnailUrl: string | null;
  author: string | null;
  isFree: boolean;
  progressPct: number;
  completed: boolean;
}

export interface WordMatch {
  id: string;
  pinyin: string;
  meaningVi: string | null;
  hskLevel: number;
}

export interface LineToken {
  text: string;
  word: WordMatch | null;
}

export interface VideoLine {
  id: string;
  index: number;
  startMs: number | null;
  zh: string;
  pinyin: string;
  pinyinNum: string;
  vi: string | null;
  tokens: LineToken[];
}

export interface VideoDetail {
  id: string;
  youtubeId: string;
  title: string;
  titleZh: string | null;
  description: string | null;
  hskLevel: number | null;
  kind: VideoKind;
  sentenceCount: number;
  author: string | null;
  lines: VideoLine[];
  progress: { lastLineIndex: number; linesRead: number; completed: boolean };
}

export type NotificationType =
  | "ACHIEVEMENT_UNLOCKED"
  | "CLASS_ASSIGNMENT"
  | "LEAGUE_RESULT"
  | "STREAK_SAVED";

/** Thông báo trong app — server soạn sẵn câu chữ (`message`) và nơi mở ra (`href`); huy hiệu thì đọc `achievement`. */
export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
  achievement: { code: string; nameVi: string; descriptionVi: string } | null;
}

export interface NotificationsPage extends Paginated<AppNotification> {
  unreadCount: number;
}

export type PracticeSkill = "LISTENING" | "PRONUNCIATION";

export interface PracticeStats {
  totalAttempts: number;
  distinctWordsCount: number;
  /** null với PRONUNCIATION — chưa có chấm điểm tự động. */
  correctCount: number | null;
  accuracyPct: number | null;
}

export interface GrammarLevel {
  level: number;
  count: number;
}

export interface GrammarListItem {
  slug: string;
  hskLevel: number;
  titleVi: string;
  titleZh: string;
  summaryVi: string;
  flat?: boolean;
}

export interface GrammarExample {
  zh: string;
  pinyin: string;
  vi: string;
}

export interface GrammarDetail extends GrammarListItem {
  orderIndex: number;
  explanationVi: string;
  patterns: string[];
  examples: GrammarExample[];
}

export type LeaderboardMetricKey = "streak" | "lessons";

export interface LeaderboardMetric {
  key: LeaderboardMetricKey;
  label: string;
  unit: string;
}

export interface LeaderboardRow {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  value: number;
  currentStreak: number;
  isMe: boolean;
}

export interface Leaderboard {
  metric: LeaderboardMetricKey;
  label: string;
  unit: string;
  rows: LeaderboardRow[];
  me: { rank: number | null; value: number; totalRanked: number };
}

export interface LeagueTierInfo {
  name: string;
  color: string;
}

export interface LeagueRow {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  points: number;
  isMe: boolean;
  zone: "promote" | "demote" | "safe";
}

export interface WeeklyLeague {
  tier: LeagueTierInfo;
  tierIndex: number;
  tiers: LeagueTierInfo[];
  rows: LeagueRow[];
  endsAt: string;
  daysRemaining: number;
}

export interface DailyQuest {
  key: string;
  title: string;
  progress: number;
  target: number;
  done: boolean;
}

/** Xong cả 3 nhiệm vụ → server tự cấp 1 lá chắn giữ chuỗi (tối đa `maxFreeze`). */
export interface TodayQuests {
  quests: DailyQuest[];
  allDone: boolean;
  rewardClaimed: boolean;
  /** Lần gọi này vừa cấp lá chắn — hiện lời chúc mừng. */
  justEarnedFreeze: boolean;
  freezeCount: number;
  maxFreeze: number;
}

export interface PublicProfileAchievement {
  code: string;
  nameVi: string;
  descriptionVi: string;
  unlockedAt: string;
}

export interface PremiumPlan {
  key: string;
  name: string;
  months: number | null;
  priceVnd: number;
  originalPriceVnd?: number;
  badge?: string;
}

export interface PremiumStatus {
  active: boolean;
  lifetime: boolean;
  until: string | null;
  plans: PremiumPlan[];
}

export interface PublicProfile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isPremium: boolean;
  joinedAt: string;
  currentStreak: number;
  longestStreak: number;
  learnedWordsCount: number;
  completedLessonsCount: number;
  achievements: PublicProfileAchievement[];
  isMe: boolean;
}

export type OnboardingGoal =
  | "TRAVEL"
  | "WORK"
  | "EXAM"
  | "ACADEMIC"
  | "INTEREST"
  | "OTHER";

export interface OnboardingProfile {
  userId: string;
  hasStudiedBefore: boolean;
  selfAssessedLevel: number | null;
  goal: OnboardingGoal;
  plansToTakeExam: boolean;
  targetLevel: number | null;
  targetDate: string | null;
  recommendedLevel: number;
  recommendationVi: string;
  completedAt: string;
  /** Tuỳ chọn: server trước 2026-10-18 chưa trả. */
  plan?: OnboardingPlan;
}

/** Lộ trình tính từ câu trả lời khảo sát — xem `OnboardingPlan` ở server. */
export interface OnboardingPlan {
  /** null = đã học nhưng chưa chắc cấp nào → làm kiểm tra trình độ. */
  startLevel: number | null;
  firstLesson: { id: string; title: string } | null;
  dailyMinutes: number | null;
  exam: {
    level: number;
    lessons: number | null;
    words: number | null;
    weeksLeft: number | null;
  } | null;
}

export interface SubmitOnboardingInput {
  hasStudiedBefore: boolean;
  /** Bỏ trống khi đã học mà chưa chắc cấp nào. */
  selfAssessedLevel?: number;
  goal: OnboardingGoal;
  plansToTakeExam: boolean;
  targetLevel?: number;
  targetDate?: string;
  dailyMinutes?: number;
}

export type ChatRole = "USER" | "MODEL";

/** Trợ lý AI chỉ ĐƯA RA đường dẫn (qua tool-calling phía server), không tự
 * chuyển trang — client hiện nút bấm, người dùng tự bấm mới điều hướng. */
export interface AssistantAction {
  type: "navigate";
  path: string;
  label: string;
}

export interface AssistantMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
}

export interface AssistantSession {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleplayScenario {
  key: string;
  titleVi: string;
  persona: string;
  hskLevel: number;
}

export interface RoleplaySessionSummary {
  id: string;
  scenarioKey: string;
  titleVi: string;
  persona: string;
  updatedAt: string;
  lastMessage: string | null;
}

export interface RoleplayMessage {
  id: string;
  role: ChatRole;
  text: string;
  pinyin: string | null;
  createdAt: string;
}

export interface ReferralStats {
  totalReferred: number;
  rewardedCount: number;
  pendingCount: number;
}

/** TRANSLATE = "Dịch tốc độ" (Hán tự → nghĩa), LISTENING = "Nghe đoán từ"
 * (nghe phát âm → nghĩa), MATCH = "Ghép cặp" (lật thẻ tìm đúng cặp), PINYIN
 * = "Chọn pinyin đúng" (Hán tự → pinyin) — 4 chế độ, TRANSLATE/LISTENING/
 * PINYIN dùng chung engine trắc nghiệm ở server, MATCH có response shape
 * riêng (`cards` thay vì `questions`). */
export type GameMode = "TRANSLATE" | "LISTENING" | "MATCH" | "PINYIN";

export interface MinigameQuestion {
  wordId: string;
  prompt: string;
  pinyin: string;
  audioUrl: string | null;
  options: string[];
}

/** 1 thẻ trong minigame "Ghép cặp" — `wordId` trùng nhau giữa 2 thẻ nghĩa
 * là 1 cặp đúng, tự so khớp được ngay ở client (không cần giấu, khác
 * `correctIndex` của 2 mode trắc nghiệm). */
export interface MatchCard {
  cardId: string;
  wordId: string;
  kind: "hanzi" | "meaning";
  content: string;
}

export interface MinigameStartResponse {
  sessionId: string;
  mode: GameMode;
  /** có khi mode = TRANSLATE | LISTENING */
  questions?: MinigameQuestion[];
  /** có khi mode = MATCH */
  cards?: MatchCard[];
}

export interface MinigameResult {
  score: number;
  totalAsked: number;
}

export interface MinigameLeaderboardRow {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
  totalAsked: number;
  durationMs: number;
}

/** Link thanh toán payOS của 1 đơn Premium — xem `hanni-server/CLAUDE.md` mục Premium. */
export interface CheckoutResponse {
  checkoutUrl: string;
  qrCode: string | null;
  orderCode: number;
}

export type PaymentProvider = "payos" | "momo";

export type PaymentOrderStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED";

export interface PaymentOrder {
  orderCode: number;
  amountVnd: number;
  premiumPlanKey: string | null;
  status: PaymentOrderStatus;
  provider?: "PAYOS" | "MOMO";
}

/** Gợi ý quy luật thanh điệu Hán Việt → tiếng Trung cho 1 chữ (server tính). */
export interface ToneHint {
  char: string;
  hanViet: string;
  tone: number;
  rule: string;
  predicted: number | null;
  follows: boolean | null;
}

export interface SessionWord {
  id: string;
  simplified: string;
  pinyin: string;
  pinyinNumeric: string;
  hanViet: string | null;
  meaningVi: string | null;
  meaningEn: string | null;
  audioUrl: string | null;
  mnemonicVi?: string | null;
  examples: { zh: string; pinyin: string | null; vi: string | null }[];
  toneHints: ToneHint[] | null;
}

export type SessionStep =
  | { kind: "intro"; wordId: string }
  | {
      kind: "choice";
      wordId: string;
      prompt: "hanzi" | "meaning" | "audio";
      options: string[];
      answer: number;
    }
  | { kind: "match"; wordIds: string[] }
  | {
      kind: "sentence";
      wordId: string;
      before: string;
      after: string;
      vi: string | null;
      options: string[];
      answer: number;
    };

export interface LessonSession {
  lesson: {
    id: string;
    title: string;
    hskLevel: number;
    orderIndex: number;
    wordCount: number;
    totalLessons: number;
  };
  nextLesson: { id: string; title: string; orderIndex: number } | null;
  words: SessionWord[];
  steps: SessionStep[];
}

/** Đề kiểm tra trình độ (`GET /learn/placement`): mỗi cấp vài câu trắc nghiệm
 * từ từ vựng thật của cấp đó; client hỏi dần từ HSK1 lên. */
export interface PlacementTest {
  perLevel: number;
  passPerLevel: number;
  words: Pick<SessionWord, "id" | "simplified" | "pinyin" | "meaningVi" | "audioUrl">[];
  levels: { level: number; steps: Extract<SessionStep, { kind: "choice" }>[] }[];
}

/** Chữ Hán kèm pinyin từng chữ (`py[i]` ứng với `Array.from(zh)[i]`, dấu câu
 * là chuỗi rỗng) — server sinh sẵn. */
export interface Ruby {
  zh: string;
  py: string[];
}

export type MockSectionKind = "listening" | "reading" | "writing";
/** Số thứ tự phương án, ✓/✗, hoặc câu đã sắp xếp (dạng `order`). */
export type MockAnswer = number | boolean | string;

export interface MockExamMeta {
  slug: string;
  level: number;
  title: string;
  durationMin: number;
  questionCount: number;
  maxScore: number;
  passScore: number;
  sections: { kind: MockSectionKind; count: number }[];
  /** Chỉ có khi đã đăng nhập và từng làm đề này. */
  best?: number | null;
  attempts?: number;
}

export interface MockSpeechLine {
  s: "M" | "F" | "N";
  zh: string;
}

export interface MockItem {
  no: number;
  audio?: { lines: MockSpeechLine[]; url?: string };
  text?: Ruby;
  /** Câu ★ cần xét đúng/sai (dạng `judge-text`: HSK 2 phần đọc 3, HSK 3 phần nghe 2). */
  statement?: Ruby;
  /** Câu hỏi ★ in trên đề (HSK 3 phần đọc 3). */
  question?: Ruby;
  blank?: { before: Ruby; after: Ruby };
  /** Các mảnh cần sắp thành câu (dạng `order`), theo thứ tự in trên đề. */
  pieces?: Ruby[];
  /** Dạng `pinyin-char`: pinyin in trên chỗ trống + các chữ đồng âm để chọn. */
  pinyin?: string;
  choices?: string[];
  picture?: string;
  pictures?: string[];
  options?: Ruby[];
  /** Dạng `write-sentence` (HSK 4 viết phần 2): từ bắt buộc dùng, in dưới tranh. */
  word?: Ruby;
}

export type MockPartType =
  | "judge"
  | "choose-picture"
  | "match-picture"
  | "choose-text"
  | "match-text"
  | "fill-blank"
  | "judge-text"
  | "order"
  | "pinyin-char"
  | "write-sentence";

export interface MockPart {
  no: number;
  type: MockPartType;
  /** Nửa sau của cùng 1 phần đề nhưng có bộ tranh/đáp án riêng (HSK 2 câu
   * 16–20, 56–60) — vẫn đánh số cùng "第二部分"/"第四部分". */
  continues?: boolean;
  pictures?: string[];
  options?: Ruby[];
  items: MockItem[];
}

export interface MockPaper
  extends Omit<MockExamMeta, "sections" | "best" | "attempts"> {
  showPinyin: boolean;
  sections: { kind: MockSectionKind; parts: MockPart[] }[];
}

/** Từ trong câu kèm âm Hán Việt — chú thích khi chữa bài. */
export interface MockWord {
  id: string;
  zh: string;
  pinyin: string;
  hanViet: string | null;
  vi: string;
}

export interface MockReviewItem {
  no: number;
  answer: MockAnswer;
  /** Câu sắp xếp: các thứ tự khác cũng được chấm đúng; câu đặt theo tranh: câu mẫu khác. */
  alternatives?: string[];
  given: MockAnswer | null;
  correct: boolean;
  vi: string;
  explain?: string;
  transcript?: (Ruby & { s: MockSpeechLine["s"] })[];
  pictureLabels?: string[];
  words?: MockWord[];
}

/** `GET /mock-exams/practice` — 1 bộ "luyện từng dạng bài": cùng 1 phần đề
 * chính thức gom từ mọi đề cùng cấp. */
export interface MockPracticeSetMeta {
  slug: string;
  level: number;
  section: MockSectionKind;
  part: number;
  type: MockPartType;
  count: number;
}

/** `GET /mock-exams/practice/:slug` — các phần đề theo từng đề (không kèm đáp án). */
export interface MockPracticeSet extends MockPracticeSetMeta {
  showPinyin: boolean;
  groups: { examSlug: string; examTitle: string; part: MockPart }[];
}

/** `GET /mock-exams/analysis/me` — tỉ lệ đúng từng phần đề qua mọi lượt làm. */
export interface MockPartStat {
  level: number;
  section: MockSectionKind;
  part: number;
  type: MockPartType;
  correct: number;
  total: number;
}

export interface MockAnalysis {
  attempts: number;
  parts: MockPartStat[];
}

/** `GET /mock-exams/attempts/me` */
export interface MockAttempt {
  id: string;
  examSlug: string;
  hskLevel: number;
  score: number;
  maxScore: number;
  passed: boolean;
  durationSec: number | null;
  createdAt: string;
}

export interface MockExamResult {
  attemptId: string | null;
  score: number;
  maxScore: number;
  passScore: number;
  passed: boolean;
  sections: { kind: MockSectionKind; correct: number; total: number; score: number }[];
  review: MockReviewItem[];
}

/** Bảng phiên âm (`GET /pinyin/overview`): âm tiết có ghi âm thật (chữ đơn
 * 1 cách đọc) + quy luật Hán Việt → thanh kèm tỉ lệ đúng đo trên HSK 1–4. */
export interface SyllableSound {
  char: string;
  mark: string;
  url: string;
}

export interface PinyinOverview {
  syllables: { base: string; tones: Partial<Record<"1" | "2" | "3" | "4", SyllableSound>> }[];
  toneRules: {
    key: string;
    predicted: number | null;
    total: number;
    follows: number;
    examples: { char: string; hanViet: string; mark: string; url: string | null }[];
  }[];
}

export interface LessonCompleteResult {
  lessonId: string;
  newWords: number;
  accuracy: number;
  currentStreak: number;
  nextLesson: { id: string; title: string; orderIndex: number } | null;
}

// ---- Báo cáo học tập tuần/tháng/quý + Hanni Coach (`/insights`) ----

export type InsightsPeriod = "week" | "month" | "quarter";

export interface PeriodStats {
  daysStudied: number;
  minutes: number;
  /** Mọi lượt chấm thẻ (học mới + ôn). */
  reviews: number;
  newWords: number;
  /** % lượt ôn nhớ được — null khi chưa đủ lượt ôn. */
  retention: number | null;
  lessons: number;
  listening: { total: number; correct: number };
  speaking: number;
  mockExams: { count: number; bestPercent: number | null };
}

export interface InsightsReport {
  period: InsightsPeriod;
  offset: 0 | 1;
  startIso: string;
  endIso: string;
  periodEndIso: string;
  prevStartIso: string;
  prevEndIso: string;
  current: PeriodStats;
  previous: PeriodStats;
  series: { startIso: string; endIso: string; minutes: number; reviews: number }[];
  weakParts: {
    level: number;
    section: MockSectionKind;
    part: number;
    type: MockPartType;
    correct: number;
    total: number;
    slug: string;
  }[];
  hardWords: {
    id: string;
    simplified: string;
    pinyin: string;
    hanViet: string | null;
    meaningVi: string | null;
    forgot: number;
  }[];
  familiar: { count: number; examples: { simplified: string; hanViet: string }[] };
  streak: { current: number; longest: number };
  dueNow: number;
  leechCount: number;
  courseLevel: number | null;
  ai: { premium: boolean; enabled: boolean };
}

export interface CoachSummary {
  overview: string;
  wins: string[];
  watch: string[];
  mnemonics: { zh: string; tip: string }[];
  plan: string[];
}

export interface CoachResult {
  summary: CoachSummary | null;
  generatedAt: string | null;
}

// ---- Quét ảnh học từ (`/scan`) ----

export interface ScanWord {
  id: string;
  simplified: string;
  traditional: string | null;
  pinyin: string;
  hanViet: string | null;
  meaningVi: string | null;
  hskLevel: number;
  audioUrl: string | null;
  /** Âm Hán Việt trùng nghĩa tiếng Việt — người Việt gần như biết sẵn. */
  familiar: boolean;
  /** Đã có trong danh sách ôn tập. */
  saved: boolean;
}

export interface ScanLine {
  zh: string;
  vi: string;
  tokens: { text: string; wordId: string | null; pinyin: string | null }[];
}

export interface ScanUsage {
  used: number;
  limit: number;
  premium: boolean;
  enabled?: boolean;
}

export interface ScanResult {
  kind: string;
  /** Các dòng chữ Hán đọc được (kèm câu dịch). */
  lines: ScanLine[];
  /** Món ăn, đồ vật — chỉ khi ảnh chủ yếu chụp đồ vật; `vi` là tên tiếng Việt. */
  objects: ScanLine[];
  words: ScanWord[];
  usage: ScanUsage;
}
