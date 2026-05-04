<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

$response = [
    'loggedIn' => false
];

// verifica se está logado
if (!empty($_SESSION['user_id'])) {

    $host = "localhost";
    $user = "root";
    $password = "";
    $database = "spectrum";

    $conn = new mysqli($host, $user, $password, $database);

    if ($conn->connect_error) {
        $response['error'] = 'Erro na conexão com banco';
        echo json_encode($response);
        exit;
    }

    $userId = $_SESSION['user_id'];

    $stmt = $conn->prepare("
        SELECT 
            id,
            nome,
            email,
            apelido,
            nivel
        FROM usuarios 
        WHERE id = ?
    ");

    $stmt->bind_param("i", $userId);
    $stmt->execute();

    $result = $stmt->get_result();
    $userData = $result->fetch_assoc();

    if ($userData) {

        // atualiza sessão com nivel
        $_SESSION['nivel'] = $userData['nivel'];

        $response['loggedIn'] = true;
        $response['user'] = [
            'id' => $userData['id'],
            'nome' => $userData['nome'],
            'email' => $userData['email'],
            'apelido' => $userData['apelido'],
            'nivel' => $userData['nivel']
        ];

    } else {
        // usuário não encontrado
        session_destroy();
    }

    $stmt->close();
    $conn->close();
}

echo json_encode($response);
?>