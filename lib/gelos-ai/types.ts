export type GelosAiRole = 'user' | 'assistant'

export type GelosAiMessage = {
  role: GelosAiRole
  content: string
}
