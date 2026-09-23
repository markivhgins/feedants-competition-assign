import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import SectionTitle from '../components/SectionTitle';
import Metric from '../components/Metric';
import { getCompetition, registerCompetition, submitCompetition } from '../services/api';

const SLUG = 'feedants-classical-dance';
const assetMap = {
  'judge.jpg': require('../../assets/judge.jpg'),
  'winner1.jpg': require('../../assets/winner1.jpg'),
  'winner2.jpg': require('../../assets/winner2.jpg'),
  'winner3.jpg': require('../../assets/winner3.jpg'),
  'winner4.jpg': require('../../assets/winner4.jpg')
};

function formatDateTime(value) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }),
    time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  };
}

function formatCountdown(target) {
  const remaining = Math.max(0, new Date(target).getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(days).padStart(2, '0')}d : ${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`;
}

export default function CompetitionScreen() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('about');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState('00d : 00h : 00m : 00s');
  const [language, setLanguage] = useState('eng');

  async function load() {
    try {
      setError('');
      const result = await getCompetition(SLUG);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!data) return undefined;
    const target = data.lifecycle === 'registration_open' ? data.registrationEnd : data.submissionEnd;
    setCountdown(formatCountdown(target));
    const timer = setInterval(() => setCountdown(formatCountdown(target)), 1000);
    return () => clearInterval(timer);
  }, [data]);

  const dates = useMemo(() => data ? [
    ['Register Before', data.registrationEnd],
    ['Submission Starts', data.submissionStart],
    ['Submission Ends', data.submissionEnd],
    ['Result Date', data.resultDate]
  ].map(([label, value]) => ({ label, ...formatDateTime(value) })) : [], [data]);

  async function handleRegister() {
    setActionLoading(true);
    try {
      await registerCompetition(SLUG);
      await load();
    } catch (err) {
      Alert.alert('Registration', err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSubmission() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['video/*', 'image/*'], copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return;
    const file = result.assets[0];
    setActionLoading(true);
    try {
      const payload = file.file || {
        uri: file.uri,
        name: file.name || 'submission',
        type: file.mimeType || 'application/octet-stream'
      };
      await submitCompetition(SLUG, payload);
      await load();
      Alert.alert('Submission uploaded', 'Your submission has been recorded successfully.');
    } catch (err) {
      Alert.alert('Submission', err.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator size="large" color="#087f8c" /></SafeAreaView>;
  }

  if (error || !data) {
    return <SafeAreaView style={styles.center}>
      <Ionicons name="cloud-offline-outline" size={46} color="#087f8c" />
      <Text style={styles.errorTitle}>Could not load competition</Text>
      <Text style={styles.errorText}>{error}</Text>
      <Pressable style={styles.retry} onPress={() => { setLoading(true); load(); }}><Text style={styles.retryText}>Retry</Text></Pressable>
    </SafeAreaView>;
  }

  const isRegistrationOpen = data.lifecycle === 'registration_open';
  const isSubmissionOpen = data.lifecycle === 'submission_open';
  const labels = language === 'hi' ? {
    goBack: 'वापस जाएँ',
    judge: 'जज',
    importantDates: 'महत्वपूर्ण तिथियाँ',
    previousWinners: 'पिछले विजेता',
    about: 'प्रतियोगिता के बारे में',
    judging: 'निर्णय मानदंड',
    rules: 'नियम और पात्रता',
    rewards: 'पुरस्कार',
    registerNow: 'अभी रजिस्टर करें',
    registrationClosed: 'रजिस्ट्रेशन बंद है',
    upload: 'सबमिशन अपलोड करें',
    registered: 'रजिस्टर्ड'
  } : {
    goBack: 'Go back',
    judge: 'Judge',
    importantDates: 'Important Dates',
    previousWinners: 'Previous Winners',
    about: 'About Competition',
    judging: 'Judging Parameters',
    rules: 'Rules & Eligibility',
    rewards: 'Rewards',
    registerNow: 'Register Now',
    registrationClosed: 'Registration Closed',
    upload: 'Upload Submission',
    registered: 'Registered'
  };
  const mainLabel = data.isRegistered ? (isSubmissionOpen ? labels.upload : labels.registered) : (isRegistrationOpen ? labels.registerNow : labels.registrationClosed);
  const onMainAction = data.isRegistered ? (isSubmissionOpen ? handleSubmission : undefined) : (isRegistrationOpen ? handleRegister : undefined);
  const mainDisabled = actionLoading || !onMainAction;

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.topbar}>
        <View style={styles.backRow}><Ionicons name="arrow-back" size={23} color="#13294d" /><Text style={styles.goBack}>{labels.goBack}</Text></View>
        <View style={styles.langs}><Pressable style={language === 'eng' ? styles.langActive : null} onPress={() => setLanguage('eng')}><Text style={language === 'eng' ? styles.langActiveText : styles.langText}>ENG</Text></Pressable><Pressable style={language === 'hi' ? styles.langActive : null} onPress={() => setLanguage('hi')}><Text style={language === 'hi' ? styles.langActiveText : styles.langText}>हिंदी</Text></Pressable></View>
      </View>

      <Card>
        <View style={styles.headerLine}>
          <View style={styles.flexOne}><Text style={styles.title}>{data.title}</Text><View style={styles.badges}><Text style={styles.badge}>{data.category}</Text><Text style={styles.badge}>{data.format}</Text>{data.certificateAvailable && <View style={styles.certificate}><Ionicons name="trophy-outline" size={20} color="#0b8995" /><Text style={styles.certificateText}>Winners get certificate</Text></View>}</View></View>
          <View style={[styles.registeredBadge, !data.isRegistered && styles.unregisteredBadge]}><Ionicons name={data.isRegistered ? 'checkmark-circle' : 'ellipse-outline'} size={19} color={data.isRegistered ? '#147d88' : '#71849d'} /><Text style={[styles.registeredText, !data.isRegistered && styles.unregisteredText]}>{data.isRegistered ? 'Registered' : 'Not registered'}</Text></View>
        </View>
        <View style={styles.metricsRow}><Metric label="Prize Pool" prefix="₹" value={data.prizePool.toLocaleString('en-IN')} /><Metric label="Entry Fee" prefix="₹" value={data.entryFee} /><View style={styles.spotsMetric}><View style={styles.spotsLabel}><Ionicons name="people-outline" size={21} color="#0b8995" /><Text style={styles.spotsLabelText}>{data.remainingSpots ? `Only ${data.remainingSpots} spots left` : 'No spots left'}</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(data.participantCount / data.maxParticipants * 100, 100)}%` }]} /></View><Text style={styles.booked}>{data.participantCount} / {data.maxParticipants} Booked</Text></View></View>
      </Card>

      <Card style={styles.judgeCard}><View style={styles.judgeRow}><Image source={assetMap[data.judge.image] || assetMap['judge.jpg']} style={styles.judgeImage} /><View style={styles.judgeText}><Text style={styles.muted}>{labels.judge}</Text><Text style={styles.judgeName}>{data.judge.name}</Text><Text style={styles.judgeRole}>{data.judge.role}</Text><Text style={styles.judgeRole}>{data.judge.experience}</Text></View><Pressable style={styles.videoButton} onPress={() => Linking.openURL(data.judge.introVideo)}><Ionicons name="play" size={24} color="#0a8390" /><Text style={styles.videoLabel}>Intro Video</Text></Pressable></View></Card>

      <View style={styles.countdown}><Ionicons name="hourglass-outline" size={23} color="#087f8c" /><Text style={styles.countdownLabel}>{isRegistrationOpen ? 'Registration closes in' : 'Submission window ends in'}</Text><Text style={styles.countdownValue}>{countdown}</Text><Ionicons name="timer-outline" size={24} color="#087f8c" /><Text style={styles.hurry}>{isRegistrationOpen ? 'Hurry up!' : 'Track your submission'}</Text></View>

      <Card><SectionTitle>{labels.importantDates}</SectionTitle><View style={styles.dateGrid}>{dates.map(item => <View key={item.label} style={styles.dateItem}><Ionicons name="calendar-outline" size={25} color="#0b8995" /><View><Text style={styles.dateLabel}>{item.label}</Text><Text style={styles.dateMain}>{item.date}</Text><Text style={styles.dateTime}>{item.time}</Text></View></View>)}</View></Card>

      <Card><SectionTitle>{labels.previousWinners}</SectionTitle><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.winnerScroll}>{data.winners.map(winner => <View key={`${winner.name}-${winner.position}`} style={styles.winnerCard}><Image source={assetMap[winner.image] || assetMap['winner1.jpg']} style={styles.winnerImage} /><View style={styles.winnerInfo}><Text style={styles.winnerName} numberOfLines={1}>{winner.name}</Text><Text style={styles.winnerPosition}>{winner.position}</Text></View><View style={styles.miniPlay}><Ionicons name="play" size={12} color="#fff" /></View></View>)}</ScrollView></Card>

      <Card><View style={styles.tabs}>{[['about', labels.about], ['judging', labels.judging], ['rules', labels.rules]].map(([key, label]) => <Pressable key={key} style={styles.tab} onPress={() => setTab(key)}><Text style={[styles.tabText, tab === key && styles.tabActive]}>{label}</Text>{tab === key && <View style={styles.tabUnderline} />}</Pressable>)}</View><View style={styles.tabContent}>{tab === 'about' && <><Text style={styles.bodyText}>{data.description}</Text><Text style={styles.viewMore}>View more <Ionicons name="chevron-down" size={17} color="#087f8c" /></Text></>}{tab === 'judging' && <Text style={styles.bodyText}>{data.judgingParameters}</Text>}{tab === 'rules' && <Text style={styles.bodyText}>{data.rules}</Text>}</View></Card>

      <Card><SectionTitle>{labels.rewards} <Text style={styles.allPositions}> (All Positions)</Text></SectionTitle>{data.rewards.map((reward, index) => <View key={reward.position} style={styles.rewardRow}><Text style={styles.rewardIcon}>{index === 0 ? '🏆' : index === 1 ? '🥈' : index === 2 ? '🥉' : '☆'}</Text><Text style={styles.rewardLabel}>{reward.label}</Text><Text style={styles.rewardAmount}>₹ {reward.amount}</Text></View>)}</Card>

      <View style={styles.disclaimer}><Ionicons name="information-circle-outline" size={21} color="#0b8995" /><Text style={styles.disclaimerText}>Only contributions from paid participants will be considered for judging.</Text></View>

      <View style={styles.infoGrid}><Card style={styles.infoCard}><View style={styles.videoTile}><Ionicons name="play" size={24} color="#fff" /></View><Text style={styles.infoTitle}>How will you receive prize money?</Text><Text style={styles.infoSub}>Watch video to know more</Text></Card><Card style={styles.infoCard}><View style={styles.infoLine}><Ionicons name="shield-checkmark-outline" size={24} color="#14284b" /><Text style={styles.infoTitle}>Refund policy</Text></View><View style={styles.infoLine}><Ionicons name="shield-checkmark-outline" size={24} color="#14284b" /><Text style={styles.infoTitle}>Secure payments powered by {data.securePaymentProvider}</Text></View></Card></View>

      <Card style={styles.referral}><View style={styles.refIcon}><Ionicons name="megaphone-outline" size={31} color="#33bdab" /></View><View style={styles.refMain}><Text style={styles.infoTitle}>Refer & Earn more discount</Text><Text style={styles.refText}>https://feedants.com/r/{data.referralCode}</Text><Text style={styles.refEarn}>You earn ₹{data.referralReward} for every signup</Text></View><Pressable style={styles.refButton} onPress={() => Share.share({ message: `Join Feedants Classical Dance: https://feedants.com/r/${data.referralCode}` })}><Text style={styles.refButtonText}>Refer Now</Text></Pressable></Card>

      <Card style={styles.usersCard}><Ionicons name="chatbubble-ellipses-outline" size={25} color="#14284b" /><View><Text style={styles.infoTitle}>Hear From Our Users</Text><Text style={styles.infoSub}>See what participants say about Feedants</Text></View><Ionicons name="chevron-forward" size={22} color="#14284b" /></Card>
      <View style={styles.ad}><Ionicons name="megaphone-outline" size={20} color="#7586a5" /><Text style={styles.adText}>Ad Here</Text></View>

      <Pressable style={[styles.mainButton, mainDisabled && styles.disabledButton]} onPress={onMainAction} disabled={mainDisabled}><Text style={styles.mainButtonText}>{actionLoading ? 'Please wait...' : mainLabel}</Text>{data.isRegistered && !isSubmissionOpen && <Text style={styles.mainButtonSub}>Registered</Text>}</Pressable>

      <View style={styles.bottomNav}><View style={styles.navItem}><Ionicons name="home-outline" size={23} color="#8a98b2" /><Text style={styles.navText}>Home</Text></View><View style={styles.navItem}><Ionicons name="search-outline" size={23} color="#8a98b2" /><Text style={styles.navText}>Explore</Text></View><View style={styles.plusButton}><Ionicons name="add" size={30} color="#fff" /></View><View style={styles.navItem}><Ionicons name="trophy-outline" size={23} color="#0a8390" /><Text style={styles.navTextActive}>Competitions</Text></View><View style={styles.navItem}><Ionicons name="person-circle-outline" size={25} color="#8a98b2" /><Text style={styles.navText}>Profile</Text></View></View>
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { paddingHorizontal: 18, paddingBottom: 24, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', padding: 24 },
  errorTitle: { marginTop: 14, color: '#14284b', fontSize: 20, fontWeight: '800' },
  errorText: { marginTop: 7, color: '#6d7ea0', textAlign: 'center' },
  retry: { backgroundColor: '#07808b', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, marginTop: 18 },
  retryText: { color: '#fff', fontWeight: '800' },
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  goBack: { color: '#152b4f', fontSize: 18, fontWeight: '700' },
  langs: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef1f5', borderRadius: 18, padding: 2 },
  langActive: { backgroundColor: '#0d8290', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7 },
  langActiveText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  langText: { color: '#5b6c88', fontSize: 13, paddingHorizontal: 10, fontWeight: '700' },
  headerLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  flexOne: { flex: 1 },
  title: { color: '#12284b', fontSize: 22, fontWeight: '900', marginBottom: 9 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7 },
  badge: { color: '#273857', fontWeight: '700', fontSize: 12, backgroundColor: '#f1f4f8', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6 },
  certificate: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 2 },
  certificateText: { color: '#0d7e89', fontWeight: '800', fontSize: 12 },
  registeredBadge: { height: 42, paddingHorizontal: 11, backgroundColor: '#edf8f7', borderColor: '#c7e6e5', borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  unregisteredBadge: { backgroundColor: '#f5f7f9', borderColor: '#dbe1e7' },
  registeredText: { color: '#0b8290', fontWeight: '800', fontSize: 12 },
  unregisteredText: { color: '#71849d' },
  metricsRow: { flexDirection: 'row', gap: 16, marginTop: 20, alignItems: 'flex-start' },
  spotsMetric: { flex: 1.45 },
  spotsLabel: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  spotsLabelText: { color: '#0c7d89', fontSize: 15, fontWeight: '900' },
  progressTrack: { height: 5, backgroundColor: '#d5eeee', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#0d8590', borderRadius: 5 },
  booked: { color: '#71839f', fontSize: 12, marginTop: 7 },
  judgeCard: { paddingVertical: 12 },
  judgeRow: { flexDirection: 'row', alignItems: 'center' },
  judgeImage: { width: 82, height: 82, borderRadius: 42, marginRight: 14 },
  judgeText: { flex: 1 },
  muted: { color: '#71839f', fontSize: 13 },
  judgeName: { color: '#14284b', fontSize: 18, fontWeight: '900', marginTop: 2 },
  judgeRole: { color: '#6b7d9e', fontSize: 13, marginTop: 2 },
  videoButton: { width: 86, height: 86, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f7fa', borderRadius: 45, gap: 4 },
  videoLabel: { color: '#5b6c88', fontSize: 11, fontWeight: '800', position: 'absolute', top: 82 },
  countdown: { backgroundColor: '#edf8f8', borderRadius: 13, paddingVertical: 11, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  countdownLabel: { color: '#14284b', fontWeight: '900', fontSize: 13 },
  countdownValue: { color: '#087f8c', fontSize: 15, fontWeight: '900', flex: 1, textAlign: 'center' },
  hurry: { color: '#087f8c', fontWeight: '900', fontSize: 12 },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: '#e7edf2', borderRadius: 10 },
  dateItem: { width: '50%', minHeight: 90, padding: 12, flexDirection: 'row', gap: 10 },
  dateLabel: { color: '#7586a5', fontSize: 12, marginBottom: 3 },
  dateMain: { color: '#0b7f8b', fontSize: 14, fontWeight: '900' },
  dateTime: { color: '#14284b', fontSize: 12, fontWeight: '700', marginTop: 2 },
  winnerScroll: { gap: 9 },
  winnerCard: { width: 177, minHeight: 90, backgroundColor: '#f6f8fb', borderRadius: 11, padding: 6, flexDirection: 'row', alignItems: 'center', position: 'relative' },
  winnerImage: { width: 72, height: 72, borderRadius: 9 },
  winnerInfo: { flex: 1, paddingHorizontal: 8 },
  winnerName: { color: '#14284b', fontWeight: '900', fontSize: 12 },
  winnerPosition: { color: '#0a8390', fontSize: 11, marginTop: 4, fontWeight: '800' },
  miniPlay: { position: 'absolute', bottom: 8, left: 53, backgroundColor: '#0c8794', width: 22, height: 22, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e6ecf0' },
  tab: { flex: 1, paddingBottom: 9, alignItems: 'center', position: 'relative' },
  tabText: { color: '#687b9c', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  tabActive: { color: '#0a8190' },
  tabUnderline: { position: 'absolute', bottom: -1, height: 3, backgroundColor: '#0a8490', left: 5, right: 5 },
  tabContent: { paddingTop: 12 },
  bodyText: { color: '#617395', lineHeight: 24, fontSize: 14 },
  viewMore: { textAlign: 'center', color: '#0a8190', fontWeight: '900', marginTop: 7 },
  allPositions: { color: '#6a7c9b', fontSize: 12, fontWeight: '500' },
  rewardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#edf0f3' },
  rewardIcon: { width: 34, fontSize: 19 },
  rewardLabel: { flex: 1, color: '#14284b', fontWeight: '800', fontSize: 13 },
  rewardAmount: { color: '#0b7f8b', fontWeight: '900', fontSize: 17 },
  disclaimer: { backgroundColor: '#edf8f8', borderRadius: 11, padding: 11, flexDirection: 'row', gap: 8, alignItems: 'center' },
  disclaimerText: { color: '#2e466a', fontSize: 12, flex: 1 },
  infoGrid: { flexDirection: 'row', gap: 10 },
  infoCard: { flex: 1, minHeight: 122 },
  videoTile: { width: 50, height: 50, backgroundColor: '#40c0a6', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  infoTitle: { color: '#14284b', fontSize: 13, fontWeight: '900', flexShrink: 1 },
  infoSub: { color: '#7384a0', fontSize: 11, marginTop: 4 },
  infoLine: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 18 },
  referral: { backgroundColor: '#e9fff0', flexDirection: 'row', alignItems: 'center', gap: 10 },
  refIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  refMain: { flex: 1 },
  refText: { color: '#6a7c98', fontSize: 10, marginTop: 4 },
  refEarn: { color: '#0a8390', fontWeight: '800', fontSize: 10, marginTop: 4 },
  refButton: { backgroundColor: '#087f8c', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 9 },
  refButtonText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  usersCard: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  usersCardText: { flex: 1 },
  ad: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#b4c3d8', borderRadius: 12, minHeight: 42, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 7 },
  adText: { color: '#71839e', fontWeight: '800' },
  mainButton: { backgroundColor: '#05818d', borderRadius: 11, minHeight: 54, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  disabledButton: { backgroundColor: '#7ca9ad' },
  mainButtonText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  mainButtonSub: { color: '#fff', fontSize: 11, marginTop: 2 },
  bottomNav: { minHeight: 72, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e8edf2', marginHorizontal: -18, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navItem: { alignItems: 'center', gap: 4, minWidth: 56 },
  navText: { color: '#8a98b2', fontSize: 10, fontWeight: '800' },
  navTextActive: { color: '#0a8390', fontSize: 10, fontWeight: '900' },
  plusButton: { width: 58, height: 58, borderRadius: 17, backgroundColor: '#087f8c', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#eff9fa' }
});
