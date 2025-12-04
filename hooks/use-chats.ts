'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useChats() {
  const { data, error, mutate } = useSWR('/api/chats', fetcher)

  return {
    chats: data?.chats || [],
    total: data?.total || 0,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  }
}

export async function createChat(title: string, description = '') {
  const response = await fetch('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description })
  })

  if (!response.ok) {
    throw new Error('Failed to create chat')
  }

  return response.json()
}

export async function deleteChat(chatId: string) {
  const response = await fetch(`/api/chats/${chatId}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    throw new Error('Failed to delete chat')
  }
}
