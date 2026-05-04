document.addEventListener("DOMContentLoaded", () => {

    fetch("../backend/check_session.php")
        .then(res => res.json())
        .then(data => {

            if (data.loggedIn) {
                const nome = data.user.nome;
                const primeiroNome = nome.split(" ")[0];
                document.getElementById("user-name").innerText = primeiroNome;
            } else {
                document.getElementById("user-name").innerText = "Visitante";
            }

        });

    fetch("../backend/trilha_controller.php?action=dashboard")
        .then(res => res.json())
        .then(data => {

            renderTrilhas(data.em_andamento, "grid-minhas-trilhas");
            renderTrilhas(data.recomendados, "grid-recomendados");
            renderTrilhas(data.interesses, "grid-interesse");

        });

});

function toggleFavorito(id, el) {

    fetch("../backend/trilha_controller.php?action=toggle_favorito", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `id_trilha=${id}`
    })
    .then(res => res.json())
    .then(data => {

        el.src = data.favorito 
            ? "../Imagens/heart_1.png" 
            : "../Imagens/heart.png";

    });
}

// 🔥 NOVO
function formatarDuracao(minutos) {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;

    if (mins === 0) return `${horas}h`;
    return `${horas}h ${mins}m`;
}

function getStatusInfo(status) {

    if (status === null || status === undefined) {
        return { texto: "Não Matriculado", cor: "#F44336" };
    }

    switch (parseInt(status)) {
        case 0:
            return { texto: "Não Iniciado", cor: "#ffc107" };
        case 1:
            return { texto: "Em Andamento", cor: "#29B6F6" };
        case 2:
            return { texto: "Concluído", cor: "#64dd17" };
        default:
            return { texto: "Não Matriculado", cor: "#F44336" };
    }
}

function renderTrilhas(lista, containerId) {

    const container = document.getElementById(containerId);

    if (!lista.length) {
        container.innerHTML = "<p>Nenhuma trilha encontrada</p>";
        return;
    }

    container.innerHTML = lista.map(trilha => {

        const statusInfo = getStatusInfo(trilha.progresso_status);

        const heartImg = trilha.favorito 
            ? "../Imagens/heart_1.png" 
            : "../Imagens/heart.png";

        const duracaoFormatada = formatarDuracao(trilha.total_duracao || 0);

        return `
        <div class="card-trilha">

            <div class="card-content">

                <div class="card-header">
                    <h3>${trilha.nome}</h3>

                    <img 
                        class="heart-img"
                        src="${heartImg}"
                        onclick="toggleFavorito(${trilha.id_trilha}, this)"
                    >
                </div>

                <p class="card-desc">${trilha.descricao}</p>

                <span class="tag">${trilha.nome_tag ?? "Sem categoria"}</span>

                <!-- 🔥 NOVA LINHA -->
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-top:5px;">
                    <span>Aulas: ${trilha.total_aulas || 0}</span>
                    <span>Duração: ${duracaoFormatada}</span>
                </div>

            </div>

            <div class="card-footer">

                <span class="status-tag"
                    style="
                        color: ${statusInfo.cor};
                        border: 1px solid ${statusInfo.cor};
                        background: ${statusInfo.cor}4D;
                    ">
                    ${statusInfo.texto}
                </span>

                <a class="btn-access" href="trilha_detalhe.html?id=${trilha.id_trilha}">
                    Acessar
                </a>

            </div>

        </div>
        `;

    }).join("");
}