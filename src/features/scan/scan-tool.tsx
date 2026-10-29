import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import {
  AppText,
  AudioButton,
  Button,
  Card,
  ErrorNote,
  Hanzi,
  Icon,
  IconTile,
  Mascot,
  Skeleton,
} from '@/components/ui';
import { alpha, Radius, tintPanel } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { askAssistant } from '@/lib/assistant';
import { useAuth } from '@/lib/auth';
import { addWordToSrs } from '@/lib/hooks';
import { hskLabel } from '@/lib/hsk';
import {
  assistantText,
  prepareImage,
  scanImage,
  splitPlain,
  useScanUsage,
} from '@/lib/scan';
import type { ScanLine, ScanResult, ScanWord } from '@/lib/types';

type Phase =
  | { kind: 'idle' }
  | { kind: 'scanning' }
  | { kind: 'done'; result: ScanResult }
  | { kind: 'error'; message: string; quota: boolean };

/**
 * Quét ảnh học từ: chụp/chọn ảnh → server (Gemini) đọc chữ Hán từng dòng
 * hoặc gọi tên đồ vật, món ăn → mỗi từ bấm được để xem Hán Việt, nghĩa từ
 * điển Hanni, audio và lưu vào ôn tập.
 */
export function ScanTool() {
  const theme = useTheme();
  const { user, loading } = useAuth();
  const usage = useScanUsage(!!user);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [preview, setPreview] = useState<string | null>(null);
  const [pinyin, setPinyin] = useState(true);
  const [selected, setSelected] = useState<{ item: string; wordId: string } | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const busy = phase.kind === 'scanning';

  async function processAsset(asset: ImagePicker.ImagePickerAsset) {
    setPreview(asset.uri);
    setSelected(null);
    setPhase({ kind: 'scanning' });
    try {
      const preparedUri = await prepareImage(asset.uri, asset.width, asset.height);
      const result = await scanImage(preparedUri);
      setSaved(new Set(result.words.filter((w) => w.saved).map((w) => w.id)));
      setPhase({ kind: 'done', result });
      void usage.mutate(result.usage, { revalidate: false });
    } catch (err) {
      const quota = err instanceof ApiError && err.status === 403;
      setPhase({
        kind: 'error',
        quota,
        message:
          err instanceof ApiError
            ? err.message
            : 'Chưa gửi được ảnh — kiểm tra kết nối rồi thử lại.',
      });
      if (quota) void usage.mutate();
    }
  }

  async function takePhoto() {
    if (busy) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPhase({
        kind: 'error',
        quota: false,
        message: 'Cần cấp quyền máy ảnh để chụp và quét chữ Hán.',
      });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      void processAsset(result.assets[0]);
    }
  }

  async function pickImage() {
    if (busy) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhase({
        kind: 'error',
        quota: false,
        message: 'Cần cấp quyền thư viện ảnh để chọn ảnh quét.',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      void processAsset(result.assets[0]);
    }
  }

  async function save(ids: string[]) {
    const todo = ids.filter((id) => !saved.has(id) && !saving.has(id));
    if (!todo.length) return;
    setSaving((s) => new Set([...s, ...todo]));
    for (const id of todo) {
      try {
        await addWordToSrs(id);
        setSaved((s) => new Set(s).add(id));
      } catch {
        // Lỗi 1 từ không chặn các từ còn lại
      }
    }
    setSaving((s) => new Set([...s].filter((id) => !todo.includes(id))));
  }

  if (loading) {
    return <Skeleton height={160} radius={Radius.lg} />;
  }

  if (!user) {
    return (
      <Card style={[styles.guestCard, tintPanel(theme)]}>
        <IconTile icon="camera" style={styles.centerTile} />
        <AppText variant="title" weight="700" center style={styles.guestTitle}>
          Tạo tài khoản miễn phí để bắt đầu quét
        </AppText>
        <AppText color="muted" center style={styles.guestDesc}>
          Mỗi ngày 3 ảnh miễn phí — đủ cho một thực đơn, một biển hiệu. Từ quét được lưu thẳng vào danh sách ôn tập.
        </AppText>
        <View style={styles.guestActions}>
          <Button
            title="Tạo tài khoản miễn phí"
            onPress={() => router.push('/register')}
          />
          <Button
            title="Đăng nhập"
            variant="secondary"
            onPress={() => router.push('/login')}
          />
        </View>
      </Card>
    );
  }

  const u = usage.data;
  const result = phase.kind === 'done' ? phase.result : null;
  const byId = new Map(result?.words.map((w) => [w.id, w]));
  const unsaved = result?.words.filter((w) => !saved.has(w.id)).map((w) => w.id) ?? [];

  const renderItem = (line: ScanLine, item: string, big: boolean) => {
    const open = selected?.item === item ? selected.wordId : null;
    const word = open ? byId.get(open) : undefined;
    return (
      <View
        key={item}
        style={[
          styles.itemBox,
          { borderColor: theme.border, backgroundColor: theme.surface },
        ]}>
        {big && (
          <AppText weight="600" style={styles.objectVi}>
            {line.vi}
          </AppText>
        )}
        <Tokens
          line={line}
          pinyin={pinyin}
          big={big}
          selected={open}
          onSelect={(wordId) =>
            setSelected(open === wordId ? null : { item, wordId })
          }
        />
        {!big && !!line.vi && (
          <AppText color="muted" style={styles.lineVi}>
            {line.vi}
          </AppText>
        )}
        {word && (
          <WordPanel
            word={word}
            saved={saved.has(word.id)}
            saving={saving.has(word.id)}
            onSave={() => void save([word.id])}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Khối chụp / chọn ảnh */}
      <Card style={styles.actionCard}>
        <View style={styles.buttonRow}>
          <Button
            title="Chụp ảnh"
            leftIcon="camera"
            disabled={busy}
            onPress={takePhoto}
          />
          <Button
            title="Chọn ảnh có sẵn"
            leftIcon="plus"
            variant="secondary"
            disabled={busy}
            onPress={pickImage}
          />
        </View>

        {u && (
          <AppText variant="caption" color="muted" style={styles.usageText}>
            {u.premium ? 'Premium · ' : ''}Hôm nay còn{' '}
            <AppText variant="caption" weight="700">
              {Math.max(0, u.limit - u.used)}
            </AppText>
            /{u.limit} lượt
          </AppText>
        )}

        <AppText variant="caption" color="muted" style={styles.noteText}>
          Ảnh chỉ dùng để đọc rồi bỏ, Hanni không lưu lại.
          {u && !u.premium && (
            <AppText
              variant="caption"
              weight="600"
              color="primary"
              onPress={() => router.push('/premium')}>
              {' '}Premium quét 100 ảnh/ngày
            </AppText>
          )}
        </AppText>
      </Card>

      {/* Thông báo lỗi */}
      {phase.kind === 'error' && (
        <ErrorNote>
          {phase.message}
          {phase.quota && !u?.premium && (
            <AppText
              variant="caption"
              weight="600"
              color="primary"
              onPress={() => router.push('/premium')}>
              {' '}Xem Premium
            </AppText>
          )}
        </ErrorNote>
      )}

      {/* Khung hiển thị ảnh và kết quả quét */}
      {(busy || result) && preview && (
        <View style={styles.scanLayout}>
          {/* Xem ảnh */}
          <View
            style={[
              styles.imageContainer,
              { borderColor: theme.border, backgroundColor: theme.surface2 },
            ]}>
            <Image
              source={{ uri: preview }}
              style={styles.previewImage}
              resizeMode="contain"
            />
            {busy && <ScanSweep />}
          </View>

          {/* Trạng thái đang quét */}
          {busy ? (
            <Card style={styles.statusCard}>
              <View style={styles.statusHead}>
                <Mascot emote="e19-tim-kiem" size={52} pop style={styles.scanFox} />
                <AppText weight="600" style={styles.flexText}>
                  Hanni đang soi ảnh… (khoảng 5–10 giây)
                </AppText>
              </View>
              <Skeleton height={12} width="88%" />
              <Skeleton height={12} width="72%" />
              <Skeleton height={12} width="80%" />
              <Skeleton height={12} width="64%" />
            </Card>
          ) : (
            result && (
              <View style={styles.resultContainer}>
                {!result.lines.length && !result.objects.length ? (
                  <Card style={styles.emptyCard}>
                    <AppText color="muted">
                      Không thấy chữ Hán hay đồ vật nào rõ để học trong ảnh này — lượt này không bị tính. Thử chụp gần và thẳng hơn nhé.
                    </AppText>
                  </Card>
                ) : (
                  <Card style={styles.itemsCard}>
                    {/* Thanh thông tin trên cùng */}
                    <View style={styles.resultHeader}>
                      <View
                        style={[
                          styles.kindBadge,
                          { backgroundColor: alpha(theme.primary, 0.1) },
                        ]}>
                        <AppText variant="caption" weight="700" color="primary">
                          {result.kind.charAt(0).toUpperCase() + result.kind.slice(1)}
                        </AppText>
                      </View>
                      <AppText variant="caption" color="muted" style={styles.countText}>
                        {[
                          result.objects.length && `${result.objects.length} thứ trong ảnh`,
                          result.lines.length && `${result.lines.length} dòng chữ`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}{' '}
                        · bấm vào từ để xem nghĩa
                      </AppText>
                      <Pressable
                        onPress={() => setPinyin(!pinyin)}
                        accessibilityRole="button"
                        accessibilityLabel="Bật tắt pinyin"
                        style={[
                          styles.pinyinToggle,
                          pinyin
                            ? {
                                borderColor: alpha(theme.primary, 0.4),
                                backgroundColor: alpha(theme.primary, 0.1),
                              }
                            : {
                                borderColor: theme.border,
                                backgroundColor: theme.surface,
                              },
                        ]}>
                        <AppText
                          variant="caption"
                          weight="600"
                          color={pinyin ? 'primary' : 'muted'}>
                          Pinyin
                        </AppText>
                      </Pressable>
                    </View>

                    {/* Món ăn, đồ vật trong ảnh */}
                    {result.objects.length > 0 && (
                      <View style={styles.sectionBlock}>
                        <AppText weight="600" style={styles.sectionTitle}>
                          Trong ảnh có
                        </AppText>
                        <View style={styles.itemsList}>
                          {result.objects.map((line, i) =>
                            renderItem(line, `o${i}`, true),
                          )}
                        </View>
                      </View>
                    )}

                    {/* Dòng chữ Hán đọc được */}
                    {result.lines.length > 0 && (
                      <View style={styles.sectionBlock}>
                        <AppText weight="600" style={styles.sectionTitle}>
                          Chữ trong ảnh
                        </AppText>
                        <View style={styles.itemsList}>
                          {result.lines.map((line, i) =>
                            renderItem(line, `l${i}`, false),
                          )}
                        </View>
                      </View>
                    )}
                  </Card>
                )}

                {/* Danh sách từ vựng trong ảnh */}
                {result.words.length > 0 && (
                  <Card style={styles.wordsCard}>
                    <View style={styles.wordsHead}>
                      <AppText weight="600" style={styles.wordsTitle}>
                        Từ vựng trong ảnh ({result.words.length})
                      </AppText>
                      {unsaved.length > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon="cards"
                          disabled={saving.size > 0}
                          title={
                            saving.size > 0
                              ? 'Đang lưu…'
                              : `Lưu ${unsaved.length} từ vào ôn tập`
                          }
                          onPress={() => void save(unsaved)}
                        />
                      )}
                    </View>
                    <View style={styles.wordsList}>
                      {result.words.map((w) => (
                        <WordRow
                          key={w.id}
                          word={w}
                          saved={saved.has(w.id)}
                          saving={saving.has(w.id)}
                          onSave={() => void save([w.id])}
                        />
                      ))}
                    </View>
                  </Card>
                )}

                {/* Các nút hành động phía dưới */}
                <View style={styles.bottomActions}>
                  {(result.lines.length > 0 || result.objects.length > 0) && (
                    <Button
                      variant="secondary"
                      leftIcon="spark"
                      title="Hỏi trợ lý Hanni về ảnh này"
                      onPress={() => askAssistant(assistantText(result))}
                    />
                  )}
                  <Button
                    variant="ghost"
                    leftIcon="camera"
                    title="Quét ảnh khác"
                    onPress={takePhoto}
                  />
                </View>
              </View>
            )
          )}
        </View>
      )}
    </View>
  );
}

/** Vạch quét chuyển động nhẹ trên ảnh khi đang đọc */
function ScanSweep() {
  const theme = useTheme();
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  return (
    <Animated.View
      style={[
        styles.scanSweep,
        {
          backgroundColor: alpha(theme.primary, 0.2),
          borderBottomColor: theme.primary,
          transform: [{ translateY }],
        },
      ]}
    />
  );
}

/** Tách và vẽ các chữ kèm pinyin, từ trong từ điển bấm được */
function Tokens({
  line,
  pinyin,
  big,
  selected,
  onSelect,
}: {
  line: ScanLine;
  pinyin: boolean;
  big: boolean;
  selected: string | null;
  onSelect: (wordId: string) => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.tokensRow}>
      {line.tokens.map((t, i) => {
        if (!t.wordId) {
          return splitPlain(t.text, t.pinyin).map((part, j) => (
            <View key={`p-${i}-${j}`} style={styles.tokenCell}>
              {pinyin && part.pinyin ? (
                <AppText variant="caption" color="muted" style={styles.pinyinRuby}>
                  {part.pinyin}
                </AppText>
              ) : null}
              <Hanzi size={big ? 24 : 20} style={styles.hanziGlyph}>
                {part.text}
              </Hanzi>
            </View>
          ));
        }

        const wordId = t.wordId;
        const isSelected = selected === wordId;

        return (
          <Pressable
            key={`w-${i}`}
            onPress={() => onSelect(wordId)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={({ pressed }) => [
              styles.wordToken,
              isSelected
                ? {
                    backgroundColor: alpha(theme.primary, 0.15),
                    borderColor: alpha(theme.primary, 0.4),
                  }
                : {
                    borderBottomColor: alpha(theme.primary, 0.4),
                    borderBottomWidth: 1.5,
                  },
              pressed && { opacity: 0.75 },
            ]}>
            {pinyin && t.pinyin ? (
              <AppText
                variant="caption"
                color={isSelected ? 'primary' : 'muted'}
                style={styles.pinyinRuby}>
                {t.pinyin}
              </AppText>
            ) : null}
            <Hanzi
              size={big ? 24 : 20}
              color={isSelected ? 'primary' : 'text'}
              style={styles.hanziGlyph}>
              {t.text}
            </Hanzi>
          </Pressable>
        );
      })}
    </View>
  );
}

function SaveButton({
  saved,
  saving,
  onSave,
}: {
  saved: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  const theme = useTheme();
  if (saved) {
    return (
      <View style={styles.savedRow}>
        <Icon name="check" size={14} color="good" />
        <AppText variant="caption" weight="600" color="good">
          Đã lưu
        </AppText>
      </View>
    );
  }
  return (
    <Pressable
      onPress={onSave}
      disabled={saving}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.saveButton,
        { backgroundColor: alpha(theme.primary, 0.1) },
        pressed && { backgroundColor: alpha(theme.primary, 0.2) },
        saving && { opacity: 0.5 },
      ]}>
      <Icon name="plus" size={14} color="primary" />
      <AppText variant="caption" weight="600" color="primary">
        {saving ? 'Đang lưu…' : 'Lưu ôn tập'}
      </AppText>
    </Pressable>
  );
}

/** Thẻ chi tiết khi bấm vào một từ */
function WordPanel({
  word,
  saved,
  saving,
  onSave,
}: {
  word: ScanWord;
  saved: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.wordPanel,
        { backgroundColor: alpha(theme.surface2, 0.7) },
      ]}>
      <View style={styles.panelHead}>
        <Hanzi size={24}>{word.simplified}</Hanzi>
        {word.traditional && word.traditional !== word.simplified && (
          <Hanzi size={18} color="muted">
            {word.traditional}
          </Hanzi>
        )}
        <AppText color="muted" style={styles.panelPinyin}>
          {word.pinyin}
        </AppText>
        <AudioButton src={word.audioUrl} size={16} />
        <View style={[styles.badge, { backgroundColor: theme.surface }]}>
          <AppText variant="caption" weight="600" color="muted">
            {hskLabel(word.hskLevel)}
          </AppText>
        </View>
      </View>

      {word.hanViet && (
        <View style={styles.hanvietRow}>
          <AppText style={styles.hanvietText}>
            Hán Việt:{' '}
            <AppText weight="700" color="primary">
              {word.hanViet}
            </AppText>
          </AppText>
          {word.familiar && (
            <View
              style={[
                styles.badge,
                { backgroundColor: alpha(theme.good, 0.12) },
              ]}>
              <AppText variant="caption" weight="600" color="good">
                Trùng nghĩa tiếng Việt
              </AppText>
            </View>
          )}
        </View>
      )}

      {word.meaningVi && (
        <AppText color="muted" style={styles.meaningText}>
          {word.meaningVi}
        </AppText>
      )}

      <View style={styles.panelBottom}>
        <SaveButton saved={saved} saving={saving} onSave={onSave} />
        <Pressable
          onPress={() =>
            router.push(`/tu-dien/${encodeURIComponent(word.simplified)}`)
          }
          style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <AppText variant="caption" weight="600" color="primary">
            Xem trong từ điển
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

/** 1 dòng trong danh sách từ vựng */
function WordRow({
  word,
  saved,
  saving,
  onSave,
}: {
  word: ScanWord;
  saved: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.wordRow, { borderBottomColor: theme.border }]}>
      <AudioButton src={word.audioUrl} size={16} />
      <Pressable
        onPress={() =>
          router.push(`/tu-dien/${encodeURIComponent(word.simplified)}`)
        }
        style={styles.wordRowInfo}>
        <View style={styles.wordRowHeader}>
          <Hanzi size={18}>{word.simplified}</Hanzi>
          <AppText variant="caption" color="muted">
            {word.pinyin}
          </AppText>
          {word.hanViet && (
            <AppText variant="caption" weight="600" color="primary">
              {word.hanViet}
            </AppText>
          )}
          {word.familiar && (
            <AppText variant="caption" weight="600" color="good">
              · quen nhờ Hán Việt
            </AppText>
          )}
        </View>
        <AppText variant="caption" color="muted" numberOfLines={1}>
          {hskLabel(word.hskLevel)} · {word.meaningVi}
        </AppText>
      </Pressable>
      <SaveButton saved={saved} saving={saving} onSave={onSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 20 },
  actionCard: { gap: 12 },
  buttonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  usageText: { marginTop: 4 },
  noteText: { lineHeight: 18 },

  guestCard: { alignItems: 'center', padding: 24, gap: 12 },
  centerTile: { alignSelf: 'center' },
  guestTitle: { marginTop: 4 },
  guestDesc: { maxWidth: 320, lineHeight: 22 },
  guestActions: { width: '100%', gap: 10, marginTop: 8 },

  scanLayout: { gap: 20 },
  imageContainer: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  scanSweep: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 60,
    borderBottomWidth: 2,
  },

  statusCard: { gap: 12 },
  statusHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scanFox: { marginVertical: -8 },
  flexText: { flex: 1 },

  resultContainer: { gap: 20 },
  emptyCard: { padding: 16 },
  itemsCard: { gap: 16 },

  resultHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  kindBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: { flex: 1 },
  pinyinToggle: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  sectionBlock: { gap: 8 },
  sectionTitle: { fontSize: 14 },
  itemsList: { gap: 12 },
  itemBox: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  objectVi: { fontSize: 14 },
  lineVi: { fontSize: 13, lineHeight: 18, marginTop: 2 },

  tokensRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 2,
  },
  tokenCell: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 1,
  },
  wordToken: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: Radius.sm,
  },
  pinyinRuby: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    marginBottom: 1,
  },
  hanziGlyph: {
    includeFontPadding: false,
  },

  wordPanel: {
    marginTop: 8,
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
  },
  panelHead: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  panelPinyin: { fontSize: 13 },
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  hanvietRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  hanvietText: { fontSize: 13 },
  meaningText: { fontSize: 13, lineHeight: 19 },
  panelBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },

  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },

  wordsCard: { gap: 12 },
  wordsHead: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  wordsTitle: { fontSize: 15 },
  wordsList: { gap: 0 },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  wordRowInfo: { flex: 1, gap: 2 },
  wordRowHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: 6,
  },

  bottomActions: { gap: 10 },
});
