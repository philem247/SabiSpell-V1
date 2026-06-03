import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../src/store/profileStore';
import {
  DEMO_LEADERBOARD_SSS2,
  DEMO_LEADERBOARD_WAZOBIA,
  DEMO_LEADERBOARD_ALL,
  insertLiveUser,
  LeaderboardEntry,
} from '../src/constants/DemoSeeds';
import AjalaAvatar from '../src/components/AjalaAvatar';
import { Themes, GlobalColors, FontSizes, FontFamily, Radii, Shadows, Spacing } from '../src/constants/Colors';

type TabKey = 'sss2' | 'all' | 'wazobia';

export default function LeaderboardScreen() {
  const router = useRouter();
  const theme = Themes.sss; // SSS Lagoon Blue theme

  // Tabs state
  const [activeTab, setActiveTab] = useState<TabKey>('sss2');

  // Load live user stats
  const { username, xp, current_title, daily_streak } = useProfileStore();

  // Prepare active leaderboard data
  const getLeaderboardData = (): LeaderboardEntry[] => {
    const defaultUser = {
      username: username || 'Scholar',
      title: current_title || 'Scholar',
      xp: xp || 0,
    };

    switch (activeTab) {
      case 'sss2':
        return insertLiveUser(DEMO_LEADERBOARD_SSS2, defaultUser);
      case 'all':
        return insertLiveUser(DEMO_LEADERBOARD_ALL, defaultUser);
      case 'wazobia':
        // Scale the user's XP slightly so they fit cleanly in the Wazobia-specific range (2310-4200)
        const wazobiaUser = {
          username: username || 'Scholar',
          title: 'Ọmọ Ẹdẹ',
          xp: Math.max(1500, Math.floor((xp || 0) * 0.45)),
        };
        return insertLiveUser(DEMO_LEADERBOARD_WAZOBIA, wazobiaUser);
    }
  };

  const currentBoard = getLeaderboardData();
  const liveUserRow = currentBoard.find((e) => e.isLiveUser);
  const liveUserRank = liveUserRow ? liveUserRow.rank : 6;

  // Determine Ajala's message
  const getAjalaMessage = () => {
    if (liveUserRank === 1) {
      return "Outstanding! You are leading the pack! 👑 Double down to keep your crown!";
    } else if (liveUserRank <= 3) {
      return "Fantastic! You're in the top 3! Keep spelling to secure your MTN data prize! 🏆";
    } else {
      return `You are Rank #${liveUserRank}. Spell more words to reach the top 3 and win MTN data! 📱`;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPrimary }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity id="leaderboard-back-btn" onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.brandPrimary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Leaderboard 📊</Text>
          <View style={{ width: 60 }} /> {/* Spacer */}
        </View>

        {/* Mascot / HUD Info Card */}
        <View style={[styles.mascotCard, Shadows.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
          <AjalaAvatar state="standard" size={64} />
          <View style={styles.mascotTextContainer}>
            <Text style={[styles.mascotTitle, { color: theme.brandPrimary }]}>Àjàlá says:</Text>
            <Text style={[styles.mascotSpeech, { color: theme.textPrimary }]}>{getAjalaMessage()}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: theme.bgSecondary }]}>
          <TouchableOpacity
            id="leaderboard-tab-sss2"
            onPress={() => setActiveTab('sss2')}
            style={[styles.tabButton, activeTab === 'sss2' && [styles.tabActive, { backgroundColor: theme.brandPrimary }]]}
          >
            <Text style={[styles.tabText, activeTab === 'sss2' ? styles.tabTextActive : { color: theme.textSecondary }]}>
              SSS 2
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            id="leaderboard-tab-all"
            onPress={() => setActiveTab('all')}
            style={[styles.tabButton, activeTab === 'all' && [styles.tabActive, { backgroundColor: theme.brandPrimary }]]}
          >
            <Text style={[styles.tabText, activeTab === 'all' ? styles.tabTextActive : { color: theme.textSecondary }]}>
              All Classes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            id="leaderboard-tab-wazobia"
            onPress={() => setActiveTab('wazobia')}
            style={[styles.tabButton, activeTab === 'wazobia' && [styles.tabActive, { backgroundColor: theme.brandPrimary }]]}
          >
            <Text style={[styles.tabText, activeTab === 'wazobia' ? styles.tabTextActive : { color: theme.textSecondary }]}>
              Wazobia
            </Text>
          </TouchableOpacity>
        </View>

        {/* Column Headers */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCol, styles.colRank, { color: theme.textMuted }]}>Rank</Text>
          <Text style={[styles.tableHeaderCol, styles.colUser, { color: theme.textMuted }]}>Student</Text>
          <Text style={[styles.tableHeaderCol, styles.colXP, { color: theme.textMuted }]}>Score</Text>
        </View>

        {/* Competitors List */}
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {currentBoard.map((competitor) => {
            const isMe = competitor.isLiveUser;
            return (
              <View
                key={competitor.username + competitor.rank}
                style={[
                  styles.rowCard,
                  isMe && [styles.rowCardMe, { borderColor: theme.brandPrimary, backgroundColor: theme.brandPrimary + '15' }],
                  { backgroundColor: theme.bgCard, borderColor: theme.border }
                ]}
              >
                {/* Rank */}
                <View style={styles.rankContainer}>
                  <Text style={[
                    styles.rankText,
                    competitor.rank <= 3 ? [styles.rankTop, { color: theme.brandAccent }] : { color: theme.textSecondary },
                    isMe && { fontWeight: '900' }
                  ]}>
                    {competitor.rank === 1 ? '🥇' : competitor.rank === 2 ? '🥈' : competitor.rank === 3 ? '🥉' : competitor.rank}
                  </Text>
                </View>

                {/* Profile Detail */}
                <View style={styles.profileContainer}>
                  <View style={[
                    styles.avatarBadge,
                    { backgroundColor: isMe ? theme.brandPrimary : theme.bgSecondary }
                  ]}>
                    <Text style={[
                      styles.avatarBadgeText,
                      { color: isMe ? '#FFFFFF' : theme.brandPrimary }
                    ]}>
                      {competitor.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.nameDetails}>
                    <Text style={[
                      styles.rowUsername,
                      { color: theme.textPrimary },
                      isMe && { fontWeight: '700' }
                    ]}>
                      {competitor.username} {isMe && '(You)'}
                    </Text>
                    <Text style={[styles.rowTitle, { color: theme.textMuted }]}>{competitor.title}</Text>
                  </View>
                </View>

                {/* XP / Prize */}
                <View style={styles.xpContainer}>
                  <Text style={[
                    styles.xpText,
                    { color: theme.textSecondary },
                    isMe && { fontWeight: '800' }
                  ]}>
                    {competitor.xp.toLocaleString()} XP
                  </Text>
                  {competitor.hasPrize && (
                    <View style={[styles.prizeBadge, { backgroundColor: '#E6F7FF' }]}>
                      <Text style={styles.prizeBadgeText}>🎁 MTN Data</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    paddingVertical: Spacing.xs,
  },
  backText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.bodySemiBold,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontFamily: FontFamily.heading,
    textAlign: 'center',
  },
  mascotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    gap: Spacing.md,
  },
  mascotTextContainer: {
    flex: 1,
  },
  mascotTitle: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodySemiBold,
    marginBottom: 2,
  },
  mascotSpeech: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.body,
    lineHeight: 18,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.base,
    borderRadius: Radii.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.bodySemiBold,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base + Spacing.sm,
    marginBottom: Spacing.xs,
  },
  tableHeaderCol: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.bodySemiBold,
    textTransform: 'uppercase',
  },
  colRank: { width: 50 },
  colUser: { flex: 1, paddingLeft: 12 },
  colXP: { width: 100, textAlign: 'right' },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1.5,
  },
  rowCardMe: {
    borderWidth: 2.2,
  },
  rankContainer: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.mono,
  },
  rankTop: {
    fontSize: FontSizes.lg,
  },
  profileContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadgeText: {
    fontSize: FontSizes.md,
    fontFamily: FontFamily.heading,
    fontWeight: 'bold',
  },
  nameDetails: {
    flex: 1,
  },
  rowUsername: {
    fontSize: FontSizes.base,
    fontFamily: FontFamily.bodySemiBold,
    marginBottom: 1,
  },
  rowTitle: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamily.body,
  },
  xpContainer: {
    width: 100,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  xpText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamily.mono,
    fontWeight: '600',
  },
  prizeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.xs,
  },
  prizeBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#096DD9',
  },
});
