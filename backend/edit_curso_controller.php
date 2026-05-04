<?php
ob_start();
require_once 'check_session.php';
ob_clean();
header('Content-Type: application/json');

$host = "localhost"; $user = "gabrielkafferDS"; $password = "gabrielkafferDS123@"; $database = "spectrum";
$conn = new mysqli($host, $user, $password, $database);

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'list':
            $id_trilha = $_GET['id_trilha'];
            $stmt = $conn->prepare("SELECT * FROM cursos WHERE id_trilha = ? ORDER BY ordem ASC");
            $stmt->bind_param("i", $id_trilha);
            $stmt->execute();
            echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
            break;

        case 'save':
            $id = $_POST['id_curso'];
            $id_trilha = $_POST['id_trilha'];
            $nome = $_POST['nome'];
            $video = $_POST['aula_video'];
            $texto = $_POST['aula_texto'];
            $ordem = $_POST['ordem'];
            $status = $_POST['status'];

            if (empty($id)) {
                $stmt = $conn->prepare("INSERT INTO cursos (id_trilha, nome, aula_video, aula_texto, ordem, status, data_criacao) VALUES (?, ?, ?, ?, ?, ?, NOW())");
                $stmt->bind_param("isssii", $id_trilha, $nome, $video, $texto, $ordem, $status);
            } else {
                $stmt = $conn->prepare("UPDATE cursos SET nome=?, aula_video=?, aula_texto=?, ordem=?, status=? WHERE id_curso=?");
                $stmt->bind_param("sssiii", $nome, $video, $texto, $ordem, $status, $id);
            }
            echo json_encode(['success' => $stmt->execute()]);
            break;

        case 'delete':
            $id = $_GET['id'];
            $stmt = $conn->prepare("DELETE FROM cursos WHERE id_curso = ?");
            $stmt->bind_param("i", $id);
            echo json_encode(['success' => $stmt->execute()]);
            break;
    }
} catch (Exception $e) { echo json_encode(['success' => false, 'error' => $e->getMessage()]); }
