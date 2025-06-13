import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  BuildingOfficeIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { SharedIVRRequest } from '../../data/mockIVRData';

interface MessageModalProps {
  ivr: SharedIVRRequest;
  onClose: () => void;
}

interface Message {
  id: string;
  author: string;
  authorType: 'doctor' | 'ivr_company' | 'distributor';
  message: string;
  timestamp: string;
  isInternal?: boolean;
}

const MessageModal: React.FC<MessageModalProps> = ({ ivr, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Mock messages data
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockMessages: Message[] = [
        {
          id: '1',
          author: 'Dr. Sarah Johnson',
          authorType: 'doctor',
          message: 'Patient requires urgent skin graft for diabetic ulcer. Insurance pre-authorization needed ASAP.',
          timestamp: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          author: 'IVR Specialist',
          authorType: 'ivr_company',
          message: 'We need additional documentation: recent lab results and wound care photos. Please upload within 24 hours.',
          timestamp: '2024-01-15T14:20:00Z',
        },
        {
          id: '3',
          author: 'Dr. Sarah Johnson',
          authorType: 'doctor',
          message: 'Lab results uploaded. Wound photos attached. Patient condition is deteriorating.',
          timestamp: '2024-01-16T09:15:00Z',
        },
        {
          id: '4',
          author: 'Regional Distributor',
          authorType: 'distributor',
          message: 'Internal note: High priority case - patient is VIP. Expedite processing.',
          timestamp: '2024-01-16T11:45:00Z',
          isInternal: true,
        },
        {
          id: '5',
          author: 'IVR Specialist',
          authorType: 'ivr_company',
          message: 'Pre-authorization approved. Coverage: 80% after $500 deductible. Valid for 30 days.',
          timestamp: '2024-01-16T16:30:00Z',
        }
      ];

      setMessages(mockMessages);
      setIsLoading(false);
    };

    loadMessages();
  }, [ivr.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const message: Message = {
      id: Date.now().toString(),
      author: 'Regional Distributor',
      authorType: 'distributor',
      message: newMessage,
      timestamp: new Date().toISOString(),
      isInternal: isInternal,
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setIsSending(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getAuthorIcon = (authorType: string) => {
    switch (authorType) {
      case 'doctor':
        return UserIcon;
      case 'ivr_company':
        return BuildingOfficeIcon;
      case 'distributor':
        return ChatBubbleLeftRightIcon;
      default:
        return UserIcon;
    }
  };

  const getMessageStyle = (authorType: string, isInternal?: boolean) => {
    if (isInternal) {
      return 'bg-yellow-50 border-l-4 border-yellow-400';
    }

    switch (authorType) {
      case 'doctor':
        return 'bg-blue-50 border-l-4 border-blue-400';
      case 'ivr_company':
        return 'bg-green-50 border-l-4 border-green-400';
      case 'distributor':
        return 'bg-purple-50 border-l-4 border-purple-400';
      default:
        return 'bg-gray-50 border-l-4 border-gray-400';
    }
  };

  return (
    <Transition appear show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                      Communication Thread
                    </Dialog.Title>
                    <p className="text-sm text-gray-600">
                      {ivr.ivrNumber} - {ivr.patientName}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto max-h-96 p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const AuthorIcon = getAuthorIcon(message.authorType);
                        return (
                          <div
                            key={message.id}
                            className={`p-4 rounded-lg ${getMessageStyle(message.authorType, message.isInternal)}`}
                          >
                            <div className="flex items-start space-x-3">
                              <AuthorIcon className="w-5 h-5 text-gray-500 mt-0.5" />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900">
                                    {message.author}
                                  </span>
                                  {message.isInternal && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                      <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                      Internal Note
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {formatTimestamp(message.timestamp)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">{message.message}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Internal note (only visible to distributors)
                      </span>
                    </label>
                  </div>

                  <div className="flex space-x-3">
                    <div className="flex-1">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={isInternal ? "Add internal note..." : "Type your message..."}
                        rows={3}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <PaperAirplaneIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default MessageModal;