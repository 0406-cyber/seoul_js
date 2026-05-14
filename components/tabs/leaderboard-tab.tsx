"use client"

import { useMemo } from "react"
import { Trophy, Medal, Award, Flame, TrendingUp } from "lucide-react"

interface LeaderboardEntry {
  id: string
  rank: number
  name: string
  points: number
  carbonSaved: number
  streak: number
}

interface LeaderboardTabProps {
  entries: LeaderboardEntry[]
  currentUserId: string
}

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        bg: "bg-gradient-to-r from-yellow-500/20 to-amber-500/20",
        border: "border-yellow-500/50",
        icon: <Trophy className="w-6 h-6 text-yellow-500" />,
        textColor: "text-yellow-500",
      }
    case 2:
      return {
        bg: "bg-gradient-to-r from-gray-300/20 to-slate-400/20",
        border: "border-gray-400/50",
        icon: <Medal className="w-6 h-6 text-gray-400" />,
        textColor: "text-gray-400",
      }
    case 3:
      return {
        bg: "bg-gradient-to-r from-orange-600/20 to-amber-700/20",
        border: "border-orange-600/50",
        icon: <Award className="w-6 h-6 text-orange-600" />,
        textColor: "text-orange-600",
      }
    default:
      return {
        bg: "bg-card",
        border: "border-border",
        icon: null,
        textColor: "text-muted-foreground",
      }
  }
}

export function LeaderboardTab({ entries, currentUserId }: LeaderboardTabProps) {
  const stats = useMemo(() => {
    const me = entries.find((e) => e.id === currentUserId) ?? null
    const top = entries[0] ?? null
    const totalUsers = entries.length
    const totalSaved = entries.reduce((acc, e) => acc + (e.carbonSaved ?? 0), 0)
    return { me, top, totalUsers, totalSaved }
  }, [entries, currentUserId])

  return (
    <div className="space-y-6 pb-28">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">참여자</p>
              <p className="text-lg font-black text-foreground truncate">
                {stats.totalUsers.toLocaleString()}명
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">1등 포인트</p>
              <p className="text-lg font-black text-foreground truncate">
                {stats.top ? stats.top.points.toLocaleString() : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">내 순위</p>
              <p className="text-lg font-black text-foreground truncate">
                {stats.me ? `${stats.me.rank}위` : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-secondary flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">합산 절약</p>
              <p className="text-lg font-black text-foreground truncate">
                {stats.totalSaved.toLocaleString()}kg
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="glass-card rounded-[2.5rem] p-8 border border-border">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Weekly Ranking
            </p>
            <p className="text-lg text-foreground mt-1">
              함께 <span className="text-primary font-black">{stats.totalSaved.toLocaleString()}kg</span>의 탄소를 절약했어요!
            </p>
          </div>
          <div className="w-12 h-12 rounded-3xl bg-primary/20 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="glass-card rounded-[2.5rem] p-4 md:p-5 border border-border">
        <div className="space-y-3">
          {entries.map((entry) => {
            const style = getRankStyle(entry.rank)
            const isCurrentUser = entry.id === currentUserId

            return (
              <div
                key={entry.id}
                className={`
                  rounded-3xl p-4 border transition-all
                  ${style.bg} ${style.border}
                  ${isCurrentUser ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                `}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0">
                    {style.icon || (
                      <span className={`text-xl font-bold ${style.textColor}`}>
                        {entry.rank}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground truncate">
                        {entry.name}
                      </p>
                      {isCurrentUser && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          나
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {entry.carbonSaved}kg 절약
                      </span>
                      {entry.streak > 0 && (
                        <span className="flex items-center gap-1 text-sm text-orange-500">
                          <Flame className="w-3 h-3" />
                          {entry.streak}일 연속
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-primary">
                      {entry.points.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">포인트</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
