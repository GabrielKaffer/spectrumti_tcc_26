function getIdTrilha() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

let aulasGlobal = [];

const aulas = [
    {
        id: 1,
        nome: "Introdução ao HTML",
        descricao: "Entenda o que é HTML e como funciona.",
        conteudo: `<p>HTML é a linguagem base da web.</p>`
    },
    {
        id: 2,
        nome: "Estrutura Básica",
        descricao: "Aprenda a estrutura HTML.",
        conteudo: `<div class="code">&lt;html&gt;&lt;/html&gt;</div>`
    },
    {
        id: 3,
        nome: "Tags de Texto",
        descricao: "Principais tags.",
        conteudo: `<p>&lt;p&gt;, &lt;h1&gt;, &lt;strong&gt;</p>`
    },
    {
        id: 4,
        nome: "Links",
        descricao: "Navegação.",
        conteudo: `<div class="code">&lt;a&gt;Link&lt;/a&gt;</div>`
    },
    {
        id: 5,
        nome: "Imagens",
        descricao: "Inserindo imagens.",
        conteudo: `<div class="code">&lt;img src="img.jpg"&gt;</div>`
    }
];

async function carregarDetalhe() {
    const id = getIdTrilha();
    const lista = document.getElementById("lista-aulas");

    try {
        const res = await fetch(`/spectrumti-main/spectrumti-main/backend/trilha_controller.php?action=detalhe&id=${id}`);
        const data = await res.json();

        if (data.trilha) {
            document.getElementById("trilha-nome").innerText = data.trilha.nome;
            document.getElementById("trilha-desc").innerText = data.trilha.descricao;
        }

        aulasGlobal = (data.aulas && data.aulas.length > 0) ? data.aulas : aulas;

    } catch (error) {
        console.warn("Erro no backend, usando aulas fake");
        aulasGlobal = aulas;
    }

    lista.innerHTML = aulasGlobal.map((aula, index) => `
        <div class="aula-item" onclick="abrirAula(${index}, event)">
            <div class="aula-info">
                <span class="aula-numero">${index + 1}</span>
                <span>${aula.nome}</span>
            </div>
            <span>▶</span>
        </div>
    `).join('');

    abrirAula(0);
}

function abrirAula(index, event = null) {
    const aula = aulasGlobal[index];
    if (!aula) return;

    document.getElementById("titulo-aula").innerText = aula.nome;

    document.getElementById("conteudo-aula").innerHTML = `
        <p>${aula.descricao || ""}</p>
        ${aula.conteudo || "<p>Conteúdo não disponível</p>"}
    `;

    document.querySelectorAll(".aula-item").forEach(el => {
        el.classList.remove("ativa");
    });

    if (event) {
        event.currentTarget.classList.add("ativa");
    } else {
        document.querySelectorAll(".aula-item")[index]?.classList.add("ativa");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    carregarDetalhe();

    const btn = document.getElementById("btn-iniciar");

    if (btn) {
        btn.addEventListener("click", () => {
            abrirAula(0);
        });
    }
});