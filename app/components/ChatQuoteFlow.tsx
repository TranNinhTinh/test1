'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { chatService, type Message, MessageType } from '@/lib/api/chat.service'
import { chatSocketService } from '@/lib/api/chat-socket.service'
import { quoteService } from '@/lib/api/quote.service'
import { orderService } from '@/lib/api/order.service'
import { PostService } from '@/lib/api/post.service'
import { resolveMediaUrl } from '@/lib/media-url'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHourglass, faPaperPlane, faMoneyBillWave, faClipboardList, faCircleXmark, faCircleCheck, faLock } from '@fortawesome/free-solid-svg-icons'

interface User {
    id: string
    fullName?: string
    displayName?: string
    avatar?: string
}

interface ChatQuoteFlowProps {
    conversationId: string
    quoteId?: string
    currentUser: User
    otherUser: User
    currentUserRole?: 'CUSTOMER' | 'PROVIDER'
    isClosed?: boolean
}

function normalizeQuoteStatusKey(status: string | null | undefined): string {
    return (status ?? '').toLowerCase().replace(/-/g, '_').trim()
}

export default function ChatQuoteFlow({
    conversationId,
    quoteId,
    currentUser,
    otherUser,
    currentUserRole = 'CUSTOMER',
    isClosed = false
}: ChatQuoteFlowProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [sendError, setSendError] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Modal states
    const [showPlaceOrderModal, setShowPlaceOrderModal] = useState(false)
    const [selectedQuoteData, setSelectedQuoteData] = useState<any>(null)
    const [orderLoading, setOrderLoading] = useState(false)
    const [orderError, setOrderError] = useState('')

    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [confirmLoading, setConfirmLoading] = useState(false)
    const [confirmError, setConfirmError] = useState('')

    const [latestQuoteId, setLatestQuoteId] = useState<string | undefined>(quoteId)
    const [latestPostTitle, setLatestPostTitle] = useState<string>('')

    /** Trạng thái quote từ API — thợ luôn thấy CTA xác nhận khi khách đã request order (order_requested). */
    const [providerQuoteStatus, setProviderQuoteStatus] = useState<string | null>(null)
    const quoteStatusRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const hasConversationId = Boolean(conversationId)
    const hasCurrentUserId = Boolean(currentUser?.id)

    const parseFileUrls = (fileUrls: unknown): string[] => {
        if (Array.isArray(fileUrls)) {
            return fileUrls.map((item) => String(item)).filter(Boolean)
        }

        if (typeof fileUrls !== 'string') {
            return []
        }

        const raw = fileUrls.trim()
        if (!raw) return []

        // Accept JSON array string: ["url1", "url2"]
        if (raw.startsWith('[') && raw.endsWith(']')) {
            try {
                const parsed = JSON.parse(raw)
                return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : []
            } catch {
                return []
            }
        }

        // Accept Postgres text[] style: {url1,url2}
        if (raw.startsWith('{') && raw.endsWith('}')) {
            return raw
                .slice(1, -1)
                .split(',')
                .map((item) => item.trim().replace(/^"|"$/g, ''))
                .filter(Boolean)
        }

        return [raw]
    }

    const isImageUrl = (url: string) => {
        const lower = url.toLowerCase()
        return /(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.svg)(\?.*)?$/.test(lower)
            || lower.includes('/image/')
            || lower.includes('format=image')
    }

    const getMessageMediaUrls = (msg: Message) => {
        return parseFileUrls((msg as any).fileUrls)
            .map((url) => resolveMediaUrl(url))
            .filter(Boolean)
    }

    /** Chuẩn hóa payload từ socket/DB để so sánh id và hiển thị ổn định */
    const normalizeIncomingMessage = (raw: any): Message => {
        const created =
            raw?.createdAt instanceof Date
                ? raw.createdAt.toISOString()
                : typeof raw?.createdAt === 'string'
                  ? raw.createdAt
                  : new Date().toISOString()
        return {
            id: String(raw?.id ?? ''),
            conversationId: String(raw?.conversationId ?? conversationId),
            senderId: String(raw?.senderId ?? ''),
            type: (raw?.type as string) || MessageType.TEXT,
            content: raw?.content ?? '',
            fileUrls: parseFileUrls(raw?.fileUrls),
            isRead: Boolean(raw?.isRead),
            readAt:
                typeof raw?.readAt === 'string'
                    ? raw.readAt
                    : raw?.readAt instanceof Date
                      ? raw.readAt.toISOString()
                      : undefined,
            createdAt: created,
        }
    }

    const appendMessageDeduped = (raw: any) => {
        const m = normalizeIncomingMessage(raw)
        if (!m.id) return
        setMessages((prev) => {
            if (prev.some((x) => x.id === m.id)) return prev
            return [...prev, m].sort(
                (a, b) =>
                    new Date(String(a.createdAt)).getTime() -
                    new Date(String(b.createdAt)).getTime(),
            )
        })
    }

    const refreshProviderQuoteStatus = useCallback(async () => {
        if (!quoteId || currentUserRole !== 'PROVIDER') return
        try {
            const raw = await quoteService.getQuoteById(quoteId)
            const payload = raw as unknown as { data?: { status?: string }; status?: string }
            const q = payload?.data ?? payload
            const st = typeof q?.status === 'string' ? q.status : null
            setProviderQuoteStatus(st)
        } catch {
            setProviderQuoteStatus(null)
        }
    }, [quoteId, currentUserRole])

    useEffect(() => {
        setLatestQuoteId(quoteId)
        if (!quoteId || !otherUser?.id) return

        const loadLatestQuoteContext = async () => {
            try {
                if (currentUserRole === 'PROVIDER') {
                    const myQuotes = await quoteService.getMyQuotes()
                    const sorted = [...myQuotes].sort(
                        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    for (const q of sorted) {
                        if (!q.postId) continue
                        try {
                            const post = await PostService.getPostById(q.postId)
                            const postCustomerId = post.customerId || (post as any).customer?.id
                            if (postCustomerId === otherUser.id) {
                                setLatestQuoteId(q.id)
                                setLatestPostTitle(post.title)
                                break
                            }
                        } catch {
                            continue
                        }
                    }
                } else {
                    const q = await quoteService.getQuoteById(quoteId)
                    const postId = (q as any).postId
                    if (postId) {
                        const post = await PostService.getPostById(postId)
                        setLatestPostTitle(post.title)
                    }
                }
            } catch {
                // best-effort; fall back to quoteId prop
            }
        }

        void loadLatestQuoteContext()
    }, [quoteId, otherUser?.id, currentUserRole])

    useEffect(() => {
        setProviderQuoteStatus(null)
        if (!quoteId || currentUserRole !== 'PROVIDER') return
        void refreshProviderQuoteStatus()
    }, [quoteId, currentUserRole, refreshProviderQuoteStatus])

    useEffect(() => {
        if (!quoteId || currentUserRole !== 'PROVIDER') return
        const onFocus = () => {
            void refreshProviderQuoteStatus()
        }
        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
    }, [quoteId, currentUserRole, refreshProviderQuoteStatus])

    // Load messages via REST API - match code mẫu
    const loadMessages = async () => {
        try {
            console.log('📨 Loading messages for conversation:', conversationId)
            setLoading(true)
            const data = await chatService.getMessages(conversationId)
            console.log('✅ Raw messages response:', data)

            // Handle both wrapped và unwrapped responses (match code mẫu)
            const messageList = Array.isArray(data) ? data : (data as any)?.messages || []
            console.log('✅ Final messages to display:', messageList.length, 'messages')
            setMessages(messageList)
        } catch (error: any) {
            console.error('❌ Failed to load messages:', error.message)
            setMessages([])
        } finally {
            setLoading(false)
        }
    }

    // Initialize on mount
    useEffect(() => {
        if (!hasConversationId || !hasCurrentUserId) {
            setLoading(false)
            return
        }

        // Ensure socket is connected (match code mẫu)
        if (!chatSocketService.isConnected()) {
            console.log('🔌 Chat socket not connected, connecting...')
            chatSocketService.connect()
            // Wait a bit for connection
            setTimeout(() => {
                chatSocketService.joinConversation(conversationId).then((res) => {
                    console.log('📥 Joined conversation:', res)
                })
            }, 500)
        } else {
            chatSocketService.joinConversation(conversationId).then((res) => {
                console.log('📥 Joined conversation:', res)
            })
        }

        // Load messages first
        loadMessages()

        // Listen for new messages (match code mẫu - Kiểm tra xem message đã tồn tại chưa)
        const unsubscribeNewMessage = chatSocketService.on('new_message', (data: any) => {
            if (data.conversationId === conversationId && data.message) {
                appendMessageDeduped(data.message)
            }
            if (
                data.conversationId === conversationId &&
                quoteId &&
                currentUserRole === 'PROVIDER'
            ) {
                if (quoteStatusRefreshTimerRef.current) {
                    clearTimeout(quoteStatusRefreshTimerRef.current)
                }
                quoteStatusRefreshTimerRef.current = setTimeout(() => {
                    quoteStatusRefreshTimerRef.current = null
                    void refreshProviderQuoteStatus()
                }, 500)
            }
        })

        // Listen for messages read
        const unsubscribeMessagesRead = chatSocketService.on('messages_read', (data: any) => {
            if (data.conversationId !== conversationId || !data.readBy) return
            // Backend đánh đọc tin từ người khác khi readBy mở hội thoại — cập nhật local, không gọi REST lại
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.senderId !== data.readBy
                        ? { ...msg, isRead: true, readAt: new Date().toISOString() }
                        : msg,
                ),
            )
        })

        // Cleanup
        return () => {
            unsubscribeNewMessage()
            unsubscribeMessagesRead()
            chatSocketService.leaveConversation(conversationId)
            if (quoteStatusRefreshTimerRef.current) {
                clearTimeout(quoteStatusRefreshTimerRef.current)
                quoteStatusRefreshTimerRef.current = null
            }
        }
    }, [
        conversationId,
        hasConversationId,
        hasCurrentUserId,
        quoteId,
        currentUserRole,
        refreshProviderQuoteStatus,
    ])

    // Auto scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Send message via Socket with fallback to REST (match code mẫu)
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        try {
            setSending(true)
            setSendError(null)
            console.log('📤 Sending message via Socket:', { conversationId, content: newMessage })

            // Ensure socket is connected
            if (!chatSocketService.isConnected()) {
                console.log('🔌 Socket not connected, connecting...')
                chatSocketService.connect()
                // Wait for connection
                await new Promise(resolve => setTimeout(resolve, 500))
            }

            // Try Socket first
            const response = await chatSocketService.sendMessage(conversationId, {
                type: 'text',
                content: newMessage
            })

            if (response.success) {
                // Realtime: hiển thị ngay từ ack (backend đã lưu DB); new_message tới sau vẫn dedupe theo id
                if (response.message) {
                    appendMessageDeduped(response.message)
                }
                setNewMessage('')
            } else {
                throw new Error(response.error || 'Unknown socket error')
            }
        } catch (error: any) {
            console.error('❌ Socket send failed, trying REST fallback:', error.message)

            // Fallback to REST (match code mẫu)
            try {
                const restResponse = await chatService.sendMessage(conversationId, {
                    type: MessageType.TEXT,
                    content: newMessage
                })
                console.log('✅ REST response:', restResponse)
                setNewMessage('')
                // Reload messages từ REST
                const msgs = await chatService.getMessages(conversationId)
                const messageList = Array.isArray(msgs) ? msgs : (msgs as any)?.messages || []
                setMessages(messageList)
            } catch (restError: any) {
                console.error('❌ Both Socket and REST failed:', restError.message)
                setSendError(restError.message || 'Failed to send message')
            }
        } finally {
            setSending(false)
        }
    }

    // Revise quote
    const handleReviseQuote = async (newPrice: number, newDescription: string) => {
        const activeQuoteId = latestQuoteId ?? quoteId
        if (!activeQuoteId) {
            alert('❌ Không tìm thấy báo giá')
            return
        }

        try {
            setOrderLoading(true)
            setOrderError('')

            await quoteService.reviseQuote(activeQuoteId, {
                price: newPrice,
                description: newDescription
            })

            const titlePart = latestPostTitle ? ` [${latestPostTitle}]` : ''
            // Send via Socket with fallback to REST
            const payload = {
                type: 'text' as const,
                content: `Thợ chào giá${titlePart}: ${newPrice.toLocaleString()}đ - ${newDescription}`
            }

            const response = await chatSocketService.sendMessage(conversationId, payload)
            if (response.success && response.message) {
                appendMessageDeduped(response.message)
            } else if (!response.success) {
                await chatService.sendMessage(conversationId, {
                    type: MessageType.TEXT,
                    content: payload.content
                })
                const msgs = await chatService.getMessages(conversationId)
                setMessages(Array.isArray(msgs) ? msgs : (msgs as any)?.messages || [])
            }
            alert('✅ Chào giá lại thành công!')
        } catch (error: any) {
            console.error('❌ Revision error:', error)
            setOrderError(error.message)
            alert('❌ ' + (error.message || 'Lỗi chào giá'))
        } finally {
            setOrderLoading(false)
        }
    }

    // Place order
    const handlePlaceOrder = async () => {
        if (!selectedQuoteData || !quoteId) return

        try {
            setOrderLoading(true)
            setOrderError('')

            // 🔴 FIX: Call requestOrder API FIRST to change quote status to ORDER_REQUESTED
            console.log('📋 Requesting order for quote:', quoteId)
            await quoteService.requestOrder(quoteId)
            console.log('✅ Quote status changed to ORDER_REQUESTED')

            // Then send message notification
            const titlePart = latestPostTitle ? ` [${latestPostTitle}]` : ''
            const payload = {
                type: 'text' as const,
                content: `Khách đặt đơn${titlePart} với giá: ${selectedQuoteData.price.toLocaleString()}đ`
            }

            const response = await chatSocketService.sendMessage(conversationId, payload)
            if (response.success && response.message) {
                appendMessageDeduped(response.message)
            } else if (!response.success) {
                await chatService.sendMessage(conversationId, {
                    type: MessageType.TEXT,
                    content: payload.content
                })
                const msgs = await chatService.getMessages(conversationId)
                setMessages(Array.isArray(msgs) ? msgs : (msgs as any)?.messages || [])
            }

            setShowPlaceOrderModal(false)
            setSelectedQuoteData(null)

            alert('✅ Đặt đơn thành công! Vui lòng chờ thợ xác nhận.')
        } catch (error: any) {
            console.error('❌ Place order error:', error)
            setOrderError(error.message)
        } finally {
            setOrderLoading(false)
        }
    }

    // Confirm order
    const handleConfirmOrder = async () => {
        if (!quoteId) {
            alert('❌ Không tìm thấy báo giá')
            return
        }

        try {
            setConfirmLoading(true)
            setConfirmError('')

            await orderService.confirmFromQuote(quoteId)

            setShowConfirmModal(false)
            await refreshProviderQuoteStatus()
            alert('✅ Đã tạo đơn hàng thành công!')
        } catch (error: any) {
            console.error('❌ Confirm order error:', error)
            setConfirmError(error.message)
            alert('❌ ' + (error.message || 'Lỗi xác nhận'))
        } finally {
            setConfirmLoading(false)
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-96"><FontAwesomeIcon icon={faHourglass} className="mr-2" />Đang tải...</div>
    }

    if (!hasConversationId) {
        return (
            <div className="flex items-center justify-center h-96 text-red-600">
                <FontAwesomeIcon icon={faCircleXmark} className="mr-1" />Không tìm thấy ID cuộc trò chuyện
            </div>
        )
    }

    if (!hasCurrentUserId) {
        return (
            <div className="flex items-center justify-center h-96 text-red-600">
                <FontAwesomeIcon icon={faCircleXmark} className="mr-1" />Không tìm thấy thông tin người dùng hiện tại
            </div>
        )
    }

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white rounded-lg shadow-lg">
            {/* ⚠️ Closed Conversation Warning */}
            {isClosed && (
                <div className="bg-yellow-50 border-b-2 border-yellow-400 p-3">
                    <div className="flex items-center gap-2 text-yellow-800 text-sm">
                        <FontAwesomeIcon icon={faLock} />
                        <p>Cuộc trò chuyện này đã bị đóng. Bạn không thể gửi tin nhắn, nhưng vẫn có thể xem lịch sử.</p>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>Không có tin nhắn nào</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwn = msg.senderId === currentUser.id
                        const mediaUrls = getMessageMediaUrls(msg)
                        const hasMedia = mediaUrls.length > 0
                        const isImageMessage = msg.type === MessageType.IMAGE

                        return (
                            <div key={msg.id || Math.random()} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwn ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                    {msg.content?.includes('Thợ chào giá') ? (
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold"><FontAwesomeIcon icon={faMoneyBillWave} className="mr-1" />Báo giá</p>
                                            <p className="text-sm">{msg.content}</p>
                                            {!isOwn && currentUserRole === 'CUSTOMER' && (
                                                <button
                                                    onClick={() => {
                                                        const priceMatch = msg.content?.match(/(\d+)đ/)
                                                        setSelectedQuoteData({
                                                            price: priceMatch ? parseInt(priceMatch[1]) : 0,
                                                            description: msg.content || ''
                                                        })
                                                        setShowPlaceOrderModal(true)
                                                    }}
                                                    className="mt-2 text-xs bg-white text-blue-600 px-2 py-1 rounded hover:bg-blue-50"
                                                >
                                                    Đặt đơn
                                                </button>
                                            )}
                                        </div>
                                    ) : msg.content?.includes('Khách đặt đơn') || msg.content?.includes('xác nhận') ? (
                                        <div className="space-y-2">
                                            <p className="text-sm font-semibold"><FontAwesomeIcon icon={faClipboardList} className="mr-1" />Đơn hàng</p>
                                            <p className="text-sm">{msg.content}</p>
                                            {!isOwn && currentUserRole === 'PROVIDER' && !msg.content?.includes('xác nhận') && (
                                                <button
                                                    onClick={() => setShowConfirmModal(true)}
                                                    className="mt-2 text-xs bg-white text-green-600 px-2 py-1 rounded hover:bg-green-50"
                                                >
                                                    Xác nhận nhận việc
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {msg.content && <p>{msg.content}</p>}
                                            {hasMedia && (
                                                <div className={`grid gap-2 ${mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                                    {mediaUrls.map((url, index) => (
                                                        <a
                                                            key={`${msg.id || 'msg'}-media-${index}`}
                                                            href={url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="block"
                                                        >
                                                            {isImageMessage || isImageUrl(url) ? (
                                                                <img
                                                                    src={url}
                                                                    alt={`attachment-${index + 1}`}
                                                                    className="w-full max-h-60 object-cover rounded-md border border-black/10"
                                                                    loading="lazy"
                                                                />
                                                            ) : (
                                                                <div className={`text-xs rounded-md px-3 py-2 border ${isOwn ? 'border-white/40 bg-white/10 text-white' : 'border-gray-300 bg-white text-gray-700'}`}>
                                                                    📎 Mở tệp đính kèm {index + 1}
                                                                </div>
                                                            )}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <p className="text-xs mt-1 opacity-70">
                                        {new Date(msg.createdAt).toLocaleTimeString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Thợ: luôn có CTA khi API báo khách đã request order — không phụ thuộc tìm đúng bubble chat */}
            {!isClosed &&
                currentUserRole === 'PROVIDER' &&
                quoteId &&
                normalizeQuoteStatusKey(providerQuoteStatus) === 'order_requested' && (
                    <div className="px-4 py-3 border-t border-green-200 bg-green-50 shrink-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-green-900">
                                <p className="font-semibold">Khách đã đặt đơn</p>
                                <p className="mt-0.5 text-green-800">
                                    Xác nhận nhận việc để tạo đơn và bắt đầu làm (đơn chuyển sang đang tiến hành).
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(true)}
                                className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                            >
                                Xác nhận nhận việc
                            </button>
                        </div>
                    </div>
                )}

            {/* Action: Thợ chào giá lại */}
            {currentUserRole === 'PROVIDER' && (
                <ReviseQuoteForm onSubmit={handleReviseQuote} loading={orderLoading} postTitle={latestPostTitle} />
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
                {sendError && (
                    <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center justify-between">
                        <span><FontAwesomeIcon icon={faCircleXmark} className="mr-1" />{sendError}</span>
                        <button onClick={() => setSendError(null)} className="text-red-700 hover:text-red-900 font-bold">
                            ✕
                        </button>
                    </div>
                )}
                {isClosed && (
                    <div className="mb-3 p-3 bg-gray-100 text-gray-700 rounded-lg text-sm">
                        <FontAwesomeIcon icon={faLock} className="mr-1" />Cuộc trò chuyện đã đóng. Bạn không thể gửi tin nhắn.
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isClosed ? 'Cuộc trò chuyện đã đóng' : 'Nhập tin nhắn...'}
                        className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isClosed ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        disabled={sending || isClosed}
                    />
                    <button
                        type="submit"
                        disabled={sending || !newMessage.trim() || isClosed}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <FontAwesomeIcon icon={sending ? faHourglass : faPaperPlane} />
                    </button>
                </form>
            </div>

            {/* Modals */}
            {showPlaceOrderModal && selectedQuoteData && (
                <PlaceOrderModal
                    quoteData={selectedQuoteData}
                    loading={orderLoading}
                    error={orderError}
                    onConfirm={handlePlaceOrder}
                    onCancel={() => setShowPlaceOrderModal(false)}
                />
            )}
            {showConfirmModal && (
                <ConfirmOrderModal
                    loading={confirmLoading}
                    error={confirmError}
                    onConfirm={handleConfirmOrder}
                    onCancel={() => setShowConfirmModal(false)}
                />
            )}
        </div>
    )
}

function ReviseQuoteForm({ onSubmit, loading, postTitle }: { onSubmit: (price: number, desc: string) => void; loading: boolean; postTitle?: string }) {
    const [price, setPrice] = useState(0)
    const [description, setDescription] = useState('')
    const [showForm, setShowForm] = useState(false)

    if (!showForm) {
        return (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium"
                >
                    <FontAwesomeIcon icon={faMoneyBillWave} className="mr-1" />Chào giá lại{postTitle ? ` — ${postTitle}` : ''}
                </button>
            </div>
        )
    }

    return (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 space-y-2">
            <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="Giá dịch vụ"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <div className="flex gap-2">
                <button
                    onClick={() => setShowForm(false)}
                    disabled={loading}
                    className="flex-1 px-3 py-1 bg-gray-300 text-gray-800 rounded text-sm hover:bg-gray-400 disabled:bg-gray-200"
                >
                    Hủy
                </button>
                <button
                    onClick={() => {
                        onSubmit(price, description)
                        setShowForm(false)
                        setPrice(0)
                        setDescription('')
                    }}
                    disabled={loading || price === 0}
                    className="flex-1 px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:bg-orange-300"
                >
                    {loading ? <FontAwesomeIcon icon={faHourglass} /> : 'Gửi'}
                </button>
            </div>
        </div>
    )
}

function PlaceOrderModal({
    quoteData,
    loading,
    error,
    onConfirm,
    onCancel,
}: {
    quoteData: any
    loading: boolean
    error: string
    onConfirm: () => void
    onCancel: () => void
}) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-sm mx-4 p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-4"><FontAwesomeIcon icon={faClipboardList} className="mr-2" />Đặt đơn</h2>
                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600">{quoteData.description}</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">{quoteData.price.toLocaleString()}đ</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:bg-gray-200"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300"
                    >
                        {loading ? <><FontAwesomeIcon icon={faHourglass} className="mr-1" />Đang...</> : <><FontAwesomeIcon icon={faCircleCheck} className="mr-1" />Đặt đơn</>}
                    </button>
                </div>
            </div>
        </div>
    )
}

function ConfirmOrderModal({
    loading,
    error,
    onConfirm,
    onCancel,
}: {
    loading: boolean
    error: string
    onConfirm: () => void
    onCancel: () => void
}) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-sm mx-4 p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-4"><FontAwesomeIcon icon={faCircleCheck} className="mr-2" />Xác nhận nhận việc</h2>
                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}
                <div className="bg-green-50 p-4 rounded-lg mb-4 text-sm text-gray-700">
                    Bằng cách xác nhận, bạn cam kết hoàn thành công việc. Đơn hàng sẽ chuyển sang trạng thái &quot;Đang tiến hành&quot;.
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 disabled:bg-gray-200"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300"
                    >
                        {loading ? <><FontAwesomeIcon icon={faHourglass} className="mr-1" />Đang...</> : <><FontAwesomeIcon icon={faCircleCheck} className="mr-1" />Xác nhận</>}
                    </button>
                </div>
            </div>
        </div>
    )
}
