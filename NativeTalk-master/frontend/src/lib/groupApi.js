import { db, auth } from "./insforge";

// Criar grupo
export async function createGroup(groupData) {
    const { data: { user } } = await auth.getUser();
    const { data, error } = await db
        .from('groups')
        .insert({
            ...groupData,
            creator_id: user.id
        })
        .select()
        .single();

    if (error) throw error;

    // Adicionar criador como admin no grupo_members (assumindo tabela de junção)
    const { error: memberError } = await db
        .from('group_members')
        .insert({
            group_id: data.id,
            user_id: user.id,
            role: 'admin'
        });

    if (memberError) throw memberError;

    return data;
}

// Listar grupos do usuário
export async function getUserGroups() {
    const { data: { user } } = await auth.getUser();
    const { data, error } = await db
        .from('group_members')
        .select('groups(*)')
        .eq('user_id', user.id);

    if (error) throw error;
    // Retornar apenas a lista de grupos, extraindo-os do resultado da junção
    return data.map(item => item.groups).filter(Boolean);
}

// Obter detalhes do grupo
export async function getGroup(groupId) {
    const { data, error } = await db
        .from('groups')
        .select('*, members:group_members(*, user:users(*))')
        .eq('id', groupId)
        .single();

    if (error) throw error;
    return data;
}

// Adicionar membros
export async function addGroupMembers(groupId, memberIds) {
    const memberInserts = memberIds.map(userId => ({
        group_id: groupId,
        user_id: userId,
        role: 'member'
    }));

    const { data, error } = await db
        .from('group_members')
        .insert(memberInserts)
        .select();

    if (error) throw error;
    return data;
}

// Remover membro
export async function removeGroupMember(groupId, memberId) {
    const { error } = await db
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', memberId);

    if (error) throw error;
    return { success: true };
}

// Atualizar grupo
export async function updateGroup(groupId, updates) {
    const { data, error } = await db
        .from('groups')
        .update(updates)
        .eq('id', groupId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Deletar grupo
export async function deleteGroup(groupId) {
    const { error } = await db
        .from('groups')
        .delete()
        .eq('id', groupId);

    if (error) throw error;
    return { success: true };
}

// Promover a admin
export async function promoteToAdmin(groupId, memberId) {
    const { data, error } = await db
        .from('group_members')
        .update({ role: 'admin' })
        .eq('group_id', groupId)
        .eq('user_id', memberId)
        .select()
        .single();

    if (error) throw error;
    return data;
}
