'use client'

import { useEffect, useState, useCallback } from 'react'
import { liff } from '@line/liff'
import { supabase, type OrganizerProfile, type OrganizerMember } from '@/lib/supabase'
import WelcomeScreen from '@/components/WelcomeScreen'
import RegistrationForm from '@/components/RegistrationForm'
import EventManagement from '@/components/EventManagement'
import LoadingSpinner from '@/components/LoadingSpinner'
import EntrySelector from '@/components/EntrySelector'
import InviteRegistrationForm from '@/components/InviteRegistrationForm'

export default function Home() {
  const [isLiffReady, setIsLiffReady] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [initializing, setInitializing] = useState(true)
  const [entryState, setEntryState] = useState<'loading' | 'selector' | 'new' | 'invite' | 'main'>('loading')
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null)
  const [organizerMember, setOrganizerMember] = useState<OrganizerMember | null>(null)

  const handleOnboardingComplete = useCallback((profile: OrganizerProfile, member: OrganizerMember) => {
    setOrganizerProfile(profile)
    setOrganizerMember(member)
    setEntryState('main')
  }, [])

  const loadMembership = useCallback(
    async (lineUserId: string) => {
      try {
        const { data: memberData, error } = await supabase
          .from('organizer_members')
          .select('*, organizer_profiles(*)')
          .eq('line_user_id', lineUserId)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (memberData) {
          const { organizer_profiles, ...memberRest } = memberData as any
          setOrganizerProfile(organizer_profiles as OrganizerProfile)
          setOrganizerMember(memberRest as OrganizerMember)
          setEntryState('main')
        } else {
          setEntryState('selector')
        }
      } catch (error) {
        console.error('Failed to load organizer member:', error)
        setEntryState('selector')
      } finally {
        setInitializing(false)
      }
    },
    []
  )

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
        setIsLiffReady(true)

        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile()
          setUserProfile(profile)
          await loadMembership(profile.userId)
        } else {
          setInitializing(false)
          setEntryState('loading')
        }
      } catch (error) {
        console.error('LIFF initialization failed:', error)
        setInitializing(false)
        setEntryState('selector')
      } finally {
        setInitializing(false)
      }
    }

    initializeLiff()
  }, [loadMembership])

  if (initializing) {
    return <LoadingSpinner />
  }

  if (!isLiffReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">LINEアプリで開いてください</h1>
        </div>
      </div>
    )
  }

  if (!liff.isLoggedIn()) {
    return <WelcomeScreen />
  }

  if (entryState === 'selector') {
    return (
      <EntrySelector
        onSelectNew={() => setEntryState('new')}
        onSelectInvite={() => setEntryState('invite')}
      />
    )
  }

  if (entryState === 'new') {
    return (
      <RegistrationForm
        userProfile={userProfile}
        onRegistrationComplete={handleOnboardingComplete}
      />
    )
  }

  if (entryState === 'invite') {
    return (
      <InviteRegistrationForm
        userProfile={userProfile}
        onBack={() => setEntryState('selector')}
        onRegistrationComplete={handleOnboardingComplete}
      />
    )
  }

  if (entryState === 'main' && organizerProfile && organizerMember) {
    return (
      <EventManagement
        userProfile={userProfile}
        profile={organizerProfile}
        currentMember={organizerMember}
        onProfileChange={setOrganizerProfile}
        onMemberChange={setOrganizerMember}
      />
    )
  }

  return <LoadingSpinner />
}
