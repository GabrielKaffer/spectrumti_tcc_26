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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $email = trim($_POST['email'] ?? '');
    $senha = $_POST['senha'] ?? '';

    if (empty($email) || empty($senha)) {
        header("Location: ../html/login.html?error=Preencha todos os campos");
        exit;
    }

    $stmt = $conn->prepare("SELECT id, nome, senha, nivel FROM usuarios WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();

    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        header("Location: ../html/login.html?error=Credenciais inválidas");
        exit;
    }

    $user = $result->fetch_assoc();

    if (!password_verify($senha, $user['senha'])) {
        header("Location: ../html/login.html?error=Credenciais inválidas");
        exit;
    }


    session_regenerate_id(true);

    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_nome'] = $user['nome'];
    $_SESSION['user_email'] = $email;
    $_SESSION['nivel'] = $user['nivel'];

    header("Location: ../html/trilha_cursos.html");
    exit;
}

$conn->close();
?>