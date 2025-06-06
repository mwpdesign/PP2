import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  HandRaisedIcon,
  FingerPrintIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

// Gesture types
export type GestureType =
  | 'swipe_left'
  | 'swipe_right'
  | 'swipe_up'
  | 'swipe_down'
  | 'tap'
  | 'double_tap'
  | 'long_press'
  | 'pinch_in'
  | 'pinch_out'
  | 'two_finger_tap'
  | 'three_finger_tap';

// Touch point interface
export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

// Gesture event interface
export interface GestureEvent {
  type: GestureType;
  startPoint: TouchPoint;
  endPoint?: TouchPoint;
  distance?: number;
  duration?: number;
  velocity?: number;
  scale?: number;
  touchCount: number;
  timestamp: number;
}

// Gesture configuration
export interface GestureConfig {
  swipeThreshold: number;
  longPressThreshold: number;
  doubleTapThreshold: number;
  pinchThreshold: number;
  velocityThreshold: number;
  medicalGloveMode: boolean;
  enableHapticFeedback: boolean;
  debugMode: boolean;
}

// Navigation action
export interface NavigationAction {
  id: string;
  gesture: GestureType;
  action: () => void;
  description: string;
  icon?: React.ReactNode;
  enabled?: boolean;
  medicalPriority?: 'critical' | 'high' | 'medium' | 'low';
}

export interface GestureNavigationProps {
  actions: NavigationAction[];
  config?: Partial<GestureConfig>;
  onGesture?: (gesture: GestureEvent) => void;
  className?: string;
  disabled?: boolean;
  showIndicators?: boolean;
  showGestureHistory?: boolean;
  medicalGloveMode?: boolean;
  children?: React.ReactNode;
}

export const GestureNavigation: React.FC<GestureNavigationProps> = ({
  actions,
  config = {},
  onGesture,
  className = '',
  disabled = false,
  showIndicators = true,
  showGestureHistory = false,
  medicalGloveMode = false,
  children
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentTouches, setCurrentTouches] = useState<TouchPoint[]>([]);
  const [gestureHistory, setGestureHistory] = useState<GestureEvent[]>([]);
  const [touchFeedback, setTouchFeedback] = useState<{ x: number; y: number; id: string } | null>(null);

  // Default configuration with medical glove optimizations
  const defaultConfig: GestureConfig = {
    swipeThreshold: medicalGloveMode ? 80 : 50,
    longPressThreshold: medicalGloveMode ? 800 : 500,
    doubleTapThreshold: medicalGloveMode ? 400 : 300,
    pinchThreshold: medicalGloveMode ? 30 : 20,
    velocityThreshold: medicalGloveMode ? 0.3 : 0.5,
    medicalGloveMode,
    enableHapticFeedback: true,
    debugMode: false
  };

  const gestureConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config, medicalGloveMode]);

  // Touch state management
  const touchStartRef = useRef<TouchPoint[]>([]);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const pinchStartDistanceRef = useRef<number>(0);

  // Haptic feedback
  const triggerHapticFeedback = useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!gestureConfig.enableHapticFeedback) return;

    try {
      if ('vibrate' in navigator) {
        const patterns = {
          light: [10],
          medium: [20],
          heavy: [30, 10, 30]
        };
        navigator.vibrate(patterns[intensity]);
      }
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }
  }, [gestureConfig.enableHapticFeedback]);

  // Calculate distance between two points
  const calculateDistance = useCallback((point1: TouchPoint, point2: TouchPoint): number => {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate velocity
  const calculateVelocity = useCallback((distance: number, duration: number): number => {
    return duration > 0 ? distance / duration : 0;
  }, []);

  // Get touch points from event
  const getTouchPoints = useCallback((event: TouchEvent): TouchPoint[] => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return [];

    return Array.from(event.touches).map((touch, index) => ({
      id: touch.identifier,
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
      timestamp: Date.now()
    }));
  }, []);

  // Detect gesture type
  const detectGesture = useCallback((
    startTouches: TouchPoint[],
    endTouches: TouchPoint[],
    duration: number
  ): GestureEvent | null => {
    if (startTouches.length === 0) return null;

    const startTouch = startTouches[0];
    const endTouch = endTouches[0] || startTouch;
    const distance = calculateDistance(startTouch, endTouch);
    const velocity = calculateVelocity(distance, duration);

    // Single touch gestures
    if (startTouches.length === 1) {
      // Long press
      if (duration >= gestureConfig.longPressThreshold && distance < 20) {
        return {
          type: 'long_press',
          startPoint: startTouch,
          endPoint: endTouch,
          distance,
          duration,
          velocity,
          touchCount: 1,
          timestamp: Date.now()
        };
      }

      // Swipe gestures
      if (distance >= gestureConfig.swipeThreshold && velocity >= gestureConfig.velocityThreshold) {
        const dx = endTouch.x - startTouch.x;
        const dy = endTouch.y - startTouch.y;
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        let gestureType: GestureType;
        if (Math.abs(angle) <= 45) {
          gestureType = 'swipe_right';
        } else if (Math.abs(angle) >= 135) {
          gestureType = 'swipe_left';
        } else if (angle > 45 && angle < 135) {
          gestureType = 'swipe_down';
        } else {
          gestureType = 'swipe_up';
        }

        return {
          type: gestureType,
          startPoint: startTouch,
          endPoint: endTouch,
          distance,
          duration,
          velocity,
          touchCount: 1,
          timestamp: Date.now()
        };
      }

      // Tap gesture (if not a swipe or long press)
      if (distance < 20 && duration < gestureConfig.longPressThreshold) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current;

        if (timeSinceLastTap < gestureConfig.doubleTapThreshold) {
          lastTapRef.current = 0; // Reset to prevent triple tap
          return {
            type: 'double_tap',
            startPoint: startTouch,
            endPoint: endTouch,
            distance,
            duration,
            velocity,
            touchCount: 1,
            timestamp: now
          };
        } else {
          lastTapRef.current = now;
          // Delay single tap to allow for double tap detection
          setTimeout(() => {
            if (lastTapRef.current === now) {
              const tapGesture: GestureEvent = {
                type: 'tap',
                startPoint: startTouch,
                endPoint: endTouch,
                distance,
                duration,
                velocity,
                touchCount: 1,
                timestamp: now
              };
              handleGestureDetected(tapGesture);
            }
          }, gestureConfig.doubleTapThreshold);
          return null; // Don't process single tap immediately
        }
      }
    }

    // Multi-touch gestures
    if (startTouches.length === 2) {
      const startDistance = calculateDistance(startTouches[0], startTouches[1]);
      const endDistance = endTouches.length >= 2 ?
        calculateDistance(endTouches[0], endTouches[1]) : startDistance;

      const scale = endDistance / startDistance;
      const scaleChange = Math.abs(scale - 1);

      // Pinch gestures
      if (scaleChange >= gestureConfig.pinchThreshold / 100) {
        return {
          type: scale > 1 ? 'pinch_out' : 'pinch_in',
          startPoint: startTouch,
          endPoint: endTouch,
          distance: Math.abs(endDistance - startDistance),
          duration,
          velocity,
          scale,
          touchCount: 2,
          timestamp: Date.now()
        };
      }

      // Two finger tap
      if (duration < 300 && distance < 30) {
        return {
          type: 'two_finger_tap',
          startPoint: startTouch,
          endPoint: endTouch,
          distance,
          duration,
          velocity,
          touchCount: 2,
          timestamp: Date.now()
        };
      }
    }

    // Three finger tap
    if (startTouches.length === 3 && duration < 300 && distance < 30) {
      return {
        type: 'three_finger_tap',
        startPoint: startTouch,
        endPoint: endTouch,
        distance,
        duration,
        velocity,
        touchCount: 3,
        timestamp: Date.now()
      };
    }

    return null;
  }, [gestureConfig, calculateDistance, calculateVelocity]);

  // Handle gesture detection
  const handleGestureDetected = useCallback((gesture: GestureEvent) => {
    if (disabled) return;

    // Add to history
    setGestureHistory(prev => [gesture, ...prev.slice(0, 9)]);

    // Trigger haptic feedback
    const intensity = gesture.touchCount > 1 ? 'medium' : 'light';
    triggerHapticFeedback(intensity);

    // Find and execute matching action
    const matchingAction = actions.find(action =>
      action.gesture === gesture.type && action.enabled !== false
    );

    if (matchingAction) {
      try {
        matchingAction.action();
        triggerHapticFeedback('heavy');
      } catch (error) {
        console.error('Error executing gesture action:', error);
      }
    }

    // Notify parent component
    onGesture?.(gesture);
  }, [disabled, actions, triggerHapticFeedback, onGesture]);

  // Touch event handlers
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (disabled) return;

    event.preventDefault();
    setIsActive(true);

    const touches = getTouchPoints(event);
    setCurrentTouches(touches);
    touchStartRef.current = touches;

    // Show touch feedback
    if (touches.length > 0) {
      setTouchFeedback({
        x: touches[0].x,
        y: touches[0].y,
        id: `touch-${Date.now()}`
      });
    }

    // Clear any existing timer
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }

    // Set up long press detection
    touchTimerRef.current = setTimeout(() => {
      const gesture = detectGesture(touchStartRef.current, touches, gestureConfig.longPressThreshold);
      if (gesture) {
        handleGestureDetected(gesture);
      }
    }, gestureConfig.longPressThreshold);
  }, [disabled, getTouchPoints, gestureConfig.longPressThreshold, detectGesture, handleGestureDetected]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (disabled || !isActive) return;

    event.preventDefault();
    const touches = getTouchPoints(event);
    setCurrentTouches(touches);

    // Update touch feedback position
    if (touches.length > 0) {
      setTouchFeedback(prev => prev ? {
        ...prev,
        x: touches[0].x,
        y: touches[0].y
      } : null);
    }
  }, [disabled, isActive, getTouchPoints]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (disabled || !isActive) return;

    event.preventDefault();
    setIsActive(false);

    const endTouches = getTouchPoints(event);
    const duration = Date.now() - (touchStartRef.current[0]?.timestamp || 0);

    // Clear long press timer
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }

    // Detect and handle gesture
    const gesture = detectGesture(touchStartRef.current, endTouches, duration);
    if (gesture) {
      handleGestureDetected(gesture);
    }

    // Clear touch feedback
    setTimeout(() => setTouchFeedback(null), 200);
    setCurrentTouches([]);
    touchStartRef.current = [];
  }, [disabled, isActive, getTouchPoints, detectGesture, handleGestureDetected]);

  // Set up touch event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Get gesture icon
  const getGestureIcon = (gestureType: GestureType) => {
    switch (gestureType) {
      case 'swipe_left': return <ArrowLeftIcon className="w-4 h-4" />;
      case 'swipe_right': return <ArrowRightIcon className="w-4 h-4" />;
      case 'swipe_up': return <ArrowUpIcon className="w-4 h-4" />;
      case 'swipe_down': return <ArrowDownIcon className="w-4 h-4" />;
      case 'pinch_in': return <MagnifyingGlassMinusIcon className="w-4 h-4" />;
      case 'pinch_out': return <MagnifyingGlassPlusIcon className="w-4 h-4" />;
      case 'tap': return <FingerPrintIcon className="w-4 h-4" />;
      case 'double_tap': return <PlayIcon className="w-4 h-4" />;
      case 'long_press': return <PauseIcon className="w-4 h-4" />;
      default: return <HandRaisedIcon className="w-4 h-4" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main gesture area */}
      <div
        ref={containerRef}
        className={`
          relative w-full h-full touch-none select-none
          ${disabled ? 'pointer-events-none opacity-50' : ''}
          ${gestureConfig.medicalGloveMode ? 'cursor-none' : ''}
        `}
        style={{
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
      >
        {children}

        {/* Touch feedback overlay */}
        {touchFeedback && (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: touchFeedback.x - 20,
              top: touchFeedback.y - 20,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-10 h-10 bg-blue-500 bg-opacity-30 rounded-full animate-ping" />
            <div className="absolute inset-0 w-10 h-10 bg-blue-500 bg-opacity-50 rounded-full" />
          </div>
        )}

        {/* Current touches indicator */}
        {currentTouches.map((touch, index) => (
          <div
            key={`${touch.id}-${index}`}
            className="absolute pointer-events-none z-40"
            style={{
              left: touch.x - 15,
              top: touch.y - 15,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-8 h-8 bg-green-500 bg-opacity-40 rounded-full border-2 border-green-500" />
            <div className="absolute inset-2 bg-green-500 rounded-full" />
          </div>
        ))}
      </div>

      {/* Gesture indicators */}
      {showIndicators && (
        <div className="absolute top-4 left-4 z-30">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-xs">
            <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <HandRaisedIcon className="w-4 h-4 mr-1" />
              Available Gestures
            </h4>
            <div className="space-y-1">
              {actions.filter(action => action.enabled !== false).map(action => (
                <div
                  key={action.id}
                  className={`flex items-center space-x-2 text-xs p-2 rounded ${getPriorityColor(action.medicalPriority)}`}
                >
                  {action.icon || getGestureIcon(action.gesture)}
                  <span className="font-medium capitalize">
                    {action.gesture.replace('_', ' ')}
                  </span>
                  <span className="text-gray-600">-</span>
                  <span>{action.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gesture history */}
      {showGestureHistory && gestureHistory.length > 0 && (
        <div className="absolute top-4 right-4 z-30">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-xs">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Recent Gestures</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {gestureHistory.slice(0, 5).map((gesture, index) => (
                <div
                  key={`${gesture.timestamp}-${index}`}
                  className="flex items-center space-x-2 text-xs p-1 rounded bg-gray-50"
                >
                  {getGestureIcon(gesture.type)}
                  <span className="font-medium capitalize">
                    {gesture.type.replace('_', ' ')}
                  </span>
                  <span className="text-gray-500">
                    {gesture.duration}ms
                  </span>
                  {gesture.velocity && (
                    <span className="text-gray-500">
                      {gesture.velocity.toFixed(1)}px/ms
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Medical glove mode indicator */}
      {gestureConfig.medicalGloveMode && (
        <div className="absolute bottom-4 left-4 z-30">
          <div className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center space-x-2">
            <HandRaisedIcon className="w-4 h-4" />
            <span>Medical Glove Mode</span>
          </div>
        </div>
      )}

      {/* Debug information */}
      {gestureConfig.debugMode && (
        <div className="absolute bottom-4 right-4 z-30">
          <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg text-xs max-w-xs">
            <h4 className="font-semibold mb-2">Debug Info</h4>
            <div className="space-y-1">
              <div>Active: {isActive ? 'Yes' : 'No'}</div>
              <div>Touches: {currentTouches.length}</div>
              <div>Gestures: {gestureHistory.length}</div>
              <div>Config:</div>
              <div className="ml-2 space-y-1">
                <div>Swipe: {gestureConfig.swipeThreshold}px</div>
                <div>Long Press: {gestureConfig.longPressThreshold}ms</div>
                <div>Double Tap: {gestureConfig.doubleTapThreshold}ms</div>
                <div>Medical Mode: {gestureConfig.medicalGloveMode ? 'On' : 'Off'}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};