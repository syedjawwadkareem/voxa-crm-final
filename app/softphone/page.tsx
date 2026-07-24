'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Card, Button, Chip, Toggle } from '@/components/ui-components'
import {
  Phone,
  PhoneMissed,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Settings,
  Clock,
} from 'lucide-react'

export default function Softphone() {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [dialInput, setDialInput] = useState('')
  const [callDuration, setCallDuration] = useState('00:00')
  const [callStatus, setCallStatus] = useState('Ready')

  const handleDial = (digit: string) => {
    setDialInput(dialInput + digit)
  }

  const handleBackspace = () => {
    setDialInput(dialInput.slice(0, -1))
  }

  const handleCall = () => {
    if (dialInput.trim()) {
      setIsCallActive(true)
      setCallStatus('Connected')
    }
  }

  const handleEndCall = () => {
    setIsCallActive(false)
    setCallStatus('Call Ended')
    setCallDuration('00:00')
    setTimeout(() => {
      setCallStatus('Ready')
      setDialInput('')
    }, 1000)
  }

  const dialPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Softphone</h1>
            <p className="text-muted-foreground mt-2">
              Make and receive calls directly from your browser
            </p>
          </div>

          {/* Phone Status Card */}
          <Card className="p-8 mb-6 text-center">
            {/* Status Display */}
            <div className="mb-6">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                {callStatus}
              </p>
              <div
                className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                  isCallActive ? 'bg-green-500/20' : 'bg-muted'
                }`}
              >
                <Phone
                  size={40}
                  className={isCallActive ? 'text-green-500' : 'text-foreground'}
                />
              </div>
              {isCallActive && (
                <p className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
                  <Clock size={18} />
                  {callDuration}
                </p>
              )}
            </div>

            {/* Dial Input */}
            <div className="bg-muted rounded-lg p-4 mb-6 font-mono text-xl text-center text-foreground min-h-12 flex items-center justify-center break-words">
              {dialInput || (isCallActive ? dialInput || 'Calling...' : '000-000-0000')}
            </div>

            {/* Dial Pad */}
            {!isCallActive && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                {dialPad.map((row, rowIdx) => (
                  <div key={rowIdx} className="contents">
                    {row.map((digit) => (
                      <button
                        key={digit}
                        onClick={() => handleDial(digit)}
                        className="aspect-square bg-muted hover:bg-sidebar-accent rounded-lg text-lg font-semibold text-foreground transition-colors"
                      >
                        {digit}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-3 mb-6">
              {!isCallActive ? (
                <>
                  <button
                    onClick={handleBackspace}
                    className="flex-1 py-2 px-4 bg-muted hover:bg-sidebar-accent rounded-lg text-foreground transition-colors font-medium"
                  >
                    ← Delete
                  </button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleCall}
                    disabled={!dialInput.trim()}
                  >
                    Call
                  </Button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`flex-1 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isMuted ? 'bg-red-500/20 text-red-500' : 'bg-muted text-foreground'
                    }`}
                  >
                    {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                  <button className="flex-1 py-3 px-4 bg-muted hover:bg-sidebar-accent rounded-lg text-foreground transition-colors flex items-center justify-center gap-2">
                    <Volume2 size={20} />
                  </button>
                  <Button
                    variant="primary"
                    className="flex-1 bg-red-500 hover:bg-red-600"
                    onClick={handleEndCall}
                  >
                    End Call
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Settings Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Settings size={20} />
              Settings
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  Auto Answer
                </span>
                <Toggle checked={false} onChange={() => {}} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  Do Not Disturb
                </span>
                <Toggle checked={false} onChange={() => {}} />
              </div>
              <div className="pt-4 border-t border-border">
                <label className="text-sm font-medium text-foreground block mb-2">
                  Line Status
                </label>
                <Chip label="Available" variant="success" />
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
