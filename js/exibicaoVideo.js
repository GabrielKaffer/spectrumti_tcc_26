// 1. SIMULAÇÃO DE DADOS (A "Tabela" do Banco de Dados)
const cursoData = {
    nome: "JavaScript Masterclass",
    trilha: "Desenvolvimento Front-end",
    ordem: 3,
    totalCursos: 9,
    tipo: "video", // video ou texto
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", 
    conteudoHtml: `
        <h2>Bem-vindo à aula de DOM!</h2>
        <p>Nesta aula, aprenderemos a manipular elementos HTML usando <strong>JavaScript Puro</strong>.</p>
        <p>O DOM (Document Object Model) é a interface que permite que scripts acessem o conteúdo da página.</p>
    `,
    statusUsuario: "Em andamento"
};

// 2. CONTROLE DE ESTADO DA APLICAÇÃO
// Guardamos o que o usuário está vendo no momento
let estadoAtual = {
    modo: cursoData.tipo, // 'video' ou 'texto'
    status: cursoData.statusUsuario,
    urlManual: ""
};

// 3. SELEÇÃO DE ELEMENTOS DO DOM
const elCourseName = document.getElementById('course-name');
const elStatusTag = document.getElementById('status-tag');
const elTrailName = document.getElementById('trail-name');
const elCurrentIndex = document.getElementById('current-index');
const elTotalCourses = document.getElementById('total-courses');
const elContentArea = document.getElementById('content-area');
const btnVideo = document.getElementById('btn-video');
const btnText = document.getElementById('btn-text');
const btnNext = document.getElementById('btn-next');
const inputManual = document.getElementById('manual-url');
const btnLoadManual = document.getElementById('btn-load-manual');

// 4. FUNÇÕES DE RENDERIZAÇÃO

// Função principal que desenha a página baseada nos dados
function renderizarPagina() {
    // Preenchendo cabeçalho
    elCourseName.innerText = cursoData.nome;
    elTrailName.innerText = cursoData.trilha;
    elCurrentIndex.innerText = cursoData.ordem;
    elTotalCourses.innerText = cursoData.totalCursos;
    
    // Atualizando Badge de Status
    elStatusTag.innerText = estadoAtual.status;
    elStatusTag.className = 'badge ' + (estadoAtual.status === 'Concluído' ? 'concluido' : 'em-andamento');

    // Alternando o conteúdo principal
    if (estadoAtual.modo === 'video') {
        renderizarVideo(estadoAtual.urlManual || cursoData.videoUrl);
        btnVideo.classList.add('active');
        btnText.classList.remove('active');
    } else {
        renderizarTexto();
        btnText.classList.add('active');
        btnVideo.classList.remove('active');
    }
}

function renderizarVideo(url) {
    // Usamos Template Literals (``) para criar o HTML do iframe
    elContentArea.innerHTML = `
        <div class="video-container">
            <iframe src="${url}" allowfullscreen></iframe>
        </div>
    `;
}

function renderizarTexto() {
    // innerHTML renderiza as tags <p>, <h1>, etc., contidas na string
    elContentArea.innerHTML = `<div class="text-content">${cursoData.conteudoHtml}</div>`;
}

// 5. LÓGICA DE INTERAÇÃO (EVENTOS)

// Alternar para Vídeo
btnVideo.addEventListener('click', () => {
    estadoAtual.modo = 'video';
    renderizarPagina();
});

// Alternar para Texto
btnText.addEventListener('click', () => {
    estadoAtual.modo = 'texto';
    renderizarPagina();
});

// Carregar Link Manual
btnLoadManual.addEventListener('click', () => {
    const url = inputManual.value;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        // Converte link comum em link de embed para o iframe funcionar
        const videoId = url.split('v=')[1] || url.split('/').pop();
        estadoAtual.urlManual = `https://www.youtube.com/embed/${videoId}`;
        estadoAtual.modo = 'video';
        renderizarPagina();
    } else {
        alert("Por favor, insira um link válido do YouTube.");
    }
});

// Avançar / Concluir
btnNext.addEventListener('click', () => {
    estadoAtual.status = 'Concluído';
    alert("Curso concluído com sucesso! Avançando...");
    renderizarPagina();
});

// Inicialização
renderizarPagina();