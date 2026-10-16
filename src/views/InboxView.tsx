import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Conversation, Message, Product } from '../types';
import { api } from '../services/api';
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  ShieldAlert,
  UserX,
  Search,
  AlertCircle,
  X,
  ChevronLeft,
  Package
} from 'lucide-react';
import { ReportModal } from '../components/ReportModal';
import { SafeImage } from '../components/SafeImage';

interface InboxViewProps {
  initialConversationId?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({ initialConversationId, onNavigate }) => {
  const { user, fetchCounters } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversationId || null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConvos, setIsLoadingConvos] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // New message input
  const [messageInput, setMessageInput] = useState('');
  const [attachmentDataUrl, setAttachmentDataUrl] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Moderation
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const res = await api.getConversations();
      setConversations(res.conversations || []);
      if (!activeConversationId && res.conversations?.length > 0) {
        setActiveConversationId(res.conversations[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingConvos(false);
    }
  };

  const loadMessages = async (convoId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await api.getConversation(convoId);
      setActiveConversation(res.conversation);
      setActiveProduct(res.product || null);
      setMessages(res.messages || []);
      fetchCounters();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Periodic poll for real-time messages in the active conversation
  useEffect(() => {
    if (!activeConversationId) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.getConversation(activeConversationId);
        setMessages(res.messages || []);
      } catch {}
    }, 4000);
    return () => clearInterval(interval);
  }, [activeConversationId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId) return;
    if (!messageInput.trim() && !attachmentDataUrl) return;

    setIsSending(true);
    try {
      let uploadedUrl: string | undefined = undefined;
      if (attachmentDataUrl) {
        const uploadRes = await api.uploadImage(attachmentDataUrl, 'chat-attachment.jpg');
        uploadedUrl = uploadRes.url;
      }

      const res = await api.sendMessage(activeConversationId, messageInput.trim(), uploadedUrl);
      setMessages(prev => [...prev, res.message]);
      setMessageInput('');
      setAttachmentDataUrl(null);
      fetchCounters();
      loadConversations();
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachmentFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Attachment size exceeds 5MB limit');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBlockUser = async () => {
    if (!activeConversation || !user) return;
    const otherUserId = activeConversation.buyerId === user.id ? activeConversation.sellerId : activeConversation.buyerId;
    const otherName = activeConversation.buyerId === user.id ? activeConversation.sellerName : activeConversation.buyerName;

    if (!confirm(`Are you sure you want to block ${otherName}? You will no longer receive messages from this user.`)) return;

    try {
      await api.toggleBlockUser(otherUserId);
      alert(`${otherName} has been blocked.`);
      setActiveConversationId(null);
      loadConversations();
    } catch (err: any) {
      alert(err.message || 'Failed to block user');
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.productTitle.toLowerCase().includes(q) ||
      c.buyerName.toLowerCase().includes(q) ||
      c.sellerName.toLowerCase().includes(q) ||
      c.lastMessageText.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk']">
              Messages & Inquiries
            </h1>
            <p className="text-xs text-slate-500">
              Direct, real-time messaging between buyers and sellers.
            </p>
          </div>
        </div>

        {/* Messaging Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[600px] h-[75vh]">
          {/* Left Column: Conversations List */}
          <div className={`md:col-span-5 lg:col-span-4 border-r border-slate-100 flex flex-col h-full ${
            activeConversationId ? 'hidden md:flex' : 'flex'
          }`}>
            {/* Search conversations */}
            <div className="p-3.5 border-b border-slate-100 bg-slate-50/50">
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {isLoadingConvos ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading inbox...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="py-16 px-4 text-center">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2 stroke-1" />
                  <p className="text-xs font-semibold text-slate-700">No conversations yet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Conversations will appear here as soon as you contact a seller on a listing or a buyer inquires about your items.
                  </p>
                </div>
              ) : (
                filteredConversations.map(c => {
                  const isSelected = c.id === activeConversationId;
                  const isBuyer = user?.id === c.buyerId;
                  const otherPartyName = isBuyer ? c.sellerName : c.buyerName;

                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveConversationId(c.id)}
                      className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/50 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <SafeImage
                          src={c.productImage}
                          alt=""
                          className="w-full h-full object-cover"
                          fallback={<Package className="w-5 h-5 text-slate-400" />}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {otherPartyName}
                          </span>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(c.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        <p className="text-[11px] font-semibold text-indigo-600 truncate mt-0.5">
                          {c.productTitle}
                        </p>

                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {c.lastMessageText}
                        </p>
                      </div>

                      {c.unreadCount && c.unreadCount > 0 ? (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {c.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation */}
          <div className={`md:col-span-7 lg:col-span-8 flex flex-col h-full bg-slate-50/30 ${
            !activeConversationId ? 'hidden md:flex' : 'flex'
          }`}>
            {activeConversation ? (
              <>
                {/* Header: Product Context Banner */}
                <div className="p-3.5 px-4 bg-white border-b border-slate-100 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => setActiveConversationId(null)}
                      className="md:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <SafeImage
                        src={activeConversation.productImage}
                        alt=""
                        className="w-full h-full object-cover"
                        fallback={<Package className="w-4 h-4 text-slate-400" />}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-bold text-slate-900 truncate">
                          {activeConversation.productTitle}
                        </h3>
                        <span className="text-xs font-extrabold text-indigo-600">
                          {activeConversation.productCurrency} {activeConversation.productPrice}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Chatting with{' '}
                        <strong>
                          {user?.id === activeConversation.buyerId
                            ? activeConversation.sellerName
                            : activeConversation.buyerName}
                        </strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onNavigate('product', activeConversation.productId)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Listing</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => setReportModalOpen(true)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                      title="Report this conversation"
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </button>

                    <button
                      onClick={handleBlockUser}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                      title="Block user"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {isLoadingMessages ? (
                    <div className="py-12 text-center text-xs text-slate-400">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">No messages in this conversation yet.</div>
                  ) : (
                    messages.map(m => {
                      const isMe = m.senderId === user?.id;
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-md rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-br-xs shadow-sm'
                                : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'
                            }`}
                          >
                            <SafeImage
                              src={m.imageUrl}
                              alt="Attachment"
                              className="w-full max-h-60 object-cover rounded-xl mb-2"
                            />
                            {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              <span>
                                {m.readBy?.length > 1 ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-indigo-500 inline" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-slate-400 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Attachment preview if selected */}
                {attachmentDataUrl && attachmentDataUrl.trim() ? (
                  <div className="p-2 px-4 bg-slate-100 flex items-center gap-2 border-t border-slate-200">
                    <SafeImage src={attachmentDataUrl} alt="Preview" className="w-10 h-10 object-cover rounded-lg" />
                    <span className="text-xs text-slate-600">Photo attached</span>
                    <button
                      onClick={() => setAttachmentDataUrl(null)}
                      className="ml-auto text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}

                {/* Message Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2"
                >
                  <label className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer">
                    <ImageIcon className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAttachmentFile}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                  />

                  <button
                    type="submit"
                    disabled={isSending || (!messageInput.trim() && !attachmentDataUrl)}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow-sm transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 stroke-1 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">Select a conversation</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Choose a conversation from the left to view message history.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {activeConversation && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetType="user"
          targetId={user?.id === activeConversation.buyerId ? activeConversation.sellerId : activeConversation.buyerId}
          targetTitleOrName={user?.id === activeConversation.buyerId ? activeConversation.sellerName : activeConversation.buyerName}
        />
      )}
    </div>
  );
};
