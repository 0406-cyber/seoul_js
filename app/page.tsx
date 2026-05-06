"use client"

export const runtime = "edge";
import { useState, useCallback, useEffect, useMemo } from "react"
import { Leaf, X } from "lucide-react" 
import { toast } from "sonner"
import { BottomNav } from "@/components/bottom-nav"
import { AnalysisTab } from "@/components/tabs/analysis-tab"
import { WaterFootprintTab } from "@/components/tabs/water-footprint-tab"
import { CoachingTab } from "@/components/tabs/coaching-tab"
import { CertificationTab } from "@/components/tabs/certification-tab"
import { LeaderboardTab } from "@/components/tabs/leaderboard-tab"
import { EcoCityTab } from "@/components/tabs/eco-city-tab"
import { CitizenFeedTab } from "@/components/tabs/citizen-feed-tab"
import { OnboardingScreen } from "@/components/onboarding-screen"
import {
  computeCo2Kg,
  saveUsage,
  loginUser,
  updateUserPoints,
  getLeaderboardViaApi,
  savePointLog,
  getPointLogs,
  getAllPointLogs,
  getSystemLogs
} from "@/lib/googleSheets"
import {
  getGemmaAdvice,
  askGemmaCustomQuestion,
  analyzeImageWithGemini,
} from "@/lib/gemini"
import { loadUsageHistory, appendUsageLocal, type UsageRecord } from "@/lib/usage-storage"
import { loadPoints, savePoints } from "@/lib/points-storage"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface CertificationHistory {
  id: string
  date: string
  type: string
  points: number
}

interface LeaderboardEntry {
  id: string
  rank: number
  name: string
  points: number
  carbonSaved: number
  streak: number
}

interface PointHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export default function Home() {
  const [nickname, setNickname] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("eco_nickname");
    }
    return null;
  });

  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("eco_nickname");
    }
    return false;
  });

  const [points, setPoints] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("eco_nickname");
      return saved ? loadPoints(saved, 100) : 100;
    }
    return 100;
  });

  const [activeTab, setActiveTab] = useState("analysis")
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")

  const [remoteUsers, setRemoteUsers] = useState<Omit<LeaderboardEntry, "rank">[]>([])
  const [electricityUsage, setElectricityUsage] = useState("")
  const [gasUsage, setGasUsage] = useState("")
  const [carbonEmission, setCarbonEmission] = useState<number | null>(null)
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([])
  const [isSavingUsage, setIsSavingUsage] = useState(false)

  const [messages, setMessages] = useState<Message[]>([])
  const [isCoachingLoading, setIsCoachingLoading] = useState(false)

  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [certificationHistory, setCertificationHistory] = useState<CertificationHistory[]>([])

  const [pointHistory, setPointHistory] = useState<PointHistoryItem[]>([])
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  const [adminLogs, setAdminLogs] = useState<any[]>([])
  const [sysLogs, setSysLogs] = useState<any[]>([])
  const [isAdminLogsLoading, setIsAdminLogsLoading] = useState(false)

  const recordPoint = useCallback(async (userName: string, desc: string, amt: number) => {
    setPointHistory(prev => {
      const newItem: PointHistoryItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString("ko-KR") + " " + new Date().toLocaleTimeString("ko-KR", {hour: '2-digit', minute:'2-digit'}),
        description: desc,
        amount: amt
      };
      return [newItem, ...prev];
    });

    try {
      await savePointLog(userName, desc, amt);
    } catch (e) {
      console.error("포인트 로그 구글 시트 저장 실패:", e);
    }
  }, []);

  useEffect(() => {
    if (!nickname) return;

    setUsageHistory(loadUsageHistory(nickname));

    const syncWithServer = async () => {
      try {
        const remoteData = await getLeaderboardViaApi();
        setRemoteUsers(remoteData);

        const myData = remoteData.find((u) => u.name === nickname);
        if (myData && myData.points >= 0) {
          setPoints(myData.points);
          savePoints(nickname, myData.points); 
        }

        const serverLogs = await getPointLogs(nickname);
        if (serverLogs && serverLogs.length > 0) {
          setPointHistory(serverLogs);
        }
      } catch (e: any) {
        console.error("서버 데이터 동기화 에러:", e.message);
      }
    };

    syncWithServer();
  }, [nickname]);

  useEffect(() => {
    if (isOnboarded && nickname && nickname !== "admin") {
      fetch('/api/syslog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: `접속 (${nickname})` })
      }).catch(() => {});
    }
  }, [isOnboarded, nickname]);

  useEffect(() => {
    if (nickname === "admin" && isAdminAuthenticated) {
      setIsAdminLogsLoading(true);

      Promise.all([getAllPointLogs(), getSystemLogs()])
        .then(([pointLogsData, sysLogsData]) => {
          setAdminLogs(pointLogsData);
          setSysLogs(sysLogsData);
          setIsAdminLogsLoading(false);
        })
        .catch((e) => {
          console.error("로그 로딩 실패:", e);
          setIsAdminLogsLoading(false);
        });
    }
  }, [nickname, isAdminAuthenticated]);

  useEffect(() => {
    if (!nickname) return;
    savePoints(nickname, points);
  }, [nickname, points]);

  const chartData = useMemo(
    () =>
      usageHistory.map((u) => ({
        date: u.date,
        carbon: u.co2_kg,
      })),
    [usageHistory]
  )

  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    const currentUser: Omit<LeaderboardEntry, "rank"> = {
      id: "current",
      name: nickname || "나",
      points,
      carbonSaved: Math.floor(points / 50),
      streak: 1,
    };

    const otherUsers = remoteUsers.filter(user => user.name !== nickname);
    const allUsers = [...otherUsers, currentUser]; 

    return allUsers
      .sort((a, b) => b.points - a.points)
      .map((user, index) => ({ ...user, rank: index + 1 }));
  }, [nickname, points, remoteUsers]);

  const handleOnboardingComplete = useCallback(async (name: string) => {
    localStorage.setItem("eco_nickname", name);
    setNickname(name);
    setIsOnboarded(true);

    try {
      const remoteData = await getLeaderboardViaApi();
      const existingUser = remoteData.find(u => u.name === name);

      if (existingUser) {
        setPoints(existingUser.points);
        toast.success(`${name}님, 다시 오신 것을 환영합니다!`);
      } else {
        setPoints(100);
        recordPoint(name, "신규 가입 보너스", 100);
        toast.success("가입을 축하합니다! 시작 포인트 100P가 지급되었습니다.");
      }

      await loginUser(name);
    } catch (e: any) {
      console.error("로그인 동기화 에러:", e.message);
      setPoints(100); 
    }

    setUsageHistory(loadUsageHistory(name));
  }, [recordPoint]);

  const checkIsExistingUser = useCallback(async (name: string) => {
    try {
      const remoteData = await getLeaderboardViaApi();
      return remoteData.some(u => u.name === name);
    } catch (e) {
      return false;
    }
  }, []);

  const awardPoints = useCallback((delta: number, reason: string) => {
    setPoints((p) => p + delta);
    if (nickname) {
      recordPoint(nickname, reason, delta);
    }
  }, [nickname, recordPoint])

  const handleAdminLogin = useCallback(() => {
    if (adminPassword === "seoul1234") {
      setIsAdminAuthenticated(true)
      toast.success("관리자 인증 성공! 대시보드를 불러옵니다.")
    } else {
      toast.error("비밀번호가 일치하지 않습니다.")
    }
  }, [adminPassword])

  const handleAdminLogout = useCallback(() => {
    setIsAdminAuthenticated(false)
    setNickname(null)
    setIsOnboarded(false)
    setAdminPassword("")
    localStorage.removeItem("eco_nickname")
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem("eco_nickname");
    setNickname(null);
    setIsOnboarded(false);
    setIsAdminAuthenticated(false);
    setAdminPassword("");
    toast.success("로그아웃 되었습니다.");
  }, []);

  const handleCalculate = useCallback(async () => {
    if (!nickname) {
      toast.error("닉네임이 없습니다. 온보딩을 다시 진행해 주세요.")
      return
    }

    setIsSavingUsage(true);

    try {
      const electricity = parseFloat(electricityUsage) || 0
      const gas = parseFloat(gasUsage) || 0

      const emission = await computeCo2Kg(electricity, gas)
      setCarbonEmission(emission)

      const row: UsageRecord = {
        date: new Date().toISOString().slice(0, 10),
        elec_kwh: electricity,
        gas_m3: gas,
        co2_kg: emission,
      }
      const next = appendUsageLocal(nickname, row)
      setUsageHistory(next)

      await saveUsage(nickname, electricity, gas, emission)
      toast.success("데이터가 성공적으로 기록되었습니다!")

    } catch (e: any) {
      console.error("계산/저장 에러:", e.message);
      toast.error("서버 처리 중 에러가 발생했습니다: " + e.message);
    } finally {
      setIsSavingUsage(false)
    }
  }, [nickname, electricityUsage, gasUsage])

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    }
    setMessages((prev) => [...prev, userMessage])
    setIsCoachingLoading(true)
    try {
      const response = await askGemmaCustomQuestion(content)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
        },
      ])
    } catch (e: any) {
      toast.error("AI 응답 실패: " + e.message)
    } finally {
      setIsCoachingLoading(false)
    }
  }, [])

  const handleRequestAdvice = useCallback(async () => {
    setIsCoachingLoading(true)
    try {
      if (usageHistory.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: "먼저 '에너지 사용 분석' 탭에서 데이터를 기록해주세요.",
          },
        ])
        return
      }

      const latest = usageHistory[usageHistory.length - 1]
      const advice = await getGemmaAdvice(
        latest.elec_kwh,
        latest.gas_m3,
        latest.co2_kg
      )
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: advice,
        },
      ])
    } catch (e: any) {
      toast.error("조언 요청 실패: " + e.message)
    } finally {
      setIsCoachingLoading(false)
    }
  }, [usageHistory])

  const handleCertify = useCallback(async (): Promise<{
    ok: boolean
    earnedPoints?: number
    error?: string
  }> => {
    if (!nickname || !selectedImage) {
      toast.error("닉네임 또는 이미지가 필요합니다.")
      return { ok: false, error: "missing" }
    }

    try {
      const { result, error } = await analyzeImageWithGemini(selectedImage)
      if (error || !result) {
        toast.error(error || "이미지 분석에 실패했습니다.")
        return { ok: false, error: error ?? undefined }
      }

      if (String(result.action_found).toLowerCase() !== "true") {
        toast.warning(
          "AI가 사진에서 명확한 에너지 절약 행동을 인식하지 못했습니다."
        )
        return { ok: false, error: "no_action" }
      }

      const rawKwh = result.estimated_save_kwh ?? "0"
      const match = String(rawKwh).match(/[\d.]+/)
      const savedKwh = match ? parseFloat(match[0]) : 0
      const gainedPoints = Math.max(
        10,
        Math.min(500, Math.floor(savedKwh * 100))
      )

      try {
        await updateUserPoints(nickname, gainedPoints)
        setPoints((p) => p + gainedPoints)
        const description = result.description || "에너지 절약 행동"
        recordPoint(nickname, description, gainedPoints);

        setCertificationHistory((prev) => [
          {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString("ko-KR").replace(/\. /g, ".").slice(0, -1),
            type: description,
            points: gainedPoints,
          },
          ...prev,
        ])

        return { ok: true, earnedPoints: gainedPoints }
      } catch (e: any) {
        console.error("포인트 업데이트 에러:", e.message);
        toast.error("서버와 동기화하는 중 문제가 발생했습니다.");
        return { ok: false, error: "sync_failed" }
      }

    } catch (e: any) {
      toast.error(e.message)
      return { ok: false, error: e.message }
    }
  }, [nickname, selectedImage, recordPoint])

  const getTabTitle = () => {
    switch (activeTab) {
      case "analysis": return "탄소 분석"
      case "water": return "물 발자국"
      case "coaching": return "AI 코칭"
      case "certification": return "친환경 인증"
      case "ecoCity": return "에코 시티"
      case "feed": return "시민 기자단"
      case "leaderboard": return "리더보드"
      default: return "Unknown"
    }
  }

  if (!isOnboarded) {
    return <OnboardingScreen 
      onComplete={handleOnboardingComplete} 
      checkIsExistingUser={checkIsExistingUser}
    />
  }

  // 관리자 화면
  if (nickname === "admin") {
    if (!isAdminAuthenticated) {
      return (
        <main className="min-h-screen bg-background relative selection:bg-primary/30 overflow-hidden flex flex-col items-center justify-center p-4">
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] animate-blob mix-blend-screen"></div>
            <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/20 blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>
          </div>
          <div className="liquid-glass p-10 rounded-[2rem] w-full max-w-sm flex flex-col gap-8 shadow-2xl relative z-10">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">🔒 관리자 인증</h2>
              <p className="text-sm text-white/60 mt-2">안전한 접속을 위해 비밀번호를 입력해주세요.</p>
            </div>
            <div className="space-y-4">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="liquid-glass-inner text-white rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-primary w-full shadow-inner transition-all placeholder:text-white/30"
                onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              />
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAdminLogin}
                  className="bg-primary text-[#0f1115] font-bold rounded-2xl p-4 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(74,222,128,0.3)] w-full"
                >
                  인증하기
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-white/10 text-white font-bold rounded-2xl p-4 hover:bg-white/20 transition-all w-full border border-white/5"
                >
                  이전으로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </main>
      )
    }

    return (
      <main className="min-h-screen bg-background relative selection:bg-primary/30 overflow-hidden p-4 pb-12">
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] animate-blob mix-blend-screen"></div>
          <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/20 blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[150px] animate-blob animation-delay-4000 mix-blend-screen"></div>
        </div>

        <div className="max-w-md md:max-w-4xl lg:max-w-6xl mx-auto flex flex-col gap-6 mt-8 px-4 relative z-10">
          <div className="flex items-center justify-between liquid-glass p-6 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                <span className="text-2xl drop-shadow-md">🛠️</span>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white">통합 관리자 대시보드</h1>
                <p className="text-sm text-white/70 mt-1">시스템 전체 활동을 모니터링합니다.</p>
              </div>
            </div>
            <button 
              onClick={handleAdminLogout} 
              className="text-sm bg-white/10 text-white px-5 py-3 rounded-2xl font-bold hover:bg-white/20 transition-colors border border-white/5"
            >
              로그아웃
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="liquid-glass p-6 rounded-[2rem] flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm border border-blue-500/30">🌐</span>
                  시스템 접근 로그
                </h2>
                <span className="text-xs font-bold bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-xl border border-blue-500/30">Cloudflare Edge</span>
              </div>

              <div className="liquid-glass-inner rounded-[1.5rem] overflow-hidden">
                {isAdminLogsLoading ? (
                  <div className="p-8 text-center text-sm text-white/50 animate-pulse font-medium">
                    네트워크 로그 분석 중...
                  </div>
                ) : sysLogs.length === 0 ? (
                  <div className="p-8 text-center text-sm text-white/50">
                    수집된 시스템 로그가 없습니다.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-white/70 bg-black/40 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                          <th className="px-5 py-4 font-semibold whitespace-nowrap">시간</th>
                          <th className="px-5 py-4 font-semibold">활동</th>
                          <th className="px-5 py-4 font-semibold whitespace-nowrap">접속 IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-white/80">
                        {sysLogs.slice(0, 50).map((log) => (
                          <tr key={log.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-5 py-4 whitespace-nowrap text-xs font-sans">{log.date}</td>
                            <td className="px-5 py-4 font-medium text-xs whitespace-nowrap">
                              <span className="bg-white/10 px-2 py-1 rounded-lg border border-white/10">{log.action}</span>
                            </td>
                            <td className="px-5 py-4 text-xs">{log.ip}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="liquid-glass p-6 rounded-[2rem] flex flex-col gap-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm border border-primary/30">📜</span>
                  포인트 활동 로그
                </h2>
                <span className="text-xs font-bold text-white/70 bg-white/10 px-3 py-1.5 rounded-xl border border-white/5">최근 100건</span>
              </div>

              <div className="liquid-glass-inner rounded-[1.5rem] overflow-hidden">
                {isAdminLogsLoading ? (
                  <div className="p-8 text-center text-sm text-white/50 animate-pulse font-medium">
                    서버 활동 로그 동기화 중...
                  </div>
                ) : adminLogs.length === 0 ? (
                  <div className="p-8 text-center text-sm text-white/50">
                    기록된 포인트 로그가 없습니다.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-white/70 bg-black/40 sticky top-0 z-10 backdrop-blur-md">
                        <tr>
                          <th className="px-5 py-4 font-semibold whitespace-nowrap">사용자</th>
                          <th className="px-5 py-4 font-semibold">활동 내역</th>
                          <th className="px-5 py-4 font-semibold text-right whitespace-nowrap">포인트</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-white/80">
                        {adminLogs.slice(0, 100).map((log) => (
                          <tr key={log.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-5 py-4 font-bold whitespace-nowrap text-white">{log.username}</td>
                            <td className="px-5 py-4 text-xs">{log.description}</td>
                            <td className={`px-5 py-4 text-right font-extrabold whitespace-nowrap ${log.amount > 0 ? 'text-primary' : 'text-red-400'}`}>
                              {log.amount > 0 ? '+' : ''}{log.amount}P
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-primary/10 p-6 rounded-[2rem] border border-primary/20 mt-4 backdrop-blur-md shadow-inner">
            <p className="text-sm text-primary font-bold text-center">
              ※ 전체 활성 가입자 수: {leaderboard ? Math.max(0, leaderboard.length - 1) : 0}명 (상세 데이터는 구글 시트 참조)
            </p>
          </div>
        </div>
      </main>
    )
  }

  // 일반 사용자 화면
  return (
<<<<<<< HEAD
    <main className="min-h-screen bg-background relative selection:bg-primary/30">
      <header className="sticky top-4 z-40 mx-4">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto glass-card rounded-[2.5rem] px-6 py-4 border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1.25rem] bg-primary/20 flex items-center justify-center backdrop-blur-md shadow-inner">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-black text-foreground tracking-tight">{getTabTitle()}</h1>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Eco System Active</p>
                </div>
=======
    <main className="min-h-screen bg-background relative selection:bg-primary/30 overflow-hidden">
      
      {/* ✨ 리퀴드 글래스의 핵심: 배경 빛 번짐(Blob) 효과 */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px] animate-blob mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/20 blur-[120px] animate-blob animation-delay-2000 mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[150px] animate-blob animation-delay-4000 mix-blend-screen"></div>
      </div>

      <header className="sticky top-0 z-40 bg-white/5 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="max-w-md md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1.25rem] bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                <Leaf className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight drop-shadow-md">{getTabTitle()}</h1>
                <p className="text-xs font-medium text-white/70 mt-0.5">탄소 절약 & AI 에너지 코칭</p>
>>>>>>> 26cb3e58e653a05b9132959d8659f5c8893cbeba
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsHistoryModalOpen(true)}
<<<<<<< HEAD
                className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl pl-2 pr-4 py-2 hover:bg-white/10 transition-all group"
                title="포인트 내역 보기"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center transition-transform group-hover:scale-110">
                  <span className="text-sm font-black text-primary">{nickname?.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm font-black text-foreground tracking-tight">{points.toLocaleString()}P</span>
=======
                className="flex items-center gap-3 liquid-glass rounded-full px-4 py-2 hover:scale-105 active:scale-95"
                title="포인트 내역 보기"
              >
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(74,222,128,0.4)]">
                  <span className="text-xs font-bold text-[#0f1115]">{nickname?.charAt(0)}</span>
                </div>
                <span className="text-sm font-bold text-white drop-shadow-md">{points} P</span>
>>>>>>> 26cb3e58e653a05b9132959d8659f5c8893cbeba
              </button>

              <button 
                onClick={handleLogout}
<<<<<<< HEAD
                className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/5 rounded-2xl text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="로그아웃"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
=======
                className="p-3 hover:bg-white/10 rounded-2xl transition-all text-white/70 border border-transparent hover:border-white/10"
                title="로그아웃"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
>>>>>>> 26cb3e58e653a05b9132959d8659f5c8893cbeba
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-md md:max-w-4xl lg:max-w-5xl mx-auto px-4 py-8 relative z-10">
        {activeTab === "analysis" && (
          <AnalysisTab
            electricityUsage={electricityUsage}
            gasUsage={gasUsage}
            onElectricityChange={setElectricityUsage}
            onGasChange={setGasUsage}
            onCalculate={handleCalculate}
            carbonEmission={carbonEmission}
            chartData={chartData}
            isSaving={isSavingUsage}
          />
        )}

        {activeTab === "water" && <WaterFootprintTab />}

        {activeTab === "coaching" && (
          <CoachingTab
            messages={messages}
            onSendMessage={handleSendMessage}
            onRequestAdvice={handleRequestAdvice}
            isLoading={isCoachingLoading}
          />
        )}

        {activeTab === "certification" && (
          <CertificationTab
            selectedImage={selectedImage}
            onImageSelect={setSelectedImage}
            onCertify={handleCertify}
            points={points}
            certificationHistory={certificationHistory}
          />
        )}

        {activeTab === "ecoCity" && nickname && (
          <EcoCityTab nickname={nickname} points={points} />
        )}

        {activeTab === "feed" && nickname && (
          <CitizenFeedTab
            nickname={nickname}
            onAwardPoints={(delta, reason) => awardPoints(delta, reason)}
          />
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardTab entries={leaderboard} currentUserId="current" />
        )}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 포인트 모달: 완전한 물방울 형태의 리퀴드 글래스 */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsHistoryModalOpen(false)}></div>
          
          <div className="liquid-glass w-full max-w-md rounded-[2.5rem] flex flex-col max-h-[85vh] z-10 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-extrabold text-white">포인트 내역</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {pointHistory.length === 0 ? (
                <div className="text-center text-white/50 py-16 flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full liquid-glass-inner flex items-center justify-center">
                    <span className="text-4xl drop-shadow-md">🫙</span>
                  </div>
                  <p className="font-medium">아직 적립된 포인트가 없습니다.</p>
                </div>
              ) : (
                pointHistory.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-5 rounded-3xl liquid-glass-inner hover:bg-white/10 transition-colors">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-base font-bold text-white">{item.description}</span>
                      <span className="text-xs font-medium text-white/50">{item.date}</span>
                    </div>
                    <span className={`font-extrabold text-xl tracking-tight ${item.amount > 0 ? 'text-primary drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]' : 'text-red-400'}`}>
                      {item.amount > 0 ? '+' : ''}{item.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
