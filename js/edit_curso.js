const urlParams = new URLSearchParams(window.location.search);
const idTrilha = urlParams.get('id_trilha');

document.addEventListener('DOMContentLoaded', () => {
    if (!idTrilha) { window.location.href = 'edit_trilha.html'; return; }
    
    document.getElementById('id_trilha_hidden').value = idTrilha;
    carregarDadosTrilha();
    listarAulas();

    document.getElementById('formCurso').onsubmit = salvarAula;
    document.getElementById('btnNovaAula').onclick = () => carregarAulaNoEditor(null);
    document.getElementById('btnExcluirAula').onclick = excluirAula;
    
    document.getElementById('aula_video').oninput = (e) => mostrarPreviewVideo(e.target.value);

    document.getElementById('user-icon').onclick = () => {
        const drop = document.getElementById('user-dropdown');
        drop.style.display = drop.style.display === 'block' ? 'none' : 'block';
    };
});

async function carregarDadosTrilha() {
    const res = await fetch(`../backend/edit_trilha_controller.php?action=list`);
    const response = await res.json();
    const trilha = response.dados.find(t => t.id_trilha == idTrilha);
    if(trilha) {
        document.getElementById('trilha_nome').innerText = trilha.nome;
        document.getElementById('trilha_desc').innerText = trilha.descricao;
    }
}

async function listarAulas() {
    const res = await fetch(`../backend/edit_curso_controller.php?action=list&id_trilha=${idTrilha}`);
    const aulas = await res.json();
    
    let html = '';
    aulas.forEach(aula => {
        html += `
            <div class="aula-item" id="item-${aula.id_curso}" onclick='selecionarAula(${JSON.stringify(aula)})'>
                <span>AULA ${aula.ordem}</span>
                <h4>${aula.nome}</h4>
            </div>`;
    });
    document.getElementById('listaAulas').innerHTML = html || '<p>Nenhuma aula cadastrada.</p>';
}

function selecionarAula(aula) {
    document.querySelectorAll('.aula-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`item-${aula.id_curso}`).classList.add('active');
    carregarAulaNoEditor(aula);
}

function carregarAulaNoEditor(aula) {
    const form = document.getElementById('formCurso');
    form.reset();
    document.getElementById('video_preview').style.display = 'none';

    if (aula) {
        document.getElementById('titulo_editor').innerText = "Editando Aula";
        document.getElementById('id_curso').value = aula.id_curso;
        document.getElementById('nome_aula').value = aula.nome;
        document.getElementById('descricao_aula').value = aula.descricao;
        document.getElementById('ordem').value = aula.ordem;
        document.getElementById('aula_video').value = aula.aula_video;
        document.getElementById('aula_texto').value = aula.aula_texto;
        document.getElementById('status_aula').value = aula.status;
        document.getElementById('data_criacao').innerText = aula.data_criacao;
        document.getElementById('updated_at').innerText = aula.updated_at;
        document.getElementById('btnExcluirAula').style.display = 'block';
        if(aula.aula_video) mostrarPreviewVideo(aula.aula_video);
    } else {
        document.getElementById('titulo_editor').innerText = "Nova Aula";
        document.getElementById('id_curso').value = '';
        document.getElementById('btnExcluirAula').style.display = 'none';
        document.getElementById('ordem').value = document.querySelectorAll('.aula-item').length + 1;
    }
}

function mostrarPreviewVideo(url) {
    const container = document.getElementById('video_preview');
    if (!url) { container.style.display = 'none'; return; }
    
    let videoId = "";
    if(url.includes('v=')) videoId = url.split('v=')[1].split('&')[0];
    else if(url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1];

    if (videoId) {
        container.style.display = 'block';
        container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
    } else {
        container.style.display = 'none';
    }
}

async function salvarAula(e) {
    e.preventDefault();
    const res = await fetch('../backend/edit_curso_controller.php?action=save', {
        method: 'POST',
        body: new FormData(e.target)
    });
    const result = await res.json();
    if(result.success) {
        listarAulas();
        carregarAulaNoEditor(null);
    }
}

async function excluirAula() {
    if(!confirm("Tem certeza que deseja excluir esta aula?")) return;
    const id = document.getElementById('id_curso').value;
    await fetch(`../backend/edit_curso_controller.php?action=delete&id=${id}`);
    listarAulas();
    carregarAulaNoEditor(null);
}