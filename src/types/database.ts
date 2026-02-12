export type BlockType =
  | 'number'
  | 'text_short'
  | 'text_paragraph'
  | 'single_select'
  | 'multi_select'
  | 'scale'
  | 'yes_no'

export interface BlockOptionRow {
  id: string
  block_id: string
  label: string
  sort_order: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface BlockRow {
  id: string
  deed_id: string
  sort_order: number
  title: string
  block_type: BlockType
  is_required: boolean
  config: BlockConfig | null
  deleted_at: string | null
  created_at: string
  updated_at: string
  block_options?: BlockOptionRow[]
}

export interface BlockConfig {
  /**
   * Для шкалы: количество делений (1–10) и подписи краёв.
   */
  divisions?: number
  labelLeft?: string
  labelRight?: string
  /**
   * Для списков: варианты.
   * id используется как optionId в value_json.
   */
  options?: {
    id: string
    label: string
    sort_order: number
  }[]
}

export interface DeedRow {
  id: string
  user_id: string
  emoji: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  blocks?: BlockRow[]
}

export interface RecordRow {
  id: string
  deed_id: string
  record_date: string
  record_time: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type ValueJson =
  | { number: number }
  | { text: string }
  | { optionId: string }
  | { optionIds: string[] }
  | { scaleValue: number }
  | { yesNo: boolean }

export interface RecordAnswerRow {
  id: string
  record_id: string
  block_id: string
  value_json: ValueJson
  is_outdated: boolean
  snapshot_title: string | null
  snapshot_deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      deeds: {
        Row: DeedRow
        Insert: Omit<DeedRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<DeedRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
      blocks: {
        Row: BlockRow
        Insert: Omit<BlockRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<BlockRow, 'id' | 'deed_id' | 'created_at' | 'updated_at'>>
      }
      block_options: {
        Row: BlockOptionRow
        Insert: Omit<BlockOptionRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<BlockOptionRow, 'id' | 'block_id' | 'created_at' | 'updated_at'>>
      }
      records: {
        Row: RecordRow
        Insert: Omit<RecordRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<RecordRow, 'id' | 'deed_id' | 'created_at' | 'updated_at'>>
      }
      record_answers: {
        Row: RecordAnswerRow
        Insert: Omit<RecordAnswerRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<RecordAnswerRow, 'id' | 'record_id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}

export type DeedWithBlocks = DeedRow & { blocks?: BlockRow[] }
export type RecordWithAnswers = RecordRow & { record_answers?: RecordAnswerRow[] }
