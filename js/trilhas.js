let paginaAtual = 1;

document.addEventListener('DOMContentLoaded', () => {
    listarTrilhas();
    document.getElementById('formTrilha').addEventListener('submit', salvarTrilha);
    document.getElementById('btnNovaTrilha').onclick = () => abrirModal();
    document.getElementById('img_url').oninput = (e) => atualizarPreview(e.target.value);
});

function atualizarPreview(url) {
    const preview = document.getElementById('previewImg');
    if(url) {
        preview.style.backgroundImage = `url('${url}')`;
        preview.innerHTML = '';
    } else {
        preview.style.backgroundImage = 'none';
        preview.innerHTML = '<span>Prévia da Imagem</span>';
    }
}

async function listarTrilhas(p = 1) {
    paginaAtual = p;
    try {
        // ESSENCIAL: action=list
        const res = await fetch(`../backend/edit_trilha.php?action=list&p=${paginaAtual}`);
        const response = await res.json();
        const data = response.dados;
        const statusTxt = { 0: 'Criado', 1: 'Ativo', 3: 'Inativo' };
        
        let html = '';
        if (data && data.length > 0) {
            data.forEach(t => {
                html += `
                    <tr>
                        <td>#${t.id_trilha}</td>
                        <td><img src="${t.img || ''}" class="img-table" onerror="this.src='https://placehold.co'"></td>
                        <td><strong>${t.nome}</strong></td>
                        <td>${t.nome_tag || '---'}</td>
                        <td><span class="badge st-${t.status}">${statusTxt[t.status]}</span></td>
                        <td style="text-align: right; white-space: nowrap;">
                            <a href="edit_curso.html?id_trilha=${t.id_trilha}" class="btn-tag" style="margin-right:8px;">Aulas</a>
                            <button onclick='abrirModal(${JSON.stringify(t)})' class="btn-edit">Editar</button>
                            <button onclick="deletarTrilha(${t.id_trilha})" class="btn-del">Excluir</button>
                        </td>
                    </tr>`;
            });
        } else {
            html = '<tr><td colspan="6" style="text-align:center; padding: 20px;">Nenhuma trilha encontrada.</td></tr>';
        }

        document.getElementById('listaTrilhas').innerHTML = html;
        renderizarPaginacao(response.totalPaginas, response.pagina);

    } catch (e) {
        console.error("Erro ao listar:", e);
    }
}

function renderizarPaginacao(totalPaginas, paginaAtiva) {
    let html = `
        <div class="paginacao-container">
            <button onclick="listarTrilhas(${paginaAtiva - 1})" ${paginaAtiva <= 1 ? 'disabled' : ''}>Anterior</button>
            <span>Página ${paginaAtiva} de ${totalPaginas}</span>
            <button onclick="listarTrilhas(${paginaAtiva + 1})" ${paginaAtiva >= totalPaginas ? 'disabled' : ''}>Próxima</button>
        </div>
    `;

    let pagDiv = document.getElementById('paginacao');
    if(!pagDiv) {
        pagDiv = document.createElement('div');
        pagDiv.id = 'paginacao';
        document.querySelector('.table-container').after(pagDiv);
    }
    pagDiv.innerHTML = html;
}

function abrirModal(dados = null) {
    const form = document.getElementById('formTrilha');
    form.reset();
    atualizarPreview('');

    if (dados) {
        document.getElementById('modalTitle').innerText = "Editar: " + dados.nome;
        document.getElementById('trilha_id').value = dados.id_trilha;
        document.getElementById('nome').value = dados.nome;
        document.getElementById('descricao').value = dados.descricao;
        document.getElementById('img_url').value = dados.img;
        document.getElementById('id_tag_interesse').value = dados.id_tag_interesse;
        document.getElementById('tagSelecionadaNome').innerText = dados.nome_tag || 'Selecionada';
        document.getElementById('status').value = dados.status;
        document.getElementById('data_criacao').innerText = dados.data_criacao || '--';
        document.getElementById('updated_at').innerText = dados.updated_at || '--';
        document.getElementById('infoDatas').style.display = 'block';
        atualizarPreview(dados.img);
    } else {
        document.getElementById('modalTitle').innerText = "Nova Trilha";
        document.getElementById('trilha_id').value = '';
        document.getElementById('infoDatas').style.display = 'none';
        document.getElementById('tagSelecionadaNome').innerText = 'Nenhuma selecionada';
    }

    document.getElementById('modalTrilha').style.display = 'block';
}

function fecharModal() {
    document.getElementById('modalTrilha').style.display = 'none';
}

async function salvarTrilha(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    // ESSENCIAL: action=save para o PHP saber o que fazer
    formData.append('action', 'save');

    try {
        const res = await fetch('../backend/edit_trilha.php', {
            method: 'POST',
            body: formData
        });

        const result = await res.json();

        if (result.success) {
            fecharModal();
            listarTrilhas(paginaAtual);
        } else {
            alert(result.error || 'Erro ao salvar');
        }
    } catch (err) {
        console.error('Erro na requisição:', err);
        alert('Erro inesperado no servidor');
    }
}

async function deletarTrilha(id) {
    if(confirm('Excluir trilha?')) {
        // ESSENCIAL: action=delete
        await fetch(`../backend/edit_trilha.php?action=delete&id=${id}`);
        listarTrilhas(paginaAtual);
    }
}

document.getElementById('btnAbrirTags').onclick = async () => {
    try {
        // ESSENCIAL: action=list_tags
        const res = await fetch('../backend/edit_trilha.php?action=list_tags');
        const tags = await res.json();

        let html = '';
        tags.forEach(tag => {
            html += `<div class="tag-item" onclick="selecionarTag(${tag.id}, '${tag.nome}')">${tag.nome}</div>`;
        });

        document.getElementById('gridTags').innerHTML = html;
        document.getElementById('modalTags').style.display = 'block';

    } catch (e) {
        console.error(e);
    }
};

function selecionarTag(id, nome) {
    document.getElementById('id_tag_interesse').value = id;
    document.getElementById('tagSelecionadaNome').innerText = nome;
    document.getElementById('modalTags').style.display = 'none';
}

function fecharModalTags() {
    document.getElementById('modalTags').style.display = 'none';
}