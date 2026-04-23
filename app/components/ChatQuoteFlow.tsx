'use client'

import { useState, useEffect, useRef } from 'react'
import { chatService, type Message, MessageType } from '@/lib/api/chat.service'
import { chatSocketService } from '@/lib/api/chat-socket.service'
import { quoteService } from '@/lib/api/quote.service'
import { orderService } from '@/lib/api/order.service'

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

    const hasConversationId = Boolean(conversationId)
    const hasCurrentUserId = Boolean(currentUser?.id)

    const normalizeMediaUrl = (rawUrl?: string | null) => {
        if (!rawUrl) return ''
        const cleanUrl = rawUrl.trim()
        if (!cleanUrl) return ''

        if (/^https?:\/\//i.test(cleanUrl) || cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) {
            return cleanUrl
        }

        const apiDomain = (process.env.NEXT_PUBLIC_API_DOMAIN || process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/v1\/?$/, '')
        if (!apiDomain) return cleanUrl

        if (cleanUrl.startsWith('/')) {
            return `${apiDomain}${cleanUrl}`
        }

        return `${apiDomain}/${cleanUrl}`
    }

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
            .map((url) => normalizeMediaUrl(url))
            .filter(Boolean)
    }

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
            console.log('💬 new_message event:', data)

            // Update messages nếu đang mở conversation này
            if (data.conversationId === conversationId) {
                setMessages((prevMessages) => {
                    // Kiểm tra xem message đã tồn tại chưa (tránh duplicate)
                    const exists = prevMessages.some((m) => m.id === data.message.id)
                    if (exists) {
                        console.log('Message already exists, skipping...')
                        return prevMessages
                    }
                    console.log('Adding new message to list')
                    return [...prevMessages, data.message]
                })
            }
        })

        // Listen for messages read
        const unsubscribeMessagesRead = chatSocketService.on('messages_read', (data: any) => {
            console.log('✅ messages_read event:', data)
            if (data.conversationId === conversationId) {
                loadMessages()
            }
        })

        // Cleanup
        return () => {
            unsubscribeNewMessage()
            unsubscribeMessagesRead()
            chatSocketService.leaveConversation(conversationId)
        }
    }, [conversationId, hasConversationId, hasCurrentUserId])

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

            console.log('✅ send_message ack:', response)

            if (response.success) {
                // Không cần thêm message vào state ở đây nữa
                // Vì sẽ nhận qua event 'new_message'
                console.log('Message sent successfully, waiting for new_message event...')
                setNewMessage('')
                // Message sẽ tự động update qua new_message event listener
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
        if (!quoteId) {
            alert('❌ Không tìm thấy báo giá')
            return
        }

        try {
            setOrderLoading(true)
            setOrderError('')

            await quoteService.reviseQuote(quoteId, {
                price: newPrice,
                description: newDescription
            })

            // Send via Socket with fallback to REST
            const payload = {
                type: 'text' as const,
                content: `Thợ chào giá: ${newPrice.toLocaleString()}đ - ${newDescription}`
            }

            const response = await chatSocketService.sendMessage(conversationId, payload)
            if (!response.success) {
                // Fallback to REST
                await chatService.sendMessage(conversationId, {
                    type: MessageType.TEXT,
                    content: payload.content
                })
            }

            const msgs = await chatService.getMessages(conversationId)
            setMessages(Array.isArray(msgs) ? msgs : (msgs as any)?.messages || [])
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
            const payload = {
                type: 'text' as const,
                content: `Khách đặt đơn với giá: ${selectedQuoteData.price.toLocaleString()}đ`
            }

            const response = await chatSocketService.sendMessage(conversationId, payload)
            if (!response.success) {
                await chatService.sendMessage(conversationId, {
                    type: MessageType.TEXT,
                    content: payload.content
                })
            }

            setShowPlaceOrderModal(false)
            setSelectedQuoteData(null)

            const msgs = await chatService.getMessages(conversationId)
            setMessages(Array.isArray(msgs) ? msgs : (msgs as any)?.messages || [])

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

            const payload = {
                type: 'text' as const,
                content: '✅ Thợ đã xác nhận nhận việc. Đơn hàng được tạo.'
            }

            const response = await chatSocketService.sendMessage(conversationId, payload)
            if (!response.success) {
                await chatService.sendMessage(conversationId, {
                    type: MessageType.TEXT,
                    content: payload.content
                })
            }

            setShowConfirmModal(false)

            const msgs = await chatService.getMessages(conversationId)
            setMessages(Array.isArray(msgs) ? msgs : (msgs as any)?.messages || [])

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
        return <div className="flex items-center justify-center h-96">⏳ Đang tải...</div>
    }

    if (!hasConversationId) {
        return (
            <div className="flex items-center justify-center h-96 text-red-600">
                ❌ Không tìm thấy ID cuộc trò chuyện
            </div>
        )
    }

    if (!hasCurrentUserId) {
        return (
            <div className="flex items-center justify-center h-96 text-red-600">
                ❌ Không tìm thấy thông tin người dùng hiện tại
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
            {/* ⚠️ Closed Conversation Warning */}
            {isClosed && (
                <div className="bg-yellow-50 border-b-2 border-yellow-400 p-3">
                    <div className="flex items-center gap-2 text-yellow-800 text-sm">
                        <span>🔒</span>
                        <p>Cuộc trò chuyện này đã bị đóng. Bạn không thể gửi tin nhắn, nhưng vẫn có thể xem lịch sử.</p>
                    </div>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                                            <p className="text-sm font-semibold">💰 Báo giá</p>
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
                                            <p className="text-sm font-semibold">📋 Đơn hàng</p>
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

            {/* Action: Thợ chào giá lại */}
            {currentUserRole === 'PROVIDER' && (
                <ReviseQuoteForm onSubmit={handleReviseQuote} loading={orderLoading} />
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
                {sendError && (
                    <div className="mb-3 p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center justify-between">
                        <span>❌ {sendError}</span>
                        <button onClick={() => setSendError(null)} className="text-red-700 hover:text-red-900 font-bold">
                            ✕
                        </button>
                    </div>
                )}
                {isClosed && (
                    <div className="mb-3 p-3 bg-gray-100 text-gray-700 rounded-lg text-sm">
                        🔒 Cuộc trò chuyện đã đóng. Bạn không thể gửi tin nhắn.
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
                        {sending ? '⏳' : '📤'}
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

function ReviseQuoteForm({ onSubmit, loading }: { onSubmit: (price: number, desc: string) => void; loading: boolean }) {
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
                    💰 Chào giá lại
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
                    {loading ? '⏳' : 'Gửi'}
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
                <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Đặt đơn</h2>
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
                        {loading ? '⏳ Đang...' : '✅ Đặt đơn'}
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
                <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ Xác nhận nhận việc</h2>
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
                        {loading ? '⏳ Đang...' : '✅ Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    )
}
