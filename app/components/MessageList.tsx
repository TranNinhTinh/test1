import { Message } from '@/lib/api/chat.service'
import { useEffect, useRef } from 'react'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
}

export default function MessageList({ messages, currentUserId }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hôm nay'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua'
    }
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    
    // Kiểm tra messages có phải array không
    if (!Array.isArray(messages)) {
      console.error('❌ MessageList: messages is not an array:', messages)
      return groups
    }
    
    messages.forEach((message) => {
      const date = new Date(message.createdAt).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {Object.entries(messageGroups).map(([date, groupMessages]) => (
        <div key={date}>
          {/* Date divider */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
              {formatDate(groupMessages[0].createdAt)}
            </div>
          </div>

          {/* Messages */}
          {groupMessages.map((message) => {
            const isOwn = message.senderId === currentUserId
            const senderName = (message as any).senderName || 'Người dùng'
            const senderAvatar = (message as any).senderAvatar as string | undefined
            return (
              <div
                key={message.id}
                className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  {!isOwn && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                      {senderAvatar ? (
                        <img
                          src={senderAvatar}
                          alt={senderName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                          {senderName.charAt(0)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div>
                    {!isOwn && (
                      <p className="text-xs text-gray-600 mb-1 px-1">{senderName}</p>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                    <div
                      className={`text-xs text-gray-500 mt-1 px-1 ${
                        isOwn ? 'text-right' : 'text-left'
                      }`}
                    >
                      {formatTime(message.createdAt)}
                      {isOwn && (
                        <span className="ml-1">
                          {message.isRead ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
