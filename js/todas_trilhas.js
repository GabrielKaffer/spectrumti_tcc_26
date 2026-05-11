// ── STATE ─────────────────────────────────────────────────────────────────
let allTrilhas  = [];
let filtroTag   = '';
let filtroDur   = '';
let filtroFav   = '';
let searchQuery = '';

// ── INIT ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {

    // Sessão
    fetch("../backend/check_session.php")
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                const primeiroNome = data.user.nome.split(" ")[0];
                document.getElementById("user-name").innerText = primeiroNome;
            } else {
                document.getElementById("user-name").innerText = "Visitante";
            }
        });

    // Carregar trilhas
    fetch("../backend/trilha_controller.php?action=todas_trilhas")
        .then(res => res.json())
        .then(data => {
            document.getElementById("loading-grid").style.display = "none";
            document.getElementById("grid-trilhas").style.display = "grid";

            if (data.success && data.dados) {
                allTrilhas = data.dados;
                buildTagChips();
                renderAll();
            }
        })
        .catch(() => {
            document.getElementById("loading-grid").style.display = "none";
            document.getElementById("grid-trilhas").style.display = "grid";
            document.getElementById("grid-trilhas").innerHTML =
                '<p style="color:#aaa">Erro ao carregar trilhas. Verifique sua conexão.</p>';
        });

    // Busca em tempo real
    document.getElementById("search-input").addEventListener("input", e => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderAll();
    });

    // Abrir/fechar painel de filtros
    document.getElementById("btn-filter").addEventListener("click", () => {
        document.getElementById("filter-panel").classList.toggle("open");
        document.getElementById("btn-filter").classList.toggle("active");
    });

    // Limpar filtros
    document.getElementById("btn-clear-filters").addEventListener("click", clearFilters);

    // Chips (delegação de evento por grupo)
    document.querySelectorAll(".chip-group").forEach(group => {
        group.addEventListener("click", e => {
            const chip = e.target.closest(".chip");
            if (!chip) return;

            group.querySelectorAll(".chip").forEach(c => c.classList.remove("selected"));
            chip.classList.add("selected");

            const val = chip.dataset.val;
            if (group.id === "chips-tag")     filtroTag = val;
            if (group.id === "chips-duracao") filtroDur = val;
            if (group.id === "chips-fav")     filtroFav = val;

            updateBadge();
            renderAll();
        });
    });

    // Dropdown do usuário
    document.getElementById("user-icon").addEventListener("click", () => {
        const d = document.getElementById("user-dropdown");
        d.style.display = d.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", e => {
        if (!e.target.closest(".user-profile")) {
            document.getElementById("user-dropdown").style.display = "none";
        }
    });
});

// ── BUILD TAG CHIPS ───────────────────────────────────────────────────────
function buildTagChips() {
    const tags = [...new Set(allTrilhas.map(t => t.nome_tag).filter(Boolean))].sort();
    const wrap = document.getElementById("chips-tag");

    tags.forEach(tag => {
        const chip = document.createElement("span");
        chip.className   = "chip";
        chip.dataset.val = tag;
        chip.textContent = tag;
        wrap.appendChild(chip);
    });
}

// ── FILTRAR + RENDERIZAR ──────────────────────────────────────────────────
function renderAll() {
    let lista = [...allTrilhas];

    // Busca
    if (searchQuery) {
        lista = lista.filter(t =>
            (t.nome      || "").toLowerCase().includes(searchQuery) ||
            (t.descricao || "").toLowerCase().includes(searchQuery)
        );
    }

    // Categoria
    if (filtroTag) {
        lista = lista.filter(t => t.nome_tag === filtroTag);
    }

    // Duração
    if (filtroDur) {
        lista = lista.filter(t => {
            const min = t.total_duracao || 0;
            if (filtroDur === "short")  return min <= 120;
            if (filtroDur === "medium") return min > 120 && min <= 480;
            if (filtroDur === "long")   return min > 480;
            return true;
        });
    }

    // Favorito
    if (filtroFav === "1") {
        lista = lista.filter(t => t.favorito == 1);
    }

    // Contador de resultados
    document.getElementById("results-info").innerHTML =
        `<strong>${lista.length}</strong> trilha${lista.length !== 1 ? "s" : ""} encontrada${lista.length !== 1 ? "s" : ""}`;

    const container = document.getElementById("grid-trilhas");

    if (!lista.length) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Nenhuma trilha encontrada. Tente ajustar os filtros ou o termo de busca.</p>
            </div>`;
        return;
    }

    container.innerHTML = lista.map(trilha => cardHTML(trilha)).join("");
}

// ── CARD HTML — idêntico ao dashboard.js ─────────────────────────────────
function cardHTML(trilha) {

    const statusInfo      = getStatusInfo(trilha.progresso_status);
    const heartImg        = trilha.favorito == 1
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

            <a class="btn-access" href="detalhes_da_trilha.html?id=${trilha.id_trilha}">
                Acessar
            </a>

        </div>

    </div>`;
}

// ── TOGGLE FAVORITO — idêntico ao dashboard.js ────────────────────────────
function toggleFavorito(id, el) {

    fetch("../backend/trilha_controller.php?action=toggle_favorito", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `id_trilha=${id}`
    })
    .then(res => res.json())
    .then(data => {
        el.src = data.favorito
            ? "../Imagens/heart_1.png"
            : "../Imagens/heart.png";

        // Atualiza estado local
        const trilha = allTrilhas.find(t => t.id_trilha == id);
        if (trilha) trilha.favorito = data.favorito;

        // Re-renderiza se filtro de favorito estiver ativo
        if (filtroFav === "1") renderAll();
    });
}

// ── HELPERS — idênticos ao dashboard.js ──────────────────────────────────
function formatarDuracao(minutos) {
    const horas = Math.floor(minutos / 60);
    const mins  = minutos % 60;
    if (mins === 0) return `${horas}h`;
    return `${horas}h ${mins}m`;
}

function getStatusInfo(status) {
    if (status === null || status === undefined) {
        return { texto: "Não Matriculado", cor: "#F44336" };
    }
    switch (parseInt(status)) {
        case 0:  return { texto: "Não Iniciado", cor: "#ffc107" };
        case 1:  return { texto: "Em Andamento", cor: "#29B6F6" };
        case 2:  return { texto: "Concluído",    cor: "#64dd17" };
        default: return { texto: "Não Matriculado", cor: "#F44336" };
    }
}

function clearFilters() {
    filtroTag = "";
    filtroDur = "";
    filtroFav = "";

    document.querySelectorAll(".chip-group").forEach(group => {
        group.querySelectorAll(".chip").forEach((chip, i) => {
            chip.classList.toggle("selected", i === 0);
        });
    });

    updateBadge();
    renderAll();
}

function updateBadge() {
    const count = [filtroTag, filtroDur, filtroFav].filter(Boolean).length;
    const badge = document.getElementById("filter-badge");
    badge.textContent   = count;
    badge.style.display = count ? "inline-flex" : "none";
}