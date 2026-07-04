'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useStore } from '@/store/useStore';
import LandingPage from '@/components/collab/LandingPage';
import LoginPage from '@/components/collab/LoginPage';
import RegisterPage from '@/components/collab/RegisterPage';
import DashboardPage from '@/components/collab/DashboardPage';
import ProfilePage from '@/components/collab/ProfilePage';

const EditorPage = dynamic(() => import('@/components/collab/EditorPage'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-[#0d1117]">
      <div className="flex flex-col items-center gap-3 text-[#8b949e]">
        <div className="size-8 border-2 border-[#30363d] border-t-[#238636] rounded-full animate-spin" />
        <span className="text-sm">Loading editor...</span>
      </div>
    </div>
  ),
});

export default function Home() {
  const { currentPage, setCurrentPage, setUser, setCurrentRoomId, setCurrentRoom, setLanguage, setCurrentFileName, isAuthenticated } = useStore();
  const initializedRef = useRef(false);

  // Check auth on mount and handle invite codes
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Check auth
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            avatarColor: data.user.avatarColor,
          });

          // Check URL params for invite code
          const params = new URLSearchParams(window.location.search);
          const joinCode = params.get('join');
          if (joinCode) {
            // Try to find the room and join
            fetch('/api/rooms', { credentials: 'include' })
              .then((r) => r.json())
              .then((roomsData) => {
                const rooms = Array.isArray(roomsData) ? roomsData : roomsData.rooms || [];
                const room = rooms.find(
                  (r: { inviteCode: string }) => r.inviteCode === joinCode
                );
                if (room) {
                  setCurrentRoom(room);
                  setCurrentRoomId(room.id);
                  setLanguage(room.language);
                  setCurrentFileName(room.files?.[0]?.name || 'index.js');
                  setCurrentPage('editor');
                }
              })
              .catch(() => {});
          } else {
            // No invite code - go to dashboard if authenticated
            setCurrentPage('dashboard');
          }
        }
      })
      .catch(() => {});
  }, [setUser, setCurrentRoomId, setCurrentPage, setCurrentRoom, setLanguage, setCurrentFileName]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      const { currentPage } = useStore.getState();
      if (currentPage === 'editor') {
        setCurrentPage('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setCurrentPage]);

  switch (currentPage) {
    case 'login':
      return <LoginPage />;
    case 'register':
      return <RegisterPage />;
    case 'dashboard':
      return <DashboardPage />;
    case 'editor':
      return <EditorPage />;
    case 'profile':
      return <ProfilePage />;
    case 'landing':
    default:
      return <LandingPage />;
  }
}