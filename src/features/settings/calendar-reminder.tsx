import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card, Icon, IconTile, Select, type IconName } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { WEB_ORIGIN } from '@/lib/api';

import { saveIcs } from './save-ics';

const pad = (n: number) => String(n).padStart(2, '0');
/** Giờ "trôi" (không múi giờ, không Z): lịch hiểu là giờ địa phương của máy — đúng ý "8 giờ tối mỗi ngày". */
const floating = (d: Date) =>
  `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

function nextStart(hour: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

const escapeIcs = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

function CalendarButton({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          borderColor: theme.border,
          backgroundColor: pressed ? theme.surface2 : theme.surface,
          boxShadow: `0 ${pressed ? 1 : 3}px 0 ${theme.border}`,
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
      ]}>
      <Icon name={icon} size={16} />
      <AppText weight="600">{label}</AppText>
    </Pressable>
  );
}

/**
 * Lịch học hằng ngày trên Google Calendar / lịch iPhone, Outlook (.ics) — `CalendarReminder` của web: một lời nhắc lặp
 * lại mỗi ngày, thời lượng = mục tiêu phút/ngày, nhắc kể cả khi chưa bật thông báo của Hanni.
 */
export function CalendarReminder({ defaultHour, minutes }: { defaultHour: number | null; minutes: number }) {
  const [hour, setHour] = useState(defaultHour ?? 20);
  const title = `Học tiếng Trung với Hanni (${minutes} phút)`;
  const details = `Mở Hanni và bấm Học tiếp: ${WEB_ORIGIN}/learn`;

  function google() {
    const start = nextStart(hour);
    const end = new Date(start.getTime() + minutes * 60_000);
    const qs = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      details,
      dates: `${floating(start)}/${floating(end)}`,
      recur: 'RRULE:FREQ=DAILY',
    });
    void Linking.openURL(`https://calendar.google.com/calendar/render?${qs.toString()}`);
  }

  function ics() {
    const start = nextStart(hour);
    const end = new Date(start.getTime() + minutes * 60_000);
    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
    const body = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Hanni//Lich hoc hang ngay//VI',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:hanni-daily-${now.getTime()}@hanni`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${floating(start)}`,
      `DTEND:${floating(end)}`,
      'RRULE:FREQ=DAILY',
      `SUMMARY:${escapeIcs(title)}`,
      `DESCRIPTION:${escapeIcs(details)}`,
      `URL:${WEB_ORIGIN}/learn`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeIcs('Đến giờ học tiếng Trung rồi!')}`,
      'TRIGGER:-PT0M',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
    void saveIcs(body, 'hanni-lich-hoc.ics').catch(() => undefined);
  }

  return (
    <Card>
      <View style={styles.head}>
        <IconTile icon="calendar" iconSize={20} />
        <View style={styles.flex}>
          <AppText variant="heading" weight="600">
            Thêm lịch học vào lịch của bạn
          </AppText>
          <AppText color="muted" style={styles.desc}>
            Một lời nhắc lặp lại mỗi ngày trong Google Calendar, lịch iPhone hay Outlook — vẫn nhắc kể cả khi chưa bật thông báo
            của Hanni.
          </AppText>
        </View>
      </View>
      <View style={styles.body}>
        <View>
          <AppText variant="caption" weight="500" color="muted" style={styles.label}>
            Giờ học mỗi ngày
          </AppText>
          <Select
            value={hour}
            title="Giờ học mỗi ngày"
            options={Array.from({ length: 18 }, (_, i) => i + 6).map((h) => ({ value: h, label: `${pad(h)}:00` }))}
            onChange={setHour}
          />
        </View>
        <View style={styles.buttons}>
          <CalendarButton icon="calendar" label="Google Calendar" onPress={google} />
          <CalendarButton icon="download" label="Lịch iPhone / Outlook (.ics)" onPress={ics} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  flex: { flex: 1, minWidth: 0 },
  desc: { marginTop: 4, lineHeight: 24 },
  body: { marginTop: 16, gap: 12 },
  label: { marginBottom: 4 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
});
