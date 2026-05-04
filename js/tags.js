async function checkUser(){
    const res = await fetch('../backend/check_session.php');
    const data = await res.json();

    if (!data.loggedIn || data.user.nivel != 0){
        alert("Sem permissão");
        window.location.href = "../index.html";
    }

    document.getElementById('user-name').innerText = data.user.apelido;
}

async function loadTags(){
    const res = await fetch('../backend/tag_controller.php?action=list');
    const data = await res.json();

    let html = '';

    data.forEach(tag=>{
        html += `
        <div class="tag-card">
            <img src="${tag.img || 'https://via.placeholder.com/200'}" class="tag-img">
            <div class="tag-body">
                <h4>${tag.nome}</h4>
                <div class="card-actions">
                    <button class="btn-secondary" onclick="edit(${tag.id_interesse}, '${tag.nome}', '${tag.img}')">Editar</button>
                    <button class="btn-danger" onclick="remove(${tag.id_interesse})">Excluir</button>
                </div>
            </div>
        </div>`;
    });

    document.getElementById('tags').innerHTML = html;
}

/* MODAL */
function openModal(){
    document.getElementById('modal').classList.add('active');
}

function closeModal(){
    document.getElementById('modal').classList.remove('active');

    document.getElementById('id').value = '';
    document.getElementById('nome').value = '';
    document.getElementById('img').value = '';
}

function edit(id, nome, img){
    openModal();

    document.getElementById('id').value = id;
    document.getElementById('nome').value = nome;
    document.getElementById('img').value = img;
}

/* SALVAR */
async function save(){
    const id = document.getElementById('id').value;
    const nome = document.getElementById('nome').value;
    const img = document.getElementById('img').value;

    if (!nome) {
        alert("Nome obrigatório");
        return;
    }

    const form = new FormData();
    form.append('id', id);
    form.append('nome', nome);
    form.append('img', img);

    const action = id ? 'update' : 'create';

    await fetch(`../backend/tag_controller.php?action=${action}`, {
        method:'POST',
        body:form
    });

    closeModal();
    loadTags();
}

/* DELETE */
async function remove(id){
    if(!confirm("Excluir tag?")) return;

    const form = new FormData();
    form.append('id', id);

    await fetch('../backend/tag_controller.php?action=delete', {
        method:'POST',
        body:form
    });

    loadTags();
}

/* INIT */
checkUser();
loadTags();