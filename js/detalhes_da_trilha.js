let idTrilhaAtual = null;

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    idTrilhaAtual = params.get("id");

    if (!idTrilhaAtual) {
        alert("Trilha não informada.");
        window.location.href = "trilha_cursos.html";
        return;
    }

    carregarUsuario();
    carregarDetalhesTrilha();

    const userIcon = document.getElementById("user-icon");
    const dropdown = document.getElementById("user-dropdown");

    if (userIcon && dropdown) {
        userIcon.addEventListener("click", () => {
            dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
        });

        document.addEventListener("click", (e) => {
            if (!userIcon.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = "none";
            }
        });
    }
});

function carregarUsuario() {
    fetch("../backend/check_session.php")
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                const nome = data.user.nome || "Usuário";
                const primeiroNome = nome.split(" ")[0];
                document.getElementById("user-name").innerText = primeiroNome;
            } else {
                window.location.href = "login.html";
            }
        })
        .catch(() => {
            window.location.href = "login.html";
        });
}

function carregarDetalhesTrilha() {
    fetch(`../backend/detalhes_da_trilha.php?action=detalhe&id_trilha=${idTrilhaAtual}`)
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                alert(data.error || "Erro ao carregar trilha.");
                window.location.href = "trilha_cursos.html";
                return;
            }

            renderizarTopo(data);
            renderizarCursos(data.cursos || []);
        })
        .catch(() => {
            alert("Erro ao carregar dados da trilha.");
        });
}

function renderizarTopo(data) {
    const trilha = data.trilha;

    document.getElementById("trilha-nome").innerText = trilha.nome || "Trilha";
    document.getElementById("trilha-tag").innerText = trilha.nome_tag || "Sem categoria";
    document.getElementById("trilha-descricao").innerText = trilha.descricao || "Sem descrição disponível.";

    document.getElementById("trilha-cursos").innerText = data.total_cursos || 0;
    document.getElementById("trilha-duracao").innerText = formatarDuracao(data.total_duracao || 0);

    const favoritoImg = document.getElementById("favorito-img");
    favoritoImg.src = data.favorito ? "../Imagens/heart_1.png" : "../Imagens/heart.png";

    document.getElementById("btn-favorito").onclick = toggleFavoritoDetalhe;

    renderizarAcao(data.progresso);
}

function renderizarAcao(progresso) {
    const container = document.getElementById("trilha-acao");

    if (!progresso) {
        container.innerHTML = `
            <button type="button" class="btn-matricula" onclick="matricularTrilha()">
                Quero me matricular
            </button>
        `;
        return;
    }

    const statusInfo = getStatusInfo(progresso.status);

    container.innerHTML = `
        <span class="status-trilha"
            style="
                color: ${statusInfo.cor};
                border-color: ${statusInfo.cor};
                background: ${statusInfo.background};
            ">
            ${statusInfo.texto}
        </span>
    `;
}

function renderizarCursos(cursos) {
    const container = document.getElementById("lista-cursos");

    if (!cursos.length) {
        container.innerHTML = `
            <div class="cursos-vazio">
                Nenhum curso ativo encontrado para esta trilha.
            </div>
        `;
        return;
    }

    container.innerHTML = cursos.map(curso => {
        const statusInfo = getStatusInfo(curso.progresso_status ?? 0);
        const duracao = formatarDuracao(curso.duracao || 0);

        return `
            <div class="curso-item">
                <div class="curso-info">
                    <h3>${curso.nome || "Curso"}</h3>
                    <p>${curso.descricao || "Sem descrição disponível."}</p>
                    <span class="curso-duracao">Duração: ${duracao}</span>
                </div>

                <div class="curso-acoes">
                    <span class="status-curso"
                        style="
                            color: ${statusInfo.cor};
                            border-color: ${statusInfo.cor};
                            background: ${statusInfo.background};
                        ">
                        ${statusInfo.texto}
                    </span>

                    <button type="button" class="btn-acessar-curso" onclick="acessarCurso(${curso.id_curso})">
                        Acessar curso
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function toggleFavoritoDetalhe() {
    fetch("../backend/detalhes_da_trilha.php?action=toggle_favorito", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `id_trilha=${encodeURIComponent(idTrilhaAtual)}`
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            alert(data.error || "Erro ao alterar favorito.");
            return;
        }

        document.getElementById("favorito-img").src = data.favorito
            ? "../Imagens/heart_1.png"
            : "../Imagens/heart.png";
    })
    .catch(() => {
        alert("Erro ao alterar favorito.");
    });
}

function matricularTrilha() {
    fetch("../backend/detalhes_da_trilha.php?action=matricular", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `id_trilha=${encodeURIComponent(idTrilhaAtual)}`
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            alert(data.error || "Erro ao realizar matrícula.");
            return;
        }

        renderizarAcao(data.progresso);
    })
    .catch(() => {
        alert("Erro ao realizar matrícula.");
    });
}

function acessarCurso(idCurso) {
    fetch("../backend/detalhes_da_trilha.php?action=acessar_curso", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `id_curso=${encodeURIComponent(idCurso)}`
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            alert(data.error || "Erro ao acessar curso.");
            return;
        }

        window.location.href = `aula.html?id=${idCurso}`;
    })
    .catch(() => {
        alert("Erro ao acessar curso.");
    });
}

function formatarDuracao(minutos) {
    minutos = parseInt(minutos || 0);

    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    if (horas <= 0 && mins <= 0) return "0h";
    if (horas <= 0) return `${mins}m`;
    if (mins === 0) return `${horas}h`;

    return `${horas}h ${mins}m`;
}

function getStatusInfo(status) {

    switch (parseInt(status)) {

        case 0:
            return {
                texto: "Não Iniciado",
                cor: "#FF9800",
                background: "rgba(255, 152, 0, 0.28)"
            };

        case 1:
            return {
                texto: "Em Andamento",
                cor: "#00B0FF",
                background: "rgba(0, 176, 255, 0.28)"
            };

        case 2:
            return {
                texto: "Concluído",
                cor: "#009688",
                background: "rgba(0, 200, 83, 0.32)"
            };

        default:
            return {
                texto: "Não Iniciado",
                cor: "#FF9800",
                background: "rgba(255, 152, 0, 0.28)"
            };
    }
}