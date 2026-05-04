<?php

session_start();

$host = "localhost";
$user = "gabrielkafferDS";
$password = "gabrielkafferDS123@";
$database = "spectrum";

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die("Erro na conexão: " . $conn->connect_error);
}

function redirect_with_message($redirect, $status, $message) {
    $separator = parse_url($redirect, PHP_URL_QUERY) ? '&' : '?';
    header("Location: {$redirect}{$separator}{$status}=" . urlencode($message));
    exit;
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $nome = trim($_POST["nome"] ?? '');
    $apelido = trim($_POST["apelido"] ?? '');
    $email = trim($_POST["email"] ?? '');
    $telefone = trim($_POST["telefone"] ?? '');
    $cpf = trim($_POST["cpf"] ?? '');
    $data_nascimento = trim($_POST["data_nascimento"] ?? '');
    $senha = $_POST["senha"] ?? '';
    $confirmar_senha = $_POST["confirmar_senha"] ?? '';

    $redirect = trim($_POST["redirect"] ?? $_SERVER["HTTP_REFERER"] ?? '../html/cadastro.html');
    $redirect = filter_var($redirect, FILTER_SANITIZE_URL);

    if (!preg_match('/^(\.\.\/|\/|https?:\/\/)?[A-Za-z0-9_\-\.\/]+$/', $redirect)) {
        $redirect = '../html/cadastro.html';
    }

    if (
        empty($nome) || empty($apelido) || empty($email) || empty($telefone) ||
        empty($cpf) || empty($data_nascimento) || empty($senha) || empty($confirmar_senha)
    ) {
        redirect_with_message($redirect, 'error', 'Todos os campos são obrigatórios.');
    }

    if ($senha !== $confirmar_senha) {
        redirect_with_message($redirect, 'error', 'As senhas não coincidem.');
    }

    $stmt = $conn->prepare("SELECT id FROM usuarios WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        redirect_with_message($redirect, 'error', 'E-mail já está em uso.');
    }

    $senha_hash = password_hash($senha, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO usuarios 
        (nome, apelido, email, senha, telefone, cpf, data_nascimento, nivel, status, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 2, 1, NOW())");

    $stmt->bind_param(
        "sssssss",
        $nome,
        $apelido,
        $email,
        $senha_hash,
        $telefone,
        $cpf,
        $data_nascimento
    );

    if ($stmt->execute()) {
        $userId = $stmt->insert_id;
        $_SESSION['user_id'] = $userId;
        $_SESSION['user_nome'] = $nome;
        $_SESSION['user_email'] = $email;

        redirect_with_message($redirect, 'success', 'Usuário cadastrado com sucesso. Você está logado.');
    } else {
        redirect_with_message($redirect, 'error', 'Erro ao cadastrar usuário.');
    }

    $stmt->close();
}

$conn->close();

?>