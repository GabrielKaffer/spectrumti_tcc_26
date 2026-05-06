let idCursoAtual = null;
let idTrilhaAtual = null;

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    idCursoAtual = params.get("id");

    if (!idCursoAtual) {
        alert("Curso não informado.");
        window.location.href = "trilha_cursos.html";
        return;
    }

    carregarUsuario();
    carregarAula();

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

function carregarAula() {
    fetch(`../backend/aula.php?action=detalhe&id_curso=${idCursoAtual}`)
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                alert(data.error || "Erro ao carregar aula.");
                window.location.href = "trilha_cursos.html";
                return;
            }

            renderizarAula(data);
        })
        .catch(() => {
            alert("Erro ao carregar aula.");
        });
}

function renderizarAula(data) {
    const curso = data.curso;

    idCursoAtual = curso.id_curso;
    idTrilhaAtual = curso.id_trilha;

    document.getElementById("aula-trilha").innerText = data.trilha?.nome || "Trilha";
    document.getElementById("aula-nome").innerText = curso.nome || "Aula";
    document.getElementById("aula-descricao").innerText = curso.descricao || "Sem descrição disponível.";
    document.getElementById("aula-video").src = converterYoutubeEmbed(curso.aula_video || "");
    document.getElementById("aula-texto").innerHTML = curso.aula_texto || "<p>Nenhum texto cadastrado para esta aula.</p>";

    document.getElementById("btn-voltar").onclick = () => {
        window.location.href = `detalhes_da_trilha.html?id=${idTrilhaAtual}`;
    };

    mostrarVideo();
}

function mostrarVideo() {
    document.getElementById("area-video").classList.add("active");
    document.getElementById("area-texto").classList.remove("active");

    document.getElementById("btn-video").classList.add("active");
    document.getElementById("btn-texto").classList.remove("active");
}

function mostrarTexto() {
    document.getElementById("area-texto").classList.add("active");
    document.getElementById("area-video").classList.remove("active");

    document.getElementById("btn-texto").classList.add("active");
    document.getElementById("btn-video").classList.remove("active");
}

function concluirAula() {
    fetch("../backend/aula.php?action=concluir", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `id_curso=${encodeURIComponent(idCursoAtual)}`
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            alert(data.error || "Erro ao concluir aula.");
            return;
        }

        if (data.retornar_trilha) {
            window.location.href = `detalhes_da_trilha.html?id=${data.id_trilha}`;
            return;
        }

        if (data.trilha_concluida) {
            exibirConclusaoTrilha(data);
            return;
        }

        if (data.proximo_curso && data.proximo_curso.id_curso) {
            window.location.href = `aula.html?id=${data.proximo_curso.id_curso}`;
            return;
        }

        carregarAula();
    })
    .catch(() => {
        alert("Erro ao concluir aula.");
    });
}

function exibirConclusaoTrilha(data) {
    document.getElementById("aula-container").style.display = "none";
    document.getElementById("certificado-container").style.display = "flex";

    document.getElementById("certificado-mensagem").innerText =
        `Você concluiu a trilha "${data.certificado.nome_trilha}" e seu certificado já está disponível.`;

    document.getElementById("btn-voltar-certificado").onclick = () => {
        window.location.href = `detalhes_da_trilha.html?id=${data.certificado.id_trilha}`;
    };

    document.getElementById("btn-acessar-certificado").href =
        `certificado.html?id=${data.certificado.id_certificado}`;
}

function converterYoutubeEmbed(url) {
    if (!url) {
        return "";
    }

    let videoId = "";

    if (url.includes("youtube.com/watch?v=")) {
        videoId = url.split("v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
    } else if (url.includes("youtube.com/embed/")) {
        videoId = url.split("embed/")[1].split("?")[0];
    }

    if (!videoId) {
        return url;
    }

    return `https://www.youtube.com/embed/${videoId}`;
}