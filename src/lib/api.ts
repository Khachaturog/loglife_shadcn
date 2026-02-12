import { supabase } from '@/lib/supabase'
import type {
  DeedRow,
  DeedWithBlocks,
  BlockRow,
  BlockOptionRow,
  RecordRow,
  RecordWithAnswers,
  RecordAnswerRow,
  ValueJson,
} from '@/types/database'
import { toast } from 'sonner'

async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

async function getUserIdOrThrow(): Promise<string> {
  const uid = await getUserId()
  if (!uid) throw new Error('Необходима авторизация')
  return uid
}

export const api = {
  deeds: {
    async list(): Promise<DeedRow[]> {
      const uid = await getUserIdOrThrow()
      const { data, error } = await supabase
        .from('deeds')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      if (error) {
        toast.error(error.message ?? 'Ошибка загрузки дел')
        throw error
      }
      return data ?? []
    },

    /** Список дел с блоками (для главной: нужны типы блоков number/scale для логики N). */
    async listWithBlocks(): Promise<DeedWithBlocks[]> {
      const uid = await getUserIdOrThrow()
      const { data, error } = await supabase
        .from('deeds')
        .select('*, blocks(*)')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      if (error) {
        toast.error(error.message ?? 'Ошибка загрузки дел')
        throw error
      }
      const list = (data ?? []) as (DeedRow & { blocks?: BlockRow[] })[]
      for (const deed of list) {
        deed.blocks = (deed.blocks ?? [])
          .filter((b: BlockRow) => !b.deleted_at)
          .sort((a: BlockRow, b: BlockRow) => a.sort_order - b.sort_order)
      }
      return list as DeedWithBlocks[]
    },

    async get(id: string): Promise<DeedWithBlocks | null> {
      const uid = await getUserIdOrThrow()
      const { data, error } = await supabase
        .from('deeds')
        .select(`
          *,
          blocks (
            *,
            block_options (*)
          )
        `)
        .eq('id', id)
        .eq('user_id', uid)
        .single()
      if (error) {
        if (error.code === 'PGRST116') return null
        toast.error(error.message ?? 'Ошибка загрузки дела')
        throw error
      }
      if (data?.blocks) {
        (data as DeedWithBlocks).blocks = (data.blocks as (BlockRow & { block_options?: BlockOptionRow[] })[])
          .filter(b => !b.deleted_at)
          .sort((a, b) => a.sort_order - b.sort_order)
        for (const b of (data as DeedWithBlocks).blocks ?? []) {
          if (b.block_options) {
            b.block_options = b.block_options.filter(o => !o.deleted_at).sort((a, b) => a.sort_order - b.sort_order)
          }
        }
      }
      return data as DeedWithBlocks
    },

    async create(payload: { emoji?: string; name?: string; description?: string; blocks?: Partial<BlockRow>[] }): Promise<DeedRow> {
      const uid = await getUserIdOrThrow()
      const { data: deed, error: deedError } = await supabase
        .from('deeds')
        .insert({
          user_id: uid,
          emoji: payload.emoji ?? '📋',
          name: payload.name ?? 'Новое дело',
          description: payload.description ?? null,
        })
        .select()
        .single()
      if (deedError) {
        toast.error(deedError.message ?? 'Ошибка создания дела')
        throw deedError
      }
      const blocks = payload.blocks?.length ? payload.blocks : [{ block_type: 'number' as const, title: 'Значение', sort_order: 0, is_required: false, config: null }]
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i]
        await supabase.from('blocks').insert({
          deed_id: deed.id,
          sort_order: b.sort_order ?? i,
          title: b.title ?? 'Блок',
          block_type: b.block_type ?? 'number',
          is_required: b.is_required ?? false,
          config: b.config ?? null,
        })
      }
      return deed
    },

    async update(id: string, payload: { emoji?: string; name?: string; description?: string; blocks?: Partial<BlockRow>[] }): Promise<void> {
      const uid = await getUserIdOrThrow()
      const now = new Date().toISOString()
      const { error: deedError } = await supabase
        .from('deeds')
        .update({
          ...(payload.emoji !== undefined && { emoji: payload.emoji }),
          ...(payload.name !== undefined && { name: payload.name }),
          ...(payload.description !== undefined && { description: payload.description }),
        })
        .eq('id', id)
        .eq('user_id', uid)
      if (deedError) {
        toast.error(deedError.message ?? 'Ошибка обновления дела')
        throw deedError
      }
      if (payload.blocks !== undefined) {
        const { data: existing } = await supabase.from('blocks').select('id').eq('deed_id', id)
        const existingIds = new Set((existing ?? []).map(b => b.id))
        const payloadIds = new Set(
          payload.blocks
            .map((b) => (b as BlockRow & { id?: string }).id)
            .filter((v): v is string => !!v),
        )
        for (let i = 0; i < payload.blocks.length; i++) {
          const b = payload.blocks[i] as BlockRow & { id?: string }
          if (b.id && existingIds.has(b.id)) {
            await supabase.from('blocks').update({
              sort_order: i,
              title: b.title,
              block_type: b.block_type,
              is_required: b.is_required,
              config: b.config,
            }).eq('id', b.id)
          } else {
            const { data: inserted } = await supabase.from('blocks').insert({
              deed_id: id,
              sort_order: i,
              title: b.title ?? 'Блок',
              block_type: b.block_type ?? 'number',
              is_required: b.is_required ?? false,
              config: b.config ?? null,
            }).select('id').single()
            if (inserted?.id) existingIds.add(inserted.id)
          }
        }
        if (existing && existing.length > 0) {
          const toSoftDelete = existing.filter((b) => !payloadIds.has(b.id))
          if (toSoftDelete.length > 0) {
            await supabase
              .from('blocks')
              .update({ deleted_at: now })
              .in(
                'id',
                toSoftDelete.map((b) => b.id),
              )
          }
        }
      }
    },

    async delete(id: string): Promise<void> {
      const uid = await getUserIdOrThrow()
      const { error } = await supabase.from('deeds').delete().eq('id', id).eq('user_id', uid)
      if (error) {
        toast.error(error.message ?? 'Ошибка удаления дела')
        throw error
      }
    },

    async deleteBlock(deedId: string, blockId: string): Promise<void> {
      const uid = await getUserIdOrThrow()
      const { data: deed } = await supabase.from('deeds').select('id').eq('id', deedId).eq('user_id', uid).single()
      if (!deed) throw new Error('Дело не найдено')
      const { error } = await supabase.from('blocks').update({ deleted_at: new Date().toISOString() }).eq('id', blockId).eq('deed_id', deedId)
      if (error) {
        toast.error(error.message ?? 'Ошибка удаления блока')
        throw error
      }
    },

    async records(deedId: string): Promise<(RecordRow & { record_answers?: RecordAnswerRow[] })[]> {
      const uid = await getUserIdOrThrow()
      const { data: deed } = await supabase.from('deeds').select('id').eq('id', deedId).eq('user_id', uid).single()
      if (!deed) return []
      const { data, error } = await supabase
        .from('records')
        .select('*, record_answers(*)')
        .eq('deed_id', deedId)
        .order('record_date', { ascending: false })
        .order('record_time', { ascending: false })
      if (error) {
        toast.error(error.message ?? 'Ошибка загрузки записей')
        throw error
      }
      return data ?? []
    },

    async createRecord(
      deedId: string,
      payload: { record_date: string; record_time: string; notes?: string; answers?: Record<string, ValueJson> }
    ): Promise<RecordRow> {
      const uid = await getUserIdOrThrow()
      const { data: deed } = await supabase.from('deeds').select('id').eq('id', deedId).eq('user_id', uid).single()
      if (!deed) throw new Error('Дело не найдено')
      const { data: record, error: recordError } = await supabase
        .from('records')
        .insert({
          deed_id: deedId,
          record_date: payload.record_date,
          record_time: payload.record_time,
          notes: payload.notes ?? null,
        })
        .select()
        .single()
      if (recordError) {
        toast.error(recordError.message ?? 'Ошибка создания записи')
        throw recordError
      }
      if (payload.answers && Object.keys(payload.answers).length > 0) {
        const inserts = Object.entries(payload.answers).map(([block_id, value_json]) => ({
          record_id: record.id,
          block_id,
          value_json,
          is_outdated: false,
          snapshot_title: null,
          snapshot_deleted_at: null,
        }))
        await supabase.from('record_answers').insert(inserts)
      }
      return record
    },
  },

  records: {
    async get(id: string): Promise<RecordWithAnswers | null> {
      const { data: record, error } = await supabase
        .from('records')
        .select('*, record_answers(*)')
        .eq('id', id)
        .single()
      if (error) {
        if (error.code === 'PGRST116') return null
        toast.error(error.message ?? 'Ошибка загрузки записи')
        throw error
      }
      const { data: deed } = await supabase.from('deeds').select('id, user_id').eq('id', record.deed_id).single()
      const uid = await getUserId()
      if (!uid || (deed as { user_id?: string } | null)?.user_id !== uid) return null
      return record as RecordWithAnswers
    },

    async update(
      id: string,
      payload: { record_date?: string; record_time?: string; notes?: string; answers?: Record<string, ValueJson> }
    ): Promise<void> {
      const { data: record } = await supabase.from('records').select('deed_id').eq('id', id).single()
      if (!record) throw new Error('Запись не найдена')
      const { data: deed } = await supabase.from('deeds').select('user_id').eq('id', record.deed_id).single()
      const uid = await getUserId()
      if (!uid || (deed as { user_id?: string } | null)?.user_id !== uid) throw new Error('Доступ запрещён')
      const { error: recordError } = await supabase
        .from('records')
        .update({
          ...(payload.record_date !== undefined && { record_date: payload.record_date }),
          ...(payload.record_time !== undefined && { record_time: payload.record_time }),
          ...(payload.notes !== undefined && { notes: payload.notes }),
        })
        .eq('id', id)
      if (recordError) {
        toast.error(recordError.message ?? 'Ошибка обновления записи')
        throw recordError
      }
      if (payload.answers !== undefined) {
        for (const [block_id, value_json] of Object.entries(payload.answers)) {
          const { data: existing } = await supabase.from('record_answers').select('id').eq('record_id', id).eq('block_id', block_id).single()
          if (existing) {
            await supabase.from('record_answers').update({ value_json }).eq('id', existing.id)
          } else {
            await supabase.from('record_answers').insert({ record_id: id, block_id, value_json, is_outdated: false, snapshot_title: null, snapshot_deleted_at: null })
          }
        }
      }
    },
  },
}
