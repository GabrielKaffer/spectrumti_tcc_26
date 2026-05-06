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
    $nome_usuario = $sessao['user']['nome'] ?? '';

    switch ($action) {

        case 'detalhe':

            $id_curso = (int) ($_GET['id_curso'] ?? 0);

            if ($id_curso <= 0) {
                echo json_encode(['success' => false, 'error' => 'Curso inválido']);
                exit;
            }

            $stmt = $conn->prepare("
                SELECT 
                    c.id_curso,
                    c.id_trilha,
                    c.nome,
                    c.descricao,
                    c.aula_texto,
                    c.aula_video,
                    c.duracao,
                    c.ordem,
                    c.nivel,
                    c.data_criacao,
                    c.status,
                    c.updated_at
                FROM cursos c
                WHERE c.id_curso = ?
                AND c.status = 1
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
                SELECT 
                    id_trilha,
                    nome,
                    descricao,
                    status
                FROM trilha
                WHERE id_trilha = ?
                AND status = 1
                LIMIT 1
            ");
            $stmt->bind_param("i", $id_trilha);
            $stmt->execute();
            $trilha = $stmt->get_result()->fetch_assoc();

            if (!$trilha) {
                echo json_encode(['success' => false, 'error' => 'Trilha não encontrada ou inativa']);
                exit;
            }

            $stmt = $conn->prepare("
                SELECT id_progresso, status
                FROM progresso_cursos
                WHERE id_user = ?
                AND id_curso = ?
                LIMIT 1
            ");
            $stmt->bind_param("ii", $user_id, $id_curso);
            $stmt->execute();
            $progressoCurso = $stmt->get_result()->fetch_assoc();

            if (!$progressoCurso) {
                $statusCurso = 1;

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
                $stmt->bind_param("iii", $user_id, $id_curso, $statusCurso);
                $stmt->execute();
            }

            $stmt = $conn->prepare("
                SELECT id_progresso, status
                FROM progresso_trilha
                WHERE id_user = ?
                AND id_trilha = ?
                LIMIT 1
            ");
            $stmt->bind_param("ii", $user_id, $id_trilha);
            $stmt->execute();
            $progressoTrilha = $stmt->get_result()->fetch_assoc();

            if (!$progressoTrilha) {
                $statusTrilha = 1;

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
                $stmt->bind_param("iii", $user_id, $id_trilha, $statusTrilha);
                $stmt->execute();

            } elseif ((int) $progressoTrilha['status'] === 0) {
                $statusTrilha = 1;

                $stmt = $conn->prepare("
                    UPDATE progresso_trilha
                    SET status = ?
                    WHERE id_progresso = ?
                ");
                $stmt->bind_param("ii", $statusTrilha, $progressoTrilha['id_progresso']);
                $stmt->execute();
            }

            echo json_encode([
                'success' => true,
                'curso' => $curso,
                'trilha' => $trilha
            ]);

        break;

        case 'concluir':

            $id_curso = (int) ($_POST['id_curso'] ?? 0);

            if ($id_curso <= 0) {
                echo json_encode(['success' => false, 'error' => 'Curso inválido']);
                exit;
            }

            $stmt = $conn->prepare("
                SELECT 
                    c.id_curso,
                    c.id_trilha,
                    c.nome,
                    c.ordem
                FROM cursos c
                WHERE c.id_curso = ?
                AND c.status = 1
                LIMIT 1
            ");
            $stmt->bind_param("i", $id_curso);
            $stmt->execute();
            $cursoAtual = $stmt->get_result()->fetch_assoc();

            if (!$cursoAtual) {
                echo json_encode(['success' => false, 'error' => 'Curso não encontrado ou inativo']);
                exit;
            }

            $id_trilha = (int) $cursoAtual['id_trilha'];
            $statusConcluido = 2;

            $stmt = $conn->prepare("
                SELECT id_progresso, status
                FROM progresso_cursos
                WHERE id_user = ?
                AND id_curso = ?
                LIMIT 1
            ");
            $stmt->bind_param("ii", $user_id, $id_curso);
            $stmt->execute();
            $progressoCursoAtual = $stmt->get_result()->fetch_assoc();

            $cursoJaConcluido = (
                $progressoCursoAtual &&
                (int) $progressoCursoAtual['status'] === 2
            );

            if (!$cursoJaConcluido) {
                if ($progressoCursoAtual) {
                    $stmt = $conn->prepare("
                        UPDATE progresso_cursos
                        SET status = ?, data_conclusao = CURDATE()
                        WHERE id_user = ?
                        AND id_curso = ?
                    ");
                    $stmt->bind_param("iii", $statusConcluido, $user_id, $id_curso);
                    $stmt->execute();
                } else {
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
                            CURDATE(),
                            ?
                        )
                    ");
                    $stmt->bind_param("iii", $user_id, $id_curso, $statusConcluido);
                    $stmt->execute();
                }
            }

            $stmt = $conn->prepare("
                SELECT 
                    c.id_curso,
                    c.id_trilha,
                    c.nome,
                    c.descricao,
                    c.ordem,
                    COALESCE(pc.status, 0) AS progresso_status
                FROM cursos c
                LEFT JOIN progresso_cursos pc
                    ON pc.id_curso = c.id_curso
                    AND pc.id_user = ?
                WHERE c.id_trilha = ?
                AND c.status = 1
                AND c.id_curso <> ?
                AND (
                    pc.id_progresso IS NULL
                    OR pc.status <> 2
                )
                ORDER BY c.ordem ASC, c.id_curso ASC
                LIMIT 1
            ");
            $stmt->bind_param("iii", $user_id, $id_trilha, $id_curso);
            $stmt->execute();
            $proximoCurso = $stmt->get_result()->fetch_assoc();

            if ($proximoCurso) {
                $idProximoCurso = (int) $proximoCurso['id_curso'];

                $stmt = $conn->prepare("
                    SELECT id_progresso
                    FROM progresso_cursos
                    WHERE id_user = ?
                    AND id_curso = ?
                    LIMIT 1
                ");
                $stmt->bind_param("ii", $user_id, $idProximoCurso);
                $stmt->execute();
                $progressoProximo = $stmt->get_result()->fetch_assoc();

                if (!$progressoProximo) {
                    $statusEmAndamento = 1;

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
                    $stmt->bind_param("iii", $user_id, $idProximoCurso, $statusEmAndamento);
                    $stmt->execute();
                }

                $stmt = $conn->prepare("
                    UPDATE progresso_trilha
                    SET status = 1
                    WHERE id_user = ?
                    AND id_trilha = ?
                    AND status = 0
                ");
                $stmt->bind_param("ii", $user_id, $id_trilha);
                $stmt->execute();

                echo json_encode([
                    'success' => true,
                    'trilha_concluida' => false,
                    'proximo_curso' => $proximoCurso
                ]);
                exit;
            }

            if ($cursoJaConcluido) {
                $stmt = $conn->prepare("
                    UPDATE progresso_trilha
                    SET status = 2, data_conclusao = CURDATE()
                    WHERE id_user = ?
                    AND id_trilha = ?
                ");
                $stmt->bind_param("ii", $user_id, $id_trilha);
                $stmt->execute();

                echo json_encode([
                    'success' => true,
                    'retornar_trilha' => true,
                    'id_trilha' => $id_trilha
                ]);
                exit;
            }

            $stmt = $conn->prepare("
                SELECT 
                    id_certificado,
                    id_user,
                    nome_usuario,
                    id_trilha,
                    nome_trilha,
                    duracao,
                    data_conclusao,
                    created_at
                FROM certificados
                WHERE id_user = ?
                AND id_trilha = ?
                LIMIT 1
            ");
            $stmt->bind_param("ii", $user_id, $id_trilha);
            $stmt->execute();
            $certificadoExistente = $stmt->get_result()->fetch_assoc();

            

            $stmt = $conn->prepare("
                SELECT 
                    id_trilha,
                    nome
                FROM trilha
                WHERE id_trilha = ?
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
                SELECT COALESCE(SUM(duracao), 0) AS duracao_total
                FROM cursos
                WHERE id_trilha = ?
                AND status = 1
            ");
            $stmt->bind_param("i", $id_trilha);
            $stmt->execute();
            $duracaoInfo = $stmt->get_result()->fetch_assoc();
            $duracaoTotal = (int) $duracaoInfo['duracao_total'];

            $stmt = $conn->prepare("
                INSERT INTO certificados (
                    id_user,
                    nome_usuario,
                    id_trilha,
                    nome_trilha,
                    duracao,
                    data_conclusao
                ) VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    CURDATE()
                )
            ");
            $stmt->bind_param(
                "isisi",
                $user_id,
                $nome_usuario,
                $id_trilha,
                $trilha['nome'],
                $duracaoTotal
            );
            $stmt->execute();

            $idCertificado = $conn->insert_id;

            $stmt = $conn->prepare("
                SELECT 
                    id_certificado,
                    id_user,
                    nome_usuario,
                    id_trilha,
                    nome_trilha,
                    duracao,
                    data_conclusao,
                    created_at
                FROM certificados
                WHERE id_certificado = ?
                LIMIT 1
            ");
            $stmt->bind_param("i", $idCertificado);
            $stmt->execute();
            $certificado = $stmt->get_result()->fetch_assoc();

            $stmt = $conn->prepare("
                SELECT id_progresso
                FROM progresso_trilha
                WHERE id_user = ?
                AND id_trilha = ?
                LIMIT 1
            ");
            $stmt->bind_param("ii", $user_id, $id_trilha);
            $stmt->execute();
            $progressoTrilha = $stmt->get_result()->fetch_assoc();

            if ($progressoTrilha) {
                $stmt = $conn->prepare("
                    UPDATE progresso_trilha
                    SET status = 2, data_conclusao = CURDATE()
                    WHERE id_user = ?
                    AND id_trilha = ?
                ");
                $stmt->bind_param("ii", $user_id, $id_trilha);
                $stmt->execute();
            } else {
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
                        CURDATE(),
                        2
                    )
                ");
                $stmt->bind_param("ii", $user_id, $id_trilha);
                $stmt->execute();
            }

            echo json_encode([
                'success' => true,
                'trilha_concluida' => true,
                'certificado' => $certificado
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