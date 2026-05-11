/* ═══════════════════════════════════════════════
   edit_trilha.js – Gestão de Trilhas (Spectrum)
═══════════════════════════════════════════════ */

let paginaAtual = 1;

/* ── INIT ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {

    // Valida sessão e verifica nível de acesso
    await verificarSessao();

    listarTrilhas();

    document.getElementById('formTrilha').addEventListener('submit', salvarTrilha);
    document.getElementById('btnNovaTrilha').addEventListener('click', () => abrirModal());
    document.getElementById('img_url').addEventListener('input', (e) => atualizarPreview(e.target.value));
    document.getElementById('btnAbrirTags').addEventListener('click', abrirModalTags);

    // Dropdown do usuário
    document.getElementById('user-icon').addEventListener('click', () => {
        document.getElementById('user-dropdown').classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-profile')) {
            document.getElementById('user-dropdown').classList.remove('open');
        }
    });

    // Aviso de status ativo
    document.getElementById('status').addEventListener('change', function () {
        const aviso = document.getElementById('statusAviso');
        const id    = document.getElementById('trilha_id').value;
        aviso.style.display = (this.value === '1' && !id) ? 'block' : 'none';
    });
});

/* ── VERIFICAR SESSÃO ───────────────────────── */
async function verificarSessao() {
    try {
        const res  = await fetch('../backend/check_session.php');
        const data = await res.json();

        if (!data.loggedIn) {
            window.location.href = 'index.html';
            return;
        }

        const nivel = parseInt(data.user.nivel);
        if (nivel !== 0 && nivel !== 1) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('user-name').textContent =
            data.user.apelido || data.user.nome || 'Usuário';

    } catch (e) {
        console.error('Erro ao verificar sessão:', e);
        window.location.href = 'index.html';
    }
}

/* ── PREVIEW DE IMAGEM ──────────────────────── */
function atualizarPreview(url) {
    const preview = document.getElementById('previewImg');
    if (url) {
        preview.style.backgroundImage = `url('${url}')`;
        preview.innerHTML = '';
    } else {
        preview.style.backgroundImage = 'none';
        preview.innerHTML = '<span>Prévia da Imagem</span>';
    }
}

/* ── LISTAR TRILHAS ─────────────────────────── */
async function listarTrilhas(p = 1) {
    paginaAtual = p;
    const tbody = document.getElementById('listaTrilhas');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;">Carregando...</td></tr>';

    try {
        const res      = await fetch(`../backend/edit_trilha.php?action=list&p=${paginaAtual}`);
        const response = await res.json();

        if (!response.dados) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:red;">Erro ao carregar dados.</td></tr>';
            return;
        }

        const data      = response.dados;
        const statusTxt = { 0: 'Criado', 1: 'Ativo', 3: 'Inativo' };

        let html = '';
        if (data.length > 0) {
            data.forEach(t => {
                html += `
                <tr>
                    <td>#${t.id_trilha}</td>
                    <td>
                        <img src="${t.img || ''}" class="img-table"
                             onerror="this.src='https://placehold.co/45x45?text=IMG'">
                    </td>
                    <td><strong>${escHtml(t.nome)}</strong></td>
                    <td>${t.nome_tag ? escHtml(t.nome_tag) : '---'}</td>
                    <td><span class="badge st-${t.status}">${statusTxt[t.status] ?? t.status}</span></td>
                    <td style="text-align:right;white-space:nowrap;">
                        <a href="edit_curso.html?id_trilha=${t.id_trilha}" class="btn-tag" style="margin-right:8px;">Aulas</a>
                        <button onclick='abrirModal(${JSON.stringify(t)})' class="btn-edit">Editar</button>
                        <button onclick="deletarTrilha(${t.id_trilha})" class="btn-del">Excluir</button>
                    </td>
                </tr>`;
            });
        } else {
            html = '<tr><td colspan="6" style="text-align:center;padding:30px;">Nenhuma trilha encontrada.</td></tr>';
        }

        tbody.innerHTML = html;
        renderizarPaginacao(response.totalPaginas || 1, response.pagina || 1);

    } catch (e) {
        console.error('Erro ao listar:', e);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:red;">Erro de conexão.</td></tr>';
    }
}

/* ── PAGINAÇÃO ──────────────────────────────── */
function renderizarPaginacao(totalPaginas, paginaAtiva) {
    const html = `
        <div class="paginacao-container">
            <button class="btn-pag" onclick="listarTrilhas(${paginaAtiva - 1})"
                    ${paginaAtiva <= 1 ? 'disabled' : ''}>← Anterior</button>
            <span class="pag-info">Página ${paginaAtiva} de ${totalPaginas}</span>
            <button class="btn-pag" onclick="listarTrilhas(${paginaAtiva + 1})"
                    ${paginaAtiva >= totalPaginas ? 'disabled' : ''}>Próxima →</button>
        </div>`;

    let pagDiv = document.getElementById('paginacao');
    if (!pagDiv) {
        pagDiv = document.createElement('div');
        pagDiv.id = 'paginacao';
        document.querySelector('.table-container').after(pagDiv);
    }
    pagDiv.innerHTML = html;
}

/* ── ABRIR MODAL ────────────────────────────── */
function abrirModal(dados = null) {
    const form = document.getElementById('formTrilha');
    form.reset();
    atualizarPreview('');
    document.getElementById('statusAviso').style.display = 'none';
    document.getElementById('id_tag_interesse').value    = '';

    if (dados) {
        document.getElementById('modalTitle').innerText      = 'Editar: ' + dados.nome;
        document.getElementById('trilha_id').value           = dados.id_trilha;
        document.getElementById('nome').value                = dados.nome;
        document.getElementById('descricao').value           = dados.descricao || '';
        document.getElementById('img_url').value             = dados.img || '';
        document.getElementById('id_tag_interesse').value    = dados.id_tag_interesse || '';
        document.getElementById('tagSelecionadaNome').innerText = dados.nome_tag || 'Selecionada';
        document.getElementById('status').value              = dados.status;
        document.getElementById('data_criacao').innerText    = dados.data_criacao || '--';
        document.getElementById('updated_at').innerText      = dados.updated_at   || '--';
        document.getElementById('infoDatas').style.display   = 'block';
        atualizarPreview(dados.img || '');
    } else {
        document.getElementById('modalTitle').innerText          = 'Nova Trilha';
        document.getElementById('trilha_id').value               = '';
        document.getElementById('tagSelecionadaNome').innerText  = 'Nenhuma selecionada';
        document.getElementById('infoDatas').style.display       = 'none';
    }

    document.getElementById('modalTrilha').style.display = 'block';
}

/* ── FECHAR MODAL ───────────────────────────── */
function fecharModal() {
    document.getElementById('modalTrilha').style.display = 'none';
}

// Fecha modal ao clicar no backdrop
document.getElementById('modalTrilha')?.addEventListener('click', function (e) {
    if (e.target === this) fecharModal();
});

/* ── SALVAR TRILHA ──────────────────────────── */
async function salvarTrilha(e) {
    e.preventDefault();

    const btn = document.getElementById('btnSalvar');
    btn.disabled    = true;
    btn.textContent = 'Salvando...';

    const formData = new FormData(e.target);
    formData.append('action', 'save');

    try {
        const res    = await fetch('../backend/edit_trilha.php', { method: 'POST', body: formData });
        const result = await res.json();

        if (result.success) {
            fecharModal();
            listarTrilhas(paginaAtual);
        } else {
            alert('Erro: ' + (result.error || 'Não foi possível salvar.'));
        }
    } catch (err) {
        console.error('Erro na requisição:', err);
        alert('Erro inesperado. Verifique o console.');
    } finally {
        btn.disabled    = false;
        btn.textContent = 'Salvar Dados';
    }
}

/* ── DELETAR TRILHA ─────────────────────────── */
async function deletarTrilha(id) {
    if (!confirm('Deseja excluir esta trilha? Esta ação não pode ser desfeita.')) return;

    try {
        const res    = await fetch(`../backend/edit_trilha.php?action=delete&id=${id}`);
        const result = await res.json();

        if (result.success) {
            listarTrilhas(paginaAtual);
        } else {
            alert('Erro ao excluir: ' + (result.error || ''));
        }
    } catch (e) {
        console.error(e);
        alert('Erro de conexão ao excluir.');
    }
}

/* ── MODAL TAGS ─────────────────────────────── */
async function abrirModalTags() {
    try {
        const res  = await fetch('../backend/edit_trilha.php?action=list_tags');
        const tags = await res.json();

        let html = '';
        if (tags.length > 0) {
            tags.forEach(tag => {
                html += `<div class="tag-item" onclick="selecionarTag(${tag.id}, '${escHtml(tag.nome).replace(/'/g, "\\'")}')">
                             ${escHtml(tag.nome)}
                         </div>`;
            });
        } else {
            html = '<p style="color:#888;font-size:0.85rem;">Nenhuma tag cadastrada.</p>';
        }

        document.getElementById('gridTags').innerHTML   = html;
        document.getElementById('modalTags').style.display = 'block';

    } catch (e) {
        console.error(e);
        alert('Erro ao carregar tags.');
    }
}

function selecionarTag(id, nome) {
    document.getElementById('id_tag_interesse').value       = id;
    document.getElementById('tagSelecionadaNome').innerText = nome;
    document.getElementById('modalTags').style.display      = 'none';
}

function fecharModalTags() {
    document.getElementById('modalTags').style.display = 'none';
}

/* ── UTILITÁRIO ─────────────────────────────── */
function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}