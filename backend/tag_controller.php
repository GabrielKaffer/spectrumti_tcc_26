<?php
session_start();
header('Content-Type: application/json');

$host = "localhost";
$user = "gabrielkafferDS";
$password = "gabrielkafferDS123@";
$database = "spectrum";

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    echo json_encode(["error" => "Erro conexão"]);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["error" => "Não logado"]);
    exit;
}

$userId = $_SESSION['user_id'];

// verifica nivel
$stmt = $conn->prepare("SELECT nivel FROM usuarios WHERE id = ?");
$stmt->bind_param("s", $userId);
$stmt->execute();
$res = $stmt->get_result()->fetch_assoc();

if ($res['nivel'] != 0) {
    echo json_encode(["error" => "Sem permissão"]);
    exit;
}

$action = $_GET['action'] ?? 'list';

// LISTAR
if ($action == "list") {
    $result = $conn->query("SELECT * FROM tag_interesse ORDER BY id_interesse DESC");
    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    echo json_encode($data);
}

// CRIAR
if ($action == "create") {
    $nome = $_POST['nome'] ?? '';
    $img = $_POST['img'] ?? '';

    if (!$nome) {
        echo json_encode(["error" => "Nome obrigatório"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO tag_interesse (nome, img) VALUES (?, ?)");
    $stmt->bind_param("ss", $nome, $img);
    $stmt->execute();

    echo json_encode(["success" => true]);
}

// EDITAR
if ($action == "update") {
    $id = $_POST['id'];
    $nome = $_POST['nome'];
    $img = $_POST['img'];

    $stmt = $conn->prepare("UPDATE tag_interesse SET nome=?, img=? WHERE id_interesse=?");
    $stmt->bind_param("ssi", $nome, $img, $id);
    $stmt->execute();

    echo json_encode(["success" => true]);
}

// DELETAR
if ($action == "delete") {
    $id = $_POST['id'];

    $stmt = $conn->prepare("DELETE FROM tag_interesse WHERE id_interesse=?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    echo json_encode(["success" => true]);
}
?>