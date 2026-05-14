"use client"

import { useState, useCallback, useEffect, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Moon, Sun } from "lucide-react"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { BottomNav } from "@/components/bottom-nav"
import { AnalysisTab } from "@/components/tabs/analysis-tab"
import { CoachingTab } from "@/components/tabs/coaching-tab"
import { CarbonMapTab } from "@/components/tabs/carbon-map-tab"
import { CertificationTab } from "@/components/tabs/certification-tab"
import { OnboardingScreen } from "@/components/onboarding-screen"
// import { DailyMissionsCard } from "@/components/daily-missions-card"
// import { WaterFootprintTab } from "@/components/tabs/water-footprint-tab"
// import { CertificationTab } from "@/components/tabs/certification-tab"
// import { CampaignTab } from "@/components/tabs/campaign-tab"
// import { LeaderboardTab } from "@/components/tabs/leaderboard-tab"
// import { EcoCityTab } from "@/components/tabs/eco-city-tab"
// import { CitizenFeedTab } from "@/components/tabs/citizen-feed-tab"
import {
  computeCo2Kg,
  saveUsage,
  loginUser,
  updateUserPoints,
  getLeaderboardViaApi,
  savePointLog,
  getPointLogs,
  getSystemLogs,
  getAllOrders,
  updateOrderStatus
} from "@/lib/googleSheets"
import {
  getGemmaAdvice,
  askGemmaCustomQuestion,
  analyzeImageWithGemini,
} from "@/lib/gemini"
import { loadUsageHistory, appendUsageLocal, type UsageRecord } from "@/lib/usage-storage"
import { loadPoints, savePoints } from "@/lib/points-storage"
import { AppShell } from "@/components/app/app-shell"
import { AppContainer } from "@/components/app/app-container"
import { AppHeader } from "@/components/app/app-header"
import {
  PointHistoryModal,
  type PointHistoryItem,
} from "@/components/app/point-history-modal"
import { getTabMeta } from "@/lib/tab-meta"

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

function MainContent() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 1. URL 기반 라우팅 로직 추가
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") || "analysis"

  const handleTabChange = (newTab: string) => {
    router.push(`?tab=${newTab}`, { scroll: false })
  }

  const [nickname, setNickname] = useState<string | null>(null)
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false)
  const [points, setPoints] = useState<number>(100)

  useEffect(() => {
    setMounted(true)
    const savedName = localStorage.getItem("eco_nickname");
    if (savedName) {
      // sessionStorage에 세션 플래그가 없으면 창을 닫았다 다시 연 것이므로 로그아웃
      const sessionFlag = sessionStorage.getItem("eco_session");
      if (!sessionFlag) {
        localStorage.removeItem("eco_nickname");
        toast.info("세션이 만료되어 로그아웃되었습니다.");
        return;
      }
      setNickname(savedName)
      setIsOnboarded(true)
      setPoints(loadPoints(savedName, 100))
    }
  }, [])

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

  const [sysLogs, setSysLogs] = useState<any[]>([])
  const [isAdminLogsLoading, setIsAdminLogsLoading] = useState(false)

  const [adminOrders, setAdminOrders] = useState<any[]>([])
  const [isAdminOrdersLoading, setIsAdminOrdersLoading] = useState(false)

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
    if (!nickname || !mounted) return;

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
  }, [nickname, mounted]);

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
      
      Promise.all([getSystemLogs(), getAllOrders()])
        .then(([sysLogsData, ordersData]) => {
          setSysLogs(sysLogsData);
          setAdminOrders(ordersData);
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
    sessionStorage.setItem("eco_session", "active");
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

  /* 비활성화된 기능: 피드 보상 포인트는 현재 seoul_min에서 사용되지 않습니다.
  const awardPoints = useCallback((delta: number, reason: string) => {
    setPoints((p) => p + delta);
    if (nickname) {
      recordPoint(nickname, reason, delta);
    }
  }, [nickname, recordPoint])
  */

  const grantPoints = useCallback(
    async (delta: number, reason: string) => {
      if (!nickname) return
      setPoints((p) => p + delta)
      recordPoint(nickname, reason, delta)
      try {
        await updateUserPoints(nickname, delta)
      } catch {
        // best effort (offline/local-first)
      }
    },
    [nickname, recordPoint]
  )

  const spendPoints = useCallback(
    async (cost: number, reason: string) => {
      if (!nickname) return
      setPoints((p) => {
        if (p < cost) throw new Error("포인트가 부족합니다.")
        return p - cost
      })
      recordPoint(nickname, reason, -cost)
      try {
        await updateUserPoints(nickname, -cost)
      } catch {
        // best effort
      }
    },
    [nickname, recordPoint]
  )

  const handleAdminLogin = useCallback(() => {
    if (adminPassword === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || adminPassword === "seoul1234") {
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
    sessionStorage.removeItem("eco_session")
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem("eco_nickname");
    sessionStorage.removeItem("eco_session");
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

  const tabMeta = getTabMeta(activeTab)

  if (!mounted) return null;

  if (!isOnboarded) {
    return <OnboardingScreen 
      onComplete={handleOnboardingComplete} 
      checkIsExistingUser={checkIsExistingUser}
    />
  }

  if (nickname === "admin") {
    if (!isAdminAuthenticated) {
      return (
        <AppShell>
          <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <div className="bg-card p-8 rounded-2xl border border-border w-full max-w-sm flex flex-col gap-6 shadow-lg">
            <div>
              <h2 className="text-xl font-bold text-foreground">🔒 관리자 권한 인증</h2>
              <p className="text-sm text-muted-foreground mt-2">대시보드에 접근하려면 비밀번호가 필요합니다.</p>
            </div>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="관리자 비밀번호 입력"
              className="bg-background text-foreground border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary w-full"
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
            />
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAdminLogin}
                className="bg-primary text-primary-foreground font-bold rounded-xl p-3 hover:bg-primary/90 transition w-full"
              >
                인증하기
              </button>
              <button
                onClick={handleLogout}
                className="bg-secondary text-secondary-foreground font-bold rounded-xl p-3 hover:bg-secondary/80 transition w-full"
              >
                이전으로 돌아가기
              </button>
            </div>
          </div>
          </div>
        </AppShell>
      )
    }

    return (
      <AppShell>
        <AppContainer className="pt-8 pb-12">
          <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">🛠️ 통합 관리자 대시보드</h1>
            <div className="flex gap-2">
               <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 bg-secondary rounded-xl">
                  {theme === 'dark' ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
               </button>
               <button onClick={handleAdminLogout} className="text-sm bg-secondary text-secondary-foreground px-4 py-2 rounded-xl font-medium hover:bg-secondary/80 transition-colors">로그아웃</button>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col gap-4 shadow-sm">
            <h2 className="text-lg font-bold text-foreground">👥 전체 사용자 기본 현황</h2>
            <div className="flex justify-between items-center bg-background p-4 rounded-xl border border-border">
              <span className="text-sm text-muted-foreground">현재 활성 가입자 수</span>
              <span className="text-lg font-bold text-foreground">
                {leaderboard ? Math.max(0, leaderboard.length - 1) : 0} 명
              </span>
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">🌐 시스템 접근 및 보안 로그</h2>
              <span className="text-xs font-medium bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md">Cloudflare Edge Logs</span>
            </div>
            
            <div className="bg-background rounded-xl border border-border overflow-hidden">
              {isAdminLogsLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
                  네트워크 로그를 분석 중입니다...
                </div>
              ) : sysLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  수집된 시스템 로그가 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-secondary/50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">시간</th>
                        <th className="px-4 py-3 font-medium">활동</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">접속 IP</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">국가</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap text-right">디바이스</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border font-mono">
                      {sysLogs.slice(0, 50).map((log) => (
                        <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs font-sans">{log.date}</td>
                          <td className="px-4 py-3 font-medium text-xs whitespace-nowrap">
                            <span className="bg-secondary px-2 py-1 rounded text-foreground">{log.action}</span>
                          </td>
                          <td className="px-4 py-3 text-xs tracking-wider">{log.ip}</td>
                          <td className="px-4 py-3 text-xs">
                            {log.country === 'KR' ? '🇰🇷 KR' : `🌍 ${log.country}`}
                          </td>
                          <td className="px-4 py-3 text-xs text-right whitespace-nowrap text-muted-foreground font-sans">
                            {log.device}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">� 상품 교환 주문 관리</h2>
              <span className="text-xs text-muted-foreground">최근 100건</span>
            </div>
            
            <div className="bg-background rounded-xl border border-border overflow-hidden">
              {isAdminLogsLoading ? (
                <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
                  주문 데이터를 불러오는 중입니다...
                </div>
              ) : adminOrders.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  접수된 상품 교환 주문이 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground bg-secondary/50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">요청 시간</th>
                        <th className="px-4 py-3 font-medium whitespace-nowrap">사용자</th>
                        <th className="px-4 py-3 font-medium">상품명</th>
                        <th className="px-4 py-3 font-medium text-right whitespace-nowrap">포인트</th>
                        <th className="px-4 py-3 font-medium text-center whitespace-nowrap">상태</th>
                        <th className="px-4 py-3 font-medium text-center whitespace-nowrap">액션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {adminOrders.slice(0, 100).map((order) => (
                        <tr key={order.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-muted-foreground text-xs">{order.requestedAt}</td>
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{order.username}</td>
                          <td className="px-4 py-3 text-muted-foreground">{order.itemName}</td>
                          <td className="px-4 py-3 text-right font-bold whitespace-nowrap text-primary">
                            {order.cost}P
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              order.status === 'fulfilled' ? 'bg-green-500/10 text-green-500' :
                              order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                              'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              {order.status === 'fulfilled' ? '완료' :
                               order.status === 'cancelled' ? '취소' : '요청'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {order.status === 'requested' && (
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={async () => {
                                    try {
                                      await updateOrderStatus(order.id, 'fulfilled');
                                      setAdminOrders(prev => prev.map(o => 
                                        o.id === order.id ? { ...o, status: 'fulfilled' } : o
                                      ));
                                      toast.success("주문이 완료 처리되었습니다.");
                                    } catch (e) {
                                      toast.error("상태 업데이트 실패");
                                    }
                                  }}
                                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition"
                                >
                                  완료
                                </button>
                                <button
                                  onClick={async () => {
                                    try {
                                      await updateOrderStatus(order.id, 'cancelled');
                                      setAdminOrders(prev => prev.map(o => 
                                        o.id === order.id ? { ...o, status: 'cancelled' } : o
                                      ));
                                      toast.success("주문이 취소 처리되었습니다.");
                                    } catch (e) {
                                      toast.error("상태 업데이트 실패");
                                    }
                                  }}
                                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
                                >
                                  취소
                                </button>
                              </div>
                            )}
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
        </AppContainer>
      </AppShell>
    )
  }

  const todayYmd = new Date().toISOString().slice(0, 10)
  const hasUsageToday = usageHistory.some((u) => u.date === todayYmd)

  return (
    <AppShell>
      <AppHeader
        title={tabMeta.title}
        subtitle={tabMeta.subtitle}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        nickname={nickname}
        points={points}
        onOpenPoints={() => setIsHistoryModalOpen(true)}
        onLogout={handleLogout}
      />

      <AppContainer className="py-6">
        {/* 오늘의 미션은 seoul_min에서 비활성화되었습니다. */}

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

        {/* 비활성화된 탭: 필요한 경우 주석 해제해서 다시 사용할 수 있습니다. */}
        {/* {activeTab === "water" && <WaterFootprintTab />} */}

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

        {activeTab === "carbonMap" && (
          <CarbonMapTab />
        )}

        {/* {activeTab === "campaign" && (
          <CampaignTab nickname={nickname ?? "user"} points={points} onGrantPoints={grantPoints} />
        )} */}

        {/* {activeTab === "ecoCity" && nickname && (
          <EcoCityTab nickname={nickname} points={points} onSpendPoints={spendPoints} />
        )} */}

        {/* {activeTab === "feed" && nickname && (
          <CitizenFeedTab
            nickname={nickname}
            onAwardPoints={(delta, reason) => awardPoints(delta, reason)}
          />
        )} */}

        {/* {activeTab === "leaderboard" && (
          <LeaderboardTab entries={leaderboard} currentUserId="current" />
        )} */}
      </AppContainer>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      <PointHistoryModal
        open={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        items={pointHistory}
      />
    </AppShell>
  )
}

// 2. Next.js App Router에서 useSearchParams를 사용하기 위해 Suspense로 감싸줍니다.
export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MainContent />
    </Suspense>
  )
}