<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function validarSessaoUsuario()
{
    $response = [
        'loggedIn' => false
    ];

    if (empty($_SESSION['user_id'])) {
        return $response;
    }

    $host = "localhost";
    $user = "gabrielkafferDS";
    $password = "gabrielkafferDS123@";
    $database = "spectrum";

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

    try {
        $conn = new mysqli($host, $user, $password, $database);
        $conn->set_charset("utf8mb4");

        $userId = (int) $_SESSION['user_id'];

        $stmt = $conn->prepare("
            SELECT 
                id,
                nome,
                email,
                apelido,
                nivel
            FROM usuarios 
            WHERE id = ?
            LIMIT 1
        ");

        $stmt->bind_param("i", $userId);
        $stmt->execute();

        $result = $stmt->get_result();
        $userData = $result->fetch_assoc();

        if ($userData) {
            $_SESSION['user_id'] = $userData['id'];
            $_SESSION['user_nome'] = $userData['nome'];
            $_SESSION['user_email'] = $userData['email'];
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
            session_unset();
            session_destroy();
        }

        $stmt->close();
        $conn->close();

    } catch (Exception $e) {
        $response['error'] = 'Erro ao validar sessão';
    }

    return $response;
}

if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(validarSessaoUsuario());
    exit;
}
?>