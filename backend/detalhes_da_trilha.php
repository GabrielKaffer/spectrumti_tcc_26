<?php
ob_start();

require_once 'check_session.php';

ob_clean();

header('Content-Type: application/json; charset=utf-8');

$host = "localhost";
$user = "gabrielkafferDS";
$password = "gabrielkafferDS123@";
$database = "spectrum";

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {

    $sessao = validarSessaoUsuario();

    if (empty($sessao['loggedIn']) || empty($sessao['user']['id'])) {
        echo json_encode(['success' => false, 'error' => 'Sessão inválida']);
        exit;
    }

    $conn = new mysqli($host, $user, $password, $database);
    $conn->set_charset("utf8mb4");

    $action = $_GET['action'] ?? '';
    $user_id = (int) $sessao['user']['id'];

    switch ($action) {

        case 'detalhe':

            $id_trilha = (int) ($_GET['id_trilha'] ?? 0);

            if ($id_trilha <= 0) {
                echo json_encode(['success' => false, 'error' => 'Trilha inválida']);
                exit;
            }

            $stmt = $conn->prepare("
                SELECT 
                    t.id_trilha,
                    t.nome,
                    t.descricao,
                    t.img,
                    t.id_tag_interesse,
                    t.id_usuario,
                    t.nivel,
                    t.data_criacao,
                    t.status,
                    t.updated_at,
                    i.nome AS nome_tag
                FROM trilha t
                LEFT JOIN tag_interesse i ON i.id_interesse = t.id_tag_interesse
                WHERE t.id_trilha = ?
                AND t.status = 1
                LIMIT 1
            ");
            $stmt->bind_param("i", $id_trilha);
            $stmt->execute();
            $trilha = $stmt->get_result()->fetch_assoc();

            if (!$trilha) {
                echo json_encode(['success' => false, 'error' => 'Trilha não encontrada']);
                exit;
            }

            $stmt = $conn->prepare("
                SELECT 
                    COUNT(*) AS total_cursos,
                    COALESCE(SUM(duracao), 0) AS total_duracao
                FROM cursos
                WHERE id_trilha = ?
                AND status = 1
            ");
            $stmt->bind_param("i", $id_trilha);
            $stmt->execute();
            $infoCursos = $stmt->get_result()->fetch_assoc();

            $stmt = $conn->prepare("
                SELECT id_meu_interesse
                FROM meusInteresses
                WHERE id_user = ?
                AND id_trilha = ?
                LIMIT 1
            ");
            $stmt->bind_param("ii", $user_id, $id_trilha);
            $stmt->execute();
            $favorito = $stmt->get_result()->num_rows > 0 ? 1 : 0;

            $stmt = $conn->prepare("
                SELECT 
                    id_progresso,
                    id_user,
                    id_trilha,
                    data_inicio,
                    data_conclusao,
                    status
                FROM progresso_trilha
                WHERE id_user = ?
                AND id_trilha = ?
                LIMIT 1
            ");
            $stmt->bind_param("ii", $user_id, $id_trilha);
            $stmt->execute();
            $progresso = $stmt->get_result()->fetch_assoc();

            $stmt = $conn->prepare("
                SELECT 
                    c.id_curso,
                    c.id_trilha,
                    c.nome,
                    c.descricao,
                    c.duracao,
                    c.ordem,
                    c.status,
                    COALESCE(pc.status, 0) AS progresso_status
                FROM cursos c
                LEFT JOIN progresso_cursos pc 
                    ON pc.id_curso = c.id_curso 
                    AND pc.id_user = ?
                WHERE c.id_trilha = ?
                AND c.status = 1
                ORDER BY c.ordem ASC, c.id_curso ASC
            ");
            $stmt->bind_param("ii", $user_id, $id_trilha);
            $stmt->execute();
            $cursos = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            echo json_encode([
                'success' => true,
                'trilha' => $trilha,
                'total_cursos' => (int) $infoCursos['total_cursos'],
                'total_duracao' => (int) $infoCursos['total_duracao'],
                'favorito' => $favorito,
                'progresso' => $progresso ?: null,
                'cursos' => $cursos
            ]);

        break;

        case 'toggle_favorito':

            $id_trilha = (int) ($_POST['id_trilha'] ?? 0);

            if ($id_trilha <= 0) {
                echo json_encode(['success' => false, 'error' => 'Trilha inválida']);
                exit;
            }

            $stmt = $conn->prepare("
                SELECT id_meu_interesse
                FROM meusInteresses
                WHERE id_user = ?
                AND id_trilha = ?
                LIMIT 1
            ");
            $stmt->bind_param("ii", $user_id, $id_trilha);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {

                $stmt = $conn->prepare("
                    DELETE FROM meusInteresses
                    WHERE id_user = ?
                    AND id_trilha = ?
                ");
                $stmt->bind_param("ii", $user_id, $id_trilha);
                $stmt->execute();

                echo json_encode(['success' => true, 'favorito' => 0]);

            } else {

                $stmt = $conn->prepare("
                    INSERT INTO meusInteresses (id_user, id_trilha)
                    VALUES (?, ?)
                ");
                $stmt->bind_param("ii", $user_id, $id_trilha);
                $stmt->execute();

                echo json_encode(['success' => true, 'favorito' => 1]);
            }

        break;

        case 'matricular':

            $id_trilha = (int) ($_POST['id_trilha'] ?? 0);

            if ($id_trilha <= 0) {
                echo json_encode(['success' => false, 'error' => 'Trilha inválida']);
                exit;
            }

            $stmt = $conn->prepare("
                SELECT id_trilha
                FROM trilha
                WHERE id_trilha = ?
                AND status = 1
                LIMIT 1
            ");
            $stmt->bind_param("i", $id_trilha);
            $stmt->execute();

            if ($stmt->get_result()->num_rows === 0) {
                echo json_encode(['success' => false, 'error' => 'Trilha não encontrada']);
                exit;
            }

            $stmt = $conn->prepare("
                SELECT 
                    id_progresso,
                    id_user,
                    id_trilha,
                    data_inicio,
                    data_conclusao,
                    status
                FROM progresso_trilha
                WHERE id_user = ?
                AND id_trilha = ?
                LIMIT 1
            ");
            $stmt->bind_param("ii", $user_id, $id_trilha);
            $stmt->execute();
            $progressoExistente = $stmt->get_result()->fetch_assoc();

            if ($progressoExistente) {
                echo json_encode([
                    'success' => true,
                    'progresso' => $progressoExistente
                ]);
                exit;
            }

            $status = 0;

            $stmt = $conn->prepare("
                INSERT INTO progresso_trilha (
                    id_user,
                    id_trilha,
                    data_inicio,
                    data_conclusao,
                    status
                ) VALUES (
                    ?,
                    ?,
                    CURDATE(),
                    NULL,
                    ?
                )
            ");
            $stmt->bind_param("iii", $user_id, $id_trilha, $status);
            $stmt->execute();

            $id_progresso = $conn->insert_id;

            echo json_encode([
                'success' => true,
                'progresso' => [
                    'id_progresso' => $id_progresso,
                    'id_user' => $user_id,
                    'id_trilha' => $id_trilha,
                    'data_inicio' => date('Y-m-d'),
                    'data_conclusao' => null,
                    'status' => 0
                ]
            ]);

        break;

        case 'acessar_curso':

            $id_curso = (int) ($_POST['id_curso'] ?? 0);

            if ($id_curso <= 0) {
                echo json_encode(['success' => false, 'error' => 'Curso inválido']);
                exit;
            }

            $stmt = $conn->prepare("
                SELECT 
                    id_curso,
                    id_trilha
                FROM cursos
                WHERE id_curso = ?
                AND status = 1
                LIMIT 1
            ");
            $stmt->bind_param("i", $id_curso);
            $stmt->execute();

            $curso = $stmt->get_result()->fetch_assoc();

            if (!$curso) {
                echo json_encode(['success' => false, 'error' => 'Curso não encontrado ou inativo']);
                exit;
            }

            $id_trilha = (int) $curso['id_trilha'];

            $stmt = $conn->prepare("
                SELECT id_progresso
                FROM progresso_cursos
                WHERE id_user = ?
                AND id_curso = ?
                LIMIT 1
            ");
            $stmt->bind_param("ii", $user_id, $id_curso);
            $stmt->execute();
            $progressoCurso = $stmt->get_result()->fetch_assoc();

            if (!$progressoCurso) {

                $status = 1;

                $stmt = $conn->prepare("
                    INSERT INTO progresso_cursos (
                        id_user,
                        id_curso,
                        data_inicio,
                        data_conclusao,
                        status
                    ) VALUES (
                        ?,
                        ?,
                        CURDATE(),
                        NULL,
                        ?
                    )
                ");
                $stmt->bind_param("iii", $user_id, $id_curso, $status);
                $stmt->execute();
            }

            $stmt = $conn->prepare("
                SELECT 
                    id_progresso,
                    status
                FROM progresso_trilha
                WHERE id_user = ?
                AND id_trilha = ?
                LIMIT 1
            ");
            $stmt->bind_param("ii", $user_id, $id_trilha);
            $stmt->execute();

            $progressoTrilha = $stmt->get_result()->fetch_assoc();

            if ($progressoTrilha && (int)$progressoTrilha['status'] === 0) {

                $novoStatus = 1;

                $stmt = $conn->prepare("
                    UPDATE progresso_trilha
                    SET status = ?
                    WHERE id_progresso = ?
                ");
                $stmt->bind_param(
                    "ii",
                    $novoStatus,
                    $progressoTrilha['id_progresso']
                );
                $stmt->execute();
            }

            echo json_encode([
                'success' => true,
                'id_curso' => $id_curso
            ]);

        break;

        default:
            echo json_encode(['success' => false, 'error' => 'Ação inválida']);
        break;
    }

    $conn->close();

} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

ob_end_flush();
?>