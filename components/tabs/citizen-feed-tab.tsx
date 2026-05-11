"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
// ⭐️ 아이콘에 수정(Pencil), 삭제(Trash2) 추가
import {
  Heart,
  ImagePlus,
  Crown,
  Send,
  X,
  Pencil,
  Trash2,
  BarChart3,
  CalendarDays,
  TrendingUp,
} from "lucide-react"
import {
  CitizenPost,
  loadClaims,
  loadFeedAsync,
  markClaimed,
  saveNewPostAsync,
  updateLikesAsync,
  editPostAsync,      // ⭐️ 추가됨
  deletePostAsync,    // ⭐️ 추가됨
  weekKey,
} from "@/lib/citizen-feed-storage"

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function clampText(s: string, max = 200) {
  const t = s.trim()
  return t.length > max ? `${t.slice(0, max)}…` : t
}

export function CitizenFeedTab({
  nickname,
  onAwardPoints,
}: {
  nickname: string
  onAwardPoints: (delta: number, reason: string) => void
}) {
  const [posts, setPosts] = useState<CitizenPost[]>([])
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ⭐️ 수정 모드 상태 관리
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editBody, setEditBody] = useState("")

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const p = await loadFeedAsync()
        setPosts(p.sort((a, b) => b.createdAt - a.createdAt))
      } catch (error) {
        console.error("피드 불러오기 실패:", error)
      }
    }
    fetchPosts()
  }, [])

  const stats = useMemo(() => {
    const week = weekKey(new Date())
    const weekPosts = posts.filter((p) => weekKey(new Date(p.createdAt)) === week)

    const likesReceived: Record<string, number> = {}
    for (const p of weekPosts) {
      likesReceived[p.author] = (likesReceived[p.author] ?? 0) + (p.likedBy?.length ?? 0)
    }

    const ranked = Object.entries(likesReceived)
      .map(([author, likes]) => ({ author, likes }))
      .sort((a, b) => b.likes - a.likes)

    const top = ranked[0] ?? null
    const claims = loadClaims()
    const claimedBy = claims[week] ?? null

    return { week, weekPosts, ranked, top, claimedBy }
  }, [posts])

  const kpis = useMemo(() => {
    const weekPosts = stats.weekPosts
    const myPosts = weekPosts.filter((p) => p.author === nickname)

    let myLikesReceived = 0
    for (const p of weekPosts) {
      if (p.author !== nickname) continue
      myLikesReceived += p.likedBy?.length ?? 0
    }

    const bestLabel = stats.top ? `${stats.top.author} (${stats.top.likes})` : "—"
    return {
      weekPostCount: weekPosts.length,
      myPostCount: myPosts.length,
      myLikesReceived,
      bestLabel,
    }
  }, [nickname, stats.top, stats.weekPosts])

  const canClaim = useMemo(() => {
    if (!stats.top) return false
    if (stats.top.likes <= 0) return false
    if (stats.claimedBy) return false
    return stats.top.author === nickname
  }, [nickname, stats.claimedBy, stats.top])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => setImageDataUrl(event.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handlePost = async () => {
    const t = clampText(title, 60)
    const b = clampText(body, 400)
    if (!t || !b || isSubmitting) return

    setIsSubmitting(true)

    const newPost: CitizenPost = {
      id: uid(),
      author: nickname,
      title: t,
      body: b,
      imageDataUrl,
      createdAt: Date.now(),
      likedBy: [],
    }
    
    setPosts(prev => [newPost, ...prev].sort((a, b) => b.createdAt - a.createdAt))
    setTitle("")
    setBody("")
    setImageDataUrl(undefined)

    try {
      await saveNewPostAsync(newPost)
    } catch (e) {
      console.error("새 글 저장 실패:", e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleLike = async (postId: string) => {
    const targetPost = posts.find((p) => p.id === postId)
    if (!targetPost) return

    const likedBy = Array.isArray(targetPost.likedBy) ? targetPost.likedBy : []
    const hasLiked = likedBy.includes(nickname)
    const updatedLikedBy = hasLiked
      ? likedBy.filter((u) => u !== nickname)
      : [...likedBy, nickname]

    const next = posts.map((p) => {
      if (p.id !== postId) return p
      return { ...p, likedBy: updatedLikedBy }
    })
    setPosts(next.sort((a, b) => b.createdAt - a.createdAt))

    try {
      await updateLikesAsync(postId, updatedLikedBy)
    } catch (e) {
      console.error("좋아요 업데이트 실패:", e)
    }
  }

  // ⭐️ 수정 시작 핸들러
  const handleEditStart = (post: CitizenPost) => {
    setEditingPostId(post.id)
    setEditTitle(post.title)
    setEditBody(post.body)
  }

  // ⭐️ 수정 취소 핸들러
  const handleEditCancel = () => {
    setEditingPostId(null)
    setEditTitle("")
    setEditBody("")
  }

  // ⭐️ 수정 완료 저장 핸들러
  const handleEditSave = async (postId: string) => {
    const t = clampText(editTitle, 60)
    const b = clampText(editBody, 400)
    if (!t || !b) return

    // 낙관적 업데이트 (화면 먼저 적용)
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, title: t, body: b } : p))
    setEditingPostId(null)

    try {
      await editPostAsync(postId, t, b)
    } catch (e) {
      console.error("게시글 수정 실패:", e)
    }
  }

  // ⭐️ 삭제 핸들러
  const handleDelete = async (postId: string) => {
    if (!window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) return

    // 낙관적 업데이트 (화면에서 우선 숨김)
    setPosts(prev => prev.filter(p => p.id !== postId))

    try {
      await deletePostAsync(postId)
    } catch (e) {
      console.error("게시글 삭제 실패:", e)
    }
  }

  const claimWeeklyReward = () => {
    if (!stats.top) return
    if (!canClaim) return
    const BONUS = 200
    markClaimed(stats.week, nickname)
    onAwardPoints(BONUS, "시민 기자단 주간 1등 보상")
  }

  return (
    <div className="space-y-6 pb-28">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">이번주 글</p>
              <p className="text-lg font-black text-foreground truncate">
                {kpis.weekPostCount.toLocaleString()}개
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">내 글</p>
              <p className="text-lg font-black text-foreground truncate">
                {kpis.myPostCount.toLocaleString()}개
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <Heart className="w-4 h-4 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">이번주 받은 좋아요</p>
              <p className="text-lg font-black text-foreground truncate">
                {kpis.myLikesReceived.toLocaleString()}
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
              <p className="text-xs text-muted-foreground">베스트</p>
              <p className="text-lg font-black text-foreground truncate">{kpis.bestLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] p-8 border border-border">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Citizen Feed
            </p>
            <h3 className="text-xl font-bold text-foreground truncate mt-1">
              에코 꿀팁 공유 피드
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              사진 + 짧은 기사처럼 공유하고, 좋아요 1등은 주간 보너스 포인트!
            </p>
          </div>
          <div className="w-12 h-12 rounded-3xl bg-primary/20 flex items-center justify-center">
            <Crown className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {stats.top && stats.top.likes > 0 && (
        <div className="glass-morphism rounded-[2.5rem] p-8 border border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">이번 주 베스트 시민 기자</p>
              <p className="text-lg font-bold text-foreground truncate">
                {stats.top.author} · 좋아요 {stats.top.likes}개
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.claimedBy ? `보상 지급 완료 (${stats.claimedBy})` : "보상 미지급"}
              </p>
            </div>
            <button
              onClick={claimWeeklyReward}
              disabled={!canClaim}
              className="bg-primary text-primary-foreground px-5 py-4 rounded-2xl font-black disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_20px_50px_rgba(74,222,128,0.25)]"
            >
              {canClaim ? "보상 받기 (+200P)" : "보상 받기"}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* composer */}
        <div className="glass-morphism rounded-[2.5rem] p-8 border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">새 글 작성</h3>
            <span className="text-xs font-bold text-muted-foreground bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-2 py-1 rounded-full">
              {nickname}
            </span>
          </div>

        <input
          type="file"
          ref={fileRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 텀블러 30일 챌린지 후기"
            className="w-full bg-black/5 dark:bg-white/5 rounded-2xl px-6 py-5 text-base font-bold text-foreground placeholder:text-muted-foreground/60 border border-black/10 dark:border-white/10 focus:border-primary/50 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">내용</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="짧은 기사/SNS 스토리처럼 공유해보세요. (분리수거 팁, 생활 실천, before/after 등)"
            className="w-full min-h-28 bg-black/5 dark:bg-white/5 rounded-2xl px-6 py-5 text-base font-medium text-foreground placeholder:text-muted-foreground/60 border border-black/10 dark:border-white/10 focus:border-primary/50 outline-none transition-all resize-none"
          />
        </div>

        {!imageDataUrl ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full bg-black/5 dark:bg-white/5 rounded-2xl py-4 border border-black/10 dark:border-white/10 hover:border-primary/40 transition flex items-center justify-center gap-2 text-foreground font-semibold"
          >
            <ImagePlus className="w-5 h-5 text-primary" />
            사진 추가
          </button>
        ) : (
          <div className="relative">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-secondary border border-border">
              <Image src={imageDataUrl} alt="post image" fill unoptimized className="object-cover" />
            </div>
            <button
              onClick={() => setImageDataUrl(undefined)}
              className="absolute top-3 right-3 w-10 h-10 rounded-2xl bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
        )}

        <button
          onClick={handlePost}
          disabled={!title.trim() || !body.trim() || isSubmitting}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-black transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_20px_50px_rgba(74,222,128,0.25)]"
        >
          <Send className="w-5 h-5" />
          {isSubmitting ? "게시 중..." : "게시하기"}
        </button>
        </div>

        {/* feed list */}
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="glass-card rounded-[2.5rem] p-10 border border-border text-center text-muted-foreground">
              아직 올라온 글이 없어요. 첫 번째 시민 기자가 되어보세요!
            </div>
          ) : (
            posts.map((p) => {
              const liked = (p.likedBy ?? []).includes(nickname)
              const likeCount = p.likedBy?.length ?? 0
              const isEditing = editingPostId === p.id

              return (
                <div
                  key={p.id}
                  className="glass-card rounded-[2.5rem] border border-border overflow-hidden"
                >
                  {p.imageDataUrl && (
                    <div className="relative aspect-[16/9] bg-secondary">
                      <Image
                        src={p.imageDataUrl}
                        alt={p.title}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-muted-foreground">{p.author}</p>

                        {isEditing ? (
                          <input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full mt-1 bg-black/5 dark:bg-white/5 rounded-2xl px-4 py-3 text-lg font-bold border border-black/10 dark:border-white/10 focus:border-primary/50 outline-none"
                          />
                        ) : (
                          <p className="text-lg font-bold text-foreground truncate">
                            {p.title}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {p.author === nickname && !isEditing && (
                          <div className="flex items-center border border-border rounded-2xl overflow-hidden mr-1">
                            <button
                              onClick={() => handleEditStart(p)}
                              className="p-2.5 bg-black/5 dark:bg-white/5 hover:bg-primary/10 transition text-muted-foreground hover:text-primary"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <div className="w-[1px] h-4 bg-border"></div>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-2.5 bg-black/5 dark:bg-white/5 hover:bg-red-500/10 transition text-muted-foreground hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => toggleLike(p.id)}
                          className={`px-4 py-2 rounded-2xl border transition flex items-center gap-2 ${
                            liked
                              ? "bg-primary text-primary-foreground border-primary/50"
                              : "bg-black/5 dark:bg-white/5 text-foreground border-black/10 dark:border-white/10 hover:border-primary/40"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${liked ? "" : "text-primary"}`} />
                          <span className="font-semibold">{likeCount}</span>
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3 pt-2 border-t border-border mt-3">
                        <textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          className="w-full min-h-[100px] bg-black/5 dark:bg-white/5 rounded-2xl px-4 py-3 text-sm border border-black/10 dark:border-white/10 focus:border-primary/50 outline-none resize-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={handleEditCancel}
                            className="px-4 py-2 rounded-xl text-sm font-semibold bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground transition border border-black/10 dark:border-white/10"
                          >
                            취소
                          </button>
                          <button
                            onClick={() => handleEditSave(p.id)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {p.body}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      {new Date(p.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  )
}
