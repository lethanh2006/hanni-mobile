import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { TonePinyin } from '@/components/tone-pinyin';
import { AppText, Hanzi, Icon, type IconName } from '@/components/ui';
import { alpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LineToken, VideoLine } from '@/lib/types';

/**
 * Danh sách tự cuộn nằm trong trang cũng cuộn: bỏ ngữ cảnh ScrollView ngoài (như Modal của RN vẫn làm) để danh sách ảo
 * không cảnh báo lồng nhau. Bản web của RN không có `ScrollView.Context` thì để nguyên.
 */
function ResetScrollContext({ children }: { children: ReactNode }) {
  const Context = (ScrollView as Partial<Pick<typeof ScrollView, 'Context'>>).Context;
  return Context ? <Context.Provider value={null}>{children}</Context.Provider> : children;
}

/** 1 câu trong bản chép (`TranscriptLine` dạng `compact` của web): "#n", chữ Hán (pinyin tô màu nếu bật), bản dịch. */
function TranscriptLine({
  line,
  active,
  showPinyin,
  showTrans,
  onSelect,
  onWordClick,
}: {
  line: VideoLine;
  active: boolean;
  showPinyin: boolean;
  showTrans: boolean;
  onSelect: () => void;
  onWordClick?: (token: LineToken) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onSelect}
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [
        styles.line,
        active
          ? { borderColor: alpha(theme.primary, 0.25), backgroundColor: alpha(theme.primary, 0.06) }
          : pressed && { backgroundColor: theme.surface2 },
      ]}>
      <AppText variant="caption" weight="600" color={active ? 'primary' : 'muted'} style={styles.no}>
        #{line.index}
      </AppText>
      <View style={styles.flex}>
        {showPinyin ? (
          <TonePinyin
            zh={line.zh}
            pinyin={line.pinyin}
            pinyinNum={line.pinyinNum}
            tokens={line.tokens}
            onWordClick={onWordClick}
            align="start"
          />
        ) : (
          <Hanzi size={24} style={styles.zh}>
            {line.tokens?.length
              ? line.tokens.map((token, i) =>
                  token.word && onWordClick ? (
                    <Hanzi
                      key={i}
                      size={24}
                      onPress={() => onWordClick(token)}
                      style={{
                        textDecorationLine: 'underline',
                        textDecorationStyle: 'dotted',
                        textDecorationColor: alpha(theme.primary, 0.4),
                      }}>
                      {token.text}
                    </Hanzi>
                  ) : (
                    token.text
                  ),
                )
              : line.zh}
          </Hanzi>
        )}
        {showTrans && line.vi && (
          <AppText color="muted" style={styles.vi}>
            {line.vi}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

function BarButton({
  label,
  icon,
  iconFirst,
  primary,
  disabled,
  onPress,
}: {
  label: string;
  icon: IconName;
  iconFirst: boolean;
  primary?: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const color = primary ? 'primaryText' : 'text';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.barButton, { backgroundColor: primary ? theme.primary : theme.surface2 }, primary && styles.wide, disabled && styles.off]}>
      {iconFirst && <Icon name={icon} size={primary ? 15 : 14} color={color} />}
      <AppText variant="caption" weight={primary ? '600' : '500'} color={color}>
        {label}
      </AppText>
      {!iconFirst && <Icon name={icon} size={14} color={color} />}
    </Pressable>
  );
}

/**
 * Bản chép trên điện thoại (`MobileVideoTranscript` của web): đầu khung (số câu, % đã học, 3 nút Pinyin / Bản dịch /
 * Phụ đề video), danh sách câu tự cuộn theo câu đang phát (kéo tay thì thôi theo, hiện "Về câu đang phát"), thanh dưới
 * Câu trước / Nghe lại câu / Câu sau. Danh sách ảo hoá vì video có tới ~1.500 câu.
 */
export function MobileTranscript({
  lines,
  active,
  progress,
  resumeAt,
  height,
  showPinyin,
  showTrans,
  showCaption,
  onTogglePinyin,
  onToggleTrans,
  onToggleCaption,
  onSelect,
  onWordClick,
}: {
  lines: VideoLine[];
  active: number | null;
  progress: number;
  resumeAt: number;
  /** Cao theo vị trí cuộn của trang (giãn dần tới khi video dính trên cùng). */
  height: number | Animated.AnimatedInterpolation<number>;
  showPinyin: boolean;
  showTrans: boolean;
  showCaption: boolean;
  onTogglePinyin: () => void;
  onToggleTrans: () => void;
  onToggleCaption: () => void;
  onSelect: (index: number) => void;
  onWordClick?: (token: LineToken) => void;
}) {
  const theme = useTheme();
  const list = useRef<FlatList<VideoLine>>(null);
  const [following, setFollowing] = useState(true);
  const position = Math.max(
    0,
    lines.findIndex((line) => line.index === active),
  );
  const current = lines[position];

  function scrollToCurrent() {
    if (!current) return;
    if (active === null) list.current?.scrollToOffset({ offset: 0, animated: false });
    else list.current?.scrollToIndex({ index: position, viewOffset: 8, animated: false });
  }

  useEffect(() => {
    if (!following) return;
    // Đợi danh sách đo lại (dòng "Tiếp tục từ câu…" vừa ẩn, đổi pinyin/bản dịch) rồi mới cuộn.
    const frame = requestAnimationFrame(scrollToCurrent);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cuộn lại khi đổi câu / đổi cách hiện
  }, [following, active, showPinyin, showTrans]);

  function select(index: number) {
    setFollowing(true);
    onSelect(index);
    // Nghe lại đúng câu đang phát thì `active` không đổi — tự cuộn lại.
    if (index === current?.index) scrollToCurrent();
  }

  const toggles = [
    { label: 'Pinyin', on: showPinyin, toggle: onTogglePinyin },
    { label: 'Bản dịch', on: showTrans, toggle: onToggleTrans },
    { label: 'Phụ đề video', on: showCaption, toggle: onToggleCaption },
  ];

  return (
    <Animated.View
      accessibilityLabel="Bản chép video"
      style={[styles.box, { height, borderColor: theme.border, backgroundColor: theme.surface }]}>
      <View style={[styles.head, { borderColor: theme.border }]}>
        <View style={styles.headRow}>
          <AppText variant="caption" weight="700">
            Bản chép{' '}
            <AppText variant="caption" color="muted">
              · {lines.length} câu
            </AppText>
          </AppText>
          <AppText variant="caption" color="muted">
            Đã học {progress}%
          </AppText>
        </View>
        <View style={styles.toggles}>
          {toggles.map(({ label, on, toggle }) => (
            <Pressable
              key={label}
              onPress={toggle}
              accessibilityState={{ selected: on }}
              style={[styles.toggle, { backgroundColor: on ? alpha(theme.primary, 0.1) : theme.surface2 }]}>
              <AppText variant="caption" weight="500" color={on ? 'primary' : 'muted'}>
                {label}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.flex}>
        {/* Nằm ngoài danh sách: ẩn đi không làm xô lệch vị trí các câu đã đo. */}
        {active === null && resumeAt > 1 && lines.some((line) => line.index === resumeAt) && (
          <Pressable onPress={() => select(resumeAt)} style={[styles.resume, { backgroundColor: alpha(theme.primary, 0.1) }]}>
            <AppText weight="600" color="primary">
              Tiếp tục từ câu {resumeAt}
            </AppText>
          </Pressable>
        )}
        <ResetScrollContext>
          <FlatList
            ref={list}
            data={lines}
            keyExtractor={(line) => line.id}
            nestedScrollEnabled
            initialNumToRender={10}
            windowSize={7}
            contentContainerStyle={styles.listContent}
            onScrollBeginDrag={() => setFollowing(false)}
            onScrollToIndexFailed={(info) => {
              list.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false });
              setTimeout(() => list.current?.scrollToIndex({ index: info.index, viewOffset: 8, animated: false }), 60);
            }}
            ListEmptyComponent={
              <AppText color="muted" center style={styles.empty}>
                Video này chưa có bản chép.
              </AppText>
            }
            ListFooterComponent={<View style={styles.footer} />}
            renderItem={({ item }) => (
              <TranscriptLine
                line={item}
                active={active === item.index}
                showPinyin={showPinyin}
                showTrans={showTrans}
                onSelect={() => select(item.index)}
                onWordClick={onWordClick}
              />
            )}
          />
        </ResetScrollContext>
        {!following && current && (
          <Pressable
            onPress={() => {
              setFollowing(true);
              scrollToCurrent();
            }}
            style={[
              styles.follow,
              { borderColor: alpha(theme.primary, 0.2), backgroundColor: theme.surface, boxShadow: `0 10px 15px -3px ${alpha('#000000', 0.12)}` },
            ]}>
            <Icon name="target" size={15} color="primary" />
            <AppText variant="caption" weight="600" color="primary">
              Về câu đang phát
            </AppText>
          </Pressable>
        )}
      </View>

      <View style={[styles.bar, { borderColor: theme.border, backgroundColor: theme.surface }]}>
        <BarButton
          label="Câu trước"
          icon="chevronLeft"
          iconFirst
          disabled={!current || position === 0}
          onPress={() => select(lines[position - 1].index)}
        />
        <BarButton label="Nghe lại câu" icon="refresh" iconFirst primary disabled={!current} onPress={() => current && select(current.index)} />
        <BarButton
          label="Câu sau"
          icon="chevron"
          iconFirst={false}
          disabled={!current || position === lines.length - 1}
          onPress={() => select(lines[position + 1].index)}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  line: { flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: 'transparent', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 },
  no: { marginTop: 4 },
  zh: { lineHeight: 39 },
  vi: { marginTop: 6, lineHeight: 24 },
  box: { minHeight: 300, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16, overflow: 'hidden' },
  head: { borderBottomWidth: 1, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
  headRow: { marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  toggles: { flexDirection: 'row', gap: 8 },
  toggle: { flex: 1, minHeight: 44, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 8 },
  resume: { minHeight: 44, marginHorizontal: 8, marginTop: 8, borderRadius: 8, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  empty: { paddingHorizontal: 12, paddingVertical: 24 },
  footer: { height: 40 },
  follow: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 16,
  },
  bar: { flexDirection: 'row', gap: 8, borderTopWidth: 1, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8 },
  barButton: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: 8 },
  wide: { flex: 1.3, gap: 8 },
  off: { opacity: 0.35 },
});
